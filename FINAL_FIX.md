# Finalno Rešenje za "EMFILE: too many open files"

## Problem
macOS ograničava broj fajlova koje proces može da prati.

## Rešenje 1: Postavi limit pre pokretanja
```bash
cd /Users/jovicamihajlovic/Desktop/veraagrar/mobile
ulimit -n 10240
npx expo start --ios
```

## Rešenje 2: Sačekaj watchman (NAJBOLJE)
Watchman se trenutno instalira. Kada završi (5-10 min), problem će nestati automatski.

Proveri status:
```bash
ps aux | grep watchman
```

Kada watchman završi, samo pokreni:
```bash
npx expo start --ios
```

## Rešenje 3: Trajno rešenje
Dodaj u `~/.zshrc`:
```bash
echo "ulimit -n 10240" >> ~/.zshrc
source ~/.zshrc
```

## VAŽNO: Kako kopirati komande

❌ NE kopiraj:
```
# Kada vidiš grešku:
1. cd backend && npx prisma generate
```

✅ DA kopiraj:
```bash
cd backend && npx prisma generate
```

**Pravilo:** Kopiraj SAMO komande, bez:
- `#` komentara
- `1.`, `2.`, `3.` brojeva  
- Teksta između komandi

