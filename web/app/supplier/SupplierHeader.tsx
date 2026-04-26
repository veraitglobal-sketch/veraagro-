'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const nav = [
  { href: '/supplier/dashboard', label: 'Home' },
  { href: '/supplier/catalog', label: 'Catalog' },
  { href: '/supplier/orders', label: 'Orders' },
  { href: '/supplier/messages', label: 'Messages' },
  { href: '/supplier/settings', label: 'Settings' },
] as const;

export default function SupplierHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Link href="/supplier/dashboard" className="flex items-center">
            <Image src="/logo1.png" alt="Bio Vera" width={56} height={20} className="h-4 w-auto" />
          </Link>
          <span className="text-xs text-gray-500">Partner store</span>
        </div>
        <nav className="flex flex-wrap gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 text-sm rounded-md ${
                pathname === item.href ? 'bg-[#2D5A27]/10 text-[#2D5A27] font-medium' : 'text-gray-600 hover:text-[#2D5A27]'
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
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
