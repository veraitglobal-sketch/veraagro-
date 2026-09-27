# 🔧 Railway Build Fix - "Error creating build plan with Railpack"

## ❌ Problem

Railway ne može automatski da detektuje kako da build-uje NestJS backend.

**Greška:** "Error creating build plan with Railpack"

---

## ✅ Rešenje

### Korak 1: Proveri Railway Settings

1. **Otvori Railway Dashboard**
   - Idi na: https://railway.app/dashboard
   - Klikni na projekat "BioVera"
   - Klikni na service

2. **Otvori Settings Tab**

3. **Proveri Source Sekciju:**
   - **Root Directory**: `backend` (MORA biti tačno `backend`)
   - Save

4. **Proveri Build & Deploy Sekciju:**
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npm run start:prod`
   - Save

---

### Korak 2: Dodaj PostgreSQL Database

1. **U Railway Dashboard** (projekat level, ne service level)
2. Klikni **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway automatski doda `DATABASE_URL` environment variable

---

### Korak 3: Proveri Environment Variables

U Railway → Service → Settings → Variables, dodaj:

```
DATABASE_URL=postgresql://... (automatski ako si dodao PostgreSQL)
JWT_SECRET=your-jwt-secret-here
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_DK2V8Wuf_LN6rRPUa3D8Jq1VbiisETech
EMAIL_FROM=info@biovera.app
ADMIN_EMAIL=info@biovera.app
FRONTEND_URL=https://biovera.app
PORT=3000
NODE_ENV=production
```

---

### Korak 4: Alternativno - Koristi Nixpacks

Ako i dalje ne radi, probaj:

1. Settings → **Builder**: Promeni na **"Nixpacks"** (umesto "Railpack")
2. Save
3. Redeploy

---

### Korak 5: Ako Nixpacks Ne Radi

1. Settings → **Builder**: Promeni na **"Dockerfile"**
2. Kreiraj `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "run", "start:prod"]
```

3. Save i redeploy

---

## 📋 Checklist

- [ ] Root Directory: `backend` (u Settings)
- [ ] Build Command: `npm install && npm run build && npx prisma generate`
- [ ] Start Command: `npm run start:prod`
- [ ] PostgreSQL database dodat (na projekat level)
- [ ] Environment Variables dodati
- [ ] Builder: Nixpacks ili Dockerfile (ako Railpack ne radi)
- [ ] Redeploy pokrenut

---

## 🆘 Ako i Dalje Ne Radi

**Pošalji mi:**
1. Railway Settings screenshot (Source i Build & Deploy sekcije)
2. Railway logs (View logs → poslednje 50 linija)

Pa ću ti pomoći da rešimo! 🔍
