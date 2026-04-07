'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Monitor, Share } from 'lucide-react'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('pwa-dismissed')) { setDismissed(true); return }

    // Detect platform
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    const isAndroid = /Android/.test(ua)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    
    if (isInStandaloneMode) { setInstalled(true); return }

    if (isIOS) {
      setPlatform('ios')
    } else {
      // Listen for Android/desktop install prompt
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setPlatform(isAndroid ? 'android' : 'desktop')
      })
      window.addEventListener('appinstalled', () => { setInstalled(true); setPlatform(null) })
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
    setPlatform(null)
  }

  const dismiss = () => {
    setDismissed(true)
    setPlatform(null)
    localStorage.setItem('pwa-dismissed', '1')
  }

  const show = platform && !dismissed && !installed

  const content: Record<NonNullable<typeof platform>, { icon: React.ReactNode; title: string; msg: string; cta: string }> = {
    android: {
      icon: <Smartphone size={18} />,
      title: 'Install on Android',
      msg: 'Add IMG2PDF to your home screen for the full app experience.',
      cta: 'Install App',
    },
    ios: {
      icon: <Share size={18} />,
      title: 'Add to Home Screen',
      msg: 'In Safari, tap the Share button ⎋ then "Add to Home Screen".',
      cta: '',
    },
    desktop: {
      icon: <Monitor size={18} />,
      title: 'Install Web App',
      msg: 'Install IMG2PDF on your computer for faster access.',
      cta: 'Install',
    },
  }

  return (
    <AnimatePresence>
      {show && platform && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          style={{
            position: 'fixed', bottom: 20, left: 16, right: 16,
            zIndex: 800,
            background: 'var(--card-bg)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
            padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
            maxWidth: 480, margin: '0 auto',
          }}
        >
          {/* Icon badge */}
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(145deg, #0071e3, #0059b5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff'
          }}>
            {content[platform].icon}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)', marginBottom: 2 }}>
              {content[platform].title}
            </p>
            <p style={{ fontSize: '0.79rem', color: 'var(--ink-2)', lineHeight: 1.4 }}>
              {content[platform].msg}
            </p>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {content[platform].cta && (
              <button
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: 10 }}
                onClick={handleInstall}
              >
                <Download size={14} />
                {content[platform].cta}
              </button>
            )}
            <button
              className="btn-icon"
              onClick={dismiss}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--ink)' }}
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
