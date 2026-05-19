import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Camera, Check } from 'lucide-react-native';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { complianceUi, complianceStyles } from '../../../lib/compliance-ui';
import {
  COMPLIANCE_PHOTO_TYPES,
  type CompliancePhotoType,
  useMaterialCompliance,
} from './useMaterialCompliance';
import { BatchSelector } from '../quality-entry/BatchSelector';

/**
 * Web-parity flow: one label roll + three required photos (PUNNETS, LABELING, PALLETIZATION) per batch.
 */
export function MaterialComplianceForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const c = useMaterialCompliance();
  const [pullRefreshing, setPullRefreshing] = useState(false);

  return (
    <EnterpriseScreen
      refreshing={pullRefreshing}
      onRefresh={async () => {
        setPullRefreshing(true);
        try {
          await c.refreshAll();
        } finally {
          setPullRefreshing(false);
        }
      }}
      contentPaddingBottom={Math.max(p.bottomInset, 24) + 12}
      header={
        <GrowerStackHeader
          title={t('producer.compliance.title')}
          subtitle={t('producer.compliance.batchForm.intro')}
        />
      }
    >
      <View style={growerUi.scrollContent}>
        <Text style={complianceUi.heading}>{t('producer.compliance.batchForm.checklistHeading')}</Text>
        <Text style={complianceUi.body}>
          {t('producer.compliance.batchForm.intro')}{' '}
          <Text onPress={() => router.push('/(producer)/materials')} style={complianceUi.link}>
            {t('producer.compliance.batchForm.materialsLink')}
          </Text>
        </Text>

        <View style={complianceUi.panel}>
          <Text style={complianceUi.panelTitle}>{t('producer.compliance.batchForm.explainerTitle')}</Text>
          <Text style={complianceUi.bullet}>• {t('producer.compliance.batchForm.explainerBullet0')}</Text>
          <Text style={complianceUi.bullet}>• {t('producer.compliance.batchForm.explainerBullet1')}</Text>
          <Text style={complianceUi.bullet}>• {t('producer.compliance.batchForm.explainerBullet2')}</Text>
        </View>

        {c.batchesLoading ? (
          <ActivityIndicator color={enterpriseColors.primary} style={{ marginVertical: 24 }} />
        ) : c.totalBatchCount === 0 ? (
          <Text style={complianceUi.body}>
            {t('producer.compliance.batchForm.noBatches')}{' '}
            <Text onPress={() => router.push('/(producer)/batch-new')} style={complianceUi.link}>
              {t('producer.compliance.batchForm.createBatch')}
            </Text>
            {t('producer.compliance.batchForm.noBatchesSuffix')}
          </Text>
        ) : (
          <BatchSelector
            filteredBatches={c.filteredBatches}
            parcelFilterOptions={c.parcelFilterOptions}
            parcelFilterId={c.parcelFilterId}
            setParcelFilterId={c.setParcelFilterId}
            selectedBatchId={c.selectedBatchId}
            setSelectedBatchId={c.setSelectedBatchId}
            loading={c.batchesLoading}
          />
        )}

        {c.selectedBatchId && c.statusLoading ? (
          <Text style={complianceUi.body}>{t('producer.compliance.batchForm.loadingStatus')}</Text>
        ) : null}

        {c.selectedBatchId && c.statusError && !c.statusLoading ? (
          <Text style={complianceUi.warnText}>{t('producer.compliance.batchForm.statusLoadError')}</Text>
        ) : null}

        {c.selectedBatchId &&
          !c.statusLoading &&
          c.complianceStatus?.complete &&
          !c.showReplaceForm && (
            <View style={complianceUi.successPanel}>
              <Text style={[complianceUi.panelTitle, { color: enterpriseColors.primary }]}>
                {t('producer.compliance.batchForm.resolvedBadge')}
              </Text>
              <Text style={complianceUi.heading}>{t('producer.compliance.batchForm.complianceCompleteTitle')}</Text>
              <Text style={complianceUi.body}>
                {t('producer.compliance.batchForm.resolvedBody', { batchId: c.complianceStatus.publicBatchId })}
              </Text>
              {c.complianceStatus.uploadedPhotoTypes?.length > 0 ? (
                <Text style={[complianceUi.body, { marginBottom: 12 }]}>
                  {t('producer.compliance.batchForm.photoTypesOnFile')}:{' '}
                  {c.complianceStatus.uploadedPhotoTypes.join(', ')}
                </Text>
              ) : null}
              {c.complianceStatus.stickerRollId ? (
                <Text style={[complianceUi.body, { marginBottom: 12 }]}>
                  {t('producer.compliance.batchForm.stickerOnFile')}: {c.complianceStatus.stickerRollId}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={() => {
                  c.setShowReplaceForm(true);
                  c.setStickerRollId(c.complianceStatus?.stickerRollId || '');
                }}
                activeOpacity={0.88}
                style={[growerUi.filterChip, { alignSelf: 'flex-start' }]}
              >
                <Text style={growerUi.filterChipText}>{t('producer.compliance.batchForm.updatePhotosCta')}</Text>
              </TouchableOpacity>
            </View>
          )}

        {c.showForm ? (
          <View>
            <Text style={growerUi.formLabel}>{t('producer.compliance.batchForm.stickerRollLabel')}</Text>
            <Text style={[complianceUi.body, { marginBottom: 12 }]}>
              {t('producer.compliance.batchForm.labelRollLogicHint')}
            </Text>
            {c.pickableRolls.length > 12 ? (
              <>
                <TextInput
                  value={c.labelRollFilter}
                  onChangeText={c.setLabelRollFilter}
                  placeholder={t('producer.compliance.batchForm.labelRollSearchPlaceholder')}
                  placeholderTextColor={enterpriseColors.gray600}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[complianceUi.input, { marginBottom: 8, flex: undefined }]}
                />
                {c.stickerRollListMeta.mode === 'search' ? (
                  <Text style={[complianceUi.body, { fontSize: 14, marginBottom: 8 }]}>
                    {t('producer.compliance.batchForm.labelRollMatchCount', {
                      shown: c.stickerRollListForUi.length,
                      total: c.stickerRollListMeta.matchCount,
                    })}
                    {c.stickerRollListMeta.capped
                      ? ` ${t('producer.compliance.batchForm.labelRollNarrowSearch')}`
                      : ''}
                  </Text>
                ) : c.stickerRollListMeta.mode === 'recent' ? (
                  <Text style={[complianceUi.body, { fontSize: 14, marginBottom: 8 }]}>
                    {t('producer.compliance.batchForm.labelRollShowingRecent', {
                      total: c.stickerRollListMeta.matchCount,
                    })}
                  </Text>
                ) : null}
              </>
            ) : null}
            <ScrollView
              style={{ maxHeight: 220, marginBottom: 12 }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <View style={complianceStyles.chipWrap}>
                {c.stickerRollListForUi.map((r) => {
                  const sel = c.stickerRollId === r.serialNumber;
                  return (
                    <TouchableOpacity
                      key={r.serialNumber}
                      onPress={() => c.setStickerRollId(r.serialNumber)}
                      activeOpacity={0.88}
                      style={[complianceUi.chip, sel && complianceUi.chipOn]}
                    >
                      <Text style={[complianceUi.chipText, sel && complianceUi.chipTextOn]}>
                        {r.serialNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            {c.pickableRolls.length === 0 ? (
              <Text style={complianceUi.warnText}>{t('producer.compliance.batchForm.labelRollNoneAvailable')}</Text>
            ) : null}
            <View style={complianceStyles.inputRow}>
              <TextInput
                value={c.stickerRollId}
                onChangeText={c.setStickerRollId}
                placeholder={t('producer.compliance.batchForm.stickerInputPlaceholder')}
                placeholderTextColor={enterpriseColors.gray600}
                autoCapitalize="characters"
                style={[complianceUi.input, { flex: 1 }]}
              />
              <TouchableOpacity
                onPress={c.onVerifySticker}
                disabled={c.verifying}
                activeOpacity={0.88}
                style={[complianceUi.verifyBtn, c.verifying && { opacity: 0.6 }]}
              >
                {c.verifying ? (
                  <ActivityIndicator size="small" color={enterpriseColors.white} />
                ) : (
                  <Text style={complianceUi.verifyBtnText}>{t('producer.compliance.batchForm.verify')}</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={[complianceUi.body, { fontSize: 14, marginBottom: 20 }]}>
              {t('producer.compliance.batchForm.stickerHelp')}
            </Text>

            <Text style={complianceUi.heading}>{t('producer.compliance.batchForm.requiredPhotosHeading')}</Text>
            {COMPLIANCE_PHOTO_TYPES.map((type) => (
              <PhotoRow
                key={type}
                type={type}
                uri={c.photos[type]}
                onTake={() => c.takePhoto(type)}
                busy={c.picking === type}
              />
            ))}

            {c.showReplaceForm ? (
              <TouchableOpacity
                onPress={() => {
                  c.setShowReplaceForm(false);
                  c.setPhotos({});
                }}
                style={{ marginBottom: 12, minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={[complianceUi.link, { textDecorationLine: 'underline' }]}>
                  {t('producer.compliance.batchForm.cancelKeep')}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={c.onSave}
              disabled={c.saving}
              activeOpacity={0.88}
              style={[complianceUi.saveBtn, c.saving && { opacity: 0.5 }, { marginTop: 8 }]}
            >
              {c.saving ? (
                <ActivityIndicator color={enterpriseColors.white} />
              ) : (
                <Text style={complianceUi.saveBtnText}>{t('producer.compliance.batchForm.saveSubmit')}</Text>
              )}
            </TouchableOpacity>
            {c.showReplaceForm && c.selectedBatch ? (
              <Text style={[complianceUi.warnText, { marginTop: 12 }]}>
                {t('producer.compliance.batchForm.replaceWarning', { batchId: c.selectedBatch.batchId })}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </EnterpriseScreen>
  );
}

function PhotoRow({
  type,
  uri,
  onTake,
  busy,
}: {
  type: CompliancePhotoType;
  uri: string | undefined;
  onTake: () => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={growerUi.settingsRowTitle}>
        {t(`producer.compliance.batchForm.photoTypes.${type}.label`)} *
      </Text>
      <Text style={[growerUi.settingsRowDesc, { marginBottom: 10 }]}>
        {t(`producer.compliance.batchForm.photoTypes.${type}.hint`)}
      </Text>
      <TouchableOpacity
        onPress={onTake}
        disabled={busy}
        activeOpacity={0.88}
        style={complianceUi.photoBox}
        accessibilityRole="button"
      >
        {uri ? (
          <View style={{ width: '100%' }}>
            <Image source={{ uri }} style={{ width: '100%', height: 200, resizeMode: 'cover' }} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 10,
                gap: 8,
                backgroundColor: enterpriseColors.primaryTint,
              }}
            >
              <Check size={18} color={enterpriseColors.primary} />
              <Text style={{ fontSize: 16, color: enterpriseColors.primary, fontWeight: '600' }}>
                {t('producer.compliance.batchForm.photoAdded')}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ padding: 28, alignItems: 'center' }}>
            {busy ? (
              <ActivityIndicator color={enterpriseColors.primary} />
            ) : (
              <Camera size={44} color={enterpriseColors.gray600} strokeWidth={1.5} />
            )}
            <Text style={{ marginTop: 12, fontSize: 16, color: enterpriseColors.gray600 }}>
              {t('producer.compliance.batchForm.clickToTakePhoto')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
