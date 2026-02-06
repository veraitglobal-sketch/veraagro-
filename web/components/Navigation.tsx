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
        { href: '/growers', label: 'For Growers' },
        { href: '/suppliers', label: 'For Suppliers' },
        { href: '/logistics-partner', label: 'For Logistics' },
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
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/logo1.png"
              alt="Bio Vera"
              width={140}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-green-600 border-b-2 border-green-600 pb-1'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                {(() => {
                  const userRoles: string[] = user?.roles && Array.isArray(user.roles) 
                    ? user.roles 
                    : user?.role 
                      ? [user.role] 
                      : [];
                  
                  // Get dashboard link based on roles
                  const getDashboardLink = () => {
                    if (userRoles.includes('GROWER') || userRoles.includes('FARMER')) return '/grower';
                    if (userRoles.includes('BUYER')) return '/buyer-portal';
                    if (userRoles.includes('LOGISTICS_PARTNER')) return '/logistics-partner';
                    if (userRoles.includes('COORDINATOR')) return '/coordinator';
                    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN')) return '/admin';
                    return '/';
                  };
                  
                  return (
                    <Link
                      href={getDashboardLink()}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
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
                href="/login/buyer"
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
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

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm font-medium ${
                  isActive(link.href) ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                {(() => {
                  const userRoles: string[] = user?.roles && Array.isArray(user.roles) 
                    ? user.roles 
                    : user?.role 
                      ? [user.role] 
                      : [];
                  
                  const getDashboardLink = () => {
                    if (userRoles.includes('GROWER') || userRoles.includes('FARMER')) return '/grower';
                    if (userRoles.includes('BUYER')) return '/buyer-portal';
                    if (userRoles.includes('LOGISTICS_PARTNER')) return '/logistics-partner';
                    if (userRoles.includes('COORDINATOR')) return '/coordinator';
                    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('ADMIN')) return '/admin';
                    return '/';
                  };
                  
                  return (
                    <Link
                      href={getDashboardLink()}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 text-center mb-3"
                    >
                      Dashboard
                    </Link>
                  );
                })()}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-sm font-medium text-gray-600 hover:text-red-600"
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
