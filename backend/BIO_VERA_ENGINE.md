# Bio Vera Engine - Backend Architecture

## Overview

The Bio Vera Engine is the core backend system that powers the entire platform, connecting growers, logistics partners, and buyers through automated workflows and real-time tracking.

## Core Features

### 1. Dynamic Pricing Engine

**MarketPrices Table**: Admin-controlled daily buy/sell prices for each crop type.

- **Endpoint**: `POST /market-prices` (SuperAdmin only)
- **Endpoint**: `GET /market-prices/current/:cropType` - Get current active price
- **Endpoint**: `GET /market-prices/history/:cropType` - Get price history

**Features**:
- Automatic price reference in all transactions
- Price history tracking
- Effective date ranges
- Automatic deactivation of old prices when new ones are set

### 2. Grower-Logistics Linking

**Missions System**: When a Grower clicks "Ready for Pickup", the system automatically:

1. Finds nearest Logistics Partner with available Frigo-vehicle
2. Calculates optimal route using distance calculation (can be upgraded to Maps API)
3. Creates a "Mission" and assigns it to the driver
4. Sends notification to driver's phone

**Endpoints**:
- `POST /missions` (Grower) - Create mission when ready for pickup
- `PUT /missions/:id/accept` (Logistics Partner) - Accept mission
- `GET /missions/my-missions` - Get user's missions

**Features**:
- Automatic partner matching based on proximity
- Route optimization calculation
- Real-time mission status tracking
- Vehicle assignment

### 3. Freshness Tracking (The Countdown)

**FreshnessTracker**: Every batch has a timestamp_harvested and calculated remaining_shelf_life.

**Shelf Life by Crop**:
- Raspberries: 48 hours
- Blackberries: 48 hours
- Blueberries: 48 hours
- Apples: 30 days
- Peppers: 14 days

**Features**:
- Automatic calculation of remaining shelf life
- Expiration alerts
- Batch expiration tracking
- Real-time freshness status

**Service Methods**:
- `createFreshnessTracker(batchId, cropType)` - Create tracker on batch creation
- `calculateRemainingShelfLife(batchId)` - Get current remaining hours
- `getBatchesExpiringSoon()` - Get batches expiring in next 24 hours
- `getExpiredBatches()` - Get all expired batches

### 4. Multi-User Roles

**Role Permissions**:

- **SUPER_ADMIN**: Full control over prices, global monitoring, all data access
- **COORDINATOR**: Can verify quality, lock/unlock batches in field, view audit trails
- **GROWER**: Can report harvests, see own payment status, create missions
- **LOGISTICS_PARTNER**: Can see assigned routes, report chamber temperature, accept missions

**Implementation**:
- Role-based access control (RBAC) using `@Roles()` decorator
- JWT authentication with role claims
- Guard-based route protection

### 5. Audit Trail (AEO Compliance)

**AuditTrail Table**: Every change in temperature, location, or status is logged.

**Event Types**:
- `TEMPERATURE_CHANGE` - Temperature readings
- `LOCATION_CHANGE` - GPS location updates
- `STATUS_CHANGE` - Mission/batch status changes
- `QUALITY_CHECK` - Coordinator quality verifications
- `BATCH_LOCKED` - Batch locked by coordinator
- `BATCH_UNLOCKED` - Batch unlocked
- `PAYMENT_RELEASED` - Payment transactions
- `PRICE_UPDATED` - Market price changes

**Endpoints**:
- `POST /audit-trail` - Create audit entry
- `GET /audit-trail/entity/:entityType/:entityId` - Get audit trail for entity
- `GET /audit-trail/event-type/:eventType` - Get events by type
- `GET /audit-trail/compliance` - Get compliance report (SuperAdmin)

**Features**:
- Immutable audit logs
- Device tracking for fraud prevention
- IP address and user agent logging
- Compliance rate calculation
- Full traceability for AEO certification

### 6. Temperature Monitoring

**TemperatureLog Table**: Real-time temperature and humidity tracking.

**Endpoints**:
- `POST /temperature/log` (Logistics Partner) - Log temperature reading
- `GET /temperature/batch/:batchId` - Get temperature history for batch
- `GET /temperature/mission/:missionId` - Get temperature history for mission
- `GET /temperature/alerts` - Get out-of-range alerts

**Features**:
- Automatic out-of-range detection (0-12°C)
- Real-time alerts
- Temperature history tracking
- Automatic audit trail creation
- Sensor and device tracking

## Database Schema

### New Models Added:

1. **MarketPrice** - Dynamic pricing for crops
2. **Mission** - Grower-Logistics linking
3. **Vehicle** - Frigo-fleet management
4. **FreshnessTracker** - Shelf life tracking
5. **AuditTrail** - AEO compliance logging
6. **TemperatureLog** - Temperature monitoring
7. **LocationLog** - GPS tracking
8. **Transaction** - Price-referenced transactions

## API Structure

```
/market-prices          - Pricing engine
/missions              - Grower-Logistics linking
/temperature           - Temperature monitoring
/audit-trail           - Compliance tracking
/freshness             - Shelf life tracking (via service)
```

## Next Steps

1. **Run Migration**: `npm run prisma:migrate dev --name bio_vera_engine`
2. **Generate Prisma Client**: `npm run prisma:generate`
3. **Test Endpoints**: Use Postman or similar to test all endpoints
4. **Integrate Maps API**: Replace simple distance calculation with Google Maps API
5. **Add Notifications**: Implement push notifications for mission assignments
6. **Add Webhooks**: Set up webhooks for real-time updates

## Environment Variables

Add to `.env`:
```
GOOGLE_MAPS_API_KEY=your_key_here  # For route optimization
```

## Testing

Test the system by:
1. Creating a market price (SuperAdmin)
2. Creating a mission (Grower)
3. Accepting mission (Logistics Partner)
4. Logging temperature (Logistics Partner)
5. Viewing audit trail (Coordinator/SuperAdmin)
