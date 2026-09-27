# 📦 Deployment FAQ - Kada Treba Redeploy?

## ❓ Pitanje: Da li treba redeploy kada radimo DNS izmene?

### ✅ Odgovor: **NE!**

**DNS izmene ne zahtevaju redeploy backend-a ili frontend-a.**

---

## 📋 Kada Treba Redeploy?

### 1. ✅ **DNS Izmene** → **NE treba redeploy**

**Primeri:**
- Dodavanje DNS zapisa u IONOS (DKIM, SPF, DMARC)
- Promena DNS zapisa
- DNS propagacija

**Zašto ne treba redeploy:**
- DNS izmene su van aplikacije
- Backend i frontend ne zavise od DNS zapisa direktno
- Email servisi (Resend) proveravaju DNS automatski

**Šta treba:**
- Sačekaj DNS propagaciju (5-30 minuta)
- Klikni "Verify" u Resend dashboard-u

---

### 2. ✅ **Environment Variables (samo u dashboard-u)** → **Treba redeploy**

**Primeri:**
- Dodavanje `NEXT_PUBLIC_API_URL` u Vercel
- Dodavanje `SMTP_PASS` u Railway
- Promena `JWT_SECRET` u Railway

**Zašto treba redeploy:**
- Environment variables se učitavaju pri startu aplikacije
- Ako promeniš u dashboard-u, aplikacija mora da se restart-uje

**Kako:**
- **Vercel**: Automatski redeploy nakon promene env vars (ili ručno)
- **Railway**: Automatski redeploy nakon promene env vars (ili ručno)

**Git push:** ❌ **NE treba** (samo promene u dashboard-u)

---

### 3. ✅ **Kod Izmene** → **Treba redeploy**

**Primeri:**
- Promena u `backend/src/email/email.service.ts`
- Promena u `web/app/login/page.tsx`
- Dodavanje novih fajlova
- Bug fixes

**Zašto treba redeploy:**
- Aplikacija mora da se rebuild-uje sa novim kodom

**Kako:**
1. **Git push:**
   ```bash
   git add .
   git commit -m "fix: email service update"
   git push origin main
   ```

2. **Automatski redeploy:**
   - **Vercel**: Automatski redeploy nakon git push
   - **Railway**: Automatski redeploy nakon git push

---

### 4. ✅ **Database Migracije** → **Treba redeploy (backend)**

**Primeri:**
- Dodavanje novih tabela
- Promena schema
- Dodavanje novih kolona

**Zašto treba redeploy:**
- Migracije se pokreću pri startu backend-a
- Backend mora da se restart-uje da bi migracije bile primenjene

**Kako:**
1. **Git push:**
   ```bash
   git add backend/prisma/schema.prisma
   git commit -m "feat: add new table"
   git push origin main
   ```

2. **Automatski redeploy:**
   - Railway automatski redeploy-uje backend
   - Migracije se pokreću automatski (u `main.ts`)

---

## 🎯 Trenutna Situacija

### Šta trenutno radimo:
- ✅ **DNS izmene** (dodavanje DNS zapisa u IONOS)

### Da li treba redeploy?
- ❌ **NE!** DNS izmene ne zahtevaju redeploy

### Šta treba:
1. Sačekaj DNS propagaciju (15-30 minuta)
2. Proveri online (mxtoolbox.com)
3. Klikni "Verify" u Resend dashboard-u

---

## 📊 Tabela: Kada Treba Redeploy?

| Tip Izmene | Git Push | Redeploy | Vreme |
|------------|----------|----------|-------|
| **DNS izmene** | ❌ | ❌ | 0 min |
| **Env vars (dashboard)** | ❌ | ✅ | 1-2 min |
| **Kod izmene** | ✅ | ✅ | 2-5 min |
| **Database migracije** | ✅ | ✅ | 2-5 min |

---

## 🔧 Kako da Redeploy-uješ

### Vercel (Frontend):

**Automatski:**
- Git push na `main` branch → automatski redeploy

**Ručno:**
1. Vercel Dashboard → tvoj projekat
2. Deployments tab
3. Klikni "..." pored deployment-a
4. Klikni "Redeploy"

**Nakon env vars promene:**
- Vercel automatski redeploy-uje
- Ili klikni "Redeploy" ručno

---

### Railway (Backend):

**Automatski:**
- Git push na `main` branch → automatski redeploy

**Ručno:**
1. Railway Dashboard → tvoj servis
2. Deployments tab
3. Klikni "Redeploy"

**Nakon env vars promene:**
- Railway automatski redeploy-uje
- Ili klikni "Redeploy" ručno

---

## 💡 Best Practices

### 1. **DNS Izmene:**
- ✅ Dodaj zapise u DNS panel
- ✅ Sačekaj propagaciju
- ✅ Proveri online
- ❌ **NE treba redeploy**

### 2. **Environment Variables:**
- ✅ Promeni u dashboard-u (Vercel/Railway)
- ✅ Redeploy aplikaciju
- ❌ **NE treba git push** (ako samo promenjuješ env vars)

### 3. **Kod Izmene:**
- ✅ Promeni kod lokalno
- ✅ Git push
- ✅ Automatski redeploy
- ✅ Proveri da li radi

### 4. **Database Migracije:**
- ✅ Promeni `schema.prisma`
- ✅ Git push
- ✅ Automatski redeploy (migracije se pokreću automatski)
- ✅ Proveri da li su migracije primenjene

---

## 🆘 Troubleshooting

### Problem: "DNS izmene ne rade"

**Rešenje:**
- ❌ **NE redeploy-uj** - to neće pomoći
- ✅ Sačekaj DNS propagaciju (15-30 minuta)
- ✅ Proveri online (mxtoolbox.com)
- ✅ Proveri da li su zapisi tačno dodati

### Problem: "Env vars ne rade"

**Rešenje:**
- ✅ Proveri da li su env vars dodati u dashboard-u
- ✅ **Redeploy aplikaciju** (env vars se učitavaju pri startu)
- ✅ Proveri da li su env vars tačno postavljeni

### Problem: "Kod izmene ne rade"

**Rešenje:**
- ✅ Proveri da li si git push-ovao
- ✅ Proveri da li je redeploy završen
- ✅ Proveri logs za greške

---

## ✅ Rezime

**Trenutno radimo DNS izmene → ❌ NE treba redeploy!**

Samo sačekaj DNS propagaciju i proveri u Resend dashboard-u. Emailovi će raditi automatski kada se DNS propagira, bez redeploy-a! 🎉
