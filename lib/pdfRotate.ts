import { PDFDocument, degrees } from 'pdf-lib'
import { markPDF } from '@/lib/pdfMetadata'
import { parsePageRanks } from './pdfExtract'

export async function rotatePDFPages(
  pdfBuffer: ArrayBuffer,
  rangeStr: string,
  angle: number, // Must be 90, 180, or 270
  onProgress: (pct: number, msg: string) => void
): Promise<Blob> {
  onProgress(10, 'Loading document...')
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  
  const totalPages = pdfDoc.getPageCount()
  const targetIndices = parsePageRanks(rangeStr, totalPages)
  
  if (targetIndices.length === 0) {
    throw new Error('No valid pages selected for rotation.')
  }

  const pages = pdfDoc.getPages()
  
  onProgress(40, `Rotating ${targetIndices.length} page(s)...`)
  
  for (const index of targetIndices) {
    if (index >= 0 && index < pages.length) {
      const page = pages[index]
      const currentRotation = page.getRotation().angle
      // Keep it within 0-360 mapped angles
      const newRotation = (currentRotation + angle) % 360
      page.setRotation(degrees(newRotation))
    }
  }

  onProgress(90, 'Finalizing file...')
  markPDF(pdfDoc)
  const rotatedBytes = await pdfDoc.save()
  onProgress(100, 'Done!')

  return new Blob([new Uint8Array(rotatedBytes)], { type: 'application/pdf' })
}
