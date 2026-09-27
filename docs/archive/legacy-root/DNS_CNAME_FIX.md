# 🔧 DNS CNAME Fix - Dodaj `api` CNAME Record

## ❌ Problem

Vercel prikazuje grešku:
> "Please specify a name or use an ALIAS Record instead, if you're attempting to set a CNAME value for the apex domain."

**Uzrok**: 
- Ne možeš da koristiš CNAME za root domain (`@`)
- Vrednost ne sme imati `https://` prefiks

---

## ✅ Rešenje: Dodaj `api` CNAME Record

### Korak 1: Očisti Formu

1. **Vercel DNS** → **Add New DNS Record** form
2. **Očisti sva polja** (Name, Value, Comment)

### Korak 2: Dodaj `api` CNAME Record

1. **Name**: `api` (ne `@`!)
2. **Type**: `CNAME` (već je izabrano)
3. **Value**: `biovera-production.up.railway.app` (bez `https://`!)
4. **TTL**: `60` (ili Auto)
5. **Priority**: (ostavi prazno)
6. **Comment**: (opciono, npr. "Backend API")
7. Klikni **"Add"**

**VAŽNO**:
- ✅ **Name**: `api` (ne `@`!)
- ✅ **Value**: `biovera-production.up.railway.app` (bez `https://`!)
- ❌ **NE**: `@` za Name
- ❌ **NE**: `https://biovera-production.up.railway.app` za Value

---

## 🔍 Proveri Postojeće DNS Records

U tabeli bi trebalo da vidiš:

### ✅ Email Records (MX):
- `@` → `mx.ionos.de.` (Priority: 10)
- `@` → `mx2.ionos.de.` (Priority: 20)

### ✅ Resend Records (TXT):
- `_dmarc` → `v=DMARC1; p=none;`
- (možda i `resend._domainkey`, `send` TXT, `send` MX)

### ✅ Backend CNAME (treba da bude):
- `api` → `biovera-production.up.railway.app.` (TTL: 60)

**Ako `api` CNAME ne postoji:**
- Dodaj ga koristeći korake iznad

---

## 🚨 Najčešće Greške

### Greška 1: CNAME za Root Domain (`@`)
**Problem**: Pokušavaš da dodaš CNAME za `@` (root domain)
**Rešenje**: Koristi `api` za Name (ne `@`)

### Greška 2: `https://` u DNS Record Value
**Problem**: Dodaješ `https://biovera-production.up.railway.app` u Value
**Rešenje**: Koristi samo hostname: `biovera-production.up.railway.app` (bez `https://`)

### Greška 3: `api` CNAME Nedostaje
**Problem**: `api` CNAME record nije dodat
**Rešenje**: Dodaj `api` CNAME record koristeći korake iznad

---

## ✅ Checklist

- [ ] Forma očišćena (Name, Value, Comment)
- [ ] `api` CNAME record dodat:
  - [ ] Name: `api` (ne `@`!)
  - [ ] Type: `CNAME`
  - [ ] Value: `biovera-production.up.railway.app` (bez `https://`!)
  - [ ] TTL: `60` (ili Auto)
- [ ] `api` CNAME record vidljiv u tabeli
- [ ] DNS propagation sačekan (5-10 minuta)

---

## 🔍 Test `api.biovera.app`

### A) Test DNS Resolution

```bash
dig api.biovera.app CNAME
```

**Očekivani rezultat:**
```
api.biovera.app.    60    IN    CNAME    biovera-production.up.railway.app.
```

### B) Test Backend Health

```bash
curl https://api.biovera.app/health
```

**Očekivani odgovor:**
```json
{"status":"healthy","timestamp":"2026-02-08T23:29:00.000Z"}
```

**Ako dobiješ 502 Bad Gateway:**
- DNS propagation možda nije završen (sačekaj 5-10 minuta)
- Proveri da li je `api.biovera.app` custom domain konfigurisan u Railway-u

---

## 📝 Javi mi

1. **Da li si dodao `api` CNAME record?**
2. **Da li je `api` CNAME vidljiv u tabeli?**
3. **Da li `api.biovera.app/health` sada radi?** (`curl` test)

---

## 🔗 Korisni Linkovi

- **Vercel DNS Settings**: Vercel Dashboard → Domains → `biovera.app` → DNS Records
- **Railway Dashboard**: https://railway.app/dashboard
- **Backend Health (Railway)**: https://biovera-production.up.railway.app/health
- **Backend Health (Custom)**: https://api.biovera.app/health
