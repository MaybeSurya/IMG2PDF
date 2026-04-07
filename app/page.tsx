'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Sparkles, Info } from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'
import ImagePreview from '@/components/ImagePreview'
import BatchEditor from '@/components/BatchEditor'
import PDFSettings from '@/components/PDFSettings'
import ProgressBar from '@/components/ProgressBar'
import Footer from '@/components/Footer'
import CropModal from '@/components/CropModal'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'
import InstallBanner from '@/components/InstallBanner'
import DarkModeToggle from '@/components/DarkModeToggle'
import { generatePDF } from '@/lib/pdfGenerator'
import styles from './page.module.css'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: string; type: ToastType; message: string; sub?: string }

export interface PDFOptions {
  pageSize: string
  quality: number
  fileName: string
  orientation: 'portrait' | 'landscape'
  margins: 'none' | 'small' | 'normal' | 'wide'
  addPageNumbers: boolean
  pageNumberStyle: 'minimal' | 'boxed' | 'roman' | 'dots'
  pageNumberSize: number
  includeWatermark: boolean
}

export default function Home() {
  const [images, setImages] = useState<any[]>([])
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set())
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, text: '' })
  const [toasts, setToasts] = useState<Toast[]>([])
  const [uploaderExpanded, setUploaderExpanded] = useState(true)

  // Modals
  const [cropIndex, setCropIndex] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

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

  const toast = useCallback((type: ToastType, message: string, sub?: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, type, message, sub }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  // Auto-collapse uploader after adding images
  useEffect(() => {
    if (images.length > 0 && uploaderExpanded) {
      const timer = setTimeout(() => setUploaderExpanded(false), 700)
      return () => clearTimeout(timer)
    }
  }, [images.length])

  const handleImagesSelected = (newImages: any[]) => {
    setImages(prev => [...prev, ...newImages])
    toast('success', `${newImages.length} image${newImages.length !== 1 ? 's' : ''} added`)
  }

  const handleDeleteImage = (index: number) => {
    const name = images[index]?.name ?? 'image'
    setImages(prev => prev.filter((_, i) => i !== index))
    setSelectedImages(prev => {
      const next = new Set<number>()
      prev.forEach(i => { if (i < index) next.add(i); else if (i > index) next.add(i - 1) })
      return next
    })
    toast('info', `Removed "${name}"`)
  }

  const handleDeleteAll = () => {
    setImages([])
    setSelectedImages(new Set())
    setUploaderExpanded(true)
    setShowDeleteConfirm(false)
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

  const iconFor = (type: ToastType) => {
    if (type === 'success') return <CheckCircle2 size={18} color="var(--success)" />
    if (type === 'error') return <AlertCircle size={18} color="var(--danger)" />
    return <Info size={18} color="var(--blue)" />
  }

  return (
    <div className={styles.page}>
      {/* ── Hero header ─────────────────────────────── */}
      <header className={styles.hero}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className={styles.badge}>
              <Sparkles size={13} />
              <span>Free · No upload · 100% browser-based</span>
            </div>
            <h1 className={styles.heroTitle}>Image to PDF</h1>
            <p className={styles.heroSub}>
              Merge and convert images into a beautifully formatted PDF — entirely in your browser.
            </p>
          </motion.div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────── */}
      <main className={styles.main}>
        <div className="container">
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
                    />
                    <ImagePreview
                      images={images}
                      selectedImages={selectedImages}
                      onToggleSelect={handleToggleSelect}
                      onDeleteImage={handleDeleteImage}
                      onCropImage={handleCropImage}
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
        </div>
      </main>

      <DarkModeToggle />
      <Footer />

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

      {/* ── PWA Install Banner ───────────────────────── */}
      <InstallBanner />

      {/* ── Premium toast notifications ─────────────── */}
      <div className="toast-container" aria-live="polite">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              className={`toast ${t.type}`}
              initial={{ opacity: 0, x: 60, scale: 0.88 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            >
              <div style={{ flexShrink: 0 }}>{iconFor(t.type)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.message}</div>
                {t.sub && <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)', marginTop: 2 }}>{t.sub}</div>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
