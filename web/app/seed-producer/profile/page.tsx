'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { PremiumCard, PremiumPageTitle } from '@/components/ui/Premium';
import { seedProducerAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export default function SeedProducerProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Record<string, string | null> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setProfile(await seedProducerAPI.me());
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AuthGuard requiredRoles={['SEED_PRODUCER']}>
      <div className="space-y-6">
        <PremiumPageTitle title={t('seedProducer.profile.title')} description={t('seedProducer.profile.subtitle')} />
        {loading ? (
          <Loader2 className="animate-spin text-[#2D5A27]" />
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : profile ? (
          <PremiumCard>
            <h2 className="text-lg font-medium text-gray-900 mb-4">{profile.name ?? ''}</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">{t('seedProducer.profile.city')}</dt>
                <dd>{profile.city ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('seedProducer.profile.country')}</dt>
                <dd>{profile.country ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('seedProducer.profile.licence')}</dt>
                <dd>{profile.licenseNumber ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('seedProducer.profile.contact')}</dt>
                <dd>{profile.contactEmail ?? '—'}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-gray-600">{t('seedProducer.profile.contactBioVera')}</p>
          </PremiumCard>
        ) : null}
      </div>
    </AuthGuard>
  );
}
