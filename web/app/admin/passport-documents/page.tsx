'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useAdminNavItems } from '@/lib/admin-nav';
import { passportDocumentsAPI, passportReportsAPI } from '@/lib/api';
import { useTranslation } from 'react-i18next';

type DocRow = {
  id: string;
  title: string;
  docType: string;
  scope: string;
  verificationStatus: string;
  isPublic: boolean;
  fileDocumentId: string;
  catalog_product?: { name: string; variety: string | null } | null;
  batch?: { batchId: string; productName: string } | null;
};

export default function AdminPassportDocumentsPage() {
  const { t } = useTranslation();
  const nav = useAdminNavItems();
  const [rows, setRows] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await passportDocumentsAPI.listAdmin();
      setRows(Array.isArray(data) ? data : []);
    } catch { setError(t('admin.passportReports.error')); } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const verify = async (id: string, isPublic: boolean) => {
    if (saving) return;
    setSaving(true);
    try { await passportDocumentsAPI.adminVerify(id, { status: 'CONFIRMED', isPublic }); await load(); }
    catch { setError(t('admin.passportReports.error')); }
    finally { setSaving(false); }
  };

  return (
    <AuthGuard requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
      <SidebarLayout title={t('admin.passportDocuments.title', 'Passport documents')} navItems={nav}>
        <div className="max-w-4xl space-y-4 p-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('admin.passportDocuments.title', 'Passport documents — review queue')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('admin.passportDocuments.lead', 'Only confirmed public documents appear on the consumer passport.')}
          </p>
          {loading ? <p>{t('common.loading', 'Loading…')}</p> : null}
          {error ? <p role="alert">{error}</p> : null}
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
              <p className="font-medium">{row.title}</p>
              <p className="text-sm text-gray-600">
                {row.docType} · {row.scope}
                {row.catalog_product ? ` · ${row.catalog_product.name}` : ''}
                {row.batch ? ` · Lot ${row.batch.batchId}` : ''}
              </p>
              <button type="button"
                onClick={() => void passportReportsAPI.openAttachment(row.fileDocumentId).catch(() => alert(t('admin.passportReports.error')))}
                className="text-sm text-[#2D5A27] hover:underline"
              >
                {t('admin.passportDocuments.openFile', 'Open file')}
              </button>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button" disabled={saving}
                  className="min-h-[44px] rounded-lg bg-[#2D5A27] px-4 text-sm text-white"
                  onClick={() => void verify(row.id, true)}
                >
                  {t('admin.passportDocuments.confirmPublic', 'Confirm & publish')}
                </button>
                <button
                  type="button" disabled={saving}
                  className="min-h-[44px] rounded-lg border border-gray-300 px-4 text-sm"
                  onClick={() => void verify(row.id, false)}
                >
                  {t('admin.passportDocuments.confirmInternal', 'Confirm (internal only)')}
                </button>
              </div>
            </div>
          ))}
          {!loading && rows.length === 0 ? (
            <p className="text-gray-600">{t('admin.passportDocuments.empty', 'No documents awaiting review.')}</p>
          ) : null}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
