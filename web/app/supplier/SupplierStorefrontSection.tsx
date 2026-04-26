'use client';

import Link from 'next/link';
import { MessageCircle, Package, MapPin, Sparkles, ShoppingBag, ArrowUpRight } from 'lucide-react';

type CatalogWindowItem = { id: string; name: string; imageUrl: string | null };

type Props = {
  storeName: string;
  city?: string;
  country?: string;
  mapApproved?: boolean;
  ordersCount: number | null;
  threadsCount: number | null;
  catalogCount: number | null;
  /** Up to three active products for a small “shop window” row (thumbnails or placeholders). */
  catalogWindowItems?: CatalogWindowItem[];
};

/**
 * Bio Vera partner store dashboard — same language as the public site: light typography,
 * white surfaces, #2D5A27 accent (matches grower / buyer areas).
 */
export default function SupplierStorefrontSection({
  storeName,
  city,
  country,
  mapApproved,
  ordersCount,
  threadsCount,
  catalogCount,
  catalogWindowItems = [],
}: Props) {
  const location = [city, country].filter(Boolean).join(', ');
  const windowSlots: (CatalogWindowItem | undefined)[] = [0, 1, 2].map((i) => catalogWindowItems[i]);

  const cards = [
    {
      href: '/supplier/orders',
      label: 'Orders',
      sub: 'From growers — pending, confirmed, fulfilled',
      count: ordersCount,
      icon: Package,
    },
    {
      href: '/supplier/messages',
      label: 'Messages',
      sub: 'Threads with growers',
      count: threadsCount,
      icon: MessageCircle,
    },
    {
      href: '/supplier/catalog',
      label: 'Catalog',
      sub: 'Products & reference prices',
      count: catalogCount,
      icon: ShoppingBag,
    },
  ] as const;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Light storefront cue: striped awning + sill — Bio Vera green, no stock photos */}
      <div className="relative" aria-hidden>
        <div
          className="h-7 w-full"
          style={{
            background:
              'repeating-linear-gradient(110deg, #2D5A27 0px, #2D5A27 16px, #3a6540 16px, #3a6540 32px)',
          }}
        />
        <div className="h-1.5 w-full bg-gradient-to-b from-[#1e3d1a] to-[#152a14] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />
      </div>

      <div className="border-b border-gray-100 bg-gradient-to-b from-[#2D5A27]/5 to-white px-5 py-6 sm:px-8 sm:py-8">
        <p className="text-xs font-medium uppercase tracking-wider text-[#2D5A27]">Partner store</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">{storeName}</h1>
        {location && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500 font-light">
            <MapPin className="h-3.5 w-3.5 text-[#2D5A27]/70" aria-hidden />
            {location}
          </p>
        )}
        <p className="mt-3 text-sm text-gray-600 font-light max-w-2xl leading-relaxed">
          Direct grower orders and message threads in one place. Build your in-app catalog so growers see what
          you stock; orders still use free-text lines — the catalog is your reference list.
        </p>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Shop window</p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            {windowSlots.map((it, idx) => (
              <div
                key={it?.id ?? `placeholder-${idx}`}
                className="relative h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] overflow-hidden rounded-md border-2 border-[#2D5A27]/20 bg-gradient-to-b from-white to-[#f7f4ef] shadow-[inset_0_0_0_1px_rgba(45,90,39,0.08)]"
                title={it?.name || 'Add products with photos in Catalog'}
              >
                {it?.imageUrl ? (
                  <img
                    src={it.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#2D5A27]/20">
                    <ShoppingBag className="h-7 w-7" strokeWidth={1.25} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-400 font-light">
            Upload product photos in Catalog — they appear here and on your public profile.
          </p>
        </div>

        {mapApproved !== undefined && (
          <div
            className={`mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-light ${
              mapApproved
                ? 'border-green-200/80 bg-green-50/80 text-green-800'
                : 'border-amber-200/80 bg-amber-50/80 text-amber-900'
            }`}
          >
            {mapApproved ? (
              <>
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                Approved on the grower map
              </>
            ) : (
              'Map listing pending team approval for your address. Contact Bio Vera to update profile or location.'
            )}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {cards.map(({ href, label, sub, count, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[#2D5A27]/25 hover:bg-[#2D5A27]/5 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-extralight tabular-nums text-[#2D5A27]">
                    {count === null ? '—' : count}
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2D5A27]/8 text-[#2D5A27] group-hover:bg-[#2D5A27]/12">
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500 font-light leading-snug flex-1">{sub}</p>
              <span className="mt-3 inline-flex items-center gap-0.5 text-sm font-light text-[#2D5A27] group-hover:gap-1 transition-all">
                Open <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 font-light max-w-md mx-auto">
          Update store name, website, contact, and address in{' '}
          <Link href="/supplier/settings" className="text-[#2D5A27] hover:underline">
            Settings
          </Link>
          . If your map pin or address changes, Bio Vera re-verifies the listing.
        </p>
      </div>
    </div>
  );
}
