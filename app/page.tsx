'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Info, CheckCircle2, AlertCircle } from 'lucide-react'
import ImageToPDFTool from '@/components/ImageToPDFTool'
import PDFMergerTool from '@/components/PDFMergerTool'
import ExtractPagesTool from '@/components/ExtractPagesTool'
import WatermarkTool from '@/components/WatermarkTool'
import PageNumbersTool from '@/components/PageNumbersTool'
import RotateTool from '@/components/RotateTool'
import PDFToImagesTool from '@/components/PDFToImagesTool'
import MetadataTool from '@/components/MetadataTool'
import CompressTool from '@/components/CompressTool'
import BugReportButton from '@/components/BugReportButton'
import InstallBanner from '@/components/InstallBanner'
import DarkModeToggle from '@/components/DarkModeToggle'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import { FileImage, GitMerge, Scissors, Droplets, Hash, RotateCw, Images, Tag, PackageCheck } from 'lucide-react'
import styles from './page.module.css'

export type ToastType = 'success' | 'error' | 'info'
export interface Toast { id: string; type: ToastType; message: string; sub?: string }

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

type ToolType = 'img2pdf' | 'mergepdf' | 'extractpdf' | 'watermarkpdf' | 'paginatepdf' | 'rotatepdf' | 'pdf2img' | 'metadata' | 'compress'

export default function Home() {
  const [activeTool, setActiveTool] = useState<ToolType>('img2pdf')
  const [toasts, setToasts] = useState<Toast[]>([])

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  const toast = useCallback((type: ToastType, message: string, sub?: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, type, message, sub }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  const iconFor = (type: ToastType) => {
    if (type === 'success') return <CheckCircle2 size={18} color="var(--success)" />
    if (type === 'error') return <AlertCircle size={18} color="var(--danger)" />
    return <Info size={18} color="var(--blue)" />
  }

  return (
    <div className={styles.page}>
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
            
            <Logo />
            
            <p className={styles.heroSub} style={{ marginTop: '20px' }}>
              Your universal suite for managing PDFs securely in the browser.
            </p>
            
            {/* Keyboard shortcuts hint */}
            <p style={{ fontSize: '0.75rem', color: 'var(--ink-4)', marginTop: 8 }}>
              <kbd style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace' }}>Ctrl+A</kbd> select all ·{' '}
              <kbd style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace' }}>Del</kbd> remove selected ·{' '}
              <kbd style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace' }}>Esc</kbd> deselect
            </p>

            {/* Dashboard Grid with Lucide icons */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 8, marginTop: 28
            }}>
              {([
                { id: 'img2pdf',      label: 'Image → PDF',   Icon: FileImage   },
                { id: 'mergepdf',     label: 'Merge PDFs',    Icon: GitMerge    },
                { id: 'extractpdf',   label: 'Extract Pages', Icon: Scissors    },
                { id: 'watermarkpdf', label: 'Watermark',     Icon: Droplets    },
                { id: 'paginatepdf',  label: 'Page Numbers',  Icon: Hash        },
                { id: 'rotatepdf',    label: 'Rotate',        Icon: RotateCw    },
                { id: 'pdf2img',      label: 'PDF → Image',   Icon: Images      },
                { id: 'metadata',     label: 'Metadata',      Icon: Tag         },
                { id: 'compress',     label: 'Compress',      Icon: PackageCheck },
              ] as { id: ToolType; label: string; Icon: React.ComponentType<any> }[]).map(({ id, label, Icon }) => {
                const active = activeTool === id
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTool(id)}
                    style={{
                      padding: '12px 6px', borderRadius: 'var(--r-sm)',
                      background: active ? 'var(--blue)' : 'var(--bg-secondary)',
                      color: active ? '#fff' : 'var(--ink-2)',
                      border: '1px solid transparent',
                      fontWeight: active ? 600 : 500, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s',
                      boxShadow: active ? '0 4px 16px rgba(0,113,227,0.25)' : 'initial',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                    }}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                    {label}
                  </button>
                )
              })}
            </div>

          </motion.div>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          <AnimatePresence mode="wait">
            {activeTool === 'img2pdf' && (
              <motion.div key="img2pdf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ImageToPDFTool toast={toast} />
              </motion.div>
            )}
            {activeTool === 'mergepdf' && (
              <motion.div key="mergepdf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <PDFMergerTool toast={toast} />
              </motion.div>
            )}
            {activeTool === 'extractpdf' && (
              <motion.div key="extractpdf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ExtractPagesTool toast={toast} />
              </motion.div>
            )}
            {activeTool === 'watermarkpdf' && (
              <motion.div key="watermarkpdf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <WatermarkTool toast={toast} />
              </motion.div>
            )}
            {activeTool === 'paginatepdf' && (
              <motion.div key="paginatepdf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <PageNumbersTool toast={toast} />
              </motion.div>
            )}
            {activeTool === 'rotatepdf' && (
              <motion.div key="rotatepdf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <RotateTool toast={toast} />
              </motion.div>
            )}
            {activeTool === 'pdf2img' && (
              <motion.div key="pdf2img" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <PDFToImagesTool toast={toast} />
              </motion.div>
            )}
            {activeTool === 'metadata' && (
              <motion.div key="metadata" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <MetadataTool toast={toast} />
              </motion.div>
            )}
            {activeTool === 'compress' && (
              <motion.div key="compress" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <CompressTool toast={toast} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <DarkModeToggle />
      <BugReportButton />
      <Footer />
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
