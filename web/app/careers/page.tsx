'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Clock, Users, Heart, Zap, Target, Globe } from 'lucide-react';

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  requirements: string[];
  benefits: string[];
}

const jobOpenings: JobOpening[] = [
  {
    id: '1',
    title: 'Senior Full-Stack Developer',
    department: 'Engineering',
    location: 'Remote / Hamburg, Germany',
    type: 'Full-time',
    description: 'We are looking for an experienced full-stack developer to join our engineering team. You will work on building and maintaining our platform, mobile applications, and APIs.',
    requirements: [
      '5+ years of experience in full-stack development',
      'Proficiency in TypeScript, Node.js, React, and Next.js',
      'Experience with PostgreSQL and Prisma ORM',
      'Knowledge of NestJS and microservices architecture',
      'Strong problem-solving and communication skills',
    ],
    benefits: [
      'Competitive salary and equity package',
      'Remote work flexibility',
      'Health insurance and wellness programs',
      'Professional development budget',
      'Flexible working hours',
    ],
  },
  {
    id: '2',
    title: 'Agricultural Technology Specialist',
    department: 'Product',
    location: 'Remote (EU / Worldwide)',
    type: 'Full-time',
    description: 'Join our product team to help shape the future of agricultural technology. You will work closely with farmers, understand their needs, and translate them into product features.',
    requirements: [
      'Background in agriculture, agrotech, or related field',
      'Understanding of EU agricultural regulations and certifications',
      'Experience with farm management systems',
      'Strong analytical and communication skills',
      'Willingness to travel to farms and partners worldwide',
    ],
    benefits: [
      'Competitive salary',
      'Travel opportunities around the world',
      'Direct impact on agricultural innovation',
      'Health insurance',
      'Learning and development opportunities',
    ],
  },
  {
    id: '3',
    title: 'Business Development Manager',
    department: 'Sales',
    location: 'Hamburg, Germany',
    type: 'Full-time',
    description: 'We are seeking a Business Development Manager to expand our network of growers, suppliers, and buyers worldwide. You will be responsible for building strategic partnerships.',
    requirements: [
      '3+ years of experience in B2B sales or business development',
      'Experience in agriculture, food, or logistics industries',
      'Strong networking and relationship-building skills',
      'Fluent in English and at least one other language',
      'Results-oriented with a track record of meeting targets',
    ],
    benefits: [
      'Competitive base salary + commission',
      'Company car or travel allowance',
      'Health insurance',
      'Performance bonuses',
      'Career growth opportunities',
    ],
  },
];

const values = [
  {
    icon: Target,
    title: 'Mission-Driven',
    description: 'We work on meaningful problems that impact agriculture and food security.',
  },
  {
    icon: Users,
    title: 'Collaborative Culture',
    description: 'We believe in teamwork, open communication, and supporting each other.',
  },
  {
    icon: Zap,
    title: 'Innovation',
    description: 'We encourage creative thinking and experimentation to solve complex challenges.',
  },
  {
    icon: Heart,
    title: 'Work-Life Balance',
    description: 'We value your well-being and offer flexible schedules and remote work options.',
  },
  {
    icon: Globe,
    title: 'Global Impact',
    description: 'Join a team that\'s transforming agriculture around the world.',
  },
];

export default function CareersPage() {
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
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#2D5A27]/10 rounded-full flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-[#2D5A27]" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
              Join the Bio Vera Team
            </h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
              Help us transform agriculture through technology. We're building the future of 
              transparent, sustainable food supply chains.
            </p>
          </motion.div>

          {/* Why Work With Us */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-8 text-center">Why Work With Us</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {values.map((value, index) => {
                  const IconComponent = value.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-6 hover:border-[#2D5A27] transition-colors text-center"
                    >
                      <IconComponent className="w-8 h-8 text-[#2D5A27] mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{value.title}</h3>
                      <p className="text-sm text-gray-600 font-light leading-relaxed">
                        {value.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </section>

          {/* Open Positions */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-8">Open Positions</h2>
              <div className="space-y-6">
                {jobOpenings.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-8 hover:border-[#2D5A27] transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {job.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.type}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/contact?subject=Job Application: ${job.title}`}
                        className="px-6 py-2 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg whitespace-nowrap"
                      >
                        Apply Now
                      </Link>
                    </div>
                    <p className="text-sm text-gray-600 font-light leading-relaxed mb-6">
                      {job.description}
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Requirements</h4>
                        <ul className="space-y-2">
                          {job.requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="w-1.5 h-1.5 bg-[#2D5A27] rounded-full mt-2 flex-shrink-0"></span>
                              <span className="font-light">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Benefits</h4>
                        <ul className="space-y-2">
                          {job.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="w-1.5 h-1.5 bg-[#2D5A27] rounded-full mt-2 flex-shrink-0"></span>
                              <span className="font-light">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Don't See a Role? */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
          >
            <h2 className="text-xl font-light text-gray-900 mb-4">Don't See a Role That Fits?</h2>
            <p className="text-gray-600 font-light leading-relaxed mb-6">
              We're always looking for talented individuals who share our passion for transforming agriculture. 
              Send us your resume and let us know how you'd like to contribute.
            </p>
            <Link
              href="/contact?subject=General Application"
              className="inline-block px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
            >
              Send Your Resume
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12 items-start">
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
                <li><Link href="/about" className="hover:text-[#2D5A27] transition-colors">About</Link></li>
                <li><Link href="/careers" className="hover:text-[#2D5A27] transition-colors">Careers</Link></li>
                <li><Link href="/#vision" className="hover:text-[#2D5A27] transition-colors">Vision</Link></li>
                <li><Link href="/#roadmap" className="hover:text-[#2D5A27] transition-colors">Roadmap</Link></li>
                <li><Link href="/contact" className="hover:text-[#2D5A27] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/faq" className="hover:text-[#2D5A27] transition-colors">FAQ</Link></li>
                <li><Link href="/help-center" className="hover:text-[#2D5A27] transition-colors">Help Center</Link></li>
                <li><Link href="/security" className="hover:text-[#2D5A27] transition-colors">Security</Link></li>
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
