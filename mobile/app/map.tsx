import { View, Text, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SuppliersMap from '../components/SuppliersMap';
import { RetailLocation } from '../lib/api';
import { theme } from '../lib/theme';
import { ArrowLeft, MapPin, ShoppingBag, Sprout, X } from 'lucide-react-native';

/**
 * Retail Locations Map Page
 * Interactive map showing all BioVera retail locations where products can be purchased
 */
export default function MapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedLocation, setSelectedLocation] = useState<RetailLocation | null>(null);
  const isSupplierPin = (loc: RetailLocation) => loc.kind === 'supplier';

  const handleMarkerPress = (location: RetailLocation) => {
    setSelectedLocation(location);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        backgroundColor: theme.colors.primary,
        paddingTop: insets.top + 12,
        paddingBottom: theme.spacing.lg,
        paddingLeft: 20 + insets.left,
        paddingRight: 20 + insets.right,
        borderBottomLeftRadius: theme.borderRadius.xl,
        borderBottomRightRadius: theme.borderRadius.xl,
        ...theme.shadows.lg,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.md,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <ArrowLeft size={20} color={theme.colors.text.inverse} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 22,
              fontWeight: '600',
              color: theme.colors.text.inverse,
              letterSpacing: -0.3,
              marginBottom: 2,
            }}>
              {t('map.title')}
            </Text>
            <Text style={{
              fontSize: 13,
              fontWeight: '400',
              color: 'rgba(255, 255, 255, 0.85)',
              letterSpacing: 0.3,
            }}>
              {t('map.subtitle')}
            </Text>
          </View>
        </View>
      </View>

      {/* Map */}
      <View style={{ 
        flex: 1, 
        marginTop: -theme.borderRadius.xl,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        backgroundColor: theme.colors.background,
      }}>
        <SuppliersMap onMarkerPress={handleMarkerPress} />
      </View>

      {/* Location sheet — same visual language as map pins (white + border) */}
      {selectedLocation && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: '52%',
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderTopWidth: 1,
            borderColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 16,
          }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: '#D1D5DB',
              borderRadius: 2,
              alignSelf: 'center',
              marginTop: 10,
              marginBottom: 8,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: theme.spacing.lg,
              marginBottom: 4,
            }}
          >
            <View
              style={{
                backgroundColor: isSupplierPin(selectedLocation) ? '#FFF7ED' : 'rgba(45, 90, 39, 0.08)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: theme.borderRadius.full,
                borderWidth: 1,
                borderColor: isSupplierPin(selectedLocation) ? 'rgba(234, 88, 12, 0.35)' : 'rgba(45, 90, 39, 0.2)',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isSupplierPin(selectedLocation) ? '#9A3412' : theme.colors.primary,
                  letterSpacing: 0.2,
                }}
              >
                {isSupplierPin(selectedLocation)
                  ? t('map.badgeSupplier', 'Partner store')
                  : t('map.badgeRetail', 'Retail / pickup')}
              </Text>
            </View>
            <Pressable
              onPress={() => setSelectedLocation(null)}
              hitSlop={12}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <X size={18} color={theme.colors.text.secondary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: 400 }}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: isSupplierPin(selectedLocation) ? '#EA580C' : theme.colors.primary,
                  marginRight: 14,
                }}
              >
                {isSupplierPin(selectedLocation) ? (
                  <Sprout size={22} color="#B45309" strokeWidth={2} />
                ) : (
                  <ShoppingBag size={22} color={theme.colors.primary} strokeWidth={2} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: 19,
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    letterSpacing: -0.35,
                    lineHeight: 24,
                  }}
                  numberOfLines={3}
                >
                  {selectedLocation.name}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                    gap: 6,
                  }}
                >
                  <MapPin size={15} color={theme.colors.text.secondary} strokeWidth={2} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '400',
                      color: theme.colors.text.secondary,
                      flex: 1,
                    }}
                    numberOfLines={2}
                  >
                    {selectedLocation.city}
                    {selectedLocation.country ? `, ${selectedLocation.country}` : ''}
                  </Text>
                </View>
                {selectedLocation.address ? (
                  <View
                    style={{
                      marginTop: 12,
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.borderRadius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '400',
                        color: theme.colors.text.secondary,
                        lineHeight: 20,
                      }}
                    >
                      {selectedLocation.address}
                    </Text>
                  </View>
                ) : null}
                {isSupplierPin(selectedLocation) && selectedLocation.description ? (
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '400',
                      color: theme.colors.text.tertiary,
                      lineHeight: 18,
                      marginTop: 10,
                    }}
                    numberOfLines={4}
                  >
                    {selectedLocation.description}
                  </Text>
                ) : null}
                {isSupplierPin(selectedLocation) && (selectedLocation.supplierUserId || selectedLocation.id) ? (
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/b2b-supplier/${selectedLocation.supplierUserId || selectedLocation.id}` as any
                      )
                    }
                    style={{
                      marginTop: 16,
                      backgroundColor: theme.colors.primary,
                      paddingVertical: 14,
                      borderRadius: theme.borderRadius.lg,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                      {t('map.contactCta', 'Contact & order')}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}
