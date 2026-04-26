'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { b2bSupplierPortalAPI } from '@/lib/api';
import { Store, User, MapPin } from 'lucide-react';

export default function SupplierSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [mapApproved, setMapApproved] = useState(true);
  const [form, setForm] = useState({
    businessName: '',
    description: '',
    website: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    country: '',
    overrideLat: '',
    overrideLng: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const p = await b2bSupplierPortalAPI.getMyProfile();
      if (!p) {
        setErr('No store profile. Contact Bio Vera to finish onboarding.');
        return;
      }
      setMapApproved(Boolean(p.mapApproved));
      setForm({
        businessName: String(p.businessName || ''),
        description: p.description != null ? String(p.description) : '',
        website: p.website != null ? String(p.website) : '',
        street: p.street != null ? String(p.street) : (p.address != null ? String(p.address) : ''),
        houseNumber: p.houseNumber != null ? String(p.houseNumber) : '',
        postalCode: p.postalCode != null ? String(p.postalCode) : '',
        city: String(p.city || ''),
        country: String(p.country || ''),
        overrideLat: (() => {
          const l = p.location as { lat?: number; latitude?: number } | undefined;
          const n = l?.lat ?? l?.latitude;
          return n != null && !Number.isNaN(n) ? String(n) : '';
        })(),
        overrideLng: (() => {
          const l = p.location as { lng?: number; longitude?: number } | undefined;
          const n = l?.lng ?? l?.longitude;
          return n != null && !Number.isNaN(n) ? String(n) : '';
        })(),
        firstName: String(p.firstName || ''),
        lastName: String(p.lastName || ''),
        email: p.email != null ? String(p.email) : '',
        phone: p.phone != null ? String(p.phone) : '',
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setSaving(true);
    try {
      const latS = form.overrideLat.trim();
      const lngS = form.overrideLng.trim();
      const latN = latS ? parseFloat(latS) : NaN;
      const lngN = lngS ? parseFloat(lngS) : NaN;
      const haveBoth = !Number.isNaN(latN) && !Number.isNaN(lngN);
      const haveOne = (latS && !lngS) || (!latS && lngS);
      if (haveOne) {
        setErr('Set both latitude and longitude, or clear both to use automatic lookup from the address.');
        setSaving(false);
        return;
      }
      const payload: Parameters<typeof b2bSupplierPortalAPI.patchMyStore>[0] = {
        businessName: form.businessName.trim(),
        description: form.description.trim(),
        website: form.website.trim(),
        street: form.street.trim(),
        houseNumber: form.houseNumber.trim(),
        postalCode: form.postalCode.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };
      if (haveBoth) {
        payload.latitude = latN;
        payload.longitude = lngN;
      }
      await b2bSupplierPortalAPI.patchMyStore(payload);
      setOk('Saved. If you changed address or the map pin, the listing will show as pending until Bio Vera verifies it.');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard
      requiredRoles={['MATERIAL_SUPPLIER']}
      redirectTo="/login?returnTo=%2Fsupplier%2Fsettings"
    >
      <div className="max-w-2xl">
        <h1 className="text-2xl font-light text-gray-900">Store settings</h1>
        <p className="text-sm text-gray-600 font-light mt-1 mb-6">
          Update your public store name, website, contact details, and address. You manage your own store — the team
          only re-checks the map when your location changes.
        </p>

        {err && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
        )}
        {ok && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50/80 px-3 py-2 text-sm text-green-900">
            {ok}
            <span className="block mt-1 text-xs text-green-800/90">
              If you changed the login email, use the new address the next time you sign in.
            </span>
          </div>
        )}

        {!mapApproved && !loading && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm text-amber-950">
            Your store is not currently approved for the public map — often because the address or pin was recently
            updated. Bio Vera will re-verify the location.
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 font-light">Loading…</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              <h2 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Store className="h-4 w-4 text-[#2D5A27]" />
                Store
              </h2>
              <div className="space-y-3">
                <label className="block text-xs text-gray-600">
                  Store / business name *
                  <input
                    required
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.businessName}
                    onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                  />
                </label>
                <label className="block text-xs text-gray-600">
                  Short description
                  <textarea
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-light"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="What growers can expect from you"
                  />
                </label>
                <label className="block text-xs text-gray-600">
                  Website
                  <input
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    placeholder="https://example.com or example.com"
                    inputMode="url"
                    autoComplete="url"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              <h2 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-[#2D5A27]" />
                Contact person
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-xs text-gray-600">
                  First name *
                  <input
                    required
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    autoComplete="given-name"
                  />
                </label>
                <label className="block text-xs text-gray-600">
                  Last name *
                  <input
                    required
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    autoComplete="family-name"
                  />
                </label>
                <label className="block sm:col-span-2 text-xs text-gray-600">
                  Email (login) *
                  <input
                    required
                    type="email"
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                  />
                </label>
                <label className="block sm:col-span-2 text-xs text-gray-600">
                  Phone
                  <input
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              <h2 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#2D5A27]" />
                Address &amp; map pin
              </h2>
              <p className="text-xs text-gray-500 font-light mb-3">
                Changing the address or coordinates will remove map approval until the team confirms the new pin.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block sm:col-span-2 text-xs text-gray-600">
                  Street *
                  <input
                    required
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.street}
                    onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                    autoComplete="street-address"
                  />
                </label>
                <label className="block text-xs text-gray-600">
                  House / unit
                  <input
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.houseNumber}
                    onChange={(e) => setForm((f) => ({ ...f, houseNumber: e.target.value }))}
                  />
                </label>
                <label className="block text-xs text-gray-600">
                  Postal code *
                  <input
                    required
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.postalCode}
                    onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                    autoComplete="postal-code"
                  />
                </label>
                <label className="block text-xs text-gray-600">
                  City *
                  <input
                    required
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    autoComplete="address-level2"
                  />
                </label>
                <label className="block text-xs text-gray-600">
                  Country *
                  <input
                    required
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    autoComplete="country-name"
                  />
                </label>
                <label className="block text-xs text-gray-600">
                  Latitude (optional)
                  <input
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.overrideLat}
                    onChange={(e) => setForm((f) => ({ ...f, overrideLat: e.target.value }))}
                    inputMode="decimal"
                    placeholder="Leave empty for auto"
                  />
                </label>
                <label className="block text-xs text-gray-600">
                  Longitude (optional)
                  <input
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.overrideLng}
                    onChange={(e) => setForm((f) => ({ ...f, overrideLng: e.target.value }))}
                    inputMode="decimal"
                    placeholder="Leave empty for auto"
                  />
                </label>
              </div>
            </section>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-light rounded-md hover:bg-[#23471f] disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthGuard>
  );
}
