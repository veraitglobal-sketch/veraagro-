import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { loadGrowerParcelRows, type GrowerParcelRow } from '../../../lib/load-grower-parcels';

export function useHomeParcels() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<GrowerParcelRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const list = await loadGrowerParcelRows({ t });
      setRows(list);
    } catch {
      setRows([]);
    } finally {
      setLoaded(true);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { rows, loaded, reload };
}

export function isParcelApproved(row: GrowerParcelRow): boolean {
  return Boolean(row.approvedAt) || row.status === 'ACTIVE' || row.status === 'CERTIFIED';
}
