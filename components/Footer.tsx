'use client'

import { Heart, Mail } from 'lucide-react'

// Inline SVG icons for platforms not in installed lucide version
const LinkedinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
)

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
)

const socials = [
  {
    icon: <LinkedinIcon />,
    href: 'https://linkedin.com/in/MaybeSurya',
    label: 'LinkedIn',
    hoverColor: '#0A66C2',
  },
  {
    icon: <GithubIcon />,
    href: 'https://github.com/MaybeSurya',
    label: 'GitHub',
    hoverColor: 'var(--ink)',
  },
  {
    icon: <Mail size={15} strokeWidth={2} />,
    href: 'mailto:hey@maybesurya.dev',
    label: 'Email',
    hoverColor: 'var(--blue)',
  },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Branding */}
        <div className="footer-brand">
          <span>Made with</span>
          <Heart size={14} className="beating-heart" aria-label="love" />
          <a
            href="https://maybesurya.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-name"
          >
            MaybeSurya.dev
          </a>
        </div>

        {/* Social links */}
        <div className="footer-socials">
          {socials.map(s => (
            <a
              key={s.label}
              href={s.href}
              target={s.label !== 'Email' ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="footer-social-link"
              title={s.label}
              aria-label={s.label}
              style={{ '--hover-color': s.hoverColor } as any}
            >
              {s.icon}
              <span>{s.label}</span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
