import { PDFDocument } from 'pdf-lib'

export function markPDF(doc: PDFDocument) {
  doc.setCreator('PDFTools by MaybeSurya.dev')
  doc.setProducer('PDFTools by MaybeSurya.dev')
  
  const keywords = doc.getKeywords() || ''
  if (!keywords.includes('PDFToolsGen')) {
    const arr = keywords ? keywords.split(' ').concat('PDFToolsGen') : ['PDFToolsGen']
    doc.setKeywords(arr)
  }
}

export function isPDFTools(meta: { creator?: string, producer?: string, keywords?: string }) {
  const creator = meta.creator || ''
  const producer = meta.producer || ''
  const keywords = meta.keywords || ''
  return creator.includes('PDFTools') || producer.includes('PDFTools') || keywords.includes('PDFToolsGen')
}
