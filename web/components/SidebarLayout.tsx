'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { stripLeadingSiteLocale } from '@/lib/i18n-routing';
import { useAuth } from '@/lib/auth';
import dynamic from 'next/dynamic';
import BrandLogo from '@/components/BrandLogo';

const NotificationCenter = dynamic(() => import('@/components/NotificationCenter'), { ssr: false });

export type SidebarNavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  /** Shown on the right (e.g. pending counts) */
  badge?: string | number;
};

export type SidebarNavGroup = {
  title: string;
  items: SidebarNavItem[];
};

interface SidebarLayoutProps {
  children: ReactNode;
  title: string;
  navItems: SidebarNavItem[];
  /** Extra sections below main nav (e.g. admin “Grower ops”) */
  navGroups?: SidebarNavGroup[];
}

export default function SidebarLayout({ children, title, navItems, navGroups }: SidebarLayoutProps) {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    const p = pathname ?? '';
    const n = stripLeadingSiteLocale(p);
    const h = stripLeadingSiteLocale(href);
    return n === h || n.startsWith(`${h}/`);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 border-b border-gray-200 flex items-center px-6 flex-shrink-0">
        <Link href={loc('/')} className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <BrandLogo alt="Bio Vera" />
        </Link>
      </div>

      {/* Navigation - touch-friendly on mobile */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between gap-2 px-3 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'premium-nav-active'
                : 'text-gray-700 hover:bg-[#2D5A27]/[0.04]'
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              {item.icon}
              <span className="truncate">{item.label}</span>
            </span>
            {item.badge != null && item.badge !== '' && (
              <span className="shrink-0 text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                {item.badge}
              </span>
            )}
          </Link>
        ))}

        {navGroups && navGroups.length > 0 && (
          <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between gap-2 px-3 min-h-[40px] rounded-xl text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'premium-nav-active'
                          : 'text-gray-700 hover:bg-[#2D5A27]/[0.04]'
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge != null && item.badge !== '' && (
                        <span className="shrink-0 text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">{t('shell.loggedInAs')}</p>
          <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-gray-500">
            {(user?.roles && Array.isArray(user.roles) ? user.roles : []).map(role => role.replace(/_/g, ' ')).join(', ')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { logout(); setMobileMenuOpen(false); }}
          className="w-full min-h-[44px] px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {t('shell.logout')}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen premium-page-bg">
      {/* Mobile: overlay when drawer open */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label={t('shell.closeMenu')}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar: drawer on mobile (slide in), always visible on desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-64 premium-sidebar border-r flex flex-col z-50 shadow-[4px_0_24px_-12px_rgba(26,32,24,0.08)]
          transition-transform duration-200 ease-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="md:pl-64 min-h-screen flex flex-col">
        {/* Top Bar - menu button on mobile */}
        <header className="sticky top-0 z-30 premium-header-bar border-b h-16 flex items-center gap-4 px-4 md:px-6">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 -ml-1"
            aria-label={t('shell.openMenu')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg md:text-xl font-light tracking-tight text-gray-900 truncate flex-1">{title}</h1>
          {user?.id ? <NotificationCenter userId={user.id} /> : null}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:px-8 md:py-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
