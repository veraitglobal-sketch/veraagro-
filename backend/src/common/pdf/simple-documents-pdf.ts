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

/**
 * One-page invoice from stored `invoiceData` JSON.
 */
export async function buildInvoicePdf(invoiceData: Record<string, unknown>): Promise<Buffer> {
  return runPdfDocument((doc) => {
    doc.fontSize(18).text('Invoice', { align: 'center' });
    doc.moveDown(0.5);
    const invNo = String(invoiceData.invoiceNumber ?? '—');
    doc.fontSize(11).text(`No. ${invNo}`, { align: 'center' });
    doc.moveDown();

    const buyer = invoiceData.buyer as { name?: string; email?: string; phone?: string } | undefined;
    doc.fontSize(12).text('Bill to', { underline: true });
    doc.fontSize(10);
    doc.text(`Name: ${buyer?.name ?? '—'}`);
    if (buyer?.email) doc.text(`Email: ${buyer.email}`);
    if (buyer?.phone) doc.text(`Phone: ${buyer.phone}`);
    doc.moveDown(0.5);

    const items = invoiceData.items as
      | Array<{
          productName?: string;
          quantity?: number;
          unit?: string;
          unitPrice?: number;
          total?: number;
        }>
      | undefined;
    if (Array.isArray(items) && items.length) {
      doc.fontSize(12).text('Line items', { underline: true });
      doc.fontSize(10);
      for (const row of items) {
        doc.text(
          `• ${row.productName} — ${row.quantity} ${row.unit} @ ${row.unitPrice} → ${row.total ?? ''}`,
        );
      }
    }
    doc.moveDown(0.5);
    doc.fontSize(12).text('Totals', { underline: true });
    doc.fontSize(10);
    doc.text(`Subtotal: ${String(invoiceData.subtotal ?? '—')}`);
    doc.text(`Tax: ${String(invoiceData.tax ?? 0)}`);
    doc.text(`Total: ${String(invoiceData.total ?? '—')}`);

    const pay = invoiceData.payment as { method?: string; status?: string } | undefined;
    if (pay) {
      doc.moveDown(0.3);
      doc.text(`Payment: ${pay.method ?? '—'} / ${pay.status ?? '—'}`);
    }
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#666666').text(`Data hash: ${sha256Json(invoiceData).slice(0, 40)}…`, { width: 500 });
  });
}

function sha256Json(data: object): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}
