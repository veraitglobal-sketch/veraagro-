'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { b2bSupplierPortalAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { dateIntlLocaleFromLanguageTag } from '@/lib/i18n-routing';

export default function SupplierMessagesPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = dateIntlLocaleFromLanguageTag(i18n.resolvedLanguage ?? i18n.language);
  const [threads, setThreads] = useState<
    Awaited<ReturnType<typeof b2bSupplierPortalAPI.getMyThreads>>
  >([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Awaited<ReturnType<typeof b2bSupplierPortalAPI.getThreadMessages>>
  >([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadThreads = async () => {
    setErr(null);
    try {
      setThreads(await b2bSupplierPortalAPI.getMyThreads());
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'supplier.messagesPage.errThreads'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadThreads();
  }, []);

  const openThread = async (id: string) => {
    setActiveId(id);
    setErr(null);
    try {
      setMessages(await b2bSupplierPortalAPI.getThreadMessages(id));
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'supplier.messagesPage.errOpen'));
    }
  };

  const send = async () => {
    if (!activeId || !text.trim()) return;
    setSending(true);
    setErr(null);
    try {
      await b2bSupplierPortalAPI.postMessage(activeId, text.trim());
      setText('');
      setMessages(await b2bSupplierPortalAPI.getThreadMessages(activeId));
      await loadThreads();
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'supplier.messagesPage.errSend'));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthGuard
      requiredRoles={['MATERIAL_SUPPLIER']}
      redirectTo="/login?returnTo=%2Fsupplier%2Fmessages"
    >
      <h1 className="text-xl font-light text-gray-900 mb-4">{t('supplier.nav.messages')}</h1>
      {loading && <p className="text-sm text-gray-500">{t('supplier.messagesPage.loading')}</p>}
      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
      <div className="grid md:grid-cols-2 gap-4 min-h-[360px]">
        <ul className="space-y-1">
          {threads.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => void openThread(thread.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  activeId === thread.id
                    ? 'bg-[#2D5A27]/10 text-[#1a3616]'
                    : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                {thread.farmer
                  ? `${thread.farmer.firstName || ''} ${thread.farmer.lastName || ''} · ${thread.farmer.partnerCode || ''}`
                  : thread.id}
                <div className="text-xs text-gray-500">
                  {thread.lastMessageAt && new Date(thread.lastMessageAt).toLocaleString(dateLocale)}
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col p-3 min-h-[300px]">
          {!activeId && (
            <p className="text-sm text-gray-500 m-auto">{t('supplier.messagesPage.selectConversation')}</p>
          )}
          {activeId && (
            <>
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-[240px]">
                {messages.map((m) => (
                  <div key={m.id} className="text-sm border-b border-gray-100 pb-2">
                    <p className="text-gray-800 whitespace-pre-wrap">{m.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(m.createdAt).toLocaleString(dateLocale)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-auto">
                <input
                  className="flex-1 border border-gray-200 rounded px-2 py-2 text-sm"
                  placeholder={t('supplier.messagesPage.placeholderReply')}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), void send())}
                />
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void send()}
                  className="px-3 py-2 bg-[#2D5A27] text-white text-sm rounded disabled:opacity-50"
                >
                  {t('supplier.messagesPage.send')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {!loading && threads.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-6 text-sm text-gray-600 space-y-3">
          <p>{t('supplier.messagesPage.empty')}</p>
          <Link
            href="/supplier/orders"
            className="inline-flex min-h-[44px] items-center font-medium text-[#2D5A27] underline"
          >
            {t('supplier.messagesPage.emptyCta')}
          </Link>
        </div>
      )}
    </AuthGuard>
  );
}
