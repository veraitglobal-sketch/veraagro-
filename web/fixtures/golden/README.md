# Bio Vera golden sitemap — šta je šta

## Tebi (Jovica)
Developeru pošalji **dva** seta:
1. `biovera-technical-seo-sitemap-spec.md` — specifikacija (šta da uradi)
2. Ovaj folder `biovera-golden/` — golden XML (kako tačno treba da izgleda sitemap)

Ti **meni** ne šalješ ništa.

## Fajlovi
- `sitemap.golden.xml` — pošalji odmah (core + protocol-360 + diligence), www + hreflang
- `sitemap.maximum.golden.xml` — maksimum (core + vodiči + crop URL-ovi); u live sitemap tek kad stranice postoje (200 + SSR)
- `sitemap-index.golden.xml` + `sitemap-pages` + `sitemap-guides` — enterprise split opcija

## Brojevi
- core url entries: 50
- maximum url entries: 74
