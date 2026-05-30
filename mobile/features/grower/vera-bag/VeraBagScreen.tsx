import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import VeraBag from '../../../components/VeraBag';
import { a11yIconButton } from '../../../lib/date-locale';

interface Photo {
  id: string;
  uri: string;
  category: 'SEED_PLANTING' | 'TREATMENT' | 'HARVEST';
  timestamp: string;
  watermark?: string;
}

/**
 * Vera Bag – digitalna torba za vizuelne dokaze (growers).
 * App route: app/(producer)/vera-bag.tsx renders this screen.
 */
export default function VeraBagScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { batchId, parcelId } = useLocalSearchParams<{ batchId?: string; parcelId?: string }>();
  const [photos, setPhotos] = useState<Photo[]>([]);

  const handleSave = (updatedPhotos: Photo[]) => {
    setPhotos(updatedPhotos);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          padding: 20,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} {...a11yIconButton(t('common.back'))}>
          <ArrowLeft size={20} color={theme.colors.text.primary} strokeWidth={1} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
          }}
        >
          {t('producer.veraBag.title')}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          <VeraBag batchId={batchId} parcelId={parcelId} onSave={handleSave} />
        </View>
      </ScrollView>
    </View>
  );
}
