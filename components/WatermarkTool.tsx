'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, FileText, X, Download, Droplets, Type, RotateCcw, Repeat2 } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { watermarkPDF, WatermarkOptions } from '@/lib/pdfWatermark'
import ProgressBar from '@/components/ProgressBar'
import type { ToastType } from '../app/page'

interface Props {
  toast: (type: ToastType, message: string, sub?: string) => void
}

const PRESET_COLORS = [
  { hex: '#ff4b2b', label: 'Red'    },
  { hex: '#0071e3', label: 'Blue'   },
  { hex: '#000000', label: 'Black'  },
  { hex: '#999999', label: 'Grey'   },
  { hex: '#22c55e', label: 'Green'  },
  { hex: '#f59e0b', label: 'Amber'  },
]

const PRESETS = ['CONFIDENTIAL', 'DRAFT', 'WATERMARK', 'DO NOT COPY', 'SAMPLE', 'COPY']

export default function WatermarkTool({ toast }: Props) {
  const [file,       setFile]       = useState<File | null>(null)
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [pageCount,  setPageCount]  = useState(0)

  const [text,        setText]        = useState('CONFIDENTIAL')
  const [color,       setColor]       = useState('#ff4b2b')
  const [customColor, setCustomColor] = useState('#ff4b2b')
  const [opacity,     setOpacity]     = useState(0.35)
  const [orientation, setOrientation] = useState<'diagonal' | 'horizontal'>('diagonal')
  const [fontStyle,   setFontStyle]   = useState<'bold' | 'regular' | 'italic'>('bold')
  const [repeat,      setRepeat]      = useState(false)

  const [isDragOver,   setIsDragOver]   = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress,     setProgress]     = useState({ percent: 0, text: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = async (files: FileList | File[]) => {
    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf')
    if (!pdfs.length) { toast('error', 'Only PDF files are supported'); return }
    try {
      const f = pdfs[0]
      const buf = await f.arrayBuffer()
      const doc = await PDFDocument.load(buf)
      setFile(f); setFileBuffer(buf); setPageCount(doc.getPageCount())
      toast('success', 'PDF loaded')
    } catch { toast('error', 'Failed to load PDF') }
  }

  const handleWatermark = async () => {
    if (!fileBuffer || !file) return
    setIsProcessing(true); setProgress({ percent: 0, text: 'Applying watermark…' })
    try {
      const opts: WatermarkOptions = { text, color, opacity, orientation, fontStyle, repeat }
      const blob = await watermarkPDF(fileBuffer, opts, (pct, txt) => setProgress({ percent: pct, text: txt }))
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `${file.name.replace(/\.pdf$/i, '')}-watermarked.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('success', 'Watermark applied!')
    } catch (e) { toast('error', 'Watermark failed', e instanceof Error ? e.message : String(e)) }
    finally { setIsProcessing(false) }
  }

  const selectColor = (hex: string) => { setColor(hex); setCustomColor(hex) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {!file && (
        <div className={`glass ${isDragOver ? 'dragover': ''}`} style={{ overflow: 'hidden' }}>
          <div className="upload-box" style={{
            margin: 20, border: isDragOver ? '2px dashed var(--blue)' : '1.5px dashed var(--ink-4)',
            background: isDragOver ? 'rgba(0,113,227,0.04)' : undefined, transition: 'all 0.2s',
            textAlign: 'center', padding: '40px 20px', cursor: 'pointer', borderRadius: 'var(--r-md)'
          }}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => { e.preventDefault(); setIsDragOver(false); processFile(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}>
            <Droplets size={44} strokeWidth={1.5} color={isDragOver ? 'var(--blue)' : 'var(--ink-3)'} style={{ marginBottom: 16 }} />
            <p style={{ fontWeight: 700, fontSize: '1.2rem', color: isDragOver ? 'var(--blue)' : 'var(--ink)', marginBottom: 6 }}>Drop PDF to Watermark</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-3)' }}>Stamp custom text across every page.</p>
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

          {/* Live preview */}
          <div style={{ marginBottom: 24, position: 'relative', background: '#fff', border: '2px solid var(--border)', borderRadius: 'var(--r-sm)', height: 140, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {[30,55,80,105].map(t => (
              <div key={t} style={{ position: 'absolute', left: 20, right: 20, top: t, height: 1, background: '#e5e7eb' }} />
            ))}
            <div style={{
              userSelect: 'none', pointerEvents: 'none',
              fontSize: Math.min(Math.max(text.length > 10 ? 18 : 24, 12), 32),
              fontWeight: fontStyle === 'bold' ? 700 : fontStyle === 'italic' ? 400 : 400,
              fontStyle: fontStyle === 'italic' ? 'italic' : 'normal',
              color,
              opacity,
              transform: orientation === 'diagonal' ? 'rotate(-30deg)' : 'none',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              zIndex: 1,
            }}>
              {text || 'WATERMARK'}
            </div>
          </div>

          {/* Text */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}><Type size={16}/> Text</label>
            <input type="text" value={text} onChange={e => setText(e.target.value)} className="ui-input"
              style={{ width: '100%', padding: '10px 14px', fontSize: '1rem' }} placeholder="Your watermark text…" />
            {/* Quick presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {PRESETS.map(p => (
                <button key={p} onClick={() => setText(p)} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', cursor: 'pointer',
                  background: text === p ? 'var(--blue)' : 'var(--bg-secondary)',
                  color: text === p ? '#fff' : 'var(--ink-2)',
                  border: '1px solid var(--border)', transition: 'all 0.15s'
                }}>{p}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 20 }}>
            {/* Color */}
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10, display: 'block' }}>Color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {PRESET_COLORS.map(c => (
                  <button key={c.hex} onClick={() => selectColor(c.hex)} title={c.label} style={{
                    width: 30, height: 30, borderRadius: '50%', background: c.hex,
                    border: color === c.hex ? '3px solid var(--ink)' : '2px solid transparent',
                    cursor: 'pointer', padding: 0,
                    boxShadow: color === c.hex ? '0 0 0 2px var(--bg), 0 0 0 4px var(--blue)' : '0 2px 4px rgba(0,0,0,0.15)'
                  }} />
                ))}
              </div>
              {/* Custom color picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); setColor(e.target.value) }}
                  style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2 }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--ink-3)' }}>Custom</span>
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10, display: 'block' }}>
                Opacity &mdash; {Math.round(opacity * 100)}%
              </label>
              <input type="range" min={0.05} max={1} step={0.05} value={opacity}
                onChange={e => setOpacity(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--blue)', marginBottom: 6 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                {[0.2, 0.35, 0.5, 0.75].map(v => (
                  <button key={v} onClick={() => setOpacity(v)} style={{
                    flex: 1, padding: '4px', fontSize: '0.75rem', borderRadius: 6, cursor: 'pointer',
                    background: opacity === v ? 'var(--blue)' : 'var(--bg-secondary)',
                    color: opacity === v ? '#fff' : 'var(--ink-3)', border: '1px solid var(--border)'
                  }}>{Math.round(v*100)}%</button>
                ))}
              </div>
            </div>

            {/* Orientation */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}><RotateCcw size={15}/> Orientation</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['diagonal', 'horizontal'].map(o => (
                  <button key={o} onClick={() => setOrientation(o as any)} style={{
                    flex: 1, padding: '10px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                    background: orientation === o ? 'var(--blue)' : 'var(--bg-secondary)',
                    color: orientation === o ? '#fff' : 'var(--ink-2)',
                    border: '1px solid var(--border)', transition: 'all 0.2s', fontWeight: 600, fontSize: '0.88rem',
                    textTransform: 'capitalize'
                  } as any}>{o}</button>
                ))}
              </div>
            </div>

            {/* Font style */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}><Type size={15}/> Style</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['bold','regular','italic'] as const).map(s => (
                  <button key={s} onClick={() => setFontStyle(s)} style={{
                    flex: 1, padding: '10px', borderRadius: 'var(--r-sm)',
                    background: fontStyle === s ? 'var(--blue)' : 'var(--bg-secondary)',
                    color: fontStyle === s ? '#fff' : 'var(--ink-2)',
                    border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s',
                    fontWeight: s === 'bold' ? 700 : 400, fontStyle: s === 'italic' ? 'italic' : 'normal', fontSize: '0.88rem',
                    textTransform: 'capitalize'
                  } as any}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Repeat toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', marginBottom: 24 }}>
            <Repeat2 size={18} color="var(--ink-3)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>Tile Watermark</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)' }}>Stamp 3 copies across every page</div>
            </div>
            <button onClick={() => setRepeat(!repeat)} style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', padding: 0,
              background: repeat ? 'var(--blue)' : 'var(--ink-4)', position: 'relative', transition: 'background 0.2s'
            }}>
              <span style={{
                position: 'absolute', top: 3, left: repeat ? 23 : 3, width: 18, height: 18,
                borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
              }} />
            </button>
          </div>

          <div style={{ height: 1, background: 'var(--glass-border)', marginBottom: 24 }} />
          <button className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: '1rem', opacity: !text.trim() ? 0.5 : 1 }}
            onClick={handleWatermark} disabled={!text.trim()}>
            <Download size={20} /> Apply Watermark &amp; Download
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
