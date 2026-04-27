import { createHash } from 'crypto';
import * as PDFDocument from 'pdfkit';

type PdfCallback = (doc: any) => void;

function runPdfDocument(factory: PdfCallback): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // pdfkit: default export
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc: any = new (PDFDocument as any)({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', (b: Buffer) => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    try {
      factory(doc);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * One-page waybill (operational summary) for cold-chain shipping.
 */
export async function buildWaybillPdf(waybillData: Record<string, unknown>): Promise<Buffer> {
  return runPdfDocument((doc) => {
    doc.fontSize(18).text('Bio Vera — Digital waybill', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#555').text('Generated electronically — for operational use', { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown();

    const line = (label: string, value: string) => {
      doc.fontSize(11).text(`${label}: `, { continued: true, underline: true });
      doc.text(value || '—', { underline: false });
    };

    const wn = String(waybillData.waybillNumber ?? '—');
    line('Waybill number', wn);
    line('Order / delivery', `${String(waybillData.orderNumber ?? '—')} / ${String(waybillData.deliveryNumber ?? '—')}`);
    const d = waybillData.date;
    line('Date', d ? new Date(String(d)).toLocaleString() : '—');
    doc.moveDown(0.3);

    const pickup = waybillData.pickup as { location?: string } | undefined;
    const del = waybillData.delivery as { location?: string } | undefined;
    const driver = waybillData.driver as { name?: string; phone?: string } | undefined;
    const product = waybillData.product as { name?: string; quantity?: unknown; unit?: string } | undefined;
    const estate = waybillData.estate as { name?: string; owner?: string } | undefined;
    const buyer = waybillData.buyer as { name?: string; phone?: string } | undefined;

    doc.fontSize(12).text('Route', { underline: true });
    doc.fontSize(10);
    doc.text(`Pickup: ${pickup?.location ?? '—'}`);
    doc.text(`Drop-off: ${del?.location ?? '—'}`);
    doc.moveDown(0.3);

    doc.fontSize(12).text('Driver', { underline: true });
    doc.fontSize(10);
    doc.text(`Name: ${driver?.name ?? '—'}`);
    doc.text(`Phone: ${driver?.phone ?? '—'}`);
    doc.moveDown(0.3);

    doc.fontSize(12).text('Load', { underline: true });
    doc.fontSize(10);
    doc.text(`Product: ${product?.name ?? '—'}`);
    doc.text(`Quantity: ${product?.quantity ?? '—'} ${product?.unit ?? ''}`);
    doc.moveDown(0.3);

    doc.fontSize(12).text('Origin & buyer', { underline: true });
    doc.fontSize(10);
    doc.text(`Estate: ${estate?.name ?? '—'} (owner: ${estate?.owner ?? '—'})`);
    doc.text(`Buyer: ${buyer?.name ?? '—'}  Tel: ${buyer?.phone ?? '—'}`);
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#666666').text(`Data hash: ${sha256Json(waybillData).slice(0, 40)}…`, { width: 500 });
  });
}

/** Brand green — matches web / Bio Vera UI */
const VERA = '#2D5A27';
const VERA_DARK = '#1e4020';
const MUTED = '#5a5a5a';
const BORDER = '#d4e0d2';
const PANEL = '#f6faf6';

const SELLER_LINES = [
  'Bio Vera',
  'Agri-traceability & fresh produce platform',
  'www.biovera.app · orders@biovera.app',
] as const;

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

function formatEur(amount: number): string {
  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} EUR`;
  }
}

function formatIssueDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function payMethodLabel(method: string | undefined): string {
  if (!method) return '—';
  const m = String(method).toUpperCase();
  if (m === 'BANK_TRANSFER') return 'Bank transfer';
  if (m === 'CARD' || m === 'CREDIT_CARD') return 'Card';
  return method;
}

/**
 * One-page invoice from stored `invoiceData` JSON — Bio Vera branded layout.
 */
export async function buildInvoicePdf(invoiceData: Record<string, unknown>): Promise<Buffer> {
  return runPdfDocument((doc) => {
    const pageW = doc.page.width;
    const m = 50;
    const w = pageW - m * 2;
    const invNo = String(invoiceData.invoiceNumber ?? '—');
    const orderNo = String(invoiceData.orderNumber ?? '—');
    const issueDate = formatIssueDate(
      typeof invoiceData.date === 'string' ? invoiceData.date : undefined,
    );
    const buyer = invoiceData.buyer as
      | { name?: string; email?: string; phone?: string; deliveryAddress?: unknown }
      | undefined;

    // --- Header bar (full width) ---
    doc.save();
    doc.rect(0, 0, pageW, 78).fill(VERA);
    doc.fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('Bio Vera', m, 22, { lineBreak: false });
    doc.font('Helvetica')
      .fontSize(9)
      .opacity(0.92)
      .text('Fresh produce · Traceable from farm to buyer', m, 48, { width: 320, lineBreak: true });
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .opacity(1)
      .text('INVOICE', m, 32, { width: w, align: 'right', lineBreak: false });
    doc.fillColor('#000000');
    doc.restore();

    let y = 95;

    // --- Meta: invoice #, order ref, date (left / middle / right) ---
    doc.fillColor(MUTED).font('Helvetica').fontSize(7).text('INVOICE NUMBER', m, y);
    doc.text('ORDER REFERENCE', m + 175, y);
    doc.text('ISSUE DATE', m + 350, y);
    y += 10;
    doc.fillColor(VERA_DARK).font('Helvetica-Bold').fontSize(13).text(invNo, m, y, { width: 160 });
    doc.fillColor('#111')
      .font('Helvetica')
      .fontSize(9.5)
      .text(orderNo, m + 175, y, { width: 200, lineBreak: true });
    doc.text(issueDate, m + 350, y, { width: 130 });
    y = Math.max(doc.y, y + 22);

    // --- From / Bill to panel ---
    const boxTop = y;
    const boxH = 100;
    doc.roundedRect(m, boxTop, w, boxH, 4).fill(PANEL).stroke(BORDER, 0.6);
    const col1 = m + 14;
    const col2 = m + 14 + w / 2;
    y = boxTop + 12;
    doc.fillColor(VERA).font('Helvetica-Bold').fontSize(9).text('FROM (SELLER)', col1, y, { width: 230 });
    doc.text('BILL TO', col2, y, { width: 230 });
    y += 16;
    doc.fillColor('#222').font('Helvetica').fontSize(9);
    let sy = y;
    for (const line of SELLER_LINES) {
      doc.text(line, col1, sy, { width: 240 });
      sy += 12;
    }
    doc.fillColor('#222').font('Helvetica-Bold').fontSize(10).text(buyer?.name ?? '—', col2, y, { width: 220 });
    y = doc.y + 4;
    if (buyer?.email) {
      doc.font('Helvetica').fontSize(9).text(buyer.email, col2, y, { width: 220 });
      y = doc.y + 2;
    }
    if (buyer?.phone) {
      doc.text(String(buyer.phone), col2, y, { width: 220 });
      y = doc.y + 2;
    }
    const addr = buyer?.deliveryAddress;
    if (addr) {
      const addrText =
        typeof addr === 'string'
          ? addr
          : [
              (addr as { address?: string })?.address,
              (addr as { city?: string })?.city,
              (addr as { country?: string })?.country,
            ]
              .filter(Boolean)
              .join(', ');
      if (addrText) {
        doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Delivery: ' + addrText, col2, y, {
          width: 220,
        });
      }
    }
    y = boxTop + boxH + 20;

    // --- Line items table ---
    const items = invoiceData.items as
      | Array<{
          productName?: string;
          quantity?: number;
          unit?: string;
          unitPrice?: number;
          total?: number;
        }>
      | undefined;

    doc.fillColor(VERA).font('Helvetica-Bold').fontSize(11).text('Line items', m, y);
    y = doc.y + 8;

    const rightX = m + w;
    const colW = { desc: 200, qty: 36, unit: 40, uPrice: 78, amt: 110 };
    const colX = {
      desc: m + 4,
      qty: m + 210,
      unit: m + 250,
      uPrice: m + 292,
      amt: rightX - colW.amt,
    };
    const tableW = w;

    // Table header
    doc.rect(m, y, tableW, 20).fill('#e8f0e7');
    doc.fillColor(VERA_DARK)
      .font('Helvetica-Bold')
      .fontSize(8);
    y += 5;
    doc.text('Description', colX.desc, y, { width: colW.desc });
    doc.text('Qty', colX.qty, y, { width: colW.qty, align: 'right' });
    doc.text('UoM', colX.unit, y, { width: colW.unit });
    doc.text('Unit price', colX.uPrice, y, { width: colW.uPrice, align: 'right' });
    doc.text('Amount (EUR)', colX.amt, y, { width: colW.amt, align: 'right' });
    y += 18;
    doc.moveTo(m, y).lineTo(m + tableW, y).stroke(BORDER, 0.6);
    y += 6;

    if (Array.isArray(items) && items.length) {
      for (const row of items) {
        const desc = String(row.productName ?? 'Item');
        const h = doc.heightOfString(desc, { width: colW.desc });
        doc.fillColor('#111').font('Helvetica').fontSize(9.5);
        doc.text(desc, colX.desc, y, { width: colW.desc, lineBreak: true });
        doc.text(String(num(row.quantity)), colX.qty, y, { width: colW.qty, align: 'right' });
        doc.text(String(row.unit ?? ''), colX.unit, y, { width: colW.unit });
        doc.text(formatEur(num(row.unitPrice)), colX.uPrice, y, { width: colW.uPrice, align: 'right' });
        doc.font('Helvetica-Bold').text(formatEur(num(row.total)), colX.amt, y, {
          width: colW.amt,
          align: 'right',
        });
        y += Math.max(22, h + 6);
        doc.moveTo(m, y - 2).lineTo(m + tableW, y - 2).stroke('#ecedec', 0.3);
        y += 4;
      }
    } else {
      doc.fillColor(MUTED).font('Helvetica').fontSize(9).text('No line items on file.', m + 6, y);
      y += 20;
    }

    y += 8;
    // Totals block (right)
    const sub = num(invoiceData.subtotal);
    const tax = num(invoiceData.tax);
    const tot = num(invoiceData.total);
    const totBoxW = 200;
    const totX = m + w - totBoxW;
    doc.roundedRect(totX, y, totBoxW, 72, 3).fill(PANEL).stroke(BORDER, 0.6);
    let ty = y + 8;
    doc.fillColor(MUTED).font('Helvetica').fontSize(9);
    doc.text('Subtotal', totX + 10, ty, { width: 80 });
    doc.fillColor('#111').text(formatEur(sub), totX + 90, ty, { width: 95, align: 'right' });
    ty += 16;
    doc.fillColor(MUTED).text('Tax / VAT', totX + 10, ty, { width: 80 });
    doc.fillColor('#111').text(formatEur(tax), totX + 90, ty, { width: 95, align: 'right' });
    ty += 20;
    doc.moveTo(totX + 8, ty).lineTo(totX + totBoxW - 8, ty).stroke(VERA, 0.5);
    ty += 8;
    doc.fillColor(VERA).font('Helvetica-Bold').fontSize(11);
    doc.text('Total', totX + 10, ty, { width: 80 });
    doc.text(formatEur(tot), totX + 60, ty, { width: 125, align: 'right' });
    y = y + 88;

    // Payment
    const pay = invoiceData.payment as { method?: string; status?: string } | undefined;
    if (pay) {
      y += 6;
      doc.roundedRect(m, y, w, 36, 3).fill('#fafafa').stroke(BORDER, 0.6);
      doc.fillColor(MUTED)
        .font('Helvetica')
        .fontSize(8)
        .text('PAYMENT', m + 10, y + 6, { width: 200 });
      doc.fillColor('#222')
        .font('Helvetica')
        .fontSize(9)
        .text(
          `${payMethodLabel(pay.method)}  ·  ${String(pay.status ?? '').replace(/_/g, ' ')}`,
          m + 10,
          y + 18,
          { width: w - 20 },
        );
      y += 44;
    }

    const del = invoiceData.delivery as { deliveryNumber?: string; driver?: string } | null | undefined;
    if (del && (del.deliveryNumber || del.driver)) {
      y += 4;
      doc.fillColor(VERA).font('Helvetica-Bold').fontSize(9).text('Delivery (reference)', m, y);
      y = doc.y + 4;
      doc.fillColor('#333').font('Helvetica').fontSize(9);
      if (del.deliveryNumber) doc.text(`Ref: ${del.deliveryNumber}`, m, y);
      if (del.driver) doc.text(`Driver: ${del.driver}`, m, doc.y + 2, { width: w });
    }

    // Footer
    const footY = doc.page.height - 42;
    doc.moveTo(m, footY - 6).lineTo(m + w, footY - 6).stroke(BORDER, 0.4);
    doc.fillColor(MUTED)
      .font('Helvetica')
      .fontSize(7)
      .text(
        'This is a system-generated document. For questions, contact your Bio Vera account manager.',
        m,
        footY,
        { width: w, align: 'center' },
      );
    doc.text(`Integrity: ${sha256Json(invoiceData).slice(0, 48)}…`, m, footY + 10, { width: w, align: 'center' });
  });
}

function sha256Json(data: object): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

/**
 * Paper-trail PDF after receiver signs (name + optional signature image) on loading handover.
 */
export async function buildLogisticsHandoverReceiverProofPdf(data: {
  missionId: string;
  batchPublicId?: string;
  productName?: string;
  receiverName: string;
  signedAtIso: string;
  logisticsPartnerName?: string;
  signatureDataUrl?: string;
}): Promise<Buffer> {
  return runPdfDocument((doc) => {
    doc.fontSize(16).text('Bio Vera — Loading handover (receiver proof)', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#555').text('System-generated for traceability (cold chain + loading evidence).', { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown(1);
    doc.fontSize(10);
    doc.text(`Mission ID: ${data.missionId}`);
    if (data.batchPublicId) {
      doc.text(`Commercial lot: ${data.batchPublicId}`);
    }
    if (data.productName) {
      doc.text(`Product: ${data.productName}`);
    }
    doc.moveDown(0.3);
    doc.text(`Received by (name): ${data.receiverName}`);
    doc.text(`Time: ${data.signedAtIso}`);
    if (data.logisticsPartnerName) {
      doc.text(`Logistics partner: ${data.logisticsPartnerName}`);
    }
    doc.moveDown(0.6);
    if (data.signatureDataUrl?.startsWith('data:image')) {
      const m = data.signatureDataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
      if (m?.[2]) {
        try {
          const buf = Buffer.from(m[2], 'base64');
          doc.fontSize(11).text('Signature (electronic or captured):', { underline: true });
          doc.image(buf, { width: 220 });
        } catch {
          doc.text('(Signature image could not be embedded — see raw record in system.)');
        }
      }
    } else {
      doc.fontSize(9).fillColor('#666').text('No image signature on file; name attestation only.');
    }
    doc.moveDown(1.2);
    doc.fontSize(8).fillColor('#666').text(`Record hash: ${createHash('sha256').update(JSON.stringify(data)).digest('hex')}`);
  });
}
