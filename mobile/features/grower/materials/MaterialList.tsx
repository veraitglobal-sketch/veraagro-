import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Material } from '../../../lib/api';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerStyles, growerUi } from '../../../lib/grower-ui';
import type { MaterialFilterType } from './useMaterialsData';
import { useAppLocaleTag } from '../../../lib/date-locale';

export interface MaterialListProps {
  filteredMaterials: Material[];
  loading: boolean;
  searchQuery: string;
  filterType: MaterialFilterType;
  lastSync: Date | null;
  getTypeColor: (type: string) => string;
  getTypeLabel: (type: string) => string;
}

function typeTone(type: string): { bg: string; text: string } {
  const t = (type ?? 'OTHER').toUpperCase();
  if (t === 'FERTILIZER') return { bg: enterpriseColors.primaryTint, text: enterpriseColors.primary };
  if (t === 'PESTICIDE') return { bg: 'rgba(217, 119, 6, 0.1)', text: '#92400E' };
  if (t === 'SEED') return { bg: enterpriseColors.gray100, text: enterpriseColors.gray700 };
  return { bg: enterpriseColors.gray100, text: enterpriseColors.gray600 };
}

export function MaterialList({
  filteredMaterials,
  loading,
  searchQuery,
  filterType,
  lastSync,
  getTypeLabel,
}: MaterialListProps) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();

  if (loading && filteredMaterials.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={enterpriseColors.primary} />
        <Text style={styles.loadingText}>{t('producer.materials.loading')}</Text>
      </View>
    );
  }

  if (filteredMaterials.length === 0) {
    return (
      <View style={growerUi.emptyCard}>
        <Text style={styles.emptyText}>
          {searchQuery || filterType !== 'all'
            ? t('producer.materials.noResults')
            : t('producer.materials.noMaterials')}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {t('producer.materials.materialCount', { count: filteredMaterials.length })}
        </Text>
        {lastSync ? (
          <Text style={styles.metaText}>
            {t('producer.materials.lastSync')}:{' '}
            {lastSync.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        ) : null}
      </View>

      <View style={styles.list}>
        {filteredMaterials.map((material, index) => {
          const tone = typeTone(material.type ?? 'OTHER');
          const title = material.name || material.barcode;
          const typeLabel = getTypeLabel(material.type ?? 'OTHER');

          return (
            <View
              key={material.id}
              style={[styles.row, index < filteredMaterials.length - 1 && styles.rowBorder]}
            >
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {t('producer.materials.barcode')}: {material.barcode}
                </Text>
                {material.manufacturer ? (
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {material.manufacturer}
                  </Text>
                ) : null}
                {material.certification ? (
                  <Text style={styles.rowCert} numberOfLines={1}>
                    {material.certification}
                  </Text>
                ) : null}
              </View>
              <View style={[growerStyles.statusPill, { backgroundColor: tone.bg, marginLeft: 8 }]}>
                <Text style={[growerStyles.statusPillText, { color: tone.text }]}>{typeLabel}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: enterpriseColors.gray600,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    textAlign: 'center',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    letterSpacing: -0.1,
  },
  list: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.25,
    lineHeight: 21,
  },
  rowMeta: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 4,
    letterSpacing: -0.1,
  },
  rowCert: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
