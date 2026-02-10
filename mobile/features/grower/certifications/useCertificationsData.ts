import { useState, useCallback } from 'react';
import { offlineStorage, PendingCertificatePhoto } from '../../../lib/offline-storage';

export type CertStatus = 'not_done' | 'pending' | 'done';

export interface RequiredCert {
  id: string;
  title: string;
  description?: string;
}

/** Mock lista obaveznih sertifikata – u produkciji GET /grower-portal/required-certifications */
const MOCK_REQUIRED: RequiredCert[] = [
  { id: 'cert_1', title: 'Obuka – dobra poljoprivredna praksa', description: 'Završena obuka' },
  { id: 'cert_2', title: 'Sertifikat o proizvodnji', description: 'Dokaz o načinu proizvodnje' },
  { id: 'cert_3', title: 'GlobalG.A.P. (ako je primenjivo)', description: 'Opciono' },
];

export function useCertificationsData() {
  const [requiredCerts, setRequiredCerts] = useState<RequiredCert[]>(MOCK_REQUIRED);
  const [pendingPhotos, setPendingPhotos] = useState<PendingCertificatePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await offlineStorage.getPendingCertificatePhotos();
      setPendingPhotos(list);
      setRequiredCerts(MOCK_REQUIRED);
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
