'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ListOrdered } from 'lucide-react';

/**
 * End-to-end grower path (web): same order as `growerNavItems` after Profile is last.
 */
const STEPS: { title: string; body: ReactNode }[] = [
  {
    title: 'Dashboard',
    body: (
      <>
        <p>
          Start here for alerts (messages, active batches, transport), farm name, and the next recommended action. Use it every
          few days, not only once.
        </p>
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
    body: (
      <p>
        Keep this “manual” in mind: the sidebar below is ordered 1 → down to match the season — <strong>Dashboard</strong>{' '}
        first, then <strong>Steps</strong>, then field setup, supply, lots, quality, then transport and tracking.
      </p>
    ),
  },
  {
    title: 'My fields — estates & parcels (blocks)',
    body: (
      <>
        <p>
          Create your <strong>field (estate)</strong> and <strong>parcels</strong> (crop blocks). Draw or adjust the area so the
          system can compute <strong>surface in m²</strong>. Set crop / variety where the form allows.{' '}
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
        Wait until parcels show as approved. Until then, some actions will stay locked — that is normal. If it takes long, use
        Contact / messages to operations.
      </p>
    ),
  },
  {
    title: 'Supply — materials & suppliers',
    body: (
      <>
        <p>
          <strong>Materials</strong> = in-app catalog: crates, label rolls, film, balances and <strong>serial numbers</strong>{' '}
          (e.g. label rolls) for compliance. <strong>Suppliers &amp; orders</strong> = directory, B2B order to a partner, messages,
          and <strong>Received at farm</strong> when goods arrive. Both work together; see the flow box on each page.
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
          On <strong>mobile</strong> you can log the diary (what you did, when, where), growth journal, and compliant
          sprays/treatments with GPS. On web, the season lives under{' '}
          <Link href="/grower/fields" className="text-[#2D5A27] font-medium hover:underline">
            My fields
          </Link>{' '}
          and you use the app for day-to-day entries.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          If you are web-only for a day, at least keep parcels and harvest data current; add detailed diary on the phone when you
          are in the row.
        </p>
      </>
    ),
  },
  {
    title: 'Harvest & forming a lot (batch)',
    body: (
      <>
        <p>
          When the crop is ready, <strong>report harvest</strong> and form a <strong>batch / lot</strong> for that parcel. That
          ties quantity and timing to the block you mapped earlier.
        </p>
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
    body: (
      <p>
        Complete packing / trace steps for the lot in <strong>My batches</strong> (status moves toward ready for handover) — use
        the mobile packing flow when required.
      </p>
    ),
  },
  {
    title: 'Quality & compliance photos',
    body: (
      <>
        <p>
          Enter <strong>quality</strong> for the lot where required, and upload the <strong>compliance photos</strong> (e.g. label
          roll ID, crates) so the lot can be cleared for the next step.
        </p>
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
        <p>
          When the lot is ready and rules are satisfied, request pickup / transport. You need a valid address and GPS, and the
          batch should be in the right state.
        </p>
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
        Partner code, production country, notifications —{' '}
        <Link href="/grower/profile" className="text-[#2D5A27] font-medium hover:underline">
          My profile
        </Link>
        .
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
      <div className="mb-5 grid gap-4 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">My fields</p>
          <p className="mt-1 text-sm text-gray-600">
            <Link href="/grower/fields" className="text-[#2D5A27] font-medium hover:underline">
              Open My fields
            </Link>{' '}
            when you are ready to map blocks and crops.
          </p>
        </div>
        <div className="lg:col-span-7 flex items-start gap-2 rounded-xl border border-[#2D5A27]/20 bg-[#2D5A27]/5 px-4 py-3 text-sm text-gray-800">
          <ListOrdered className="h-5 w-5 shrink-0 text-[#2D5A27] mt-0.5" aria-hidden />
          <p>
            <span className="font-semibold text-gray-900">Read from 1 to the end of harvest.</span> The green sidebar uses the
            same order: <strong>Dashboard</strong> → <strong>Steps</strong> → <strong>My fields</strong> through{' '}
            <strong>Mission tracker</strong>, then <strong>Profile</strong>.
          </p>
        </div>
      </div>

      <nav
        className="mb-5 flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50/90 p-2"
        aria-label="Jump to step"
      >
        {STEPS.map((_, i) => (
          <a
            key={i}
            href={`#step-${i + 1}`}
            className="inline-flex min-h-[2rem] items-center justify-center rounded-md border border-transparent px-2.5 py-1 text-xs font-medium text-[#23471f] transition hover:border-[#2D5A27]/30 hover:bg-white"
          >
            Step {i + 1}
          </a>
        ))}
      </nav>

      <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
        {STEPS.map((s, i) => (
          <li
            key={i}
            id={`step-${i + 1}`}
            className="scroll-mt-28 flex min-h-full flex-col rounded-xl border border-gray-200 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-sm transition hover:border-[#2D5A27]/25 hover:shadow-md"
          >
            <div className="mb-3 flex items-start gap-3 border-b border-gray-100 pb-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2D5A27] text-sm font-bold text-white shadow-sm"
                aria-hidden
              >
                {i + 1}
              </span>
              <h3 className="pt-0.5 text-sm font-semibold leading-snug text-gray-900 sm:text-base">
                <span className="sr-only">Step {i + 1}. </span>
                {s.title}
              </h3>
            </div>
            <div className="flex-1 text-sm text-gray-700 font-light leading-relaxed [&_p]:m-0 [&_p+p]:mt-2">{s.body}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
