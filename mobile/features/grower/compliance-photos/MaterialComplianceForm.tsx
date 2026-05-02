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
import { useRouter } from 'expo-router';
import { Camera, Check } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import {
  COMPLIANCE_PHOTO_TYPES,
  type CompliancePhotoType,
  useMaterialCompliance,
} from './useMaterialCompliance';

/**
 * Web-parity flow: one label roll + three required photos (PUNNETS, LABELING, PALLETIZATION) per batch.
 */
export function MaterialComplianceForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const c = useMaterialCompliance();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <BioVeraSubpageHeader left="back" title={t('producer.compliance.title')} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: theme.spacing.md,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingBottom: Math.max(p.bottomInset, theme.spacing['2xl']),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: '600',
            color: colors.text.primary,
            marginBottom: theme.spacing.sm,
          }}
        >
          {t('producer.compliance.batchForm.checklistHeading')}
        </Text>
        <Text style={{ fontSize: 16, color: colors.text.secondary, lineHeight: 20, marginBottom: theme.spacing.md }}>
          {t('producer.compliance.batchForm.intro')}{' '}
          <Text
            onPress={() => router.push('/(producer)/materials')}
            style={{ color: colors.primary, fontWeight: '600' }}
          >
            {t('producer.compliance.batchForm.materialsLink')}
          </Text>
        </Text>

        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            borderWidth: 0.5,
            borderColor: colors.border,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 6 }}>
            {t('producer.compliance.batchForm.explainerTitle')}
          </Text>
          <Text style={{ fontSize: 15, color: colors.text.secondary, lineHeight: 18, marginBottom: 4 }}>
            • {t('producer.compliance.batchForm.explainerBullet0')}
          </Text>
          <Text style={{ fontSize: 15, color: colors.text.secondary, lineHeight: 18, marginBottom: 4 }}>
            • {t('producer.compliance.batchForm.explainerBullet1')}
          </Text>
          <Text style={{ fontSize: 15, color: colors.text.secondary, lineHeight: 18, marginBottom: 4 }}>
            • {t('producer.compliance.batchForm.explainerBullet2')}
          </Text>
        </View>

        {c.batchesLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : c.batches.length === 0 ? (
          <Text style={{ fontSize: 14, color: colors.text.secondary, lineHeight: 20 }}>
            {t('producer.compliance.batchForm.noBatches')}{' '}
            <Text
              onPress={() => router.push('/(producer)/batches')}
              style={{ color: colors.primary, fontWeight: '600' }}
            >
              {t('producer.compliance.batchForm.createBatch')}
            </Text>
            {t('producer.compliance.batchForm.noBatchesSuffix')}
          </Text>
        ) : (
          <>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.tertiary, marginBottom: 8 }}>
              {t('producer.compliance.batchForm.selectLot')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.lg }}>
              {c.batches.map((b) => {
                const sel = c.selectedBatchId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => c.setSelectedBatchId(b.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: theme.borderRadius.sm,
                      borderWidth: 1,
                      borderColor: sel ? colors.primary : colors.border,
                      backgroundColor: sel ? `${colors.primary}12` : 'transparent',
                    }}
                  >
                    <Text
                      numberOfLines={2}
                      style={{ fontSize: 15, color: sel ? colors.primary : colors.text.primary, maxWidth: 200 }}
                    >
                      {b.batchId} — {b.productName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {c.selectedBatchId && c.statusLoading ? (
          <Text style={{ fontSize: 14, color: colors.text.secondary }}>{t('producer.compliance.batchForm.loadingStatus')}</Text>
        ) : null}

        {c.selectedBatchId && c.statusError && !c.statusLoading ? (
          <Text style={{ fontSize: 14, color: theme.colors.warning, marginBottom: 12 }}>
            {t('producer.compliance.batchForm.statusLoadError')}
          </Text>
        ) : null}

        {c.selectedBatchId &&
          !c.statusLoading &&
          c.complianceStatus?.complete &&
          !c.showReplaceForm && (
            <View
              style={{
                backgroundColor: `${colors.primary}10`,
                borderRadius: theme.borderRadius.md,
                borderWidth: 1,
                borderColor: `${colors.primary}40`,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.lg,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary, marginBottom: 4 }}>
                {t('producer.compliance.batchForm.resolvedBadge')}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 4 }}>
                {t('producer.compliance.batchForm.complianceCompleteTitle')}
              </Text>
              <Text style={{ fontSize: 16, color: colors.text.secondary, lineHeight: 20, marginBottom: 8 }}>
                {t('producer.compliance.batchForm.resolvedBody', { batchId: c.complianceStatus.publicBatchId })}
              </Text>
              {c.complianceStatus.uploadedPhotoTypes?.length > 0 ? (
                <Text style={{ fontSize: 15, color: colors.text.tertiary, marginBottom: 12 }}>
                  {t('producer.compliance.batchForm.photoTypesOnFile')}:{' '}
                  {c.complianceStatus.uploadedPhotoTypes.join(', ')}
                </Text>
              ) : null}
              {c.complianceStatus.stickerRollId ? (
                <Text style={{ fontSize: 15, color: colors.text.secondary, marginBottom: 12 }}>
                  {t('producer.compliance.batchForm.stickerOnFile')}: {c.complianceStatus.stickerRollId}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={() => {
                  c.setShowReplaceForm(true);
                  c.setStickerRollId(c.complianceStatus?.stickerRollId || '');
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: theme.borderRadius.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ fontSize: 14, color: colors.text.primary }}>{t('producer.compliance.batchForm.updatePhotosCta')}</Text>
              </TouchableOpacity>
            </View>
          )}

        {c.showForm ? (
          <View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 8 }}>
              {t('producer.compliance.batchForm.stickerRollLabel')}
            </Text>
            <Text style={{ fontSize: 15, color: colors.text.secondary, lineHeight: 18, marginBottom: 8 }}>
              {t('producer.compliance.batchForm.labelRollLogicHint')}
            </Text>
            {c.pickableRolls.length > 12 ? (
              <>
                <TextInput
                  value={c.labelRollFilter}
                  onChangeText={c.setLabelRollFilter}
                  placeholder={t('producer.compliance.batchForm.labelRollSearchPlaceholder')}
                  placeholderTextColor={colors.text.tertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    borderWidth: 0.5,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    color: colors.text.primary,
                    marginBottom: 8,
                  }}
                />
                {c.stickerRollListMeta.mode === 'search' ? (
                  <Text style={{ fontSize: 14, color: colors.text.tertiary, marginBottom: 8 }}>
                    {t('producer.compliance.batchForm.labelRollMatchCount', {
                      shown: c.stickerRollListForUi.length,
                      total: c.stickerRollListMeta.matchCount,
                    })}
                    {c.stickerRollListMeta.capped
                      ? ` ${t('producer.compliance.batchForm.labelRollNarrowSearch')}`
                      : ''}
                  </Text>
                ) : c.stickerRollListMeta.mode === 'recent' ? (
                  <Text style={{ fontSize: 14, color: colors.text.tertiary, marginBottom: 8 }}>
                    {t('producer.compliance.batchForm.labelRollShowingRecent', {
                      total: c.stickerRollListMeta.matchCount,
                    })}
                  </Text>
                ) : null}
              </>
            ) : null}
            <ScrollView
              style={{ maxHeight: 220, marginBottom: 8 }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {c.stickerRollListForUi.map((r) => {
                  const sel = c.stickerRollId === r.serialNumber;
                  return (
                    <TouchableOpacity
                      key={r.serialNumber}
                      onPress={() => c.setStickerRollId(r.serialNumber)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: sel ? colors.primary : colors.border,
                        backgroundColor: sel ? `${colors.primary}10` : colors.background,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: sel ? colors.primary : colors.text.secondary }}>
                        {r.serialNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            {c.pickableRolls.length === 0 ? (
              <Text style={{ fontSize: 15, color: theme.colors.warning, marginBottom: 8 }}>
                {t('producer.compliance.batchForm.labelRollNoneAvailable')}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
              <TextInput
                value={c.stickerRollId}
                onChangeText={c.setStickerRollId}
                placeholder={t('producer.compliance.batchForm.stickerInputPlaceholder')}
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="characters"
                style={{
                  flex: 1,
                  borderWidth: 0.5,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  color: colors.text.primary,
                }}
              />
              <TouchableOpacity
                onPress={c.onVerifySticker}
                disabled={c.verifying}
                style={{
                  paddingHorizontal: 16,
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  opacity: c.verifying ? 0.6 : 1,
                }}
              >
                {c.verifying ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={{ color: colors.background, fontWeight: '600' }}>{t('producer.compliance.batchForm.verify')}</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, color: colors.text.tertiary, marginBottom: theme.spacing.lg }}>
              {t('producer.compliance.batchForm.stickerHelp')}
            </Text>

            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 12 }}>
              {t('producer.compliance.batchForm.requiredPhotosHeading')}
            </Text>
            {COMPLIANCE_PHOTO_TYPES.map((type) => (
              <PhotoRow
                key={type}
                type={type}
                uri={c.photos[type]}
                onTake={() => c.takePhoto(type)}
                busy={c.picking === type}
              />
            ))}

            {c.showReplaceForm && (
              <TouchableOpacity
                onPress={() => {
                  c.setShowReplaceForm(false);
                  c.setPhotos({});
                }}
                style={{ marginBottom: 12 }}
              >
                <Text style={{ fontSize: 16, color: colors.text.tertiary, textDecorationLine: 'underline' }}>
                  {t('producer.compliance.batchForm.cancelKeep')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={c.onSave}
              disabled={c.saving}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: theme.borderRadius.md,
                alignItems: 'center',
                opacity: c.saving ? 0.5 : 1,
                marginTop: 8,
              }}
            >
              {c.saving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.background }}>
                  {t('producer.compliance.batchForm.saveSubmit')}
                </Text>
              )}
            </TouchableOpacity>
            {c.showReplaceForm && c.selectedBatch ? (
              <Text style={{ fontSize: 14, color: theme.colors.warning, marginTop: 8 }}>
                {t('producer.compliance.batchForm.replaceWarning', { batchId: c.selectedBatch.batchId })}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
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
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text.primary, marginBottom: 2 }}>
        {t(`producer.compliance.batchForm.photoTypes.${type}.label`)} *
      </Text>
      <Text style={{ fontSize: 15, color: colors.text.tertiary, marginBottom: 8, lineHeight: 18 }}>
        {t(`producer.compliance.batchForm.photoTypes.${type}.hint`)}
      </Text>
      <TouchableOpacity
        onPress={onTake}
        disabled={busy}
        style={{
          minHeight: 180,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: colors.border,
          borderRadius: theme.borderRadius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
          overflow: 'hidden',
        }}
      >
        {uri ? (
          <View style={{ width: '100%' }}>
            <Image source={{ uri }} style={{ width: '100%', height: 200, resizeMode: 'cover' }} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                gap: 6,
                backgroundColor: `${colors.primary}10`,
              }}
            >
              <Check size={16} color={colors.primary} />
              <Text style={{ fontSize: 15, color: colors.primary }}>{t('producer.compliance.batchForm.photoAdded')}</Text>
            </View>
          </View>
        ) : (
          <View style={{ padding: 24, alignItems: 'center' }}>
            {busy ? <ActivityIndicator color={colors.primary} /> : <Camera size={40} color={colors.text.tertiary} strokeWidth={1.2} />}
            <Text style={{ marginTop: 10, fontSize: 14, color: colors.text.secondary }}>
              {t('producer.compliance.batchForm.clickToTakePhoto')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
