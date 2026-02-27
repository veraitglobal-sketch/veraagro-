'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Download, MapPin, Package, Camera, Truck, CheckCircle, AlertTriangle, Thermometer, Clock } from 'lucide-react';
import Image from 'next/image';
import { getFirstName } from '@/lib/farmer-utils';
import { BlockchainVerification } from '@/components/BlockchainVerification';

interface Treatment {
  appliedAt: string;
  productName: string;
  dosage: string;
  waterVolume: number | null;
  reason: string | null;
  deviceTimestamp: string;
}
interface GrowthLog {
  networkTimestamp: string;
  deviceTimestamp: string;
  growthStage: string | null;
  notes: string | null;
  labTestDate: string | null;
}
interface HarvestAnnouncement {
  estimatedDate: string;
  actualDate: string | null;
  cropType: string;
  estimatedQuantity: number | null;
  actualQuantity: number | null;
  status: string;
  notes: string | null;
}

interface PassportData {
  qrId?: string;
  batch: {
    batchId: string;
    estateId?: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: string;
    status?: string;
    isCompromised?: boolean;
  };
  harvest: {
    where: string;
    when: string;
    period: string | null;
  };
  origin: {
    farmName: string;
    location: string;
    harvestLocation?: string;
    harvestPeriod?: string | null;
  };
  farmer: { name: string; photo: string | null; farmerProfileUrl?: string | null };
  photos?: { url: string; type: string; verified: boolean }[];
  compliance: {
    euOrganic: string;
    soilHealth: string;
    pesticideFree: string;
    waterPurity: string;
  };
  timeline: {
    harvested: string;
    verified?: string | null;
    loaded?: string | null;
    arrived?: string | null;
    stored: { date: string; temperature: number; humidity: number } | null;
    transport: { vehicleNumber: string; route: string; licensePlate?: string } | null;
    arrival: { estimated: string; location: string } | null;
  };
  coldChain?: {
    minTemp?: number | null;
    maxTemp?: number | null;
    avgTemp?: number | null;
    isWithinRange?: boolean | null;
    temperatureData?: { timestamp: string; temperature: number; location?: string }[];
  } | null;
  freshness?: {
    remainingShelfLifeHours?: number;
    expiresAt?: string;
    timestampHarvested?: string;
    isExpired?: boolean;
  } | null;
  sustainability?: { totalDistanceKm?: string; sustainabilityScore?: string; route?: string | null } | null;
  missions?: {
    missionNumber?: string;
    status?: string;
    vehicle?: { vehicleNumber?: string; licensePlate?: string };
    pickedUpAt?: string | null;
    deliveredAt?: string | null;
  }[];
  protocol360?: {
    overallStatus?: string;
    levels?: { level: number; name: string; status: string; badgeText?: string }[];
    brandingSlogan?: string;
  } | null;
  labReport?: { url: string; available: boolean };
  parcelInfo?: { cropType: string | null; plantingDate: string | null; expectedHarvestDate: string | null } | null;
  treatments?: Treatment[];
  growthLogs?: GrowthLog[];
  harvestAnnouncements?: HarvestAnnouncement[];
  qualityEntry?: { preCoolingStartTime: string; weatherAtHarvest: unknown; notes: string | null; status: string } | null;
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
      
