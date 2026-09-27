# ✅ DNS Fix - Sve u Vercel-u

## ✅ Status

**Nije problem!** IONOS DNS postavke su inaktivne jer se koristi **Vercel nameserver**, što je **ispravno** za frontend deployment.

**Sve DNS records moraju biti u Vercel-u**, ne u IONOS-u!

---

## 🔍 Korak 1: Proveri DNS Records u Vercel-u

### A) Otvori Vercel DNS Settings

1. **Vercel Dashboard** → Tvoj Projekat (`bio-vera`)
2. **Settings** → **Domains**
3. Klikni na `biovera.app` domain
4. **DNS Records** tab

### B) Proveri Postojeće DNS Records

**Trebalo bi da vidiš:**

#### ✅ Frontend Records (A ili CNAME):
- `@` (root) → Vercel IP ili CNAME
- `www` → Vercel IP ili CNAME

#### ✅ Backend Records (CNAME):
- `api` → Railway CNAME (npr. `biovera-production.up.railway.app`)

#### ✅ Email Records (MX):
- `@` → `mx.ionos.de` (Priority: 10)
- `@` → `mx2.ionos.de` (Priority: 20)

#### ✅ Resend Records (TXT):
- `resend._domainkey` → Resend DKIM key
- `send` → Resend SPF record
- `_dmarc` → DMARC record

---

## 🔧 Korak 2: Dodaj Nedostajuće DNS Records

### A) Dodaj MX Records za Email (ako nedostaju)

**Za IONOS Email Hosting:**

1. **Vercel DNS** → **Add Record**
2. **Type**: `MX`
3. **Name**: `@` (ili prazno za root domain)
4. **Value**: `mx.ionos.de`
5. **Priority**: `10`
6. **TTL**: `3600` (ili Auto)
7. **Save**

8. **Add Record** (drugi MX record)
9. **Type**: `MX`
10. **Name**: `@`
11. **Value**: `mx2.ionos.de`
12. **Priority**: `20`
13. **TTL**: `3600`
14. **Save**

### B) Dodaj Backend CNAME (ako nedostaje)

**Za `api.biovera.app`:**

1. **Vercel DNS** → **Add Record**
2. **Type**: `CNAME`
3. **Name**: `api`
4. **Value**: Railway CNAME (npr. `biovera-production.up.railway.app`)
5. **TTL**: `3600`
6. **Save**

**Napomena**: Prvo proveri u Railway-u da li je `api.biovera.app` custom domain konfigurisan i koji CNAME treba da koristiš.

### C) Proveri Resend Records (ako nedostaju)

**Za Resend Email Sending:**

1. **Vercel DNS** → Proveri da li postoje:
   - `resend._domainkey` (TXT) → Resend DKIM key
   - `send` (TXT) → Resend SPF record
   - `_dmarc` (TXT) → DMARC record

**Ako nedostaju:**
1. Otvori **Resend Dashboard** → **Domains** → `biovera.app`
2. Kopiraj DNS records koje Resend traži
3. Dodaj ih u Vercel DNS

---

## 🔍 Korak 3: Proveri Nameserver Configuration

### A) Proveri Nameserver u IONOS-u

1. **IONOS Dashboard** → **Domains** → `biovera.app`
2. **Nameserver** tab
3. Proveri da li su nameserveri postavljeni na Vercel:

**Vercel Nameservers:**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Ako nisu:**
1. Klikni **"Nameserver ändern"** (Change Nameserver)
2. Izaberi **"Andere Nameserver verwenden"** (Use Other Nameservers)
3. Dodaj Vercel nameservere:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
4. **Save**

**Napomena**: Vercel nameservere možeš naći u Vercel Dashboard → Settings → Domains → `biovera.app` → **Nameservers** sekcija.

---

## 🔍 Korak 4: Test DNS Records

### A) Test Frontend Domain

```bash
# Proveri A record
dig biovera.app A

# Proveri CNAME za www
dig www.biovera.app CNAME
```

**Očekivani rezultat:**
- Trebalo bi da vidiš Vercel IP adrese ili CNAME

### B) Test Backend Domain

```bash
# Proveri CNAME za api
dig api.biovera.app CNAME
```

**Očekivani rezultat:**
- Trebalo bi da vidiš Railway CNAME

### C) Test Email MX Records

```bash
# Proveri MX records
dig biovera.app MX
```

**Očekivani rezultat:**
```
biovera.app.    3600    IN    MX    10 mx.ionos.de.
biovera.app.    3600    IN    MX    20 mx2.ionos.de.
```

### D) Test u Browser-u

1. **Frontend**: `https://www.biovera.app` → Trebalo bi da se učitava
2. **Backend Health**: `https://api.biovera.app/health` → Trebalo bi da vraća `{"status":"healthy"}`

---

## 🚨 Najčešći Problemi

### Problem 1: MX Records Nedostaju u Vercel-u
**Simptomi**: Email ne stiže na `info@biovera.app`
**Rešenje**: Dodaj MX records u Vercel DNS (`mx.ionos.de`, `mx2.ionos.de`)

### Problem 2: Backend CNAME Nedostaje
**Simptomi**: `api.biovera.app` ne radi
**Rešenje**: 
1. Konfiguriši custom domain u Railway-u
2. Dodaj CNAME record u Vercel DNS

### Problem 3: Nameserveri Nisu na Vercel-u
**Simptomi**: DNS records u Vercel-u ne rade
**Rešenje**: Promeni nameservere u IONOS-u na Vercel nameservere

### Problem 4: DNS Propagation
**Simptomi**: DNS promene ne rade odmah
**Rešenje**: Sačekaj 5-10 minuta (maksimum 24-48 sati)

---

## ✅ Checklist

- [ ] Nameserveri provereni u IONOS-u (trebalo bi da su Vercel nameserveri)
- [ ] DNS records provereni u Vercel-u
- [ ] MX records dodati u Vercel DNS (`mx.ionos.de`, `mx2.ionos.de`)
- [ ] Backend CNAME dodato u Vercel DNS (`api` → Railway CNAME)
- [ ] Resend records provereni u Vercel DNS
- [ ] Frontend testiran (`www.biovera.app`)
- [ ] Backend testiran (`api.biovera.app/health`)
- [ ] Email testiran (pošalji test email na `info@biovera.app`)

---

## 📝 Javi mi

1. **Da li su nameserveri na Vercel-u u IONOS-u?**
2. **Šta vidiš u Vercel DNS records?** (kopiraj listu)
3. **Da li su MX records dodati u Vercel DNS?**
4. **Da li je `api.biovera.app` CNAME dodato u Vercel DNS?**
5. **Da li frontend sada radi na `www.biovera.app`?**

---

## 🔗 Korisni Linkovi

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel DNS Settings**: Vercel Dashboard → Settings → Domains → `biovera.app` → DNS Records
- **IONOS Dashboard**: https://www.ionos.com/
- **Railway Dashboard**: https://railway.app/dashboard
- **Resend Dashboard**: https://resend.com/domains
