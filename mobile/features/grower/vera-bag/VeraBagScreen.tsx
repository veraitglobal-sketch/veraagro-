import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import VeraBag from '../../../components/VeraBag';

interface Photo {
  id: string;
  uri: string;
  category: 'SEED_PLANTING' | 'TREATMENT' | 'HARVEST';
  timestamp: string;
  watermark?: string;
}

/**
 * Vera Bag – digitalna torba za vizuelne dokaze (growers).
 * App route: app/(producer)/vera-bag.tsx samo renderuje ovaj screen.
 */
export default function VeraBagScreen() {
  const router = useRouter();
  const { batchId, parcelId } = useLocalSearchParams<{ batchId?: string; parcelId?: string }>();
  const [photos, setPhotos] = useState<Photo[]>([]);

  const handleSave = (updatedPhotos: Photo[]) => {
    setPhotos(updatedPhotos);
    console.log('Saving photos:', updatedPhotos);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          padding: 20,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={colors.text.primary} strokeWidth={1} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '300',
            color: colors.text.primary,
            letterSpacing: 0.5,
          }}
        >
          Vera Digital Bag
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
