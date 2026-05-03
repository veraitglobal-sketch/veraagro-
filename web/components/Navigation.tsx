'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

const LOCALE_HOME_PREFIXES = ['/en', '/sr', '/de', '/ro', '/bg', '/fr', '/es'] as const;

function isNavActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  const p = pathname.replace(/\/$/, '') || '/';
  const h = href.replace(/\/$/, '') || '/';
  /** Home (`/de`, `/en`, …): match exact path only, not every child under the locale */
  if (LOCALE_HOME_PREFIXES.includes(h as (typeof LOCALE_HOME_PREFIXES)[number])) {
    return p === h;
  }
  return p === h || p.startsWith(`${h}/`);
}

export default function Navigation() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const loc = useLocalizedHref();

  const navLinks = useMemo(() => {
    if (!isAuthenticated || !user) {
      return [
        { href: loc('/'), label: t('nav.home') },
        { href: loc('/for-buyers'), label: t('nav.forBuyers') },
        { href: loc('/growers'), label: t('nav.forGrowers') },
        { href: loc('/suppliers'), label: t('nav.forSuppliers') },
        { href: '/logistics-partner', label: t('nav.forLogistics') },
        { href: loc('/biovera-fresh'), label: t('nav.freshConcept') },
        { href: loc('/contact'), label: t('nav.contact') },
      ];
    }
    return [
      { href: loc('/'), label: t('nav.home') },
      { href: loc('/help-center'), label: t('nav.helpCenter') },
    ];
  }, [isAuthenticated, user, t, loc, i18n.language]);

  return (
    <nav
      data-biovera-root-navigation
      className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo — left */}
          <Link href={loc('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <Image
              src="/logo1.png"
              alt={t('brand.name')}
              width={56}
              height={20}
              className="h-4 w-auto bg-transparent"
              priority
              style={{ background: 'transparent' }}
            />
          </Link>

          {/* Desktop nav — centered links; tighter gap on narrow widths to avoid wrap */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-4 lg:gap-6 h-full flex-nowrap">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors flex items-center h-full whitespace-nowrap ${
                  isNavActive(pathname, link.href)
                    ? 'text-[#2D5A27] border-b-2 border-[#2D5A27]'
                    : 'text-gray-800 hover:text-[#2D5A27]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Language + login / dashboard (right) */}
          <div className="hidden md:flex flex-shrink-0 items-center gap-3 ml-auto">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                {(() => {
                  const userRoles: string[] = user?.roles && Array.isArray(user.roles) 
                    ? user.roles 
                    : [];
                  
                  const getDashboardLink = () => {
                    if (userRoles.includes('GROWER') || userRoles.includes('FARMER')) return '/grower';
                    if (userRoles.includes('BUYER')) return '/buyer-portal';
                    if (userRoles.includes('LOGISTICS_PARTNER')) return '/logistics-partner/dashboard';
                    if (userRoles.includes('MATERIAL_SUPPLIER')) return '/supplier/dashboard';
                    if (userRoles.includes('COORDINATOR')) return '/coordinator';
                    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN')) return '/admin';
                    return loc('/');
                  };
                  
                  return (
                    <Link
                      href={getDashboardLink()}
                      className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors"
                    >
                      {t('nav.dashboard')}
                    </Link>
                  );
                })()}
                <button
                  onClick={logout}
                  className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <Link
                href={loc('/login')}
                className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>

          <div className="md:hidden ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            {/* Mobile menu — right, 44px min touch target */}
            <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 -mr-2"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - touch-friendly tap targets (min 44px) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center min-h-[44px] px-2 text-sm font-medium ${
                  isNavActive(pathname, link.href) ? 'text-[#2D5A27]' : 'text-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link
                href={loc('/login')}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center min-h-[44px] px-4 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] mt-2"
              >
                {t('nav.login')}
              </Link>
            )}
            {isAuthenticated ? (
              <>
                {(() => {
                  const userRoles: string[] = user?.roles && Array.isArray(user.roles) 
                    ? user.roles 
                    : [];
                  
                  const getDashboardLink = () => {
                    if (userRoles.includes('GROWER') || userRoles.includes('FARMER')) return '/grower';
                    if (userRoles.includes('BUYER')) return '/buyer-portal';
                    if (userRoles.includes('LOGISTICS_PARTNER')) return '/logistics-partner/dashboard';
                    if (userRoles.includes('MATERIAL_SUPPLIER')) return '/supplier/dashboard';
                    if (userRoles.includes('COORDINATOR')) return '/coordinator';
                    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN')) return '/admin';
                    return loc('/');
                  };
                  
                  return (
                    <Link
                      href={getDashboardLink()}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center min-h-[44px] px-4 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] mt-2"
                    >
                      {t('nav.dashboard')}
                    </Link>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center min-h-[44px] w-full text-left px-2 text-sm font-medium text-gray-600 hover:text-red-600"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}
