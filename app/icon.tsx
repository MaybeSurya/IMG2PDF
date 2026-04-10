import { ImageResponse } from 'next/og'

export const contentType = 'image/png'
export const size = { width: 512, height: 512 }

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '4px solid #e9ecef',
          borderRadius: '112px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '240px',
            height: '280px',
            background: 'linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%)',
            borderRadius: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translateY(-20px)',
            boxShadow: '0 16px 32px rgba(255, 75, 43, 0.4)',
          }}
        >
          <div
            style={{
              color: '#ffffff',
              fontSize: '84px',
              fontWeight: 900,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '2px',
            }}
          >
            PDF
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '36px',
            fontWeight: 700,
            color: '#1a1c1d',
            fontFamily: 'Inter, sans-serif',
            opacity: 0.8,
          }}
        >
          MaybeSurya.dev
        </div>
      </div>
    ),
    { ...size }
  )
}
