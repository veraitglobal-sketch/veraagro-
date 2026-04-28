'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { estatesAPI, harvestAnnouncementsAPI, parcelsAPI } from '@/lib/api';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { Leaf, Loader2, Sprout, Wheat } from 'lucide-react';

type EstateRow = { id: string; name: string };
type ParcelRow = { id: string; cropType?: string | null; approvedAt: string | null; estateId: string };
type HaRow = {
  id: string;
  parcelId: string;
  announcementType: string;
  cropType: string;
  estimatedDate: string;
  status: string;
  notes?: string | null;
  parcel?: {
    id: string;
    cropType?: string | null;
    estates?: { name: string } | null;
  } | null;
};

export default function GrowerPlantingsPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const nav = useGrowerNavItems();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<HaRow[]>([]);
  const [approvedParcels, setApprovedParcels] = useState<(ParcelRow & { estateName: string })[]>([]);

  const [formParcelId, setFormParcelId] = useState('');
  const [formCrop, setFormCrop] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [list, estates] = await Promise.all([
        harvestAnnouncementsAPI.getMine() as Promise<HaRow[]>,
        estatesAPI.getAll() as Promise<EstateRow[]>,
      ]);
      setAnnouncements(Array.isArray(list) ? list : []);
      const rows: (ParcelRow & { estateName: string })[] = [];
      for (const e of estates || []) {
        const parcels = (await parcelsAPI.getByEstate(e.id).catch(() => [])) as ParcelRow[];
        for (const p of parcels || []) {
          if (p.approvedAt) {
            rows.push({ ...p, estateName: e.name });
          }
        }
      }
      setApprovedParcels(rows);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('growerPages.loadFailed'));
      setAnnouncements([]);
      setApprovedParcels([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const formatDate = useCallback(
    (iso: string) => {
      try {
        const tag = i18n.language?.startsWith('sr') ? 'sr-Latn' : 'en-GB';
        return new Date(iso).toLocaleString(tag, { dateStyle: 'short', timeStyle: 'short' });
      } catch {
        return iso;
      }
    },
    [i18n.language],
  );

  const plantings = useMemo(
    () => announcements.filter((a) => a.announcementType === 'PLANTING'),
    [announcements],
  );
  const harvests = useMemo(
    () => announcements.filter((a) => a.announcementType === 'HARVEST'),
    [announcements],
  );

  const haStatus = (status: string) => {
    const key = `growerPages.ha_${status}` as const;
    const tr = t(key);
    if (tr !== key) return tr;
    return t('growerPages.ha_STATUS', { status });
  };

  const submitPlanting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formParcelId || !formCrop.trim() || !formDate) return;
    setSaving(true);
    setErr(null);
    try {
      await harvestAnnouncementsAPI.create({
        parcelId: formParcelId,
        announcementType: 'PLANTING',
        cropType: formCrop.trim(),
        estimatedDate: new Date(formDate + 'T12:00:00').toISOString(),
        notes: formNotes.trim() || undefined,
      });
      setFormCrop('');
      setFormNotes('');
      await load();
    } catch (er: unknown) {
      const msg =
        (er as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(' ') : msg;
      setErr(text || (er instanceof Error ? er.message : t('growerPages.loadFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title={t('grower.nav.myPlantings')} navItems={nav}>
        <GrowerPageShell className="space-y-6">
          <GrowerPageHeader
            title={t('grower.nav.myPlantings')}
            description={t('growerPages.plantingsPageLead')}
          />

          {err && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{err}</div>
          )}

          <p className="text-sm text-gray-600">
            <Link href={loc('/grower/fields')} className="text-[#2D5A27] font-medium underline">
              {t('grower.placeholders.openParcels')}
            </Link>
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin text-[#2D5A27]" />
              {t('growerPages.loadingPlantings')}
            </div>
          ) : (
            <>
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Sprout className="h-5 w-5 text-[#2D5A27]" />
                  {t('growerPages.plantingsFormTitle')}
                </h2>
                {approvedParcels.length === 0 ? (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    {t('growerPages.plantingsApprovedOnly')}
                  </p>
                ) : (
                  <form onSubmit={submitPlanting} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('growerPages.plantingsFormParcel')}</label>
                      <select
                        required
                        value={formParcelId}
                        onChange={(e) => setFormParcelId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D5A27]/30"
                      >
                        <option value="">{t('growerPages.plantingsSelectParcel')}</option>
                        {approvedParcels.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.estateName} — {p.cropType || p.id.slice(0, 8)}…
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('growerPages.plantingsFormCrop')}</label>
                      <input
                        type="text"
                        required
                        value={formCrop}
                        onChange={(e) => setFormCrop(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D5A27]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('growerPages.plantingsFormDate')}</label>
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D5A27]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('growerPages.plantingsFormNotes')}</label>
                      <textarea
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D5A27]/30"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Leaf className="h-4 w-4" />}
                      {saving ? t('growerPages.plantingsFormSaving') : t('growerPages.plantingsFormSubmit')}
                    </button>
                  </form>
                )}
              </section>

              <AnnouncementsTable
                title={t('growerPages.plantingsSectionPlanting')}
                icon={Sprout}
                rows={plantings}
                empty={t('growerPages.plantingsEmpty')}
                t={t}
                formatDate={formatDate}
                haStatus={haStatus}
              />
              <AnnouncementsTable
                title={t('growerPages.plantingsSectionHarvest')}
                icon={Wheat}
                rows={harvests}
                empty={t('growerPages.plantingsEmpty')}
                t={t}
                formatDate={formatDate}
                haStatus={haStatus}
              />
            </>
          )}
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}

function AnnouncementsTable({
  title,
  icon: Icon,
  rows,
  empty,
  t,
  formatDate,
  haStatus,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: HaRow[];
  empty: string;
  t: (k: string, o?: Record<string, string>) => string;
  formatDate: (iso: string) => string;
  haStatus: (s: string) => string;
}) {
  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-2">
          <Icon className="h-5 w-5 text-[#2D5A27]" />
          {title}
        </h2>
        <p className="text-sm text-gray-600 font-light">{empty}</p>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
        <Icon className="h-5 w-5 text-[#2D5A27]" />
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500 tracking-wide">
              <th className="px-4 py-2 font-medium">{t('growerPages.plantingsTableField')}</th>
              <th className="px-4 py-2 font-medium">{t('growerPages.plantingsTableParcel')}</th>
              <th className="px-4 py-2 font-medium">{t('growerPages.plantingsTableType')}</th>
              <th className="px-4 py-2 font-medium">{t('growerPages.plantingsTableCrop')}</th>
              <th className="px-4 py-2 font-medium">{t('growerPages.plantingsTableDate')}</th>
              <th className="px-4 py-2 font-medium">{t('growerPages.plantingsTableStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/80">
                <td className="px-4 py-2.5 text-gray-800">{a.parcel?.estates?.name || '—'}</td>
                <td className="px-4 py-2.5 text-gray-700">
                  {a.parcel?.cropType || a.parcelId.slice(0, 8)}…
                </td>
                <td className="px-4 py-2.5">
                  {a.announcementType === 'PLANTING' ? t('growerPages.annTypePLANTING') : t('growerPages.annTypeHARVEST')}
                </td>
                <td className="px-4 py-2.5 font-medium text-gray-900">{a.cropType}</td>
                <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDate(a.estimatedDate)}</td>
                <td className="px-4 py-2.5">
                  <span className="text-xs font-medium rounded-full bg-gray-100 px-2 py-0.5">{haStatus(a.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
