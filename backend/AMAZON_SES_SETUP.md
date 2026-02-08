# Amazon SES Setup - info@biovera.app

## ✅ Tvoja Amazon SES Konfiguracija

**SMTP Endpoint**: `feedback-smtp.eu-west-1.amazonses.com`  
**Region**: eu-west-1 (Europe - Ireland)

---

## 🔧 Backend Konfiguracija

Dodaj u `backend/.env`:

```env
# Amazon SES Configuration
SMTP_HOST=feedback-smtp.eu-west-1.amazonses.com
SMTP_PORT=587
SMTP_USER=YOUR_SES_SMTP_USERNAME
SMTP_PASS=YOUR_SES_SMTP_PASSWORD
EMAIL_FROM=info@biovera.app
ADMIN_EMAIL=info@biovera.app
```

**VAŽNO**: 
- `SMTP_USER` i `SMTP_PASS` su SMTP credentials koje dobijaš u Amazon SES console
- Nisu to tvoj AWS access key i secret key!
- Moraju biti SMTP credentials specifično

---

## 📋 DNS Records za Amazon SES

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

**Napomena**: Amazon SES automatski generiše DKIM records kada verifikuješ domain.

---

## 🚀 Setup Koraci

### Korak 1: Verifikuj Domain u Amazon SES

1. Idi na AWS Console → Amazon SES
2. Idi na "Verified identities" → "Create identity"
3. Izaberi "Domain"
4. Unesi `biovera.app`
5. Klikni "Create identity"

### Korak 2: Dodaj DNS Records

Amazon SES će ti dati DNS records:
- **DKIM Records** (3 CNAME records) - automatski generisani
- **SPF Record** - dodaj ručno (vidi gore)
- **DMARC Record** - dodaj ručno (vidi gore)

### Korak 3: Kreiraj SMTP Credentials

1. U Amazon SES, idi na "SMTP settings"
2. Klikni "Create SMTP credentials"
3. Unesi IAM user name (npr. `biovera-smtp`)
4. Klikni "Create"
5. **VAŽNO**: Kopiraj SMTP username i password (samo jednom se prikazuju!)

### Korak 4: Dodaj DNS Records u Domain Registrar

#### SPF Record:
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```

#### DMARC Record:
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@biovera.app
```

#### DKIM Records (od Amazon SES):
Amazon SES će ti dati 3 CNAME records, dodaj ih sve:
```
Type: CNAME
Name: [amazon-dkim-key-1]._domainkey
Value: [value-from-amazon]

Type: CNAME
Name: [amazon-dkim-key-2]._domainkey
Value: [value-from-amazon]

Type: CNAME
Name: [amazon-dkim-key-3]._domainkey
Value: [value-from-amazon]
```

### Korak 5: Verifikacija

1. Sačekaj 5-10 minuta (DNS propagation)
2. Vrati se u Amazon SES console
3. Status će se promeniti na "Verified" ✅

---

## 🔧 Ako koristiš Cloudflare

### SPF Record:
1. Cloudflare Dashboard → DNS → Records
2. Add record:
   - Type: TXT
   - Name: @
   - Content: `v=spf1 include:amazonses.com ~all`
   - TTL: Auto

### DMARC Record:
1. Add record:
   - Type: TXT
   - Name: _dmarc
   - Content: `v=DMARC1; p=none; rua=mailto:dmarc@biovera.app`
   - TTL: Auto

### DKIM Records (CNAME):
1. Amazon SES će ti dati 3 CNAME records
2. Dodaj svaki kao:
   - Type: CNAME
   - Name: (od Amazon SES)
   - Target: (od Amazon SES)
   - TTL: Auto

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
3. Proveri da li email stiže

### 3. Proveri Amazon SES Console
- Idi na "Sending statistics"
- Trebalo bi da vidiš successful sends

---

## 🎯 Rezultat

- ✅ Emailovi se šalju sa `info@biovera.app`
- ✅ Contact inquiries stižu na `info@biovera.app`
- ✅ Profesionalno i konzistentno
- ✅ Odličan deliverability (Amazon SES)

---

## 💰 Cena

Amazon SES:
- **Besplatno**: 62,000 emailova/mesec (ako si na EC2)
- **Cena**: $0.10 per 1,000 emailova nakon toga
- **Veoma jeftino** za production!

---

## 🆘 Troubleshooting

### "Domain not verified"
- Proveri da li su svi DNS records tačno dodati
- Proveri da li su DKIM CNAME records dodati (3 records)
- Sačekaj 10-15 minuta (DNS propagation)

### "SMTP Authentication failed"
- Proveri da li koristiš SMTP credentials (ne AWS access keys)
- Proveri da li su credentials tačni
- Proveri da li je SMTP endpoint tačan za tvoj region

### "Email not sending"
- Proveri da li si izašao iz "Sandbox mode" u Amazon SES
- Sandbox mode dozvoljava slanje samo na verifikovane email adrese
- Za production, zahtevaj "Production access"

### "Sandbox mode"
- Amazon SES počinje u "Sandbox mode"
- Možeš slati samo na verifikovane email adrese
- Za production, zahtevaj "Production access" u SES console

---

## 📚 Dodatni Resursi

- Amazon SES Console: https://console.aws.amazon.com/ses/
- Amazon SES SMTP Docs: https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html
- Amazon SES Pricing: https://aws.amazon.com/ses/pricing/
