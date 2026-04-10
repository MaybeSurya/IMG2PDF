'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, FileText, X, Download, Image as ImageIcon, SlidersHorizontal, Archive } from 'lucide-react'
import ProgressBar from '@/components/ProgressBar'
import type { ToastType } from '../app/page'

interface Props {
  toast: (type: ToastType, message: string, sub?: string) => void
}

type OutputFormat = 'png' | 'jpeg'

export default function PDFToImagesTool({ toast }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [scale, setScale] = useState(2)
  const [format, setFormat] = useState<OutputFormat>('png')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, text: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf')
    if (!pdfFiles.length) { toast('error', 'Only PDF files are supported'); return }
    try {
      const f = pdfFiles[0]
      // Read fresh buffer just for the page count — do NOT store the buffer in state
      // because pdfjs-dist will detach/transfer the underlying ArrayBuffer
      const buf = await f.arrayBuffer()
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise
      setFile(f)
      setPageCount(pdf.numPages)
      toast('success', `PDF loaded — ${pdf.numPages} pages`)
    } catch (e) {
      toast('error', 'Failed to load PDF', e instanceof Error ? e.message : undefined)
    }
  }

  const handleConvert = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress({ percent: 0, text: 'Loading PDF renderer…' })
    try {
      // Always re-read from the File object — this is the safest way to avoid
      // "Cannot perform ArrayBuffer.prototype.slice on a detached ArrayBuffer"
      // which happens when pdfjs transfers ownership of the buffer
      const freshBuf = await file.arrayBuffer()
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(freshBuf) }).promise

      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const total = pdf.numPages

      for (let i = 1; i <= total; i++) {
        const pct = Math.round(((i - 1) / total) * 80)
        setProgress({ percent: pct, text: `Rendering page ${i} of ${total}…` })

        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width  = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport, canvas }).promise

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
        const quality  = format === 'jpeg' ? 0.92 : undefined
        const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), mimeType, quality))
        const arrayBuf = await blob.arrayBuffer()
        const paddedNum = String(i).padStart(String(total).length, '0')
        zip.file(`page-${paddedNum}.${format}`, arrayBuf)
      }

      setProgress({ percent: 90, text: 'Creating ZIP archive…' })
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${file.name.replace(/\.pdf$/i, '')}-images.zip`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setProgress({ percent: 100, text: 'Done!' })
      toast('success', `${total} images exported!`, 'Your ZIP is downloading.')
    } catch (e) {
      toast('error', 'Conversion failed', e instanceof Error ? e.message : String(e))
    } finally {
      setIsProcessing(false)
    }
  }

  const dpiLabel = ({ 1: '72 dpi (web)', 2: '144 dpi (balanced)', 3: '216 dpi (print quality)', 4: '288 dpi (high)' } as Record<number,string>)[scale]

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
            <ImageIcon size={44} strokeWidth={1.5} color={isDragOver ? 'var(--blue)' : 'var(--ink-3)'} style={{ marginBottom: 16 }} />
            <p style={{ fontWeight: 700, fontSize: '1.2rem', color: isDragOver ? 'var(--blue)' : 'var(--ink)', marginBottom: 6 }}>
              Drop PDF to Convert to Images
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-3)' }}>
              Export every page as a high-res PNG or JPG — bundled in a ZIP.
            </p>
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
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: 2 }}>{pageCount} pages → {pageCount} {format.toUpperCase()} files</div>
            </div>
            <button onClick={() => { setFile(null); setPageCount(0) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--ink-4)' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 28 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
                <ImageIcon size={16} /> Image Format
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['png', 'jpeg'] as OutputFormat[]).map(f => (
                  <button key={f} onClick={() => setFormat(f)} style={{
                    flex: 1, padding: '10px', fontSize: '0.95rem', borderRadius: 'var(--r-sm)',
                    background: format === f ? 'var(--blue)' : 'var(--bg-secondary)',
                    color: format === f ? '#fff' : 'var(--ink-2)',
                    border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600
                  }}>{f.toUpperCase()}</button>
                ))}
              </div>
              {format === 'jpeg' && <p style={{ fontSize: '0.78rem', color: 'var(--ink-3)', marginTop: 6 }}>Smaller file size, slight quality loss</p>}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
                <SlidersHorizontal size={16} /> Resolution — {dpiLabel}
              </label>
              <input type="range" min={1} max={4} step={1} value={scale}
                onChange={e => setScale(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--blue)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--ink-4)', marginTop: 4 }}>
                <span>72</span><span>144</span><span>216</span><span>288 dpi</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(0,113,227,0.06)', borderRadius: 'var(--r-sm)', marginBottom: 24, fontSize: '0.85rem', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Archive size={14} />
            All {pageCount} images will be packaged into a single <strong>.zip</strong> archive.
          </div>

          <div style={{ height: 1, background: 'var(--glass-border)', marginBottom: 24 }} />

          <button className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: '1rem' }} onClick={handleConvert}>
            <Download size={20} /> Convert &amp; Download ZIP
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
