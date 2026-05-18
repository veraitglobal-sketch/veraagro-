import { View, TextInput, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react-native';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import type { MaterialFilterType } from './useMaterialsData';

export interface WhitelistSearchProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterType: MaterialFilterType;
  setFilterType: (v: MaterialFilterType) => void;
}

const FILTER_IDS: MaterialFilterType[] = ['all', 'FERTILIZER', 'PESTICIDE', 'SEED', 'OTHER'];

export function WhitelistSearch({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
}: WhitelistSearchProps) {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();

  const filterLabel = (id: MaterialFilterType) => {
    switch (id) {
      case 'all':
        return t('producer.materials.all');
      case 'FERTILIZER':
        return t('producer.materials.fertilizer');
      case 'PESTICIDE':
        return t('producer.materials.pesticide');
      case 'SEED':
        return t('producer.materials.seed');
      default:
        return t('producer.materials.other');
    }
  };

  const filterOptions = FILTER_IDS.map((id) => ({ id, label: filterLabel(id) }));

  return (
    <View style={styles.wrap}>
      <View style={[styles.searchRow, { paddingHorizontal: p.screenPaddingLeft }]}>
        <Search size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('producer.materials.searchPlaceholder')}
          placeholderTextColor={enterpriseColors.gray600}
          style={styles.searchInput}
          accessibilityLabel={t('producer.materials.searchPlaceholder')}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={[
          styles.filterContent,
          { paddingLeft: p.screenPaddingLeft, paddingRight: p.screenPaddingRight },
        ]}
      >
        {filterOptions.map((f) => {
          const active = filterType === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFilterType(f.id)}
              activeOpacity={0.7}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: enterpriseColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: enterpriseColors.gray900,
    paddingVertical: 10,
    letterSpacing: -0.15,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContent: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  filterChipActive: {
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.primaryTint,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    letterSpacing: -0.1,
  },
  filterChipTextActive: {
    color: enterpriseColors.primary,
    fontWeight: '600',
  },
});
