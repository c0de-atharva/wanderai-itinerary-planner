"""
WanderAI — Rich mock AI engine.

Generates a fully-populated ItineraryResponse-compatible dict for any
destination without requiring an external API key.  Used as the automatic
fallback when no valid GEMINI_API_KEY is present, or when the Gemini API
call fails for any reason.
"""

from __future__ import annotations

import uuid
import random
from datetime import datetime, timedelta
from typing import Any

# ---------------------------------------------------------------------------
# Cost multipliers per budget tier
# ---------------------------------------------------------------------------
ECONOMY_MULTIPLIER = 1.0
MODERATE_MULTIPLIER = 2.2
LUXURY_MULTIPLIER = 4.5

BASE_DAILY_COST_USD = {
    "economy": 50.0,
    "moderate": 150.0,
    "luxury": 400.0,
}

INR_RATE = 83.5  # approximate USD → INR conversion

# ---------------------------------------------------------------------------
# Activity library keyed by interest tag
# ---------------------------------------------------------------------------
ACTIVITIES_BY_INTEREST: dict[str, list[str]] = {
    "Food & Culinary": [
        "Street Food Walking Tour",
        "Local Market Visit",
        "Cooking Class",
        "Traditional Restaurant Dinner",
        "Farm-to-Table Lunch Experience",
    ],
    "History & Culture": [
        "Historical Museum Visit",
        "Heritage Walking Tour",
        "Ancient Monument Exploration",
        "Cultural Performance Evening",
        "Guided Old Quarter Walk",
    ],
    "Nature & Scenic": [
        "Scenic Viewpoint Hike",
        "Botanical Garden Stroll",
        "Sunrise Photography Spot",
        "Nature Reserve Walk",
        "Lakeside Picnic & Relaxation",
    ],
    "Adventure": [
        "Rock Climbing Session",
        "White-Water Rafting",
        "Zip-lining Experience",
        "Off-road Jeep Safari",
        "Paragliding Flight",
    ],
    "Nightlife": [
        "Rooftop Bar Crawl",
        "Live Music Venue",
        "Night Market Exploration",
        "Jazz Club Evening",
        "Sunset Cruise",
    ],
    "Shopping": [
        "Local Artisan Market",
        "High-Street Shopping",
        "Antique Bazaar Hunt",
        "Souvenir Shopping",
        "Designer Outlet Visit",
    ],
    "Offbeat/Hidden Gems": [
        "Secret Viewpoint Hike",
        "Underground Art Scene",
        "Locals-Only Café Morning",
        "Hidden Courtyard Discovery",
        "Street Mural Photography Walk",
    ],
    "Wellness & Spa": [
        "Traditional Spa Treatment",
        "Yoga Session at Sunrise",
        "Meditation Retreat Visit",
        "Hot Springs Soak",
        "Ayurvedic Massage",
    ],
    "Beach & Water": [
        "Beach Snorkelling",
        "Kayaking Tour",
        "Boat Island Hopping",
        "Sunset Beach Walk",
        "Scuba Diving Lesson",
    ],
    "Photography": [
        "Golden-Hour Photo Walk",
        "Drone Photography Spot",
        "Local Life Documentary Shoot",
        "Architectural Detail Tour",
        "Waterfall Photography Hike",
    ],
}

# Default activities used when no interests are specified
DEFAULT_ACTIVITIES = [
    "City Orientation Walk",
    "Local Café Breakfast",
    "Iconic Landmark Visit",
    "Local Restaurant Lunch",
    "Sunset Viewpoint Visit",
    "Traditional Dinner",
    "Evening Stroll",
]

# ---------------------------------------------------------------------------
# Day-theme pool
# ---------------------------------------------------------------------------
THEMES = [
    "Old Town Immersion",
    "Coastal Escape",
    "Cultural Deep Dive",
    "Culinary Journey",
    "Nature & Adventure",
    "Hidden Gems Discovery",
    "Art & Architecture",
    "Local Neighbourhood Life",
    "Panoramic Views & Highlights",
    "Market Day & Shopping",
    "Wellness & Relaxation",
    "Sunset & Nightlife",
    "Heritage Trail",
    "Food Markets & Street Eats",
    "Scenic Countryside Excursion",
]

