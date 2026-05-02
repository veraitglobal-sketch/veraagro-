'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { usersAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, Plus, Edit2, Trash2, Search, Filter, QrCode, Download, X, CheckCircle, MapPin, KeyRound, Copy } from 'lucide-react';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { dateIntlLocaleFromLanguageTag } from '@/lib/i18n-routing';
import { WEB_API_BASE } from '@/lib/api-base';

const USER_ROLE_KEYS = [
  'FARMER',
  'GROWER',
  'BUYER',
  'LOGISTICS_PARTNER',
  'MATERIAL_SUPPLIER',
  'COMMERCIAL_AGENT',
  'ADMIN',
  'SUPER_ADMIN',
] as const;

interface User {
  id: string;
  partnerCode: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  productionCountry?: string | null;
  roles: string[];
  status: string;
  createdAt: string;
  /** Buyer portal company profile (same as /buyers/company-profile) */
  buyerCompanyProfile?: Record<string, unknown> | null;
  _count?: {
    estates: number;
  };
  assignedAgentUserId?: string | null;
  assignedCommercialAgent?: {
    id: string;
    firstName: string;
    lastName: string;
    partnerCode: string;
    email?: string | null;
  } | null;
  commercial_agent_profile?: {
    officeName?: string | null;
    address: string;
    city: string;
    country: string;
    postalCode?: string | null;
  } | null;
}

