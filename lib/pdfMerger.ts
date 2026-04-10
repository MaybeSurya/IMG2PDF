import { PDFDocument } from 'pdf-lib'
import { markPDF } from '@/lib/pdfMetadata'

/**
 * Merges multiple PDF ArrayBuffers or base64 strings into a single PDF document.
 * 
 * @param pdfDataList Array of PDF data (ArrayBuffer or base64 data URI pattern)
 * @param onProgress Callback to report progress percentage
 * @returns Blob of the merged PDF
 */
export async function mergePDFs(
  pdfDataList: (ArrayBuffer | string)[],
  onProgress: (pct: number, msg: string) => void
): Promise<Blob> {
  if (pdfDataList.length === 0) {
    throw new Error('No PDF files provided.')
  }

  onProgress(5, 'Initializing merged document...')
  const mergedPdf = await PDFDocument.create()
  
  // Set metadata for the new document
  mergedPdf.setTitle('Merged Document')
  mergedPdf.setAuthor('PDFTools by MaybeSurya.dev')
  mergedPdf.setCreator('PDFTools (https://pdftools.maybesurya.dev)')
  mergedPdf.setProducer('PDFTools')
  mergedPdf.setCreationDate(new Date())

  for (let i = 0; i < pdfDataList.length; i++) {
    onProgress(
      10 + Math.round((i / pdfDataList.length) * 80),
      `Processing file ${i + 1} of ${pdfDataList.length}...`
    )
    
    try {
      const pdfData = pdfDataList[i]
      const sourcePdf = await PDFDocument.load(pdfData)
      const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices())
      
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page)
      })
    } catch (err) {
      console.error(`Failed to merge PDF at index ${i}`, err)
      throw new Error(`Failed to parse or merge file #${i + 1}. Ensure it is a valid PDF.`)
    }
  }

  onProgress(95, 'Finalizing merged file...')
  
  markPDF(mergedPdf)
  const mergedPdfBytes = await mergedPdf.save()
  
  onProgress(100, 'Done!')
  
  return new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' })
}
