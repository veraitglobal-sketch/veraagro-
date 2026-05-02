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
      "The HTTP API is a modular NestJS service. Identity: JWT auth and role guards; sensitive routes throttle abuse (for example field-entry limits). Geometry and estates: parcels and polygons that downstream sync validates against GPS samples.",
      "Cultivation: online intake plus bulk offline replay guarded for grower and farmer roles; late-but-valid arrivals surface to coordinators; central validation rejects disallowed fertiliser or seed claims before persistence, regardless of which route was used.",
      "Integrity and compliance: catalogue-backed chemistry; barcode and seed checks with device and GIS context stored in logs; admins govern lists and alerts aligned with audits.",
      "Batches and QA: batch lifecycle quality gates package badges Vera bonus hooks—where coded, shipment-ready checks give procurement booleans before more orders unlock.",
      "Logistics: mission lifecycle assign claim accept driver bind temperatures border dwell handovers PDF fingerprints where mandated distributors and deliveries complete the cold graph.",
      "Commerce: orders payments wallets split JSON aligned with QA timestamps passports and QR tooling generate PDF dossiers consumer transparency routes reuse the same batch keys.",
      "Supplier storefront SKUs resolve against the same approved materials catalogue the field validators use—avoiding phantom “approved” products in the catalogue that the field rejects.",
    ],
  },
  {
    id: "impl-atlas-logistics-buyer-grower-portal",
    title: "Implementation atlas — Logistics handovers, passports/QR, grower portal",
    paragraphs: [
      "Typical refrigerated flow: growers open missions; logistics partners discover, claim, accept and drive lifecycle steps; temperatures attach with breach flags; structured handovers and receiver proofs produce traceable evidence (including retrievable PDFs where implemented). Buyer-side gates can require completeness before the next shipment wave.",
      "Passports are generated server-side from estate and parcel context with hashes for verification; QR flows resolve certificates and full PDF dossiers for buyers; package badges support shelf stories without publishing whole farm databases.",
      "Grower portal endpoints consolidate mission tracking, journey timelines, financial snapshots and feedback tied to one batch id so web and mobile stay aligned on the same payloads.",
      "Optional blockchain endpoints are exploratory: diligence should still treat relational timestamps, signed PDFs and QA photography as the primary proof.",
      "Regressions gate releases for pilots; partner-facing route lists are captured in versioned OpenAPI bundles under NDA—this PDF stays a map, not a dump of every path.",
    ],
  },
] as const;
