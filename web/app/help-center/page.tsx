'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, Award, CheckCircle } from 'lucide-react';

type Language = 'en' | 'sr' | 'de';
type Category = 'buyers' | 'growers' | 'drivers' | 'general';

const content = {
  en: {
    title: 'Help Center',
    searchPlaceholder: 'Search for help...',
    categories: {
      buyers: 'For Buyers',
      growers: 'For Growers',
      drivers: 'For Drivers',
      general: 'General',
    },
    articles: {
      buyers: [
        { 
          title: 'Protocol 360: Quality Assurance System', 
          content: 'Discover Bio Vera\'s three-tier quality control system ensuring product safety, quality, and standardization. Learn about our rigorous verification process from field to shelf.',
          link: '/protocol-360',
          highlight: true,
        },
        { 
          title: 'Product Safety & Quality Standards', 
          content: 'Every product undergoes strict quality checks including soil analysis, biometric scanning, and cold chain monitoring. Our standards exceed industry expectations.',
        },
        { 
          title: 'Standardization & Compliance', 
          content: 'All products meet EU certification standards with complete traceability. Every unit is verified through our Protocol 360 system for guaranteed quality.',
        },
        { 
          title: 'Buyer Benefits & Advantages', 
          content: 'Enjoy competitive pricing, guaranteed freshness, complete transparency, and direct access to European producers. Build trust with your customers through verified quality.',
        },
        { 
          title: 'Terms & Conditions', 
          content: 'Understand our purchase terms, delivery conditions, quality guarantees, and return policies. We ensure fair and transparent transactions.',
        },
        { 
          title: 'How to Place Orders', 
          content: 'Step-by-step guide on browsing products, placing orders, tracking deliveries, and managing your account on the Bio Vera platform.',
        },
      ],
      growers: [
        { title: 'How to Create a Batch', content: 'Step-by-step guide on creating and managing batches in the Bio Vera system.' },
        { title: 'Digital Scheduling', content: 'Learn how to announce harvests 24 hours in advance and report start/stop times.' },
        { title: 'Quality Standards', content: 'Understanding Bio Vera quality requirements and visual standards.' },
        { title: 'Payment Process', content: 'How payments are processed and when you receive funds.' },
      ],
      drivers: [
        { title: 'Mission Management', content: 'How to accept, start, and complete missions in the app.' },
        { title: 'Temperature Monitoring', content: 'Using the temperature sensors and maintaining cold chain compliance.' },
        { title: 'Route Optimization', content: 'Understanding the optimized routes provided by Bio Vera.' },
        { title: 'Digital Seals', content: 'How to use and verify digital seals for cargo security.' },
      ],
      general: [
        { title: 'Getting Started', content: 'Welcome to Bio Vera! Learn the basics of the platform.' },
        { title: 'Account Setup', content: 'How to create and manage your Bio Vera account.' },
        { title: 'Mobile App Guide', content: 'Download and use the Bio Vera mobile application.' },
        { title: 'Contact Support', content: 'Get in touch with our support team for assistance.' },
      ],
    },
  },
  sr: {
    title: 'Centar za Pomoć',
    searchPlaceholder: 'Pretraži pomoć...',
    categories: {
      buyers: 'Za Kupce',
      growers: 'Za Proizvođače',
      drivers: 'Za Vozače',
      general: 'Opšte',
    },
    articles: {
      buyers: [
        { 
          title: 'Protokol 360: Sistem Osiguranja Kvaliteta', 
          content: 'Otkrijte Bio Vera trostepeni sistem kontrole kvaliteta koji osigurava sigurnost, kvalitet i standardizaciju proizvoda. Saznajte više o našem rigoroznom procesu verifikacije od polja do police.',
          link: '/protocol-360',
          highlight: true,
        },
        { 
          title: 'Sigurnost Proizvoda i Standardi Kvaliteta', 
          content: 'Svaki proizvod prolazi stroge kontrole kvaliteta uključujući analizu zemljišta, biometrijsko skeniranje i monitoring hladnog lanca. Naši standardi prevazilaze industrijska očekivanja.',
        },
        { 
          title: 'Standardizacija i Usaglašenost', 
          content: 'Svi proizvodi ispunjavaju EU sertifikacione standarde sa potpunom trasabilnošću. Svaka jedinica je verifikovana kroz naš Protokol 360 sistem za garantovani kvalitet.',
        },
        { 
          title: 'Pogodnosti i Prednosti za Kupce', 
          content: 'Uživajte u konkurentnim cenama, garantovanoj svežini, potpunoj transparentnosti i direktnom pristupu evropskim proizvođačima. Gradite poverenje sa svojim kupcima kroz verifikovani kvalitet.',
        },
        { 
          title: 'Uslovi i Odredbe', 
          content: 'Razumite naše uslove kupovine, uslove isporuke, garancije kvaliteta i politiku povrata. Osiguravamo poštene i transparentne transakcije.',
        },
        { 
          title: 'Kako da Poručite', 
          content: 'Korak-po-korak vodič za pregled proizvoda, postavljanje porudžbina, praćenje isporuka i upravljanje nalogom na Bio Vera platformi.',
        },
      ],
      growers: [
        { title: 'Kako Kreirati Seriju', content: 'Korak-po-korak vodič za kreiranje i upravljanje serijama u Bio Vera sistemu.' },
        { title: 'Digitalno Zakazivanje', content: 'Naučite kako da najavite berbu 24 sata unapred i prijavite vreme početka/kraja.' },
        { title: 'Standardi Kvaliteta', content: 'Razumevanje Bio Vera zahteva za kvalitet i vizuelnih standarda.' },
        { title: 'Proces Plaćanja', content: 'Kako se procesiraju plaćanja i kada primite sredstva.' },
      ],
      drivers: [
        { title: 'Upravljanje Misijama', content: 'Kako da prihvatite, započnete i završite misije u aplikaciji.' },
        { title: 'Praćenje Temperature', content: 'Korišćenje senzora temperature i održavanje hladnog lanca.' },
        { title: 'Optimizacija Rute', content: 'Razumevanje optimizovanih ruta koje pruža Bio Vera.' },
        { title: 'Digitalni Pečati', content: 'Kako da koristite i verifikujete digitalne pečate za sigurnost tereta.' },
      ],
      general: [
        { title: 'Početak', content: 'Dobrodošli u Bio Vera! Naučite osnove platforme.' },
        { title: 'Podešavanje Naloga', content: 'Kako da kreirate i upravljate svojim Bio Vera nalogom.' },
        { title: 'Vodič za Mobilnu Aplikaciju', content: 'Preuzmite i koristite Bio Vera mobilnu aplikaciju.' },
        { title: 'Kontakt Podrške', content: 'Kontaktirajte naš tim podrške za pomoć.' },
      ],
    },
  },
  de: {
    title: 'Hilfezentrum',
    searchPlaceholder: 'Hilfe suchen...',
    categories: {
      buyers: 'Für Käufer',
      growers: 'Für Erzeuger',
      drivers: 'Für Fahrer',
      general: 'Allgemein',
    },
    articles: {
      buyers: [
        { 
          title: 'Protokoll 360: Qualitätssicherungssystem', 
          content: 'Entdecken Sie Bio Veras dreistufiges Qualitätskontrollsystem, das Produktsicherheit, Qualität und Standardisierung gewährleistet. Erfahren Sie mehr über unseren rigorosen Verifizierungsprozess vom Feld bis zum Regal.',
          link: '/protocol-360',
          highlight: true,
        },
        { 
          title: 'Produktsicherheit & Qualitätsstandards', 
          content: 'Jedes Produkt durchläuft strenge Qualitätsprüfungen einschließlich Bodenanalyse, biometrischem Scannen und Kühlkettenüberwachung. Unsere Standards übertreffen Branchenerwartungen.',
        },
        { 
          title: 'Standardisierung & Compliance', 
          content: 'Alle Produkte erfüllen EU-Zertifizierungsstandards mit vollständiger Rückverfolgbarkeit. Jede Einheit wird durch unser Protokoll 360-System für garantierte Qualität verifiziert.',
        },
        { 
          title: 'Käufervorteile & Vorteile', 
          content: 'Genießen Sie wettbewerbsfähige Preise, garantierte Frische, vollständige Transparenz und direkten Zugang zu europäischen Erzeugern. Bauen Sie Vertrauen bei Ihren Kunden durch verifizierte Qualität auf.',
        },
        { 
          title: 'Bedingungen & Bestimmungen', 
          content: 'Verstehen Sie unsere Kaufbedingungen, Lieferbedingungen, Qualitätsgarantien und Rückgaberichtlinien. Wir gewährleisten faire und transparente Transaktionen.',
        },
        { 
          title: 'Wie man Bestellungen aufgibt', 
          content: 'Schritt-für-Schritt-Anleitung zum Durchsuchen von Produkten, Aufgeben von Bestellungen, Verfolgen von Lieferungen und Verwalten Ihres Kontos auf der Bio Vera-Plattform.',
        },
      ],
      growers: [
        { title: 'Wie man eine Charge erstellt', content: 'Schritt-für-Schritt-Anleitung zur Erstellung und Verwaltung von Chargen im Bio Vera-System.' },
        { title: 'Digitale Terminplanung', content: 'Erfahren Sie, wie Sie Ernten 24 Stunden im Voraus ankündigen und Start-/Stoppzeiten melden.' },
        { title: 'Qualitätsstandards', content: 'Verstehen der Bio Vera Qualitätsanforderungen und visuellen Standards.' },
        { title: 'Zahlungsprozess', content: 'Wie Zahlungen verarbeitet werden und wann Sie Mittel erhalten.' },
      ],
      drivers: [
        { title: 'Missionsverwaltung', content: 'Wie Sie Missionen in der App akzeptieren, starten und abschließen.' },
        { title: 'Temperaturüberwachung', content: 'Verwendung der Temperatursensoren und Aufrechterhaltung der Kühlkette.' },
        { title: 'Routenoptimierung', content: 'Verstehen der von Bio Vera bereitgestellten optimierten Routen.' },
        { title: 'Digitale Siegel', content: 'Wie Sie digitale Siegel für die Frachtsicherheit verwenden und überprüfen.' },
      ],
      general: [
        { title: 'Erste Schritte', content: 'Willkommen bei Bio Vera! Lernen Sie die Grundlagen der Plattform.' },
        { title: 'Kontoeinrichtung', content: 'Wie Sie Ihr Bio Vera-Konto erstellen und verwalten.' },
        { title: 'Mobil-App-Anleitung', content: 'Laden Sie die Bio Vera-Mobil-App herunter und verwenden Sie sie.' },
        { title: 'Support kontaktieren', content: 'Kontaktieren Sie unser Support-Team für Hilfe.' },
      ],
    },
  },
};

