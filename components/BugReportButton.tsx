'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, X, Send, ChevronDown, ChevronUp, Clipboard } from 'lucide-react'

const CATEGORIES = ['PDF to Images', 'Merge PDFs', 'Extract Pages', 'Watermark', 'Page Numbers', 'Rotate Pages', 'Metadata', 'Compress PDF', 'UI / Design', 'Other']
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export default function BugReportButton() {
  const [open, setOpen]     = useState(false)
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [cat, setCat]       = useState(CATEGORIES[0])
  const [sev, setSev]       = useState(SEVERITIES[1])
  const [desc, setDesc]     = useState('')
  const [steps, setSteps]   = useState('')
  const [copied, setCopied] = useState(false)

  const buildReport = () =>
    `Bug Report — PDFTools by MaybeSurya.dev
=======================================
Reporter : ${name || '(anonymous)'}
Email    : ${email || '(not provided)'}
Tool     : ${cat}
Severity : ${sev}

Description
-----------
${desc}

Steps to Reproduce
------------------
${steps}

Environment
-----------
Browser : ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}
URL     : ${typeof window !== 'undefined' ? window.location.href : 'Unknown'}
Date    : ${new Date().toISOString()}`

  const handleSend = () => {
    const body    = encodeURIComponent(buildReport())
    const subject = encodeURIComponent(`[PDFTools Bug] [${sev}] ${cat} — ${desc.slice(0, 60)}`)
    window.open(`mailto:bugs@maybesurya.dev?subject=${subject}&body=${body}`)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildReport())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canSend = desc.trim().length >= 10

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed', bottom: 24, right: 80, zIndex: 900,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderRadius: 40,
          background: 'var(--glass-bg)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)',
          color: 'var(--ink-2)', fontWeight: 600, fontSize: '0.85rem',
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
        }}
      >
        <Bug size={16} /> Report a Bug
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              style={{
                width: '100%', maxWidth: 560, maxHeight: '90vh',
                background: 'var(--bg)', borderRadius: 'var(--r-lg, 20px)',
                border: '1px solid var(--glass-border)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 8, borderRadius: 10, background: 'rgba(239,68,68,0.1)' }}>
                  <Bug size={20} color="#ef4444" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>Report a Bug</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)' }}>Sent to bugs@maybesurya.dev</div>
                </div>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--ink-4)', borderRadius: 8 }}>
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Your Name (optional)</label>
                    <input className="ui-input" value={name} onChange={e => setName(e.target.value)} placeholder="Anonymous" style={{ width: '100%', padding: '9px 12px', fontSize: '0.9rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Email (optional)</label>
                    <input className="ui-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="For follow-up" style={{ width: '100%', padding: '9px 12px', fontSize: '0.9rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Tool / Category</label>
                    <select value={cat} onChange={e => setCat(e.target.value)} className="ui-input" style={{ width: '100%', padding: '9px 12px', fontSize: '0.9rem' }}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Severity</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {SEVERITIES.map(s => (
                        <button key={s} onClick={() => setSev(s)} style={{
                          flex: 1, padding: '8px 0', fontSize: '0.78rem', borderRadius: 8,
                          background: sev === s ? ({ Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Critical: '#7c3aed' } as any)[s] : 'var(--bg-secondary)',
                          color: sev === s ? '#fff' : 'var(--ink-3)',
                          border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600
                        }}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
                    Bug Description <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} className="ui-input"
                    placeholder="Describe what went wrong (minimum 10 characters)…"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Steps to Reproduce</label>
                  <textarea value={steps} onChange={e => setSteps(e.target.value)} rows={3} className="ui-input"
                    placeholder={"1. Upload a PDF...\n2. Click...\n3. Error appeared…"}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--ink-3)' }}>
                  Your browser info and timestamp are automatically included.
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '0 24px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--ink-4)' }}>
                  If the button doesn't open your mail client, email directly to <code style={{ color: 'var(--blue)', background: 'var(--blue-light)', padding: '2px 6px', borderRadius: 4 }}>bugs@maybesurya.dev</code>
                </div>
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16, display: 'flex', gap: 10 }}>
                  <button onClick={handleCopy} style={{
                  padding: '10px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)', color: 'var(--ink-2)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.9rem'
                }}>
                  <Clipboard size={16} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handleSend} disabled={!canSend} style={{
                  flex: 1, padding: '10px 16px', borderRadius: 'var(--r-md)', border: 'none',
                  background: canSend ? 'var(--blue)' : 'var(--ink-4)', color: '#fff',
                  cursor: canSend ? 'pointer' : 'not-allowed', opacity: canSend ? 1 : 0.6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s'
                }}>
                  <Send size={16} /> Send Bug Report
                </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
