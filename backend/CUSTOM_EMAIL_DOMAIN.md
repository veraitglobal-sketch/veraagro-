# Besplatne Opcije za Email sa Custom Domenom

## ⚠️ VAŽNA NAPOMENA
**Zoho Mail više NIJE besplatan za custom domene!** Ako vidiš opciju za naplatu, to je normalno - Zoho je promenio svoju politiku.

## 🎯 Stvarno Besplatne Opcije (2026)

### 1. **Cloudflare Email Routing** (100% BESPLATNO) ⭐⭐⭐
- **Besplatno**: Neograničeno email forwarding
- **Za primanje**: Da (forward na bilo koji email)
- **Za slanje**: Ne (ali možeš koristiti Resend)
- **Link**: https://www.cloudflare.com/products/email-routing/

**Prednosti**:
- Potpuno besplatno
- Neograničeno forwarding
- Lako za setup
- Radi sa bilo kojim domain registrar-om (ne mora biti na Cloudflare)

### 2. **ImprovMX** (100% BESPLATNO) ⭐⭐
- **Besplatno**: Neograničeno forwarding
- **Za primanje**: Da
- **Za slanje**: Ne (ali možeš koristiti Resend)
- **Link**: https://improvmx.com/

**Prednosti**:
- Potpuno besplatno
- Ne zahteva da domain bude na Cloudflare
- Lako za setup

### 3. **Resend** (BESPLATNO za slanje) ⭐⭐⭐
- **Besplatno**: 3,000 emailova/mesec
- **Za slanje**: Da (sa custom domenom)
- **Za primanje**: Ne
- **Link**: https://resend.com

**Prednosti**:
- Besplatno do 3,000/mesec
- Odličan deliverability
- Lako za setup
- Besplatni custom domain setup

#### Kako da se registruješ:
1. Idi na https://www.zoho.com/mail/
2. Klikni "Sign Up Now" → "Free Plan"
3. Izaberi "Create a Business Email"
4. Unesi svoj domain (npr. `biovera.app`)
5. Verifikuj domain dodavanjem DNS records
6. Kreiraj email adrese (npr. `noreply@biovera.app`, `contact@biovera.app`)

#### DNS Records koje treba da dodaš:
```
MX Records:
- Priority: 10, Value: mx.zoho.com
- Priority: 20, Value: mx2.zoho.com

TXT Record (verifikacija):
- Name: @, Value: (Zoho će ti dati)

SPF Record:
- Name: @, Value: v=spf1 include:zoho.com ~all

DKIM Record:
- Name: zmail._domainkey, Value: (Zoho će ti dati)
```

#### SMTP Konfiguracija za Backend:
```env
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=noreply@biovera.app
SMTP_PASS=tvoja-zoho-sifra
EMAIL_FROM=noreply@biovera.app
ADMIN_EMAIL=contact@biovera.app
```

---

### 2. **Cloudflare Email Routing** (Besplatno Forwarding)
- **Besplatno**: Neograničeno email forwarding
- **Mane**: Možeš samo primati emailove, ne možeš slati
- **Link**: https://www.cloudflare.com/products/email-routing/

**Kada koristiti**: Ako samo trebaš da primaš emailove (npr. contact@biovera.app → tvoj-gmail@gmail.com)

#### Kako:
1. Domain mora biti na Cloudflare
2. Idi na Cloudflare Dashboard → Email → Email Routing
3. Dodaj email adrese i gde da se forward-uju
4. **Za slanje**: Koristi Gmail ili Resend sa custom "from" adresom

---

### 3. **ImprovMX** (Besplatno Forwarding)
- **Besplatno**: Neograničeno forwarding
- **Mane**: Možeš samo primati, ne možeš slati
- **Link**: https://improvmx.com/

**Kada koristiti**: Ako samo trebaš forwarding, a domain nije na Cloudflare

---

### 4. **ProtonMail** (Ograničeno Besplatno)
- **Besplatno**: 1 email adresa
- **Storage**: 1GB
- **Mane**: Custom domain se plaća
- **Link**: https://proton.me/mail

---

## 🚀 Preporučena Kombinacija (2026)

