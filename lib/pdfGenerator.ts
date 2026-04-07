import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface PDFOptions {
  pageSize: string
  quality: number
  fileName: string
  orientation: 'portrait' | 'landscape'
  margins: 'none' | 'small' | 'normal' | 'wide'
  addPageNumbers: boolean
  pageNumberStyle: 'minimal' | 'boxed' | 'dots' | 'roman'
  pageNumberSize: number
  includeWatermark: boolean
}

const PAGE_DIMS: Record<string, { w: number; h: number }> = {
  a4:      { w: 595, h: 842 },
  letter:  { w: 612, h: 792 },
  a3:      { w: 842, h: 1190 },
  a5:      { w: 420, h: 595 },
  legal:   { w: 612, h: 1008 },
  tabloid: { w: 792, h: 1224 },
}

const MARGIN_MAP: Record<string, number> = { none: 0, small: 14, normal: 28, wide: 57 }

function makeWatermarkDataUrl(): string {
  // Scale 3x for crisp retina rendering inside the PDF
  const scale = 3;
  const rawW = 280, rawH = 40;
  const W = rawW * scale, H = rawH * scale;

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Drop shadow for floating effect
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 8 * scale;
  ctx.shadowOffsetY = 3 * scale;

  // Premium dark pill shape
  const pillW = Math.round(240 * scale);
  const pillH = Math.round(26 * scale);
  const pillX = (W - pillW) / 2;
  const pillY = (H - pillH) / 2;

  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  else ctx.rect(pillX, pillY, pillW, pillH);

  // Subtle dark frosted background tone
  ctx.fillStyle = '#1a1c1d';
  ctx.fill();

  // Reset shadow for text drawing
  ctx.shadowColor = 'transparent';

  // Inner border to give it that iOS shine feel
  ctx.lineWidth = 1 * scale;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  // Typography Setup
  const fontSize = 10 * scale;
  ctx.textBaseline = 'middle';
  const centerY = H / 2 + (0.5 * scale); // Optical centering

  const getFont = (weight: string) => `${weight} ${fontSize}px -apple-system, "Inter", "San Francisco", sans-serif`;

  ctx.font = getFont('700');
  const part1 = "IMG2PDF";
  const part1Width = ctx.measureText(part1).width;

  ctx.font = getFont('500');
  const part2 = "  ·  MaybeSurya.dev";
  const part2Width = ctx.measureText(part2).width;

  const totalWidth = part1Width + part2Width;
  const startX = (W - totalWidth) / 2;

  // Draw "IMG2PDF" (Bold, Pure White)
  ctx.font = getFont('800');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(part1, startX, centerY);

  // Draw " · MaybeSurya.dev" (Medium, Off-White)
  ctx.font = getFont('500');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText(part2, startX + part1Width, centerY);

  return canvas.toDataURL('image/png', 1.0);
}

async function applyImageTransforms(
  data: string, rotation: number, flipH: boolean,
  brightness: number, contrast: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const rotated = rotation === 90 || rotation === 270
      const canvas = document.createElement('canvas')
      canvas.width  = rotated ? img.height : img.width
      canvas.height = rotated ? img.width  : img.height
      const ctx = canvas.getContext('2d')!
      ctx.translate(canvas.width / 2, canvas.height / 2)
      if (rotation) ctx.rotate((rotation * Math.PI) / 180)
      if (flipH)    ctx.scale(-1, 1)
      const filters: string[] = []
      if (brightness !== 100) filters.push(`brightness(${brightness / 100})`)
      if (contrast !== 100)   filters.push(`contrast(${contrast / 100})`)
      if (filters.length) ctx.filter = filters.join(' ')
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = () => reject(new Error('Failed to decode image'))
    img.src = data
  })
}

