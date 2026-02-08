'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Clock, Shield, Eye, Truck, Award } from 'lucide-react';
import { qualityControlLevelsAPI } from '@/lib/api';

type Language = 'en' | 'sr' | 'de';

const translations = {
  en: {
    loading: 'Loading Protocol 360...',
    batchLabel: 'Batch:',
    qualityControlStatus: 'Quality Control Status',
    loadingStatus: 'Loading status...',
    threeTierSystem: 'Three-Tier Quality Control System',
    standardsBeyond: 'Standards beyond expectation',
    brandingSlogans: 'Bio Vera Branding Slogans',
    everyUnit: 'Every unit a masterpiece',
    checkStatus: 'To check Protocol 360 status for a specific batch, add',
    toTheUrl: 'to the URL',
    backToHome: 'Back to Home',
    home: 'Home',
    errorLoading: 'Failed to load Protocol 360 status',
    premiumQuality: 'Premium Quality Assurance',
    brandingSloganLabel: 'Branding Slogan:',
    location: 'Location:',
    qualityChecks: 'Quality Checks:',
    level: 'Level',
    status: {
      APPROVED: 'APPROVED',
      CLASS_B: 'CLASS B',
      REJECTED: 'REJECTED',
      PENDING: 'PENDING',
      PASS: 'PASS',
      FAIL: 'FAIL',
    },
    levels: {
      level1: {
        name: 'Eco-Safe Provera',
        location: 'Field',
        checks: {
          heavyMetals: 'Heavy metals absence',
          nitrates: 'Nitrate levels',
          phValue: 'PH value',
          moisture: 'Moisture levels (48h before harvest)',
        },
      },
      level2: {
        name: 'Biometric & Visual Scan',
        location: 'Packaging Center',
        checks: {
          calibration: 'Calibration (size)',
          firmness: 'Fruit firmness',
          filmIntegrity: 'Film integrity',
          colorDeviation: 'Color deviation (<5%)',
        },
      },
      level3: {
        name: 'Logistics Guard',
        location: 'Transport & Storage',
        checks: {
          temperature: 'Temperature range (2-8°C)',
          thermalShock: 'Thermal shock detection',
          coldChain: 'Cold chain continuity',
          alertSystem: 'Automatic alert system',
        },
      },
    },
  },
  sr: {
    loading: 'Učitavanje Protokola 360...',
    batchLabel: 'Serija:',
    qualityControlStatus: 'Status Kontrole Kvaliteta',
    loadingStatus: 'Učitavanje statusa...',
    threeTierSystem: 'Trostepeni Sistem Kontrole Kvaliteta',
    standardsBeyond: 'Standardi iznad očekivanja',
    brandingSlogans: 'Bio Vera Branding Slogani',
    everyUnit: 'Svaka jedinica je remek-delo',
    checkStatus: 'Da proverite status Protokola 360 za određenu seriju, dodajte',
    toTheUrl: 'u URL',
    backToHome: 'Nazad na Početnu',
    home: 'Početna',
    errorLoading: 'Neuspešno učitavanje statusa Protokola 360',
    premiumQuality: 'Premium Osiguranje Kvaliteta',
    brandingSloganLabel: 'Branding Slogan:',
    location: 'Lokacija:',
    qualityChecks: 'Kontrole Kvaliteta:',
    level: 'Nivo',
    status: {
      APPROVED: 'ODOBRENO',
      CLASS_B: 'KLASA B',
      REJECTED: 'ODBIJENO',
      PENDING: 'NA ČEKANJU',
      PASS: 'PROŠLO',
      FAIL: 'NIJE PROŠLO',
    },
    levels: {
      level1: {
        name: 'Eco-Safe Provera',
        location: 'Polje',
        checks: {
          heavyMetals: 'Odsustvo teških metala',
          nitrates: 'Nivo nitrata',
          phValue: 'PH vrednost',
          moisture: 'Nivo vlage (48h pre berbe)',
        },
      },
      level2: {
        name: 'Biometrijsko i Vizuelno Skeniranje',
        location: 'Centar za Pakovanje',
        checks: {
          calibration: 'Kalibracija (veličina)',
          firmness: 'Čvrstina ploda',
          filmIntegrity: 'Integritet folije',
          colorDeviation: 'Devijacija boje (<5%)',
        },
      },
      level3: {
        name: 'Logistička Zaštita',
        location: 'Transport i Skladištenje',
        checks: {
          temperature: 'Opseg temperature (2-8°C)',
          thermalShock: 'Detekcija termičkog šoka',
          coldChain: 'Kontinuitet hladnog lanca',
          alertSystem: 'Automatski sistem upozorenja',
        },
      },
    },
  },
  de: {
    loading: 'Protokoll 360 wird geladen...',
    batchLabel: 'Charge:',
    qualityControlStatus: 'Qualitätskontrollstatus',
    loadingStatus: 'Status wird geladen...',
    threeTierSystem: 'Dreistufiges Qualitätskontrollsystem',
    standardsBeyond: 'Standards über Erwartungen hinaus',
    brandingSlogans: 'Bio Vera Branding-Slogans',
    everyUnit: 'Jede Einheit ein Meisterwerk',
    checkStatus: 'Um den Protokoll 360-Status für eine bestimmte Charge zu überprüfen, fügen Sie',
    toTheUrl: 'zur URL hinzu',
    backToHome: 'Zurück zur Startseite',
    home: 'Startseite',
    errorLoading: 'Protokoll 360-Status konnte nicht geladen werden',
    premiumQuality: 'Premium Qualitätssicherung',
    brandingSloganLabel: 'Branding-Slogan:',
    location: 'Standort:',
    qualityChecks: 'Qualitätsprüfungen:',
    level: 'Stufe',
    status: {
      APPROVED: 'GENEHMIGT',
      CLASS_B: 'KLASSE B',
      REJECTED: 'ABGELEHNT',
      PENDING: 'AUSSTEHEND',
      PASS: 'BESTANDEN',
      FAIL: 'NICHT BESTANDEN',
    },
    levels: {
      level1: {
        name: 'Eco-Safe Prüfung',
        location: 'Feld',
        checks: {
          heavyMetals: 'Abwesenheit von Schwermetallen',
          nitrates: 'Nitratgehalt',
          phValue: 'PH-Wert',
          moisture: 'Feuchtigkeitsgehalt (48h vor der Ernte)',
        },
      },
      level2: {
        name: 'Biometrischer & Visueller Scan',
        location: 'Verpackungszentrum',
        checks: {
          calibration: 'Kalibrierung (Größe)',
          firmness: 'Fruchtfestigkeit',
          filmIntegrity: 'Folienintegrität',
          colorDeviation: 'Farbabweichung (<5%)',
        },
      },
      level3: {
        name: 'Logistik-Wächter',
        location: 'Transport & Lagerung',
        checks: {
          temperature: 'Temperaturbereich (2-8°C)',
          thermalShock: 'Thermoschock-Erkennung',
          coldChain: 'Kühlketten-Kontinuität',
          alertSystem: 'Automatisches Warnsystem',
        },
      },
    },
  },
};

