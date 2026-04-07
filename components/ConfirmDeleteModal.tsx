'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface Props {
  count: number
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDeleteModal({ count, onConfirm, onCancel }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: '28px 28px 24px',
          width: '100%', maxWidth: 380,
          boxShadow: '0 24px 56px rgba(0,0,0,0.22)',
          textAlign: 'center'
        }}
      >
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(255,59,48,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <AlertTriangle size={24} color="var(--danger)" />
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8 }}>
          Clear all images?
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 24 }}>
          This will permanently remove all {count} image{count !== 1 ? 's' : ''} from the queue.
          This action cannot be undone.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={onCancel}
          >
            <X size={14} /> Cancel
          </button>
          <button
            className="btn btn-danger"
            style={{ flex: 1, background: 'var(--danger)', color: '#fff', borderColor: 'transparent' }}
            onClick={onConfirm}
          >
            <Trash2 size={14} /> Clear All
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
