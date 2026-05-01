# Bio Vera

Vertically integrated agrotech platform for Bio-Ready certification and EU market compliance.

## Architecture Overview

Bio Vera is a closed-loop system that controls the entire food production chain from seed to EU market, ensuring immutable digital proof for premium certification.

### Key Principles

1. **Closed-Loop System**: All activities start with QR code scanning from physical seed bags
2. **Anti-Spoofing**: No gallery uploads, GPS timestamp verification, device integrity checks
3. **Digital Passport**: Every GrowthLog is cryptographically signed and immutable
4. **Offline-First**: Works without internet, syncs when connection is available
5. **Role-Based Access**: Farmer, Partner/Agent, Driver, Buyer, Admin, and HubManager levels
6. **Escrow Payment System**: Secure payment held until delivery confirmation
7. **Batch Tracking**: Every box tracked with Batch_ID for full traceability
8. **Dynamic Inventory**: Location-based availability and delivery time calculation
9. **Smart Notifications**: Context-aware notifications for all stakeholders

## Tech Stack

- **Backend**: NestJS + Prisma + PostgreSQL
- **Mobile**: React Native (Expo) + Expo Router + NativeWind
- **Language**: Code in English, UI in Serbian (i18n)

## Project Structure

```
.
├── backend/          # NestJS API server
│   ├── src/
│   │   ├── auth/           # Authentication
│   │   ├── users/          # User management
│   │   ├── estates/        # Estate/parcel management
│   │   ├── seeds/          # Seed management
│   │   ├── parcels/        # Parcel management
│   │   ├── growth-logs/    # Immutable growth logs
│   │   ├── smart-lock/     # QR scanning & validation
│   │   ├── anti-fraud/     # Fraud prevention
│   │   ├── orders/         # Order management
│   │   ├── payments/       # Escrow & split payments
│   │   ├── deliveries/     # Delivery & QR confirmation
│   │   ├── batches/         # Batch tracking
│   │   ├── inventory/      # Dynamic inventory
│   │   ├── wallets/        # Wallet for drivers/farmers
│   │   ├── waybills/       # Automatic waybill generation
│   │   ├── invoices/       # Automatic invoice generation
│   │   ├── notifications/  # Smart notification engine
│   │   └── digital-passports/ # EU export certificates
│   └── prisma/
│       └── schema.prisma   # Complete database schema
└── mobile/           # React Native Expo app
    ├── app/
    │   ├── index.tsx              # Landing page (marketplace)
    │   ├── partner-login.tsx      # Producer login
    │   ├── buyer-login.tsx        # Buyer login
    │   ├── (producer)/            # Producer interface
    │   └── (buyer)/               # Buyer interface
    └── i18n/          # Serbian translations
```

## Key Features

### 1. Smart-Lock System
- Input_Serial_Number is the primary key for any parcel activity
- GPS polygon area must match scanned seed quantity
- Invalid status if area/quantity mismatch

### 2. Anti-Fraud Measures
- Camera-only capture (no gallery access)
- GPS coordinates required for every image
- Network timestamp verification
- Device ID tracking
- System time change detection

### 3. Data Integrity
- SHA-256 hashing for all GrowthLogs
- Immutable logs (no retroactive changes)
- Cryptographic linking to Parcel ID and PartnerCode

### 4. Escrow Payment System
- Payment locked in escrow when buyer pays
- Automatic split payment on delivery confirmation:
  - 70% to Farmer
  - 20% to Driver
  - 10% Platform fee
- Digital Handshake: Customer scans QR to confirm delivery

### 5. Batch Tracking
- Every box/crate has unique Batch_ID
- One-click traceability:
  - Who harvested
  - Who transported
  - Which hub stored it
  - Quality issue reporting

### 6. Dynamic Inventory
- Location-based availability
- Delivery time calculation based on distance
- If product in Niš, buyer in Subotica sees longer delivery time
- Real-time availability updates

### 7. Smart Notifications
- **Farmer**: "Kombi stiže za 20 min"
- **Driver**: "Nova tura u tvojoj blizini"
- **Buyer**: "Tvoj Bio paket je spakovan"
- Context-aware, role-based notifications

### 8. Automatic Documentation
- PDF waybills generated automatically on delivery assignment
- PDF invoices generated automatically
- Email delivery to relevant parties
- Cryptographic hashing for integrity

## Getting Started

### Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Mobile Setup

```bash
cd mobile
npm install
npx expo start
```

## Database Schema

The Prisma schema includes:

- **Users**: Farmer, Driver, Buyer, Admin, Partner, HubManager
- **Estates & Parcels**: GPS polygon tracking
- **Seeds**: QR code tracking
- **GrowthLogs**: Immutable, cryptographically signed
- **Orders**: E-commerce orders
- **Payments**: Escrow and split payments
- **Deliveries**: Delivery lifecycle with QR confirmation
- **Batches**: Full traceability for every box
- **Inventory**: Location-based availability
- **Hubs**: Warehouse management
- **Wallets**: Driver and farmer earnings
- **Waybills & Invoices**: Automatic PDF generation
- **Notifications**: Smart notification engine
- **Trust Scores**: Reputation system
- **Ratings**: Quality feedback

## Business Logic

### Escrow Flow
1. Buyer places order and pays
2. Payment locked in escrow
3. Delivery assigned to driver
4. Driver picks up from farmer
5. Driver delivers to buyer
6. Buyer scans QR code
7. Payment automatically released and split

### Batch Traceability
1. Farmer harvests and creates batch
2. Batch moved to hub
3. Batch assigned to order
4. Batch delivered to customer
5. If quality issue: One-click traceability shows entire chain

### Dynamic Inventory
1. Product added to hub inventory
2. System calculates available cities
3. Buyer searches by location
4. System shows delivery time based on distance
5. Unavailable if too far (>500km)

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/biovera_db"

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Payment Split (percentages)
PAYMENT_FARMER_PERCENTAGE=70
PAYMENT_DRIVER_PERCENTAGE=20
PAYMENT_PLATFORM_FEE=10

# Time Validation
MAX_TIME_OFFSET=300
```

## API Endpoints

### Authentication
- `POST /auth/login` - Login with PartnerCode

### Orders
- `POST /orders` - Create order
- `GET /orders` - Get buyer's orders
- `POST /orders/:id/pay` - Initiate payment

### Deliveries
- `POST /deliveries/assign` - Assign delivery to driver
- `POST /deliveries/:id/pickup` - Mark picked up
- `POST /deliveries/confirm/:qrCode` - Confirm delivery (QR scan)

### Batches
- `POST /batches` - Create batch
- `GET /batches/:batchId/traceability` - Get full traceability
- `POST /batches/:batchId/report-issue` - Report quality issue

### Inventory
- `GET /inventory/available?city=Subotica` - Get available products

### Wallets
- `GET /wallets/me` - Get wallet balance
- `GET /wallets/me/transactions` - Get transaction history

## Mobile App Routes

### Landing (Marketplace)
- `/` - Product catalog, categories, premium estates

### Buyer Routes
- `/buyer-login` - Buyer authentication
- `/(buyer)/shop` - Product catalog
- `/(buyer)/orders` - Order history
- `/(buyer)/vera-standard` - Certification info
- `/(buyer)/profile` - Profile & delivery address

### Producer Routes
- `/partner-login` - Producer authentication
- `/(producer)/(tabs)` - Producer home (dashboard)
- `/(producer)/estates` - Estate management
- `/(producer)/scanner` - QR code scanner
- `/(producer)/growth-journal` - Growth log

## License

UNLICENSED - Proprietary
