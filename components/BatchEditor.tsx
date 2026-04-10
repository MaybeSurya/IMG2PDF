'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Crop, RotateCw, FlipHorizontal,
  Sun, SunDim, Contrast, Trash2, CheckSquare, Square,
  RefreshCw, ArrowDownAZ, ArrowUpZA, ArrowUpDown, Copy
} from 'lucide-react'

interface Props {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onApplyEdit: (type: string, value?: any) => void
  onDeleteAll: () => void
  onCropSelected: () => void
  onSort: (mode: 'name-asc' | 'name-desc' | 'size-asc' | 'size-desc' | 'reverse') => void
  onDuplicateSelected: () => void
}

interface ToolDef {
  id: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  singleOnly?: boolean
}

export default function BatchEditor({
  selectedCount, totalCount, onSelectAll, onApplyEdit,
  onDeleteAll, onCropSelected, onSort, onDuplicateSelected
}: Props) {
  const allSelected = selectedCount === totalCount && totalCount > 0
  const singleSelected = selectedCount === 1
  const hasSelection = selectedCount > 0

  const tools: ToolDef[] = [
    { id: 'crop',    icon: <Crop size={14} />,          label: 'Crop',    onClick: onCropSelected,                singleOnly: true },
    { id: 'cw',     icon: <RotateCw size={14} />,       label: 'Rotate',  onClick: () => onApplyEdit('rotate90') },
    { id: 'flip',   icon: <FlipHorizontal size={14} />, label: 'Mirror',  onClick: () => onApplyEdit('flipH') },
    { id: 'sep1',   icon: null,                          label: '',        onClick: () => {} },
    { id: 'bup',    icon: <Sun size={14} />,             label: 'Lighter', onClick: () => onApplyEdit('brightnessUp') },
    { id: 'bdown',  icon: <SunDim size={14} />,          label: 'Darker',  onClick: () => onApplyEdit('brightnessDown') },
    { id: 'cup',    icon: <Contrast size={14} />,        label: 'C+',      onClick: () => onApplyEdit('contrastUp') },
    { id: 'cdown',  icon: null,                          label: 'C−',      onClick: () => onApplyEdit('contrastDown') },
    { id: 'sep2',   icon: null,                          label: '',        onClick: () => {} },
    { id: 'dup',    icon: <Copy size={14} />,            label: 'Dupe',    onClick: onDuplicateSelected },
    { id: 'reset',  icon: <RefreshCw size={14} />,       label: 'Reset',   onClick: () => onApplyEdit('reset') },
  ]

  const sortOptions = [
    { id: 'name-asc',  icon: <ArrowDownAZ size={13} />,  label: 'A → Z' },
    { id: 'name-desc', icon: <ArrowUpZA size={13} />,    label: 'Z → A' },
    { id: 'size-asc',  icon: <ArrowUpDown size={13} />,  label: 'Size ↑' },
    { id: 'size-desc', icon: <ArrowUpDown size={13} style={{ transform: 'scaleY(-1)' }} />, label: 'Size ↓' },
    { id: 'reverse',   icon: <RefreshCw size={13} />,    label: 'Reverse' },
  ] as const

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

        {/* Right: tools + sort + delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>

          {/* Sort dropdown */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <details style={{ position: 'relative' }}>
              <summary style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 'var(--r-sm)',
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'var(--bg-secondary)',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                color: 'var(--ink-2)', listStyle: 'none', fontFamily: 'inherit',
                userSelect: 'none',
              }}>
                <ArrowDownAZ size={13} /> Sort
              </summary>
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--r-md)', padding: 6, zIndex: 50,
                boxShadow: 'var(--glass-shadow)', minWidth: 140,
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                {sortOptions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => onSort(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', borderRadius: 'var(--r-sm)',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      fontSize: '0.82rem', fontWeight: 500, color: 'var(--ink-2)',
                      fontFamily: 'inherit', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* Edit tools (shown when selection exists) */}
          <AnimatePresence>
            {hasSelection && (
              <motion.div
                key="tools"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'var(--bg)',
                  border: '1.5px solid var(--glass-border)',
                  borderRadius: 'var(--r-md)',
                  padding: '4px 10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              >
                {tools.map(t => {
                  // separators
                  if (t.id === 'sep1' || t.id === 'sep2') return (
                    <div key={t.id} style={{ width: 1, height: 20, background: 'var(--ink-4)', opacity: 0.3, margin: '0 4px', flexShrink: 0 }} />
                  )
                  const disabled = t.singleOnly && !singleSelected
                  const isCdown = t.id === 'cdown'
                  return (
                    <motion.button
                      key={t.id}
                      whileHover={disabled ? {} : { scale: 1.08 }}
                      whileTap={disabled ? {} : { scale: 0.92 }}
                      onClick={disabled ? undefined : t.onClick}
                      title={t.label + (t.singleOnly ? ' (select 1 image)' : '')}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', gap: 2,
                        padding: '6px 8px', borderRadius: 8,
                        background: 'transparent', border: 'none',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        color: disabled ? 'var(--ink-4)' : 'var(--ink)',
                        transition: 'background 0.15s, color 0.15s',
                        fontFamily: 'inherit', minWidth: 42,
                      }}
                      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      {isCdown
                        ? <span style={{ fontSize: 13, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.05em' }}>C−</span>
                        : t.icon
                      }
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1, opacity: 0.9 }}>
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
