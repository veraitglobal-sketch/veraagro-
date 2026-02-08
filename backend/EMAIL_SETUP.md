# Email Setup Guide - Besplatne Opcije

> **VAŽNO**: Za email sa custom domenom (npr. `noreply@biovera.app`), pogledaj **CUSTOM_EMAIL_DOMAIN.md**

## 🎯 Preporučene Besplatne Opcije

### 1. **Resend** (NAJBOLJE ZA PRODUCTION) ⭐
- **Besplatno**: 3,000 emailova/mesec
- **Cena**: $0 nakon besplatnog limita
- **Prednosti**: 
  - Najlakše za setup
  - Odličan deliverability
  - Moderni API
  - Besplatni custom domain
- **Link**: https://resend.com

### 2. **Brevo (Sendinblue)** 
- **Besplatno**: 300 emailova/dan (9,000/mesec)
- **Cena**: €0 nakon besplatnog limita
- **Prednosti**: 
  - Veći dnevni limit
  - Email marketing features
- **Link**: https://www.brevo.com

### 3. **Mailgun**
- **Besplatno**: 5,000 emailova/mesec (prva 3 meseca)
- **Cena**: $0.80/1,000 nakon toga
- **Prednosti**: 
  - Odličan za developers
  - API-first pristup
- **Link**: https://www.mailgun.com

### 4. **Gmail (Personal Account)**
- **Besplatno**: Neograničeno
- **Prednosti**: 
  - Već imaš Gmail nalog
  - Ne treba registracija
- **Mane**: 
  - Treba App Password (2FA)
  - Manje profesionalno
  - Može biti spam

### 5. **SendGrid**
- **Besplatno**: 100 emailova/dan
- **Cena**: $0 nakon besplatnog limita
- **Link**: https://sendgrid.com

---

## 🚀 Setup: Resend (Preporučeno)

### Korak 1: Registracija
1. Idi na https://resend.com
2. Klikni "Sign Up" (možeš sa Google/GitHub)
3. Verifikuj email

### Korak 2: Dobij API Key
1. U dashboard-u, idi na "API Keys"
2. Klikni "Create API Key"
3. Daj mu ime (npr. "Bio Vera Production")
4. Kopiraj API key (samo jednom se prikazuje!)

### Korak 3: Konfiguriši Backend

Dodaj u `backend/.env`:
```env
# Resend Configuration
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_YOUR_API_KEY_HERE
EMAIL_FROM=noreply@biovera.app
ADMIN_EMAIL=your-email@gmail.com
```

**VAŽNO**: Zameni `re_YOUR_API_KEY_HERE` sa tvojim stvarnim API key-jem!

### Korak 4: Verifikuj Domain (Opciono)
1. U Resend dashboard-u, idi na "Domains"
2. Dodaj svoj domain (npr. `biovera.app`)
3. Dodaj DNS records koje ti daju
4. Sačekaj verifikaciju (obično 5-10 minuta)

---

## 📧 Setup: Gmail (Brzo za Testiranje)

### Korak 1: Omogući 2-Factor Authentication
1. Idi na https://myaccount.google.com/security
2. Uključi "2-Step Verification"

### Korak 2: Generiši App Password
1. Idi na https://myaccount.google.com/apppasswords
2. Izaberi "Mail" i "Other (Custom name)"
3. Unesi "Bio Vera Backend"
4. Kopiraj generisani password (16 karaktera)

### Korak 3: Konfiguriši Backend

Dodaj u `backend/.env`:
```env
# Gmail Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
ADMIN_EMAIL=your-email@gmail.com
```

---

## 🔧 Setup: Brevo (Sendinblue)

### Korak 1: Registracija
1. Idi na https://www.brevo.com
2. Klikni "Sign up free"
3. Verifikuj email

### Korak 2: Dobij SMTP Credentials
1. U dashboard-u, idi na "SMTP & API"
2. Klikni "SMTP" tab
3. Kopiraj:
   - SMTP Server: `smtp-relay.brevo.com`
   - Port: `587`
   - Login: Tvoj email
   - Password: SMTP Key (generiši ako nemaš)

### Korak 3: Konfiguriši Backend

Dodaj u `backend/.env`:
```env
# Brevo Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-key-here
EMAIL_FROM=noreply@biovera.app
ADMIN_EMAIL=your-email@example.com
```

---

## ✅ Testiranje Email Konfiguracije

Nakon što si konfigurisao `.env`, testiraj:

```bash
cd backend
npm run start:dev
```

Email service će automatski testirati konekciju pri startu.

Ili možeš ručno testirati:
```bash
# U backend folderu, kreiraj test script
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
transporter.verify().then(() => console.log('✅ Email configured correctly!')).catch(err => console.error('❌ Error:', err));
"
```

---

## 📝 Primer .env Fajla

Kreiraj `backend/.env` fajl:

```env
# Database
DATABASE_URL=your-database-url

# JWT
JWT_SECRET=your-jwt-secret

# Email Configuration (Resend)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_YOUR_API_KEY_HERE
EMAIL_FROM=noreply@biovera.app
ADMIN_EMAIL=your-email@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Port
PORT=3004
NODE_ENV=development
```

---

## 🎯 Preporuka

**Za Development/Testiranje**: Koristi **Gmail** (brzo, besplatno, već imaš nalog)

**Za Production**: Koristi **Resend** (najbolji deliverability, besplatno do 3,000/mesec, lako za setup)

---

## ⚠️ Važne Napomene

1. **Nikad ne commit-uj `.env` fajl** - već je u `.gitignore`
2. **Čuvaj API keys sigurno** - ne deli ih javno
3. **Za production, koristi custom domain** - profesionalnije izgleda
4. **Rate limiting** - većina servisa ima rate limits, naš backend ima throttling

---

## 🆘 Troubleshooting

### "Authentication failed"
- Proveri da li su credentials tačni
- Za Gmail, koristi App Password, ne običnu šifru
- Za Resend, proveri da li je API key tačan

### "Connection timeout"
- Proveri firewall settings
- Proveri da li je port 587 otvoren
- Pokušaj sa portom 465 (secure: true)

### "Email not sending"
- Proveri da li si prešao dnevni/mesečni limit
- Proveri spam folder
- Proveri logs u backend konzoli
