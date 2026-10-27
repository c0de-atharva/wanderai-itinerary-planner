import React from 'react'
import { motion } from 'framer-motion'

export default function LoadingSpinner({ text = 'Loading...', size = 'md' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <motion.div
          className={`${sizes[size]} rounded-full border-2 border-blue-500/30 border-t-blue-500`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        {size === 'lg' && (
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            🌍
          </div>
        )}
      </div>
      {text && (
        <p className="text-slate-400 text-sm font-medium">{text}</p>
      )}
    </div>
  )
}
