import type { TFunction } from 'i18next';

type ChainStats = {
  batchTotal: number;
  lotsReady: number;
  activeMissions: number;
};

export function chainStatusLine(t: TFunction, stats: ChainStats): string {
  const { batchTotal, lotsReady, activeMissions } = stats;
  if (batchTotal === 0 && lotsReady === 0 && activeMissions === 0) {
    return t('producer.hubs.chain.leadShort');
  }
  return t('producer.hubs.chain.statusSummary', {
    lots: batchTotal,
    ready: lotsReady,
    missions: activeMissions,
  });
}
