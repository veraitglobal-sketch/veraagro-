# Logistics Dashboard – MVP Overview

## Current State

- **Dashboard page** (`/logistics-partner/dashboard`) – uses **hardcoded mock data**
- **Missions page** (`/logistics-partner/missions`) – uses **hardcoded mock data**
- **Backend** – `GET /missions/my-missions` returns missions for logged-in logistics partner
- **Auth** – partnerCode + password, JWT in localStorage, `authAPI` + `useAuth`

## MVP Scope (minimal)

### 1. Dashboard – essential

| Feature            | Status  | Notes                                                        |
|--------------------|---------|--------------------------------------------------------------|
| Partner profile    | MVP     | Name from auth, simple "Active" badge                        |
| Active tours       | MVP     | From `missionsAPI.getMyMissions()` – missions not COMPLETED/CANCELLED |
| Quick stats        | MVP     | Active count, completed this week (from missions)            |
| Earnings / payout  | Omit    | No API yet – skip or placeholder                             |

### 2. Mission status mapping

API `MissionStatus`: `PENDING`, `ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `PICKED_UP`, `IN_TRANSIT`, `COMPLETED`, `CANCELLED`, `READY_FOR_LOADING`

- **Active** = not PENDING, not COMPLETED, not CANCELLED
- **Loading** = READY_FOR_LOADING, ACCEPTED, IN_PROGRESS (needs handover)
- **In transit** = PICKED_UP, IN_TRANSIT
- **At delivery** = near COMPLETED (optional, can treat as IN_TRANSIT)

### 3. Auth guard

- Require login for `/logistics-partner/dashboard`, `/missions`, `/handover`
- Redirect non-LOGISTICS_PARTNER users to home

### 4. Data model (API response)

Mission from API includes:

- `id`, `missionNumber`, `status`, `pickupAddress`, `pickupLocation`
- `batchId`, `estimatedPickupTime`, `requestedAt`, etc.
- `batches` – productName, quantity, unit
- `users_missions_growerIdTousers` – grower info
- `vehicles` – vehicle info

Destination: MVP assumes "Hamburg" (BioVera flow: Balkan → Hamburg).

## Out of scope for MVP

- Real-time GPS tracking
- Temperature display (would need temperature_logs API)
- Earnings/payout API
- Vehicle count from API (could use placeholder)
