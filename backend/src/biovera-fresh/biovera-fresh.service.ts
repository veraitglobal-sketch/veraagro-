import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import { PDF_SECTIONS_EN, PDF_SECTIONS_SR } from './biovera-fresh.pdf-sections';

export type BioVeraFreshPdfLocale = 'en' | 'sr';

/** Prospect hero: place image at web/public/biovera-fresh-prospect-hero.jpg or .png; API resolves repo public folders. */
const BIOVERA_FRESH_HERO_PREFERRED = 'biovera-fresh-prospect-hero.jpg';
const BIOVERA_FRESH_HERO_FALLBACK = 'biovera-fresh-prospect-hero.png';

@Injectable()
export class BioVeraFreshService {
  private readonly logger = new Logger(BioVeraFreshService.name);

  /** Resolve static files whether Nest runs from repo root, `backend/`, or another cwd. */
  private resolveRepoPublicAsset(fileName: string): string | null {
    const candidates = [
      path.join(process.cwd(), 'public', fileName),
      path.join(process.cwd(), '..', 'web', 'public', fileName),
      path.join(process.cwd(), 'web', 'public', fileName),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  normalizeLocale(raw: string | undefined): BioVeraFreshPdfLocale {
    if (!raw) return 'en';
    const lower = raw.toLowerCase();
    if (lower === 'sr' || lower.startsWith('sr-')) return 'sr';
    return 'en';
  }

  async generateProspectPDF(locale: BioVeraFreshPdfLocale): Promise<Buffer> {
    const sections = locale === 'sr' ? PDF_SECTIONS_SR : PDF_SECTIONS_EN;
    const docTitle = locale === 'sr' ? 'BioVera Fresh — prospekt' : 'BioVera Fresh — prospect';

    return new Promise((resolve, reject) => {
      try {
        // @ts-ignore - pdfkit types may not be perfect
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
        });
        const buffers: Buffer[] = [];

        const veraGreen = '#2D5A27';
        const darkGray = '#1F2937';
        const lightGray = '#6B7280';
        const bgGreen = '#F0F9F0';

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        doc.rect(0, 0, doc.page.width, 120).fill(bgGreen);

        const logoPath1 = path.join(process.cwd(), 'public', 'logo1.png');
        const logoPath2 = path.join(process.cwd(), 'public', 'logo.png');
        const logoPath = fs.existsSync(logoPath1) ? logoPath1 : fs.existsSync(logoPath2) ? logoPath2 : null;

        if (logoPath) {
          try {
            doc.image(logoPath, 50, 14, { width: 220, height: 66, fit: [220, 66] });
          } catch (e) {
            this.logger.warn('BioVera Fresh PDF: logo load failed', e);
            doc.fontSize(28).fillColor(veraGreen).font('Helvetica-Bold').text('Bio Vera', 50, 36);
          }
        } else {
          doc.fontSize(28).fillColor(veraGreen).font('Helvetica-Bold').text('Bio Vera', 50, 36);
        }

        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text(docTitle, 50, 88, {
          width: doc.page.width - 100,
        });

        doc.y = 128;
        const textWidth = doc.page.width - 100;
        const bottomMargin = 55;

        doc.fontSize(20).fillColor(darkGray).font('Helvetica-Bold').text('BioVera Fresh', {
          width: textWidth,
        });
        doc.moveDown(0.45);
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text(
            locale === 'sr'
              ? 'Kontrolisana maloprodaja i franšiza uz Bio Vera mrežu.'
              : 'Controlled retail and franchise within the Bio Vera network.',
            { width: textWidth },
          );
        doc.moveDown(1);

        const heroImage =
          this.resolveRepoPublicAsset(BIOVERA_FRESH_HERO_PREFERRED) ??
          this.resolveRepoPublicAsset(BIOVERA_FRESH_HERO_FALLBACK);
        if (heroImage) {
          try {
            const heroMaxH = 200;
            if (doc.y + heroMaxH > doc.page.height - bottomMargin) {
              doc.addPage();
              doc.y = 50;
            }
            const heroY = doc.y;
            doc.image(heroImage, 50, heroY, {
              fit: [textWidth, heroMaxH],
              align: 'center',
              valign: 'center',
            });
            doc.y = heroY + heroMaxH + 14;
          } catch (e) {
            this.logger.warn('BioVera Fresh PDF: hero image failed', e);
          }
        }

        for (const section of sections) {
          doc.fontSize(13).fillColor(veraGreen).font('Helvetica-Bold');
          const titleH = doc.heightOfString(section.title, { width: textWidth });
          doc.fontSize(10).fillColor(darkGray).font('Helvetica');
          const bodyH = doc.heightOfString(section.body, { width: textWidth });
          const blockH = titleH + bodyH + 36;
          if (doc.y + blockH > doc.page.height - bottomMargin) {
            doc.addPage();
            doc.y = 50;
          }

          doc.fontSize(13).fillColor(veraGreen).font('Helvetica-Bold').text(section.title, { width: textWidth });
          doc.moveDown(0.35);
          doc.fontSize(10).fillColor(darkGray).font('Helvetica').text(section.body, { width: textWidth });
          doc.moveDown(1.05);
        }

        if (doc.y + 24 > doc.page.height - bottomMargin) {
          doc.addPage();
          doc.y = 50;
        }
        doc.fontSize(8).fillColor(lightGray).font('Helvetica').text('biovera.app · Bio Vera Fresh', {
          width: textWidth,
        });

        doc.end();
      } catch (error) {
        this.logger.error('BioVera Fresh PDF generation failed', error);
        reject(error);
      }
    });
  }
}
