import { View, TextInput, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import type { MaterialFilterType } from './useMaterialsData';

export interface WhitelistSearchProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterType: MaterialFilterType;
  setFilterType: (v: MaterialFilterType) => void;
}

/**
 * Search bar and type filters for whitelist materials.
 * Receives data from useMaterialsData (call hook in parent and pass props).
 */
const FILTER_IDS: MaterialFilterType[] = ['all', 'FERTILIZER', 'PESTICIDE', 'SEED', 'OTHER'];

export function WhitelistSearch({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
}: WhitelistSearchProps) {
  const { t } = useTranslation();
  const FILTER_OPTIONS = FILTER_IDS.map((id) => ({
    id,
    label: id === 'all' ? t('producer.materials.all') : t(`producer.materials.${id.toLowerCase()}`),
  }));
  return (
    <>
      {/* Search */}
      <View
        className="px-4 py-3 border-b-[0.5px]"
        style={{
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: theme.borderRadius.sm,
          borderWidth: 0.5,
          borderColor: colors.border,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        }}
      >
        <Search size={16} color={colors.text.secondary} strokeWidth={1} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('producer.materials.searchPlaceholder')}
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: '300',
            color: colors.text.primary,
            marginLeft: theme.spacing.sm,
          }}
        />
        </View>
      </View>

      {/* Filters */}
      <View
        className="px-4 py-3 border-b-[0.5px]"
        style={{
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {FILTER_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilterType(f.id)}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  borderWidth: 0.5,
                  borderColor: filterType === f.id ? colors.primary : colors.border,
                  backgroundColor: filterType === f.id ? `${colors.primary}10` : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '300',
                  color: filterType === f.id ? colors.primary : colors.text.secondary,
                  letterSpacing: 0.3,
                }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
}
