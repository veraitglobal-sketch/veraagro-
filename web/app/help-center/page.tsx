'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

type Language = 'en' | 'sr' | 'de';
type Category = 'growers' | 'drivers' | 'general';

const content = {
  en: {
    title: 'Help Center',
    searchPlaceholder: 'Search for help...',
    categories: {
      growers: 'For Growers',
      drivers: 'For Drivers',
      general: 'General',
    },
    articles: {
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
      growers: 'Za Proizvođače',
      drivers: 'Za Vozače',
      general: 'Opšte',
    },
    articles: {
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
      growers: 'Für Erzeuger',
      drivers: 'Für Fahrer',
      general: 'Allgemein',
    },
    articles: {
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
  const [category, setCategory] = useState<Category>('general');
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
                  onClick={() => setCategory('general')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === 'general'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.categories.general}
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
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredArticles.map((article, index) => (
                <motion.div
                  key={article.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                  <p className="text-gray-600">{article.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
