import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { useHarvestData, CROP_TYPES } from './useHarvestData';

export default function HarvestForm() {
  const {
    cropType,
    setCropType,
    estimatedQuantity,
    setEstimatedQuantity,
    unit,
    harvestDate,
    setHarvestDate,
    location,
    gpsWarning,
    loading,
    getCurrentLocation,
    handleSubmit,
  } = useHarvestData();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: 16 }}>
        {gpsWarning && (
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderWidth: 0.5,
              borderColor: '#F59E0B',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, color: '#92400E', flex: 1 }}>Upozorenje: Niste na svojoj parceli!</Text>
          </View>
        )}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            Tip useva <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CROP_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setCropType(type)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 0.5,
                  backgroundColor: cropType === type ? colors.accent : colors.background,
                  borderColor: cropType === type ? colors.accent : colors.border,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '300', color: cropType === type ? colors.background : colors.text.primary }}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            Procenjena količina <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={estimatedQuantity}
              onChangeText={setEstimatedQuantity}
              placeholder="0"
              keyboardType="numeric"
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '300',
                color: colors.text.primary,
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
              <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>{unit}</Text>
            </View>
          </View>
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            Datum berbe
          </Text>
          <TextInput
            value={harvestDate}
            onChangeText={setHarvestDate}
            placeholder="YYYY-MM-DD"
            style={{
              fontSize: 14,
              fontWeight: '300',
              color: colors.text.primary,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.background,
            }}
          />
        </View>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
            Lokacija <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={loading}
            style={{
              backgroundColor: colors.background,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MapPin size={20} color={colors.accent} strokeWidth={1} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                {location ? (
                  <>
                    <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>
                      GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '300', color: colors.success, marginTop: 4 }}>✓ Lokacija učitana</Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>Uzmi trenutnu lokaciju</Text>
                )}
              </View>
            </View>
            {loading && <ActivityIndicator size="small" color={colors.accent} />}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !cropType || !estimatedQuantity || !location}
          style={{
            backgroundColor: !cropType || !estimatedQuantity || !location ? colors.surface : colors.accent,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
            opacity: loading ? 0.5 : 1,
            borderWidth: 0.5,
            borderColor: colors.accent,
          }}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: '300',
                color: !cropType || !estimatedQuantity || !location ? colors.text.secondary : colors.background,
                letterSpacing: 0.5,
              }}
            >
              Prijavi berbu
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
