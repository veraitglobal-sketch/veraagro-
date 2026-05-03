import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { estatesAPI, parcelsAPI, type Estate, type Parcel } from '../../../lib/api';

type Row = { parcelId: string; estateName: string; cropLabel: string; area: number };

export default function PlotMapperParcelPicker() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    try {
      const estates: Estate[] = await estatesAPI.getAll();
      const lists = await Promise.all((estates || []).map((e) => parcelsAPI.getByEstate(e.id).catch(() => [])));
      const next: Row[] = [];
      estates.forEach((estate, i) => {
        const plist = lists[i] || [];
        for (const parcel of plist as Parcel[]) {
          next.push({
            parcelId: parcel.id,
            estateName: estate.name,
            cropLabel: parcel.cropType?.trim() ? parcel.cropType : t('producer.batches.unknownProduct'),
            area: parcel.calculatedArea,
          });
        }
      });
      setRows(next);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onPick = useCallback(
    (parcelId: string, label: string) => {
      router.replace({
        pathname: '/(producer)/plot-mapper',
        params: { parcelId, parcelLabel: encodeURIComponent(label) },
      });
    },
    [router],
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          paddingTop: p.topInset,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={{
        paddingHorizontal: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        paddingTop: Math.max(p.headerTop, theme.spacing.md),
        paddingBottom: Math.max(p.bottomInset, theme.spacing.xl),
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: colors.text.primary,
          marginBottom: 6,
          letterSpacing: -0.3,
        }}
      >
        {t('producer.plotMapper.selectParcelTitle')}
      </Text>
      <Text style={{ fontSize: 14, color: colors.text.secondary, lineHeight: 20, marginBottom: theme.spacing.md }}>
        {t('producer.plotMapper.selectParcelLead')}
      </Text>

      {rows.length === 0 ? (
        <View
          style={{
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            borderWidth: 0.5,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.text.secondary }}>{t('producer.plotMapper.noParcels')}</Text>
          <TouchableOpacity
            style={{ marginTop: theme.spacing.sm }}
            onPress={() => router.push('/(producer)/estates')}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary }}>
              {t('producer.plotMapper.goToEstates')} →
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {rows.map((row) => (
            <TouchableOpacity
              key={row.parcelId}
              onPress={() => onPick(row.parcelId, `${row.estateName} · ${row.cropLabel}`)}
              activeOpacity={0.75}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                borderWidth: 0.5,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: `${colors.primary}14`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MapPin size={20} color={colors.primary} strokeWidth={1.75} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.secondary }} numberOfLines={1}>
                  {row.estateName}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginTop: 2 }} numberOfLines={2}>
                  {row.cropLabel}
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.secondary, marginTop: 4 }}>
                  {t('producer.estates.area')}: {row.area.toFixed(2)} m² · {t('producer.plotMapper.planForThisParcel')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
