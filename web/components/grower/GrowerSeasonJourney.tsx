'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ListOrdered } from 'lucide-react';

/**
 * End-to-end grower path (web): same order as `growerNavItems` after Profile is last.
 * Copy is long on purpose so Steps can be the single “manual”.
 */
const STEPS: { title: string; body: ReactNode }[] = [
  {
    title: 'Dashboard',
    body: (
      <>
        <p>Start here for alerts (messages, active batches, transport), farm name, and the next recommended action. Use it every few days, not only once.</p>
        <p className="mt-2">
          <Link href="/grower" className="text-[#2D5A27] font-medium hover:underline">
            Open Dashboard
          </Link>
        </p>
      </>
    ),
  },
  {
    title: 'Steps (this page)',
    body: <p>Keep this “manual” in mind: the sidebar below is ordered 1 → down to match the season — Dashboard first, then Steps, then field setup, supply, lots, quality, then transport and tracking.</p>,
  },
  {
    title: 'My fields — estates & parcels (blocks)',
    body: (
      <>
        <p>
          Create your <strong>field (estate)</strong> and <strong>parcels</strong> (crop blocks). Draw or adjust the area so the system can compute <strong>surface in m²</strong>. Set crop / variety where the form allows.{' '}
          <strong>Admin must approve</strong> a parcel before batches, diaries, and sprays are fully unlocked on that block.
        </p>
        <p className="mt-2">
          <Link href="/grower/fields" className="text-[#2D5A27] font-medium hover:underline">
            My fields
          </Link>
        </p>
      </>
    ),
  },
  {
    title: 'Approval',
    body: (
      <p>
        Wait until parcels show as approved. Until then, some actions will stay locked — that is normal. If it takes long, use Contact / messages to operations.
      </p>
    ),
  },
  {
    title: 'Supply — materials & suppliers',
    body: (
      <>
        <p>
          <strong>Materials</strong> = in-app catalog: crates, label rolls, film, balances and <strong>serial numbers</strong> (e.g. label rolls) for compliance. <strong>Suppliers &amp; orders</strong> = directory, B2B order to a partner, messages, and <strong>Received at farm</strong> when goods arrive. Both work together; see the flow box on each page.
        </p>
        <p className="mt-2 flex flex-wrap gap-3">
          <Link href="/grower/materials" className="text-[#2D5A27] font-medium hover:underline">
            Materials
          </Link>
          <Link href="/grower/where-to-buy" className="text-[#2D5A27] font-medium hover:underline">
            Suppliers &amp; orders
          </Link>
        </p>
      </>
    ),
  },
  {
    title: 'Field work — journal, growth, treatments',
    body: (
      <>
        <p>
          On <strong>mobile</strong> you can log the diary (what you did, when, where), growth journal, and compliant sprays/treatments with GPS. On web, the season lives under <Link href="/grower/fields" className="text-[#2D5A27] font-medium hover:underline">My fields</Link> and you use the app for day-to-day entries.
        </p>
        <p className="mt-1 text-sm text-gray-500">If you are web-only for a day, at least keep parcels and harvest data current; add detailed diary on the phone when you are in the row.</p>
      </>
    ),
  },
  {
    title: 'Harvest & forming a lot (batch)',
    body: (
      <>
        <p>When the crop is ready, <strong>report harvest</strong> and form a <strong>batch / lot</strong> for that parcel. That ties quantity and timing to the block you mapped earlier.</p>
        <p className="mt-2 flex flex-wrap gap-3">
          <Link href="/grower/fields" className="text-[#2D5A27] font-medium hover:underline">
            My fields (start batch)
          </Link>
          <Link href="/grower/batches" className="text-[#2D5A27] font-medium hover:underline">
            My batches
          </Link>
        </p>
      </>
    ),
  },
  {
    title: 'Packing & lot status',
    body: <p>Complete packing / trace steps for the lot in <strong>My batches</strong> (status moves toward ready for handover) — use the mobile packing flow when required.</p>,
  },
  {
    title: 'Quality & compliance photos',
    body: (
      <>
        <p>Enter <strong>quality</strong> for the lot where required, and upload the <strong>compliance photos</strong> (e.g. label roll ID, crates) so the lot can be cleared for the next step.</p>
        <p className="mt-2 flex flex-wrap gap-3">
          <Link href="/grower/quality-entry" className="text-[#2D5A27] font-medium hover:underline">
            Quality entry
          </Link>
          <Link href="/grower/compliance-photos" className="text-[#2D5A27] font-medium hover:underline">
            Compliance photos
          </Link>
        </p>
      </>
    ),
  },
  {
    title: 'Request transport',
    body: (
      <>
        <p>When the lot is ready and rules are satisfied, request pickup / transport. You need a valid address and GPS, and the batch should be in the right state.</p>
        <p className="mt-2">
          <Link href="/grower/missions/create" className="text-[#2D5A27] font-medium hover:underline">
            Request transport
          </Link>
        </p>
      </>
    ),
  },
  {
    title: 'Mission tracker & handover',
    body: (
      <>
        <p>Follow the mission: pickup, hub, delivery states. Use the tracker until the handover is done.</p>
        <p className="mt-2">
          <Link href="/grower/portal" className="text-[#2D5A27] font-medium hover:underline">
            Mission tracker
          </Link>
        </p>
      </>
    ),
  },
  {
    title: 'Profile & account',
    body: (
      <p>
        Partner code, production country, notifications — <Link href="/grower/profile" className="text-[#2D5A27] font-medium hover:underline">My profile</Link>.
      </p>
    ),
  },
];

type Props = {
  className?: string;
};

export default function GrowerSeasonJourney({ className = '' }: Props) {
  return (
    <div className={className}>
      <div className="mb-5 flex items-start gap-2 rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 px-4 py-3 text-sm text-gray-800">
        <ListOrdered className="h-5 w-5 shrink-0 text-[#2D5A27] mt-0.5" />
        <p>
          <span className="font-semibold text-gray-900">Read from 1 to the end of harvest.</span> The green sidebar uses the
          same order: <strong>Dashboard</strong> → <strong>Steps</strong> → <strong>My fields</strong> through{' '}
          <strong>Mission tracker</strong>, then <strong>Profile</strong>.
        </p>
      </div>
      <ol className="space-y-6 list-none">
        {STEPS.map((s, i) => (
          <li
            key={i}
            id={`step-${i + 1}`}
            className="border-l-4 border-[#2D5A27]/30 pl-4 sm:pl-5 scroll-mt-24"
          >
            <h3 className="text-base font-semibold text-gray-900">
              <span className="text-[#2D5A27]">Step {i + 1}.</span> {s.title}
            </h3>
            <div className="mt-2 text-sm text-gray-700 font-light leading-relaxed space-y-2 [&_p]:mt-0">{s.body}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
