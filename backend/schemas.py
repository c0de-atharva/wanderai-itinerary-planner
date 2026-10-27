"""
WanderAI — Pydantic v2 schemas for request and response models.
"""

from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class TripRequest(BaseModel):
    """Payload sent by the client to generate a full trip itinerary."""

    destination: str = Field(..., description="City or region to travel to")
    start_date: str = Field(..., description="ISO date string, e.g. '2025-03-01'")
    end_date: str = Field(..., description="ISO date string, e.g. '2025-03-07'")
    traveler_type: Literal["solo", "couple", "family", "friends"] = Field(
        ..., description="Type of traveler group"
    )
    group_size: int = Field(default=1, ge=1, description="Number of people travelling")
    budget_tier: Literal["economy", "moderate", "luxury"] = Field(
        ..., description="General budget level"
    )
    budget_cap: Optional[float] = Field(
        default=None, description="Optional hard budget ceiling in the chosen currency"
    )
    currency: Literal["USD", "INR"] = Field(
        default="USD", description="Currency for all cost figures"
    )
    pacing: Literal["relaxed", "balanced", "fast"] = Field(
        ..., description="Desired activity density per day"
    )
    interests: list[str] = Field(
        default_factory=list, description="List of interest tags, e.g. ['Food & Culinary', 'History & Culture']"
    )


class RegenerateDayRequest(BaseModel):
    """Payload to regenerate a single day within an existing (or hypothetical) itinerary."""

    trip_id: Optional[str] = Field(
        default=None, description="ID of the saved trip, if available"
    )
    destination: str = Field(..., description="Original destination")
    day_number: int = Field(..., ge=1, description="Which day to regenerate (1-indexed)")
    day_theme: str = Field(..., description="Desired theme for the regenerated day")
    trip_context: dict = Field(
        default_factory=dict,
        description="Original TripRequest fields forwarded for context"
    )


# ---------------------------------------------------------------------------
# Response sub-schemas
# ---------------------------------------------------------------------------

class ActivityItem(BaseModel):
    """A single activity within a day's schedule."""

    id: str = Field(..., description="Unique identifier for this activity")
    time_slot: Literal["Morning", "Afternoon", "Evening"] = Field(
        ..., description="Part of the day this activity occurs"
    )
    start_time: str = Field(..., description="Human-readable start time, e.g. '09:00 AM'")
    title: str = Field(..., description="Short activity title")
    category: Literal["Attraction", "Dining", "Transit", "Accommodation", "Free Time"] = Field(
        ..., description="Activity category"
    )
    description: str = Field(..., description="Rich description of the activity")
    location: str = Field(..., description="Venue or area name")
    estimated_cost: float = Field(..., description="Total cost for the group")
    transit_tip: Optional[str] = Field(
        default=None, description="How to reach the next location"
    )
    cost_per_person: Optional[float] = Field(
        default=None, description="Cost per person (estimated_cost / group_size)"
    )


class DayItinerary(BaseModel):
    """All activities for a single travel day."""

    day_number: int
    theme: str = Field(..., description="Descriptive theme for the day")
    daily_cost_estimate: float = Field(..., description="Sum of activity costs for the day")
    activities: list[ActivityItem]


class RecommendedStay(BaseModel):
    """A suggested accommodation option."""

    name: str
    tier: Literal["economy", "moderate", "luxury"]
    price_per_night: float
    neighborhood: str
    highlight: str = Field(..., description="One-line unique selling point")


class CostBreakdown(BaseModel):
    """High-level cost breakdown across trip categories."""

    accommodation: float
    dining: float
    activities: float
    transportation: float


class ItineraryResponse(BaseModel):
    """Complete itinerary returned by the AI or mock engine."""

    trip_title: str
    destination: str
    summary: str = Field(..., description="2-3 sentence trip overview")
    currency: str
    total_estimated_cost: float
    cost_per_person: float
    cost_breakdown: CostBreakdown
    recommended_stays: list[RecommendedStay]
    days: list[DayItinerary]
    packing_and_logistics_tips: list[str]


# ---------------------------------------------------------------------------
# Save / retrieve trip schemas
# ---------------------------------------------------------------------------

class SaveTripRequest(BaseModel):
    """Request body to persist a generated itinerary."""

    trip_data: dict = Field(..., description="Full ItineraryResponse dict")
    user_id: Optional[str] = Field(default=None, description="Optional authenticated user ID")


class SaveTripResponse(BaseModel):
    """Confirmation returned after saving a trip."""

    trip_id: str
    message: str
    saved_at: str
