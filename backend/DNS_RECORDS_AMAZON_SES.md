# DNS Records za Amazon SES - biovera.app

## 📋 Records koje treba da dodaš

### 1. SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
TTL: 3600 (ili Auto)
```

### 2. DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@biovera.app
TTL: 3600 (ili Auto)
```

### 3. DKIM Records (od Amazon SES)
Amazon SES će ti dati **3 CNAME records** kada verifikuješ domain.

Primer (Amazon će ti dati tačne vrednosti):
```
Type: CNAME
Name: abc123._domainkey.biovera.app
Target: abc123.dkim.amazonses.com

Type: CNAME
Name: def456._domainkey.biovera.app
Target: def456.dkim.amazonses.com

Type: CNAME
Name: ghi789._domainkey.biovera.app
Target: ghi789.dkim.amazonses.com
```

**VAŽNO**: 
- Amazon SES automatski generiše ove records
- Kopiraj ih tačno kako ti Amazon da
- Dodaj sve 3 CNAME records

---

## 🔧 Kako da dodaš u DNS

### Ako koristiš Cloudflare:
1. Idi na Cloudflare Dashboard
2. Izaberi domain `biovera.app`
3. Idi na "DNS" → "Records"
4. Klikni "Add record"

#### Za SPF:
- **Type**: TXT
- **Name**: @
- **Content**: `v=spf1 include:amazonses.com ~all`
- **TTL**: Auto

#### Za DMARC:
- **Type**: TXT
- **Name**: _dmarc
- **Content**: `v=DMARC1; p=none; rua=mailto:dmarc@biovera.app`
- **TTL**: Auto

#### Za DKIM (3 CNAME records):
- **Type**: CNAME
- **Name**: (od Amazon SES)
- **Target**: (od Amazon SES)
- **TTL**: Auto

### Ako koristiš drugi registrar:
1. Idi u DNS Management u svom registrar-u
2. Dodaj TXT records (SPF, DMARC)
3. Dodaj CNAME records (DKIM - 3 records)
4. Sačekaj 5-30 minuta za propagaciju

---

## ✅ Provera

### Nakon što dodaš records:
1. Sačekaj 5-10 minuta (DNS propagation)
2. Idi u Amazon SES Console
3. Proveri status domena - trebalo bi da bude "Verified" ✅

### Online DNS Checker:
Možeš proveriti da li su records dodati:
- https://mxtoolbox.com/TXTLookup.aspx
- Unesi `biovera.app` i proveri TXT records
- Proveri CNAME records za DKIM

---

## 🆘 Problemi?

### "Domain not verified"
- Proveri da li su svi DNS records tačno dodati
- Proveri da li su sve 3 DKIM CNAME records dodati
- Sačekaj 10-15 minuta (DNS propagation može potrajati)

### "DKIM records not found"
- Proveri da li su sve 3 CNAME records dodati
- Proveri da li su Name i Target tačni (od Amazon SES)
- Proveri da li nema grešaka u CNAME records

### "SPF record invalid"
- Proveri da li je Value tačno `v=spf1 include:amazonses.com ~all`
- Proveri da li već postoji SPF record (može biti samo jedan!)

---

## 📝 Napomene

- **SPF**: Može biti samo jedan SPF record po domenu
- **DKIM**: Amazon SES generiše 3 CNAME records (sve moraju biti dodate)
- **DMARC**: Opciono, ali preporučeno za bolji deliverability
- **TTL**: Možeš koristiti Auto ili 3600 sekundi

---

## 🎯 Kada je sve gotovo

Nakon verifikacije u Amazon SES console:
1. Restart backend
2. Testiraj contact form
3. Emailovi će se slati sa `info@biovera.app` ✅
