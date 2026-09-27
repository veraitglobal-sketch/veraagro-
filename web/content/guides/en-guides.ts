import type { GuideDefinition } from '@/lib/guides/types';

export const EN_GUIDES: Record<string, GuideDefinition> = {
  'digital-product-passport-fresh-produce': {
    slug: 'digital-product-passport-fresh-produce',
    cluster: 'traceability',
    audiences: ['Buyers', 'QA teams', 'Category managers'],
    title: 'EU Digital Product Passport for Fresh Produce',
    metaDescription:
      'How Bio Vera links each fresh produce batch to an EU Digital Product Passport — origin, QA, cold chain, and certificates in one QR dossier buyers can audit.',
    eyebrow: 'Traceability guide',
    lead:
      'Regulated retail expects more than a certificate PDF in an email. An EU Digital Product Passport is a structured dossier that travels with the batch — from the parcel where produce was grown through packing, refrigerated custody, and arrival at the buyer’s dock. Bio Vera generates that dossier automatically and exposes it through the QR on every crate.',
    sections: [
      {
        paragraphs: [
          'Bio Vera is not a listing site or a broker. We operate the chain: contracted grower programmes, Protocol 360 quality assurance, packing compliance, refrigerated missions, and branded sales. Because the same batch ID powers operations and the public passport, buyers do not reconcile conflicting spreadsheets — they open one record.',
        ],
      },
      {
        heading: 'What the passport contains',
        paragraphs: [
          'Each passport ties to a single batch identifier. It documents estate origin with GPS context, harvest and intake timestamps, Protocol 360 checkpoints, packaging material verification where applicable, cold-chain handovers, and EU-relevant certificates that apply to that load. The QR on the crate resolves to this dossier — suitable for retail QA, import desks, and internal audit.',
        ],
      },
      {
        heading: 'Why it matters for fresh produce',
        paragraphs: [
          'Fresh categories fail quietly when custody breaks: a gap between field claim and dock reality, a temperature excursion without a named responsible party, or a certificate that does not match the pallet in front of the receiver. A passport forces those events into one timeline so “we think it was fine” becomes “here is the signed handover and sensor band.”',
        ],
      },
      {
        heading: 'How Bio Vera differs from a static label',
        paragraphs: [
          'Static labels and one-off PDFs age the moment the truck door closes. Bio Vera updates the dossier as missions progress — loading proof, transit custody, and arrival intake when partners complete their steps in the platform. Optional anchoring can fingerprint dossier integrity for partners who want an immutable reference without exposing operational detail on-chain.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'protocol-360', label: 'Protocol 360 quality system' },
      { path: 'for-buyers', label: 'For buyers' },
      { path: 'guides/verify-batch-qr-authenticity', label: 'Verify a batch QR' },
      { path: 'faq', label: 'FAQ' },
    ],
    published: true,
  },
  'verify-batch-qr-authenticity': {
    slug: 'verify-batch-qr-authenticity',
    cluster: 'traceability',
    audiences: ['Buyers', 'Retail QA', 'Consumers (narrative)'],
    title: 'Verify a Batch QR and Batch ID',
    metaDescription:
      'How to check a Bio Vera batch QR or Batch_ID — what authentic passports show, what to do when a scan fails, and how custody evidence supports retail QA.',
    eyebrow: 'Traceability guide',
    lead:
      'Every Bio Vera crate carries a QR that resolves to a batch passport. Authentic scans show the same batch ID printed beside the code, a timeline of QA and custody events, and certificates tied to that load — not a generic marketing page.',
    sections: [
      {
        paragraphs: [
          'Start with the Batch_ID on the label. It must match the identifier in the URL after you scan. If the QR opens a passport for a different batch, treat the pallet as unverified and contact your Bio Vera counterpart before acceptance.',
        ],
      },
      {
        heading: 'What a legitimate passport shows',
        paragraphs: [
          'You should see grower programme context, Protocol 360 status for the batch, packing and logistics milestones where the corridor has progressed, and certificate references appropriate to the product class. Cold-chain segments should name handover parties — not anonymous “in transit” placeholders when the load is claimed delivered.',
        ],
      },
      {
        heading: 'When verification fails',
        paragraphs: [
          'Failed scans, missing batches, or passports without custody events are integrity signals. Bio Vera’s operating model assumes receivers document condition and temperature at intake; those records feed the same dossier buyers audit later. Do not substitute a screenshot from a different batch.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'guides/digital-product-passport-fresh-produce', label: 'Digital Product Passport guide' },
      { path: 'protocol-360', label: 'Protocol 360' },
      { path: 'for-buyers', label: 'For buyers' },
    ],
    published: true,
  },
  'globalgap-group-certification': {
    slug: 'globalgap-group-certification',
    cluster: 'grower',
    audiences: ['Growers throughout Europe', 'Farm managers'],
    title: 'GlobalG.A.P. Group Certification in the Vera Grower Programme',
    metaDescription:
      'How Bio Vera facilitates GlobalG.A.P. IFA v6 group certification for contracted growers — audit structure, programme alignment, and why group scope fits export-ready production.',
    eyebrow: 'Grower guide',
    lead:
      'Export-ready produce needs recognised assurance. Individual certification can be costly and slow for farms joining a structured buyer programme. Bio Vera coordinates GlobalG.A.P. IFA v6 group certification as part of the Vera grower programme so growers focus on compliant production while audit rhythm matches the operating season.',
    sections: [
      {
        paragraphs: [
          'The programme is open to international growers willing to work to Bio Vera standards — from family farms to commercial estates. Current certification status is not a barrier to starting a conversation; alignment and audit planning are part of onboarding.',
        ],
      },
      {
        heading: 'What group certification means in practice',
        paragraphs: [
          'Group certification covers members operating under a defined quality system with shared audit oversight. Bio Vera’s field app, Integrity Guard checks, and Protocol 360 evidence feed the same records auditors and buyers expect — reducing duplicate paperwork between “farm diary” and “export dossier.”',
        ],
      },
      {
        heading: 'Programme vs marketplace',
        paragraphs: [
          'Bio Vera contracts production, defines inputs through sanctioned supplier channels, runs QA, and sells under the Bio Vera brand. Certification is embedded in that spine — not sold as a standalone badge without custody and settlement discipline behind it.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'for-growers', label: 'Grower programme' },
      { path: 'guides/secured-settlement', label: 'Secured settlement' },
      { path: 'protocol-360', label: 'Protocol 360' },
    ],
    published: true,
  },
  'secured-settlement': {
    slug: 'secured-settlement',
    cluster: 'grower',
    audiences: ['Growers', 'Carriers', 'Programme finance'],
    title: 'Secured Settlement After Conformity',
    metaDescription:
      'How Bio Vera ties grower and logistics settlement to documented conformity — packing compliance, custody handovers, and batch dossier completeness before release.',
    eyebrow: 'Grower guide',
    lead:
      'Fair payout requires fair evidence. Bio Vera releases grower and carrier settlement when conformity is documented in the batch dossier — not when someone verbally confirms a load “looked fine.” That discipline protects growers who invest in compliant production and buyers who stake their shelf on the same batch ID.',
    sections: [
      {
        paragraphs: [
          'Settlement narration follows the vertical chain: programme terms agreed upfront, field and packing evidence captured in Protocol 360, logistics custody signed at handovers, and release rules applied consistently. Carriers and growers see the same milestones — fewer disputes about who blocked payment.',
        ],
      },
      {
        heading: 'What “conformity” means operationally',
        paragraphs: [
          'Conformity is batch-specific: approved inputs where the programme requires them, packaging verification when material standards apply, GPS-valid field entries where Integrity Guard is active, and intake records at the buyer or hub when the corridor demands them. Missing evidence pauses release until the gap is resolved or the batch is formally rejected with audit trail.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'for-growers', label: 'Grower programme' },
      { path: 'for-logistics', label: 'For logistics partners' },
      { path: 'protocol-360', label: 'Protocol 360' },
    ],
    published: true,
  },
  'cold-chain-custody-retail-qa': {
    slug: 'cold-chain-custody-retail-qa',
    cluster: 'logistics',
    audiences: ['Logistics partners', 'Buyers', 'Retail QA'],
    title: 'Cold-Chain Custody Documents Retail QA Accepts',
    metaDescription:
      'Custody evidence Bio Vera captures across refrigerated missions — named handovers, temperature context, and dossier records buyers use at dock acceptance.',
    eyebrow: 'Logistics guide',
    lead:
      'Retail QA teams reject ambiguous custody. Bio Vera missions require explicit pickup and delivery proof — who held the load, when handover occurred, and temperature context within programme bands — so the passport shows a chain of responsibility, not a black box between farm and DC.',
    sections: [
      {
        paragraphs: [
          'Logistics partners work inside the same batch dossier as growers and suppliers. Driver identity, vehicle context, and handover signatures (where the programme requires them) attach to the batch ID buyers already scan on the crate.',
        ],
      },
      {
        heading: 'Dock acceptance alignment',
        paragraphs: [
          'When receivers document condition and temperature at intake inside the platform, those events appear on the passport timeline. Buyers gain a single narrative for audits instead of reconciling carrier PDFs, grower claims, and certificate bundles manually.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'for-logistics', label: 'For logistics partners' },
      { path: 'for-buyers', label: 'For buyers' },
      { path: 'protocol-360', label: 'Protocol 360' },
    ],
    published: true,
  },
  'bio-vera-vs-farm-apps-vs-certificate-marketplaces': {
    slug: 'bio-vera-vs-farm-apps-vs-certificate-marketplaces',
    cluster: 'buyer',
    audiences: ['Buyers', 'Growers evaluating programmes', 'Category leads'],
    title: 'Bio Vera vs Farm Apps vs Certificate Marketplaces',
    metaDescription:
      'Category clarity: Bio Vera as vertically integrated agrifood with batch passports — not a farm diary app, not a certificate marketplace, not an anonymous produce listing site.',
    eyebrow: 'Category guide',
    lead:
      'Three different problems get conflated in fresh produce tech: field record-keeping, trading certificates, and operating an export-ready corridor with settlement and custody. Bio Vera is the third — a vertically integrated operator that uses field apps and certificates as evidence inside one batch dossier, not as the product itself.',
    sections: [
      {
        heading: 'Farm and field apps',
        paragraphs: [
          'Field apps excel at capture — sprays, harvest notes, photos. Alone they rarely prove custody to a retail QA desk unless their exports merge with logistics intake, certificate issuance, and a stable batch ID through packing. Bio Vera embeds capture in a programme where those records feed Protocol 360 and the passport automatically.',
        ],
      },
      {
        heading: 'Certificate marketplaces',
        paragraphs: [
          'Marketplaces sell documents. Bio Vera sells and moves produce under brand and programme terms — certificates are outputs tied to verified batches, not SKUs traded independently of the load they claim to represent.',
        ],
      },
      {
        heading: 'What Bio Vera is',
        paragraphs: [
          'Contracted growers, sanctioned inputs, QA, refrigerated logistics, branded sales, EU Digital Product Passports. One operator, one batch spine — open to international producers who align with the programme.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'for-buyers', label: 'For buyers' },
      { path: 'for-growers', label: 'Grower programme' },
      { path: 'guides/digital-product-passport-fresh-produce', label: 'Digital Product Passport' },
    ],
    published: true,
  },
  'farm-to-fork-fresh-produce-traceability': {
    slug: 'farm-to-fork-fresh-produce-traceability',
    cluster: 'export',
    audiences: ['Buyers', 'Growers', 'Partners'],
    title: 'Farm-to-Fork Traceability for Fresh Produce',
    metaDescription:
      'Farm-to-fork and parcel-to-shelf traceability — how Bio Vera documents each step for international growers serving regulated retail markets.',
    eyebrow: 'Traceability guide',
    lead:
      'Farm-to-fork is not a slogan when custody breaks between field, packhouse, truck, and shelf. Bio Vera documents parcel origin, packing conformity, refrigerated transfer, and arrival intake on one batch timeline — the same narrative growers defend and buyers audit.',
    sections: [
      {
        paragraphs: [
          'International growers join a programme with defined standards and export-oriented documentation. Regulated retail markets receive dossiers that match the physical pallet — phytosanitary and passport framing where applicable, always tied to the batch ID on the crate.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'guides/export-ready-fresh-produce-documentation', label: 'Export-ready documentation' },
      { path: 'for-growers', label: 'Grower programme' },
      { path: 'protocol-360', label: 'Protocol 360' },
    ],
    published: true,
  },
  'export-ready-fresh-produce-documentation': {
    slug: 'export-ready-fresh-produce-documentation',
    cluster: 'export',
    audiences: ['Growers', 'Export desks', 'Buyers'],
    title: 'Export-Ready Fresh Produce Documentation',
    metaDescription:
      'Export dossiers for fresh produce — programme alignment, EU compliance documentation, and batch passports before dispatch to regulated retail markets.',
    eyebrow: 'Export guide',
    lead:
      'Export-ready means the dossier is complete before the truck leaves — not assembled under pressure at the border. Bio Vera automates certificate and passport assembly per batch so growers and buyers share one audit-ready package linked to the QR on each crate.',
    sections: [
      {
        paragraphs: [
          'Documentation spans GlobalG.A.P. facilitation where the programme includes it, phytosanitary context appropriate to the corridor, and the EU Digital Product Passport record buyers increasingly expect. Fact-specific requirements vary by product class and destination; the platform keeps evidence attached to the batch rather than scattered in inboxes.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'guides/farm-to-fork-fresh-produce-traceability', label: 'Farm-to-fork traceability' },
      { path: 'for-growers', label: 'Grower programme' },
      { path: 'contact', label: 'Contact' },
    ],
    published: true,
  },
};

export const EN_GUIDE_SLUGS = Object.keys(EN_GUIDES);
