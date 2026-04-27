'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { contactAPI } from '@/lib/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const result = await contactAPI.submitInquiry({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        phone: formData.phone || undefined,
      });

      if (result && result.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '', phone: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
        setErrorMessage((result && result.message) || 'Something went wrong. Please try again.');
        setTimeout(() => {
          setSubmitStatus('idle');
          setErrorMessage('');
        }, 10000);
      }
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
      let msg = '';

      // More detailed error messages
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          msg = data?.message || 'Please check your input and try again.';
        } else if (status === 429) {
          msg = 'Too many requests. Please wait a few minutes and try again.';
        } else if (status >= 500) {
          msg = 'Server error. Please try again later or contact us at info@biovera.app';
        } else {
          msg = data?.message || 'An error occurred. Please try again.';
        }
      } else if (
        error.code === 'ECONNABORTED' ||
        error.message?.includes('timeout') ||
        error.name === 'TimeoutError' ||
        error.name === 'AbortError'
      ) {
        msg = 'Request timed out. Please try again or email us at info@biovera.app';
      } else if (error.message === 'Failed to fetch') {
        msg = 'Could not reach server. Please check your connection or email us at info@biovera.app';
      } else if (error.request) {
        msg = 'Could not reach server. Please check your connection or email us at info@biovera.app';
      } else {
        msg = 'Something went wrong. Please try again or email us at info@biovera.app';
      }
      setErrorMessage(msg || 'Please try again or contact us at info@biovera.app');

      setTimeout(() => {
        setSubmitStatus('idle');
        setErrorMessage('');
      }, 10000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
              Have questions about Bio Vera? We're here to help. Reach out to us and we'll get back to you as soon as possible.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-2xl font-light text-gray-900 mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#2D5A27]/10 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-[#2D5A27]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">Email</h3>
                      <a 
                        href="mailto:info@biovera.app" 
                        className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors"
                      >
                        info@biovera.app
                      </a>
                      <br />
                      <a 
                        href="mailto:support@biovera.app" 
                        className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors"
                      >
                        support@biovera.app
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#2D5A27]/10 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-[#2D5A27]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">Phone</h3>
                      <a
                        href="tel:+4915563740470"
                        className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors"
                      >
                        +49 155 63740470
                      </a>
                      <p className="text-sm text-gray-500 font-light mt-1">
                        Monday – Friday, 9:00 AM – 6:00 PM CET
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#2D5A27]/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-[#2D5A27]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">Headquarters</h3>
                      <p className="text-sm text-gray-600 font-light">
                        Germany<br />
                        Hamburg
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="pt-6 border-t border-gray-200"
              >
                <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/help-center" className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal" className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                      Legal Information
                    </Link>
                  </li>
                  <li>
                    <Link href="/growers" className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                      For Growers
                    </Link>
                  </li>
                  <li>
                    <Link href="/suppliers" className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                      For Suppliers
                    </Link>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gray-50 border border-gray-200 rounded-lg p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="w-5 h-5 text-[#2D5A27]" />
                  <h2 className="text-2xl font-light text-gray-900">Send us a Message</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] outline-none transition-colors font-light"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] outline-none transition-colors font-light"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] outline-none transition-colors font-light bg-white"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="grower">Grower Application</option>
                      <option value="supplier">Supplier Partnership</option>
                      <option value="logistics">Logistics Partnership</option>
                      <option value="buyer">Buyer Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] outline-none transition-colors font-light resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  {submitStatus === 'success' && (
                    <div className="p-4 bg-[#2D5A27]/10 border border-[#2D5A27]/30 rounded-lg">
                      <p className="text-sm text-[#23471f] font-light">
                        Thank you for your message! We'll get back to you as soon as possible.
                      </p>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-light">
                        {errorMessage || 'Something went wrong. Please try again or contact us directly via email.'}
                      </p>
                      {process.env.NODE_ENV === 'development' && (
                        <p className="text-xs text-red-600 mt-2 font-mono">
                          Check browser console for details.
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    If the form does not work, contact us directly at{' '}
                    <a href="mailto:info@biovera.app" className="text-[#2D5A27] hover:underline">info@biovera.app</a>.
                  </p>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12 items-start">
            <div className="flex flex-col">
              <Link href="/" className="mb-4 flex items-center" style={{ minHeight: '1.25rem', marginTop: '-0.25rem' }}>
                <Image 
                  src="/logo1.png" 
                  alt="Bio Vera" 
                  width={56} 
                  height={20} 
                  className="h-4 w-auto"
                  style={{ display: 'block', background: 'transparent', objectFit: 'contain' }}
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
                <li><Link href="/about" className="hover:text-[#2D5A27] transition-colors">About</Link></li>
                <li><Link href="/careers" className="hover:text-[#2D5A27] transition-colors">Careers</Link></li>
                <li><Link href="/press" className="hover:text-[#2D5A27] transition-colors">Press Kit</Link></li>
                <li><Link href="/#vision" className="hover:text-[#2D5A27] transition-colors">Vision</Link></li>
                <li><Link href="/#roadmap" className="hover:text-[#2D5A27] transition-colors">Roadmap</Link></li>
                <li><Link href="/contact" className="hover:text-[#2D5A27] transition-colors">Contact</Link></li>
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
