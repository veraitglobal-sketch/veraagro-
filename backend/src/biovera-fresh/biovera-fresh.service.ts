import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';

export type BioVeraFreshPdfLocale = 'en' | 'sr';

type PdfSection = { title: string; body: string };

/** Mirrors web locale copy — keep in sync with web/locales/*.json `bioVeraFresh.pdfSections`. */
const PDF_SECTIONS_EN: PdfSection[] = [
  {
    title: 'What BioVera Fresh is',
    body:
      'BioVera Fresh was developed in response to growing demand for products from the Bio Vera system and increasing farmer interest in cooperation. To enable stable placement of goods and secure an additional sales channel, we introduced the BioVera Fresh concept—a modern retail model based on controlled quality and direct connection between producers and the programme.',
  },
  {
    title: 'Our goal',
    body:
      'The BioVera Fresh programme aims to:\n• Enable reliable placement for products from our network\n• Reduce losses and surplus stock\n• Provide additional income through direct sales\n• Bring high-quality produce closer to end customers',
  },
  {
    title: 'How it works',
    body:
      'BioVera Fresh outlets offer:\n• Fruit and vegetables from the Bio Vera system\n• Products with known, documented origin\n• Goods that have passed programme quality controls\n• A transparent link between farmer and shopper\n\nAll products come from our controlled network and follow defined programme standards.',
  },
  {
    title: 'Relationship to the market',
    body:
      'It is important to underline: our main partners remain retail chains and distributors. BioVera Fresh does not compete with existing buyers—it is an additional channel that stabilises the market, enables sale of surplus where appropriate, and supports continuity of production. Expansion of the BioVera Fresh network will be carefully controlled and aligned with real market needs.',
  },
  {
    title: 'Pricing and quality model',
    body:
      'BioVera Fresh applies a clear principle:\n• Prices remain stable\n• Discounts are used only when justified by the nature or freshness of the product\n• Goods are sold in line with their actual freshness\n\nThis preserves balance between quality and availability.',
  },
  {
    title: 'Become a BioVera Fresh partner',
    body:
      'The BioVera Fresh franchise allows partners to become part of our system and grow their own retail business with Bio Vera support.\n\nAs a partner you receive:\n• Access to Bio Vera products and protocols\n• A clearly defined operating model\n• Workplace and quality standards\n• Support in development and operations\n\nFor commercial terms and territory discussion, use the contact options on this website.',
  },
];

const PDF_SECTIONS_SR: PdfSection[] = [
  {
    title: 'Šta je BioVera Fresh',
    body:
      'BioVera Fresh je nastao kao odgovor na rastuću potražnju za proizvodima iz BioVera sistema i sve veće interesovanje farmera za saradnju. Kako bismo omogućili stabilan plasman robe i obezbedili dodatni kanal prodaje, razvijen je BioVera Fresh koncept — moderan model maloprodaje zasnovan na kontrolisanom kvalitetu i direktnoj povezanosti sa proizvođačima unutar programa.',
  },
  {
    title: 'Naš cilj',
    body:
      'Cilj BioVera Fresh sistema je:\n• omogućiti siguran plasman proizvoda iz naše mreže\n• smanjiti gubitke i višak robe\n• obezbediti dodatni prihod kroz direktnu prodaju\n• približiti kvalitetne proizvode krajnjim kupcima',
  },
  {
    title: 'Kako funkcioniše',
    body:
      'BioVera Fresh prodavnice nude:\n• voće i povrće iz BioVera sistema\n• proizvode poznatog porekla\n• robu koja je prošla kontrolu kvaliteta\n• direktnu vezu između farmera i kupca\n\nSvi proizvodi dolaze iz naše kontrolisane mreže i prate definisane standarde programa.',
  },
  {
    title: 'Odnos prema tržištu',
    body:
      'Važno je naglasiti: naši glavni partneri ostaju retail lanci i distributeri. BioVera Fresh ne postoji kao konkurencija postojećim kupcima, već kao dodatni kanal koji stabilizuje tržište, omogućava prodaju viška robe gde je to opravdano i podržava kontinuitet proizvodnje. Širenje BioVera Fresh mreže biće pažljivo kontrolisano i usklađeno sa realnim potrebama tržišta.',
  },
  {
    title: 'Model cena i kvaliteta',
    body:
      'BioVera Fresh primenjuje jasan princip:\n• cene ostaju stabilne\n• popusti se koriste isključivo zbog prirode proizvoda (npr. prozor svežine)\n• roba se prodaje u skladu sa svojom stvarnom svežinom\n\nTako obezbeđujemo balans između kvaliteta i dostupnosti proizvoda.',
  },
  {
    title: 'Postani BioVera Fresh partner',
    body:
      'BioVera Fresh franšiza omogućava partnerima da postanu deo našeg sistema i razvijaju sopstveni maloprodajni biznis uz podršku Bio Vere.\n\nKao partner dobijate:\n• pristup BioVera proizvodima i protokolima\n• jasno definisan model poslovanja\n• standarde rada i kvaliteta\n• podršku u razvoju i operacijama\n\nZa komercijalne uslove i teritoriju koristite kontakt na ovom sajtu.',
  },
];

@Injectable()
export class BioVeraFreshService {
  private readonly logger = new Logger(BioVeraFreshService.name);

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
