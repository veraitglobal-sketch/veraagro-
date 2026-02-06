#!/bin/bash

# Bio Vera Mobile - Start Script
# Rešava problem sa "too many open files" na macOS

echo "🚀 Pokretanje Bio Vera Mobile..."

# Povećaj file watchers limit (maksimalno)
ulimit -n 65536 2>/dev/null || ulimit -n 10240

# Proveri da li je limit postavljen
CURRENT_LIMIT=$(ulimit -n)
echo "📊 File watchers limit: $CURRENT_LIMIT"

# Proveri da li watchman postoji
if command -v watchman &> /dev/null; then
  echo "✅ Watchman je instaliran - očišćenje starih watch-ova..."
  watchman watch-del-all 2>/dev/null || true
fi

# Očisti cache ako postoji
if [ -d ".expo" ]; then
  echo "🧹 Čišćenje Expo cache-a..."
  rm -rf .expo
fi

# Pokreni Expo sa cleared cache
echo "▶️  Pokretanje Expo servera..."
npx expo start --ios -c
