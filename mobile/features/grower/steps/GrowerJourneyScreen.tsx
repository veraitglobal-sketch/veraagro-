import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { estatesAPI, parcelsAPI } from '../../../lib/api';
import { webGrowerHrefToMobilePath } from '../../../lib/grower-web-href-to-mobile';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { GrowerTabHeader } from '../../../components/grower/GrowerTabHeader';

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
  const p = useBioVeraScreenPadding();
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
        for (const parcel of parcels || []) {
          anyParcels = true;
          if (parcel.approvedAt) approved += 1;
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
      <View style={[growerUi.canvas, styles.centered]}>
        <ActivityIndicator size="large" color={enterpriseColors.primary} />
      </View>
    );
  }

  const stepsCount = journey.steps.length;

  return (
    <View style={growerUi.canvas}>
      <GrowerTabHeader
        title={t('producer.tabs.steps')}
        subtitle={t('grower.season.introRibbon', { count: stepsCount })}
      />
      <ScrollView
        contentContainerStyle={[growerUi.scrollContent, { paddingBottom: p.bottomInset + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={enterpriseColors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {showStatusBanner && loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={enterpriseColors.primary} />
          </View>
        ) : null}

        {showStatusBanner && !loading ? (
          <View style={styles.glanceCard}>
            <Text style={styles.glanceTitle}>{t('grower.season.glanceTitle')}</Text>
            <Text style={styles.glanceBody}>{glanceBody}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(producer)/estates')}
              activeOpacity={0.7}
              style={styles.glanceLink}
            >
              <Text style={styles.linkText}>
                {t('grower.season.linkMyFields')}
              </Text>
              <ChevronRight size={16} color={enterpriseColors.primary} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <BookOpen size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
            <Text style={styles.guideTitle}>{t('producer.appGuide.cardTitle')}</Text>
          </View>
          <Text style={styles.guideBody}>{t('producer.appGuide.cardBody')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/(producer)/app-guide')}
            activeOpacity={0.7}
            style={styles.glanceLink}
            accessibilityRole="button"
          >
            <Text style={styles.linkText}>{t('producer.appGuide.cardCta')}</Text>
            <ChevronRight size={16} color={enterpriseColors.primary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <Text style={growerUi.sectionLabel}>{journey.fullChainTitle}</Text>
        <View style={growerUi.card}>
          {journey.chainShort.map((row, idx) => (
            <View
              key={row.kicker}
              style={[styles.chainRow, idx < journey.chainShort.length - 1 && styles.chainRowBorder]}
            >
              <Text style={styles.chainKicker}>{row.kicker}</Text>
              <Text style={styles.chainText}>{row.text}</Text>
            </View>
          ))}
        </View>

        <Text style={growerUi.sectionLabel}>{journey.intro.myFieldsCta.title}</Text>
        <View style={growerUi.card}>
          <Text style={styles.cardBody}>{journey.intro.myFieldsCta.line}</Text>
          <TouchableOpacity
            onPress={() => openHref(journey.intro.myFieldsCta.webHref)}
            activeOpacity={0.7}
            style={styles.inlineLink}
            accessibilityRole="link"
          >
            <Text style={styles.linkText}>{journey.intro.myFieldsCta.linkLabel}</Text>
            <ChevronRight size={16} color={enterpriseColors.primary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <Text style={growerUi.sectionLabel}>{t('producer.tabs.steps')}</Text>
        {journey.steps.map((s, i) => (
          <View key={`${s.title}-${i}`} style={styles.stepCard}>
            <Text style={styles.stepKicker}>{t('grower.journey.stepNumber', { n: i + 1 })}</Text>
            <Text style={styles.stepTitle}>{s.title}</Text>
            {s.paragraphs?.map((para, j) => (
              <Text key={j} style={styles.stepPara}>
                {para}
              </Text>
            ))}
            {s.links?.length > 0 ? (
              <View style={styles.linksBlock}>
                {s.links.map((l) => {
                  const mobile = webGrowerHrefToMobilePath(l.href);
                  return mobile ? (
                    <TouchableOpacity
                      key={l.href + l.label}
                      onPress={() => openHref(l.href)}
                      activeOpacity={0.7}
                      style={styles.inlineLink}
                    >
                      <Text style={styles.linkText}>{l.label}</Text>
                      <ChevronRight size={16} color={enterpriseColors.primary} strokeWidth={1.5} />
                    </TouchableOpacity>
                  ) : (
                    <Text key={l.href + l.label} style={styles.mutedLink}>
                      {l.label}
                    </Text>
                  );
                })}
              </View>
            ) : null}
            {s.footnote ? <Text style={styles.footnote}>{s.footnote}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingRow: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  glanceCard: {
    ...growerUi.card,
    padding: 16,
    marginBottom: 4,
  },
  guideCard: {
    ...growerUi.card,
    padding: 16,
    marginBottom: 4,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
  },
  guideBody: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    lineHeight: 20,
    marginTop: 8,
  },
  glanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  glanceBody: {
    fontSize: 15,
    color: enterpriseColors.gray700,
    lineHeight: 22,
    marginTop: 8,
  },
  glanceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 2,
  },
  chainRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chainRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  chainKicker: {
    fontSize: 13,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    marginBottom: 4,
  },
  chainText: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    lineHeight: 20,
  },
  cardBody: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  inlineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 2,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.primary,
  },
  stepCard: {
    ...growerUi.card,
    padding: 16,
  },
  stepKicker: {
    fontSize: 14,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    marginTop: 6,
    letterSpacing: -0.2,
  },
  stepPara: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    marginTop: 8,
    lineHeight: 20,
  },
  linksBlock: {
    marginTop: 10,
    gap: 4,
  },
  mutedLink: {
    fontSize: 13,
    color: enterpriseColors.gray600,
    paddingVertical: 4,
  },
  footnote: {
    fontSize: 13,
    color: enterpriseColors.gray600,
    marginTop: 10,
    lineHeight: 18,
  },
});
