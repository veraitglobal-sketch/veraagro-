import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ordersAPI } from '../../../lib/api';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerSheet, growerSheetCardStyle } from '../../../design-system/grower-sheet-styles';

/** Home card: paid catalogue orders waiting for packing / pickup (same data as web /grower/orders). */
export function OrdersToPrepareCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [total, setTotal] = useState(0);
  const [toPack, setToPack] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      ordersAPI
        .getForGrower('prepare')
        .then((rows) => {
          if (!active) return;
          setTotal(rows.length);
          setToPack(rows.filter((r) => r.nextAction === 'PREPARE_AND_PACK').length);
        })
        .catch(() => {
          if (active) setTotal(0);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  if (total === 0) return null;

  return (
    <View style={styles.panel}>
      <Text style={styles.headline}>{t('producer.ordersPrepare.cardTitle', { count: total })}</Text>
      <Text style={[enterpriseUi.inAppLead, toPack > 0 ? styles.pending : null]}>
        {toPack > 0
          ? t('producer.ordersPrepare.cardToPack', { count: toPack })
          : t('producer.ordersPrepare.cardAllPacked')}
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(producer)/orders')}
        activeOpacity={0.88}
        style={[enterpriseUi.authSubmit, styles.cta]}
        accessibilityRole="button"
      >
        <Text style={[enterpriseUi.authSubmitText, styles.ctaText]}>{t('producer.ordersPrepare.cardCta')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    ...growerSheetCardStyle({ marginBottom: 18 }),
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  headline: {
    fontSize: 18,
    fontWeight: '600',
    color: growerSheet.title,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  pending: {
    color: enterpriseColors.primary,
    fontWeight: '500',
  },
  cta: {
    marginTop: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  ctaText: {
    textAlign: 'center',
    width: '100%',
  },
});
