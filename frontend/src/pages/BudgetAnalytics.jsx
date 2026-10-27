import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, MapPin, Users, Wallet } from 'lucide-react'
import { useApp } from '../context/AppContext'

const COLORS = ['blue', 'green', 'purple', 'orange', 'red', 'cyan']
const COLOR_CSS = {
  blue: ['#3b82f6', 'bg-blue-500', 'text-blue-400'],
  green: ['#22c55e', 'bg-green-500', 'text-green-400'],
  purple: ['#a855f7', 'bg-purple-500', 'text-purple-400'],
  orange: ['#f97316', 'bg-orange-500', 'text-orange-400'],
  red: ['#ef4444', 'bg-red-500', 'text-red-400'],
  cyan: ['#06b6d4', 'bg-cyan-500', 'text-cyan-400'],
}

export default function BudgetAnalytics() {
  const { savedTrips } = useApp()
  const navigate = useNavigate()

  const totalSpend = savedTrips.reduce((s, t) => s + (t.total_cost || 0), 0)

  // Budget by tier
  const tierData = useMemo(() => {
    const map = {}
    savedTrips.forEach(t => {
      const tier = t.budget_tier || 'moderate'
      map[tier] = (map[tier] || 0) + (t.total_cost || 0)
    })
    return Object.entries(map).map(([tier, amount], i) => ({
      tier,
      amount,
      pct: totalSpend > 0 ? (amount / totalSpend) * 100 : 0,
      color: COLORS[i % COLORS.length],
    }))
  }, [savedTrips, totalSpend])

  // Avg cost by traveler type
  const travelerData = useMemo(() => {
    const map = {}
    savedTrips.forEach(t => {
      const type = t.traveler_type || 'solo'
      if (!map[type]) map[type] = { total: 0, count: 0 }
      map[type].total += (t.total_cost || 0)
      map[type].count += 1
    })
    return Object.entries(map).map(([type, { total, count }], i) => ({
      type,
      avg: Math.round(total / count),
      count,
      color: COLORS[i % COLORS.length],
    }))
  }, [savedTrips])

  // Destination frequency
  const destData = useMemo(() => {
    const map = {}
    savedTrips.forEach(t => {
      const dest = t.destination || 'Unknown'
      map[dest] = (map[dest] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([dest, count], i) => ({ dest, count, color: COLORS[i % COLORS.length] }))
  }, [savedTrips])

  // Build conic-gradient for donut
  const donutGradient = useMemo(() => {
    if (!tierData.length) return 'conic-gradient(rgba(255,255,255,0.1) 0% 100%)'
    let acc = 0
    const stops = tierData.map(({ pct, color }) => {
      const start = acc
      acc += pct
      return `${COLOR_CSS[color]?.[0] || '#3b82f6'} ${start.toFixed(1)}% ${acc.toFixed(1)}%`
    })
    return `conic-gradient(${stops.join(', ')})`
  }, [tierData])

  if (!savedTrips.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6"
      >
        <div className="text-6xl">📊</div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">No data yet</h2>
          <p className="text-slate-400 mb-6">Save some trips to see your budget analytics.</p>
        </div>
        <button onClick={() => navigate('/builder')} className="btn-primary">
          Plan a Trip
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="section-title text-2xl">Budget Analytics</h2>
        <p className="text-slate-400 text-sm">Insights across {savedTrips.length} saved {savedTrips.length === 1 ? 'trip' : 'trips'}</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Spent', value: `$${totalSpend.toLocaleString()}`, icon: Wallet, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Trips Analyzed', value: savedTrips.length, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Avg per Trip', value: `$${savedTrips.length ? Math.round(totalSpend / savedTrips.length).toLocaleString() : 0}`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
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

      {/* Donut chart + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-bold text-white mb-6">Budget Distribution by Tier</h3>
          <div className="flex items-center gap-8">
            {/* Donut */}
            <div className="relative shrink-0">
              <div
                className="w-36 h-36 rounded-full"
                style={{ background: donutGradient }}
              />
              <div className="absolute inset-4 rounded-full bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">${totalSpend.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">total</div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3 flex-1">
              {tierData.map(({ tier, amount, pct, color }) => (
                <div key={tier} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${COLOR_CSS[color]?.[1]} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 capitalize">{tier}</span>
                      <span className="text-white font-semibold">${amount.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full mt-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1 }}
                        className={`h-full rounded-full ${COLOR_CSS[color]?.[1]}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Avg cost by traveler type */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-white mb-6">Average Cost by Traveler Type</h3>
          <div className="space-y-5">
            {travelerData.length === 0 ? (
              <p className="text-slate-500 text-sm">No data</p>
            ) : (
              travelerData.map(({ type, avg, count, color }) => {
                const maxAvg = Math.max(...travelerData.map(d => d.avg), 1)
                return (
                  <div key={type} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 capitalize flex items-center gap-2">
                        <Users size={13} className="text-slate-500" />
                        {type} ({count} {count === 1 ? 'trip' : 'trips'})
                      </span>
                      <span className={`font-bold ${COLOR_CSS[color]?.[2]}`}>${avg.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(avg / maxAvg) * 100}%` }}
                        transition={{ duration: 1 }}
                        className={`h-full rounded-full ${COLOR_CSS[color]?.[1]}`}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Destination frequency */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-white mb-5">Destination Frequency</h3>
        {destData.length === 0 ? (
          <p className="text-slate-500 text-sm">No destinations tracked yet.</p>
        ) : (
          <div className="space-y-3">
            {destData.map(({ dest, count, color }, i) => {
              const maxCount = destData[0].count
              return (
                <div key={dest} className="flex items-center gap-4">
                  <span className="text-slate-500 text-xs w-4">{i + 1}</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="text-white text-sm font-medium truncate">{dest}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxCount) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        className={`h-full rounded-full ${COLOR_CSS[color]?.[1]}`}
                      />
                    </div>
                    <span className="text-slate-400 text-xs w-8 text-right">{count}x</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
