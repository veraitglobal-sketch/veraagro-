# 🔧 Dodavanje DNS Zapisa u Vercel (Ne u IONOS!)

## ❌ Problem

**Koristiš Vercel nameserver-e:**
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

**To znači:**
- ❌ DNS zapisi u IONOS DNS panel-u se **NE koriste**
- ✅ DNS zapisi moraju biti dodati u **Vercel DNS**, ne u IONOS!

---

## ✅ Rešenje: Dodaj DNS Zapise u Vercel

### Korak 1: Otvori Vercel Domains

1. Idi na: https://vercel.com/dashboard
2. Klikni na tvoj projekat (bio-vera)
3. Idi na **Settings** → **Domains**
4. Klikni na `biovera.app` domain

### Korak 2: Otvori DNS Records

1. U domain settings-u, trebalo bi da vidiš **"DNS Records"** sekciju
2. Klikni na **"DNS Records"** tab ili sekciju

### Korak 3: Dodaj DKIM Record

1. Klikni **"Add Record"** ili **"Add DNS Record"**
2. Popuni:
   - **Type**: `TXT`
   - **Name**: `resend._domainkey`
   - **Value**: Kopiraj ceo string iz Resend dashboard-a:
     ```
     p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB
     ```
   - **TTL**: `3600` (ili `Auto`)
3. Klikni **"Save"**

---

### Korak 4: Dodaj SPF MX Record

1. Klikni **"Add Record"** ponovo
2. Popuni:
   - **Type**: `MX`
   - **Name**: `send`
   - **Value**: `feedback-smtp.eu-west-1.amazonses.com`
   - **Priority**: `10`
   - **TTL**: `3600` (ili `Auto`)
3. Klikni **"Save"**

---

### Korak 5: Dodaj SPF TXT Record

1. Klikni **"Add Record"** ponovo
2. Popuni:
   - **Type**: `TXT`
   - **Name**: `send`
   - **Value**: `v=spf1 include:amazonses.com ~all`
   - **TTL**: `3600` (ili `Auto`)
3. Klikni **"Save"**

---

### Korak 6: Dodaj DMARC Record (Opciono)

1. Klikni **"Add Record"** ponovo
2. Popuni:
   - **Type**: `TXT`
   - **Name**: `_dmarc`
   - **Value**: `v=DMARC1; p=none;`
   - **TTL**: `3600` (ili `Auto`)
3. Klikni **"Save"**

---

## 🔍 Provera

### Nakon što dodaš zapise u Vercel:

1. **Sačekaj 5-10 minuta** (DNS propagacija)

2. **Proveri online**:
   - Idi na: https://mxtoolbox.com/TXTLookup.aspx
   - Unesi: `resend._domainkey.biovera.app`
   - Klikni "TXT Lookup"
   - Trebalo bi da vidiš: `p=MIGfMA...`

3. **Proveri u Resend**:
   - Idi na: https://resend.com/domains
   - Klikni na `biovera.app`
   - Klikni **"Verify"** ili **"Check DNS"**
   - Status bi trebalo da se promeni sa "Pending" na "Verified" ✅

---

## ⚠️ Važno Razumevanje

**Kada koristiš Vercel nameserver-e:**
- ✅ DNS zapisi se dodaju u **Vercel DNS**
- ❌ DNS zapisi u **IONOS DNS panel-u se NE koriste**

**IONOS DNS panel je neaktivan** kada koristiš Vercel nameserver-e!

---

## 📋 Checklist

- [ ] Otvoren Vercel Dashboard → Settings → Domains → `biovera.app`
- [ ] Otvorena DNS Records sekcija
- [ ] Dodat DKIM TXT record (`resend._domainkey`)
- [ ] Dodat SPF MX record (`send` → `feedback-smtp.eu-west-1.amazonses.com`)
- [ ] Dodat SPF TXT record (`send` → `v=spf1 include:amazonses.com ~all`)
- [ ] Dodat DMARC TXT record (`_dmarc` → `v=DMARC1; p=none;`)
- [ ] Sačekao 5-10 minuta
- [ ] Proverio online (mxtoolbox.com)
- [ ] Kliknuo "Verify" u Resend dashboard-u
- [ ] Status promenjen na "Verified" ✅

---

## 🆘 Ako Ne Možeš da Nađeš DNS Records u Vercel

**Moguće opcije:**

1. **Vercel možda automatski upravlja DNS-om** - u tom slučaju, DNS zapisi se dodaju automatski kada dodaš domain
2. **DNS Records možda nisu dostupni u Vercel** - u tom slučaju, možda treba da koristiš IONOS nameserver-e umesto Vercel nameserver-a

**Alternativa:**
- Vrati nameserver-e na IONOS (umesto Vercel)
- Dodaj DNS zapise u IONOS DNS panel (kao što si već uradio)
- Sačekaj DNS propagaciju

---

## 💡 Preporuka

**Ako želiš da koristiš Resend za email:**
- Koristi **IONOS nameserver-e** (ne Vercel)
- Dodaj DNS zapise u **IONOS DNS panel** (kao što si već uradio)
- Sačekaj DNS propagaciju (24-48 sati)

**Ako želiš da koristiš Vercel nameserver-e:**
- Dodaj DNS zapise u **Vercel DNS** (ne IONOS)
- Proveri da li Vercel podržava sve potrebne DNS record tipove (MX, TXT)

---

## 🔧 Kako da Vratiš Nameserver-e na IONOS

1. **IONOS Dashboard** → Domains & SSL → `biovera.app` → **Nameserver** tab
2. Klikni **"Nameserver zurücksetzen"** (Reset nameserver)
3. IONOS će vratiti default nameserver-e
4. **DNS zapisi u IONOS DNS panel-u će početi da se koriste** ✅

---

## ✅ Rezime

**Problem**: Koristiš Vercel nameserver-e, ali DNS zapise si dodao u IONOS DNS panel.

**Rešenje**: 
- **Opcija A**: Dodaj DNS zapise u Vercel DNS
- **Opcija B**: Vrati nameserver-e na IONOS i koristi IONOS DNS panel

**Preporuka**: Vrati nameserver-e na IONOS (lakše za Resend setup).
