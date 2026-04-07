'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Crop, RotateCw, RotateCcw, FlipHorizontal,
  Sun, SunDim, Contrast, Trash2, CheckSquare, Square, X,
  RefreshCw
} from 'lucide-react'

interface Props {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onApplyEdit: (type: string, value?: any) => void
  onDeleteAll: () => void
  onCropSelected: () => void
}

interface ToolDef {
  id: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  singleOnly?: boolean
}

export default function BatchEditor({ selectedCount, totalCount, onSelectAll, onApplyEdit, onDeleteAll, onCropSelected }: Props) {
  const allSelected = selectedCount === totalCount && totalCount > 0
  const singleSelected = selectedCount === 1

  const tools: ToolDef[] = [
    { id: 'crop',    icon: <Crop size={14} />,          label: 'Crop',    onClick: onCropSelected,                    singleOnly: true },
    { id: 'cw',     icon: <RotateCw size={14} />,       label: 'Rotate',  onClick: () => onApplyEdit('rotate90') },
    { id: 'ccw',    icon: <RotateCcw size={14} />,      label: 'Flip ↔',  onClick: () => onApplyEdit('rotate270') },
    { id: 'flip',   icon: <FlipHorizontal size={14} />, label: 'Mirror',  onClick: () => onApplyEdit('flipH') },
    { id: 'sep1',   icon: null,                          label: '',        onClick: () => {} },
    { id: 'bup',    icon: <Sun size={14} />,             label: 'Brighter', onClick: () => onApplyEdit('brightnessUp') },
    { id: 'bdown',  icon: <SunDim size={14} />,          label: 'Darker',  onClick: () => onApplyEdit('brightnessDown') },
    { id: 'cup',    icon: <Contrast size={14} />,        label: 'C+ ',     onClick: () => onApplyEdit('contrastUp') },
    { id: 'cdown',  icon: <Contrast size={14} />,        label: 'C−',      onClick: () => onApplyEdit('contrastDown') },
    { id: 'sep2',   icon: null,                          label: '',        onClick: () => {} },
    { id: 'reset',  icon: <RefreshCw size={14} />,       label: 'Reset',   onClick: () => onApplyEdit('reset') },
  ]

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>

        {/* Left: select all counter */}
        <button
          className="btn btn-ghost"
          style={{ padding: '6px 12px', gap: 8, borderRadius: 'var(--r-sm)', border: '1px solid rgba(0,0,0,0.07)' }}
          onClick={onSelectAll}
        >
          {allSelected
            ? <CheckSquare size={15} color="var(--blue)" strokeWidth={2.5} />
            : <Square size={15} strokeWidth={2} />
          }
          <span style={{ fontSize: '0.87rem', color: 'var(--ink-2)', fontWeight: 500 }}>
            {selectedCount > 0
              ? <><strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{selectedCount}</strong> of {totalCount} selected</>
              : <><strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{totalCount}</strong> image{totalCount !== 1 ? 's' : ''}</>
            }
          </span>
        </button>

        {/* Right: tools + delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>

          <AnimatePresence>
            {selectedCount > 0 && (
              <motion.div
                key="tools"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 'var(--r-md)',
                  padding: '4px 8px',
                }}
              >
                {tools.map(t => {
                  if (!t.icon) return (
                    <div key={t.id} style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.1)', margin: '0 2px', flexShrink: 0 }} />
                  )
                  const disabled = t.singleOnly && !singleSelected
                  return (
                    <motion.button
                      key={t.id}
                      whileHover={disabled ? {} : { scale: 1.08 }}
                      whileTap={disabled ? {} : { scale: 0.92 }}
                      onClick={disabled ? undefined : t.onClick}
                      title={t.label + (t.singleOnly ? ' (select 1 image)' : '')}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 2, padding: '5px 7px', borderRadius: 8,
                        background: 'transparent', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                        color: disabled ? 'var(--ink-4)' : 'var(--ink-2)',
                        transition: 'background 0.15s, color 0.15s',
                        fontFamily: 'inherit', minWidth: 38,
                      }}
                      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = '#fff' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      {t.id === 'cdown'
                        ? <span style={{ fontSize: 12, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.05em' }}>C−</span>
                        : t.icon
                      }
                      <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.01em', textTransform: 'uppercase', lineHeight: 1 }}>
                        {t.label}
                      </span>
                    </motion.button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <button className="btn btn-danger" style={{ padding: '8px 14px', fontSize: '0.84rem' }} onClick={onDeleteAll}>
            <Trash2 size={14} />
            Clear all
          </button>
        </div>
      </div>
    </div>
  )
}
