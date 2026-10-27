import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const iconMap = {
  success: { Icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  error: { Icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  info: { Icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
}

function ToastItem({ id, message, type }) {
  const { removeToast } = useApp()
  const { Icon, color, bg } = iconMap[type] || iconMap.info

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bg} backdrop-blur-sm shadow-xl max-w-sm`}
    >
      <Icon size={16} className={color} />
      <p className="text-sm text-white flex-1">{message}</p>
      <button onClick={() => removeToast(id)} className="text-slate-400 hover:text-white">
        <X size={14} />
      </button>
    </motion.div>
  )
}

export default function Toast() {
  const { toasts } = useApp()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} />
        ))}
      </AnimatePresence>
    </div>
  )
}
