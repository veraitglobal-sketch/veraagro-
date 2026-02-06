'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { batchesAPI, standardEngineAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Package,
  Search,
  Filter,
  Calendar,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Truck,
  QrCode,
} from 'lucide-react';

const navItems = [
  { href: '/grower', label: 'Dashboard', icon: <Package className="w-5 h-5" /> },
  { href: '/grower/portal', label: 'Mission Tracker', icon: <Truck className="w-5 h-5" /> },
  { href: '/grower/batches', label: 'My Batches', icon: <Package className="w-5 h-5" /> },
  { href: '/grower/materials', label: 'Materials', icon: <Package className="w-5 h-5" /> },
  { href: '/grower/quality-entry', label: 'Quality Entry', icon: <CheckCircle className="w-5 h-5" /> },
  { href: '/grower/compliance-photos', label: 'Compliance Photos', icon: <AlertCircle className="w-5 h-5" /> },
];

interface Batch {
  id: string;
  batchId: string;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  harvestDate: string;
  createdAt: string;
  estates?: {
    name: string;
    location?: string;
  };
  parcels?: {
    name: string;
  };
  hubs?: {
    name: string;
    city?: string;
  };
}

export default function GrowerBatchesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Selected batch for details
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Standard Engine - Loading Approval
  const [loadingApproval, setLoadingApproval] = useState<any>(null);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [batches, searchTerm, statusFilter, productFilter]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await batchesAPI.getAll();
      setBatches(data);
      setFilteredBatches(data);
    } catch (err: any) {
      console.error('Error loading batches:', err);
      setError(err.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...batches];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (batch) =>
          batch.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batch.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batch.estates?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((batch) => batch.status === statusFilter);
    }

    // Product filter
    if (productFilter !== 'all') {
      filtered = filtered.filter((batch) => batch.productName === productFilter);
    }

    setFilteredBatches(filtered);
  };

  const handleViewDetails = async (batch: Batch) => {
    setSelectedBatch(batch);
    setLoadingDetails(true);
    try {
      const details = await batchesAPI.getOne(batch.batchId);
      setBatchDetails(details);
    } catch (err: any) {
      console.error('Error loading batch details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCheckLoadingApproval = async (batch: Batch) => {
    setCheckingApproval(true);
    try {
      const result = await standardEngineAPI.checkLoadingApproval(batch.id);
      setLoadingApproval(result);
    } catch (err: any) {
      console.error('Error checking loading approval:', err);
      alert(err.response?.data?.message || 'Error checking approval requirements');
    } finally {
      setCheckingApproval(false);
    }
  };

  const handleApproveForLoading = async (batch: Batch) => {
    if (!confirm('Are you sure you want to approve this batch for loading? All requirements must be met.')) {
      return;
    }
    
    setApproving(true);
    try {
      const result = await standardEngineAPI.approveForLoading(batch.id);
      alert('Batch approved for loading!');
      setLoadingApproval(null);
      loadBatches(); // Refresh list
    } catch (err: any) {
      console.error('Error approving for loading:', err);
      alert(err.response?.data?.message || 'Cannot approve. Please check all requirements.');
    } finally {
      setApproving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'HARVESTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AT_HUB':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELIVERED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'SOLD':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'HARVESTED':
        return <CheckCircle className="w-4 h-4" />;
      case 'IN_TRANSIT':
        return <Truck className="w-4 h-4" />;
      case 'AT_HUB':
        return <MapPin className="w-4 h-4" />;
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4" />;
      case 'SOLD':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const uniqueProducts = Array.from(new Set(batches.map((b) => b.productName))).sort();
  const uniqueStatuses = Array.from(new Set(batches.map((b) => b.status))).sort();

  if (loading) {
    return (
      <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
        <SidebarLayout title="My Batches" navItems={navItems}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading batches...</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title="My Batches" navItems={navItems}>
        <div className="p-6 bg-gray-50 min-h-screen">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-light text-gray-900">My Batches</h1>
              <p className="text-sm text-gray-600 mt-1">
                Track all your harvest batches and their journey to market
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
              <p className="font-medium">Error: {error}</p>
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by batch ID, product, estate..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    {uniqueStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product
                  </label>
                  <select
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">All Products</option>
                    {uniqueProducts.map((product) => (
                      <option key={product} value={product}>
                        {product}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || statusFilter !== 'all' || productFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setProductFilter('all');
                  }}
                  className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-medium text-gray-900">{batches.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Batches</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-medium text-green-600">
                {batches.filter((b) => b.status === 'HARVESTED').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Harvested</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-medium text-blue-600">
                {batches.filter((b) => b.status === 'IN_TRANSIT').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">In Transit</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-medium text-purple-600">
                {batches.filter((b) => b.status === 'SOLD').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Sold</div>
            </div>
          </div>

          {/* Batches List */}
          <div className="bg-white rounded-lg border border-gray-200">
            {filteredBatches.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {batch.batchId}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              batch.status
                            )}`}
                          >
                            {getStatusIcon(batch.status)}
                            {batch.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{batch.productName}</span>
                            <span className="text-gray-500">
                              • {batch.quantity} {batch.unit}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>
                              Harvested:{' '}
                              {new Date(batch.harvestDate).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>
                              {batch.estates?.name || 'N/A'}
                              {batch.parcels && ` • ${batch.parcels.name}`}
                            </span>
                          </div>
                        </div>

                        {batch.hubs && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Current Location:</span>{' '}
                            {batch.hubs.name}
                            {batch.hubs.city && `, ${batch.hubs.city}`}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewDetails(batch)}
                          className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-light">
                  {batches.length === 0
                    ? 'No batches yet. Create your first batch after harvest.'
                    : 'No batches match your filters.'}
                </p>
              </div>
            )}
          </div>

          {/* Batch Details Modal */}
          {selectedBatch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-light text-gray-900">
                        Batch Details: {selectedBatch.batchId}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">{selectedBatch.productName}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBatch(null);
                        setBatchDetails(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {loadingDetails ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Status</label>
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                selectedBatch.status
                              )}`}
                            >
                              {getStatusIcon(selectedBatch.status)}
                              {selectedBatch.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Quantity</label>
                          <p className="mt-1 text-gray-900">
                            {selectedBatch.quantity} {selectedBatch.unit}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Harvest Date</label>
                          <p className="mt-1 text-gray-900">
                            {new Date(selectedBatch.harvestDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Estate</label>
                          <p className="mt-1 text-gray-900">
                            {selectedBatch.estates?.name || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Traceability Info */}
                      {batchDetails && (
                        <div className="border-t border-gray-200 pt-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Traceability Information
                          </h3>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                              {JSON.stringify(batchDetails, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Standard Engine - Loading Approval */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            German Standard Compliance Check
                          </h3>
                          <button
                            onClick={() => handleCheckLoadingApproval(selectedBatch!)}
                            disabled={checkingApproval}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {checkingApproval ? 'Checking...' : 'Check Requirements'}
                          </button>
                        </div>
                        {loadingApproval && (
                          <div className="space-y-3 mb-4">
                            {Object.entries(loadingApproval.checklist || {}).map(([key, item]: [string, any]) => (
                              <div
                                key={key}
                                className={`p-3 rounded-lg border ${
                                  item.passed
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {item.passed ? (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <AlertCircle className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className="font-medium text-gray-900">{item.requirement}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 ml-7">{item.message}</p>
                              </div>
                            ))}
                            {loadingApproval.canApprove ? (
                              <button
                                onClick={() => handleApproveForLoading(selectedBatch!)}
                                disabled={approving}
                                className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {approving ? 'Approving...' : 'Approve for Loading'}
                              </button>
                            ) : (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm text-yellow-800">
                                  Please complete all requirements before approving for loading.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                        <div className="flex gap-3">
                          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                            <QrCode className="w-4 h-4 mr-2" />
                            View QR Code
                          </button>
                          <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            <Truck className="w-4 h-4 mr-2" />
                            Move to Hub
                          </button>
                          <button className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Report Issue
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
