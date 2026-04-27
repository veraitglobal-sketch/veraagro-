import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera, MapPin, Check, X } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useFieldLogData, ACTIVITY_TYPES, ActivityType } from './useFieldLogData';

const activityLabelKey: Record<ActivityType, string> = {
  PLANTING: 'planting',
  FERTILIZING: 'fertilizing',
  SPRAYING: 'spraying',
  HARVEST: 'harvest',
};

export default function EntryForm() {
  const { t } = useTranslation();
  const {
    router,
    activityType,
    setActivityType,
    materialID,
    setMaterialID,
    photoUri,
    location,
    gpsWarning,
    materialValid,
    loading,
    getCurrentLocation,
    takePhoto,
    handleSubmit,
  } = useFieldLogData();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.md }}>
        {gpsWarning && (
          <View
            style={{
              backgroundColor: theme.colors.errorLight,
              borderWidth: 0.5,
              borderColor: 'rgba(239, 68, 68, 0.3)',
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.sm,
              marginBottom: theme.spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <X size={20} color={theme.colors.error} strokeWidth={1} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.error,
                marginLeft: theme.spacing.sm,
                flex: 1,
                letterSpacing: 0.2,
              }}
            >
              Warning: You are not on your parcel!
            </Text>
          </View>
        )}

        <View style={{ marginBottom: theme.spacing.md }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
            }}
          >
            {t('producer.fieldLogForm.activityType')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {ACTIVITY_TYPES.map((type) => {
              const isSelected = activityType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setActivityType(type.value)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 0.5,
                    borderColor: isSelected ? theme.colors.primary : 'rgba(0, 0, 0, 0.05)',
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: isSelected ? theme.colors.background : theme.colors.text.primary,
                      letterSpacing: 0.3,
                    }}
                  >
                    {t(`producer.fieldLog.${activityLabelKey[type.value]}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ marginBottom: theme.spacing.md }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
            }}
          >
            {t('producer.fieldLogForm.materialBarcode')}
          </Text>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TextInput
              style={{
                flex: 1,
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: 0.2,
              }}
              placeholder={t('producer.fieldLogForm.materialPlaceholder')}
              placeholderTextColor={theme.colors.text.tertiary}
              value={materialID}
              onChangeText={setMaterialID}
            />
            <TouchableOpacity
              onPress={() => router.push('/(producer)/scanner')}
              activeOpacity={0.7}
              style={{
                marginLeft: theme.spacing.xs,
                padding: theme.spacing.xs,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${theme.colors.primary}15`,
              }}
            >
              <Camera size={18} color={theme.colors.primary} strokeWidth={1.5} />
            </TouchableOpacity>
            {materialValid !== null &&
              (materialValid ? (
                <Check
                  size={20}
                  color={theme.colors.success}
                  strokeWidth={1}
                  style={{ marginLeft: theme.spacing.xs }}
                />
              ) : (
                <X
                  size={20}
                  color={theme.colors.error}
                  strokeWidth={1}
                  style={{ marginLeft: theme.spacing.xs }}
                />
              ))}
          </View>
        </View>

        <View style={{ marginBottom: theme.spacing.md }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
            }}
          >
            {t('producer.fieldLogForm.photo')} <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            onPress={takePhoto}
            activeOpacity={0.7}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              padding: theme.spacing.lg,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 150,
            }}
          >
            {photoUri ? (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.success,
                  letterSpacing: 0.3,
                }}
              >
                ✓ {t('producer.fieldLogForm.photoLoaded')}
              </Text>
            ) : (
              <>
                <Camera size={32} color={theme.colors.text.tertiary} strokeWidth={1} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    marginTop: theme.spacing.xs,
                    letterSpacing: 0.2,
                  }}
                >
                  {t('producer.fieldLogForm.addPhoto')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
            }}
          >
            {t('producer.fieldLogForm.location')} <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={loading}
            activeOpacity={0.7}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              padding: theme.spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MapPin size={20} color={theme.colors.primary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                {location ? (
                  <>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        letterSpacing: 0.2,
                      }}
                    >
                      GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '300',
                        color: theme.colors.success,
                        marginTop: 2,
                        letterSpacing: 0.2,
                      }}
                    >
                      ✓ {t('producer.fieldLogForm.locationOk')}
                    </Text>
                  </>
                ) : (
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: theme.colors.text.secondary,
                      letterSpacing: 0.2,
                    }}
                  >
                    {t('producer.fieldLogForm.getLocation')}
                  </Text>
                )}
              </View>
            </View>
            {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !activityType || !photoUri || !location}
          activeOpacity={0.7}
          style={{
            backgroundColor:
              !activityType || !photoUri || !location ? theme.colors.surface : theme.colors.primary,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            borderWidth: 0.5,
            borderColor:
              !activityType || !photoUri || !location
                ? 'rgba(0, 0, 0, 0.05)'
                : theme.colors.primary,
            alignItems: 'center',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text
              style={{
                fontSize: 12,
                fontWeight: '300',
                color:
                  !activityType || !photoUri || !location
                    ? theme.colors.text.secondary
                    : theme.colors.background,
                letterSpacing: 0.5,
              }}
            >
              {t('producer.fieldLogForm.saveEntry')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
