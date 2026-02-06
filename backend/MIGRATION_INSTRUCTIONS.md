# Bio Vera Engine - Migration Instructions

## Step 1: Create Database Migration

```bash
cd backend
npm run prisma:migrate dev --name bio_vera_engine
```

This will:
- Create new tables: MarketPrice, Mission, Vehicle, FreshnessTracker, AuditTrail, TemperatureLog, LocationLog, Transaction
- Add new roles: SUPER_ADMIN, COORDINATOR, GROWER, LOGISTICS_PARTNER
- Add new relationships to existing models

## Step 2: Generate Prisma Client

```bash
npm run prisma:generate
```

## Step 3: Create SuperAdmin User

You need to manually create a SuperAdmin user in the database or via API:

```sql
-- Example SQL (adjust as needed)
INSERT INTO users (id, "partnerCode", email, "firstName", "lastName", role, status, "passwordHash")
VALUES (
  gen_random_uuid(),
  'ADMIN-001',
  'admin@biovera.com',
  'Super',
  'Admin',
  'SUPER_ADMIN',
  'ACTIVE',
  '$2b$10$...' -- bcrypt hash of password
);
```

Or use the existing auth endpoint to create users, then update role manually.

## Step 4: Test the System

### 1. Test Market Prices (SuperAdmin)

```bash
# Create a market price
POST http://localhost:3000/market-prices
Authorization: Bearer <super_admin_token>
{
  "cropType": "Raspberry",
  "buyPrice": 5.50,
  "sellPrice": 8.00
}

# Get current price
GET http://localhost:3000/market-prices/current/Raspberry
```

### 2. Test Missions (Grower)

```bash
# Create mission when ready for pickup
POST http://localhost:3000/missions
Authorization: Bearer <grower_token>
{
  "batchId": "batch-uuid",
  "pickupLocation": {
    "lat": 44.7866,
    "lng": 20.4489,
    "address": "Farm Address"
  },
  "pickupAddress": "Farm Address, City"
}
```

### 3. Test Temperature Logging (Logistics Partner)

```bash
# Log temperature
POST http://localhost:3000/temperature/log
Authorization: Bearer <logistics_partner_token>
{
  "missionId": "mission-uuid",
  "batchId": "batch-uuid",
  "vehicleId": "vehicle-uuid",
  "temperature": 4.5,
  "humidity": 65,
  "location": {
    "lat": 44.7866,
    "lng": 20.4489,
    "address": "Current Location"
  }
}
```

### 4. Test Audit Trail (Coordinator/SuperAdmin)

```bash
# Get audit trail for entity
GET http://localhost:3000/audit-trail/entity/Batch/batch-uuid
Authorization: Bearer <coordinator_token>

# Get compliance report
GET http://localhost:3000/audit-trail/compliance?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <super_admin_token>
```

## Step 5: Update Existing Users

If you have existing users, you may need to update their roles:

```sql
-- Update existing FARMER users to GROWER
UPDATE users SET role = 'GROWER' WHERE role = 'FARMER';

-- Update existing PARTNER users to LOGISTICS_PARTNER
UPDATE users SET role = 'LOGISTICS_PARTNER' WHERE role = 'PARTNER';

-- Update existing ADMIN users to SUPER_ADMIN
UPDATE users SET role = 'SUPER_ADMIN' WHERE role = 'ADMIN';
```

## Step 6: Seed Initial Data (Optional)

Create a seed script to populate initial market prices:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create initial market prices
  const crops = ['Raspberry', 'Blackberry', 'Apple', 'Pepper', 'Blueberry'];
  
  for (const crop of crops) {
    await prisma.marketPrice.create({
      data: {
        cropType: crop,
        buyPrice: 5.0,
        sellPrice: 8.0,
        isActive: true,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Troubleshooting

### If migration fails:
1. Check database connection in `.env`
2. Ensure all existing migrations are applied
3. Check for syntax errors in schema.prisma

### If Prisma Client generation fails:
1. Run `npm install` to ensure dependencies are installed
2. Check for TypeScript errors in schema
3. Verify all relations are properly defined

### If API endpoints return 403:
1. Verify user role matches required role
2. Check JWT token is valid
3. Ensure RolesGuard is properly configured

## Next Steps

1. Integrate Google Maps API for route optimization
2. Set up push notifications for mission assignments
3. Create admin dashboard for price management
4. Implement batch locking/unlocking by coordinators
5. Add webhook endpoints for real-time updates
