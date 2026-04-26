import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import SuppliersMap from '../components/SuppliersMap';
import { RetailLocation } from '../lib/api';
import { theme } from '../lib/theme';
import Card from '../components/ui/Card';
import { ArrowLeft, ShoppingBag, Info } from 'lucide-react-native';

/**
 * Retail Locations Map Page
 * Interactive map showing all BioVera retail locations where products can be purchased
 */
export default function MapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<RetailLocation | null>(null);

  const handleMarkerPress = (location: RetailLocation) => {
    setSelectedLocation(location);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        backgroundColor: theme.colors.primary,
        paddingTop: 60,
        paddingBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
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
              fontWeight: '300',
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

      {/* Selected Retail Location Info */}
      {selectedLocation && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingTop: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: theme.borderRadius['2xl'],
          borderTopRightRadius: theme.borderRadius['2xl'],
          ...theme.shadows.xl,
        }}>
          {/* Drag Handle */}
          <View style={{
            width: 40,
            height: 4,
            backgroundColor: theme.colors.border,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: theme.spacing.md,
          }} />
          
          <TouchableOpacity
            onPress={() => setSelectedLocation(null)}
            style={{ 
              alignSelf: 'flex-end', 
              marginBottom: theme.spacing.sm,
              padding: theme.spacing.xs,
            }}
          >
            <Text style={{
              fontSize: 11,
              fontWeight: '500',
              color: theme.colors.text.secondary,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}>
              Close
            </Text>
          </TouchableOpacity>
          
          <Card variant="elevated" padding="lg" style={{ borderWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: theme.borderRadius.lg,
                backgroundColor: `${theme.colors.primary}10`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.md,
                borderWidth: 1,
                borderColor: `${theme.colors.primary}20`,
              }}>
                <ShoppingBag size={26} color={theme.colors.primary} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                  letterSpacing: -0.2,
                }}>
                  {selectedLocation.name}
                </Text>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  marginBottom: theme.spacing.xs,
                  paddingVertical: 2,
                }}>
                  <Info size={13} color={theme.colors.text.secondary} strokeWidth={1} />
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '400',
                    color: theme.colors.text.secondary,
                    marginLeft: 6,
                    letterSpacing: 0.2,
                  }}>
                    {selectedLocation.city}, {selectedLocation.country}
                  </Text>
                </View>
                {selectedLocation.address && (
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: theme.colors.text.tertiary,
                    lineHeight: 18,
                    letterSpacing: 0.3,
                    marginTop: 2,
                  }}>
                    {selectedLocation.address}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}
