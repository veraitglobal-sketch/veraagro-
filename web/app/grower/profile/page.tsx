'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { farmerProfileAPI } from '@/lib/api';
import Image from 'next/image';
import { Camera, Save, Loader2 } from 'lucide-react';

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

          {/* QR Code Info */}
          {profile?.farmer?.partnerCode && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-900 mb-1">Your QR Code:</p>
              <p className="text-xs text-green-700 font-mono">{profile.farmer.partnerCode}</p>
              <p className="text-xs text-green-600 mt-2">
                Your profile URL: <a href={`/farmer/${profile.farmer.partnerCode}`} target="_blank" rel="noopener noreferrer" className="underline">View Public Profile</a>
              </p>
            </div>
          )}

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
