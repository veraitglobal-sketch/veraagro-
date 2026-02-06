'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Download, MapPin } from 'lucide-react';
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
  };
  compliance: {
    euOrganic: string; // RS-BIO-XXX
    soilHealth: string; // Last check date
    pesticideFree: string; // 'Negative' or status
    waterPurity: string; // Water source
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/qr/verify/${batchId}`);
      
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
          name: farmerIdentity, // Formatted identity
          photo: apiData.farmer?.photo || null,
          generation: apiData.farmer?.generation || '3rd',
        },
        compliance: {
          euOrganic: apiData.compliance?.euOrganic || 'RS-BIO-001',
          soilHealth: apiData.compliance?.soilHealth || new Date().toLocaleDateString('sr-RS'),
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
            route: `Balkan → Hamburg`,
          } : null,
          arrival: {
            estimated: apiData.timeline?.arrived || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            location: 'Hamburg Market',
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
    return date.toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
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
        {/* Header & Identity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          {/* Farmer Photo */}
          <div className="mb-6 flex justify-center">
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-black/5">
              {data.farmer.photo ? (
                <Image
                  src={data.farmer.photo}
                  alt={data.farmer.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100/50 flex items-center justify-center">
                  <span className="text-4xl">🌱</span>
                </div>
              )}
            </div>
          </div>

          {/* VERA PRODUCER Brand Prefix */}
          <div className="text-center mb-3">
            <p className="text-[10px] font-light tracking-[0.2em] text-[#1A3021]/50 uppercase">
              VERA PRODUCER
            </p>
          </div>

          {/* Farmer Name & Location */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <MapPin className="w-3 h-3 text-[#1A3021]/60" strokeWidth={1} />
              <h1 className="text-sm font-light tracking-[0.2em] text-[#1A3021]">
                {data.farmer.name}
              </h1>
            </div>
            <p className="text-xs font-light tracking-[0.15em] text-[#1A3021]/70 uppercase">
              {data.origin.location}
            </p>
          </div>

          {/* Vera Integrity Badge */}
          <div className="flex justify-center items-center gap-2 mb-8">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Shield className="w-4 h-4 text-[#A4C639]" strokeWidth={1.5} />
            </motion.div>
            <span className="text-[10px] font-light tracking-[0.2em] text-[#1A3021]/60 uppercase">
              Vera Integrity
            </span>
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
