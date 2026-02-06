# Zašto se često javljaju greške?

## Glavni uzroci:

### 1. 🔴 **Različite verzije paketa**
**Problem:** Expo Go na telefonu je SDK 54, projekat je SDK 50.

**Zašto se dešava:**
- Expo Go se automatski ažurira na App Store-u
- Projekat koristi stariju verziju
- Neusaglašenost izaziva greške

**Rešenje:**
- Koristi iOS Simulator (nema problema sa verzijama)
- Ili ažuriraj projekat na SDK 54 (može biti komplikovano)

---

### 2. 🔴 **macOS File Watchers Limit**
**Problem:** macOS ograničava broj fajlova (default: 256).

**Zašto se dešava:**
- Expo/Metro prati HUNDREDS fajlova
- Svaki fajl = 1 file watcher
- Limit se brzo prelazi

**Rešenje:**
```bash
# Brzo
ulimit -n 10240

# Trajno (NAJBOLJE)
brew install watchman
```

---

### 3. 🟡 **Prisma Client nije generisan**
**Problem:** Nakon promene `schema.prisma`, tipovi nisu ažurirani.

**Zašto se dešava:**
- Prisma generiše TypeScript tipove iz schema
- Ako nisi pokrenuo `prisma generate`, tipovi su stari
- TypeScript vidi greške koje ne postoje

**Rešenje:**
```bash
cd backend
npx prisma generate
```

**Kada:** Svaki put kada promeniš `schema.prisma`

---

### 4. 🟡 **Cache problemi**
**Problem:** Stari cache konflikuje sa novim kodom.

**Zašto se dešava:**
- Metro bundler kešira build-ove
- Ako promeniš kod, cache može biti zastareo
- Vidiš greške koje više ne postoje

**Rešenje:**
```bash
npx expo start -c  # -c = clear cache
```

---

### 5. 🟡 **Nedostaju dependencies**
**Problem:** Novi paketi se koriste, ali nisu instalirani.

**Zašto se dešava:**
- Dodao si `import` u kod
- Zaboravio si `npm install`
- Node ne može da nađe paket

**Rešenje:**
```bash
npm install
# ili za Expo
npx expo install --fix
```

---

## Kako izbeći greške?

### 1. **Koristi setup.sh skriptu**
```bash
./setup.sh
```
Automatski rešava većinu problema!

### 2. **Koristi simulator umesto Expo Go**
```bash
npx expo start --ios
```
Nema problema sa verzijama!

### 3. **Instaliraj watchman**
```bash
brew install watchman
```
Trajno rešava file watchers problem!

### 4. **Redovno ažuriraj Prisma**
```bash
cd backend
npx prisma generate
```

### 5. **Očisti cache redovno**
```bash
npx expo start -c
```

---

## Checklist pre pokretanja:

- [ ] `cd backend && npx prisma generate`
- [ ] `cd mobile && ulimit -n 10240` (ili instaliraj watchman)
- [ ] `npm install` (ako si dodao nove pakete)
- [ ] `npx expo start -c` (ako vidiš čudne greške)

