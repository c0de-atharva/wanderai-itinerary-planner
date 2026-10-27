import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getHealth } from '../services/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [savedTrips, setSavedTrips] = useState(() => {
    try {
      const stored = localStorage.getItem('wanderai_trips')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [currentItinerary, setCurrentItinerary] = useState(null)
  const [appMode, setAppMode] = useState('demo')
  const [isLoading, setIsLoading] = useState(false)
  const [toasts, setToasts] = useState([])

  // Persist trips to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wanderai_trips', JSON.stringify(savedTrips))
    } catch (e) {
      console.error('Failed to persist trips:', e)
    }
  }, [savedTrips])

  // Health check on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await getHealth()
        setAppMode('live')
      } catch {
        setAppMode('demo')
      }
    }
    checkHealth()
  }, [])

  const saveTrip = useCallback((tripData) => {
    const trip = {
      ...tripData,
      id: tripData.id || `trip_${Date.now()}`,
      savedAt: new Date().toISOString(),
    }
    setSavedTrips(prev => {
      const exists = prev.findIndex(t => t.id === trip.id)
      if (exists >= 0) {
        const updated = [...prev]
        updated[exists] = trip
        return updated
      }
      return [trip, ...prev]
    })
    return trip
  }, [])

  const deleteTrip = useCallback((tripId) => {
    setSavedTrips(prev => prev.filter(t => t.id !== tripId))
  }, [])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const value = {
    savedTrips,
    currentItinerary,
    appMode,
    isLoading,
    toasts,
    setCurrentItinerary,
    setAppMode,
    setIsLoading,
    saveTrip,
    deleteTrip,
    addToast,
    removeToast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
