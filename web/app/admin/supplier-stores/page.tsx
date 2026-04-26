'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { b2bSuppliersAdminAPI } from '@/lib/api';
import { getAdminNavItems } from '@/lib/admin-nav';
import { Store } from 'lucide-react';
import Link from 'next/link';

function getApiErrorMessage(e: unknown): string {
  const r = e as { response?: { data?: { message?: unknown } } };
  const m = r?.response?.data?.message;
  if (Array.isArray(m)) return m.join(' ');
  if (typeof m === 'string') return m;
  if (e instanceof Error) return e.message;
  return 'Request failed. Please try again.';
}

/**
 * Onboard a partner agri store (Material supplier) with login + map profile in one step.
 * No public registration; partners are created by admin only.
 */
export default function AdminSupplierStoresPage() {
  const adminNavItems = getAdminNavItems();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastPassword, setLastPassword] = useState<string | null>(null);

  const [form, setForm] = useState({
    partnerCode: '',
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    password: '',
    businessName: '',
    description: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    country: '',
    overrideLat: '',
    overrideLng: '',
    autoGeneratePassword: true,
    mapApproved: true,
    isVeraPartner: true,
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitError(null);
    setLastPassword(null);
    setSaving(true);
    const latO = form.overrideLat.trim() ? parseFloat(form.overrideLat) : NaN;
    const lngO = form.overrideLng.trim() ? parseFloat(form.overrideLng) : NaN;
    const useOverride = !Number.isNaN(latO) && !Number.isNaN(lngO);
    if (form.overrideLat.trim() || form.overrideLng.trim()) {
      if (!useOverride) {
        setMessage('If you set coordinates, both latitude and longitude must be valid numbers, or leave both empty for automatic lookup from the address.');
        setSaving(false);
        return;
      }
    }
    try {
      const res = await b2bSuppliersAdminAPI.createStore({
        partnerCode: form.partnerCode.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        businessName: form.businessName.trim(),
        description: form.description.trim() || undefined,
        street: form.street.trim(),
        houseNumber: form.houseNumber.trim() || undefined,
        postalCode: form.postalCode.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        ...(useOverride ? { latitude: latO, longitude: lngO } : {}),
        mapApproved: form.mapApproved,
        isVeraPartner: form.isVeraPartner,
        autoGeneratePassword: form.autoGeneratePassword,
        password: form.autoGeneratePassword ? undefined : form.password || undefined,
      });
      const partnerCode = String((res.user as { partnerCode?: string }).partnerCode || '');
      setMessage(
        `Store created. Partner code: ${partnerCode}. The account is ACTIVE; partner logs in with email or partner code.`,
      );
      if (res.password) setLastPassword(res.password);
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title="Supplier stores" navItems={adminNavItems}>
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-6 h-6 text-[#2D5A27]" />
            <h1 className="text-xl font-light text-gray-900">Create partner store account</h1>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            For contracted partners (e.g. agricultural pharmacies): one user with role{' '}
            <code className="text-xs bg-gray-100 px-1">MATERIAL_SUPPLIER</code>, a store profile, and map pin.{' '}
            <Link href="/admin/users" className="text-[#2D5A27] underline">
              Users
            </Link>{' '}
            for generic accounts.{' '}
            <Link href="/admin/supplier-growers" className="text-[#2D5A27] font-medium underline">
              Suppliers &amp; growers (B2B) overview
            </Link>
            .
          </p>

          {submitError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <p className="font-medium">Could not create store</p>
              <p className="mt-1 font-light">{submitError}</p>
              {submitError.toLowerCase().includes('already in use') && (
                <p className="mt-2 text-xs text-red-800/90 font-light">
                  HTTP 409 = conflict. This email or partner code is already in the system — you can’t create a second
                  account with the same value. Open{' '}
                  <Link href="/admin/users" className="underline font-medium">
                    Users
                  </Link>{' '}
                  to find the existing account. If that user is already a material supplier, they should log in to{' '}
                  <strong>Partner store → Settings</strong> and complete the form once (first save creates the store
                  profile). Or use{' '}
                  <Link href="/admin/supplier-growers" className="underline font-medium">
                    Suppliers &amp; growers
                  </Link>{' '}
                  and tap <strong>Approve for public map</strong> if the store exists but the pin is missing.
                </p>
              )}
            </div>
          )}

          {message && (
            <div
              className={`mb-4 rounded-md border p-3 text-sm ${
                lastPassword ? 'border-green-200 bg-green-50 text-green-900' : 'border-gray-200 bg-gray-50 text-gray-800'
              }`}
            >
              {message}
              {lastPassword && (
                <div className="mt-2 font-mono text-sm">
                  One-time password (copy and send securely): <strong>{lastPassword}</strong>
                </div>
              )}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4 bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-medium text-gray-800">Login</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs text-gray-600">
                Email *
                <input
                  type="email"
                  required
                  className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </label>
              <label className="block text-xs text-gray-600">
                Partner code (optional)
                <input
                  type="text"
                  className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  placeholder="Auto if empty, e.g. SUP-A1B2C3D"
                  value={form.partnerCode}
                  onChange={(e) => set('partnerCode', e.target.value)}
                />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs text-gray-600">
                First name *
                <input
                  required
                  className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                />
              </label>
              <label className="block text-xs text-gray-600">
                Last name *
                <input
                  required
                  className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                />
              </label>
            </div>
            <label className="block text-xs text-gray-600">
              Phone
              <input
                className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </label>
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.autoGeneratePassword}
                  onChange={(e) => set('autoGeneratePassword', e.target.checked)}
                />
                Generate password (shown once after save)
              </label>
              {!form.autoGeneratePassword && (
                <input
                  type="password"
                  className="w-full sm:w-64 border border-gray-200 rounded px-3 py-2 text-sm"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                />
              )}
            </div>

            <h2 className="text-sm font-medium text-gray-800 pt-2">Store & address (map uses automatic coordinates)</h2>
            <p className="text-xs text-gray-500">
              Enter street, number, postal code, city, and country. The server locates the pin on the map — you do not need latitude/longitude.
            </p>
            <label className="block text-xs text-gray-600">
              Business / store name *
              <input
                required
                className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={form.businessName}
                onChange={(e) => set('businessName', e.target.value)}
              />
            </label>
            <label className="block text-xs text-gray-600">
              Description
              <textarea
                className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                rows={2}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs text-gray-600">
                Street (ulica) *
                <input
                  required
                  className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  placeholder="e.g. Kralja Petra"
                  value={form.street}
                  onChange={(e) => set('street', e.target.value)}
                />
              </label>
              <label className="block text-xs text-gray-600">
                No. (broj)
                <input
                  className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 12"
                  value={form.houseNumber}
                  onChange={(e) => set('houseNumber', e.target.value)}
                />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs text-gray-600">
                Postal / ZIP (poštanski broj) *
                <input
                  required
                  className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 11000"
                  value={form.postalCode}
                  onChange={(e) => set('postalCode', e.target.value)}
                />
              </label>
              <label className="block text-xs text-gray-600">
                City (grad) *
                <input
                  required
                  className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                />
              </label>
            </div>
            <label className="block text-xs text-gray-600">
              Country (država) *
              <input
                required
                className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                placeholder="e.g. Serbia"
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
              />
            </label>
            <p className="text-xs text-gray-500">Advanced — only if geocoding fails or you need exact map pin</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs text-gray-600">
                Latitude (optional override)
                <input
                  className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  value={form.overrideLat}
                  onChange={(e) => set('overrideLat', e.target.value)}
                />
              </label>
              <label className="block text-xs text-gray-600">
                Longitude (optional override)
                <input
                  className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  value={form.overrideLng}
                  onChange={(e) => set('overrideLng', e.target.value)}
                />
              </label>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.mapApproved}
                onChange={(e) => set('mapApproved', e.target.checked)}
              />
              Approve for map now (visible to growers) — on by default; turn off if the address is not ready
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isVeraPartner}
                onChange={(e) => set('isVeraPartner', e.target.checked)}
              />
              Vera partner (sells Bio Vera line — stored on user)
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2 rounded-md bg-[#2D5A27] text-white text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create store account'}
            </button>
          </form>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
