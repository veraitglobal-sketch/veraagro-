'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Package,
  Award,
  Image as ImageIcon,
  Leaf,
  Droplets,
  Sprout,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

export interface PassportData {
  producedInLabel?: string;
  farmer: {
    id: string;
    firstName: string;
    lastName: string;
    photo: string | null;
    bio: string;
    generation: string;
    yearsOfExperience: number | null;
    isVeraPartner: boolean;
    partnerCode: string;
  };
  location: {
    region: string | null;
    estates: Array<{ name: string; location: string | null }>;
  };
  stats: {
    totalEstates: number;
    totalBatches: number;
    latestHarvestYear: number;
    crops: string;
  };
  photos: {
    profile: string | null;
    field: string[];
    growth: string[];
  };
  recentHarvests: Array<{
    batchId: string;
    productName: string;
    harvestDate: string;
    harvestYear: number;
    quantity: number;
  }>;
}

function isRemoteImage(src: string) {
  return src.startsWith('http://') || src.startsWith('https://');
}

/** next/image: data URLs and huge base64 need unoptimized; remote http(s) too. */
function imageUnoptimized(src: string) {
  return isRemoteImage(src) || src.startsWith('data:');
}

const vera = {
  main: '#2D5A27',
  hover: '#23471f',
  text: '#1A3021',
  soft: 'rgba(45, 90, 39, 0.08)',
  border: 'rgba(45, 90, 39, 0.18)',
};

