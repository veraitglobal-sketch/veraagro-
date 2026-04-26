import { useState, useCallback } from 'react';
import { growerPortalAPI, type RequiredCertification } from '../../../lib/api';
import { offlineStorage, PendingCertificatePhoto } from '../../../lib/offline-storage';

export type CertStatus = 'not_done' | 'pending' | 'done';

export type RequiredCert = RequiredCertification;

/** Used when the API is unreachable or not deployed yet. */
const FALLBACK_REQUIRED: RequiredCert[] = [
  { id: 'cert_1', title: 'Training – good agricultural practice', description: 'Completed training' },
  { id: 'cert_2', title: 'Production certificate', description: 'Proof of production method' },
  { id: 'cert_3', title: 'GlobalG.A.P. (if applicable)', description: 'Optional' },
];

export function useCertificationsData() {
  const [requiredCerts, setRequiredCerts] = useState<RequiredCert[]>(FALLBACK_REQUIRED);
  const [pendingPhotos, setPendingPhotos] = useState<PendingCertificatePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await offlineStorage.getPendingCertificatePhotos();
      setPendingPhotos(list);
      try {
        const fromApi = await growerPortalAPI.getRequiredCertifications();
        setRequiredCerts(fromApi);
      } catch (e) {
        console.warn('Required certifications (using fallback):', e);
        setRequiredCerts(FALLBACK_REQUIRED);
      }
    } catch (error) {
      console.error('Error loading certifications:', error);
      setPendingPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatusForCert = useCallback(
    (certId: string): CertStatus => {
      const pending = pendingPhotos.find((p) => p.certificateId === certId);
      if (pending) {
        if (pending.status === 'synced') return 'done';
        if (pending.status === 'pending' || pending.status === 'syncing') return 'pending';
      }
      return 'not_done';
    },
    [pendingPhotos]
  );

  const addPhoto = useCallback(
    async (entry: Omit<PendingCertificatePhoto, 'id' | 'timestamp' | 'status'>) => {
      await offlineStorage.savePendingCertificatePhoto(entry);
      await load();
    },
    [load]
  );

  return { requiredCerts, pendingPhotos, loading, load, getStatusForCert, addPhoto };
}
