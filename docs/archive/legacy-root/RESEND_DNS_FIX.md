# 🔧 Rešavanje Resend DNS Problema

## ❌ Problem

Iz screenshot-a vidim da imaš **Amazon SES zapise** umesto **Resend zapisa**:

### Šta je pogrešno:

1. **SPF Record** - Imaš:
   - MX record: `send` → `feedback-smtp.eu-west-1.amazonses.com` ❌ (ovo je Amazon SES!)
   - TXT record: `send` → `v=spf1 include:amazonses.com ~all` ❌ (ovo je Amazon SES!)

2. **DKIM Record** - Verovatno nemaš ili je pogrešan

### Šta treba:

1. **SPF Record** - Treba:
   - TXT record: `send` → `v=spf1 include:resend.com ~all` ✅
   - **NE treba MX record za Resend!**

2. **DKIM Record** - Treba:
   - TXT record: `resend._domainkey` → `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB` ✅

---

## 🔧 Rešenje: Korak po Korak

### Korak 1: Obriši Amazon SES Zapise

**U IONOS DNS panel-u:**

1. Pronađi i **obriši** sledeće zapise:
   - ❌ MX record: `send` → `feedback-smtp.eu-west-1.amazonses.com`
   - ❌ TXT record: `send` → `v=spf1 include:amazonses.com ~all`

**Kako da obrišeš:**
- Klikni na zapis
- Klikni "Delete" ili "Remove"
- Potvrdi brisanje

---

### Korak 2: Dodaj Resend Zapise

**Iz Resend dashboard-a, kopiraj TAČNE vrednosti:**

#### 2.1. DKIM Record

Iz Resend dashboard-a (screenshot), kopiraj:

- **Type**: `TXT`
- **Name**: `resend._domainkey`
- **Content**: Kopiraj **CEO** string (ne skraćenu verziju!)
  - Trebalo bi da počinje sa `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB`
- **TTL**: `Auto` (ili `3600`)

**U IONOS:**
1. Klikni "Add Record" ili "New Record"
2. Izaberi **Type**: `TXT`
3. **Name/Host**: `resend._domainkey`
4. **Value/Content**: Paste ceo string (bez preloma linija!)
5. **TTL**: `3600` ili `Auto`
6. **Save**

---

#### 2.2. SPF Record

Iz Resend dashboard-a, kopiraj:

- **Type**: `TXT`
- **Name**: `send`
- **Content**: `v=spf1 include:resend.com ~all`
- **TTL**: `Auto` (ili `3600`)

**VAŽNO**: 
- **NE dodaj MX record!** (Resend ne koristi MX za SPF)
- **Samo TXT record** sa `send` kao Name

**U IONOS:**
1. Klikni "Add Record" ili "New Record"
2. Izaberi **Type**: `TXT`
3. **Name/Host**: `send`
4. **Value/Content**: `v=spf1 include:resend.com ~all`
5. **TTL**: `3600` ili `Auto`
6. **Save**

---

#### 2.3. DMARC Record (Opciono)

- **Type**: `TXT`
- **Name**: `_dmarc`
- **Content**: `v=DMARC1; p=none;`
- **TTL**: `Auto` (ili `3600`)

**U IONOS:**
1. Klikni "Add Record" ili "New Record"
2. Izaberi **Type**: `TXT`
3. **Name/Host**: `_dmarc`
4. **Value/Content**: `v=DMARC1; p=none;`
5. **TTL**: `3600` ili `Auto`
6. **Save**

---

## ✅ Provera

### Nakon što dodaš zapise:

1. **Sačekaj 5-10 minuta** (DNS propagacija)

2. **Proveri online**:
   - Idi na: https://mxtoolbox.com/TXTLookup.aspx
   - Unesi: `biovera.app`
   - Klikni "TXT Lookup"
   - Trebalo bi da vidiš:
     - ✅ `resend._domainkey` → `p=MIGfMA...`
     - ✅ `send` → `v=spf1 include:resend.com ~all`
     - ✅ `_dmarc` → `v=DMARC1; p=none;`

3. **Proveri u Resend**:
   - Idi na: https://resend.com/domains
   - Klikni na `biovera.app`
   - Klikni "Verify" ili "Check DNS"
   - Status bi trebalo da se promeni sa "Failed" na "Verified" ✅

---

## 🆘 Troubleshooting

### Problem: "DKIM record not found"

**Rešenje:**
1. Proveri da li je Name tačno `resend._domainkey` (bez razmaka!)
2. Proveri da li je Content kompletan (ne skraćen!)
3. Proveri da li nema preloma linija u Content-u
4. Sačekaj 10-15 minuta (DNS propagacija)

### Problem: "SPF record invalid"

**Rešenje:**
1. Proveri da li si **obrisao** Amazon SES SPF record
2. Proveri da li je Name tačno `send`
3. Proveri da li je Content tačno `v=spf1 include:resend.com ~all`
4. **NE dodaj MX record!** (Resend ne koristi MX za SPF)

### Problem: "Still showing Failed after 15 minutes"

**Rešenje:**
1. Proveri da li su svi zapisi tačno dodati u IONOS
2. Proveri da li si kliknuo "Save" za svaki zapis
3. Proveri online (mxtoolbox.com) da li se zapisi vide
4. Ako se ne vide online, sačekaj još 10-15 minuta
5. Pokušaj "Verify" ponovo u Resend dashboard-u

---

## 📋 Checklist

- [ ] Obrisao Amazon SES MX record (`send` → `feedback-smtp.eu-west-1.amazonses.com`)
- [ ] Obrisao Amazon SES TXT record (`send` → `v=spf1 include:amazonses.com ~all`)
- [ ] Dodao Resend DKIM TXT record (`resend._domainkey` → `p=MIGfMA...`)
- [ ] Dodao Resend SPF TXT record (`send` → `v=spf1 include:resend.com ~all`)
- [ ] Dodao DMARC TXT record (`_dmarc` → `v=DMARC1; p=none;`)
- [ ] Sačekao 5-10 minuta
- [ ] Proverio online (mxtoolbox.com)
- [ ] Kliknuo "Verify" u Resend dashboard-u
- [ ] Status promenjen na "Verified" ✅

---

## 🎯 Kada je sve gotovo

Nakon verifikacije u Resend:

1. ✅ Domain status: "Verified"
2. ✅ DKIM: "Verified"
3. ✅ SPF: "Verified"
4. ✅ Emailovi će se slati sa `info@biovera.app`

**Restart backend nije potreban** - Resend API key je već konfigurisan.

---

## 📞 Ako i dalje imaš problema

1. **Proveri IONOS DNS panel** - da li su svi zapisi tačno dodati
2. **Proveri online** - https://mxtoolbox.com/TXTLookup.aspx
3. **Proveri Resend logs** - Resend Dashboard → Logs
4. **Kontaktiraj Resend support** - ako problem traje više od 30 minuta
