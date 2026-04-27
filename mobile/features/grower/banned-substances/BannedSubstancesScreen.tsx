import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { materialsAPI } from '../../../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BANNED_CACHE_KEY = 'banned_substances_cache';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

const DEFAULT_BANNED_KEYS: { title: string; desc: string }[] = [
  { title: 'producer.bannedSubstances.defSyntheticTitle', desc: 'producer.bannedSubstances.defSyntheticDesc' },
  { title: 'producer.bannedSubstances.defGmoTitle', desc: 'producer.bannedSubstances.defGmoDesc' },
  { title: 'producer.bannedSubstances.defHerbTitle', desc: 'producer.bannedSubstances.defHerbDesc' },
  { title: 'producer.bannedSubstances.defCheckTitle', desc: 'producer.bannedSubstances.defCheckDesc' },
];

export default function BannedSubstancesScreen() {
  const { t } = useTranslation();
  const [allowedList, setAllowedList] = useState<{ barcode?: string; name?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await materialsAPI.getWhitelist();
      setAllowedList(list || []);
      await AsyncStorage.setItem(
        BANNED_CACHE_KEY,
        JSON.stringify({ data: list || [], at: Date.now() })
      );
    } catch (_) {
      const cached = await AsyncStorage.getItem(BANNED_CACHE_KEY);
      if (cached) {
        try {
          const { data } = JSON.parse(cached);
          setAllowedList(Array.isArray(data) ? data : []);
        } catch (_2) {}
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <ShieldAlert size={28} color={theme.colors.warning} strokeWidth={1.5} />
        <Text style={styles.title}>{t('producer.bannedSubstances.title')}</Text>
        <Text style={styles.subtitle}>{t('producer.bannedSubstances.subtitle')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('producer.bannedSubstances.whatIsBanned')}</Text>
        {DEFAULT_BANNED_KEYS.map((row) => (
          <View key={row.title} style={styles.card}>
            <Text style={styles.cardTitle}>{t(row.title)}</Text>
            <Text style={styles.cardDesc}>{t(row.desc)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('producer.bannedSubstances.allowedSubstances')}</Text>
        {loading && allowedList.length === 0 ? (
          <Text style={styles.hint}>{t('producer.bannedSubstances.loading')}</Text>
        ) : allowedList.length === 0 ? (
          <Text style={styles.hint}>{t('producer.bannedSubstances.noCache')}</Text>
        ) : (
          allowedList.slice(0, 30).map((a, i) => (
            <View key={i} style={styles.allowedRow}>
              <Text style={styles.allowedBarcode}>{a.barcode || '—'}</Text>
              <Text style={styles.allowedName} numberOfLines={1}>{(a as any).name ?? (a as any).productName ?? '—'}</Text>
            </View>
          ))
        )}
        {allowedList.length > 30 && (
          <Text style={styles.hint}>{t('producer.bannedSubstances.moreItems', { count: allowedList.length - 30 })}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'] },
  header: { marginBottom: theme.spacing.lg },
  title: { ...theme.typography.h3, color: theme.colors.text.primary, marginTop: 8 },
  subtitle: { ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: 4 },
  section: { marginBottom: theme.spacing.xl },
  sectionTitle: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
  cardDesc: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 4 },
  allowedRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border },
  allowedBarcode: { width: 100, fontSize: 13, color: theme.colors.text.tertiary },
  allowedName: { flex: 1, fontSize: 14, color: theme.colors.text.primary },
  hint: { fontSize: 13, color: theme.colors.text.tertiary, marginTop: 8 },
});
