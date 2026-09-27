import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { dsColors } from '../../../design-system/theme';
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
 * App route: app/(producer)/vera-bag.tsx renders this screen.
 */
export default function VeraBagScreen({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { batchId, parcelId } = useLocalSearchParams<{ batchId?: string; parcelId?: string }>();
  const [photos, setPhotos] = useState<Photo[]>([]);

  const handleSave = (updatedPhotos: Photo[]) => {
    setPhotos(updatedPhotos);
  };

  return (
    <View style={[styles.root, embedded && styles.embeddedRoot]}>
      {!embedded ? (
        <GrowerStackHeader title={t('producer.veraBag.title')} onBack={() => router.back()} />
      ) : null}

      <ScrollView style={styles.scroll}>
        <View style={styles.content}>
          <VeraBag batchId={batchId} parcelId={parcelId} onSave={handleSave} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: dsColors.canvas,
  },
  embeddedRoot: {
    minHeight: 0,
  },
  header: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: dsColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: dsColors.gray900,
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
});
