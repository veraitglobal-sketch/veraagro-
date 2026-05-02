/**
 * EIC Pathfinder / Accelerator–style Part B narrative (English).
 * Written for evaluator-facing clarity (Excellence → Budget), not internal architecture dumps.
 */
export type EicPartBChapter = {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
};

export const EIC_PART_B_CHAPTERS: readonly EicPartBChapter[] = [
  {
    id: "eic-excellence",
    title: "1. Excellence",
    paragraphs: [
      "European fresh and speciality horticulture increasingly depends on verifiable custody and input integrity—not slogan-level “traceability”. Yet the operational reality on many competitive corridors remains a patchwork: field books, spreadsheets, courier chats and retailer QA portals that never converge on one chronological, tamper-evident lineage tied to refrigerated facts. Conscientious small and medium producers therefore face a paradox: agronomic competence without machine-checkable evidence is discounted at listing and settlement time.",
      "Bio Vera targets that gap directly by treating the cultivation–packaging–refrigerated logistics–buyer dossier chain as one programme artefact: a deterministic batch-centric spine with cryptographic-grade identifier discipline at the persistence layer; offline-safe capture engineered for intermittent rural connectivity characteristic of Southeastern European sourcing basins; and integrity gates that materially block non-whitelisted agrochemical narratives while preserving humane operator feedback when rejects occur.",
      "Excellence claim in one sentence: we advance the state of the art not by speculative blockchain spectacle, but by compositional reliability—parity-grade mobile and web ingestion, geospatial enforcement against declared estate geometries, refrigerated mission lifecycles with structured handovers and thermometer-grade telemetry, settlement splits that cite the same object graph QA teams interrogate—a reproducible dossier suitable for procurement due diligence.",
      "The project is differentiated from fragmented farm SaaS rows-and-rainfall charts, disconnected TMS visibility overlays, or retail microsites devoid of authoritative joins: corridors where buyers already demand cold-chain defensibility obtain an integrated backbone rather than quarterly PDF archaeology.",
      "Technical maturity aligns with credible deployment rhetoric: PostgreSQL transactional core, pragmatic TypeScript stacks on API and presentation layers, established sync orchestration separating late or non-compliant ingestion for supervisor review—a foundation suitable for audited rollouts.",
    ],
  },
  {
    id: "eic-innovation-technology",
    title: "2. Innovation and technology",
    paragraphs: [
      "Core innovation pillars: (i) Offline-first ergonomics merging optimistic local persistence with chunked server reconciliation respecting compliance outcomes before irreversible commits. (ii) Integrity Guard convergence—whitelist membership for sanctioned fertiliser identifiers, dormant product flags, barcode-class routing for seeds anchored to authoritative serial inventories, geographic predicates preventing silent out-of-parcel attestations tied to spoofing-pressure scenarios. (iii) Refrigerated execution semantics—missions, temperature logs contextualised by vehicle/driver assignments, handshake recordings with signer artefacts where programmes require—not implied custody via chat excerpts.",
      "Architectural synopsis: growers and operators interact via contemporary web dashboards and complementary mobile shells; authoritative business logic exposes modular REST orchestration safeguarding role separation; longitudinal evidence lands in relational schema linking estates, parcels, treatments, batches, missions, passports and settlement records without breaking foreign-key coherence.",
      "Public-facing reassurance layers—QR-derived verification surfaces and dossier artefacts—consume projections distilled from authoritative internal graphs rather than standalone marketing payloads that diverge silently from QA truth.",
      "Cybersecurity stance follows conventional best practice baseline: bearer-token session models, granular route guards separating grower logistics buyer and administrator capabilities, transactional audit trails for sensitive mutations, anomaly alerting pipelines for materially blocked chemistry or geography violations adaptable to supervisory escalation policies each retailer mandates.",
      "Innovation roadmap within the funded window prioritises deepening buyer passport clarity, refrigerated handshake completeness KPIs, multilingual corridor ergonomics respecting chemical glossary precision across German and Serbian operational dialects—not horizontal feature sprawl orthogonal to dossier coherence.",
    ],
  },
  {
    id: "eic-market",
    title: "3. Market opportunity",
    paragraphs: [
      "European retail procurement consolidated across modern grocery channels allocates multi–tens-of-billions of euro annual purchasing power to chilled and speciality produce categories sensitive to QA storytelling; varietal and proximity sourcing programmes explicitly reward suppliers who shorten audit latency and certify custody rather than rewriting dossiers retrospectively.",
      "Structural tailwinds: diversification of horticulture corridors after geopolitical supply shocks; heightened retailer sensitivity to spoofed origin tales; refrigerated SKU expansion in urban premium segments; subsidy and partnership narratives favouring transparent grower remuneration when documentation friction falls.",
      "Bio Vera concentrates initial beachhead corridors linking capable Balkan exporters with refrigerated distribution endpoints oriented toward Hamburg-centred QA cultures—capturing differentiated margin before attempting undifferentiated global horizontal expansion.",
      "Addressable stakeholder classes: horticultural SMEs assembling EU-category evidence bundles; speciality buyers piloting SKU programmes where handshake completeness gates volume releases; refrigerated logistics alliances seeking dispute-resistant custody artefacts; supervisory cooperatives aligning member growers to shared programme tooling.",
      "Growth logic is cohort-paced: deepening passport acceptance within two discreet buyer archetypes (discipline-forward QA purchasers versus speciality narrative purchasers) expands revenue quality faster than spraying low-trust aggregator listings incapable of underwriting custody.",
      "Comparable alternatives today force buyers onto manual reconciliation desks or tolerate residual opacity—the measurable economic pain is avoidance cost of SKU holds, rework airfreight substitutions born of mistrust, and punitive working-capital freezes during ambiguous investigations.",
    ],
  },
  {
    id: "eic-business-model",
    title: "4. Business model",
    paragraphs: [
      "Revenue architecture blends programmatic platform uplift with corridor-specific refrigerated orchestration premiums where managed visibility substitutes for improvised coordination; optional insurance companion commissions emerge only where legal frameworks and admitted carriers permit—not as speculative universal margin.",
      "Grower monetisation uplift arises when faster listing readiness, documented packaging conformance bonuses aligned to programme photographic standards and reduced QA-hold fallout convert previously discounted tonnage into contract-grade reliability.",
      "Partner differentiated seed economics—privileged pricing tracks discoverable inside authoritative buyer records avoiding handshake-only folklore—prevent silent cross-subsidies eroding cooperative trust whilst preserving transparent uplift when programme rules incentivise stewardship.",
      "Marketplace-aligned supplier catalogues coexist with whitelist governance preventing grey-market chemistry from entering sanctioned SKU baskets—a commercial surface aligned with retailer safety mandates rather than indiscriminate SKU density.",
      "Long-term annuity thesis: deepening lineage density inside existing buyer programmes amortises incremental infrastructure costs while widening switching costs ethically through superior dossier reputation rather than data hostage-taking—operational portability commitments remain foundational to reputational viability.",
      "Sensitivity planning acknowledges buyer procurement freezes mid-pilot; mitigation routes through corridor diversification plus contractual KPI gates aligning revenue ramps to measurable handshake completeness not vanity login counts.",
    ],
  },
  {
    id: "eic-impact",
    title: "5. Impact",
    paragraphs: [
      "Economic impact: shortening buyer audit-cycle labour reallocates skilled procurement time toward supplier development; shortening payment-cycle ambiguity where settlement narration references objective custody cues improves grower liquidity and reduces punitive spot-market desperation sales absent documentation leverage.",
      "Social inclusion: ergonomics considerate of ageing growers—readable typography on scanning flows, restrained mandatory steps on compliant journeys—narrow digital exclusion widening rural stagnation demographics across EU fringe agricultural regions targeted by diversification policy.",
      "Environmental stewardship instrumented responsibly: refrigerated deviation timestamps replace backward-averaged marketing claims susceptible to scrutiny backlash; conscientious PHI-aware treatment arcs captured against parcel geometry underpin defensible agronomic stewardship narratives without premature consumer eco-badge confection absent causal baselines.",
      "Buyer-consumer trust linkage: deterministic QR dossiers tether shelf storytelling to verifiable chronological joins—particularly relevant during incident response when SKU holds must adjudicate swiftly from structured evidence instead of improvised war rooms.",
      "Quantified headline indicators envisaged across pilot-to-scale horizons (baseline agreement with reference buyers before contractualisation): dossier discrepancy tickets per thousand custody events trending downward; handshake PDF completeness fractions exceeding ninety percent on refrigerated pilot lanes; weighted offline-to-online reconciliation latency within agreed service thresholds; qualitative grower promoter sentiment stabilising cohort retention post-first-settlement milestones.",
      "Contribution to EU strategic autonomy wording: diversification of conscientious horticulture corridors with reproducible dossier grammar strengthens SME participation in continental supply resilience narratives without diluting QA standards purchasers cannot compromise publicly.",
    ],
  },
  {
    id: "eic-implementation",
    title: "6. Implementation plan",
    paragraphs: [
      "Planning horizon aligns to a disciplined thirty-six month arc partitioned into cohesive work streams rather than ornamental micro-milestones. Each stream exits through buyer-visible KPI acceptance plus internal regression serenity gates—grant disbursement timing can map to externally reviewable completions without exposing proprietary codebase dumps prematurely.",
      "Months 1–12 Foundation and pilot envelope: hardened estate onboarding and parcel geometry ingestion; reproducible Integrity Guard adjudication dashboards; chunked sync reliability under flaky connectivity test harnesses; refrigerated mission lifecycle baseline with thermometer logging discipline; bilingual operational rehearsal materials for Serbian grower ergonomics intersecting German buyer QA jargon.",
      "Months 13–24 Corridor deepening: widen mission handshake completeness KPIs linking structured logistics proofs to treasury narration tables; enlarge passport readability for two purchaser archetypes; formalise discrepancy triage SLA playbooks aligning grower escalation paths with cooperative extension partners where applicable.",
      "Months 25–36 Scale and institutional embedding: optimise dossier-read query economics for multiplying lineage cardinality; widen certified logistics alliances adhering to versioning discipline on handshake SOP artefacts; crystallise repeatable DPIA artefacts per geography where cross-border data consumption intensifies—not one-off improvised privacy theatre.",
      "Cross-cutting quality assurance mandates continuous contract testing on externally exposed ingestion edges, synthetic rehearsal journeys bridging offline buffering to authoritative reconciliation acceptance, tabletop resilience exercises escalating from partial degraded-read posture drills toward full catastrophe recovery rehearsals before third-year expansion amplification.",
      "Deliverable coherence emphasises versioning discipline on API artefacts, reproducible migration practices on relational backbone, tagging discipline on release artefacts for auditability—all narrated succinctly rather than appendix-dumping exhaustive internal ticket logs reviewers cannot interpret proportionately.",
    ],
  },
  {
    id: "eic-team",
    title: "7. Team",
    paragraphs: [
      "Execution leverages a compact multilingual core marrying full-stack engineering maturity across API and experiential surfaces with domain translators bridging agronomic terminology, refrigerated logistics jargon and treasury settlement semantics—a composition preventing schema brittleness born of monoculture optimisation teams detached from tactile field realities.",
      "Security stewardship rotates paired ownership across settlement-sensitive narration modules preventing single-person folklore risk prized negatively by diligence committees; structured logging plus incident rehearsals integrate operations rather than siloing hypothetical infosec slide ware.",
      "Localisation stewardship enforces glossary precision forbidding chemically ambiguous mistranslations—particularly critical where German QA strictures intersect Serbian field dialects dominating pilot demographics.",
      "Advisory scaffolding supplements execution with chartered finance review, specialised data-protection counsel intermittently scaling with cross-border dossier breadth, seasoned category-buyer sounding boards preventing roadmap detachment from authentic procurement veto patterns.",
      "Governance rhythms: fortnightly sprint integration reviews; monthly risk-register escalations materially affecting corridor posture; quarterly security retrospectives aligning guard evolution with telemetry gathered from discrepancy triage—not decorative compliance choreography.",
      "Talent acquisition predicates seek systems empathy as strongly as algorithms—edge-case QA failures surfaced earlier relative to monocultural hiring patterns optimising superficial velocity metrics devoid of humane field ergonomics.",
    ],
  },
  {
    id: "eic-risks",
    title: "8. Risks and mitigation",
    paragraphs: [
      "Technical reconciliation risk—sync storms reconnecting unreliable towers: mitigated through bounded batch ingestion, backoff jitter respecting tower recovery physics, granular failure reasons surfacing corrective operator guidance rather than silent drops.",
      "Market adoption scepticism rooted in historically failed digitisation gimmicks among growers: mitigated transparently via pilot cohort promoters, restrained marketing amplification until handshake KPI thresholds green sequentially, humane reject UX preventing cynicism amplification.",
      "Buyer procurement freezes mid-rollout jeopardising correlated revenue ramps: diversification across two purchaser families plus contractual KPI ramps indexed to objectively measured dossier completeness instead of prematurely irreversible contractual volume cliff edges.",
      "Regulatory ambiguity on cross-border personal data interplay when German buyers ingest Serbian supervisory dossiers: proactive SCC/DPA inventory discipline, iterative DPIA refresh triggers upon profiling telemetry deltas, narrowly tailored passport projection minimisation principles.",
      "Key-person coupling during early cryptographic settlement narration logic: mandated paired-programming rotations with shadow documentation horizons before senior transitions—reducing folklore-dependent patches auditors rediscover painfully late-cycle.",
      "Geopolitical trade friction compressing envisaged logistical throughput intermittently: stress scenarios baked into treasury runway choreography so corridor pause events trigger spend throttles responsibly rather than panicked unstructured layoffs harming institutional knowledge.",
      "Reputation risk from overstated ecological claims absent causal baselines: marketing governance forbids consumer-facing environmental badge inflation until statistically defensible study designs—withheld deliberately from rapid launch vanity.",
    ],
  },
  {
    id: "eic-budget",
    title: "9. Budget and use of funds",
    paragraphs: [
      "Financial presentation follows standard EU cost-category logic coherent with typical blended grant co-financing practice; absolute figures remain subject to reconciliation with chartered accountant certification and authoritative personnel rate cards before binding submission—we state rounded totals intentionally transparent about rounding rather than implying spurious faux-precision decimals.",
      "Baseline thirty-six month indicative envelope totalling EUR 992 000 in eligible project costs allocates EUR 682 000 to personnel (product engineering, field enablement liaison, refrigerated logistics translator roles, QA automation, supervisory management), EUR 95 000 to subcontracting encompassing external legal DPIA authoring refresh cycles, agronomic conformity reviews and annual independent penetration-testing exercises proportionate to surfaced attack surface breadth.",
      "EUR 118 000 covers cloud infrastructure, continuity tooling (observability, transactional mail, hardened secrets posture), ergonomic device refresh for cohort trainers and refrigerated pilot telemetry gateways amortised responsibly across SKU waves—not speculative hardware hoarding orthogonal to dossier coherence.",
      "EUR 71 000 funds travel strictly tied to corridor enablement—not conference vanity—including cyclical bilateral Hamburg–Belgrade facilitation sprints aligning buyer QA folklore with actionable schema deltas plus farmer workshop logistics priced conservatively versus aspirational glamour travel budgets reviewers dismiss reflexively.",
      "EUR 26 000 other goods and services—including translation governance bursts, reproducible dossier-printing artefacts for auditors preferring tactile reviews, archiving compliance—closes direct cost complement without inflating intangible mystification budgets reviewers interpret cynically.",
      "Co-financing assumption near twenty-six percent blending founder reinvestment and modest early corridor cash receipts earmarked ethically without double-counting identical euro twice—financial counsel validates final structuring before definitive portal upload locking immutable figures.",
      "Cash conservation triggers: encountering two sequential quarters materially breaching handshake completeness KPI divergence bands relative to collaboratively baselined onboarding cohorts mandates spending throttles (hiring pause, discretionary marketing restraint) safeguarding runway stewardship whilst preserving engineering retention critical to incident quality.",
      "Funds allocation explicitly avoids speculative cryptocurrency mining burn, unrelated SaaS conglomerate experimentation or vanity blockchain marketing spend contradictory to restrained engineering posture championed upstream—budget reviewers receive signal discipline versus buzzword-heavy line-item theatre.",
      "Quarterly supervisory board dashboards reconcile thirteen-week liquidity outlook overlays with discrepancy-rate operational telemetry—financial planning and dossier-health metrics forced into same narrative preventing divergent departmental fairy tales culminating in preventable insolvency melodrama harming SME supplier trust ecosystems.",
      "Applicants should transpose these rounded structural proportions into portal budget tables with national currency equivalents if mandated while preserving explanatory footnotes aligning human-resource month assumptions with objectively deliverable onboarding cadence—not impossible linear hiring slopes contradicting recruiter market realities contemporaneous to submission date.",
    ],
  },
] as const;
