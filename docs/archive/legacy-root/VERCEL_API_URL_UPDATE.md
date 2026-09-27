# Ažuriranje API URL-a u Vercel

## ✅ Status Backend-a

Backend je **operativan** na:
```
https://biovera-production.up.railway.app
```

Health check potvrđen: `{"status":"healthy"}`

---

## 🔧 Korak 1: Ažuriraj Vercel Environment Variable

### 1.1. Otvori Vercel Dashboard

1. Idi na: https://vercel.com/dashboard
2. Klikni na projekat **bio-vera** (ili kako se zove tvoj projekat)

### 1.2. Otvori Settings → Environment Variables

1. U projektu, klikni na **Settings** (u gornjem meniju)
2. U levom sidebar-u, klikni na **Environment Variables**

### 1.3. Ažuriraj `NEXT_PUBLIC_API_URL`

1. Pronađi `NEXT_PUBLIC_API_URL` u listi
2. Klikni na **Edit** (ili **Add** ako ne postoji)
3. Promeni **Value** na:
   ```
   https://biovera-production.up.railway.app
   ```
4. Proveri da su svi **Environments** označeni:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Klikni **Save**

### 1.4. Redeploy Frontend

1. Idi na **Deployments** tab
2. Klikni na **...** (tri tačke) pored najnovijeg deployment-a
3. Klikni **Redeploy**
4. Sačekaj da se build završi (obično 1-2 minuta)

---

## 🧪 Korak 2: Testiraj Login

Nakon redeploy-a:

1. Otvori: `https://bio-vera.vercel.app/login` (ili tvoj custom domain)
2. Unesi:
   - **Partner Code**: `FARMER001`
   - **Password**: `test123`
3. Klikni **Login**
4. Trebalo bi da se uspešno uloguješ

---

## 🔄 Korak 3: Kada se DNS propagira (opciono)

Kada se `api.biovera.app` DNS propagira:

1. Proveri Railway Dashboard → BioVera service → Settings → Networking
2. Status `api.biovera.app` bi trebalo da se promeni sa "Waiting for DNS update" na "Active"
3. Testiraj: `https://api.biovera.app/health` (trebalo bi da radi)
4. Ažuriraj `NEXT_PUBLIC_API_URL` u Vercel na `https://api.biovera.app`
5. Redeploy frontend

---

## 📋 Test Korisnici

Sledeći test korisnici su kreirani u bazi:

| Partner Code | Password | Role |
|-------------|----------|------|
| `ADMIN001` | `test123` | Admin |
| `FARMER001` | `test123` | Farmer/Grower |
| `BUYER001` | `test123` | Buyer |
| `LOG001` | `test123` | Logistics Partner |

---

## ❌ Troubleshooting

### Problem: Login ne radi

**Rešenje:**
1. Proveri da li je `NEXT_PUBLIC_API_URL` tačno postavljen u Vercel
2. Proveri browser console (F12) za greške
3. Proveri Network tab da li se API pozivi šalju na pravi URL
4. Proveri da li je backend još uvek aktivan: `https://biovera-production.up.railway.app/health`

### Problem: CORS greške

**Rešenje:**
Backend već ima CORS konfigurisan za Vercel domene. Ako i dalje imaš problema:
1. Proveri da li `FRONTEND_URL` u Railway environment variables sadrži tvoj Vercel URL
2. Proveri Railway logs za CORS greške

### Problem: "Cannot connect to backend"

**Rešenje:**
1. Proveri da li je backend aktivan: `https://biovera-production.up.railway.app/health`
2. Proveri da li je `NEXT_PUBLIC_API_URL` postavljen u Vercel
3. Proveri da li je redeploy završen (može potrajati 1-2 minuta)

---

## ✅ Checklist

- [ ] `NEXT_PUBLIC_API_URL` ažuriran u Vercel na `https://biovera-production.up.railway.app`
- [ ] Frontend redeploy-ovan
- [ ] Login testiran sa `FARMER001` / `test123`
- [ ] Backend health check proveren: `https://biovera-production.up.railway.app/health`

---

## 📞 Support

Ako imaš problema:
1. Proveri Railway logs: Railway Dashboard → BioVera service → Deployments → Latest → View Logs
2. Proveri Vercel logs: Vercel Dashboard → bio-vera → Deployments → Latest → View Function Logs
3. Proveri browser console (F12) za frontend greške
