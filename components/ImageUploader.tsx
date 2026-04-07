'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImagePlus, ChevronDown, ChevronUp, Plus } from 'lucide-react'

interface Props {
  onImagesSelected: (images: any[]) => void
  isExpanded: boolean
  onToggleExpand: () => void
  imageCount: number
}

export default function ImageUploader({ onImagesSelected, isExpanded, onToggleExpand, imageCount }: Props) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const processFiles = async (files: FileList | File[]) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imgs.length) return

    setIsProcessing(true)
    const loaded = await Promise.all(imgs.map(f =>
      new Promise<any>(resolve => {
        const r = new FileReader()
        r.onload = e => resolve({
          name: f.name, data: e.target?.result, type: f.type,
          rotation: 0, flipH: false, brightness: 100, contrast: 100,
        })
        r.readAsDataURL(f)
      })
    ))
    onImagesSelected(loaded)
    setIsProcessing(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    processFiles(e.dataTransfer.files)
  }

  return (
    <div>
      {/* ── Compact bar (when collapsed) ─────────── */}
      <AnimatePresence initial={false}>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="compact-uploader" onClick={onToggleExpand}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ImagePlus size={18} color="var(--blue)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink-2)' }}>
                  {imageCount} image{imageCount !== 1 ? 's' : ''} added
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                  onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
                >
                  <Plus size={14} />
                  Add more
                </button>
                <ChevronDown size={18} color="var(--ink-3)" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full upload zone (when expanded) ─────── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className={`glass ${isDragOver ? 'dragover' : ''}`} style={{ overflow: 'hidden' }}>
              {/* Toggle button (only show when images exist) */}
              {imageCount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
                  <button className="btn btn-ghost" style={{ fontSize: '0.82rem', padding: '4px 10px' }} onClick={onToggleExpand}>
                    <ChevronUp size={14} />
                    Collapse
                  </button>
                </div>
              )}

              <div
                className="upload-box"
                style={{ margin: 20, border: isDragOver ? '1.5px dashed var(--blue)' : undefined }}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
              >
                <AnimatePresence mode="wait">
                  {isProcessing
                    ? <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="spinner" style={{ color: 'var(--blue)' }}>
                          <ImagePlus size={44} strokeWidth={1.2} />
                        </div>
                      </motion.div>
                    : <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ImagePlus size={44} strokeWidth={1} color={isDragOver ? 'var(--blue)' : 'var(--ink-3)'} />
                      </motion.div>
                  }
                </AnimatePresence>

                <div>
                  <p style={{ fontWeight: 600, fontSize: '1.05rem', color: isDragOver ? 'var(--blue)' : 'var(--ink)', marginBottom: 4 }}>
                    {isDragOver ? 'Drop to add images' : 'Select images'}
                  </p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-3)' }}>
                    Drag & drop or click to browse · PNG, JPG, WEBP, HEIC
                  </p>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ marginTop: 4, pointerEvents: 'none' }}
                  tabIndex={-1}
                >
                  Browse Files
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileRef} type="file" multiple accept="image/*" onChange={e => e.target.files && processFiles(e.target.files)} hidden />
    </div>
  )
}
