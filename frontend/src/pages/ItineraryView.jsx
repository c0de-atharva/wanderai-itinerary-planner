import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import {
  RefreshCw, Save, ChevronDown, ChevronUp, Users, MapPin,
  AlertCircle, X
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import ActivityCard from '../components/ui/ActivityCard'
import DayTab from '../components/ui/DayTab'
import BudgetBar from '../components/ui/BudgetBar'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { regenerateDay } from '../services/api'
import { buildDemoItinerary } from '../utils/demoData'

const slotColors = {
  Morning: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  Afternoon: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  Evening: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
}

export default function ItineraryView() {
  const { currentItinerary, saveTrip, addToast, setCurrentItinerary, appMode } = useApp()
  const navigate = useNavigate()
  const [activeDay, setActiveDay] = useState(0)
  const [showRegenModal, setShowRegenModal] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [packingOpen, setPackingOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!currentItinerary) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6"
      >
        <div className="text-6xl">🗺️</div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">No itinerary loaded</h2>
          <p className="text-slate-400 mb-6">Generate a trip first or load one from your saved trips.</p>
        </div>
        <button onClick={() => navigate('/builder')} className="btn-primary">
          Plan a Trip
        </button>
      </motion.div>
    )
  }

  const itin = currentItinerary
  const day = itin.days?.[activeDay]
  const breakdown = itin.cost_breakdown || {}
  const totalCost = itin.total_cost || 0
  const groupSize = itin.group_size || 1

  const slots = ['Morning', 'Afternoon', 'Evening']

  const handleDeleteActivity = (actId) => {
    const updated = {
      ...itin,
      days: itin.days.map((d, i) =>
        i !== activeDay ? d : {
          ...d,
          activities: d.activities.filter(a => a.id !== actId),
          total_cost: d.activities.filter(a => a.id !== actId).reduce((s, a) => s + (a.cost || 0), 0),
        }
      ),
    }
    setCurrentItinerary(updated)
  }

  const handleEditActivity = (updatedAct) => {
    const updated = {
      ...itin,
      days: itin.days.map((d, i) =>
        i !== activeDay ? d : {
          ...d,
          activities: d.activities.map(a => a.id === updatedAct.id ? updatedAct : a),
        }
      ),
    }
    setCurrentItinerary(updated)
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    setShowRegenModal(false)
    try {
      let newDayData
      if (appMode === 'live') {
        newDayData = await regenerateDay({
          itinerary_id: itin.id,
          day: day.day,
          destination: itin.destination,
          preferences: {
            traveler_type: itin.traveler_type,
            budget_tier: itin.budget_tier,
            interests: itin.interests,
            pacing: itin.pacing,
          },
        })
      } else {
        await new Promise(r => setTimeout(r, 1500))
        const demo = buildDemoItinerary({ ...itin, start_date: itin.start_date, end_date: itin.end_date })
        newDayData = demo.days[activeDay % demo.days.length]
      }

      const updated = {
        ...itin,
        days: itin.days.map((d, i) => i === activeDay ? { ...newDayData, day: d.day } : d),
      }
      setCurrentItinerary(updated)
      addToast('Day regenerated successfully!', 'success')
    } catch (err) {
      addToast('Failed to regenerate. Please try again.', 'error')
    } finally {
      setRegenerating(false)
    }
  }

  const handleSave = () => {
    saveTrip(itin)
    setSaved(true)
    addToast('Trip saved successfully! 🎉', 'success')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin size={20} className="text-blue-400" />
            {itin.destination}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {itin.start_date} → {itin.end_date} · {itin.traveler_type} ·{' '}
            {groupSize > 1 ? `${groupSize} people` : '1 person'}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
            saved
              ? 'bg-green-600/20 text-green-400 border border-green-500/30'
              : 'btn-primary'
          }`}
        >
          {saved ? '✓ Saved!' : '💾 Save Trip'}
        </motion.button>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 flex-wrap">
        {itin.days?.map((d, i) => (
          <DayTab
            key={i}
            day={d.day}
            label={`Day ${d.day}`}
            isActive={activeDay === i}
            onClick={() => setActiveDay(i)}
          />
        ))}
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left — Day content */}
        <div className="flex-1 min-w-0 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Day header */}
              <div className="glass-card p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Day {day?.day}</p>
                  <h3 className="text-lg font-bold text-white">{day?.theme}</h3>
                </div>
                <button
                  onClick={() => setShowRegenModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm transition-all"
                  disabled={regenerating}
                >
                  {regenerating ? (
                    <LoadingSpinner size="sm" text={null} />
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      Regenerate Day
                    </>
                  )}
                </button>
              </div>

              {/* Activities grouped by time slot */}
              {slots.map(slot => {
                const acts = day?.activities?.filter(a => a.slot === slot) || []
                if (!acts.length) return null
                return (
                  <div key={slot}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border mb-3 ${slotColors[slot]}`}>
                      {slot === 'Morning' ? '🌅' : slot === 'Afternoon' ? '☀️' : '🌙'} {slot}
                    </div>
                    <div className="space-y-3">
                      {acts.map(act => (
                        <ActivityCard
                          key={act.id}
                          activity={act}
                          groupSize={groupSize}
                          onDelete={handleDeleteActivity}
                          onEdit={handleEditActivity}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Day cost summary */}
              <div className="glass-card px-5 py-3 flex items-center justify-between">
                <span className="text-slate-400 text-sm">Day {day?.day} total</span>
                <span className="text-white font-bold">
                  ${day?.total_cost?.toFixed(0) || '0'}
                  {groupSize > 1 && (
                    <span className="text-slate-500 font-normal ml-2 text-sm">
                      (~${((day?.total_cost || 0) / groupSize).toFixed(0)}/person)
                    </span>
                  )}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right — Budget sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          {/* Total budget */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-bold text-white">Budget Overview</h3>
            <div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-slate-400 text-sm">Total Estimated</span>
                <span className="text-2xl font-bold text-white">${totalCost}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: itin.budget_cap ? `${Math.min((totalCost / itin.budget_cap) * 100, 100)}%` : '75%' }
                  }
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
              {itin.budget_cap && (
                <p className="text-xs text-slate-500 mt-1">of ${itin.budget_cap} budget cap</p>
              )}
            </div>

            {/* Cost breakdown */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <BudgetBar label="Accommodation" amount={breakdown.accommodation || 0} total={totalCost} color="purple" icon="🏨" />
              <BudgetBar label="Dining" amount={breakdown.dining || 0} total={totalCost} color="green" icon="🍽️" />
              <BudgetBar label="Activities" amount={breakdown.activities || 0} total={totalCost} color="blue" icon="🎫" />
              <BudgetBar label="Transportation" amount={breakdown.transportation || 0} total={totalCost} color="orange" icon="🚌" />
            </div>

            {/* Group split */}
            {groupSize > 1 && (
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                  <Users size={14} />
                  Per Person ({groupSize})
                </div>
                <span className="text-white font-bold">${(totalCost / groupSize).toFixed(0)}</span>
              </div>
            )}
          </div>

          {/* Recommended Stays */}
          {itin.recommended_stays?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-bold text-white mb-4">🏨 Recommended Stays</h3>
              <div className="space-y-3">
                {itin.recommended_stays.map((hotel, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-white text-sm leading-tight">{hotel.name}</span>
                      <span className="pill-tag bg-blue-500/10 text-blue-400 border-blue-500/20 shrink-0 capitalize text-xs">
                        {hotel.tier}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1.5">{hotel.neighborhood}</p>
                    <p className="text-xs text-slate-500 italic">{hotel.highlight}</p>
                    <div className="mt-2 text-sm font-bold text-green-400">${hotel.price}/night</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Packing Tips */}
          {itin.packing_tips?.length > 0 && (
            <div className="glass-card overflow-hidden">
              <button
                onClick={() => setPackingOpen(v => !v)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-bold text-white">🎒 Packing Tips</span>
                {packingOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>
              <AnimatePresence>
                {packingOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <ul className="px-5 pb-5 space-y-2">
                      {itin.packing_tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                          <span className="text-green-400 mt-0.5">✓</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Regenerate Confirm Modal */}
      <AnimatePresence>
        {showRegenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRegenModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <AlertCircle size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Regenerate Day {day?.day}?</h3>
                  <p className="text-slate-400 text-sm">This will replace all activities for this day with a fresh AI-generated plan.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRegenModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={handleRegenerate} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <RefreshCw size={14} /> Regenerate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
