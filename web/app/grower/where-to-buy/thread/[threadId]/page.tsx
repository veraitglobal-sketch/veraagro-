'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { growerSupplierB2bAPI, usersAPI } from '@/lib/api';
import { ArrowLeft, Loader2, Send } from 'lucide-react';

export default function GrowerSupplierThreadPage() {
  const { t } = useTranslation();
  const growerNavItems = useGrowerNavItems();
  const params = useParams();
  const threadId = typeof params?.threadId === 'string' ? params.threadId : '';

  const [messages, setMessages] = useState<
    Awaited<ReturnType<typeof growerSupplierB2bAPI.getThreadMessages>>
  >([]);
  const [headerTitle, setHeaderTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!threadId) return;
    setErr(null);
    setLoading(true);
    try {
      const me = await usersAPI.getMe().catch(() => null);
      if (me && typeof me === 'object' && me !== null && 'id' in me && typeof (me as { id: unknown }).id === 'string') {
        setMyUserId((me as { id: string }).id);
      }
      const [msgs, threadList] = await Promise.all([
        growerSupplierB2bAPI.getThreadMessages(threadId),
        growerSupplierB2bAPI.getMyThreads(),
      ]);
      setMessages(msgs);
      const meta = threadList.find((x) => x.id === threadId);
      if (meta) {
        const b = meta.supplier?.material_supplier_profile?.businessName;
        setHeaderTitle(
          b ||
            [meta.supplier?.firstName, meta.supplier?.lastName].filter(Boolean).join(' ').trim() ||
            meta.supplier?.partnerCode ||
            t('growerPages.partner'),
        );
      } else {
        setHeaderTitle(t('growerPages.partner'));
      }
    } catch (e) {
      setErr(
        String(
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            (e instanceof Error ? e.message : t('growerPages.threadLoadFailed')),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [threadId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !threadId) return;
    setSending(true);
    setErr(null);
    try {
      await growerSupplierB2bAPI.postThreadMessage(threadId, text.trim());
      setText('');
      setMessages(await growerSupplierB2bAPI.getThreadMessages(threadId));
    } catch (err) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErr(String(m || (err instanceof Error ? err.message : t('growerPages.loadFailed'))));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo="/login/producer">
      <SidebarLayout title={t('growerPages.messages')} navItems={growerNavItems}>
        <div className="w-full max-w-2xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Link
              href="/grower/where-to-buy/messages"
              className="inline-flex items-center gap-2 text-sm text-[#2D5A27] font-medium hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('growerPages.messagesInboxTitle')}
            </Link>
            <span className="text-gray-300" aria-hidden>
              |
            </span>
            <Link
              href="/grower/where-to-buy#my-orders"
              className="text-sm text-gray-500 hover:text-[#2D5A27] hover:underline"
            >
              {t('growerPages.threadBack')}
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[22rem] max-h-[min(calc(100vh-8rem),40rem)]">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 rounded-t-xl">
              <h1 className="text-lg font-semibold text-gray-900">{headerTitle || t('growerPages.messages')}</h1>
              {threadId ? (
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{threadId.slice(0, 8)}…</p>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f6f7f4] min-h-0">
              {loading && (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('growerPages.threadLoading')}
                </p>
              )}
              {err && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{err}</div>
              )}

              {!loading && messages.length === 0 && !err && (
                <p className="text-sm text-gray-500 font-light text-center py-8">{t('growerPages.threadNoMessages')}</p>
              )}

              {!loading &&
                messages.map((m) => {
                  const who = [m.sender.firstName, m.sender.lastName].filter(Boolean).join(' ').trim();
                  const label = who || m.sender.partnerCode || t('growerPages.partner');
                  const mine = myUserId && m.sender.id === myUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                          mine
                            ? 'bg-[#2D5A27] text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        <div
                          className={`text-[10px] mb-1 font-medium uppercase tracking-wide ${
                            mine ? 'text-white/80' : 'text-gray-500'
                          }`}
                        >
                          {label} · {new Date(m.createdAt).toLocaleString()}
                        </div>
                        <p
                          className={`whitespace-pre-wrap font-light leading-relaxed ${
                            mine ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          {m.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>

            <form
              onSubmit={onSend}
              className="p-3 border-t border-gray-200 bg-white rounded-b-xl flex flex-col sm:flex-row gap-2"
            >
              <textarea
                className="flex-1 min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-light focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27]"
                placeholder={t('growerPages.threadMessagePlaceholder')}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={sending || !threadId}
                rows={2}
              />
              <button
                type="submit"
                disabled={sending || !text.trim() || !threadId}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2D5A27] text-white text-sm font-medium px-4 py-2.5 disabled:opacity-50 w-full sm:w-auto self-end sm:self-stretch"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t('growerPages.threadSend')}
              </button>
            </form>
          </div>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
