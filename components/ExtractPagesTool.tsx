'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, FileText, Scissors, X, Download } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { extractPDFPages } from '@/lib/pdfExtract'
import ProgressBar from '@/components/ProgressBar'
import type { ToastType } from '../app/page'

interface Props {
  toast: (type: ToastType, message: string, sub?: string) => void
}

interface LoadedPDF {
  file: File
  name: string
  size: number
  buffer: ArrayBuffer
  pageCount: number
}

export default function ExtractPagesTool({ toast }: Props) {
  const [pdf, setPdf] = useState<LoadedPDF | null>(null)
  const [rangeStr, setRangeStr] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, text: '' })
  
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf')
    if (!pdfFiles.length) {
      toast('error', 'Only PDF files are supported')
      return
    }

    try {
      setIsProcessing(true)
      setProgress({ percent: 50, text: 'Analyzing PDF...' })
      const file = pdfFiles[0]
      const buffer = await file.arrayBuffer()
      const doc = await PDFDocument.load(buffer)
      const pageCount = doc.getPageCount()
      
      setPdf({
        file,
        name: file.name,
        size: file.size,
        buffer,
        pageCount
      })
      toast('success', 'PDF loaded successfully')
    } catch (err) {
      toast('error', 'Failed to load PDF', 'The file might be corrupted or encrypted.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExtract = async () => {
    if (!pdf) return
    if (!rangeStr.trim()) {
      toast('error', 'Please enter a page range')
      return
    }

    setIsProcessing(true)
    setProgress({ percent: 0, text: 'Preparing to extract...' })

    try {
      const blob = await extractPDFPages(pdf.buffer, rangeStr, (pct, txt) => setProgress({ percent: pct, text: txt }))
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const nameParts = pdf.name.split('.')
      const ext = nameParts.pop()
      a.download = `${nameParts.join('.')}-extracted.${ext}`
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast('success', 'Pages extracted successfully!')
    } catch (err) {
      toast('error', 'Extraction failed', err instanceof Error ? err.message : String(err))
    } finally {
      setIsProcessing(false)
    }
  }

  const removePdf = () => {
    setPdf(null)
    setRangeStr('')
  }

  const formatSize = (bytes: number) => {
    const kb = bytes / 1024
    if (kb > 1024) return (kb / 1024).toFixed(1) + ' MB'
    return Math.round(kb) + ' KB'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Uploader Zone ── */}
      {!pdf && (
        <div className={`glass ${isDragOver ? 'dragover' : ''}`} style={{ overflow: 'hidden' }}>
          <div
            className="upload-box"
            style={{
              margin: 20,
              border: isDragOver ? '2px dashed var(--blue)' : '1.5px dashed var(--ink-4)',
              background: isDragOver ? 'rgba(0,113,227,0.04)' : undefined,
              transition: 'all 0.2s var(--ease)',
              textAlign: 'center',
              padding: '40px 20px',
              cursor: 'pointer',
              borderRadius: 'var(--r-md)'
            }}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => { e.preventDefault(); setIsDragOver(false); processFile(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
          >
            <FileUp size={44} strokeWidth={1.5} color={isDragOver ? 'var(--blue)' : 'var(--ink-3)'} style={{ marginBottom: 16 }} />
            <p style={{ fontWeight: 700, fontSize: '1.2rem', color: isDragOver ? 'var(--blue)' : 'var(--ink)', marginBottom: 6 }}>
              {isDragOver ? 'Drop PDF here' : 'Select a PDF Document'}
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-3)' }}>
              Extract specific pages from your PDF.
            </p>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="application/pdf" onChange={e => { if (e.target.files) processFile(e.target.files) }} hidden />

      {/* ── Active Editor ── */}
      {pdf && (
        <div className="glass" style={{ padding: '24px' }}>
          {/* File summary */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '12px 16px',
            background: 'var(--bg-secondary)', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)', marginBottom: 24
          }}>
            <FileText size={24} color="var(--blue)" style={{ marginRight: 16 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pdf.name}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: 2 }}>
                <span>{formatSize(pdf.size)}</span>
                <span>•</span>
                <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{pdf.pageCount} Pages</span>
              </div>
            </div>
            <button
              onClick={removePdf}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                color: 'var(--ink-4)'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-4)'}
              title="Remove file"
            >
              <X size={18} />
            </button>
          </div>

          {/* Range Settings */}
          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
              Pages to Extract
            </label>
            <input
              type="text"
              value={rangeStr}
              onChange={e => setRangeStr(e.target.value)}
              placeholder="e.g. 1, 3-5, 8"
              className="ui-input"
              style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: 8 }}>
              Enter a comma-separated list of page numbers and/or ranges. (Max page: {pdf.pageCount})
            </p>
          </div>

          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '24px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              style={{
                width: '100%', padding: '14px', fontSize: '1rem',
                opacity: !rangeStr.trim() ? 0.5 : 1, pointerEvents: !rangeStr.trim() ? 'none' : 'auto'
              }}
              onClick={handleExtract}
            >
              <Scissors size={20} />
              Extract Pages
            </button>
          </div>
        </div>
      )}

      {/* ── Progress Overlay ── */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            style={{
              position: 'fixed', inset: 0, background: 'var(--bg)', opacity: 0.98,
              backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 1000
            }}
          >
            <ProgressBar percent={progress.percent} text={progress.text} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
