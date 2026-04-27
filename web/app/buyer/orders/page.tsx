'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { ordersAPI, invoicesAPI } from '@/lib/api';
import { getBuyerOrderStatusLabel, getBuyerStatusBadgeClass } from '@/lib/buyer-order-status';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function OrdersPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const downloadInvoicePdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const blob = await invoicesAPI.download(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(t('buyerRetail.orders.invoiceDownloadFail'));
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login/buyer');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      const data = await ordersAPI.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-[#2D5A27]">
              🌱 Bio Vera
            </Link>
            <nav className="flex gap-4">
              <Link href="/buyer/shop" className="px-4 py-2 text-gray-700 hover:text-[#2D5A27]">
                {t('buyerRetail.orders.navShop')}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('buyerRetail.orders.title')}</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27]"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {t('buyerRetail.orders.orderPrefix')}
                      {order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getBuyerStatusBadgeClass(order.status)}`}>
                    {getBuyerOrderStatusLabel(order.status)}
                  </span>
                </div>
                <div className="space-y-2">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.product?.name || t('buyerRetail.orders.productFallback')}</span>
                      <span>
                        {item.quantity} x {item.price} RSD
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                  <span className="font-semibold">{t('buyerRetail.orders.total')}</span>
                  <span className="font-bold text-[#2D5A27]">{order.totalAmount || 0} RSD</span>
                </div>
                {order.status === 'APPROVED' && (
                  <div className="mt-4 p-3 rounded-lg bg-sky-50 border border-sky-100 text-sm text-sky-900">
                    <strong className="font-semibold">{t('buyerRetail.orders.paymentLabel')}</strong>{' '}
                    {t('buyerRetail.orders.paymentRefLead')}{' '}
                    <code className="bg-white/80 px-1 rounded text-xs">{order.orderNumber}</code>{' '}
                    {t('buyerRetail.orders.paymentRefTrail')}{' '}
                    <a href="/buyer-portal/orders" className="text-[#2D5A27] underline font-medium">
                      {t('buyerRetail.orders.buyerPortalLink')}
                    </a>
                    {process.env.NEXT_PUBLIC_BIOVERA_BANK_IBAN ? t('buyerRetail.orders.paymentTailConfigured') : t('buyerRetail.orders.paymentTailContact')}
                  </div>
                )}
                {order.invoices && (
                  <div className="mt-4 p-3 rounded-lg bg-white border border-gray-200 text-sm text-gray-800">
                    <span className="font-semibold">{t('buyerRetail.orders.invoicePrefix', { number: order.invoices.invoiceNumber })}</span>
                    <span className="mx-2">·</span>
                    <button
                      type="button"
                      onClick={() => void downloadInvoicePdf(order.invoices.id, order.invoices.invoiceNumber)}
                      className="text-[#2D5A27] font-medium underline"
                    >
                      {t('buyerRetail.orders.downloadPdf')}
                    </button>
                    <span className="mx-2">·</span>
                    <Link href="/buyer-portal/invoices" className="text-gray-600 hover:text-gray-900">
                      {t('buyerRetail.orders.invoiceHistory')}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">{t('buyerRetail.orders.empty')}</p>
            <Link href="/buyer/shop" className="text-[#2D5A27] hover:text-[#23471f] font-semibold">
              {t('buyerRetail.orders.startShopping')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
