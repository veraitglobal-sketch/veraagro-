'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });

// Import useMap hook (can't be dynamically imported as it's a hook)
let useMap: any;
if (typeof window !== 'undefined') {
  useMap = require('react-leaflet').useMap;
}

// Custom icons - only create on client side
const createCustomIcon = (color: string, type: string) => {
  if (typeof window === 'undefined') return null;
  const L = require('leaflet');
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      ">
        ${type === 'hub' ? 'H' : 'D'}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Icons will be created on client side
const getHubIcon = () => createCustomIcon('#16a34a', 'hub');
const getDistributionIcon = () => createCustomIcon('#3b82f6', 'distribution');

interface Distributor {
  id: string;
  name: string;
  logo?: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  type: 'packaging_hub' | 'distribution_center' | 'last_mile_partner' | 'cross_docking';
  capacity: number; // tons/month
  coldStorage: number; // m3
  status: 'active' | 'planned';
  contactEmail?: string;
}

const distributors: Distributor[] = [
  // Serbia
  { id: 'SRB-001', name: 'Belgrade Packaging Hub', country: 'Serbia', city: 'Belgrade', latitude: 44.7866, longitude: 20.4489, type: 'packaging_hub', capacity: 800, coldStorage: 2500, status: 'active' },
  { id: 'SRB-002', name: 'Novi Sad Distribution Center', country: 'Serbia', city: 'Novi Sad', latitude: 45.2671, longitude: 19.8335, type: 'distribution_center', capacity: 1200, coldStorage: 4000, status: 'active' },
  { id: 'SRB-003', name: 'Arilje Collection Point', country: 'Serbia', city: 'Arilje', latitude: 43.7531, longitude: 20.0964, type: 'packaging_hub', capacity: 500, coldStorage: 1500, status: 'active' },
  
  // Germany
  { id: 'DEU-001', name: 'Hamburg Distribution Hub', country: 'Germany', city: 'Hamburg', latitude: 53.5511, longitude: 9.9937, type: 'distribution_center', capacity: 2000, coldStorage: 6000, status: 'active' },
  { id: 'DEU-002', name: 'Munich Cross-Docking', country: 'Germany', city: 'Munich', latitude: 48.1351, longitude: 11.5820, type: 'cross_docking', capacity: 1500, coldStorage: 4500, status: 'active' },
  { id: 'DEU-003', name: 'Berlin Distribution Center', country: 'Germany', city: 'Berlin', latitude: 52.5200, longitude: 13.4050, type: 'distribution_center', capacity: 1800, coldStorage: 5500, status: 'active' },
  { id: 'DEU-004', name: 'Frankfurt Hub', country: 'Germany', city: 'Frankfurt', latitude: 50.1109, longitude: 8.6821, type: 'distribution_center', capacity: 1600, coldStorage: 5000, status: 'active' },
  { id: 'DEU-005', name: 'Hans Logistics', country: 'Germany', city: 'Hamburg', latitude: 53.5500, longitude: 9.9800, type: 'last_mile_partner', capacity: 300, coldStorage: 800, status: 'active' },
  
  // Austria
  { id: 'AUT-001', name: 'Vienna Distribution Center', country: 'Austria', city: 'Vienna', latitude: 48.2082, longitude: 16.3738, type: 'distribution_center', capacity: 1400, coldStorage: 4200, status: 'active' },
  { id: 'AUT-002', name: 'Graz Packaging Hub', country: 'Austria', city: 'Graz', latitude: 47.0707, longitude: 15.4395, type: 'packaging_hub', capacity: 600, coldStorage: 1800, status: 'active' },
  
  // Planned
  { id: 'FRA-001', name: 'Paris Distribution Center', country: 'France', city: 'Paris', latitude: 48.8566, longitude: 2.3522, type: 'distribution_center', capacity: 0, coldStorage: 0, status: 'planned' },
  { id: 'ITA-001', name: 'Milan Hub', country: 'Italy', city: 'Milan', latitude: 45.4642, longitude: 9.1900, type: 'distribution_center', capacity: 0, coldStorage: 0, status: 'planned' },
];

const countries = [
  { code: 'ALL', name: 'All Countries', flag: '🌍' },
  { code: 'SRB', name: 'Serbia', flag: '🇷🇸' },
  { code: 'DEU', name: 'Germany', flag: '🇩🇪' },
  { code: 'AUT', name: 'Austria', flag: '🇦🇹' },
  { code: 'FRA', name: 'France', flag: '🇫🇷' },
  { code: 'ITA', name: 'Italy', flag: '🇮🇹' },
];

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function DistributorNetworkPage() {
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([50.0, 10.0]);
  const [mapZoom, setMapZoom] = useState(5);
  const [loading, setLoading] = useState(false);
  
  // OPTIMIZED: Load from API with caching (if available)
  // For now, using hardcoded data for <1s performance
  // In production, use: const [distributors, setDistributors] = useState<Distributor[]>([]);

  const filteredDistributors = selectedCountry === 'ALL'
    ? distributors
    : distributors.filter(d => d.id.startsWith(selectedCountry));

  const activeDistributors = filteredDistributors.filter(d => d.status === 'active');
  const plannedDistributors = filteredDistributors.filter(d => d.status === 'planned');

  // Calculate network stats
  const networkStats = {
    totalCountries: new Set(distributors.map(d => d.country)).size,
    activeHubs: activeDistributors.length,
    totalCapacity: activeDistributors.reduce((sum, d) => sum + d.capacity, 0),
    totalColdStorage: activeDistributors.reduce((sum, d) => sum + d.coldStorage, 0),
  };

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    
    if (countryCode === 'ALL') {
      setMapCenter([50.0, 10.0]);
      setMapZoom(5);
    } else {
      const countryDistributors = distributors.filter(d => d.id.startsWith(countryCode));
      if (countryDistributors.length > 0) {
        const avgLat = countryDistributors.reduce((sum, d) => sum + d.latitude, 0) / countryDistributors.length;
        const avgLng = countryDistributors.reduce((sum, d) => sum + d.longitude, 0) / countryDistributors.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(7);
      }
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      packaging_hub: 'Packaging Hub',
      distribution_center: 'Distribution Center',
      last_mile_partner: 'Last-Mile Partner',
      cross_docking: 'Cross-Docking Center',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      packaging_hub: 'bg-green-100 text-green-800 border-green-300',
      distribution_center: 'bg-blue-100 text-blue-800 border-blue-300',
      last_mile_partner: 'bg-purple-100 text-purple-800 border-purple-300',
      cross_docking: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Global Distributor Network</h1>
              <p className="text-sm text-gray-400">Bio Vera Command Center</p>
            </div>
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Network Stats Bar */}
      <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 border-b border-green-700/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{networkStats.totalCountries}</p>
              <p className="text-xs text-gray-300">Countries</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{networkStats.activeHubs}</p>
              <p className="text-xs text-gray-300">Active Hubs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{networkStats.totalCapacity.toLocaleString()}</p>
              <p className="text-xs text-gray-300">Tons/Month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{networkStats.totalColdStorage.toLocaleString()}</p>
              <p className="text-xs text-gray-300">m³ Cold Storage</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        {/* Country Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountrySelect(country.code)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCountry === country.code
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <span className="mr-2">{country.flag}</span>
                {country.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden"
              style={{ height: '600px' }}
            >
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <MapController center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="grayscale contrast-125 brightness-90"
                />
                {activeDistributors.map((distributor) => (
                  <Marker
                    key={distributor.id}
                    position={[distributor.latitude, distributor.longitude]}
                    icon={distributor.type === 'packaging_hub' ? getHubIcon() : getDistributionIcon()}
                    eventHandlers={{
                      click: () => setSelectedDistributor(distributor),
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">{distributor.name}</p>
                        <p className="text-gray-600">{distributor.city}, {distributor.country}</p>
                        <p className="text-gray-500 text-xs mt-1">{getTypeLabel(distributor.type)}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                {plannedDistributors.map((distributor) => (
                  <CircleMarker
                    key={distributor.id}
                    center={[distributor.latitude, distributor.longitude]}
                    radius={8}
                    pathOptions={{ color: '#9ca3af', fillColor: '#6b7280', fillOpacity: 0.5 }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">{distributor.name}</p>
                        <p className="text-gray-600">{distributor.city}, {distributor.country}</p>
                        <p className="text-gray-500 text-xs mt-1">Planned</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </motion.div>
          </div>

          {/* Distributor List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">
              {selectedCountry === 'ALL' ? 'All Distributors' : countries.find(c => c.code === selectedCountry)?.name}
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredDistributors.map((distributor) => (
                <motion.div
                  key={distributor.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedDistributor(distributor)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedDistributor?.id === distributor.id
                      ? 'bg-green-900/50 border-green-600 shadow-lg shadow-green-500/20'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{distributor.name}</p>
                      <p className="text-xs text-gray-400">{distributor.city}, {distributor.country}</p>
                    </div>
                    {distributor.status === 'planned' && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">Planned</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded border ${getTypeColor(distributor.type)}`}>
                      {getTypeLabel(distributor.type)}
                    </span>
                  </div>
                  {distributor.status === 'active' && (
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>Capacity: {distributor.capacity} tons/month</p>
                      <p>Cold Storage: {distributor.coldStorage} m³</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Distributor Detail */}
        {selectedDistributor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">{selectedDistributor.name}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Location</p>
                    <p className="text-white">{selectedDistributor.city}, {selectedDistributor.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Function</p>
                    <span className={`inline-block px-3 py-1 rounded border ${getTypeColor(selectedDistributor.type)}`}>
                      {getTypeLabel(selectedDistributor.type)}
                    </span>
                  </div>
                  {selectedDistributor.status === 'active' && (
                    <>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Capacity</p>
                        <p className="text-white font-semibold">{selectedDistributor.capacity} tons/month</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Cold Storage</p>
                        <p className="text-white font-semibold">{selectedDistributor.coldStorage} m³</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-end">
                <button className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                  View Logistics Performance
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
