import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import * as bwipjs from 'bwip-js';
import { verifyUrlForSerial } from './seed-serial';

type RunInfo = {
  lotNumber: string;
  seedCropYear: number;
  bagSizeLabel: string;
  originCountry: string;
  expiresAt?: Date | null;
  productionDate?: Date | null;
  germinationPct?: number | null;
  approvedProduct: { name: string; variety?: string | null };
};

type BagInfo = { serialNumber: string; bagNumber: number };

export type LabelRect = { x: number; y: number; w: number; h: number };

export type LabelLayout = {
  margin: number;
  logo: LabelRect;
  productText: LabelRect;
  lotLine: LabelRect;
  expiryLine: LabelRect | null;
  barcode: LabelRect;
  qr: LabelRect;
  serialText: LabelRect;
  hintText: LabelRect;
  productLine: string;
  qrSizeMm: number;
};

export function mmToPt(mm: number): number {
  return (mm / 25.4) * 72;
}

function logoPath(): string {
  const candidates = [
    path.join(__dirname, '..', '..', 'assets', 'biovera-logo.png'),
    path.join(process.cwd(), 'assets', 'biovera-logo.png'),
    path.join(process.cwd(), 'dist', 'assets', 'biovera-logo.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('biovera-logo.png not found in backend/assets');
}

/** Product name once; append variety only when not already contained in name. */
export function formatProductLine(name: string, variety?: string | null): string {
  const base = name.trim();
  const v = variety?.trim();
  if (!v) return base;
  if (base.toLowerCase().includes(v.toLowerCase())) return base;
  return `${base} — ${v}`;
}

/**
 * 70×37 mm sheet label layout (top → bottom):
 * row 1 — logo + product name
 * row 2 — lot / seed year / bag size
 * row 3 — best before (optional)
 * footer — Code128 (left) + QR (right), serial + hint stacked under barcode inside footer
 */
export function computeLabelLayout(w: number, h: number, run: RunInfo, hasExpiry: boolean): LabelLayout {
  const margin = mmToPt(2.5);
  const innerW = w - margin * 2;

  const logoW = mmToPt(16);
  const headerH = mmToPt(8);
  const logo: LabelRect = { x: margin, y: margin, w: logoW, h: headerH };

  const productX = margin + logoW + mmToPt(1);
  const productW = w - productX - margin;
  const productText: LabelRect = { x: productX, y: margin, w: productW, h: headerH };

  const rowGap = mmToPt(0.25);
  const lotH = mmToPt(2.5);
  const lotY = margin + headerH + rowGap;
  const lotLine: LabelRect = { x: margin, y: lotY, w: innerW, h: lotH };

  const expiryH = hasExpiry ? mmToPt(2) : 0;
  const expiryY = lotY + lotH + rowGap;
  const expiryLine: LabelRect | null = hasExpiry
    ? { x: margin, y: expiryY, w: innerW, h: expiryH }
    : null;

  const contentBottom = expiryLine ? expiryY + expiryH : lotY + lotH;
  const minGap = mmToPt(0.5);
  const footerTop = contentBottom + minGap;

  const qrSizeMm = 15;
  const qrSize = mmToPt(qrSizeMm);
  const footerH = h - margin - footerTop;
  if (footerH < qrSize) {
    throw new Error('Label content rows overlap footer — reduce text or increase label height');
  }

  const hintH = mmToPt(1.8);
  const serialH = mmToPt(1.8);
  const barcodeH = Math.min(mmToPt(7), footerH - serialH - hintH);
  const barcodeW = innerW - qrSize - mmToPt(1.5);
  const stackH = barcodeH + serialH + hintH;
  const barcodeY = footerTop + (footerH - stackH) / 2;

  const barcode: LabelRect = { x: margin, y: barcodeY, w: barcodeW, h: barcodeH };
  const serialText: LabelRect = { x: margin, y: barcodeY + barcodeH, w: barcodeW, h: serialH };
  const hintText: LabelRect = { x: margin, y: barcodeY + barcodeH + serialH, w: barcodeW, h: hintH };
  const qr: LabelRect = { x: w - margin - qrSize, y: footerTop, w: qrSize, h: qrSize };

  const productLine = formatProductLine(run.approvedProduct.name, run.approvedProduct.variety);

  return {
    margin,
    logo,
    productText,
    lotLine,
    expiryLine,
    barcode,
    qr,
    serialText,
    hintText,
    productLine,
    qrSizeMm,
  };
}

export function labelRectsOverlap(a: LabelRect, b: LabelRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function assertLabelLayoutNoOverlap(layout: LabelLayout): void {
  const regions: LabelRect[] = [
    layout.logo,
    layout.productText,
    layout.lotLine,
    ...(layout.expiryLine ? [layout.expiryLine] : []),
    layout.barcode,
    layout.qr,
    layout.serialText,
    layout.hintText,
  ];
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      if (labelRectsOverlap(regions[i], regions[j])) {
        throw new Error(`Label layout overlap between region ${i} and ${j}`);
      }
    }
  }
}

async function code128Png(text: string, heightMm: number): Promise<Buffer> {
  return bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale: 2,
    height: heightMm,
    includetext: false,
    paddingwidth: 4,
    paddingheight: 2,
  });
}

