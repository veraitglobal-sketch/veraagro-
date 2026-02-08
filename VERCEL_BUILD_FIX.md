# 🔧 Vercel Build Fix - Next.js Version Mismatch

## ❌ Problem

Vercel detektuje **Next.js 14.0.4** umesto **16.1.6** koji je u `package.json`.

**Takođe:** Package name je "vera-care-web" umesto "web".

---

## ✅ Rešenje

### 1. Proveri Vercel Settings

1. **Otvori Vercel Dashboard**
   - Idi na: https://vercel.com/dashboard
   - Klikni na projekat "BioVera"

2. **Otvori Settings → General**

3. **Proveri Root Directory:**
   - **Root Directory**: `web` (MORA biti tačno `web`)
   - Save

4. **Proveri Build & Development Settings:**
   - **Framework Preset**: Next.js (automatski)
   - **Build Command**: `npm run build` (ili ostavi prazno)
   - **Output Directory**: `.next` (automatski)
   - **Install Command**: `npm install` (automatski)

---

### 2. Obriši Build Cache

1. **Settings → General**
2. Scroll do **"Clear Build Cache"**
3. Klikni **"Clear"**
4. Save

---

### 3. Redeploy

1. **Deployments** tab
2. Klikni **"..."** (tri tačke) na poslednjem deployment-u
3. Klikni **"Redeploy"**
4. Izaberi **"Use existing Build Cache"** = **OFF** (da obriše cache)

---

### 4. Ako i Dalje Ne Radi

**Proveri da li postoji `vercel.json` u root-u:**

Ako postoji, obriši ga ili premesti u `web/` folder.

---

## 📋 Checklist

- [ ] Root Directory: `web` (u Vercel Settings)
- [ ] Build Cache obrisan
- [ ] Redeploy sa cleared cache
- [ ] Proveri da li je `package.json` u `web/` folderu

---

## 🆘 Ako i Dalje Ne Radi

**Pošalji mi:**
1. Vercel Settings screenshot (General sekcija)
2. Build logs (poslednje 50 linija)

Pa ću ti pomoći da rešimo! 🔍
