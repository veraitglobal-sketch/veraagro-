import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useEstatesData } from './useEstatesData';
import { EstateList } from './EstateList';
import type { Estate } from '../../../lib/api';

/**
 * Estates list screen: header with add button, list with refresh.
 * Detail and new/edit stay in app routes; this screen only lists.
 */
export function EstatesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const data = useEstatesData();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{
        paddingTop: p.headerTop,
        paddingBottom: theme.spacing.md,
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '300',
          color: theme.colors.text.primary,
          letterSpacing: 0.5,
          flex: 1,
        }}>
          {t('producer.estates.myFields')}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(producer)/estates/new')}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={20} color={theme.colors.background} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={data.refreshing}
            onRefresh={data.onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View
          style={{
            paddingTop: theme.spacing.md,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
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
        </View>
      </ScrollView>
    </View>
  );
}
