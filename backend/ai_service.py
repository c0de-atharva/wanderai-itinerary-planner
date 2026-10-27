"""
WanderAI — Core AI service.

Attempts to call Google Gemini (gemini-2.0-flash) to generate itinerary data.
Falls back to the rich mock engine transparently when:
  - GEMINI_API_KEY is absent or is a placeholder value, or
  - The Gemini API call raises any exception, or
  - The returned content cannot be parsed as valid JSON.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime

from mock_engine import generate_mock_itinerary, generate_mock_day

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# API key validation
# ---------------------------------------------------------------------------

def is_valid_api_key(key: str | None) -> bool:
    """Return True only if *key* looks like a real Gemini API key."""
    return bool(
        key
        and "your_" not in key.lower()
        and "here" not in key.lower()
        and len(key) > 20
    )


# ---------------------------------------------------------------------------
# Lazy Gemini client
# ---------------------------------------------------------------------------

_client = None  # lazy-initialised


def get_client():
    """Return a cached google.genai.Client or None if the key is invalid."""
    global _client
    if _client is None:
        key = os.getenv("GEMINI_API_KEY")
        if is_valid_api_key(key):
            try:
                from google import genai  # type: ignore
                _client = genai.Client(api_key=key)
            except Exception as exc:  # pragma: no cover
                logger.warning("Failed to initialise Gemini client: %s", exc)
    return _client


# ---------------------------------------------------------------------------
# Schema reference for the system prompt
# ---------------------------------------------------------------------------

_SCHEMA_EXAMPLE = json.dumps(
    {
        "trip_title": "string",
        "destination": "string",
        "summary": "string",
        "currency": "USD | INR",
        "total_estimated_cost": 0.0,
        "cost_per_person": 0.0,
        "cost_breakdown": {
            "accommodation": 0.0,
            "dining": 0.0,
            "activities": 0.0,
            "transportation": 0.0,
        },
        "recommended_stays": [
            {
                "name": "string",
                "tier": "economy | moderate | luxury",
                "price_per_night": 0.0,
                "neighborhood": "string",
                "highlight": "string",
            }
        ],
        "days": [
            {
                "day_number": 1,
                "theme": "string",
                "daily_cost_estimate": 0.0,
                "activities": [
                    {
                        "id": "uuid-string",
                        "time_slot": "Morning | Afternoon | Evening",
                        "start_time": "09:00 AM",
                        "title": "string",
                        "category": "Attraction | Dining | Transit | Accommodation | Free Time",
                        "description": "string",
                        "location": "string",
                        "estimated_cost": 0.0,
                        "transit_tip": "string or null",
                        "cost_per_person": 0.0,
                    }
                ],
            }
        ],
        "packing_and_logistics_tips": ["string"],
    },
    indent=2,
)


def _compute_num_days(start_date: str, end_date: str) -> int:
    """Return the number of travel days between two ISO date strings."""
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        delta = (end - start).days
        return max(1, delta)
    except Exception:
        return 5


def _build_system_prompt(request_data: dict, num_days: int) -> str:
    """Construct the system prompt string for Gemini."""
    destination = request_data.get("destination", "")
    start_date = request_data.get("start_date", "")
    end_date = request_data.get("end_date", "")
    traveler_type = request_data.get("traveler_type", "solo")
    group_size = request_data.get("group_size", 1)
    budget_tier = request_data.get("budget_tier", "moderate")
    budget_cap = request_data.get("budget_cap")
    currency = request_data.get("currency", "USD")
    pacing = request_data.get("pacing", "balanced")
    interests = request_data.get("interests", [])

    cap_str = f"{budget_cap} {currency}" if budget_cap else "no hard cap"
    interests_str = ", ".join(interests) if interests else "general sightseeing"

    return f"""You are WanderAI, an expert travel planner specialising in highly personalised, geographically optimised itineraries.

Generate a complete day-by-day travel itinerary for:
- Destination: {destination}
- Travel dates: {start_date} to {end_date} ({num_days} days)
- Traveller type: {traveler_type} ({group_size} people)
- Budget tier: {budget_tier} (cap: {cap_str})
- Pacing style: {pacing}
- Interests: {interests_str}

CRITICAL RULES:
1. GEOGRAPHICAL CLUSTERING: Group nearby attractions on the same day to minimise transit time.
2. BUDGET ADHERENCE: Keep total cost strictly within the budget cap if provided.
3. PACING: Relaxed = 2-3 activities/day, Balanced = 3-4, Fast-paced = 5+.
4. Each day must have a unique, evocative theme (e.g., "Old Town Immersion", "Coastal Escape").
5. Include transit_tip for each activity describing how to reach the next location.
6. For groups of 2+, always include cost_per_person = estimated_cost / group_size.
7. Include exactly 3 accommodation recommendations scaled to the budget tier.
8. Add 5-8 practical packing_and_logistics_tips tailored to the destination and interests.
9. All monetary values must be in {currency}.
10. Each activity must have a unique UUID as its id field.

