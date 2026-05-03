import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import { PDF_SECTIONS_EN } from './biovera-fresh.pdf-sections';

/** Prospect hero: place under web/public or backend/public (see listPublicAssetDirs). */
const BIOVERA_FRESH_HERO_FILES = [
  'biovera-fresh-prospect-hero.jpg',
  'biovera-fresh-prospect-hero.jpeg',
  'biovera-fresh-prospect-hero.png',
] as const;

/** Extra vertical slack so measured card height matches rendered body (avoids overlap hiding later chapters). */
const BODY_HEIGHT_SLACK = 28;

const MARGIN = 48;
const CARD_PAD = 14;
const CARD_RADIUS = 8;
const TITLE_BAND_PAD_V = 12;
const TITLE_BAND_PAD_H = 14;
const BODY_GAP_AFTER_BAND = 12;
const SECTION_AFTER = 18;
const BODY_LINE_GAP = 5;
const PARA_GAP = 9;
const BULLET_INDENT = 16;
const BULLET_MARKER_GAP = 8;
const BULLET_ROW_GAP = 5;
const HEADING_GAP_AFTER = 11;
const FOOTER_RESERVE = 52;
const INNER_HEADER_H = 44;
const BADGE_SIZE = 26;

/** Rich body: paragraphs, • lists, and lines like `1. Heading` (subsection titles). */
function measureRichBodyHeight(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  body: string,
  textWidth: number,
  veraGreen: string,
  bodyGray: string,
  bodyFontSize: number,
): number {
  let y = 0;
  const lines = body.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line === '') {
      i++;
      y += PARA_GAP / 2;
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      doc.fontSize(bodyFontSize + 0.5).fillColor(veraGreen).font('Helvetica-Bold');
      y += doc.heightOfString(line, { width: textWidth, lineGap: BODY_LINE_GAP }) + HEADING_GAP_AFTER;
      i++;
      continue;
    }

    if (line.startsWith('•')) {
      const bullets: string[] = [];
      while (i < lines.length) {
        const L = lines[i].trim();
        if (L === '' || !L.startsWith('•')) break;
        bullets.push(L.replace(/^•\s*/, ''));
        i++;
      }
      doc.fontSize(bodyFontSize).fillColor(bodyGray).font('Helvetica');
      const bulletTextW = textWidth - BULLET_INDENT - BULLET_MARKER_GAP;
      for (const b of bullets) {
        y +=
          doc.heightOfString(b, { width: bulletTextW, lineGap: BODY_LINE_GAP }) + BULLET_ROW_GAP;
      }
      y += PARA_GAP / 2;
      continue;
    }

    const prose: string[] = [];
    while (i < lines.length) {
      const L = lines[i].trim();
      if (L === '') break;
      if (L.startsWith('•') || /^\d+\.\s/.test(L)) break;
      prose.push(L);
      i++;
    }
    const text = prose.join(' ');
    doc.fontSize(bodyFontSize).fillColor(bodyGray).font('Helvetica');
    y += doc.heightOfString(text, { width: textWidth, lineGap: BODY_LINE_GAP }) + PARA_GAP;
  }

  return y;
}

@Injectable()
export class BioVeraFreshService {
  private readonly logger = new Logger(BioVeraFreshService.name);

  /** Directories that may hold shared static assets (cwd variants + path relative to compiled `dist/` or `src/`). */
  private listPublicAssetDirs(): string[] {
    const dirs = [
      path.join(process.cwd(), 'public'),
      path.join(process.cwd(), '..', 'web', 'public'),
      path.join(process.cwd(), 'web', 'public'),
      path.join(process.cwd(), 'backend', 'public'),
      path.join(__dirname, '..', '..', '..', 'web', 'public'),
      path.join(__dirname, '..', '..', '..', 'backend', 'public'),
    ];
    return [...new Set(dirs.map((d) => path.normalize(d)))];
  }

