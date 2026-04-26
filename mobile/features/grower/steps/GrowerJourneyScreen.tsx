import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ListOrdered } from 'lucide-react-native';
import { estatesAPI, parcelsAPI } from '../../../lib/api';
import { GROWER_JOURNEY_STEPS } from '../../../lib/grower-journey-data';
import { theme } from '../../../lib/theme';

type Props = {
  /** When opened from stack (e.g. dashboard), show back affordance via parent; tab has no back */
  showStatusBanner?: boolean;
};

export default function GrowerJourneyScreen({ showStatusBanner = true }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasParcel, setHasParcel] = useState(false);
  const [hasApprovedParcel, setHasApprovedParcel] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const load = useCallback(async () => {
    try {
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
    } catch {
      // non-fatal for journey text
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      {showStatusBanner && loading ? (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : null}
      {showStatusBanner && !loading ? (
        <View
          style={{
            borderRadius: theme.borderRadius.md,
            borderWidth: 1,
            borderColor: theme.colors.warning + '55',
            backgroundColor: theme.colors.warning + '18',
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text.primary }}>
            Your parcels
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginTop: 6, lineHeight: 20 }}>
            {hasApprovedParcel
              ? 'At least one parcel is approved — you can continue with work and batches as rules allow.'
              : hasParcel
                ? `${pendingCount} still waiting for approval.`
                : 'No parcel yet. Add a parcel under My fields.'}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(producer)/estates')} style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.primary }}>My fields →</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.lg,
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.md,
          backgroundColor: theme.colors.primaryLight,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <ListOrdered size={22} color={theme.colors.primary} style={{ marginTop: 2 }} />
        <Text style={{ flex: 1, fontSize: 14, color: theme.colors.text.primary, lineHeight: 20 }}>
          Read steps 1 → end. Bottom bar order: <Text style={{ fontWeight: '700' }}>Home</Text> (dashboard), then{' '}
          <Text style={{ fontWeight: '700' }}>Steps</Text>, then Products, then Profile.
        </Text>
      </View>

      {GROWER_JOURNEY_STEPS.map((s, i) => (
        <View
          key={s.title}
          style={{
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary + '55',
            paddingLeft: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary }}>
            Step {i + 1}. {s.title}
          </Text>
          {s.paragraphs.map((p, j) => (
            <Text
              key={j}
              style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
                marginTop: 8,
                lineHeight: 20,
              }}
            >
              {p}
            </Text>
          ))}
          {s.links?.map((l) => (
            <TouchableOpacity
              key={l.path + l.label}
              onPress={() => router.push(l.path as never)}
              style={{ marginTop: 10 }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.primary }}>{l.label} →</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