### Opcija A: Cloudflare Email Routing + Resend (NAJBOLJE) ⭐
- **Za primanje**: Cloudflare Email Routing (forward na Gmail)
- **Za slanje**: Resend API (sa custom domain)
- **Cena**: Besplatno
- **Prednosti**: Potpuno besplatno, profesionalno, odličan deliverability

### Opcija B: ImprovMX + Resend
- **Za primanje**: ImprovMX (forward na Gmail)
- **Za slanje**: Resend API (sa custom domain)
- **Cena**: Besplatno
- **Prednosti**: Ne zahteva Cloudflare

### Opcija C: Samo Resend (Ako ti ne treba primanje)
- **Za slanje**: Resend API (sa custom domain)
- **Za primanje**: Koristi Gmail direktno
- **Cena**: Besplatno
- **Prednosti**: Najjednostavnije

---

## 📝 Setup: Cloudflare Email Routing + Resend (Korak po Korak)

### Korak 1: Cloudflare Email Routing (Primanje Emailova)

#### Ako domain NIJE na Cloudflare:
1. Prebaci domain na Cloudflare (besplatno):
   - Registruj se na https://www.cloudflare.com
   - Dodaj domain
   - Promeni nameservers u domain registrar-u
   - Sačekaj propagaciju (5-30 min)

#### Ako domain VEĆ jeste na Cloudflare:
1. Idi na Cloudflare Dashboard
2. Izaberi svoj domain
3. Idi na "Email" → "Email Routing"
4. Klikni "Get Started"
5. Klikni "Create address"
6. Dodaj email adrese:
   - `contact@biovera.app` → `tvoj-gmail@gmail.com`
   - `noreply@biovera.app` → `tvoj-gmail@gmail.com`
   - `admin@biovera.app` → `tvoj-gmail@gmail.com`

**Rezultat**: Svi emailovi na `@biovera.app` će se forward-ovati na tvoj Gmail!

### Korak 2: Resend (Slanje Emailova)

1. Registruj se na https://resend.com
2. Klikni "Add Domain"
3. Unesi svoj domain (npr. `biovera.app`)
4. Resend će ti dati DNS records koje treba da dodaš:
   - **SPF Record**
   - **DKIM Records** (2-3 records)
   - **DMARC Record** (opciono)

5. Dodaj DNS records u Cloudflare:
   - Idi na Cloudflare Dashboard → Domain → DNS
   - Dodaj sve records koje ti Resend da
   - Sačekaj verifikaciju (5-10 min)

6. Kada je domain verifikovan, dobijaš API key:
   - Idi na "API Keys"
   - Klikni "Create API Key"
   - Kopiraj key (samo jednom se prikazuje!)

### Korak 3: Konfiguriši Backend

Dodaj u `backend/.env`:
```env
# Resend Configuration (za slanje)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_TVOJ_RESEND_API_KEY
EMAIL_FROM=noreply@biovera.app
ADMIN_EMAIL=contact@biovera.app
```

**Rezultat**: 
- Emailovi se šalju preko Resend (sa `noreply@biovera.app`)
- Emailovi se primaju preko Cloudflare Email Routing (forward na Gmail)

---

## 📝 Setup: ImprovMX + Resend (Ako domain NIJE na Cloudflare)

### Korak 1: ImprovMX (Primanje Emailova)

1. Registruj se na https://improvmx.com
2. Klikni "Add Domain"
3. Unesi svoj domain (npr. `biovera.app`)
4. ImprovMX će ti dati DNS records:
   - **MX Records** (2 records)
   - **TXT Record** (verifikacija)

5. Dodaj DNS records u domain registrar:
   - Idi u DNS settings
   - Dodaj MX records
   - Dodaj TXT record
   - Sačekaj propagaciju (5-30 min)

6. Kada je verifikovan, dodaj email adrese:
   - `contact@biovera.app` → `tvoj-gmail@gmail.com`
   - `noreply@biovera.app` → `tvoj-gmail@gmail.com`

### Korak 2: Resend (Slanje Emailova)

Isto kao gore - koristi Resend za slanje.

---

## 📝 Setup: Zoho Mail (PLAĆENO - Ne preporučujem)

### Korak 1: Registracija
1. Idi na https://www.zoho.com/mail/
2. Klikni "Sign Up Now"
3. Izaberi "Free Plan"
4. Klikni "Create a Business Email"

