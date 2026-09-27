# ✅ Resend DNS - IONOS Checklist

## 🔍 Provera Zapisa u IONOS

### 1. DKIM Record ✅/❌

**Treba:**
- **Type**: `TXT`
- **Hostname**: `resend._domainkey` (ne samo `resend`!)
- **Value**: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB`
- **TTL**: `1 Stunde` (3600) ili `Auto`

**Preview bi trebalo da pokazuje:**
```
resend._domainkey.biovera.app 3600 IN TXT "p=MIGfMA..."
```

**Ako vidiš `resend.biovera.app` umesto `resend._domainkey.biovera.app` → ❌ Pogrešno!**

---

### 2. SPF MX Record ✅/❌

**Treba:**
- **Type**: `MX`
- **Hostname**: `send`
- **Value**: `feedback-smtp.eu-west-1.amazonses.com`
- **Priority**: `10`
- **TTL**: `1 Stunde` (3600) ili `Auto`

**Preview bi trebalo da pokazuje:**
```
send.biovera.app 3600 IN MX 10 feedback-smtp.eu-west-1.amazonses.com
```

---

### 3. SPF TXT Record ✅/❌

**Treba:**
- **Type**: `TXT`
- **Hostname**: `send`
- **Value**: `v=spf1 include:amazonses.com ~all`
- **TTL**: `1 Stunde` (3600) ili `Auto`

**Preview bi trebalo da pokazuje:**
```
send.biovera.app 3600 IN TXT "v=spf1 include:amazonses.com ~all"
```

---

### 4. DMARC Record (Opciono) ✅/❌

**Treba:**
- **Type**: `TXT`
- **Hostname**: `_dmarc`
- **Value**: `v=DMARC1; p=none;`
- **TTL**: `1 Stunde` (3600) ili `Auto`

**Preview bi trebalo da pokazuje:**
```
_dmarc.biovera.app 3600 IN TXT "v=DMARC1; p=none;"
```

---

## 🔧 Kako da Ispraviš DKIM Record

### Ako si već kreirao zapis sa `resend` kao Hostname:

1. **Obriši postojeći zapis:**
   - Pronađi TXT record sa Hostname `resend`
   - Klikni na njega
   - Klikni "Löschen" (Delete)
   - Potvrdi brisanje

2. **Kreiraj novi zapis:**
   - Klikni "DNS-Record hinzufügen" (Add DNS Record)
   - **Type**: `TXT`
   - **Hostname**: `resend._domainkey` (tačno ovako, sa tačkom i underscore!)
   - **Value**: Paste ceo string `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB`
   - **TTL**: `1 Stunde`
   - Klikni "Speichern" (Save)

3. **Proveri Preview:**
   - Preview bi trebalo da pokazuje: `resend._domainkey.biovera.app`
   - Ako pokazuje `resend.biovera.app` → ❌ Pogrešno, ispravi Hostname!

---

## ✅ Finalna Provera

Nakon što ispraviš sve zapise:

1. **Proveri u IONOS** da li vidiš:
   - ✅ TXT: `resend._domainkey` → `p=MIGfMA...`
   - ✅ MX: `send` → `feedback-smtp.eu-west-1.amazonses.com` (Priority: 10)
   - ✅ TXT: `send` → `v=spf1 include:amazonses.com ~all`
   - ✅ TXT: `_dmarc` → `v=DMARC1; p=none;`

2. **Sačekaj 10-15 minuta** (DNS propagacija)

3. **Proveri online**:
   - Idi na: https://mxtoolbox.com/TXTLookup.aspx
   - Unesi: `resend._domainkey.biovera.app`
   - Klikni "TXT Lookup"
   - Trebalo bi da vidiš: `p=MIGfMA...`

4. **Proveri u Resend**:
   - Idi na: https://resend.com/domains
   - Klikni na `biovera.app`
   - Klikni "Verify" ili "Check DNS"
   - Status bi trebalo da se promeni na "Verified" ✅

---

## 🆘 Ako i dalje ne radi

### Problem: "IONOS ne prihvata `resend._domainkey` kao Hostname"

**Rešenje:**
Neki DNS provajderi ne prihvataju underscore (`_`) u Hostname-u. Probaj:

1. **Koristi punu domenu:**
   - Hostname: `resend._domainkey.biovera.app`
   - (IONOS možda automatski dodaje domain, pa probaj bez `.biovera.app`)

2. **Kontaktiraj IONOS support:**
   - Pitaj kako da dodaš TXT record sa underscore u Hostname-u
   - Ili pitaj kako da dodaš `resend._domainkey` subdomain

### Problem: "Still showing Failed after 20 minutes"

**Rešenje:**
1. Proveri da li su svi zapisi tačno dodati (koristi checklist gore)
2. Proveri online (mxtoolbox.com) da li se zapisi vide
3. Ako se ne vide online, kontaktiraj IONOS support
4. Ako se vide online ali Resend i dalje kaže "Failed", kontaktiraj Resend support

---

## 📋 Quick Checklist

- [ ] DKIM: Hostname = `resend._domainkey` (ne `resend`!)
- [ ] SPF MX: Hostname = `send`, Value = `feedback-smtp.eu-west-1.amazonses.com`, Priority = `10`
- [ ] SPF TXT: Hostname = `send`, Value = `v=spf1 include:amazonses.com ~all`
- [ ] DMARC: Hostname = `_dmarc`, Value = `v=DMARC1; p=none;`
- [ ] Sačekao 10-15 minuta
- [ ] Proverio online (mxtoolbox.com)
- [ ] Kliknuo "Verify" u Resend dashboard-u
- [ ] Status promenjen na "Verified" ✅
