# ✅ Finalni Koraci - Resend Setup

## 🎯 Šta si uradio

- ✅ Dodao DNS records u Cloudflare/registrar
- ✅ DKIM record (`resend._domainkey`)
- ✅ SPF record (`send` ili `@`)
- ✅ DMARC record (`_dmarc`)

---

## 📋 Sledeći Koraci

### 1. Verifikuj Domain u Resend Dashboard-u

1. Idi na https://resend.com/domains
2. Pronađi `biovera.app` u listi
3. Klikni **"Verify"** (ili "Check DNS")
4. Sačekaj nekoliko sekundi
5. Ako su svi records tačni, videćeš **"Verified"** ✅

**Ako nije verified:**
- Sačekaj 5-10 minuta (DNS propagation)
- Proveri da li su svi records tačno dodati
- Klikni "Verify" ponovo

---

### 2. Ažuriraj Backend Konfiguraciju

Kreiraj ili ažuriraj `backend/.env` fajl:

```env
# Database
DATABASE_URL=your-database-url

# JWT
JWT_SECRET=your-jwt-secret

# Resend Email Configuration
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_DK2V8Wuf_LN6rRPUa3D8Jq1VbiisETech

# Email Addresses
EMAIL_FROM=info@biovera.app
ADMIN_EMAIL=info@biovera.app

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Server
PORT=3004
NODE_ENV=development
```

**VAŽNO**: 
- `SMTP_USER` mora biti tačno `resend` (ne tvoj email!)
- `SMTP_PASS` je tvoj Resend API key
- `EMAIL_FROM` mora biti verified domain u Resend

---

### 3. Restart Backend

```bash
cd backend
npm run start:dev
```

Backend će automatski testirati email konekciju pri startu.

---

### 4. Testiraj Email Slanje

#### Test 1: Contact Form
1. Idi na sajt
2. Idi na `/contact` stranicu
3. Popuni contact form:
   - Name: Test
   - Email: tvoj-email@gmail.com
   - Subject: Test Email
   - Message: Test message
4. Klikni "Send Message"
5. Proveri da li email stiže na `info@biovera.app` (ili na tvoj Gmail ako koristiš forwarding)

#### Test 2: Welcome Email (Ako imaš admin panel)
1. Kreiraj novog farmera u admin panelu
2. Proveri da li welcome email stiže

---

## ✅ Checklist

- [ ] DNS records dodati (DKIM, SPF, DMARC)
- [ ] Sačekao 5-10 minuta
- [ ] Domain verified u Resend dashboard-u ✅
- [ ] Ažurirao `backend/.env` fajl
- [ ] Restart backend
- [ ] Testirao contact form
- [ ] Email stiže ✅

---

## 🎯 Rezultat

Kada je sve gotovo:
- ✅ Emailovi se šalju sa `info@biovera.app`
- ✅ Contact inquiries stižu na `info@biovera.app`
- ✅ Welcome emails farmerima rade
- ✅ Profesionalno i konzistentno

---

## 🆘 Problemi?

### "Domain not verified"
- Proveri da li su svi DNS records dodati
- Sačekaj 10-15 minuta (DNS propagation može potrajati)
- Proveri online: https://mxtoolbox.com/TXTLookup.aspx

### "Email not sending"
- Proveri da li je domain verified u Resend
- Proveri da li je API key tačan u `.env`
- Proveri backend logs za greške

### "Authentication failed"
- Proveri da li je `SMTP_USER=resend` (tačno "resend")
- Proveri da li je API key tačan

---

## 📚 Dokumentacija

- Resend Dashboard: https://resend.com/domains
- Resend API Docs: https://resend.com/docs
- Backend Email Service: `backend/src/email/email.service.ts`

---

**Sve je spremno! Testiraj i javi ako ima problema.** 🚀
