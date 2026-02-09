# 🔧 Ispravljanje MX Zapisa za ImprovMX

## ❌ Problem

U Vercel DNS Records imaš **pogrešan MX zapis**:
- ❌ `inbound-smtp.eu-west-1.amazonses.com.` (ovo je za Resend/Amazon SES, ne za ImprovMX!)

**Zato emailovi ne stižu!**

---

## ✅ Rešenje: Zameni MX Zapise za ImprovMX

### Korak 1: Obriši Pogrešan MX Zapis

1. **U Vercel DNS Records:**
   - Pronađi MX zapis: `inbound-smtp.eu-west-1.amazonses.com.`
   - Klikni na **"Delete"** ili **"Remove"** (ikonica korpe)
   - Potvrdi brisanje

---

### Korak 2: Dodaj ImprovMX MX Zapise

ImprovMX zahteva **2 MX zapisa**:

#### MX Zapis 1:
1. Klikni **"Add DNS Record"**
2. Popuni:
   - **Type**: `MX`
   - **Name**: `@` (ili prazno, zavisno od Vercel interfejsa)
   - **Value**: `mx1.improvmx.com`
   - **Priority**: `10`
   - **TTL**: `60` (ili `Auto`)
3. Klikni **"Save"**

#### MX Zapis 2:
1. Klikni **"Add DNS Record"** ponovo
2. Popuni:
   - **Type**: `MX`
   - **Name**: `@` (ili prazno)
   - **Value**: `mx2.improvmx.com`
   - **Priority**: `20`
   - **TTL**: `60` (ili `Auto`)
3. Klikni **"Save"**

---

### Korak 3: Dodaj TXT Zapis za Verifikaciju (Ako ImprovMX Zahteva)

1. **U ImprovMX Dashboard:**
   - Idi na: https://app.improvmx.com
   - Klikni na domain `biovera.app`
   - Proveri da li ti daje **TXT zapis** za verifikaciju

2. **Ako ImprovMX daje TXT zapis:**
   - Kopiraj TXT zapis iz ImprovMX
   - Dodaj ga u Vercel DNS Records:
     - **Type**: `TXT`
     - **Name**: `@` (ili kako ImprovMX kaže)
     - **Value**: (kopiraj iz ImprovMX)
     - **TTL**: `60` (ili `Auto`)

---

## 🔍 Provera

### Nakon što dodaš MX zapise:

1. **Sačekaj 5-10 minuta** (DNS propagacija)

2. **Proveri online:**
   - Idi na: https://mxtoolbox.com/MXLookup.aspx
   - Unesi: `biovera.app`
   - Klikni "MX Lookup"
   - Trebalo bi da vidiš:
     ```
     mx1.improvmx.com (Priority: 10)
     mx2.improvmx.com (Priority: 20)
     ```

3. **Proveri u ImprovMX:**
   - Idi na: https://app.improvmx.com
   - Klikni na domain `biovera.app`
   - Status bi trebalo da bude **"Verified"** ✅

4. **Testiraj primanje:**
   - Pošalji test email na `info@biovera.app` sa bilo kog email servisa
   - Email bi trebalo da se forward-uje na tvoj Gmail (ako si podesio forwarding u ImprovMX)

---

## ✅ Finalni DNS Records u Vercel

Nakon ispravke, trebalo bi da imaš:

### Za Resend (Slanje Emailova):
- ✅ `resend._domainkey` (TXT) - DKIM
- ✅ `send` (MX) - `feedback-smtp.eu-west-1.amazonses.com` (Priority: 10)
- ✅ `send` (TXT) - `v=spf1 include:amazonses.com ~all`
- ✅ `_dmarc` (TXT) - `v=DMARC1; p=none;`

### Za ImprovMX (Primanje Emailova):
- ✅ `@` (MX) - `mx1.improvmx.com` (Priority: 10) ← **DODAJ OVO**
- ✅ `@` (MX) - `mx2.improvmx.com` (Priority: 20) ← **DODAJ OVO**
- ✅ TXT zapis za verifikaciju (ako ImprovMX zahteva)

---

## 🆘 Ako i dalje ne stižu emailovi

1. **Proveri da li su MX zapisi tačni:**
   - https://mxtoolbox.com/MXLookup.aspx
   - Trebalo bi da vidiš `mx1.improvmx.com` i `mx2.improvmx.com`

2. **Proveri da li je forwarding podešen u ImprovMX:**
   - ImprovMX Dashboard → Email Forwarding → `biovera.app`
   - Trebalo bi da vidiš: `info@biovera.app` → `tvoj-gmail@gmail.com`

3. **Proveri da li je domain verified u ImprovMX:**
   - ImprovMX Dashboard → Domains → `biovera.app`
   - Status bi trebalo da bude **"Verified"** ✅

---

## 💡 Napomena

**Resend "Enable Receiving"** i **ImprovMX** su **dva različita servisa**:
- **Resend "Enable Receiving"**: Zahteva MX zapis `inbound-smtp.eu-west-1.amazonses.com.`
- **ImprovMX**: Zahteva MX zapise `mx1.improvmx.com` i `mx2.improvmx.com`

**Ne možeš koristiti oba istovremeno!** Odaberi jedan:
- **ImprovMX** (preporučeno - besplatno, lako za setup)
- **Resend "Enable Receiving"** (ako želiš sve na jednom mestu)
