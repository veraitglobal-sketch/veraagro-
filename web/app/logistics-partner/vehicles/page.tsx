'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { logisticsVehiclesAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useLogisticsPartnerNavItems } from '@/lib/logistics-nav';

type Vehicle = {
  id: string;
  vehicleNumber: string;
  type: string;
  make: string | null;
  model: string | null;
  licensePlate: string;
  hasFrigo: boolean;
  tempRangeMin: number;
  tempRangeMax: number;
  status: string;
};

const VEHICLE_TYPE_VALUES = [
  'refrigerated_van',
  'rigid_7_5t',
  'rigid_12t',
  'artic',
  'other',
] as const;

function vehicleTypeLabel(type: string, t: (key: string) => string): string {
  const key = `logisticsPages.vehiclesType_${type}`;
  const translated = t(key);
  return translated === key ? type : translated;
}

export default function LogisticsVehiclesPage() {
  const { t } = useTranslation();
  const logisticsPartnerNavItems = useLogisticsPartnerNavItems();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [licensePlate, setLicensePlate] = useState('');
  const [type, setType] = useState('refrigerated_van');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');

  const load = useCallback(() => {
    setListError(null);
    logisticsVehiclesAPI
      .list()
      .then((data: Vehicle[]) => setList(Array.isArray(data) ? data : []))
      .catch((err: unknown) => {
        setList([]);
        setListError(apiErrorOrT(err, t, 'logisticsPages.vehiclesListLoadError'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login/producer');
      return;
    }
    const roles = user?.roles && Array.isArray(user.roles) ? user.roles : [];
    if (!roles.includes('LOGISTICS_PARTNER')) {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (!isAuthenticated || !user?.roles?.includes('LOGISTICS_PARTNER')) return;
    setLoading(true);
    load();
  }, [isAuthenticated, user?.roles, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await logisticsVehiclesAPI.create({
        licensePlate: licensePlate.trim(),
        type,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        hasFrigo: true,
        tempRangeMin: 0,
        tempRangeMax: 4,
      });
      setLicensePlate('');
      setMake('');
      setModel('');
      load();
    } catch (err: unknown) {
      setFormError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">{t('logisticsPages.dashboardShellLoading')}</div>
      </div>
    );
  }

  return (
    <SidebarLayout title={t('logisticsPartnerNav.vehicles')} navItems={logisticsPartnerNavItems}>
      <div className="max-w-3xl space-y-8">
        <p className="text-sm text-gray-600">
          <Trans
            i18nKey="logisticsPages.vehiclesIntro"
            components={{ strong: <strong className="font-semibold text-gray-900" /> }}
          />
        </p>

        <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('logisticsPages.vehiclesFormTitle')}</h2>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('logisticsPages.vehiclesLicenseLabel')}</label>
              <input
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder={t('logisticsPages.vehiclesLicensePlaceholder')}
                maxLength={32}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('logisticsPages.vehiclesCategoryLabel')}</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {VEHICLE_TYPE_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {vehicleTypeLabel(v, t)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {t('logisticsPages.vehiclesCategoryHint')}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('logisticsPages.vehiclesMakeLabel')}</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder={t('logisticsPages.vehiclesMakePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('logisticsPages.vehiclesModelLabel')}</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={t('logisticsPages.vehiclesModelPlaceholder')}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {t('logisticsPages.vehiclesTempNote')}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-60"
              >
                {saving ? t('logisticsPages.vehiclesSubmitting') : t('logisticsPages.vehiclesSubmit')}
              </button>
              <Link
                href="/logistics-partner/missions"
                className="px-4 py-2 text-sm text-[#2D5A27] font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                {t('logisticsPages.vehiclesBackMissions')}
              </Link>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('logisticsPages.vehiclesFleetTitle')}</h2>
          {listError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{listError}</div>
          )}
          {loading ? (
            <p className="text-gray-500 text-sm">{t('logisticsPages.dashboardShellLoading')}</p>
          ) : list.length === 0 ? (
            <div className="text-sm text-gray-600 space-y-3">
              <p>{t('logisticsPages.vehiclesFleetEmpty')}</p>
              <p className="text-gray-500">{t('logisticsPages.vehiclesFleetEmptyHint')}</p>
              <Link
                href="/logistics-partner/missions#logistics-available-missions"
                className="inline-flex font-medium text-[#2D5A27] underline underline-offset-2"
              >
                {t('logisticsPages.vehiclesFleetEmptyCtaMissions')}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {list.map((v) => {
                const label = vehicleTypeLabel(v.type, t);
                return (
                  <li key={v.id} className="py-4 first:pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{v.licensePlate}</p>
                        <p className="text-sm text-gray-600">{label}</p>
                        {(v.make || v.model) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {[v.make, v.model].filter(Boolean).join(' ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {v.vehicleNumber} · {t('logisticsPages.vehiclesCooling', { min: v.tempRangeMin, max: v.tempRangeMax })} ·{' '}
                          <span className="capitalize">{v.status.toLowerCase().replace('_', ' ')}</span>
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </SidebarLayout>
  );
}
