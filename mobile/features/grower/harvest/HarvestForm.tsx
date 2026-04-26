import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { useHarvestData, CROP_TYPES } from './useHarvestData';

export default function HarvestForm() {
  const { t } = useTranslation();
  const h = useHarvestData();

  const canSubmit = !h.parcelsLoading && h.parcelId && h.cropType && h.estimatedQuantity && !h.loading;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 16, lineHeight: 18 }}>
          {t('producer.harvest.planIntro')}
        </Text>

        {h.gpsWarning && (
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderWidth: 0.5,
              borderColor: '#F59E0B',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 13, color: '#92400E' }}>{t('producer.harvest.notOnParcelWarning')}</Text>
          </View>
        )}

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            {t('producer.harvest.selectParcel')} <Text style={{ color: colors.error }}>*</Text>
          </Text>
          {h.parcelsLoading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : h.approvedParcels.length === 0 ? (
            <Text style={{ fontSize: 14, color: colors.error }}>{t('producer.harvest.noApprovedParcels')}</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {h.approvedParcels.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => h.setParcelId(p.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 0.5,
                    backgroundColor: h.parcelId === p.id ? colors.accent : colors.background,
                    borderColor: h.parcelId === p.id ? colors.accent : colors.border,
                    maxWidth: '100%',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: h.parcelId === p.id ? colors.background : colors.text.primary,
                    }}
                    numberOfLines={2}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            {t('producer.harvest.cropType')} <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CROP_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => h.setCropType(type)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 0.5,
                  backgroundColor: h.cropType === type ? colors.accent : colors.background,
                  borderColor: h.cropType === type ? colors.accent : colors.border,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, color: h.cropType === type ? colors.background : colors.text.primary }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            {t('producer.harvest.estimatedQuantity')} <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={h.estimatedQuantity}
              onChangeText={h.setEstimatedQuantity}
              placeholder="0"
              keyboardType="numeric"
              style={{
                flex: 1,
                fontSize: 14,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderWidth: 0.5,
                borderColor: colors.border,
                borderRadius: 8,
                backgroundColor: colors.background,
              }}
            />
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 0.5,
                borderColor: colors.border,
                borderRadius: 8,
                backgroundColor: colors.background,
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 13, color: colors.text.primary }}>{h.unit}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            {t('producer.harvest.harvestDate')} <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={h.harvestDate}
            onChangeText={h.setHarvestDate}
            placeholder="YYYY-MM-DD"
            style={{
              fontSize: 14,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.background,
            }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            {t('producer.harvest.plannedLoadDate')}
          </Text>
          <TextInput
            value={h.plannedLoadDate}
            onChangeText={h.setPlannedLoadDate}
            placeholder="YYYY-MM-DD"
            style={{
              fontSize: 14,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.background,
            }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            {t('producer.harvest.loadQuantity')}
          </Text>
          <TextInput
            value={h.loadQuantity}
            onChangeText={h.setLoadQuantity}
            placeholder={t('producer.harvest.loadQuantityHint')}
            keyboardType="numeric"
            style={{
              fontSize: 14,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.background,
            }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            {t('producer.harvest.channel')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(['INDUSTRIAL', 'RETAIL', 'MIXED'] as const).map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => h.setMarketChannel(h.marketChannel === c ? '' : c)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 0.5,
                  backgroundColor: h.marketChannel === c ? colors.accent : colors.background,
                  borderColor: h.marketChannel === c ? colors.accent : colors.border,
                }}
              >
                <Text style={{ fontSize: 12, color: h.marketChannel === c ? colors.background : colors.text.primary }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            {t('producer.harvest.qualityGrade')}
          </Text>
          <TextInput
            value={h.qualityGrade}
            onChangeText={h.setQualityGrade}
            placeholder={t('producer.harvest.qualityPlaceholder')}
            style={{
              fontSize: 14,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.background,
            }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            {t('producer.harvest.sortingSpec')}
          </Text>
          <TextInput
            value={h.sortingSpec}
            onChangeText={h.setSortingSpec}
            placeholder={t('producer.harvest.sortingPlaceholder')}
            multiline
            style={{
              fontSize: 14,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.background,
              minHeight: 80,
            }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            {t('producer.harvest.notesOptional')}
          </Text>
          <TextInput
            value={h.growerNotes}
            onChangeText={h.setGrowerNotes}
            placeholder={t('producer.harvest.notesPlaceholder')}
            multiline
            style={{
              fontSize: 14,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.background,
              minHeight: 64,
            }}
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 8 }}>{t('producer.harvest.gpsOptional')}</Text>
          <TouchableOpacity
            onPress={h.getCurrentLocation}
            disabled={h.loading}
            style={{
              backgroundColor: colors.background,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            activeOpacity={0.7}
          >
            <MapPin size={20} color={colors.accent} strokeWidth={1} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              {h.location ? (
                <Text style={{ fontSize: 13, color: colors.text.primary }}>
                  GPS: {h.location.lat.toFixed(6)}, {h.location.lng.toFixed(6)}
                </Text>
              ) : (
                <Text style={{ fontSize: 13, color: colors.text.secondary }}>{t('producer.harvest.getCurrentLocation')}</Text>
              )}
            </View>
            {h.loading && <ActivityIndicator size="small" color={colors.accent} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={h.handleSubmit}
          disabled={!canSubmit}
          style={{
            backgroundColor: !canSubmit ? colors.surface : colors.accent,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
            opacity: h.loading ? 0.5 : 1,
            borderWidth: 0.5,
            borderColor: colors.accent,
          }}
          activeOpacity={0.7}
        >
          {h.loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: canSubmit ? colors.background : colors.text.secondary,
                letterSpacing: 0.3,
              }}
            >
              {t('producer.harvest.sendPlan')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
