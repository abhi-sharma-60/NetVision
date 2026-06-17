from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
