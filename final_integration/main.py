from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Phase 2 API routers (JSON)
from phase2.routers.auth import router as auth_router
from phase2.routers.posts import router as posts_router
from phase2.routers.offers import router as offers_router

# Phase 4 page router (HTML)
from phase4.frontend.views import router as views_router

app = FastAPI(
    title="ZeroToShip / TradePost",
    description="Core backend + frontend for the peer-to-peer barter platform.",
    version="4.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JSON API routes -> /api/posts, /api/offers, /auth/...
app.include_router(auth_router)
app.include_router(posts_router)
app.include_router(offers_router)

# HTML page routes -> /, /posts/, /offers/..., /accounts/...
# NOTE: moved the old JSON "root" health check to /api/health below,
# so this router can own "/" for the actual homepage.
app.include_router(views_router)

# Serve everything under phase4/static/ at /static/...
# Built from this file's own location so it works no matter which
# folder you happen to launch `main.py` from.
BASE_DIR = Path(__file__).resolve().parent.parent

app.mount("/static", StaticFiles(directory=BASE_DIR / "phase4" / "static"), name="static")
app.mount("/media", StaticFiles(directory=BASE_DIR / "media"), name="media")

@app.get("/api/health", tags=["Health Check"])
def health():
    """Simple health check to verify the server is live."""
    return {"status": "online", "phase": 4}