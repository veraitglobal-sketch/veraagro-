# Resend Setup - info@biovera.app

## ✅ Tvoj Resend API Key

**API Key**: `re_DK2V8Wuf_LN6rRPUa3D8Jq1VbiisETech`

---

## 🔧 Backend Konfiguracija

Dodaj u `backend/.env`:

```env
# Resend Configuration
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_DK2V8Wuf_LN6rRPUa3D8Jq1VbiisETech

# Email Addresses
EMAIL_FROM=info@biovera.app
ADMIN_EMAIL=info@biovera.app
```

**VAŽNO**: 
- `SMTP_USER` mora biti tačno `resend` (Resend zahteva ovo)
- `SMTP_PASS` je tvoj Resend API key
- `EMAIL_FROM` mora biti verifikovan domain u Resend dashboard-u

---

## 📧 Verifikacija Domena u Resend

### Korak 1: Dodaj Domain
1. Idi na https://resend.com/domains
2. Klikni "Add Domain"
3. Unesi `biovera.app`
4. Klikni "Add"

### Korak 2: Dodaj DNS Records
Resend će ti dati DNS records koje treba da dodaš:

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
```

**DKIM Record** (tvoj key):
```
Type: TXT
Name: resend._domainkey
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB
```

**VAŽNO**: 
- Kopiraj ceo `Value` string (uključujući `v=DKIM1; k=rsa; p=...`)
- Ne dodavaj razmake ili prelome linija
- Name mora biti tačno `resend._domainkey`

**DMARC Record** (opciono, ali preporučeno):
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@biovera.app
```

### Korak 3: Dodaj Records u DNS
1. Idi u svoj domain registrar (gde si kupio domain)
2. Dodaj sve DNS records koje ti Resend da
3. Sačekaj 5-10 minuta

### Korak 4: Verifikacija
1. Vrati se u Resend dashboard
2. Klikni "Verify" pored domena
3. Ako su svi records tačni, domain će biti verifikovan

---

## ✅ Testiranje

### 1. Restart Backend
```bash
cd backend
npm run start:dev
```

### 2. Test Contact Form
1. Idi na sajt
2. Pošalji poruku preko contact forme
3. Proveri da li email stiže na `info@biovera.app`

### 3. Test Welcome Email
1. Kreiraj novog farmera u admin panelu
2. Proveri da li welcome email stiže

---

## 🎯 Rezultat

- ✅ Emailovi se šalju sa `info@biovera.app`
- ✅ Contact inquiries stižu na `info@biovera.app`
- ✅ Profesionalno i konzistentno
- ✅ Odličan deliverability (Resend je jedan od najboljih)

---

## 🆘 Troubleshooting

### "Domain not verified"
- Proveri da li su svi DNS records tačno dodati
- Sačekaj 10-15 minuta (DNS propagation)
- Proveri da li su MX records dodati (ako ih Resend traži)

### "Email not sending"
- Proveri da li je API key tačan
- Proveri da li je domain verifikovan u Resend dashboard-u
- Proveri backend logs za greške

### "Authentication failed"
- Proveri da li je `SMTP_USER=resend` (tačno "resend", ne tvoj email)
- Proveri da li je API key tačan

---

## 📚 Dodatni Resursi

- Resend Dashboard: https://resend.com/domains
- Resend API Docs: https://resend.com/docs
- Resend SMTP Docs: https://resend.com/docs/send-with-smtp
