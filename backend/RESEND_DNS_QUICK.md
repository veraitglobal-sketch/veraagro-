# 🚀 Brzo Dodavanje DNS Records za Resend

## 📋 Records koje treba da dodaš

### 1. DKIM Record
- **Type**: TXT
- **Name**: `resend._domainkey`
- **Content**: `p=MIGfMA[…]QIDAQAB` (kopiraj ceo string od Resend-a)
- **TTL**: Auto

### 2. SPF Record
- **Type**: TXT
- **Name**: `send` (ili `@` ako Cloudflare ne prihvata `send`)
- **Content**: `v=spf1 include:resend.com ~all` (kopiraj ceo string od Resend-a)
- **TTL**: Auto

### 3. DMARC Record (Opciono)
- **Type**: TXT
- **Name**: `_dmarc`
- **Content**: `v=DMARC1; p=none;` (kopiraj ceo string od Resend-a)
- **TTL**: Auto

---

## 🔧 Kako da dodaš u Cloudflare

### Korak 1: Otvori Cloudflare
1. Idi na https://dash.cloudflare.com
2. Izaberi domain `biovera.app`
3. Klikni **"DNS"** u levoj navigaciji

### Korak 2: Dodaj DKIM Record

1. Klikni **"Add record"** (plavi dugme)
2. Popuni:
   - **Type**: Izaberi `TXT` iz dropdown-a
   - **Name**: Unesi `resend._domainkey`
   - **Content**: Kopiraj ceo string od Resend-a (ne skraćenu verziju!)
     - Trebalo bi da bude: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB`
   - **TTL**: Izaberi `Auto`
3. Klikni **"Save"**

---

### Korak 3: Dodaj SPF Record

1. Klikni **"Add record"** ponovo
2. Popuni:
   - **Type**: Izaberi `TXT` iz dropdown-a
   - **Name**: Unesi `send` (ili `@` ako Cloudflare ne prihvata `send`)
   - **Content**: Kopiraj ceo string od Resend-a
     - Trebalo bi da bude: `v=spf1 include:resend.com ~all`
   - **TTL**: Izaberi `Auto`
3. Klikni **"Save"**

**Napomena**: Ako Cloudflare ne prihvata `send` kao Name, koristi `@` umesto toga.

---

### Korak 4: Dodaj DMARC Record (Opciono)

1. Klikni **"Add record"** ponovo
2. Popuni:
   - **Type**: Izaberi `TXT` iz dropdown-a
   - **Name**: Unesi `_dmarc` (sa underscore na početku)
   - **Content**: Kopiraj ceo string od Resend-a
     - Trebalo bi da bude: `v=DMARC1; p=none;`
   - **TTL**: Izaberi `Auto`
3. Klikni **"Save"**

---

## ✅ Provera

### Nakon što dodaš sve records:

1. **Sačekaj 5-10 minuta** (DNS propagation)

2. **Vrati se na Resend dashboard**
   - Klikni **"Verify"** pored `biovera.app`
   - Ako su svi records tačni, videćeš **"Verified"** ✅

3. **Online provera** (opciono):
   - Idi na https://mxtoolbox.com/TXTLookup.aspx
   - Unesi `biovera.app`
   - Trebalo bi da vidiš sve TXT records koje si dodao

---

## 🆘 Problemi?

### "Name 'send' not accepted"
- Koristi `@` umesto `send` za SPF record
- Cloudflare ponekad ne prihvata `send` kao validan name

### "Content too long"
- Proveri da li si kopirao ceo string (ne skraćenu verziju)
- U Resend dashboard-u, klikni na Content da vidiš pun string

### "Domain not verified"
- Proveri da li su svi records tačno dodati
- Proveri da li nema razmaka u Content string-u
- Sačekaj 10-15 minuta i probaj ponovo

---

## 📝 Checklist

- [ ] Dodao DKIM record (`resend._domainkey`)
- [ ] Dodao SPF record (`send` ili `@`)
- [ ] Dodao DMARC record (`_dmarc`) - opciono
- [ ] Sačekao 5-10 minuta
- [ ] Kliknuo "Verify" u Resend dashboard-u
- [ ] Domain je verified ✅

---

## 🎯 Kada je Verified

1. Ažuriraj `backend/.env`:
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASS=re_DK2V8Wuf_LN6rRPUa3D8Jq1VbiisETech
   EMAIL_FROM=info@biovera.app
   ADMIN_EMAIL=info@biovera.app
   ```

2. Restart backend:
   ```bash
   cd backend
   npm run start:dev
   ```

3. Testiraj contact form na sajtu

**Emailovi će se slati sa `info@biovera.app`!** 🎉
