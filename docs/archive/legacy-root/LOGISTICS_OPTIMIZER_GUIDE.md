# 🚚 Logistics Optimizer - Kompletan Sistem

## 📋 Pregled

Logistics Optimizer je sistem koji:
1. **Predviđa** tačan datum kada će 20 tona proizvoda biti spakovano i spremno u jednom klasteru sela
2. **Generiše** 'Load Plan' za optimalno slaganje paleta u kamion
3. **Proverava** vremensku prognozu i pomeri termin polaska ako se najavljuje kiša

---

## 🎯 Funkcionalnosti

### 1. Harvest Prediction (Predviđanje Berbe)

**Endpoint:** `POST /logistics-optimizer/predict-harvest`

**Input:**
```json
{
  "targetDate": "2024-02-15T10:00:00Z",
  "region": "Vojvodina" // opciono
}
```

**Output:**
```json
{
  "targetDate": "2024-02-15T10:00:00Z",
  "estimatedReadyDate": "2024-02-14T18:00:00Z",
  "confidence": 0.85,
  "farmersInvolved": 12,
  "totalQuantity": 22000,
  "villageClusters": [
    {
      "clusterId": "cluster-1",
      "villageName": "Village 1",
      "farmers": [
        {
          "farmerId": "farmer-123",
          "farmerName": "Marko Petrović",
          "farmLocation": { "lat": 45.2671, "lng": 19.8335 },
          "estimatedQuantity": 5000,
          "estimatedReadyDate": "2024-02-14T16:00:00Z"
        }
      ],
      "totalQuantity": 20000,
      "clusterCenter": { "lat": 45.2671, "lng": 19.8335 },
      "estimatedReadyDate": "2024-02-14T18:00:00Z"
    }
  ],
  "warnings": []
}
```

**Algoritam:**
- Analizira sve berbe unose iz poslednjih 30 dana
- Klasteruje seljake po geografskoj blizini (5km radius)
- Predviđa količinu na osnovu veličine farme (2000kg/ha)
- Računa vreme pakovanja (500kg/sat + 4h buffer)
- Kombinuje klastere da dostigne 20 tona

---

### 2. Load Plan Generation (Plan Slaganja)

**Endpoint:** `POST /logistics-optimizer/load-plan`

**Input:**
```json
{
  "clusterId": "cluster-1",
  "truckId": "truck-123",
  "batches": ["batch-1", "batch-2", "batch-3"]
}
```

**Output:**
```json
{
  "truckId": "truck-123",
  "truckCapacity": {
    "length": 13.6,
    "width": 2.4,
    "height": 2.7,
    "maxWeight": 24000
  },
  "pallets": [
    {
      "palletId": "pallet-batch-1-0",
      "position": { "x": 0, "y": 0, "z": 0 },
      "dimensions": { "length": 1.2, "width": 0.8, "height": 1.5 },
      "weight": 500,
      "batchId": "batch-1",
      "farmerId": "farmer-123",
      "villageCluster": "cluster-1"
    }
  ],
  "utilization": {
    "volumeUsed": 45.2,
    "volumeTotal": 88.1,
    "weightUsed": 18500,
    "weightTotal": 24000,
    "volumeEfficiency": 51.3,
    "weightEfficiency": 77.1
  },
  "loadingSequence": [
    "pallet-batch-1-0",
    "pallet-batch-2-0",
    "pallet-batch-3-0"
  ]
}
```

**Algoritam:**
- **3D Bin Packing** (First Fit Decreasing)
- Sortira palete po težini (najteže prvo)
- Traži najbolju poziciju (front-left-bottom)
- Proverava preklapanje sa postojećim paletama
- Generiše loading sequence (bottom-to-top, front-to-back)

**Standardne Palete:**
- Dimenzije: 1.2m × 0.8m × 1.5m
- Težina: 500kg (prosečno)

---

### 3. Weather Check & Route Adjustment (Provera Vremena)

**Endpoint:** `POST /logistics-optimizer/weather-check`

**Input:**
```json
{
  "route": {
    "origin": { "lat": 45.2671, "lng": 19.8335, "name": "Novi Sad" },
    "destination": { "lat": 48.2082, "lng": 16.3738, "name": "Vienna" },
    "waypoints": [
      { "lat": 46.1004, "lng": 19.6676, "name": "Subotica" }
    ]
  },
  "plannedDepartureTime": "2024-02-15T08:00:00Z"
}
```

**Output:**
```json
{
  "route": { ... },
  "weatherForecast": [
    {
      "location": { "lat": 45.2671, "lng": 19.8335, "name": "Novi Sad" },
      "date": "2024-02-15T08:00:00Z",
      "condition": "clear",
      "precipitation": 0,
      "severity": "low"
    },
    {
      "location": { "lat": 47.2692, "lng": 11.4041, "name": "Alps Region" },
      "date": "2024-02-15T12:00:00Z",
      "condition": "rain",
      "precipitation": 8,
      "severity": "medium"
    }
  ],
  "recommendedDepartureTime": "2024-02-15T02:00:00Z",
  "originalDepartureTime": "2024-02-15T08:00:00Z",
  "adjustmentReason": "Rain forecasted in Alps region - departing 6 hours earlier to avoid delays",
  "riskLevel": "medium"
}
```

