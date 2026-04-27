'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import {
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Mail,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';
import { invoicesAPI } from '@/lib/api';
import {
  getBuyerInvoiceDisplayStatus,
  getOrderPayment,
} from '@/lib/invoice-payment-status';

export default function InvoicesPage() {
  const buyerPortalNavItems = useBuyerPortalNavItems();
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'number'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, dateFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoicesAPI.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        startDate: dateFilter.start || undefined,
        endDate: dateFilter.end || undefined,
      });
      
      // Transform data to match frontend format
      const transformed = data.map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        orderNumber: invoice.orders?.orderNumber || invoice.invoiceData?.orderNumber || 'N/A',
        date: new Date(invoice.generatedAt),
        amount: invoice.orders?.totalAmount || invoice.invoiceData?.total || 0,
        status: getBuyerInvoiceDisplayStatus(invoice.orders),
        pdfUrl: invoice.pdfUrl,
        invoiceData: invoice.invoiceData,
        order: invoice.orders,
        delivery: invoice.deliveries,
        sentToEmail: invoice.sentToEmail,
        sentAt: invoice.sentAt,
      }));
      
      setInvoices(transformed);
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices
    .filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const matchesDate =
        (!dateFilter.start || new Date(invoice.date) >= new Date(dateFilter.start)) &&
        (!dateFilter.end || new Date(invoice.date) <= new Date(dateFilter.end));
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else {
        comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleDownload = async (invoice: any) => {
    try {
      const blob = await invoicesAPI.download(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice');
    }
  };

  const handleSendEmail = async (invoice: any) => {
    try {
      const email = prompt('Enter email address (or leave empty to use your account email):');
      await invoicesAPI.sendEmail(invoice.id, email || undefined);
      alert(`Invoice ${invoice.invoiceNumber} sent successfully`);
      loadInvoices(); // Refresh to update sent status
    } catch (err: any) {
      console.error('Error sending invoice:', err);
      alert('Failed to send invoice');
    }
  };

  const handleViewDetails = async (invoice: any) => {
    try {
      const details: any = await invoicesAPI.getOne(invoice.id);
      const order = details.orders || details.order;
      setSelectedInvoice({
        ...details,
        order,
        date: details.generatedAt,
        amount: order?.totalAmount,
        status: getBuyerInvoiceDisplayStatus(order),
      });
    } catch (err: any) {
      console.error('Error loading invoice details:', err);
      alert('Failed to load invoice details');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-600/60" strokeWidth={1} />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600/60" strokeWidth={1} />;
      case 'REFUNDED':
        return <XCircle className="w-4 h-4 text-gray-600/60" strokeWidth={1} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'border-green-200/50 text-green-600/80';
      case 'PENDING':
        return 'border-yellow-200/50 text-yellow-600/80';
      case 'REFUNDED':
        return 'border-gray-200/50 text-gray-600/80';
      default:
        return 'border-gray-200/50 text-gray-600/80';
    }
  };

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = filteredInvoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = filteredInvoices
    .filter((inv) => inv.status === 'PENDING')
    .reduce((sum, inv) => sum + inv.amount, 0);

  if (loading) {
    return (
      <AuthGuard requiredRoles={['BUYER']}>
        <SidebarLayout title="Invoices" navItems={buyerPortalNavItems}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading invoices...</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRoles={['BUYER']}>
      <SidebarLayout title="Invoices" navItems={buyerPortalNavItems}>
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-green-200/50 pb-8">
            <div className="border-b border-green-200/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-light text-gray-900 mt-2">
                    {filteredInvoices.length}
                  </p>
                </div>
                <FileText className="w-6 h-6 text-green-600/60" strokeWidth={1} />
              </div>
            </div>

            <div className="border-b border-green-200/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600">Total Amount</p>
                  <p className="text-2xl font-light text-gray-900 mt-2">
                    €{totalAmount.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 text-green-600/60" strokeWidth={1} />
              </div>
            </div>

            <div className="border-b border-green-200/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600">Pending Payment</p>
                  <p className="text-2xl font-light text-gray-900 mt-2">
                    €{pendingAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600/80 mt-2 font-light">
                    €{paidAmount.toFixed(2)} paid
                  </p>
                </div>
                <Clock className="w-6 h-6 text-green-600/60" strokeWidth={1} />
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="border-b border-green-200/50 pb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices by number or order number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 text-sm font-light focus:outline-none focus:border-green-600/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-green-600/50"
                >
                  <option value="all">All status</option>
                  <option value="PAID">Paid (in escrow or released)</option>
                  <option value="PENDING">Pending payment</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-gray-300 text-sm font-light hover:border-green-200/50 transition-colors flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setDateFilter({ start: '', end: '' });
                      setStatusFilter('all');
                    }}
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-light"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Invoices Table */}
          <div className="border-b border-green-200/50 pb-8">
            <div className="mb-6">
              <h3 className="text-lg font-light text-gray-900">Invoice List</h3>
            </div>
            <div className="mb-4 flex items-center justify-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 text-sm border border-gray-300 font-light focus:outline-none focus:border-green-600/50"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="number">Invoice Number</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-light text-gray-500 uppercase tracking-wider">
                      Invoice Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200/50">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" strokeWidth={1} />
                          <span className="text-sm font-light text-gray-900">
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-light">
                        {invoice.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-light">
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-light text-gray-900">
                        €{invoice.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-light border ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-light">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(invoice)}
                            className="text-green-600/80 hover:text-green-600 p-1 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" strokeWidth={1} />
                          </button>
                          <button
                            onClick={() => handleDownload(invoice)}
                            className="text-green-600/80 hover:text-green-600 p-1 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" strokeWidth={1} />
                          </button>
                          <button
                            onClick={() => handleSendEmail(invoice)}
                            className="text-green-600/80 hover:text-green-600 p-1 transition-colors"
                            title="Send via Email"
                          >
                            <Mail className="w-4 h-4" strokeWidth={1} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInvoices.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" strokeWidth={1} />
                  <p className="text-gray-600 font-light">No invoices found</p>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Details Modal */}
          {selectedInvoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6 border-b border-gray-200/50 pb-4">
                    <div>
                      <h2 className="text-2xl font-light text-gray-900 mb-2">
                        Invoice {selectedInvoice.invoiceNumber || selectedInvoice.invoiceData?.invoiceNumber}
                      </h2>
                      <p className="text-sm text-gray-600 font-light">
                        Order: {selectedInvoice.orderNumber || selectedInvoice.invoiceData?.orderNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" strokeWidth={1} />
                    </button>
                  </div>

                  {/* Invoice Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-b border-gray-200/50 pb-6">
                    <div>
                      <h3 className="text-sm font-light text-gray-500 mb-2">Invoice Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Invoice Number:</span>
                          <span className="font-light text-gray-900">
                            {selectedInvoice.invoiceNumber || selectedInvoice.invoiceData?.invoiceNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Date:</span>
                          <span className="font-light text-gray-900">
                            {new Date(selectedInvoice.date || selectedInvoice.generatedAt || selectedInvoice.invoiceData?.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Status:</span>
                          <span
                            className={`text-xs font-light inline-flex border px-2 py-0.5 rounded ${getStatusColor(selectedInvoice.status)}`}
                          >
                            {selectedInvoice.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-light text-gray-500 mb-2">Payment Information</h3>
                      <div className="space-y-2 text-sm">
                        {getOrderPayment(selectedInvoice.order) ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-light">Payment method:</span>
                              <span className="font-light text-gray-900">
                                {getOrderPayment(selectedInvoice.order)?.paymentMethod || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-light">Payment status (system):</span>
                              <span className="font-light text-gray-800">
                                {getOrderPayment(selectedInvoice.order)?.status || '—'}
                              </span>
                            </div>
                            {getOrderPayment(selectedInvoice.order)?.releasedAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 font-light">Released at:</span>
                                <span className="font-light text-gray-900">
                                  {new Date(
                                    String(getOrderPayment(selectedInvoice.order)?.releasedAt),
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500 font-light">No payment information available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-6 border-b border-gray-200/50 pb-6">
                    <h3 className="text-sm font-light text-gray-500 mb-4">Items</h3>
                    <div className="space-y-3">
                      {selectedInvoice.invoiceData?.items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 border-b border-gray-200/50">
                          <div className="flex-1">
                            <p className="text-sm font-light text-gray-900">{item.productName}</p>
                            <p className="text-xs text-gray-500 font-light">
                              {item.quantity} {item.unit} × €{item.unitPrice?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <p className="text-sm font-light text-gray-900">
                            €{item.total?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      )) || (
                        <div className="p-3 border-b border-gray-200/50">
                          <p className="text-sm font-light text-gray-900">
                            {selectedInvoice.order?.productName || 'Product'}
                          </p>
                          <p className="text-xs text-gray-500 font-light">
                            {selectedInvoice.order?.quantity} {selectedInvoice.order?.unit} × €{selectedInvoice.order?.unitPrice?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="mb-6 border-b border-gray-200/50 pb-6">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Subtotal:</span>
                          <span className="font-light text-gray-900">
                            €{selectedInvoice.invoiceData?.subtotal?.toFixed(2) || selectedInvoice.amount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        {selectedInvoice.invoiceData?.tax && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-light">Tax:</span>
                            <span className="font-light text-gray-900">
                              €{selectedInvoice.invoiceData.tax.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-200/50">
                          <span className="text-lg font-light text-gray-900">Total:</span>
                          <span className="text-lg font-light text-green-600/80">
                            €{selectedInvoice.invoiceData?.total?.toFixed(2) || selectedInvoice.amount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  {selectedInvoice.delivery && (
                    <div className="mb-6 border-b border-gray-200/50 pb-6">
                      <h3 className="text-sm font-light text-gray-500 mb-4">Delivery Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Delivery Number:</span>
                          <span className="font-light text-gray-900">
                            {selectedInvoice.delivery.deliveryNumber}
                          </span>
                        </div>
                        {selectedInvoice.delivery.users && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-light">Driver:</span>
                            <span className="font-light text-gray-900">
                              {selectedInvoice.delivery.users.firstName} {selectedInvoice.delivery.users.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDownload(selectedInvoice)}
                      className="flex-1 px-4 py-3 bg-green-600 text-white text-sm font-light hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" strokeWidth={1} />
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleSendEmail(selectedInvoice)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 text-sm font-light hover:border-green-200/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" strokeWidth={1} />
                      Send Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
