"""
WanderAI — FastAPI application entry point.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import TripRequest, RegenerateDayRequest, SaveTripRequest
from ai_service import generate_itinerary, regenerate_day, is_valid_api_key
from database import save_trip, get_trips, delete_trip, get_supabase_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown hooks."""
    key = os.getenv("GEMINI_API_KEY")
    db = get_supabase_client()
    logger.info("🌍 WanderAI Backend starting…")
    logger.info(
        "   AI mode     : %s", "live (Gemini)" if is_valid_api_key(key) else "demo (mock engine)"
    )
    logger.info(
        "   Storage mode: %s", "Supabase" if db else "in-memory"
    )
    yield
    logger.info("👋 WanderAI Backend shutting down…")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="WanderAI API",
    description="Personalised AI-powered travel itinerary planner backend.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

_origins_str = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
_allowed_origins = [o.strip() for o in _origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Root / health
# ---------------------------------------------------------------------------

@app.get("/", tags=["Meta"])
def root():
    """Quick liveness check."""
    return {"status": "ok", "service": "WanderAI API", "version": "1.0.0"}


@app.get("/api/health", tags=["Meta"])
def health():
    """
    Detailed health check.

    Returns the current operational mode (live vs demo) and which backing
    services are reachable.
    """
    key = os.getenv("GEMINI_API_KEY")
    db_client = get_supabase_client()
    return {
        "status": "healthy",
        "mode": "live" if is_valid_api_key(key) else "demo",
        "gemini_configured": is_valid_api_key(key),
        "supabase_configured": db_client is not None,
        "storage_mode": "supabase" if db_client else "memory",
    }


# ---------------------------------------------------------------------------
# Itinerary endpoints
# ---------------------------------------------------------------------------

@app.post("/api/itinerary/generate", tags=["Itinerary"])
async def generate(request: TripRequest):
    """
    Generate a full multi-day travel itinerary.

    Uses Gemini when configured; falls back to the mock engine automatically.
    """
    try:
        result = await generate_itinerary(request.model_dump())
        return result
    except Exception as exc:
        logger.exception("Error generating itinerary: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/itinerary/regenerate-day", tags=["Itinerary"])
async def regen_day(request: RegenerateDayRequest):
    """
    Regenerate a single day within an existing itinerary.

    Accepts the original trip context for continuity and returns a freshly
    generated DayItinerary object.
    """
    try:
        result = await regenerate_day(request.model_dump())
        return result
    except Exception as exc:
        logger.exception("Error regenerating day: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Trip persistence endpoints
# ---------------------------------------------------------------------------

@app.post("/api/trips/save", tags=["Trips"])
async def save(request: SaveTripRequest):
    """Save a generated itinerary for later retrieval."""
    try:
        return save_trip(request.trip_data, request.user_id)
    except Exception as exc:
        logger.exception("Error saving trip: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/trips", tags=["Trips"])
async def list_trips(user_id: Optional[str] = None):
    """
    List saved trips.

    Pass `?user_id=<uid>` to filter by owner; omit for all trips (admin/demo).
    """
    try:
        return {"trips": get_trips(user_id)}
    except Exception as exc:
        logger.exception("Error listing trips: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/api/trips/{trip_id}", tags=["Trips"])
async def remove_trip(trip_id: str):
    """Delete a saved trip by its ID."""
    try:
        delete_trip(trip_id)
        return {"message": "Trip deleted successfully"}
    except Exception as exc:
        logger.exception("Error deleting trip %s: %s", trip_id, exc)
        raise HTTPException(status_code=500, detail=str(exc))
