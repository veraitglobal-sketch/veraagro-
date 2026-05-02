/**
 * Condensed implementation atlas — proves the codebase maps to controllers and flows
 * without listing every endpoint. Full OpenAPI/export lives outside this marketing PDF.
 */
import type { TechnicalProposalChapter } from "@/content/technical-proposal.part-a";

export const TECHNICAL_PROPOSAL_IMPLEMENTATION_ATLAS: readonly TechnicalProposalChapter[] = [
  {
    id: "impl-atlas-core",
    title: "Implementation atlas — Backend domains & grower/sync",
    paragraphs: [
      "The HTTP API is a modular NestJS service. **Identity**: JWT auth and role guards; sensitive routes throttle abuse (e.g. field-entry submission limits). **Geometry & estates**: CRUD parcels and polygons that downstream sync validates against GPS samples.",
      "**Cultivation**: online single-row intake plus bulk **offline replay** guarded for grower/farmer roles; late-but-valid arrivals surface to coordinators; central validation rejects disallowed fertiliser/seeds **before persistence** regardless of endpoint shape.",
      "**Integrity & compliance**: whitelist/catalogue-backed chemistry; barcode and seedserial checks compliance logs with device and GIS context; admins govern lists, alerts and escalation paths tied to audits.",
      "**Batches & QA**: batch lifecycle quality gates package badges vera bonus standards—shipment-ready checks expose booleans procurement can honour before releasing further orders.",
      "**Logistics**: missions lifecycle claim/accept/driver bind temperature readings border/wait artefacts handovers with PDF fingerprints where mandated; distributor and delivery surfaces complete the refrigerated graph.",
      "**Commerce**: orders payments wallets splits treasury-facing JSON consistent with QA timestamps; passports and QR modules generate verifiable dossiers and downloadable PDFs; transparency routes feed consumer-facing lookups.",
      "**Suppliers** align storefront SKUs with the same sanctioned materials enforcement uses—no orphaned catalogue pretending “approved” chemistry when the field validator disagrees.",
    ],
  },
  {
    id: "impl-atlas-logistics-buyer-grower-portal",
    title: "Implementation atlas — Logistics handovers, passports/QR, grower portal",
    paragraphs: [
      "Typical refrigerated flow: growers create missions; logistics partners discover claim accept and execute lifecycle steps; temperature rows attach instruments and breach flags structured handovers and receiver proofs produce traceable artefacts (including PDF retrieval where coded) buyer gates can require completeness before onward shipment approvals.",
      "Passports are generated server-side keyed by estates and parcels with hashes suitable for downstream verification QR stacks resolve certificate payloads and downloadable PDF dossiers badges support shelf storytelling without dumping entire estates publicly.",
      "Grower portal surfaces consolidate mission tracking journey timelines financial summaries and consumer feedback keyed by deterministic batch identifiers—keeping web/expo dashboards aligned via the same payloads rather than forked guesses.",
      "Optional blockchain overlay endpoints exist exploratory diligence should insist on Postgres foreign keys timestamps signed PDF artefacts and QA photography before treating auxiliary hashes as substance.",
      "Operational discipline: regressions gated before pilot promotions contract snapshots document partner-visible routes—this annex is directional OpenAPI artefacts remain versioned artefacts under NDA for integration teams.",
    ],
  },
] as const;
