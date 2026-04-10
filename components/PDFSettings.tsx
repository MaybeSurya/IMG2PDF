'use client'

import { Download, Loader2, FileText, Layout, Maximize2, Hash, Droplets, ArrowUpDown, Heart, Info, Type, Zap, BookOpen, Camera, Archive } from 'lucide-react'
import type { PDFOptions } from '@/app/page'

interface Props {
  options: PDFOptions
  imageCount: number
  onChange: (opts: PDFOptions) => void
  onConvert: () => void
  isLoading: boolean
}

const set = (opts: PDFOptions, key: keyof PDFOptions, value: any): PDFOptions => ({ ...opts, [key]: value })

function getFileSizeHint(quality: number, imageCount: number): string {
  if (imageCount === 0) return ''
  const kbPerImage = quality >= 0.9 ? 450 : quality >= 0.7 ? 250 : quality >= 0.5 ? 150 : quality >= 0.3 ? 80 : 45
  const total = kbPerImage * imageCount
  if (total >= 1024) return `~${(total / 1024).toFixed(1)} MB`
  return `~${total} KB`
}

function QualityLabel({ quality }: { quality: number }) {
  const map = [
    [0.9, 'var(--success)', 'Maximum'],
    [0.7, '#e09800', 'High'],
    [0.5, 'var(--ink-2)', 'Medium'],
    [0, 'var(--ink-3)', 'Low'],
  ] as [number, string, string][]
  const [, color, label] = map.find(([t]) => quality >= t) ?? map[3]
  return <span style={{ color, fontWeight: 700, fontSize: '0.78rem' }}>{label}</span>
}

const PAGE_NUM_STYLES = [
  { id: 'minimal', label: 'Minimal', desc: '1 / 12' },
  { id: 'boxed',   label: 'Boxed',   desc: '[ 1 / 12 ]' },
  { id: 'dots',    label: 'Dots',    desc: '• 1 •' },
  { id: 'roman',   label: 'Roman',   desc: 'i / xii' },
] as const

const PRESETS = [
  {
    id: 'web',
    label: 'Web / Share',
    icon: <Zap size={14} />,
    desc: 'Small file, great for email',
    opts: { quality: 0.65, pageSize: 'a4', margins: 'small', orientation: 'portrait', addPageNumbers: false } as Partial<PDFOptions>,
  },
  {
    id: 'print',
    label: 'Print Ready',
    icon: <BookOpen size={14} />,
    desc: 'High quality for printing',
    opts: { quality: 0.92, pageSize: 'a4', margins: 'normal', orientation: 'portrait', addPageNumbers: true } as Partial<PDFOptions>,
  },
  {
    id: 'photo',
    label: 'Photo Book',
    icon: <Camera size={14} />,
    desc: 'Full-bleed, max quality',
    opts: { quality: 1.0, pageSize: 'a4', margins: 'none', orientation: 'landscape', addPageNumbers: false } as Partial<PDFOptions>,
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: <Archive size={14} />,
    desc: 'Compact, long-term storage',
    opts: { quality: 0.45, pageSize: 'a4', margins: 'none', orientation: 'portrait', addPageNumbers: true } as Partial<PDFOptions>,
  },
]

