import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { materialsAPI } from '../../../lib/api';
import EmptyState from '../../../components/EmptyState';

const BANNED_CACHE_KEY = 'banned_substances_cache';

const DEFAULT_BANNED_KEYS: { title: string; desc: string }[] = [
  { title: 'producer.bannedSubstances.defSyntheticTitle', desc: 'producer.bannedSubstances.defSyntheticDesc' },
  { title: 'producer.bannedSubstances.defGmoTitle', desc: 'producer.bannedSubstances.defGmoDesc' },
  { title: 'producer.bannedSubstances.defHerbTitle', desc: 'producer.bannedSubstances.defHerbDesc' },
  { title: 'producer.bannedSubstances.defCheckTitle', desc: 'producer.bannedSubstances.defCheckDesc' },
];

export default function BannedSubstancesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const [allowedList, setAllowedList] = useState<{ barcode?: string; name?: string; productName?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await materialsAPI.getWhitelist();
      setAllowedList(list || []);
      await AsyncStorage.setItem(
        BANNED_CACHE_KEY,
        JSON.stringify({ data: list || [], at: Date.now() }),
      );
    } catch {
      const cached = await AsyncStorage.getItem(BANNED_CACHE_KEY);
      if (cached) {
        try {
          const { data } = JSON.parse(cached);
          setAllowedList(Array.isArray(data) ? data : []);
        } catch {
          /* ignore */
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
  }, [load]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(producer)/(tabs)/field');
    }
  };

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader
        title={t('producer.bannedSubstances.title')}
        subtitle={t('producer.bannedSubstances.subtitle')}
        onBack={goBack}
      />
      <EnterpriseScreen
        refreshing={refreshing}
        onRefresh={() => void onRefresh()}
        contentPaddingBottom={Math.max(p.bottomInset, 20) + 12}
      >
        <View style={growerUi.scrollContent}>
          <View style={[enterpriseUi.inAppPanel, styles.intro]}>
            <ShieldAlert size={24} color={enterpriseColors.primary} strokeWidth={1.5} />
            <Text style={styles.introText}>{t('producer.bannedSubstances.subtitle')}</Text>
          </View>

          <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.bannedSubstances.whatIsBanned')}</Text>
          {DEFAULT_BANNED_KEYS.map((row) => (
            <View key={row.title} style={[enterpriseUi.inAppPanel, styles.card]}>
              <Text style={enterpriseUi.navRowTitle}>{t(row.title)}</Text>
              <Text style={enterpriseUi.navRowSubtitle}>{t(row.desc)}</Text>
            </View>
          ))}

          <Text style={[enterpriseUi.inAppSectionLabel, styles.sectionGap]}>
            {t('producer.bannedSubstances.allowedSubstances')}
          </Text>
          {loading && allowedList.length === 0 ? (
            <Text style={enterpriseUi.navRowSubtitle}>{t('producer.bannedSubstances.loading')}</Text>
          ) : allowedList.length === 0 ? (
            <EmptyState message={t('producer.bannedSubstances.noCache')} icon={ShieldAlert} />
          ) : (
            <View style={[enterpriseUi.inAppPanel, styles.listPanel]}>
              {allowedList.slice(0, 30).map((a, i) => (
                <View
                  key={`${a.barcode ?? i}-${i}`}
                  style={[styles.allowedRow, i > 0 && styles.allowedRowBorder]}
                >
                  <Text style={styles.allowedBarcode}>{a.barcode || '—'}</Text>
                  <Text style={enterpriseUi.navRowTitle} numberOfLines={1}>
                    {a.name ?? a.productName ?? '—'}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {allowedList.length > 30 ? (
            <Text style={[enterpriseUi.navRowSubtitle, styles.hint]}>
              {t('producer.bannedSubstances.moreItems', { count: allowedList.length - 30 })}
            </Text>
          ) : null}
        </View>
      </EnterpriseScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    marginBottom: 20,
  },
  introText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray700,
    lineHeight: 22,
  },
  card: {
    padding: 16,
    marginBottom: 10,
  },
  sectionGap: {
    marginTop: 8,
    marginBottom: 10,
  },
  listPanel: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  allowedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  allowedRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  allowedBarcode: {
    width: 96,
    fontSize: 13,
    fontWeight: '500',
    color: enterpriseColors.gray600,
  },
  hint: {
    marginTop: 10,
  },
});
