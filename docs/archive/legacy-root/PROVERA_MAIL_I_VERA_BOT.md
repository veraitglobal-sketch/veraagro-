# Provera: Mail (kontakt forma) i Vera bot

Oba zahteva da **frontend** (biovera.app na Vercel-u) uspešno zove **backend** (Railway). Ako backend URL nije podešen na Vercel-u, ne rade ni kontakt forma ni Vera bot.

---

## 1. Vercel – obavezno (rešava i mail i Vera bot)

| Korak | Šta uraditi |
|-------|-------------|
| 1 | Vercel → tvoj projekat → **Settings** → **Environment Variables** |
| 2 | Proveri da postoji **`NEXT_PUBLIC_API_URL`** |
| 3 | Vrednost: **`https://api.biovera.app`** ili **`https://biovera-production.up.railway.app`** |
| 4 | Označi **Production** (i Preview ako koristiš) → **Save** |
| 5 | **Deployments** → **Redeploy** (bez ovoga nova vrednost ne ulazi u build) |

Bez ovoga browser šalje zahteve na `http://localhost:3004` → Network Error, kontakt forma i Vera bot ne rade.

---

## 2. Railway – mail (slanje emailova)

| Variable | Vrednost |
|----------|----------|
| `RESEND_API_KEY` | `re_ZG6pwXSM_Agb9hQFZBQtsfxuRzoJDsfTK` |
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `resend` |
| `SMTP_PASS` | `re_ZG6pwXSM_Agb9hQFZBQtsfxuRzoJDsfTK` |
| `EMAIL_FROM` | `onboarding@resend.dev` ili `info@biovera.app` (ako je domen verifikovan u Resend) |
| `ADMIN_EMAIL` | `info@biovera.app` |

Posle izmene varijabli: **Redeploy** backenda na Railway-u.

---

## 3. Brza provera

- **Backend živ:** otvori u browseru `https://api.biovera.app/health` (ili Railway URL) → treba `{"status":"healthy",...}`.
- **Kontakt forma:** pošalji poruku na `/contact` – ne bi trebalo Network Error.
- **Vera bot:** klikni na dugme za chat (Need help?) – bot treba da se otvori i da odgovori.

---

## Rezime

| Problem | Uzrok | Rešenje |
|---------|--------|---------|
| Kontakt forma – Network Error | Frontend ne zna URL backenda | `NEXT_PUBLIC_API_URL` na Vercel + Redeploy |
| Vera bot ne radi / ne šalje | Isti URL za API pozive | Isto – `NEXT_PUBLIC_API_URL` na Vercel + Redeploy |
| Email se ne šalje (forma prođe ali nema mejla) | Backend nema Resend kredencijale | Railway: `RESEND_API_KEY` + SMTP vars + Redeploy |

**Jedan najvažniji korak:** na Vercel-u postavi **`NEXT_PUBLIC_API_URL`** i uradi **Redeploy** – to rešava i mail (kontakt) i Vera bot zajedno.
