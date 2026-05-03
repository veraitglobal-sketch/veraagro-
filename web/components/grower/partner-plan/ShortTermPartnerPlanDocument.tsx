import {
  PlanArticle,
  PlanBlockquote,
  PlanDivider,
  PlanH1,
  PlanH2,
  PlanH3,
  PlanLead,
  PlanOl,
  PlanP,
  PlanTable,
  PlanUl,
} from '@/components/grower/partner-plan/PartnerPlanPrimitives';

/** Short-term plan — embedded document copy (English). */
export default function ShortTermPartnerPlanDocument() {
  return (
    <PlanArticle>
      <PlanH1>Short-term business plan</PlanH1>
      <PlanLead>Period: 3 years · Bio Vera</PlanLead>

      <PlanH2>1. Introduction</PlanH2>
      <PlanP>
        Bio Vera is an organised, controlled system for the production, inspection, and distribution of
        agricultural products oriented toward the European market.
      </PlanP>
      <PlanP>The model connects growers, local partners, and buyers through:</PlanP>
      <PlanUl
        items={[
          <>clearly defined quality standards,</>,
          <>precise process management,</>,
          <>centralised sales.</>,
        ]}
      />
      <PlanP>
        Bio Vera&apos;s objective is not trade alone: it is to build a stable system that enables reliable
        production, consistent quality, and secure delivery over the long term.
      </PlanP>
      <PlanP>
        This business plan covers system development over{' '}
        <strong className="font-semibold text-gray-900">three years</strong>.
      </PlanP>

      <PlanDivider />

      <PlanH2>2. Strategic objective</PlanH2>
      <PlanP>
        Over three years Bio Vera aims to build a functional, sustainable system that can scale further.
      </PlanP>
      <PlanH3>Primary objectives</PlanH3>
      <PlanTable
        headers={['Priority', 'Description']}
        rows={[
          ['Network', 'Build a reliable supplier and grower network'],
          ['Standards', 'Establish clear production and inspection standards'],
          ['Sales', 'Develop stable sales channels in Europe'],
          ['Operations', 'Prove operational viability of the model'],
          ['Scaling', 'Create the foundation for further expansion'],
        ]}
      />
      <PlanH3>Focus of the period</PlanH3>
      <PlanP>
        The focus is <strong className="font-semibold text-gray-900">not rapid growth</strong>, but{' '}
        <strong className="font-semibold text-gray-900">stability</strong>,{' '}
        <strong className="font-semibold text-gray-900">control</strong>, and{' '}
        <strong className="font-semibold text-gray-900">repeatability</strong> of the system.
      </PlanP>

      <PlanDivider />

      <PlanH2>3. Geography strategy</PlanH2>
      <PlanH3>Operating hubs</PlanH3>
      <PlanP>Main operating activity is developed in:</PlanP>
      <PlanTable headers={['Country']} rows={[['Serbia'], ['Romania']]} />
      <PlanP>
        These locations provide access to production, lower operating costs, and strong logistics
        connectivity with European markets.
      </PlanP>
      <PlanH3>Sales markets</PlanH3>
      <PlanTable
        headers={['Segment', 'Description']}
        rows={[
          ['Primary', 'Germany'],
          ['Additional', 'Collaboration with buyers in other EU countries'],
        ]}
      />
      <PlanH3>BioVera Fresh flagship rollout (Serbia + EU)</PlanH3>
      <PlanP>
        Within the same <strong className="font-semibold text-gray-900">three-year period</strong>, Bio Vera plans{' '}
        <strong className="font-semibold text-gray-900">three controlled BioVera Fresh openings</strong>. The{' '}
        <strong className="font-semibold text-gray-900">first two</strong> are in{' '}
        <strong className="font-semibold text-gray-900">Serbia</strong>, in{' '}
        <strong className="font-semibold text-gray-900">Belgrade</strong>,{' '}
        <strong className="font-semibold text-gray-900">Niš</strong>, or{' '}
        <strong className="font-semibold text-gray-900">Novi Sad</strong> (exact cities and sequence follow site
        criteria and partner readiness — any two of these three). The{' '}
        <strong className="font-semibold text-gray-900">third</strong> opening is{' '}
        <strong className="font-semibold text-gray-900">Bucharest, Romania</strong>, as the anchor for the{' '}
        <strong className="font-semibold text-gray-900">European market</strong>.
      </PlanP>
      <PlanTable
        headers={['Year', 'Cumulative stores', 'Location']}
        rows={[
          ['Year 1', '1', 'Serbia: flagship in Belgrade, Niš, or Novi Sad'],
          ['Year 2', '2', 'Serbia: second store in another of Belgrade, Niš, or Novi Sad'],
          ['Year 3', '3', 'Romania: Bucharest – European market footprint'],
        ]}
      />
      <PlanP>
        Together this anchors the concept domestically and adds a clear{' '}
        <strong className="font-semibold text-gray-900">EU retail step</strong> alongside existing export-oriented sales
        channels.
      </PlanP>

      <PlanDivider />

      <PlanH2>4. Business model</PlanH2>
      <PlanP>Bio Vera manages the full value chain through clearly separated roles.</PlanP>
      <PlanH3>Bio Vera</PlanH3>
      <PlanUl
        items={[
          <>manages sales and marketing</>,
          <>receives and plans orders</>,
          <>defines production standards</>,
          <>organises training</>,
          <>controls quality</>,
          <>organises logistics</>,
        ]}
      />
      <PlanH3>Supplier</PlanH3>
      <PlanP>The supplier is a local partner who:</PlanP>
      <PlanUl
        items={[
          <>already has an established grower network</>,
          <>distributes seed, inputs, and packaging</>,
          <>develops the local network</>,
          <>transfers system standards</>,
        ]}
      />
      <PlanBlockquote>
        The supplier is the{' '}
        <strong className="font-semibold text-gray-900 not-italic">critical link</strong> between the system
        and production.
      </PlanBlockquote>
      <PlanH3>Grower</PlanH3>
      <PlanP>The grower is responsible for:</PlanP>
      <PlanUl items={[<>production</>, <>adherence to standards</>, <>packing</>, <>product quality</>]} />
      <PlanP>
        Goods that do not meet the standard{' '}
        <strong className="font-semibold text-gray-900">do not enter the system</strong>.
      </PlanP>

      <PlanDivider />

      <PlanH2>5. Production strategy</PlanH2>
      <PlanP>Bio Vera applies a focused product approach that enables stability and control.</PlanP>
      <PlanH3>Core products</PlanH3>
      <PlanP>The backbone of the system consists of:</PlanP>
      <PlanTable
        headers={['Product']}
        rows={[['Potato'], ['Pepper'], ['Tomato'], ['Onion'], ['Cabbage']]}
      />
      <PlanP>
        These products have stable demand, mature production bases, and suit standardisation and logistics.
      </PlanP>
      <PlanH3>Operational approach</PlanH3>
      <PlanUl
        items={[
          <>
            <strong className="font-semibold text-gray-900">Core products</strong> carry the system and deliver
            volume.
          </>,
          <>
            <strong className="font-semibold text-gray-900">Secondary products</strong> are introduced selectively.
          </>,
          <>
            <strong className="font-semibold text-gray-900">New products</strong> are piloted before scaling.
          </>,
        ]}
      />

      <PlanDivider />

      <PlanH2>6. Supplier model</PlanH2>
      <PlanP>
        The supplier model is <strong className="font-semibold text-gray-900">selective</strong> and{' '}
        <strong className="font-semibold text-gray-900">controlled</strong>.
      </PlanP>
      <PlanH3>Supplier profile</PlanH3>
      <PlanP>A supplier must:</PlanP>
      <PlanUl
        items={[
          <>have a developed grower network</>,
          <>have a strong reputation</>,
          <>have sector experience</>,
          <>be financially stable</>,
          <>operate in an agricultural region</>,
        ]}
      />
      <PlanH3>Year-one structure</PlanH3>
      <PlanTable
        headers={['Parameter', 'Plan']}
        rows={[
          ['Number of suppliers', '3'],
          ['Coverage', 'Each covers one region'],
          ['Growers per supplier', 'Approximately 5'],
          ['Total growers', 'Up to 15 in the system'],
        ]}
      />
      <PlanH3>Revenue model</PlanH3>
      <PlanP>The supplier earns stable revenue through:</PlanP>
      <PlanUl
        items={[
          <>seed distribution</>,
          <>input distribution</>,
          <>packaging distribution</>,
          <>grower network development</>,
        ]}
      />
      <PlanP>
        Revenue accrues across multiple phases of the cycle, supporting continuity and stability.
      </PlanP>

      <PlanDivider />

      <PlanH2>7. Grower network development</PlanH2>
      <PlanP>Grower network development is planned over three years.</PlanP>
      <PlanH3>Year 1</PlanH3>
      <PlanP>
        <strong className="font-semibold text-gray-900">Up to 15 growers</strong> · roughly five growers per supplier.
      </PlanP>
      <PlanP className="font-medium text-gray-900">Focus:</PlanP>
      <PlanUl items={[<>system testing</>, <>quality validation</>, <>learning through practice</>]} />
      <PlanH3>Year 2</PlanH3>
      <PlanP>
        <strong className="font-semibold text-gray-900">From 15 to 30 growers.</strong>
      </PlanP>
      <PlanP className="font-medium text-gray-900">Focus:</PlanP>
      <PlanUl
        items={[
          <>expansion within existing regions</>,
          <>growth around existing suppliers</>,
          <>strengthening local networks</>,
        ]}
      />
      <PlanH3>Year 3</PlanH3>
      <PlanP>
        <strong className="font-semibold text-gray-900">From 30 to 50 growers.</strong>
      </PlanP>
      <PlanP className="font-medium text-gray-900">Focus:</PlanP>
      <PlanUl items={[<>system stability</>, <>selection of top growers</>, <>efficiency gains</>]} />
      <PlanH3>Key principle</PlanH3>
      <PlanBlockquote>
        Growers develop{' '}
        <strong className="font-semibold text-gray-900 not-italic">through the supplier</strong>, not around them.
      </PlanBlockquote>

      <PlanDivider />

      <PlanH2>8. Operational process</PlanH2>
      <PlanP>The path from order to delivery follows clearly defined steps:</PlanP>
      <PlanOl
        items={[
          <>Buyer request intake</>,
          <>Production planning</>,
          <>Production organisation</>,
          <>Packing</>,
          <>Quality control</>,
          <>Transport organisation</>,
          <>Delivery</>,
          <>Records and analysis</>,
        ]}
      />
      <PlanP>All steps are standardised and controlled.</PlanP>

      <PlanDivider />

      <PlanH2>9. Quality and control model</PlanH2>
      <PlanP>Quality is built across the entire process.</PlanP>
      <PlanH3>Core principle</PlanH3>
      <PlanBlockquote>Only goods that meet the standard enter the system.</PlanBlockquote>
      <PlanH3>Standardisation</PlanH3>
      <PlanUl items={[<>controlled seed</>, <>defined inputs</>, <>clear production rules</>]} />
      <PlanH3>Inspection</PlanH3>
      <PlanP>
        Inspection occurs{' '}
        <strong className="font-semibold text-gray-900">before goods enter transport</strong>.
      </PlanP>
      <PlanH3>Rating</PlanH3>
      <PlanP>Growers and suppliers are assessed on:</PlanP>
      <PlanUl items={[<>quality</>, <>reliability</>, <>rule adherence</>]} />

      <PlanDivider />

      <PlanH2>10. Logistics</PlanH2>
      <PlanP>
        In this period Bio Vera uses{' '}
        <strong className="font-semibold text-gray-900">external logistics partners</strong>.
      </PlanP>
      <PlanP>Focus areas:</PlanP>
      <PlanUl items={[<>transport organisation</>, <>route optimisation</>, <>cost reduction</>]} />

      <PlanDivider />

      <PlanH2>11. Financial model</PlanH2>
      <PlanP>Revenue is generated through:</PlanP>
      <PlanTable
        headers={['Stream']}
        rows={[['Seed sales'], ['Input sales'], ['Packaging sales'], ['Margin on products']]}
      />
      <PlanP>This model captures revenue across multiple production phases.</PlanP>

      <PlanDivider />

      <PlanH2>12. Development phases</PlanH2>
      <PlanTable
        headers={['Year', 'Meaning']}
        rows={[
          ['Year 1', 'System validation and pilot operations'],
          ['Year 2', 'Stabilisation and network expansion'],
          ['Year 3', 'Consolidation and preparation for further scaling'],
        ]}
      />

      <PlanDivider />

      <PlanH2>13. Risks</PlanH2>
      <PlanTable
        headers={['Risk']}
        rows={[
          ['Over-expansion'],
          ['Uneven quality'],
          ['Unreliable partners'],
          ['Collection / payment issues'],
        ]}
      />

      <PlanDivider />

      <PlanH2>14. Guiding principles</PlanH2>
      <PlanUl
        items={[
          <>quality ahead of volume</>,
          <>controlled growth</>,
          <>clear relationship structure</>,
          <>long-term cooperation</>,
        ]}
      />

      <PlanDivider />

      <PlanH2>15. Conclusion</PlanH2>
      <PlanP>Over three years Bio Vera builds:</PlanP>
      <PlanUl
        items={[
          <>a stable partner network</>,
          <>a clear quality system</>,
          <>a reliable operating model</>,
          <>a foundation for further expansion</>,
        ]}
      />

      <PlanDivider />

      <PlanH2>Closing note</PlanH2>
      <PlanP>
        Bio Vera develops a system in which every process is controlled and every participant has clearly defined
        roles and responsibilities.
      </PlanP>
    </PlanArticle>
  );
}