# ---------------------------------------------------------------------------
# Hotel name templates per tier
# ---------------------------------------------------------------------------
HOTEL_NAMES: dict[str, list[str]] = {
    "economy": [
        "The Backpacker's Den",
        "City Stay Hostel",
        "Sunrise Guesthouse",
        "Budget Inn Central",
        "Traveller's Nest",
    ],
    "moderate": [
        "The Heritage Boutique Hotel",
        "Urban Comfort Suites",
        "Midtown Grand Hotel",
        "Garden View Hotel",
        "The Classic Stay",
    ],
    "luxury": [
        "The Grand Palace Hotel",
        "Five-Star Skyline Resort",
        "The Regal Collection",
        "Prestige Towers & Spa",
        "The Pinnacle Luxury Hotel",
    ],
}

HOTEL_HIGHLIGHTS: dict[str, list[str]] = {
    "economy": [
        "Free breakfast and 24-hour common room",
        "Prime location steps from the central bus station",
        "Friendly staff, secure lockers and free Wi-Fi",
        "Rooftop terrace with panoramic city views",
        "Community kitchen and weekly local tours included",
    ],
    "moderate": [
        "Rooftop pool and complimentary airport shuttle",
        "Boutique rooms with locally sourced décor",
        "In-house restaurant serving regional specialties",
        "Spa, gym and curated city tours available",
        "Central location with easy metro access",
    ],
    "luxury": [
        "Butler service, Michelin-starred dining and infinity pool",
        "Private beach access and bespoke excursion planning",
        "Panoramic city-view suites with personal concierge",
        "Award-winning spa and exclusive club lounge",
        "Helicopter transfers and private chef available",
    ],
}

NEIGHBORHOODS: dict[str, list[str]] = {
    "economy": ["City Centre", "Backpacker Quarter", "Old Market District"],
    "moderate": ["Midtown", "Cultural Quarter", "Riverside District"],
    "luxury": ["Uptown", "Beachfront", "Historic Palace District"],
}

PRICE_PER_NIGHT: dict[str, tuple[float, float]] = {
    "economy": (15.0, 45.0),
    "moderate": (80.0, 160.0),
    "luxury": (300.0, 700.0),
}

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _multiplier(budget_tier: str) -> float:
    return {
        "economy": ECONOMY_MULTIPLIER,
        "moderate": MODERATE_MULTIPLIER,
        "luxury": LUXURY_MULTIPLIER,
    }.get(budget_tier, MODERATE_MULTIPLIER)


def _activities_per_day(pacing: str) -> int:
    return {"relaxed": 3, "balanced": 4, "fast": 6}.get(pacing, 4)


def _compute_num_days(start_date: str, end_date: str) -> int:
    """Return the inclusive number of travel days between two ISO date strings."""
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        delta = (end - start).days
        return max(1, delta if delta > 0 else 1)
    except Exception:
        return 5  # sensible fallback


def _pick_activity_pool(interests: list[str]) -> list[str]:
    """Return a flat, shuffled list of activity name templates relevant to the given interests."""
    pool: list[str] = []
    for interest in interests:
        pool.extend(ACTIVITIES_BY_INTEREST.get(interest, []))
    if not pool:
        pool = DEFAULT_ACTIVITIES[:]
    # Also sprinkle in some defaults for variety
    pool.extend(DEFAULT_ACTIVITIES[:3])
    random.shuffle(pool)
    return pool


def _activity_cost(category: str, budget_tier: str, group_size: int) -> float:
    """Estimate per-group cost of an activity based on category and tier."""
    base_costs = {
        "Attraction": 20.0,
        "Dining": 30.0,
        "Transit": 10.0,
        "Accommodation": 0.0,
        "Free Time": 0.0,
    }
    base = base_costs.get(category, 15.0)
    mult = _multiplier(budget_tier)
    per_person = base * mult
    return round(per_person * group_size, 2)


