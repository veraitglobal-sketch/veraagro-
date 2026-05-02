'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { b2bSupplierPortalAPI, usersAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { KeyRound, MapPin, Store, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SupplierSettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [mapApproved, setMapApproved] = useState(true);
  /** True when user has MATERIAL_SUPPLIER but no `material_supplier_profiles` row yet. */
  const [noStoreProfile, setNoStoreProfile] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdNew2, setPwdNew2] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdErr, setPwdErr] = useState<string | null>(null);
  const [pwdOk, setPwdOk] = useState<string | null>(null);
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
    setNoStoreProfile(false);
    setLoading(true);
    try {
      const p = await b2bSupplierPortalAPI.getMyProfile();
      if (!p) {
        setNoStoreProfile(true);
        setMapApproved(false);
        let me: {
          firstName?: string;
          lastName?: string;
          email?: string;
          phone?: string | null;
        } | null = null;
        try {
          me = await usersAPI.getMe();
        } catch {
          me = null;
        }
        setForm({
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
          firstName: me?.firstName != null ? String(me.firstName) : '',
          lastName: me?.lastName != null ? String(me.lastName) : '',
          email: me?.email != null ? String(me.email) : '',
          phone: me?.phone != null ? String(me.phone) : '',
        });
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
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      const basePayload: Parameters<typeof b2bSupplierPortalAPI.patchMyStore>[0] = {
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
        basePayload.latitude = latN;
        basePayload.longitude = lngN;
      }

      if (noStoreProfile) {
        if (
          !basePayload.businessName ||
          !basePayload.street ||
          !basePayload.postalCode ||
          !basePayload.city ||
          !basePayload.country
        ) {
          setErr('Fill in store name, street, postal code, city, and country to create your store profile.');
          setSaving(false);
          return;
        }
        await b2bSupplierPortalAPI.createMyStoreProfile({
          businessName: basePayload.businessName,
          description: basePayload.description,
          website: basePayload.website,
          street: basePayload.street,
          houseNumber: basePayload.houseNumber,
          postalCode: basePayload.postalCode,
          city: basePayload.city,
          country: basePayload.country,
          ...(haveBoth ? { latitude: latN, longitude: lngN } : {}),
        });
        await b2bSupplierPortalAPI.patchMyStore(basePayload);
        setNoStoreProfile(false);
        setOk('Your store profile is created. You can update details any time. Map listing may need Bio Vera approval.');
      } else {
        await b2bSupplierPortalAPI.patchMyStore(basePayload);
        setOk('Saved. If you changed address or the map pin, the listing will show as pending until Bio Vera verifies it.');
      }
      await load();
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdErr(null);
    setPwdOk(null);
    if (pwdNew.length < 8) {
      setPwdErr('New password must be at least 8 characters.');
      return;
    }
    if (pwdNew !== pwdNew2) {
      setPwdErr('New password and confirmation do not match.');
      return;
    }
    setPwdSaving(true);
    try {
      await usersAPI.changeMyPassword({ currentPassword: pwdCurrent, newPassword: pwdNew });
      setPwdOk('Password updated. Use your new password the next time you sign in on web or in the app.');
      setPwdCurrent('');
      setPwdNew('');
      setPwdNew2('');
    } catch (err: unknown) {
      setPwdErr(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setPwdSaving(false);
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

        {noStoreProfile && !loading && (
          <div className="mb-4 rounded-md border border-sky-200 bg-sky-50/90 px-3 py-2 text-sm text-sky-950">
            <p className="font-medium">First-time store setup</p>
            <p className="mt-1 font-light">
              Your login has the supplier role, but the store record was not created yet. Fill in the fields below
              (required: business name, address, contact) and press <strong>Save</strong> — this creates your store in
              Bio Vera. You do not need a second admin account if your email is already registered.
            </p>
          </div>
        )}

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
        {pwdOk && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50/80 px-3 py-2 text-sm text-green-900">
            {pwdOk}
          </div>
        )}
        {pwdErr && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{pwdErr}</div>
        )}

        {!mapApproved && !loading && !noStoreProfile && (
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

        {!loading && (
          <form
            onSubmit={(ev) => void onPasswordSubmit(ev)}
            className="mt-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm"
          >
            <h2 className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#2D5A27]" />
              Login password
            </h2>
            <p className="text-xs text-gray-500 font-light mb-4">
              If the team gave you a one-time password, set your own here (min. 8 characters). You will keep the same
              email and partner code.
            </p>
            <div className="grid sm:grid-cols-1 gap-3 max-w-md">
              <label className="block text-xs text-gray-600">
                Current password
                <input
                  type="password"
                  autoComplete="current-password"
                  className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                />
              </label>
              <label className="block text-xs text-gray-600">
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  minLength={8}
                />
              </label>
              <label className="block text-xs text-gray-600">
                Confirm new password
                <input
                  type="password"
                  autoComplete="new-password"
                  className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={pwdNew2}
                  onChange={(e) => setPwdNew2(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                disabled={pwdSaving}
                className="px-4 py-2 border border-[#2D5A27] text-[#2D5A27] text-sm font-light rounded-md hover:bg-[#2D5A27]/5 disabled:opacity-50"
              >
                {pwdSaving ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthGuard>
  );
}
