'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, AlertCircle, Clock, Shield, Eye, Truck, Award } from 'lucide-react';
import { qualityControlLevelsAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

/** Index order must match `/quality-control-levels/protocol-360` static level.checks[]. */
const STATIC_CHECK_KEYS: Record<number, readonly string[]> = {
  1: ['heavyMetals', 'nitrates', 'phValue', 'moisture'],
  2: ['calibration', 'firmness', 'filmIntegrity', 'colorDeviation'],
  3: ['temperature', 'thermalShock', 'coldChain', 'alertSystem'],
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

function Protocol360Content() {
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const batchId = searchParams.get('batchId');
  const [protocolInfo, setProtocolInfo] = useState<any>(null);
  const [status, setStatus] = useState<Protocol360Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tp = (key: string, options?: Record<string, string | number>) =>
    t(`protocol360Page.${key}`, options);

  const translateQCStatus = (code: string) => {
    const k = `protocol360Page.status.${code}`;
    const out = t(k);
    return out === k ? code : out;
  };

  const localizedStaticCheck = (levelNum: number, idx: number, fallback: string) => {
    const keys = STATIC_CHECK_KEYS[levelNum];
    const ck = keys?.[idx];
    if (!ck) return fallback;
    return t(`protocol360Page.levels.level${levelNum}.checks.${ck}` as const);
  };

  const localizedLevelName = (levelNum: number, fallback: string) => {
    if (levelNum < 1 || levelNum > 3) return fallback;
    return t(`protocol360Page.levels.level${levelNum}.name` as const);
  };

  const localizedLevelLocation = (levelNum: number, fallback: string) => {
    if (levelNum < 1 || levelNum > 3) return fallback;
    return t(`protocol360Page.levels.level${levelNum}.location` as const);
  };

  useEffect(() => {
    loadProtocolInfo();
    if (batchId) {
      loadStatus();
    } else {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = t('protocol360Page.documentTitle');
  }, [t, i18n.language]);

  const loadProtocolInfo = async () => {
    try {
      const data = await qualityControlLevelsAPI.getProtocol360Info();
      setProtocolInfo(data);
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'protocol360Page.errorLoading'));
      console.error('Error loading status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'APPROVED':
        return 'bg-[#2D5A27]/10 text-[#2D5A27] border-[#2D5A27]/30';
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
        return <CheckCircle className="w-5 h-5 text-[#2D5A27]" />;
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
        return <Shield className="w-6 h-6 text-[#2D5A27]" />;
      case 2:
        return <Eye className="w-6 h-6 text-[#2D5A27]" />;
      case 3:
        return <Truck className="w-6 h-6 text-[#2D5A27]" />;
      default:
        return null;
    }
  };

  if (!protocolInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27] mx-auto"></div>
          <p className="mt-4 text-gray-600">{tp('loading')}</p>
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
            <Link href={loc('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo1.png"
                alt={t('footer.logoAlt')}
                width={56}
                height={20}
                className="h-4 w-auto"
                priority
              />
            </Link>
            <nav className="flex gap-8 items-center">
              <Link href={loc('/')} className="text-sm text-gray-600 hover:text-[#2D5A27] transition-colors">
                {tp('home')}
              </Link>
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D5A27] text-white rounded-lg text-sm font-medium mb-8 shadow-md"
            >
              <Award className="w-4 h-4" />
              <span>{tp('premiumQuality')}</span>
            </motion.div>

            {/* Protocol 360 Title */}
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 leading-tight">
              Protocol <span className="text-[#2D5A27]">360</span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
              {tp('threeTierSystem')}
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
                      {translateQCStatus(status.overallStatus)}
                    </span>
                  </div>
                </div>
                {status.brandingSlogan && (
                  <div className="text-gray-600">
                    <p className="text-sm font-light">{tp('brandingSloganLabel')}</p>
                    <p className="text-base font-medium italic">
                      "{status.brandingSlogan}"
                    </p>
                  </div>
                )}
              </motion.div>
            )}
            {batchId && (
              <p className="text-sm text-gray-500 mt-4 font-mono">
                {tp('batchLabel')} {batchId}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Batch Status Section */}
      {batchId && (
        <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/10">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D5A27] mx-auto"></div>
                <p className="mt-4 text-gray-600 font-light">{tp('loadingStatus')}</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-light">{error}</p>
              </div>
            ) : status ? (
              <div>
                <h2 className="text-2xl font-light text-gray-900 mb-8 text-center">
                  {tp('qualityControlStatus')}
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
                            {tp('level')} {level.level}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(level.status)}
                          <span className={`text-xs font-medium ${getStatusColor(level.status).split(' ')[1]}`}>
                            {translateQCStatus(level.status)}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-base font-medium text-gray-700 mb-2">
                        {localizedLevelName(level.level, level.name)}
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
                                  {localizedStaticCheck(level.level, idx, check.name)}
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
              {tp('threeTierSystem')}
            </h2>
            <p className="text-base text-gray-600 font-light">
              {tp('standardsBeyond')}
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
                className="bg-[#2D5A27]/10 border border-[#2D5A27]/30 rounded-lg p-8"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                  <div className="flex items-center gap-4">
                    {getLevelIcon(level.level)}
                    <div>
                      <h3 className="text-2xl font-light text-gray-900 mb-2">
                        {tp('level')} {level.level}: {localizedLevelName(level.level, level.name)}
                      </h3>
                      <p className="text-sm text-gray-600 font-light">
                        <span className="font-medium">{tp('location')}</span>{' '}
                        {localizedLevelLocation(level.level, level.location)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
                    <p className="text-xs font-mono text-gray-700">
                      {level.badgeText}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#2D5A27]/30 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4 text-sm">
                    {tp('qualityChecks')}
                  </h4>
                  <ul className="space-y-2">
                    {level.checks.map((check: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 text-gray-700 font-light"
                      >
                        <CheckCircle className="w-4 h-4 text-[#2D5A27] flex-shrink-0" />
                        <span>{localizedStaticCheck(level.level, idx, check)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Branding slogans section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">
              {tp('brandingSlogans')}
            </h2>
            <p className="text-base text-gray-600 font-light">
              {tp('everyUnit')}
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
                <div className="bg-white rounded-lg p-6 border border-[#2D5A27]/30 hover:border-[#2D5A27]/40 transition-colors">
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
              {tp('checkStatus')}{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                ?batchId=YOUR_BATCH_ID
              </code>{' '}
              {tp('toTheUrl')}
            </p>
            <Link
              href={loc('/')}
              className="inline-block px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors"
            >
              {tp('backToHome')}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function Protocol360SuspenseFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500">{t('protocol360Page.suspenseLoading')}</p>
      </div>
    </div>
  );
}

export default function Protocol360Page() {
  return (
    <Suspense fallback={<Protocol360SuspenseFallback />}>
      <Protocol360Content />
    </Suspense>
  );
}
