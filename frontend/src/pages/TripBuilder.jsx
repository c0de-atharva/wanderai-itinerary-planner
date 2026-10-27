import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, MapPin, Calendar, Users,
  Wallet, Zap, Check, Sparkles,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateItinerary } from '../services/api'
import { SCENARIOS } from '../components/ui/ScenarioCards'
import { buildDemoItinerary } from '../utils/demoData'

const INTERESTS_OPTIONS = [
  { label: 'Food & Culinary', emoji: '🍜' },
  { label: 'History & Culture', emoji: '🏛️' },
  { label: 'Nature & Scenic', emoji: '🌿' },
  { label: 'Adventure', emoji: '🧗' },
  { label: 'Nightlife', emoji: '🎵' },
  { label: 'Shopping', emoji: '🛍️' },
  { label: 'Offbeat/Hidden Gems', emoji: '🔍' },
]

const TRAVELER_TYPES = [
  { id: 'solo', label: 'Solo', emoji: '👤' },
  { id: 'couple', label: 'Couple', emoji: '💑' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { id: 'friends', label: 'Friends Group', emoji: '👥' },
]

const BUDGET_TIERS = [
  { id: 'economy', label: 'Economy', emoji: '💰', desc: 'Budget-friendly choices' },
  { id: 'moderate', label: 'Moderate', emoji: '💳', desc: 'Best value experiences' },
  { id: 'luxury', label: 'Luxury', emoji: '💎', desc: 'Premium comfort & service' },
]

const PACING_OPTIONS = [
  { id: 'relaxed', label: 'Relaxed', emoji: '🌿', desc: 'Slow, peaceful pace' },
  { id: 'balanced', label: 'Balanced', emoji: '⚖️', desc: 'Mix of rest and activity' },
  { id: 'fast', label: 'Fast-Paced', emoji: '⚡', desc: 'See as much as possible' },
]

const DEFAULT_FORM = {
  destination: '',
  start_date: '',
  end_date: '',
  traveler_type: 'solo',
  group_size: 1,
  budget_tier: 'moderate',
  budget_cap: '',
  currency: 'USD',
  pacing: 'balanced',
  interests: [],
}

const STEPS = [
  'Destination & Dates',
  'Traveler Profile',
  'Budget & Style',
  'Interests',
  'Review & Generate',
]

export default function TripBuilder() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setCurrentItinerary, addToast, appMode } = useApp()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [generating, setGenerating] = useState(false)

  // Handle scenario pre-fill from navigation state or URL
  useEffect(() => {
    if (location.state?.scenario) {
      setForm(f => ({ ...f, ...location.state.scenario }))
      if (location.state.jumpToReview) setStep(4)
    }
  }, [location.state])

  const numDays = () => {
    if (!form.start_date || !form.end_date) return 0
    const diff = (new Date(form.end_date) - new Date(form.start_date)) / 86400000
    return Math.max(0, diff + 1)
  }

  const updateForm = (updates) => setForm(f => ({ ...f, ...updates }))

  const toggleInterest = (label) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(label)
        ? f.interests.filter(i => i !== label)
        : [...f.interests, label],
    }))
  }

  const canProceed = () => {
    if (step === 0) return form.destination.trim() && form.start_date && form.end_date && numDays() > 0
    if (step === 1) return !!form.traveler_type
    if (step === 2) return !!form.budget_tier && !!form.pacing
    if (step === 3) return form.interests.length > 0
    return true
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      let result
      if (appMode === 'live') {
        result = await generateItinerary(form)
      } else {
        // Demo mode: build a realistic local itinerary
        await new Promise(r => setTimeout(r, 2200))
        result = buildDemoItinerary(form)
      }
      setCurrentItinerary(result)
      navigate('/itinerary/new')
    } catch (err) {
      console.error(err)
      addToast('Failed to generate itinerary. Using demo data.', 'error')
      const demoResult = buildDemoItinerary(form)
      setCurrentItinerary(demoResult)
      navigate('/itinerary/new')
    } finally {
      setGenerating(false)
    }
  }

  const handleScenario = (data) => {
    setForm(f => ({ ...f, ...data }))
    setStep(4)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Scenario bar */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">⚡ Quick Start Scenarios</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SCENARIOS.map(s => (
            <button
              key={s.label}
              onClick={() => handleScenario(s.data)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm font-medium transition-all bg-gradient-to-br ${s.color} hover:scale-[1.02] active:scale-[0.98]`}
            >
              <span className="text-lg">{s.icon}</span>
              <span className="text-white leading-tight">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                i === step ? 'text-white' : i < step ? 'text-blue-400 cursor-pointer' : 'text-slate-600'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < step
                    ? 'bg-blue-600 text-white'
                    : i === step
                    ? 'bg-blue-600/30 border border-blue-500 text-blue-300'
                    : 'bg-white/5 border border-white/10 text-slate-600'
                }`}
              >
                {i < step ? <Check size={12} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? 'bg-blue-600' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form card */}
      <div className="glass-card p-6 md:p-8 min-h-[380px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <StepDestination form={form} updateForm={updateForm} numDays={numDays} />
            )}
            {step === 1 && (
              <StepTraveler form={form} updateForm={updateForm} />
            )}
            {step === 2 && (
              <StepBudget form={form} updateForm={updateForm} />
            )}
            {step === 3 && (
              <StepInterests form={form} toggleInterest={toggleInterest} />
            )}
            {step === 4 && (
              <StepReview form={form} numDays={numDays} generating={generating} onGenerate={handleGenerate} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav buttons */}
      {step < 4 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue <ChevronRight size={16} />
          </button>
        </div>
      )}
    </motion.div>
  )
}

