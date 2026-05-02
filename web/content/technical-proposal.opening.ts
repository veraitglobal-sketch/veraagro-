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
      "The file is long on purpose: it is both a **funding story** and a **technical annex**. You do not need to read everything.",
      "If you are an **EU evaluator or institutional funder**, start with the next section (Executive pitch), then skim **Part B — Market through Finances** for numbers and competition, and use the **budget lines** in the pitch as the companion to your portal tables. Treat the **Implementation atlas** and late **architecture annexes** as optional proof that the product is buildable—skip them unless you want engineering depth.",
      "If you are a **buyer or corridor partner**, read the Executive pitch and **Part B — Problem through How it works** for operating reality (packaging, suppliers, cold chain, agents).",
      "If you are an **engineer or auditor of the codebase**, use the **Implementation atlas** and the **architecture / offline / security** chapters; those name modules, routes and data shapes that match the running system.",
    ],
  },
  {
    id: "doc-executive-pitch",
    title: "Executive pitch — problem, solution, economics, delivery",
    paragraphs: [
      "**Problem.** Conscientious growers in the Balkan–EU corridor often lose margin to **evidence chaos**: field notes, photos, temperatures and payments live in different places, so every audit season becomes a reconstruction project. Buyers pay in **SKU holds, delays and staff time**; growers pay in **spot prices and rejections** that have little to do with intrinsic quality.",
      "**Solution (outcomes, not stack).** Bio Vera runs one **programme**: the same batch is followed from **inputs and parcels** through **packing and programme-grade packaging** (ordered via authorised suppliers from Vera-aligned converters), **refrigerated legs with clear handovers**, and **retail-ready dossiers** (e.g. QR passports). That cuts duplicated paperwork, aligns what the grower scanned with what the buyer sees, and makes **cold-chain and packaging claims** defensible without three different PDF stories.",
      "**Market (orders of magnitude).** European **fresh and chilled horticulture** through modern retail is a **multi–tens of billions of euros** annual basket; organic and high-care SKUs carry **higher documentation cost per tonne** and stricter proof. We focus on **corridor programmes** (e.g. Southeast Europe into German distribution), not “all food”. Internal **discussion-only** economics (to be replaced with signed-off models) include a **plateau band** for platform and programme-related recurring revenue on the order of **roughly EUR 180k–320k per month after about 36 months**, sensitive to SKU density and corridor adoption—**not** a forecast until finance signs it.",
      "**How we earn.** Revenue is meant to mix **platform/programme fees**, **margin on Vera biological seed and fertiliser** through authorised suppliers, **packaging-programme and conformity-related fees**, and **orchestration on refrigerated missions** where custody benefits the payer. Buyers also save **procurement and QA time** when dossiers are consistent—Vera benefits when programmes stick.",
      "**Why it can work.** Three layers: **(1)** digital rules (approved inputs, boundaries, batch identity, photos); **(2)** **procurement discipline** (sanctioned packaging and inputs through the supplier network); **(3)** **field agents** on a defined cadence so **on-the-ground checks** do not lag dashboards. Converters co-develop packaging to buyer QA scripts to avoid **rejections from generic cartons**.",
      "**Delivery (36 months).** Success is measured by **supplier depth, handshake completeness, passport quality, packaging conformance and agent coverage**—not commit counts. Year 1 prioritises **authorised retail/supplier onboarding**, first **packaging BOM** supplier→converter, **agent playbook**, German **input** tracks and **retail-eligibility rules** for compliant growers; years 2–3 broaden packaging, fulfilment waves and logistics certification.",
      "**Budget (project baseline).** Total eligible cost **EUR 992 000** over 36 months (validate in Funding & Tenders forms): **Personnel EUR 682 000**, **Subcontracting EUR 95 000**, **Other direct EUR 118 000**, **Travel EUR 71 000**, **Other goods EUR 26 000**; **co-financing ~26%** founder/early corridor. **Spend tightens** if conformance or packaging KPIs regress two quarters running—protecting runway and agent depth.",
    ],
  },
] as const;
