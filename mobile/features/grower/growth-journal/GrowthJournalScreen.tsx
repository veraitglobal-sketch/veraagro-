import { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGrowthJournalData } from './useGrowthJournalData';
import { GrowthJournalFilters } from './GrowthJournalFilters';
import { GrowthJournalList } from './GrowthJournalList';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { AddGrowthLogModal } from './AddGrowthLogModal';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';

/** Fixed footer: top pad + button + safe area + extra scroll slack so last card is fully visible. */
function scrollBottomInset(bottomInset: number): number {
  const footerBtn = 52;
  const footerChrome = 10 + 1;
  const slack = 20;
  return footerBtn + footerChrome + Math.max(bottomInset, 12) + slack;
}

export default function GrowthJournalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ parcelId?: string; plantingId?: string }>();
  const p = useBioVeraScreenPadding();
  const contentPadBottom = useMemo(() => scrollBottomInset(p.bottomInset), [p.bottomInset]);

  const {
    logs,
    loading,
    logsLoading,
    refreshing,
    uploading,
    addModalVisible,
    setAddModalVisible,
    parcels,
    selectedParcelId,
    selectParcel,
    parcelPlans,
    activePlanId,
    setActivePlanId,
    canAddLog,
    requestOpenAddModal,
    onRefresh,
    submitAddLog,
    selectedParcel,
  } = useGrowthJournalData();

  useEffect(() => {
    if (loading || !routeParams.parcelId) return;
    const pid = String(routeParams.parcelId);
    if (!parcels.some((par) => par.id === pid)) return;
    if (selectedParcelId !== pid) selectParcel(pid);
    if (routeParams.plantingId) {
      const planId = String(routeParams.plantingId);
      if (parcelPlans.some((pl) => pl.id === planId)) setActivePlanId(planId);
    }
  }, [
    loading,
    routeParams.parcelId,
    routeParams.plantingId,
    parcels,
    parcelPlans,
    selectedParcelId,
    selectParcel,
    setActivePlanId,
  ]);

  const parcelLabel =
    selectedParcel?.label ||
    selectedParcel?.cropType ||
    t('producer.growthJournal.allParcelsContext');

  const planLabel =
    parcelPlans.find((pl) => pl.id === activePlanId)?.label || t('producer.growthJournal.planNotSelected');

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(producer)/(tabs)/field');
  };

  const showIntroSubtitle = !selectedParcelId || parcelPlans.length === 0;
  const showHint =
    !loading &&
    logs.length === 0 &&
    (!canAddLog || !selectedParcelId || parcelPlans.length === 0);

  const hintText = !selectedParcelId
    ? t('producer.growthJournal.hintPickParcel')
    : parcelPlans.length === 0
      ? t('producer.growthJournal.noPlantingOnParcel')
      : t('producer.growthJournal.stepsReminder');

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader
        title={t('producer.growthJournal.title')}
        subtitle={showIntroSubtitle ? t('producer.growthJournal.screenIntro') : undefined}
        onBack={goBack}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          growerUi.scrollContent,
          {
            paddingBottom: contentPadBottom,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={enterpriseColors.primary}
          />
        }
      >
        {showHint ? (
          <View style={styles.hintWrap}>
            <Text style={styles.hintText}>{hintText}</Text>
            {selectedParcelId && parcelPlans.length === 0 ? (
              <TouchableOpacity
                onPress={() => router.push('/(producer)/plantings')}
                style={styles.hintLink}
                accessibilityRole="button"
              >
                <Text style={styles.hintLinkText}>{t('producer.growthJournal.openPlantings')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <GrowthJournalFilters
          parcels={parcels}
          selectedParcelId={selectedParcelId}
          onParcelSelect={selectParcel}
          plantings={parcelPlans}
          activePlanId={activePlanId}
          onPlanSelect={setActivePlanId}
          loading={loading}
        />

        <GrowthJournalList logs={logs} loading={loading} logsLoading={logsLoading} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(p.bottomInset, 12),
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
          },
        ]}
      >
        <TouchableOpacity
          onPress={requestOpenAddModal}
          disabled={uploading}
          activeOpacity={0.88}
          style={[enterpriseUi.authBtnPrimary, styles.addBtn, uploading && styles.addBtnBusy]}
          accessibilityRole="button"
          accessibilityLabel={t('producer.growthJournal.continueCta')}
        >
          <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.growthJournal.continueCta')}</Text>
          <ChevronRight size={22} color={enterpriseColors.white} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <AddGrowthLogModal
        visible={addModalVisible}
        onClose={() => !uploading && setAddModalVisible(false)}
        onSubmit={submitAddLog}
        busy={uploading}
        parcelLabel={parcelLabel}
        planLabel={planLabel}
        strictPlantingProgress={
          parcelPlans.find((pl) => pl.id === activePlanId)?.announcementType === 'PLANTING'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  hintWrap: {
    marginBottom: 10,
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
    color: enterpriseColors.gray600,
  },
  hintLink: {
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  hintLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.primary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    backgroundColor: enterpriseColors.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
  },
  addBtnBusy: {
    opacity: 0.55,
  },
});
