import {
  PlanArticle,
  PlanDivider,
  PlanH1,
  PlanH2,
  PlanH3,
  PlanLead,
  PlanOl,
  PlanP,
  PlanUl,
} from '@/components/grower/partner-plan/PartnerPlanPrimitives';

/** Long-term plan template — English (embedded copy). */
export default function LongTermPartnerPlanDocument() {
  return (
    <PlanArticle>
      <PlanH1>Long-term partner plan</PlanH1>
      <PlanLead>Bio Vera · Confidential · Authorised partner circulation only</PlanLead>

      <PlanH2>1. Strategic pillars</PlanH2>
      <PlanH3>Premium positioning</PlanH3>
      <PlanP>
        Bio Vera grows when buyers trust <strong className="font-semibold text-gray-900">repeatable quality</strong>,
        not hero lots. Long-term investment in:
      </PlanP>
      <PlanUl items={[<>field diary discipline</>, <>traceable materials</>, <>predictable pallet handover</>]} />
      <PlanH3>Regional depth</PlanH3>
      <PlanP>
        Deepening partner density <strong className="font-semibold text-gray-900">without</strong> crowding compliance
        staff or diluting programme rules.
      </PlanP>
      <PlanH3>Technology leverage</PlanH3>
      <PlanP>
        Mobile + web flows that reduce admin load for growers (60+ friendly), not paperwork for its own sake.
      </PlanP>

      <PlanDivider />

      <PlanH2>2. Five-year storyline (template)</PlanH2>
      <PlanP>Use this spine — swap in your facts.</PlanP>
      <PlanOl
        items={[
          <>
            <strong className="font-semibold text-gray-900">Years 1–2</strong> — Harden foundations: passports,
            cold-chain proofs, retailer pilots that survive audits.
          </>,
          <>
            <strong className="font-semibold text-gray-900">Years 3–4</strong> — Expand assortment where logistics
            capacity matches; selective SKU sunset where margins compress.
          </>,
          <>
            <strong className="font-semibold text-gray-900">Year 5+</strong> — Brand equity visible at shelf; growers
            recognised by region rather than anonymised commodity stats.
          </>,
        ]}
      />

      <PlanDivider />

      <PlanH2>3. Partner economics (orientation only)</PlanH2>
      <PlanP>
        Discuss margin pools, Vera bonus mechanics, seed / insurance hooks, and transport splits with your{' '}
        <strong className="font-semibold text-gray-900">contractual PDFs</strong>. This overview does not replace
        financial or legal advice.
      </PlanP>

      <PlanDivider />

      <PlanH2>4. What does not belong here</PlanH2>
      <PlanUl
        items={[
          <>personal data unrelated to programme execution</>,
          <>speculative commitments neither signed nor approved</>,
          <>anything that contradicts superseding legal notices</>,
        ]}
      />

      <PlanDivider />

      <PlanH2>5. Closing reminder</PlanH2>
      <PlanP>
        Clear layouts support alignment —{' '}
        <strong className="font-semibold text-gray-900">binding truth stays in contracts &amp; formal notices.</strong>{' '}
        Refresh this document quarterly with operations sign-off.
      </PlanP>
    </PlanArticle>
  );
}
