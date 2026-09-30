import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react-native';
import SuppliersMap from '../components/SuppliersMap';
import { RetailLocation } from '../lib/api';
import { theme } from '../lib/theme';
import { markStepComplete } from '../lib/grower-journey';
import { useState } from 'react';
import { Switch } from 'react-native';

/**
 * Vera Supplier Map – Step 1 of Grower Journey
 * Shows authorized distributors/retail locations on map
 */
export default function SupplierMapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<RetailLocation | null>(null);
  const [bioVeraOnly, setBioVeraOnly] = useState(false);

  useEffect(() => {
    markStepComplete(3);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          backgroundColor: theme.colors.primary,
          paddingTop: 56,
          paddingBottom: theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
          borderBottomLeftRadius: theme.borderRadius.xl,
          borderBottomRightRadius: theme.borderRadius.xl,
          ...theme.shadows.lg,
        }}
      >
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
            }}
          >
            <ArrowLeft size={20} color="#fff" strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: '#fff',
                marginBottom: 2,
              }}
            >
              {t('map.title')}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 18,
              }}
              numberOfLines={3}
            >
              {t('map.subtitle')}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          marginTop: -theme.borderRadius.xl,
          borderTopLeftRadius: theme.borderRadius.xl,
          borderTopRightRadius: theme.borderRadius.xl,
          overflow: 'hidden',
          backgroundColor: theme.colors.background,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            backgroundColor: theme.colors.background,
          }}
        >
          <Text style={{ fontSize: 14, color: theme.colors.text.primary, flex: 1 }}>
            {t('map.bioVeraSeedOnly', { defaultValue: 'Bio Vera seed in stock' })}
          </Text>
          <Switch
            value={bioVeraOnly}
            onValueChange={setBioVeraOnly}
            trackColor={{ false: '#d1d5db', true: '#2D5A27' }}
          />
        </View>
        <SuppliersMap onMarkerPress={setSelectedLocation} bioVeraOnly={bioVeraOnly} category={bioVeraOnly ? 'SEED' : undefined} />
      </View>

      {selectedLocation && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: theme.borderRadius.xl,
            borderTopRightRadius: theme.borderRadius.xl,
            ...theme.shadows.lg,
          }}
        >
          <TouchableOpacity
            onPress={() => setSelectedLocation(null)}
            style={{ alignSelf: 'flex-end', marginBottom: theme.spacing.sm }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: theme.colors.text.secondary,
              }}
            >
              {t('common.close')}
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 4,
            }}
          >
            {selectedLocation.name}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
            }}
          >
            {selectedLocation.city}, {selectedLocation.country}
          </Text>
          {selectedLocation.address && (
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.text.tertiary,
                marginTop: 4,
              }}
            >
              {selectedLocation.address}
            </Text>
          )}
          {selectedLocation.bioVeraSeedInStock && selectedLocation.bioVeraSeedInStock.length > 0 && (
            <View style={{ marginTop: theme.spacing.sm }}>
              {selectedLocation.bioVeraSeedInStock.map((s) => (
                <Text
                  key={s.approvedProductId}
                  style={{ fontSize: 13, color: theme.colors.primary, marginTop: 2 }}
                >
                  {t('map.bioVeraSeedStock', {
                    defaultValue: 'Bio Vera seed: {{count}} bags — {{name}}',
                    count: s.bags,
                    name: s.name,
                  })}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
