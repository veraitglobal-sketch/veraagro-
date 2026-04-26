'use client';

import Link from 'next/link';

const suppliersHref = '/grower/where-to-buy' as const;
const materialsHref = '/grower/materials' as const;

type Props = {
  /** Emphasize where the user is in the journey */
  context: 'suppliers' | 'materials';
  className?: string;
};

/**
 * Single narrative for "Suppliers & orders" + "Materials": same story on both pages
 * (partner & B2B → receipt → in-app stock & serials → harvest & packing → pre-transport).
 */
export default function GrowerSupplyFlowCard({ context, className = '' }: Props) {
  return (
    <section
      id="supply-flow"
      className={`rounded-lg border border-[#2D5A27]/20 bg-gradient-to-b from-white to-gray-50/80 p-5 sm:p-6 shadow-sm space-y-4 ${className}`.trim()}
    >
      <div>
        <h2 className="text-base font-semibold text-gray-900">Supply, materials, and transport — one path</h2>
        <p className="text-sm text-gray-600 mt-1 font-light">
          <span className="font-medium text-gray-800">Suppliers &amp; orders</span> and{' '}
          <span className="font-medium text-gray-800">Materials</span> are two sides of the same process: the first
          finds your partner and tracks B2B lines; the second holds your official <strong>balances</strong> and{' '}
          <strong>label roll serials</strong> the app uses for compliance and transport rules.
        </p>
      </div>

      <ol className="space-y-3 text-sm text-gray-800 list-none">
        <li
          className={`pl-0 border-l-4 pl-4 py-2 -ml-px ${
            context === 'suppliers' ? 'border-[#2D5A27] ring-2 ring-[#2D5A27]/30 ring-offset-1 rounded-r-md bg-[#2D5A27]/5' : 'border-gray-200'
          }`}
        >
          <span className="text-xs font-semibold text-[#2D5A27]">1. Partner &amp; B2B order</span>
          <p className="text-gray-700 mt-1 font-light leading-relaxed">
            On <Link href={suppliersHref} className="text-[#2D5A27] font-medium underline">Suppliers &amp; orders</Link>,
            filter by place, open a <strong>Partner store</strong>, and place a <strong>direct order</strong>. Your
            supplier updates status (e.g. PENDING → CONFIRMED → FULFILLED) and you can use <strong>Thread</strong> for
            messages.
          </p>
        </li>
        <li
          className={`pl-0 border-l-4 pl-4 py-2 -ml-px ${
            context === 'suppliers' ? 'border-[#2D5A27] bg-[#2D5A27]/5' : 'border-gray-200'
          }`}
        >
          <span className="text-xs font-semibold text-[#2D5A27]">2. When goods reach the farm</span>
          <p className="text-gray-700 mt-1 font-light leading-relaxed">
            On that order, tap <strong>Received at farm</strong> when the physical shipment arrives. That records
            receipt for the B2B line (coordination/audit) — it does <em>not</em> by itself add crates or label serials
            to the catalog balances below.
          </p>
        </li>
        <li
          className={`pl-0 border-l-4 pl-4 py-2 -ml-px ${
            context === 'materials'
              ? 'border-[#2D5A27] ring-2 ring-[#2D5A27]/30 ring-offset-1 rounded-r-md bg-[#2D5A27]/5'
              : 'border-gray-200'
          }`}
        >
          <span className="text-xs font-semibold text-[#2D5A27]">3. Official stock &amp; barcodes in the app</span>
          <p className="text-gray-700 mt-1 font-light leading-relaxed">
            On <Link href={materialsHref} className="text-[#2D5A27] font-medium underline">Materials</Link>, use{' '}
            <strong>Purchase</strong> so the platform updates <strong>Crates</strong>, <strong>Label rolls</strong>, and{' '}
            <strong>Film</strong>, and (for each label roll) stores a <strong>serial</strong> you will quote on{' '}
            <Link href="/grower/compliance-photos" className="text-[#2D5A27] font-medium underline">
              Compliance photos
            </Link>
            . If you only source stock offline, work with your partner or support so balances match reality. Large
            orders: repeat purchase or use multiple runs (e.g. max 200 units per in-app order).
          </p>
        </li>
        <li className="pl-0 border-l-4 border-gray-200 pl-4 py-2 -ml-px">
          <span className="text-xs font-semibold text-gray-800">4. Harvest, batch, and packing</span>
          <p className="text-gray-700 mt-1 font-light leading-relaxed">
            Announce work and form lots in{' '}
            <Link href="/grower/batches" className="text-[#2D5A27] font-medium underline">My Batches</Link> and field
            tools; follow packing and traceability in the app.
          </p>
        </li>
        <li className="pl-0 border-l-4 border-gray-200 pl-4 py-2 -ml-px">
          <span className="text-xs font-semibold text-gray-800">5. Before transport</span>
          <p className="text-gray-700 mt-1 font-light leading-relaxed">
            You need enough official material for the shipment, compliance photos, and quality entry. Then use{' '}
            <Link href="/grower/missions/create" className="text-[#2D5A27] font-medium underline">Request transport</Link>
            — the app checks that packaging / materials rules are met for the lot.
          </p>
        </li>
      </ol>

      <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-200 pt-3">
        Tip: open{' '}
        <Link href={context === 'materials' ? suppliersHref : materialsHref} className="text-[#2D5A27] font-medium">
          {context === 'materials' ? 'Suppliers & orders' : 'Materials'}
        </Link>{' '}
        in another tab if you are switching between B2B orders and the in-app catalog the same day.
      </p>
    </section>
  );
}
