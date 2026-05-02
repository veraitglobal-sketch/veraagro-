# Web: javni / producer / login — API greške (P4.2 nastavak)

**Status:** **završeno (maj 2026)** — sve stavke ispod prebačene na `apiErrorOrT` / `unknown` u `catch`.

**Svrha (istorija):** Jedinstveno mapiranje grešaka kao na ulogama (admin, buyer, logistics, supplier): **`web/lib/api-error.ts`** → `apiErrorOrT` / `axiosLikeMessage` (prioritet: `response.data.message`, zatim lokalizovan fallback).

**Povezano:** [FOLLOWUP_BACKLOG_DETAILED.md](FOLLOWUP_BACKLOG_DETAILED.md) §1.1 / P2.2 (uloge); ovaj fajl je bio **Faza B** za javne rute.

## Obrađene lokacije (`web/`)

| Lokacija | Napomena |
|----------|----------|
| `app/login/admin/page.tsx` | Admin login |
| `app/producer/estates/new/page.tsx` | Novi estate |
| `app/producer/estates/[id]/page.tsx` | Detalj estate-a |
| `app/certificate/[qrId]/page.tsx` | Javni sertifikat (`fetch` + `Error`, i dalje kroz `apiErrorOrT`) |
| `app/estate/[qrCode]/page.tsx` | Estate QR pasoš |
| `app/track/[batchId]/page.tsx` | Track |
| `app/verify/[batchId]/page.tsx` | Verifikacija |
| `app/passport/[batchId]/page.tsx` | Digitalni pasoš |
| `app/batch/[batchId]/history/page.tsx` | Istorija partije |
| `app/transparency/batch/[batchId]/page.tsx` | Deep dive |
| `app/protocol-360/page.tsx` | Protocol 360 status + info |
| `app/aeo-dashboard/page.tsx` | AEO vozilo |
| `components/QRScanner.tsx` | Kamera (poruka iz `Error` ili `common.apiErrorGeneric`) |

**Uklonjeno:** `catch (err: any)` / `catch (e: any)` u celom `web/` paketu.

**Napomena za QR / kameru:** za fiksnu copy umesto sistemskog teksta browsa, dodati poseban i18n ključ.
