'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, FileText, X, Info, Edit2, Save } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { markPDF, isPDFTools } from '@/lib/pdfMetadata'
import type { ToastType } from '../app/page'

interface Props {
  toast: (type: ToastType, message: string, sub?: string) => void
}

interface Metadata {
  title: string
  author: string
  subject: string
  keywords: string
  creator: string
  producer: string
  pageCount: number
  fileSize: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function MetadataTool({ toast }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [meta, setMeta] = useState<Metadata | null>(null)
  const [edits, setEdits] = useState<Partial<Metadata>>({})
  const [isProtected, setIsProtected] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf')
    if (!pdfFiles.length) { toast('error', 'Only PDF files are supported'); return }
    try {
      const f = pdfFiles[0]
      const buffer = await f.arrayBuffer()
      const doc = await PDFDocument.load(buffer)
      const m: Metadata = {
        title: doc.getTitle() ?? '',
        author: doc.getAuthor() ?? '',
        subject: doc.getSubject() ?? '',
        keywords: doc.getKeywords() ?? '',
        creator: doc.getCreator() ?? '',
        producer: doc.getProducer() ?? '',
        pageCount: doc.getPageCount(),
        fileSize: formatBytes(f.size),
      }
      setFile(f)
      setFileBuffer(buffer)
      setMeta(m)
      
      const protectedPDF = isPDFTools(m)
      setIsProtected(protectedPDF)

      setEdits({
        title: m.title,
        author: m.author,
        subject: m.subject,
        keywords: m.keywords,
      })
      toast('success', 'Metadata loaded')
    } catch {
      toast('error', 'Failed to load PDF')
    }
  }

  const handleSave = async () => {
    if (!fileBuffer || !file) return
    setIsSaving(true)
    try {
      const doc = await PDFDocument.load(fileBuffer)
      if (edits.title !== undefined) doc.setTitle(edits.title)
      if (edits.author !== undefined) doc.setAuthor(edits.author)
      if (edits.subject !== undefined) doc.setSubject(edits.subject)
      if (edits.keywords !== undefined) doc.setKeywords([edits.keywords])
      markPDF(doc)
      const bytes = await doc.save()
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stem = file.name.replace(/\.pdf$/i, '')
      a.href = url; a.download = `${stem}-updated.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('success', 'Metadata saved!', 'Your updated PDF is downloading.')
    } catch {
      toast('error', 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const field = (label: string, key: keyof Metadata, editable = true) => (
    <div key={key} style={{ marginBottom: 20 }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {editable && !isProtected ? (
        <input
          type="text"
          value={(edits[key as keyof typeof edits] ?? '') as string}
          onChange={e => setEdits(prev => ({ ...prev, [key]: e.target.value }))}
          className="ui-input"
          style={{ width: '100%', padding: '10px 14px', fontSize: '0.95rem' }}
          placeholder={`Enter ${label.toLowerCase()}…`}
        />
      ) : (
        <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', color: 'var(--ink-2)', fontSize: '0.95rem' }}>
          {(meta![key as keyof Metadata] as string) || <span style={{ color: 'var(--ink-4)', fontStyle: 'italic' }}>—</span>}
        </div>
      )}
    </div>
  )

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
            <Info size={44} strokeWidth={1.5} color={isDragOver ? 'var(--blue)' : 'var(--ink-3)'} style={{ marginBottom: 16 }} />
            <p style={{ fontWeight: 700, fontSize: '1.2rem', color: isDragOver ? 'var(--blue)' : 'var(--ink)', marginBottom: 6 }}>
              Drop PDF to View & Edit Metadata
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-3)' }}>Inspect title, author, dates, page count and more.</p>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="application/pdf" onChange={e => { if (e.target.files) processFile(e.target.files) }} hidden />

      {file && meta && (
        <div className="glass" style={{ padding: 24 }}>
          {/* File header */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '12px 16px',
            background: 'var(--bg-secondary)', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)', marginBottom: 24
          }}>
            <FileText size={24} color="var(--blue)" style={{ marginRight: 16 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: 2 }}>{meta.pageCount} pages · {meta.fileSize}</div>
            </div>
            <button onClick={() => { setFile(null); setFileBuffer(null); setMeta(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--ink-4)' }}>
              <X size={18} />
            </button>
          </div>

          {/* Read-only stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Pages', value: meta.pageCount },
              { label: 'File Size', value: meta.fileSize },
              { label: 'Creator', value: meta.creator || '—' },
              { label: 'Producer', value: meta.producer || '—' },
            ].map(s => (
              <div key={s.label} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(s.value)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Edit2 size={16} color="var(--blue)" />
            <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.95rem' }}>Edit Metadata</span>
          </div>

          {isProtected && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 24, fontSize: '0.85rem', color: '#ef4444', display: 'flex', gap: 8 }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>This PDF was securely generated by PDFTools. Its metadata cannot be modified to protect its integrity and watermark.</div>
            </div>
          )}

          {field('Title', 'title')}
          {field('Author', 'author')}
          {field('Subject', 'subject')}
          {field('Keywords', 'keywords')}

          <div style={{ height: 1, background: 'var(--glass-border)', margin: '24px 0' }} />

          {!isProtected && (
            <button className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: '1rem', opacity: isSaving ? 0.6 : 1 }} onClick={handleSave} disabled={isSaving}>
              <Save size={20} /> Save Changes & Download
            </button>
          )}
        </div>
      )}
    </div>
  )
}
