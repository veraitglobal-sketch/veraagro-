# 📍 Resend Dashboard - Korak po Korak

## 🎯 Šta da uradiš na Resend Dashboard-u

### Korak 1: Dodaj Domain

1. U Resend dashboard-u, klikni na **"Domains"** u levoj navigaciji
2. Klikni **"Add Domain"** (plavi dugme)
3. Unesi `biovera.app`
4. Klikni **"Add"**

---

### Korak 2: Resend će ti dati DNS Records

Nakon što dodaš domain, Resend će ti prikazati DNS records koje treba da dodaš:

**Videćeš nešto ovako:**

```
Add these DNS records to verify your domain:

1. SPF Record
   Type: TXT
   Name: @
   Value: v=spf1 include:resend.com ~all

2. DKIM Record
   Type: TXT
   Name: resend._domainkey
   Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB

3. DMARC Record (Optional)
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@biovera.app
```

**VAŽNO**: 
- Kopiraj sve ove records
- Dodaj ih u svoj DNS (Cloudflare ili drugi registrar)
- Vidi `RESEND_DNS_STEP_BY_STEP.md` za detaljne instrukcije

---

### Korak 3: Dodaj DNS Records

1. **Otvori novi tab** sa Cloudflare (ili tvoj domain registrar)
2. Dodaj sve 3 DNS records (vidi `RESEND_DNS_STEP_BY_STEP.md`)
3. **Vrati se na Resend dashboard**

---

### Korak 4: Verifikuj Domain

1. U Resend dashboard-u, na stranici sa domain-om `biovera.app`
2. Klikni **"Verify"** dugme (ili "Check DNS")
3. Resend će proveriti da li su DNS records dodati
4. Ako su svi records tačni, videćeš **"Verified"** ✅

**Ako nije verified:**
- Proveri da li su svi records dodati
- Sačekaj 5-10 minuta (DNS propagation)
- Klikni "Verify" ponovo

---

### Korak 5: Proveri Status

Nakon verifikacije, trebalo bi da vidiš:

```
Domain: biovera.app
Status: ✅ Verified
SPF: ✅ Verified
DKIM: ✅ Verified
```

---

## 🔍 Gde se nalazi šta u Resend Dashboard-u

### Domains
- **Lokacija**: Leva navigacija → "Domains"
- **Šta vidiš**: Lista svih domena
- **Akcije**: Add Domain, Verify, Delete

### DNS Records
- **Lokacija**: Kada klikneš na domain → vidiš DNS records
- **Šta vidiš**: SPF, DKIM, DMARC records koje treba da dodaš
- **Akcije**: Copy records, Verify

### API Keys
- **Lokacija**: Leva navigacija → "API Keys"
- **Šta vidiš**: Lista API keys
- **Akcije**: Create API Key, Delete

---

## ✅ Kada je Domain Verified

Nakon što je domain verified:

1. **Vrati se u backend**
2. **Proveri `.env` fajl**:
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASS=re_DK2V8Wuf_LN6rRPUa3D8Jq1VbiisETech
   EMAIL_FROM=info@biovera.app
   ADMIN_EMAIL=info@biovera.app
   ```

3. **Restart backend**:
   ```bash
   cd backend
   npm run start:dev
   ```

4. **Testiraj contact form** na sajtu

---

## 🆘 Problemi na Resend Dashboard-u?

### "Domain not verified"
- Proveri da li su svi DNS records dodati u Cloudflare/registrar
- Sačekaj 5-10 minuta
- Klikni "Verify" ponovo

### "DKIM not found"
- Proveri da li je DKIM record tačno dodao
- Proveri da li je Name tačno `resend._domainkey`
- Proveri da li je Value kompletan (uključujući `v=DKIM1; k=rsa; p=...`)

### "SPF not found"
- Proveri da li je SPF record dodao
- Proveri da li je Value tačno `v=spf1 include:resend.com ~all`

---

## 📝 Checklist

- [ ] Dodao domain `biovera.app` u Resend
- [ ] Kopirao DNS records od Resend-a
- [ ] Dodao DNS records u Cloudflare/registrar
- [ ] Sačekao 5-10 minuta
- [ ] Kliknuo "Verify" u Resend dashboard-u
- [ ] Domain je verified ✅
- [ ] Ažurirao `.env` fajl
- [ ] Restart backend
- [ ] Testirao contact form

---

## 🎯 Sledeći Korak

Kada je domain verified u Resend dashboard-u:
1. Ažuriraj `backend/.env` sa Resend API key-jem
2. Restart backend
3. Testiraj slanje emailova

**Emailovi će se slati sa `info@biovera.app`!** 🎉
