'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Trash2, Check, Crop, GripVertical, ZoomIn, ChevronLeft, ChevronRight, Copy } from 'lucide-react'

interface Props {
  images: any[]
  selectedImages: Set<number>
  onToggleSelect: (index: number) => void
  onDeleteImage: (index: number) => void
  onCropImage: (index: number) => void
  onReorder: (newImages: any[]) => void
  onZoom: (index: number) => void
  onMove: (from: number, to: number) => void
  onDuplicate: (index: number) => void
}

function formatBytes(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImagePreview({
  images, selectedImages, onToggleSelect, onDeleteImage,
  onCropImage, onReorder, onZoom, onMove, onDuplicate
}: Props) {
  const lastTapRef = useRef(0)

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

  const handleTap = (e: React.MouseEvent | React.TouchEvent, i: number) => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      e.preventDefault()
      onZoom(i)
      lastTapRef.current = 0
    } else {
      lastTapRef.current = now
      onToggleSelect(i)
    }
  }

  return (
    <div>
      {images.length > 1 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--ink-4)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <GripVertical size={12} />
          Drag to reorder · Click to select · Double-click to preview
        </p>
      )}
      <Reorder.Group
        axis="x"
        values={images}
        onReorder={onReorder}
        className="preview-grid"
        style={{ listStyle: 'none', padding: 0 }}
        as="div"
      >
        <AnimatePresence>
          {images.map((img, i) => (
            <Reorder.Item
              key={img._id ?? (img.name + '-' + i)}
              value={img}
              as="div"
              whileDrag={{ scale: 1.06, zIndex: 100, boxShadow: '0 20px 56px rgba(0,0,0,0.22)', cursor: 'grabbing' }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.18 } }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`preview-item${selectedImages.has(i) ? ' selected' : ''}`}
              onClick={e => handleTap(e, i)}
              style={{
                position: 'relative',
                border: selectedImages.has(i) ? '3px solid var(--blue)' : '2px solid var(--glass-border)',
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
                transition: 'all 0.2s var(--ease)',
              }}
            >
              <img src={img.data} alt={img.name} style={getStyle(img)} />

              {/* Selection check */}
              <AnimatePresence>
                {selectedImages.has(i) && (
                  <motion.div
                    key="check"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    style={{
                      position: 'absolute', top: 12, left: 12, zIndex: 10,
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--blue)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0, 113, 227, 0.4)',
                    }}
                  >
                    <Check size={18} strokeWidth={3.5} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Page number */}
              <div className="preview-item-num">{i + 1}</div>

              {/* File size badge */}
              {img.size && (
                <div style={{
                  position: 'absolute', bottom: 'var(--s-2)', right: 'var(--s-2)',
                  background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
                  color: '#fff', fontSize: '0.65rem', fontWeight: 600,
                  padding: '2px 6px', borderRadius: 'var(--r-xs)',
                }}>
                  {formatBytes(img.size)}
                </div>
              )}

              {/* Hover action bar */}
              <div className="preview-item-actions" style={{ flexDirection: 'column', gap: 4, top: 'var(--s-2)', right: 'var(--s-2)' }}>
                <button
                  className="btn-icon"
                  style={{ width: 26, height: 26, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', backdropFilter: 'none' }}
                  onClick={e => { e.stopPropagation(); onZoom(i) }}
                  title="Preview (double-click)"
                >
                  <ZoomIn size={11} />
                </button>
                <button
                  className="btn-icon"
                  style={{ width: 26, height: 26, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', backdropFilter: 'none' }}
                  onClick={e => { e.stopPropagation(); onCropImage(i) }}
                  title="Crop"
                >
                  <Crop size={11} />
                </button>
                <button
                  className="btn-icon"
                  style={{ width: 26, height: 26, background: 'rgba(80,80,220,0.75)', color: '#fff', border: 'none', backdropFilter: 'none' }}
                  onClick={e => { e.stopPropagation(); onDuplicate(i) }}
                  title="Duplicate page"
                >
                  <Copy size={11} />
                </button>
                <button
                  className="btn-icon"
                  style={{ width: 26, height: 26, background: 'rgba(255,59,48,0.85)', color: '#fff', border: 'none', backdropFilter: 'none' }}
                  onClick={e => { e.stopPropagation(); onDeleteImage(i) }}
                  title="Remove"
                >
                  <Trash2 size={11} />
                </button>
              </div>

              {/* Move arrows (bottom center, visible on touch/hover) */}
              {images.length > 1 && (
                <div style={{
                  position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', gap: 6, opacity: 0, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }} className="move-arrows">
                  {i > 0 && (
                    <button
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: 'rgba(0,0,0,0.7)', color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      }}
                      onClick={e => { e.stopPropagation(); onMove(i, i - 1) }}
                      title="Move left"
                    >
                      <ChevronLeft size={16} strokeWidth={2.5} />
                    </button>
                  )}
                  {i < images.length - 1 && (
                    <button
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: 'rgba(0,0,0,0.7)', color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      }}
                      onClick={e => { e.stopPropagation(); onMove(i, i + 1) }}
                      title="Move right"
                    >
                      <ChevronRight size={16} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              )}
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  )
}
