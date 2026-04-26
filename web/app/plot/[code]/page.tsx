import Link from 'next/link';
import { WEB_API_BASE } from '@/lib/api-base';

type PublicPlot = {
  code: string;
  plot: {
    cropType: string | null;
    areaHa: number;
    plantingDate: string | null;
    expectedHarvestDate: string | null;
  };
  farm: {
    name: string;
    growerFirstName: string | null;
    productionCountry: string | null;
    regionLabel: string;
  };
  treatments: { appliedAt: string; productName: string; reason: string | null }[];
  growthHighlights: { at: string; stage: string | null; note: string | null }[];
  harvestPlans: {
    cropType: string;
    estimatedDate: string;
    estimatedQuantity: number | null;
    type: string;
  }[];
  recentLots: {
    publicBatchId: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: string;
    status: string;
  }[];
};

async function loadPlot(code: string): Promise<PublicPlot | null> {
  const res = await fetch(`${WEB_API_BASE}/parcels/public/plot/${encodeURIComponent(code)}`, {
    next: { revalidate: 120 },
  });
  if (!res.ok) return null;
  return (await res.json()) as PublicPlot;
}

function fmt(d: string | null) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return d;
  }
}

export default async function PublicPlotPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const data = await loadPlot(code);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center text-gray-700">
          <h1 className="text-lg font-medium text-gray-900 mb-2">Plot not found</h1>
          <p className="text-sm">This code is invalid or the plot is not published yet.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-[#2D5A27] font-medium underline">
            Bio Vera home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Bio Vera · Field plot</p>
        <h1 className="text-2xl font-light text-gray-900">{data.farm.name}</h1>
        <p className="text-sm text-gray-600 mt-1">{data.farm.regionLabel}</p>
        {data.farm.growerFirstName && (
          <p className="text-sm text-gray-500 mt-0.5">Grown with care · {data.farm.growerFirstName}</p>
        )}

        <div className="mt-8 rounded-xl border border-[#2D5A27]/20 bg-white shadow-sm p-5">
          <h2 className="text-sm font-semibold text-[#23471f]">This block (sadnja)</h2>
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Crop</dt>
              <dd className="font-medium text-gray-900">{data.plot.cropType || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Area</dt>
              <dd className="font-medium text-gray-900">
                {data.plot.areaHa != null ? `${data.plot.areaHa.toFixed(2)} ha` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Planting</dt>
              <dd className="text-gray-900">{fmt(data.plot.plantingDate)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Expected harvest</dt>
              <dd className="text-gray-900">{fmt(data.plot.expectedHarvestDate)}</dd>
            </div>
          </dl>
          <p className="text-xs text-gray-400 mt-4 font-mono">Code: {data.code}</p>
        </div>

        {data.treatments.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Field treatments (recent)</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {data.treatments.slice(0, 20).map((t, i) => (
                <li key={i} className="border-b border-gray-100 pb-2">
                  <span className="text-gray-500 text-xs block">{fmt(t.appliedAt)}</span>
                  {t.productName}
                  {t.reason ? <span className="text-gray-500"> — {t.reason}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.growthHighlights.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Growth log</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {data.growthHighlights.map((g, i) => (
                <li key={i} className="border-b border-gray-100 pb-2">
                  <span className="text-gray-500 text-xs block">{fmt(g.at)}</span>
                  {g.stage && <span className="font-medium">{g.stage} </span>}
                  {g.note}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.harvestPlans.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Harvest plans</h2>
            <ul className="text-sm text-gray-700 space-y-2">
              {data.harvestPlans.map((h, i) => (
                <li key={i}>
                  {h.cropType} · {fmt(h.estimatedDate)}
                  {h.estimatedQuantity != null && ` · ~${h.estimatedQuantity} (est.)`}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.recentLots.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Product lots from this block</h2>
            <p className="text-xs text-gray-500 mb-3">Each lot has a full passport (packing, cold chain) — open the link to see details.</p>
            <ul className="space-y-2">
              {data.recentLots.map((b) => (
                <li key={b.publicBatchId}>
                  <Link
                    href={`/passport/${encodeURIComponent(b.publicBatchId)}`}
                    className="text-[#2D5A27] font-medium text-sm hover:underline"
                  >
                    {b.publicBatchId}
                  </Link>
                  <span className="text-gray-600 text-sm">
                    {' '}
                    — {b.productName} ({b.quantity} {b.unit}) · {fmt(b.harvestDate)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10 text-center text-xs text-gray-500">
          <Link href="/" className="text-[#2D5A27]">
            biovera.app
          </Link>{' '}
          — full traceability for retail
        </p>
      </div>
    </div>
  );
}
