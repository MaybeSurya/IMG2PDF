'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, FileText, X, Download, AlignCenter, Hash, Type, ChevronRight } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { paginatePDF, PageNumberFormat, PageNumberPosition, PageNumberFont } from '@/lib/pdfPaginate'
import ProgressBar from '@/components/ProgressBar'
import type { ToastType } from '../app/page'

interface Props {
  toast: (type: ToastType, message: string, sub?: string) => void
}

const FONTS: { id: PageNumberFont; label: string; css: string }[] = [
  { id: 'Helvetica',            label: 'Helvetica',           css: 'Arial, sans-serif'        },
  { id: 'HelveticaBold',        label: 'Helvetica Bold',      css: 'Arial, sans-serif'        },
  { id: 'TimesRoman',           label: 'Times Roman',         css: 'Georgia, serif'           },
  { id: 'TimesRomanBoldItalic', label: 'Times Bold Italic',   css: 'Georgia, serif'           },
  { id: 'Courier',              label: 'Courier',             css: "'Courier New', monospace" },
]

const FORMATS: { id: PageNumberFormat; preview: (n: number, t: number) => string }[] = [
  { id: 'simple',      preview: (n) => `${n}`          },
  { id: 'fraction',    preview: (n,t) => `${n} / ${t}` },
  { id: 'dashed',      preview: (n) => `— ${n} —`      },
  { id: 'parentheses', preview: (n) => `(${n})`         },
  { id: 'roman',       preview: (n) => ['I','II','III','IV','V','VI','VII','VIII','IX','X'][n-1] ?? `${n}` },
]

const POSITIONS: { id: PageNumberPosition; label: string }[] = [
  { id: 'bottom-right',  label: 'Bottom Right'  },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-left',   label: 'Bottom Left'   },
  { id: 'top-right',     label: 'Top Right'     },
  { id: 'top-center',    label: 'Top Center'    },
  { id: 'top-left',      label: 'Top Left'      },
]

