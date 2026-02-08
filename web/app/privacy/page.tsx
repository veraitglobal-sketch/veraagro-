'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPage() {
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
                width={200} 
                height={70} 
                className="h-14 w-auto"
                priority
              />
            </Link>
            <nav className="flex gap-8 items-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500 text-sm mb-12">Last updated: January 2026</p>
          
          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">1. Introduction and Data Controller</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                Bio Vera ("we", "our", "us", or "Company") is committed to protecting your privacy and personal data. This Privacy Policy 
                explains in detail how we collect, use, process, disclose, and safeguard your information when you use our platform, mobile 
                applications, and related services (collectively, the "Service").
              </p>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                <strong>Data Controller:</strong> Bio Vera, with headquarters in Germany, is the data controller responsible for the processing 
                of your personal data. For the purposes of the General Data Protection Regulation (GDPR) and other applicable data protection 
                laws, we are the entity that determines the purposes and means of processing your personal data.
              </p>
              <p className="text-gray-600 font-light leading-relaxed">
                By using the Service, you acknowledge that you have read and understood this Privacy Policy and agree to the collection, use, 
                and disclosure of your information as described herein. If you do not agree with this Privacy Policy, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">2. Information We Collect</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We collect various types of information from and about users of our Service, including:
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">2.1. Information You Provide Directly</h3>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Account Information:</strong> Full name, email address, phone number, business name, tax identification numbers, 
                partner codes, and other registration information</li>
                <li><strong>Profile Information:</strong> Profile photos, biographical information, years of experience, generation information, 
                and other profile data you choose to provide</li>
                <li><strong>Location Data:</strong> GPS coordinates for farms, estates, parcels, delivery locations, and real-time location 
                tracking during transport missions</li>
                <li><strong>Financial Information:</strong> Payment method details, bank account information, transaction history, 
                payment preferences, and tax information</li>
                <li><strong>Transaction Data:</strong> Purchase history, order details, delivery information, product specifications, 
                pricing agreements, and contract terms</li>
                <li><strong>Content Data:</strong> Photos, documents, certificates, field entries, compliance records, quality reports, 
                and other content you upload or submit</li>
                <li><strong>Communication Data:</strong> Messages, inquiries, support requests, and other communications you send to us</li>
                <li><strong>Certification Data:</strong> GlobalG.A.P. certificates, organic certifications, compliance records, and 
                other regulatory documentation</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">2.2. Information Collected Automatically</h3>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Usage Data:</strong> How you interact with our platform, pages visited, features used, time spent, click patterns, 
                and navigation paths</li>
                <li><strong>Device Information:</strong> Device type, operating system, browser type, device identifiers, mobile network 
                information, and device settings</li>
                <li><strong>Log Data:</strong> IP addresses, access times, error logs, crash reports, and system activity logs</li>
                <li><strong>Location Information:</strong> GPS coordinates, location history, route data, and geofencing information</li>
                <li><strong>Sensor Data:</strong> Temperature readings, humidity levels, and other environmental data from IoT sensors</li>
                <li><strong>Performance Data:</strong> App performance metrics, loading times, and technical diagnostics</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">2.3. Information from Third Parties</h3>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Payment Processors:</strong> Transaction confirmations and payment status from our payment service providers</li>
                <li><strong>Logistics Partners:</strong> Delivery confirmations, transport status, and location updates</li>
                <li><strong>Certification Bodies:</strong> Certification status and compliance records from third-party certifiers</li>
                <li><strong>Service Providers:</strong> Analytics data, marketing information, and other data from our service providers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">3. How We Use Your Information and Legal Basis</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We process your personal data for the following purposes and based on the legal bases indicated:
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">3.1. Service Provision (Contract Performance)</h3>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Create and manage your account, authenticate your identity, and provide access to the Service</li>
                <li>Process transactions, orders, payments, and delivery confirmations</li>
                <li>Facilitate communication between growers, suppliers, logistics partners, and buyers</li>
                <li>Provide traceability services, quality assurance, and compliance tracking</li>
                <li>Enable logistics coordination, route optimization, and delivery management</li>
                <li>Generate digital passports, certificates, and documentation</li>
                <li>Send transaction confirmations, order updates, and service-related communications</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4"><strong>Legal Basis:</strong> Performance of contract, legitimate interest</p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">3.2. Compliance and Legal Obligations</h3>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Comply with applicable laws, regulations, and legal processes</li>
                <li>Respond to government requests, court orders, and regulatory inquiries</li>
                <li>Enforce our Terms of Service and other agreements</li>
                <li>Protect our rights, property, and safety, as well as that of our users and third parties</li>
                <li>Maintain records for tax, accounting, and regulatory compliance purposes</li>
                <li>Comply with food safety regulations, agricultural standards, and export control laws</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4"><strong>Legal Basis:</strong> Legal obligation, legitimate interest</p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">3.3. Service Improvement (Legitimate Interest)</h3>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Monitor and analyze usage patterns, trends, and performance metrics</li>
                <li>Improve, optimize, and enhance the Service functionality and user experience</li>
                <li>Develop new features, products, and services</li>
                <li>Conduct research and analytics to understand user behavior</li>
                <li>Detect, prevent, and address technical issues, security threats, and fraudulent activity</li>
                <li>Ensure platform security, integrity, and availability</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4"><strong>Legal Basis:</strong> Legitimate interest</p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">3.4. Marketing and Communications (Consent)</h3>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Send marketing communications, newsletters, and promotional materials (with your consent)</li>
                <li>Provide information about new features, products, and services</li>
                <li>Conduct surveys, research, and user feedback collection</li>
                <li>Personalize content and advertising based on your preferences</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4"><strong>Legal Basis:</strong> Consent (you may withdraw at any time)</p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We do not sell your personal data. We may share your information only in the following limited circumstances:
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">4.1. Service Providers and Business Partners</h3>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We may share your information with trusted third-party service providers who perform services on our behalf, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Payment Processors:</strong> To process payments and manage financial transactions</li>
                <li><strong>Cloud Storage Providers:</strong> To store and manage data securely</li>
                <li><strong>Analytics Services:</strong> To analyze usage patterns and improve our Service</li>
                <li><strong>Email Service Providers:</strong> To send communications and notifications</li>
                <li><strong>Logistics Partners:</strong> To coordinate deliveries and track shipments</li>
                <li><strong>Certification Bodies:</strong> To verify compliance and manage certifications</li>
                <li><strong>IT Service Providers:</strong> To maintain and support our technical infrastructure</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                All service providers are contractually obligated to protect your information and use it only for the purposes we specify.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">4.2. Business Transfers</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                In the event of a merger, acquisition, reorganization, bankruptcy, or sale of assets, your information may be transferred 
                to the acquiring entity. We will notify you of any such change in ownership or control of your personal information.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">4.3. Legal Requirements</h3>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We may disclose your information if required to do so by law or in response to valid requests by public authorities, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Court orders, subpoenas, or other legal processes</li>
                <li>Government or regulatory agency requests</li>
                <li>To comply with applicable laws, regulations, or legal obligations</li>
                <li>To protect our rights, property, or safety, or that of our users or others</li>
                <li>To investigate potential violations of our Terms of Service</li>
                <li>To detect, prevent, or address fraud, security, or technical issues</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">4.4. With Your Consent</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                We may share your information with third parties when you explicitly consent to such sharing, such as when you authorize 
                sharing with specific business partners or when you participate in optional features that require data sharing.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">4.5. Traceability and Public Information</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                For traceability purposes, certain product information (origin, journey, certifications) may be visible to buyers through 
                QR codes and digital passports. However, sensitive personal information such as exact farm locations, personal contact details, 
                and financial information are protected and not disclosed in public traceability features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">5. Data Security and Protection Measures</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We implement comprehensive technical and organizational security measures designed to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Encryption:</strong> Data encryption in transit (TLS/SSL) and at rest (AES-256) for sensitive information</li>
                <li><strong>Access Controls:</strong> Role-based access controls, multi-factor authentication, and regular access reviews</li>
                <li><strong>Network Security:</strong> Firewalls, intrusion detection systems, and regular security audits</li>
                <li><strong>Secure Infrastructure:</strong> Hosting on secure, compliant cloud infrastructure with regular security updates</li>
                <li><strong>Data Backup:</strong> Regular automated backups with encrypted storage and disaster recovery procedures</li>
                <li><strong>Employee Training:</strong> Regular security awareness training for all employees and contractors</li>
                <li><strong>Incident Response:</strong> Established procedures for detecting, responding to, and reporting security incidents</li>
                <li><strong>Vulnerability Management:</strong> Regular security assessments, penetration testing, and vulnerability remediation</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially 
                acceptable means to protect your information, we cannot guarantee absolute security. You are responsible for maintaining the 
                confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">6. Your Rights Under GDPR and Other Data Protection Laws</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                If you are located in the European Economic Area (EEA), United Kingdom, or other jurisdictions with similar data protection 
                laws, you have the following rights regarding your personal information:
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">6.1. Right of Access</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                You have the right to obtain confirmation as to whether we process your personal data and to access your personal data, 
                including copies of the data we hold about you. You may request this information by contacting us at 
                <a href="mailto:privacy@biovera.app" className="text-green-600 hover:underline"> privacy@biovera.app</a>.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">6.2. Right to Rectification</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                You have the right to request correction of inaccurate or incomplete personal data. You can update most of your information 
                directly through your account settings, or contact us to request corrections.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">6.3. Right to Erasure ("Right to be Forgotten")</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                You have the right to request deletion of your personal data in certain circumstances, such as when the data is no longer 
                necessary for the original purpose, you withdraw consent, or the data has been unlawfully processed. However, we may retain 
                certain information as required by law or for legitimate business purposes (e.g., transaction records for tax compliance).
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">6.4. Right to Data Portability</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                You have the right to receive your personal data in a structured, commonly used, and machine-readable format and to transmit 
                that data to another controller, where technically feasible.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">6.5. Right to Object</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                You have the right to object to processing of your personal data based on legitimate interests or for direct marketing purposes. 
                We will stop processing your data unless we can demonstrate compelling legitimate grounds that override your interests.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">6.6. Right to Restrict Processing</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                You have the right to request restriction of processing of your personal data in certain circumstances, such as when you 
                contest the accuracy of the data or object to processing.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">6.7. Right to Withdraw Consent</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Where processing is based on consent, you have the right to withdraw your consent at any time. Withdrawal of consent does 
                not affect the lawfulness of processing based on consent before its withdrawal.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">6.8. Right to Lodge a Complaint</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                You have the right to lodge a complaint with a supervisory authority, particularly in the EU member state of your habitual 
                residence, place of work, or place of the alleged infringement, if you believe that our processing of your personal data 
                violates applicable data protection laws.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3 mt-6">6.9. Exercising Your Rights</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                To exercise any of these rights, please contact us at 
                <a href="mailto:privacy@biovera.app" className="text-green-600 hover:underline"> privacy@biovera.app</a>. We will respond 
                to your request within one month (or two months for complex requests). We may require verification of your identity before 
                processing your request. In some cases, we may charge a reasonable fee if your request is manifestly unfounded or excessive.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">7. Data Retention and Deletion</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, 
                unless a longer retention period is required or permitted by law. Our retention periods are based on:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Active Accounts:</strong> While your account is active and for a reasonable period thereafter</li>
                <li><strong>Transaction Records:</strong> At least 7 years for financial and tax records, as required by law</li>
                <li><strong>Traceability Data:</strong> Indefinitely for product traceability and compliance purposes, as required by food 
                safety regulations</li>
                <li><strong>Legal Claims:</strong> For the duration of any legal proceedings or potential legal claims</li>
                <li><strong>Regulatory Compliance:</strong> As required by applicable laws, regulations, or industry standards</li>
                <li><strong>Contract Performance:</strong> For the duration of any contracts and a reasonable period thereafter</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                When personal data is no longer needed, we will securely delete or anonymize it in accordance with our data retention 
                policies and applicable law. You may request deletion of your data at any time, subject to legal and contractual obligations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                Our Service is not intended for, and we do not knowingly collect personal information from, children under 18 years of age. 
                If you are under 18, you must not use the Service or provide any personal information to us.
              </p>
              <p className="text-gray-600 font-light leading-relaxed">
                If we become aware that we have collected personal information from a child under 18 without verifiable parental consent, 
                we will take steps to delete such information immediately. If you believe we have collected information from a child under 18, 
                please contact us immediately at 
                <a href="mailto:privacy@biovera.app" className="text-green-600 hover:underline"> privacy@biovera.app</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">9. International Data Transfers and Safeguards</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                Your information may be transferred to and processed in countries other than your country of residence, including countries 
                outside the European Economic Area (EEA) that may not have the same data protection laws as your country. These transfers 
                may occur for the purposes described in this Privacy Policy, including service provision, data storage, and business operations.
              </p>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                When we transfer personal data outside the EEA, we ensure appropriate safeguards are in place, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li><strong>Standard Contractual Clauses:</strong> European Commission approved contractual clauses that ensure adequate protection</li>
                <li><strong>Adequacy Decisions:</strong> Transfers to countries with adequacy decisions by the European Commission</li>
                <li><strong>Binding Corporate Rules:</strong> Internal policies ensuring consistent data protection standards</li>
                <li><strong>Certification Schemes:</strong> Participation in recognized data protection certification programs</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                By using the Service, you consent to the transfer of your information to countries outside your country of residence, 
                including countries that may not provide the same level of data protection as your home country.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">10. Data Breach Notification</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                In the event of a personal data breach that is likely to result in a high risk to your rights and freedoms, we will notify 
                you and the relevant supervisory authority without undue delay, and in any event within 72 hours of becoming aware of the breach, 
                where feasible.
              </p>
              <p className="text-gray-600 font-light leading-relaxed">
                Our breach notification will include: (a) the nature of the breach, (b) the categories and approximate number of data subjects 
                affected, (c) the likely consequences of the breach, and (d) the measures we have taken or propose to take to address the breach.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">11. Automated Decision-Making and Profiling</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We may use automated decision-making, including profiling, in certain circumstances, such as:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Route optimization for logistics partners</li>
                <li>Price calculation and market analysis</li>
                <li>Fraud detection and prevention</li>
                <li>Quality assessment and compliance scoring</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                You have the right not to be subject to a decision based solely on automated processing, including profiling, which produces 
                legal effects concerning you or similarly significantly affects you, unless such processing is necessary for entering into 
                or performance of a contract, is authorized by law, or is based on your explicit consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">12. Marketing Communications</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                With your consent, we may send you marketing communications about our products, services, and promotions. You can opt-out 
                of receiving marketing communications at any time by:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Clicking the "unsubscribe" link in any marketing email</li>
                <li>Updating your communication preferences in your account settings</li>
                <li>Contacting us at <a href="mailto:privacy@biovera.app" className="text-green-600 hover:underline">privacy@biovera.app</a></li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                Please note that even if you opt-out of marketing communications, we may still send you service-related communications, 
                such as transaction confirmations, account updates, and important notices about the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">13. Changes to This Privacy Policy</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, 
                or for other reasons. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-light space-y-2 ml-4">
                <li>Posting the updated Privacy Policy on this page with a new "Last updated" date</li>
                <li>Sending an email notification to the address associated with your account (for material changes)</li>
                <li>Displaying a prominent notice on the Service (for significant changes)</li>
              </ul>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                Your continued use of the Service after any changes to this Privacy Policy constitutes your acceptance of the updated policy. 
                If you do not agree with the changes, you should stop using the Service and may request deletion of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">14. Contact Us and Data Protection Officer</h2>
              <p className="text-gray-600 font-light leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <p className="text-gray-600 font-light leading-relaxed mb-2">
                <strong>Bio Vera</strong><br />
                Email: <a href="mailto:privacy@biovera.app" className="text-green-600 hover:underline">privacy@biovera.app</a><br />
                Legal: <a href="mailto:legal@biovera.app" className="text-green-600 hover:underline">legal@biovera.app</a>
              </p>
              <p className="text-gray-600 font-light leading-relaxed mt-4">
                For users in the EEA, you also have the right to contact your local data protection authority if you have concerns about 
                how we handle your personal data.
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
                  width={200} 
                  height={70} 
                  className="h-14 w-auto"
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
                <li><Link href="/growers" className="hover:text-green-600 transition-colors">For Growers</Link></li>
                <li><Link href="/suppliers" className="hover:text-green-600 transition-colors">For Suppliers</Link></li>
                <li><Link href="/logistics-partner" className="hover:text-green-600 transition-colors">For Logistics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/#vision" className="hover:text-green-600 transition-colors">Vision</Link></li>
                <li><Link href="/#roadmap" className="hover:text-green-600 transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/legal" className="hover:text-green-600 transition-colors">Legal</Link></li>
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
