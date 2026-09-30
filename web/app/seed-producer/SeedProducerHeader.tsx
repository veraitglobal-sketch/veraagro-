'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';

export default function SeedProducerHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const nav = [
    { href: '/seed-producer', label: t('seedProducer.nav.runs') },
    { href: '/seed-producer/profile', label: t('seedProducer.nav.profile') },
  ];

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Link href="/seed-producer" className="flex items-center">
            <BrandLogo alt="Bio Vera" />
          </Link>
          <span className="text-xs text-gray-500">{t('seedProducer.header.badge')}</span>
        </div>
        <nav className="flex flex-wrap gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 text-sm rounded-md ${
                pathname === item.href || (item.href === '/seed-producer' && pathname?.startsWith('/seed-producer/runs'))
                  ? 'bg-[#2D5A27]/10 text-[#2D5A27] font-medium'
                  : 'text-gray-600 hover:text-[#2D5A27]'
              }`}
            >
              {item.label}
            </Link>
          ))}
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
            {t('seedProducer.header.logOut')}
          </button>
        </div>
      </div>
    </header>
  );
}
