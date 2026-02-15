# BioVera Mobile App – Screen Specifications (Reorganization)

**Design principles:** Simple, farmer-friendly, no QR for now, English localization

---

## 1. Welcome Screen (Landing)

**Purpose:** First impression, two paths: new farmer or returning farmer

**Layout:**
- **Top:** Bio Vera logo (leaf icon) + tagline: "BIO-Ready certified food"
- **Hero:** Large, clear title: "Become a Bio Vera Producer"
- **Subtitle:** One short line: "Register, add your fields, track your production"
- **Two primary buttons:**
  1. **"Start registration"** (primary green, full width) → Register
  2. **"I already have an account"** (secondary, outline) → Partner Login
- **Footer:** Optional link "Where to buy seeds" → Supplier map (or remove for now)

**Visual:** Clean, lots of white space. One step at a time. No 3-step stepper on first load – that adds complexity.

---

## 2. Register

**Purpose:** Create farmer account

**Layout:**
- Simple form, one column
- Fields: First name, Last name, Email, Password
- Optional: Hectares (number) – if you know
- One CTA: "Register"
- Link: "Already have an account? Sign in"
- Success: "Registration sent. We'll contact you. You can add your fields next."

**Visual:** Minimal, large input fields (farmer-friendly), no extra sections

---

## 3. Partner Login

**Purpose:** Existing farmers sign in

**Layout:**
- Partner code (text input)
- Password (text input)
- "Sign in" button
- Link: "Don't have an account? Register"

**Visual:** Same style as Register. Clean, no distractions.

---

## 4. Home (Dashboard)

**Purpose:** Central hub – quick access to daily tasks, status overview

**Layout:**
- **Header:**
  - Greeting: "Hello, [First name]"
  - Partner code (small text)
  - Sync status indicator (Saved / Syncing / Offline)
- **Main section – Today's tasks:**
  - "Add Journal entry" – Record what you did today (spraying, fertilizing, etc.)
  - "Report harvest" – Announce harvest or add harvest results
  - "Add products" – Enter quantities after harvest
  - "Watch training video" – If not completed (show badge)
  - "Upload certificates" – If any pending
- **Quick status:**
  - Pending sync: X items waiting
  - Wallet: Available balance (if any)
- **More:** Link to full menu (Profile area)

**Visual:** Card-based, 2–4 large tappable cards. No TrustScore widget for now – simpler.

**No QR actions here.** Remove Scan button from Home.

---

## 5. Products

**Purpose:** Post-harvest – farmer enters available products (kg, variety)

**Layout:**
- **Header:** "My products"
- **Subtitle:** "Add what you have after harvest"
- **Add product (manual only, no QR):**
  - Crop / product name (e.g. Raspberry, Apple)
  - Variety (e.g. Willamette, Golden Delicious)
  - Quantity (kg)
  - Unit: kg (default), optional: l, pcs, etc.
  - Parcel / field (optional dropdown from estates)
  - Notes (optional)
- **List:** All added products, editable, deletable
- **Empty state:** "No products yet. Add your first product after harvest."

**Visual:** Form + list. Big "Add product" button at top. List items show: Name | Variety | X kg

---

## 6. Harvest

**Purpose:** Pre-harvest announcement + post-harvest confirmation

**Layout (two modes or two steps):**

**A) Pre-harvest (announcement):**
- "Announce harvest"
- Expected harvest date (date picker)
- Crop type (dropdown or text)
- Parcel (dropdown from estates)
- Notes (optional)
- "Submit" → Saved, synced when online

**B) Post-harvest (results):**
- After harvest, farmer can go to Products and add actual quantities (see Products screen)

**Visual:** Single form. Could be one screen with "Announce harvest" and "Add harvest results" as two cards, or merged into one flow.

---

## 7. Journal (Field Log)

**Purpose:** Record what was done on production – mandatory logs

**Layout:**
- **Header:** "Journal"
- **Subtitle:** "Record each activity on your fields"
- **Add entry:**
  - Activity type: Planting | Fertilizing | Spraying | Harvest | Other
  - Date (default: today)
  - Parcel (dropdown from estates)
  - Product / material used (text – e.g. name of fertilizer, spray)
  - Quantity (optional)
  - Notes (optional)
  - Photo (optional – can add later)
- **List:** Chronological list of entries, filter by parcel or date
- **Empty state:** "No entries yet. Add your first activity."

**Visual:** Form + timeline list. Each entry as a card: Date | Activity | Parcel | Details

---

## 8. Fields (Estates)

**Purpose:** Manage parcels / fields

