'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Package, Award, Image as ImageIcon, Leaf, Droplets, History } from 'lucide-react';
import Image from 'next/image';

interface FarmerProfileData {
  producedInLabel?: string; // e.g. "Produced in Serbia, Region X. Grown to Vera standards." (no name)
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
    estates: Array<{
      name: string;
      location: string | null;
    }>;
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

export default function FarmerProfilePage() {
  const params = useParams();
  const qrCode = params.qrCode as string;
  const [data, setData] = useState<FarmerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFarmerProfile();
  }, [qrCode]);

  const fetchFarmerProfile = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004'}/farmer-profile/qr/${qrCode}`
      );
      
      if (!response.ok) {
        throw new Error('Farmer profile not found');
      }
      
      const profileData = await response.json();
      setData(profileData);
    } catch (err: any) {
      setError(err.message || 'Failed to load farmer profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-[1.5px] border-[#1A3021] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#1A3021] text-sm font-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-light text-[#1A3021] mb-2">Profile not found</h1>
          <p className="text-sm text-[#1A3021]/60 font-light">{error || 'Farmer profile not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header - Farmer Photo & Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          {/* Farmer Photo (no name shown for privacy) */}
          <div className="mb-6 flex justify-center">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-[#A4C639] shadow-lg">
              {data.farmer.photo ? (
                <Image
                  src={data.farmer.photo}
                  alt="Producer"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#2D5A27]/10 to-[#2D5A27]/20 flex items-center justify-center">
                  <span className="text-6xl">🌱</span>
                </div>
              )}
            </div>
          </div>

          {/* VERA PRODUCER Brand */}
          <div className="mb-3">
            <p className="text-[10px] font-light tracking-[0.2em] text-[#1A3021]/50 uppercase">
              VERA PRODUCER
            </p>
          </div>

          {/* Produced in [Region]. Grown to Vera standards. (no first/last name) */}
          <h1 className="text-2xl md:text-3xl font-light text-[#1A3021] mb-2">
            {data.producedInLabel || (data.location.region ? `Produced in ${data.location.region}. Grown to Vera standards.` : 'Grown to Vera standards.')}
          </h1>

          {/* Region only if not already in producedInLabel */}
          {data.location.region && !data.producedInLabel && (
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <MapPin className="w-4 h-4 text-[#1A3021]/60" strokeWidth={1} />
              <p className="text-sm font-light tracking-[0.15em] text-[#1A3021]/70 uppercase">
                {data.location.region}
              </p>
            </div>
          )}

          {/* Generation & Experience */}
          <div className="flex items-center justify-center gap-4 text-xs text-[#1A3021]/60 mb-6">
            {data.farmer.generation && (
              <span>{data.farmer.generation} generation grower</span>
            )}
            {data.farmer.yearsOfExperience && (
              <span>• {data.farmer.yearsOfExperience} years of experience</span>
            )}
          </div>

          {/* Bio */}
          <p className="text-base font-light text-[#1A3021] leading-relaxed max-w-2xl mx-auto mb-8">
            {data.farmer.bio}
          </p>

          {/* Vera Partner Badge */}
          {data.farmer.isVeraPartner && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#A4C639]/10 border border-[#A4C639]/30 rounded-full">
              <Award className="w-4 h-4 text-[#A4C639]" strokeWidth={1.5} />
              <span className="text-xs font-light tracking-[0.1em] text-[#1A3021] uppercase">
                Vera Partner
              </span>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          <div className="bg-white border border-black/10 p-6 text-center">
            <p className="text-[9px] font-light text-[#1A3021]/40 mb-2 uppercase tracking-wider">
              Estates
            </p>
            <p className="text-2xl font-light text-[#1A3021]">
              {data.stats.totalEstates}
            </p>
          </div>
          <div className="bg-white border border-black/10 p-6 text-center">
            <p className="text-[9px] font-light text-[#1A3021]/40 mb-2 uppercase tracking-wider">
              Harvests
            </p>
            <p className="text-2xl font-light text-[#1A3021]">
              {data.stats.totalBatches}
            </p>
          </div>
          <div className="bg-white border border-black/10 p-6 text-center">
            <p className="text-[9px] font-light text-[#1A3021]/40 mb-2 uppercase tracking-wider">
              Latest Year
            </p>
            <p className="text-2xl font-light text-[#1A3021]">
              {data.stats.latestHarvestYear}
            </p>
          </div>
          <div className="bg-white border border-black/10 p-6 text-center">
            <p className="text-[9px] font-light text-[#1A3021]/40 mb-2 uppercase tracking-wider">
              Crops
            </p>
            <p className="text-sm font-light text-[#1A3021]">
              {data.stats.crops}
            </p>
          </div>
        </motion.div>

        {/* Photos Gallery */}
        {(data.photos.field.length > 0 || data.photos.growth.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-xs font-light tracking-[0.15em] text-[#1A3021]/60 uppercase mb-6">
              From the field & photos on tree
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[...data.photos.field, ...data.photos.growth].slice(0, 8).map((photoUrl, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden border border-black/10 rounded"
                >
                  <Image
                    src={photoUrl}
                    alt={`Field photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Product passport: chronology, harvest, pesticides, spray, photos on tree, fresh not frozen */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-12 p-6 border border-[#2D5A27]/20 rounded-lg bg-[#2D5A27]/5"
        >
          <h2 className="text-xs font-light tracking-[0.15em] text-[#1A3021]/60 uppercase mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Product passport
          </h2>
          <p className="text-sm font-light text-[#1A3021] mb-4">
            Freshly harvested, not frozen. Traceability and chronology below.
          </p>
          <ul className="space-y-2 text-sm font-light text-[#1A3021]/80">
            <li className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[#2D5A27]" />
              <span>Pesticides used: recorded per batch (see compliance data when available).</span>
            </li>
            <li className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#2D5A27]" />
              <span>Spray dates: recorded with field entries; shown in batch details when available.</span>
            </li>
            <li className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#2D5A27]" />
              <span>Photos on tree: growth and field photos below show produce on the tree and at harvest.</span>
            </li>
          </ul>
          {data.recentHarvests.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#1A3021]/10">
              <p className="text-[10px] font-light tracking-[0.1em] text-[#1A3021]/50 uppercase mb-3 flex items-center gap-1">
                <History className="w-3 h-3" />
                Chronology & harvest dates
              </p>
              <div className="space-y-2">
                {data.recentHarvests.slice(0, 5).map((harvest, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="font-light text-[#1A3021]">{harvest.productName}</span>
                    <span className="text-[#1A3021]/70">
                      Harvested {new Date(harvest.harvestDate).toLocaleDateString('en-US')} • {harvest.quantity} kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Harvests */}
        {data.recentHarvests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-xs font-light tracking-[0.15em] text-[#1A3021]/60 uppercase mb-6">
              Recent Harvests
            </h2>
            <div className="space-y-3">
              {data.recentHarvests.map((harvest, index) => (
                <div
                  key={index}
                  className="bg-white border border-black/10 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Package className="w-5 h-5 text-[#A4C639]" strokeWidth={1} />
                    <div>
                      <p className="text-sm font-light text-[#1A3021]">
                        {harvest.productName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[#1A3021]/60 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" strokeWidth={1} />
                          <span>{new Date(harvest.harvestDate).toLocaleDateString('en-US')}</span>
                        </div>
                        <span>•</span>
                        <span>{harvest.quantity} kg</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-light text-[#1A3021]/40">
                    {harvest.harvestYear}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Estates */}
        {data.location.estates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-8 border-t border-black/10"
          >
            <h2 className="text-xs font-light tracking-[0.15em] text-[#1A3021]/60 uppercase mb-6">
              Estates
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {data.location.estates.map((estate, index) => (
                <div
                  key={index}
                  className="bg-white border border-black/10 p-4"
                >
                  <p className="text-sm font-light text-[#1A3021] mb-1">
                    {estate.name}
                  </p>
                  {estate.location && (
                    <p className="text-xs text-[#1A3021]/60">
                      {estate.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
