# 🔧 Rešavanje Problema sa Primanjem Emailova

## ❌ Problem

**Emailovi ne stižu na `info@biovera.app`**

### Razlog:

1. **Koristiš Vercel nameserver-e:**
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

2. **To znači:**
   - ❌ DNS zapisi u **IONOS DNS panel-u se NE koriste**
   - ✅ DNS zapisi moraju biti u **Vercel DNS**

3. **Ako si dodao MX zapise u IONOS:**
   - Oni se **NE koriste** jer su nameserver-i na Vercel-u
   - Zato emailovi **ne stižu**

---

## ✅ Rešenje: Dodaj MX Zapise u Vercel DNS

### Korak 1: Proveri Vercel DNS Records

1. Idi na: https://vercel.com/dashboard
2. Klikni na tvoj projekat (bio-vera)
3. Idi na **Settings** → **Domains**
4. Klikni na `biovera.app` domain
5. Klikni na **"DNS Records"** tab

### Korak 2: Proveri da li postoje MX zapisi

**Treba da vidiš:**
- ✅ DKIM: `resend._domainkey` (TXT) - **Verified** ✅
- ✅ SPF: `send` (MX i TXT) - **Verified** ✅
- ❌ **MX zapisi za primanje emailova** - **NEDOSTAJU** ❌

---

## 📧 Dodaj MX Zapise za Primanje Emailova

### Opcija A: Resend "Enable Receiving" (Preporučeno)

Ako želiš da koristiš Resend i za primanje:

1. **U Resend Dashboard:**
   - Idi na: https://resend.com/domains
   - Klikni na `biovera.app`
   - U sekciji **"Enable Receiving"**, klikni **"Enable"**
   - Resend će ti dati **MX zapis** koji treba da dodaš

2. **Dodaj MX zapis u Vercel:**
   - U Vercel DNS Records, klikni **"Add Record"**
   - **Type**: `MX`
   - **Name**: `@` (ili prazno, zavisno od Vercel interfejsa)
   - **Value**: Kopiraj iz Resend (obično: `inbound-smtp.eu-west-1.amazonaws.com`)
   - **Priority**: `10`
   - **TTL**: `3600` (ili `Auto`)
   - Klikni **"Save"**

3. **Sačekaj verifikaciju:**
   - 5-10 minuta
   - U Resend dashboard-u, status bi trebalo da se promeni na **"Verified"** ✅

---

### Opcija B: ImprovMX (Besplatno Forwarding)

Ako želiš besplatno forwarding na Gmail:

1. **Registruj se na ImprovMX:**
   - Idi na: https://improvmx.com
   - Klikni "Sign Up Free"
   - Registruj se

2. **Dodaj domain:**
   - Klikni "Add Domain"
   - Unesi: `biovera.app`
   - Klikni "Add"

3. **Dodaj MX zapise u Vercel:**
   - ImprovMX će ti dati **2 MX zapisa**:
     ```
     Type: MX
     Name: @
     Value: mx1.improvmx.com
     Priority: 10
     
     Type: MX
     Name: @
     Value: mx2.improvmx.com
     Priority: 20
     ```
   - Dodaj oba u Vercel DNS Records

4. **Dodaj TXT zapis za verifikaciju:**
   - ImprovMX će ti dati TXT zapis
   - Dodaj ga u Vercel DNS Records

5. **Podesi forwarding:**
   - U ImprovMX dashboard-u, dodaj:
     - Email: `info@biovera.app`
     - Forward to: `tvoj-gmail@gmail.com`

---

## 🗑️ Izbriši DNS Zapise iz IONOS (Opciono)

**IONOS DNS zapisi se ne koriste** kada koristiš Vercel nameserver-e, ali možeš ih izbrisati da ne bude konfuzije:

1. **IONOS Dashboard** → Domains & SSL → `biovera.app` → **DNS** tab
2. Pronađi sve DNS zapise koje si dodao za email (MX, TXT za Resend)
3. Klikni na svaki i klikni **"Löschen"** (Delete)
4. Potvrdi brisanje

**Napomena**: Ovo je opciono - IONOS DNS zapisi se ionako ne koriste, ali brisanje će očistiti konfuziju.

---

## 🔍 Provera

### Nakon što dodaš MX zapise u Vercel:

1. **Sačekaj 5-10 minuta** (DNS propagacija)

2. **Proveri online:**
   - Idi na: https://mxtoolbox.com/MXLookup.aspx
   - Unesi: `biovera.app`
   - Klikni "MX Lookup"
   - Trebalo bi da vidiš MX zapise koje si dodao ✅

3. **Testiraj primanje:**
   - Pošalji test email na `info@biovera.app` sa bilo kog email servisa
   - Email bi trebalo da stigne (ili da se forward-uje na Gmail ako koristiš ImprovMX)

---

## ✅ Checklist

- [ ] Otvoren Vercel Dashboard → Settings → Domains → `biovera.app` → DNS Records
- [ ] Proverio da li postoje MX zapisi za primanje emailova
- [ ] Odlučio se za opciju (Resend "Enable Receiving" ili ImprovMX)
- [ ] Dodao MX zapise u Vercel DNS Records
- [ ] Sačekao 5-10 minuta (DNS propagacija)
- [ ] Proverio online (mxtoolbox.com)
- [ ] Testirao primanje emailova
- [ ] (Opciono) Izbrisao DNS zapise iz IONOS

---

## 🆘 Ako i dalje ne stižu emailovi

1. **Proveri da li su MX zapisi u Vercel DNS:**
   - Vercel Dashboard → Settings → Domains → `biovera.app` → DNS Records
   - Trebalo bi da vidiš MX zapise

2. **Proveri DNS propagaciju:**
   - https://mxtoolbox.com/MXLookup.aspx
   - Unesi `biovera.app`
   - Trebalo bi da vidiš MX zapise

3. **Proveri da li su nameserver-i na Vercel:**
   - IONOS Dashboard → Domains & SSL → `biovera.app` → Nameserver tab
   - Trebalo bi da vidiš: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`

4. **Ako nameserver-i NISU na Vercel:**
   - Vrati ih na Vercel (ili dodaj DNS zapise u IONOS umesto Vercel)

---

## 💡 Preporuka

**Za primanje emailova, preporučujem:**
- **ImprovMX** (besplatno, lako za setup, forwarding na Gmail)
- **Resend "Enable Receiving"** (ako želiš sve na jednom mestu)

**IONOS DNS zapisi se ne koriste** kada koristiš Vercel nameserver-e, tako da možeš ih izbrisati da ne bude konfuzije.
