import * as fs from 'fs';
import * as path from 'path';
import { NotificationTemplateService } from './notification-template.service';

const LANGS = ['en', 'sr', 'de', 'es', 'fr', 'ro', 'bg'];
const templatesDir = path.join(__dirname, 'templates');

describe('NotificationTemplateService', () => {
  const service = new NotificationTemplateService();
  const en = JSON.parse(fs.readFileSync(path.join(templatesDir, 'en.json'), 'utf8')) as Record<
    string,
    { title: string; message: string }
  >;
  const params = {
    orderNumber: 'BIOVERA-1-ABC',
    packLine: '2 × 5 kg',
    productName: 'Jabuka – Ajdared',
    missionNumber: 'MISSION-2026-0001',
    pickupCity: 'Beograd',
    destinationCity: 'Novi Sad',
  };

  it.each(LANGS)('renders every template in %s without glued or leftover placeholders', (lang) => {
    for (const key of Object.keys(en)) {
      for (const p of [params, { ...params, packLine: '' }]) {
        const { title, message } = service.render(key, p, lang);
        for (const text of [title, message]) {
          expect(text).not.toMatch(/\{\{|\}\}/);
          expect(text).not.toMatch(/\(\s*\)/);
          expect(text).not.toMatch(/ {2,}/);
          expect(text).not.toMatch(/\s[.,:;!?]/);
          // A param must never be glued to a preceding word ("prepared2 × 5 kg").
          expect(text).not.toMatch(/[A-Za-zÀ-žА-я]2 × 5 kg/);
        }
      }
    }
  });

  it('keeps pack line readable in the buyer payment message', () => {
    expect(service.render('buyer.paymentReceived', params, 'en').message).toBe(
      'Payment received — your order BIOVERA-1-ABC (2 × 5 kg) is being prepared.',
    );
    expect(service.render('buyer.paymentReceived', { ...params, packLine: '' }, 'sr').message).toBe(
      'Uplata primljena — porudžbina BIOVERA-1-ABC se priprema.',
    );
  });
});
