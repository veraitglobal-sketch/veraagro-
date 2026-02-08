# Email Konfiguracija - info@biovera.app

## ✅ Tvoja Email Adresa

**Email adresa**: `info@biovera.app`

Ova adresa se koristi za:
- Slanje emailova (welcome emails, notifications)
- Primanje contact inquiries
- General inquiries

---

## 🔧 Backend Konfiguracija

Dodaj u `backend/.env`:

```env
# Email Configuration - Amazon SES
SMTP_HOST=feedback-smtp.eu-west-1.amazonses.com
SMTP_PORT=587
SMTP_USER=YOUR_SES_SMTP_USERNAME
SMTP_PASS=YOUR_SES_SMTP_PASSWORD
EMAIL_FROM=info@biovera.app
ADMIN_EMAIL=info@biovera.app
```

**VAŽNO**: 
- `SMTP_USER` i `SMTP_PASS` su SMTP credentials iz Amazon SES (ne AWS access keys!)
- Kreiraj ih u Amazon SES Console → SMTP settings
- `EMAIL_FROM` mora biti verifikovan domain u Amazon SES

**Alternativa - Resend:**
```env
# Email Configuration - Resend
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_DK2V8Wuf_LN6rRPUa3D8Jq1VbiisETech
EMAIL_FROM=info@biovera.app
ADMIN_EMAIL=info@biovera.app
```

**Napomena**: 
- `EMAIL_FROM` - adresa sa koje se šalju emailovi
- `ADMIN_EMAIL` - adresa gde se šalju contact inquiries

---

## 📧 Kako Funkcioniše

### Slanje Emailova:
- Welcome emails farmerima → šalju se sa `info@biovera.app`
- Contact form submissions → šalju se na `info@biovera.app`

### Primanje Emailova:
- Contact inquiries → stižu na `info@biovera.app`
- Ako koristiš Cloudflare Email Routing → forward-uju se na tvoj Gmail

---

## ✅ Testiranje

1. Restart backend:
```bash
cd backend
npm run start:dev
```

2. Testiraj contact form na sajtu
3. Proveri da li email stiže na `info@biovera.app` (ili na tvoj Gmail ako koristiš forwarding)

---

## 🎯 Rezultat

- ✅ Emailovi se šalju sa `info@biovera.app`
- ✅ Contact inquiries stižu na `info@biovera.app`
- ✅ Profesionalno i konzistentno
