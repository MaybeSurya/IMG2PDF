'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, FileText, X, Download, Minimize2, Zap } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { markPDF } from '@/lib/pdfMetadata'
import { flattenAndCompressPDF } from '@/lib/pdfCompress'
import ProgressBar from '@/components/ProgressBar'
import type { ToastType } from '../app/page'

interface Props {
  toast: (type: ToastType, message: string, sub?: string) => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function CompressTool({ toast }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, text: '' })
  const [result, setResult] = useState<{ originalSize: number; newSize: number } | null>(null)
  const [mode, setMode] = useState<'lossless' | 'flatten'>('lossless')
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium')
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf')
    if (!pdfFiles.length) { toast('error', 'Only PDF files are supported'); return }
    try {
      const f = pdfFiles[0]
      const buffer = await f.arrayBuffer()
      const doc = await PDFDocument.load(buffer)
      setFile(f); setFileBuffer(buffer)
      setPageCount(doc.getPageCount())
      setResult(null)
      toast('success', 'PDF loaded')
    } catch {
      toast('error', 'Failed to load PDF')
    }
  }

  const handleCompress = async () => {
    if (!fileBuffer || !file) return
    setIsProcessing(true)
    setProgress({ percent: 0, text: 'Loading document…' })
    try {
      setProgress({ percent: 20, text: 'Parsing PDF structure…' })
      let compressedBytes: Uint8Array
      
      if (mode === 'lossless') {
        const doc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true })
        setProgress({ percent: 50, text: 'Re-serializing with object streams…' })
        markPDF(doc)
        compressedBytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      } else {
        const dmp = { high: 2.0, medium: 1.4, low: 1.0 }[quality]
        const jp = { high: 0.85, medium: 0.65, low: 0.45 }[quality]
        
        const blob = await flattenAndCompressPDF(
          fileBuffer,
          { dpiMultiplier: dmp, jpegQuality: jp },
          (pct, txt) => setProgress({ percent: pct, text: txt })
        )
        compressedBytes = new Uint8Array(await blob.arrayBuffer())
      }

      setProgress({ percent: 90, text: 'Finalizing…' })
      const newSize = compressedBytes.byteLength
      const originalSize = fileBuffer.byteLength

      const blob = new Blob([new Uint8Array(compressedBytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stem = file.name.replace(/\.pdf$/i, '')
      a.href = url; a.download = `${stem}-compressed.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setResult({ originalSize, newSize })
      setProgress({ percent: 100, text: 'Done!' })

      const savedPct = Math.round((1 - newSize / originalSize) * 100)
      if (savedPct > 0) {
        toast('success', `Compressed by ~${savedPct}%`, `${formatBytes(originalSize)} → ${formatBytes(newSize)}`)
      } else {
        toast('info', 'PDF already optimal', 'Client-side compression cannot shrink images natively right now.')
      }
    } catch (e) {
      toast('error', 'Compression failed', e instanceof Error ? e.message : String(e))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {!file && (
        <div className={`glass ${isDragOver ? 'dragover' : ''}`} style={{ overflow: 'hidden' }}>
          <div
            className="upload-box"
            style={{
              margin: 20, border: isDragOver ? '2px dashed var(--blue)' : '1.5px dashed var(--ink-4)',
              background: isDragOver ? 'rgba(0,113,227,0.04)' : undefined,
              transition: 'all 0.2s', textAlign: 'center', padding: '40px 20px',
              cursor: 'pointer', borderRadius: 'var(--r-md)'
            }}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => { e.preventDefault(); setIsDragOver(false); processFile(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
          >
            <Minimize2 size={44} strokeWidth={1.5} color={isDragOver ? 'var(--blue)' : 'var(--ink-3)'} style={{ marginBottom: 16 }} />
            <p style={{ fontWeight: 700, fontSize: '1.2rem', color: isDragOver ? 'var(--blue)' : 'var(--ink)', marginBottom: 6 }}>
              Drop PDF to Compress
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-3)' }}>Losslessly shrink bulky PDFs for email or upload limits.</p>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="application/pdf" onChange={e => { if (e.target.files) processFile(e.target.files) }} hidden />

      {file && (
        <div className="glass" style={{ padding: 24 }}>
          <div style={{
            display: 'flex', alignItems: 'center', padding: '12px 16px',
            background: 'var(--bg-secondary)', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)', marginBottom: 24
          }}>
            <FileText size={24} color="var(--blue)" style={{ marginRight: 16 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: 2 }}>{pageCount} pages · {formatBytes(file.size)}</div>
            </div>
            <button onClick={() => { setFile(null); setFileBuffer(null); setResult(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--ink-4)' }}>
              <X size={18} />
            </button>
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center',
                padding: '16px 20px', background: 'rgba(0,180,0,0.06)', border: '1px solid rgba(0,180,0,0.2)',
                borderRadius: 'var(--r-sm)', marginBottom: 24
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-3)', marginBottom: 4 }}>Original</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>{formatBytes(result.originalSize)}</div>
              </div>
              <Zap size={20} color="var(--success, green)" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-3)', marginBottom: 4 }}>Compressed</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--success, green)' }}>{formatBytes(result.newSize)}</div>
              </div>
            </motion.div>
          )}

          {/* Settings Section */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>Compression Engine</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              <button 
                onClick={() => setMode('lossless')}
                style={{
                  padding: '12px', borderRadius: 'var(--r-sm)', textAlign: 'left',
                  border: mode === 'lossless' ? '2px solid var(--blue)' : '2px solid transparent',
                  background: 'var(--bg-secondary)', cursor: 'pointer', outline: 'none'
                }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.9rem' }}>Quick (Lossless)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-3)', marginTop: 4 }}>Optimises structure. Preserves text and vectors perfectly. Does not shrink images.</div>
              </button>
              
              <button 
                onClick={() => setMode('flatten')}
                style={{
                  padding: '12px', borderRadius: 'var(--r-sm)', textAlign: 'left',
                  border: mode === 'flatten' ? '2px solid var(--danger)' : '2px solid transparent',
                  background: 'var(--bg-secondary)', cursor: 'pointer', outline: 'none'
                }}>
                <div style={{ fontWeight: 600, color: 'var(--danger)', fontSize: '0.9rem' }}>Aggressive (Flatten)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-3)', marginTop: 4 }}>Heavy reduction. Scans document to unselectable JPEGs. Best for large photo PDFs.</div>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mode === 'flatten' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 24 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 8 }}>Image Quality</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['low', 'medium', 'high'] as const).map(q => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8,
                        background: quality === q ? 'var(--ink)' : 'var(--bg-secondary)',
                        color: quality === q ? '#fff' : 'var(--ink-2)', border: 'none',
                        fontWeight: quality === q ? 600 : 500, fontSize: '0.85rem', cursor: 'pointer'
                      }}
                    >
                      {q.charAt(0).toUpperCase() + q.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--r-sm)', marginTop: 16, fontSize: '0.8rem', color: '#ef4444' }}>
                  <strong>Warning:</strong> Flattening converts all highlightable text into an image. It will look identical but will not be searchable.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ height: 1, background: 'var(--glass-border)', margin: '0 0 24px' }} />

          <button className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: '1rem', background: mode === 'flatten' ? 'var(--danger)' : 'var(--blue)' }} onClick={handleCompress}>
            <Download size={20} /> Compress &amp; Download
          </button>
        </div>
      )}

      <AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            style={{ position: 'fixed', inset: 0, background: 'var(--bg)', opacity: 0.98, backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <ProgressBar percent={progress.percent} text={progress.text} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
