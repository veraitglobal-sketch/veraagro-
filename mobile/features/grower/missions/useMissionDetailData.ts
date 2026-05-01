import { useState, useEffect, useCallback } from 'react';
import type { TFunction } from 'i18next';
import { missionsAPI, Mission } from '../../../lib/api';
import {
  getMissionStatusColor,
  getMissionStatusLabelLocalized,
} from '../../../lib/mission-status';

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

export { getMissionStatusColor as getStatusColor };

export function getStatusLabel(status: string, t: TFunction): string {
  return getMissionStatusLabelLocalized(status, t);
}
