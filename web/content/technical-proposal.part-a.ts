/**
 * Technical proposal chapters (English) — Part A.
 * Economics and market bands in this document are discussion scaffolding; bind numbers to audited models before formal submission.
 */
export type TechnicalProposalChapter = {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
};

export const TECHNICAL_PROPOSAL_CHAPTERS_PART_A: readonly TechnicalProposalChapter[] = [
  {
    id: "tp-objectives",
    title: "1. Engineering objectives & KPI snapshot",
    paragraphs: [
      "Higher-level behaviour is described in **Part B — The solution / How it works** and in the opening **Executive pitch**. Here we spell what engineering must reliably deliver.",
      "O1 Offline-safe ingestion with deterministic reconciliation between mobile/web and server. O2 Integrity checks on sanctioned chemistry, seed identity and packaging genealogy where enabled. O3 Refrigerated missions with explicit handshake and temperature evidence suitable for disputes. O4 Buyer-facing dossiers (passports) anchored to immutable batch lineage. O5 Observability proportionate to real incidents—not decorative compliance dashboards.",
      "Explicitly **out of scope** unless contracted: universal customs as sole proof, satellite imagery platforms, unrelated ERP replacement, hype automation of routing, compulsory public blockchain.",
      "Operational KPI anchors (example classes): onboarding vs plan; handshake completeness; passport consumption; offline reconcile latency; discrepancy rate per thousand events; post-settlement churn. Sensitive actions must be audited; admin roles segregated from grower dossier views where policy requires minimisation.",
    ],
  },
  {
    id: "tp-innovation",
    title: "2. Technical innovation narrative",
    paragraphs: [
      "Behind the toolchain, the motivating question remains human: did this food actually move through the corridors and controls we advertise—and can a grower capture that truth once without drowning in bureaucracy? Offline-first ergonomics, identifier discipline and integrity gates are how software answers affirmatively.",
      "Innovation is compositional rather than a single neural headline: marrying offline-first ergonomics suitable for ageing field hardware with cryptographic-grade discipline on identifiers yields a reproducible dossier artefact usable by procurement—not only marketing microsites.",
      "Integrity layering: deterministic validation keys (batch/serial coherence, whitelist membership for chemicals where enabled, coarse estate boundary predicates for GPS payloads) converge into auditable rejects rather than silent failure. Operational teams receive structured reasons for blockage; growers receive humane prompts with remediation verbs.",
      "Settlement narration innovation: phased split logic aligns platform uplift, logistics fees, growers’ realised prices and bonus components to the same timelines as QA events—shrinking treasury reconciliation spreadsheets that traditionally diverge from cold-chain logs.",
      "Cross-surface deterministic sync: SQLite/IndexedDB first-write patterns mirrored between Expo and progressive web ergonomics minimise forked behaviours that historically plague agritech rollouts constrained by flaky LTE on picking routes.",
    ],
  },
  {
    id: "tp-architecture",
    title: "3. System architecture and components",
    paragraphs: [
      "Layered view: (i) clients—Next.js web surfaces, Expo mobile clients; (ii) API—NestJS modular controllers with guards; (iii) persistence—PostgreSQL via Prisma with migration discipline; (iv) asset and configuration stores as required; (v) offline stores—IndexedDB on web, SQLite on mobile with explicit schema evolution strategy; (vi) observability—structured logs, health checks, rate limits.",
      "Domain boundaries (logical): identity & session; estate & geometry; field evidence; material control; batch & packaging; logistics missions & handovers; buyer-facing passport projection; admin governance (whitelist, exceptions); payments narrative (escrow segments as applicable).",
      "Repository-shaped anchor (non-exhaustive Prisma aggregates): estates/parcels/treatment_logs/seed_scans; bio_white_list; compliance_logs & compliance_photos; batches with freshness_trackers/temperature_logs/quality_entries/package_badges; missions with logistics_handovers, border_wait_times, location_logs; orders/deliveries/payments (+ splitDetails JSON); wallets & supplier catalogues for sanctioned inputs.",
      "Backend services realising enforcement include `IntegrityGuardService`/`ComplianceService`/`GpsValidatorService` pipelines and offline `SyncService` batching—with Nest modules exposing REST contracts consumed by growers, logistics dashboards, buyer tooling and admins.",
      "Deployment assumptions favour reproducible artefacts (standalone Next output compatible with regulated hosting stacks), segregated secrets, TLS everywhere, hardened admin paths, backups with restore rehearsals on a cadence set per deployment (often quarterly). API compatibility is semantic-versioned externally when partners embed.",
      "Internationalisation separates content keys from transactional identifiers to avoid collation surprises in dossier merges; locale prefixes align public marketing readability with Serbian/German corridors while preserving canonical batch identifiers language-agnostic.",
    ],
  },
  {
    id: "tp-data-integrity",
    title: "4. Data model, identifiers and audit trail",
    paragraphs: [
      "Identifier hygiene: externally visible dossiers hinge on opaque, stable identifiers for batches and missions rather than sequentially guessable surrogates at the edge. Join keys between events are typed; nullable foreign keys avoided on mandatory custody joins where policy demands completeness.",
      "Temporal modelling: authoritative event times recorded with ingestion offsets for skew detection; reconciliation jobs flag negative-duration anomalies for operator triage.",
      "Audit trail: materially sensitive inserts/updates elevate to append-only semantics at the persistence layer where feasible; destructive operations escalate to privileged roles plus compensating reversal records rather than silent deletes.",
      "Privacy tiers: passport projection applies field redaction matrices for surname-level data policy vs internal operator views; DPIA artefacts should be authored per rollout geography together with counsel and standard templates.",
    ],
  },
  {
    id: "tp-offline-modules",
    title: "5. Offline-first capture, determinism and module map",
    paragraphs: [
      "Offline ergonomics prescribe optimistic UI with queued mutations; backoff with jitter prevents sync storms upon tower reacquisition; idempotency tokens avoid duplicate parcels when farmers double-tap under glare.",
      "Conflict policy: additive merges preferred; numeric contention on measured weights escalates structured conflicts rather than silently last-writer-wins on harvest declarations.",
      "Module map highlights: Grower dashboards (estates, cultivation capture, QA adjacent flows); Logistics partner workspaces (missions, vehicle context, handshake screens); Buyer passport consumption; Supplier storefront governance where applicable to programme rules; Admin surfaces for whitelist/evidence adjudication.",
      "Integrity Guard checkpoints can be selectively enforced per programme phase—staging toggles isolate pilot cohort permissiveness from production strictness.",
    ],
  },
] as const;
