# ✅ Resend DNS - Tačne Instrukcije

## 🎯 Važno Razumevanje

**Resend koristi Amazon SES u pozadini!** To je normalno i očekivano. Zato vidiš `amazonses.com` u SPF zapisu.

---

## 📋 Tačni DNS Zapisi za Resend

Iz Resend dashboard-a, kopiraj **TAČNE** vrednosti koje Resend pokazuje:

### 1. DKIM Record

- **Type**: `TXT`
- **Name**: `resend._domainkey`
- **Content**: Kopiraj **CEO** string iz Resend dashboard-a
  - Trebalo bi da počinje sa `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB`
- **TTL**: `Auto` ili `3600`

---

### 2. SPF Records (DVA zapisa!)

Resend zahteva **DVA zapisa** za SPF:

#### 2.1. MX Record
- **Type**: `MX`
- **Name**: `send`
- **Content/Value**: `feedback-smtp.eu-west-1.amazonses.com`
- **Priority**: `10`
- **TTL**: `Auto` ili `3600`

#### 2.2. TXT Record
- **Type**: `TXT`
- **Name**: `send`
- **Content**: `v=spf1 include:amazonses.com ~all`
- **TTL**: `Auto` ili `3600`

**VAŽNO**: Oba zapisa moraju imati **Name = `send`** (ne `@`!)

---

### 3. DMARC Record (Opciono)

- **Type**: `TXT`
- **Name**: `_dmarc`
- **Content**: `v=DMARC1; p=none;`
- **TTL**: `Auto` ili `3600`

---

## 🔧 Kako da Dodaš u IONOS

### Korak 1: Otvori IONOS DNS Panel

1. Idi na IONOS Dashboard
2. Pronađi domain `biovera.app`
3. Klikni na **"DNS"** ili **"DNS Management"**

---

### Korak 2: Dodaj DKIM Record

1. Klikni **"Add Record"** ili **"New Record"**
2. Popuni:
   - **Type**: Izaberi `TXT`
   - **Name/Host**: Unesi `resend._domainkey` (tačno ovako, bez razmaka!)
   - **Value/Content**: Paste **CEO** string iz Resend dashboard-a
     - **VAŽNO**: Kopiraj ceo string, bez preloma linija!
   - **TTL**: `3600` ili `Auto`
3. Klikni **"Save"**

---

### Korak 3: Dodaj SPF MX Record

1. Klikni **"Add Record"** ponovo
2. Popuni:
   - **Type**: Izaberi `MX`
   - **Name/Host**: Unesi `send` (tačno ovako, bez razmaka!)
   - **Value/Content**: Unesi `feedback-smtp.eu-west-1.amazonses.com`
   - **Priority**: `10`
   - **TTL**: `3600` ili `Auto`
3. Klikni **"Save"**

---

### Korak 4: Dodaj SPF TXT Record

1. Klikni **"Add Record"** ponovo
2. Popuni:
   - **Type**: Izaberi `TXT`
   - **Name/Host**: Unesi `send` (tačno ovako, bez razmaka!)
   - **Value/Content**: Unesi `v=spf1 include:amazonses.com ~all`
   - **TTL**: `3600` ili `Auto`
3. Klikni **"Save"**

**VAŽNO**: 
- **Name mora biti `send`** (ne `@`!)
- **Oba zapisa (MX i TXT) moraju imati isti Name = `send`**

---

### Korak 5: Dodaj DMARC Record (Opciono)

1. Klikni **"Add Record"** ponovo
2. Popuni:
   - **Type**: Izaberi `TXT`
   - **Name/Host**: Unesi `_dmarc` (tačno ovako, sa underscore na početku!)
   - **Value/Content**: Unesi `v=DMARC1; p=none;`
   - **TTL**: `3600` ili `Auto`
3. Klikni **"Save"**

---

## ✅ Provera da li su Zapisi Dodati

### Nakon što dodaš sve zapise:

1. **Proveri u IONOS DNS panel-u** da li vidiš:
   - ✅ TXT record: `resend._domainkey` → `p=MIGfMA...`
   - ✅ MX record: `send` → `feedback-smtp.eu-west-1.amazonses.com` (Priority: 10)
   - ✅ TXT record: `send` → `v=spf1 include:amazonses.com ~all`
   - ✅ TXT record: `_dmarc` → `v=DMARC1; p=none;`

2. **Sačekaj 5-10 minuta** (DNS propagacija)

3. **Proveri online**:
   - Idi na: https://mxtoolbox.com/TXTLookup.aspx
   - Unesi: `biovera.app`
   - Klikni "TXT Lookup"
   - Trebalo bi da vidiš sve TXT records

4. **Proveri MX records**:
   - Idi na: https://mxtoolbox.com/MXLookup.aspx
   - Unesi: `send.biovera.app`
   - Trebalo bi da vidiš: `feedback-smtp.eu-west-1.amazonses.com`

5. **Proveri u Resend**:
   - Idi na: https://resend.com/domains
   - Klikni na `biovera.app`
   - Klikni **"Verify"** ili **"Check DNS"**
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
1. Proveri da li imaš **OBA zapisa**:
   - ✅ MX record: `send` → `feedback-smtp.eu-west-1.amazonses.com`
   - ✅ TXT record: `send` → `v=spf1 include:amazonses.com ~all`
2. Proveri da li je Name tačno `send` (ne `@`!)
3. Proveri da li je Content tačno `v=spf1 include:amazonses.com ~all`

### Problem: "Still showing Failed after 15 minutes"

**Rešenje:**
1. Proveri da li su svi zapisi tačno dodati u IONOS
2. Proveri da li si kliknuo "Save" za svaki zapis
3. Proveri online (mxtoolbox.com) da li se zapisi vide
4. Ako se ne vide online, sačekaj još 10-15 minuta
5. Pokušaj "Verify" ponovo u Resend dashboard-u

### Problem: "IONOS ne prihvata `send` kao Name"

**Rešenje:**
Neki DNS provajderi ne prihvataju `send` kao Name. Probaj:
1. **Za MX record**: Koristi `send.biovera.app` umesto `send`
2. **Za TXT record**: Koristi `send.biovera.app` umesto `send`

Ako ni to ne radi, kontaktiraj IONOS support.

---

## 📋 Checklist

- [ ] Dodao DKIM TXT record (`resend._domainkey` → `p=MIGfMA...`)
- [ ] Dodao SPF MX record (`send` → `feedback-smtp.eu-west-1.amazonses.com`, Priority: 10)
- [ ] Dodao SPF TXT record (`send` → `v=spf1 include:amazonses.com ~all`)
- [ ] Dodao DMARC TXT record (`_dmarc` → `v=DMARC1; p=none;`)
- [ ] Proverio u IONOS da li su svi zapisi vidljivi
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

## 💡 Zašto Amazon SES?

Resend koristi Amazon SES kao svoj email provider u pozadini. To je normalno i očekivano. Zato vidiš `amazonses.com` u SPF zapisu - to je tačno ono što Resend zahteva!

**Ne briši Amazon SES zapise** - oni su potrebni za Resend! ✅
