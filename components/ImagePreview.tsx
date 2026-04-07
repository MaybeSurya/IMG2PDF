'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Check, Crop } from 'lucide-react'

interface Props {
  images: any[]
  selectedImages: Set<number>
  onToggleSelect: (index: number) => void
  onDeleteImage: (index: number) => void
  onCropImage: (index: number) => void
}

export default function ImagePreview({ images, selectedImages, onToggleSelect, onDeleteImage, onCropImage }: Props) {
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

  // Double-tap detection
  let lastTap = 0

  const handleTap = (e: React.MouseEvent | React.TouchEvent, i: number) => {
    const now = Date.now()
    if (now - lastTap < 300) {
      e.preventDefault()
      onCropImage(i)
      lastTap = 0
    } else {
      lastTap = now
      onToggleSelect(i)
    }
  }

  return (
    <div className="preview-grid">
      <AnimatePresence>
        {images.map((img, i) => (
          <motion.div
            layout
            key={`${img.name}-${i}`}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.18 } }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`preview-item${selectedImages.has(i) ? ' selected' : ''}`}
            onClick={e => handleTap(e, i)}
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
                  className="preview-item-check"
                >
                  <Check size={11} strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Page number */}
            <div className="preview-item-num">{i + 1}</div>

            {/* Hover actions */}
            <div className="preview-item-actions">
              <button
                className="btn-icon"
                style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', backdropFilter: 'none' }}
                onClick={e => { e.stopPropagation(); onCropImage(i) }}
                title="Crop"
              >
                <Crop size={12} />
              </button>
              <button
                className="btn-icon"
                style={{ width: 28, height: 28, background: 'rgba(255,59,48,0.85)', color: '#fff', border: 'none', backdropFilter: 'none' }}
                onClick={e => { e.stopPropagation(); onDeleteImage(i) }}
                title="Remove"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Double-tap hint for mobile */}
            <div className="preview-dbl-hint">Double-tap to crop</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
