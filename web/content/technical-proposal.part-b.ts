/** Technical proposal chapters (English) — Part B; pair with technical-proposal.part-a.ts */
import type { TechnicalProposalChapter } from "@/content/technical-proposal.part-a";

export const TECHNICAL_PROPOSAL_CHAPTERS_PART_B: readonly TechnicalProposalChapter[] = [
  {
    id: "tp-security",
    title: "8. Security architecture, resilience and RBAC",
    paragraphs: [
      "Authentication adopts JWT-bearing clients with hardened cookie settings on web surfaces where applicable; privileged roles enumerated discretely; union-of-privileges discouraged without compensating MFA policy for admins, calibrated per deployment environment.",
      "Authorisation leverages route guards on controllers with fine-grained action keys for mutating dossier artefacts; horizontally exposed analytics endpoints gated separately to prevent enumeration attacks on batch existence.",
      "Rate limiting shields authentication, dossier probing and sync burst endpoints; WAF/front-door integration recommended for public promotional surfaces—configuration is hosting-specific.",
      "Resilience playbook: degraded read-only dossier posture during partial outages where cached projections exist; transactional outbox assumptions for outbound partner notifications once partner notification integration is live. Incident response includes periodic API key rotation on an agreed cadence (e.g. quarterly).",
      "Device posture (field): attestations avoided as hard gate in v1; alternative includes fingerprint deltas for anomaly alerting rather than kiosk lock-down to reduce grower abandonment.",
    ],
  },
  {
    id: "tp-implementation-roadmap",
    title: "9. Implementation roadmap and phase gates",
    paragraphs: [
      "Phase H0 Foundations (months 1–4—indicative timing): hardened estate onboarding, Integrity Guard scaffolding, deterministic batch minting, IndexedDB parity checks on web growers’ critical path, SOC-style logging backlog closure for top ten alert classes.",
      "Phase H1 Pilot corridor readiness (months 4–10): widen mission lifecycle with handshake completeness KPI; passport projection templates for two buyer archetypes (discounter QA vs speciality procurement); bilingual operational runbooks SR/DE for growers and drivers.",
      "Phase H2 Scale economics (months 10–18): optimise query plans for dossier merges above roughly 250k lineage rows at scale; rollout supplier governance modules where programme demands density in sanctioned SKUs.",
      "Phase H3 Institutional embedding (months 18–24): external auditor walkthrough artefacts; KPI contract templates annexed per buyer; treasury connectors where permitted (not prescriptive herein). Gates require green regression suite, catastrophe recovery tabletop, DPIA checklist completion.",
      "Commercial overlay: runway consumption tracked against pilot revenue milestones; capex amortised over contractually committed SKU programmes—numbers appear in the financial annex (chapter 13) as placeholders only.",
    ],
  },
  {
    id: "tp-deliverables",
    title: "10. Deliverables, testing strategy and acceptance",
    paragraphs: [
      "Engineering deliverables tag release trains: tagged API contracts, migration scripts, client bundles (Expo OTA policy per environment), web build hashes, deployment manifests, post-release monitoring dashboards.",
      "Testing pyramid: unit coverage on financial split helpers and integrity validators; contract tests on API edges exposed to partners; synthetic journey tests for offline→online merge; targeted load tests on dossier assembly queries pre-scale.",
      "Acceptance criteria per cohort: agreed handshake field completeness; passport scan success rate baselines; agreed grower satisfaction floor per cohort; MTTR on sync failures under agreed SLO minutes.",
      "Documentation: operator runbooks, incident checklists, data retention matrix, role permission catalogue, environment variable inventory with secret classification.",
    ],
  },
  {
    id: "tp-impact",
    title: "11. Impact thesis (economic, social, environmental)",
    paragraphs: [
      "Economic: compress buyer audit labour hours via structured exports; shorten payment latency where escrow narration ties to objectively satisfied custody milestones—both enable price discovery uplift for growers with clean dossiers versus peers stuck in punitive documentation loops.",
      "Social: ergonomics optimised for ageing operators—large typography on mobile scanners, audible confirmation cues optional, minimal mandatory steps per compliant happy path—to avoid digital exclusion widening already stressed rural SMEs.",
      "Environmental accountability: dossiers carry cold-chain deviations with timestamps rather than reconstructed averages—supporting low-credible greenwashing avoidance when buyers demand probabilistic QA metrics.",
      "Macro caveat: attributable impact modelling requires causal baselines versus control estates under a defined study design; platform commits to archiving anonymised aggregate KPIs annually for consortium reporting where contractually permissible.",
    ],
  },
  {
    id: "tp-team-governance",
    title: "12. Team composition, advisors and governance",
    paragraphs: [
      "Core product/engineering concentrates full-stack TypeScript competency (Nest, Next, Prisma, RN/Expo) with QA automation and UX research cycles for growers/logistics personas.",
      "Domain desk: agronomy QA liaison, refrigerated logistics liaison, treasury alignment—fractional permissible early; scale mandates embedded corridor owner per pilot geography.",
      "Governance rhythms: fortnightly sprint reviews; monthly risk register escalation; quarterly security assessment; advisory board quorum for materially new data processors or subcontractor geographies.",
      "Foundational leadership aligns brand, communications economics and roadmap arbitration—biography appears in investor materials; RACI matrices maintained per rollout wave as formal artefacts.",
    ],
  },
  {
    id: "tp-financial-plan",
    title: "13. Financial envelope and cost architecture (discussion scaffolding)",
    paragraphs: [
      "DISCLAIMER: figures below scaffold discussion only; institutional submissions require chartered modelling, tax counsel and audited historicals aligned to corridor-specific VAT regimes and insurance rules.",
      "Annual engineering & product OPEX envelope (steady-state pilot-to-scale illustrative band): EUR 680k–1.05M covering payroll (7–11 FTE equivalent blended), tooling (CI, observability, device lab), QA automation, linguistic localisation bursts, cybersecurity assessments.",
      "Infrastructure OPEX illustrative band: EUR 42k–95k/year (managed Postgres tiers, CDN, transactional email, Secrets management, redundancy uplift per geography).",
      "Variable corridor costs: refrigerated IoT gateways or third-party TMS connectors budgeted EUR 80k–200k amortised across first three SKU programmes unless partner-provided integrations reduce scope.",
      "Capitalised intangible development (capitalised versus expensed follows local GAAP)—document assumes conservative expensing of R&D payroll for programme optics unless advisor directs otherwise.",
      "Revenue sensitivity (illustrative, not predictive): plateau monthly recurring platform uplift between EUR 180k–320k after 36 months contingent on SKU density, escrow volumes, ancillary insurance commissioning legality corridor-by-corridor.",
      "Break-even choreography requires discipline on pilot subsidy burn—a staged gate reduces runway risk if KPIs diverge materially from hypotheses (defined with pilot governance, e.g. materially missed dossier completeness targets for two successive quarters).",
      "Working capital posture: escrow float assumptions must never commingle unchecked with operating cash—custodial accounting templates prepared for buyer negotiations with legal review.",
      "Sensitivity table (qualitative arrows): staffing cost (↑); faster buyer adoption (↓ engineering rework); regulatory friction on insurance linkage (↑ compliance legal); geopolitical tariff shocks on corridors (↑ hedging treasury attention, not modeled numerically herein).",
    ],
  },
  {
    id: "tp-risk-compliance",
    title: "14. Risk register, compliance path and annexes",
    paragraphs: [
      "Technical risks: sync conflict storms on patchy towers—mitigated by backoff, chunked payloads, instrumentation; cryptography debt if legacy handset OS blocks TLS1.3—maintain minimum OS matrix published each release.",
      "Market risks: buyer procurement freeze mid-pilot—mitigate diversification across two disjoint retail families per wave; reversible feature flags degrade strict enforcement without rewriting historical evidence.",
      "Regulatory risks: cross-border DP roles when German buyers consume Serbian-grower dossiers—maintain SCC/DPA artefacts; DPIA periodic refresh triggers on new profiling telemetry.",
      "Operational risks: key-person dependency early—enforce paired ownership on escrow logic and dossier merges; catastrophic data loss guarded by WAL archival + immutable backup buckets with quarterly restore rehearsals.",
      "Annex A glossary (non-exhaustive): Batch lineage tree; Handshake object (logistics custody transfer); Passport projection (buyer-visible dossier subset); Integrity Guard (ruleset intersection of whitelist, barcode and optional estate predicates); Vera bonus economics (tie to materially verified packing evidence when programme mandates).",
      "Annex B references anchor to internal schema inventory, exported OpenAPI drafts when published, DPIA drafts, RACI drafts—held outside this web render for versioning hygiene; link placeholders may be circulated under NDA-only distribution channels.",
    ],
  },
] as const;
