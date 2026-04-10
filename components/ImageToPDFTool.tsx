'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Files } from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'
import ImagePreview from '@/components/ImagePreview'
import BatchEditor from '@/components/BatchEditor'
import PDFSettings from '@/components/PDFSettings'
import ProgressBar from '@/components/ProgressBar'
import CropModal from '@/components/CropModal'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'
import ImageZoomModal from '@/components/ImageZoomModal'
import { generatePDF } from '@/lib/pdfGenerator'
import styles from '../app/page.module.css'
import type { PDFOptions } from '../app/page'

type ToastType = 'success' | 'error' | 'info'

interface Props {
  toast: (type: ToastType, message: string, sub?: string) => void
}

export default function ImageToPDFTool({ toast }: Props) {
  const [images, setImages] = useState<any[]>([])
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set())
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, text: '' })
  const [uploaderExpanded, setUploaderExpanded] = useState(true)

  const totalSizeKB = images.reduce((acc: number, img: any) => acc + (img.size ?? 0), 0) / 1024
  const totalSizeText = totalSizeKB > 1024
    ? `${(totalSizeKB / 1024).toFixed(1)} MB`
    : totalSizeKB > 0 ? `${Math.round(totalSizeKB)} KB` : ''

  // Modals
  const [cropIndex, setCropIndex] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [zoomIndex, setZoomIndex] = useState<number | null>(null)

  const [pdfOptions, setPdfOptions] = useState<PDFOptions>({
    pageSize: 'a4',
    quality: 0.85,
    fileName: 'converted-pdf',
    orientation: 'portrait',
    margins: 'normal',
    addPageNumbers: false,
    pageNumberStyle: 'minimal',
    pageNumberSize: 9,
    includeWatermark: false,
  })

  // Auto-collapse uploader after adding images
  useEffect(() => {
    if (images.length > 0 && uploaderExpanded) {
      const timer = setTimeout(() => setUploaderExpanded(false), 700)
      return () => clearTimeout(timer)
    }
  }, [images.length])

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (zoomIndex !== null) return

      if (e.key === 'Escape') {
        setSelectedImages(new Set())
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setSelectedImages(new Set(images.map((_, i) => i)))
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedImages.size > 0) {
        const indices = [...selectedImages].sort((a, b) => b - a)
        setImages(prev => prev.filter((_, i) => !selectedImages.has(i)))
        setSelectedImages(new Set())
        toast('info', `Removed ${indices.length} image${indices.length !== 1 ? 's' : ''}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images, selectedImages, zoomIndex, toast])

  const handleImagesSelected = (newImages: any[]) => {
    const stamped = newImages.map((img, i) => ({ ...img, _id: `${Date.now()}-${i}` }))
    setImages(prev => [...prev, ...stamped])
    toast('success', `${newImages.length} image${newImages.length !== 1 ? 's' : ''} added`)
  }

  const handleReorder = (newImages: any[]) => {
    setImages(newImages)
    setSelectedImages(new Set())
  }

  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return
    setImages(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
    setSelectedImages(new Set())
  }

  const handleSort = (mode: 'name-asc' | 'name-desc' | 'size-asc' | 'size-desc' | 'reverse') => {
    setImages(prev => {
      const next = [...prev]
      switch (mode) {
        case 'name-asc':  next.sort((a, b) => a.name.localeCompare(b.name)); break
        case 'name-desc': next.sort((a, b) => b.name.localeCompare(a.name)); break
        case 'size-asc':  next.sort((a, b) => (a.size ?? 0) - (b.size ?? 0)); break
        case 'size-desc': next.sort((a, b) => (b.size ?? 0) - (a.size ?? 0)); break
        case 'reverse':   next.reverse(); break
      }
      return next
    })
    setSelectedImages(new Set())
    toast('info', 'Images sorted')
  }

  const handleDuplicate = (index: number) => {
    setImages(prev => {
      const next = [...prev]
      const copy = { ...next[index], _id: `${Date.now()}-dup` }
      next.splice(index + 1, 0, copy)
      return next
    })
    toast('success', 'Page duplicated')
  }

  const handleDuplicateSelected = () => {
    if (selectedImages.size === 0) {
      toast('error', 'No images selected')
      return
    }
    const indices = [...selectedImages].sort((a, b) => a - b)
    setImages(prev => {
      const next = [...prev]
      let offset = 0
      for (const i of indices) {
        const copy = { ...next[i + offset], _id: `${Date.now()}-dup-${i}` }
        next.splice(i + offset + 1, 0, copy)
        offset++
      }
      return next
    })
    setSelectedImages(new Set())
    toast('success', `Duplicated ${indices.length} image${indices.length !== 1 ? 's' : ''}`)
  }

  const handleDeleteImage = (index: number) => {
    const name = images[index]?.name ?? 'image'
    setImages(prev => prev.filter((_, i) => i !== index))
    setSelectedImages(prev => {
      const next = new Set<number>()
      prev.forEach(i => { if (i < index) next.add(i); else if (i > index) next.add(i - 1) })
      return next
    })
    if (zoomIndex === index) setZoomIndex(null)
    else if (zoomIndex !== null && zoomIndex > index) setZoomIndex(zoomIndex - 1)
    toast('info', `Removed "${name}"`)
  }

  const handleDeleteAll = () => {
    setImages([])
    setSelectedImages(new Set())
    setUploaderExpanded(true)
    setShowDeleteConfirm(false)
    setZoomIndex(null)
    toast('success', 'All images cleared', 'The queue is empty — add new images to start again')
  }

  const handleBatchEdit = (editType: string, value?: any) => {
    if (selectedImages.size === 0) {
      toast('error', 'No images selected', 'Tap images to select them first')
      return
    }
    const step = 15
    setImages(prev => prev.map((img, idx) => {
      if (!selectedImages.has(idx)) return img
      let n = { ...img }
      switch (editType) {
        case 'rotate90':      n.rotation = ((n.rotation || 0) + 90) % 360; break
        case 'rotate180':     n.rotation = ((n.rotation || 0) + 180) % 360; break
        case 'rotate270':     n.rotation = ((n.rotation || 0) + 270) % 360; break
        case 'flipH':         n.flipH = !n.flipH; break
        case 'brightnessUp':  n.brightness = Math.min(200, (n.brightness || 100) + step); break
        case 'brightnessDown':n.brightness = Math.max(0, (n.brightness || 100) - step); break
        case 'contrastUp':    n.contrast   = Math.min(200, (n.contrast || 100) + step); break
        case 'contrastDown':  n.contrast   = Math.max(0, (n.contrast || 100) - step); break
        case 'reset':         n = { ...n, rotation: 0, flipH: false, brightness: 100, contrast: 100 }; break
      }
      return n
    }))
  }

  const handleCropSelected = () => {
    if (selectedImages.size !== 1) return
    setCropIndex([...selectedImages][0])
  }

  const handleCropImage = (index: number) => {
    setCropIndex(index)
  }

  const handleCropSave = (croppedData: string) => {
    if (cropIndex === null) return
    setImages(prev => prev.map((img, i) => i === cropIndex ? { ...img, data: croppedData } : img))
    setCropIndex(null)
    toast('success', 'Image cropped')
  }

  const handleToggleSelect = (index: number) => {
    setSelectedImages(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedImages(prev =>
      prev.size === images.length
        ? new Set()
        : new Set(images.map((_, i) => i))
    )
  }

  const handleConvert = async () => {
    if (images.length === 0) {
      toast('error', 'No images to convert', 'Please add at least one image first')
      return
    }
    setIsConverting(true)
    setProgress({ percent: 0, text: 'Preparing…' })
    try {
      await generatePDF(images, pdfOptions, (percent, text) => setProgress({ percent, text }))
      toast('success', `PDF ready! ${images.length} page${images.length !== 1 ? 's' : ''}`, 'Your file is downloading now')
    } catch (err) {
      toast('error', 'Conversion failed', `${err}`)
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <>
      {/* Live stats bar moved here for component-level tracking */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'inline-flex', gap: 16, marginBottom: 24,
              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--r-pill)', padding: '8px 18px',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem', color: 'var(--ink-2)' }}>
              <Files size={14} color="var(--blue)" />
              <strong style={{ color: 'var(--ink)' }}>{images.length}</strong> image{images.length !== 1 ? 's' : ''}
            </div>
            {totalSizeText && (
              <>
                <div style={{ width: 1, height: 14, background: 'var(--ink-4)' }} />
                <div style={{ fontSize: '0.83rem', color: 'var(--ink-3)' }}>{totalSizeText} total</div>
              </>
            )}
            {selectedImages.size > 0 && (
              <>
                <div style={{ width: 1, height: 14, background: 'var(--ink-4)' }} />
                <div style={{ fontSize: '0.83rem', color: 'var(--blue)', fontWeight: 600 }}>
                  {selectedImages.size} selected
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.stack}>
        {/* Uploader */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ImageUploader
            onImagesSelected={handleImagesSelected}
            isExpanded={uploaderExpanded}
            onToggleExpand={() => setUploaderExpanded(x => !x)}
            imageCount={images.length}
          />
        </motion.section>

        {/* Image grid + batch editor */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.section
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <div className={`glass ${styles.section}`}>
                <BatchEditor
                  selectedCount={selectedImages.size}
                  totalCount={images.length}
                  onSelectAll={handleSelectAll}
                  onApplyEdit={handleBatchEdit}
                  onDeleteAll={() => setShowDeleteConfirm(true)}
                  onCropSelected={handleCropSelected}
                  onSort={handleSort}
                  onDuplicateSelected={handleDuplicateSelected}
                />
                <ImagePreview
                  images={images}
                  selectedImages={selectedImages}
                  onToggleSelect={handleToggleSelect}
                  onDeleteImage={handleDeleteImage}
                  onCropImage={handleCropImage}
                  onReorder={handleReorder}
                  onZoom={setZoomIndex}
                  onMove={handleMove}
                  onDuplicate={handleDuplicate}
                />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* PDF Settings */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.section
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <div className={`glass ${styles.section}`}>
                <PDFSettings
                  options={pdfOptions}
                  imageCount={images.length}
                  onChange={setPdfOptions}
                  onConvert={handleConvert}
                  isLoading={isConverting}
                />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Progress */}
        <AnimatePresence>
          {isConverting && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={styles.progressOverlay}
            >
              <ProgressBar percent={progress.percent} text={progress.text} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Image Zoom Modal ─────────────────────────── */}
      <AnimatePresence>
        {zoomIndex !== null && images[zoomIndex] && (
          <ImageZoomModal
            key="zoom"
            images={images}
            index={zoomIndex}
            onClose={() => setZoomIndex(null)}
            onNavigate={setZoomIndex}
            onCrop={i => { setZoomIndex(null); setCropIndex(i) }}
            onDelete={i => { handleDeleteImage(i); setZoomIndex(null) }}
          />
        )}
      </AnimatePresence>

      {/* ── Crop modal ──────────────────────────────── */}
      <AnimatePresence>
        {cropIndex !== null && images[cropIndex] && (
          <CropModal
            key="crop"
            imageData={images[cropIndex].data}
            imageName={images[cropIndex].name}
            onSave={handleCropSave}
            onClose={() => setCropIndex(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Confirm delete modal ─────────────────────── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <ConfirmDeleteModal
            key="del"
            count={images.length}
            onConfirm={handleDeleteAll}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
