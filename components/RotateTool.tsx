'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, FileText, X, Download, RotateCw, Settings2 } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { rotatePDFPages } from '@/lib/pdfRotate'
import { parsePageRanks } from '@/lib/pdfExtract'
import ProgressBar from '@/components/ProgressBar'
import type { ToastType } from '../app/page'

interface Props {
  toast: (type: ToastType, message: string, sub?: string) => void
}

const ANGLE_OPTIONS = [
  { value: 90,  label: '90°',  icon: '↻' },
  { value: 180, label: '180°', icon: '↕' },
  { value: 270, label: '270°', icon: '↺' },
]

export default function RotateTool({ toast }: Props) {
  const [file,       setFile]       = useState<File | null>(null)
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [pageCount,  setPageCount]  = useState(0)
  const [rangeStr,   setRangeStr]   = useState('')
  const [angle,      setAngle]      = useState<number>(90)
  const [isDragOver, setIsDragOver]  = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress]     = useState({ percent: 0, text: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = async (files: FileList | File[]) => {
    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf')
    if (!pdfs.length) { toast('error', 'Only PDF files are supported'); return }
    try {
      setIsProcessing(true); setProgress({ percent: 50, text: 'Analyzing…' })
      const f = pdfs[0]
      const buf = await f.arrayBuffer()
      const doc = await PDFDocument.load(buf)
      setFile(f); setFileBuffer(buf)
      const n = doc.getPageCount()
      setPageCount(n)
      setRangeStr(`1-${n}`)
      toast('success', `Loaded — ${n} pages`)
    } catch { toast('error', 'Failed to load PDF') }
    finally { setIsProcessing(false) }
  }

  const handleRotate = async () => {
    if (!fileBuffer || !file) return
    setIsProcessing(true); setProgress({ percent: 0, text: 'Rotating pages…' })
    try {
      const blob = await rotatePDFPages(fileBuffer, rangeStr, angle, (pct, txt) => setProgress({ percent: pct, text: txt }))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${file.name.replace(/\.pdf$/i, '')}-rotated.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('success', 'Pages rotated!')
    } catch (e) { toast('error', 'Rotation failed', e instanceof Error ? e.message : String(e)) }
    finally { setIsProcessing(false) }
  }

  // Parse current range to show which page indices will be rotated
  const targetPages = file ? parsePageRanks(rangeStr, pageCount) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {!file && (
        <div className={`glass ${isDragOver ? 'dragover' : ''}`} style={{ overflow: 'hidden' }}>
          <div className="upload-box" style={{
            margin: 20, border: isDragOver ? '2px dashed var(--blue)' : '1.5px dashed var(--ink-4)',
            background: isDragOver ? 'rgba(0,113,227,0.04)' : undefined, transition: 'all 0.2s',
            textAlign: 'center', padding: '40px 20px', cursor: 'pointer', borderRadius: 'var(--r-md)'
          }}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => { e.preventDefault(); setIsDragOver(false); processFile(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}>
            <RotateCw size={44} strokeWidth={1.5} color={isDragOver ? 'var(--blue)' : 'var(--ink-3)'} style={{ marginBottom: 16 }} />
            <p style={{ fontWeight: 700, fontSize: '1.2rem', color: isDragOver ? 'var(--blue)' : 'var(--ink)', marginBottom: 6 }}>Drop PDF to Rotate</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-3)' }}>Fix upside-down or sideways scanned pages.</p>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="application/pdf" onChange={e => { if (e.target.files) processFile(e.target.files) }} hidden />

      {file && (
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', marginBottom: 24 }}>
            <FileText size={24} color="var(--blue)" style={{ marginRight: 16 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: 2 }}>{pageCount} pages</div>
            </div>
            <button onClick={() => { setFile(null); setFileBuffer(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--ink-4)' }}><X size={18} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}><Settings2 size={15}/> Pages to Rotate</label>
              <input type="text" value={rangeStr} onChange={e => setRangeStr(e.target.value)} className="ui-input"
                style={{ width: '100%', padding: '12px', fontSize: '1rem' }} placeholder="e.g. 1-10 or 2, 4, 7" />
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-3)', marginTop: 6 }}>
                {targetPages.length > 0
                  ? `${targetPages.length} page${targetPages.length === 1 ? '' : 's'} will be rotated`
                  : 'Enter comma-separated pages or ranges'}
              </p>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}><RotateCw size={15}/> Rotation Angle</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {ANGLE_OPTIONS.map(a => (
                  <button key={a.value} onClick={() => setAngle(a.value)} style={{
                    flex: 1, padding: '12px 0', borderRadius: 'var(--r-sm)',
                    background: angle === a.value ? 'var(--blue)' : 'var(--bg-secondary)',
                    color: angle === a.value ? '#fff' : 'var(--ink-2)',
                    border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                  } as any}>
                    <span style={{ fontSize: '1.3rem' }}>{a.icon}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual page grid */}
          {pageCount > 0 && pageCount <= 40 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10, display: 'block' }}>
                Page Preview — highlighted pages will be rotated
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Array.from({ length: pageCount }, (_, i) => {
                  const willRotate = targetPages.includes(i)
                  return (
                    <motion.div
                      key={i}
                      title={`Page ${i + 1}`}
                      animate={willRotate ? { rotate: angle, scale: 1.08 } : { rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      style={{
                        width: 32, height: 42, borderRadius: 4, cursor: 'default',
                        background: willRotate ? 'var(--blue)' : 'var(--bg-secondary)',
                        border: willRotate ? '2px solid var(--blue)' : '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 700,
                        color: willRotate ? '#fff' : 'var(--ink-3)'
                      }}
                    >
                      {i + 1}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ height: 1, background: 'var(--glass-border)', marginBottom: 24 }} />
          <button className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: '1rem' }} onClick={handleRotate}>
            <Download size={20} /> Rotate &amp; Download
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
