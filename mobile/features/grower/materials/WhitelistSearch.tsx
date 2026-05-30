import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react-native';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { EnterpriseTextField } from '../../../design-system';
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
        <EnterpriseTextField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('producer.materials.searchPlaceholder')}
          accessibilityLabel={t('producer.materials.searchPlaceholder')}
          containerStyle={styles.searchField}
          autoCapitalize="none"
          autoCorrect={false}
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
              style={[growerUi.filterChip, active && growerUi.filterChipOn]}
            >
              <Text style={[growerUi.filterChipText, active && growerUi.filterChipTextOn]}>{f.label}</Text>
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
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchField: {
    flex: 1,
    marginBottom: 0,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContent: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
});
