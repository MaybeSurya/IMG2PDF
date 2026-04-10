import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import { markPDF } from '@/lib/pdfMetadata'

export interface WatermarkOptions {
  text: string
  color: string          // Hex #RRGGBB
  opacity: number        // 0-1
  orientation: 'horizontal' | 'diagonal'
  fontStyle: 'bold' | 'regular' | 'italic'
  repeat: boolean        // tile the watermark across the page
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  return rgb(
    parseInt(clean.substring(0, 2), 16) / 255,
    parseInt(clean.substring(2, 4), 16) / 255,
    parseInt(clean.substring(4, 6), 16) / 255
  )
}

function getStandardFont(style: WatermarkOptions['fontStyle']) {
  if (style === 'bold') return StandardFonts.HelveticaBold
  if (style === 'italic') return StandardFonts.HelveticaOblique
  return StandardFonts.Helvetica
}

export async function watermarkPDF(
  pdfBuffer: ArrayBuffer,
  options: WatermarkOptions,
  onProgress: (pct: number, msg: string) => void
): Promise<Blob> {
  onProgress(10, 'Loading document...')
  const pdfDoc = await PDFDocument.load(pdfBuffer)

  onProgress(30, 'Embedding fonts...')
  const font = await pdfDoc.embedFont(getStandardFont(options.fontStyle))
  const textColor = hexToRgb(options.color)

  const pages = pdfDoc.getPages()

  for (let i = 0; i < pages.length; i++) {
    onProgress(40 + Math.round((i / pages.length) * 45), `Watermarking page ${i + 1}/${pages.length}...`)
    const page = pages[i]
    const { width, height } = page.getSize()

    const fontSize = options.orientation === 'diagonal' ? width * 0.10 : width * 0.07
    const textWidth = font.widthOfTextAtSize(options.text, fontSize)
    const textHeight = font.heightAtSize(fontSize)

    if (options.orientation === 'diagonal') {
      // ── Correctly centre the rotated text ──
      // When text starts at (x,y) and is rotated 45° around that origin,
      // the visual centre of the drawn text ends up at:
      //   cx = x + (textWidth/2)*cos45 − (textHeight/2)*sin45
      //   cy = y + (textWidth/2)*sin45 + (textHeight/2)*cos45
      // We want cx = width/2 and cy = height/2, so:
      const cos45 = Math.cos(Math.PI / 4)
      const sin45 = Math.sin(Math.PI / 4)
      const x = width  / 2 - (textWidth  / 2) * cos45 + (textHeight / 2) * sin45
      const y = height / 2 - (textWidth  / 2) * sin45 - (textHeight / 2) * cos45

      if (options.repeat) {
        // Draw at 3 positions: top-left, centre, bottom-right
        const offsets = [
          { dx: -(width * 0.35), dy: -(height * 0.35) },
          { dx: 0,              dy: 0                },
          { dx:  width * 0.35,  dy:  height * 0.35  },
        ]
        for (const o of offsets) {
          page.drawText(options.text, { x: x + o.dx, y: y + o.dy, size: fontSize, font, color: textColor, opacity: options.opacity, rotate: degrees(45) })
        }
      } else {
        page.drawText(options.text, { x, y, size: fontSize, font, color: textColor, opacity: options.opacity, rotate: degrees(45) })
      }
    } else {
      // Horizontal — centred
      const x = (width - textWidth) / 2
      const y = (height - textHeight) / 2

      if (options.repeat) {
        const rows = [-height * 0.3, 0, height * 0.3]
        for (const dy of rows) {
          page.drawText(options.text, { x, y: y + dy, size: fontSize, font, color: textColor, opacity: options.opacity })
        }
      } else {
        page.drawText(options.text, { x, y, size: fontSize, font, color: textColor, opacity: options.opacity })
      }
    }
  }

  onProgress(90, 'Finalizing...')
  markPDF(pdfDoc)
  const bytes = await pdfDoc.save()
  onProgress(100, 'Done!')
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
}
