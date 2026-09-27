# 🔧 Railway Crash Fix - JWT_SECRET Missing

## ❌ Problem

Backend crashuje sa greškom:
```
ERROR [ExceptionHandler] JwtStrategy requires a secret or key
TypeError: JwtStrategy requires a secret or key
```

**Uzrok:** `JWT_SECRET` environment variable nedostaje ili je prazan.

---

## ✅ Rešenje

### Korak 1: Dodaj JWT_SECRET u Railway

1. **Railway Dashboard** → Projekat → Service
2. **Settings** → **Variables**
3. Klikni **"New Variable"**
4. Unesi:
   - **Key**: `JWT_SECRET`
   - **Value**: Generiši jak secret (npr. `your-super-secret-jwt-key-here-min-32-chars`)
5. **Save**

---

### Korak 2: Generiši JWT Secret

**Opcija A: Koristi Online Generator**
- Idi na: https://generate-secret.vercel.app/32
- Kopiraj generisani secret
- Dodaj ga u Railway kao `JWT_SECRET`

**Opcija B: Generiši Lokalno**
```bash
# Generiši random secret
openssl rand -base64 32
```

**Opcija C: Koristi Ovaj (za development):**
```
bio-vera-jwt-secret-key-2026-production-min-32-chars
```

---

### Korak 3: Restart Service

1. Railway Dashboard → Service
2. Klikni **"Restart"** dugme
3. Sačekaj da se restart-uje

---

## 📋 Svi Potrebni Environment Variables

Dodaj u Railway → Settings → Variables:

```
# Database (najvažnije!)
DATABASE_URL=postgresql://... (automatski ako si dodao PostgreSQL)

# JWT (REŠAVA CRASH!)
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars

# Server
PORT=3000
NODE_ENV=production

# Email
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_DK2V8Wuf_LN6rRPUa3D8Jq1VbiisETech
EMAIL_FROM=info@biovera.app
ADMIN_EMAIL=info@biovera.app

# Frontend
FRONTEND_URL=https://biovera.app
```

---

## ✅ Checklist

- [ ] PostgreSQL database dodat (na projekat level)
- [ ] `DATABASE_URL` postoji (automatski ako si dodao PostgreSQL)
- [ ] `JWT_SECRET` dodat (generiši jak secret, min 32 karaktera)
- [ ] `PORT=3000` dodat
- [ ] `NODE_ENV=production` dodat
- [ ] Service restart-ovan

---

## 🎯 Nakon Dodavanja JWT_SECRET

1. **Restart service** (klikni "Restart")
2. **Proveri logs** - trebalo bi da vidiš:
   ```
   [Nest] LOG [NestApplication] Nest application successfully started
   ```
3. **Proveri status** - trebalo bi da bude "Active" ili "Live"

---

## 🆘 Ako i Dalje Ne Radi

**Proveri:**
1. Da li je `JWT_SECRET` tačno napisan (bez razmaka)
2. Da li je `JWT_SECRET` dovoljno dug (min 32 karaktera)
3. Da li je service restart-ovan nakon dodavanja variable

**Pošalji mi:**
- Railway logs (poslednje 20 linija nakon restart-a)

---

**Dodaj `JWT_SECRET` i restart-uj service - to će rešiti crash!** 🚀
