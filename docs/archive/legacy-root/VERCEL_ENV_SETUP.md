# 🔧 Vercel Environment Variables - Vodič

## 📍 Gde da Nađeš Environment Variables

### Korak 1: Idi na Vercel Dashboard
1. Otvori: https://vercel.com/dashboard
2. Uloguj se (ako nisi već)

### Korak 2: Otvori Tvoj Projekt
1. Klikni na projekat **"BioVera"** (ili kako si ga nazvao)
2. Ili ako još nisi kreirao projekat, prvo ga importuj

### Korak 3: Otvori Settings
1. Klikni na **"Settings"** tab (gore u meniju)
2. U levom sidebar-u, klikni na **"Environment Variables"**

---

## ➕ Kako da Dodaješ Environment Variables

### 1. Klikni "Add New"
- Vidićeš dugme **"Add New"** ili **"Add"**

### 2. Unesi Podatke

**Za svaki variable, unesi:**

#### Variable 1: API URL
- **Key**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://your-backend-url.com` (ili `http://localhost:3004` za development)
- **Environment**: 
  - ✅ Production
  - ✅ Preview
  - ✅ Development (opciono)

#### Variable 2: Site URL
- **Key**: `NEXT_PUBLIC_SITE_URL`
- **Value**: `https://your-vercel-domain.vercel.app` (ili tvoj custom domain)
- **Environment**: 
  - ✅ Production
  - ✅ Preview
  - ✅ Development (opciono)

---

## 📸 Vizuelni Vodič

```
Vercel Dashboard
  └── [Tvoj Projekat] (klikni)
      └── Settings (tab na vrhu)
          └── Environment Variables (u levom sidebar-u)
              └── Add New (dugme)
                  └── Unesi Key i Value
                      └── Izaberi Environment (Production/Preview/Development)
                          └── Save
```

---

## 🔍 Alternativni Put (Tokom Deployment-a)

Ako importuješ projekat prvi put:

1. **Import Project** → Izaberi GitHub repo
2. **Configure Project** → Scroll down
3. **Environment Variables** → Klikni "Add"
4. Unesi variables
5. **Deploy**

---

## ✅ Checklist

- [ ] Otvoren Vercel Dashboard
- [ ] Projekat otvoren
- [ ] Settings tab kliknut
- [ ] Environment Variables sekcija otvorena
- [ ] `NEXT_PUBLIC_API_URL` dodat
- [ ] `NEXT_PUBLIC_SITE_URL` dodat
- [ ] Environment izabran (Production/Preview/Development)
- [ ] Save kliknut

---

## ⚠️ Važne Napomene

1. **NEXT_PUBLIC_** prefix je obavezan za Next.js environment variables koje treba da budu dostupne u browser-u

2. **Nakon dodavanja variables**, moraš da redeploy projekat:
   - Idi na **Deployments** tab
   - Klikni **"..."** (tri tačke) na poslednjem deployment-u
   - Klikni **"Redeploy"**

3. **Za Development** (lokalno), možeš koristiti `.env.local` fajl u `web/` folderu:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3004
   NEXT_PUBLIC_SITE_URL=http://localhost:3001
   ```

---

## 🎯 Primer Vrednosti

### Za Production:
```
NEXT_PUBLIC_API_URL=https://api.biovera.app
NEXT_PUBLIC_SITE_URL=https://biovera.app
```

### Za Development (lokalno):
```
NEXT_PUBLIC_API_URL=http://localhost:3004
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

---

**Sve spremno! Javi ako ima problema.** 🚀
