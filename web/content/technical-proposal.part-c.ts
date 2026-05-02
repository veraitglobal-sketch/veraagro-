/** Additional annex-style chapters — Part C for printable length (~+6–10 pages when printed). */
import type { TechnicalProposalChapter } from "@/content/technical-proposal.part-a";

export const TECHNICAL_PROPOSAL_CHAPTERS_PART_C: readonly TechnicalProposalChapter[] = [
  {
    id: "tp-annex-apis",
    title: "15. Annex — API idioms, error taxonomy and versioning",
    paragraphs: [
      "Public integration surfaces converge on REST payloads with RFC7807-style problem+json compatible fields for programmatic clients; undocumented side channels are discouraged to prevent shadow integrations that bypass auditing.",
      "Semantic versioning publishes major bumps when incompatible field removals occur; additive fields ship as minor increments; deprecation windows minimum ninety days for externally consumed routes unless a documented security exception shortens the window under Vera API lifecycle policy.",
      "Idempotency headers supported on ingestion routes that materially affect parcels or payouts; duplicate submits return prior committed identifiers with informational codes rather than alarming operators.",
      "Locale negotiation does not mutate canonical identifiers; textual fields may localise projections while stable keys remain invariant for joins across dossier artefacts.",
      "Pagination uses opaque cursors rather than naive offsets beyond shallow listing endpoints to mitigate pathological scans when estates scale into tens of thousands of historical events.",
      "Bulk export endpoints chunked with watermarks tying export actor and timestamp inline with GDPR accountability principle; cryptographic signing of dossier artefacts optional roadmap item contingent on institutional buyer mandates.",
      "Operational error classes tiered: VALIDATION_REJECT (grower-remediable), POLICY_BLOCKED (whitelist or programme conflict), SYNC_CONFLICT (merge required), INTERNAL_RETRYABLE (engineering alert), HARD_FAIL (immutable incident record). Metrics aggregate monthly for programme steering.",
      "Schema registry maintained alongside OpenAPI; Postman starter collections circulated under NDA; mock servers seeded with anonymised transcripts for QA partners onboarding engineering teams gradually.",
    ],
  },
  {
    id: "tp-annex-sre",
    title: "16. Annex — Reliability targets, observability and SLO sketches",
    paragraphs: [
      "Availability framing differentiates dossier reads (higher SLA sensitivity) versus non-critical dashboards; early pilot SLA may pragmatically waive strict financial rebates in favour transparent incident logs until measurement stabilises.",
      "Synthetic checks probe mission lifecycle milestones hourly from neutral vantage points geographically distributed; alerting routes through on-call rotations with playbook links embedded in the observability tooling (e.g. Grafana annotations).",
      "Distributed tracing propagated on API boundaries materially affecting custody edges; sampled on high-volume benign reads to cap cost envelopes.",
      "Database guardrails include statement timeout escalation, pooled connection dashboards, quarterly EXPLAIN audits on dossier merges crossing threshold row counts triggering index proposals.",
      "Disaster rehearsal scenarios: Postgres restore from backup artefact onto isolated cluster + smoke-test passport assembly; tabletop with buyer representatives twice yearly coordinating communications templates.",
      "Cost observability allocates tags per SKU programme and pilot cohort—not merely environment—to prevent silent subsidy cross-subsidisation between unrelated buyer experiments.",
      "Incident classification codifies Sev1–4 timelines; Sev1 mandates executive notification within SLA minutes and external partner status page updates when buyer-facing dossiers go stale beyond contractually agreed windows (numeric SLAs set per programme).",
    ],
  },
  {
    id: "tp-annex-qa",
    title: "17. Annex — QA depth, cohort gating & release choreography",
    paragraphs: [
      "Regression tiers: nightly full suite blocking deploy on red; exploratory charter sessions alternating grower-centric vs logistics-centric quarterly; fuzzing ingestion edges on malformed barcodes sanitized without corrupting datastore.",
      "Cohort gates: estate moves from permissive Integrity Guard thresholds to enforced thresholds only after sign-off QA checklist—including offline chaos inject days simulating intermittent DNS failure patterns.",
      "Release toggles bifurcate strict dossier validations vs shadow logging mode absorbing counts of would-be rejects without blocking supply—used only transitional weeks with capped volume ceilings.",
      "Accessibility sweeps prioritise readability for mobile outdoor glare contexts (contrast checkpoints) even when formal WCAG certification deferred due to backlog economics—document pledges phased timeline.",
      "Performance budgets articulate maximum JavaScript payload per critical path route; lighthouse automation fails builds breaching envelopes except approved exceptions with CTO sign-off and expiry timestamps.",
      "Penetration retests scheduled minimally annually or after major perimeter changes; bounty programme optional escalation post-scale when attack surface diversification justifies continual crowd testing.",
      "Harmonisation with buyer QA artefacts: configurable export filters align field naming to buyer ontology CSV templates—engineering supplies mapping tables versioned beside API releases.",
    ],
  },
  {
    id: "tp-annex-scale",
    title: "18. Annex — Capacity planning, benchmarking and future research",
    paragraphs: [
      "Horizontal scaling hypotheses assume dossier merges remain O(n log n) relative lineage growth—proved only empirically; scheduled rearchitecture triggers if asymptotic divergence observed beyond profiling noise across three consecutive benchmarking weeks.",
      "Sharding strategy deferred until transactional row hotspots exceed pragmatic single-region Postgres limits at extreme telemetry volume (e.g. aggregated temperature samples in the billions); archival tiering partitions historical micro-samples sooner.",
      "Edge caching of passive passport reads contemplated via signed short-lived artefacts when retail traffic spikes coincide with transient origin degradation—engineering trade-off pits freshness vs scalability.",
      "Research backlog: probabilistic cryptographic attestations bridging low-connectivity stamping; reinforcement assistance ranking grower anomaly alerts minimizing false-positive fatigue; multilingual summarisation strictly opt-in respecting producer agency.",
      "Patent posture eschews aggressive submarine filings; defensive publication considered for obvious combinations that could otherwise be nuisance-filed against ecosystem participants, following advice from patent counsel.",
      "Environmental extended metrics (CO₂ equivalents) remain non-authoritative absent verified third-party metering chains; dossier flags clearly separate measured vs interpolated environmental commentary to protect buyer trust.",
      "Community governance post-scale may adopt advisory farmer council rotating seats per geography—beyond software scope yet noted for inclusion in consortium grant narrative alignment.",
      "Technical proposal evolution: authoritative copies versioned externally (Git tagging + signed PDF artefacts) superseding ephemeral web-render snapshot; hyperlink in PDF footers should cite canonical semver for audit defensibility.",
    ],
  },
] as const;
