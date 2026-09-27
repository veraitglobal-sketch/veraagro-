# 🔧 Čišćenje MX Zapisa u Vercel DNS

## ❌ Problem

**Imaš PREVIŠE MX zapisa u Vercel DNS-u!**

Trenutno imaš **5 MX zapisa** sa istim prioritetom (10), što pravi konfuziju:

1. `mx2.ionos.de.` (Priority: 20) ✅ - IONOS email
2. `mx.ionos.de.` (Priority: 10) ✅ - IONOS email
3. `mx2.improvmx.com.` (Priority: 10) ❌ - ImprovMX (duplikat)
4. `mx1.improvmx.com.` (Priority: 10) ❌ - ImprovMX (duplikat)
5. `inbound-smtp.eu-west-1.amazonaws.com.` (Priority: 10) ❌ - Resend (duplikat)
6. `send` → `feedback-smtp.eu-west-1.amazonses.com.` (Priority: 10) ✅ - Resend za SLANJE (ne diraj!)

**Problem**: Ne možeš imati više različitih MX zapisa istovremeno! Email serveri ne znaju gde da šalju emailove.

---

## ✅ Rešenje: Obriši Duplikate

### Odaberi JEDAN servis za primanje emailova:

#### Opcija A: IONOS Email (Direktno inbox na IONOS) ⭐

**Zadrži:**
- ✅ `mx.ionos.de.` (Priority: 10)
- ✅ `mx2.ionos.de.` (Priority: 20)

**Obriši:**
- ❌ `mx1.improvmx.com.` (Priority: 10)
- ❌ `mx2.improvmx.com.` (Priority: 10)
- ❌ `inbound-smtp.eu-west-1.amazonaws.com.` (Priority: 10)

**Rezultat**: Emailovi stižu direktno u IONOS email inbox.

---

#### Opcija B: ImprovMX (Forwarding na bilo koji email) ⭐

**Zadrži:**
- ✅ `mx1.improvmx.com.` (Priority: 10)
- ✅ `mx2.improvmx.com.` (Priority: 20)

**Obriši:**
- ❌ `mx.ionos.de.` (Priority: 10)
- ❌ `mx2.ionos.de.` (Priority: 20)
- ❌ `inbound-smtp.eu-west-1.amazonaws.com.` (Priority: 10)

**Rezultat**: Emailovi se forward-uju na bilo koji email (Gmail, IONOS, itd.).

---

#### Opcija C: Resend "Enable Receiving" (Resend inbox)

**Zadrži:**
- ✅ `inbound-smtp.eu-west-1.amazonaws.com.` (Priority: 10)

**Obriši:**
- ❌ `mx.ionos.de.` (Priority: 10)
- ❌ `mx2.ionos.de.` (Priority: 20)
- ❌ `mx1.improvmx.com.` (Priority: 10)
- ❌ `mx2.improvmx.com.` (Priority: 10)

**Rezultat**: Emailovi stižu u Resend inbox.

---

## 🔧 Kako da Obrišeš Duplikate

1. **Vercel Dashboard** → Settings → Domains → `biovera.app` → DNS Records
2. Pronađi MX zapise koje treba da obrišeš
3. Klikni na **"..."** (tri tačke) pored zapisa
4. Klikni **"Delete"** ili **"Remove"**
5. Potvrdi brisanje

---

## ⚠️ VAŽNO: Ne Diraj Resend Zapise za SLANJE!

**Zadrži ove zapise (za SLANJE emailova):**
- ✅ `send` → `feedback-smtp.eu-west-1.amazonses.com.` (MX) - Resend za slanje
- ✅ `send` → `v=spf1 include:amazonses.com ~all` (TXT) - SPF za slanje
- ✅ `resend._domainkey` → `p=MIGfMA...` (TXT) - DKIM za slanje
- ✅ `_dmarc` → `v=DMARC1; p=none;` (TXT) - DMARC

**Ovi zapisi su za SLANJE emailova, ne za primanje!**

---

## ✅ Finalna Konfiguracija (Preporučeno: IONOS Email)

### Za SLANJE emailova (Resend):
- ✅ `send` → `feedback-smtp.eu-west-1.amazonses.com.` (MX, Priority: 10)
- ✅ `send` → `v=spf1 include:amazonses.com ~all` (TXT)
- ✅ `resend._domainkey` → `p=MIGfMA...` (TXT)
- ✅ `_dmarc` → `v=DMARC1; p=none;` (TXT)

### Za PRIMANJE emailova (IONOS):
- ✅ `@` → `mx.ionos.de.` (MX, Priority: 10)
- ✅ `@` → `mx2.ionos.de.` (MX, Priority: 20)

**Obriši sve ostale MX zapise!**

---

## 🔍 Provera

### Nakon čišćenja:

1. **Proveri online:**
   - Idi na: https://mxtoolbox.com/MXLookup.aspx
   - Unesi: `biovera.app`
   - Trebalo bi da vidiš **samo 2 MX zapisa** (za IONOS) ili **samo 2 MX zapisa** (za ImprovMX)

2. **Testiraj primanje:**
   - Pošalji test email na `info@biovera.app`
   - Email bi trebalo da stigne

---

## 💡 Preporuka

**Za primanje emailova, preporučujem:**
- **IONOS Email** (ako želiš direktno inbox na IONOS)
- **ImprovMX** (ako želiš forwarding na bilo koji email)

**Ne koristi više od jednog servisa istovremeno!**
