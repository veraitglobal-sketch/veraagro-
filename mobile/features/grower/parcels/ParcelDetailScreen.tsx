import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Wheat, Sprout, ChevronRight } from 'lucide-react-native';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { theme } from '../../../lib/theme';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerSheet, growerSheetCardStyle } from '../../../design-system/grower-sheet-styles';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { useParcelDetailData } from './useParcelDetailData';
import { normalizeHarvestParcelId } from '../harvest/useHarvestData';
import type { HaRow } from '../plantings/usePlantingsData';
import type { FieldEntry } from '../../../lib/api';

function activityLabel(t: (k: string) => string, entry: FieldEntry): string {
  const type = String(entry.type ?? '').toLowerCase();
  if (type.includes('harvest')) return t('producer.recentActivity.harvest');
  if (type.includes('spray')) return t('producer.recentActivity.spraying');
  if (type.includes('plant')) return t('producer.recentActivity.planting');
  return entry.type || t('producer.recentActivity.title');
}

export default function ParcelDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const dateLocale = useAppLocaleTag();
  const { parcelId: rawParcelId } = useLocalSearchParams<{ parcelId: string }>();
  const parcelId = typeof rawParcelId === 'string' ? rawParcelId : rawParcelId?.[0];

  const {
    parcel,
    parcelLoaded,
    approved,
    plantings,
    plantingsLoading,
    refreshing,
    recentEntries,
    entriesLoaded,
    reload,
  } = useParcelDetailData(parcelId);

  const [selectedPlantingId, setSelectedPlantingId] = useState<string | null>(null);

  useEffect(() => {
    if (plantings.length === 1) {
      setSelectedPlantingId(plantings[0].id);
    } else if (plantings.length === 0) {
      setSelectedPlantingId(null);
    } else if (selectedPlantingId && !plantings.some((pl) => pl.id === selectedPlantingId)) {
      setSelectedPlantingId(null);
    }
  }, [plantings, selectedPlantingId]);

  const selectedPlanting = useMemo(
    () => plantings.find((pl) => pl.id === selectedPlantingId) ?? null,
    [plantings, selectedPlantingId],
  );

  const needsPlantingChoice = plantings.length > 1 && !selectedPlantingId;

  const goAddWork = useCallback(() => {
    if (!parcelId || !selectedPlanting) return;
    router.push({
      pathname: '/(producer)/field-diary',
      params: { parcelId, plantingId: selectedPlanting.id },
    });
  }, [router, parcelId, selectedPlanting]);

  const goHarvest = useCallback(() => {
    if (!parcel || !selectedPlanting) return;
    const parcelIdEff = normalizeHarvestParcelId(selectedPlanting.parcelId, selectedPlanting.parcel ?? null) || parcelId;
    if (!parcelIdEff) return;
    router.push({
      pathname: '/(producer)/(tabs)/harvest',
      params: { harvestParcelId: parcelIdEff, harvestPlantingId: selectedPlanting.id },
    });
  }, [router, parcel, parcelId, selectedPlanting]);

  const goAddPlanting = useCallback(() => {
    if (!parcelId) return;
    router.push({
      pathname: '/(producer)/plantings',
      params: { openAdd: '1', parcelId },
    });
  }, [router, parcelId]);

  const goApprovalHelp = useCallback(() => {
    router.push('/(producer)/(tabs)/steps');
  }, [router]);

  if (!parcelLoaded) {
    return (
      <View style={[styles.centered, { paddingTop: p.topInset }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!parcel) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <BioVeraSubpageHeader title={t('producer.parcelDetail.title')} left="back" />
        <View style={styles.centered}>
          <Text style={styles.muted}>{t('producer.parcelDetail.notFound')}</Text>
        </View>
      </View>
    );
  }

  const cropTitle = parcel.cropType?.trim() || parcel.label;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <BioVeraSubpageHeader title={cropTitle} left="back" />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void reload()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={{
          paddingTop: theme.spacing.md,
          paddingHorizontal: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingBottom: Math.max(p.bottomInset, theme.spacing.xl),
        }}
      >
        <Text style={styles.metaLine}>
          {parcel.estateName}
          {parcel.calculatedArea ? ` · ${parcel.calculatedArea.toFixed(0)} m²` : ''}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: approved ? `${theme.colors.success}18` : `${theme.colors.warning}22` }]}>
          <Text style={{ color: approved ? theme.colors.success : theme.colors.warning, fontSize: 13, fontWeight: '600' }}>
            {approved ? t('producer.estates.parcelApproved') : t('producer.estates.parcelPendingApproval')}
          </Text>
        </View>

        {!approved ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{t('producer.parcelDetail.notApprovedTitle')}</Text>
            <Text style={styles.noticeBody}>{t('producer.parcelDetail.notApprovedBody')}</Text>
            <TouchableOpacity onPress={goApprovalHelp} style={styles.linkBtn}>
              <Text style={styles.linkBtnText}>{t('producer.parcelDetail.notApprovedCta')}</Text>
              <ChevronRight size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>{t('producer.parcelDetail.plantingsTitle')}</Text>
        {plantingsLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 12 }} />
        ) : plantings.length === 0 ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeBody}>{t('producer.parcelDetail.plantingsEmpty')}</Text>
            <TouchableOpacity onPress={goAddPlanting} style={[enterpriseUi.authSubmit, styles.actionBtn]}>
              <Text style={enterpriseUi.authSubmitText}>{t('producer.parcelDetail.plantingsEmptyCta')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {plantings.length > 1 ? (
              <Text style={styles.hint}>{t('producer.parcelDetail.selectPlantingHint')}</Text>
            ) : null}
            <View style={styles.listCard}>
              {plantings.map((pl: HaRow) => {
                const selected = pl.id === selectedPlantingId;
                return (
                  <TouchableOpacity
                    key={pl.id}
                    onPress={() => setSelectedPlantingId(pl.id)}
                    style={[styles.plantingRow, selected ? styles.plantingRowSelected : null]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Sprout size={16} color={selected ? theme.colors.primary : enterpriseColors.gray600} strokeWidth={1.5} />
                    <View style={styles.plantingMain}>
                      <Text style={styles.plantingTitle}>{pl.cropType || cropTitle}</Text>
                      <Text style={styles.plantingSub}>
                        {new Date(pl.estimatedDate).toLocaleDateString(dateLocale)}
                      </Text>
                    </View>
                    {selected ? (
                      <Text style={styles.selectedMark}>{t('producer.parcelDetail.selected')}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {approved && plantings.length > 0 ? (
          <View style={styles.actions}>
            {needsPlantingChoice ? (
              <Text style={styles.hint}>{t('producer.parcelDetail.noPlantingSelected')}</Text>
            ) : null}
            <TouchableOpacity
              onPress={goAddWork}
              disabled={!selectedPlanting}
              style={[styles.secondaryBtn, !selectedPlanting ? styles.btnDisabled : null]}
            >
              <ClipboardList size={18} color={theme.colors.primary} strokeWidth={1.5} />
              <Text style={styles.secondaryBtnText}>{t('producer.parcelDetail.addWorkCta')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goHarvest}
              disabled={!selectedPlanting}
              style={[enterpriseUi.authSubmit, styles.actionBtn, !selectedPlanting ? styles.btnDisabled : null]}
            >
              <Wheat size={18} color="#fff" strokeWidth={1.5} style={{ marginRight: 8 }} />
              <Text style={enterpriseUi.authSubmitText}>{t('producer.parcelDetail.recordHarvestCta')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{t('producer.parcelDetail.recentTitle')}</Text>
        {!entriesLoaded ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 8 }} />
        ) : recentEntries.length === 0 ? (
          <Text style={styles.muted}>{t('producer.recentActivity.noActivity')}</Text>
        ) : (
          <View style={styles.listCard}>
            {recentEntries.map((entry) => (
              <View key={entry.id} style={styles.activityRow}>
                <Text style={styles.activityType}>{activityLabel(t, entry)}</Text>
                <Text style={styles.activityWhen}>
                  {entry.occurredAt
                    ? new Date(entry.occurredAt).toLocaleDateString(dateLocale)
                    : entry.data?.date
                      ? new Date(entry.data.date).toLocaleDateString(dateLocale)
                      : '—'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  muted: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  metaLine: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: growerSheet.title,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: enterpriseColors.gray600,
    marginBottom: 8,
  },
  noticeCard: {
    ...growerSheetCardStyle({ marginBottom: 16 }),
    padding: 16,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: growerSheet.title,
    marginBottom: 6,
  },
  noticeBody: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    lineHeight: 20,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  linkBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: 4,
  },
  listCard: {
    ...growerSheetCardStyle({ marginBottom: 16 }),
    overflow: 'hidden',
  },
  plantingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: growerSheet.cardBorder,
  },
  plantingRowSelected: {
    backgroundColor: `${theme.colors.primary}0D`,
  },
  plantingMain: {
    flex: 1,
  },
  plantingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: growerSheet.title,
  },
  plantingSub: {
    fontSize: 13,
    color: enterpriseColors.gray600,
    marginTop: 2,
  },
  selectedMark: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  actions: {
    gap: 10,
    marginBottom: 8,
  },
  actionBtn: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}0A`,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: growerSheet.cardBorder,
  },
  activityType: {
    fontSize: 14,
    color: growerSheet.title,
  },
  activityWhen: {
    fontSize: 13,
    color: enterpriseColors.gray600,
  },
});
