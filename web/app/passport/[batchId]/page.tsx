'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Download, MapPin, Package, Camera, Truck, CheckCircle, AlertTriangle, Thermometer, Clock } from 'lucide-react';
import Image from 'next/image';
import { getFirstName } from '@/lib/farmer-utils';
import { BlockchainVerification } from '@/components/BlockchainVerification';
import { WEB_API_BASE } from '@/lib/api-base';

interface Treatment {
  appliedAt: string;
  productName: string;
  dosage: string;
  waterVolume: number | null;
  reason: string | null;
  deviceTimestamp: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracyM?: number | null;
  needsAudit?: boolean;
}
interface GrowthLog {
  networkTimestamp: string;
  deviceTimestamp: string;
  growthStage: string | null;
  notes: string | null;
  labTestDate: string | null;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracyM?: number | null;
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
    regionLabel?: string;
    productionCountry?: string | null;
    estateCalculatedAreaHa?: number;
    parcelCalculatedAreaHa?: number | null;
    estateMapCenter?: { lat: number; lng: number } | null;
    parcelMapCenter?: { lat: number; lng: number } | null;
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
    pickupAddress?: string;
    estimatedPickupTime?: string | null;
    assignedAt?: string | null;
    acceptedAt?: string | null;
    logisticsPartner?: { name: string } | null;
    vehicle?: {
      vehicleNumber?: string;
      licensePlate?: string;
      type?: string;
      make?: string;
      model?: string;
    };
    locationLogs?: {
      timestamp: string;
      latitude: number;
      longitude: number;
      accuracy: number | null;
      address: string | null;
    }[];
    borderWaits?: {
      borderName: string | null;
      borderArrivalTime: string;
      borderExitTime: string;
      waitTimeMinutes: number;
    }[];
    pickedUpAt?: string | null;
    deliveredAt?: string | null;
  }[];
  protocol360?: {
    overallStatus?: string;
    levels?: { level: number; name: string; status: string; badgeText?: string }[];
    brandingSlogan?: string;
  } | null;
  labReport?: { url: string; available: boolean };
  parcelInfo?: {
    cropType: string | null;
    plantingDate: string | null;
    expectedHarvestDate: string | null;
    calculatedAreaHa?: number;
    mapCenter?: { lat: number; lng: number } | null;
  } | null;
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
      const response = await fetch(`${WEB_API_BASE}/qr/verify/${batchId}`);
      
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
          regionLabel: apiData.origin?.regionLabel || apiData.origin?.harvestRegion || apiData.origin?.location,
          productionCountry: apiData.origin?.productionCountry ?? null,
          estateCalculatedAreaHa: apiData.origin?.estateCalculatedAreaHa,
          parcelCalculatedAreaHa: apiData.origin?.parcelCalculatedAreaHa ?? null,
          estateMapCenter: apiData.origin?.estateMapCenter ?? null,
          parcelMapCenter: apiData.origin?.parcelMapCenter ?? null,
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
        missions: apiData.missions?.map((m: any) => ({
          missionNumber: m.missionNumber,
          status: m.status,
          pickupAddress: m.pickupAddress,
          estimatedPickupTime: m.estimatedPickupTime != null ? (typeof m.estimatedPickupTime === 'string' ? m.estimatedPickupTime : new Date(m.estimatedPickupTime).toISOString()) : null,
          assignedAt: m.assignedAt != null ? (typeof m.assignedAt === 'string' ? m.assignedAt : new Date(m.assignedAt).toISOString()) : null,
          acceptedAt: m.acceptedAt != null ? (typeof m.acceptedAt === 'string' ? m.acceptedAt : new Date(m.acceptedAt).toISOString()) : null,
          logisticsPartner: m.logisticsPartner || null,
          vehicle: m.vehicle,
          locationLogs: (m.locationLogs || []).map((ll: any) => ({
            timestamp: typeof ll.timestamp === 'string' ? ll.timestamp : new Date(ll.timestamp).toISOString(),
            latitude: ll.latitude,
            longitude: ll.longitude,
            accuracy: ll.accuracy ?? null,
            address: ll.address ?? null,
          })),
          borderWaits: (m.borderWaits || []).map((b: any) => ({
            borderName: b.borderName ?? null,
            borderArrivalTime: typeof b.borderArrivalTime === 'string' ? b.borderArrivalTime : new Date(b.borderArrivalTime).toISOString(),
            borderExitTime: typeof b.borderExitTime === 'string' ? b.borderExitTime : new Date(b.borderExitTime).toISOString(),
            waitTimeMinutes: b.waitTimeMinutes,
          })),
          pickedUpAt: m.pickedUpAt != null ? (typeof m.pickedUpAt === 'string' ? m.pickedUpAt : new Date(m.pickedUpAt).toISOString()) : null,
          deliveredAt: m.deliveredAt != null ? (typeof m.deliveredAt === 'string' ? m.deliveredAt : new Date(m.deliveredAt).toISOString()) : null,
        })),
        protocol360: apiData.protocol360 || null,
        labReport: { url: apiData.labReport?.url || '#', available: apiData.labReport?.available !== false },
        parcelInfo: apiData.parcelInfo
          ? {
              cropType: apiData.parcelInfo.cropType ?? null,
              plantingDate:
                apiData.parcelInfo.plantingDate != null
                  ? typeof apiData.parcelInfo.plantingDate === 'string'
                    ? apiData.parcelInfo.plantingDate
                    : new Date(apiData.parcelInfo.plantingDate).toISOString()
                  : null,
              expectedHarvestDate:
                apiData.parcelInfo.expectedHarvestDate != null
                  ? typeof apiData.parcelInfo.expectedHarvestDate === 'string'
                    ? apiData.parcelInfo.expectedHarvestDate
                    : new Date(apiData.parcelInfo.expectedHarvestDate).toISOString()
                  : null,
              calculatedAreaHa: apiData.parcelInfo.calculatedAreaHa,
              mapCenter: apiData.parcelInfo.mapCenter ?? null,
            }
          : null,
        treatments: (apiData.treatments || []).map(
          (t: {
            appliedAt: string | Date;
            productName: string;
            dosage: string;
            waterVolume?: number | null;
            reason?: string | null;
            deviceTimestamp: string | Date;
            gpsLatitude?: number;
            gpsLongitude?: number;
            gpsAccuracyM?: number | null;
            needsAudit?: boolean;
          }) => ({
            appliedAt: typeof t.appliedAt === 'string' ? t.appliedAt : new Date(t.appliedAt).toISOString(),
            productName: t.productName,
            dosage: t.dosage,
            waterVolume: t.waterVolume ?? null,
            reason: t.reason ?? null,
            deviceTimestamp: typeof t.deviceTimestamp === 'string' ? t.deviceTimestamp : new Date(t.deviceTimestamp).toISOString(),
            gpsLatitude: t.gpsLatitude,
            gpsLongitude: t.gpsLongitude,
            gpsAccuracyM: t.gpsAccuracyM ?? null,
            needsAudit: t.needsAudit,
          }),
        ),
        growthLogs: (apiData.growthLogs || []).map(
          (g: {
            networkTimestamp: string | Date;
            deviceTimestamp: string | Date;
            growthStage?: string | null;
            notes?: string | null;
            labTestDate?: string | Date | null;
            gpsLatitude?: number;
            gpsLongitude?: number;
            gpsAccuracyM?: number | null;
          }) => ({
            networkTimestamp: typeof g.networkTimestamp === 'string' ? g.networkTimestamp : new Date(g.networkTimestamp).toISOString(),
            deviceTimestamp: typeof g.deviceTimestamp === 'string' ? g.deviceTimestamp : new Date(g.deviceTimestamp).toISOString(),
            growthStage: g.growthStage ?? null,
            notes: g.notes ?? null,
            labTestDate: g.labTestDate != null ? (typeof g.labTestDate === 'string' ? g.labTestDate : new Date(g.labTestDate).toISOString()) : null,
            gpsLatitude: g.gpsLatitude,
            gpsLongitude: g.gpsLongitude,
            gpsAccuracyM: g.gpsAccuracyM ?? null,
          }),
        ),
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
          <p className="mt-4 text-gray-600 text-sm font-light">Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-light text-gray-900 mb-2">Data not found</h1>
          <p className="text-sm text-gray-600 font-light">{error || 'Passport data is not available.'}</p>
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

        {/* Region & place of origin – full traceability */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          className="mb-10 pb-8 border-b border-gray-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
            <span className="text-[10px] font-light tracking-[0.2em] text-gray-500 uppercase">Region &amp; place of origin</span>
          </div>
          <div className="rounded-xl border border-[#2D5A27]/20 bg-white p-4 space-y-3 text-sm">
            <div>
              <p className="text-[9px] font-light text-gray-500 uppercase tracking-wider mb-0.5">Region (where it is grown)</p>
              <p className="text-lg font-light text-gray-900">{data.origin.regionLabel || data.origin.location || data.harvest.where}</p>
              {data.origin.productionCountry && (
                <p className="text-[12px] text-gray-600 mt-1">Country: {data.origin.productionCountry}</p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[12px] text-gray-700 border-t border-gray-100 pt-3">
              <p>
                <span className="text-gray-500">Estate / farm name</span>
                <br />
                <span className="font-medium text-gray-900">{data.origin.farmName}</span>
              </p>
              {(data.origin.estateCalculatedAreaHa != null || data.origin.parcelCalculatedAreaHa != null) && (
                <p>
                  <span className="text-gray-500">Surface</span>
                  <br />
                  {data.origin.estateCalculatedAreaHa != null && (
                    <span className="font-mono text-gray-900">Field: {Number(data.origin.estateCalculatedAreaHa).toFixed(2)} ha</span>
                  )}
                  {data.origin.parcelCalculatedAreaHa != null && (
                    <span className="font-mono text-gray-900 block sm:inline sm:ml-2">· Plot: {Number(data.origin.parcelCalculatedAreaHa).toFixed(2)} ha</span>
                  )}
                </p>
              )}
            </div>
            {(data.origin.parcelMapCenter || data.origin.estateMapCenter) && (
              <div className="text-[11px] font-mono text-gray-600 border-t border-gray-100 pt-3">
                <span className="text-gray-500 font-sans block mb-1">Approx. map centre (verified polygon)</span>
                {data.origin.parcelMapCenter && (
                  <span className="block">
                    Plot: {data.origin.parcelMapCenter.lat.toFixed(5)}, {data.origin.parcelMapCenter.lng.toFixed(5)}
                  </span>
                )}
                {data.origin.estateMapCenter && (
                  <span className="block">
                    Field: {data.origin.estateMapCenter.lat.toFixed(5)}, {data.origin.estateMapCenter.lng.toFixed(5)}
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* 2. Where & When harvested – detailed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="mb-10 pb-8 border-b border-gray-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
            <span className="text-[10px] font-light tracking-[0.2em] text-gray-500 uppercase">Harvest (this batch)</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[9px] font-light text-gray-500 uppercase tracking-wider mb-1">Where harvested (full line)</p>
              <p className="text-[15px] font-light text-gray-900">{data.harvest.where}</p>
              {data.origin.farmName && data.origin.farmName !== data.harvest.where && (
                <p className="text-[11px] font-light text-gray-600 mt-1">Estate: {data.origin.farmName}</p>
              )}
              {data.origin.location && <p className="text-[11px] font-light text-gray-600">Region label: {data.origin.location}</p>}
            </div>
            <div>
              <p className="text-[9px] font-light text-gray-500 uppercase tracking-wider mb-1">When harvested</p>
              <p className="text-[15px] font-light text-gray-900">{data.harvest.when}</p>
              {data.harvest.period && <p className="text-[11px] font-light text-gray-600 mt-0.5">Period: {data.harvest.period}</p>}
            </div>
          </div>
        </motion.div>

        {/* 2b. Chronology – activities in order */}
        {(() => {
          const chronologyEvents: { sortKey: number; displayDate: string; label: string; detail: string }[] = [];
          if (data.parcelInfo?.plantingDate) {
            chronologyEvents.push({
              sortKey: new Date(data.parcelInfo.plantingDate).getTime(),
              displayDate: formatDateTime(data.parcelInfo.plantingDate),
              label: 'Planting',
              detail: `Growing period started. ${data.parcelInfo.cropType ? `Crop: ${data.parcelInfo.cropType}.` : ''}`,
            });
          }
          if (data.parcelInfo?.expectedHarvestDate) {
            chronologyEvents.push({
              sortKey: new Date(data.parcelInfo.expectedHarvestDate).getTime(),
              displayDate: formatDate(data.parcelInfo.expectedHarvestDate),
              label: 'Expected harvest',
              detail: `Planned end of the growing period.`,
            });
          }
          (data.treatments || []).forEach((t) => {
            const gps =
              t.gpsLatitude != null && t.gpsLongitude != null
                ? ` · GPS: ${t.gpsLatitude.toFixed(5)}, ${t.gpsLongitude.toFixed(5)}${t.gpsAccuracyM != null ? ` (±${t.gpsAccuracyM}m)` : ''}`
                : '';
            chronologyEvents.push({
              sortKey: new Date(t.appliedAt).getTime(),
              displayDate: formatDateTime(t.appliedAt),
              label: 'Treatment application',
              detail: `${t.productName} · rate: ${t.dosage}${t.waterVolume != null ? ` · water: ${t.waterVolume} L` : ''}${t.reason ? ` · reason: ${t.reason}` : ''}${gps} · device time: ${formatDateTime(t.deviceTimestamp)}`,
            });
          });
          (data.growthLogs || []).forEach((g) => {
            const gGps =
              g.gpsLatitude != null && g.gpsLongitude != null
                ? `GPS: ${g.gpsLatitude.toFixed(5)}, ${g.gpsLongitude.toFixed(5)}${g.gpsAccuracyM != null ? ` (±${g.gpsAccuracyM}m)` : ''}`
                : '';
            chronologyEvents.push({
              sortKey: new Date(g.networkTimestamp).getTime(),
              displayDate: formatDateTime(g.networkTimestamp),
              label: 'Growth log',
              detail: [g.growthStage && `Stage: ${g.growthStage}`, g.notes, gGps, `Device: ${formatDateTime(g.deviceTimestamp)}`].filter(Boolean).join(' · ') || 'Field record',
            });
          });
          (data.harvestAnnouncements || []).forEach((h) => {
            chronologyEvents.push({
              sortKey: new Date(h.estimatedDate).getTime(),
              displayDate: formatDate(h.estimatedDate),
              label: 'Harvest announcement',
              detail: `${h.cropType} · estimate: ${formatDate(h.estimatedDate)}${h.actualDate ? ` · actual: ${formatDate(h.actualDate)}` : ''} · ${h.status}`,
            });
          });
          if (data.timeline?.harvested) {
            chronologyEvents.push({
              sortKey: new Date(data.timeline.harvested).getTime(),
              displayDate: formatDateTime(data.timeline.harvested),
              label: 'Harvested',
              detail: data.harvest.where,
            });
          }
          if (data.qualityEntry?.preCoolingStartTime) {
            chronologyEvents.push({
              sortKey: new Date(data.qualityEntry.preCoolingStartTime).getTime(),
              displayDate: formatDateTime(data.qualityEntry.preCoolingStartTime),
              label: 'Pre-cooling / quality check',
              detail: `Status: ${data.qualityEntry.status}`,
            });
          }
          if (data.timeline?.verified) {
            chronologyEvents.push({
              sortKey: new Date(data.timeline.verified).getTime(),
              displayDate: formatDateTime(data.timeline.verified),
              label: 'Quality check verified',
              detail: 'Passed check.',
            });
          }
          if (data.timeline?.loaded) {
            chronologyEvents.push({
              sortKey: new Date(data.timeline.loaded).getTime(),
              displayDate: formatDateTime(data.timeline.loaded),
              label: 'Picked up for transport',
              detail: data.timeline.transport ? `Vehicle: ${data.timeline.transport.vehicleNumber}` : '—',
            });
          }
          const arrivedAt = data.timeline?.arrived || data.timeline?.arrival?.estimated;
          if (arrivedAt) {
            chronologyEvents.push({
              sortKey: new Date(arrivedAt).getTime(),
              displayDate: formatDateTime(arrivedAt),
              label: 'Arrival',
              detail: data.timeline?.arrival?.location || 'Destination',
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
                <span className="text-[10px] font-light tracking-[0.2em] text-gray-500 uppercase">Activities in chronological order</span>
              </div>
              <p className="text-xs font-light text-gray-600 mb-4">Chronological list of all recorded activities for this batch (date and time, activity, detail).</p>
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="py-3 px-4 font-medium text-gray-700">Date & time</th>
                        <th className="py-3 px-4 font-medium text-gray-700">Activity</th>
                        <th className="py-3 px-4 font-medium text-gray-700">Detail</th>
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

        {/* 2c. Treatments (inputs) – full detail */}
        {data.treatments && data.treatments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-10 pb-8 border-b border-gray-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
              <span className="text-[10px] font-light tracking-[0.2em] text-gray-500 uppercase">Applied inputs (treatments)</span>
            </div>
            <p className="text-xs font-light text-gray-600 mb-4">Product, rate, water, reason, server time and device time, GPS point where spraying was recorded.</p>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="max-h-[480px] overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-sm min-w-[900px]">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-2 font-medium text-gray-700">Applied (server)</th>
                      <th className="py-3 px-2 font-medium text-gray-700">Device (time)</th>
                      <th className="py-3 px-2 font-medium text-gray-700">Product</th>
                      <th className="py-3 px-2 font-medium text-gray-700">Rate</th>
                      <th className="py-3 px-2 font-medium text-gray-700">Water (L)</th>
                      <th className="py-3 px-2 font-medium text-gray-700">Reason</th>
                      <th className="py-3 px-2 font-medium text-gray-700">GPS (lat, lng)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.treatments.map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-2 font-mono text-xs text-gray-600 whitespace-nowrap">{formatDateTime(t.appliedAt)}</td>
                        <td className="py-2.5 px-2 font-mono text-xs text-gray-600 whitespace-nowrap">{formatDateTime(t.deviceTimestamp)}</td>
                        <td className="py-2.5 px-2 font-medium text-gray-900">{t.productName}</td>
                        <td className="py-2.5 px-2 text-gray-700">{t.dosage}</td>
                        <td className="py-2.5 px-2 text-gray-700">{t.waterVolume != null ? t.waterVolume : '—'}</td>
                        <td className="py-2.5 px-2 text-gray-700">{t.reason || '—'}</td>
                        <td className="py-2.5 px-2 font-mono text-xs text-gray-700">
                          {t.gpsLatitude != null && t.gpsLongitude != null
                            ? `${t.gpsLatitude.toFixed(5)}, ${t.gpsLongitude.toFixed(5)}${t.gpsAccuracyM != null ? ` (±${t.gpsAccuracyM}m)` : ''}`
                            : '—'}
                        </td>
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
                  <p className="text-[9px] font-light text-[gray-900]/40 uppercase tracking-wider mb-1">Harvested</p>
                  <p className="text-[11px] font-light text-[gray-900]">{formatDateTime(data.timeline.harvested)}</p>
                </div>
              </div>

              {data.timeline.verified && (
                <div className="relative">
                  <div className="absolute left-[-23px] top-1 w-3 h-3 bg-[#2D5A27] rounded-full border-2 border-white"></div>
                  <div>
                    <p className="text-[9px] font-light text-[gray-900]/40 uppercase tracking-wider mb-1">Quality check</p>
                    <p className="text-[11px] font-light text-[gray-900]">{formatDateTime(data.timeline.verified)}</p>
                  </div>
                </div>
              )}

              {data.timeline.loaded && (
                <div className="relative">
                  <div className="absolute left-[-23px] top-1 w-3 h-3 bg-[#2D5A27] rounded-full border-2 border-white"></div>
                  <div>
                    <p className="text-[9px] font-light text-[gray-900]/40 uppercase tracking-wider mb-1">Picked up</p>
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
                      Stored
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
                      Arrival
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

        {/* Transport & missions – full chain */}
        {data.missions && data.missions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-10 pb-8 border-b border-gray-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-[#2D5A27]" strokeWidth={1.5} />
              <span className="text-[10px] font-light tracking-[0.2em] text-[gray-900]/60 uppercase">Transport (carrier, vehicle, routes)</span>
            </div>
            <p className="text-xs text-gray-600 mb-4">Who carried the load, when assigned / accepted / picked up / delivered, pickup address, route GPS, border waits if any.</p>
            <div className="space-y-6">
              {data.missions.map((m, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-900">
                    {m.missionNumber || `Transport ${i + 1}`} · <span className="text-gray-600 font-normal">{m.status || '—'}</span>
                  </p>
                  {m.logisticsPartner?.name && (
                    <p className="text-sm text-gray-800">
                      <span className="text-gray-500">Carrier / logistics:</span> {m.logisticsPartner.name}
                    </p>
                  )}
                  {m.pickupAddress && (
                    <p className="text-sm text-gray-800">
                      <span className="text-gray-500">Pickup address:</span> {m.pickupAddress}
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-gray-800">
                    {m.estimatedPickupTime && <span>Est. pickup: {formatDateTime(m.estimatedPickupTime)}</span>}
                    {m.assignedAt && <span>Assigned: {formatDateTime(m.assignedAt)}</span>}
                    {m.acceptedAt && <span>Accepted: {formatDateTime(m.acceptedAt)}</span>}
                    {m.pickedUpAt && <span>Picked up: {formatDateTime(m.pickedUpAt)}</span>}
                    {m.deliveredAt && <span>Delivered: {formatDateTime(m.deliveredAt)}</span>}
                  </div>
                  {m.vehicle && (
                    <p className="text-[12px] text-gray-800">
                      <span className="text-gray-500">Vehicle:</span> {[m.vehicle.make, m.vehicle.model, m.vehicle.type].filter(Boolean).join(' ')} · {m.vehicle.vehicleNumber} · plate{' '}
                      {m.vehicle.licensePlate}
                    </p>
                  )}
                  {m.borderWaits && m.borderWaits.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[9px] uppercase text-gray-500 mb-1">Border / wait</p>
                      <ul className="text-[11px] space-y-1">
                        {m.borderWaits.map((b, j) => (
                          <li key={j} className="text-gray-800">
                            {b.borderName || 'Border'}: in {formatDateTime(b.borderArrivalTime)} → out {formatDateTime(b.borderExitTime)} · {b.waitTimeMinutes} min
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.locationLogs && m.locationLogs.length > 0 && (
                    <div>
                      <p className="text-[9px] uppercase text-gray-500 mb-2">Route GPS log (chronological)</p>
                      <div className="max-h-48 overflow-auto rounded border border-gray-100">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="py-1.5 px-2">Time</th>
                              <th className="py-1.5 px-2">Lat / Lng</th>
                              <th className="py-1.5 px-2">Address</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {m.locationLogs.map((row, j) => (
                              <tr key={j}>
                                <td className="py-1 px-2 font-mono whitespace-nowrap">{formatDateTime(row.timestamp)}</td>
                                <td className="py-1 px-2 font-mono">
                                  {row.latitude.toFixed(5)}, {row.longitude.toFixed(5)}
                                  {row.accuracy != null ? ` (±${row.accuracy}m)` : ''}
                                </td>
                                <td className="py-1 px-2 text-gray-700">{row.address || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
              Download passport (PDF) – full report
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
                Download lab report (PDF)
              </span>
            </a>
          )}
        </motion.div>
      </div>
    </div>
  );
}
