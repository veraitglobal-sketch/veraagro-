# Bio Vera Traceability System

## Overview

The Traceability System provides complete transparency from farm to consumer, ensuring the "Wall of Freshness" through QR codes, real-time monitoring, and automated quality control.

## Components

### 1. QR Code Generator

**Service**: `QrService`
**Endpoint**: `POST /qr/generate/:batchId`

- Generates unique QR code for every batch
- Format: `BIO-VERA-{batchId}`
- Links to public certificate page
- Returns QR code as data URL (PNG image)

**Usage**:
```typescript
// Generate QR for a batch
POST /qr/generate/{batchId}
Authorization: Bearer <token>

Response:
{
  qrCodeDataUrl: "data:image/png;base64,...",
  certificateUrl: "http://localhost:3001/certificate/BIO-VERA-BATCH-2024-001",
  qrId: "BIO-VERA-BATCH-2024-001"
}
```

### 2. Freshness Certificate Page

**Frontend**: `/certificate/[qrId]`
**Backend**: `GET /qr/certificate/:qrId` (Public endpoint)

**Displays**:
- ✅ Origin: Farm name, owner, GPS location
- ✅ Timeline: Harvested, verified, loaded times
- ✅ Cold Chain Proof: Temperature graph (2-8°C range)
- ✅ Sustainability Score: Distance traveled, score out of 100
- ✅ Freshness: Remaining shelf life, expiration date
- ✅ Compromised status (if kill-switch triggered)

**Mobile Optimized**: Responsive design for QR code scanning

### 3. Kill-Switch Logic

**Service**: `KillSwitchService`
**Automated**: Runs every 5 minutes via cron job
**Manual**: `POST /kill-switch/check` (SuperAdmin/Coordinator)

**Logic**:
- Monitors all batches in transit
- Detects temperature >10°C for >30 minutes
- Automatically flags batch as "Compromised"
- Updates batch status to EXPIRED
- Creates audit trail entry
- Sends notification to SuperAdmin

**Implementation**:
```typescript
// Automatic check (every 5 minutes)
@Cron(CronExpression.EVERY_5_MINUTES)
async checkAndFlagCompromisedBatchesScheduled()

// Manual trigger
POST /kill-switch/check
```

**When Triggered**:
- Batch status → EXPIRED
- Quality issues → `{compromised: true, compromisedAt: Date, reason: "Temperature >10°C for >30min"}`
- Audit trail → QUALITY_CHECK event with isCompliant: false
- Notification → Sent to all SuperAdmins

### 4. AEO Export Module

**Frontend**: `/aeo-dashboard`
**Backend**: `GET /aeo/vehicle/:vehicleId`

**Features**:
- View all batches in a specific vehicle
- Real-time seal status (intact/compromised)
- Digital phytosanitary certificates
- Temperature history for each batch
- Compliance summary
- Public endpoint for customs: `GET /aeo/public/vehicle/:vehicleId`

**Dashboard Shows**:
- Vehicle information (number, license plate, temp range)
- Seal status with timestamp
- Summary (total batches, weight, temp range, compliance)
- Detailed batch list with:
  - Origin information
  - Temperature graphs
  - Digital passports
  - Quality status

### 5. IoT Sensor Integration

**Simulation Endpoint**: `POST /kill-switch/simulate/:batchId/:missionId/:vehicleId`

Simulates IoT sensor data for testing:
- Generates 12 temperature readings (1 hour of data)
- Simulates occasional high temperature (for kill-switch testing)
- Creates temperature logs with timestamps

**Real Integration** (Future):
- Connect to actual IoT sensors via MQTT/WebSocket
- Real-time temperature streaming
- Automatic log creation

## API Endpoints

### QR Code
- `POST /qr/generate/:batchId` - Generate QR code (Grower/Coordinator/SuperAdmin)
- `GET /qr/certificate/:qrId` - Get certificate data (Public)

### Kill-Switch
- `POST /kill-switch/check` - Manual check (SuperAdmin/Coordinator)
- `POST /kill-switch/simulate/:batchId/:missionId/:vehicleId` - Simulate IoT data (SuperAdmin)

### AEO Export
- `GET /aeo/vehicle/:vehicleId` - Get vehicle batches (SuperAdmin/Coordinator)
- `GET /aeo/export/:missionId` - Get export data (SuperAdmin/Coordinator)
- `GET /aeo/public/vehicle/:vehicleId` - Public endpoint for customs

## Frontend Pages

### Certificate Page
- **Route**: `/certificate/[qrId]`
- **Access**: Public (via QR code)
- **Features**: Mobile-optimized, shows all traceability data

### AEO Dashboard
- **Route**: `/aeo-dashboard`
- **Access**: SuperAdmin, Coordinator
- **Features**: Vehicle search, batch inspection, compliance reports

## Data Flow

1. **Batch Created** → QR code generated
2. **Temperature Logged** → Automatically checked for kill-switch
3. **Kill-Switch Triggered** → Batch flagged, SuperAdmin notified
4. **Certificate Accessed** → Shows real-time data including compromised status
5. **Customs Inspection** → AEO dashboard shows all vehicle data

## Testing

### Test QR Code Generation
```bash
POST http://localhost:3000/qr/generate/{batchId}
Authorization: Bearer <grower_token>
```

### Test Certificate Access
```bash
GET http://localhost:3000/qr/certificate/BIO-VERA-BATCH-2024-001
# Or visit: http://localhost:3001/certificate/BIO-VERA-BATCH-2024-001
```

### Test Kill-Switch
```bash
# Simulate IoT data
POST http://localhost:3000/kill-switch/simulate/{batchId}/{missionId}/{vehicleId}
Authorization: Bearer <super_admin_token>

# Manual check
POST http://localhost:3000/kill-switch/check
Authorization: Bearer <super_admin_token>
```

### Test AEO Dashboard
```bash
GET http://localhost:3000/aeo/vehicle/{vehicleId}
Authorization: Bearer <super_admin_token>
```

## Next Steps

1. **Integrate Real IoT Sensors**: Connect MQTT/WebSocket for live data
2. **Add Push Notifications**: Alert users when kill-switch triggers
3. **Enhance Certificate**: Add more visual elements, PDF export
4. **Customs API Key**: Add API key authentication for public AEO endpoint
5. **Seal Sensor Integration**: Connect IoT seal sensors for real-time status
