import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const SUPPORTED = ['en', 'sr', 'de', 'es', 'fr', 'ro', 'bg'] as const;
type Lang = (typeof SUPPORTED)[number];

type TemplateEntry = { title: string; message: string };

@Injectable()
export class NotificationTemplateService {
  private cache = new Map<string, Record<string, TemplateEntry>>();

  private load(lang: string): Record<string, TemplateEntry> {
    const code = SUPPORTED.includes(lang as Lang) ? lang : 'en';
    if (this.cache.has(code)) return this.cache.get(code)!;
    const file = path.join(__dirname, 'templates', `${code}.json`);
    let data: Record<string, TemplateEntry> = {};
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, TemplateEntry>;
    } catch {
      if (code !== 'en') return this.load('en');
    }
    this.cache.set(code, data);
    return data;
  }

  render(
    templateKey: string,
    params: Record<string, string | number | undefined>,
    lang?: string | null,
  ): TemplateEntry {
    const locale = lang && SUPPORTED.includes(lang as Lang) ? lang : 'en';
    const templates = this.load(locale);
    const fallback = this.load('en');
    const entry = templates[templateKey] ?? fallback[templateKey];
    if (!entry) {
      return {
        title: String(params.title ?? templateKey),
        message: String(params.message ?? ''),
      };
    }
    const replace = (s: string) =>
      s.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(params[key] ?? ''));
    return { title: replace(entry.title), message: replace(entry.message) };
  }
}
