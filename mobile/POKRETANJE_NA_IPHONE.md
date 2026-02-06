# 📱 Kako pokrenuti aplikaciju na iPhone 15 Pro Max

## Metoda 1: Preko Expo Go aplikacije (NAJLAKŠE) ⭐

### Korak 1: Instaliraj Expo Go na iPhone
1. Otvori **App Store** na iPhone-u
2. Pretraži **"Expo Go"**
3. Instaliraj aplikaciju

### Korak 2: Pokreni Expo server
```bash
cd mobile
npm start
```

Ili koristi skriptu:
```bash
cd mobile
./start-expo.sh
```

### Korak 3: Skeniraj QR kod
1. Kada se Expo server pokrene, videćeš **QR kod** u terminalu
2. Otvori **Expo Go** aplikaciju na iPhone-u
3. Skeniraj QR kod:
   - **Opcija A:** Koristi kameru u Expo Go aplikaciji
   - **Opcija B:** Koristi iPhone kameru (ako je QR kod na ekranu)

### Korak 4: Sačekaj da se aplikacija učita
- Expo Go će preuzeti i pokrenuti aplikaciju
- Prvi put može potrajati 1-2 minuta

---

## Metoda 2: Preko Tunnel-a (ako nisi na istom WiFi-ju)

### Korak 1: Pokreni sa tunnel opcijom
```bash
cd mobile
npx expo start --tunnel
```

### Korak 2: Skeniraj QR kod
- Koristi Expo Go aplikaciju da skeniraš QR kod
- Tunnel omogućava povezivanje preko interneta (ne zahteva isti WiFi)

---

## Metoda 3: Preko LAN-a (isti WiFi)

### Korak 1: Proveri da su oba uređaja na istom WiFi-ju
- Mac i iPhone moraju biti na istom WiFi mreži

### Korak 2: Pokreni Expo
```bash
cd mobile
npx expo start --lan
```

### Korak 3: Skeniraj QR kod
- Koristi Expo Go aplikaciju

---

## Metoda 4: Direktno na iPhone (bez Expo Go)

### Korak 1: Build aplikacije
```bash
cd mobile
npm run build:ios
```

### Korak 2: Instaliraj na iPhone
- Koristi EAS Build ili Xcode
- Ovo zahteva Apple Developer account

---

## 🔧 Troubleshooting

### Problem: "Unable to connect to Expo"
**Rešenje:**
1. Proveri da li su Mac i iPhone na istom WiFi-ju
2. Ili koristi `--tunnel` opciju:
   ```bash
   npx expo start --tunnel
   ```

### Problem: QR kod se ne skenira
**Rešenje:**
1. Koristi Expo Go aplikaciju umesto iPhone kamere
2. Ili unesi URL ručno u Expo Go

### Problem: Aplikacija se ne učitava
**Rešenje:**
1. Očisti cache:
   ```bash
   cd mobile
   rm -rf .expo
   npx expo start -c
   ```

### Problem: "Too many open files"
**Rešenje:**
```bash
cd mobile
./start-ios.sh
```

---

## 📝 Brzi Start (Preporučeno)

```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Mobile
cd mobile
npm start

# Zatim skeniraj QR kod sa iPhone-a (Expo Go aplikacija)
```

---

## 💡 Saveti

1. **Koristi Expo Go** - najlakši način za development
2. **Tunnel mode** - ako nisi na istom WiFi-ju
3. **LAN mode** - najbrži, ali zahteva isti WiFi
4. **Hot Reload** - automatski se osvežava kada menjaš kod

---

## 🎯 Najbrži način:

```bash
cd mobile
npm start
# Skeniraj QR kod sa iPhone-a u Expo Go aplikaciji
```
