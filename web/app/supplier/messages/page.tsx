'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { b2bSupplierPortalAPI } from '@/lib/api';

export default function SupplierMessagesPage() {
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
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
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
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load messages');
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
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthGuard
      requiredRoles={['MATERIAL_SUPPLIER']}
      redirectTo="/login?returnTo=%2Fsupplier%2Fmessages"
    >
      <h1 className="text-xl font-light text-gray-900 mb-4">Messages</h1>
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
      <div className="grid md:grid-cols-2 gap-4 min-h-[360px]">
        <ul className="space-y-1">
          {threads.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => void openThread(t.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  activeId === t.id
                    ? 'bg-[#2D5A27]/10 text-[#1a3616]'
                    : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                {t.farmer
                  ? `${t.farmer.firstName || ''} ${t.farmer.lastName || ''} · ${t.farmer.partnerCode || ''}`
                  : t.id}
                <div className="text-xs text-gray-500">
                  {t.lastMessageAt && new Date(t.lastMessageAt).toLocaleString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col p-3 min-h-[300px]">
          {!activeId && (
            <p className="text-sm text-gray-500 m-auto">Select a conversation</p>
          )}
          {activeId && (
            <>
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-[240px]">
                {messages.map((m) => (
                  <div key={m.id} className="text-sm border-b border-gray-100 pb-2">
                    <p className="text-gray-800 whitespace-pre-wrap">{m.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-auto">
                <input
                  className="flex-1 border border-gray-200 rounded px-2 py-2 text-sm"
                  placeholder="Reply…"
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
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {!loading && threads.length === 0 && <p className="text-sm text-gray-500 mt-4">No messages yet.</p>}
    </AuthGuard>
  );
}
