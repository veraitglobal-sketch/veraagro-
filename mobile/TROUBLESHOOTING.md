# Bio Vera Mobile - Troubleshooting

## Problem: "There was a problem running the requested app"

### Rešenje 1: Ažuriraj pakete
```bash
npx expo install --fix
```

### Rešenje 2: Povećaj file watchers limit (macOS)
```bash
ulimit -n 10240
```

Ili dodaj u `~/.zshrc`:
```bash
ulimit -n 10240
```

### Rešenje 3: Očisti cache
```bash
npx expo start -c
# ili
rm -rf .expo node_modules
npm install
```

### Rešenje 4: Kreiraj asset fajlove
Ako fali `icon.png`, `splash.png`, ili `adaptive-icon.png`:
- Možeš koristiti placeholder slike
- Ili kreiraj jednostavne slike (1024x1024 za icon)

### Rešenje 5: Proveri da li backend radi
```bash
cd ../backend
npm run start:dev
```

Backend mora biti pokrenut na http://localhost:3000

