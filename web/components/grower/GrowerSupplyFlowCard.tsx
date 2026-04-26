'use client';

import Link from 'next/link';

const suppliersHref = '/grower/where-to-buy' as const;
const materialsHref = '/grower/materials' as const;

type Props = {
  /** Emphasize where the user is in the journey */
  context: 'suppliers' | 'materials';
  className?: string;
  /**
   * `collapsible` keeps the directory page scannable: short intro + expandable steps.
   * `default` shows the full guide (e.g. Materials, where people expect the long path).
   * `compact` = one <details> block only (e.g. bottom of Suppliers page).
   */
  variant?: 'default' | 'collapsible' | 'compact';
};

const steps = (context: 'suppliers' | 'materials') => (
  <ol className="space-y-3 text-sm text-gray-800 list-none">
    <li
      className={`pl-0 border-l-4 pl-4 py-2 -ml-px ${
        context === 'suppliers'
          ? 'border-[#2D5A27] ring-2 ring-[#2D5A27]/30 ring-offset-1 rounded-r-md bg-[#2D5A27]/5'
          : 'border-gray-200'
      }`}
    >
      <span className="text-xs font-semibold text-[#2D5A27]">1. Partner &amp; B2B order</span>
      <p className="text-gray-700 mt-1 font-light leading-relaxed">
        On <Link href={suppliersHref} className="text-[#2D5A27] font-medium underline">Suppliers &amp; orders</Link>,
        filter by place, open a <strong>Partner store</strong>, and place a <strong>direct order</strong>. Your supplier
        updates status (e.g. PENDING → CONFIRMED → FULFILLED) and you can use <strong>Thread</strong> for messages.
      </p>
    </li>
    <li
      className={`pl-0 border-l-4 pl-4 py-2 -ml-px ${
        context === 'suppliers' ? 'border-[#2D5A27] bg-[#2D5A27]/5' : 'border-gray-200'
      }`}
    >
      <span className="text-xs font-semibold text-[#2D5A27]">2. When goods reach the farm</span>
      <p className="text-gray-700 mt-1 font-light leading-relaxed">
        On that order, tap <strong>Received at farm</strong> when the physical shipment arrives. That records receipt
        for the B2B line (coordination/audit) — it does <em>not</em> by itself add crates or label serials to the
        catalog balances below.
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
        . If you only source stock offline, work with your partner or support so balances match reality. Large orders:
        repeat purchase or use multiple runs (e.g. max 200 units per in-app order).
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
);

/**
 * Single narrative for "Suppliers & orders" + "Materials": same story on both pages
 * (partner & B2B → receipt → in-app stock & serials → harvest & packing → pre-transport).
 */
export default function GrowerSupplyFlowCard({ context, className = '', variant = 'default' }: Props) {
  if (variant === 'compact') {
    return (
      <section
        id="supply-flow"
        className={`rounded-lg border border-gray-200 bg-white p-0 shadow-sm ${className}`.trim()}
      >
        <details className="group">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg [&::-webkit-details-marker]:hidden">
            B2B, catalog balances, and transport — <span className="text-[#2D5A27]">show the 5 steps</span>
          </summary>
          <div className="px-4 pb-4 pt-0 border-t border-gray-100 space-y-3 text-sm text-gray-600">
            <p className="pt-2 font-light">
              <span className="font-medium text-gray-800">This page</span> = find partners;{' '}
              <Link href={materialsHref} className="text-[#2D5A27] font-medium underline">
                Materials
              </Link>{' '}
              = your serials and stock; they work as one process.
            </p>
            {steps(context)}
            <p className="text-xs text-gray-500 border-t border-gray-100 pt-2">
              Partner locations show after admin approval. Need help?{' '}
              <Link href="#my-orders" className="text-[#2D5A27] underline">
                Orders &amp; messages
              </Link>
              ,{' '}
              <Link href="/grower/materials" className="text-[#2D5A27] underline">
                Materials
              </Link>
              .
            </p>
          </div>
        </details>
      </section>
    );
  }

  if (variant === 'collapsible') {
    return (
      <section
        id="supply-flow"
        className={`rounded-lg border border-[#2D5A27]/20 bg-gradient-to-b from-white to-gray-50/80 p-4 sm:p-5 shadow-sm space-y-3 ${className}`.trim()}
      >
        <h2 className="text-base font-semibold text-gray-900">Supply, materials, and transport</h2>
        <p className="text-sm text-gray-600 font-light leading-relaxed">
          <span className="font-medium text-gray-800">Suppliers &amp; orders</span> = partners and B2B lines.{' '}
          <span className="font-medium text-gray-800">Materials</span> = official balances and label roll serials for
          compliance. Same process; two screens.
        </p>
        <details className="group rounded-md border border-gray-200 bg-white/80">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-[#23471f] hover:bg-gray-50/80 rounded-t-md">
            <span className="underline decoration-[#2D5A27]/30 underline-offset-2">Show the full 5 steps</span>
            <span className="text-gray-500 font-normal"> (B2B → receipt → catalog → harvest → transport)</span>
          </summary>
          <div className="px-3 pb-3 pt-0 border-t border-gray-100 space-y-3">
            {steps(context)}
            <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-200 pt-3">
              Tip: open{' '}
              <Link href={context === 'materials' ? suppliersHref : materialsHref} className="text-[#2D5A27] font-medium">
                {context === 'materials' ? 'Suppliers & orders' : 'Materials'}
              </Link>{' '}
              in another tab if you switch between B2B and the in-app catalog the same day.
            </p>
          </div>
        </details>
      </section>
    );
  }

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

      {steps(context)}

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