function fmtExpiry(d?: Date | null): string {
  if (!d) return '';
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `Best before ${mm}/${yyyy}`;
}

export function buildLabelsCsv(run: RunInfo, bags: BagInfo[]): string {
  const header =
    'serial,bag_number,lot,seed_crop_year,product,variety,bag_size,production_country,expires,verify_url';
  const rows = bags.map((b) => {
    const expires = run.expiresAt ? run.expiresAt.toISOString().slice(0, 10) : '';
    const fields = [
      b.serialNumber,
      b.bagNumber,
      run.lotNumber,
      run.seedCropYear,
      run.approvedProduct.name,
      run.approvedProduct.variety || '',
      run.bagSizeLabel,
      run.originCountry,
      expires,
      verifyUrlForSerial(b.serialNumber),
    ];
    return fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(',');
  });
  return [header, ...rows].join('\n');
}

function runPdfDocument(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  factory: (doc: any) => void | Promise<void>,
  pageSize: [number, number],
  margins: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc: any = new (PDFDocument as any)({ size: pageSize, margin: margins });
    const buffers: Buffer[] = [];
    doc.on('data', (b: Buffer) => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    Promise.resolve(factory(doc))
      .then(() => doc.end())
      .catch(reject);
  });
}

function fitProductFontSize(doc: { widthOfString: (t: string) => number }, text: string, maxW: number, maxPt: number, minPt: number): number {
  for (let size = maxPt; size >= minPt; size -= 0.5) {
    doc.widthOfString(text);
    const w = doc.widthOfString(text);
    if (w <= maxW) return size;
  }
  return minPt;
}

