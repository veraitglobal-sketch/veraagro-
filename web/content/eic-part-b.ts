/**
 * EIC / EU grant narrative — structured around four evaluator questions:
 * why this exists, how big the market is, how you earn money, why you will succeed.
 * Centres Bio Vera as one physical–digital whole: bio production, Vera packaging & labels,
 * supplier ring ordering through Vera’s packaging partners, retail-capable growers, logistics,
 * and triple-layer control (digital, procurement discipline, field agents).
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
      "Bio Vera is not ‘a software SKU’ dropped onto conventional farming—we are building one programme organism. Organic horticulture succeeds in EU retail only when seed and fertiliser, treatment discipline, Vera-specified crates films and punnet-ready retail packaging batch identity stickers compliance photography graded picking and refrigerated delivery read as one defensible dossier. We stitch those physical realities together with modern tools so growers buyers and auditors stop paying the tax of parallel paperwork.",
      "Concrete packaging is part of the promise: Vera works with converters and packaging partners who manufacture programme-grade boxes films and retail-facing kits to Vera tolerances—not generic stock unrelated to QA rules. The commercial chain is explicit: Vera’s packaging partners produce approved SKUs; authorised agronomic-supply retailers and input shops place factory or converter orders against those programme lines (not ad-hoc local substitutes), so lot-level traceability matches Integrity Guard and passport wording.",
      "Programme growers purchase inputs labels and compliant packaging packs through those suppliers—a contracting pattern that binds what crosses the packing line to what the whitelist and photo protocols expect. When barcodes tally with supplier order lines and conformity shots match palletisation rules, retail-facing explanations stop sounding improvised.",
      "Growers who consistently meet programme quality packaging and custody gates become eligible for retail-directed fulfilment support: coordinated pickups consolidation where applicable disciplined handovers and passport-ready batches—lifting compliant SMEs closer to repeatable shelf placements instead of perpetual spot-trade fragility.",
      "Refrigerated logistics rides inside the organism—missions checkpoints temperature evidence—so the weakest link cannot be shrugged off to an unrelated carrier relationship.",
      "German-facing negotiations on Vera biological seed and Vera biological fertiliser remain foundational; those SKUs would flow principally through Vera’s supplier network—as with packaging—creating a disciplined upstream before harvest ever leaves the greenhouse row.",
      "EU buyers tightening proof load need exactly this coherence: honesty about agronomy honesty about wrapping honesty about refrigeration—not three rhetorics sewn together at the PDF stage.",
    ],
  },
  {
    id: "eic-market-size",
    title: "2. How large the market is",
    paragraphs: [
      "Downstream, European supermarkets and speciality buyers consolidate multi–tens of billions of euros each year across chilled horticulture lanes where SKU holds and conformity photography already gate margin. Vera monetises disciplined participation in those lanes—not mythical ‘all-food’ dashboards.",
      "Midstream sits programme packaging consumption: crates labels films and graded retail-ready secondary packaging commanded by disciplined organic programmes—not undifferentiated global polymer markets. Anchoring SKU selection through converters who co-develop Vera lines turns packaging into repeatable revenue correlated with hectares and harvest waves inside the corridor.",
      "Upstream, agricultural supply pharmacies input retailers and cooperating cooperatives already serve growers who aspire to branded retail placement; digitising disciplined ordering through those relationships captures share of wallet proportional to estates entering programme tiers—not anonymous app diffusion.",
      "Market depth grows by geography: additional compliant growers plus additional supplier branches plus incremental packaging SKU adoption—each deepening the dossier-rich volume eligible for passports logistics fees and Vera margin on controlled inputs—not one-off licences.",
      "Eligible growers stepping into retail-oriented fulfilment expand average revenue per anchored estate without forcing every pilot farm into unrealistic same-day sophistication on day zero—cohort pacing keeps claims honest.",
    ],
  },
  {
    id: "eic-how-we-earn",
    title: "3. How we make money",
    paragraphs: [
      "Income crosses digital and tangible lines by design—not only subscription or platform uplift for the spine—but revenue share/markup on Vera biological seed fertiliser routed through authorised suppliers; programme fees linked to sanctioned packaging SKUs converters produce for Vera; batch badge and conformity photography flows that attach to passports; refrigerated orchestration and mission fees tying custody to payer benefit.",
      "Economics respects the sourcing chain growers order through Vera suppliers for inputs programme labels and Vera-defined packaging mixes; authorised suppliers consolidate factory orders toward Vera-aligned packaging partners so margin capture and SKU authority stay symmetrical with field enforcement rather than orphaned purchasing noise.",
      "Retail-capable tiers for qualifying growers elevate average ticket size: fuller packaging programmes plus structured logistics uplift fees compared with commodity spot lanes—provided handshake completeness milestones stay green.",
      "Partner pricing ladders and packaging conformance bonuses steer margin toward growers who uphold programme standards—not toward opaque intermediaries while still funding corridor enablement trainers agent oversight and conformity labs.",
      "Buyers remunerate Vera indirectly via reduced SKU-hold fallout faster dispute resolution anchored to consistent photography and thermometer trails—economics borne by procurement savings not consumer deception.",
      "Insurance-style companions remain geographically optional—not core revenue storytelling until underwriting clarity exists per member state regimes.",
    ],
  },
  {
    id: "eic-why-succeed",
    title: "4. Why we will succeed",
    paragraphs: [
      "Success rests on deliberately triple-layer assurance—software supports but humans and procurement rules close the loopholes:",
      "(1) Digital integrity: whitelist fertiliser coherence seed serial linkage estate geometry batch IDs compliance-photo typologies—all timestamped—not cosmetically optional.",
      "(2) procurement discipline inputs labels and sanctioned packaging—including supplier routes into Vera-aligned converter partners—so ‘what scanned’ cannot diverge casually from ‘what should exist on pallet’.",
      "(3) field agents and supervisory visits: Vera maintains an active corps of programme agents inspecting estates packing areas consolidation points alongside digital telemetry—photos escalations corrective actions—so oversight on the ground is not outsourced to folklore. Agent visit cadence escalation rules and on-site corrective SLAs are budgeted and KPI’d with the digital stack—physical verification is not allowed to lag behind alerts; recurrent non-conformance or custody gaps trigger doorstep inspection inside contracted windows. Competing dashboards without supplier-packaging enforcement and agents leave the weakest proof layer entirely human-invisible.",
      "Converters co-develop packaging with Vera’s programme office so SKU artwork tolerances stacking patterns and refrigeration compatibility match QA scripts buyers already enforce—preventing heartbreaking rejections borne of ambiguous generic cartons unrelated to dossier wording.",
      "Retail fulfilment ladders reward compliant SMEs with orchestrated pickups and dossier-complete missions—commercial gravity pulls growers deeper into sanctioned packaging behaviour instead of improvisation.",
      "Technical pragmatism endures underneath: relational cores offline sync mission APIs—but those tools animate the organism they do not replace partner factories supplier shops agent boots or refrigerated trucks.",
      "German seed/fertiliser production agreements—when registration milestones clear—amplify brand conviction but sequencing stays honest: corridor pilots deepen before vanity horizontal rollouts supplier pools diversify before fragile single-supplier chokepoints spend throttles trigger if KPIs diverge materially two quarters straight.",
    ],
  },
  {
    id: "eic-implementation",
    title: "5. Implementation plan",
    paragraphs: [
      "Thirty-six months benchmarked against supplier SKU depth handshake completeness passport readability packaging conformity rates agent coverage metrics—not raw commit velocity.",
      "Year 1: widen authorised agronomic-retail onboarding; onboard initial Vera packaging SKU bill of materials flowing supplier→converter with catalogued Integrity entries; certify field agent playbook including escalation to programme QA council; deepen German partner tracks for Vera biological inputs; tighten offline sync refrigerated mission baselines; publish retail-eligibility ladders for pioneering growers hitting packaging and conformity gates.",
      "Year 2: expand packaging portfolio with converter partners enlarge retail fulfilment waves for qualifying cohort tie purchasing compliance KPIs explicitly to fulfilment privileges expand passport readability for hallmark buyers deepen cooperative extensions where culturally relevant.",
      "Year 3: scale dossier query economics widen certified logistics constellation strengthen agent rotational density anonymised discrepancy analytics feeding programme curriculum refresh DPIA artefacts as cross-border data intensifies alongside German-produced inputs circulating into Balkanic harvest dossiers.",
      "Cross-cutting: contract tests ingestion resilience drills packaging artwork governance boards agent calibration sessions—amplify marketing only when KPI stack stays green sequentially.",
    ],
  },
  {
    id: "eic-budget",
    title: "6. Budget and use of funds",
    paragraphs: [
      "Total eligible project cost baseline thirty-six months: EUR 992 000—validated with accountants and Funding & Tenders tables before submission locking.",
      "Personnel EUR 682 000: engineering/product plus corridor enablement prioritising supplier training packaging programme management agent corps logistics coordination conformity analytics—not abstract R&D headcount divorced from hectares.",
      "Subcontracting EUR 95 000: legal/regulatory on inputs packaging registrations cross-border data agronomic attestation penetration testing calibrated to widening attack perimeter.",
      "Other direct EUR 118 000: cloud observability ergonomic devices for agents and pilots telematics peripherals packaging pilot mould trials where capitalised softly as OPEX narrative.",
      "Travel EUR 71 000: Germany packaging partner corridors supplier workshops cooperative alignment logistics summits—not conference tourism.",
      "Other goods EUR 26 000: glossary-critical translation dossier artefacts archiving.",
      "Co-financing near twenty-six percent founder reinvestment and early corridor receipts—coordinate counsel before portal freeze.",
      "Spend throttles if supplier conformance handshake completeness or packaging conformity regress two consecutive quarters protects runway preserves engineering calibre for corrective incident response—not panic layoffs shredding agent depth.",
    ],
  },
] as const;
