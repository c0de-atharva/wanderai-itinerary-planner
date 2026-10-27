import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const routeTitles = {
  '/': 'Dashboard',
  '/builder': 'Trip Builder',
  '/trips': 'Saved Trips',
  '/analytics': 'Budget Analytics',
}

export default function Header() {
  const location = useLocation()
  const { appMode } = useApp()
  const [showTooltip, setShowTooltip] = useState(false)

  const title = routeTitles[location.pathname] ||
    (location.pathname.startsWith('/itinerary') ? 'Your Itinerary' : 'WanderAI')

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      <h1 className="text-lg font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Date */}
        <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm">
          <Calendar size={14} />
          {dateStr}
        </div>

        {/* Mode toggle badge */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              appMode === 'live'
                ? 'bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                appMode === 'live' ? 'bg-green-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {appMode === 'live' ? 'Live AI' : 'Demo Mode'}
          </button>

          {showTooltip && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-white/10 rounded-xl p-3 text-xs text-slate-300 shadow-xl z-50">
              {appMode === 'live' ? (
                <>
                  <p className="font-semibold text-green-400 mb-1">🟢 Live AI Mode</p>
                  <p>Connected to AI backend. Itineraries are generated in real-time by GPT-4.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-amber-400 mb-1">🟡 Demo Mode</p>
                  <p>Backend not detected. Using realistic mock data so you can explore the UI.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
