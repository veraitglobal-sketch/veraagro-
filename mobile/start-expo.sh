#!/bin/bash

# Expo start script sa optimizacijama za file watcher problem

# Povećaj limit za otvorene fajlove
ulimit -n 65536

# Idi u direktorijum projekta
cd "$(dirname "$0")"

# Pokreni Expo sa tunnel opcijom
EXPO_NO_WATCHMAN=1 npx expo start --tunnel
