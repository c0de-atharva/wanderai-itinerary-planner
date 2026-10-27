import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Wallet, Globe, ArrowRight, Compass } from 'lucide-react'
import { useApp } from '../context/AppContext'
import ScenarioCards from '../components/ui/ScenarioCards'

export default function Dashboard() {
  const { savedTrips } = useApp()
  const navigate = useNavigate()

  const totalBudget = savedTrips.reduce((s, t) => s + (t.total_cost || 0), 0)
  const avgBudget = savedTrips.length ? (totalBudget / savedTrips.length).toFixed(0) : 0
  const destinations = new Set(savedTrips.map(t => t.destination)).size

  const recentTrips = savedTrips.slice(0, 3)

  const stats = [
    { label: 'Trips Saved', value: savedTrips.length, icon: Compass, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Destinations', value: destinations, icon: Globe, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Avg Budget', value: `$${avgBudget}`, icon: Wallet, color: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      {/* Hero */}
      <div className="relative overflow-hidden glass-card p-8 md:p-12">
        {/* Blurred blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 font-medium mb-4">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              AI-Powered Travel Planning
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-3">
              Plan Your{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                Perfect Trip
              </span>
              {' '}with AI
            </h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Tell us your dream destination and preferences. Our AI builds a personalized day-by-day itinerary in seconds.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/builder')}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Create New Trip
              </button>
              <button
                onClick={() => navigate('/trips')}
                className="btn-secondary flex items-center gap-2"
              >
                <MapPin size={18} />
                View Saved Trips
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="glass-card p-5 flex items-center gap-4"
          >
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Quick Scenarios</h2>
            <p className="text-slate-400 text-sm">One-click to pre-fill the trip builder</p>
          </div>
        </div>
        <ScenarioCards />
      </div>

      {/* Recent Trips */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Recent Trips</h2>
            <p className="text-slate-400 text-sm">Your last saved itineraries</p>
          </div>
          {savedTrips.length > 0 && (
            <button
              onClick={() => navigate('/trips')}
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View All <ArrowRight size={14} />
            </button>
          )}
        </div>

        {recentTrips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <div className="text-5xl mb-4">🗺️</div>
            <h3 className="text-white font-semibold text-lg mb-2">No trips saved yet</h3>
            <p className="text-slate-400 text-sm mb-6">
              Generate your first AI-powered itinerary and save it here.
            </p>
            <button onClick={() => navigate('/builder')} className="btn-primary">
              Plan Your First Trip
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTrips.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function TripCard({ trip, index }) {
  const navigate = useNavigate()
  const { setCurrentItinerary } = useApp()

  const gradients = [
    'from-blue-600/40 to-purple-700/40',
    'from-green-600/40 to-teal-700/40',
    'from-orange-500/40 to-pink-700/40',
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -3 }}
      className="glass-card overflow-hidden cursor-pointer group"
      onClick={() => {
        setCurrentItinerary(trip)
        navigate(`/itinerary/${trip.id}`)
      }}
    >
      {/* Banner */}
      <div className={`h-28 bg-gradient-to-br ${gradients[index % gradients.length]} flex items-end p-4`}>
        <div className="flex items-center gap-1.5 text-white">
          <MapPin size={14} />
          <span className="font-semibold text-sm">{trip.destination}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors truncate">
          {trip.title || trip.destination}
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          {trip.start_date} → {trip.end_date}
        </p>
        <div className="flex items-center justify-between">
          <span className="pill-tag bg-blue-500/10 text-blue-400 border-blue-500/20 capitalize">
            {trip.traveler_type || 'traveler'}
          </span>
          {trip.total_cost && (
            <span className="text-sm font-semibold text-white">${trip.total_cost}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
