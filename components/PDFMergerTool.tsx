'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { FileUp, FileText, ChevronDown, ChevronUp, Plus, Trash2, GripVertical, Download, X } from 'lucide-react'
import { mergePDFs } from '@/lib/pdfMerger'
import ProgressBar from '@/components/ProgressBar'
import type { ToastType } from '../app/page'

interface Props {
  toast: (type: ToastType, message: string, sub?: string) => void
}

interface PDFItem {
  id: string
  file: File
  name: string
  size: number
  dataBuffer?: ArrayBuffer // We'll read this lazily or when adding
}

export default function PDFMergerTool({ toast }: Props) {
  const [pdfs, setPdfs] = useState<PDFItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, text: '' })
  
  const fileRef = useRef<HTMLInputElement>(null)

  const processFiles = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf')
    if (!pdfFiles.length) {
      toast('error', 'Only PDF files are supported')
      return
    }

    const newItems = await Promise.all(pdfFiles.map(async f => {
      const buffer = await f.arrayBuffer()
      return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: f,
        name: f.name,
        size: f.size,
        dataBuffer: buffer
      }
    }))

    setPdfs(prev => [...prev, ...newItems])
    toast('success', `Added ${newItems.length} PDF${newItems.length !== 1 ? 's' : ''}`)
    if (fileRef.current) fileRef.current.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    processFiles(e.dataTransfer.files)
  }

  const handleMerge = async () => {
    if (pdfs.length < 2) {
      toast('error', 'Need at least 2 PDFs', 'Add more PDFs to merge them.')
      return
    }

    setIsProcessing(true)
    setProgress({ percent: 0, text: 'Preparing...' })

    try {
      const buffers = pdfs.map(p => p.dataBuffer as ArrayBuffer)
      const blob = await mergePDFs(buffers, (pct, txt) => setProgress({ percent: pct, text: txt }))
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Merged-Document.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast('success', 'PDFs merged successfully', 'Your new document is downloading.')
    } catch (err) {
      toast('error', 'Merge failed', err instanceof Error ? err.message : String(err))
    } finally {
      setIsProcessing(false)
    }
  }

  const removePdf = (id: string) => {
    setPdfs(prev => prev.filter(p => p.id !== id))
  }

  const formatSize = (bytes: number) => {
    const kb = bytes / 1024
    if (kb > 1024) return (kb / 1024).toFixed(1) + ' MB'
    return Math.round(kb) + ' KB'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Uploader Zone ── */}
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
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <FileUp size={44} strokeWidth={1.5} color={isDragOver ? 'var(--blue)' : 'var(--ink-3)'} style={{ marginBottom: 16 }} />
          <p style={{ fontWeight: 700, fontSize: '1.2rem', color: isDragOver ? 'var(--blue)' : 'var(--ink)', marginBottom: 6 }}>
            {isDragOver ? 'Drop PDFs here' : 'Select PDF files to Merge'}
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-3)', marginBottom: 20 }}>
            Merge multiple PDFs into a single file in seconds.
          </p>
          <button
            className="btn btn-primary"
            style={{ padding: '12px 24px', pointerEvents: 'auto', display: 'inline-flex' }}
            onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
          >
            <Plus size={18} />
            Add PDFs
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" multiple accept="application/pdf" onChange={e => { if (e.target.files) processFiles(e.target.files) }} hidden />

      {/* ── Drag & Drop List ── */}
      {pdfs.length > 0 && (
        <div className="glass" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)' }}>Merge Queue ({pdfs.length})</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-3)' }}>Drag to reorder</p>
          </div>

          <Reorder.Group axis="y" values={pdfs} onReorder={setPdfs} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence>
              {pdfs.map((pdf, index) => (
                <Reorder.Item
                  key={pdf.id}
                  value={pdf}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  whileDrag={{ scale: 1.02, zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '12px 16px',
                    background: 'var(--glass-bg)', borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--glass-border)', cursor: 'grab', position: 'relative'
                  }}
                >
                  <GripVertical size={18} color="var(--ink-4)" style={{ marginRight: 12, cursor: 'grab' }} />
                  <FileText size={24} color="var(--blue)" style={{ marginRight: 16 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pdf.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)' }}>
                      {formatSize(pdf.size)}
                    </div>
                  </div>
                  <button
                    onClick={() => removePdf(pdf.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                      color: 'var(--ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-4)'}
                  >
                    <X size={18} />
                  </button>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>

          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '24px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              style={{
                width: '100%', padding: '14px', fontSize: '1rem',
                opacity: pdfs.length < 2 ? 0.5 : 1, pointerEvents: pdfs.length < 2 ? 'none' : 'auto'
              }}
              onClick={handleMerge}
            >
              <Download size={20} />
              Merge & Download ({pdfs.length} file{pdfs.length !== 1 ? 's' : ''})
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
