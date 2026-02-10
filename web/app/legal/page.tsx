'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image 
                src="/logo1.png" 
                alt="Bio Vera" 
                width={56} 
                height={20} 
                className="h-4 w-auto"
                priority
              />
            </Link>
            <nav className="flex gap-8 items-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-[#2D5A27] transition-colors">
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light text-gray-900 mb-8">Legal Information</h1>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-light text-gray-900 mb-4">Legal Documents</h2>
              <p className="text-gray-600 mb-6 font-light">
                Access our legal documents and policies to understand your rights and obligations when using Bio Vera platform.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Link 
                  href="/terms"
                  className="block p-6 border border-gray-200 rounded-lg hover:border-[#2D5A27] hover:bg-[#2D5A27]/10 transition-colors"
                >
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Terms of Service</h3>
                  <p className="text-sm text-gray-600 font-light">
                    Read our terms and conditions for using the Bio Vera platform and services.
                  </p>
                </Link>
                
                <Link 
                  href="/privacy"
                  className="block p-6 border border-gray-200 rounded-lg hover:border-[#2D5A27] hover:bg-[#2D5A27]/10 transition-colors"
                >
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Privacy Policy</h3>
                  <p className="text-sm text-gray-600 font-light">
                    Learn how we collect, use, and protect your personal information.
                  </p>
                </Link>
                
                <Link 
                  href="/cookies"
                  className="block p-6 border border-gray-200 rounded-lg hover:border-[#2D5A27] hover:bg-[#2D5A27]/10 transition-colors"
                >
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Cookie Policy</h3>
                  <p className="text-sm text-gray-600 font-light">
                    Understand how we use cookies and similar technologies on our platform.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12 items-start">
            <div className="flex flex-col">
              <Link href="/" className="inline-block mb-4 -mt-1">
                <Image 
                  src="/logo1.png" 
                  alt="Bio Vera" 
                  width={56} 
                  height={20} 
                  className="h-4 w-auto"
                />
              </Link>
              <p className="text-sm text-gray-600 leading-relaxed">
                Vertically integrated agrotech platform for Bio-Ready certification 
                and EU market compliance.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/growers" className="hover:text-[#2D5A27] transition-colors">For Growers</Link></li>
                <li><Link href="/suppliers" className="hover:text-[#2D5A27] transition-colors">For Suppliers</Link></li>
                <li><Link href="/logistics-partner" className="hover:text-[#2D5A27] transition-colors">For Logistics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/#vision" className="hover:text-[#2D5A27] transition-colors">Vision</Link></li>
                <li><Link href="/#roadmap" className="hover:text-[#2D5A27] transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/legal" className="hover:text-[#2D5A27] transition-colors">Legal</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2026 Bio Vera. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
