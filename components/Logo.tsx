'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
      {/* Colorful PDF Icon */}
      <motion.div
        initial={{ rotate: -10, scale: 0.9 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(255, 75, 43, 0.25)',
          position: 'relative',
        }}
      >
        <FileText color="white" size={32} strokeWidth={2.5} />
        {/* PDF label badge */}
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '-5%',
          background: '#fff',
          color: '#ff416c',
          fontSize: '10px',
          fontWeight: 900,
          padding: '2px 4px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
        }}>
          PDF
        </div>
      </motion.div>

      {/* Text Branding */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h1 style={{
          fontSize: '2.4rem',
          fontWeight: 800,
          margin: 0,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(to right, var(--ink), #555)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}>
          PDF<span style={{ color: '#ff416c', WebkitTextFillColor: '#ff416c' }}>Tools</span>
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '4px',
          opacity: 0.8,
        }}>
          <span style={{
            fontSize: '0.82rem',
            fontWeight: 500,
            color: 'var(--ink-3)',
            letterSpacing: '0.02em',
          }}>
            by
          </span>
          <a
            href="https://maybesurya.dev"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--blue)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            MaybeSurya.dev
          </a>
        </div>
      </div>
    </div>
  )
}
