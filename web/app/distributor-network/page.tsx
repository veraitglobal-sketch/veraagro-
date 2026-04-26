'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navigation, Globe } from 'lucide-react';

interface Distributor {
  id: string;
  name: string;
  logo?: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  type: 'packaging_hub' | 'distribution_center' | 'last_mile_partner' | 'cross_docking';
  capacity: number;
  coldStorage: number;
  status: 'active' | 'planned';
  contactEmail?: string;
}

const distributors: Distributor[] = [
  { id: 'SRB-001', name: 'Belgrade Packaging Hub', country: 'Serbia', city: 'Belgrade', latitude: 44.7866, longitude: 20.4489, type: 'packaging_hub', capacity: 800, coldStorage: 2500, status: 'active' },
  { id: 'SRB-002', name: 'Novi Sad Distribution Center', country: 'Serbia', city: 'Novi Sad', latitude: 45.2671, longitude: 19.8335, type: 'distribution_center', capacity: 1200, coldStorage: 4000, status: 'active' },
  { id: 'SRB-003', name: 'Arilje Collection Point', country: 'Serbia', city: 'Arilje', latitude: 43.7531, longitude: 20.0964, type: 'packaging_hub', capacity: 500, coldStorage: 1500, status: 'active' },
  { id: 'DEU-001', name: 'Hamburg Distribution Hub', country: 'Germany', city: 'Hamburg', latitude: 53.5511, longitude: 9.9937, type: 'distribution_center', capacity: 2000, coldStorage: 6000, status: 'active' },
  { id: 'DEU-002', name: 'Munich Cross-Docking', country: 'Germany', city: 'Munich', latitude: 48.1351, longitude: 11.582, type: 'cross_docking', capacity: 1500, coldStorage: 4500, status: 'active' },
  { id: 'DEU-003', name: 'Berlin Distribution Center', country: 'Germany', city: 'Berlin', latitude: 52.52, longitude: 13.405, type: 'distribution_center', capacity: 1800, coldStorage: 5500, status: 'active' },
  { id: 'DEU-004', name: 'Frankfurt Hub', country: 'Germany', city: 'Frankfurt', latitude: 50.1109, longitude: 8.6821, type: 'distribution_center', capacity: 1600, coldStorage: 5000, status: 'active' },
  { id: 'DEU-005', name: 'Hans Logistics', country: 'Germany', city: 'Hamburg', latitude: 53.55, longitude: 9.98, type: 'last_mile_partner', capacity: 300, coldStorage: 800, status: 'active' },
  { id: 'AUT-001', name: 'Vienna Distribution Center', country: 'Austria', city: 'Vienna', latitude: 48.2082, longitude: 16.3738, type: 'distribution_center', capacity: 1400, coldStorage: 4200, status: 'active' },
  { id: 'AUT-002', name: 'Graz Packaging Hub', country: 'Austria', city: 'Graz', latitude: 47.0707, longitude: 15.4395, type: 'packaging_hub', capacity: 600, coldStorage: 1800, status: 'active' },
  { id: 'FRA-001', name: 'Paris Distribution Center', country: 'France', city: 'Paris', latitude: 48.8566, longitude: 2.3522, type: 'distribution_center', capacity: 0, coldStorage: 0, status: 'planned' },
  { id: 'ITA-001', name: 'Milan Hub', country: 'Italy', city: 'Milan', latitude: 45.4642, longitude: 9.19, type: 'distribution_center', capacity: 0, coldStorage: 0, status: 'planned' },
];