**Algoritam:**
- Proverava vremensku prognozu za sve waypoints
- Detektuje kišu/sneg u Alps regionu (45-47°N, 5-15°E)
- Ako je kiša → pomeri polazak **6 sati ranije**
- Ako je visok rizik → pomeri polazak **6 sati ranije**

**Weather API:**
- Koristi OpenWeatherMap API (zahteva API key)
- Fallback na mock podatke ako API nije dostupan

---

### 4. Combined Optimization (Kompletna Optimizacija)

**Endpoint:** `POST /logistics-optimizer/optimize`

**Input:**
```json
{
  "targetDate": "2024-02-15T10:00:00Z",
  "truckId": "truck-123",
  "route": {
    "origin": { "lat": 45.2671, "lng": 19.8335, "name": "Novi Sad" },
    "destination": { "lat": 48.2082, "lng": 16.3738, "name": "Vienna" }
  },
  "plannedDepartureTime": "2024-02-15T08:00:00Z"
}
```

**Output:**
```json
{
  "prediction": { ... },
  "loadPlan": { ... },
  "weatherCheck": { ... },
  "recommendations": [
    "Depart 6 hours earlier due to weather conditions",
    "Truck volume utilization is only 51.3% - consider smaller truck or additional batches",
    "Low confidence (85%) in harvest prediction - verify with farmers"
  ]
}
```

---

## 🔧 Konfiguracija

### Environment Variables

```bash
# Weather API (OpenWeatherMap)
OPENWEATHER_API_KEY=your_api_key_here
```

### Default Values

```typescript
TARGET_QUANTITY = 20000; // 20 tons in kg
CLUSTER_RADIUS = 5000; // 5km in meters
DEFAULT_YIELD = 2000; // kg per hectare
PACKAGING_RATE = 500; // kg per hour
BUFFER_HOURS = 4; // hours for quality checks
STANDARD_PALLET = {
  length: 1.2, // meters
  width: 0.8,
  height: 1.5,
  weight: 500, // kg
};
```

---

## 📊 Performance Metrics

### Harvest Prediction
- **Confidence Score:** 0-1 (više = bolje)
- **Accuracy:** Zavisi od kvaliteta unosa berbi
- **Processing Time:** ~2-5 sekundi za 100 seljaka

### Load Plan
- **Volume Efficiency:** Target >80%
- **Weight Efficiency:** Target >90%
- **Processing Time:** ~1-2 sekunde za 50 paleta

### Weather Check
- **API Response Time:** ~500ms-2s (zavisi od API-ja)
- **Fallback:** Mock data ako API nije dostupan

---

## 🧪 Test Scenarios

### Test 1: Harvest Prediction
```bash
curl -X POST http://localhost:3000/logistics-optimizer/predict-harvest \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetDate": "2024-02-15T10:00:00Z"
  }'
```

### Test 2: Load Plan
```bash
curl -X POST http://localhost:3000/logistics-optimizer/load-plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clusterId": "cluster-1",
    "truckId": "truck-123",
    "batches": ["batch-1", "batch-2"]
  }'
```

### Test 3: Weather Check
```bash
curl -X POST http://localhost:3000/logistics-optimizer/weather-check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "route": {
      "origin": { "lat": 45.2671, "lng": 19.8335, "name": "Novi Sad" },
      "destination": { "lat": 48.2082, "lng": 16.3738, "name": "Vienna" }
    },
    "plannedDepartureTime": "2024-02-15T08:00:00Z"
  }'
```

---

## ⚠️ Napomene

1. **Field Entries:** Sistem koristi `Batch` model sa `harvestDate` kao proxy za harvest entries. Ako imate poseban model za field entries, ažurirajte query.

2. **Truck Capacity:** Sistem koristi default vrednosti za truck capacity. Ako imate `LogisticsPartner` model sa `vehicleCapacity`, ažurirajte query.

3. **Weather API:** Zahteva OpenWeatherMap API key. Bez API key-a, koristi mock podatke.

4. **Batch IDs:** U `optimize` endpoint-u, sistem automatski pronalazi batch IDs za farmere u klasterima. Proverite da li ovo odgovara vašoj shemi.

---

## 🚀 Sledeći Koraci

1. **Instaliraj dependencies:**
   ```bash
   cd backend
   npm install @nestjs/axios axios
   ```

2. **Dodaj Weather API key:**
   ```bash
   # .env
   OPENWEATHER_API_KEY=your_key_here
   ```

3. **Testiraj endpoints:**
   - Harvest prediction
   - Load plan generation
   - Weather check

4. **Optimizuj algoritme:**
   - Poboljšaj bin packing (koristi advanced algoritme)
   - Dodaj machine learning za harvest prediction
   - Integriši real-time weather data

---

## 📝 TODO

- [ ] Dodati caching za weather forecasts
- [ ] Poboljšati bin packing algoritam (koristi genetic algorithm)
- [ ] Dodati machine learning za harvest prediction
- [ ] Integrisati real-time GPS tracking za route optimization
- [ ] Dodati notifications za weather alerts
