import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AiAssistantService {
  private openai: OpenAI | null = null;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    } else {
      console.warn('OPENAI_API_KEY not set. AI Assistant will not function properly.');
    }
  }

  /**
   * Comprehensive Knowledge Base - All BioVera Information
   */
  private getKnowledgeBase(): string {
    return `
# BioVera Platform - Complete Knowledge Base

## About BioVera
BioVera is a vertically integrated agrotech platform connecting European agricultural producers directly with markets. We provide complete traceability, quality assurance, and automated compliance management from seed to shelf.

## FOR GROWERS/PRODUCERS

### How to Become a Producer
1. Visit /growers page
2. Fill application form with:
   - Farm name and contact information
   - GPS location of your farm
   - Crop types you grow
   - Total hectares
   - Certifications (GlobalG.A.P. preferred but we help you get it)
   - Irrigation system availability
   - Digital integration readiness
   - Field photos

### Requirements
- Valid agricultural operations
- Compliance with EU standards
- Willingness to implement quality control protocols
- GlobalG.A.P. certification preferred (we help you obtain it)

### The Bio Vera Protocol (Mandatory Requirements)
**Digital Scheduling:**
- All harvests must be announced 24h in advance via the app
- Real-time start/stop harvest reporting is mandatory
- Ensures logistics team can coordinate pickup times precisely
- Maintains cold chain from field to market

**Quality Verification:**
- Field Coordinators have final authority to approve or reject batches on-site
- Based on Bio Vera's visual and chemical standards
- All products must meet MRL limits at 70% of EU permitted levels
- Quality is non-negotiable

**Smart Packaging:**
- Use only Bio Vera reusable crates with integrated QR codes
- No manual repacking allowed
- Every crate is tracked from farm to retail
- Complete traceability guaranteed
- Packaging must be done directly at farm in Vera packaging

**Full Transparency:**
- Soil and spray logs must be uploaded digitally before season starts
- All field entries (planting, spraying, harvesting) tracked with GPS validation
- Complete digital record-keeping mandatory for certification and traceability

### The Value Proposition for Growers
**Fixed Pricing:**
- Seasonal price stability
- No middleman, no daily price fluctuations
- Secure revenue with predictable pricing throughout season
- Prices agreed before season starts
- Eliminates market volatility
- Ensures financial planning

**Logistics Priority:**
- The refrigerated fleet picks up goods at the exact scheduled minute
- Zero wait time
- Harvest gets priority treatment from field to market
- Direct packaging at farm in Vera packaging
- Ensures freshness and quality

**Automated Payments:**
- Funds reserved upon field verification
- Released within 48 hours of Hub arrival
- No payment delays, no cash flow worries
- Payment secured by contracts with German retail chains (60-90 days)
- Provides financial security

**Group Certification:**
- Vera Agrar holds certification for all partners
- We cover costs and certification process
- You gain direct access to German market
- No individual certification fees
- No complex paperwork required

### Complete Support System for Growers
**What We Provide:**
- Mobile app for field management (offline-first, works without internet)
- Automated batch tracking system
- Quality control assistance (Protocol 360)
- Payment processing (automatic, 3-5 business days after delivery)
- Market access (direct connection to EU buyers)
- Certification support (we help you get GlobalG.A.P.)
- Training and resources (all guides available as PDFs)

**Financial Benefits:**
- Fair pricing (70% of sale goes to farmer)
- Escrow payment system (secure, guaranteed)
- Automatic payment split (no paperwork delays)
- Market price visibility (see what you'll earn)
- Vera Bonus system (bonus for compliance)

**Technical Support:**
- GPS validation system
- Barcode scanning tools
- Compliance photo system
- Digital scheduling (24-hour harvest announcements)
- Quality entry system
- Batch management

### GROWER WEB DASHBOARD (LOGGED-IN) – ROUTES AND MEANING
When a grower is logged in on the web, the sidebar links to the same areas on every page. Main routes (prefix /grower):
- **/grower** – Dashboard, overview, shortcuts
- **/grower/portal** – **Mission Tracker**: transport missions (status, driver, vehicle, legs). If the list fails to load, try a refresh; this is not the product digital passport page—it is **transport**
- **/grower/missions/create** – **Request transport** (book pickup). Form messages may block transport until materials, compliance photos, etc. are satisfied (the form usually explains what is missing)
- **/grower/batches** – **My Batches** (post-harvest lots, QR, status, mission links)
- **/grower/fields** – **My Fields** (estates, parcels, batch creation; parcels may await admin approval)
- **/grower/season** – **Steps** (season steps / field workflow through the season)
- **/grower/where-to-buy** – **Suppliers & orders (B2B)**: here the grower finds **approved Vera material suppliers**, places orders, sees order history and sometimes messages. This is not a public "nearest on map" search—the network is partner-based. For "nearest" by distance, the app may not always show a km map: open this page first, pick or receive an assigned partner; if nothing appears, check account approval, **Materials**, and support
- **/grower/materials** – catalog (boxes, labels, film…) per platform rules
- **/grower/quality-entry** – **Quality entry** (full record: time/weather, pre-cool, three crate photos, confirmation). **One quality entry per lot (batch)**—a second attempt shows "already exists"; do not resubmit the same—use **Request transport** or **My Batches**
- **/grower/compliance-photos** – compliance photos
- **/grower/profile** – profile
The public-chain **passport** usually uses a code/ID (e.g. /passport/[batchId] with a real batch id), not Mission Tracker

### COMMON GROWER QUESTIONS (ERRORS AND NEXT STEPS)
- **Where is the nearest supplier?** – You are not on a public map. Sign in and open **Suppliers & orders** at /grower/where-to-buy. There you get B2B suppliers approved by the platform, orders, and messaging. If the list is empty, check your account, whether material types are populated, or complete **Materials** / wait for assignment—use **Help** or /contact
- **Harvest registered twice** – Do not create two active harvest plans for the same **parcel**. If you see "harvest already registered," next steps: **Request transport** (/grower/missions/create) and **Mission Tracker** (/grower/portal)
- **Quality entry: server error / already exists** – If one exists, do not duplicate; continue with transport or the lot. On server errors: check fields, three photos, retry later, then support if it persists
- **Mission Tracker: internal server error** – Error loading the **mission** list; refresh, try later, or contact support. This is not the same as a passport error
- **Request transport blocked** – Often a missing prerequisite (**Materials** or **compliance-photos**); read red messages on the form and links on the same page
- **Empty Materials / select material** – Types may need initialization; if still empty, contact support or admin. The grower chooses per the approved list
- **Passport shows no data** – Use a real **batchId** in the URL, not an arbitrary string; open the lot from **My Batches**
- Use **Help Center** /help-center, **FAQ** /faq, **Contact** /contact when something is not in the knowledge base

**Resources Available:**
- Grower Prospect PDF
- Packaging Guidelines
- Field Management Guide
- Bio Vera Protocol
- Certification Requirements
- Mobile App Guide
- Payment Process Guide
- Quality Standards

### Insurance Options for Growers
**Crop Insurance Available:**
- Weather insurance (protects against bad weather)
- Crop failure insurance
- Price insurance (protects against price drops)
- Transport insurance (covers during transport)
- One-click insurance purchase through platform
- Automatic claim processing
- We help you find the best insurance options

### Payment Process
- Payments processed automatically upon successful delivery verification
- Escrow system ensures secure transactions
- Farmers receive payment within 3-5 business days after delivery confirmation
- 70% of sale price goes to farmer
- No paperwork, all digital

### Mobile App Features for Producers
- Offline functionality (works without internet)
- GPS tracking and validation
- Barcode scanning
- Real-time synchronization
- Digital scheduling (announce harvests 24h in advance)
- Compliance photo upload
- Batch creation and management
- Quality entry system

## FOR LOGISTICS PARTNERS

### How to Become a Logistics Partner
1. Visit /logistics-partner page
2. Fill application form with:
   - Company name
   - Vehicle count
   - Regions you operate in
   - License documentation
   - Accept digital control commitment

### Requirements
- Valid licenses
- GPS tracking capability
- Commitment to cold chain compliance
- Vehicle suitable for food transport

### Logistics Features

#### Empty Mile Reduction
🚛 **What is Empty Mile Reduction?**
- System automatically matches return trips with new pickups
- Reduces empty truck journeys by up to 40%
- Saves fuel costs and reduces carbon footprint
- Automatic route optimization finds return loads
- You get paid for both directions, not just one

**How it works:**
1. After delivery, system automatically finds nearby pickups
2. Suggests optimal return routes with cargo
3. Reduces deadhead miles
4. Increases your revenue per trip
5. Reduces fuel costs

**Benefits:**
- Up to 40% fuel savings
- More revenue per trip
- Reduced carbon footprint
- Better route efficiency
- Automatic matching (no manual searching)

#### Eco-Route Planning
🌍 **Eco-Route Planning System:**
- AI-powered route optimization
- Considers traffic, weather, and distance
- Minimizes fuel consumption
- Reduces carbon emissions
- Real-time route adjustments
- Multi-stop optimization
- Cold chain compliance routes

**Features:**
- Automatic route calculation
- Traffic-aware routing
- Weather-based adjustments
- Fuel-efficient paths
- Time window management
- Multi-stop optimization
- Real-time GPS tracking

### Logistics Partner Benefits
✅ **Financial:**
- Automated payments upon successful delivery verification
- Payment based on distance, cargo type, and delivery requirements
- Digital processing (no paperwork delays)
- Empty Mile Reduction (earn on return trips)
- Fuel savings through Eco-Route Planning

✅ **Technical:**
- Mobile app for mission management
- GPS tracking system
- Temperature monitoring tools
- Digital handover system
- Route optimization
- Real-time notifications

✅ **Resources:**
- Logistics Partner Prospect PDF
- Transport Operations Guide
- Cold Chain Protocol
- Mobile App Guide
- Payment Process Guide
- GPS Tracking Standards

### "From Orchard to Shelf" Program
- End-to-end responsibility for transport
- From farm pickup to final delivery
- Complete cold chain integrity
- GPS tracking at every stage
- Digital handover system
- No partial deliveries - responsible for entire journey from field to final destination

### Logistics Partner Requirements
**Bio Vera: From Orchard to Shelf:**
- Complete end-to-end responsibility from farm pickup to retail shelf delivery
- Partners must guarantee full cold chain integrity, GPS tracking, and digital handover at every stage
- No partial deliveries - responsible for entire journey from field to final destination

**Frigo Vehicles:**
- Temperature-controlled vehicles (0-4°C) certified for organic food transport
- Minimum 2-ton capacity per vehicle
- Suitable for both small vans and large trucks
- All vehicle sizes welcome

**EU Compliance:**
- Valid transport licenses, insurance, and certifications required for cross-border operations
- GPS tracking equipment mandatory
- Open to independent drivers, small vans, and large transport companies

**Digital Integration:**
- Ability to use mobile app for QR scanning, GPS logging, and digital handovers
- Reliable internet connection required

**Performance Standards:**
- Maintain on-time delivery rate above 95%
- Respond to route assignments within 2 hours
- Zero temperature violations

### Logistics Partner Value Proposition
**Guaranteed Routes:**
- Stable, long-term contracts with predictable income
- No empty return trips
- Optimized routes reduce fuel costs by up to 15%

**Fast Payments:**
- Automated payment processing
- Receive transport fees within 24 hours of delivery confirmation
- No invoicing delays

**Technology Support:**
- Free mobile app with GPS tracking, route optimization, and digital handover tools
- 24/7 technical support included

**Network Growth:**
- Access to expanding network of producers and buyers
- Priority assignment for high-performing partners
- Build your reputation

### Technical Standards for Logistics
**GPS Tracking:**
- Real-time location tracking throughout journey
- Automatic temperature and location logs every 15 minutes

**QR Code Verification:**
- Scan batch QR codes at pickup and delivery
- Verify batch integrity and prevent fraud
- Digital proof of delivery

**Cold Chain Compliance:**
- Continuous temperature monitoring
- Automatic alerts for violations
- Compliance reports for EU certification

**Digital Documentation:**
- Automated waybills, delivery confirmations, and invoices
- All documents stored digitally with blockchain verification

### Application Process for Logistics Partners
**Step 1: Submit Application**
- Fill out online application form with company details, vehicle information, and certifications

**Step 2: Verification**
- Team reviews application and verifies licenses, insurance, and vehicle certifications
- Typically 2-3 business days

**Step 3: Onboarding**
- Complete digital onboarding: install mobile app, set up GPS tracking
- Attend training session (1-2 hours)

**Step 4: Start Delivering**
- Receive first route assignment and start earning
- Access 24/7 support through partner dashboard

### Application Process for Growers
**Step 1: Submit Application**
- Fill out online application form with farm details, contact information, GPS location, crop types, and total hectares
- Include field photos and indicate GlobalG.A.P. certification, irrigation systems, and digital integration capabilities

**Step 2: Initial Review**
- Team reviews application within 3-5 business days
- Assess farm location, crop types, and compliance readiness
- May request additional information or schedule preliminary site visit

**Step 3: On-Site Verification**
- Field Coordinator visits farm to verify GPS boundaries
- Assess infrastructure and discuss Bio Vera Protocol requirements
- Check irrigation systems, storage facilities, and digital readiness

**Step 4: Certification & Onboarding**
- Once approved, we handle all GlobalG.A.P. group certification processes and costs
- Receive access to Bio Vera mobile app and digital dashboard
- Training sessions provided on field management, harvest scheduling, and quality standards

### Technical Standards for Growers
**Certification:**
- GlobalG.A.P. IFA v6 (Group)
- Group certification managed by Vera Agrar
- All costs covered
- Direct access to German market without individual certification

**Chemical Analysis:**
- MRL limit at 70% of EU permitted levels
- All products must meet strict Maximum Residue Limits
- Testing performed at field verification stage
- Quality is non-negotiable

**Logistics:**
- Direct packaging at farm in Vera packaging
- Packaging must be done directly at farm using Bio Vera reusable crates with integrated QR codes
- No manual repacking allowed

**Traceability:**
- Complete digital tracking from field to retail
- Every crate tracked with QR codes
- GPS validation for all field entries
- Complete transparency from seed to shelf

## FOR SUPPLIERS

### How to Become a Supplier
1. Visit /suppliers page
2. Fill application form with:
   - Company name and PIB (tax ID)
   - Contact person details
   - Product type (Seeds, Fertilizers, Packaging Materials, Equipment, Other)
   - Certifications (GlobalG.A.P., IFS, BRC, ISO 22000, HACCP, Organic EU, Fair Trade)
   - Website and company description

### Requirements
- Valid business registration
- Relevant certifications for your product type
- Compliance with EU standards
- Quality assurance systems

### Complete Support for Suppliers
**What We Provide:**
- Access to verified growers network
- Direct integration with BioVera platform
- Automated order processing
- Quality verification system
- Business development support
- Marketing and promotion
- Technical integration assistance

**Financial Benefits:**
- Competitive pricing structure
- Automated payment processing
- Transparent pricing model
- Volume discounts available

**Resources Available:**
- Supplier Prospect PDF
- Integration Guide
- Certification Requirements
- Quality Standards

### Supplier Requirements by Category

**For Distributors (Agricultural Pharmacies & Wholesalers):**
- Vera Resources Storage: Obligation to provide dry and secure storage space for Vera seeds, fertilizers, and packaging materials
- QR Code Issuance: Distributor cannot issue goods without scanning QR code from farmer's app. This is the only way to track consumption per hectare
- Local Support: Distributor is first point of contact for farmers in their area. They perform physical verification of received goods
- Inventory Reporting: System must automatically notify headquarters in Hamburg when inventory falls below 20%

**For Packaging Manufacturers (Cardboard/Producers):**
- Production to Vera Specification: Every box must be made from agreed cardboard weight (e.g., five-layer) with food contact certification
- Just-in-Time Delivery: Obligation to deliver flat-packed packaging directly to our distributors within 48 hours of order
- Barcode Printing: Every packaging series must have printed serial number or barcode that we generate, so we know which farmer used which series of boxes

**Common Obligation:**
- All partners must use Vera Admin Dashboard to record every entry and exit of goods
- No 'paperwork' – everything must be in digital system

### Supplier Benefits
**Guaranteed Purchase:**
- All our growers must purchase from approved suppliers
- Guaranteed demand and stable revenue streams

**National Coverage Preferred:**
- Main suppliers with good national coverage are highly preferred
- Expand market reach across Europe

**Exclusive Market Access:**
- Direct access to European market through vertically integrated network
- Products reach end customers without intermediaries

## FOR BUYERS/DISTRIBUTORS

### How to Register as Buyer
1. Visit /register/buyer
2. Create account with:
   - Partner code
   - Business information
   - Location (GPS coordinates)
   - Address and city

### Requirements
- Valid business registration
- Location for delivery (can be added later)
- Admin approval required (status: PENDING_VERIFICATION)

### Benefits
- Browse and order products from verified growers
- Real-time order tracking
- Digital certificates for each delivery
- QR code verification for product authenticity
- Access to buyer portal dashboard
- Pre-order options for upcoming seasons

### Pre-Order System
- Place orders for upcoming harvest seasons
- Guaranteed supply for the season
- Better pricing for early orders
- Priority access to premium products
- Planning ahead for your business needs

## BIO VERA LOGISTICS CONSULTANT - ADVANCED OPTIMIZATION

### Packaging Efficiency - Technical Specifications
**Reinforced Boxes System:**
- Box dimensions: Standard 40x30x20cm (24L capacity)
- Material: Triple-wall corrugated cardboard (B-Flute + C-Flute + B-Flute)
- Burst strength: 1,400 kPa minimum
- Edge crush test: 8,000 N/m minimum
- Stacking strength: 1,200 kg (12 boxes high)
- 100% space utilization - no void fillers needed
- Zero damage rate with proper stacking
- Weight capacity per box: 25 kg maximum

**Space Optimization:**
- Standard truck capacity: 33 pallets (1,200mm x 800mm)
- Pallets per truck: 33 units
- Boxes per pallet: 60 boxes (5 layers x 12 boxes)
- Total boxes per truck: 1,980 boxes
- Total volume per truck: 47,520 liters
- Weight capacity per truck: 24,750 kg (at 25kg per box)

### Anti-Waste Driving - Empty Mile Prevention
**System Logic:**
- AI analyzes order quantities before dispatch
- Suggests optimal order quantities to fill trucks
- Example: "Add 2 palettes (120 boxes) to fill truck and reduce transport cost per box by 15%"
- Real-time matching of return trips with new pickups
- Reduces empty truck journeys by up to 40%
- Fuel savings: 35-40% compared to standard logistics
- CO2 reduction: 0.45 kg CO2 per km saved

**Truck Fill Optimization:**
- Minimum fill threshold: 85% capacity (28 pallets)
- Optimal fill: 95-100% capacity (31-33 pallets)
- Cost per box calculation:
  - At 50% fill: €0.85 per box
  - At 85% fill: €0.65 per box
  - At 100% fill: €0.55 per box
- Savings example: Adding 2 palettes saves €0.30 per box on transport

### Technical Parameters - Cold Chain & Temperature Control
**Cerada (Tarpaulin) Specifications:**
- Material: PVC-coated polyester (1,200 g/m²)
- Insulation: 50mm polyurethane foam layer
- Temperature stability: ±2°C variance over 8-hour journey
- Temperature range: 2°C to 8°C (fresh produce)
- Heat reflection: 85% solar radiation reflection
- Air circulation: Ventilated design prevents condensation
- Waterproof rating: IP65 (completely waterproof)

**Route Optimization:**
- CO2 footprint calculation: 0.12 kg CO2 per km per ton
- Standard route: 850 km (Belgrade to Hamburg) = 102 kg CO2 per ton
- Optimized route: 780 km (with Eco-Route) = 93.6 kg CO2 per ton
- Savings: 8.4 kg CO2 per ton (8.2% reduction)
- Fuel consumption: 28-32 L/100km (depending on load)
- Fuel savings with optimization: 3-4 L per 100km

### Simulation Engine - Capacity Calculator
**Input Parameters:**
- Destination city
- Order quantity (boxes or pallets)
- Product type (affects weight per box)

**Output Calculations:**
- Truck fill percentage: (Order quantity / 1,980 boxes) × 100
- Transport cost per box: Base cost / (1 - fill percentage × 0.3)
- Estimated CO2 emissions: Distance × 0.12 kg/km × (Total weight / 1000)
- Fuel consumption: Distance × (28 + (1 - fill percentage) × 4) / 100
- Recommended additional quantity to reach 85% fill
- Cost savings if order is optimized

**Example Calculation:**
- Order: 1,200 boxes to Hamburg (850 km)
- Fill percentage: (1,200 / 1,980) × 100 = 60.6%
- Transport cost per box: €0.75 (at 60% fill)
- Recommended: Add 480 boxes (2.4 pallets) to reach 85% fill
- New cost per box: €0.62 (savings: €0.13 per box = €156 total savings)
- CO2 emissions: 850 km × 0.12 × (30,000 kg / 1000) = 3,060 kg CO2
- Fuel consumption: 850 × 30.4 / 100 = 258.4 liters

### Sustainability Report - Environmental Impact
**Fuel Savings Calculation:**
- Standard packaging: 15% void space = 15% more trucks needed
- Bio Vera packaging: 0% void space = 100% efficiency
- Fuel saved per truck: 3-4 liters per 100km
- Example route (850 km): 25.5-34 liters saved per truck
- Annual savings (100 trucks/month): 30,600-40,800 liters/year
- CO2 reduction: 76.5-102 tons CO2 per year

**Packaging Material Efficiency:**
- Standard boxes: 15% void fillers (bubble wrap, foam)
- Bio Vera boxes: 0% void fillers (reinforced structure)
- Material waste reduction: 15% less packaging material
- Recyclability: 100% recyclable cardboard
- Carbon footprint per box: 0.8 kg CO2 (production)
- Standard box: 0.92 kg CO2 (with void fillers)

### Technical Audit - Quality Specifications
**Box Strength Specifications:**
- Burst strength: 1,400 kPa (tested with 14 kg/cm² pressure)
- Edge crush test: 8,000 N/m (supports 80 kg per meter edge)
- Stacking strength: 1,200 kg (tested with 12 boxes stacked)
- Compression resistance: 2,500 N (tested with Instron machine)
- Drop test: 1.2m drop height, 0% damage rate
- Vibration test: 2 hours at 5-200 Hz, 0% damage

**Thermal Insulation Specifications:**
- Cerada thermal resistance: R-value 1.2 m²·K/W
- Temperature stability: ±2°C over 8 hours
- Heat transfer coefficient: 0.83 W/(m²·K)
- Solar heat gain: 15% (85% reflection)
- Internal temperature variance: Max 2°C difference across truck
- Cold retention: 8 hours at 2-8°C with external temp 25°C

### Logistics Plan - Route Optimization
**Route Planning Algorithm:**
- Multi-stop optimization (minimum distance)
- Traffic-aware routing (real-time updates)
- Weather-based adjustments (avoid adverse conditions)
- Border crossing optimization (minimize wait times)
- Fuel station planning (optimal refueling points)
- Rest stop scheduling (driver compliance)

**Example Route: Belgrade to Hamburg**
- Standard route: 1,050 km, 12 hours, 3 stops
- Optimized route: 850 km, 10.5 hours, 2 stops
- Time savings: 1.5 hours
- Fuel savings: 30 liters
- CO2 reduction: 72 kg CO2
- Cost savings: €45 per trip

**City-to-City Distance Matrix (km):**
- Belgrade to Vienna: 620 km
- Vienna to Munich: 360 km
- Munich to Hamburg: 780 km
- Belgrade to Hamburg (direct): 1,050 km
- Belgrade to Hamburg (optimized): 850 km
- Belgrade to Berlin: 1,100 km
- Belgrade to Frankfurt: 1,050 km
- Belgrade to Stuttgart: 950 km

## PROTOCOL 360 - Quality Control System

### Three-Tier Quality Control

**Level 1: Eco-Safe Audit (Field)**
- Heavy metals absence check
- Nitrate levels verification
- PH value testing
- Moisture levels (48h before harvest)

**Level 2: Biometric & Visual Scan (Packaging Center)**
- Calibration (size)
- Fruit firmness testing
- Film integrity check
- Color deviation (<5%)

**Level 3: Logistics Guard (Transport & Storage)**
- Temperature range (2-8°C)
- Thermal shock detection
- Cold chain continuity
- Automatic alert system

## PRODUCT TRACEABILITY

### QR Code System
- Every product has unique QR code
- Links to digital passport
- Complete traceability information:
  - Origin (farmer name, farm location, GPS)
  - Timeline (harvested, verified, loaded times)
  - Cold chain proof (temperature graph)
  - Sustainability score
  - Freshness countdown
  - Quality certifications

### Digital Passport
- Immutable digital records
- GPS timestamp verification
- Device ID tracking
- Cryptographic linking
- Complete journey from seed to shelf

## PAYMENT SYSTEM

### Escrow Payment
- Payment locked in escrow when buyer pays
- Automatic split on delivery confirmation:
  - 70% to Farmer
  - 20% to Driver
  - 10% Platform fee
- Digital Handshake: Customer scans QR to confirm delivery
- Secure and guaranteed

## MOBILE APP

### Available For
- Growers (field management, batch creation, compliance photos)
- Logistics Partners (mission management, GPS tracking, temperature monitoring)

### Features
- Offline functionality (works without internet)
- GPS tracking
- Barcode scanning
- Real-time synchronization
- Digital scheduling
- Temperature monitoring
- Route optimization

## CONTACT & SUPPORT

### Support Channels
- Contact form at /contact
- Help Center at /help-center
- FAQ page at /faq
- Email: info@biovera.app

### Additional Resources
- About page: /about
- Protocol 360: /protocol-360
- Security & Compliance: /security
- Legal: /legal
`;
  }

  /**
   * Quick responses for common queries
   */
  private getQuickResponses(): Record<string, string> {
    return {
      najbli: `**Grower: "nearest" supplier?** Logged-in growers do not use a public distance map. Open **Suppliers & orders** at \`/grower/where-to-buy\` for **approved B2B suppliers** (material, orders, messages). If the list is empty, check account approval and **Materials**; use **Help Center** (\`/help-center\`) or **Contact** (\`/contact\`) for help.`,

      dobavlj: `**Growers and suppliers (material):** Orders to approved partners: **Suppliers & orders** → \`/grower/where-to-buy\`. **To become a platform supplier** (a company that supplies Bio Vera), use **/suppliers** (separate partner signup). These two flows are different.`,

      'mission tracker': `**Mission Tracker** (\`/grower/portal\`) shows **transport missions** (pickup, driver, status). If you see a server error, refresh or try again while the mission list loads. After registering harvest, the usual next step is **Request transport** (\`/grower/missions/create\`). The product passport lives under **My Batches** / passport link—not in Mission Tracker.`,

      'quality entry': `**Quality entry** (\`/grower/quality-entry\`): one full submission per lot (batch). If it says an entry already exists, do not duplicate—continue with **Request transport** or check **My Batches**. On server errors: check fields, three photos, retry; if it persists, contact support.`,

      berba: `**Harvest plan:** If the app says harvest is already registered for a parcel, do not submit again. Next: **Request transport** (\`/grower/missions/create\`) and track status in **Mission Tracker** (\`/grower/portal\`).`,

      suppl: `**Suppliers—two things:** (1) A **grower** buying material (boxes, film…): **Suppliers & orders** → \`/grower/where-to-buy\` (B2B approved partners). (2) A **company** applying to supply the platform: \`/suppliers\`. If you are a grower asking for "nearest," the platform may not show km on a map—use the B2B list at \`/grower/where-to-buy\` first.`,

      'empty mile': `**Empty Mile Reduction** - Our system automatically matches return trips with new pickups, reducing empty truck journeys by up to 40%. This saves fuel costs, reduces carbon footprint, and increases your revenue per trip. After delivery, the system automatically finds nearby pickups and suggests optimal return routes with cargo. [Learn more about logistics]`,
      
      'eco route': `**Eco-Route Planning** - AI-powered route optimization that considers traffic, weather, and distance to minimize fuel consumption and reduce carbon emissions. Features include automatic route calculation, traffic-aware routing, weather-based adjustments, and real-time GPS tracking. [View logistics partner page]`,
      
      'insurance': `**Insurance Options Available:**
- Weather insurance (protects against bad weather)
- Crop failure insurance
- Price insurance (protects against price drops)
- Transport insurance (covers during transport)
- One-click insurance purchase through platform
- Automatic claim processing
We help you find the best insurance options. [Contact us for insurance]`,
      
      'producer support': `**Complete Support for Producers:**
- Complete mobile app (offline-first)
- Automated batch tracking
- Quality control assistance (Protocol 360)
- Payment processing (automatic, 3-5 days)
- Market access (direct to EU buyers)
- Certification support (we help you get GlobalG.A.P.)
- Training and resources (all guides as PDFs)
- Insurance options available
- Fair pricing (70% to farmer)
- Vera Bonus system
[View growers page]`,
      
      'payment': `**Payment Process:**
- Payments processed automatically upon successful delivery verification
- Escrow system ensures secure transactions
- Farmers receive payment within 3-5 business days
- 70% of sale price goes to farmer
- 20% to driver
- 10% platform fee
- No paperwork, all digital
[Learn more about payments]`,
    };
  }

  /**
   * Handle user query with AI
   */
  async handleQuery(
    query: string,
    language?: string,
    sessionId?: string,
    userInfo?: { ipAddress?: string; userAgent?: string },
  ): Promise<{
    answer: string;
    suggestedActions?: Array<{ label: string; url: string }>;
    quickActions?: Array<{ label: string; query: string }>;
    askForContact?: boolean;
    sessionId: string;
  }> {
    // Generate or use existing session ID
    const currentSessionId = sessionId || crypto.randomUUID();
    const knowledgeBase = this.getKnowledgeBase();
    const quickResponses = this.getQuickResponses();

    // Get or create conversation
    let conversation = await this.prisma.ai_conversations.findFirst({
      where: { sessionId: currentSessionId },
      orderBy: { updatedAt: 'desc' },
    });

    const messages = conversation?.messages as Array<{ role: string; content: string; timestamp: string }> || [];
    const messageCount = messages.length;

    // Check for quick responses first
    const lowerQuery = query.toLowerCase();
    for (const [key, response] of Object.entries(quickResponses)) {
      if (lowerQuery.includes(key)) {
        // Save conversation
        await this.saveConversation(currentSessionId, query, response, userInfo, messages);
        
        const quickActions = this.generateQuickActions(query);
        
        return {
          answer: response,
          suggestedActions: this.extractSuggestedActions(response),
          quickActions,
          sessionId: currentSessionId,
          askForContact: messageCount >= 2, // Ask after 2+ messages
        };
      }
    }

    const systemPrompt = `You are the Bio Vera Platform Assistant - a comprehensive information system for all stakeholders.

Your role: Provide helpful information with PRIMARY FOCUS on buyers and growers, then suppliers and logistics partners. You are knowledgeable about all aspects of the Bio Vera platform.

Priority Order (from most important to least):
1. **Buyers/Distributors** (PRIMARY FOCUS) - Information about becoming a buyer, ordering process, product availability, pre-orders, how to purchase, product traceability, QR code verification
2. **Growers/Producers** (SECONDARY FOCUS) - Information about becoming a grower, certification, field management, **the logged-in grower web app** (routes under /grower), payment process, quality standards, mobile app usage, how to join, **what to do when an error or warning appears, and the next step in the flow (harvest → transport → mission tracker, quality entry, B2B suppliers)**
3. **Suppliers** - Information about becoming a supplier, requirements, integration process. **Distinguish:** (A) a company that wants to **sell to Vera** = public /suppliers; (B) a **logged-in grower** looking to **order materials** = /grower/where-to-buy (B2B), NOT the public suppliers page
4. **Logistics Partners** - Load optimization analysis, empty mile reduction, route efficiency, packaging integrity, mathematical proof of efficiency

Your persona:
- Professional and helpful assistant
- PRIMARY focus on buyers and growers - they are the most important users
- For buyers: Emphasize ease of ordering, product quality, traceability, how to get started
- For growers: Emphasize support, certification help, payment process, how to join, and **concrete in-app paths** from the knowledge base (Mission Tracker, Request transport, Suppliers & orders, Quality entry, Materials)
- For logistics questions: Use technical terms like "load optimization", "empty mile reduction", "packaging integrity" and provide mathematical proof
- For other questions: Be informative, clear, and supportive
- Speak in the SAME LANGUAGE as the user's question (default to English if unclear)
- Do NOT use emojis in responses
- Format numbers, percentages, and calculations in monospaced style (use code formatting for tables and calculations)
- When providing logistics calculations, show mathematical proof of efficiency

When a buyer/distributor asks about logistics, delivery, or ordering:
- IMMEDIATELY provide Load Optimization Analysis with mathematical proof:
  * Truck fill percentage: (Order quantity / 1,980 boxes) × 100
  * Waste calculation: If below 85%, calculate exact waste: (1,980 × 0.85) - Order quantity = X boxes wasted
  * Cost per box formula: Base cost / (1 - fill percentage × 0.3)
  * If below 85% fill, state: "Current fill: X%. Resource waste: Y boxes (Z pallets). Add Y boxes to eliminate waste."
- ALWAYS show Route Efficiency Report with mathematical proof:
  * Distance optimization: Standard route X km → Optimized route Y km (savings: Z km = (Z/80) hours saved)
  * Fuel consumption: Distance × (28 + (1 - fill percentage / 100) × 4) / 100 liters
  * CO2 emissions: Distance × 0.12 kg/km × (Total weight / 1000) kg CO2
  * Format calculations in monospaced style (code blocks for tables)
- Provide mathematical proof of resource efficiency:
  * Packaging integrity: 100% utilization vs 85% standard = 15% waste eliminated
  * Empty mile reduction: Up to 40% reduction = X liters saved per trip
  * Fuel savings formula: (Standard consumption - Optimized consumption) × Distance = Y liters saved

When asked about packaging quality or packaging integrity:
- Provide Packaging Integrity Audit with technical specifications:
  * Burst strength: 1,400 kPa (tested with 14 kg/cm² pressure)
  * Edge crush test: 8,000 N/m (supports 80 kg per meter edge)
  * Stacking strength: 1,200 kg (tested with 12 boxes stacked)
  * Void space elimination: 0% vs standard 15% = 15% waste reduction
- Show thermal insulation specifications:
  * Cerada R-value: 1.2 m²·K/W
  * Temperature stability: ±2°C over 8 hours
  * Heat transfer coefficient: 0.83 W/(m²·K)
- Format specifications in monospaced style (code blocks)

When asked about sustainability or environmental impact:
- Provide Resource Efficiency Report:
  * Fuel savings calculation: (Standard consumption - Optimized consumption) × Distance = X liters saved per trip
  * Annual savings: X liters × 100 trips/month × 12 months = Y liters/year
  * CO2 reduction: X liters × 2.31 kg CO2/liter = Y kg CO2 saved per trip
  * Annual CO2 reduction: Y kg × 1,200 trips/year = Z tons CO2/year
- Show packaging efficiency metrics:
  * Void space elimination: 0% vs 15% standard = 15% material waste reduction
  * Fuel saved per truck: 3-4 liters per 100km due to 100% space utilization
- Format all calculations in monospaced style with formulas

IMPORTANT RULES:
1. Answer in the SAME LANGUAGE as the user's question (default to English)
2. PRIORITY ORDER: Buyers (most important) → Growers (second) → Suppliers → Logistics (least priority)
3. For BUYERS: Focus on ordering process, product availability, how to purchase, traceability, getting started
4. For GROWERS: Focus on how to join, certification help, payment process, support available, and **operational help** (menu paths /grower/..., errors, next steps after harvest, quality entry, transport)
5. For logistics questions: IMMEDIATELY run calculations and show results with mathematical proof
6. For buyers/growers questions: Be informative, clear, and supportive - provide detailed information from knowledge base
7. ALWAYS provide specific numbers, percentages, and calculations for logistics questions - never vague statements
8. For buyers asking about orders, calculate fill percentage and suggest optimizations
9. Show "Logistics Plan" with exact route data when asked about delivery
10. Use the knowledge base provided to answer accurately for ALL categories
11. For technical questions, provide exact specifications from knowledge base
12. Do NOT use emojis in your responses
13. If calculation is needed, show the formula and result (e.g., "Fill percentage: (1,200 boxes / 1,980 boxes) × 100 = 60.6%")
14. Always suggest optimizations when order is below 85% fill (for logistics questions)
15. **Never** answer with a generic "I don't have that information" for: grower **where to find suppliers / nearest supplier** (use **/grower/where-to-buy** and explain B2B list), **duplicate harvest**, **quality entry already exists** or **internal error** (use the knowledge base: next steps, refresh, help). Only fall back to /help-center and /contact when the question is **not** covered in the knowledge base or needs account-specific data
16. When the user says they are a **grower** and ask **where** to find a supplier, **nearest** supplier, or **dobavljač**: direct them to **Suppliers & orders** in the app menu, URL **/grower/where-to-buy**. Explain the platform uses **approved** B2B partners (not a public distance map)
17. For **"why"** or **"what should I do"** about errors (mission tracker, quality entry, transport blocked): use section **"ČESTA PITANJA I ZAŠTO JE OVAKO"** and **"GROWER WEB DASHBOARD"** in the knowledge base; give 2–3 concrete actions (which menu item, which route)

Calculation Formulas (use these):
- Truck fill percentage: (Order quantity / 1,980 boxes) × 100
- Transport cost per box: Base cost / (1 - fill percentage × 0.3)
- CO2 emissions: Distance (km) × 0.12 kg/km × (Total weight in kg / 1000)
- Fuel consumption: Distance × (28 + (1 - fill percentage) × 4) / 100
- Cost savings: (Current cost per box - Optimized cost per box) × Order quantity

Knowledge Base:
${knowledgeBase}`;

    if (!this.openai) {
      return {
        answer: 'AI Assistant is currently unavailable. Please contact our support team at /contact for assistance.',
        suggestedActions: [{ label: 'Contact Support', url: '/contact' }],
        quickActions: [],
        askForContact: false,
        sessionId: currentSessionId,
      };
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.7,
        max_tokens: 900,
      });

      let answer = completion.choices[0].message.content;

      // Enhance answer with calculations if logistics-related
      answer = this.enhanceWithCalculations(query, answer);

      // Extract suggested actions
      const suggestedActions = this.extractSuggestedActions(answer);

      // Generate quick actions based on query
      const quickActions = this.generateQuickActions(query);

      // Save conversation
      await this.saveConversation(currentSessionId, query, answer, userInfo, messages);

      // Determine if we should ask for contact (after 2+ messages and user seems interested)
      const shouldAskForContact = messageCount >= 2 && this.shouldAskForContact(query, answer);

      return {
        answer,
        suggestedActions,
        quickActions,
        askForContact: shouldAskForContact,
        sessionId: currentSessionId,
      };
    } catch (error) {
      console.error('AI Assistant error:', error);
      throw new Error('Failed to process query. Please try again.');
    }
  }

  /**
   * Extract suggested actions/links from answer
   */
  private extractSuggestedActions(answer: string): Array<{ label: string; url: string }> {
    const actions: Array<{ label: string; url: string }> = [];
    
    const actionPatterns = [
      { pattern: /\/growers/g, label: 'Visit Growers Page', url: '/growers' },
      { pattern: /\/grower\/where-to-buy/g, label: 'Grower: Suppliers & orders (B2B)', url: '/grower/where-to-buy' },
      { pattern: /\/grower\/portal/g, label: 'Grower: Mission Tracker', url: '/grower/portal' },
      { pattern: /\/grower\/missions\/create/g, label: 'Grower: Request transport', url: '/grower/missions/create' },
      { pattern: /\/grower\/quality-entry/g, label: 'Grower: Quality entry', url: '/grower/quality-entry' },
      { pattern: /\/grower\/materials/g, label: 'Grower: Materials', url: '/grower/materials' },
      { pattern: /\/grower\/batches/g, label: 'Grower: My Batches', url: '/grower/batches' },
      { pattern: /\/grower\/fields/g, label: 'Grower: My Fields', url: '/grower/fields' },
      { pattern: /\/grower\/season/g, label: 'Grower: Steps (season)', url: '/grower/season' },
      { pattern: /\/suppliers/g, label: 'Visit Suppliers Page', url: '/suppliers' },
      { pattern: /\/register\/buyer/g, label: 'Register as Buyer', url: '/register/buyer' },
      { pattern: /\/logistics-partner/g, label: 'Become Logistics Partner', url: '/logistics-partner' },
      { pattern: /\/contact/g, label: 'Contact Support', url: '/contact' },
      { pattern: /\/faq/g, label: 'View FAQ', url: '/faq' },
      { pattern: /\/help-center/g, label: 'Help Center', url: '/help-center' },
      { pattern: /\/protocol-360/g, label: 'Protocol 360', url: '/protocol-360' },
    ];

    actionPatterns.forEach(({ pattern, label, url }) => {
      if (pattern.test(answer)) {
        actions.push({ label, url });
      }
    });

    return actions;
  }

  /**
   * Generate quick actions based on query
   */
  private generateQuickActions(query: string): Array<{ label: string; query: string }> {
    const lowerQuery = query.toLowerCase();
    const actions: Array<{ label: string; query: string }> = [];

    if (lowerQuery.includes('grower') || lowerQuery.includes('producer') || lowerQuery.includes('proizvo')) {
      actions.push(
        { label: 'Where are suppliers (logged in)', query: 'I am a grower. Where do I find suppliers and order materials in the app?' },
        { label: 'After harvest registered', query: 'I already registered harvest. What should I do next on Bio Vera?' },
        { label: 'Mission Tracker error', query: 'Mission Tracker shows an error. What is it and what should I do?' },
        { label: 'Quality entry problem', query: 'Quality entry fails or says already exists. What should I do?' },
        { label: 'Application Process', query: 'How do I apply to become a grower?' },
        { label: 'Insurance Options', query: 'What insurance options are available for growers?' },
        { label: 'Payment Process', query: 'How does the payment process work for growers?' },
        { label: 'Requirements', query: 'What are the requirements to become a grower?' },
      );
    }

    if (lowerQuery.includes('supplier')) {
      actions.push(
        { label: 'How to Apply', query: 'How do I become a supplier?' },
        { label: 'Requirements', query: 'What are the requirements to become a supplier?' },
        { label: 'Benefits', query: 'What are the benefits of being a supplier?' },
        { label: 'Certifications', query: 'What certifications are required for suppliers?' },
      );
    }

    if (lowerQuery.includes('logistics') || lowerQuery.includes('driver')) {
      actions.push(
        { label: 'Empty Mile Reduction', query: 'What is Empty Mile Reduction?' },
        { label: 'Eco-Route Planning', query: 'How does Eco-Route Planning work?' },
        { label: 'How to Apply', query: 'How do I become a logistics partner?' },
        { label: 'Benefits', query: 'What are the benefits for logistics partners?' },
      );
    }

    if (lowerQuery.includes('buyer') || lowerQuery.includes('distributor')) {
      actions.push(
        { label: 'Registration', query: 'How do I register as a buyer?' },
        { label: 'Pre-Order System', query: 'How does the pre-order system work?' },
        { label: 'How to Order', query: 'How do I place an order?' },
        { label: 'Benefits', query: 'What are the benefits for buyers?' },
      );
    }

    // Default quick actions if no specific category detected
    if (actions.length === 0) {
      actions.push(
        { label: 'For Growers', query: 'How do I become a grower?' },
        { label: 'For Suppliers', query: 'How do I become a supplier?' },
        { label: 'For Logistics', query: 'How do I become a logistics partner?' },
        { label: 'For Buyers', query: 'How do I become a buyer?' },
      );
    }

    return actions;
  }

  /**
   * Save conversation to database
   */
  private async saveConversation(
    sessionId: string,
    userQuery: string,
    aiResponse: string,
    userInfo?: { ipAddress?: string; userAgent?: string },
    existingMessages: Array<{ role: string; content: string; timestamp: string }> = [],
  ) {
    const newMessages = [
      ...existingMessages,
      {
        role: 'user',
        content: userQuery,
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      },
    ];

    // Find existing conversation by sessionId
    const existing = await this.prisma.ai_conversations.findFirst({
      where: { sessionId },
      orderBy: { updatedAt: 'desc' },
    });

    if (existing) {
      await this.prisma.ai_conversations.update({
        where: { id: existing.id },
        data: {
          messages: newMessages,
          userInfo: userInfo || existing.userInfo || {},
          updatedAt: new Date(),
        },
      });
    } else {
      await this.prisma.ai_conversations.create({
        data: {
          id: crypto.randomUUID(),
          sessionId,
          messages: newMessages,
          userInfo: userInfo || {},
          contactRequested: false,
        },
      });
    }
  }

  /**
   * Enhance answer with calculations for logistics queries
   */
  private enhanceWithCalculations(query: string, answer: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Check if query asks for logistics plan, conditions, or delivery info
    const asksForLogisticsPlan = /(conditions?|uslovi|delivery|logistics|how.*work|what.*conditions|deliver|ship|transport|route|plan)/i.test(query);
    const hasQuantity = /\d+\s*(boxes?|pallets?|kg|tons?)/i.test(query);
    const hasDestination = /(to|destination|deliver|ship|transport).*\b(berlin|hamburg|munich|vienna|frankfurt|stuttgart|belgrade|city|km|kilometers?)\b/i.test(query);
    const hasCalculationRequest = /(calculate|compute|how much|cost|price|fill|capacity|co2|fuel|emission)/i.test(query);

    // If asking for logistics plan/conditions, show default plan
    if (asksForLogisticsPlan && !hasQuantity) {
      const defaultCity = this.extractCity(query) || 'Hamburg';
      const defaultQuantity = 1000; // Default example
      return this.generateLogisticsPlan(defaultCity, defaultQuantity, answer);
    }

    if (hasQuantity && (hasDestination || hasCalculationRequest || asksForLogisticsPlan)) {
      // Extract numbers from query
      const quantityMatch = query.match(/(\d+)\s*(boxes?|pallets?|kg|tons?)/i);
      const destinationMatch = query.match(/\b(berlin|hamburg|munich|vienna|frankfurt|stuttgart|belgrade)\b/i);
      
      if (quantityMatch) {
        let quantity = parseInt(quantityMatch[1]);
        const unit = quantityMatch[2]?.toLowerCase();
        
        // Convert to boxes if needed
        if (unit?.includes('pallet')) {
          quantity = quantity * 60; // 60 boxes per pallet
        } else if (unit?.includes('kg') || unit?.includes('ton')) {
          quantity = Math.floor(quantity / 25); // 25 kg per box
        }
        
        // Calculate metrics
        const fillPercentage = (quantity / 1980) * 100;
        const baseCost = 0.75;
        const costPerBox = baseCost / (1 - (fillPercentage / 100) * 0.3);
        const destination = destinationMatch ? destinationMatch[1] : 'Hamburg';
        const distances: Record<string, number> = {
          hamburg: 850,
          berlin: 1100,
          munich: 950,
          vienna: 620,
          frankfurt: 1050,
          stuttgart: 950,
          belgrade: 0,
        };
        const distance = distances[destination.toLowerCase()] || 850;
        const totalWeight = quantity * 25; // kg
        const co2Emissions = distance * 0.12 * (totalWeight / 1000);
        const fuelConsumption = distance * (28 + (1 - fillPercentage / 100) * 4) / 100;
        
        // Add calculation section to answer with monospaced formatting
        const calculationSection = `\n\n**LOAD OPTIMIZATION ANALYSIS**

\`\`\`
Truck Fill:     ${fillPercentage.toFixed(1).padStart(6)}%
Cost/Box:       €${costPerBox.toFixed(2).padStart(6)}
Total Cost:     €${(costPerBox * quantity).toFixed(2).padStart(8)}
CO2 Emissions:  ${co2Emissions.toFixed(1).padStart(7)} kg
Fuel Consumed:  ${fuelConsumption.toFixed(1).padStart(7)} L
Distance:       ${distance.toString().padStart(7)} km
\`\`\``;

        if (fillPercentage < 85) {
          const neededBoxes = Math.ceil(1980 * 0.85) - quantity;
          const neededPallets = Math.ceil(neededBoxes / 60);
          const optimizedCost = baseCost / (1 - 0.85 * 0.3);
          const optimizedFill = 85;
          const optimizedCo2 = distance * 0.12 * ((neededBoxes + quantity) * 25 / 1000);
          const optimizedFuel = distance * (28 + (1 - optimizedFill / 100) * 4) / 100;
          const savings = (costPerBox - optimizedCost) * quantity;
          
          const wasteBoxes = Math.ceil(1980 * 0.85) - quantity;
          const optimizationSection = `\n\n**WASTE ELIMINATION ANALYSIS**

Current fill: ${fillPercentage.toFixed(1)}% | Waste: ${wasteBoxes} boxes (${neededPallets} pallets)

\`\`\`
Action:         Add ${neededBoxes} boxes to eliminate waste
New Fill:       85.0%
Cost/Box:       €${optimizedCost.toFixed(2).padStart(6)} (savings: €${savings.toFixed(2)})
CO2 Optimized:  ${optimizedCo2.toFixed(1).padStart(7)} kg (reduction: ${(co2Emissions - optimizedCo2).toFixed(1)} kg)
Fuel Optimized: ${optimizedFuel.toFixed(1).padStart(7)} L (savings: ${(fuelConsumption - optimizedFuel).toFixed(1)} L)
\`\`\`

Resource waste eliminated: ${wasteBoxes} boxes = ${((wasteBoxes / 1980) * 100).toFixed(1)}% capacity recovered.`;
          
          return answer + calculationSection + optimizationSection + this.generateLogisticsPlan(destination, quantity + neededBoxes, '');
        }
        
        return answer + calculationSection + this.generateLogisticsPlan(destination, quantity, '');
      }
    }
    
    return answer;
  }

  /**
   * Generate Logistics Plan for a destination
   */
  private generateLogisticsPlan(city: string, quantity: number, existingAnswer: string): string {
    const distances: Record<string, { distance: number; stops: number; time: number }> = {
      hamburg: { distance: 850, stops: 2, time: 10.5 },
      berlin: { distance: 1100, stops: 3, time: 13 },
      munich: { distance: 950, stops: 2, time: 11.5 },
      vienna: { distance: 620, stops: 1, time: 7.5 },
      frankfurt: { distance: 1050, stops: 2, time: 12.5 },
      stuttgart: { distance: 950, stops: 2, time: 11.5 },
      belgrade: { distance: 0, stops: 0, time: 0 },
    };

    const cityLower = city.toLowerCase();
    const route = distances[cityLower] || distances.hamburg;
    
    const fillPercentage = quantity > 0 ? (quantity / 1980) * 100 : 85;
    const totalWeight = quantity * 25;
    const co2Emissions = route.distance * 0.12 * (totalWeight / 1000);
    const fuelConsumption = route.distance * (28 + (1 - fillPercentage / 100) * 4) / 100;
    const baseCost = 0.75;
    const costPerBox = baseCost / (1 - (fillPercentage / 100) * 0.3);
    
    if (route.distance === 0) {
      return existingAnswer; // Belgrade is origin, no plan needed
    }

    const standardDistance = route.distance + 200; // Standard route is longer
    const distanceSavings = standardDistance - route.distance;
    const timeSavings = (distanceSavings / 80).toFixed(1); // Assuming 80 km/h average
    
    const standardFuel = fuelConsumption * 1.15; // 15% more due to standard packaging
    const fuelSavings = standardFuel - fuelConsumption;
    const standardCo2 = co2Emissions * 1.15;
    const co2Savings = standardCo2 - co2Emissions;
    
    const logisticsPlan = `\n\n**ROUTE EFFICIENCY REPORT: Bio Vera Farms → ${city.charAt(0).toUpperCase() + city.slice(1)}**

\`\`\`
Distance:       ${route.distance.toString().padStart(7)} km (optimized)
                ${standardDistance.toString().padStart(7)} km (standard)
Savings:        ${distanceSavings.toString().padStart(7)} km (${((distanceSavings / standardDistance) * 100).toFixed(1)}%)

Stops:          ${route.stops.toString().padStart(7)} (minimum)
Time:           ${route.time.toFixed(1).padStart(7)} h (${timeSavings}h saved)

Fuel:           ${fuelConsumption.toFixed(1).padStart(7)} L (optimized)
                ${standardFuel.toFixed(1).padStart(7)} L (standard)
Savings:        ${fuelSavings.toFixed(1).padStart(7)} L (${((fuelSavings / standardFuel) * 100).toFixed(1)}%)

CO2:            ${co2Emissions.toFixed(1).padStart(7)} kg (optimized)
                ${standardCo2.toFixed(1).padStart(7)} kg (standard)
Reduction:      ${co2Savings.toFixed(1).padStart(7)} kg (${((co2Savings / standardCo2) * 100).toFixed(1)}%)
\`\`\`

${quantity > 0 ? `**COST ANALYSIS**\n\`\`\`\nTruck Fill:     ${fillPercentage.toFixed(1).padStart(6)}%\nCost/Box:       €${costPerBox.toFixed(2).padStart(6)}\nTotal Cost:     €${(costPerBox * quantity).toFixed(2).padStart(8)}\n\`\`\`\n` : ''}

