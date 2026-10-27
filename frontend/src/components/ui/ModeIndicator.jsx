import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function ModeIndicator() {
  const { appMode } = useApp()
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
          appMode === 'live'
            ? 'bg-green-500/15 text-green-400 border border-green-500/25'
            : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
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
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 bg-slate-800 border border-white/10 rounded-xl p-3 text-xs text-slate-300 shadow-xl z-50">
          {appMode === 'live'
            ? 'Connected to AI backend — real-time GPT-4 generation.'
            : 'Backend offline — using demo data to showcase the UI.'}
        </div>
      )}
    </div>
  )
}