export async function generatePDF(
  images: any[],
  options: PDFOptions,
  onProgress: (pct: number, msg: string) => void
): Promise<void> {
  const pdf = await PDFDocument.create()

  // ── Inject metadata ──────────────────────────────────────
  pdf.setTitle(options.fileName || 'Converted PDF')
  pdf.setAuthor('IMG2PDF by MaybeSurya.dev')
  pdf.setProducer('IMG2PDF — https://img2pdf.maybesurya.dev')
  pdf.setCreator('IMG2PDF by MaybeSurya.dev (https://img2pdf.maybesurya.dev)')
  pdf.setSubject(`Generated with IMG2PDF — ${images.length} image${images.length !== 1 ? 's' : ''} converted`)
  pdf.setKeywords(['img2pdf', 'MaybeSurya.dev', 'image', 'pdf', 'converter'])
  pdf.setCreationDate(new Date())
  pdf.setModificationDate(new Date())

  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const dims = PAGE_DIMS[options.pageSize] ?? PAGE_DIMS.a4
  const { w: pw, h: ph } = options.orientation === 'landscape'
    ? { w: dims.h, h: dims.w }
    : dims
  const margin = MARGIN_MAP[options.margins] ?? MARGIN_MAP.normal

  let wmImage: Awaited<ReturnType<typeof pdf.embedPng>> | null = null
  if (options.includeWatermark) {
    onProgress(2, 'Preparing watermark…')
    try { wmImage = await pdf.embedPng(makeWatermarkDataUrl()) } catch { /* non-critical */ }
  }

  for (let i = 0; i < images.length; i++) {
    onProgress(Math.min(97, 5 + (i / images.length) * 88), `Processing image ${i + 1} of ${images.length}…`)

    const img = images[i]
    let data = img.data as string

    const needsTransform = img.rotation || img.flipH || (img.brightness ?? 100) !== 100 || (img.contrast ?? 100) !== 100
    if (needsTransform) {
      data = await applyImageTransforms(data, img.rotation ?? 0, img.flipH ?? false, img.brightness ?? 100, img.contrast ?? 100)
    }

    // Compress to JPEG
    if (!data.includes('data:image/png') || needsTransform) {
      data = await new Promise<string>((res, rej) => {
        const i2 = new Image()
        i2.onload = () => {
          const c = document.createElement('canvas')
          c.width = i2.width; c.height = i2.height
          c.getContext('2d')!.drawImage(i2, 0, 0)
          res(c.toDataURL('image/jpeg', options.quality))
        }
        i2.onerror = rej
        i2.src = data
      })
    }

    let embedded
    try {
      embedded = data.includes('data:image/png') ? await pdf.embedPng(data) : await pdf.embedJpg(data)
    } catch {
      try { embedded = await pdf.embedPng(data) } catch { continue }
    }

    const page = pdf.addPage([pw, ph])
    const contentW = pw - margin * 2
    const contentH = ph - margin * 2 - (options.addPageNumbers ? 24 : 0)
    const imgAspect = embedded.width / embedded.height
    const boxAspect = contentW / contentH
    let drawW: number, drawH: number
    if (imgAspect > boxAspect) { drawW = contentW; drawH = drawW / imgAspect }
    else { drawH = contentH; drawW = drawH * imgAspect }
    const x = margin + (contentW - drawW) / 2
    const y = margin + (contentH - drawH) / 2 + (options.addPageNumbers ? 24 : 0)

    page.drawImage(embedded, { x, y, width: drawW, height: drawH })

    // ── Watermark ──────────────────────────────────────────
    if (wmImage) {
      const wmW = Math.min(220, pw * 0.35)
      const wmH = (wmW * wmImage.height) / wmImage.width
      page.drawImage(wmImage, { x: pw - wmW - 16, y: 14, width: wmW, height: wmH, opacity: 0.85 })
    }

    // ── Page numbers (styled) ──────────────────────────────
    if (options.addPageNumbers) {
      const fs = Math.max(7, Math.min(14, options.pageNumberSize ?? 9))
      const total = images.length
      const cur = i + 1

      const toRoman = (n: number) => {
        const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1]
        const syms = ['m','cm','d','cd','c','xc','l','xl','x','ix','v','iv','i']
        let result = ''
        vals.forEach((v, idx) => { while (n >= v) { result += syms[idx]; n -= v } })
        return result
      }

      const style = options.pageNumberStyle ?? 'minimal'
      let label: string
      switch (style) {
        case 'boxed':  label = `[ ${cur} / ${total} ]`; break
        case 'dots':   label = `\u2022 ${cur} \u2022`; break
        case 'roman':  label = `${toRoman(cur)} / ${toRoman(total)}`; break
        default:       label = `${cur} / ${total}`
      }

      const tw = font.widthOfTextAtSize(label, fs)
      const pad = style === 'minimal' ? 16 : 12
      const pillW = tw + pad * 2
      const pillH = fs + 10
      const pillX = (pw - pillW) / 2
      const pillY = 10

      if (style !== 'minimal') {
        page.drawRectangle({
          x: pillX, y: pillY, width: pillW, height: pillH,
          color: rgb(0.93, 0.93, 0.95), opacity: 0.85,
        })
      }
      page.drawText(label, {
        x: pillX + pad,
        y: pillY + (pillH - fs) / 2,
        size: fs, font,
        color: style === 'dots' ? rgb(0.3, 0.32, 0.38) : rgb(0.45, 0.47, 0.52),
        opacity: 0.9,
      })
    }
  }

  onProgress(98, 'Generating file…')
  const bytes = await pdf.save()
  onProgress(100, 'Done!')

  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = options.fileName.endsWith('.pdf') ? options.fileName : `${options.fileName}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
