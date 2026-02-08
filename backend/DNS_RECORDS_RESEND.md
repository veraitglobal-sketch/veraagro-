# DNS Records za Resend - biovera.app

## 📋 Records koje treba da dodaš

### 1. SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
TTL: 3600 (ili Auto)
```

### 2. DKIM Record
```
Type: TXT
Name: resend._domainkey
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB
TTL: 3600 (ili Auto)
```

### 3. DMARC Record (Opciono, ali preporučeno)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@biovera.app
TTL: 3600 (ili Auto)
```

---

## 🔧 Kako da dodaš u DNS

### Ako koristiš Cloudflare:
1. Idi na Cloudflare Dashboard
2. Izaberi domain `biovera.app`
3. Idi na "DNS" → "Records"
4. Klikni "Add record"
5. Dodaj svaki record:
   - **Type**: TXT
   - **Name**: (vidi gore za svaki record)
   - **Content**: (vidi Value gore)
   - **TTL**: Auto
6. Klikni "Save"

### Ako koristiš drugi registrar (Namecheap, GoDaddy, itd.):
1. Idi u DNS Management u svom registrar-u
2. Dodaj TXT records (vidi gore)
3. Sačekaj 5-30 minuta za propagaciju

---

## ✅ Provera

### Nakon što dodaš records:
1. Sačekaj 5-10 minuta (DNS propagation)
2. Idi na https://resend.com/domains
3. Klikni "Verify" pored `biovera.app`
4. Ako su svi records tačni, domain će biti verifikovan ✅

### Online DNS Checker:
Možeš proveriti da li su records dodati:
- https://mxtoolbox.com/TXTLookup.aspx
- Unesi `biovera.app` i proveri TXT records

---

## 🆘 Problemi?

### "Domain not verified"
- Proveri da li su svi records tačno dodati
- Proveri da li nema razmaka u Value string-u
- Sačekaj 10-15 minuta (DNS propagation može potrajati)

### "DKIM record not found"
- Proveri da li je Name tačno `resend._domainkey`
- Proveri da li je Value kompletan (uključujući `v=DKIM1; k=rsa; p=...`)
- Proveri da li nema preloma linija u Value

### "SPF record invalid"
- Proveri da li je Value tačno `v=spf1 include:resend.com ~all`
- Proveri da li već postoji SPF record (može biti samo jedan!)

---

## 📝 Napomene

- **SPF**: Može biti samo jedan SPF record po domenu
- **DKIM**: Može biti više DKIM records (različiti provajderi)
- **DMARC**: Opciono, ali preporučeno za bolji deliverability
- **TTL**: Možeš koristiti Auto ili 3600 sekundi

---

## 🎯 Kada je sve gotovo

Nakon verifikacije u Resend dashboard-u:
1. Restart backend
2. Testiraj contact form
3. Emailovi će se slati sa `info@biovera.app` ✅