Return ONLY valid JSON matching this exact schema (no markdown fences, no explanation):
{_SCHEMA_EXAMPLE}"""


def _build_regen_prompt(request_data: dict) -> str:
    """Construct the prompt to regenerate a single day."""
    destination = request_data.get("destination", "")
    day_number = request_data.get("day_number", 1)
    day_theme = request_data.get("day_theme", "Cultural Discovery")
    ctx = request_data.get("trip_context", {})

    group_size = ctx.get("group_size", 1)
    budget_tier = ctx.get("budget_tier", "moderate")
    currency = ctx.get("currency", "USD")
    pacing = ctx.get("pacing", "balanced")
    interests = ctx.get("interests", [])
    interests_str = ", ".join(interests) if interests else "general sightseeing"

    day_schema = json.dumps(
        {
            "day_number": day_number,
            "theme": day_theme,
            "daily_cost_estimate": 0.0,
            "activities": [
                {
                    "id": "uuid-string",
                    "time_slot": "Morning | Afternoon | Evening",
                    "start_time": "09:00 AM",
                    "title": "string",
                    "category": "Attraction | Dining | Transit | Accommodation | Free Time",
                    "description": "string",
                    "location": "string",
                    "estimated_cost": 0.0,
                    "transit_tip": "string or null",
                    "cost_per_person": 0.0,
                }
            ],
        },
        indent=2,
    )

    return f"""You are WanderAI, an expert travel planner.

Regenerate ONLY Day {day_number} of a trip to {destination}.
- Theme for the day: {day_theme}
- Group: {group_size} people, {budget_tier} budget, {pacing} pacing
- Interests: {interests_str}
- Currency: {currency}

Rules:
- Relaxed = 2-3 activities, Balanced = 3-4, Fast-paced = 5+.
- Use unique UUIDs for each activity id.
- Include transit_tip between activities.
- All costs in {currency}.

Return ONLY valid JSON for a single day matching this schema (no markdown, no explanation):
{day_schema}"""


# ---------------------------------------------------------------------------
# Public async API
# ---------------------------------------------------------------------------

async def generate_itinerary(request_data: dict) -> dict:
    """
    Generate a complete travel itinerary.

    First tries the Gemini API; falls back to the mock engine on any failure.

    Parameters
    ----------
    request_data:
        Dict matching TripRequest schema fields.

    Returns
    -------
    dict
        ItineraryResponse-compatible dict.
    """
    num_days = _compute_num_days(
        request_data.get("start_date", ""),
        request_data.get("end_date", ""),
    )

    gemini = get_client()
    if gemini is None:
        logger.info("No valid Gemini key — using mock engine.")
        return generate_mock_itinerary(request_data)

    try:
        from google.genai import types  # type: ignore

        system_prompt = _build_system_prompt(request_data, num_days)
        response = gemini.models.generate_content(
            model="gemini-2.0-flash",
            contents=system_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.7,
                max_output_tokens=8192,
            ),
        )
        raw = response.text or ""
        # Strip accidental markdown fences
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1]
            raw = raw.rsplit("```", 1)[0]

        itinerary = json.loads(raw)
        return itinerary

    except Exception as exc:
        logger.warning("Gemini call failed (%s) — falling back to mock engine.", exc)
        return generate_mock_itinerary(request_data)


async def regenerate_day(request_data: dict) -> dict:
    """
    Regenerate a single day's itinerary.

    First tries the Gemini API; falls back to the mock engine on any failure.

    Parameters
    ----------
    request_data:
        Dict matching RegenerateDayRequest schema fields.

    Returns
    -------
    dict
        DayItinerary-compatible dict.
    """
    gemini = get_client()
    if gemini is None:
        logger.info("No valid Gemini key — using mock engine for day regeneration.")
        return generate_mock_day(request_data)

    try:
        from google.genai import types  # type: ignore

        prompt = _build_regen_prompt(request_data)
        response = gemini.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.8,
                max_output_tokens=4096,
            ),
        )
        raw = response.text or ""
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1]
            raw = raw.rsplit("```", 1)[0]

        day_data = json.loads(raw)
        return day_data

    except Exception as exc:
        logger.warning("Gemini day-regen failed (%s) — falling back to mock engine.", exc)
        return generate_mock_day(request_data)
