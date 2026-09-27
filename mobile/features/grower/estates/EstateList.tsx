import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Edit, Trash2 } from 'lucide-react-native';
import type { Estate } from '../../../lib/api';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import EmptyState from '../../../components/EmptyState';

export interface EstateListProps {
  estates: Estate[];
  /** False until dashboard/cache has been checked — avoids empty-state flash. */
  ready: boolean;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  onPressEstate: (estate: Estate) => void;
  onPressNew: () => void;
  onPressEdit: (estate: Estate, e: { stopPropagation?: () => void }) => void;
  onDelete: (estate: Estate, e: { stopPropagation?: () => void }) => void;
}

export function EstateList({
  estates,
  ready,
  getStatusColor,
  getStatusLabel,
  onPressEstate,
  onPressNew,
  onPressEdit,
  onDelete,
}: EstateListProps) {
  const { t, i18n } = useTranslation();

  if (!ready) {
    return (
      <View style={[growerUi.emptyCard, { paddingVertical: 32 }]}>
        <Text style={styles.emptySubtitle}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (estates.length === 0) {
    return (
      <>
        <EmptyState message={t('producer.estates.empty')} icon={MapPin} />
        <TouchableOpacity onPress={onPressNew} activeOpacity={0.9} style={[growerUi.btnPrimary, styles.emptyBtn]}>
          <Text style={growerUi.btnPrimaryText}>{t('producer.estates.newEstate')}</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <View style={styles.list}>
      {estates.map((estate, index) => {
        const parcels = estate.parcels ?? [];
        const parcelTotal = parcels.length;
        const parcelApproved = parcels.filter((p) => Boolean(p.approvedAt)).length;
        const statusColor = getStatusColor(estate.status);
        const meta = [
          estate.calculatedArea > 0 ? formatArea(estate.calculatedArea, i18n.language) : null,
          parcelTotal > 0
            ? t('producer.estates.approvedParcelsOfTotal', { approved: parcelApproved, total: parcelTotal })
            : null,
        ].filter(Boolean);

        return (
          <TouchableOpacity
            key={estate.id}
            onPress={() => onPressEstate(estate)}
            activeOpacity={0.6}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={estate.name}
          >
            <View style={[styles.tile, { backgroundColor: `${statusColor}14` }]}>
              <MapPin size={19} color={statusColor} strokeWidth={1.8} />
            </View>
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {estate.name}
                </Text>
                <View style={[styles.pill, { backgroundColor: `${statusColor}14` }]}>
                  <Text style={[styles.pillText, { color: statusColor }]}>{getStatusLabel(estate.status)}</Text>
                </View>
              </View>
              {estate.location ? (
                <Text style={styles.sub} numberOfLines={1}>
                  {estate.location}
                </Text>
              ) : null}
              {meta.length > 0 ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {meta.join(' · ')}
                </Text>
              ) : null}
              {estate.daysRemaining != null ? (
                <View style={styles.daysRow}>
                  <Calendar size={12} color={enterpriseColors.gray600} strokeWidth={1.8} />
                  <Text style={styles.meta}>
                    {t('producer.estates.listCertDaysRemaining', { count: estate.daysRemaining ?? 0 })}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={(e) => onPressEdit(estate, e)}
                hitSlop={6}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel={t('producer.estates.editA11y')}
              >
                <Edit size={15} color={enterpriseColors.gray600} strokeWidth={1.9} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => onDelete(estate, e)}
                hitSlop={6}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel={t('producer.estates.deleteA11y')}
              >
                <Trash2 size={15} color={enterpriseColors.destructive} strokeWidth={1.9} />
              </TouchableOpacity>
            </View>
            {index < estates.length - 1 ? <View style={styles.divider} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** m² below one hectare, otherwise hectares — farmers think in ha. */
function formatArea(m2: number, locale: string) {
  if (m2 >= 10000) {
    return `${(m2 / 10000).toLocaleString(locale, { maximumFractionDigits: 2 })} ha`;
  }
  return `${Math.round(m2).toLocaleString(locale)} m²`;
}

const styles = StyleSheet.create({
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    marginTop: 16,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  emptyBtn: {
    width: '100%',
    marginTop: 4,
  },
  list: {
    ...enterpriseUi.inAppPanel,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 10,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingTop: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.25,
    color: enterpriseColors.gray900,
  },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sub: {
    fontSize: 13,
    color: enterpriseColors.gray600,
    marginTop: 2,
  },
  meta: {
    fontSize: 12.5,
    color: enterpriseColors.gray600,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: enterpriseColors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    position: 'absolute',
    left: 66,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: enterpriseColors.gray200,
  },
});
