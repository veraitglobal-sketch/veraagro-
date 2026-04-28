'use client';

import { useState, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';
import { farmerProfileAPI } from '@/lib/api';
import Image from 'next/image';
import { Camera, Save, Loader2, QrCode, Download, Copy, Check, ExternalLink, Smartphone, Package, Share2 } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';

export default function FarmerProfilePage() {
  const { t } = useTranslation();
  const growerNavItems = useGrowerNavItems();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    farmerBio: '',
    yearsOfExperience: '',
    generation: '',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async (options?: { skipLoading?: boolean }) => {
    const skip = options?.skipLoading === true;
    try {
      if (!skip) setLoading(true);
      const data = await farmerProfileAPI.getMyProfile();
      setProfile(data);
      setFormData({
        farmerBio: data.farmer?.bio || '',
        yearsOfExperience: data.farmer?.yearsOfExperience?.toString() || '',
        generation: data.farmer?.generation || '',
      });
      setPhotoPreview(data.farmer?.photo || null);
      if (data.farmerQrCode) {
        try {
          const url = await farmerProfileAPI.getMyQrCodeImage();
          setQrImageUrl(url);
        } catch {
          setQrImageUrl(null);
        }
      } else {
        setQrImageUrl(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      alert(t('grower.profilePage.alertLoadFailed'));
    } finally {
      if (!skip) setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('grower.profilePage.alertPhotoTooBig'));
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('grower.profilePage.alertNotImage'));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload photo
    try {
      setUploading(true);
      await farmerProfileAPI.uploadPhoto(file);
      await loadProfile({ skipLoading: true });
      alert(t('grower.profilePage.alertPhotoOk'));
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert(error.response?.data?.message || t('grower.profilePage.alertPhotoUploadFailed'));
      // Revert preview on error
      setPhotoPreview(profile?.farmer?.photo || null);
    } finally {
      setUploading(false);
    }
  };

  const profileUrl = profile?.farmerProfileUrl || (profile?.farmerQrCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/farmer/${profile.farmerQrCode}` : '');

  const handleCopyLink = async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      alert(t('grower.profilePage.alertCopyFailed'));
    }
  };

  const handleDownloadQr = async () => {
    if (!qrImageUrl) return;
    try {
      const res = await fetch(qrImageUrl);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `bio-vera-qr-${profile?.farmerQrCode || 'my'}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      const a = document.createElement('a');
      a.href = qrImageUrl;
      a.download = `bio-vera-qr-${profile?.farmerQrCode || 'my'}.png`;
      a.click();
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await farmerProfileAPI.updateProfile({
        farmerBio: formData.farmerBio,
        yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
        generation: formData.generation || undefined,
      });
      await loadProfile();
      alert(t('grower.profilePage.alertSaveOk'));
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(error.response?.data?.message || t('grower.profilePage.alertSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
        <SidebarLayout title={t('grower.nav.myProfile')} navItems={growerNavItems}>
          <GrowerPageShell>
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#2D5A27]" />
              <p className="text-sm text-gray-600">{t('grower.profilePage.loading')}</p>
            </div>
          </GrowerPageShell>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title={t('grower.nav.myProfile')} navItems={growerNavItems}>
        <GrowerPageShell>
        <GrowerPageHeader title={t('grower.nav.myProfile')} description={t('grower.profilePage.headerDescription')} />
        <div className="grid grid-cols-1 gap-6 items-stretch lg:grid-cols-2 lg:gap-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-7 flex flex-col h-full min-h-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('grower.profilePage.cardTitle')}</h2>
          <p className="text-sm text-gray-500 mb-6 font-light">{t('grower.profilePage.cardLead')}</p>

          {/* Photo Upload Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('grower.profilePage.photoLabel')}</label>
            <div className="flex items-center gap-6">
              {/* Photo Preview */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-green-600 shadow-lg">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt={t('grower.profilePage.photoProfileAlt')}
                    fill
                    className="object-cover"
                    unoptimized={
                      photoPreview.startsWith('data:') || /^https?:\/\//.test(photoPreview)
                    }
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                    <span className="text-4xl">🌱</span>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="photo-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                    uploading
                      ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-green-600 bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('grower.profilePage.uploading')}
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      {photoPreview ? t('grower.profilePage.changePhoto') : t('grower.profilePage.uploadPhoto')}
                    </>
                  )}
                </label>
                <p className="text-xs text-gray-500 mt-2">{t('grower.profilePage.photoHint')}</p>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mb-6">
            <label htmlFor="farmerBio" className="block text-sm font-medium text-gray-700 mb-2">
              {t('grower.profilePage.bioLabel')}
            </label>
            <textarea
              id="farmerBio"
              rows={4}
              value={formData.farmerBio}
              onChange={(e) => setFormData({ ...formData, farmerBio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder={t('grower.profilePage.bioPlaceholder')}
            />
            <p className="text-xs text-gray-500 mt-1 font-light">{t('grower.profilePage.bioHint')}</p>
          </div>

          {/* Years of Experience */}
          <div className="mb-6">
            <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
              {t('grower.profilePage.yearsLabel')}
            </label>
            <input
              type="number"
              id="yearsOfExperience"
              min="0"
              value={formData.yearsOfExperience}
              onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder={t('grower.profilePage.yearsPlaceholder')}
            />
          </div>

          {/* Generation */}
          <div>
            <label htmlFor="generation" className="block text-sm font-medium text-gray-700 mb-2">
              {t('grower.profilePage.generationLabel')}
            </label>
            <input
              type="text"
              id="generation"
              value={formData.generation}
              onChange={(e) => setFormData({ ...formData, generation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder={t('grower.profilePage.generationPlaceholder')}
            />
            <p className="text-xs text-gray-500 mt-1 font-light">{t('grower.profilePage.generationHint')}</p>
          </div>

          <div className="mt-auto flex justify-end pt-6 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
                saving
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-[#2D5A27] text-white hover:bg-[#23471f]'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('grower.profilePage.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('grower.profilePage.saveChanges')}
                </>
              )}
            </button>
          </div>
        </div>

          {/* Your QR Code – right column on large screens */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full min-h-0 flex flex-col">
          <div className="overflow-hidden rounded-2xl border border-[#2D5A27]/20 bg-gradient-to-b from-[#2D5A27]/5 to-white m-3 sm:m-4">
            <div className="bg-[#2D5A27] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{t('grower.profilePage.qrTitle')}</h2>
                  <p className="text-sm text-white/85 font-light">{t('grower.profilePage.qrSubtitle')}</p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              {profile?.farmerQrCode ? (
                <>
                  <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8">
                    {/* Large print-ready QR */}
                    <div className="flex-shrink-0">
                      {qrImageUrl ? (
                        <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                          <img
                            src={qrImageUrl}
                            alt={t('grower.profilePage.qrAlt')}
                            className="h-52 w-52 sm:h-64 sm:w-64"
                          />
                          <p className="mt-3 text-center text-xs font-medium text-gray-500">
                            {t('grower.profilePage.scanHint')}
                          </p>
                        </div>
                      ) : (
                        <div className="h-52 w-52 sm:h-64 sm:w-64 rounded-2xl border-2 border-gray-200 bg-white flex items-center justify-center">
                          <Loader2 className="h-10 w-10 animate-spin text-[#2D5A27]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 w-full min-w-0 space-y-6">
                      {/* Profile link + copy */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">{t('grower.profilePage.profileLinkLabel')}</p>
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="text"
                            readOnly
                            value={profileUrl}
                            className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#2D5A27] bg-white px-4 py-2 text-sm font-medium text-[#2D5A27] hover:bg-[#2D5A27]/5"
                          >
                            {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {linkCopied ? t('grower.profilePage.copied') : t('grower.profilePage.copyLink')}
                          </button>
                        </div>
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#2D5A27] hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {t('grower.profilePage.openPublic')}
                        </a>
                      </div>
                      {/* Download */}
                      {qrImageUrl && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">{t('grower.profilePage.downloadSectionTitle')}</p>
                          <p className="text-xs text-gray-500 mb-2 font-light">{t('grower.profilePage.downloadSectionHint')}</p>
                          <button
                            type="button"
                            onClick={handleDownloadQr}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#2D5A27] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2D5A27]/90"
                          >
                            <Download className="h-4 w-4" />
                            {t('grower.profilePage.downloadPng')}
                          </button>
                        </div>
                      )}
                      {/* Where to use */}
                      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                        <p className="text-sm font-medium text-gray-800 mb-3">{t('grower.profilePage.whereUseTitle')}</p>
                        <ul className="space-y-2 text-sm text-gray-600 font-light">
                          <li className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#2D5A27]" />
                            {t('grower.profilePage.whereUsePackaging')}
                          </li>
                          <li className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-[#2D5A27]" />
                            {t('grower.profilePage.whereUseMarkets')}
                          </li>
                          <li className="flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-[#2D5A27]" />
                            {t('grower.profilePage.whereUseSocial')}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <p className="mt-6 text-xs text-gray-500 text-center sm:text-left font-light">
                    <Trans
                      i18nKey="grower.profilePage.codeFootnote"
                      values={{ code: profile.farmerQrCode }}
                      components={[<span key="0" className="font-mono text-gray-700" />]}
                    />
                  </p>
                </>
              ) : (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#2D5A27]" />
                  <p className="mt-4 text-gray-600 font-light">{t('grower.profilePage.qrGenerating')}</p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
