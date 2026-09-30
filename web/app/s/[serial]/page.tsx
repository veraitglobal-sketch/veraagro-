import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { WEB_API_BASE } from '@/lib/api-base';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type VerifyResponse =
  | {
      genuine: true;
      state: string;
      product: string;
      variety?: string | null;
      lotNumber: string;
      seedCropYear: number;
      bagSize: string;
      producer: { name: string; city?: string | null; country: string };
      productionDate?: string | null;
      germinationPct?: number | null;
      purityPct?: number | null;
      certificateUrls?: string[];
      instructions?: Record<string, string> | null;
      instructionsPdfUrl?: string | null;
      videoUrl?: string | null;
    }
  | { genuine: false; reason: string };

async function fetchVerify(serial: string): Promise<VerifyResponse> {
  const res = await fetch(`${WEB_API_BASE}/public/seed/verify/${encodeURIComponent(serial)}`, {
    next: { revalidate: 60 },
  });
  return res.json();
}

const INSTRUCTION_SECTIONS = [
  ['sowingTime', 'Sowing & planting time'],
  ['spacingDepth', 'Spacing & depth'],
  ['seedRate', 'Seed rate per ha'],
  ['soilTemperature', 'Soil & temperature'],
  ['irrigation', 'Irrigation'],
  ['firstSteps', 'First steps after sowing'],
  ['storage', 'Storage of opened bag'],
  ['safety', 'Safety notes'],
  ['harvestWindow', 'Expected harvest window'],
] as const;

export default async function SeedInstructionsPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const data = await fetchVerify(serial);
  const genuine = data.genuine === true;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/biovera-logo.png" alt="Bio Vera" width={48} height={48} />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Bio Vera seed</h1>
            <p className="text-sm text-gray-500 font-mono">{serial}</p>
          </div>
        </div>

        {!genuine ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-lg font-semibold text-red-800">
              {'reason' in data && data.reason === 'NOT_ISSUED_FOR_SALE'
                ? 'This code was not issued for sale'
                : 'Not a genuine Bio Vera code'}
            </p>
            <p className="mt-2 text-sm text-red-700">
              {'reason' in data && data.reason === 'NOT_ISSUED_FOR_SALE' ? (
                <>This label code was voided or never released for planting. Contact Bio Vera if you believe this is an error.</>
              ) : (
                <>
                  This code could not be verified. Contact{' '}
                  <Link href="/contact" className="underline">
                    Bio Vera support
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        ) : (
          <>
            <div
              className={`rounded-xl border p-6 ${
                data.state === 'RECALLED'
                  ? 'border-red-300 bg-red-50'
                  : data.state === 'EXPIRED'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-green-200 bg-green-50'
              }`}
            >
              <p className="text-lg font-semibold text-[#2D5A27]">Genuine Bio Vera seed</p>
              <p className="mt-1 text-gray-800">
                {data.product}
                {data.variety ? ` — ${data.variety}` : ''} · {data.bagSize}
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Lot {data.lotNumber} · Seed year {data.seedCropYear} · produced by {data.producer.name}
                {data.producer.city ? `, ${data.producer.city}` : ''}
              </p>
              {data.state === 'RECALLED' && (
                <p className="mt-3 font-medium text-red-800">Do not use — this lot was recalled. Contact Bio Vera.</p>
              )}
              {data.state === 'EXPIRED' && (
                <p className="mt-3 font-medium text-amber-800">This bag is past its best-before date.</p>
              )}
              {data.state === 'USED' && (
                <p className="mt-3 text-sm text-gray-700">This bag was already registered for planting.</p>
              )}
            </div>

            {data.instructions && INSTRUCTION_SECTIONS.some(([k]) => data.instructions?.[k]?.trim()) && (
              <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Usage instructions</h2>
                <div className="mt-4 space-y-4">
                  {INSTRUCTION_SECTIONS.map(([key, title]) => {
                    const text = data.instructions?.[key]?.trim();
                    if (!text) return null;
                    return (
                      <div key={key}>
                        <h3 className="text-sm font-medium text-[#2D5A27]">{title}</h3>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{text}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Lot quality data</h2>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {data.productionDate && (
                  <>
                    <dt className="text-gray-500">Production date</dt>
                    <dd>{data.productionDate}</dd>
                  </>
                )}
                {data.germinationPct != null && (
                  <>
                    <dt className="text-gray-500">Germination</dt>
                    <dd>{data.germinationPct}%</dd>
                  </>
                )}
                {data.purityPct != null && (
                  <>
                    <dt className="text-gray-500">Purity</dt>
                    <dd>{data.purityPct}%</dd>
                  </>
                )}
              </dl>
              {data.certificateUrls && data.certificateUrls.length > 0 && (
                <ul className="mt-4 space-y-1 text-sm">
                  {data.certificateUrls.map((url) => (
                    <li key={url}>
                      <a href={url} className="text-[#2D5A27] underline" target="_blank" rel="noreferrer">
                        Quality certificate
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="font-medium text-gray-900">Grow with Bio Vera</p>
              <p className="mt-2 text-sm text-gray-600">Download the app to register planting and track your crop.</p>
              <p className="mt-4">
                <a href={`biovera://seed/${serial}`} className="text-sm font-medium text-[#2D5A27] underline">
                  Already a Bio Vera grower? Open in the app
                </a>
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
