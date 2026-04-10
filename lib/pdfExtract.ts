import { PDFDocument } from 'pdf-lib'
import { markPDF } from '@/lib/pdfMetadata'

/**
 * Parses a page range string (e.g., "1, 3-5, 8") into an array of 0-indexed page numbers.
 */
export function parsePageRanks(rangeStr: string, maxPages: number): number[] {
  const pages = new Set<number>()
  const parts = rangeStr.split(',').map(s => s.trim())

  for (const part of parts) {
    if (!part) continue
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-')
      const start = parseInt(startStr, 10)
      const end = parseInt(endStr, 10)
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= maxPages) pages.add(i - 1)
        }
      }
    } else {
      const page = parseInt(part, 10)
      if (!isNaN(page) && page >= 1 && page <= maxPages) {
        pages.add(page - 1)
      }
    }
  }

  // Return sorted unique array
  return Array.from(pages).sort((a, b) => a - b)
}

/**
 * Extracts specific pages from a PDF document.
 */
export async function extractPDFPages(
  pdfBuffer: ArrayBuffer,
  rangeStr: string,
  onProgress: (pct: number, msg: string) => void
): Promise<Blob> {
  onProgress(10, 'Loading document...')
  const sourcePdf = await PDFDocument.load(pdfBuffer)
  const totalPages = sourcePdf.getPageCount()

  const targetIndices = parsePageRanks(rangeStr, totalPages)
  if (targetIndices.length === 0) {
    throw new Error('No valid pages selected for extraction.')
  }

  onProgress(30, 'Preparing new document...')
  const newPdf = await PDFDocument.create()
  newPdf.setTitle('Extracted Pages')
  newPdf.setAuthor('PDFTools by MaybeSurya.dev')
  newPdf.setProducer('PDFTools')
  newPdf.setCreator('PDFTools (https://pdftools.maybesurya.dev)')
  
  onProgress(50, `Extracting ${targetIndices.length} page(s)...`)
  const copiedPages = await newPdf.copyPages(sourcePdf, targetIndices)
  
  copiedPages.forEach(page => newPdf.addPage(page))

  onProgress(90, 'Finalizing file...')
  markPDF(newPdf)
  const extractedBytes = await newPdf.save()
  onProgress(100, 'Done!')

  return new Blob([new Uint8Array(extractedBytes)], { type: 'application/pdf' })
}
