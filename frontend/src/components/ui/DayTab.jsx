import React from 'react'
import { motion } from 'framer-motion'

export default function DayTab({ day, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'text-white'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeDay"
          className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-xl"
        />
      )}
      <span className="relative z-10">{label || `Day ${day}`}</span>
    </button>
  )
}
