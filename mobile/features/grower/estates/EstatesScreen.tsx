import { View, ScrollView, TouchableOpacity, RefreshControl, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { GrowerTabHeader } from '../../../components/grower/GrowerTabHeader';
import { useEstatesData } from './useEstatesData';
import { EstateList } from './EstateList';
import type { Estate } from '../../../lib/api';

export function EstatesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useBioVeraScreenPadding();
  const data = useEstatesData();

  return (
    <View style={growerUi.canvas}>
      <GrowerTabHeader
        title={t('producer.estates.myFields')}
        subtitle={
          data.estates.length === 0 && !data.loading
            ? t('producer.estates.listEmptySubtitle')
            : undefined
        }
        style={{ paddingTop: insets.top + 6 }}
        right={
          <TouchableOpacity
            onPress={() => router.push('/(producer)/estates/new')}
            activeOpacity={0.9}
            style={growerUi.btnIcon}
            accessibilityRole="button"
            accessibilityLabel={t('producer.estates.newEstate')}
          >
            <Plus size={22} color={enterpriseColors.white} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          ...growerUi.scrollContent,
          paddingTop: 8,
          paddingBottom: Math.max(p.bottomInset, 16) + 12,
          flexGrow: 0,
        }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={data.refreshing}
            onRefresh={data.onRefresh}
            tintColor={enterpriseColors.primary}
            colors={[enterpriseColors.primary]}
          />
        }
      >
        <EstateList
          estates={data.estates}
          loading={data.loading}
          getStatusColor={data.getStatusColor}
          getStatusLabel={data.getStatusLabel}
          onPressEstate={(estate: Estate) => router.push(`/(producer)/estates/${estate.id}`)}
          onPressNew={() => router.push('/(producer)/estates/new')}
          onPressEdit={(estate: Estate, e: { stopPropagation?: () => void }) => {
            e.stopPropagation?.();
            router.push(`/(producer)/estates/${estate.id}/edit`);
          }}
          onDelete={(estate: Estate, e: { stopPropagation?: () => void }) => {
            e.stopPropagation?.();
            data.handleDelete(estate);
          }}
        />
      </ScrollView>
    </View>
  );
}
