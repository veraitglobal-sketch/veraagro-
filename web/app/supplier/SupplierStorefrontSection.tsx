'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Package, Store, MapPin, Sparkles } from 'lucide-react';

const ROOF_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=70&auto=format&fit=crop',
    alt: 'Green fields',
  },
  {
    src: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=70&auto=format&fit=crop',
    alt: 'Fresh produce in a market',
  },
  {
    src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=70&auto=format&fit=crop',
    alt: 'Agricultural inputs',
  },
] as const;

type Props = {
  storeName: string;
  city?: string;
  country?: string;
  mapApproved?: boolean;
  ordersCount: number | null;
  threadsCount: number | null;
};

/**
 * “Real store” look: photo strip, striped awning, signboard, then “shop floor” links.
 * Images are loaded from Unsplash (remote) — set in `next.config` under `images.remotePatterns`.
 */
export default function SupplierStorefrontSection({
  storeName,
  city,
  country,
  mapApproved,
  ordersCount,
  threadsCount,
}: Props) {
  const location = [city, country].filter(Boolean).join(', ');

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border-2 border-[#2D5A27]/20 bg-gradient-to-b from-[#f5f0e6] to-[#ebe6dc] shadow-[0_12px_40px_-12px_rgba(45,90,39,0.35)]">
      {/* Photo “skyline” above the building */}
      <div className="grid grid-cols-3 gap-0.5 bg-[#1a1a1a] p-0.5 sm:p-1">
        {ROOF_IMAGES.map((img) => (
          <div key={img.src} className="relative aspect-[5/2] min-h-[72px] overflow-hidden sm:min-h-[96px]">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, 200px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          </div>
        ))}
      </div>

      {/* Awning (roof) — striped canopy */}
      <div className="relative -mt-0.5 z-[1]">
        <div
          className="h-9 sm:h-11 w-full"
          style={{
            background: `repeating-linear-gradient(
              105deg,
              #2D5A27 0px,
              #2D5A27 12px,
              #f0ead8 12px,
              #f0ead8 24px
            )`,
            boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.12)',
          }}
        />
        <div
          className="h-0 w-0 border-l-[20px] border-r-[20px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#1f3f1a] sm:border-l-[28px] sm:border-r-[28px] sm:border-t-[10px] mx-auto -mt-px"
          aria-hidden
        />
      </div>

      {/* Signboard */}
      <div className="relative z-[2] -mt-2 flex flex-col items-center px-3 pb-1 pt-0">
        <div className="flex max-w-md flex-col items-center rounded-lg border-4 border-[#3d2914] bg-[#faf6ef] px-5 py-3 text-center shadow-[0_4px_0_#2a1d0f,0_8px_24px_rgba(0,0,0,0.2)] sm:px-8 sm:py-4">
          <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2D5A27] sm:text-xs">
            <Store className="h-3.5 w-3.5" />
            Partner store
          </p>
          <h1 className="font-serif text-2xl font-semibold text-[#1c1917] sm:text-3xl leading-tight">
            {storeName}
          </h1>
          {location && (
            <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-gray-600 sm:text-sm">
              <MapPin className="h-3.5 w-3.5 text-[#2D5A27]" />
              {location}
            </p>
          )}
        </div>
      </div>

      {/* Shop floor — “windows” to orders & messages */}
      <div className="relative z-[1] space-y-4 px-3 pb-6 pt-5 sm:px-6 sm:pt-6">
        <p className="text-center text-sm text-gray-600 sm:text-base">
          Direktne porudžbine proizvođača i poruke — sve na jednom mestu, kao ispred vaše radnje.
        </p>

        {mapApproved !== undefined && (
          <div
            className={`mx-auto flex max-w-lg items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:text-sm ${
              mapApproved
                ? 'border-green-200 bg-green-50/90 text-green-800'
                : 'border-amber-200 bg-amber-50/90 text-amber-900'
            }`}
          >
            {mapApproved ? (
              <>
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                Prikaz na mapi za proizvođače je odobren.
              </>
            ) : (
              <>
                Prikaz na mapi nakon odobrenja lokacije — za izmene, kontaktirajte Bio Vera.
              </>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/supplier/orders"
            className="group relative overflow-hidden rounded-xl border-2 border-white/60 bg-white/90 p-5 shadow-[0_2px_0_#2D5A27/15,inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:border-[#2D5A27]/30 hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Kasa · porudžbine</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2D5A27]/10 text-[#2D5A27] transition group-hover:bg-[#2D5A27]/20">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-light tabular-nums text-[#2D5A27] sm:text-4xl">
              {ordersCount === null ? '—' : ordersCount}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">Porudžbine od proizvođača</p>
            <p className="mt-1 text-xs text-gray-500">Status: na čekanju, potvrđeno, isporučeno</p>
            <span className="mt-3 inline-block text-sm font-medium text-[#2D5A27] group-hover:underline">
              Otvori porudžbine →
            </span>
          </Link>

          <Link
            href="/supplier/messages"
            className="group relative overflow-hidden rounded-xl border-2 border-white/60 bg-white/90 p-5 shadow-[0_2px_0_#2D5A27/15,inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:border-[#2D5A27]/30 hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Info pult</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2D5A27]/10 text-[#2D5A27] transition group-hover:bg-[#2D5A27]/20">
                <MessageCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-light tabular-nums text-[#2D5A27] sm:text-4xl">
              {threadsCount === null ? '—' : threadsCount}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">Razgovori</p>
            <p className="mt-1 text-xs text-gray-500">Poruke sa proizvođačima</p>
            <span className="mt-3 inline-block text-sm font-medium text-[#2D5A27] group-hover:underline">
              Otvori poruke →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
