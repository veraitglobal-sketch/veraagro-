# Bio Vera — AI trust pack (all locales)

Careful pack for developers and AI surfaces. Generated 2026-09-13.

## Locales (equal)
`en` `de` `sr` `bg` `ro` `fr` `es`

## Contents
| Folder | Files |
|--------|-------|
| `fact-sheets/` | FACT-SHEET.{locale}.md — source of truth per language |
| `llms/` | `llms.txt` (EN, for site root) + `llms.{locale}.txt` for each language |
| `about/` | about-lead.{locale}.md — title, meta, H1, premium prose |
| `faq/` | faq-entity.{locale}.md — entity FAQ answers for FAQPage SSR |

## Deploy recommendation
1. Publish **root** `https://www.biovera.app/llms.txt` from `llms/llms.txt` (English).
2. Also publish `https://www.biovera.app/{locale}/llms.txt` from `llms/llms.{locale}.txt` for all seven locales (or `/llms.{locale}.txt` if routing prefers — keep linked from each locale About/footer).
3. Sync Organization JSON-LD description with the locked entity paragraph (EN in schema is OK if mirrored on pages).
4. Replace About body + FAQ answers using these files after SSR works for each locale.
5. Confirm payout / GlobalG.A.P. cost strings with legal before treating them as hard promises (flagged in fact sheets).

## Hard rules already applied
- www URLs only
- Not a marketplace
- growers throughout Europe (no regional framing)
- No fake scale
- No 2027 delivery campaign copy

## QA
```bash
rg -n -i 'regional|regional' /workspace/biovera-ai-trust-pack && echo FAIL || echo OK_no_regional
ls fact-sheets llms about faq | wc -l
```
