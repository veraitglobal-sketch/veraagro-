# 📍 Gde da Dodaš DNS Records za Resend - Korak po Korak

## 🎯 Pre nego što počneš

Prvo proveri gde je tvoj domain:
- **Cloudflare** → Idi na Cloudflare Dashboard
- **Drugi registrar** (Namecheap, GoDaddy, itd.) → Idi u DNS Management

---

## 📋 Records koje treba da dodaš

### 1. SPF Record
### 2. DKIM Record  
### 3. DMARC Record (opciono)

---

## 🔧 Ako koristiš Cloudflare (Najčešće)

### Korak 1: Otvori Cloudflare Dashboard
1. Idi na https://dash.cloudflare.com
2. Uloguj se
3. Izaberi domain `biovera.app`

### Korak 2: Dodaj SPF Record

1. Klikni na **"DNS"** u levoj navigaciji
2. Klikni **"Add record"** (plavi dugme)
3. Popuni:
   - **Type**: Izaberi `TXT` iz dropdown-a
   - **Name**: Unesi `@` (ili ostavi prazno - Cloudflare će automatski dodati domain)
   - **Content**: Unesi `v=spf1 include:resend.com ~all`
   - **TTL**: Izaberi `Auto` (ili ostavi default)
4. Klikni **"Save"**

**Rezultat**: Vidićeš novi TXT record u listi

---

### Korak 3: Dodaj DKIM Record

1. Klikni **"Add record"** ponovo
2. Popuni:
   - **Type**: Izaberi `TXT` iz dropdown-a
   - **Name**: Unesi `resend._domainkey` (tačno ovako, bez razmaka)
   - **Content**: Unesi ceo string:
     ```
     v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB
     ```
     **VAŽNO**: Kopiraj ceo string, bez preloma linija!
   - **TTL**: Izaberi `Auto`
3. Klikni **"Save"**

**Rezultat**: Vidićeš novi TXT record sa name `resend._domainkey`

---

### Korak 4: Dodaj DMARC Record (Opciono)

1. Klikni **"Add record"** ponovo
2. Popuni:
   - **Type**: Izaberi `TXT` iz dropdown-a
   - **Name**: Unesi `_dmarc` (tačno ovako, sa underscore na početku)
   - **Content**: Unesi `v=DMARC1; p=none; rua=mailto:dmarc@biovera.app`
   - **TTL**: Izaberi `Auto`
3. Klikni **"Save"**

**Rezultat**: Vidićeš novi TXT record sa name `_dmarc`

---

## 🔧 Ako koristiš Namecheap

### Korak 1: Otvori Namecheap
1. Idi na https://www.namecheap.com
2. Uloguj se
3. Idi na **"Domain List"**
4. Klikni **"Manage"** pored `biovera.app`

### Korak 2: Dodaj SPF Record

1. Idi na **"Advanced DNS"** tab
2. U sekciji **"Host Records"**, klikni **"Add New Record"**
3. Popuni:
   - **Type**: Izaberi `TXT Record`
   - **Host**: Unesi `@`
   - **Value**: Unesi `v=spf1 include:resend.com ~all`
   - **TTL**: Izaberi `Automatic` (ili `30 min`)
4. Klikni **"Save All Changes"** (zelena ikonica)

---

### Korak 3: Dodaj DKIM Record

1. Klikni **"Add New Record"** ponovo
2. Popuni:
   - **Type**: Izaberi `TXT Record`
   - **Host**: Unesi `resend._domainkey`
   - **Value**: Unesi ceo string:
     ```
     v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB
     ```
   - **TTL**: Izaberi `Automatic`
3. Klikni **"Save All Changes"**

---

### Korak 4: Dodaj DMARC Record

1. Klikni **"Add New Record"** ponovo
2. Popuni:
   - **Type**: Izaberi `TXT Record`
   - **Host**: Unesi `_dmarc`
   - **Value**: Unesi `v=DMARC1; p=none; rua=mailto:dmarc@biovera.app`
   - **TTL**: Izaberi `Automatic`
3. Klikni **"Save All Changes"**

---

## 🔧 Ako koristiš GoDaddy

### Korak 1: Otvori GoDaddy
1. Idi na https://www.godaddy.com
2. Uloguj se
3. Idi na **"My Products"**
4. Klikni **"DNS"** pored `biovera.app`

### Korak 2: Dodaj Records

1. Klikni **"Add"** (ili **"Add Record"**)
2. Za svaki record:
   - **Type**: Izaberi `TXT`
   - **Name**: (vidi gore za svaki record)
   - **Value**: (vidi gore za svaki record)
   - **TTL**: Ostavi default
3. Klikni **"Save"**

---

## 🔧 Ako koristiš drugi registrar

### Opšti princip:
1. Idi u DNS Management / DNS Settings
2. Pronađi opciju za dodavanje TXT records
3. Dodaj svaki record:
   - **SPF**: Name `@`, Value `v=spf1 include:resend.com ~all`
   - **DKIM**: Name `resend._domainkey`, Value `v=DKIM1; k=rsa; p=...` (ceo string)
   - **DMARC**: Name `_dmarc`, Value `v=DMARC1; p=none; rua=mailto:dmarc@biovera.app`

---

## ✅ Provera da li su records dodati

### Nakon što dodaš records:

1. **Sačekaj 5-10 minuta** (DNS propagation)

2. **Proveri online**:
   - Idi na https://mxtoolbox.com/TXTLookup.aspx
   - Unesi `biovera.app`
   - Klikni "TXT Lookup"
   - Trebalo bi da vidiš sve TXT records koje si dodao

3. **Proveri u Resend**:
   - Idi na https://resend.com/domains
   - Klikni "Verify" pored `biovera.app`
   - Ako su svi records tačni, domain će biti verifikovan ✅

---

## 📸 Primer kako izgleda u Cloudflare

```
DNS Records:

Type    Name                Content
----    ----                -------
TXT     @                   v=spf1 include:resend.com ~all
TXT     resend._domainkey   v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZHGQQNLb9WwQPsnZQHIreu56kfhvp7DeSi5Pm/Uy9+nhbrQq8DZIbdf2UMIEUpUFk3Ickv+tdtvBLH8uwRumnfhcKcBk3aekHyFysX4lhZsqJxm+CdjMPRDGTRXwJfzOPD80D125pviXe4QWRwM2Rd5+HKSFRnNiDQT7UI+HSsQIDAQAB
TXT     _dmarc              v=DMARC1; p=none; rua=mailto:dmarc@biovera.app
```

---

## 🆘 Problemi?

### "Record not showing up"
- Sačekaj 5-10 minuta (DNS propagation)
- Proveri da li si kliknuo "Save"
- Proveri da li nema grešaka u formatu

### "Domain not verified in Resend"
- Proveri da li su svi records tačno dodati
- Proveri da li nema razmaka u Value string-u
- Proveri da li je DKIM Value kompletan (uključujući `v=DKIM1; k=rsa; p=...`)

### "SPF record conflict"
- Može biti samo jedan SPF record
- Ako već postoji SPF, dodaj `include:resend.com` u postojeći:
  - Stari: `v=spf1 include:something.com ~all`
  - Novi: `v=spf1 include:something.com include:resend.com ~all`

---

## 🎯 Kada je sve gotovo

1. ✅ Svi records su dodati
2. ✅ Sačekao si 5-10 minuta
3. ✅ Verifikovao si domain u Resend dashboard-u
4. ✅ Restart backend
5. ✅ Testiraj contact form

**Emailovi će se slati sa `info@biovera.app`!** 🎉
