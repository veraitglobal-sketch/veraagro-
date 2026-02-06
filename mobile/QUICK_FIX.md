# Brzo Rešavanje Grešaka

## Problem 1: Expo SDK verzija ne odgovara
**Greška:** "Project is incompatible with this version of Expo Go"

**Rešenje A (Ažuriraj projekat):**
```bash
cd mobile
npx expo install expo@latest
npx expo install --fix
```

**Rešenje B (Koristi Simulator):**
```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android
```

---

## Problem 2: "EMFILE: too many open files"
**Greška:** macOS ograničava broj fajlova

**Rešenje 1 (Brzo):**
```bash
ulimit -n 10240
npx expo start -c
```

**Rešenje 2 (Trajno - Instaliraj watchman):**
```bash
brew install watchman
```

Nakon instalacije watchman-a, problem nestaje automatski!

**Rešenje 3 (Dodaj u .zshrc):**
```bash
echo "ulimit -n 10240" >> ~/.zshrc
source ~/.zshrc
```

---

## Problem 3: Prisma tipovi nedostaju
```bash
cd backend
npx prisma generate
```

---

## Problem 4: Nedostaju paketi
```bash
npm install
# ili za Expo
npx expo install --fix
```

---

## VAŽNO: Razlika između instrukcija i komandi

Kada vidim tekst kao:
```
# Kada vidiš grešku:
1. cd backend && npx prisma generate
```

To su **instrukcije**, ne komande za kopiranje!

**Kopiraj samo komande:**
```bash
cd backend && npx prisma generate
```

**NE kopiraj:**
- `#` komentare
- `1.`, `2.` brojeve
- Tekst između komandi