const countries = [
  { code: 'ALL', name: 'All Countries', flag: '🌍' },
  { code: 'SRB', name: 'Serbia', flag: '🇷🇸' },
  { code: 'DEU', name: 'Germany', flag: '🇩🇪' },
  { code: 'AUT', name: 'Austria', flag: '🇦🇹' },
  { code: 'FRA', name: 'France', flag: '🇫🇷' },
  { code: 'ITA', name: 'Italy', flag: '🇮🇹' },
];

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function DistributorNetworkPage() {
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [nearMe, setNearMe] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const filteredDistributors = useMemo(() => {
    if (selectedCountry === 'ALL') return distributors;
    return distributors.filter((d) => d.id.startsWith(selectedCountry));
  }, [selectedCountry]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    filteredDistributors.forEach((d) => set.add(d.city));
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [filteredDistributors]);

  const byCity = useMemo(() => {
    if (selectedCity === 'ALL') return filteredDistributors;
    return filteredDistributors.filter((d) => d.city === selectedCity);
  }, [filteredDistributors, selectedCity]);

  const displayList = useMemo(() => {
    if (nearMe && userPos) {
      return [...byCity].sort(
        (a, b) =>
          haversineKm(userPos.lat, userPos.lng, a.latitude, a.longitude) -
          haversineKm(userPos.lat, userPos.lng, b.latitude, b.longitude),
      );
    }
    return byCity;
  }, [byCity, nearMe, userPos]);

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedCity('ALL');
    setNearMe(false);
    setUserPos(null);
  };

  const requestNearMe = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Location is not available in this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMe(true);
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert('Could not get your position.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const activeDistributors = displayList.filter((d) => d.status === 'active');
  const plannedDistributors = displayList.filter((d) => d.status === 'planned');

  const networkStats = {
    totalCountries: new Set(distributors.map((d) => d.country)).size,
    activeHubs: distributors.filter((d) => d.status === 'active').length,
    totalCapacity: distributors.filter((d) => d.status === 'active').reduce((sum, d) => sum + d.capacity, 0),
    totalColdStorage: distributors.filter((d) => d.status === 'active').reduce((sum, d) => sum + d.coldStorage, 0),
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
      packaging_hub: 'bg-[#2D5A27]/20 text-[#23471f] border-[#2D5A27]/40',
      distribution_center: 'bg-blue-100 text-blue-800 border-blue-300',
      last_mile_partner: 'bg-purple-100 text-purple-800 border-purple-300',
      cross_docking: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Global Distributor Network</h1>
              <p className="text-sm text-gray-400">Browse by country and city — no map</p>
            </div>
            <Link href="/" className="text-gray-400 hover:text-white transition-colors" aria-label="Close">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-[#23471f]/50 to-[#2D5A27]/50 border-b border-[#2D5A27]/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#2D5A27]">{networkStats.totalCountries}</p>
              <p className="text-xs text-gray-300">Countries</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#2D5A27]">{networkStats.activeHubs}</p>
              <p className="text-xs text-gray-300">Active Hubs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#2D5A27]">{networkStats.totalCapacity.toLocaleString()}</p>
              <p className="text-xs text-gray-300">Tons/Month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#2D5A27]">{networkStats.totalColdStorage.toLocaleString()}</p>
              <p className="text-xs text-gray-300">m³ Cold Storage</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Country
          </p>
          <div className="flex flex-wrap gap-2">
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountrySelect(country.code)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCountry === country.code
                    ? 'bg-[#2D5A27] text-white shadow-lg shadow-[#2D5A27]/50'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <span className="mr-2">{country.flag}</span>
                {country.name}
              </button>
            ))}
          </div>
        </div>

        {cityOptions.length > 1 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">City</p>
            <div className="flex flex-wrap gap-2">
              {cityOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCity(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedCity === c
                      ? 'bg-gray-200 text-gray-900'
                      : 'bg-gray-800 text-gray-400 border border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {c === 'ALL' ? 'All cities' : c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          {!nearMe ? (
            <button
              type="button"
              onClick={() => void requestNearMe()}
              disabled={locating}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-60"
            >
              <Navigation className="h-4 w-4" />
              {locating ? 'Getting location…' : 'Nearest to me'}
            </button>
          ) : (
            <>
              <span className="text-sm text-gray-400">Sorted by distance from you</span>
              <button
                type="button"
                onClick={() => {
                  setNearMe(false);
                  setUserPos(null);
                }}
                className="text-sm text-[#2D5A27] hover:underline"
              >
                Clear
              </button>
            </>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            {selectedCountry === 'ALL' ? 'All Distributors' : countries.find((c) => c.code === selectedCountry)?.name}
            {selectedCity !== 'ALL' && ` · ${selectedCity}`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[min(80vh,900px)] overflow-y-auto pr-1">
            {[...activeDistributors, ...plannedDistributors].map((distributor) => {
              const distKm =
                nearMe && userPos
                  ? haversineKm(userPos.lat, userPos.lng, distributor.latitude, distributor.longitude)
                  : null;
              return (
                <motion.div
                  key={distributor.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedDistributor(distributor)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedDistributor?.id === distributor.id
                      ? 'bg-[#23471f]/50 border-[#2D5A27] shadow-lg shadow-[#2D5A27]/20'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{distributor.name}</p>
                      <p className="text-xs text-gray-400">
                        {distributor.city}, {distributor.country}
                        {distKm != null && (
                          <span className="ml-2 text-gray-500">
                            · {distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}
                          </span>
                        )}
                      </p>
                    </div>
                    {distributor.status === 'planned' && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded shrink-0">Planned</span>
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
              );
            })}
          </div>
        </div>

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
                    <p className="text-white">
                      {selectedDistributor.city}, {selectedDistributor.country}
                    </p>
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
                <button
                  type="button"
                  className="w-full px-6 py-3 bg-[#2D5A27] text-white font-medium rounded-lg hover:bg-[#23471f] transition-colors"
                >
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
