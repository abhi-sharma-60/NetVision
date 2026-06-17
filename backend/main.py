from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from analytics import analytics_engine

app = FastAPI(
    title="NetVision AI API",
    description="Backend API for the Intelligent Network Monitoring & Threat Detection Platform",
    version="1.0.0"
)

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to NetVision AI API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "NetVision API"}

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SUMMARY_FILE = os.path.join(BASE_DIR, "logs", "analytics_summary.json")

@app.get("/analytics/overview")
async def get_analytics_overview():
    """Returns real-time aggregated network traffic metrics."""
    return analytics_engine.load_summary(SUMMARY_FILE)
