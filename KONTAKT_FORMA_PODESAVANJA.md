# Kontakt forma – šta mora biti podešeno

Da forma radi (ne ostane na "Sending..." i da stvarno pošalje poruku na mejl), sve ispod mora biti tačno.

---

## Arhitektura (od 2025)

**Frontend → Next.js API proxy (`/api/contact/submit`) → Backend (`/contact/submit`) → Email (Resend)**

Kontakt forma više ne šalje direktno na backend. Zahtev ide na same-origin proxy, pa proxy prosleđuje backendu. To rešava CORS i probleme sa `NEXT_PUBLIC_API_URL` u produkciji.

---

## 1. Vercel (frontend)

| Šta | Gde | Vrednost |
|-----|-----|----------|
| **NEXT_PUBLIC_API_URL** | Settings → Environment Variables | `https://api.biovera.app` ili Railway URL |

- Proxy koristi ovu vrednost da zna gde da šalje zahtev.
- Mora biti za **Production** (i Preview ako ga koristiš).
- Posle izmene: **Deployments** → **Redeploy**.

---

## 2. Railway (backend)

### A) Da backend prima zahteve od sajta (CORS)

| Variable | Vrednost (primer) |
|----------|-------------------|
| **FRONTEND_URL** | `https://www.biovera.app` ili `https://bio-vera.vercel.app` |

U kodu su već dozvoljeni: `www.biovera.app`, `biovera.app`, `bio-vera.vercel.app`, i bilo koji `*.vercel.app`. Ako koristiš drugi domen, navedi ga u **FRONTEND_URL**.

### B) Da backend pošalje email (Resend)

| Variable | Vrednost | Obavezno |
|----------|----------|----------|
| **RESEND_API_KEY** | API ključ iz Resend dashboarda (re_xxx...) | ✅ |
| **ADMIN_EMAIL** | Adresa na koju stižu upiti (npr. info@biovera.app ili tvoj lični mejl) | ✅ |
| **EMAIL_FROM** | `onboarding@resend.dev` (default) ili `info@tvoj-domen.com` ako je domen verifikovan | Opciono |

**Važno za Resend free tier:**
- Ako NEMAŠ verifikovan domen u Resend, koristi `onboarding@resend.dev` kao FROM (to je sada default).
- `ADMIN_EMAIL` mora biti adresa na koju možeš primati – za test može biti tvoj Resend signup email.
- Posle verifikacije domena u Resend, postavi `EMAIL_FROM=info@biovera.app` (ili tvoj domen).

Opciono (Resend SMTP):
| **SMTP_HOST** | `smtp.resend.com` |
| **SMTP_PORT** | `587` |

Posle izmene varijabli: **Redeploy** backenda na Railway-u.

---

## 3. Kako proveriti

1. **Backend živi**  
   U browseru otvori: `https://api.biovera.app/health`  
   Treba: `{"status":"healthy",...}`

2. **Sa kog domena testiraš**  
   Isti domen mora biti dozvoljen u CORS-u (gore liste). Ako si na `https://bio-vera.vercel.app`, to je već u kodu; ako si na `https://www.biovera.app`, isto.

3. **U browseru (F12) → Network**  
   Pošalji formu i pogledaj zahtev ka `/contact/submit`:
   - **Request URL** treba da bude: `https://api.biovera.app/contact/submit` (ne `localhost`).
   - **Status**: 200 = OK; 0 ili CORS error = pogrešan CORS ili URL.

4. **Railway logovi**  
   Posle slanja forme u logovima backenda treba da se vidi poziv na contact (i eventualno “Contact inquiry submitted by …” ili greška od Resend-a).

---

## Rezime

| Problem | Proveri |
|---------|--------|
| Forma ostaje na "Sending..." | Request URL u Network tabu – da li ide na `api.biovera.app`? |
| CORS greška u konzoli | Da li je tvoj domen u CORS-u (FRONTEND_URL ili jedan od u listi)? |
| 200 OK ali email ne stiže | Railway: RESEND_API_KEY i ostale Resend varijable + Redeploy |

Sve je “podešeno kako treba” kada: **Vercel** ima **NEXT_PUBLIC_API_URL**, **Railway** ima **FRONTEND_URL** i **Resend** varijable, i oba su redeploy-ovana posle izmena.