async function drawLabel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  x: number,
  y: number,
  w: number,
  h: number,
  run: RunInfo,
  bag: BagInfo,
) {
  const expiry = fmtExpiry(run.expiresAt);
  const layout = computeLabelLayout(w, h, run, Boolean(expiry));
  assertLabelLayoutNoOverlap(layout);
  const lotLine = `Lot ${run.lotNumber} · Seed year ${run.seedCropYear} · ${run.bagSizeLabel}`;

  doc.save();
  doc.rect(x, y, w, h).stroke('#cccccc');

  const abs = (r: LabelRect): LabelRect => ({ x: x + r.x, y: y + r.y, w: r.w, h: r.h });

  try {
    const lp = abs(layout.logo);
    doc.image(logoPath(), lp.x, lp.y, { fit: [lp.w, lp.h], align: 'left', valign: 'top' });
  } catch {
    /* logo optional in dev */
  }

  const pt = abs(layout.productText);
  doc.fontSize(7);
  const fontSize = fitProductFontSize(doc, layout.productLine, pt.w, 7, 5);
  doc.fontSize(fontSize).fillColor('#111').text(layout.productLine, pt.x, pt.y, {
    width: pt.w,
    height: pt.h,
    ellipsis: true,
    lineBreak: true,
    lineGap: 0,
  });

  const lot = abs(layout.lotLine);
  doc.fontSize(5.5).fillColor('#444').text(lotLine, lot.x, lot.y, { width: lot.w, height: lot.h, lineBreak: false });
  if (layout.expiryLine && expiry) {
    const ex = abs(layout.expiryLine);
    doc.fontSize(5).text(expiry, ex.x, ex.y, { width: ex.w, height: ex.h, lineBreak: false });
  }

  const barcodeBuf = await code128Png(bag.serialNumber, 7);
  const qrPixelSize = Math.ceil((layout.qr.w / 72) * 96);
  const qrBuf = await QRCode.toBuffer(verifyUrlForSerial(bag.serialNumber), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: qrPixelSize,
  });

  const bc = abs(layout.barcode);
  doc.image(barcodeBuf, bc.x, bc.y, { fit: [bc.w, bc.h], align: 'left', valign: 'top' });
  const qrR = abs(layout.qr);
  doc.image(qrBuf, qrR.x, qrR.y, { fit: [qrR.w, qrR.h], align: 'right', valign: 'top' });

  const sn = abs(layout.serialText);
  doc.fontSize(4.5).fillColor('#000').text(bag.serialNumber, sn.x, sn.y, { width: sn.w, height: sn.h, lineBreak: false });
  const hint = abs(layout.hintText);
  doc.fontSize(4).fillColor('#666').text('Scan for instructions & authenticity', hint.x, hint.y, {
    width: hint.w,
    height: hint.h,
    lineBreak: false,
  });
  doc.restore();
}

/** A4 sheet: 3 × 8 labels (70 × 37 mm). */
export async function buildLabelsPdfSheet(run: RunInfo, bags: BagInfo[]): Promise<Buffer> {
  const labelW = mmToPt(70);
  const labelH = mmToPt(37);
  const cols = 3;
  const rows = 8;
  const pageW = mmToPt(210);
  const pageH = mmToPt(297);
  const startX = (pageW - cols * labelW) / 2;
  const startY = (pageH - rows * labelH) / 2;

  return runPdfDocument(
    async (doc) => {
      let idx = 0;
      for (let page = 0; idx < bags.length; page++) {
        if (page > 0) doc.addPage();
        for (let r = 0; r < rows && idx < bags.length; r++) {
          for (let c = 0; c < cols && idx < bags.length; c++) {
            const lx = startX + c * labelW;
            const ly = startY + r * labelH;
            await drawLabel(doc, lx, ly, labelW, labelH, run, bags[idx]);
            idx++;
          }
        }
      }
    },
    [pageW, pageH],
    0,
  );
}

/** Thermal roll: one label per page 100 × 60 mm. */
export async function buildLabelsPdfRoll(run: RunInfo, bags: BagInfo[]): Promise<Buffer> {
  const labelW = mmToPt(100);
  const labelH = mmToPt(60);

  return runPdfDocument(
    async (doc) => {
      for (let i = 0; i < bags.length; i++) {
        if (i > 0) doc.addPage({ size: [labelW, labelH], margin: 0 });
        await drawLabel(doc, 0, 0, labelW, labelH, run, bags[i]);
      }
    },
    [labelW, labelH],
    0,
  );
}

export async function buildLabelsPdf(
  run: RunInfo,
  bags: BagInfo[],
  format: 'sheet' | 'roll',
): Promise<Buffer> {
  return format === 'roll' ? buildLabelsPdfRoll(run, bags) : buildLabelsPdfSheet(run, bags);
}