**Layout:**
- **Header:** "My fields"
- **Add field** button (large)
- **List:** Each field = card with: Name, Area (ha), Crop, Location status
- **Tap field:** Detail view → Edit or view on map
- **Add field form:**
  - Name
  - Area (ha)
  - Crop type (optional)
  - Variety (optional)
  - Boundary: Tap on map to draw (optional for start – can add later)
  - Location (optional pin)

**Visual:** Simple list of cards. Add flow: one form, step by step.

---

## 9. Certificates

**Purpose:** Upload required certificate photos; watch training video

**Layout:**
- **Section 1: Training**
  - Card: "Good Agricultural Practice – Video"
  - Status: Not started | In progress | Completed
  - Button: "Watch video" → Opens video player
  - Progress: e.g. 0% / 100% (must watch to end to complete)
- **Section 2: Certificate uploads**
  - List of required certs (from backend – flexible)
  - Each: Title (e.g. "Production certificate"), Status (Not done | Pending | Done)
  - Button: "Upload photo" → Camera or gallery
  - Pending: "X photo(s) waiting to sync"

**Visual:** Two clear sections. Training = video card. Certificates = list of upload cards.

---

## 10. Costs

**Purpose:** Track costs (fuel, fertilizer, etc.)

**Layout:**
- **Header:** "Costs"
- **Subtitle:** "Track your expenses"
- **Add cost:**
  - Name (e.g. Fuel, Fertilizer)
  - Amount (EUR)
  - Date (default: today)
- **List:** All costs, total at bottom
- **Empty state:** "No costs yet. Add your first cost."

**Visual:** Same pattern as Products – form + list. Total bar at top or bottom.

---

## 11. Banned substances

**Purpose:** Quick reference – what is not allowed

**Layout:**
- **Header:** "Banned substances"
- **Subtitle:** "Check before use – only approved products"
- **List:** Simple list of categories (GMO, banned herbicides, etc.) + short description
- **Note:** "Scan barcode to check product (coming soon)" – or hide for now
- **Allowed list:** Link to whitelist / materials (text list, no scan)

**Visual:** Informational cards. Read-only, no forms.

---

## 12. Profile (Me)

**Purpose:** Account info, wallet, settings, logout, links to secondary screens

**Layout:**
- **User card:** Name, Partner code, Email
- **Wallet:** Balance summary → tap to Wallet screen
- **Sync status:** "X items waiting to sync"
- **Links (grouped):**
  - Fields
  - Journal
  - Harvest
  - Products
  - Costs
  - Certificates
  - Banned substances
  - Settings
- **Logout** (bottom, secondary style)

**Visual:** Clean list. No clutter. Secondary screens (Orders, Batches, Missions, etc.) can live under "More" or Settings for now.

---

## 13. Wallet

**Purpose:** Balance, transactions

**Layout:**
- Balance: Available, Pending
- Transaction list (simple)
- Empty: "No transactions yet"

**Visual:** Same design system. Minimal.

---

## 14. Settings

**Purpose:** App preferences

**Layout:**
- Notifications (on/off)
- Auto-sync (on/off)
- Language (English default)
- About / Help (optional)

**Visual:** Simple list of toggles and options.

---

## 15. Secondary screens (simplified / later)

| Screen        | For now                           |
|---------------|------------------------------------|
| Orders        | Link from Profile, simple list     |
| Batches       | Link from Profile, simple list     |
| Missions      | Link from Profile, simple list     |
| Notifications | Badge on Profile, simple list      |
| Compliance photos | Can merge into Journal (photo per entry) |
| Quality entry | Link from Profile or Batch detail  |
| Materials     | Read-only list, link from Banned   |
| Growth journal| Can merge into Journal             |
| Supplier map  | Link from Welcome or Settings      |

---

## Navigation structure (simplified)

**Bottom tabs (3 only):**
1. **Home** – Dashboard
2. **Products** – Add/view products
3. **Profile** – Me, wallet, links, settings, logout

**No tab for:** Costs, Certifications, Banned substances, Harvest, Journal, Fields  
→ All accessible from Home (quick actions) or Profile (links)

**Flow:**
- Welcome → Register or Login
- After login → Home
- Home has main actions: Journal, Harvest, Products, Certificates
- Profile has "everything else"

---

## Design system (reminder)

- **Primary:** Bio Vera green (#2D5A27)
- **Fonts:** Large (18px+ for buttons, 16px+ for body)
- **Buttons:** Min 56px height, large tap targets
- **Cards:** Rounded corners, subtle border, clear hierarchy
- **Spacing:** Generous padding
- **Language:** English only for now

---

## What to remove for "start without QR"

- QR/Scan button from Home
- QR/Scan from Products (manual entry only)
- QR from Materials (whitelist as text list only)
- Any barcode validation flows

QR can be added later as a separate feature branch.
