#!/bin/bash

# Bio Vera - Setup Script
# Automatski postavlja sve potrebno za rad

set -e  # Stop on error

echo "🚀 Bio Vera - Setup Script"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backend Setup
echo -e "${YELLOW}📦 Backend Setup...${NC}"
cd backend

if [ ! -f "node_modules/.bin/prisma" ]; then
  echo "Instaliranje backend dependencies..."
  npm install
fi

echo "Generisanje Prisma client-a..."
npx prisma generate

echo "Provera Prisma schema..."
npx prisma validate

echo -e "${GREEN}✅ Backend setup završen${NC}"
echo ""

# 2. Mobile Setup
echo -e "${YELLOW}📱 Mobile Setup...${NC}"
cd ../mobile

if [ ! -d "node_modules" ]; then
  echo "Instaliranje mobile dependencies..."
  npm install
fi

echo "Ažuriranje Expo paketa..."
npx expo install --fix

echo -e "${GREEN}✅ Mobile setup završen${NC}"
echo ""

# 3. File Watchers (macOS)
echo -e "${YELLOW}⚙️  Konfiguracija file watchers...${NC}"
CURRENT_LIMIT=$(ulimit -n)
if [ "$CURRENT_LIMIT" -lt 1024 ]; then
  echo "Povećavanje file watchers limit-a..."
  ulimit -n 10240
  echo "Limit postavljen na: $(ulimit -n)"
else
  echo "File watchers limit je OK: $CURRENT_LIMIT"
fi

# Check if ulimit is in .zshrc
if ! grep -q "ulimit -n 10240" ~/.zshrc 2>/dev/null; then
  echo "Dodavanje ulimit u ~/.zshrc..."
  echo "" >> ~/.zshrc
  echo "# Bio Vera - File watchers limit" >> ~/.zshrc
  echo "ulimit -n 10240" >> ~/.zshrc
  echo -e "${GREEN}✅ Trajno rešenje dodato u .zshrc${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup završen!${NC}"
echo ""
echo "Sledeći koraci:"
echo "1. Backend: cd backend && npm run start:dev"
echo "2. Mobile: cd mobile && ./start.sh"
echo ""
