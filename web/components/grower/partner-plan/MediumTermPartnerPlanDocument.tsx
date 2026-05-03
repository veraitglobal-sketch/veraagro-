import {
  PlanArticle,
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

/** Medium-term plan template — English (embedded copy). */
export default function MediumTermPartnerPlanDocument() {
  return (
    <PlanArticle>
      <PlanH1>Medium-term partner plan</PlanH1>
      <PlanLead>Bio Vera · Confidential · Authorised partner circulation only</PlanLead>

      <PlanH2>1. Two-season outlook</PlanH2>
      <PlanP>
        The medium horizon connects <strong className="font-semibold text-gray-900">seasonal cycles</strong> with{' '}
        <strong className="font-semibold text-gray-900">capacity planning</strong>: parcels, varieties, logistics
        slots, and how we scale quality without diluting traceability.
      </PlanP>

      <PlanDivider />

      <PlanH2>2. Capacity &amp; product mix</PlanH2>
      <PlanH3>Capacity &amp; parcels</PlanH3>
      <PlanUl
        items={[
          <>planned hectares / parcels under programme rules</>,
          <>rotation &amp; resting periods where bio integrity requires it</>,
          <>investment needs (irrigation, cold storage, packing line upgrades)</>,
        ]}
      />
      <PlanH3>Product mix evolution</PlanH3>
      <PlanUl
        items={[
          <>SKUs aligned with Hamburg retail feedback</>,
          <>experimental lots — clearly flagged and isolated in passports</>,
        ]}
      />

      <PlanDivider />

      <PlanH2>3. Operational rhythm</PlanH2>
      <PlanTable
        headers={['Rhythm', 'Cadence', 'Notes']}
        rows={[
          ['Joint operations review', '—', 'Align forecasts vs field diary reality'],
          ['Packaging upgrades', '—', 'Materials whitelist compliance'],
          ['Training touchpoints', '—', 'Cold chain, ethics, sanctions awareness'],
        ]}
      />

      <PlanDivider />

      <PlanH2>4. Sustainability &amp; transparency</PlanH2>
      <PlanUl
        items={[
          <>measurable reductions of waste / rework where credible</>,
          <>QR passport richness — buyer-visible journey without leaking grower privacy</>,
          <>cold-chain proofs where programmes demand them</>,
        ]}
      />

      <PlanDivider />

      <PlanH2>5. Governance</PlanH2>
      <PlanP>
        Decisions beyond daily execution escalate via{' '}
        <strong className="font-semibold text-gray-900">written channels</strong> from Bio Vera operations. Verbal
        summaries help — signatures and annexes settle disputes.
      </PlanP>

      <PlanDivider />

      <PlanH2>6. Replace-with-real-copy checklist</PlanH2>
      <PlanOl
        items={[
          <>volume trajectory per SKU</>,
          <>capex assumptions</>,
          <>insurance / programme hooks where relevant</>,
          <>escalation roster with named contacts</>,
        ]}
      />
    </PlanArticle>
  );
}
