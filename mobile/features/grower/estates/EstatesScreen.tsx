import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { useEstatesData } from './useEstatesData';
import { EstateList } from './EstateList';
import type { Estate } from '../../../lib/api';

export function EstatesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const data = useEstatesData();

  return (
    <EnterpriseScreen
      refreshing={data.refreshing}
      onRefresh={data.onRefresh}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 12}
      header={
        <GrowerStackHeader
          title={t('producer.estates.myFields')}
          subtitle={
            data.ready && data.estates.length === 0
              ? t('producer.estates.listEmptySubtitle')
              : undefined
          }
          right={
            <TouchableOpacity
              onPress={() => router.push('/(producer)/estates/new')}
              activeOpacity={0.9}
              style={styles.addBtn}
              accessibilityRole="button"
              accessibilityLabel={t('producer.estates.newEstate')}
            >
              <Plus size={18} color={enterpriseColors.white} strokeWidth={2.4} />
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={[growerUi.scrollContent, { paddingTop: 8 }]}>
        <EstateList
          estates={data.estates}
          ready={data.ready}
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
      </View>
    </EnterpriseScreen>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: enterpriseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
