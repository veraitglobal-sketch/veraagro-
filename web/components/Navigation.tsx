'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';

export default function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path);

  // Simplified navigation - only basic links, detailed navigation is in sidebar
  const getNavLinks = () => {
    if (!isAuthenticated || !user) {
      return [
        { href: '/', label: 'Home' },
        { href: '/#how-it-works', label: 'How it works' },
        { href: '/for-buyers', label: 'For Buyers' },
        { href: '/growers', label: 'For Growers' },
        { href: '/suppliers', label: 'For Suppliers' },
        { href: '/logistics-partner', label: 'For Logistics' },
        { href: '/contact', label: 'Contact' },
      ];
    }

    // For authenticated users, show minimal navigation
    // All detailed navigation is in the sidebar when they open their dashboard
    return [
      { href: '/', label: 'Home' },
      { href: '/help-center', label: 'Help Center' },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo — left */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <Image
              src="/logo1.png"
              alt="Bio Vera"
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
                  isActive(link.href)
                    ? 'text-[#2D5A27] border-b-2 border-[#2D5A27]'
                    : 'text-gray-800 hover:text-[#2D5A27]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Login / Dashboard — desno */}
          <div className="hidden md:flex flex-shrink-0 items-center gap-4 ml-auto">
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
                    if (userRoles.includes('COORDINATOR')) return '/coordinator';
                    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN')) return '/admin';
                    return '/';
                  };
                  
                  return (
                    <Link
                      href={getDashboardLink()}
                      className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors"
                    >
                      Dashboard
                    </Link>
                  );
                })()}
                <button
                  onClick={logout}
                  className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu — right, 44px min touch target */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 -mr-2"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
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
                  isActive(link.href) ? 'text-[#2D5A27]' : 'text-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center min-h-[44px] px-4 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] mt-2"
              >
                Login
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
                    if (userRoles.includes('COORDINATOR')) return '/coordinator';
                    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN')) return '/admin';
                    return '/';
                  };
                  
                  return (
                    <Link
                      href={getDashboardLink()}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center min-h-[44px] px-4 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] mt-2"
                    >
                      Dashboard
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
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}