interface QualityControlLevel {
  level: 1 | 2 | 3;
  name: string;
  status: 'PASS' | 'FAIL' | 'PENDING' | 'CLASS_B';
  badgeText: string;
  checks: {
    name: string;
    status: 'PASS' | 'FAIL' | 'PENDING';
    details?: string;
  }[];
  timestamp?: Date;
}

interface Protocol360Status {
  batchId: string;
  overallStatus: 'APPROVED' | 'CLASS_B' | 'REJECTED' | 'PENDING';
  levels: QualityControlLevel[];
  brandingSlogan: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function Protocol360Page() {
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batchId');
  const [protocolInfo, setProtocolInfo] = useState<any>(null);
  const [status, setStatus] = useState<Protocol360Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  
  const t = translations[language];

  useEffect(() => {
    loadProtocolInfo();
    if (batchId) {
      loadStatus();
    } else {
      setLoading(false);
    }
  }, [batchId]);

  const loadProtocolInfo = async () => {
    try {
      const data = await qualityControlLevelsAPI.getProtocol360Info();
      setProtocolInfo(data);
    } catch (err: any) {
      console.error('Error loading protocol info:', err);
    }
  };

  const loadStatus = async () => {
    if (!batchId) return;
    try {
      setLoading(true);
      const data = await qualityControlLevelsAPI.getProtocol360Status(batchId);
      setStatus(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || t.errorLoading);
      console.error('Error loading status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'APPROVED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'FAIL':
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'CLASS_B':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'PENDING':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'FAIL':
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'CLASS_B':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getLevelIcon = (level: number) => {
    switch (level) {
      case 1:
        return <Shield className="w-6 h-6 text-green-600" />;
      case 2:
        return <Eye className="w-6 h-6 text-green-600" />;
      case 3:
        return <Truck className="w-6 h-6 text-green-600" />;
      default:
        return null;
    }
  };

  if (!protocolInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

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
                {t.home}
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    language === 'en' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('sr')}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    language === 'sr' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  SR
                </button>
                <button
                  onClick={() => setLanguage('de')}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    language === 'de' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  DE
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 px-6 lg:px-8 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #9ca3af 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Premium Quality Assurance Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium mb-8 shadow-md"
            >
              <Award className="w-4 h-4" />
              <span>{t.premiumQuality}</span>
            </motion.div>

            {/* Protocol 360 Title */}
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 leading-tight">
              Protocol <span className="text-green-600">360</span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
              {t.threeTierSystem}
            </p>
            
            {status && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center justify-center gap-4 mt-8"
              >
                <div
                  className={`px-4 py-2 rounded-lg border ${getStatusColor(
                    status.overallStatus,
                  )}`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.overallStatus)}
                    <span className="font-medium text-sm">
                      {t.status[status.overallStatus as keyof typeof t.status] || status.overallStatus}
                    </span>
                  </div>
                </div>
                {status.brandingSlogan && (
                  <div className="text-gray-600">
                    <p className="text-sm font-light">{t.brandingSloganLabel}</p>
                    <p className="text-base font-medium italic">
                      "{status.brandingSlogan}"
                    </p>
                  </div>
                )}
              </motion.div>
            )}
            {batchId && (
              <p className="text-sm text-gray-500 mt-4 font-mono">
                {t.batchLabel} {batchId}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Batch Status Section */}
      {batchId && (
        <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-green-50/30">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 font-light">{t.loadingStatus}</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-light">{error}</p>
              </div>
            ) : status ? (
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-8 text-center">
                  {t.qualityControlStatus}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {status.levels.map((level) => (
                    <div
                      key={level.level}
                      className="bg-white rounded-lg shadow-sm border-2 p-6"
                      style={{
                        borderColor:
                          level.status === 'PASS'
                            ? '#10b981'
                            : level.status === 'FAIL'
                              ? '#ef4444'
                              : level.status === 'CLASS_B'
                                ? '#eab308'
                                : '#9ca3af',
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getLevelIcon(level.level)}
                          <h3 className="text-lg font-medium text-gray-900">
                            {t.level} {level.level}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(level.status)}
                          <span className={`text-xs font-medium ${getStatusColor(level.status).split(' ')[1]}`}>
                            {t.status[level.status as keyof typeof t.status] || level.status}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-base font-medium text-gray-700 mb-2">
                        {language === 'en' ? level.name : 
                         level.level === 1 ? t.levels.level1.name :
                         level.level === 2 ? t.levels.level2.name :
                         t.levels.level3.name}
                      </h4>
                      <p className="text-xs text-gray-500 mb-4 font-mono bg-gray-50 p-2 rounded">
                        {level.badgeText}
                      </p>
                      <div className="space-y-3 border-t pt-4">
                        {level.checks.map((check, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5">
                                {getStatusIcon(check.status)}
                              </span>
                              <div className="flex-1">
                                <span className="font-medium text-gray-700">
                                  {(() => {
                                    // Localize check names based on content
                                    const checkLower = check.name.toLowerCase();
                                    const levelKey = level.level === 1 ? 'level1' : level.level === 2 ? 'level2' : 'level3';
                                    const checks = t.levels[levelKey as keyof typeof t.levels].checks as any;
                                    
                                    if (language === 'en') return check.name;
                                    if (checkLower.includes('heavy') || checkLower.includes('metal')) return checks.heavyMetals;
                                    if (checkLower.includes('nitrate')) return checks.nitrates;
                                    if (checkLower.includes('ph')) return checks.phValue;
                                    if (checkLower.includes('moisture')) return checks.moisture;
                                    if (checkLower.includes('calibration') || checkLower.includes('size')) return checks.calibration;
                                    if (checkLower.includes('firmness')) return checks.firmness;
                                    if (checkLower.includes('film') || checkLower.includes('integrity')) return checks.filmIntegrity;
                                    if (checkLower.includes('color') || checkLower.includes('deviation')) return checks.colorDeviation;
                                    if (checkLower.includes('temperature')) return checks.temperature;
                                    if (checkLower.includes('thermal') || checkLower.includes('shock')) return checks.thermalShock;
                                    if (checkLower.includes('cold') || checkLower.includes('chain')) return checks.coldChain;
                                    if (checkLower.includes('alert') || checkLower.includes('system')) return checks.alertSystem;
                                    return check.name;
                                  })()}
                                </span>
                                {check.details && (
                                  <p className="text-xs text-gray-500 mt-1 font-light">
                                    {check.details}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* Protocol Levels Overview */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">
              {t.threeTierSystem}
            </h2>
            <p className="text-base text-gray-600 font-light">
              {t.standardsBeyond}
            </p>
          </div>

          <div className="space-y-12">
            {protocolInfo.levels.map((level: any, index: number) => (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-green-50/30 border border-green-200/50 rounded-lg p-8"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                  <div className="flex items-center gap-4">
                    {getLevelIcon(level.level)}
                    <div>
                      <h3 className="text-2xl font-light text-gray-900 mb-2">
                        {t.level} {level.level}: {language === 'en' ? level.name : 
                         level.level === 1 ? t.levels.level1.name :
                         level.level === 2 ? t.levels.level2.name :
                         t.levels.level3.name}
                      </h3>
                      <p className="text-sm text-gray-600 font-light">
                        <span className="font-medium">{t.location}</span>{' '}
                        {language === 'en' ? level.location :
                         level.level === 1 ? t.levels.level1.location :
                         level.level === 2 ? t.levels.level2.location :
                         t.levels.level3.location}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
                    <p className="text-xs font-mono text-gray-700">
                      {level.badgeText}
                    </p>
                  </div>
                </div>

                <div className="border-t border-green-200/50 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4 text-sm">
                    {t.qualityChecks}
                  </h4>
                  <ul className="space-y-2">
                    {level.checks.map((check: string, idx: number) => {
                      // Map backend check names to localized versions
                      const getLocalizedCheck = (checkName: string, levelNum: number) => {
                        if (language === 'en') return checkName;
                        const levelKey = levelNum === 1 ? 'level1' : levelNum === 2 ? 'level2' : 'level3';
                        const checks = t.levels[levelKey as keyof typeof t.levels].checks as any;
                        // Try to match by key
                        if (checkName.toLowerCase().includes('heavy') || checkName.toLowerCase().includes('metals')) {
                          return checks.heavyMetals;
                        } else if (checkName.toLowerCase().includes('nitrate')) {
                          return checks.nitrates;
                        } else if (checkName.toLowerCase().includes('ph')) {
                          return checks.phValue;
                        } else if (checkName.toLowerCase().includes('moisture')) {
                          return checks.moisture;
                        } else if (checkName.toLowerCase().includes('calibration') || checkName.toLowerCase().includes('size')) {
                          return checks.calibration;
                        } else if (checkName.toLowerCase().includes('firmness')) {
                          return checks.firmness;
                        } else if (checkName.toLowerCase().includes('film') || checkName.toLowerCase().includes('integrity')) {
                          return checks.filmIntegrity;
                        } else if (checkName.toLowerCase().includes('color') || checkName.toLowerCase().includes('deviation')) {
                          return checks.colorDeviation;
                        } else if (checkName.toLowerCase().includes('temperature')) {
                          return checks.temperature;
                        } else if (checkName.toLowerCase().includes('thermal') || checkName.toLowerCase().includes('shock')) {
                          return checks.thermalShock;
                        } else if (checkName.toLowerCase().includes('cold') || checkName.toLowerCase().includes('chain')) {
                          return checks.coldChain;
                        } else if (checkName.toLowerCase().includes('alert') || checkName.toLowerCase().includes('system')) {
                          return checks.alertSystem;
                        }
                        return checkName; // Fallback to original
                      };
                      
                      return (
                        <li
                          key={idx}
                          className="flex items-center gap-3 text-gray-700 font-light"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span>{getLocalizedCheck(check, level.level)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Branding Slogans - U našem stilu */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">
              {t.brandingSlogans}
            </h2>
            <p className="text-base text-gray-600 font-light">
              {t.everyUnit}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {protocolInfo.brandingSlogans.map((slogan: string, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                <div className="bg-white rounded-lg p-6 border border-green-200 hover:border-green-300 transition-colors">
                  <p className="text-lg font-medium italic text-gray-800 text-center leading-relaxed">
                    "{slogan}"
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!batchId && (
        <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-600 mb-6 font-light">
              {t.checkStatus}{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                ?batchId=YOUR_BATCH_ID
              </code>{' '}
              {t.toTheUrl}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              {t.backToHome}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
