'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { growerNavItems } from '@/lib/grower-nav';
import { growerSupplierB2bAPI } from '@/lib/api';
import { ArrowLeft, Loader2, Send } from 'lucide-react';

export default function GrowerPartnerThreadPage() {
  const params = useParams();
  const threadId = typeof params?.threadId === 'string' ? params.threadId : '';

  const [messages, setMessages] = useState<
    Awaited<ReturnType<typeof growerSupplierB2bAPI.getThreadMessages>>
  >([]);
  const [headerTitle, setHeaderTitle] = useState('Partner');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!threadId) return;
    setErr(null);
    setLoading(true);
    try {
      const [msgs, threadList] = await Promise.all([
        growerSupplierB2bAPI.getThreadMessages(threadId),
        growerSupplierB2bAPI.getMyThreads(),
      ]);
      setMessages(msgs);
      const meta = threadList.find((t) => t.id === threadId);
      if (meta) {
        const b = meta.supplier?.material_supplier_profile?.businessName;
        setHeaderTitle(
          b ||
            [meta.supplier?.firstName, meta.supplier?.lastName].filter(Boolean).join(' ').trim() ||
            meta.supplier?.partnerCode ||
            'Partner',
        );
      }
    } catch (e) {
      setErr(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e instanceof Error ? e.message : 'Failed to load'),
      );
    } finally {
      setLoading(false);
    }
  }, [threadId]);

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
      setErr(m || (err instanceof Error ? err.message : 'Send failed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo="/login/producer">
      <SidebarLayout title="Messages" navItems={growerNavItems}>
        <Link
          href="/grower/partner-orders"
          className="inline-flex items-center gap-2 text-sm text-[#2D5A27] hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to partner orders
        </Link>

        <h1 className="text-lg font-medium text-gray-900 mb-1">{headerTitle}</h1>
        <p className="text-xs text-gray-500 font-mono mb-4">{threadId ? `${threadId.slice(0, 8)}…` : ''}</p>

        {loading && (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </p>
        )}
        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 mb-3">{err}</div>}

        {!loading && (
          <div className="max-w-2xl space-y-3 mb-6 min-h-[120px]">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500 font-light">No messages yet. Say hello below.</p>
            ) : (
              messages.map((m) => {
                const who = [m.sender.firstName, m.sender.lastName].filter(Boolean).join(' ').trim();
                return (
                  <div key={m.id} className="rounded-lg border border-gray-100 bg-white p-3 text-sm">
                    <div className="text-xs text-gray-500 mb-1">
                      {who || m.sender.partnerCode || 'User'} · {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap font-light leading-relaxed">{m.body}</p>
                  </div>
                );
              })
            )}
          </div>
        )}

        <form onSubmit={onSend} className="max-w-2xl flex gap-2 items-end">
          <textarea
            className="flex-1 min-h-[80px] rounded-lg border border-gray-200 px-3 py-2 text-sm font-light"
            placeholder="Write a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending || !threadId}
          />
          <button
            type="submit"
            disabled={sending || !text.trim() || !threadId}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2D5A27] text-white text-sm font-medium px-4 py-2.5 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </form>
      </SidebarLayout>
    </AuthGuard>
  );
}
