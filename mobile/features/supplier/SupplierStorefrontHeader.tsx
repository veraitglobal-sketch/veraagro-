import { View, Text, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, ShoppingBag } from 'lucide-react-native';
import { enterpriseColors } from '../../lib/enterprise-ui';

export type CatalogPreviewItem = { id: string; name: string; imageUrl: string | null };

type Props = {
  businessName: string;
  city?: string;
  country?: string;
  mapApproved?: boolean;
  catalogPreview: CatalogPreviewItem[];
};

export function SupplierStorefrontHeader({
  businessName,
  city,
  country,
  mapApproved,
  catalogPreview,
}: Props) {
  const { t } = useTranslation();
  const location = [city, country].filter(Boolean).join(', ');
  const slots = [0, 1, 2].map((i) => catalogPreview[i]);

  return (
    <View style={styles.wrap}>
      <View style={styles.awning} accessibilityElementsHidden />
      <View style={styles.sill} />
      <View style={styles.body}>
        <Text style={styles.badge}>{t('supplier.store.badge')}</Text>
        <Text style={styles.title}>{businessName}</Text>
        {location ? (
          <View style={styles.locationRow}>
            <MapPin size={14} color={enterpriseColors.primary} strokeWidth={1.5} />
            <Text style={styles.location}>{location}</Text>
          </View>
        ) : null}
        <Text style={styles.intro}>{t('supplier.store.intro')}</Text>

        <Text style={styles.windowLabel}>{t('supplier.store.shopWindow')}</Text>
        <View style={styles.windowRow}>
          {slots.map((it, idx) => (
            <View key={it?.id ?? `slot-${idx}`} style={styles.windowSlot}>
              {it?.imageUrl ? (
                <Image source={{ uri: it.imageUrl }} style={styles.windowImage} resizeMode="cover" />
              ) : (
                <ShoppingBag size={24} color={`${enterpriseColors.primary}33`} strokeWidth={1.25} />
              )}
            </View>
          ))}
        </View>
        <Text style={styles.windowHint}>{t('supplier.store.shopWindowHint')}</Text>

        {mapApproved !== undefined ? (
          <View style={[styles.mapBadge, mapApproved ? styles.mapOk : styles.mapPending]}>
            <Text style={[styles.mapBadgeText, mapApproved ? styles.mapOkText : styles.mapPendingText]}>
              {mapApproved ? t('supplier.store.mapApproved') : t('supplier.store.mapPending')}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
    overflow: 'hidden',
    marginBottom: 20,
  },
  awning: {
    height: 28,
    backgroundColor: enterpriseColors.primary,
  },
  sill: {
    height: 6,
    backgroundColor: '#23471f',
  },
  body: {
    padding: 18,
    backgroundColor: enterpriseColors.white,
  },
  badge: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: enterpriseColors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '400',
    color: enterpriseColors.gray900,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  location: {
    fontSize: 14,
    color: enterpriseColors.gray600,
  },
  intro: {
    fontSize: 15,
    color: enterpriseColors.gray700,
    lineHeight: 22,
    marginTop: 10,
  },
  windowLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    color: enterpriseColors.gray600,
    marginTop: 16,
  },
  windowRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  windowSlot: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${enterpriseColors.primary}33`,
    backgroundColor: enterpriseColors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  windowImage: {
    width: '100%',
    height: '100%',
  },
  windowHint: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    marginTop: 8,
  },
  mapBadge: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mapOk: {
    backgroundColor: enterpriseColors.primaryTint,
    borderColor: enterpriseColors.gray200,
  },
  mapPending: {
    backgroundColor: enterpriseColors.gray100,
    borderColor: enterpriseColors.gray200,
  },
  mapBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  mapOkText: {
    color: enterpriseColors.primary,
  },
  mapPendingText: {
    color: enterpriseColors.gray700,
  },
});
