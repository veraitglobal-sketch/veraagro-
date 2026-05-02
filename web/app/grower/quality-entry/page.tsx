'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { batchesAPI } from '@/lib/api';
import { WEB_API_BASE } from '@/lib/api-base';
import Link from 'next/link';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { useGrowerHref } from '@/hooks/useGrowerHref';


const CRATE_KEYS = ['crateTop', 'crateMiddle', 'crateBottom'] as const;

const CLOUD_OPTIONS: { value: 'clear' | 'partly_cloudy' | 'cloudy' | 'overcast'; labelKey: string }[] = [
  { value: 'clear', labelKey: 'cloudClear' },
  { value: 'partly_cloudy', labelKey: 'cloudPartlyCloudy' },
  { value: 'cloudy', labelKey: 'cloudCloudy' },
  { value: 'overcast', labelKey: 'cloudOvercast' },
];

export default function QualityEntryPage() {
  const { t } = useTranslation();
  const growerHref = useGrowerHref();
  const navItems = useGrowerNavItems();
  const fk = (key: string) => t(`growerPages.qualityEntryForm.${key}`);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [formData, setFormData] = useState({
    weatherTemperature: '',
    weatherHumidity: '',
    cloudCover: 'clear' as 'clear' | 'partly_cloudy' | 'cloudy' | 'overcast',
    preCoolingStartTime: '',
    visualGradePhotos: [] as string[], // Base64 or URLs
    standardConfirmation: false,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setFileInputRef = (index: number) => (el: HTMLInputElement | null) => {
    fileInputRefs.current[index] = el;
  };

  const [batches, setBatches] = useState<{ id: string; batchId: string; productName: string; quantity: number; unit: string }[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await batchesAPI.getAll();
        const list = Array.isArray(data) ? data : [];
        setBatches(
          list
            .filter((b: any) => b?.id)
            .map((b: any) => ({
            id: b.id,
            batchId: b.batchId,
            productName: b.productName,
            quantity: b.quantity,
            unit: b.unit || 'kg',
          })),
        );
      } catch {
        setBatches([]);
      } finally {
        setBatchesLoading(false);
      }
    })();
  }, []);

  // Stale lot after status change / navigation: <select> value must still exist in options
  useEffect(() => {
    if (!selectedBatch) return;
    if (batches.some((b) => b.id === selectedBatch)) return;
    setSelectedBatch('');
  }, [batches, selectedBatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(fk('errPhotoMaxSize'));
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData(prev => {
        const newPhotos = [...prev.visualGradePhotos];
        newPhotos[index] = base64;
        return { ...prev, visualGradePhotos: newPhotos };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Validation
    if (!selectedBatch) {
      setError(fk('errSelectBatch'));
      setSubmitting(false);
      return;
    }

    if (!formData.standardConfirmation) {
      setError(fk('errConfirmProtocol'));
      setSubmitting(false);
      return;
    }

    const photos = formData.visualGradePhotos;
    if (!photos[0] || !photos[1] || !photos[2]) {
      setError(fk('errThreePhotos'));
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${WEB_API_BASE}/quality-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          batchId: selectedBatch,
          preCoolingStartTime: new Date(formData.preCoolingStartTime).toISOString(),
          weatherAtHarvest: {
            temperature: parseFloat(formData.weatherTemperature),
            humidity: parseFloat(formData.weatherHumidity),
            cloudCover: formData.cloudCover,
          },
          visualGradePhotos: formData.visualGradePhotos,
          standardConfirmation: formData.standardConfirmation,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || fk('errSubmitFailed'));
      }

      setSuccess(true);
      // Reset form
      setTimeout(() => {
        setFormData({
          weatherTemperature: '',
          weatherHumidity: '',
          cloudCover: 'clear',
          preCoolingStartTime: '',
          visualGradePhotos: [],
          standardConfirmation: false,
          notes: '',
        });
        setSelectedBatch('');
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || fk('errSubmitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidebarLayout title={t('growerPages.qualityEntry')} navItems={navItems}>
      <GrowerPageShell className="space-y-6">
        <GrowerPageHeader
          title={t('growerPages.qualityEntry')}
          description={fk('pageDescription')}
        />
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-base text-red-800">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <p className="text-base text-green-800">✓ {fk('successMessage')}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{fk('formSectionTitle')}</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Batch Selection */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                {fk('selectBatch')} *
              </label>
              {batchesLoading ? (
                <p className="text-base text-gray-500">{fk('loadingBatches')}</p>
              ) : batches.length === 0 ? (
                <p className="text-base text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
                  {fk('noBatchesLead')}{' '}
                  <Link href={growerHref('/grower/batches')} className="text-[#2D5A27] font-medium underline">
                    {fk('createBatchCta')}
                  </Link>{' '}
                  {fk('noBatchesTail')}
                </p>
              ) : (
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">{fk('selectBatchPlaceholder')}</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batchId} — {batch.productName} ({batch.quantity} {batch.unit})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Weather at Harvest */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">{fk('weatherAtHarvest')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    {fk('temperature')} *
                  </label>
                  <input
                    type="number"
                    name="weatherTemperature"
                    value={formData.weatherTemperature}
                    onChange={handleInputChange}
                    required
                    min="-20"
                    max="50"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={fk('temperaturePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    {fk('humidity')} *
                  </label>
                  <input
                    type="number"
                    name="weatherHumidity"
                    value={formData.weatherHumidity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={fk('humidityPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    {fk('cloudCover')} *
                  </label>
                  <select
                    name="cloudCover"
                    value={formData.cloudCover}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {CLOUD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {fk(opt.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pre-cooling Start Time */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">{fk('preCoolingTitle')}</h3>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  {fk('preCoolingLabel')} *
                </label>
                <input
                  type="datetime-local"
                  name="preCoolingStartTime"
                  value={formData.preCoolingStartTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Visual Grade Photos */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">{fk('visualPhotosTitle')}</h3>
              <p className="text-base text-gray-600 mb-4">{fk('visualPhotosIntro')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CRATE_KEYS.map((crateKey, index) => (
                  <div key={crateKey} className="space-y-2">
                    <label className="block text-base font-medium text-gray-700">
                      {fk(crateKey)} *
                    </label>
                    <div className="relative">
                      <input
                        ref={setFileInputRef(index)}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(index, e)}
                        className="hidden"
                        id={`photo-${index}`}
                      />
                      <label
                        htmlFor={`photo-${index}`}
                        className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors text-center"
                      >
                        {formData.visualGradePhotos[index] ? (
                          <div className="space-y-2">
                            <svg className="w-8 h-8 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-base text-green-600">{fk('photoUploaded')}</p>
                            <img
                              src={formData.visualGradePhotos[index]}
                              alt={fk(crateKey)}
                              className="w-full h-32 object-cover rounded mt-2"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-base text-gray-500">{fk('clickToUpload')}</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Standard Confirmation */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="standardConfirmation"
                    name="standardConfirmation"
                    type="checkbox"
                    checked={formData.standardConfirmation}
                    onChange={handleInputChange}
                    required
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-base">
                  <label htmlFor="standardConfirmation" className="font-medium text-gray-700">
                    {fk('standardConfirmationShort')} *
                  </label>
                  <p className="text-gray-600 mt-1">{fk('standardConfirmationBody')}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                {fk('notesLabel')}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={fk('notesPlaceholder')}
              />
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? fk('submitting') : fk('submit')}
              </button>
            </div>
          </form>
        </motion.div>
      </GrowerPageShell>
    </SidebarLayout>
  );
}
