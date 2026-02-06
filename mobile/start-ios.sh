#!/bin/bash

# Bio Vera Mobile - iOS Simulator Start
# Rešava problem sa "too many open files"

cd "$(dirname "$0")"

echo "🚀 Pokretanje Bio Vera Mobile za iOS Simulator..."

# Povećaj file watchers limit (maksimalno)
ulimit -n 65536 2>/dev/null || ulimit -n 10240

CURRENT_LIMIT=$(ulimit -n)
echo "📊 File watchers limit: $CURRENT_LIMIT"

# Proveri watchman
if command -v watchman &> /dev/null; then
  echo "✅ Watchman je instaliran"
  watchman watch-del-all 2>/dev/null || true
else
  echo "⚠️  Watchman nije instaliran - preporučeno: brew install watchman"
fi

# Očisti cache
if [ -d ".expo" ]; then
  echo "🧹 Čišćenje cache-a..."
  rm -rf .expo
fi

# Pokreni Expo
echo "▶️  Pokretanje Expo servera..."
npx expo start --ios -c

