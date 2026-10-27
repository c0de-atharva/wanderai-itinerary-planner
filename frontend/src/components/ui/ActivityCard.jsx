import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Pencil, Trash2, Train, Check, X } from 'lucide-react'

const categoryStyles = {
  'Attraction': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Dining': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Transit': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'Accommodation': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Free Time': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

export default function ActivityCard({ activity, groupSize = 1, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(activity.title)
  const [editCost, setEditCost] = useState(activity.cost || 0)

  const catStyle = categoryStyles[activity.category] || categoryStyles['Attraction']
  const totalCost = Number(editCost)
  const perPerson = groupSize > 1 ? (totalCost / groupSize).toFixed(2) : null

  const handleSave = () => {
    onEdit?.({ ...activity, title: editTitle, cost: Number(editCost) })
    setEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(activity.title)
    setEditCost(activity.cost || 0)
    setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category + Time */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`pill-tag ${catStyle}`}>{activity.category}</span>
            {activity.time && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={11} />
                {activity.time}
                {activity.duration && ` · ${activity.duration}`}
              </span>
            )}
          </div>

          {/* Title */}
          {editing ? (
            <input
              className="input-field text-sm mb-2"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
            />
          ) : (
            <h4 className="font-semibold text-white text-sm mb-1 leading-snug">{activity.title}</h4>
          )}

          {/* Location */}
          {activity.location && (
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
              <MapPin size={11} />
              {activity.location}
            </div>
          )}

          {/* Description */}
          {activity.description && !editing && (
            <p className="text-xs text-slate-400 leading-relaxed mb-2">{activity.description}</p>
          )}

          {/* Transit tip */}
          {activity.transit_tip && (
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 mt-2">
              <Train size={12} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400">{activity.transit_tip}</span>
            </div>
          )}
        </div>

        {/* Edit / Delete */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30">
                <Check size={13} />
              </button>
              <button onClick={handleCancel} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                <X size={13} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10">
                <Pencil size={13} />
              </button>
              {onDelete && (
                <button onClick={() => onDelete(activity.id)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                  <Trash2 size={13} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cost */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Cost $</span>
            <input
              type="number"
              className="w-24 bg-white/5 border border-white/20 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={editCost}
              onChange={e => setEditCost(e.target.value)}
            />
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-300">
            ${totalCost.toFixed(2)} total
            {perPerson && <span className="text-slate-500 font-normal ml-1">(~${perPerson}/person)</span>}
          </span>
        )}
      </div>
    </motion.div>
  )
}
