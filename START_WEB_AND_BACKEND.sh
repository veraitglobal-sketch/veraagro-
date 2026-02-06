#!/bin/bash

# Bio Vera - Script za pokretanje Backend i Web aplikacije
# Usage: ./START_WEB_AND_BACKEND.sh

echo "🚀 Pokretanje Backend servera..."
cd backend
npm run start:dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
echo "Backend pokrenut na http://localhost:3000"

sleep 5

echo ""
echo "🌐 Pokretanje Web aplikacije..."
cd ../web
npm run dev &
WEB_PID=$!
echo "Web PID: $WEB_PID"
echo "Web aplikacija pokrenuta na http://localhost:3001"

echo ""
echo "✅ Oba servisa su pokrenuta!"
echo "   Backend: http://localhost:3000"
echo "   Web: http://localhost:3001"
echo ""
echo "Za zaustavljanje pritisnite Ctrl+C"

# Cleanup kada se skripta zaustavi
trap "echo 'Zaustavljanje servisa...'; kill $BACKEND_PID $WEB_PID 2>/dev/null; exit" INT TERM

# Čekaj dok korisnik ne pritisne Ctrl+C
wait
