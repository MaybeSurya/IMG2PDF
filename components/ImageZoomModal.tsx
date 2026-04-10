'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Crop, Trash2 } from 'lucide-react'

interface Props {
  images: any[]
  index: number
  onClose: () => void
  onNavigate: (newIndex: number) => void
  onCrop: (index: number) => void
  onDelete: (index: number) => void
}

function formatBytes(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageZoomModal({ images, index, onClose, onNavigate, onCrop, onDelete }: Props) {
  const img = images[index]
  const hasPrev = index > 0
  const hasNext = index < images.length - 1

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(index - 1)
      if (e.key === 'ArrowRight' && hasNext) onNavigate(index + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [index, hasPrev, hasNext])

  const getStyle = (img: any) => ({
    transform: [
      img.rotation ? `rotate(${img.rotation}deg)` : '',
      img.flipH ? 'scaleX(-1)' : '',
    ].filter(Boolean).join(' ') || undefined,
    filter: [
      img.brightness !== 100 ? `brightness(${img.brightness / 100})` : '',
      img.contrast !== 100 ? `contrast(${img.contrast / 100})` : '',
    ].filter(Boolean).join(' ') || undefined,
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Modal card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--r-xl)',
          overflow: 'hidden',
          maxWidth: 900,
          maxHeight: '90vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--glass-border)',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>
              {img.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)', marginTop: 2 }}>
              Page {index + 1} of {images.length}
              {img.size ? ` · ${formatBytes(img.size)}` : ''}
              {img.rotation ? ` · ${img.rotation}° rotated` : ''}
              {img.flipH ? ' · Mirrored' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '7px 14px', fontSize: '0.83rem' }}
              onClick={() => { onCrop(index); onClose() }}
            >
              <Crop size={14} />
              Crop
            </button>
            <button
              className="btn btn-danger"
              style={{ padding: '7px 14px', fontSize: '0.83rem' }}
              onClick={() => { onDelete(index); onClose() }}
            >
              <Trash2 size={14} />
              Remove
            </button>
            <button className="btn-icon" onClick={onClose} title="Close (Esc)">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Image area */}
        <div style={{
          flex: 1, overflow: 'hidden', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative', background: 'var(--bg-secondary)',
          minHeight: 300,
        }}>
          <img
            src={img.data}
            alt={img.name}
            style={{
              maxWidth: '100%', maxHeight: '70vh',
              objectFit: 'contain',
              ...getStyle(img),
            }}
          />

          {/* Prev / Next arrows */}
          {hasPrev && (
            <button
              className="btn-icon"
              onClick={() => onNavigate(index - 1)}
              style={{
                position: 'absolute', left: 16,
                width: 42, height: 42,
                background: 'rgba(0,0,0,0.45)', color: '#fff',
                border: 'none', backdropFilter: 'blur(8px)',
              }}
              title="Previous (←)"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {hasNext && (
            <button
              className="btn-icon"
              onClick={() => onNavigate(index + 1)}
              style={{
                position: 'absolute', right: 16,
                width: 42, height: 42,
                background: 'rgba(0,0,0,0.45)', color: '#fff',
                border: 'none', backdropFilter: 'blur(8px)',
              }}
              title="Next (→)"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Filmstrip thumbnails */}
        {images.length > 1 && (
          <div style={{
            display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--bg)',
          }}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => onNavigate(i)}
                style={{
                  flexShrink: 0, width: 52, height: 52,
                  borderRadius: 'var(--r-sm)',
                  overflow: 'hidden', border: 'none', padding: 0, cursor: 'pointer',
                  outline: i === index ? '2px solid var(--blue)' : '2px solid transparent',
                  outlineOffset: 1,
                  transition: 'outline 0.15s',
                  background: 'var(--bg-secondary)',
                }}
              >
                <img src={img.data} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
