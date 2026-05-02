/**
 * EIC / EU grant narrative — structured around four evaluator questions:
 * why this exists, how big the market is, how you earn money, why you will succeed.
 */
export type EicPartBChapter = {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
};

export const EIC_PART_B_CHAPTERS: readonly EicPartBChapter[] = [
  {
    id: "eic-why-exists",
    title: "1. Why Bio Vera exists",
    paragraphs: [
      "EU buyers and regulators increasingly expect defensible proof of where food came from, what was applied in the field, and how cold chain was held—not a certificate PDF from last year and a folder of chat screenshots when a QA hold hits. On the ground, conscientious growers in competitive corridors (including many SMEs in the Western Balkans and similar sourcing basins) often lose margin to documentation friction, not to poor farming: the same events are retyped into four systems that never share one batch identity.",
      "Bio Vera exists to remove that structural penalty. The programme treats cultivation, integrity-controlled inputs, packing evidence, refrigerated legs and buyer-facing dossiers as one continuous story anchored on a single batch spine. When an auditor asks a precise question, the answer is in one chronology—not reconstructed by a consultant over a weekend.",
      "This matters for Europe’s food security and fairness narratives: corridors that can ship verifiable quality should participate in EU retail on merit, not on who can afford parallel compliance theatre. It also matters operationally—SKU holds, airfreight panic substitutions and payment disputes are expensive symptoms of the same missing spine.",
      "The problem is timely: diversification of supply after recent shocks, retailer pressure on origin authenticity, and refrigerated category growth all increase the volume of proof required per euro of sales. Tools that assume always-on rural broadband or treat logistics as an afterthought fail the same growers the single market claims to elevate.",
    ],
  },
  {
    id: "eic-market-size",
    title: "2. How large the market is",
    paragraphs: [
      "Total addressable context: modern European grocery and foodservice channels route multi–tens of billions of euros each year into fresh, chilled and speciality produce where quality and shelf narrative defend price. That spend is not Bio Vera’s revenue—but it is the pool of economic activity where proof density increasingly gates listing, repeat purchase and insurance of supply.",
      "Serviceable focus: we target programme slices, not “all food”. Initial beachheads are horticultural SMEs and cooperatives that already supply or can supply EU-grade categories, plus the buyers and logistics partners that run refrigerated programmes where handshake and temperature evidence are routinely challenged. That is a large but finite set of estates, SKU families and mission volumes—addressable through cohort pilots rather than anonymous app-store scale.",
      "Quantitative framing without false precision: even a low single-digit share of relevant chilled speciality procurement spend, converted into platform, orchestration and compliance-linked fees across a multi-year ramp, supports a venture-scale outcome if custody KPIs are met; the binding constraint is trust and completeness of dossiers, not raw download counts.",
      "Expansion follows corridor depth: repeatable playbooks linking grower onboarding, whitelist governance, logistics handshake artefacts and Hamburg-oriented retail dossiers compound reputation within buyer organisations—each additional SKU programme inside an existing retailer typically adds revenue with diminishing marginal infra cost once the backbone is trusted.",
      "Adjacent pull: speciality and organic lanes, shortening audit cycles for procurement teams, and reducing working-capital pain during investigations create willingness to pay distinct from commodity listing fees—provided the platform survives hostile QA scrutiny in live incidents.",
    ],
  },
  {
    id: "eic-how-we-earn",
    title: "3. How we make money",
    paragraphs: [
      "Revenue is earned where the dossier backbone removes cost and risk for paying customers: principally buyers and programme organisers who fund listing and QA assurance; complemented by corridor-specific refrigerated orchestration and visibility fees where logistics partners substitute improvised coordination with structured missions, temperature logs and handover artefacts growers and treasury can reconcile.",
      "Grower-facing economics are partly indirect: faster path to listing-grade evidence, fewer destructive QA holds and documented conformance with programme packaging and cold rules convert tonnage previously sold at distressed spot terms into contract-grade remuneration. Programme bonuses tied to verified material and packing evidence align platform success with measurable stewardship rather than vanity usage metrics.",
      "Partner seed and input differentiation: differentiated pricing tracks for Vera partners versus standard tiers, surfaced in authoritative records, captures margin ethically disclosed in programme FAQs—commercial upside without trapping growers in undocumented handshake discounts.",
      "Supplier marketplaces anchored to whitelist governance monetise sanctioned inputs aligned with retailer safety posture; they are ancillary to the core spine but strengthen lock-in of compliant chemistry and packaging SKUs within the same programme identity buyers already fund.",
      "Optional insurance or risk-transfer companions may add commission-based revenue only where law and admitted products in a given corridor permit—modelled as upside, not a universal pillar, to keep regulatory credibility intact.",
      "Longer term, deepening lineage density inside existing buyer programmes yields recurring platform uplift with bounded incremental database and support cost—unit economics improve when the same batch graph serves procurement, logistics and settlement without separate reconciliation teams.",
    ],
  },
  {
    id: "eic-why-succeed",
    title: "4. Why we will succeed",
    paragraphs: [
      "Differentiation is integrated proof, not a single buzzword: offline-first field capture for intermittent connectivity; integrity gates on fertiliser whitelist membership, seed serial coherence and estate-boundary checks; refrigerated missions with explicit lifecycle and handover proof; settlement fields in the same data model QA uses—competitors typically sell one layer (farm app, TMS map, or marketing microsite) without joinable custody and chemistry depth.",
      "Execution credibility: the stack is deliberately boring where it should be—transactional relational core, typed services, role-governed APIs, regression and contract discipline on ingestion paths—so pilots fail on adoption or policy, not on inexplicable data loss. Chunked sync, late-entry review lanes and structured compliance logs address real fraud and lag pressures, not slide hypotheticals.",
      "Go-to-market discipline: cohort gating with handshake completeness KPIs before marketing amplification avoids the trust debt of overpromising horizontal growth; two buyer archetypes (strict QA procurement vs speciality narrative buyers) focus product priorities without fragmenting the spine.",
      "Team and governance: multilingual product and engineering capacity paired with domain translation between agronomy, refrigerated logistics and settlement semantics; paired ownership on sensitive settlement logic; periodic security and discrepancy reviews tied to operational telemetry rather than annual checkbox exercises.",
      "Risk awareness is part of the moat: sync storms, procurement freezes, cross-border data roles and overstated green claims are named with concrete mitigations—bounded batch reconciliation, diversified buyer families, DPIA/SCC discipline, marketing governance on environmental assertions until baselined studies exist.",
      "Impact is aligned with EU asks: SME inclusion, transparent cold-chain accountability, and corridor resilience through reproducible dossiers—without asking consumers to trust slogans disconnected from batch-level evidence.",
    ],
  },
  {
    id: "eic-implementation",
    title: "5. Implementation plan",
    paragraphs: [
      "Thirty-six month arc with exit criteria tied to externally observable KPIs (handshake completeness, passport readability, discrepancy rates, reconciliation latency) alongside internal regression release gates.",
      "Year 1: harden estate and parcel onboarding, reliability of offline sync under flaky connectivity rehearsals, Integrity Guard adjudication workflows, baseline refrigerated mission and temperature logging, bilingual operational materials bridging Serbian field practice and German buyer QA language.",
      "Year 2: deepen corridor pilots—link structured logistics proofs to settlement narratives; broaden passport templates for two buyer archetypes; institutionalise discrepancy triage with cooperatives or extension partners where applicable.",
      "Year 3: scale economics on dossier read paths; widen certified logistics circles with versioned handshake SOPs; refresh cross-border privacy artefacts as data volumes and buyer geographies grow.",
      "Quality cross-cuts all years: contract tests on public ingestion edges, synthetic journeys from offline buffer to accepted reconciliation, and escalating resilience drills before expanding marketing spend.",
    ],
  },
  {
    id: "eic-budget",
    title: "6. Budget and use of funds",
    paragraphs: [
      "Total eligible project cost baseline over thirty-six months: EUR 992 000, structured for standard EU cost categories and subject to final sign-off by your accountant and the portal budget forms.",
      "Personnel EUR 682 000: product and platform engineering, field enablement, logistics coordination roles, QA automation and management—aligned to deliver the cohort milestones above rather than open-ended headcount.",
      "Subcontracting EUR 95 000: legal and data-protection support for cross-border dossier flows, agronomic conformity reviews where programmes require external attestation, annual independent security testing proportionate to exposed surface.",
      "Other direct costs EUR 118 000: cloud, observability, messaging, secrets and device refresh for trainers and pilot telemetry; sized for growing read load on dossier assembly, not speculative hardware.",
      "Travel and corridor enablement EUR 71 000: targeted Hamburg–region and grower-basin working sessions, workshops and pilot review travel—budgeted conservatively relative to typical conference-heavy proposals.",
      "Other goods and services EUR 26 000: professional translation governed by chemical glossaries, audit-friendly print artefacts, archiving—closing small but credibility-relevant line items.",
      "Co-financing near twenty-six percent combines founder reinvestment and early corridor cash where eligible, without double-counting; structure with finance counsel before portal lock.",
      "Governance: if handshake completeness deviates materially from agreed baselines for two consecutive quarters, discretionary spend throttles protect runway while preserving core engineering capacity for incident quality.",
    ],
  },
] as const;
