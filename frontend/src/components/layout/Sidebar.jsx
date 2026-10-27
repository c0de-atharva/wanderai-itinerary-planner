import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Sparkles, Map, BarChart3, Menu, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard', exact: true },
  { to: '/builder', icon: Sparkles, label: 'New Trip' },
  { to: '/trips', icon: Map, label: 'Saved Trips' },
  { to: '/analytics', icon: BarChart3, label: 'Budget Analytics' },
]

export default function Sidebar() {
  const { appMode } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-lg">
            ✈️
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              WanderAI
            </span>
            <p className="text-xs text-slate-500 leading-none mt-0.5">Travel Planner</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'} />
                <span className="font-medium text-sm">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Mode Badge */}
      <div className="px-4 py-5 border-t border-white/10">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
            appMode === 'live'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              appMode === 'live' ? 'bg-green-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          {appMode === 'live' ? '● Live AI' : '● Demo Mode'}
        </div>
        <p className="text-xs text-slate-600 mt-2 px-1">
          {appMode === 'live'
            ? 'Connected to AI backend'
            : 'Using demo data — start backend for live AI'}
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 border border-white/10 rounded-xl text-white"
        onClick={() => setMobileOpen(v => !v)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-900/80 backdrop-blur-md border-r border-white/10 fixed left-0 top-0 bottom-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-white/10 z-50 flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
