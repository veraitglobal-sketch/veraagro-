import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { theme } from '../../../lib/theme';
import { growerSheet, growerSheetCardStyle } from '../../../design-system/grower-sheet-styles';
import { type GrowerParcelRow } from '../../../lib/load-grower-parcels';
import { isParcelApproved } from './useHomeParcels';

type Props = {
  rows: GrowerParcelRow[];
  loaded: boolean;
  estateCount: number;
};

function statusLabel(t: (k: string) => string, row: GrowerParcelRow): string {
  return isParcelApproved(row)
    ? t('producer.estates.parcelApproved')
    : t('producer.estates.parcelPendingApproval');
}

function statusColor(row: GrowerParcelRow): string {
  return isParcelApproved(row) ? enterpriseColors.primary : theme.colors.warning;
}

/** Compact parcel rows on home — tap opens parcel detail directly. */
export function HomeParcelList({ rows, loaded, estateCount }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  if (!loaded) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('producer.homeParcels.title')}</Text>
        <ActivityIndicator color={enterpriseColors.primary} style={{ marginVertical: 12 }} />
      </View>
    );
  }

  if (estateCount === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('producer.homeParcels.title')}</Text>
        <View style={styles.emptyCard}>
          <Text style={enterpriseUi.inAppLead}>{t('producer.dashboard.homeStatusNoParcels')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/(producer)/estates/new')}
            style={[enterpriseUi.authSubmit, styles.emptyCta]}
            accessibilityRole="button"
          >
            <Text style={enterpriseUi.authSubmitText}>{t('producer.dashboard.nextStep.addFieldCta')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('producer.homeParcels.title')}</Text>
        <View style={styles.emptyCard}>
          <Text style={enterpriseUi.inAppLead}>{t('producer.homeParcels.empty')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/(producer)/plot-mapper')}
            style={[enterpriseUi.authSubmit, styles.emptyCta]}
            accessibilityRole="button"
          >
            <Text style={enterpriseUi.authSubmitText}>{t('producer.homeParcels.addCta')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{t('producer.homeParcels.title')}</Text>
      <View style={styles.list}>
        {rows.map((row) => {
          const crop = row.cropType?.trim() || row.label;
          const subtitle =
            row.estateName && rows.some((r) => r.id !== row.id && r.estateName !== row.estateName)
              ? row.estateName
              : row.calculatedArea
                ? `${row.calculatedArea.toFixed(0)} m²`
                : undefined;
          return (
            <TouchableOpacity
              key={row.id}
              onPress={() =>
                router.push({
                  pathname: '/(producer)/parcels/[parcelId]',
                  params: { parcelId: row.id },
                })
              }
              activeOpacity={0.88}
              style={styles.row}
              accessibilityRole="button"
            >
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {crop}
                </Text>
                {subtitle ? (
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.badge, { backgroundColor: `${statusColor(row)}18` }]}>
                <Text style={[styles.badgeText, { color: statusColor(row) }]} numberOfLines={1}>
                  {statusLabel(t, row)}
                </Text>
              </View>
              <ChevronRight size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    ...enterpriseUi.inAppSectionLabel,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  list: {
    ...growerSheetCardStyle({ marginBottom: 12 }),
    overflow: 'hidden',
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: growerSheet.cardBorder,
    gap: 10,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: growerSheet.title,
  },
  rowSub: {
    fontSize: 13,
    color: enterpriseColors.gray600,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 110,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    ...growerSheetCardStyle({ marginBottom: 12 }),
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  emptyCta: {
    marginTop: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
});