  /** Resolve static files whether Nest runs from repo root, `backend/`, monorepo root, or `dist/`. */
  private resolveRepoPublicAsset(fileName: string): string | null {
    for (const dir of this.listPublicAssetDirs()) {
      const p = path.join(dir, fileName);
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  /** Read first matching image from public dirs (buffer embedding is more reliable than path for some JPEGs). */
  private readPublicImageFirstMatch(baseNames: readonly string[]): Buffer | null {
    for (const dir of this.listPublicAssetDirs()) {
      for (const name of baseNames) {
        const p = path.join(dir, name);
        if (!fs.existsSync(p)) continue;
        try {
          return fs.readFileSync(p);
        } catch (e) {
          this.logger.warn(`BioVera Fresh PDF: could not read image ${p}`, e);
        }
      }
    }
    return null;
  }

  private resolveLogoPath(): string | null {
    return this.resolveRepoPublicAsset('logo1.png') ?? this.resolveRepoPublicAsset('logo.png');
  }

  /**
   * Partner prospect PDF - English only (same convention as grower / supplier / logistics prospect PDFs).
   * Uses Helvetica-friendly ASCII; Serbian site copy stays on the web page and in print appendix from locales.
   */
  async generateProspectPDF(): Promise<Buffer> {
    const sections = PDF_SECTIONS_EN;
    const docTitle = 'BioVera Fresh - Partner prospect';
    const tocTitle = 'Contents';

    return new Promise((resolve, reject) => {
      try {
        // @ts-ignore - pdfkit types may not be perfect
        const doc = new PDFDocument({
          margin: MARGIN,
          size: 'A4',
          bufferPages: true,
          info: {
            Title: docTitle,
            Author: 'Bio Vera',
            Subject: 'BioVera Fresh retail partner prospect',
          },
        });
        const buffers: Buffer[] = [];

        const veraGreen = '#2D5A27';
        const veraGreenMuted = '#3d6b37';
        const darkGray = '#111827';
        const bodyGray = '#374151';
        const lightGray = '#6B7280';
        const mutedLine = '#e5e7eb';
        const bgGreen = '#ecf7ec';
        const bgGreenDeep = '#dff0df';
        const titleBandFill = '#f3faf3';
        const cardFill = '#ffffff';
        const cardStroke = '#cfe6cf';
        const shadowFill = '#d9e5d8';

        const pageW = doc.page.width;
        const pageH = doc.page.height;
        const contentW = pageW - MARGIN * 2;
        const contentBottom = pageH - FOOTER_RESERVE;

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const drawInnerPageChrome = () => {
          doc.save();
          doc.rect(0, 0, pageW, INNER_HEADER_H).fill(bgGreen);
          doc.strokeColor(veraGreen).lineWidth(2);
          doc.moveTo(0, INNER_HEADER_H).lineTo(pageW, INNER_HEADER_H).stroke();
          doc.fillColor(veraGreen).font('Helvetica-Bold').fontSize(10);
          doc.text('BioVera Fresh', MARGIN + 6, 17, { width: contentW - 120, lineBreak: false });
          doc.fillColor(lightGray).font('Helvetica').fontSize(8);
          const tag = 'Partner prospect · Direct. Fresh. Controlled.';
          doc.text(tag, MARGIN + 6, 31, { width: contentW - 40 });
          doc.strokeColor('#000000').lineWidth(1);
          doc.restore();
        };

        const startNewContentPage = () => {
          doc.addPage();
          drawInnerPageChrome();
          doc.y = INNER_HEADER_H + 16;
        };

        const parseChapterTitle = (
          title: string,
        ): { num: string | null; label: string; isContact: boolean } => {
          const isContact = /kontakt|contact/i.test(title);
          const m = title.match(/^(\d+)\.\s*(.+)$/);
          if (m) return { num: m[1], label: m[2].trim(), isContact };
          return { num: null, label: title.trim(), isContact };
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renderRichBody = (docRef: any, x: number, startY: number, body: string, textWidth: number, bodyFontSize: number): number => {
          let y = startY;
          const lines = body.split('\n');
          let i = 0;

          while (i < lines.length) {
            const line = lines[i].trim();
            if (line === '') {
              i++;
              y += PARA_GAP / 2;
              continue;
            }

            if (/^\d+\.\s/.test(line)) {
              docRef.fontSize(bodyFontSize + 0.5).fillColor(veraGreen).font('Helvetica-Bold');
              docRef.text(line, x, y, { width: textWidth, lineGap: BODY_LINE_GAP });
              y +=
                docRef.heightOfString(line, { width: textWidth, lineGap: BODY_LINE_GAP }) +
                HEADING_GAP_AFTER;
              i++;
              continue;
            }

            if (line.startsWith('•')) {
              const bullets: string[] = [];
              while (i < lines.length) {
                const L = lines[i].trim();
                if (L === '' || !L.startsWith('•')) break;
                bullets.push(L.replace(/^•\s*/, ''));
                i++;
              }
              const bulletTextW = textWidth - BULLET_INDENT - BULLET_MARKER_GAP;
              docRef.fontSize(bodyFontSize).fillColor(bodyGray).font('Helvetica');
              for (const b of bullets) {
                const rowTop = y;
                docRef.save();
                docRef.circle(x + BULLET_INDENT / 2 - 2, rowTop + bodyFontSize * 0.35, 2.2).fill(veraGreen);
                docRef.restore();
                docRef.fillColor(bodyGray).font('Helvetica').text(b, x + BULLET_INDENT + BULLET_MARKER_GAP, y, {
                  width: bulletTextW,
                  lineGap: BODY_LINE_GAP,
                });
                y +=
                  docRef.heightOfString(b, { width: bulletTextW, lineGap: BODY_LINE_GAP }) +
                  BULLET_ROW_GAP;
              }
              y += PARA_GAP / 2;
              continue;
            }

            const prose: string[] = [];
            while (i < lines.length) {
              const L = lines[i].trim();
              if (L === '') break;
              if (L.startsWith('•') || /^\d+\.\s/.test(L)) break;
              prose.push(L);
              i++;
            }
            const text = prose.join(' ');
            docRef.fontSize(bodyFontSize).fillColor(bodyGray).font('Helvetica');
            docRef.text(text, x, y, { width: textWidth, lineGap: BODY_LINE_GAP });
            y +=
              docRef.heightOfString(text, { width: textWidth, lineGap: BODY_LINE_GAP }) + PARA_GAP;
          }

          return y;
        };

        const sectionCardMetrics = (
          title: string,
          body: string,
          bodyFontSize: number,
          innerBodyW: number,
          titleBlockW: number,
          chapter: ReturnType<typeof parseChapterTitle>,
        ) => {
          const titleFontSize = chapter.num ? 12.5 : 13.5;
          doc.fontSize(titleFontSize).font('Helvetica-Bold');
          const titleOnly = chapter.num ? chapter.label : title;
          const titleH = doc.heightOfString(titleOnly, { width: titleBlockW });
          const badgeColH = chapter.num ? BADGE_SIZE + 4 : 0;
          const titleBandH =
            TITLE_BAND_PAD_V + Math.max(badgeColH, titleH + 2) + TITLE_BAND_PAD_V + 6;
          const bodyH =
            measureRichBodyHeight(doc, body, innerBodyW, veraGreen, bodyGray, bodyFontSize) +
            BODY_HEIGHT_SLACK;
          const cardH =
            titleBandH + BODY_GAP_AFTER_BAND + bodyH + CARD_PAD + (chapter.isContact ? 10 : 0);
          return { titleBandH, titleH, titleOnly, titleFontSize, bodyH, cardH };
        };

        const renderSectionCard = (title: string, body: string, sectionIndex: number) => {
          const chapter = parseChapterTitle(title);
          const isIntro = sectionIndex === 0;
          const contactTone = chapter.isContact;

          const innerBodyX = MARGIN + CARD_PAD + TITLE_BAND_PAD_H;
          const innerBodyW = contentW - 2 * CARD_PAD - TITLE_BAND_PAD_H * 2;
          const titleBlockX = MARGIN + CARD_PAD + TITLE_BAND_PAD_H + (chapter.num ? BADGE_SIZE + 12 : 0);
          const titleBlockW =
            contentW - 2 * CARD_PAD - TITLE_BAND_PAD_H * 2 - (chapter.num ? BADGE_SIZE + 12 : 0);

          const bodyFontSize = isIntro ? 11 : 10.5;
          const { titleBandH, titleOnly, titleFontSize, cardH } = sectionCardMetrics(
            title,
            body,
            bodyFontSize,
            innerBodyW,
            titleBlockW,
            chapter,
          );

          if (doc.y + cardH + SECTION_AFTER > contentBottom) {
            startNewContentPage();
          }

          const cardTop = doc.y;
          const cardX = MARGIN;
          const cardW = contentW;

          doc.save();
          doc.roundedRect(cardX + 2, cardTop + 2, cardW, cardH, CARD_RADIUS).fill(shadowFill).opacity(0.55);
          doc.restore();

          const fillTop = contactTone ? bgGreenDeep : cardFill;
          doc.save();
          doc.roundedRect(cardX, cardTop, cardW, cardH, CARD_RADIUS).fill(fillTop).stroke(cardStroke, 0.9);
          doc.restore();

          const bandBottom = cardTop + titleBandH;
          doc.rect(cardX, cardTop, cardW, titleBandH).fill(titleBandFill);
          doc.moveTo(cardX + CARD_PAD, bandBottom).lineTo(cardX + cardW - CARD_PAD, bandBottom).stroke(mutedLine, 0.65);

          const titleBaseline = cardTop + TITLE_BAND_PAD_V + 2;

          if (chapter.num) {
            doc.save();
            doc.roundedRect(MARGIN + CARD_PAD + TITLE_BAND_PAD_H, titleBaseline - 2, BADGE_SIZE, BADGE_SIZE, 5).fill(veraGreen);
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
            doc.text(chapter.num, MARGIN + CARD_PAD + TITLE_BAND_PAD_H, titleBaseline + 6, {
              width: BADGE_SIZE,
              align: 'center',
              lineBreak: false,
            });
            doc.restore();
          }

          doc.fontSize(titleFontSize).fillColor(isIntro ? veraGreen : darkGray).font('Helvetica-Bold');
          doc.text(titleOnly, titleBlockX, titleBaseline, { width: titleBlockW, lineGap: 3 });

          const bodyTop = bandBottom + BODY_GAP_AFTER_BAND;
          const bodyEndY = renderRichBody(doc, innerBodyX, bodyTop, body, innerBodyW, bodyFontSize);
          const paintedBottom = Math.max(cardTop + cardH, bodyEndY + 12);

          if (contactTone) {
            const stripY = paintedBottom - 7;
            doc.save();
            doc.roundedRect(cardX + CARD_PAD, stripY, cardW - CARD_PAD * 2, 5, 2).fill(veraGreen).opacity(0.88);
            doc.restore();
          }

          doc.y = paintedBottom + SECTION_AFTER;
        };

        const renderToc = () => {
          const skipFirst = sections[0]?.title === 'BioVera Fresh';
          const tocEntries = skipFirst ? sections.slice(1) : [...sections];
          const colGap = 28;
          const colW = (contentW - colGap) / 2;
          const tocInnerW = contentW - 36;

          let tocBodyH = 36;
          doc.fontSize(9).fillColor(lightGray).font('Helvetica');
          const tocLead = 'Overview of chapters in this partner programme.';
          tocBodyH += doc.heightOfString(tocLead, { width: tocInnerW }) + 18;

          const perCol = Math.ceil(tocEntries.length / 2);
          doc.fontSize(9.5).fillColor(bodyGray).font('Helvetica');
          for (let r = 0; r < perCol; r++) {
            const left = tocEntries[r]?.title ?? '';
            const right = tocEntries[r + perCol]?.title ?? '';
            const rowH =
              Math.max(
                left ? doc.heightOfString(left, { width: colW - 6 }) : 0,
                right ? doc.heightOfString(right, { width: colW - 6 }) : 0,
              ) + 7;
            tocBodyH += rowH;
          }
          tocBodyH += 20;

          const tocCardH = tocBodyH;
          if (doc.y + tocCardH + SECTION_AFTER > contentBottom) {
            startNewContentPage();
          }

          const tocTop = doc.y;
          doc.save();
          doc.roundedRect(MARGIN + 1, tocTop + 1, contentW, tocCardH, CARD_RADIUS).fill(shadowFill).opacity(0.45);
          doc.restore();
          doc.roundedRect(MARGIN, tocTop, contentW, tocCardH, CARD_RADIUS).fill('#fafdfb').stroke(cardStroke, 0.85);

          let ty = tocTop + 18;
          doc.fontSize(13).fillColor(veraGreen).font('Helvetica-Bold').text(tocTitle, MARGIN + 18, ty, {
            width: tocInnerW,
          });
          ty += 24;
          doc.fontSize(9).fillColor(lightGray).font('Helvetica').text(tocLead, MARGIN + 18, ty, {
            width: tocInnerW,
          });
          ty += doc.heightOfString(tocLead, { width: tocInnerW }) + 14;

          const leftX = MARGIN + 18;
          const rightX = leftX + colW + colGap;
          doc.fontSize(9.5).fillColor(bodyGray).font('Helvetica');
          for (let r = 0; r < perCol; r++) {
            const left = tocEntries[r]?.title ?? '';
            const right = tocEntries[r + perCol]?.title ?? '';
            const hL = left ? doc.heightOfString(left, { width: colW - 6 }) : 0;
            const hR = right ? doc.heightOfString(right, { width: colW - 6 }) : 0;
            const rowH = Math.max(hL, hR) + 7;
            if (left) doc.text(left, leftX, ty, { width: colW - 6 });
            if (right) doc.text(right, rightX, ty, { width: colW - 6 });
            ty += rowH;
          }

          doc.y = tocTop + tocCardH + SECTION_AFTER;
        };

        // --- Cover ---
        const bandH = 118;
        doc.rect(0, 0, pageW, bandH).fill(bgGreen);
        doc.rect(0, bandH - 14, pageW, 14).fill(bgGreenDeep).opacity(0.35);
        doc.opacity(1);
        doc.strokeColor(veraGreen).lineWidth(1.25).opacity(0.5);
        doc.moveTo(0, bandH).lineTo(pageW, bandH).stroke();
        doc.strokeColor('#000000').lineWidth(1).opacity(1);

        const logoPath = this.resolveLogoPath();
        if (logoPath) {
          try {
            doc.image(logoPath, MARGIN, 18, { width: 196, height: 58, fit: [196, 58] });
          } catch (e) {
            this.logger.warn('BioVera Fresh PDF: logo load failed', e);
            doc.fontSize(26).fillColor(veraGreen).font('Helvetica-Bold').text('Bio Vera', MARGIN, 40);
          }
        } else {
          doc.fontSize(26).fillColor(veraGreen).font('Helvetica-Bold').text('Bio Vera', MARGIN, 40);
        }

        doc.fontSize(11).fillColor(veraGreenMuted).font('Helvetica-Bold').text(docTitle, MARGIN, 84, {
          width: contentW,
        });

        doc.y = bandH + 26;

        doc.fontSize(24).fillColor(darkGray).font('Helvetica-Bold').text('BioVera Fresh', {
          width: contentW,
        });
        doc.moveDown(0.35);
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica')
          .text(
            'Controlled retail and franchise within the Bio Vera network.',
            { width: contentW, lineGap: 4 },
          );
        doc.moveDown(1);

        const heroBuf = this.readPublicImageFirstMatch(BIOVERA_FRESH_HERO_FILES);
        if (heroBuf) {
          try {
            const heroMaxH = 200;
            if (doc.y + heroMaxH > contentBottom) {
              startNewContentPage();
            }
            const heroY = doc.y;
            const heroW = contentW;
            const rHero = 10;

            doc.save();
            doc.roundedRect(MARGIN, heroY, heroW, heroMaxH, rHero).clip();
            doc.image(heroBuf, MARGIN, heroY, {
              fit: [heroW, heroMaxH],
              align: 'center',
              valign: 'center',
            });
            doc.restore();

            doc.save();
            doc.strokeColor(veraGreen).lineWidth(1.15).opacity(0.45);
            doc.roundedRect(MARGIN, heroY, heroW, heroMaxH, rHero).stroke();
            doc.strokeColor(cardStroke).lineWidth(0.85).opacity(1);
            doc.roundedRect(MARGIN, heroY, heroW, heroMaxH, rHero).stroke();
            doc.restore();

            doc.y = heroY + heroMaxH + 20;
          } catch (e) {
            this.logger.warn('BioVera Fresh PDF: hero image embed failed', e);
          }
        } else {
          this.logger.warn(
            `BioVera Fresh PDF: hero image not found (tried ${BIOVERA_FRESH_HERO_FILES.join(', ')} in ${this.listPublicAssetDirs().length} directories). Place file in web/public or backend/public.`,
          );
        }

        renderToc();

        sections.forEach((section, index) => {
          renderSectionCard(section.title, section.body, index);
        });

        const range = doc.bufferedPageRange();
        const totalPages = range.count;
        for (let i = range.start; i < range.start + totalPages; i++) {
          doc.switchToPage(i);
          const n = i - range.start + 1;
          const pageLabel = `Page ${n} of ${totalPages}`;

          doc.save();
          doc.strokeColor(veraGreen).opacity(0.55).lineWidth(2);
          doc.moveTo(MARGIN, pageH - 38).lineTo(pageW - MARGIN, pageH - 38).stroke();
          doc.opacity(1).strokeColor('#000000').lineWidth(1);
          doc.restore();

          doc.fontSize(8).fillColor(lightGray).font('Helvetica');
          doc.text('biovera.app', MARGIN + 4, pageH - 28, {
            width: 140,
            align: 'left',
            lineBreak: false,
          });
          doc.text(pageLabel, MARGIN, pageH - 28, {
            width: contentW,
            align: 'right',
            lineBreak: false,
          });
        }

        doc.end();
      } catch (error) {
        this.logger.error('BioVera Fresh PDF generation failed', error);
        reject(error);
      }
    });
  }
}
