/**
 * EU grant narrative (embedded in Detailed technical proposal after the executive summary).
 * Same shape as other proposal chapters — stable anchors e.g. #eic-why-exists for bookmarks.
 */
import type { TechnicalProposalChapter } from "@/content/technical-proposal.part-a";

/** @deprecated Use TechnicalProposalChapter; kept for clarity in grep/docs. */
export type EicPartBChapter = TechnicalProposalChapter;

export const EIC_PART_B_CHAPTERS: readonly TechnicalProposalChapter[] = [
  {
    id: "eic-why-exists",
    title: "1. Why Bio Vera exists",
    paragraphs: [
      "Bio Vera is not another generic farm app bolted onto conventional growing. In real life, organic fruit and vegetables only stay on EU retail shelves when the story holds together: what was sown and fertilised, how the crop was treated, how it was packed, labelled, photographed and moved cold—all of it has to match what the buyer and the auditor see in one place. Today that story usually lives in five different folders. We build one programme so growers, buyers and inspectors are not paying a hidden “paperwork tax” on every season.",
      "Packaging belongs in that story from day one. Vera works with packaging partners who produce programme-grade boxes, films and retail-ready kits to agreed specifications—not random stock that later fails a photo check. The path of goods is clear: those partners make the approved lines; our authorised agronomic and input retailers order from them. That way lot numbers, artwork and quality match what the field app and the passport expect. Ad-hoc local substitutes are exactly what cause rejections and arguments later.",
      "Programme growers buy inputs, labels and packaging through those suppliers on purpose. What leaves the packing line is therefore tied to the same barcodes and photo rules the programme already defined. When a scan, an order line and a conformity photo agree, nobody has to improvise an explanation for retail.",
      "Farmers who keep meeting quality, packaging and cold-chain rules can step up to retail-oriented support: planned pickups, consolidation where it helps, disciplined handovers and batches that are ready for the buyer’s dossier. The aim is simple—repeatable shelf placement for serious small and mid-sized growers, not a lifetime of one-off spot deals.",
      "Refrigerated transport is inside the same programme. Missions, checkpoints and temperature records are not “someone else’s carrier problem” that we mention only if something goes wrong.",
      "Our work on Vera biological seed and fertiliser with German partners is part of the same foundation. Those products are meant to move through the same supplier network as packaging, so the upstream is disciplined before harvest even starts.",
      "EU buyers are asking for heavier proof, not prettier PDFs. They need one honest line on agronomy, one on packaging and one on refrigeration—written in the field and the warehouse, not stitched together the night before an audit.",
    ],
  },
  {
    id: "eic-market-size",
    title: "2. How large the market is",
    paragraphs: [
      "Downstream, European supermarkets and speciality buyers move very large volumes each year in chilled produce. In those categories, a missed photo, a weak cold story or a SKU hold is already money lost. Vera earns its place by helping growers and partners participate cleanly in those lanes—not by claiming to serve “all food everywhere”.",
      "In the middle of the chain sits real packaging demand: crates, labels, films and secondary packs that organic programmes actually specify. When converters co-develop Vera lines, that spend grows with hectares and harvest waves in the corridor instead of looking like a one-off plastic order.",
      "Upstream, farm supply shops, agronomic retailers and cooperatives already stand next to growers who want better retail access. Bringing disciplined ordering through those trusted doors matches how farmers already buy—and grows with the number of estates that join the programme, not with anonymous downloads of an app.",
      "Depth comes from repetition: more compliant growers, more supplier branches using programme packaging, more complete dossiers. That is recurring corridor volume—passports, logistics and Vera’s share on controlled inputs—not a single licence sale.",
      "Retail-oriented fulfilment for eligible growers raises what an anchored estate can earn over time, without pretending that every pilot farm must look like Berlin retail logistics on week one. We grow cohorts honestly.",
    ],
  },
  {
    id: "eic-how-we-earn",
    title: "3. How we make money",
    paragraphs: [
      "Revenue mixes digital backbone with physical programme economics. Beyond core platform uplift where it applies, we expect margin on Vera biological seed and fertiliser flowing through authorised suppliers; fees linked to sanctioned packaging SKU programmes that converters produce; flows tied to batch badges and conformity photography inside passports; and orchestration fees on refrigerated missions where custody clearly benefits the payer.",
      "The sourcing chain matters for the maths. Growers order inputs, programme labels and Vera-defined packaging packs through sanctioned suppliers; those suppliers place factory orders with Vera-aligned packaging partners so what is bought upstream is what the field integrity rules recognise. Purchasing is not a parallel universe that auditors can ignore.",
      "Qualifying growers who use fuller packaging programmes and structured logistics naturally carry a larger ticket—but only while handovers and dossier completeness stay in good standing.",
      "Partner pricing ladders and bonuses for proper packing steer value toward growers who do the work, while still paying for trainers, agents, conformity checks and corridor enablement—not for opaque middle layers.",
      "Buyers pay Vera indirectly too: fewer emergency holds, faster answers when something is questioned, fewer meetings spent rebuilding the story—because photographs and temperature trails look the same from grower dock to QA desk.",
      "Insurance-style products may join later where regulation allows; we do not centre the pitch on revenue that is not yet clear country by country.",
    ],
  },
  {
    id: "eic-why-succeed",
    title: "4. Why we will succeed",
    paragraphs: [
      "We rely on three layers that reinforce each other. Software alone rarely fixes food programmes; procurement rules and people on site close the gaps.",
      "First, digital integrity: approved fertiliser lists, seed serial coherence, estate boundaries, batch IDs and compliance photo types—all time-stamped—so “trust me” is not the default mode.",
      "Second, procurement discipline: inputs, labels and sanctioned packaging, including supplier routes into Vera-aligned converters, so what someone scans at the pallet is not casually different from what the programme authorised.",
      "Third, field agents: Vera invests in programme agents who visit estates, packing areas and consolidation points alongside the telemetry they already see online—photos, escalations, corrective steps. Visit rhythm, escalation rules and on-site corrective deadlines are planned and measured next to digital alerts so boots on the ground do not lag dashboards. Repeated problems or custody gaps trigger an agreed physical inspection inside a fixed window. Dashboards without packaging enforcement and without agents leave the softest proof layer invisible.",
      "Converters work with Vera’s programme office so artwork, tolerances, stacking patterns and refrigeration fit match scripts buyers already use—fewer heartbreaking rejections from generic cartons that never matched the dossier.",
      "Retail fulfilment steps reward compliant SMEs with organised pickups and complete missions—so behaving well in packaging is commercially worth it.",
      "Underneath lies solid engineering: Postgres, offline sync, mission APIs. Those tools serve the programme; they do not replace factories, supplier shops, agents or refrigerated trucks.",
      "German seed and fertiliser agreements will strengthen the brand when registration steps are met. Until then we deepen pilots, widen supplier bases and throttle spend if KPIs slip for two quarters in a row—so growth does not kill credibility.",
    ],
  },
  {
    id: "eic-implementation",
    title: "5. Implementation plan",
    paragraphs: [
      "We judge thirty-six months on corridor outcomes—supplier SKU depth, handshake completeness, how readable passports are, packaging conformance, agent coverage—not on how many commits ship.",
      "Year 1: onboard more authorised agronomic retailers; launch the first Vera packaging bill of materials from supplier through converter with matching catalogue entries for integrity checks; certify the field-agent playbook including escalation to programme QA; advance German tracks on biological inputs; harden offline sync and cold missions; publish clear rules for which growers unlock retail-eligible fulfilment once packaging and conformity gates are met.",
      "Year 2: broaden packaging with existing converter partners; widen retail fulfilment waves for qualifying cohorts; tie purchasing and compliance KPIs visibly to fulfilment privileges; improve passport clarity for anchor buyers; deepen cooperative relationships where that fits local practice.",
      "Year 3: scale economics on dossier queries; widen the certified logistics circle; increase agent rotation where needed; use anonymised discrepancy patterns to refresh training; keep privacy documentation current as cross-border data and German-sourced inputs flow into Balkan harvest files.",
      "Throughout: contract tests, resilience drills, packaging artwork governance, agent calibration—marketing loud only when the operational scoreboard stays green.",
    ],
  },
  {
    id: "eic-budget",
    title: "6. Budget and use of funds",
    paragraphs: [
      "Total eligible project cost over thirty-six months: EUR 992 000—cross-checked with accountants and the official Funding & Tenders budget tables before final submission.",
      "Personnel EUR 682 000: product and engineering plus corridor work—supplier training, packaging programme management, the agent corps, logistics coordination and conformity analytics—so people are tied to hectares and handshakes, not abstract R&D lines.",
      "Subcontracting EUR 95 000: legal and regulatory on inputs and packaging, registrations, cross-border data, agronomic attestation and penetration testing as the surface area grows.",
      "Other direct costs EUR 118 000: cloud and observability, rugged devices for agents and pilots, telematics peripherals, small packaging pilot trials treated as OPEX where appropriate.",
      "Travel EUR 71 000: corridors to German packaging partners, supplier workshops, cooperative alignment and logistics meetings—operational travel, not conference tourism.",
      "Other goods EUR 26 000: translation and dossier materials that must be precise for buyers and authorities.",
      "Co-financing of roughly twenty-six percent from founder reinvestment and early corridor income—aligned with counsel before the portal is locked.",
      "If supplier conformance, handshake completeness or packaging quality fall for two quarters in a row, we slow discretionary spend to protect runway and keep enough engineering and agent depth to fix issues—rather than panic cuts that hollow out oversight.",
    ],
  },
] as const;