**TECHNICAL SPECIFICATIONS**
- Route Type: Optimized (traffic-aware, weather-adjusted, border-optimized)
- Cold Chain: 2-8°C maintained (±2°C stability)
- GPS Tracking: Real-time every 15 minutes
- Empty Mile Reduction: Up to 40% via return trip matching
- Packaging Integrity: 100% space utilization (0% void vs 15% standard)`;

    return existingAnswer + logisticsPlan;
  }

  /**
   * Extract city name from query
   */
  private extractCity(query: string): string | null {
    const cities = ['berlin', 'hamburg', 'munich', 'vienna', 'frankfurt', 'stuttgart', 'belgrade'];
    const lowerQuery = query.toLowerCase();
    
    for (const city of cities) {
      if (lowerQuery.includes(city)) {
        return city;
      }
    }
    
    return null;
  }

  /**
   * Determine if we should ask for contact permission
   */
  private shouldAskForContact(query: string, answer: string): boolean {
    const contactKeywords = [
      'interested',
      'want to',
      'would like',
      'apply',
      'become',
      'register',
      'sign up',
      'contact',
      'help',
      'more information',
    ];

    const lowerQuery = query.toLowerCase();
    return contactKeywords.some((keyword) => lowerQuery.includes(keyword));
  }

  /**
   * Submit contact request
   */
  async submitContactRequest(data: {
    sessionId: string;
    name: string;
    email: string;
    phone?: string;
    message?: string;
    consentGiven: boolean;
  }) {
    // Update conversation with contact info
    await this.prisma.ai_conversations.updateMany({
      where: { sessionId: data.sessionId },
      data: {
        contactRequested: true,
        contactInfo: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          message: data.message || null,
          consentGiven: data.consentGiven,
          submittedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    });

    // Send email notification to admin
    // TODO: Integrate with email service

    return { success: true, message: 'Contact request submitted successfully' };
  }

  /**
   * Get all conversations for admin
   */
  async getAllConversations(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.ai_conversations.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ai_conversations.count(),
    ]);

    return {
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get conversations with contact requests
   */
  async getContactRequests(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.ai_conversations.findMany({
        where: { contactRequested: true },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ai_conversations.count({
        where: { contactRequested: true },
      }),
    ]);

    return {
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
