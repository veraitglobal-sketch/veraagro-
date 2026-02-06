#!/bin/bash
# Brzo pokretanje bez čekanja Watchman-a
ulimit -n 65536
export EXPO_NO_WATCHMAN=1
cd /Users/jovicamihajlovic/Desktop/veraagrar/mobile
npx expo start --web
