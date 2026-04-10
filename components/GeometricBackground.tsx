"use client";

import React from "react";

export default function AmbientBackground({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* CSS animated gradient orbs — theme-aware */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        {/* Orb 1 — top left, blue */}
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '55vw', height: '55vw', maxWidth: 700, maxHeight: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,113,227,0.10) 0%, transparent 70%)',
          animation: 'floatOrb1 18s ease-in-out infinite',
          filter: 'blur(1px)',
        }} />
        {/* Orb 2 — bottom right, violet */}
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-5%',
          width: '50vw', height: '50vw', maxWidth: 640, maxHeight: 640,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,80,220,0.09) 0%, transparent 70%)',
          animation: 'floatOrb2 22s ease-in-out infinite',
          filter: 'blur(1px)',
        }} />
        {/* Orb 3 — center, accent */}
        <div style={{
          position: 'absolute', top: '40%', left: '30%',
          width: '40vw', height: '40vw', maxWidth: 500, maxHeight: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,150,0.06) 0%, transparent 70%)',
          animation: 'floatOrb3 26s ease-in-out infinite',
          filter: 'blur(1px)',
        }} />
      </div>

      {/* Actual page content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>

      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(4%, 6%) scale(1.04); }
          66%       { transform: translate(-3%, 3%) scale(0.97); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(-5%, -4%) scale(1.06); }
          70%       { transform: translate(3%, -2%) scale(0.95); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-4%, 5%) scale(1.08); }
        }
        [data-theme='dark'] .orb-blue   { background: radial-gradient(circle, rgba(0,113,227,0.15) 0%, transparent 70%) !important; }
        [data-theme='dark'] .orb-violet { background: radial-gradient(circle, rgba(120,80,220,0.12) 0%, transparent 70%) !important; }
        [data-theme='dark'] .orb-teal   { background: radial-gradient(circle, rgba(0,200,150,0.08) 0%, transparent 70%) !important; }
      `}</style>
    </div>
  );
}
