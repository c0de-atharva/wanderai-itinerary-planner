"""
WanderAI — Database layer.

Uses Supabase when SUPABASE_URL and SUPABASE_KEY are configured.
Falls back to an in-process dict store for demo / development mode so that
the application works without any external database.
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory fallback store
# ---------------------------------------------------------------------------

_memory_store: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Supabase client factory
# ---------------------------------------------------------------------------

def get_supabase_client():
    """
    Return an authenticated Supabase client, or None if credentials are
    missing / appear to be placeholder values.
    """
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_KEY", "")

    if not url or not key:
        return None
    if "your_" in url.lower() or "your_" in key.lower():
        return None

    try:
        from supabase import create_client  # type: ignore
        return create_client(url, key)
    except Exception as exc:
        logger.warning("Failed to create Supabase client: %s", exc)
        return None


# ---------------------------------------------------------------------------
# CRUD helpers
# ---------------------------------------------------------------------------

def save_trip(trip_data: dict, user_id: str | None = None) -> dict:
    """
    Persist a generated itinerary and return a confirmation payload.

    Parameters
    ----------
    trip_data:
        The full ItineraryResponse dict to store.
    user_id:
        Optional authenticated user identifier.

    Returns
    -------
    dict
        Keys: trip_id, message, saved_at.
    """
    trip_id = str(uuid.uuid4())
    saved_at = datetime.utcnow().isoformat()

    record = {
        "id": trip_id,
        "user_id": user_id,
        "trip_data": trip_data,
        "saved_at": saved_at,
        "destination": trip_data.get("destination", ""),
        "title": trip_data.get("trip_title", ""),
    }

    client = get_supabase_client()
    if client:
        try:
            client.table("trips").insert(record).execute()
        except Exception as exc:
            logger.warning("Supabase insert failed (%s) — using memory store.", exc)
            _memory_store[trip_id] = record
    else:
        _memory_store[trip_id] = record

    return {
        "trip_id": trip_id,
        "message": "Trip saved successfully",
        "saved_at": saved_at,
    }


def get_trips(user_id: str | None = None) -> list:
    """
    Retrieve saved trips, optionally filtered by user_id.

    Parameters
    ----------
    user_id:
        When provided, only trips belonging to this user are returned.

    Returns
    -------
    list
        List of trip record dicts, newest first.
    """
    client = get_supabase_client()
    if client:
        try:
            query = client.table("trips").select("*")
            if user_id:
                query = query.eq("user_id", user_id)
            result = query.order("saved_at", desc=True).execute()
            return result.data or []
        except Exception as exc:
            logger.warning("Supabase select failed (%s) — using memory store.", exc)

    # Fallback to in-memory store
    trips = list(_memory_store.values())
    if user_id:
        trips = [t for t in trips if t.get("user_id") == user_id]
    return sorted(trips, key=lambda x: x.get("saved_at", ""), reverse=True)


def delete_trip(trip_id: str) -> bool:
    """
    Delete a trip by its ID.

    Parameters
    ----------
    trip_id:
        UUID of the trip to remove.

    Returns
    -------
    bool
        Always True (errors are logged but not re-raised).
    """
    client = get_supabase_client()
    if client:
        try:
            client.table("trips").delete().eq("id", trip_id).execute()
            return True
        except Exception as exc:
            logger.warning("Supabase delete failed (%s) — removing from memory store.", exc)

    _memory_store.pop(trip_id, None)
    return True
