# Zašto se često javljaju greške?

## 1. **Prisma Client nije generisan** 🔴
**Problem:** Nakon promena u `schema.prisma`, TypeScript ne vidi nove tipove.

**Rešenje:**
```bash
cd backend
npx prisma generate
```

**Kada:** Svaki put kada promeniš `schema.prisma`

---

## 2. **File Watchers Limit (macOS)** 🔴
**Problem:** macOS ograničava broj fajlova koje proces može da prati (default: 256).

**Rešenje:**
```bash
ulimit -n 10240
```

**Trajno rešenje:**
```bash
# Dodaj u ~/.zshrc
echo "ulimit -n 10240" >> ~/.zshrc

# Ili instaliraj watchman
brew install watchman
```

**Kada:** Svaki put kada pokrećeš Expo/Metro bundler

---

## 3. **Nedostaju Dependencies** 🟡
**Problem:** Novi paketi se dodaju u kod, ali nisu instalirani.

**Rešenje:**
```bash
npm install
# ili
npx expo install --fix  # za Expo pakete
```

**Kada:** Nakon dodavanja novih importa ili paketa

---

## 4. **TypeScript Tipovi** 🟡
**Problem:** NativeWind, Prisma, ili drugi paketi ne eksportuju tipove.

**Rešenje:**
- Za NativeWind: `nativewind-env.d.ts` mora postojati
- Za Prisma: `npx prisma generate`
- Proveri `tsconfig.json` include/exclude

---

## 5. **Cache Problemi** 🟡
**Problem:** Stari cache podaci konflikuju sa novim kodom.

**Rešenje:**
```bash
# Backend
rm -rf node_modules dist
npm install
npm run build

# Mobile
rm -rf .expo node_modules
npm install
npx expo start -c
```

---

## 6. **Asset Fajlovi Nedostaju** 🟢
**Problem:** `app.json` referencira fajlove koji ne postoje.

**Rešenje:**
- Privremeno ukloni reference iz `app.json`
- Ili kreiraj placeholder fajlove

---

## PREVENTIVNE MERE:

### 1. Kreiraj `setup.sh` skriptu:
```bash
#!/bin/bash
# Backend setup
cd backend
npm install
npx prisma generate
npx prisma migrate dev

# Mobile setup  
cd ../mobile
npm install
ulimit -n 10240
```

### 2. Koristi `.gitignore` pravilno:
```
node_modules/
.expo/
dist/
.env
```

### 3. Redovno ažuriraj pakete:
```bash
npm outdated
npm update
```

### 4. Proveri pre commit-a:
```bash
# Backend
npm run build

# Mobile
npx tsc --noEmit
```

