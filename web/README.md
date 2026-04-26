# Bio Vera Web Application

Next.js web app for the Bio Vera platform.

## Running locally

### 1. Install dependencies

```bash
cd web
npm install
```

### 2. Environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### 3. Start the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:3001`

## Project layout

```
web/
├── app/
│   ├── page.tsx              # Landing (marketplace)
│   ├── login/[type]/         # Login (buyer/producer)
│   ├── buyer/
│   │   ├── shop/             # Product shop
│   │   └── orders/           # Order history
│   └── producer/
│       ├── dashboard/        # Producer dashboard
│       └── scanner/          # QR scanner
├── lib/
│   ├── api.ts                # API helpers (backend)
│   └── auth.tsx              # Auth context and hook
└── package.json
```

## Features

### Landing

- Marketplace product catalog
- Links to buyer/producer login
- Product overview

### Buyer

- **Shop**: Browse products, cart, place orders
- **Orders**: Order history and status

### Producer

- **Dashboard**: Estates, parcels, stats
- **Scanner**: QR scan for seed tracking

## API

The web app talks to the backend at `http://localhost:3000`:

- `POST /auth/login` — Sign in
- `GET /inventory/available` — Available products
- `GET /orders` — Orders
- `POST /orders` — Create order
- `GET /estates` — Estates
- `POST /smart-lock/scan` — QR scan

## Stack

- **Next.js** — React framework
- **TypeScript**
- **Tailwind CSS**
- **Axios** — HTTP client

## Notes

- Run the backend on port 3000
- Auth token is stored in `localStorage`
- For production, set `NEXT_PUBLIC_API_URL` to the production API URL