// --- Step Components ---

function StepDestination({ form, updateForm, numDays }) {
  const days = numDays()
  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-title">Where are you headed? ✈️</h2>
        <p className="text-slate-400 text-sm">Start with your dream destination and travel dates.</p>
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-2 font-medium">Destination</label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="e.g. Goa, India or Paris, France"
            value={form.destination}
            onChange={e => updateForm({ destination: e.target.value })}
            className="input-field pl-9 text-lg"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2 font-medium flex items-center gap-1.5">
            <Calendar size={14} /> Start Date
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={e => updateForm({ start_date: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2 font-medium flex items-center gap-1.5">
            <Calendar size={14} /> End Date
          </label>
          <input
            type="date"
            value={form.end_date}
            min={form.start_date}
            onChange={e => updateForm({ end_date: e.target.value })}
            className="input-field"
          />
        </div>
      </div>
      {days > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-semibold"
        >
          🗓 {days} {days === 1 ? 'day' : 'days'} trip
        </motion.div>
      )}
    </div>
  )
}

function StepTraveler({ form, updateForm }) {
  const showGroupSize = ['family', 'friends'].includes(form.traveler_type)
  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-title">Who's traveling? 👥</h2>
        <p className="text-slate-400 text-sm">Your group type shapes the itinerary.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {TRAVELER_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => {
              updateForm({ traveler_type: t.id, group_size: t.id === 'solo' ? 1 : t.id === 'couple' ? 2 : form.group_size })
            }}
            className={`flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all ${
              form.traveler_type === t.id
                ? 'bg-blue-500/20 border-blue-500/40 text-white'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-3xl">{t.emoji}</span>
            <span className="font-medium text-sm">{t.label}</span>
          </button>
        ))}
      </div>
      {showGroupSize && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <label className="text-sm text-slate-300 font-medium">Group Size</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateForm({ group_size: Math.max(2, form.group_size - 1) })}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
            >−</button>
            <span className="text-white font-bold text-lg w-8 text-center">{form.group_size}</span>
            <button
              onClick={() => updateForm({ group_size: Math.min(20, form.group_size + 1) })}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
            >+</button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function StepBudget({ form, updateForm }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Budget & Pace 💳</h2>
        <p className="text-slate-400 text-sm">How do you like to travel?</p>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-3 font-medium">Budget Tier</label>
        <div className="grid grid-cols-3 gap-3">
          {BUDGET_TIERS.map(b => (
            <button
              key={b.id}
              onClick={() => updateForm({ budget_tier: b.id })}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border transition-all text-center ${
                form.budget_tier === b.id
                  ? 'bg-blue-500/20 border-blue-500/40 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span className="text-2xl">{b.emoji}</span>
              <span className="font-semibold text-sm">{b.label}</span>
              <span className="text-xs text-slate-500 leading-tight">{b.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2 font-medium">Budget Cap (optional)</label>
          <input
            type="number"
            placeholder="e.g. 1500"
            value={form.budget_cap}
            onChange={e => updateForm({ budget_cap: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2 font-medium">Currency</label>
          <select
            value={form.currency}
            onChange={e => updateForm({ currency: e.target.value })}
            className="input-field"
          >
            <option value="USD">USD $</option>
            <option value="INR">INR ₹</option>
            <option value="EUR">EUR €</option>
            <option value="GBP">GBP £</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-3 font-medium">Travel Pace</label>
        <div className="grid grid-cols-3 gap-3">
          {PACING_OPTIONS.map(p => (
            <button
              key={p.id}
              onClick={() => updateForm({ pacing: p.id })}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border transition-all text-center ${
                form.pacing === p.id
                  ? 'bg-blue-500/20 border-blue-500/40 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span className="text-2xl">{p.emoji}</span>
              <span className="font-semibold text-sm">{p.label}</span>
              <span className="text-xs text-slate-500">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepInterests({ form, toggleInterest }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-title">What excites you? ✨</h2>
        <p className="text-slate-400 text-sm">Pick all that apply — the more you choose, the better the itinerary.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {INTERESTS_OPTIONS.map(({ label, emoji }) => {
          const selected = form.interests.includes(label)
          return (
            <button
              key={label}
              onClick={() => toggleInterest(label)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all ${
                selected
                  ? 'bg-blue-500/20 border-blue-500/40 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <span>{emoji}</span>
              {label}
              {selected && <Check size={13} className="text-blue-400" />}
            </button>
          )
        })}
      </div>
      {form.interests.length > 0 && (
        <p className="text-xs text-slate-500">{form.interests.length} interest{form.interests.length > 1 ? 's' : ''} selected</p>
      )}
    </div>
  )
}

function StepReview({ form, numDays, generating, onGenerate }) {
  const days = numDays()

  const summaryItems = [
    { label: 'Destination', value: form.destination || '—', emoji: '📍' },
    { label: 'Dates', value: form.start_date && form.end_date ? `${form.start_date} → ${form.end_date} (${days}d)` : '—', emoji: '📅' },
    { label: 'Travelers', value: `${form.traveler_type} · ${form.group_size} ${form.group_size === 1 ? 'person' : 'people'}`, emoji: '👥' },
    { label: 'Budget', value: `${form.budget_tier}${form.budget_cap ? ` · ${form.currency} ${form.budget_cap}` : ''}`, emoji: '💰' },
    { label: 'Pacing', value: form.pacing, emoji: '⏱️' },
    { label: 'Interests', value: form.interests.join(', ') || '—', emoji: '❤️' },
  ]

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl"
        >
          🌍
        </motion.div>
        <div className="text-center">
          <p className="text-white font-bold text-xl mb-2">Crafting your personalized itinerary...</p>
          <p className="text-slate-400 text-sm">Our AI is building your perfect trip plan ✨</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-title">Review Your Trip 🎯</h2>
        <p className="text-slate-400 text-sm">Everything looks good? Let's generate your itinerary.</p>
      </div>

      <div className="bg-white/5 rounded-2xl p-5 space-y-3">
        {summaryItems.map(({ label, value, emoji }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="text-base w-6 text-center">{emoji}</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 block">{label}</span>
              <span className="text-sm text-white capitalize">{value}</span>
            </div>
          </div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onGenerate}
        className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-500 hover:via-purple-500 hover:to-blue-600 text-white font-bold rounded-2xl transition-all text-lg shadow-xl shadow-blue-900/30 flex items-center justify-center gap-3"
      >
        <Sparkles size={20} />
        Generate with AI ✨
      </motion.button>
    </div>
  )
}
