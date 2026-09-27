import type { ProduceDefinition } from '@/lib/guides/types';

/** Top SKUs — crop-specific programme pages (EN). */
export const EN_PRODUCE: Record<string, ProduceDefinition> = {
  raspberry: {
    slug: 'raspberry',
    cropName: 'Raspberry',
    metaDescription:
      'Bio Vera raspberry programme — contracted production, Protocol 360 QA, cold-chain custody, and EU Digital Product Passport for export-oriented growers throughout Europe.',
    lead:
      'Raspberry is unforgiving on custody: short shelf life, visible quality drift, and retail QA that asks for origin and temperature proof on the same batch. Bio Vera runs raspberries inside the Vera grower programme with parcel-level capture, packing conformity, and passport-backed sales to regulated markets.',
    sections: [
      {
        paragraphs: [
          'Growers join with defined programme terms — inputs through sanctioned supplier channels where required, field evidence via Integrity Guard, and Protocol 360 checkpoints through harvest and pack. Logistics partners complete custody steps on the same batch ID buyers scan at the dock.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'for-growers', label: 'Grower programme' },
      { path: 'guides/digital-product-passport-fresh-produce', label: 'Digital Product Passport' },
      { path: 'protocol-360', label: 'Protocol 360' },
    ],
    published: true,
  },
  strawberry: {
    slug: 'strawberry',
    cropName: 'Strawberry',
    metaDescription:
      'Bio Vera strawberry programme — field-to-pack traceability, Protocol 360 QA, and digital product passports for export-oriented growers throughout Europe.',
    lead:
      'Strawberries demand tight custody windows and visible QA at pack. Bio Vera programmes tie each strawberry batch to one dossier — estate records, packing conformity, refrigerated handovers, and buyer-facing passports suitable for regulated retail.',
    sections: [
      {
        paragraphs: [
          'Growers join with programme terms, sanctioned inputs where required, and Integrity Guard capture at field level. Logistics partners complete custody on the same batch ID from pack-out through delivery.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'for-growers', label: 'Grower programme' },
      { path: 'guides/cold-chain-custody-retail-qa', label: 'Cold-chain custody' },
      { path: 'protocol-360', label: 'Protocol 360' },
    ],
    published: true,
  },
  blueberry: {
    slug: 'blueberry',
    cropName: 'Blueberry',
    metaDescription:
      'Bio Vera blueberry programme — contracted production, batch passports, and cold-chain evidence for international growers.',
    lead:
      'Blueberry programmes fail retail QA when origin claims and temperature records diverge. Bio Vera links each blueberry batch to parcel-level evidence, packing verification, and custody logs buyers can audit on one QR dossier.',
    sections: [
      {
        paragraphs: [
          'The Vera grower programme is open to producers throughout Europe who align with Bio Vera standards. Settlement follows documented conformity; passports and QA checkpoints are part of the operating model.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'for-growers', label: 'Grower programme' },
      { path: 'guides/digital-product-passport-fresh-produce', label: 'Digital Product Passport' },
      { path: 'for-buyers', label: 'For buyers' },
    ],
    published: true,
  },
  blackberry: {
    slug: 'blackberry',
    cropName: 'Blackberry',
    metaDescription:
      'Bio Vera blackberry programme — traceable production, Protocol 360, and EU-aligned batch documentation for export corridors.',
    lead:
      'Blackberries move through short freshness windows where a single custody gap voids shelf confidence. Bio Vera runs blackberry batches inside the same vertical programme — field capture, pack QA, refrigerated missions, and passport-backed sales.',
    sections: [
      {
        paragraphs: [
          'Producers apply through the grower programme with estate, certification, and capacity details. Each batch carries a Batch_ID and QR-linked dossier from parcel to shelf.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'for-growers', label: 'Grower programme' },
      { path: 'guides/farm-to-fork-fresh-produce-traceability', label: 'Farm-to-fork traceability' },
      { path: 'protocol-360', label: 'Protocol 360' },
    ],
    published: true,
  },
  apple: {
    slug: 'apple',
    cropName: 'Apple',
    metaDescription:
      'Bio Vera apple programme — GlobalG.A.P.-aligned production, batch passports, and refrigerated export corridors for international growers.',
    lead:
      'Apple programmes scale on consistency: calibration, storage handovers, and certificate bundles that match the carton. Bio Vera ties each apple batch to a single dossier — from estate records through packing to refrigerated missions — so buyers audit one ID, not a folder of mismatched PDFs.',
    sections: [
      {
        paragraphs: [
          'The Vera grower programme is open to international producers who align with Bio Vera standards. Group certification facilitation, settlement after documented conformity, and buyer-facing passports are part of the operating model — not optional add-ons.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'for-growers', label: 'Grower programme' },
      { path: 'guides/globalgap-group-certification', label: 'GlobalG.A.P. group certification' },
      { path: 'for-buyers', label: 'For buyers' },
    ],
    published: true,
  },
  pepper: {
    slug: 'pepper',
    cropName: 'Pepper',
    metaDescription:
      'Bio Vera pepper programme — traceable greenhouse and field production with EU Digital Product Passport and export-ready documentation.',
    lead:
      'Pepper loads fail audits when origin and treatment records do not match the pallet. Bio Vera programmes capture field and packing evidence on one batch timeline, with passports and custody records suited to retail QA in regulated markets.',
    sections: [
      {
        paragraphs: [
          'producers throughout Europe can apply to the grower programme when willing to work to Bio Vera production standards. Sanctioned inputs, packaging verification, and logistics handovers feed the same batch dossier from parcel to shelf.',
        ],
      },
    ],
    relatedLinks: [
      { path: 'for-growers', label: 'Grower programme' },
      { path: 'guides/export-ready-fresh-produce-documentation', label: 'Export documentation' },
      { path: 'protocol-360', label: 'Protocol 360' },
    ],
    published: true,
  },
};

export const EN_PRODUCE_SLUGS = Object.keys(EN_PRODUCE);