export default function PageNumbersTool({ toast }: Props) {
  const [file, setFile]           = useState<File | null>(null)
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [pageCount, setPageCount] = useState(0)

  const [format,    setFormat]    = useState<PageNumberFormat>('simple')
  const [position,  setPosition]  = useState<PageNumberPosition>('bottom-right')
  const [fontName,  setFontName]  = useState<PageNumberFont>('Helvetica')
  const [fontSize,  setFontSize]  = useState(12)
  const [startFrom, setStartFrom] = useState(1)

  const [isDragOver,    setIsDragOver]    = useState(false)
  const [isProcessing,  setIsProcessing]  = useState(false)
  const [progress,      setProgress]      = useState({ percent: 0, text: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf')
    if (!pdfFiles.length) { toast('error', 'Only PDF files are supported'); return }
    try {
      setIsProcessing(true); setProgress({ percent: 50, text: 'Analyzing…' })
      const f = pdfFiles[0]
      const buffer = await f.arrayBuffer()
      const doc = await PDFDocument.load(buffer)
      setFile(f); setFileBuffer(buffer); setPageCount(doc.getPageCount())
      toast('success', 'PDF loaded')
    } catch { toast('error', 'Failed to load PDF') }
    finally { setIsProcessing(false) }
  }

  const handlePaginate = async () => {
    if (!fileBuffer || !file) return
    setIsProcessing(true); setProgress({ percent: 0, text: 'Applying page numbers…' })
    try {
      const blob = await paginatePDF(fileBuffer, { format, position, fontName, fontSize, margin: 32, colorHex: '#000000', startFrom },
        (pct, txt) => setProgress({ percent: pct, text: txt }))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stem = file.name.replace(/\.pdf$/i, '')
      a.href = url; a.download = `${stem}-paginated.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('success', 'Page numbers added!')
    } catch (e) { toast('error', 'Failed', e instanceof Error ? e.message : String(e)) }
    finally { setIsProcessing(false) }
  }

  // Live preview text computed from settings
  const previewText = FORMATS.find(f => f.id === format)?.preview(startFrom, pageCount || 10) ?? `${startFrom}`
  const previewFont = FONTS.find(f => f.id === fontName)!
  const isTop       = position.startsWith('top')
  const isRight     = position.endsWith('right')
  const isCenter    = position.endsWith('center')

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
            <FileUp size={44} strokeWidth={1.5} color={isDragOver ? 'var(--blue)' : 'var(--ink-3)'} style={{ marginBottom: 16 }} />
            <p style={{ fontWeight: 700, fontSize: '1.2rem', color: isDragOver ? 'var(--blue)' : 'var(--ink)', marginBottom: 6 }}>Drop PDF to Paginate</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-3)' }}>Stamp accurate page numbers across large documents.</p>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="application/pdf" onChange={e => { if (e.target.files) processFile(e.target.files) }} hidden />

      {file && (
        <div className="glass" style={{ padding: 24 }}>
          {/* File header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', marginBottom: 24 }}>
            <FileText size={24} color="var(--blue)" style={{ marginRight: 16 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: 2 }}>{pageCount} pages</div>
            </div>
            <button onClick={() => { setFile(null); setFileBuffer(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--ink-4)' }}><X size={18} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Format */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}><Hash size={16}/> Number Format</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {FORMATS.map(f => (
                  <button key={f.id} onClick={() => setFormat(f.id)} style={{
                    padding: '8px 14px', borderRadius: 'var(--r-sm)', textAlign: 'left', cursor: 'pointer',
                    background: format === f.id ? 'var(--blue)' : 'var(--bg-secondary)',
                    color: format === f.id ? '#fff' : 'var(--ink-2)',
                    border: '1px solid var(--border)', fontWeight: 500, transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between'
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>{f.id}</span>
                    <span style={{ opacity: 0.7, fontFamily: 'monospace' }}>{f.preview(3, 12)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}><AlignCenter size={16}/> Position</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {POSITIONS.map(p => (
                  <button key={p.id} onClick={() => setPosition(p.id)} style={{
                    padding: '8px 14px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                    background: position === p.id ? 'var(--blue)' : 'var(--bg-secondary)',
                    color: position === p.id ? '#fff' : 'var(--ink-2)',
                    border: '1px solid var(--border)', fontWeight: 500, transition: 'all 0.15s'
                  }}>{p.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Font */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}><Type size={16}/> Font</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FONTS.map(f => (
                <button key={f.id} onClick={() => setFontName(f.id)} style={{
                  padding: '8px 16px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                  background: fontName === f.id ? 'var(--blue)' : 'var(--bg-secondary)',
                  color: fontName === f.id ? '#fff' : 'var(--ink-2)',
                  border: '1px solid var(--border)', transition: 'all 0.15s',
                  fontFamily: f.css, fontStyle: f.id.includes('Italic') ? 'italic' : 'normal',
                  fontWeight: f.id.includes('Bold') ? 700 : 400
                } as any}>{f.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8, display: 'block' }}>
                Font Size ({fontSize}px)
              </label>
              <input type="range" min={8} max={36} value={fontSize} onChange={e => setFontSize(+e.target.value)} style={{ width: '100%', accentColor: 'var(--blue)' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8, display: 'block' }}>
                Start from page #
              </label>
              <input type="number" min={1} max={999} value={startFrom} onChange={e => setStartFrom(+e.target.value)} className="ui-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.95rem' }} />
            </div>
          </div>

          {/* Live Preview */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ChevronRight size={16} /> Page Number Preview
            </label>
            <div style={{
              position: 'relative', background: '#fff', border: '2px solid var(--border)', borderRadius: 'var(--r-sm)',
              height: 160, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
            }}>
              {/* Simulated page lines */}
              {[30,50,70,90,110,130].map(t => (
                <div key={t} style={{ position: 'absolute', left: 20, right: 20, top: t, height: 1, background: '#e5e7eb' }} />
              ))}
              {/* Page number rendered at the correct corner */}
              <div style={{
                position: 'absolute',
                top:    isTop  ? 10 : undefined,
                bottom: !isTop ? 10 : undefined,
                left:   isRight  ? undefined : isCenter ? '50%' : 10,
                right:  isRight  ? 10 : undefined,
                transform: isCenter ? 'translateX(-50%)' : undefined,
                fontFamily: previewFont.css,
                fontStyle: fontName.includes('Italic') ? 'italic' : 'normal',
                fontWeight: fontName.includes('Bold') ? 700 : 400,
                fontSize: Math.min(fontSize * 1.3, 26),
                color: '#1a1c1d',
                whiteSpace: 'nowrap',
                padding: '0 4px',
              }}>
                {previewText}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--glass-border)', marginBottom: 24 }} />
          <button className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: '1rem' }} onClick={handlePaginate}>
            <Download size={20} /> Stamp &amp; Download
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