export default function HelpCenterPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [category, setCategory] = useState<Category>('buyers');
  const [searchQuery, setSearchQuery] = useState('');

  const t = content[language];
  const articles = t.articles[category];

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">{t.title}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  language === 'en' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('sr')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  language === 'sr' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                SR
              </button>
              <button
                onClick={() => setLanguage('de')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  language === 'de' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                DE
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Categories</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setCategory('buyers')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === 'buyers'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.categories.buyers}
                </button>
                <button
                  onClick={() => setCategory('growers')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === 'growers'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.categories.growers}
                </button>
                <button
                  onClick={() => setCategory('drivers')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === 'drivers'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.categories.drivers}
                </button>
                <button
                  onClick={() => setCategory('general')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === 'general'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.categories.general}
                </button>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredArticles.map((article: any, index) => {
                const isHighlighted = article.highlight;
                const content = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all ${
                      isHighlighted
                        ? 'border-2 border-green-300 bg-gradient-to-br from-green-50/50 to-white'
                        : 'border-gray-200'
                    }`}
                  >
                      <div className="flex items-start gap-3">
                        {isHighlighted && (
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md">
                              <Shield className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold mb-2 ${isHighlighted ? 'text-green-900' : 'text-gray-900'}`}>
                            {article.title}
                          </h3>
                          <p className={`${isHighlighted ? 'text-gray-700' : 'text-gray-600'}`}>
                            {article.content}
                          </p>
                          {article.link && (
                            <div className="mt-4 flex items-center gap-2 text-green-600 font-medium text-sm">
                              <span>Learn more</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                );

                return article.link ? (
                  <Link key={article.title} href={article.link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={article.title} className="cursor-pointer">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
