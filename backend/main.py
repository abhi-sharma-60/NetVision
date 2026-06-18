import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from analytics import analytics_engine
import os

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

class AlertData(BaseModel):
    type: str
    severity: str
    src_ip: str
    message: str

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
    await sio.emit('threat_alert', alert.model_dump())
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

@fastapi_app.get("/")
async def root():
    return {"message": "Welcome to NetVision AI API"}

@fastapi_app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "NetVision API"}

# 5. Wrap FastAPI app with Socket.IO ASGIApp
# This intercepts all /socket.io/ traffic automatically
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
