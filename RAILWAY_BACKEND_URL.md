# 🔍 Kako da Saznaš Backend URL na Railway

## 📍 Korak po Korak

### 1. Otvori Railway Dashboard
- Idi na: https://railway.app/dashboard
- Uloguj se (ako nisi već)

### 2. Pronađi Tvoj Projekat
- Klikni na projekat **"BioVera"** (ili kako si ga nazvao)

### 3. Otvori Service
- Klikni na service (obično se zove "backend" ili "api")

### 4. Pronađi Public Domain
- Idi na **"Settings"** tab (gore u meniju)
- Scroll do **"Networking"** sekcije
- Vidiš **"Public Domain"** ili **"Generate Domain"**
- To je tvoj backend URL! 🎯

**Primer:**
```
https://biovera-backend-production.up.railway.app
```

---

## 🔗 Alternativni Put

### Ako vidiš "Generate Domain" dugme:
1. Klikni **"Generate Domain"**
2. Railway će automatski generisati URL
3. Kopiraj taj URL

### Ako već imaš domain:
- Vidićeš ga direktno u "Networking" sekciji
- Primer: `https://your-service-name.up.railway.app`

---

## ✅ Proveri da li Radi

### Test Backend URL:
1. Otvori browser
2. Idi na: `https://your-backend-url.railway.app/health`
   (ili samo `https://your-backend-url.railway.app`)
3. Trebalo bi da vidiš neki response (možda error, ali znači da radi)

---

## 📝 Sledeći Korak: Ažuriraj Vercel

Kada saznaš backend URL, dodaj ga u Vercel:

1. Idi na Vercel Dashboard
2. Tvoj Projekat → Settings → Environment Variables
3. Ažuriraj `NEXT_PUBLIC_API_URL`:
   ```
   Key: NEXT_PUBLIC_API_URL
   Value: https://your-backend-url.railway.app
   ```
4. Save
5. Redeploy projekat

---

## 🎯 Primer

**Railway Backend URL:**
```
https://biovera-api-production.up.railway.app
```

**Vercel Environment Variable:**
```
NEXT_PUBLIC_API_URL=https://biovera-api-production.up.railway.app
```

---

**Javi mi backend URL kada ga saznaš, pa ću ti pomoći da ga dodaš u Vercel!** 🚀
