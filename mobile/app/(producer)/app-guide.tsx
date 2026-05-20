import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronRight, FileDown, Globe } from 'lucide-react-native';
import { BioVeraSubpageHeader } from '../../components/BioVeraSubpageHeader';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { growerUi } from '../../lib/grower-ui';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { theme } from '../../lib/theme';
import { growerMobileAppGuidePdfUrl, growerMobileAppGuideWebUrl } from '../../lib/app-guide-urls';

type FaqItem = { title: string; body: string };

function parseFaq(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (row): row is FaqItem =>
      row !== null &&
      typeof row === 'object' &&
      typeof (row as FaqItem).title === 'string' &&
      typeof (row as FaqItem).body === 'string',
  );
}

export default function AppGuideScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const faq = parseFaq(t('producer.appGuide.faqItems', { returnObjects: true }));

  const openUrl = (url: string) => {
    void Linking.openURL(url).catch(() => {
      // non-fatal
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: enterpriseColors.canvas }}>
      <BioVeraSubpageHeader title={t('producer.appGuide.screenTitle')} left="back" />
      <ScrollView
        contentContainerStyle={{
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          paddingTop: theme.spacing.md,
          gap: theme.spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={growerUi.card}>
          <View style={styles.heroRow}>
            <BookOpen size={22} color={enterpriseColors.primary} strokeWidth={1.5} />
            <Text style={styles.heroTitle}>{t('producer.appGuide.heroTitle')}</Text>
          </View>
          <Text style={styles.heroBody}>{t('producer.appGuide.heroBody')}</Text>
          <TouchableOpacity
            onPress={() => openUrl(growerMobileAppGuideWebUrl())}
            style={styles.primaryBtn}
            accessibilityRole="link"
          >
            <Globe size={18} color={enterpriseColors.white} strokeWidth={1.5} />
            <Text style={styles.primaryBtnText}>{t('producer.appGuide.openOnline')}</Text>
            <ChevronRight size={18} color={enterpriseColors.white} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openUrl(growerMobileAppGuidePdfUrl())}
            style={styles.secondaryBtn}
            accessibilityRole="link"
          >
            <FileDown size={18} color={enterpriseColors.primary} strokeWidth={1.5} />
            <Text style={styles.secondaryBtnText}>{t('producer.appGuide.downloadPdf')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={growerUi.sectionLabel}>{t('producer.appGuide.faqTitle')}</Text>
        {faq.map((item) => (
          <View key={item.title} style={styles.faqCard}>
            <Text style={styles.faqTitle}>{item.title}</Text>
            <Text style={styles.faqBody}>{item.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: enterpriseColors.gray900,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 21,
    color: enterpriseColors.gray600,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    minHeight: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: enterpriseColors.primary,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.white,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    minHeight: 48,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.primary,
  },
  faqCard: {
    ...growerUi.card,
    padding: 16,
  },
  faqTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    marginBottom: 8,
  },
  faqBody: {
    fontSize: 14,
    lineHeight: 20,
    color: enterpriseColors.gray600,
  },
});
