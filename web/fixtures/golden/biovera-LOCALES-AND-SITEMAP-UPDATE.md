# CRITICAL UPDATE — Locales (equal weight)

Live languages on https://www.biovera.app (all return HTTP 200):

| Code | Language | Equal in sitemap/hreflang |
|------|----------|---------------------------|
| `en` | English | yes |
| `de` | Deutsch (German) | yes |
| `sr` | Srpski (Serbian) | yes |
| `bg` | Български (Bulgarian) | yes |
| `ro` | Română (Romanian) | yes |
| `fr` | Français (French) | yes |
| `es` | Español (Spanish) | yes |

**Do NOT** ship a sitemap with only `en` + `sr`. All seven locales are first-class.

## SSR status (verified 2026-09-13)
- **Only `en` has full SSR content** (hundreds of words + H1).
- `de`, `sr`, `bg`, `ro`, `fr`, `es` are nearly empty for crawlers (~10–18 words, **0 H1**).
- Fixing SSR is required for **every** non-EN locale, not only Serbian.

## hreflang rules
For every slug, every locale URL must list alternate links for **all seven** codes + `x-default` → `en` twin.
Example for growers:
- loc: `/de/for-growers`
- alternates: en, de, sr, bg, ro, fr, es, x-default→`/en/for-growers`

## HTML head
```html
<html lang="de"> <!-- correct BCP47 per locale: en, de, sr, bg, ro, fr, es -->
<link rel="canonical" href="https://www.biovera.app/de/for-growers" />
<link rel="alternate" hreflang="en" href="https://www.biovera.app/en/for-growers" />
<link rel="alternate" hreflang="de" href="https://www.biovera.app/de/for-growers" />
<link rel="alternate" hreflang="sr" href="https://www.biovera.app/sr/for-growers" />
<link rel="alternate" hreflang="bg" href="https://www.biovera.app/bg/for-growers" />
<link rel="alternate" hreflang="ro" href="https://www.biovera.app/ro/for-growers" />
<link rel="alternate" hreflang="fr" href="https://www.biovera.app/fr/for-growers" />
<link rel="alternate" hreflang="es" href="https://www.biovera.app/es/for-growers" />
<link rel="alternate" hreflang="x-default" href="https://www.biovera.app/en/for-growers" />
```

## Audience note (copy, not crawl)
Marketing voice may still differ by market (e.g. SR lean growers/logistics/suppliers), but **technical equality** in sitemap, canonical cluster, and SSR is mandatory for all seven.

## Golden files to use
- `sitemap.golden.xml` — core pages × 7 locales (175 `<url>` entries)
- `sitemap.maximum.golden.xml` — core + guides/crops × 7 (259 entries)

Ignore any earlier golden that only had en+sr.
