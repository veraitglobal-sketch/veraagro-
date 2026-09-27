'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { authAPI } from '@/lib/api';
import Footer from '@/components/Footer';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

export default function BuyerRegisterPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    companyPosition: '',
    address: '',
    city: '',
  });

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError(t('buyerRegister.errGeoUnsupported'));
      return;
    }

    setGettingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();
          if (data.address) {
            setFormData((prev) => ({
              ...prev,
              address: data.address.road
                ? `${data.address.road}${data.address.house_number ? ' ' + data.address.house_number : ''}`
                : prev.address,
              city: data.address.city || data.address.town || data.address.village || prev.city,
            }));
          }
        } catch (err) {
          console.warn('Could not reverse geocode:', err);
        }

        setGettingLocation(false);
      },
      () => {
        setError(t('buyerRegister.errGeoDenied'));
        setGettingLocation(false);
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.email || !formData.firstName || !formData.lastName || !formData.password) {
      setError(t('buyerRegister.errRequired'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('buyerRegister.errPasswordShort'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('buyerRegister.errPasswordMismatch'));
      return;
    }

    if (location && (!formData.address || !formData.city)) {
      setError(t('buyerRegister.errLocationNeedsAddress'));
      return;
    }

    try {
      setLoading(true);

      await authAPI.registerBuyer({
        email: formData.email,
        phone: formData.phone || undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        businessName: formData.businessName || undefined,
        companyPosition: formData.companyPosition || undefined,
        location: location || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
      });

      setSuccess(true);

      setTimeout(() => {
        router.push(loc('/login/buyer'));
      }, 2000);
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const raw =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : undefined;
      const apiMsg =
        typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.filter(Boolean).join(' ') : undefined;
      const message =
        apiMsg ||
        (err instanceof Error ? err.message : null) ||
        t('buyerRegister.errRegistrationFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-[#2D5A27]/10 to-white px-6 pb-16 pt-12 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="shadow-subtle rounded-lg border border-gray-200 bg-white p-8"
          >
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-light text-gray-900">{t('buyerRegister.title')}</h1>
              <p className="text-sm text-gray-600">{t('buyerRegister.subtitle')}</p>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-[#2D5A27]/30 bg-[#2D5A27]/10 px-4 py-3 text-center text-sm text-[#2D5A27]"
              >
                {t('buyerRegister.success')}
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                    {t('buyerRegister.email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#2D5A27]"
                    placeholder={t('buyerRegister.emailPh')}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('buyerRegister.firstName')}
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#2D5A27]"
                      placeholder={t('buyerRegister.firstNamePh')}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('buyerRegister.lastName')}
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#2D5A27]"
                      placeholder={t('buyerRegister.lastNamePh')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="businessName" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('buyerRegister.businessName')}
                    </label>
                    <input
                      id="businessName"
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#2D5A27]"
                      placeholder={t('buyerRegister.businessNamePh')}
                    />
                  </div>
                  <div>
                    <label htmlFor="companyPosition" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('buyerRegister.companyPosition')}
                    </label>
                    <input
                      id="companyPosition"
                      type="text"
                      name="companyPosition"
                      value={formData.companyPosition}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#2D5A27]"
                      placeholder={t('buyerRegister.companyPositionPh')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                    {t('buyerRegister.phone')}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#2D5A27]"
                    placeholder={t('buyerRegister.phonePh')}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('buyerRegister.password')}
                    </label>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#2D5A27]"
                      placeholder={t('buyerRegister.passwordPh')}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('buyerRegister.confirmPassword')}
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#2D5A27]"
                      placeholder={t('buyerRegister.confirmPasswordPh')}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="mb-4 text-sm font-medium text-gray-900">{t('buyerRegister.sectionLocation')}</h3>
                  <p className="mb-4 text-xs text-gray-600">{t('buyerRegister.sectionLocationLead')}</p>

                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {gettingLocation ? t('buyerRegister.gettingLocation') : t('buyerRegister.useLocation')}
                    </button>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="address" className="mb-2 block text-sm font-medium text-gray-700">
                          {t('buyerRegister.address')}
                        </label>
                        <input
                          id="address"
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#2D5A27]"
                          placeholder={t('buyerRegister.addressPh')}
                        />
                      </div>

                      <div>
                        <label htmlFor="city" className="mb-2 block text-sm font-medium text-gray-700">
                          {t('buyerRegister.city')}
                        </label>
                        <input
                          id="city"
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#2D5A27]"
                          placeholder={t('buyerRegister.cityPh')}
                        />
                      </div>
                    </div>

                    {location && (
                      <p className="text-xs text-gray-500">
                        {t('buyerRegister.coords', {
                          lat: location.latitude.toFixed(6),
                          lng: location.longitude.toFixed(6),
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#2D5A27] py-3 text-sm font-medium text-white transition-colors hover:bg-[#23471f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? t('buyerRegister.submitting') : t('buyerRegister.submit')}
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-gray-200 pt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('buyerRegister.footerPrompt')}{' '}
                <Link href={loc('/login/buyer')} className="font-medium text-[#2D5A27] hover:text-[#23471f]">
                  {t('buyerRegister.footerSignIn')}
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
