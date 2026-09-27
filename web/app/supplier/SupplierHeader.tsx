'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';

export default function SupplierHeader() {
  const { t, i18n } = useTranslation();
  const nav = useMemo(
    () =>
      [
        { href: '/supplier/dashboard', label: t('supplier.nav.home') },
        { href: '/supplier/catalog', label: t('supplier.nav.shop', { defaultValue: t('supplier.nav.catalog') }) },
        { href: '/supplier/orders', label: t('supplier.nav.orders') },
        { href: '/supplier/messages', label: t('supplier.nav.messages') },
        { href: '/supplier/package-badges', label: t('supplier.nav.badges') },
        { href: '/supplier/package-badges/print-order', label: t('supplier.nav.printOrder') },
        { href: '/supplier/settings', label: t('supplier.nav.settings') },
      ] as const,
    [t, i18n.language],
  );
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Link href="/supplier/dashboard" className="flex items-center">
            <BrandLogo alt="Bio Vera" />
          </Link>
          <span className="text-xs text-gray-500">{t('supplier.header.badge')}</span>
        </div>
        <nav className="flex flex-wrap gap-1">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === '/supplier/package-badges' &&
                Boolean(pathname?.startsWith('/supplier/package-badges')) &&
                !pathname?.startsWith('/supplier/package-badges/print-order'));
            return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 text-sm rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/25 focus-visible:ring-offset-2 ${
                active ? 'bg-[#2D5A27]/10 text-[#2D5A27] font-medium' : 'text-gray-600 hover:text-[#2D5A27]'
              }`}
            >
              {item.label}
            </Link>
          );
          })}
        </nav>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {user && (
            <span className="hidden sm:inline text-xs">
              {user.firstName} · <code className="text-gray-800">{user.partnerCode}</code>
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="text-xs text-red-600 hover:underline"
          >
            {t('supplier.header.logOut')}
          </button>
        </div>
      </div>
    </header>
  );
}
