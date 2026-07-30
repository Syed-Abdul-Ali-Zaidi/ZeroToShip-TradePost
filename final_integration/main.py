from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers from Phase 2
from phase2.routers.auth import router as auth_router
from phase2.routers.posts import router as posts_router
from phase2.routers.offers import router as offers_router

app = FastAPI(
    title="ZeroToShip / TradePost API",
    description="Core backend integration for the peer-to-peer barter platform.",
    version="2.0.0"
)

# Standard CORS setup for seamless frontend-to-backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local hackathon testing
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Registering the Phase 2 routers
app.include_router(auth_router)
app.include_router(posts_router)
app.include_router(offers_router)

@app.get("/", tags=["Health Check"])
def root():
    """Simple health check to verify the server is live."""
    return {
        "status": "online",
        "message": "Welcome to the TradePost API! Navigate to /docs to test the endpoints.",
        "phase": 2
    }