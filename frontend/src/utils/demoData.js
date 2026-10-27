// Demo data generator for when the backend is unavailable

const DESTINATION_THEMES = {
  default: {
    day1Theme: 'Arrival & First Impressions',
    day2Theme: 'Deep Exploration',
    day3Theme: 'Hidden Gems & Departure',
    hotels: [
      { name: 'The Grand Central', tier: 'moderate', price: 85, neighborhood: 'City Centre', highlight: 'Rooftop pool with panoramic views' },
      { name: 'Backpacker Hostel Plus', tier: 'economy', price: 22, neighborhood: 'Old Town', highlight: 'Social hub with daily tours' },
      { name: 'Luxe Boutique Hotel', tier: 'luxury', price: 220, neighborhood: 'Beachfront', highlight: 'Private butler & spa access' },
    ],
    packing: [
      'Light, breathable clothing for daytime exploring',
      'Comfortable walking shoes — you\'ll need them!',
      'Portable charger & universal adapter',
      'Reusable water bottle to stay hydrated',
      'Sunscreen and a compact daypack',
    ]
  },
}

const timeSlots = ['Morning', 'Afternoon', 'Evening']
const morningActivities = [
  { category: 'Dining', title: 'Local Breakfast Café', location: 'Old Town Square', description: 'Start the day with locally sourced breakfast and strong coffee.', cost: 12, duration: '45 min', transit_tip: 'Walk 5 min from hotel lobby' },
  { category: 'Attraction', title: 'Historic Old Town Walk', location: 'City Center', description: 'Explore cobblestone streets and centuries-old architecture with an audio guide.', cost: 5, duration: '2 hrs', transit_tip: 'Download the audio guide before leaving hotel' },
]
const afternoonActivities = [
  { category: 'Dining', title: 'Riverside Lunch', location: 'Waterfront District', description: 'Fresh catch of the day at a beloved local spot recommended by residents.', cost: 18, duration: '1 hr' },
  { category: 'Attraction', title: 'National Museum Visit', location: 'Cultural Quarter', description: 'A curated collection of artifacts spanning 500 years of regional history.', cost: 12, duration: '1.5 hrs', transit_tip: 'Bus line 7 from the market stop — 10 min ride' },
  { category: 'Adventure', title: 'Scenic Viewpoint Hike', location: 'Northern Hills', description: 'A moderate 45-minute trek rewarded with sweeping panoramic city views.', cost: 0, duration: '2 hrs' },
]
const eveningActivities = [
  { category: 'Dining', title: 'Rooftop Dinner', location: 'Sky Deck Restaurant', description: 'Fine dining under the stars with incredible sunset views over the city skyline.', cost: 45, duration: '2 hrs' },
  { category: 'Nightlife', title: 'Night Market Experience', location: 'Central Night Bazaar', description: 'Immerse yourself in local street food, crafts, and live music performances.', cost: 20, duration: '2 hrs' },
  { category: 'Free Time', title: 'Leisure Evening', location: 'Hotel / Beachfront', description: 'Unwind at the hotel pool or take a relaxing stroll along the waterfront.', cost: 0, duration: 'Flexible' },
]

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildDay(dayIndex, form) {
  const themes = [
    'Arrival & First Impressions',
    'Cultural Deep Dive',
    'Nature & Adventure',
    'Food & Local Life',
    'Hidden Gems & Relax',
    'Shopping & Nightlife',
    'Farewell Day',
  ]

  const morning = { ...randomFrom(morningActivities), id: `act_${dayIndex}_morning_${Date.now()}`, time: '08:00', slot: 'Morning' }
  const afternoon = { ...randomFrom(afternoonActivities), id: `act_${dayIndex}_afternoon_${Date.now()}`, time: '13:00', slot: 'Afternoon' }
  const evening = { ...randomFrom(eveningActivities), id: `act_${dayIndex}_evening_${Date.now()}`, time: '19:00', slot: 'Evening' }

  const activities = [morning, afternoon, evening]
  const dayTotal = activities.reduce((s, a) => s + (a.cost || 0), 0)

  return {
    day: dayIndex + 1,
    theme: themes[dayIndex % themes.length],
    total_cost: dayTotal,
    activities,
  }
}

export function buildDemoItinerary(form) {
  const start = new Date(form.start_date)
  const end = new Date(form.end_date)
  const numDays = Math.max(1, Math.round((end - start) / 86400000) + 1)

  const days = Array.from({ length: numDays }, (_, i) => buildDay(i, form))

  const totalActivitiesCost = days.reduce((s, d) => s + d.total_cost, 0)
  const accommodationCost = numDays * (form.budget_tier === 'luxury' ? 180 : form.budget_tier === 'economy' ? 30 : 75)
  const transportationCost = Math.round(totalActivitiesCost * 0.2)
  const totalCost = Math.round(totalActivitiesCost + accommodationCost + transportationCost)

  const theme = DESTINATION_THEMES.default

  return {
    id: `itinerary_${Date.now()}`,
    title: `${form.destination} ${numDays}-Day Trip`,
    destination: form.destination,
    start_date: form.start_date,
    end_date: form.end_date,
    traveler_type: form.traveler_type,
    group_size: form.group_size,
    budget_tier: form.budget_tier,
    pacing: form.pacing,
    interests: form.interests,
    currency: form.currency,
    days,
    total_cost: totalCost,
    cost_breakdown: {
      accommodation: Math.round(accommodationCost),
      dining: Math.round(totalActivitiesCost * 0.45),
      activities: Math.round(totalActivitiesCost * 0.35),
      transportation: transportationCost,
    },
    recommended_stays: theme.hotels,
    packing_tips: theme.packing,
  }
}
