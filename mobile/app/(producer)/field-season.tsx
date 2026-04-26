import { useState, useCallback, type ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { ArrowLeft, CheckCircle, Circle, Shield } from 'lucide-react-native';
import { estatesAPI, parcelsAPI } from '../../lib/api';
import { theme } from '../../lib/theme';

export default function FieldSeasonScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasParcel, setHasParcel] = useState(false);
  const [hasApprovedParcel, setHasApprovedParcel] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await estatesAPI.getAll();
      let approved = 0;
      let pending = 0;
      let anyParcels = false;
      for (const e of list || []) {
        const parcels = await parcelsAPI.getByEstate(e.id).catch(() => []);
        for (const p of parcels || []) {
          anyParcels = true;
          if (p.approvedAt) approved += 1;
          else pending += 1;
        }
      }
      setHasParcel(anyParcels);
      setHasApprovedParcel(approved > 0);
      setPendingCount(pending);
    } catch (e: any) {
      setError(e?.message || t('producer.fieldSeason.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const step = (icon: ReactNode, title: string, children: ReactNode) => (
    <View
      style={{
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' }}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary }}>{title}</Text>
          {children}
        </View>
      </View>
    </View>
  );

  const link = (label: string, onPress: () => void) => (
    <TouchableOpacity onPress={onPress} style={{ marginTop: 8 }} activeOpacity={0.7} hitSlop={8}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.primary }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 52,
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: theme.spacing.md }} hitSlop={12}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text.primary }}>{t('producer.fieldSeason.title')}</Text>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        >
          <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }}>
            {t('producer.fieldSeason.intro')}
          </Text>
          {error && (
            <Text style={{ color: theme.colors.error, marginBottom: theme.spacing.md, fontSize: 14 }}>{error}</Text>
          )}

          {step(
            hasParcel ? <CheckCircle size={22} color={theme.colors.success} style={{ marginTop: 2 }} /> : <Circle size={22} color={theme.colors.primary} style={{ marginTop: 2 }} />,
            t('producer.fieldSeason.step1Title'),
            <>
              <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginTop: 4 }}>{t('producer.fieldSeason.step1Body')}</Text>
              {link(t('producer.fieldSeason.openFields'), () => router.push('/(producer)/estates'))}
            </>,
          )}

          {step(
            hasApprovedParcel ? (
              <CheckCircle size={22} color={theme.colors.success} style={{ marginTop: 2 }} />
            ) : (
              <Shield size={22} color={hasParcel ? theme.colors.warning : theme.colors.text.tertiary} style={{ marginTop: 2 }} />
            ),
            t('producer.fieldSeason.step2Title'),
            <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginTop: 4 }}>
              {hasApprovedParcel
                ? t('producer.fieldSeason.step2Ok')
                : hasParcel
                  ? t('producer.fieldSeason.step2Pending', { count: pendingCount })
                  : t('producer.fieldSeason.step2NeedStep1')}
            </Text>,
          )}

          {step(
            hasApprovedParcel ? <CheckCircle size={22} color={theme.colors.success} style={{ marginTop: 2 }} /> : <Circle size={22} color={theme.colors.text.tertiary} style={{ marginTop: 2 }} />,
            t('producer.fieldSeason.step3Title'),
            hasApprovedParcel ? (
              <>
                <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginTop: 4, marginBottom: 4 }}>{t('producer.fieldSeason.step3Body')}</Text>
                {link(t('producer.fieldSeason.openFieldLog'), () => router.push('/(producer)/(tabs)/field-log'))}
                {link(t('producer.fieldSeason.openHarvest'), () => router.push('/(producer)/(tabs)/harvest'))}
              </>
            ) : (
              <Text style={{ fontSize: 14, color: theme.colors.text.tertiary, marginTop: 4 }}>{t('producer.fieldSeason.step3Locked')}</Text>
            ),
          )}
        </ScrollView>
      )}
    </View>
  );
}
