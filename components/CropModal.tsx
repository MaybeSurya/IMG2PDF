'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crop, RotateCcw } from 'lucide-react'

interface Props {
  imageData: string
  imageName: string
  onSave: (croppedData: string) => void
  onClose: () => void
}

interface Rect { x: number; y: number; w: number; h: number }

export default function CropModal({ imageData, imageName, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [rect, setRect] = useState<Rect>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
  const [dragging, setDragging] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)

  const HANDLE_SIZE = 12

  // Load image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      draw()
    }
    img.src = imageData
  }, [imageData])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!

    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    // Draw image (contain)
    const scale = Math.min(W / img.width, H / img.height)
    const iw = img.width * scale
    const ih = img.height * scale
    const ox = (W - iw) / 2
    const oy = (H - ih) / 2

    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(img, ox, oy, iw, ih)

    // Darken outside crop
    const cx = ox + rect.x * iw
    const cy = oy + rect.y * ih
    const cw = rect.w * iw
    const ch = rect.h * ih

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, W, H)
    ctx.clearRect(cx, cy, cw, ch)
    ctx.drawImage(img, img.width * rect.x, img.height * rect.y, img.width * rect.w, img.height * rect.h, cx, cy, cw, ch)

    // Border
    ctx.strokeStyle = '#0071e3'
    ctx.lineWidth = 2
    ctx.strokeRect(cx, cy, cw, ch)

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 1
    for (let g = 1; g < 3; g++) {
      ctx.beginPath(); ctx.moveTo(cx + cw * g / 3, cy); ctx.lineTo(cx + cw * g / 3, cy + ch); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy + ch * g / 3); ctx.lineTo(cx + cw, cy + ch * g / 3); ctx.stroke()
    }

    // Corner handles
    ctx.fillStyle = '#fff'
    const corners = [[cx, cy], [cx + cw, cy], [cx, cy + ch], [cx + cw, cy + ch]]
    corners.forEach(([hx, hy]) => {
      ctx.beginPath()
      ctx.arc(hx, hy, HANDLE_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    })
  }, [rect])

  useEffect(() => { draw() }, [rect, draw])

  const getRelPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const bounds = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    return { x: (clientX - bounds.left) / bounds.width, y: (clientY - bounds.top) / bounds.height }
  }

  const hitTest = (pos: { x: number; y: number }, canvas: HTMLCanvasElement) => {
    const img = imgRef.current
    if (!img) return null
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    const scale = Math.min(W / img.width, H / img.height)
    const iw = img.width * scale, ih = img.height * scale
    const ox = (W - iw) / 2, oy = (H - ih) / 2
    const px = pos.x * W, py = pos.y * H
    const THRESH = HANDLE_SIZE / W

    const cx = (ox + rect.x * iw) / W, cy = (oy + rect.y * ih) / H
    const cw = rect.w * iw / W, ch = rect.h * ih / H

    const corners: [string, number, number][] = [
      ['tl', cx, cy], ['tr', cx + cw, cy], ['bl', cx, cy + ch], ['br', cx + cw, cy + ch]
    ]
    for (const [id, hx, hy] of corners) {
      if (Math.abs(px / W - hx) < THRESH * 2 && Math.abs(py / H - hy) < THRESH * 2) return id
    }
    if (px / W > cx && px / W < cx + cw && py / H > cy && py / H < cy + ch) return 'move'
    return null
  }

  const onMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!
    const pos = getRelPos(e, canvas)
    const hit = hitTest(pos, canvas)
    if (hit) { setDragging(hit); setStartPos(pos) }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const canvas = canvasRef.current!
    const pos = getRelPos(e, canvas)
    const dx = pos.x - startPos.x, dy = pos.y - startPos.y
    setStartPos(pos)
    setRect(prev => {
      let { x, y, w, h } = prev
      if (dragging === 'move') { x = Math.max(0, Math.min(1 - w, x + dx)); y = Math.max(0, Math.min(1 - h, y + dy)) }
      else {
        if (dragging.includes('r')) { w = Math.max(0.05, Math.min(1 - x, w + dx)) }
        if (dragging.includes('l')) { const nw = Math.max(0.05, w - dx); x = Math.max(0, x + (w - nw)); w = nw }
        if (dragging.includes('b')) { h = Math.max(0.05, Math.min(1 - y, h + dy)) }
        if (dragging.includes('t')) { const nh = Math.max(0.05, h - dy); y = Math.max(0, y + (h - nh)); h = nh }
      }
      return { x, y, w, h }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const img = imgRef.current!
    const canvas = document.createElement('canvas')
    const sw = Math.round(img.width * rect.w)
    const sh = Math.round(img.height * rect.h)
    canvas.width = sw; canvas.height = sh
    canvas.getContext('2d')!.drawImage(img, img.width * rect.x, img.height * rect.y, sw, sh, 0, 0, sw, sh)
    onSave(canvas.toDataURL('image/png'))
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: 24,
          width: '100%', maxWidth: 560,
          boxShadow: '0 32px 64px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crop size={18} color="var(--blue)" />
            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Crop Image</span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div
          ref={containerRef}
          style={{ position: 'relative', width: '100%', height: 340, borderRadius: 12, overflow: 'hidden', background: '#000', cursor: dragging ? 'grabbing' : 'crosshair' }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={() => setDragging(null)}
            onMouseLeave={() => setDragging(null)}
          />
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: 10, textAlign: 'center' }}>
          Drag corners or move the selection to crop
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRect({ x: 0, y: 0, w: 1, h: 1 })}>
            <RotateCcw size={14} /> Reset
          </button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : <><Crop size={14} /> Apply Crop</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
