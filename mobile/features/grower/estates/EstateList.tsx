import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Edit, Trash2, Package } from 'lucide-react-native';
import type { Estate } from '../../../lib/api';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi, growerStyles } from '../../../lib/grower-ui';

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
  const { t } = useTranslation();

  if (!ready) {
    return null;
  }

  if (estates.length === 0) {
    return (
      <View style={growerUi.emptyCard}>
        <MapPin size={40} color={enterpriseColors.gray600} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>{t('producer.estates.listEmptyTitle')}</Text>
        <Text style={styles.emptySubtitle}>{t('producer.estates.listEmptySubtitle')}</Text>
        <TouchableOpacity onPress={onPressNew} activeOpacity={0.9} style={[growerUi.btnPrimary, styles.emptyBtn]}>
          <Text style={growerUi.btnPrimaryText}>{t('producer.estates.newEstate')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ gap: 0 }}>
      {estates.map((estate) => {
        const parcels = estate.parcels ?? [];
        const parcelTotal = parcels.length;
        const parcelApproved = parcels.filter((p) => Boolean(p.approvedAt)).length;
        const statusColor = getStatusColor(estate.status);

        return (
          <TouchableOpacity
            key={estate.id}
            onPress={() => onPressEstate(estate)}
            activeOpacity={0.88}
            style={growerUi.estateCard}
          >
            <View style={styles.cardTop}>
              <View style={[growerUi.tileIcon, { backgroundColor: `${statusColor}18` }]}>
                <MapPin size={24} color={statusColor} strokeWidth={1.75} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={growerUi.tileTitle} numberOfLines={1}>
                  {estate.name}
                </Text>
                {estate.location ? (
                  <Text style={growerUi.tileDesc} numberOfLines={1}>
                    {estate.location}
                  </Text>
                ) : null}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={(e) => onPressEdit(estate, e)} hitSlop={8} accessibilityRole="button">
                  <Edit size={20} color={enterpriseColors.gray600} strokeWidth={1.75} />
                </TouchableOpacity>
                <TouchableOpacity onPress={(e) => onDelete(estate, e)} hitSlop={8} accessibilityRole="button">
                  <Trash2 size={20} color={enterpriseColors.destructive} strokeWidth={1.75} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={[growerStyles.statusPill, { backgroundColor: `${statusColor}18` }]}>
                <Text style={[growerStyles.statusPillText, { color: statusColor }]}>
                  {getStatusLabel(estate.status)}
                </Text>
              </View>
              {estate.calculatedArea > 0 ? (
                <Text style={styles.metaText}>{estate.calculatedArea.toFixed(0)} m²</Text>
              ) : null}
              {parcelTotal > 0 ? (
                <View style={styles.parcelMeta}>
                  <Package size={14} color={enterpriseColors.gray600} strokeWidth={1.5} />
                  <Text style={styles.metaText}>
                    {t('producer.estates.approvedParcelsOfTotal', {
                      approved: parcelApproved,
                      total: parcelTotal,
                    })}
                  </Text>
                </View>
              ) : null}
            </View>

            {estate.daysRemaining != null ? (
              <View style={styles.daysRow}>
                <Calendar size={14} color={enterpriseColors.gray600} strokeWidth={1.5} />
                <Text style={styles.metaText}>
                  {t('producer.estates.listCertDaysRemaining', { count: estate.daysRemaining ?? 0 })}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
  },
  parcelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
});
