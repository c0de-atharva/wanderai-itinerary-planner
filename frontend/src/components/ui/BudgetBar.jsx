import React from 'react'
import { motion } from 'framer-motion'

export default function BudgetBar({ label, amount, total, color = 'blue', icon }) {
  const pct = total > 0 ? Math.min((amount / total) * 100, 100) : 0

  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400 flex items-center gap-1.5">
          {icon && <span>{icon}</span>}
          {label}
        </span>
        <span className="text-white font-semibold">${amount.toFixed(0)}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${colorMap[color] || colorMap.blue}`}
        />
      </div>
      <div className="text-xs text-slate-500">{pct.toFixed(0)}% of total</div>
    </div>
  )
}
