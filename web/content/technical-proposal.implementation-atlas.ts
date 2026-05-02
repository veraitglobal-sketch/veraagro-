/**
 * Implementation atlas — maps narrative to concrete NestJS controllers and guard patterns.
 * Paths are relative to the API base URL configured for each deployment (e.g. /api prefix if reverse-proxied).
 */
import type { TechnicalProposalChapter } from "@/content/technical-proposal.part-a";

export const TECHNICAL_PROPOSAL_IMPLEMENTATION_ATLAS: readonly TechnicalProposalChapter[] = [
  {
    id: "impl-domain-map",
    title: "Implementation atlas — 1. Backend domain map (non-exhaustive)",
    paragraphs: [
      "The production API is modularised into NestJS feature slices. Identity and session traffic flows through `JwtAuthGuard`; mutating routes additionally pair `RolesGuard` with `@Roles(...)`, and some hot paths use `@Throttle` rate limits (example: `POST /field-entries` is capped at ten calls per minute per user to reduce abuse). Below, “path” denotes the controller’s base segment as declared in `@Controller('…')`.",
      "Grower / estate geometry: `GET`/`POST …/estates`, `…/parcels`, `…/plot-mapper`, `…/geofencing`—polygons that `SyncService` and `IntegrityGuardService` later validate against field GPS samples.",
      "Cultivation intake: `POST /field-entries` (online, throttled) mirrors the offline egress path through `POST /sync/field-entries` guarded for `GROWER`/`FARMER` plus elevated operators; coordinators/admins reconcile delayed rows via `GET /sync/late-entries`.",
      "Integrity inputs & compliance artefacts: whitelist-driven chemistry checks feed `compliance_logs`; related HTTP surfaces span `material-control`, `seed` lifecycle via `…/seeds`, `supplier`/`b2b-suppliers`, and admin governance under `admin`, `audit-trail`, `security-alerts`, `operations`, `kill-switch`.",
      "Batch & QA: `batches`, `quality-entry`, `batch-history`, `inventory`, `package-badges`, `material-control`, `vera-bonus`, `standard-engine`, `trust-score`. Quality submission gates shipment readiness endpoints such as `GET /quality-entry/can-create-shipment/:batchId` for supervisory automation.",
      "Cold chain & logistics: `missions` (grower-created runs, logistics acceptance, lifecycle steps, admin orchestration tying buyer orders via `POST /missions/admin/from-order`), companion resources `temperature`, `waybills`, `deliveries`, logistics partner subspaces `logistics-partner`, `logistics-partner/drivers`, `logistics-partner/vehicles`, `logistics-optimizer`, `distributors`, `export-automator`.",
      "Commerce & treasury: `orders`, `payments`, `invoices`, `wallets`, `buyers`, `buyer-trade-panel`, exposure to programmatic pricing via `market-prices`/surfaces that feed quoting logic.",
      "Transparency & buyer storytelling: `digital-passports` (authenticated generation plus public batch lookup), `qr` (certificate resolution, PDF passport download), `vera-transparency`, `mission-passport`, `public/badges` for lightweight retail surfaces.",
      "Supplier enablement: `suppliers`, `b2b-suppliers`, commercial agent flows where applicable; these must stay aligned with `bio_white_list` governance so storefront SKUs cannot contradict Integrity Guard adjudication elsewhere.",
      "Observability & platform ops: `/health`, `command-control`, `aeo`, `vera-insights`, `ai-assistant` (experimental analytics copilots)—none substitute for dossier subgraph truth but accelerate internal triage when wired responsibly.",
      "Augmentative features (blockchain hash registration, smart-lock narratives, parcel public plot codes) coexist as optional overlays—core diligence still hinges on Postgres lineage, not auxiliary ledgers.",
    ],
  },
  {
    id: "impl-grower-offline-flow",
    title: "Implementation atlas — 2. Grower path: capture, sync, enforcement",
    paragraphs: [
      "Happy-path online capture: authenticated growers call `POST /field-entries` with JSON bodies matching service expectations; the controller enforces throttling while `FieldEntriesService` persists rows subject to the same integrity predicates applied during bulk sync.",
      "Weak-connectivity path: mobile clients buffer structured rows locally (SQLite in Expo stacks; IndexedDB parallels on cautious web flows) keyed by provisional offline IDs plus `createdAt`, optional `deviceFingerprint` / `deviceId`, and enumerated field types `{ PRSKANJE, SETVA, BERBA }` aligning spray, sow and harvest arcs.",
      "When connectivity returns the client bursts `POST /sync/field-entries` with `{ entries: [...] }`; `SyncController` restricts roles (`GROWER`, `FARMER`, admins). `SyncService` performs batch fan-out (~50-entry chunks configurable in code), polygon containment checks converting JSON estate geometry into computational point sets, chronological lateness routing beyond the configured hour threshold, and fertilizer barcode evaluation through `ComplianceService` before any compliance log or downstream entity is created.",
      "Failure semantics: each rejected row increments `failed` with reason strings (typical messages include Bio-White-List violations or boundary failures); late-but-valid rows increment `late` and surface for human coordination via `GET /sync/late-entries` (`SUPER_ADMIN`, `ADMIN`, `COORDINATOR`).",
      "Parallel guard rail: `IntegrityGuardMiddleware` inspects HTTP bodies on selected routes for `barcode`, `fertilizerBarcode`, or `seedSerialNumber`, delegating to `IntegrityGuardService` so alternate POST shapes cannot bypass validation simply by choosing a different controller entry point.",
      "Seed integrity currently resolves through `prisma.seeds` serial uniqueness; assignment-to-farmer validation remains annotated TODO in service code—document readers should treat partner seed distribution discipline as both product policy and engineering backlog until explicitly closed.",
      "Polygon nuance: when estates collapse to a centroid representation, validation tolerates a radius heuristic (≈100m) before rejecting—important for legacy geometry imports while still constraining obvious spoofing.",
      "Post-sync, `compliance_logs` capture fingerprinted evidence trails (`deviceFingerprint`, optional `offlineId`, GIS columns, `isWithinFarm`) closing the loop for auditors who distrust mobile-only narratives.",
    ],
  },
  {
    id: "impl-logistics-missions",
    title: "Implementation atlas — 3. Logistics: missions, temperature, handovers",
    paragraphs: [
      "Growers initiate refrigerated movement with `POST /missions` (`GROWER`/`FARMER`). Payloads include pickup JSON, textual addresses, optional `destinationCity` (e.g. grouping Hamburg-bound programmes), `loadInstructions`, and links to batches or harvest announcements depending on operating template.",
      "Partners discover work through `GET /missions/my-missions?scope=logistics|grower`—controller logic resolves the caller’s effective role when users carry multiple hats. Unassigned pool missions move into a partner account via `POST /missions/:id/claim` followed by `PUT /missions/:id/accept` with acceptance metadata.",
      "Operational adjustments: `PATCH /missions/:id/assigned-logistics-driver` binds the human driver profile under the logistics company; `PATCH /missions/:id/lifecycle` advances discrete logistics steps using DTO-enumerated `step` values consumed by `MissionsService`.",
      "Temperature capture attaches through `temperature` module endpoints (guarded per route) associating readings with `missionId`, `batchId`, optional `vehicleId`, `sensorId`, `deviceId`, including `isOutOfRange` flags for alerting automations.",
      "Custody handovers are not implied by mission status alone: `POST /quality-entry/handover` records structured logistics events, `POST /quality-entry/handover/receiver-proof` captures receiver identity/signature payloads with PDF hash persistence on `logistics_handovers`, and `GET /quality-entry/handover/mission/:missionId/receiver-pdf` streams inline PDF evidence to entitled roles (logistics, grower, partner, admin tiers).",
      "Border friction visibility: `border_wait_times` model links to missions so corridor pilots can evidence dwell times without reconstructing driver chat logs—especially relevant for EU external border crossing narratives in diligence decks.",
      "Admin alignment with buyer demand: `POST /missions/admin/from-order` materialises missions from sales orders, ensuring `fulfillingEstateId` semantics in `orders` propagate into execution objects instead of orphan logistics tickets.",
      "Failure drill: if handshake PDFs or temperature tails remain incomplete, `GET /quality-entry/can-create-shipment/:batchId` should return false—buyers treat that boolean as a hard gate before releasing additional purchase order waves.",
    ],
  },
  {
    id: "impl-passport-qr-public",
    title: "Implementation atlas — 4. Passports, QR verification, package badges",
    paragraphs: [
      "Digital dossier generation: authenticated users call `POST /digital-passports/generate` with `{ estateId, parcelIds? }`, persisting `exportData`, `passportHash`, `status`, and optional signing metadata for downstream verification.",
      "Authoritative fetch by primary key: `GET /digital-passports/:id`. Batch-keyed retrieval is implemented at `GET /digital-passports/batch/:batchId` with an inline developer comment asserting QR-friendly public semantics; operationally verify whether class-scoped `JwtAuthGuard` is bypassed (e.g. via `@Public()` metadata or gateway rules)—if not, consumer QR flows should rely instead on expressly unauthenticated QR routes (`/qr/*` certificate/verify/pdf) unless tokens are minted reader-side.",
      "Retail QR stacks: growers/coordinators may mint payload metadata via `POST /qr/generate/:batchId`. Consumers resolve `GET /qr/certificate/:qrId` while `GET /qr/verify/:batchId` normalises BIO-VERA prefixed identifiers; downloadable artifact `GET /qr/verify/:batchId/pdf` returns the full passport PDF for buyer diligence packages.",
      "Package-level storytelling is elevated through `POST/GET …/package-badges` plus `GET /public/badges/:token` flows—ideal for SKU shelf cards linking back to deterministic batch arcs without exposing entire estate databases.",
      "Mission-scoped passports (where enabled) augment buyer UX via `mission-passport` controllers so logistics milestones appear adjacent to QA photography expectations drawn from `bio_vera_standards`.",
      "Operational caution: blockchain registration endpoints (`api/blockchain` namespace) remain optional; diligence reviewers should insist on cryptographic integrity of Postgres foreign keys plus signed PDF artefacts rather than conflating chain hashes with substantive QA.",
      "Consistency rule: passport hashes, QR IDs, batch IDs (`batches.batchId`) and packaging badge tokens must converge in monitoring dashboards—any drift between marketing printed codes and authoritative tables is treated as Sev-1 storytelling risk.",
    ],
  },
  {
    id: "impl-channel-parity",
    title: "Implementation atlas — 5. Channel surfaces: grower portal ingest & journey UX",
    paragraphs: [
      "Beyond raw field-entry sync the API exposes `…/grower-portal/*` guarded exclusively for grower personas. Mobile offline drafts can hydrate server state through `POST /grower-portal/products`, `POST /grower-portal/costs`, `POST /grower-portal/certificate-photos`—explicit hooks for SKU/cost dossier enrichment and eventual asset upload choreography.",
      "Operational visibility endpoints consolidate mission storytelling for growers: `GET /grower-portal/mission-tracker?batchId=…` surfaces aggregate mission telemetry; `GET /grower-portal/journey-map/:missionId` expands stepwise logistics progression aligned with frontend journey cards; consumer sentiment hooks (`GET /grower-portal/consumer-feedback/:batchId`) and treasury snapshots (`GET /grower-portal/financial-status/:batchId`) bind emotional/UX loops directly to deterministic batch identifiers for dashboard parity across web/tablet breakpoints.",
      "Certification scaffolding: `GET /grower-portal/required-certifications` keeps mobile clients synced with mandated compliance artefacts avoiding stale questionnaire drift post-app-store release.",
      "Broader parity work (IndexedDB growers’ web dashboards vs Expo parity) rides on consuming the identical REST payloads above—discrepancies between channels therefore become observable via contract snapshots rather than rhetorical assertions.",
      "Supplementary ingestion buses (`group-sync` controller namespaces) cooperate when cooperative extensions batch updates—coordinate release notes before citing them externally as SLAs.",
    ],
  },
] as const;
