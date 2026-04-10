'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImagePlus, ChevronDown, ChevronUp, Plus, Clipboard, FolderOpen } from 'lucide-react'

interface Props {
  onImagesSelected: (images: any[]) => void
  isExpanded: boolean
  onToggleExpand: () => void
  imageCount: number
}

export default function ImageUploader({ onImagesSelected, isExpanded, onToggleExpand, imageCount }: Props) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pasteSupported, setPasteSupported] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPasteSupported(typeof navigator !== 'undefined' && !!navigator.clipboard)

    const handlePaste = async (e: ClipboardEvent) => {
      if (!isExpanded) return
      const items = Array.from(e.clipboardData?.items ?? [])
      const imageItems = items.filter(i => i.type.startsWith('image/'))
      if (!imageItems.length) return
      const files = imageItems.map(i => i.getAsFile()).filter(Boolean) as File[]
      if (files.length) processFiles(files)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isExpanded])

  const processFiles = async (files: FileList | File[]) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imgs.length) return

    setIsProcessing(true)
    const loaded = await Promise.all(imgs.map(f =>
      new Promise<any>(resolve => {
        const r = new FileReader()
        r.onload = e => resolve({
          name: f.name, data: e.target?.result, type: f.type,
          size: f.size,
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

  const handlePasteClick = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const item of clipboardItems) {
        const imageType = item.types.find(t => t.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], `pasted-${Date.now()}.png`, { type: imageType })
          processFiles([file])
          return
        }
      }
    } catch {
      // Clipboard API might be blocked; silently fail
    }
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
                style={{
                  margin: 20,
                  border: isDragOver ? '2px dashed var(--blue)' : '1.5px dashed var(--ink-4)',
                  background: isDragOver ? 'rgba(0,113,227,0.04)' : undefined,
                  transition: 'all 0.2s var(--ease)',
                }}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
              >
                <AnimatePresence mode="wait">
                  {isProcessing
                    ? <motion.div key="spin" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <div className="spinner" style={{ color: 'var(--blue)' }}>
                          <ImagePlus size={44} strokeWidth={1.2} />
                        </div>
                      </motion.div>
                    : <motion.div key="icon" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <ImagePlus size={44} strokeWidth={1} color={isDragOver ? 'var(--blue)' : 'var(--ink-3)'} />
                      </motion.div>
                  }
                </AnimatePresence>

                <div>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem', color: isDragOver ? 'var(--blue)' : 'var(--ink)', marginBottom: 6 }}>
                    {isDragOver ? 'Drop images here' : 'Add images to convert'}
                  </p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-3)', marginBottom: 4 }}>
                    PNG, JPG, WEBP, HEIC, GIF — any image format
                  </p>
                  {pasteSupported && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--ink-4)', marginTop: 2 }}>
                      You can also paste from clipboard with <kbd style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.75rem' }}>Ctrl+V</kbd>
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '10px 20px', pointerEvents: 'auto' }}
                    onClick={() => fileRef.current?.click()}
                  >
                    <FolderOpen size={16} />
                    Browse Files
                  </button>
                  {pasteSupported && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '10px 20px', pointerEvents: 'auto' }}
                      onClick={handlePasteClick}
                    >
                      <Clipboard size={16} />
                      Paste Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileRef} type="file" multiple accept="image/*" onChange={e => e.target.files && processFiles(e.target.files)} hidden />
    </div>
  )
}
