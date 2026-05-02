/**
 * Technical proposal chapters (English) — Part A.
 * Figures marked [ILLUSTRATIVE] must be replaced with audited company data before formal submission.
 */
export type TechnicalProposalChapter = {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
};

export const TECHNICAL_PROPOSAL_CHAPTERS_PART_A: readonly TechnicalProposalChapter[] = [
  {
    id: "tp-executive-summary",
    title: "1. Executive summary",
    paragraphs: [
      "Bio Vera is a vertically oriented software and operating model that closes the agrifood evidence gap between field reality, refrigerated logistics and retail passports. Instead of spreadsheets and screenshots circulating in parallel, the platform persists a single batch-centric timeline with deterministic identifiers that growers, auditors, carriers, buyers and administrators can reconcile against the same payloads.",
      "The proposition combines (i) offline-first capture for intermittent connectivity environments typical of Southeastern European corridors, (ii) Integrity Guard rules for sanctioned inputs/material identity, (iii) corridor-aware logistics workspaces for missions and handovers, (iv) retail-facing QR dossiers grounded in immutable batch genealogy, and (v) phased financial narration aligned with escrow-style releases so programme economics remain explainable.",
      "This document translates the codebase and operating assumptions into an implementation-grade technical proposal suited to diligence, grant-style reviews and partner onboarding. It states objectives, architecture, delivery phases, impact hypotheses, team structure, and an illustrative multi-year cost envelope. It is not a legal prospectus; binding terms live in partner agreements and orders.",
      "Success is measured by audit-time reduction for buyers, higher documentation leverage for participating growers, fewer custody disputes in refrigerated segments, and traceable settlement explanations per batch. Volume milestones (estates, missions, passport scans) are tracked alongside engineering reliability (sync success, conflict rate, incident MTTR).",
      "The implementation targets cross-surface parity between web and mobile for grower/seller critical paths, with explicit acceptance that certain admin-only instruments may ship web-first when policy risk is lower. Security posture assumes JWT authentication, role-based access control, rate limiting, device-scoped field evidence, and operator-grade logging for incident response.",
    ],
  },
  {
    id: "tp-problem",
    title: "2. Problem, opportunity and programme fit",
    paragraphs: [
      "European procurement still operates with fragmented narratives: parcels, chemistry, temperatures and timestamps are inconsistently fused; conscientious growers pay for compliance theatre; carriers inherit ambiguous custody seams; treasury teams reconcile finance without a shared chronological spine. Buyers lack machine-checkable dossiers at scale; rural connectivity makes cloud-only tooling unreliable.",
      "Bio Vera reframes traceability not as labeling theatre but as an operating system: polygons, scans, QC events, packaged units, refrigerated legs and retail artefacts bind to deterministic batch identifiers. Corridor pilots concentrate on estates that can assemble EU-category evidence bundles and refrigerated programmes needing verifiable custody charts.",
      "Programme-fit thesis: subsidy and partnership vehicles increasingly reward interoperability, reproducible audit artefacts, and fairness in producer compensation. Vera economics (partner inputs where applicable, insurance companions where permissible, Vera bonus linkage to controlled materials, escrow segmentation) intend to mirror those incentives rather than optimise only for aggregated GMV listings.",
      "Adjacent opportunity: interoperability exports (embedded passports, dossier bundles) toward buyers who already harmonise SKU governance and QA playbooks—the platform is intentionally boring on infrastructure (REST, Postgres, typed ORM, offline stores) so integration cost stays bounded.",
    ],
  },
  {
    id: "tp-objectives",
    title: "3. Objectives, scope boundaries and KPIs",
    paragraphs: [
      "Primary objectives: (O1) deliver an offline-safe field ingestion path with deterministic sync reconciliation; (O2) enforce Integrity Guard on sanctioned chemistry and identifiable packaging lineage where configured; (O3) support refrigerated logistics narratives with explicit handover objects; (O4) generate retail artefacts (QR dossiers/timelines) anchored to immutable batch genealogy; (O5) instrument operational observability adequate for SOC-style reviews.",
      "Out of scope v1 assumptions unless separately contracted: sovereign national eCustoms filings as single source of truth, laboratory LIMS integrations for every SKU, exhaustive satellite imagery stacks, unrelated ERP replacement, autonomous vehicle routing optimisation, and cryptographic notarisation on public blockchains absent customer-specific requirements.",
      "KPI framing (targets are illustrative and must be set per cohort): estates onboarded vs plan; missions completed with handshake completeness percentage; passports generated per SKU family; weighted sync latency P95 offline→online reconciliation; discrepancy tickets per thousand events; churn among pilot growers after first settlement cycle.",
      "Compliance posture targets: audit log coverage for materially sensitive mutations; segregation of privileged admin actions; data minimisation in public dossiers versus internal operational records.",
    ],
  },
  {
    id: "tp-innovation",
    title: "4. Technical innovation narrative",
    paragraphs: [
      "Innovation is compositional rather than a single neural headline: marrying offline-first ergonomics suitable for ageing field hardware with cryptographic-grade discipline on identifiers yields a reproducible dossier artefact usable by procurement—not only marketing microsites.",
      "Integrity layering: deterministic validation keys (batch/serial coherence, whitelist membership for chemicals where enabled, coarse estate boundary predicates for GPS payloads) converge into auditable rejects rather than silent failure. Operational teams receive structured reasons for blockage; growers receive humane prompts with remediation verbs.",
      "Settlement narration innovation: phased split logic aligns platform uplift, logistics fees, growers’ realised prices and bonus components to the same timelines as QA events—shrinking treasury reconciliation spreadsheets that traditionally diverge from cold-chain logs.",
      "Cross-surface deterministic sync: SQLite/IndexedDB first-write patterns mirrored between Expo and progressive web ergonomics minimise forked behaviours that historically plague agritech rollouts constrained by flaky LTE on picking routes.",
    ],
  },
  {
    id: "tp-architecture",
    title: "5. System architecture and components",
    paragraphs: [
      "Layered view: (i) clients—Next.js web surfaces, Expo mobile clients; (ii) API—NestJS modular controllers with guards; (iii) persistence—PostgreSQL via Prisma with migration discipline; (iv) asset and configuration stores as required; (v) offline stores—IndexedDB on web, SQLite on mobile with explicit schema evolution strategy; (vi) observability—structured logs, health checks, rate limits.",
      "Domain boundaries (logical): identity & session; estate & geometry; field evidence; material control; batch & packaging; logistics missions & handovers; buyer-facing passport projection; admin governance (whitelist, exceptions); payments narrative (escrow segments as applicable).",
      "Deployment assumptions favour reproducible artefacts (standalone Next output compatible with regulated hosting stacks), segregated secrets, TLS everywhere, hardened admin paths, backups with quarterly restore rehearsals [ILLUSTRATIVE operational cadence—set per environment]. API compatibility is semantic-versioned externally when partners embed.",
      "Internationalisation separates content keys from transactional identifiers to avoid collation surprises in dossier merges; locale prefixes align public marketing readability with Serbian/German corridors while preserving canonical batch identifiers language-agnostic.",
    ],
  },
  {
    id: "tp-data-integrity",
    title: "6. Data model, identifiers and audit trail",
    paragraphs: [
      "Identifier hygiene: externally visible dossiers hinge on opaque, stable identifiers for batches and missions rather than sequentially guessable surrogates at the edge. Join keys between events are typed; nullable foreign keys avoided on mandatory custody joins where policy demands completeness.",
      "Temporal modelling: authoritative event times recorded with ingestion offsets for skew detection; reconciliation jobs flag negative-duration anomalies for operator triage.",
      "Audit trail: materially sensitive inserts/updates elevate to append-only semantics at the persistence layer where feasible; destructive operations escalate to privileged roles plus compensating reversal records rather than silent deletes.",
      "Privacy tiers: passport projection applies field redaction matrices for surname-level data policy vs internal operator views; DPIA artefacts should be authored per rollout geography [TEMPLATE ACTION].",
    ],
  },
  {
    id: "tp-offline-modules",
    title: "7. Offline-first capture, determinism and module map",
    paragraphs: [
      "Offline ergonomics prescribe optimistic UI with queued mutations; backoff with jitter prevents sync storms upon tower reacquisition; idempotency tokens avoid duplicate parcels when farmers double-tap under glare.",
      "Conflict policy: additive merges preferred; numeric contention on measured weights escalates structured conflicts rather than silently last-writer-wins on harvest declarations.",
      "Module map highlights: Grower dashboards (estates, cultivation capture, QA adjacent flows); Logistics partner workspaces (missions, vehicle context, handshake screens); Buyer passport consumption; Supplier storefront governance where applicable to programme rules; Admin surfaces for whitelist/evidence adjudication.",
      "Integrity Guard checkpoints can be selectively enforced per programme phase—staging toggles isolate pilot cohort permissiveness from production strictness.",
    ],
  },
] as const;
