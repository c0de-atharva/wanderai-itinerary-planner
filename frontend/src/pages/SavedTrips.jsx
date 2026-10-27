import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Trash2, Eye } from 'lucide-react'
import { useApp } from '../context/AppContext'

const gradients = [
  'from-blue-600/50 to-purple-700/50',
  'from-green-600/50 to-teal-700/50',
  'from-orange-500/50 to-pink-700/50',
  'from-cyan-500/50 to-blue-700/50',
  'from-violet-500/50 to-purple-700/50',
  'from-rose-500/50 to-orange-700/50',
]

export default function SavedTrips() {
  const { savedTrips, deleteTrip, setCurrentItinerary, addToast } = useApp()
  const navigate = useNavigate()

  const handleDelete = (e, tripId) => {
    e.stopPropagation()
    deleteTrip(tripId)
    addToast('Trip deleted', 'info')
  }

  const handleView = (trip) => {
    setCurrentItinerary(trip)
    navigate(`/itinerary/${trip.id}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="section-title text-2xl">Saved Trips</h2>
        <p className="text-slate-400 text-sm">{savedTrips.length} {savedTrips.length === 1 ? 'trip' : 'trips'} saved</p>
      </div>

      {savedTrips.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-16 text-center"
        >
          <div className="text-6xl mb-5">🗺️</div>
          <h3 className="text-xl font-bold text-white mb-2">No saved trips yet</h3>
          <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
            Generate your first AI-powered itinerary and save it here for easy access.
          </p>
          <button onClick={() => navigate('/builder')} className="btn-primary">
            ✨ Plan My First Trip
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {savedTrips.map((trip, i) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="glass-card overflow-hidden group"
            >
              {/* Banner */}
              <div
                className={`h-32 bg-gradient-to-br ${gradients[i % gradients.length]} relative cursor-pointer`}
                onClick={() => handleView(trip)}
              >
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <MapPin size={15} />
                    {trip.destination}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, trip.id)}
                  className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-red-500/60 rounded-xl text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-white mb-1 leading-tight truncate">
                  {trip.title || `${trip.destination} Trip`}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                  <Calendar size={12} />
                  {trip.start_date} → {trip.end_date}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2 flex-wrap">
                    <span className="pill-tag bg-blue-500/10 text-blue-400 border-blue-500/20 capitalize">
                      {trip.traveler_type}
                    </span>
                    {trip.group_size > 1 && (
                      <span className="pill-tag bg-slate-500/10 text-slate-400 border-slate-500/20">
                        {trip.group_size} people
                      </span>
                    )}
                  </div>
                  {trip.total_cost && (
                    <span className="text-white font-bold text-sm">${trip.total_cost}</span>
                  )}
                </div>

                <button
                  onClick={() => handleView(trip)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all"
                >
                  <Eye size={14} />
                  View Itinerary
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