export default function UsersManagementPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = dateIntlLocaleFromLanguageTag(i18n.resolvedLanguage ?? i18n.language);
  const adminNavItems = useAdminNavItems();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createdFarmer, setCreatedFarmer] = useState<{ qrCode: string; profileUrl: string; name: string } | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [commercialAgents, setCommercialAgents] = useState<
    {
      id: string;
      firstName: string;
      lastName: string;
      partnerCode: string;
      email?: string | null;
      phone?: string | null;
      commercial_agent_profile?: { city?: string; country?: string } | null;
    }[]
  >([]);

  useEffect(() => {
    let c = true;
    usersAPI
      .getCommercialAgents()
      .then((a) => {
        if (c && Array.isArray(a)) setCommercialAgents(a);
      })
      .catch(() => undefined);
    return () => {
      c = false;
    };
  }, []);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter, search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (roleFilter) filters.role = roleFilter;
      if (statusFilter) filters.status = statusFilter;
      if (search) filters.search = search;
      
      const data = await usersAPI.getAll(filters);
      setUsers(data);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || t('adminPages.userManagement.errLoadUsers'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('adminPages.userManagement.confirmDeleteUser'))) return;
    
    try {
      await usersAPI.delete(id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || t('adminPages.userManagement.errDeleteUser'));
    }
  };

  const [formData, setFormData] = useState({
    partnerCode: '',
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    productionCountry: '',
    password: '',
    roles: [] as string[],
    status: 'PENDING_VERIFICATION' as string,
    autoGeneratePassword: false,
    sendEmail: true,
    buyerCompanyProfileJson: '' as string,
    assignedAgentUserId: '' as string,
    caOfficeName: '',
    caAddress: '',
    caCity: '',
    caCountry: '',
    caPostalCode: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = await usersAPI.create({
        ...formData,
        productionCountry: formData.productionCountry || undefined,
        password: formData.autoGeneratePassword ? undefined : formData.password,
        roles: formData.roles.length > 0 ? formData.roles : undefined,
        autoGeneratePassword: formData.autoGeneratePassword,
        sendEmail: formData.sendEmail,
      });
      
      let successMessage = t('adminPages.userManagement.createSuccess');
      if (newUser.passwordGenerated && newUser.password) {
        successMessage += `\n\n${t('adminPages.userManagement.createGeneratedPassword', { password: newUser.password })}`;
        if (newUser.emailSent) {
          successMessage += `\n✅ ${t('adminPages.userManagement.createPasswordEmailed')}`;
        } else if (formData.sendEmail) {
          successMessage += `\n⚠️ ${t('adminPages.userManagement.createEmailNotSent')}`;
        }
      }
      
      // If farmer/grower was created, show QR code
      if ((formData.roles.includes('FARMER') || formData.roles.includes('GROWER')) && newUser.farmerQrCode) {
        setCreatedFarmer({
          qrCode: newUser.farmerQrCode,
          profileUrl: newUser.farmerProfileUrl || '',
          name: `${newUser.firstName} ${newUser.lastName}`,
        });
        // Show password if generated
        if (newUser.passwordGenerated && newUser.password) {
          setTimeout(() => alert(successMessage), 100);
        }
      } else {
        alert(successMessage);
        setShowCreateModal(false);
        resetForm();
      }
      loadUsers();
    } catch (err: any) {
      alert(err.message || t('adminPages.userManagement.errCreateUser'));
    }
  };

  const handleApproveVerification = async (userId: string) => {
    if (!confirm(t('adminPages.userManagement.confirmApproveVerification'))) return;
    
    try {
      await usersAPI.update(userId, {
        status: 'ACTIVE',
      });
      loadUsers();
      alert(t('adminPages.userManagement.approveSuccess'));
    } catch (err: any) {
      alert(err.message || t('adminPages.userManagement.errApproveVerification'));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      let buyerCompanyProfile: Record<string, unknown> | undefined;
      if (formData.roles.includes('BUYER') && formData.buyerCompanyProfileJson.trim()) {
        try {
          buyerCompanyProfile = JSON.parse(formData.buyerCompanyProfileJson) as Record<string, unknown>;
        } catch {
          alert(t('adminPages.userManagement.errInvalidBuyerJson'));
          return;
        }
      }

      const canHaveAssignedAgent = formData.roles.some((r) =>
        ['FARMER', 'GROWER', 'LOGISTICS_PARTNER', 'MATERIAL_SUPPLIER'].includes(r),
      );
      const isCommercialAgent = formData.roles.includes('COMMERCIAL_AGENT');
      const officeComplete =
        formData.caAddress.trim() && formData.caCity.trim() && formData.caCountry.trim();

      await usersAPI.update(editingUser.id, {
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        productionCountry: formData.productionCountry || undefined,
        roles: formData.roles.length > 0 ? formData.roles : undefined,
        status: formData.status || undefined,
        ...(formData.roles.includes('BUYER') && formData.buyerCompanyProfileJson.trim()
          ? { buyerCompanyProfile }
          : {}),
        ...(canHaveAssignedAgent ? { assignedAgentUserId: formData.assignedAgentUserId || null } : {}),
        ...(isCommercialAgent && officeComplete
          ? {
              commercialAgentProfile: {
                officeName: formData.caOfficeName.trim() || null,
                address: formData.caAddress.trim(),
                city: formData.caCity.trim(),
                country: formData.caCountry.trim(),
                postalCode: formData.caPostalCode.trim() || null,
              },
            }
          : {}),
      });
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (err: any) {
      alert(err.message || t('adminPages.userManagement.errUpdateUser'));
    }
  };

  const resetForm = () => {
    setFormData({
      partnerCode: '',
      email: '',
      phone: '',
      firstName: '',
      lastName: '',
      productionCountry: '',
      password: '',
      roles: [],
      status: 'PENDING_VERIFICATION',
      autoGeneratePassword: false,
      sendEmail: true,
      buyerCompanyProfileJson: '',
      assignedAgentUserId: '',
      caOfficeName: '',
      caAddress: '',
      caCity: '',
      caCountry: '',
      caPostalCode: '',
    });
  };

  const handleAdminResetPassword = async () => {
    if (!editingUser) return;
    if (
      !confirm(
        t('adminPages.userManagement.confirmResetPassword', { partnerCode: editingUser.partnerCode }),
      )
    ) {
      return;
    }
    setResettingPassword(true);
    try {
      const r = await usersAPI.adminResetPassword(editingUser.id);
      const parts: string[] = [t('adminPages.userManagement.resetAlertPartner', { code: r.partnerCode })];
      if (r.email) parts.push(t('adminPages.userManagement.resetAlertEmail', { email: r.email }));
      parts.push('', t('adminPages.userManagement.resetAlertPasswordIntro'), r.temporaryPassword);
      alert(parts.join('\n'));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || t('adminPages.userManagement.errResetPassword'));
    } finally {
      setResettingPassword(false);
    }
  };

  const openEditModal = async (user: User) => {
    setEditingUser(user);
    let full: User = user;
    try {
      full = await usersAPI.getOne(user.id);
    } catch {
      // keep list row
    }
    let profileJson = '';
    if (full.roles.includes('BUYER')) {
      try {
        profileJson = full?.buyerCompanyProfile
          ? JSON.stringify(full.buyerCompanyProfile, null, 2)
          : JSON.stringify(
              {
                company: {
                  legalEntity: '',
                  taxId: '',
                  headquarters: '',
                  generalDirector: '',
                  financeManager: '',
                },
                deliveryLocations: [],
                authorizedPersonnel: [],
              },
              null,
              2,
            );
      } catch {
        profileJson = '';
      }
    }
    const cap = full.commercial_agent_profile;
    setFormData({
      partnerCode: full.partnerCode,
      email: full.email || '',
      phone: full.phone || '',
      firstName: full.firstName,
      lastName: full.lastName,
      productionCountry: full.productionCountry || '',
      password: '',
      roles: full.roles || [],
      status: full.status,
      autoGeneratePassword: false,
      sendEmail: false,
      buyerCompanyProfileJson: profileJson,
      assignedAgentUserId: full.assignedAgentUserId || '',
      caOfficeName: cap?.officeName || '',
      caAddress: cap?.address || '',
      caCity: cap?.city || '',
      caCountry: cap?.country || '',
      caPostalCode: cap?.postalCode || '',
    });
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.users')} navItems={adminNavItems}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light text-gray-900">{t('adminPages.userManagement.headerTitle')}</h1>
              <p className="text-sm text-gray-600 mt-1">{t('adminPages.userManagement.headerSubtitle')}</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('adminPages.userManagement.createUser')}
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('adminPages.userManagement.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">{t('adminPages.userManagement.filterAllRoles')}</option>
                {USER_ROLE_KEYS.map((role) => (
                  <option key={role} value={role}>
                    {t(`adminPages.userManagement.roles.${role}`)}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">{t('adminPages.userManagement.filterAllStatuses')}</option>
                {(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'] as const).map((st) => (
                  <option key={st} value={st}>
                    {t(`adminPages.userManagement.statuses.${st}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('adminPages.userManagement.loading')}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('adminPages.userManagement.colUser')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('adminPages.userManagement.colRole')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('adminPages.userManagement.colStatus')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('adminPages.userManagement.colAgent')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('adminPages.userManagement.colEstates')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('adminPages.userManagement.colCreated')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('adminPages.userManagement.colActions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.partnerCode}</div>
                          {user.email && (
                            <div className="text-xs text-gray-400">{user.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                            >
                              {t(`adminPages.userManagement.roles.${role}`, { defaultValue: role.replace(/_/g, ' ') })}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            user.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : user.status === 'SUSPENDED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {t(`adminPages.userManagement.statuses.${user.status}`, {
                            defaultValue: user.status.replace(/_/g, ' '),
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-[10rem]">
                        {user.assignedCommercialAgent ? (
                          <span>
                            {user.assignedCommercialAgent.firstName} {user.assignedCommercialAgent.lastName}
                            <span className="block text-xs text-gray-400 truncate">
                              {user.assignedCommercialAgent.partnerCode}
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user._count?.estates || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString(dateLocale)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2 items-center">
                          {(user.roles.includes('FARMER') || user.roles.includes('GROWER')) && (
                            <Link
                              href={`/admin/farm/${user.id}`}
                              className="text-[#2D5A27] hover:text-[#2D5A27]/80 p-1.5 rounded hover:bg-[#2D5A27]/5"
                              title={t('adminPages.userManagement.titleFarmDetail')}
                            >
                              <MapPin className="w-4 h-4" />
                            </Link>
                          )}
                          {user.status === 'PENDING_VERIFICATION' && (
                            <button
                              onClick={() => handleApproveVerification(user.id)}
                              className="text-green-600 hover:text-green-900"
                              title={t('adminPages.userManagement.titleApproveVerification')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-green-600 hover:text-green-900"
                            title={t('adminPages.userManagement.titleEditUser')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title={t('adminPages.userManagement.titleDeleteUser')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t('adminPages.userManagement.noUsers')}</p>
                </div>
              )}
            </div>
          )}

          {/* Create User Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-xl font-semibold mb-4">{t('adminPages.userManagement.modalCreateTitle')}</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelPartnerCode')}</label>
                      <input
                        type="text"
                        value={formData.partnerCode}
                        onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelEmail')}</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelFirstName')}</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelLastName')}</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelPhone')}</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    {(formData.roles.includes('FARMER') || formData.roles.includes('GROWER')) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelProductionCountry')}</label>
                        <input
                          type="text"
                          placeholder={t('adminPages.userManagement.productionCountryPlaceholder')}
                          value={formData.productionCountry}
                          onChange={(e) => setFormData({ ...formData, productionCountry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <p className="text-xs text-gray-500 mt-0.5">{t('adminPages.userManagement.productionCountryHint')}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelPassword')}</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.autoGeneratePassword}
                            onChange={(e) => {
                              setFormData({ 
                                ...formData, 
                                autoGeneratePassword: e.target.checked,
                                password: e.target.checked ? '' : formData.password
                              });
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{t('adminPages.userManagement.autoGenPassword')}</span>
                        </label>
                        {!formData.autoGeneratePassword && (
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        )}
                        {(formData.roles.includes('FARMER') || formData.roles.includes('GROWER')) && formData.email && (
                          <label className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              checked={formData.sendEmail}
                              onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">{t('adminPages.userManagement.sendPasswordEmail')}</span>
                          </label>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelRoles')}</label>
                      <div className="space-y-2">
                        {USER_ROLE_KEYS.map((role) => (
                          <label key={role} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.roles.includes(role)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, roles: [...formData.roles, role] });
                                } else {
                                  setFormData({ ...formData, roles: formData.roles.filter(r => r !== role) });
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">
                              {t(`adminPages.userManagement.roles.${role}`, { defaultValue: role.replace(/_/g, ' ') })}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelStatus')}</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED'] as const).map((st) => (
                          <option key={st} value={st}>
                            {t(`adminPages.userManagement.statuses.${st}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      {t('adminPages.userManagement.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {t('adminPages.userManagement.submitCreate')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* QR Code Modal for Created Farmer */}
          {createdFarmer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{t('adminPages.userManagement.qrModalTitle')}</h2>
                  <button
                    onClick={() => {
                      setCreatedFarmer(null);
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-2">{t('adminPages.userManagement.qrModalLead', { name: createdFarmer.name })}</p>
                  <p className="text-xs text-gray-500 mb-4">{t('adminPages.userManagement.qrModalHint')}</p>
                  
                  {/* QR Code Image */}
                  <div className="bg-white p-4 border-2 border-gray-200 rounded-lg inline-block mb-4">
                    <img
                      src={`${WEB_API_BASE}/farmer-profile/qr/${createdFarmer.qrCode}/image`}
                      alt={t('adminPages.userManagement.qrCodeImageAlt')}
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-green-800 font-medium mb-1">{t('adminPages.userManagement.qrCodeIdLabel')}</p>
                    <p className="text-sm text-green-900 font-mono">{createdFarmer.qrCode}</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-800 font-medium mb-1">{t('adminPages.userManagement.profileUrlLabel')}</p>
                    <a
                      href={createdFarmer.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {createdFarmer.profileUrl}
                    </a>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        const qrImageUrl = `${WEB_API_BASE}/farmer-profile/qr/${createdFarmer.qrCode}/image`;
                        window.open(qrImageUrl, '_blank');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {t('adminPages.userManagement.downloadQr')}
                    </button>
                    <button
                      onClick={() => {
                        setCreatedFarmer(null);
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      {t('adminPages.userManagement.close')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Edit User Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-xl font-semibold mb-2">{t('adminPages.userManagement.modalEditTitle')}</h2>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('adminPages.userManagement.userIdLabel')}</p>
                      <p className="text-xs font-mono text-gray-800 break-all mt-1" title={editingUser.id}>
                        {editingUser.id}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard.writeText(editingUser.id)}
                      className="shrink-0 p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600"
                      title={t('adminPages.userManagement.copyUserIdTitle')}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{t('adminPages.userManagement.userIdHint')}</p>
                </div>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelPartnerCodeReadonly')}</label>
                      <input
                        type="text"
                        value={formData.partnerCode}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelEmail')}</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelFirstNameEdit')}</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelLastNameEdit')}</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelPhone')}</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    {(formData.roles.includes('FARMER') || formData.roles.includes('GROWER')) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelProductionCountry')}</label>
                        <input
                          type="text"
                          placeholder={t('adminPages.userManagement.productionCountryPlaceholder')}
                          value={formData.productionCountry}
                          onChange={(e) => setFormData({ ...formData, productionCountry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelStatus')}</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED'] as const).map((st) => (
                          <option key={st} value={st}>
                            {t(`adminPages.userManagement.statuses.${st}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.labelRoles')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {USER_ROLE_KEYS.map((role) => (
                          <label key={role} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.roles.includes(role)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, roles: [...formData.roles, role] });
                                } else {
                                  setFormData({ ...formData, roles: formData.roles.filter(r => r !== role) });
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">
                              {t(`adminPages.userManagement.roles.${role}`, { defaultValue: role.replace(/_/g, ' ') })}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {formData.roles.some((r) =>
                      ['FARMER', 'GROWER', 'LOGISTICS_PARTNER', 'MATERIAL_SUPPLIER'].includes(r),
                    ) && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.assignedAgentLabel')}</label>
                        <p className="text-xs text-gray-500 mb-2">{t('adminPages.userManagement.assignedAgentHint')}</p>
                        <select
                          value={formData.assignedAgentUserId}
                          onChange={(e) => setFormData({ ...formData, assignedAgentUserId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">{t('adminPages.userManagement.agentNone')}</option>
                          {commercialAgents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.firstName} {a.lastName} ({a.partnerCode})
                              {a.commercial_agent_profile?.city
                                ? ` — ${a.commercial_agent_profile.city}, ${a.commercial_agent_profile.country || ''}`
                                : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {formData.roles.includes('COMMERCIAL_AGENT') && (
                      <div className="col-span-2 space-y-3 rounded-lg border border-dashed border-gray-200 p-3 bg-gray-50/50">
                        <p className="text-sm font-medium text-gray-800">{t('adminPages.userManagement.caSectionTitle')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-0.5">{t('adminPages.userManagement.caOfficeName')}</label>
                            <input
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              value={formData.caOfficeName}
                              onChange={(e) => setFormData({ ...formData, caOfficeName: e.target.value })}
                              placeholder={t('adminPages.userManagement.caOfficePlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-0.5">{t('adminPages.userManagement.caStreet')}</label>
                            <input
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              value={formData.caAddress}
                              onChange={(e) => setFormData({ ...formData, caAddress: e.target.value })}
                              placeholder={t('adminPages.userManagement.caStreetPlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-0.5">{t('adminPages.userManagement.caPostal')}</label>
                            <input
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              value={formData.caPostalCode}
                              onChange={(e) => setFormData({ ...formData, caPostalCode: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-0.5">{t('adminPages.userManagement.caCity')}</label>
                            <input
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              value={formData.caCity}
                              onChange={(e) => setFormData({ ...formData, caCity: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-0.5">{t('adminPages.userManagement.caCountry')}</label>
                            <input
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              value={formData.caCountry}
                              onChange={(e) => setFormData({ ...formData, caCountry: e.target.value })}
                              placeholder={t('adminPages.userManagement.caCountryPlaceholder')}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {formData.roles.includes('BUYER') && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.userManagement.buyerJsonLabel')}</label>
                        <p className="text-xs text-gray-500 mb-2">{t('adminPages.userManagement.buyerJsonHint')}</p>
                        <textarea
                          value={formData.buyerCompanyProfileJson}
                          onChange={(e) => setFormData({ ...formData, buyerCompanyProfileJson: e.target.value })}
                          rows={12}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                    <p className="font-medium mb-1">{t('adminPages.userManagement.resetPasswordTitle')}</p>
                    <p className="text-xs text-amber-900/80 mb-2">{t('adminPages.userManagement.resetPasswordHint')}</p>
                    <button
                      type="button"
                      onClick={() => void handleAdminResetPassword()}
                      disabled={resettingPassword}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
                    >
                      <KeyRound className="h-4 w-4" />
                      {resettingPassword ? t('adminPages.userManagement.resetPasswordGenerating') : t('adminPages.userManagement.resetPasswordCta')}
                    </button>
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(null);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      {t('adminPages.userManagement.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {t('adminPages.userManagement.submitUpdate')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
