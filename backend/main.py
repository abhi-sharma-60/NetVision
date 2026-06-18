import socketio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from analytics import analytics_engine
import os
import json
import asyncio
import time
from threat_intel import threat_intel
from copilot import copilot_engine

# 1. Create the FastAPI app
fastapi_app = FastAPI(
    title="NetVision AI API",
    description="Backend API for the Intelligent Network Monitoring & Threat Detection Platform",
    version="1.0.0"
)

# Configure CORS
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PacketData(BaseModel):
    timestamp: float
    src_ip: str
    dst_ip: str
    protocol: str
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    size: int
    info: str
    src_geo: Optional[dict] = None
    dst_geo: Optional[dict] = None

class AlertData(BaseModel):
    type: str
    severity: str
    src_ip: str
    message: str

# Keep a running window of recent alerts for AI Copilot context
recent_alerts = []

# 2. Create the Socket.IO AsyncServer
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# 3. Create the Socket.IO Event Handlers
@sio.on('connect')
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.on('disconnect')
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

# 4. FastAPI Routes
@fastapi_app.post("/api/alert")
async def receive_alert(alert: AlertData):
    """Broadcasts a high-priority threat alert to connected clients"""
    
    # Store for Copilot context
    recent_alerts.insert(0, alert.model_dump())
    if len(recent_alerts) > 50:
        recent_alerts.pop()
        
    await sio.emit('threat_alert', alert.model_dump())
    
    # Asynchronously gather threat intel for the source IP
    if alert.src_ip:
        asyncio.create_task(enrich_alert_with_intel(alert.src_ip))
        
    return {"status": "ok"}

@fastapi_app.post("/api/ingest")
async def ingest_packet(packet: PacketData):
    """Ingests a packet from the sniffer and broadcasts it via Socket.IO"""
    # Broadcast directly to all clients
    await sio.emit('live_packet', packet.model_dump())
    return {"status": "ok"}

@fastapi_app.get("/analytics/overview")
async def get_analytics_overview():
    """Returns real-time aggregated network traffic metrics."""
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    SUMMARY_FILE = os.path.join(BASE_DIR, "logs", "analytics_summary.json")
    return analytics_engine.load_summary(SUMMARY_FILE)

@fastapi_app.get("/api/devices")
async def get_network_devices():
    """Returns devices discovered via Scapy ARP sweep and DPI fingerprinting."""
    try:
        scanned_file = os.path.join(os.path.dirname(__file__), "logs", "scanned_devices.json")
        if os.path.exists(scanned_file):
            with open(scanned_file, "r") as f:
                devices = json.load(f)
                
                # Apply dynamic heuristics for any devices that DPI hasn't fingerprinted yet
                for d in devices:
                    ip = d.get('ip', '')
                    name = d.get('name', '?')
                    
                    if name == '?' or name == 'Unknown Host' or name == 'Unknown Device':
                        if ip.endswith('.1'):
                            d['name'] = "Router / Gateway"
                        else:
                            d['name'] = f"Host ({ip})"
                            
                return devices
        return []
    except Exception as e:
        print(f"Device read error: {e}")
        return []

@fastapi_app.get("/api/devices/rescan")
async def force_rescan_devices():
    """Forces sniffer.py to run an immediate scan via file trigger, then returns results."""
    try:
        trigger_file = "/tmp/netvision_force_scan.trigger"
        with open(trigger_file, "w") as f:
            f.write(str(time.time()))
            
        # Give Scapy 1.8 seconds to complete its timeout sweep
        await asyncio.sleep(1.8)
        return await get_network_devices()
    except Exception as e:
        print(f"Rescan trigger error: {e}")
        return []

class SimulationRequest(BaseModel):
    attack_type: str

@fastapi_app.post("/api/simulate")
async def simulate_attack(req: SimulationRequest):
    try:
        with open("/tmp/netvision_simulate.trigger", "w") as f:
            f.write(req.attack_type)
        return {"status": "Simulation triggered"}
    except Exception as e:
        return {"error": str(e)}

class CopilotRequest(BaseModel):
    query: str

@fastapi_app.post("/api/copilot/ask")
async def ask_copilot(req: CopilotRequest):
    try:
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        SUMMARY_FILE = os.path.join(BASE_DIR, "logs", "analytics_summary.json")
        current_analytics = analytics_engine.load_summary(SUMMARY_FILE)
        
        context = {
            "traffic_analytics": current_analytics,
            "recent_alerts": recent_alerts
        }
        
        loop = asyncio.get_event_loop()
        answer = await loop.run_in_executor(None, copilot_engine.ask, req.query, context)
        
        return {"answer": answer}
    except Exception as e:
        return {"error": str(e)}

@fastapi_app.get("/")
async def root():
    return {"message": "Welcome to NetVision AI API"}

@fastapi_app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "NetVision API"}

# 5. Wrap FastAPI app with Socket.IO ASGIApp
# This intercepts all /socket.io/ traffic automatically
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