### Korak 2: Dodaj Domain
1. Unesi svoj domain (npr. `biovera.app`)
2. Klikni "Add Domain"
3. Zoho će ti dati DNS records koje treba da dodaš

### Korak 3: Verifikuj Domain
1. Idi u svoj domain registrar (gde si kupio domain)
2. Dodaj DNS records koje ti je Zoho dao:
   - **MX Records** (obavezno!)
   - **TXT Record** (za verifikaciju)
   - **SPF Record** (za email security)
   - **DKIM Record** (za email security)

### Korak 4: Sačekaj Verifikaciju
- Obično traje 5-30 minuta
- Zoho će ti poslati email kada je verifikacija završena

### Korak 5: Kreiraj Email Adrese
1. U Zoho Mail dashboard-u, idi na "Users"
2. Klikni "Add User"
3. Kreiraj email adrese:
   - `noreply@biovera.app` (za automatske emailove)
   - `contact@biovera.app` (za contact form)
   - `admin@biovera.app` (za admin notifikacije)

### Korak 6: Postavi Šifre
1. Za svaku email adresu, postavi šifru
2. **VAŽNO**: Za `noreply@biovera.app`, generiši jaku šifru (nećeš je koristiti za login)

### Korak 7: Konfiguriši Backend

Dodaj u `backend/.env`:
```env
# Zoho Mail Configuration
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=noreply@biovera.app
SMTP_PASS=tvoja-zoho-sifra-za-noreply
EMAIL_FROM=noreply@biovera.app
ADMIN_EMAIL=contact@biovera.app
```

---

## 🔧 Setup: Cloudflare Email Routing + Resend

### Korak 1: Cloudflare Email Routing (Primanje)
1. Ako domain nije na Cloudflare, prebaci ga
2. Idi na Cloudflare Dashboard → Email → Email Routing
3. Klikni "Get Started"
4. Dodaj email adrese:
   - `contact@biovera.app` → `tvoj-gmail@gmail.com`
   - `noreply@biovera.app` → `tvoj-gmail@gmail.com`

### Korak 2: Resend (Slanje)
1. Registruj se na https://resend.com
2. Dodaj domain u Resend
3. Dodaj DNS records koje ti Resend da
4. Verifikuj domain

### Korak 3: Konfiguriši Backend

Dodaj u `backend/.env`:
```env
# Resend Configuration (za slanje)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_TVOJ_RESEND_API_KEY
EMAIL_FROM=noreply@biovera.app
ADMIN_EMAIL=contact@biovera.app
```

**Napomena**: Emailovi će se slati preko Resend, a primati preko Cloudflare Email Routing.

---

## ✅ Testiranje

Nakon setup-a, testiraj:

```bash
cd backend
npm run start:dev
```

Pokušaj da pošalješ test email preko contact forme na sajtu.

---

## 🎯 Moja Preporuka

**Za početak**: Koristi **Zoho Mail** - besplatno, lako za setup, možeš i slati i primati.

**Za production**: Kombinuj **Zoho Mail** (za primanje) + **Resend** (za slanje) - najbolji deliverability.

---

## ⚠️ Važne Napomene

1. **DNS Propagation**: Može potrajati 24-48h da se DNS promene propagiraju (obično 5-30 min)
2. **SPF Records**: Važni su da emailovi ne završe u spam folderu
3. **DKIM Records**: Dodatna sigurnost i autentifikacija
4. **Rate Limits**: Zoho ima rate limits (obično 100 emailova/dan za free plan)

---

## 🆘 Troubleshooting

### "Domain verification failed"
- Proveri da li su DNS records tačno dodati
- Sačekaj 30 minuta (DNS propagation)
- Proveri da li su MX records na prvom mestu

### "Email not sending"
- Proveri SMTP credentials
- Proveri da li je port 587 otvoren
- Proveri Zoho Mail logs

### "Emails going to spam"
- Dodaj SPF record
- Dodaj DKIM record
- Koristi Resend za bolji deliverability

---

## 📚 Dodatni Resursi

- Zoho Mail Setup: https://www.zoho.com/mail/help/adminconsole/domain-verification.html
- Cloudflare Email Routing: https://developers.cloudflare.com/email-routing/
- Resend Domain Setup: https://resend.com/docs/dashboard/domains/introduction
