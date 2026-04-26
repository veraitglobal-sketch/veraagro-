'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function TermsPage() {
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
          <h1 className="text-4xl font-light text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-500 text-sm mb-12">Last updated: January 2026</p>
          
          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                By accessing, browsing, or using Bio Vera (the "Service"), including any subdomains, mobile applications, 
                APIs, or related services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service 
                (the "Terms") and all applicable laws and regulations. If you do not agree with any of these Terms, you are prohibited from 
                using or accessing the Service.
              </p>
              <p className="text-gray-600 font-light leading-relaxed">
                These Terms constitute a legally binding agreement between you ("User", "you", or "your") and Bio Vera ("Company", "we", "us", 
                or "our"). By creating an account, making a purchase, or using any feature of the Service, you explicitly agree to these Terms. 
                If you are using the Service on behalf of a business, organization, or other entity, you represent and warrant that you have 
                the authority to bind that entity to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">2. Use License and Restrictions</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                Subject to your compliance with these Terms, Bio Vera grants you a limited, non-exclusive, non-transferable, revocable license 
                to access and use the Service for your personal or commercial use in accordance with these Terms. This license does not include 
                any right to resell or commercially use the Service or its contents; collect and use any product listings, descriptions, or prices; 
                make derivative uses of the Service or its contents; or use data mining, robots, or similar data gathering and extraction tools.
              </p>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                You are expressly prohibited from:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Modifying, copying, reproducing, or creating derivative works of the Service, its content, or any portion thereof</li>
                <li>Using the Service or its content for any commercial purpose without our explicit written permission</li>
                <li>Attempting to reverse engineer, decompile, disassemble, or otherwise derive the source code of any software contained in the Service</li>
                <li>Removing, altering, or obscuring any copyright, trademark, patent, or other proprietary notices from the Service</li>
                <li>Using automated systems, bots, scrapers, or crawlers to access, monitor, or copy any content from the Service</li>
                <li>Interfering with or disrupting the Service, servers, or networks connected to the Service</li>
                <li>Transmitting any viruses, malware, or other harmful code through the Service</li>
                <li>Using the Service to violate any applicable laws, regulations, or third-party rights</li>
                <li>Impersonating any person or entity or falsely stating or misrepresenting your affiliation with any person or entity</li>
                <li>Collecting or storing personal data about other users without their express consent</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                Any unauthorized use of the Service immediately terminates the license granted by these Terms. We reserve the right to take 
                legal action against any unauthorized use, including seeking injunctive relief and monetary damages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                To access certain features of the Service, you must register for an account. When you create an account, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Provide accurate, current, and complete information during registration and at all times thereafter</li>
                <li>Maintain and promptly update your account information to keep it accurate, current, and complete</li>
                <li>Maintain the security and confidentiality of your account credentials, including your password</li>
                <li>Accept full responsibility for all activities that occur under your account, whether authorized by you or not</li>
                <li>Immediately notify us of any unauthorized use of your account or any other breach of security</li>
                <li>Ensure that you are at least 18 years of age or have the legal capacity to enter into binding contracts in your jurisdiction</li>
                <li>Not create multiple accounts for the same person or entity without our express written permission</li>
                <li>Not transfer, sell, or assign your account to any third party without our prior written consent</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                We reserve the right to suspend or terminate your account at any time, with or without notice, if we determine that you have 
                violated these Terms, provided false information, or engaged in fraudulent, abusive, or illegal activity. You may not use 
                another user's account without their express permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">4. Platform Services and Description</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                Bio Vera operates a vertically integrated agricultural network that connects growers, suppliers, logistics partners, and buyers 
                worldwide. Our services include, but are not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Digital Marketplace:</strong> Platform for buying and selling agricultural products with transparent pricing and quality standards</li>
                <li><strong>Traceability Systems:</strong> Complete product journey tracking from field to shelf with immutable digital proof</li>
                <li><strong>Quality Assurance:</strong> Multi-level quality control systems including Protocol 360 compliance verification</li>
                <li><strong>Logistics Coordination:</strong> Transportation management, route optimization, and delivery tracking</li>
                <li><strong>Payment Processing:</strong> Escrow services, settlement to partners under agreed terms, and financial transaction management</li>
                <li><strong>Certification Management:</strong> GlobalG.A.P. IFA v6 group certification facilitation and compliance tracking</li>
                <li><strong>Mobile Applications:</strong> Field management, logistics tracking, and buyer portal applications</li>
                <li><strong>Data Analytics:</strong> Supply chain insights, market intelligence, and performance metrics</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice. 
                We do not guarantee that the Service will be available at all times or that it will be error-free. We may perform scheduled 
                or unscheduled maintenance that may result in temporary unavailability of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">5. Prohibited Uses and Activities</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                You agree not to use the Service in any manner that:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Violates any applicable local, state, national, or international law, regulation, or treaty</li>
                <li>Infringes upon, violates, or misappropriates any intellectual property rights, privacy rights, or other rights of any third party</li>
                <li>Is fraudulent, false, misleading, or deceptive</li>
                <li>Constitutes harassment, stalking, threats, or intimidation of any person</li>
                <li>Contains or transmits any viruses, malware, trojans, worms, or other harmful or malicious code</li>
                <li>Attempts to gain unauthorized access to the Service, other accounts, computer systems, or networks</li>
                <li>Interferes with, disrupts, or damages the Service, servers, or networks connected to the Service</li>
                <li>Uses automated systems, bots, scrapers, or crawlers to access, monitor, or copy content without authorization</li>
                <li>Impersonates any person or entity, including Bio Vera employees, representatives, or other users</li>
                <li>Collects, stores, or shares personal information about other users without their express consent</li>
                <li>Transmits unsolicited commercial communications, spam, or promotional materials</li>
                <li>Manipulates prices, creates artificial demand, or engages in any form of market manipulation</li>
                <li>Circumvents or attempts to circumvent any security measures, access controls, or usage restrictions</li>
                <li>Uses the Service to compete with Bio Vera or to develop competing products or services</li>
                <li>Violates any export control laws or regulations</li>
                <li>Engages in any activity that could damage, disable, overburden, or impair the Service</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                Violation of these prohibitions may result in immediate termination of your account, legal action, and reporting to 
                appropriate law enforcement authorities. We reserve the right to investigate any suspected violation and cooperate 
                fully with law enforcement in such investigations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">6. Intellectual Property Rights</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                The Service, including its original content, features, functionality, design, logos, trademarks, trade names, software, 
                algorithms, databases, and all other intellectual property rights therein, are and will remain the exclusive property of 
                Bio Vera and its licensors. The Service is protected by copyright, trademark, patent, trade secret, and other intellectual 
                property laws of Germany, the European Union, and international treaties.
              </p>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                You acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>All rights, title, and interest in and to the Service belong exclusively to Bio Vera</li>
                <li>You do not acquire any ownership rights by using the Service</li>
                <li>You may not use our trademarks, logos, or brand names without our prior written consent</li>
                <li>Any feedback, suggestions, or ideas you provide about the Service may be used by us without compensation or obligation</li>
                <li>User-generated content you submit grants us a worldwide, royalty-free, perpetual, irrevocable, non-exclusive license to use, 
                reproduce, modify, adapt, publish, translate, and distribute such content</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                If you believe that any content on the Service infringes your intellectual property rights, please contact us immediately 
                at <a href="mailto:legal@biovera.app" className="text-[#2D5A27] hover:underline">legal@biovera.app</a> with detailed information 
                about the alleged infringement, and we will investigate and respond in accordance with applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">7. Disclaimers and Limitation of Liability</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                <strong>Service Provided "As Is":</strong> The Service is provided on an "as is" and "as available" basis. Bio Vera makes no 
                representations or warranties of any kind, express or implied, regarding the Service, including but not limited to warranties 
                of merchantability, fitness for a particular purpose, non-infringement, accuracy, completeness, or reliability. We do not 
                warrant that the Service will be uninterrupted, secure, error-free, or free from viruses or other harmful components.
              </p>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                <strong>No Guarantees:</strong> We do not guarantee the accuracy, completeness, or usefulness of any information on the Service. 
                We are not responsible for any errors or omissions in content, or for any loss or damage resulting from reliance on information 
                obtained through the Service. Product descriptions, prices, availability, and other information are subject to change without notice.
              </p>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                <strong>Limitation of Liability:</strong> To the maximum extent permitted by applicable law, in no event shall Bio Vera, its 
                directors, officers, employees, agents, partners, suppliers, affiliates, or licensors be liable for any indirect, incidental, 
                special, consequential, punitive, or exemplary damages, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Loss of profits, revenue, data, use, goodwill, or other intangible losses</li>
                <li>Business interruption or loss of business opportunities</li>
                <li>Cost of procurement of substitute goods or services</li>
                <li>Personal injury or property damage</li>
                <li>Damages resulting from unauthorized access to or alteration of your data</li>
                <li>Damages resulting from your use or inability to use the Service</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                Our total liability to you for all claims arising from or related to the Service shall not exceed the amount you paid to us 
                in the twelve (12) months preceding the claim, or one hundred euros (€100), whichever is greater. Some jurisdictions do not 
                allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">8. Indemnification</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                You agree to defend, indemnify, and hold harmless Bio Vera, its directors, officers, employees, agents, partners, suppliers, 
                affiliates, and licensors from and against any and all claims, damages, obligations, losses, liabilities, costs, debts, and 
                expenses (including but not limited to attorney's fees) arising from: (a) your use of and access to the Service; (b) your violation 
                of any term of these Terms; (c) your violation of any third-party right, including without limitation any copyright, property, 
                privacy, or other right; (d) any claim that your content caused damage to a third party; or (e) your violation of any applicable 
                law, rule, or regulation. This defense and indemnification obligation will survive these Terms and your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">9. Termination</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, 
                including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Breach of these Terms or any other agreement between you and Bio Vera</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Provision of false, inaccurate, or misleading information</li>
                <li>Non-payment of fees or charges when due</li>
                <li>Extended period of account inactivity</li>
                <li>Request by law enforcement or other government agencies</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                Upon termination, your right to use the Service will immediately cease. All provisions of these Terms which by their nature 
                should survive termination shall survive termination, including ownership provisions, warranty disclaimers, indemnity, and 
                limitations of liability. You may terminate your account at any time by contacting us at 
                <a href="mailto:support@biovera.app" className="text-[#2D5A27] hover:underline"> support@biovera.app</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">10. Dispute Resolution</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                <strong>Informal Resolution:</strong> Before filing a claim, you agree to try to resolve the dispute informally by contacting 
                us at <a href="mailto:legal@biovera.app" className="text-[#2D5A27] hover:underline">legal@biovera.app</a>. We will try to resolve 
                the dispute informally within 60 days.
              </p>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                <strong>Governing Law and Jurisdiction:</strong> These Terms shall be governed by and construed in accordance with the laws of 
                Germany, without regard to its conflict of law provisions. Any disputes arising out of or relating to these Terms or the Service 
                shall be subject to the exclusive jurisdiction of the courts of Hamburg, Germany.
              </p>
              <p className="text-gray-600 font-light leading-relaxed">
                <strong>Class Action Waiver:</strong> You agree that any dispute resolution proceedings will be conducted only on an individual 
                basis and not in a class, consolidated, or representative action. You waive any right to participate in a class action lawsuit 
                or class-wide arbitration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">11. Force Majeure</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                Bio Vera shall not be liable for any failure or delay in performance under these Terms which is due to earthquake, fire, flood, 
                act of God, act of war, terrorism, epidemic, pandemic, labor dispute, civil unrest, government action, internet or telecommunications 
                failure, or other causes beyond our reasonable control. In such event, we will use reasonable efforts to notify you and resume 
                performance as soon as practicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">12. Third-Party Services and Links</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                The Service may contain links to third-party websites, services, or resources that are not owned or controlled by Bio Vera. 
                We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party 
                services. You acknowledge and agree that Bio Vera shall not be responsible or liable for any damage or loss caused by or in 
                connection with the use of any such third-party services. We encourage you to read the terms and conditions and privacy policies 
                of any third-party services you visit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">13. Data Accuracy and User Content</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                You are solely responsible for the accuracy, completeness, and legality of all information, data, and content you submit to 
                the Service, including but not limited to product listings, field entries, delivery information, and user profiles. You represent 
                and warrant that:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>All information you provide is accurate, current, and complete</li>
                <li>You have the right to submit such content and grant us the licenses described in these Terms</li>
                <li>Your content does not violate any third-party rights, including intellectual property, privacy, or publicity rights</li>
                <li>Your content complies with all applicable laws and regulations</li>
                <li>Your content does not contain any viruses, malware, or other harmful code</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                We reserve the right to remove, edit, or refuse to post any content that violates these Terms or that we determine, in our 
                sole discretion, is objectionable, harmful, or inappropriate.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">14. Export Restrictions</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                The Service may be subject to export control laws and regulations. You agree to comply with all applicable export and re-export 
                control laws and regulations, including those of Germany, the European Union, and the United States. You agree not to export, 
                re-export, or transfer the Service or any related technology to any country, person, or entity subject to export restrictions, 
                or in violation of any applicable export control laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">15. Compliance with Laws</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                You agree to comply with all applicable laws, rules, and regulations in connection with your use of the Service, including but 
                not limited to agricultural regulations, food safety laws, transportation regulations, data protection laws (including GDPR), 
                anti-corruption laws, and export control laws. You are solely responsible for ensuring that your use of the Service complies 
                with all applicable laws in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">16. Changes to Terms</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will 
                provide at least 30 days notice prior to any new terms taking effect by posting the updated Terms on this page and updating 
                the "Last updated" date. What constitutes a material change will be determined at our sole discretion. Your continued use of the 
                Service after any such changes constitutes your acceptance of the new Terms. If you do not agree to the new Terms, you must 
                stop using the Service and may terminate your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">17. Severability</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the 
                minimum extent necessary so that these Terms will otherwise remain in full force and effect and enforceable. The unenforceable 
                provision will be replaced with a valid provision that comes closest to the intent of the original provision.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">18. Entire Agreement</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and Bio Vera 
                regarding the Service and supersede all prior and contemporaneous agreements, proposals, or representations, whether written 
                or oral, concerning the Service. Our failure to enforce any right or provision of these Terms will not be considered a waiver 
                of those rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">19. Assignment</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                You may not assign or transfer these Terms, by operation of law or otherwise, without our prior written consent. Any attempt 
                by you to assign or transfer these Terms without such consent will be null and void. We may freely assign or transfer these 
                Terms without restriction. Subject to the foregoing, these Terms will bind and inure to the benefit of the parties, their 
                successors, and permitted assigns.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">20. Contact Information</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                If you have any questions about these Terms, please contact us at:
                <br />
                <strong>Bio Vera</strong><br />
                Email: <a href="mailto:legal@biovera.app" className="text-[#2D5A27] hover:underline">legal@biovera.app</a><br />
                Support: <a href="mailto:support@biovera.app" className="text-[#2D5A27] hover:underline">support@biovera.app</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                If you have any questions about these Terms, please contact us at:
                <br />
                <a href="mailto:legal@biovera.app" className="text-[#2D5A27] hover:underline">legal@biovera.app</a>
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
                A vertically integrated agricultural network for Bio-Ready certification 
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
