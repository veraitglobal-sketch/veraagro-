# 🔧 Troubleshooting: Emailovi Ne Stižu na IONOS Email

## ❌ Problem

**Emailovi ne stižu na IONOS email inbox (`info@biovera.app`)**

---

## ✅ Checklist za Proveru

### 1. Proveri MX Zapise u Vercel DNS

1. **Vercel Dashboard** → Settings → Domains → `biovera.app` → DNS Records
2. **Trebalo bi da vidiš SAMO:**
   - ✅ `mx.ionos.de.` (MX, Priority: 10)
   - ✅ `mx2.ionos.de.` (MX, Priority: 20)
   - ❌ **NE treba da vidiš** ImprovMX ili Resend MX zapise!

3. **Ako vidiš druge MX zapise:**
   - Obriši ih (osim IONOS MX zapisa)

---

### 2. Proveri DNS Propagaciju

1. **Proveri online:**
   - Idi na: https://mxtoolbox.com/MXLookup.aspx
   - Unesi: `biovera.app`
   - Klikni "MX Lookup"
   - **Trebalo bi da vidiš:**
     ```
     mx.ionos.de (Priority: 10)
     mx2.ionos.de (Priority: 20)
     ```

2. **Ako vidiš druge MX zapise:**
   - DNS propagacija još nije završena (sačekaj 10-30 minuta)
   - Ili MX zapisi nisu tačno konfigurisani u Vercel DNS

---

### 3. Proveri IONOS Email Hosting Status

1. **IONOS Dashboard** → Email & Office → Email Hosting
2. Proveri da li je **Email Hosting aktiviran** za `biovera.app`
3. Proveri da li je **email adresa kreirana** (npr. `info@biovera.app`)

**Ako Email Hosting NIJE aktiviran:**
- Aktiviraj Email Hosting u IONOS
- Kreiraj email adrese koje želiš

---

### 4. Proveri IONOS Email Inbox

1. **IONOS Dashboard** → Email & Office → Webmail
2. Idi na IONOS Webmail
3. Proveri da li emailovi stižu u inbox

**Ako ne vidiš emailove:**
- Proveri spam folder
- Proveri da li je email adresa tačno kreirana

---

### 5. Proveri IONOS MX Zapise

**IONOS MX zapisi zavise od regiona:**

#### Za IONOS DE (Nemačka):
```
mx.ionos.de (Priority: 10)
mx2.ionos.de (Priority: 20)
```

#### Za IONOS US (SAD):
```
mx.ionos.com (Priority: 10)
mx2.ionos.com (Priority: 20)
```

**Proveri u IONOS Dashboard-u koji MX zapisi su tačni za tvoj region!**

---

## 🔧 Rešenje: Korak po Korak

### Korak 1: Proveri IONOS Email Hosting

1. **IONOS Dashboard** → Email & Office → Email Hosting
2. Proveri da li je Email Hosting aktiviran
3. Ako NIJE aktiviran:
   - Aktiviraj Email Hosting
   - Kreiraj email adresu `info@biovera.app`
   - Postavi šifru za email adresu

---

### Korak 2: Proveri MX Zapise u Vercel DNS

1. **Vercel Dashboard** → Settings → Domains → `biovera.app` → DNS Records
2. **Trebalo bi da vidiš:**
   - `mx.ionos.de.` (MX, Priority: 10) - **bez tačke na kraju!**
   - `mx2.ionos.de.` (MX, Priority: 20) - **bez tačke na kraju!**

3. **Ako vidiš tačku na kraju** (`.`) u Value polju:
   - To je OK - DNS automatski dodaje tačku
   - Ali proveri da li je vrednost tačna

4. **Ako vidiš druge MX zapise:**
   - Obriši ih

---

### Korak 3: Proveri DNS Propagaciju

1. **Sačekaj 10-30 minuta** (DNS propagacija)
2. **Proveri online:**
   - https://mxtoolbox.com/MXLookup.aspx
   - Unesi: `biovera.app`
   - Trebalo bi da vidiš samo IONOS MX zapise

---

### Korak 4: Testiraj Primanje

1. **Pošalji test email** sa bilo kog email servisa na `info@biovera.app`
2. **Proveri IONOS Webmail:**
   - IONOS Dashboard → Email & Office → Webmail
   - Idi na inbox za `info@biovera.app`
   - Proveri da li email stiže

---

## 🆘 Ako i dalje ne stižu emailovi

### Problem 1: Email Hosting Nije Aktiviran

**Rešenje:**
1. Aktiviraj Email Hosting u IONOS
2. Kreiraj email adresu `info@biovera.app`
3. Postavi šifru

---

### Problem 2: MX Zapisi Nisu Tačni

**Rešenje:**
1. Proveri u IONOS Dashboard-u koji MX zapisi su tačni za tvoj region
2. Proveri da li su MX zapisi u Vercel DNS tačni
3. Ako nisu, ispravi ih

---

### Problem 3: DNS Propagacija Nije Završena

**Rešenje:**
1. Sačekaj 30-60 minuta
2. Proveri ponovo online (mxtoolbox.com)
3. Ako i dalje ne vidiš IONOS MX zapise, proveri Vercel DNS

---

### Problem 4: Email Adresa Nije Kreirana

**Rešenje:**
1. IONOS Dashboard → Email & Office → Email Hosting → Users
2. Kreiraj email adresu `info@biovera.app`
3. Postavi šifru

---

## 💡 Preporuka

**Ako emailovi i dalje ne stižu nakon 30 minuta:**

1. **Proveri IONOS Email Hosting status:**
   - Da li je aktiviran?
   - Da li je email adresa kreirana?

2. **Proveri MX zapise online:**
   - https://mxtoolbox.com/MXLookup.aspx
   - Da li vidiš IONOS MX zapise?

3. **Kontaktiraj IONOS Support:**
   - Ako sve izgleda tačno, ali emailovi ne stižu
   - IONOS Support može da proveri server status

---

## ✅ Finalna Provera

- [ ] Email Hosting aktiviran u IONOS
- [ ] Email adresa `info@biovera.app` kreirana
- [ ] MX zapisi tačni u Vercel DNS (`mx.ionos.de`, `mx2.ionos.de`)
- [ ] DNS propagacija završena (provereno online)
- [ ] Test email poslat
- [ ] Email proveren u IONOS Webmail
