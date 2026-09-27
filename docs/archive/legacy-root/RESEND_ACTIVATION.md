# Resend – aktivacija na sajtu

Resend je podešen za slanje emailova sa sajta (kontakt forma, welcome email za farmere).

## Lokalno

U `backend/.env` su već dodati:

- `SMTP_HOST=smtp.resend.com`
- `SMTP_PORT=587`
- `SMTP_USER=resend`
- `RESEND_API_KEY=...` (tvoj kljuc)
- `EMAIL_FROM=onboarding@resend.dev`

Pokretanje backenda: email servis se automatski povezuje na Resend.

## Produkcija (Railway)

1. **Railway** → projekat → servis **BioVera** (backend) → **Variables**.
2. Dodaj ili proveri ove promenljive:

| Variable         | Value                    |
|------------------|--------------------------|
| `SMTP_HOST`      | `smtp.resend.com`        |
| `SMTP_PORT`      | `587`                    |
| `SMTP_USER`      | `resend`                 |
| `RESEND_API_KEY` | tvoj Resend API kljuc   |
| `EMAIL_FROM`     | `onboarding@resend.dev` |

3. Sačuvaj – Railway će ponovo pokrenuti servis.
4. Opciono: ako imaš verifikovan domen u Resend (npr. `biovera.app`), možeš staviti `EMAIL_FROM=info@biovera.app` ili `noreply@biovera.app`.

## Šta sada radi preko Resend-a

- **Kontakt forma** (`/contact`) – poruka stiže na admin email (ili `ADMIN_EMAIL` / `EMAIL_FROM`).
- **Welcome email** – kada admin kreira novog farmera sa emailom, farmer dobija credentials na svoj email.

## Provera

- Lokalno: pošalji test poruku preko kontakt forme ili kreiraj test farmera sa emailom.
- U Resend dashboardu: **Logs** – trebalo bi da vidiš poslate emailove.
