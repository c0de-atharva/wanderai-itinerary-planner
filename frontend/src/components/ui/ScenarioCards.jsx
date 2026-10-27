import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const SCENARIOS = [
  {
    label: 'Solo Weekend Getaway',
    icon: '🎒',
    description: 'Quick Goa escape on a budget',
    color: 'from-blue-600/20 to-blue-800/10 border-blue-500/30',
    data: {
      destination: 'Goa, India',
      start_date: '2025-03-15',
      end_date: '2025-03-17',
      traveler_type: 'solo',
      group_size: 1,
      budget_tier: 'economy',
      budget_cap: 300,
      currency: 'USD',
      pacing: 'fast',
      interests: ['Food & Culinary', 'History & Culture', 'Offbeat/Hidden Gems'],
    },
  },
  {
    label: "Couple's Romantic Retreat",
    icon: '💕',
    description: 'Santorini luxury getaway for two',
    color: 'from-pink-600/20 to-purple-800/10 border-pink-500/30',
    data: {
      destination: 'Santorini, Greece',
      start_date: '2025-06-10',
      end_date: '2025-06-15',
      traveler_type: 'couple',
      group_size: 2,
      budget_tier: 'luxury',
      budget_cap: 3000,
      currency: 'USD',
      pacing: 'relaxed',
      interests: ['Nature & Scenic', 'Food & Culinary', 'Offbeat/Hidden Gems'],
    },
  },
  {
    label: 'Group Adventure',
    icon: '🏕️',
    description: 'Manali mountains with friends',
    color: 'from-green-600/20 to-teal-800/10 border-green-500/30',
    data: {
      destination: 'Manali, India',
      start_date: '2025-07-01',
      end_date: '2025-07-07',
      traveler_type: 'friends',
      group_size: 5,
      budget_tier: 'moderate',
      budget_cap: 2000,
      currency: 'USD',
      pacing: 'balanced',
      interests: ['Adventure', 'Nature & Scenic', 'Nightlife', 'Food & Culinary'],
    },
  },
]

export default function ScenarioCards({ onSelect }) {
  const navigate = useNavigate()

  const handleSelect = (scenario) => {
    if (onSelect) {
      onSelect(scenario.data)
    } else {
      navigate('/builder', { state: { scenario: scenario.data, jumpToReview: true } })
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {SCENARIOS.map((s, i) => (
        <motion.button
          key={s.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelect(s)}
          className={`text-left p-4 rounded-2xl bg-gradient-to-br border ${s.color} transition-all duration-200 group`}
        >
          <div className="text-2xl mb-2">{s.icon}</div>
          <div className="font-semibold text-white text-sm mb-1">{s.label}</div>
          <div className="text-xs text-slate-400 mb-3">{s.description}</div>
          <div className="flex items-center gap-1 text-xs text-blue-400 font-medium group-hover:gap-2 transition-all">
            Try This <ArrowRight size={12} />
          </div>
        </motion.button>
      ))}
    </div>
  )
}

export { SCENARIOS }