def _time_for_slot(slot: str, index: int) -> str:
    """Generate a realistic start time for a given time slot."""
    slot_starts = {
        "Morning": [("07:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM")],
        "Afternoon": [("12:00 PM", "12:30 PM", "01:00 PM", "02:00 PM", "02:30 PM")],
        "Evening": [("06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM")],
    }
    options = slot_starts.get(slot, [("09:00 AM",)])[0]
    return options[index % len(options)]


def _make_activity(
    name_template: str,
    destination: str,
    time_slot: str,
    slot_index: int,
    category: str,
    budget_tier: str,
    group_size: int,
    transit_targets: list[str],
) -> dict:
    """Build a single ActivityItem-compatible dict."""
    act_id = str(uuid.uuid4())
    title = f"{name_template} in {destination}" if "{dest}" not in name_template else name_template.replace("{dest}", destination)
    cost = _activity_cost(category, budget_tier, group_size)
    cpp = round(cost / group_size, 2) if group_size > 0 else cost

    transit_tips = [
        f"Take a local taxi (~10 min) to reach {t}." for t in transit_targets
    ] + [
        f"Walk 5–10 minutes along the main boulevard.",
        f"Hop on the metro (Line 2) towards the city centre.",
        f"A rideshare app will have you there in under 15 minutes.",
        f"Rent a bicycle from the nearby kiosk and cycle along the riverside path.",
    ]

    return {
        "id": act_id,
        "time_slot": time_slot,
        "start_time": _time_for_slot(time_slot, slot_index),
        "title": title,
        "category": category,
        "description": (
            f"Enjoy an immersive {name_template.lower()} experience that gives you a "
            f"genuine taste of {destination}'s unique character. This is a favourite "
            f"among {budget_tier}-budget travellers and is considered one of the city's "
            f"must-do highlights."
        ),
        "location": f"{destination} – {['Central District', 'Old Town', 'Waterfront', 'Cultural Quarter', 'Market Square'][slot_index % 5]}",
        "estimated_cost": cost,
        "transit_tip": random.choice(transit_tips),
        "cost_per_person": cpp,
    }


def _make_day(
    day_number: int,
    destination: str,
    activity_pool: list[str],
    budget_tier: str,
    pacing: str,
    group_size: int,
    used_themes: set[str],
) -> dict:
    """Build a single DayItinerary-compatible dict."""
    n_acts = _activities_per_day(pacing)

    # Pick a unique theme
    available_themes = [t for t in THEMES if t not in used_themes]
    if not available_themes:
        available_themes = THEMES[:]
    theme = random.choice(available_themes)
    used_themes.add(theme)

    # Time-slot distribution
    if n_acts <= 3:
        slots = ["Morning", "Afternoon", "Evening"][:n_acts]
    elif n_acts == 4:
        slots = ["Morning", "Morning", "Afternoon", "Evening"]
    else:
        slots = ["Morning", "Morning", "Afternoon", "Afternoon", "Evening", "Evening"][:n_acts]

    category_cycle = ["Attraction", "Dining", "Attraction", "Dining", "Attraction", "Dining"]
    activities: list[dict] = []
    slot_counter: dict[str, int] = {"Morning": 0, "Afternoon": 0, "Evening": 0}

    for i, slot in enumerate(slots):
        template = activity_pool[( (day_number - 1) * 6 + i) % len(activity_pool)]
        category = category_cycle[i % len(category_cycle)]
        act = _make_activity(
            name_template=template,
            destination=destination,
            time_slot=slot,
            slot_index=slot_counter[slot],
            category=category,
            budget_tier=budget_tier,
            group_size=group_size,
            transit_targets=[destination + " Old Town", destination + " Waterfront"],
        )
        activities.append(act)
        slot_counter[slot] += 1

    daily_cost = round(sum(a["estimated_cost"] for a in activities), 2)

    return {
        "day_number": day_number,
        "theme": theme,
        "daily_cost_estimate": daily_cost,
        "activities": activities,
    }


