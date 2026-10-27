import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  res => res,
  err => {
    console.error('API Error:', err?.response?.data || err.message)
    return Promise.reject(err)
  }
)

/**
 * Normalize a backend ItineraryResponse to the flat shape the UI expects.
 * This makes the frontend resilient to backend field-name conventions.
 */
export function normalizeItinerary(raw) {
  if (!raw) return null
  return {
    // top-level aliases
    id: raw.id || `itin_${Date.now()}`,
    title: raw.trip_title || raw.title || raw.destination,
    trip_title: raw.trip_title || raw.title || raw.destination,
    destination: raw.destination,
    summary: raw.summary || '',
    currency: raw.currency || 'USD',
    start_date: raw.start_date || '',
    end_date: raw.end_date || '',
    traveler_type: raw.traveler_type || 'solo',
    group_size: raw.group_size || 1,
    budget_tier: raw.budget_tier || 'moderate',
    budget_cap: raw.budget_cap || null,
    pacing: raw.pacing || 'balanced',
    interests: raw.interests || [],
    // cost fields — support both naming conventions
    total_cost: raw.total_estimated_cost ?? raw.total_cost ?? 0,
    total_estimated_cost: raw.total_estimated_cost ?? raw.total_cost ?? 0,
    cost_per_person: raw.cost_per_person ?? 0,
    cost_breakdown: raw.cost_breakdown || { accommodation: 0, dining: 0, activities: 0, transportation: 0 },
    // accommodation
    recommended_stays: (raw.recommended_stays || []).map(s => ({
      ...s,
      price: s.price_per_night ?? s.price ?? 0,
      price_per_night: s.price_per_night ?? s.price ?? 0,
    })),
    // tips — support both naming conventions
    packing_tips: raw.packing_and_logistics_tips || raw.packing_tips || [],
    packing_and_logistics_tips: raw.packing_and_logistics_tips || raw.packing_tips || [],
    // days — normalize each day and each activity
    days: (raw.days || []).map(d => ({
      ...d,
      // day number
      day: d.day_number ?? d.day ?? 1,
      day_number: d.day_number ?? d.day ?? 1,
      theme: d.theme || `Day ${d.day_number ?? d.day}`,
      // cost for the day
      total_cost: d.daily_cost_estimate ?? d.total_cost ?? 0,
      daily_cost_estimate: d.daily_cost_estimate ?? d.total_cost ?? 0,
      // normalize activities
      activities: (d.activities || []).map(a => ({
        ...a,
        id: a.id || `act_${Math.random().toString(36).slice(2)}`,
        // slot field — support both time_slot and slot
        slot: a.time_slot || a.slot || 'Morning',
        time_slot: a.time_slot || a.slot || 'Morning',
        // time display
        time: a.start_time || a.time || '',
        start_time: a.start_time || a.time || '',
        // cost — support both estimated_cost and cost
        cost: a.estimated_cost ?? a.cost ?? 0,
        estimated_cost: a.estimated_cost ?? a.cost ?? 0,
        // per-person
        cost_per_person: a.cost_per_person ?? null,
      })),
    })),
  }
}

export const generateItinerary = (formData) =>
  api.post('/api/itinerary/generate', formData).then(r => normalizeItinerary(r.data))

export const regenerateDay = (data) =>
  api.post('/api/itinerary/regenerate-day', data).then(r => r.data)

export const saveTrip = (tripData, userId) =>
  api.post('/api/trips/save', { trip_data: tripData, user_id: userId }).then(r => r.data)

export const getTrips = (userId) =>
  api.get('/api/trips', { params: { user_id: userId } }).then(r => r.data)

export const deleteTrip = (tripId) =>
  api.delete(`/api/trips/${tripId}`).then(r => r.data)

export const getHealth = () =>
  api.get('/api/health').then(r => r.data)

export default api
