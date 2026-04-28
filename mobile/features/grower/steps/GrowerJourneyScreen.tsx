import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { ListOrdered } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { estatesAPI, parcelsAPI } from '../../../lib/api';
import { webGrowerHrefToMobilePath } from '../../../lib/grower-web-href-to-mobile';
import { theme } from '../../../lib/theme';

type JourneyLink = { label: string; href: string };
type JourneyStep = {
  title: string;
  paragraphs: string[];
  footnote?: string | null;
  links: JourneyLink[];
};
type JourneyData = {
  chainShort: Array<{ kicker: string; text: string }>;
  intro: {
    sidebarBlurb: string;
    myFieldsCta: {
      title: string;
      line: string;
      linkLabel: string;
      webHref: string;
    };
  };
  fullChainTitle: string;
  steps: JourneyStep[];
};

type Props = {
  showStatusBanner?: boolean;
};

export default function GrowerJourneyScreen({ showStatusBanner = true }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasParcel, setHasParcel] = useState(false);
  const [hasApprovedParcel, setHasApprovedParcel] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const journey = useMemo(() => {
    const j = t('grower.journey', { returnObjects: true }) as unknown as JourneyData;
    return j?.steps?.length ? j : null;
  }, [t]);

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
      // non-fatal
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

  const glanceBody = hasApprovedParcel
    ? t('grower.season.glanceApproved')
    : hasParcel
      ? t('grower.season.glancePending', { count: pendingCount })
      : t('grower.season.glanceNoParcel');

  const openHref = (href: string) => {
    const path = webGrowerHrefToMobilePath(href);
    if (path) router.push(path as never);
  };

  if (!journey) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.lg }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const stepsCount = journey.steps.length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
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
            {t('grower.season.glanceTitle')}
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginTop: 6, lineHeight: 20 }}>
            {glanceBody}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(producer)/estates')} style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.primary }}>
              {t('grower.season.linkMyFields')} →
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Short chain — same bullets as web Steps page */}
      <View
        style={{
          marginBottom: theme.spacing.lg,
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceElevated,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 }}>
          {journey.fullChainTitle}
        </Text>
        {journey.chainShort.map((row, idx) => (
          <Text
            key={idx}
            style={{ fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20, marginBottom: idx < journey.chainShort.length - 1 ? 10 : 0 }}
          >
            <Text style={{ fontWeight: '700', color: theme.colors.text.primary }}>{row.kicker}: </Text>
            {row.text}
          </Text>
        ))}
      </View>

      {/* My fields CTA — web parity */}
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text.primary }}>{journey.intro.myFieldsCta.title}</Text>
        <View style={{ marginTop: 6 }}>
          <TouchableOpacity onPress={() => openHref(journey.intro.myFieldsCta.webHref)} hitSlop={8} accessibilityRole="link">
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.primary }}>{journey.intro.myFieldsCta.linkLabel}</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginTop: 4, lineHeight: 20 }}>
            {journey.intro.myFieldsCta.line}
          </Text>
        </View>
      </View>

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
          {t('grower.season.introRibbon', { count: stepsCount })}
        </Text>
      </View>

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
          {journey.intro.sidebarBlurb}
        </Text>
      </View>

      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text.tertiary, marginBottom: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {t('producer.tabs.steps')}
      </Text>

      {journey.steps.map((s, i) => (
        <View
          key={`${s.title}-${i}`}
          style={{
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary + '55',
            paddingLeft: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.text.tertiary, letterSpacing: 0.6 }}>
            {t('grower.journey.stepNumber', { n: i + 1 })}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginTop: 4 }}>
            {s.title}
          </Text>
          {s.paragraphs?.map((p, j) => (
            <Text key={j} style={{ fontSize: 14, color: theme.colors.text.secondary, marginTop: 8, lineHeight: 20 }}>
              {p}
            </Text>
          ))}
          {s.links?.length > 0 ? (
            <View style={{ marginTop: 10, gap: 8 }}>
              {s.links.map((l) => {
                const mobile = webGrowerHrefToMobilePath(l.href);
                return mobile ? (
                  <TouchableOpacity key={l.href + l.label} onPress={() => openHref(l.href)} activeOpacity={0.7}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.primary }}>
                      {l.label} →
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text key={l.href + l.label} style={{ fontSize: 13, color: theme.colors.text.tertiary }}>
                    {l.label}
                  </Text>
                );
              })}
            </View>
          ) : null}
          {s.footnote ? (
            <Text style={{ fontSize: 13, color: theme.colors.text.tertiary, marginTop: 10, lineHeight: 18 }}>{s.footnote}</Text>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
