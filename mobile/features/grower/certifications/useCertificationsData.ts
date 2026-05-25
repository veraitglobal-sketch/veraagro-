import { useState, useCallback, useEffect } from 'react';
import { growerPortalAPI, type RequiredCertification } from '../../../lib/api';
import { offlineStorage, PendingCertificatePhoto } from '../../../lib/offline-storage';
import { isDeviceOnline } from '../../../lib/network-utils';
import { syncService } from '../../../lib/sync-service';

export type CertStatus = 'not_done' | 'pending' | 'done';

export type RequiredCert = RequiredCertification;

export function useCertificationsData() {
  const [requiredCerts, setRequiredCerts] = useState<RequiredCert[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingCertificatePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (silent) setListRefreshing(true);
    else setLoading(true);
    try {
      if (await isDeviceOnline()) {
        await syncService.syncPendingCertificatePhotos();
      }
      const list = await offlineStorage.getPendingCertificatePhotos();
      setPendingPhotos(list);
      const fromApi = await growerPortalAPI.getRequiredCertifications();
      setRequiredCerts(Array.isArray(fromApi) ? fromApi : []);
      setLoadError(false);
    } catch (error) {
      console.error('Error loading certifications:', error);
      setRequiredCerts([]);
      setLoadError(true);
    } finally {
      if (silent) setListRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const getStatusForCert = useCallback(
    (certId: string): CertStatus => {
      const pending = pendingPhotos.find((p) => p.certificateId === certId);
      if (pending) {
        if (pending.status === 'synced') return 'done';
        if (pending.status === 'pending' || pending.status === 'syncing') return 'pending';
      }
      return 'not_done';
    },
    [pendingPhotos],
  );

  const addPhoto = useCallback(
    async (entry: Omit<PendingCertificatePhoto, 'id' | 'timestamp' | 'status'>) => {
      await offlineStorage.savePendingCertificatePhoto(entry);
      if (await isDeviceOnline()) {
        await syncService.syncPendingCertificatePhotos();
      }
      await load({ silent: true });
    },
    [load],
  );

  return {
    requiredCerts,
    pendingPhotos,
    loading,
    listRefreshing,
    loadError,
    load,
    getStatusForCert,
    addPhoto,
  };
}
