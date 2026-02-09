'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { motion } from 'framer-motion';
import { MessageCircle, Search, Filter, Download, Mail, Phone, User, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { getAdminNavItems } from '@/lib/admin-nav';
import api from '@/lib/api';

interface Conversation {
  id: string;
  sessionId: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  userInfo: { ipAddress?: string; userAgent?: string; language?: string };
  contactRequested: boolean;
  contactInfo?: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    consentGiven: boolean;
    submittedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AIConversationsPage() {
  const adminNavItems = getAdminNavItems();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contactRequests, setContactRequests] = useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'contacts'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
  }, [activeTab]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (activeTab === 'contacts') {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004'}/ai-assistant/contact-requests`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setContactRequests(data.conversations || []);
      } else {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004'}/ai-assistant/conversations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = activeTab === 'contacts' 
    ? contactRequests.filter(conv => 
        conv.contactInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.contactInfo?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations.filter(conv => 
        conv.sessionId.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return;
    const message = encodeURIComponent('Hello from BioVera team!');
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <AuthGuard requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
      <SidebarLayout title="AI Conversations" navItems={adminNavItems}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-gray-900">AI Assistant Conversations</h1>
              <p className="text-sm text-gray-500 font-light mt-1">Monitor and manage AI assistant interactions</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-light border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Conversations ({conversations.length})
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-4 py-2 text-sm font-light border-b-2 transition-colors ${
                activeTab === 'contacts'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Contact Requests ({contactRequests.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'contacts' ? 'Search by name or email...' : 'Search by session ID...'}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none text-sm font-light"
            />
          </div>

          {/* Conversations List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-500 font-light">Loading conversations...</p>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500 font-light">No conversations found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-green-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {activeTab === 'contacts' && conversation.contactInfo ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-light text-gray-900">{conversation.contactInfo.name}</span>
                            {conversation.contactInfo.consentGiven && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 font-light">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {conversation.contactInfo.email}
                            </span>
                            {conversation.contactInfo.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {conversation.contactInfo.phone}
                              </span>
                            )}
                          </div>
                          {conversation.contactInfo.message && (
                            <p className="text-xs text-gray-600 font-light mt-2 line-clamp-2">
                              {conversation.contactInfo.message}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <MessageCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-light text-gray-500">Session: {conversation.sessionId.substring(0, 8)}...</span>
                          </div>
                          <p className="text-xs text-gray-500 font-light">
                            {Array.isArray(conversation.messages) ? conversation.messages.length : 0} messages
                          </p>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 font-light mb-1">
                        {new Date(conversation.createdAt).toLocaleDateString()}
                      </div>
                      {conversation.contactRequested && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-light bg-green-100 text-green-700">
                          Contact Requested
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Conversation Detail Modal */}
          {selectedConversation && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col"
              >
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-light text-gray-900">Conversation Details</h3>
                    <p className="text-xs text-gray-500 font-light mt-0.5">
                      Session: {selectedConversation.sessionId}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {/* Contact Info */}
                  {selectedConversation.contactInfo && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-light text-gray-900 mb-3">Contact Information</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 font-light">Name:</span>
                          <p className="text-gray-900 font-light">{selectedConversation.contactInfo.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-light">Email:</span>
                          <p className="text-gray-900 font-light">{selectedConversation.contactInfo.email}</p>
                        </div>
                        {selectedConversation.contactInfo.phone && (
                          <div>
                            <span className="text-gray-500 font-light">Phone:</span>
                            <div className="flex items-center gap-2">
                              <p className="text-gray-900 font-light">{selectedConversation.contactInfo.phone}</p>
                              <button
                                onClick={() => handleWhatsApp(selectedConversation.contactInfo?.phone)}
                                className="p-1 hover:bg-green-100 rounded transition-colors"
                              >
                                <MessageCircle className="w-4 h-4 text-green-600" />
                              </button>
                            </div>
                          </div>
                        )}
                        {selectedConversation.contactInfo.message && (
                          <div className="col-span-2">
                            <span className="text-gray-500 font-light">Message:</span>
                            <p className="text-gray-900 font-light mt-1">{selectedConversation.contactInfo.message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-light text-gray-900">Messages</h4>
                    {Array.isArray(selectedConversation.messages) && selectedConversation.messages.map((msg: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        {msg.role === 'user' && (
                          <div className="flex justify-end">
                            <div className="max-w-[80%] bg-gray-900 text-white px-4 py-2 rounded-lg">
                              <p className="text-sm font-light">{msg.content}</p>
                            </div>
                          </div>
                        )}
                        {msg.role === 'assistant' && (
                          <div className="flex justify-start">
                            <div className="max-w-[80%] bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg">
                              <p className="text-sm font-light text-gray-700">{msg.content}</p>
                            </div>
                          </div>
                        )}
                        {msg.timestamp && (
                          <p className="text-xs text-gray-400 font-light text-center">
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
