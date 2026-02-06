#!/bin/bash

# Bio Vera - Script za pokretanje aplikacija
# Usage: ./START_APPS.sh [backend|mobile|both]

export PATH="/usr/local/opt/postgresql@18/bin:$PATH"

case "$1" in
  backend)
    echo "🚀 Pokretanje Backend servera..."
    cd backend
    npm run start:dev
    ;;
  mobile)
    echo "📱 Pokretanje Mobile aplikacije..."
    cd mobile
    npm start
    ;;
  both)
    echo "🚀 Pokretanje Backend servera u pozadini..."
    cd backend
    npm run start:dev &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    
    sleep 3
    
    echo "📱 Pokretanje Mobile aplikacije..."
    cd ../mobile
    npm start
    
    # Cleanup
    trap "kill $BACKEND_PID" EXIT
    ;;
  *)
    echo "Usage: ./START_APPS.sh [backend|mobile|both]"
    echo ""
    echo "Primeri:"
    echo "  ./START_APPS.sh backend   # Samo backend"
    echo "  ./START_APPS.sh mobile    # Samo mobile"
    echo "  ./START_APPS.sh both      # Oba odjednom"
    exit 1
    ;;
esac
