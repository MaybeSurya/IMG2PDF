'use client'

import { motion } from 'framer-motion'
import { FileCheck2 } from 'lucide-react'

interface Props {
  percent: number
  text: string
}

export default function ProgressBar({ percent, text }: Props) {
  const done = percent >= 100

  return (
    <div className="glass-elevated" style={{ padding: '36px 44px', textAlign: 'center', minWidth: 340, maxWidth: 460 }}>
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ marginBottom: 20 }}
      >
        {done ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(52,199,89,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 4px'
            }}
          >
            <FileCheck2 size={28} color="var(--success)" strokeWidth={1.8} />
          </motion.div>
        ) : (
          <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto' }}>
            {/* Outer ring spinner */}
            <svg width="56" height="56" style={{ position: 'absolute', top: 0, left: 0 }}>
              <circle cx="28" cy="28" r="24" stroke="var(--bg-tertiary)" strokeWidth="3.5" fill="none" />
              <motion.circle
                cx="28" cy="28" r="24"
                stroke="var(--blue)" strokeWidth="3.5" fill="none"
                strokeLinecap="round"
                strokeDasharray="150.8"
                strokeDashoffset={150.8 - (percent / 100) * 150.8}
                style={{ transformOrigin: '28px 28px', rotate: -90 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </svg>
            {/* Percent text */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: 'var(--blue)'
            }}>
              {Math.round(percent)}
            </div>
          </div>
        )}
      </motion.div>

      {/* Title */}
      <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)', marginBottom: 6 }}>
        {done ? 'PDF Ready!' : 'Creating PDF'}
      </p>

      {/* Linear bar */}
      {!done && (
        <div className="progress-bar" style={{ margin: '14px 0 10px' }}>
          <motion.div
            className="progress-fill"
            style={{ width: `${percent}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Status text */}
      <motion.p
        key={text}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: '0.84rem', color: 'var(--ink-3)', marginTop: done ? 8 : 0 }}
      >
        {text || (done ? 'Your file is downloading…' : 'Processing images…')}
      </motion.p>
    </div>
  )
}
