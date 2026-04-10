import { ImageResponse } from 'next/og'

export const contentType = 'image/png'
export const size = { width: 180, height: 180 }

export default function AppleIcon() {
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
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '90px',
            height: '110px',
            background: 'linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translateY(-10px)',
          }}
        >
          <div
            style={{
              color: '#ffffff',
              fontSize: '32px',
              fontWeight: 900,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '1px',
            }}
          >
            PDF
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#1a1c1d',
            fontFamily: 'Inter, sans-serif',
            opacity: 0.8,
          }}
        >
         by MaybeSurya.dev
        </div>
      </div>
    ),
    { ...size }
  )
}
