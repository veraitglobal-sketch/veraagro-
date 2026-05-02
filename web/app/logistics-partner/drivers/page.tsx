'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { logisticsDriversAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useLogisticsPartnerNavItems } from '@/lib/logistics-nav';
import Link from 'next/link';

type Driver = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('read'));
    r.readAsDataURL(file);
  });
}

export default function LogisticsDriversPage() {
  const { t } = useTranslation();
  const logisticsPartnerNavItems = useLogisticsPartnerNavItems();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const load = useCallback(() => {
    logisticsDriversAPI
      .list()
      .then((data: Driver[]) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

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
      let photoDataUrl: string | undefined;
      if (photoFile) {
        if (!photoFile.type.startsWith('image/')) {
          setFormError(t('logisticsPages.driversPhotoType'));
          setSaving(false);
          return;
        }
        if (photoFile.size > 5 * 1024 * 1024) {
          setFormError(t('logisticsPages.driversPhotoSize'));
          setSaving(false);
          return;
        }
        photoDataUrl = await readFileAsDataUrl(photoFile);
      }
      await logisticsDriversAPI.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        photoDataUrl,
      });
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setPhotoFile(null);
      load();
    } catch (err: unknown) {
      setFormError(apiErrorOrT(err, t, 'logisticsPages.driversErrSave'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (d: Driver) => {
    setFormError(null);
    try {
      await logisticsDriversAPI.update(d.id, { isActive: !d.isActive });
      load();
    } catch (err: unknown) {
      setFormError(apiErrorOrT(err, t, 'logisticsPages.driversErrUpdate'));
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">{t('logisticsPages.driversLoading')}</div>
      </div>
    );
  }

  return (
    <SidebarLayout title={t('logisticsPartnerNav.drivers')} navItems={logisticsPartnerNavItems}>
      <div className="max-w-3xl space-y-8">
        <p className="text-sm text-gray-600">
          {t('logisticsPages.driversIntro')}{' '}
          <Link href="/logistics-partner/missions" className="text-[#2D5A27] font-medium underline underline-offset-2">
            {t('logisticsPages.driversMissionsLink')}
          </Link>
        </p>

        <form onSubmit={submit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">{t('logisticsPages.driversAddTitle')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('logisticsPages.driversFirstName')}</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('logisticsPages.driversLastName')}</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('logisticsPages.driversEmail')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('logisticsPages.driversPhone')}</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('logisticsPages.driversPhotoOptional')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600"
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-50"
          >
            {saving ? t('logisticsPages.driversSaving') : t('logisticsPages.driversSave')}
          </button>
        </form>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <h2 className="text-base font-semibold text-gray-900 px-6 py-4 border-b border-gray-100">
            {t('logisticsPages.driversListTitle')}
          </h2>
          {loading ? (
            <p className="p-6 text-sm text-gray-500">{t('logisticsPages.driversLoading')}</p>
          ) : list.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">{t('logisticsPages.driversEmpty')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {list.map((d) => (
                <li key={d.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {d.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                        —
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {d.firstName} {d.lastName}
                        {!d.isActive && (
                          <span className="ml-2 text-xs font-normal text-amber-700">({t('logisticsPages.driversInactive')})</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{d.email || '—'}</p>
                      <p className="text-sm text-gray-600">{d.phone || '—'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleActive(d)}
                    className="shrink-0 text-sm font-medium text-[#2D5A27] hover:underline"
                  >
                    {d.isActive ? t('logisticsPages.driversDeactivate') : t('logisticsPages.driversActivate')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
