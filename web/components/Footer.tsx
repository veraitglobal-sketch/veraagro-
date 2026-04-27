'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

/**
 * Shared footer – same as main page. Use on all public pages for consistency.
 */
export default function Footer() {
  const loc = useLocalizedHref();

  return (
    <footer className="border-t border-gray-200 py-10 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 sm:gap-10 md:gap-12 mb-8 md:mb-12">
          <div className="flex flex-col">
            <Link href={loc('/')} className="mb-4 flex items-center" style={{ minHeight: '1.25rem', marginTop: '-0.25rem' }}>
              <Image
                src="/logo1.png"
                alt="Bio Vera"
                width={56}
                height={20}
                className="h-4 w-auto"
                style={{ display: 'block', background: 'transparent', objectFit: 'contain' }}
              />
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              A vertically integrated agricultural network for Bio-Ready certification
              and EU market compliance.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Apple
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 2.807a.998.998 0 0 1 0 1.414l-2.807 2.807 2.113 2.113a.996.996 0 0 1 0 1.414L17.314 20.2a.996.996 0 0 1-1.414 0l-2.113-2.113-2.302 2.302-2.113-2.113 8.635-8.635 2.113 2.113zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.634z"/></svg>
                Android
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center" style={{ minHeight: '1.25rem' }}>Product</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li><Link href={loc('/growers')} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">For Growers</Link></li>
              <li><Link href={loc('/suppliers')} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">For Suppliers</Link></li>
              <li><Link href="/logistics-partner" className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">For Logistics</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Company</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li><Link href={loc('/about')} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">About</Link></li>
              <li><Link href={loc('/careers')} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">Careers</Link></li>
              <li><Link href={loc('/press')} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">Press Kit</Link></li>
              <li><Link href={`${loc('/')}#vision`} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">Vision</Link></li>
              <li><Link href={`${loc('/')}#roadmap`} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">Roadmap</Link></li>
              <li><Link href={loc('/contact')} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Support</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li><Link href={loc('/faq')} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">FAQ</Link></li>
              <li><Link href={loc('/help-center')} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">Help Center</Link></li>
              <li><Link href={loc('/security')} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li><Link href={loc('/legal')} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">Legal</Link></li>
              <li><Link href={loc('/privacy')} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">Privacy</Link></li>
              <li><Link href={loc('/cookies')} className="inline-flex items-center min-h-[44px] py-2 hover:text-[#2D5A27] transition-colors">Cookie Policy</Link></li>
              <li>
                <button
                  type="button"
                  onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('cookie-consent-open'))}
                  className="inline-flex items-center min-h-[44px] py-2 text-left hover:text-[#2D5A27] transition-colors"
                >
                  Manage cookies
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6 md:pt-8 text-center text-xs sm:text-sm text-gray-500">
          <p>&copy; 2026 Bio Vera. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
