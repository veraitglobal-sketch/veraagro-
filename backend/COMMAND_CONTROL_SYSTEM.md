# Bio Vera Command & Control System

## Overview

The Command & Control system ensures 100% control over third-party partners (Growers, Hubs, and Last-Mile drivers) through automated monitoring, trust scoring, geofencing, and financial escrow controls.

## Components

### 1. Trust Score System

**Service**: `TrustScoreService`
**Initial Score**: 100 points for all partners

**Automatic Deductions**:
- **-10 points**: Late arrival (>15 minutes)
- **-20 points**: Temperature deviation (>2°C from target)
- **-50 points**: Missing digital signature
- **-15 points**: Route deviation (>2km without traffic alert)

**Blocking Logic**:
- If score drops below **70 points**, partner is automatically blocked
- Cannot accept new missions until SuperAdmin manually reviews
- Notification sent to SuperAdmin when blocking occurs

**Endpoints**:
- `GET /trust-score/me` - Get own trust score
- `GET /trust-score/:userId` - Get partner's trust score (Admin)
- `POST /trust-score/deduct` - Apply deduction (System/Admin)
- `PUT /trust-score/unblock/:userId` - Unblock partner (SuperAdmin)
- `PUT /trust-score/adjust/:userId` - Manual score adjustment (SuperAdmin)

### 2. Geofencing & Time-Locks

**Service**: `GeofencingService`

**Delivery Verification**:
- Last-Mile driver cannot click "Delivered" unless GPS is within **50 meters** of supermarket
- Real-time GPS verification before allowing delivery completion

**Hub Entry Detection**:
- Unloading timer starts automatically when truck enters Hub zone
- Detects entry via GPS coordinates
- Tracks unloading duration

**Endpoints**:
- `POST /geofencing/verify-delivery` - Verify delivery location
- `POST /geofencing/check-hub-entry` - Check if truck entered hub
- `POST /geofencing/check-route-deviation` - Check route deviation

### 3. Golden Route Enforcement

**Service**: `GeofencingService`

**Route Monitoring**:
- Drivers must follow GPS route provided by Bio Vera
- Deviation >2km without traffic alert triggers violation
- Immediate alert sent to SuperAdmin Dashboard
- Trust score deduction applied automatically

**Implementation**:
- Compares current GPS position to optimal route
- Calculates distance from nearest route point
- If deviation >2km and no traffic alert → Violation Alert

### 4. Financial Escrow Control

**Service**: `PaymentsService` (Enhanced)

**Escrow Requirements**:
Payment is held in "Pending" status until:
1. **Store Manager signs digitally** - Digital signature required
2. **Temperature log uploaded and verified** - Complete temperature log covering entire trip (at least 80% of trip duration)

**Release Process**:
- System verifies both conditions before releasing payment
- If conditions not met → Payment remains in escrow
- Fleet partner payout stays "Pending" until verification complete

**Enhanced Endpoint**:
- `POST /payments/order/:orderId/release` - Now requires signature + temperature log verification

### 5. SuperAdmin Kill-Switch

**Service**: `CommandControlService`

**Global System Control**:
- **Pause System**: Global pause button stops all operations
- **Resume System**: Resume all operations
- All active users notified when system paused/resumed

**Mission Reassignment**:
- One-click mission reassignment to another driver
- Reason required for reassignment
- Both drivers notified (old and new)
- Audit trail created

**Endpoints**:
- `GET /command-control/status` - Get system status
- `POST /command-control/pause` - Pause entire system (SuperAdmin)
- `POST /command-control/resume` - Resume system (SuperAdmin)
- `POST /command-control/reassign/:missionId` - Reassign mission (SuperAdmin)

## Integration Points

### Automatic Trust Score Deductions

**Late Arrival**:
- Triggered when mission arrival time >15 minutes late
- Applied automatically in `CommandControlService.checkLateArrival()`

**Temperature Deviation**:
- Triggered when temperature log shows >2°C deviation
- Applied automatically in `CommandControlService.checkTemperatureDeviation()`

**Missing Signature**:
- Triggered when required digital signatures are missing
- Applied automatically in `CommandControlService.checkMissingSignature()`

**Route Deviation**:
- Triggered when GPS deviates >2km from route without traffic alert
- Applied automatically in `GeofencingService.checkRouteDeviation()`

### Geofencing Integration

**Delivery Completion**:
- Frontend calls `/geofencing/verify-delivery` before allowing "Delivered" click
- Returns success/failure with distance information
- Only allows delivery if within 50m radius

**Hub Entry**:
- GPS tracking automatically detects hub entry
- Unloading timer starts when truck enters hub zone
- No manual action required

## Frontend Dashboard

**Route**: `/admin/command-control`

**Features**:
- System Status & Kill-Switch (Pause/Resume)
- Live Missions with delay indicators
- One-click mission reassignment
- Recent Violations list
- Trust Score Overview (Blocked/At Risk/Healthy)

## Data Flow

1. **Mission Started** → GPS tracking begins
2. **Route Deviation Detected** → Alert to SuperAdmin + Trust score deduction
3. **Late Arrival** → Trust score deduction (-10 points)
4. **Temperature Deviation** → Trust score deduction (-20 points)
5. **Delivery Attempt** → Geofencing check (must be within 50m)
6. **Delivery Completed** → Store Manager signature required
7. **Payment Release** → Verify signature + temperature log
8. **Trust Score < 70** → Auto-block + SuperAdmin notification

## Database Schema Requirements

**TrustScore Table**:
- userId, score, entityType, isBlocked, blockedAt, lastUpdated

**TrustScoreHistory Table**:
- userId, previousScore, newScore, deduction, eventType, reason, timestamp

**SystemEvent Table**:
- eventType, initiatedBy, reason, timestamp

**Mission Table** (Enhanced):
- unloadingStartedAt, reassignedAt, reassignedBy, reassignmentReason

## Testing

### Test Trust Score Deduction
```bash
POST /trust-score/deduct
{
  "event": "LATE_ARRIVAL",
  "points": 10,
  "reason": "Late arrival: 18 minutes late",
  "entityId": "user-id",
  "entityType": "LOGISTICS_PARTNER"
}
```

### Test Geofencing
```bash
POST /geofencing/verify-delivery
{
  "missionId": "mission-id",
  "deliveryLocationId": "location-id",
  "latitude": 53.5511,
  "longitude": 9.9937
}
```

### Test System Pause
```bash
POST /command-control/pause
{
  "reason": "Emergency maintenance"
}
```

## Security & Compliance

- All trust score changes logged in audit trail
- System pause/resume requires SuperAdmin role
- Mission reassignment creates full audit trail
- Financial escrow ensures payment only released when conditions met
- Geofencing prevents fraudulent delivery confirmations

## Next Steps

1. **Real-time GPS Tracking**: Integrate with mobile app for live tracking
2. **Traffic Alert Integration**: Connect to traffic APIs for route deviation exceptions
3. **Automated Route Optimization**: Dynamic route updates based on traffic
4. **Advanced Analytics**: Trust score trends, violation patterns
5. **Mobile App Integration**: GPS tracking, geofencing checks in mobile app
