import { PDFDocument } from 'pdf-lib'
import { markPDF } from '@/lib/pdfMetadata'

export interface CompressOptions {
  dpiMultiplier: number
  jpegQuality: number
}

export async function flattenAndCompressPDF(
  fileBuffer: ArrayBuffer,
  options: CompressOptions,
  onProgress: (pct: number, msg: string) => void
): Promise<Blob> {
  onProgress(5, 'Initializing PDF engine...')
  
  // Dynamic import to keep main bundle light
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

  // We load a copy to prevent "detached ArrayBuffer" bugs
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(fileBuffer.slice(0)) }).promise
  const totalPages = pdf.numPages

  onProgress(15, 'Preparing new optimized document...')
  const newPdf = await PDFDocument.create()

  for (let i = 1; i <= totalPages; i++) {
    const renderPct = 15 + Math.round(((i - 1) / totalPages) * 75)
    onProgress(renderPct, `Flattening page ${i} of ${totalPages}...`)

    const page = await pdf.getPage(i)
    // The viewport scale controls the rasterization resolution (e.g., 1.0 = ~72 DPI)
    const viewport = page.getViewport({ scale: options.dpiMultiplier })
    
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvasContext: ctx, viewport, canvas }).promise

    // Extract heavily compressed baseline JPEG
    const quality = Math.min(1.0, Math.max(0.1, options.jpegQuality))
    const dataUrl = canvas.toDataURL('image/jpeg', quality)

    // Append to new PDF
    const embeddedImg = await newPdf.embedJpg(dataUrl)
    
    // We add the page natively matching the original viewport dimensions rather than the pixel-dense canvas size
    // to ensure the physical size of the PDF remains identical to the original file when viewed or printed.
    const unscaledViewport = page.getViewport({ scale: 1.0 })
    const newPage = newPdf.addPage([unscaledViewport.width, unscaledViewport.height])
    
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: unscaledViewport.width,
      height: unscaledViewport.height
    })

    // Memory cleanup
    canvas.width = 0
    canvas.height = 0
    page.cleanup()
  }

  onProgress(95, 'Finalizing structural optimization...')
  markPDF(newPdf)
  
  // Object streams compress the internal references structurally on top of the heavily compressed JPEG payload
  const optimizedBytes = await newPdf.save({ useObjectStreams: true, addDefaultPage: false })
  
  onProgress(100, 'Done!')
  return new Blob([new Uint8Array(optimizedBytes)], { type: 'application/pdf' })
}
