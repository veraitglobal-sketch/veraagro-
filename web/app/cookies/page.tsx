'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function CookiesPage() {
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
          <h1 className="text-4xl font-light text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-500 text-sm mb-12">Last updated: January 2026</p>
          
          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">1. What Are Cookies and Similar Technologies</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                Cookies are small text files that are placed on your computer, tablet, or mobile device when you visit a website. 
                They are widely used to make websites work more efficiently, provide information to website owners, and enhance user experience.
              </p>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                In addition to cookies, we may use other similar technologies, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Web Beacons:</strong> Small graphic images embedded in web pages or emails to track user activity</li>
                <li><strong>Local Storage:</strong> Browser storage mechanisms that allow websites to store data locally on your device</li>
                <li><strong>Session Storage:</strong> Temporary storage that persists only for the duration of your browser session</li>
                <li><strong>Pixel Tags:</strong> Invisible images used to track user behavior and measure campaign effectiveness</li>
                <li><strong>Fingerprinting:</strong> Techniques that collect information about your device configuration to identify you</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                For the purposes of this Cookie Policy, references to "cookies" include all similar technologies unless otherwise specified.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                Bio Vera uses cookies to enhance your experience on our platform. We use cookies for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Required for the platform to function properly (authentication, security)</li>
                <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our platform</li>
                <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Collect information about how you use our platform to improve it</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">3. Types of Cookies We Use</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Essential Cookies (Strictly Necessary)</h3>
                  <p className="text-gray-600 font-light leading-relaxed mb-4">
                    These cookies are absolutely necessary for the platform to function and cannot be switched off. They are usually set 
                    in response to actions made by you, such as setting privacy preferences, logging in, or filling in forms. These cookies 
                    include:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                    <li><strong>Authentication Cookies:</strong> Store your login session and authentication tokens</li>
                    <li><strong>Security Cookies:</strong> Protect against cross-site request forgery (CSRF) and other security threats</li>
                    <li><strong>Session Management:</strong> Maintain your session state and preferences during your visit</li>
                    <li><strong>Load Balancing:</strong> Distribute traffic across servers to ensure optimal performance</li>
                    <li><strong>Cookie Consent:</strong> Remember your cookie preferences and consent choices</li>
                  </ul>
                  <p className="text-gray-600 font-light leading-relaxed mt-4">
                    <strong>Retention:</strong> Session cookies (deleted when you close your browser) or up to 1 year for persistent cookies.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Analytics and Performance Cookies</h3>
                  <p className="text-gray-600 font-light leading-relaxed mb-4">
                    These cookies help us understand how visitors interact with our platform by collecting and reporting information 
                    anonymously. They allow us to count visits, identify traffic sources, and understand which pages are most popular. 
                    This information helps us improve the user experience and platform performance. These cookies include:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                    <li><strong>Usage Analytics:</strong> Track page views, user flows, and feature usage</li>
                    <li><strong>Performance Monitoring:</strong> Measure page load times and identify performance issues</li>
                    <li><strong>Error Tracking:</strong> Identify and diagnose technical errors and bugs</li>
                    <li><strong>Conversion Tracking:</strong> Measure the effectiveness of features and user journeys</li>
                  </ul>
                  <p className="text-gray-600 font-light leading-relaxed mt-4">
                    <strong>Retention:</strong> Up to 2 years. You can opt-out of analytics cookies through your browser settings or our 
                    cookie preferences.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Functionality and Preference Cookies</h3>
                  <p className="text-gray-600 font-light leading-relaxed mb-4">
                    These cookies remember your choices and preferences (such as language, region, display settings, or accessibility options) 
                    to provide a more personalized and convenient experience. They include:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                    <li><strong>Language Preferences:</strong> Remember your selected language (English, Serbian, German)</li>
                    <li><strong>Display Settings:</strong> Store your UI preferences and display options</li>
                    <li><strong>Accessibility Options:</strong> Remember accessibility settings and accommodations</li>
                    <li><strong>Form Data:</strong> Temporarily store form data to prevent data loss</li>
                  </ul>
                  <p className="text-gray-600 font-light leading-relaxed mt-4">
                    <strong>Retention:</strong> Up to 1 year or until you clear your browser data.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Targeting and Advertising Cookies</h3>
                  <p className="text-gray-600 font-light leading-relaxed mb-4">
                    These cookies may be set through our site by our advertising partners to build a profile of your interests and show 
                    you relevant content on other sites. They do not store directly personal information but are based on uniquely identifying 
                    your browser and internet device. Currently, Bio Vera does not use targeting or advertising cookies, but we reserve the 
                    right to use them in the future with your consent.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">4. Third-Party Cookies and Services</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                In addition to our own cookies, we may also use various third-party cookies and services to enhance functionality, 
                provide services, and analyze usage. These third parties may set their own cookies on your device. We do not control 
                these third-party cookies, and their use is governed by the respective third party's privacy policy. These include:
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">4.1. Payment Processing Services</h3>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                Our payment processors may set cookies to securely process transactions, prevent fraud, and manage payment sessions. 
                These cookies are essential for payment functionality and are subject to the payment processor's privacy policy.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">4.2. Mapping and Location Services</h3>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We use mapping services (such as OpenStreetMap) for GPS tracking, route optimization, and location features. These services 
                may set cookies to provide mapping functionality and improve location accuracy.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">4.3. Analytics Services</h3>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We may use analytics services to understand how users interact with our platform. These services use cookies to collect 
                information about your use of the Service. The information generated is typically transmitted to and stored by the analytics 
                service provider.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">4.4. Cloud Infrastructure Providers</h3>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                Our cloud infrastructure providers may set cookies for load balancing, security, and performance optimization. These 
                cookies are necessary for the Service to function properly.
              </p>

              <p className="text-gray-600 font-light leading-relaxed mt-4">
                We recommend that you review the privacy policies of these third-party services to understand their cookie practices. 
                We are not responsible for the privacy practices of third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">5. Managing and Controlling Cookies</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                You have several options for managing and controlling cookies. Please keep in mind that removing or blocking certain cookies 
                may impact your user experience, and some features of our platform may no longer function properly:
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">5.1. Browser Settings</h3>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                Most web browsers allow you to control cookies through their settings. You can typically:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>View and delete cookies stored on your device</li>
                <li>Block all cookies or only third-party cookies</li>
                <li>Set your browser to notify you before cookies are placed</li>
                <li>Delete cookies automatically when you close your browser</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                Instructions for managing cookies in popular browsers:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies and site permissions</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">5.2. Platform Cookie Preferences</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                You can manage your cookie preferences through your account settings on the Bio Vera platform. This allows you to opt-in 
                or opt-out of non-essential cookies while maintaining essential functionality.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">5.3. Opt-Out Tools</h3>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                You can use industry opt-out tools to manage cookies from specific service providers:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Your Online Choices:</strong> <a href="http://www.youronlinechoices.com" target="_blank" rel="noopener noreferrer" className="text-[#2D5A27] hover:underline">www.youronlinechoices.com</a> (for EU users)</li>
                <li><strong>Network Advertising Initiative:</strong> <a href="http://www.networkadvertising.org" target="_blank" rel="noopener noreferrer" className="text-[#2D5A27] hover:underline">www.networkadvertising.org</a></li>
                <li><strong>Digital Advertising Alliance:</strong> <a href="http://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-[#2D5A27] hover:underline">www.aboutads.info</a></li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">5.4. Mobile Device Settings</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                On mobile devices, you can manage cookies through your device settings or within the Bio Vera mobile application. 
                Note that blocking cookies may affect app functionality.
              </p>

              <p className="text-gray-600 font-light leading-relaxed mt-4">
                <strong>Important:</strong> If you choose to block essential cookies, you may not be able to access certain features 
                of the Service, including login functionality, transaction processing, and core platform features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">6. Cookie Duration and Retention</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                Cookies can be either "persistent" or "session" cookies:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Session Cookies:</strong> Temporary cookies that are stored only during your browser session and are 
                automatically deleted when you close your browser. These are essential for the Service to function during your visit.</li>
                <li><strong>Persistent Cookies:</strong> Remain on your device for a predetermined period (ranging from days to years) 
                or until you manually delete them. These cookies remember your preferences and settings for future visits.</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4 mb-4">
                <strong>Our Cookie Retention Periods:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Session duration or up to 1 year</li>
                <li><strong>Analytics Cookies:</strong> Up to 2 years</li>
                <li><strong>Preference Cookies:</strong> Up to 1 year or until you clear browser data</li>
                <li><strong>Authentication Cookies:</strong> Session duration or up to 30 days (depending on "Remember Me" selection)</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                You can delete cookies at any time through your browser settings. However, deleting cookies may require you to re-enter 
                preferences and may affect your user experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">7. Do Not Track Signals</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                Some browsers include a "Do Not Track" (DNT) feature that signals to websites you visit that you do not want to have 
                your online activity tracked. Currently, there is no industry standard for how DNT signals should be interpreted. 
                Bio Vera does not currently respond to DNT browser signals or mechanisms. However, you can control cookies through 
                your browser settings as described above.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">8. Updates to This Cookie Policy</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices, technology, legal requirements, 
                or for other operational, legal, or regulatory reasons. When we make changes, we will:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Update the "Last updated" date at the top of this policy</li>
                <li>Notify you of material changes through email or prominent notice on the Service</li>
                <li>Request your consent for any new types of cookies that require consent</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                Your continued use of the Service after any changes to this Cookie Policy constitutes your acceptance of the updated policy. 
                We encourage you to review this Cookie Policy periodically to stay informed about our use of cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">9. Contact Us</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                If you have any questions, concerns, or requests regarding this Cookie Policy or our use of cookies, please contact us at:
                <br />
                <strong>Bio Vera</strong><br />
                Email: <a href="mailto:privacy@biovera.app" className="text-[#2D5A27] hover:underline">privacy@biovera.app</a>
              </p>
            </section>
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
