'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';

interface SidebarLayoutProps {
  children: ReactNode;
  title: string;
  navItems: Array<{
    href: string;
    label: string;
    icon?: ReactNode;
  }>;
}

export default function SidebarLayout({ children, title, navItems }: SidebarLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 border-b border-gray-200 flex items-center px-6 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <Image
            src="/logo1.png"
            alt="Bio Vera"
            width={56}
            height={20}
            className="h-4 w-auto"
          />
        </Link>
      </div>

      {/* Navigation - touch-friendly on mobile */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-[#2D5A27]/10 text-[#2D5A27] border border-[#2D5A27]/30'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Logged in as</p>
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
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile: overlay when drawer open */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar: drawer on mobile (slide in), always visible on desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50
          transition-transform duration-200 ease-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="md:pl-64 min-h-screen flex flex-col">
        {/* Top Bar - menu button on mobile */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center gap-4 px-4 md:px-6">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 -ml-1"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate flex-1">{title}</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
