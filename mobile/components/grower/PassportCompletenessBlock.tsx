import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { batchesAPI } from '../../lib/api';
import { passportCompletenessMissing, type PassportCompletenessItem } from '../../../shared/passport/completeness';
import { theme } from '../../lib/theme';

const MOBILE_ROUTES: Record<string, string> = {
  '/grower/catalog': '/(producer)/product-catalog',
  '/grower/plantings': '/(producer)/plantings',
  '/grower/batches': '/(producer)/batches',
  '/grower/orders': '/(producer)/orders',
  '/grower/quality-entry': '/(producer)/quality-entry',
  '/grower/package-badges': '/(producer)/package-badges',
};

export function PassportCompletenessBlock({ batchRef }: { batchRef: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<PassportCompletenessItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const data = await batchesAPI.getPassportCompleteness(batchRef);
        if (!cancelled && Array.isArray(data)) setItems(data as PassportCompletenessItem[]);
      } catch {
        if (!cancelled) setItems(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchRef]);

  if (loading) {
    return <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 12 }} />;
  }
  if (!items) return null;

  const missing = passportCompletenessMissing(items);
  if (missing.length === 0) {
    return (
      <View style={styles.okBox}>
        <Text style={styles.okText}>{t('passportCompleteness.allRequiredOk', 'Required passport data is recorded.')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{t('passportCompleteness.title', 'What is missing for the passport')}</Text>
      {missing.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemLabel}>{t(item.labelKey, item.id)}</Text>
            <Text style={styles.level}>
              {item.level === 'required'
                ? t('passportCompleteness.levelRequired', 'Required')
                : t('passportCompleteness.levelRecommended', 'Recommended')}
            </Text>
          </View>
          {item.actionHref ? (
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => {
                const href = MOBILE_ROUTES[item.actionHref!] ?? '/(producer)/product-catalog';
                router.push(href as never);
              }}
            >
              <Text style={styles.linkText}>{t('passportCompleteness.fixLink', 'Add data')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: theme.colors.background,
  },
  okBox: {
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    marginBottom: 16,
  },
  okText: { fontSize: 13, color: '#065F46' },
  title: { fontSize: 15, fontWeight: '500', marginBottom: 10, color: theme.colors.text.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: theme.colors.border },
  itemLabel: { fontSize: 14, color: theme.colors.text.primary },
  level: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2, textTransform: 'uppercase' },
  linkBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 },
  linkText: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
});
