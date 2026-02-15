import { useState, useEffect, useCallback } from 'react';
import { missionsAPI, Mission } from '../../../lib/api';
import { colors } from '../../../lib/colors';

export function useMissionDetailData(missionId: string | undefined) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [journeyMap, setJourneyMap] = useState<any>(null);
  const [consumerFeedback, setConsumerFeedback] = useState<any>(null);
  const [financialStatus, setFinancialStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMissionData = useCallback(async () => {
    if (!missionId) return;
    try {
      setLoading(true);
      const [missionData, mapData] = await Promise.all([
        missionsAPI.getOne(missionId),
        missionsAPI.getJourneyMap(missionId).catch(() => null),
      ]);
      setMission(missionData);
      setJourneyMap(mapData);
      if (missionData.batchId) {
        try {
          const [feedback, financial] = await Promise.all([
            missionsAPI.getConsumerFeedback(missionData.batchId).catch(() => null),
            missionsAPI.getFinancialStatus(missionData.batchId).catch(() => null),
          ]);
          setConsumerFeedback(feedback);
          setFinancialStatus(financial);
        } catch {
          // ignore
        }
      }
    } catch (error) {
      console.error('Error loading mission:', error);
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    if (missionId) loadMissionData();
  }, [missionId, loadMissionData]);

  return {
    mission,
    journeyMap,
    consumerFeedback,
    financialStatus,
    loading,
    onRefresh: loadMissionData,
  };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return colors.warning;
    case 'ASSIGNED':
      return colors.accent;
    case 'IN_TRANSIT':
      return colors.primary;
    case 'DELIVERED':
      return colors.success || colors.primary;
    default:
      return colors.text.secondary;
  }
}

const MISSION_STATUS_KEYS: Record<string, string> = {
  PENDING: 'statusPending',
  ASSIGNED: 'statusAssigned',
  IN_TRANSIT: 'statusInTransit',
  DELIVERED: 'statusDelivered',
};

export function getStatusLabel(status: string, t: (key: string) => string): string {
  const key = MISSION_STATUS_KEYS[status];
  return key ? t(`producer.orders.${key}`) : status;
}