def _make_stays(destination: str, budget_tier: str, currency: str) -> list[dict]:
    """Build 3 RecommendedStay-compatible dicts spanning economy → budget_tier."""
    tiers_to_show: list[str] = []
    if budget_tier == "economy":
        tiers_to_show = ["economy", "economy", "moderate"]
    elif budget_tier == "moderate":
        tiers_to_show = ["economy", "moderate", "moderate"]
    else:
        tiers_to_show = ["moderate", "luxury", "luxury"]

    stays: list[dict] = []
    for tier in tiers_to_show:
        names = HOTEL_NAMES[tier]
        highlights = HOTEL_HIGHLIGHTS[tier]
        neighborhoods = NEIGHBORHOODS[tier]
        lo, hi = PRICE_PER_NIGHT[tier]
        price = round(random.uniform(lo, hi), 2)
        if currency == "INR":
            price = round(price * INR_RATE, 2)

        stays.append(
            {
                "name": f"{random.choice(names)}, {destination}",
                "tier": tier,
                "price_per_night": price,
                "neighborhood": random.choice(neighborhoods),
                "highlight": random.choice(highlights),
            }
        )
    return stays


def _packing_tips(destination: str, interests: list[str], traveler_type: str) -> list[str]:
    """Return 6–8 practical packing and logistics tips."""
    base_tips = [
        f"Download an offline map of {destination} before departure — mobile data can be unreliable in some areas.",
        "Carry a small day-pack with a reusable water bottle, sunscreen, and a compact first-aid kit.",
        f"Exchange a small amount of local currency before arriving in {destination}; ATMs near tourist areas often charge high fees.",
        "Keep digital and physical copies of your passport, travel insurance, and accommodation bookings.",
        "Notify your bank of your travel dates to avoid card blocks while abroad.",
    ]
    interest_tips: dict[str, str] = {
        "Adventure": "Pack moisture-wicking clothing, sturdy closed-toe shoes, and a lightweight rain jacket.",
        "Food & Culinary": "Bring antacid tablets and a small cutlery kit — street-food tours are best enjoyed hands-on.",
        "Photography": "Bring extra memory cards, a portable charger, and a lightweight tripod for low-light shots.",
        "Beach & Water": "Include reef-safe sunscreen, a dry bag, and a quick-dry towel.",
        "Wellness & Spa": "Pack comfortable loose clothing, flip-flops, and a yoga mat strap.",
        "Shopping": "Leave extra space in your suitcase or pack a foldable duffel bag for your purchases.",
    }
    traveler_tips: dict[str, str] = {
        "family": "Bring a compact first-aid kit, child-safe insect repellent, and high-energy snacks for kids.",
        "couple": "Book romantic dinners and special experiences at least 48 hours in advance.",
        "solo": "Stay in social hostels for the first night to meet fellow travellers and gather local tips.",
        "friends": "Use a shared expense app (e.g., Splitwise) to track group costs easily.",
    }

    tips = base_tips[:]
    for interest in interests:
        tip = interest_tips.get(interest)
        if tip and tip not in tips:
            tips.append(tip)
            if len(tips) >= 8:
                break

    traveler_tip = traveler_tips.get(traveler_type)
    if traveler_tip and traveler_tip not in tips:
        tips.append(traveler_tip)

    return tips[:8]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_mock_itinerary(request_data: dict) -> dict:
    """
    Generate a complete, realistic ItineraryResponse-compatible dict for any destination.

    Parameters
    ----------
    request_data:
        A dict matching the TripRequest schema fields.

    Returns
    -------
    dict
        Fully-populated ItineraryResponse-compatible dict.
    """
    destination: str = request_data.get("destination", "Unknown City")
    start_date: str = request_data.get("start_date", "2025-01-01")
    end_date: str = request_data.get("end_date", "2025-01-05")
    traveler_type: str = request_data.get("traveler_type", "solo")
    group_size: int = max(1, int(request_data.get("group_size", 1)))
    budget_tier: str = request_data.get("budget_tier", "moderate")
    currency: str = request_data.get("currency", "USD")
    pacing: str = request_data.get("pacing", "balanced")
    interests: list[str] = request_data.get("interests", [])

    num_days = _compute_num_days(start_date, end_date)
    activity_pool = _pick_activity_pool(interests)

    # Seed random with destination for deterministic but destination-specific results
    rng_seed = sum(ord(c) for c in destination) + num_days
    random.seed(rng_seed)

    used_themes: set[str] = set()
    days: list[dict] = [
        _make_day(d, destination, activity_pool, budget_tier, pacing, group_size, used_themes)
        for d in range(1, num_days + 1)
    ]

    # Cost aggregation
    total_activity_cost = sum(day["daily_cost_estimate"] for day in days)
    base_nightly = random.uniform(*PRICE_PER_NIGHT[budget_tier])
    if currency == "INR":
        base_nightly = base_nightly * INR_RATE
    accommodation_cost = round(base_nightly * num_days, 2)
    dining_cost = round(total_activity_cost * 0.35, 2)
    transport_cost = round(total_activity_cost * 0.15, 2)
    activities_cost = round(total_activity_cost * 0.50, 2)

    total_estimated_cost = round(accommodation_cost + dining_cost + transport_cost + activities_cost, 2)
    cost_per_person = round(total_estimated_cost / group_size, 2)

    # Build trip title and summary
    trip_title = f"{num_days}-Day {destination} {traveler_type.capitalize()} {budget_tier.capitalize()} Adventure"
    summary = (
        f"Embark on an unforgettable {num_days}-day {pacing} journey through {destination}, "
        f"perfectly tailored for a {traveler_type} of {group_size} on a {budget_tier} budget. "
        f"From iconic landmarks to hidden local gems, this itinerary blends "
        f"{', '.join(interests[:2]) if interests else 'culture and cuisine'} "
        f"with carefully clustered daily plans to maximise your time and minimise transit fatigue."
    )

    packing_tips = _packing_tips(destination, interests, traveler_type)
    recommended_stays = _make_stays(destination, budget_tier, currency)

    return {
        "trip_title": trip_title,
        "destination": destination,
        "summary": summary,
        "currency": currency,
        "total_estimated_cost": total_estimated_cost,
        "cost_per_person": cost_per_person,
        "cost_breakdown": {
            "accommodation": accommodation_cost,
            "dining": dining_cost,
            "activities": activities_cost,
            "transportation": transport_cost,
        },
        "recommended_stays": recommended_stays,
        "days": days,
        "packing_and_logistics_tips": packing_tips,
    }


def generate_mock_day(request_data: dict) -> dict:
    """
    Generate a single DayItinerary-compatible dict for day regeneration.

    Parameters
    ----------
    request_data:
        A dict matching the RegenerateDayRequest schema fields.

    Returns
    -------
    dict
        A single DayItinerary-compatible dict.
    """
    destination: str = request_data.get("destination", "Unknown City")
    day_number: int = int(request_data.get("day_number", 1))
    day_theme: str = request_data.get("day_theme", "Cultural Discovery")
    trip_context: dict = request_data.get("trip_context", {})

    group_size: int = max(1, int(trip_context.get("group_size", 1)))
    budget_tier: str = trip_context.get("budget_tier", "moderate")
    pacing: str = trip_context.get("pacing", "balanced")
    interests: list[str] = trip_context.get("interests", [])

    activity_pool = _pick_activity_pool(interests)
    random.seed(sum(ord(c) for c in destination) + day_number + 99)

    used = set()
    day = _make_day(day_number, destination, activity_pool, budget_tier, pacing, group_size, used)
    # Override theme with the requested one
    day["theme"] = day_theme
    return day
