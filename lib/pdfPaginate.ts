import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { markPDF } from '@/lib/pdfMetadata'

export type PageNumberFormat   = 'simple' | 'fraction' | 'dashed' | 'parentheses' | 'roman'
export type PageNumberPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
export type PageNumberFont     = 'Helvetica' | 'HelveticaBold' | 'TimesRoman' | 'TimesRomanBoldItalic' | 'Courier'

export interface PaginateOptions {
  format:   PageNumberFormat
  position: PageNumberPosition
  margin:   number
  fontSize: number
  colorHex: string
  fontName: PageNumberFont
  startFrom: number
}

function hexToRgb(hex: string) {
  const c = hex.replace('#', '')
  return rgb(parseInt(c.substring(0,2),16)/255, parseInt(c.substring(2,4),16)/255, parseInt(c.substring(4,6),16)/255)
}

// Simple integer-to-roman-numeral for page numbers
function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1]
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I']
  let result = ''
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i] }
  }
  return result
}

function formatPageString(format: PageNumberFormat, current: number, total: number, startFrom: number): string {
  const actual = current + startFrom - 1
  if (format === 'fraction')     return `${actual} / ${total}`
  if (format === 'dashed')       return `— ${actual} —`
  if (format === 'parentheses')  return `(${actual})`
  if (format === 'roman')        return toRoman(actual)
  return `${actual}`
}

const FONT_MAP: Record<PageNumberFont, StandardFonts> = {
  Helvetica:            StandardFonts.Helvetica,
  HelveticaBold:         StandardFonts.HelveticaBold,
  TimesRoman:            StandardFonts.TimesRoman,
  TimesRomanBoldItalic:  StandardFonts.TimesRomanBoldItalic,
  Courier:               StandardFonts.Courier,
}

export async function paginatePDF(
  pdfBuffer: ArrayBuffer,
  options: PaginateOptions,
  onProgress: (pct: number, msg: string) => void
): Promise<Blob> {
  onProgress(10, 'Loading document...')
  const pdfDoc = await PDFDocument.load(pdfBuffer)

  onProgress(30, 'Embedding font...')
  const font = await pdfDoc.embedFont(FONT_MAP[options.fontName] ?? StandardFonts.Helvetica)
  const textColor = hexToRgb(options.colorHex)

  const pages = pdfDoc.getPages()
  const total = pages.length

  for (let i = 0; i < total; i++) {
    onProgress(40 + Math.round((i / total) * 45), `Paginating page ${i + 1}/${total}...`)
    const page  = pages[i]
    const { width, height } = page.getSize()
    const text  = formatPageString(options.format, i + 1, total, options.startFrom)
    const tw    = font.widthOfTextAtSize(text, options.fontSize)
    const th    = font.heightAtSize(options.fontSize)
    const m     = options.margin

    let x = m
    if (options.position.includes('center')) x = (width - tw) / 2
    else if (options.position.includes('right')) x = width - m - tw

    let y = m
    if (options.position.includes('top')) y = height - m - th

    page.drawText(text, { x, y, size: options.fontSize, font, color: textColor })
  }

  onProgress(90, 'Finalizing...')
  markPDF(pdfDoc)
  const bytes = await pdfDoc.save()
  onProgress(100, 'Done!')
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
}