      const harvestDate = apiData.batch?.harvestDate || apiData.timeline?.harvested || new Date().toISOString();
      const harvestWhen = new Date(harvestDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const harvestPeriod = apiData.origin?.harvestPeriod || (() => {
        const d = new Date(harvestDate);
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[d.getMonth()]} ${d.getFullYear()}`;
      })();
      const harvestWhere = apiData.origin?.harvestLocation || [apiData.origin?.farmName, apiData.origin?.location].filter(Boolean).join(', ') || 'Certified origin';

      const passportData: PassportData = {
        qrId: apiData.qrId || undefined,
        batch: {
          batchId: apiData.batch?.batchId || batchId,
          estateId: apiData.batch?.estateId,
          productName: apiData.batch?.productName || 'Organic Product',
          quantity: apiData.batch?.quantity || 0,
          unit: apiData.batch?.unit || 'kg',
          harvestDate,
          status: apiData.batch?.status,
          isCompromised: apiData.batch?.isCompromised,
        },
        harvest: {
          where: harvestWhere,
          when: harvestWhen,
          period: harvestPeriod,
        },
        origin: {
          farmName: apiData.origin?.farmName || 'Farm',
          location: apiData.origin?.location || apiData.origin?.harvestRegion || '',
          harvestLocation: apiData.origin?.harvestLocation,
          harvestPeriod: apiData.origin?.harvestPeriod || harvestPeriod,
        },
        farmer: {
          name: getFirstName(apiData.farmer?.name || apiData.origin?.ownerName || ''),
          photo: apiData.farmer?.photo || null,
          farmerProfileUrl: apiData.farmer?.farmerProfileUrl || null,
        },
        photos: apiData.photos || [],
        compliance: {
          euOrganic: apiData.compliance?.euOrganic || 'RS-BIO-001',
          soilHealth: apiData.compliance?.soilHealth || new Date().toLocaleDateString('en-GB'),
          pesticideFree: apiData.compliance?.pesticideFree || 'Negative',
          waterPurity: apiData.compliance?.waterPurity || 'Izvorska voda',
        },
        timeline: (() => {
          const toIso = (v: unknown) => (v == null ? undefined : typeof v === 'string' ? v : new Date(v as Date).toISOString());
          const arrived = apiData.timeline?.arrived != null ? toIso(apiData.timeline.arrived) : apiData.missions?.[0]?.deliveredAt != null ? toIso(apiData.missions[0].deliveredAt) : undefined;
          return {
            harvested: apiData.timeline?.harvested || harvestDate,
            verified: apiData.timeline?.verified != null ? toIso(apiData.timeline.verified) : null,
            loaded: apiData.timeline?.loaded != null ? toIso(apiData.timeline.loaded) : null,
            arrived: arrived || undefined,
            stored: apiData.timeline?.stored ? { date: apiData.timeline.stored.date, temperature: apiData.timeline.stored.temperature ?? 4, humidity: apiData.timeline.stored.humidity ?? 60 } : null,
            transport: apiData.missions?.[0] ? { vehicleNumber: apiData.missions[0].vehicle?.vehicleNumber || apiData.missions[0].vehicle?.licensePlate || '—', licensePlate: apiData.missions[0].vehicle?.licensePlate, route: apiData.sustainability?.route || 'Origin → Destination' } : apiData.timeline?.transport || null,
            arrival: arrived ? { estimated: arrived, location: 'European Market' } : null,
          };
        })(),
        coldChain: apiData.coldChainProof ? {
          minTemp: apiData.coldChainProof.minTemp,
          maxTemp: apiData.coldChainProof.maxTemp,
          avgTemp: apiData.coldChainProof.avgTemp,
          isWithinRange: apiData.coldChainProof.isWithinRange,
          temperatureData: apiData.coldChainProof.temperatureData?.map((d: { timestamp: string; temperature: number; location?: string }) => ({ timestamp: typeof d.timestamp === 'string' ? d.timestamp : new Date(d.timestamp).toISOString(), temperature: d.temperature, location: d.location })),
        } : null,
        freshness: apiData.freshness ? { remainingShelfLifeHours: apiData.freshness.remainingShelfLifeHours, expiresAt: apiData.freshness.expiresAt != null ? (typeof apiData.freshness.expiresAt === 'string' ? apiData.freshness.expiresAt : new Date(apiData.freshness.expiresAt).toISOString()) : undefined, timestampHarvested: apiData.freshness.timestampHarvested != null ? (typeof apiData.freshness.timestampHarvested === 'string' ? apiData.freshness.timestampHarvested : new Date(apiData.freshness.timestampHarvested).toISOString()) : undefined, isExpired: apiData.freshness.isExpired } : null,
        sustainability: apiData.sustainability ? { totalDistanceKm: apiData.sustainability.totalDistanceKm, sustainabilityScore: apiData.sustainability.sustainabilityScore, route: apiData.sustainability.route } : null,
        missions: apiData.missions?.map((m: any) => ({ missionNumber: m.missionNumber, status: m.status, vehicle: m.vehicle, pickedUpAt: m.pickedUpAt != null ? (typeof m.pickedUpAt === 'string' ? m.pickedUpAt : new Date(m.pickedUpAt).toISOString()) : null, deliveredAt: m.deliveredAt != null ? (typeof m.deliveredAt === 'string' ? m.deliveredAt : new Date(m.deliveredAt).toISOString()) : null })),
        protocol360: apiData.protocol360 || null,
        labReport: { url: apiData.labReport?.url || '#', available: apiData.labReport?.available !== false },
        parcelInfo: apiData.parcelInfo ? {
          cropType: apiData.parcelInfo.cropType ?? null,
          plantingDate: apiData.parcelInfo.plantingDate != null ? (typeof apiData.parcelInfo.plantingDate === 'string' ? apiData.parcelInfo.plantingDate : new Date(apiData.parcelInfo.plantingDate).toISOString()) : null,
          expectedHarvestDate: apiData.parcelInfo.expectedHarvestDate != null ? (typeof apiData.parcelInfo.expectedHarvestDate === 'string' ? apiData.parcelInfo.expectedHarvestDate : new Date(apiData.parcelInfo.expectedHarvestDate).toISOString()) : null,
        } : null,
        treatments: (apiData.treatments || []).map((t: { appliedAt: string | Date; productName: string; dosage: string; waterVolume?: number | null; reason?: string | null; deviceTimestamp: string | Date }) => ({
          appliedAt: typeof t.appliedAt === 'string' ? t.appliedAt : new Date(t.appliedAt).toISOString(),
          productName: t.productName,
          dosage: t.dosage,
          waterVolume: t.waterVolume ?? null,
          reason: t.reason ?? null,
          deviceTimestamp: typeof t.deviceTimestamp === 'string' ? t.deviceTimestamp : new Date(t.deviceTimestamp).toISOString(),
        })),
        growthLogs: (apiData.growthLogs || []).map((g: { networkTimestamp: string | Date; deviceTimestamp: string | Date; growthStage?: string | null; notes?: string | null; labTestDate?: string | Date | null }) => ({
          networkTimestamp: typeof g.networkTimestamp === 'string' ? g.networkTimestamp : new Date(g.networkTimestamp).toISOString(),
          deviceTimestamp: typeof g.deviceTimestamp === 'string' ? g.deviceTimestamp : new Date(g.deviceTimestamp).toISOString(),
          growthStage: g.growthStage ?? null,
          notes: g.notes ?? null,
          labTestDate: g.labTestDate != null ? (typeof g.labTestDate === 'string' ? g.labTestDate : new Date(g.labTestDate).toISOString()) : null,
        })),
        harvestAnnouncements: (apiData.harvestAnnouncements || []).map((h: { estimatedDate: string | Date; actualDate?: string | Date | null; cropType: string; estimatedQuantity?: number | null; actualQuantity?: number | null; status: string; notes?: string | null }) => ({
          estimatedDate: typeof h.estimatedDate === 'string' ? h.estimatedDate : new Date(h.estimatedDate).toISOString(),
          actualDate: h.actualDate != null ? (typeof h.actualDate === 'string' ? h.actualDate : new Date(h.actualDate).toISOString()) : null,
          cropType: h.cropType,
          estimatedQuantity: h.estimatedQuantity ?? null,
          actualQuantity: h.actualQuantity ?? null,
          status: h.status,
          notes: h.notes ?? null,
        })),
        qualityEntry: apiData.qualityEntry ? {
          preCoolingStartTime: typeof apiData.qualityEntry.preCoolingStartTime === 'string' ? apiData.qualityEntry.preCoolingStartTime : new Date(apiData.qualityEntry.preCoolingStartTime).toISOString(),
          weatherAtHarvest: apiData.qualityEntry.weatherAtHarvest,
          notes: apiData.qualityEntry.notes ?? null,
          status: apiData.qualityEntry.status,
        } : null,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-[1.5px] border-[#2D5A27] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-sm font-light">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-light text-gray-900 mb-2">Podaci nisu pronađeni</h1>
          <p className="text-sm text-gray-600 font-light">{error || 'Passport podaci ne postoje.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* 1. Product – detailed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 pb-6 border-b border-gray-200"
        >
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
            <span className="text-[10px] font-light tracking-[0.2em] text-gray-500 uppercase">Product</span>
          </div>
          <h1 className="text-2xl font-light text-gray-900 mb-2">{data.batch.productName}</h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span><strong className="font-medium text-gray-900">Batch ID:</strong> {data.batch.batchId}</span>
            <span><strong className="font-medium text-gray-900">Quantity:</strong> {data.batch.quantity} {data.batch.unit}</span>
            {data.batch.status && <span><strong className="font-medium text-gray-900">Status:</strong> {data.batch.status}</span>}
            {data.qrId && <span className="text-gray-500 font-mono text-xs">{data.qrId}</span>}
          </div>
          {data.batch.isCompromised && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Temperature deviation recorded. Check cold chain log.</span>
            </div>
          )}
          {data.batch.estateId && (
            <div className="mt-6">
              <BlockchainVerification
                batchId={data.batch.batchId}
                estateId={data.batch.estateId}
                harvestDate={typeof data.batch.harvestDate === 'string' ? data.batch.harvestDate : new Date(data.batch.harvestDate).toISOString()}
                productType={data.batch.productName}
              />
            </div>
          )}
        </motion.div>

        {/* 2. Where & When harvested – detailed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="mb-10 pb-8 border-b border-gray-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
            <span className="text-[10px] font-light tracking-[0.2em] text-gray-500 uppercase">Harvest</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[9px] font-light text-gray-500 uppercase tracking-wider mb-1">Where harvested</p>
              <p className="text-[15px] font-light text-gray-900">{data.harvest.where}</p>
              {data.origin.farmName && data.origin.farmName !== data.harvest.where && (
                <p className="text-[11px] font-light text-gray-600 mt-1">Estate: {data.origin.farmName}</p>
              )}
              {data.origin.location && <p className="text-[11px] font-light text-gray-600">Region: {data.origin.location}</p>}
            </div>
            <div>
              <p className="text-[9px] font-light text-gray-500 uppercase tracking-wider mb-1">When harvested</p>
              <p className="text-[15px] font-light text-gray-900">{data.harvest.when}</p>
              {data.harvest.period && <p className="text-[11px] font-light text-gray-600 mt-0.5">Period: {data.harvest.period}</p>}
            </div>
          </div>
        </motion.div>

        {/* 2b. Aktivnosti po periodu – šta je radjeno kada (raw detailed chronology) */}
        {(() => {
          const chronologyEvents: { sortKey: number; displayDate: string; label: string; detail: string }[] = [];
          if (data.parcelInfo?.plantingDate) {
            chronologyEvents.push({
              sortKey: new Date(data.parcelInfo.plantingDate).getTime(),
              displayDate: formatDateTime(data.parcelInfo.plantingDate),
              label: 'Sadnja (Planting)',
              detail: `Period uzgoja započet. ${data.parcelInfo.cropType ? `Kultura: ${data.parcelInfo.cropType}.` : ''}`,
            });
          }
          if (data.parcelInfo?.expectedHarvestDate) {
            chronologyEvents.push({
              sortKey: new Date(data.parcelInfo.expectedHarvestDate).getTime(),
              displayDate: formatDate(data.parcelInfo.expectedHarvestDate),
              label: 'Očekivana berba (Expected harvest)',
              detail: `Planirani kraj perioda uzgoja.`,
            });
          }
          (data.treatments || []).forEach((t) => {
            chronologyEvents.push({
              sortKey: new Date(t.appliedAt).getTime(),
              displayDate: formatDateTime(t.appliedAt),
              label: 'Primena sredstva (Treatment)',
              detail: `${t.productName} · doza: ${t.dosage}${t.waterVolume != null ? ` · voda: ${t.waterVolume} L` : ''}${t.reason ? ` · razlog: ${t.reason}` : ''}`,
            });
          });
          (data.growthLogs || []).forEach((g) => {
            chronologyEvents.push({
              sortKey: new Date(g.networkTimestamp).getTime(),
              displayDate: formatDateTime(g.networkTimestamp),
              label: 'Zapis rasta (Growth log)',
              detail: [g.growthStage && `Faza: ${g.growthStage}`, g.notes].filter(Boolean).join(' · ') || 'Zapis u terenu',
            });
          });
          (data.harvestAnnouncements || []).forEach((h) => {
            chronologyEvents.push({
              sortKey: new Date(h.estimatedDate).getTime(),
              displayDate: formatDate(h.estimatedDate),
              label: 'Najava berbe (Harvest announcement)',
              detail: `${h.cropType} · procena: ${formatDate(h.estimatedDate)}${h.actualDate ? ` · stvarno: ${formatDate(h.actualDate)}` : ''} · ${h.status}`,
            });
          });
          if (data.timeline?.harvested) {
            chronologyEvents.push({
              sortKey: new Date(data.timeline.harvested).getTime(),
              displayDate: formatDateTime(data.timeline.harvested),
              label: 'Ubrano (Harvested)',
              detail: data.harvest.where,
            });
          }
          if (data.qualityEntry?.preCoolingStartTime) {
            chronologyEvents.push({
              sortKey: new Date(data.qualityEntry.preCoolingStartTime).getTime(),
              displayDate: formatDateTime(data.qualityEntry.preCoolingStartTime),
              label: 'Predhladnjenje / kontrola kvaliteta',
              detail: `Status: ${data.qualityEntry.status}`,
            });
          }
          if (data.timeline?.verified) {
            chronologyEvents.push({
              sortKey: new Date(data.timeline.verified).getTime(),
              displayDate: formatDateTime(data.timeline.verified),
              label: 'Kontrola kvaliteta verifikovana',
              detail: 'Prošao kontrolu.',
            });
          }
          if (data.timeline?.loaded) {
            chronologyEvents.push({
              sortKey: new Date(data.timeline.loaded).getTime(),
              displayDate: formatDateTime(data.timeline.loaded),
              label: 'Preuzeto za transport (Picked up)',
              detail: data.timeline.transport ? `Vozilo: ${data.timeline.transport.vehicleNumber}` : '—',
            });
          }
          const arrivedAt = data.timeline?.arrived || data.timeline?.arrival?.estimated;
          if (arrivedAt) {
            chronologyEvents.push({
              sortKey: new Date(arrivedAt).getTime(),
              displayDate: formatDateTime(arrivedAt),
              label: 'Dolazak (Arrival)',
              detail: data.timeline?.arrival?.location || 'Destinacija',
            });
          }
          chronologyEvents.sort((a, b) => a.sortKey - b.sortKey);

          if (chronologyEvents.length === 0) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
              className="mb-10 pb-8 border-b border-gray-200"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
                <span className="text-[10px] font-light tracking-[0.2em] text-gray-500 uppercase">Aktivnosti po periodu – šta je radjeno kada</span>
              </div>
              <p className="text-xs font-light text-gray-600 mb-4">Hronološki pregled svih zabeleženih aktivnosti za ovaj batch (datum i vreme, aktivnost, detalj).</p>
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="py-3 px-4 font-medium text-gray-700">Datum i vreme</th>
                        <th className="py-3 px-4 font-medium text-gray-700">Aktivnost</th>
                        <th className="py-3 px-4 font-medium text-gray-700">Detalj</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {chronologyEvents.map((ev, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-4 font-mono text-xs text-gray-600 whitespace-nowrap">{ev.displayDate}</td>
                          <td className="py-2.5 px-4 font-medium text-gray-900">{ev.label}</td>
                          <td className="py-2.5 px-4 text-gray-700">{ev.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* 2c. Korišćena sredstva (treatments) – full detail */}
        {data.treatments && data.treatments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-10 pb-8 border-b border-gray-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
              <span className="text-[10px] font-light tracking-[0.2em] text-gray-500 uppercase">Korišćena sredstva (Inputs / Treatments)</span>
            </div>
            <p className="text-xs font-light text-gray-600 mb-4">Sva sredstva primenjena na parceli u periodu uzgoja: proizvod, doza, količina vode, razlog, tačan datum i vreme primene.</p>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="max-h-[360px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-4 font-medium text-gray-700">Datum i vreme primene</th>
                      <th className="py-3 px-4 font-medium text-gray-700">Proizvod</th>
                      <th className="py-3 px-4 font-medium text-gray-700">Doza</th>
                      <th className="py-3 px-4 font-medium text-gray-700">Voda (L)</th>
                      <th className="py-3 px-4 font-medium text-gray-700">Razlog</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.treatments.map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-mono text-xs text-gray-600 whitespace-nowrap">{formatDateTime(t.appliedAt)}</td>
                        <td className="py-2.5 px-4 font-medium text-gray-900">{t.productName}</td>
                        <td className="py-2.5 px-4 text-gray-700">{t.dosage}</td>
                        <td className="py-2.5 px-4 text-gray-700">{t.waterVolume != null ? t.waterVolume : '—'}</td>
                        <td className="py-2.5 px-4 text-gray-700">{t.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3. Cold chain & Freshness – detailed */}
        {(data.coldChain || data.freshness) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-10 pb-8 border-b border-gray-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <Thermometer className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
              <span className="text-[10px] font-light tracking-[0.2em] text-[gray-900]/60 uppercase">Cold chain & freshness</span>
            </div>
            <div className="space-y-4">
              {data.coldChain && (
                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                  <p className="text-[9px] font-light text-[gray-900]/40 uppercase tracking-wider mb-2">Temperature</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    {data.coldChain.minTemp != null && <p className="text-[gray-900]/80"><strong>Min:</strong> {data.coldChain.minTemp}°C</p>}
                    {data.coldChain.maxTemp != null && <p className="text-[gray-900]/80"><strong>Max:</strong> {data.coldChain.maxTemp}°C</p>}
                    {data.coldChain.avgTemp != null && <p className="text-[gray-900]/80"><strong>Avg:</strong> {Number(data.coldChain.avgTemp).toFixed(1)}°C</p>}
                    {data.coldChain.isWithinRange !== undefined && data.coldChain.isWithinRange !== null && (
                      <p className="text-[gray-900]/80 flex items-center gap-1">
                        {data.coldChain.isWithinRange ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                        {data.coldChain.isWithinRange ? 'Within safe range' : 'Check logs'}
                      </p>
                    )}
                  </div>
                  {data.coldChain.temperatureData && data.coldChain.temperatureData.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[9px] font-light text-[gray-900]/40 uppercase tracking-wider mb-2">Log ({data.coldChain.temperatureData.length} readings)</p>
                      <div className="max-h-32 overflow-y-auto rounded border border-gray-100 bg-white">
                        <table className="w-full text-[11px]">
                          <thead><tr className="border-b border-gray-100"><th className="text-left py-1.5 px-2">Time</th><th className="text-left py-1.5 px-2">°C</th><th className="text-left py-1.5 px-2">Location</th></tr></thead>
                          <tbody>
                            {data.coldChain.temperatureData.slice(0, 20).map((row, i) => (
                              <tr key={i} className="border-b border-gray-100 last:border-0"><td className="py-1 px-2">{formatDateTime(row.timestamp)}</td><td className="py-1 px-2">{row.temperature}</td><td className="py-1 px-2">{row.location || '—'}</td></tr>
                            ))}
                          </tbody>
                        </table>
                        {data.coldChain.temperatureData.length > 20 && <p className="text-[10px] text-[gray-900]/50 px-2 py-1">+ {data.coldChain.temperatureData.length - 20} more</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {data.freshness && (
                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                  <p className="text-[9px] font-light text-[gray-900]/40 uppercase tracking-wider mb-2">Freshness</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    {data.freshness.remainingShelfLifeHours != null && <p className="text-[gray-900]/80"><strong>Remaining:</strong> {Math.round(data.freshness.remainingShelfLifeHours)}h</p>}
                    {data.freshness.expiresAt && <p className="text-[gray-900]/80"><strong>Use by:</strong> {formatDate(data.freshness.expiresAt)}</p>}
                    {data.freshness.timestampHarvested && <p className="text-[gray-900]/80"><strong>Harvested at:</strong> {formatDateTime(data.freshness.timestampHarvested)}</p>}
                    {data.freshness.isExpired != null && <p className="text-[gray-900]/80">{data.freshness.isExpired ? 'Expired' : 'Fresh'}</p>}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 4. Photos (product / field / packaging) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-10 pb-8 border-b border-gray-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
            <span className="text-[10px] font-light tracking-[0.2em] text-[gray-900]/60 uppercase">Photos</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(data.photos || []).map((p, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                <Image src={p.url} alt={p.type} fill className="object-cover" unoptimized />
                <span className="absolute bottom-1 left-1 right-1 text-[10px] font-light text-white/90 bg-black/40 rounded px-1.5 py-0.5 truncate">{p.type}</span>
                {p.verified && <span className="absolute top-1 right-1 text-[9px] font-medium text-green-800 bg-green-200/90 rounded px-1.5 py-0.5">Verified</span>}
              </div>
            ))}
            {(!data.photos || data.photos.length === 0) && (
              <div className="col-span-2 sm:col-span-3 aspect-video rounded-xl bg-gradient-to-br from-[#2D5A27]/10 to-[#2D5A27]/20 flex flex-col items-center justify-center gap-2 border border-gray-100">
                <span className="text-4xl">🌱</span>
                <p className="text-[11px] font-light text-[gray-900]/50">No photos yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bio-Compliance – detailed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-xs font-light tracking-[0.15em] text-[gray-900]/60 uppercase mb-2">
            Bio-Compliance
          </h2>
          <p className="text-[11px] font-light text-[gray-900]/60 mb-4">Certification and compliance data for this batch.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-[9px] font-light text-[gray-900]/40 mb-1 uppercase tracking-wider">EU Organic</p>
              <p className="text-[11px] font-light text-[gray-900]">{data.compliance.euOrganic}</p>
              <p className="text-[10px] font-light text-[gray-900]/50 mt-1">Certification reference</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-[9px] font-light text-[gray-900]/40 mb-1 uppercase tracking-wider">Soil Health</p>
              <p className="text-[11px] font-light text-[gray-900]">{!isNaN(new Date(data.compliance.soilHealth).getTime()) ? formatDate(data.compliance.soilHealth) : data.compliance.soilHealth}</p>
              <p className="text-[10px] font-light text-[gray-900]/50 mt-1">Last assessment date</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-[9px] font-light text-[gray-900]/40 mb-1 uppercase tracking-wider">Pesticide Free</p>
              <p className="text-[11px] font-light text-[gray-900]">{data.compliance.pesticideFree}</p>
              <p className="text-[10px] font-light text-[gray-900]/50 mt-1">Residue check result</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-[9px] font-light text-[gray-900]/40 mb-1 uppercase tracking-wider">Water Purity</p>
              <p className="text-[11px] font-light text-[gray-900]">{data.compliance.waterPurity}</p>
              <p className="text-[10px] font-light text-[gray-900]/50 mt-1">Water source / quality</p>
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
          <h2 className="text-xs font-light tracking-[0.15em] text-[gray-900]/60 uppercase mb-6">
            The Journey
          </h2>
          
          <div className="relative pl-6">
            {/* Vertical Line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-[0.5px] bg-black/10"></div>

            {/* Timeline Items */}
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute left-[-23px] top-1 w-3 h-3 bg-[#2D5A27] rounded-full border-2 border-white"></div>
                <div>
                  <p className="text-[9px] font-light text-[gray-900]/40 uppercase tracking-wider mb-1">Ubrano (Harvested)</p>
                  <p className="text-[11px] font-light text-[gray-900]">{formatDateTime(data.timeline.harvested)}</p>
                </div>
              </div>

              {data.timeline.verified && (
                <div className="relative">
                  <div className="absolute left-[-23px] top-1 w-3 h-3 bg-[#2D5A27] rounded-full border-2 border-white"></div>
                  <div>
                    <p className="text-[9px] font-light text-[gray-900]/40 uppercase tracking-wider mb-1">Kontrola kvaliteta (Quality check)</p>
                    <p className="text-[11px] font-light text-[gray-900]">{formatDateTime(data.timeline.verified)}</p>
                  </div>
                </div>
              )}

              {data.timeline.loaded && (
                <div className="relative">
                  <div className="absolute left-[-23px] top-1 w-3 h-3 bg-[#2D5A27] rounded-full border-2 border-white"></div>
                  <div>
                    <p className="text-[9px] font-light text-[gray-900]/40 uppercase tracking-wider mb-1">Preuzeto (Picked up)</p>
                    <p className="text-[11px] font-light text-[gray-900]">{formatDateTime(data.timeline.loaded)}</p>
                  </div>
                </div>
              )}

              {/* Stored */}
              {data.timeline.stored && (
                <div className="relative">
                  <div className="absolute left-[-23px] top-1 w-3 h-3 bg-[#2D5A27] rounded-full border-2 border-white"></div>
                  <div>
                    <p className="text-[9px] font-light text-[gray-900]/40 uppercase tracking-wider mb-1">
                      Skladišteno
                    </p>
                    <p className="text-[11px] font-light text-[gray-900]">
                      {formatDateTime(data.timeline.stored.date)}
                    </p>
                    <p className="text-[10px] font-light text-[gray-900]/60 mt-1">
                      {data.timeline.stored.temperature}°C, {data.timeline.stored.humidity}% RH
                    </p>
                  </div>
                </div>
              )}

              {/* Transport */}
              {data.timeline.transport && (
                <div className="relative">
                  <div className="absolute left-[-23px] top-1 w-3 h-3 bg-[#2D5A27] rounded-full border-2 border-white"></div>
                  <div>
                    <p className="text-[9px] font-light text-[gray-900]/40 uppercase tracking-wider mb-1">Transport</p>
                    <p className="text-[11px] font-light text-[gray-900]">Vehicle: {data.timeline.transport.vehicleNumber}</p>
                    {data.timeline.transport.licensePlate && <p className="text-[10px] font-light text-[gray-900]/60">Plate: {data.timeline.transport.licensePlate}</p>}
                    <p className="text-[10px] font-light text-[gray-900]/60 mt-1">Route: {data.timeline.transport.route}</p>
                  </div>
                </div>
              )}

              {/* Arrival */}
              {data.timeline.arrival && (
                <div className="relative">
                  <div className="absolute left-[-23px] top-1 w-3 h-3 bg-[#2D5A27] rounded-full border-2 border-white"></div>
                  <div>
                    <p className="text-[9px] font-light text-[gray-900]/40 uppercase tracking-wider mb-1">
                      Dolazak
                    </p>
                    <p className="text-[11px] font-light text-[gray-900]">
                      {formatDateTime(data.timeline.arrival.estimated)}
                    </p>
                    <p className="text-[10px] font-light text-[gray-900]/60 mt-1">
                      {data.timeline.arrival.location}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Sustainability */}
        {data.sustainability && (data.sustainability.totalDistanceKm != null || data.sustainability.sustainabilityScore != null || data.sustainability.route) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-10 pb-8 border-b border-gray-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
              <span className="text-[10px] font-light tracking-[0.2em] text-[gray-900]/60 uppercase">Sustainability & route</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {data.sustainability.totalDistanceKm != null && <p className="text-[gray-900]/80"><strong>Distance:</strong> {data.sustainability.totalDistanceKm} km</p>}
              {data.sustainability.sustainabilityScore != null && <p className="text-[gray-900]/80"><strong>Score:</strong> {data.sustainability.sustainabilityScore}</p>}
              {data.sustainability.route && <p className="col-span-2 text-[gray-900]/80"><strong>Route:</strong> {data.sustainability.route}</p>}
            </div>
          </motion.div>
        )}

        {/* Missions – detailed */}
        {data.missions && data.missions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-10 pb-8 border-b border-gray-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
              <span className="text-[10px] font-light tracking-[0.2em] text-[gray-900]/60 uppercase">Missions</span>
            </div>
            <div className="space-y-4">
              {data.missions.map((m, i) => (
                <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                  <p className="text-[11px] font-medium text-[gray-900] mb-2">{m.missionNumber || `Mission ${i + 1}`} · {m.status || '—'}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[gray-900]/80">
                    {m.vehicle?.vehicleNumber && <span>Vehicle: {m.vehicle.vehicleNumber}</span>}
                    {m.vehicle?.licensePlate && <span>Plate: {m.vehicle.licensePlate}</span>}
                    {m.pickedUpAt && <span>Picked up: {formatDateTime(m.pickedUpAt)}</span>}
                    {m.deliveredAt && <span>Delivered: {formatDateTime(m.deliveredAt)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Protocol 360 */}
        {data.protocol360 && (data.protocol360.levels?.length || data.protocol360.overallStatus) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10 pb-8 border-b border-gray-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
              <span className="text-[10px] font-light tracking-[0.2em] text-[gray-900]/60 uppercase">Protocol 360</span>
            </div>
            {data.protocol360.overallStatus && <p className="text-sm font-light text-[gray-900] mb-3">Overall: {data.protocol360.overallStatus}</p>}
            {data.protocol360.brandingSlogan && <p className="text-[11px] text-[gray-900]/60 mb-3">{data.protocol360.brandingSlogan}</p>}
            {data.protocol360.levels && data.protocol360.levels.length > 0 && (
              <div className="space-y-2">
                {data.protocol360.levels.map((level, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
                    <span className="text-[11px] font-light text-[gray-900]">Level {level.level}: {level.name}</span>
                    <span className={`text-[10px] font-medium ${level.status === 'PASS' ? 'text-green-600' : 'text-amber-600'}`}>{level.badgeText || level.status}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Call to Action – Passport PDF (always) + Lab report (if available) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-8 border-t border-gray-200 space-y-3"
        >
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || ''}/qr/verify/${encodeURIComponent(data.batch.batchId)}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#2D5A27] text-white hover:bg-[#2D5A27]/90 transition-all group"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="text-[11px] font-light tracking-wider uppercase">
              Preuzmi pasoš (PDF) – detaljan izveštaj
            </span>
          </a>
          {data.labReport?.available && (
            <a
              href={data.labReport.url}
              download
              className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 hover:border-[#2D5A27] hover:bg-[#2D5A27]/5 transition-all group rounded-lg"
            >
              <Download className="w-3.5 h-3.5 text-gray-900 group-hover:text-[#2D5A27] transition-colors" strokeWidth={1.5} />
              <span className="text-[11px] font-light text-gray-900 tracking-wider uppercase">
                Preuzmi laboratorijski nalaz (PDF)
              </span>
            </a>
          )}
        </motion.div>
      </div>
    </div>
  );
}
