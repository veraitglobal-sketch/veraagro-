# Bio Vera - Status Aplikacije

## 🚀 Pokrenuto:

### Backend Server
- **Status:** ✅ Pokrenut u pozadini
- **Port:** 3000
- **URL:** http://localhost:3000
- **Proces:** `npm run start:dev`

### Mobile Aplikacija
- **Status:** ✅ Pokrenut u pozadini
- **Platforma:** iOS Simulator
- **Expo Server:** Pokrenut
- **File Watchers Limit:** 65536

## 📊 Provera Statusa:

### Proveri da li backend radi:
```bash
curl http://localhost:3000
```

### Proveri procese:
```bash
ps aux | grep -E "node|expo" | grep -v grep
```

### Proveri portove:
```bash
lsof -i :3000  # Backend
lsof -i :8081  # Expo Metro
```

## 🛑 Zaustavljanje:

### Zaustavi backend:
```bash
pkill -f "npm run start:dev"
```

### Zaustavi mobile:
```bash
pkill -f "expo start"
```

### Zaustavi sve:
```bash
pkill -f "npm run start:dev"
pkill -f "expo start"
```

## 📱 Pristup Aplikaciji:

1. **iOS Simulator:** Trebalo bi da se otvori automatski
2. **Expo Go:** Skeniraj QR kod koji se pojavi u terminalu
3. **Web:** Otvori http://localhost:8081 u browseru

## ⚠️ Ako ne radi:

1. Proveri da li su procesi pokrenuti:
   ```bash
   ps aux | grep -E "node|expo"
   ```

2. Proveri logove u terminalu gde su pokrenuti

3. Restartuj:
   ```bash
   # Zaustavi sve
   pkill -f "npm run start:dev"
   pkill -f "expo start"
   
   # Pokreni ponovo
   cd backend && npm run start:dev &
   cd ../mobile && ./start-ios.sh &
   ```

