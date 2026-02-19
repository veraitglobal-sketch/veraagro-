'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { farmerProfileAPI } from '@/lib/api';
import Image from 'next/image';
import { Camera, Save, Loader2, QrCode, Download, Copy, Check, ExternalLink, Smartphone, Package, Share2 } from 'lucide-react';

export default function FarmerProfilePage() {
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

  const loadProfile = async () => {
    try {
      setLoading(true);
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
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
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
      const result = await farmerProfileAPI.uploadPhoto(file);
      setProfile((prev: any) => ({
        ...prev,
        farmer: { ...prev?.farmer, photo: result.farmerPhoto },
      }));
      alert('Photo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert(error.response?.data?.message || 'Failed to upload photo');
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
      alert('Could not copy link');
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
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Farmer Profile</h1>

          {/* Photo Upload Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Profile Photo
            </label>
            <div className="flex items-center gap-6">
              {/* Photo Preview */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-green-600 shadow-lg">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Profile photo"
                    fill
                    className="object-cover"
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
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      {photoPreview ? 'Change Photo' : 'Upload Photo'}
                    </>
                  )}
                </label>
                <p className="text-xs text-gray-500 mt-2">Max 5MB, JPEG/PNG/WebP</p>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mb-6">
            <label htmlFor="farmerBio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio / Story
            </label>
            <textarea
              id="farmerBio"
              rows={4}
              value={formData.farmerBio}
              onChange={(e) => setFormData({ ...formData, farmerBio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Tell your story... (e.g., 'Ovo je domaćinstvo Petrović iz Arilja, gaje jabuke 40 godina')"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be displayed on your public profile when customers scan your QR code.
            </p>
          </div>

          {/* Years of Experience */}
          <div className="mb-6">
            <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience
            </label>
            <input
              type="number"
              id="yearsOfExperience"
              min="0"
              value={formData.yearsOfExperience}
              onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., 40"
            />
          </div>

          {/* Generation */}
          <div className="mb-6">
            <label htmlFor="generation" className="block text-sm font-medium text-gray-700 mb-2">
              Generation
            </label>
            <input
              type="text"
              id="generation"
              value={formData.generation}
              onChange={(e) => setFormData({ ...formData, generation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., 3rd, 4th"
            />
            <p className="text-xs text-gray-500 mt-1">
              Family generation (e.g., "3rd generation farmer")
            </p>
          </div>

          {/* Your QR Code – prominent, print-ready, with copy link and download */}
          <div className="mb-10 overflow-hidden rounded-2xl border border-[#2D5A27]/20 bg-gradient-to-b from-[#2D5A27]/5 to-white">
            <div className="bg-[#2D5A27] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Your Bio Vera QR Code</h2>
                  <p className="text-sm text-white/85">One code links to your public farmer profile — use it everywhere.</p>
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
                            alt="Your Bio Vera QR code"
                            className="h-52 w-52 sm:h-64 sm:w-64"
                          />
                          <p className="mt-3 text-center text-xs font-medium text-gray-500">Scan to open your profile</p>
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
                        <p className="text-sm font-medium text-gray-700 mb-2">Your profile link</p>
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
                            {linkCopied ? 'Copied' : 'Copy link'}
                          </button>
                        </div>
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#2D5A27] hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open public profile in new tab
                        </a>
                      </div>
                      {/* Download */}
                      {qrImageUrl && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Download QR image</p>
                          <p className="text-xs text-gray-500 mb-2">Use for print, packaging, or digital sharing. PNG, high contrast.</p>
                          <button
                            type="button"
                            onClick={handleDownloadQr}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#2D5A27] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2D5A27]/90"
                          >
                            <Download className="h-4 w-4" />
                            Download QR (PNG)
                          </button>
                        </div>
                      )}
                      {/* Where to use */}
                      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                        <p className="text-sm font-medium text-gray-800 mb-3">Where to use your QR code</p>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#2D5A27]" />
                            On product packaging and crates
                          </li>
                          <li className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-[#2D5A27]" />
                            At markets, stands, or point of sale
                          </li>
                          <li className="flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-[#2D5A27]" />
                            Social media, website, or business card
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <p className="mt-6 text-xs text-gray-500 text-center sm:text-left">
                    Code: <span className="font-mono">{profile.farmerQrCode}</span> — Keep this link and QR; they always point to your up-to-date profile.
                  </p>
                </>
              ) : (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#2D5A27]" />
                  <p className="mt-4 text-gray-600">Your QR code is being generated. Refresh the page in a moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                saving
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
