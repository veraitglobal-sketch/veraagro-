'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Download, MapPin, Package, Camera, User } from 'lucide-react';
import Image from 'next/image';
import { formatFarmerIdentity, getFirstName, extractRegion } from '@/lib/farmer-utils';

interface PassportData {
  batch: {
    batchId: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: string;
  };
  origin: {
    farmName: string;
    ownerName: string;
    location: string;
    gpsLocation: any;
  };
  farmer: {
    name: string;
    photo: string | null;
    generation?: string;
    yearsOfExperience?: number | null;
    farmerQrCode?: string | null;
    farmerProfileUrl?: string | null;
    bio?: string | null;
  };
  photos?: { url: string; type: string; verified: boolean }[];
  compliance: {
    euOrganic: string;
    soilHealth: string;
    pesticideFree: string;
    waterPurity: string;
  };
  timeline: {
    harvested: string;
    stored: {
      date: string;
      temperature: number;
      humidity: number;
    } | null;
    transport: {
      vehicleNumber: string;
      route: string;
    } | null;
    arrival: {
      estimated: string;
      location: string;
    } | null;
  };
  labReport?: {
    url: string;
    available: boolean;
  };
}

export default function ProductPassportPage() {
  const params = useParams();
  const batchId = params.batchId as string;
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPassportData();
  }, [batchId]);

  const fetchPassportData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/qr/verify/${batchId}`);
      
      if (!response.ok) {
        throw new Error('Passport data not found');
      }
      
      const apiData = await response.json();
      
      // Privacy protection: Extract only first name and region
      const firstName = getFirstName(apiData.farmer?.name || apiData.origin?.ownerName || 'Farmer');
      const region = extractRegion(apiData.origin?.address, apiData.origin?.location);
      const farmerIdentity = formatFarmerIdentity(
        firstName,
        undefined, // No lastName for privacy
        apiData.origin?.address,
        apiData.origin?.location
      );
      
      // Transform API data to passport format
      const passportData: PassportData = {
        batch: {
          batchId: apiData.batch?.batchId || batchId,
          productName: apiData.batch?.productName || 'Organic Product',
          quantity: apiData.batch?.quantity || 0,
          unit: apiData.batch?.unit || 'kg',
          harvestDate: apiData.batch?.harvestDate || apiData.timeline?.harvested || new Date().toISOString(),
        },
        origin: {
          farmName: apiData.origin?.farmName || 'Farm',
          ownerName: farmerIdentity, // Formatted identity: "Marko, Arilje Region"
          location: region, // Only region, no exact address
          gpsLocation: undefined, // No GPS for privacy
        },
        farmer: {
          name: farmerIdentity,
          photo: apiData.farmer?.photo || null,
          generation: apiData.farmer?.generation || '3rd',
          yearsOfExperience: apiData.farmer?.yearsOfExperience || null,
          farmerQrCode: apiData.farmer?.farmerQrCode || null,
          farmerProfileUrl: apiData.farmer?.farmerProfileUrl || null,
          bio: apiData.farmer?.bio || null,
        },
        photos: apiData.photos || [],
        compliance: {
          euOrganic: apiData.compliance?.euOrganic || 'RS-BIO-001',
          soilHealth: apiData.compliance?.soilHealth || new Date().toLocaleDateString('en-GB'),
          pesticideFree: apiData.compliance?.pesticideFree || 'Negative',
          waterPurity: apiData.compliance?.waterPurity || 'Izvorska voda',
        },
        timeline: {
          harvested: apiData.timeline?.harvested || apiData.batch?.harvestDate || new Date().toISOString(),
          stored: apiData.timeline?.stored ? {
            date: apiData.timeline.stored.date,
            temperature: apiData.timeline.stored.temperature || 4,
            humidity: apiData.timeline.stored.humidity || 60,
          } : null,
          transport: apiData.transit ? {
            vehicleNumber: apiData.transit.vehicleNumber || 'VEH-001',
            route: `Origin → Europe`,
          } : null,
          arrival: {
            estimated: apiData.timeline?.arrived || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            location: 'European Market',
          },
        },
        labReport: {
          url: apiData.labReport?.url || '#',
          available: apiData.labReport?.available !== false,
        },
      };
      
      setData(passportData);
    } catch (err: any) {
      setError(err.message || 'Failed to load passport data');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-[1.5px] border-[#1A3021] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#1A3021] text-sm font-light">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-light text-[#1A3021] mb-2">Podaci nisu pronađeni</h1>
          <p className="text-sm text-[#1A3021]/60 font-light">{error || 'Passport podaci ne postoje.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* 1. Product details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 pb-8 border-b border-black/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-[#A4C639]" strokeWidth={1.5} />
            <span className="text-[10px] font-light tracking-[0.2em] text-[#1A3021]/60 uppercase">Product</span>
          </div>
          <h1 className="text-2xl font-light text-[#1A3021] mb-2">{data.batch.productName}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#1A3021]/80">
            <span>Batch: {data.batch.batchId}</span>
            <span>{data.batch.quantity} {data.batch.unit}</span>
            <span>Harvested: {formatDate(data.batch.harvestDate)}</span>
          </div>
        </motion.div>

        {/* 2. Photos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-10 pb-8 border-b border-black/10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-4 h-4 text-[#A4C639]" strokeWidth={1.5} />
            <span className="text-[10px] font-light tracking-[0.2em] text-[#1A3021]/60 uppercase">Photos</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.farmer.photo && (
              <div className="relative aspect-square rounded-xl overflow-hidden border border-black/10">
                <Image src={data.farmer.photo} alt="Producer" fill className="object-cover" unoptimized />
                <span className="absolute bottom-1 left-1 right-1 text-[10px] font-light text-white/90 bg-black/40 rounded px-1.5 py-0.5">Producer</span>
              </div>
            )}
            {(data.photos || []).map((p, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-black/10">
                <Image src={p.url} alt={p.type} fill className="object-cover" unoptimized />
                <span className="absolute bottom-1 left-1 right-1 text-[10px] font-light text-white/90 bg-black/40 rounded px-1.5 py-0.5 truncate">{p.type}</span>
              </div>
            ))}
            {(!data.farmer.photo && (!data.photos || data.photos.length === 0)) && (
              <div className="col-span-2 sm:col-span-3 aspect-video rounded-xl bg-gradient-to-br from-[#2D5A27]/10 to-[#2D5A27]/20 flex flex-col items-center justify-center gap-2 border border-black/5">
                <span className="text-4xl">🌱</span>
                <p className="text-[11px] font-light text-[#1A3021]/50">No photos yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* 3. Producer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#A4C639]" strokeWidth={1.5} />
            <span className="text-[10px] font-light tracking-[0.2em] text-[#1A3021]/60 uppercase">Producer</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-black/5 flex-shrink-0">
              {data.farmer.photo ? (
                <Image src={data.farmer.photo} alt={data.farmer.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#2D5A27]/10 to-[#2D5A27]/20 flex items-center justify-center">
                  <span className="text-3xl">🌱</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-light tracking-[0.2em] text-[#1A3021]/50 uppercase mb-1">VERA PRODUCER</p>
              <h2 className="text-lg font-light text-[#1A3021] mb-1">{data.farmer.name}</h2>
              <div className="flex items-center gap-1.5 text-sm text-[#1A3021]/70">
                <MapPin className="w-3.5 h-3.5" strokeWidth={1} />
                {data.origin.farmName} · {data.origin.location}
              </div>
              {data.farmer.bio && <p className="text-sm text-[#1A3021]/70 mt-2 font-light">{data.farmer.bio}</p>}
              {data.farmer.yearsOfExperience != null && (
                <p className="text-xs text-[#1A3021]/50 mt-1">{data.farmer.yearsOfExperience} years of experience</p>
              )}
              {data.farmer.farmerProfileUrl && (
                <a
                  href={data.farmer.farmerProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-xs font-light text-[#A4C639] hover:underline"
                >
                  Meet the person who picked this →
                </a>
              )}
            </div>
          </div>
          <div className="flex justify-start items-center gap-2 mt-6">
            <Shield className="w-4 h-4 text-[#A4C639]" strokeWidth={1.5} />
            <span className="text-[10px] font-light tracking-[0.2em] text-[#1A3021]/60 uppercase">Vera Integrity</span>
          </div>
        </motion.div>

        {/* Bio-Compliance Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-xs font-light tracking-[0.15em] text-[#1A3021]/60 uppercase mb-4">
            Bio-Compliance
          </h2>
          <div className="grid grid-cols-2 gap-[0.5px] bg-black/10">
            {/* EU Organic */}
            <div className="bg-white p-4 border-[0.5px] border-black/10">
              <p className="text-[9px] font-light text-[#1A3021]/40 mb-1 uppercase tracking-wider">
                EU Organic
              </p>
              <p className="text-[11px] font-light text-[#1A3021]">
                {data.compliance.euOrganic}
              </p>
            </div>

            {/* Soil Health */}
            <div className="bg-white p-4 border-[0.5px] border-black/10">
              <p className="text-[9px] font-light text-[#1A3021]/40 mb-1 uppercase tracking-wider">
                Soil Health
              </p>
              <p className="text-[11px] font-light text-[#1A3021]">
                {formatDate(data.compliance.soilHealth)}
              </p>
            </div>

            {/* Pesticide Free */}
            <div className="bg-white p-4 border-[0.5px] border-black/10">
              <p className="text-[9px] font-light text-[#1A3021]/40 mb-1 uppercase tracking-wider">
                Pesticide Free
              </p>
              <p className="text-[11px] font-light text-[#1A3021]">
                {data.compliance.pesticideFree}
              </p>
            </div>

            {/* Water Purity */}
            <div className="bg-white p-4 border-[0.5px] border-black/10">
              <p className="text-[9px] font-light text-[#1A3021]/40 mb-1 uppercase tracking-wider">
                Water Purity
              </p>
              <p className="text-[11px] font-light text-[#1A3021]">
                {data.compliance.waterPurity}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Interactive Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-xs font-light tracking-[0.15em] text-[#1A3021]/60 uppercase mb-6">
            The Journey
          </h2>
          
          <div className="relative pl-6">
            {/* Vertical Line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-[0.5px] bg-black/10"></div>

            {/* Timeline Items */}
            <div className="space-y-8">
              {/* Harvested */}
              <div className="relative">
                <div className="absolute left-[-23px] top-1 w-3 h-3 bg-[#A4C639] rounded-full border-2 border-white"></div>
                <div>
                  <p className="text-[9px] font-light text-[#1A3021]/40 uppercase tracking-wider mb-1">
                    Ubrano
                  </p>
                  <p className="text-[11px] font-light text-[#1A3021]">
                    {formatDateTime(data.timeline.harvested)}
                  </p>
                </div>
              </div>

              {/* Stored */}
              {data.timeline.stored && (
                <div className="relative">
                  <div className="absolute left-[-23px] top-1 w-3 h-3 bg-[#A4C639] rounded-full border-2 border-white"></div>
                  <div>
                    <p className="text-[9px] font-light text-[#1A3021]/40 uppercase tracking-wider mb-1">
                      Skladišteno
                    </p>
                    <p className="text-[11px] font-light text-[#1A3021]">
                      {formatDateTime(data.timeline.stored.date)}
                    </p>
                    <p className="text-[10px] font-light text-[#1A3021]/60 mt-1">
                      {data.timeline.stored.temperature}°C, {data.timeline.stored.humidity}% RH
                    </p>
                  </div>
                </div>
              )}

              {/* Transport */}
              {data.timeline.transport && (
                <div className="relative">
                  <div className="absolute left-[-23px] top-1 w-3 h-3 bg-[#A4C639] rounded-full border-2 border-white"></div>
                  <div>
                    <p className="text-[9px] font-light text-[#1A3021]/40 uppercase tracking-wider mb-1">
                      Transport
                    </p>
                    <p className="text-[11px] font-light text-[#1A3021]">
                      {data.timeline.transport.vehicleNumber}
                    </p>
                    <p className="text-[10px] font-light text-[#1A3021]/60 mt-1">
                      {data.timeline.transport.route}
                    </p>
                  </div>
                </div>
              )}

              {/* Arrival */}
              {data.timeline.arrival && (
                <div className="relative">
                  <div className="absolute left-[-23px] top-1 w-3 h-3 bg-[#A4C639] rounded-full border-2 border-white"></div>
                  <div>
                    <p className="text-[9px] font-light text-[#1A3021]/40 uppercase tracking-wider mb-1">
                      Dolazak
                    </p>
                    <p className="text-[11px] font-light text-[#1A3021]">
                      {formatDateTime(data.timeline.arrival.estimated)}
                    </p>
                    <p className="text-[10px] font-light text-[#1A3021]/60 mt-1">
                      {data.timeline.arrival.location}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        {data.labReport?.available && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-8 border-t border-black/10"
          >
            <a
              href={data.labReport.url}
              download
              className="flex items-center justify-center gap-2 w-full py-3 border border-black/10 hover:border-[#A4C639] hover:bg-[#A4C639]/5 transition-all group"
            >
              <Download className="w-3.5 h-3.5 text-[#1A3021] group-hover:text-[#A4C639] transition-colors" strokeWidth={1.5} />
              <span className="text-[11px] font-light text-[#1A3021] tracking-wider uppercase">
                Preuzmi laboratorijski nalaz (PDF)
              </span>
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