export default function PassportView({ data }: { data: PassportData }) {
  const loc = useLocalizedHref();
  const displayName = [data.farmer.firstName, data.farmer.lastName].filter(Boolean).join(' ').trim() || 'Vera partner';
  const photo = data.farmer.photo || data.photos.profile;
  const allGallery = [...data.photos.field, ...data.photos.growth].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7f4] via-white to-gray-50/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-16">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-xs font-medium tracking-[0.2em] uppercase text-gray-500 mb-6"
        >
          Bio Vera · digital producer profile
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-gray-200/90 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(26,48,33,0.12)] overflow-hidden"
        >
          <div
            className="h-1.5 w-full"
            style={{ background: `linear-gradient(90deg, ${vera.main} 0%, #3d7a34 50%, #5a8f52 100%)` }}
            aria-hidden
          />

          <div className="p-6 sm:p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-10">
              <div className="flex justify-center md:justify-start flex-shrink-0">
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden ring-2 ring-[#2D5A27]/20 ring-offset-2 ring-offset-white">
                  {photo ? (
                    <Image
                      src={photo}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="160px"
                      unoptimized={imageUnoptimized(photo)}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(145deg, ${vera.soft}, white)` }}
                    >
                      <Sprout className="w-16 h-16 text-[#2D5A27]/35" strokeWidth={1.25} aria-hidden />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 text-center md:text-left min-w-0">
                <p className="text-[10px] sm:text-xs font-medium tracking-[0.22em] uppercase text-[#2D5A27] mb-2">
                  Vera partner
                </p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 tracking-tight leading-tight mb-2">
                  {displayName}
                </h1>
                {data.farmer.partnerCode && (
                  <p className="text-sm font-mono text-gray-500 mb-3">{data.farmer.partnerCode}</p>
                )}
                <p className="text-base sm:text-lg text-gray-600 font-light leading-relaxed mb-4">
                  {data.producedInLabel ||
                    (data.location.region
                      ? `Produced in ${data.location.region}. Grown to Vera standards.`
                      : 'Grown to Vera standards.')}
                </p>
                {data.location.region && (
                  <div className="inline-flex items-center gap-1.5 text-sm text-gray-600 font-light mb-4">
                    <MapPin className="w-4 h-4 text-[#2D5A27] flex-shrink-0" strokeWidth={1.5} aria-hidden />
                    <span className="uppercase tracking-wide text-xs sm:text-sm">{data.location.region}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-xs text-gray-500 font-light mb-4">
                  {data.farmer.generation && <span>{data.farmer.generation} generation grower</span>}
                  {data.farmer.yearsOfExperience != null && (
                    <span>
                      {data.farmer.generation ? '· ' : null}
                      {data.farmer.yearsOfExperience} years of experience
                    </span>
                  )}
                </div>
                {data.farmer.bio && (
                  <p className="text-sm sm:text-base text-gray-700 font-light leading-relaxed border-t border-gray-100 pt-5">
                    {data.farmer.bio}
                  </p>
                )}
                {data.farmer.isVeraPartner && (
                  <div className="mt-5 flex justify-center md:justify-start">
                    <div
                      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium tracking-wide"
                      style={{ borderColor: vera.border, backgroundColor: vera.soft, color: vera.text }}
                    >
                      <Award className="w-4 h-4 text-[#2D5A27] flex-shrink-0" strokeWidth={1.5} />
                      <span>Verified Vera Partner</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6"
        >
          {[
            { label: 'Estates', value: data.stats.totalEstates },
            { label: 'Listed harvests', value: data.stats.totalBatches },
            { label: 'Latest year', value: data.stats.latestHarvestYear },
            { label: 'Crops', value: data.stats.crops, small: true },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-200 bg-white/90 px-4 py-5 text-center shadow-sm"
            >
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {item.label}
              </p>
              <p
                className={
                  'small' in item && item.small
                    ? 'text-sm sm:text-base font-light text-gray-900 leading-snug line-clamp-2'
                    : 'text-2xl sm:text-3xl font-light text-gray-900 tabular-nums'
                }
              >
                {item.value}
              </p>
            </div>
          ))}
        </motion.div>

        {allGallery.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-10"
          >
            <h2 className="text-xs sm:text-sm font-medium tracking-[0.15em] text-gray-500 uppercase mb-4">
              From the field
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {allGallery.slice(0, 8).map((photoUrl, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
                >
                  <Image
                    src={photoUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 200px"
                    unoptimized={imageUnoptimized(photoUrl)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mt-10 rounded-2xl border p-6 sm:p-8"
          style={{ borderColor: vera.border, backgroundColor: vera.soft }}
        >
          <h2 className="text-xs sm:text-sm font-medium tracking-[0.15em] text-gray-800 uppercase mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} aria-hidden />
            Product traceability
          </h2>
          <p className="text-sm text-gray-700 font-light leading-relaxed mb-5">
            Fresh, traceable produce. Pesticide and spray records, and full batch details, are available on each
            product&apos;s digital passport when you scan the batch QR.
          </p>
          <ul className="space-y-2.5 text-sm text-gray-700 font-light">
            <li className="flex items-start gap-2.5">
              <Leaf className="w-4 h-4 text-[#2D5A27] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>Inputs and treatments are recorded per batch in the Bio Vera system.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Droplets className="w-4 h-4 text-[#2D5A27] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>Field applications are logged with the batch passport when you open it from the product.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <ImageIcon className="w-4 h-4 text-[#2D5A27] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>Photos above show the farm and growth stages leading to harvest.</span>
            </li>
          </ul>
        </motion.div>

        {data.recentHarvests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10"
          >
            <h2 className="text-xs sm:text-sm font-medium tracking-[0.15em] text-gray-500 uppercase mb-4">
              Batch passports
            </h2>
            <div className="space-y-2">
              {data.recentHarvests.map((harvest, index) => (
                <Link
                  key={index}
                  href={`/passport/${encodeURIComponent(harvest.batchId)}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#2D5A27]/30 hover:shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                      style={{ backgroundColor: vera.soft }}
                    >
                      <Package className="w-5 h-5 text-[#2D5A27]" strokeWidth={1.25} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{harvest.productName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                        <span>{new Date(harvest.harvestDate).toLocaleDateString('en-GB')}</span>
                        <span>·</span>
                        <span>{harvest.quantity} kg</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#2D5A27] flex-shrink-0 group-hover:underline">
                    Open passport
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {data.location.estates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-10 pt-10 border-t border-gray-200"
          >
            <h2 className="text-xs sm:text-sm font-medium tracking-[0.15em] text-gray-500 uppercase mb-4">
              Estates
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.location.estates.map((estate, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm"
                >
                  <p className="text-sm font-medium text-gray-900 mb-0.5">{estate.name}</p>
                  {estate.location && <p className="text-xs text-gray-500 font-light">{estate.location}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center">
          <Link
            href={loc('/')}
            className="inline-flex text-sm font-medium text-[#2D5A27] hover:text-[#23471f] transition-colors"
          >
            biovera.app
          </Link>
          <p className="text-xs text-gray-400 font-light mt-2">From field to buyer — with full traceability.</p>
        </footer>
      </div>
    </div>
  );
}
