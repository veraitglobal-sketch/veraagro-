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
    id: "tp-executive-summary",
    title: "1. Executive summary",
    paragraphs: [
      "Bio Vera starts from a simple unfairness: many Balkan growers already farm well enough for serious EU retail, yet they lose money and sleep to paperwork that never matches the pallet, spreadsheets that contradict the truck and cold-chain excuses nobody can defend. Buyers want to believe origin and packaging claims, but without one shared timeline they rehearse trust from scratch each audit season. Vera therefore treats seeds and inputs, field work, packing, refrigerated legs and buyer-facing dossiers as a single programme—because that is how food safety and fairness work in practice, not in slide decks.",
      "In plain terms we combine disciplined operations with software that remembers the same batch from the greenhouse to the Hamburg shelf boundary. One chronology spans estate borders, treatments, pickups, checkpoints and eventual QR dossiers—so growers, auditors, carriers, procurement and treasury read the same identifiers and timestamps. Offline-first flows suit weak mobile signal in the rows; Integrity Guard catches inputs and packing identity where the programme requires it; where escrow applies, payouts can follow milestones instead of improvised narratives.",
      "Stated plainly for technical readers: credible proof from the farm meets buyer-grade dossiers—simple enough for experienced operators outdoors, strict enough that false chemistry or implausible geography cannot quietly hide behind “someone synced it later”.",
      "This proposal spells out objectives, architecture, phased delivery and impact—including discussion-level economics—so funders, partners and engineering teams can run end-to-end diligence on the programme. It is not a substitute for executed contracts or regulatory filings.",
      "Success is human first: fewer days lost rebuilding dossiers in purchasing offices; growers who record cleanly once and reuse that file; fewer cold-chain fights because handovers exist as structured events; payouts that cite the same story as QA. Behind that we track volume (estates, missions, passports) and reliability (sync discrepancies, recovery after incidents). Where policy requires both, grower flows stay aligned on web and mobile.",
    ],
  },
  {
    id: "tp-problem",
    title: "2. Programme fit snapshot (full diagnosis: Part B — 1)",
    paragraphs: [
      "Growers carry the daily stress; buyers carry the SKU risk; hauliers sit between them—each speaks a slightly different dialect of “proof”. The long-form problem chapter (Programme Part B — §1) walks through that fragmentation and weak connectivity step by step. Read it before lifting excerpts into grants or memos.",
      "Here is only the gist: conscientious corridors leak margin whenever evidence stays split across departments and inboxes. Vera lines up seed and input programmes, cultivation records guarded by Integrity rules, refrigerated custody and retail passports on one deterministic batch spine—so subsidy checks, QA scorecards and farmer pay can meet instead of drifting apart.",
      "We keep buyer integration pragmatic: mainstream REST payloads, Postgres, offline stores—not exotic stacks that scare procurement IT. Scaling narrative continues in Programme Part B — §7.",
    ],
  },
  {
    id: "tp-objectives",
    title: "3. Engineering objectives & KPI snapshot (strategic framing: Part B — 2–3, 8)",
    paragraphs: [
      "Strategic exposition of Vera’s technological solution stance and mechanic-level “how it works” narrative resides in Programme Part B — §2–3—spanning Integrity Guard adjuncts, offline determinism and custody structuring for readers who ingest the dossier sequentially before diving into security and roadmap annexes.",
      "Engineering-facing objectives distilled: O1 offline-safe ingestion with deterministic reconciliation; O2 Integrity Guard intersections on sanctioned chemistry and packaging genealogy when enabled; O3 refrigerated missions emitting explicit handshake objects; O4 retail passport projections anchored to immutable batch lineage; O5 observability and audit posture adequate for substantive reviews—not decorative compliance theatre.",
      "Out of scope unless separately contracted: sovereign eCustoms as sole source of truth, universal LIMS for every SKU, heavy satellite stacks, unrelated ERP replacement, autonomous routing optimisation hype, public-chain notarisation without customer mandate—enumerated fully when procurement demands tick-box completeness.",
      "KPI anchors (targets illustrative per cohort): estates vs plan; handshake completeness rates; passports per SKU family; offline→online reconcile P95; discrepancy tickets per thousand events; post-first-settlement grower churn. Compliance: sensitive mutation audit coverage; segregation of privileged admin mutations; dossier-facing data minimisation.",
      "Economic/climate/broader-impact storytelling belongs to Programme Part B — §§4–8; financial placeholders align with Programme Part B — §10 cross-checked against §13 technical annex envelope.",
    ],
  },
  {
    id: "tp-innovation",
    title: "4. Technical innovation narrative",
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
    title: "5. System architecture and components",
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
    title: "6. Data model, identifiers and audit trail",
    paragraphs: [
      "Identifier hygiene: externally visible dossiers hinge on opaque, stable identifiers for batches and missions rather than sequentially guessable surrogates at the edge. Join keys between events are typed; nullable foreign keys avoided on mandatory custody joins where policy demands completeness.",
      "Temporal modelling: authoritative event times recorded with ingestion offsets for skew detection; reconciliation jobs flag negative-duration anomalies for operator triage.",
      "Audit trail: materially sensitive inserts/updates elevate to append-only semantics at the persistence layer where feasible; destructive operations escalate to privileged roles plus compensating reversal records rather than silent deletes.",
      "Privacy tiers: passport projection applies field redaction matrices for surname-level data policy vs internal operator views; DPIA artefacts should be authored per rollout geography together with counsel and standard templates.",
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
