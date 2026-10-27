import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Toast from './components/ui/Toast'
import Dashboard from './pages/Dashboard'
import TripBuilder from './pages/TripBuilder'
import ItineraryView from './pages/ItineraryView'
import SavedTrips from './pages/SavedTrips'
import BudgetAnalytics from './pages/BudgetAnalytics'

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/builder" element={<TripBuilder />} />
              <Route path="/itinerary/:id" element={<ItineraryView />} />
              <Route path="/trips" element={<SavedTrips />} />
              <Route path="/analytics" element={<BudgetAnalytics />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      <Toast />
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">🧭</div>
      <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
      <p className="text-slate-400">Looks like this route doesn't exist.</p>
    </div>
  )
}
