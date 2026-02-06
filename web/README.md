# Bio Vera Web Aplikacija

Next.js web aplikacija za Bio Vera platformu.

## 🚀 Pokretanje

### 1. Instaliraj zavisnosti
```bash
cd web
npm install
```

### 2. Postavi environment varijable
Kreiraj `.env.local` fajl:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### 3. Pokreni development server
```bash
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:3001`

## 📁 Struktura

```
web/
├── app/
│   ├── page.tsx              # Landing page (marketplace)
│   ├── login/[type]/         # Login stranice (buyer/producer)
│   ├── buyer/
│   │   ├── shop/             # Shop sa proizvodima
│   │   └── orders/           # Istorija porudžbina
│   └── producer/
│       ├── dashboard/        # Producer dashboard
│       └── scanner/          # QR kod scanner
├── lib/
│   ├── api.ts                # API funkcije za komunikaciju sa backend-om
│   └── auth.tsx              # Auth context i hook
└── package.json
```

## 🔑 Funkcionalnosti

### Landing Page
- Marketplace sa katalogom proizvoda
- Linkovi za login (buyer/producer)
- Pregled dostupnih proizvoda

### Buyer Interface
- **Shop**: Pregled proizvoda, dodavanje u korpu, kreiranje porudžbine
- **Orders**: Istorija porudžbina sa statusima

### Producer Interface
- **Dashboard**: Pregled njiva, parcela, statistika
- **Scanner**: QR kod skeniranje za seme

## 🔌 API Integracija

Web aplikacija koristi backend API na `http://localhost:3000`:

- `POST /auth/login` - Prijava
- `GET /inventory/available` - Dostupni proizvodi
- `GET /orders` - Porudžbine
- `POST /orders` - Kreiranje porudžbine
- `GET /estates` - Njive
- `POST /smart-lock/scan` - QR skeniranje

## 🎨 Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## 📝 Napomene

- Backend mora biti pokrenut na portu 3000
- Auth token se čuva u `localStorage`
- Za produkciju, promeniti `NEXT_PUBLIC_API_URL` na produkcijski URL