export default function PDFSettings({ options, imageCount, onChange, onConvert, isLoading }: Props) {
  const applyPreset = (preset: typeof PRESETS[0]) => {
    onChange({ ...options, ...preset.opts })
  }

  return (
    <div>
      <div className="section-head">
        <h2 style={{ fontSize: '1.25rem' }}>Export Settings</h2>
      </div>

      {/* ── Quick presets ─────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <label className="label" style={{ marginBottom: 10 }}>Quick Presets</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                padding: '12px 14px', borderRadius: 'var(--r-sm)',
                border: '1.5px solid var(--glass-border)',
                background: 'var(--bg-secondary)',
                cursor: 'pointer', transition: 'var(--fast)',
                textAlign: 'left', fontFamily: 'inherit',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--blue)'
                ;(e.currentTarget as HTMLElement).style.background = 'var(--bg)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 6px 12px rgba(0,0,0,0.06)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'
                ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--blue)', fontWeight: 700 }}>
                {p.icon}
                <span style={{ fontSize: '0.84rem' }}>{p.label}</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--ink-2)', lineHeight: 1.3, fontWeight: 500 }}>{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings grid */}
      <div className="settings-grid" style={{ marginBottom: 28 }}>

        {/* Filename */}
        <div>
          <label className="label" htmlFor="fileName">
            <FileText size={11} style={{ display: 'inline', marginRight: 4 }} />
            Filename
          </label>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--bg-secondary)',
            border: '2px solid var(--glass-border)',
            borderRadius: 'var(--r-sm)', overflow: 'hidden',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
          }}>
            <input
              id="fileName" type="text"
              value={options.fileName}
              onChange={e => onChange(set(options, 'fileName', e.target.value))}
              style={{ flex: 1, border: 'none', background: 'transparent', boxShadow: 'none', borderRadius: 0, fontWeight: 500 }}
              placeholder="my-document"
            />
            <span style={{ paddingRight: 12, color: 'var(--ink-2)', fontSize: '0.88rem', fontWeight: 700, flexShrink: 0 }}>.pdf</span>
          </div>
        </div>

        {/* Page size */}
        <div>
          <label className="label" htmlFor="pageSize">
            <Layout size={11} style={{ display: 'inline', marginRight: 4 }} />
            Page Size
          </label>
          <select id="pageSize" value={options.pageSize} onChange={e => onChange(set(options, 'pageSize', e.target.value))}>
            <option value="a4">A4 · 210 × 297 mm</option>
            <option value="letter">US Letter · 8.5 × 11 in</option>
            <option value="a3">A3 · 297 × 420 mm</option>
            <option value="a5">A5 · 148 × 210 mm</option>
            <option value="legal">Legal · 8.5 × 14 in</option>
            <option value="tabloid">Tabloid · 11 × 17 in</option>
          </select>
        </div>

        {/* Orientation */}
        <div>
          <label className="label">
            <ArrowUpDown size={11} style={{ display: 'inline', marginRight: 4 }} />
            Orientation
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['portrait', 'landscape'] as const).map(o => (
              <button
                key={o}
                className={`btn ${options.orientation === o ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  flex: 1, padding: '10px 12px',
                  fontSize: '0.85rem', borderRadius: 'var(--r-sm)',
                  overflow: 'hidden', minWidth: 0,
                  whiteSpace: 'nowrap', justifyContent: 'center',
                }}
                onClick={() => onChange(set(options, 'orientation', o))}
              >
                {o === 'portrait' ? 'Portrait' : 'Landscape'}
              </button>
            ))}
          </div>
        </div>

        {/* Margins */}
        <div>
          <label className="label" htmlFor="margins">
            <Maximize2 size={11} style={{ display: 'inline', marginRight: 4 }} />
            Margins
          </label>
          <select id="margins" value={options.margins} onChange={e => onChange(set(options, 'margins', e.target.value as any))}>
            <option value="none">None — Full bleed</option>
            <option value="small">Small — 5 mm</option>
            <option value="normal">Normal — 10 mm</option>
            <option value="wide">Wide — 20 mm</option>
          </select>
        </div>

        {/* Quality slider — full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label className="label" htmlFor="quality" style={{ marginBottom: 0 }}>Image Quality</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <QualityLabel quality={options.quality} />
              <span style={{
                fontSize: '0.78rem', color: 'var(--ink-3)',
                background: 'var(--bg-secondary)', padding: '2px 8px',
                borderRadius: 'var(--r-pill)', border: '1px solid rgba(0,0,0,0.07)'
              }}>
                {Math.round(options.quality * 100)}% · {getFileSizeHint(options.quality, imageCount)}
              </span>
            </div>
          </div>
          <input
            id="quality" type="range" min="0.1" max="1" step="0.05"
            value={options.quality}
            onChange={e => onChange(set(options, 'quality', parseFloat(e.target.value)))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>Smaller file</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>Best quality</span>
          </div>
        </div>

      </div>

      {/* ── Toggles section ── */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 20, marginBottom: 28 }}>

        {/* Page numbers toggle */}
        <div className="toggle-wrapper">
          <div>
            <span className="toggle-label">
              <Hash size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              Add Page Numbers
            </span>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-3)', marginTop: 2 }}>
              Printed at the bottom center of each page
            </p>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={options.addPageNumbers}
              onChange={e => onChange(set(options, 'addPageNumbers', e.target.checked))} />
            <span className="toggle-track" />
          </label>
        </div>

        {/* Page number style options — shown when addPageNumbers is on */}
        {options.addPageNumbers && (
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 'var(--r-md)',
            padding: '16px', marginTop: 4, marginBottom: 16,
            border: '1px solid rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {PAGE_NUM_STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => onChange(set(options, 'pageNumberStyle', s.id))}
                  className={options.pageNumberStyle === s.id ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{
                    padding: '7px 14px', fontSize: '0.82rem',
                    borderRadius: 'var(--r-sm)', flexDirection: 'column', gap: 2, minWidth: 72
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{s.label}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.75, fontFamily: 'monospace' }}>{s.desc}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="label" style={{ marginBottom: 6 }}>
                <Type size={11} style={{ display: 'inline', marginRight: 4 }} />
                Font Size — {options.pageNumberSize}pt
              </label>
              <input
                type="range" min="7" max="14" step="1"
                value={options.pageNumberSize}
                onChange={e => onChange(set(options, 'pageNumberSize', parseInt(e.target.value)))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>Tiny (7pt)</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>Large (14pt)</span>
              </div>
            </div>
          </div>
        )}

        {/* Watermark toggle */}
        <div>
          <div className="toggle-wrapper" style={{ alignItems: 'flex-start' }}>
            <div>
              <span className="toggle-label">
                <Droplets size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                Include Watermark
              </span>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-3)', marginTop: 2 }}>
                A subtle label at the bottom-right — <strong style={{ color: 'var(--ink-2)' }}>won't cover any content</strong>
              </p>
            </div>
            <label className="toggle" style={{ marginTop: 3 }}>
              <input type="checkbox" checked={options.includeWatermark}
                onChange={e => onChange(set(options, 'includeWatermark', e.target.checked))} />
              <span className="toggle-track" />
            </label>
          </div>

          <div style={{
            borderRadius: 12, padding: '10px 14px', marginTop: 4,
            background: options.includeWatermark ? 'rgba(52,199,89,0.08)' : 'rgba(0,113,227,0.05)',
            border: `1px solid ${options.includeWatermark ? 'rgba(52,199,89,0.2)' : 'rgba(0,113,227,0.1)'}`,
            display: 'flex', gap: 10, alignItems: 'flex-start',
            transition: 'all 0.3s'
          }}>
            {options.includeWatermark
              ? <Heart size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
              : <Info size={14} color="var(--blue)" style={{ flexShrink: 0, marginTop: 1 }} />
            }
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-2)', lineHeight: 1.45, margin: 0 }}>
              {options.includeWatermark
                ? "Thank you! This tiny watermark helps PDFTools grow organically. It's placed safely outside all content areas."
                : "We'd really appreciate if you kept the watermark on — it helps others discover this free tool and won't cut any content."
              }
            </p>
          </div>
        </div>

      </div>

      {/* Convert button */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '16px', fontSize: '1rem', borderRadius: 'var(--r-md)', letterSpacing: '-0.01em' }}
        onClick={onConvert}
        disabled={isLoading || imageCount === 0}
      >
        {isLoading
          ? <><Loader2 size={18} className="spinner" style={{ marginRight: 6 }} />Generating PDF…</>
          : <><Download size={18} />Convert &amp; Download PDF</>
        }
      </button>

      {imageCount > 0 && (
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--ink-3)', marginTop: 10 }}>
          {imageCount} page{imageCount !== 1 ? 's' : ''} · Est. {getFileSizeHint(options.quality, imageCount)} · {options.pageSize.toUpperCase()} {options.orientation}
        </p>
      )}
    </div>
  )
}
