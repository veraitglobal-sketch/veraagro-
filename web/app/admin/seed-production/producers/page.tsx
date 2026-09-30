'use client';

import { useCallback, useEffect, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { PremiumButton, PremiumButtonLink, PremiumPageTitle } from '@/components/ui/Premium';
import { seedProductionAPI, type SeedProducer } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { Loader2, Pencil, Plus, X } from 'lucide-react';

type ProducerForm = {
  name: string;
  country: string;
  city: string;
  address: string;
  licenseNumber: string;
  contactName: string;
  contactEmail: string;
  isActive: boolean;
};

const EMPTY_FORM: ProducerForm = {
  name: '',
  country: '',
  city: '',
  address: '',
  licenseNumber: '',
  contactName: '',
  contactEmail: '',
  isActive: true,
};

export default function SeedProducersPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const [producers, setProducers] = useState<SeedProducer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProducerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteProducerId, setInviteProducerId] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await seedProductionAPI.listProducers();
      setProducers(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
      setProducers([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: SeedProducer) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      country: p.country,
      city: p.city ?? '',
      address: p.address ?? '',
      licenseNumber: p.licenseNumber ?? '',
      contactName: p.contactName ?? '',
      contactEmail: p.contactEmail ?? '',
      isActive: p.isActive,
    });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name.trim(),
        country: form.country.trim(),
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
        licenseNumber: form.licenseNumber.trim() || undefined,
        contactName: form.contactName.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        isActive: form.isActive,
      };
      if (editingId) {
        await seedProductionAPI.updateProducer(editingId, body);
      } else {
        await seedProductionAPI.createProducer(body);
      }
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('seedProduction.producers.title')} navItems={adminNavItems}>
        <div className="space-y-6">
          <PremiumPageTitle
            title={t('seedProduction.producers.title')}
            description={t('seedProduction.producers.subtitle')}
            right={
              <PremiumButton onClick={openCreate}>
                <Plus className="mr-2 inline h-4 w-4" />
                {t('seedProduction.producers.new')}
              </PremiumButton>
            }
          />

          <nav className="flex flex-wrap gap-2 text-sm">
            <PremiumButtonLink href="/admin/seed-production" variant="secondary">{t('seedProduction.nav.dashboard')}</PremiumButtonLink>
            <PremiumButtonLink href="/admin/seed-production/approved-products" variant="secondary">{t('seedProduction.nav.approvedProducts')}</PremiumButtonLink>
            <PremiumButtonLink href="/admin/seed-production/producers" variant="primary">{t('seedProduction.nav.producers')}</PremiumButtonLink>
            <PremiumButtonLink href="/admin/seed-production/lookup" variant="secondary">{t('seedProduction.nav.lookup')}</PremiumButtonLink>
          </nav>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('seedProduction.common.loading')}
            </div>
          ) : producers.length === 0 ? (
            <p className="text-sm text-gray-600">{t('seedProduction.producers.empty')}</p>
          ) : (
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.producers.name')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.producers.country')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.producers.city')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.producers.contactName')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.producers.isActive')}</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">{t('seedProduction.common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {producers.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-3">{p.country}</td>
                        <td className="px-4 py-3">{p.city ?? '—'}</td>
                        <td className="px-4 py-3">{p.contactName ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-3">
                          {!p.userId ? (
                            <button
                              type="button"
                              onClick={() => {
                                setInviteProducerId(p.id);
                                setInviteForm({
                                  firstName: p.contactName?.split(' ')[0] ?? '',
                                  lastName: p.contactName?.split(' ').slice(1).join(' ') ?? '',
                                  email: p.contactEmail ?? '',
                                });
                                setInviteOpen(true);
                              }}
                              className="text-[#2D5A27] hover:underline text-sm"
                            >
                              {t('seedProduction.producers.invite')}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500">{t('seedProduction.producers.linkedUser')}</span>
                          )}
                          <button type="button" onClick={() => openEdit(p)} className="inline-flex items-center gap-1 text-[#2D5A27] hover:underline">
                            <Pencil className="h-4 w-4" />
                            {t('seedProduction.producers.edit')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {inviteOpen && inviteProducerId && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10">
            <div className="mb-10 w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium">{t('seedProduction.producers.inviteTitle')}</h2>
                <button type="button" onClick={() => setInviteOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 px-6 py-5">
                {(['firstName', 'lastName', 'email'] as const).map((field) => (
                  <label key={field} className="block">
                    <span className="text-sm font-medium text-gray-700">{t(`seedProduction.producers.invite${field.charAt(0).toUpperCase()}${field.slice(1)}`)}</span>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={inviteForm[field]}
                      onChange={(e) => setInviteForm((f) => ({ ...f, [field]: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                    />
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <PremiumButton variant="secondary" onClick={() => setInviteOpen(false)}>{t('seedProduction.producers.cancel')}</PremiumButton>
                <PremiumButton
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await seedProductionAPI.inviteProducer(inviteProducerId, inviteForm);
                      setInviteOpen(false);
                      await load();
                    } catch (err: unknown) {
                      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving || !inviteForm.email.trim()}
                >
                  {t('seedProduction.producers.inviteSend')}
                </PremiumButton>
              </div>
            </div>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10" role="dialog" aria-modal="true">
            <div className="mb-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {editingId ? t('seedProduction.producers.edit') : t('seedProduction.producers.new')}
                </h2>
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 px-6 py-5">
                {(['name', 'country', 'city', 'address', 'licenseNumber', 'contactName', 'contactEmail'] as const).map((field) => (
                  <label key={field} className="block">
                    <span className="text-sm font-medium text-gray-700">{t(`seedProduction.producers.${field}`)}</span>
                    <input
                      type={field === 'contactEmail' ? 'email' : 'text'}
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </label>
                ))}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-[#2D5A27] focus:ring-[#2D5A27]"
                  />
                  <span className="text-sm text-gray-700">{t('seedProduction.producers.isActive')}</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <PremiumButton variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                  {t('seedProduction.producers.cancel')}
                </PremiumButton>
                <PremiumButton onClick={save} disabled={saving || !form.name.trim() || !form.country.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seedProduction.producers.save')}
                </PremiumButton>
              </div>
            </div>
          </div>
        )}
      </SidebarLayout>
    </AuthGuard>
  );
}
