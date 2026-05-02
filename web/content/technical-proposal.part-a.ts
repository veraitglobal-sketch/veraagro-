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
      "The overarching goal of Bio Vera is straightforward: conscientious growers in the Balkan corridor should reach EU-grade retail shelves without being punished by paperwork, disconnected spreadsheets, or broken cold-chain stories—and buyers should be able to trust origin, custody and packaging claims because they rest on shared evidence, not parallel narratives rebuilt for each audit. Vera is intentionally vertical: seeds and inputs through cultivation compliance, packing, refrigerated legs and retail passports are treated as one programme, because that is how food safety and fairness actually behave in reality.",
      "Concretely, Bio Vera combines product and operating rhythm. Software holds a single batch-centric chronology—from estate boundaries and field facts to shipments, checkpoints and eventual QR dossiers—that growers, auditors, carriers, procurement and treasury can reconcile to the same identifiers and timestamps. Behavioural complements (offline-first tools for unreliable connectivity; Integrity Guard for approved inputs and material identity where configured; phased settlement narration where escrow semantics apply) exist to protect that goal rather than distract from it.",
      "Innovation narrative in one sentence: reproducible proof at the edge meets buyer-grade dossiers—ergonomic enough for field teams aged sixty-plus yet strict enough that blocked chemistry or implausible geo evidence cannot silently pass as “someone fixed it offline.” ",
      "This document restates objectives, architecture, delivery phases, impact hypotheses and an illustrative economics envelope so funders, consortium partners and technical counterparts can diligence the programme as a coherent system—not a slideshow promise. Nothing here replaces contracts, orders or regulatory filings; binding language lives in executed agreements.",
      "Success reads as stakeholder outcomes before engineering vanity metrics: less buyer time lost reconstructing dossiers; growers who capture clean records once and reuse them; fewer refrigerated custody disputes because handovers exist as structured objects; payment stories that cite the same batch timeline as QA. Operational volume (estates onboarded, missions completed, passports consumed) accompanies reliability measures (offline sync reconciliation, discrepancy rates, incident recovery). Implementation assumes parity between critical grower journeys on web and mobile where product policy requires both channels.",
    ],
  },
  {
    id: "tp-problem",
    title: "2. Programme fit snapshot (full diagnosis: Part B — 1)",
    paragraphs: [
      "The disciplined, narrative-deep treatment of stakeholder pain (growers, buyers, logistics), systemic fragmentation of evidence and corridor connectivity realities lives in Programme Part B — §1 Problem (detailed analysis). Read that chapter first when preparing grants, consortium memos or external diligence excerpts.",
      "This snapshot states only Vera’s compact thesis: conscientious corridors lose margin when proof does not unify—Bio Vera aligns seed/input programmes, Integrity Guard–backed cultivation records, refrigerated custody objects and Hamburg retail passports onto one deterministic batch spine so subsidy logic, QA scorecards and fair grower remuneration can converge instead of drifting across departments.",
      "Adjacent fit note: dossier interoperability with disciplined buyers (structured SKU governance) stays intentionally low-integration-tax—technical choices (REST payloads, Postgres, offline stores) reinforce that pragmatism; expansion narrative continues in Programme Part B — §7 Scaling.",
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
