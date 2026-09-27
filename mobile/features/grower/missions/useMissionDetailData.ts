import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import { missionsAPI, Mission } from '../../../lib/api';
import {
  getMissionStatusColor,
  getMissionStatusLabelLocalized,
} from '../../../lib/mission-status';

export function useMissionDetailData(missionId: string | undefined) {
  const generation = useRef(0);
  const [mission, setMission] = useState<Mission | null>(null);
  const [journeyMap, setJourneyMap] = useState<any>(null);
  const [consumerFeedback, setConsumerFeedback] = useState<any>(null);
  const [financialStatus, setFinancialStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMissionData = useCallback(async () => {
    const current = ++generation.current;
    if (!missionId) { setMission(null); setLoading(false); return; }
    try {
      setLoading(true);
      const [missionData, mapData] = await Promise.all([
        missionsAPI.getOne(missionId),
        missionsAPI.getJourneyMap(missionId).catch(() => null),
      ]);
      if (current !== generation.current) return;
      setMission(missionData);
      setJourneyMap(mapData);
      if (missionData.batchId) {
        try {
          const [feedback, financial] = await Promise.all([
            missionsAPI.getConsumerFeedback(missionData.batchId).catch(() => null),
            missionsAPI.getFinancialStatus(missionData.batchId).catch(() => null),
          ]);
          if (current !== generation.current) return;
          setConsumerFeedback(feedback);
          setFinancialStatus(financial);
        } catch {
          // ignore
        }
      }
    } catch (error) {
      console.error('Error loading mission:', error);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [missionId]);

  useFocusEffect(useCallback(() => {
    setMission(null); setJourneyMap(null); setConsumerFeedback(null); setFinancialStatus(null);
    void loadMissionData();
    return () => { generation.current++; };
  }, [loadMissionData]));

  return {
    mission: mission?.id === missionId ? mission : null,
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
