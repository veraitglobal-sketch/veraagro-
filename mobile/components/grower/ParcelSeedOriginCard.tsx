import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sprout } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { growerSeedOriginAPI, type GrowerParcelSeedOrigin } from '../../lib/api/grower';
import { useAppLocaleTag } from '../../lib/date-locale';

export function ParcelSeedOriginCard({ parcelId }: { parcelId: string }) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  const [data, setData] = useState<GrowerParcelSeedOrigin | null>(null);

  useEffect(() => {
    let cancelled = false;
    void growerSeedOriginAPI.getParcel(parcelId).then((res) => {
      if (!cancelled) setData(res);
    }).catch(() => {
      if (!cancelled) setData(null);
    });
    return () => {
      cancelled = true;
    };
  }, [parcelId]);

  if (!data?.seedOrigin?.length) return null;

  return (
    <View
      style={{
        marginTop: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 0.5,
        borderColor: `${theme.colors.primary}35`,
        backgroundColor: `${theme.colors.primary}0A`,
        gap: theme.spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Sprout size={14} color={theme.colors.primary} strokeWidth={1.5} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.primary }}>
          {t('grower.seedOrigin.title')}
        </Text>
      </View>
      {data.seedOrigin.map((run) => (
        <View key={`${run.lotNumber}-${run.seedCropYear}`}>
          {run.recalled ? (
            <Text style={{ fontSize: 12, color: theme.colors.warning, marginBottom: 4 }}>
              {run.recallNotice ?? t('grower.seedOrigin.recalled')}
            </Text>
          ) : null}
          <Text style={{ fontSize: 13, color: theme.colors.text.primary }}>
            {run.product}
            {run.variety ? ` — ${run.variety}` : ''}
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 }}>
            {t('grower.seedOrigin.lotLine', { lot: run.lotNumber, year: run.seedCropYear })}
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.text.secondary }}>
            {[run.producer.name, run.producer.city, run.producer.country].filter(Boolean).join(', ')}
          </Text>
          {run.germinationPct != null ? (
            <Text style={{ fontSize: 12, color: theme.colors.text.secondary }}>
              {t('grower.seedOrigin.germination', { pct: run.germinationPct })}
              {run.purityPct != null ? ` · ${t('grower.seedOrigin.purity', { pct: run.purityPct })}` : ''}
            </Text>
          ) : null}
          <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 }}>
            {t('grower.seedOrigin.planted', {
              count: run.bagsPlanted,
              range:
                run.plantedFrom && run.plantedTo && run.plantedFrom !== run.plantedTo
                  ? `${new Date(run.plantedFrom).toLocaleDateString(dateLocale)} – ${new Date(run.plantedTo).toLocaleDateString(dateLocale)}`
                  : run.plantedFrom
                    ? new Date(run.plantedFrom).toLocaleDateString(dateLocale)
                    : '',
            })}
          </Text>
        </View>
      ))}
    </View>
  );
}
