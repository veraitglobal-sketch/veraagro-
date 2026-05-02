/**
 * Opening of the technical proposal: who should read what, then a short grant-style pitch
 * (problem → solution → market/revenue → delivery → budget). No API detail here.
 */
import type { TechnicalProposalChapter } from "@/content/technical-proposal.part-a";

export const TECHNICAL_PROPOSAL_OPENING: readonly TechnicalProposalChapter[] = [
  {
    id: "doc-how-to-read",
    title: "How to read this document",
    paragraphs: [
      "The file is long on purpose: it is both a funding story and a technical annex. You do not need to read everything.",
      "If you are an EU evaluator or institutional funder, start with the next section (Executive pitch), then skim Part B from Market through Finances for numbers and competition, and use the budget lines in the pitch beside your portal tables. Treat the Implementation atlas and the later architecture chapters as optional proof the product is buildable—skip them unless you want engineering depth.",
      "If you are a buyer or corridor partner, read the Executive pitch and Part B from Problem through How it works for packaging, suppliers, cold chain and agents.",
      "If you are an engineer or auditor of the codebase, use the Implementation atlas and the architecture, offline and security chapters; they point to modules, routes and data the running system actually uses.",
    ],
  },
  {
    id: "doc-executive-pitch",
    title: "Executive pitch — problem, solution, economics, delivery",
    paragraphs: [
      "Problem. Conscientious growers in the Balkan–EU corridor often lose margin to evidence chaos: notes, photos, temperatures and payments live in different places, so every audit season becomes a reconstruction job. Buyers pay in SKU holds, delays and staff hours; growers pay in spot prices and rejections that often have little to do with intrinsic quality.",
      "Solution (outcomes, not technology stack). Bio Vera runs one programme: the same batch is followed from inputs and parcels through packing with programme-grade packaging (ordered via authorised suppliers from Vera-aligned converters), refrigerated legs with clear handovers, and retail-ready dossiers such as QR passports. That reduces duplicated paperwork, aligns what the grower recorded with what the buyer sees, and makes cold-chain and packaging claims defensible without three conflicting PDF narratives.",
      "Market (orders of magnitude). European fresh and chilled horticulture through modern retail is a multi–tens of billions of euros annual basket; organic and high-care SKUs carry higher documentation cost per tonne. We chase corridor programmes (for example Southeast Europe into German buying offices), not all food globally. Discussion-only economics (replace with CFO-signed models before binding use) include a recurring-revenue plateau band on the order of roughly EUR 180k–320k per month after about thirty-six months—sensitive to SKU density and uptake—not a forecast until finance signs it.",
      "How we earn. Platform or programme fees; margin on Vera biological seed and fertiliser through sanctioned suppliers; packaging-programme and conformity-related fees; orchestration fees on refrigerated missions where custody clearly benefits the payer. Buyers also save procurement and QA time when one dossier is consistent—we grow when programmes stick.",
      "Why it can work. Three reinforcing layers: (1) digital rules on approved inputs, boundaries, batch identity and photos; (2) procurement discipline so packaging and inputs match what the programme authorised; (3) field agents on a defined cadence so physical checks do not lag dashboards. Packaging is co-developed with converters to buyer QA scripts, reducing rejections from generic cartons.",
      "Delivery (thirty-six months). We judge progress on supplier depth, handshake completeness, passport quality, packaging conformance and agent coverage—not commits. Year one stresses authorised retailer/supplier onboarding, first packaging BOM from supplier to converter, the agent playbook, German input partnerships and eligibility rules for retail fulfilment; years two and three widen packaging waves, fulfilment pools and certified logistics.",
      "Budget (project baseline). Total eligible cost EUR 992 000 over thirty-six months (mirror in Funding and Tenders): Personnel EUR 682 000; Subcontracting EUR 95 000; Other direct EUR 118 000; Travel EUR 71 000; Other goods EUR 26 000; co-financing about twenty-six percent from founder and early corridor receipts. Discretionary spend tightens if conformance or packaging KPIs weaken for two consecutive quarters—protecting runway and agent capacity.",
    ],
  },
] as const;
