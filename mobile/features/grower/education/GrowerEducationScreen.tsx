import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';

function BulletCard({
  title,
  intro,
  bullets,
}: {
  title: string;
  intro: string;
  bullets: string[];
}) {
  return (
    <View
      style={{
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary }}>{title}</Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '400',
          color: theme.colors.text.secondary,
          lineHeight: 20,
          marginTop: 4,
          marginBottom: theme.spacing.sm,
        }}
      >
        {intro}
      </Text>
      {bullets.map((line) => (
        <Text
          key={line.slice(0, 40)}
          style={{
            fontSize: 14,
            color: theme.colors.text.primary,
            lineHeight: 21,
            marginBottom: 4,
            paddingLeft: 12,
          }}
        >
          {'\u2022 '}
          {line}
        </Text>
      ))}
    </View>
  );
}

export default function GrowerEducationScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();

  const sections = [
    {
      key: 'video',
      title: t('producer.education.videoSectionTitle'),
      intro: t('producer.education.videoSectionIntro'),
      bullets: [
        t('producer.education.videoBullet1'),
        t('producer.education.videoBullet2'),
        t('producer.education.videoBullet3'),
      ],
    },
    {
      key: 'liability',
      title: t('producer.education.liabilitySectionTitle'),
      intro: t('producer.education.liabilitySectionIntro'),
      bullets: [
        t('producer.education.liabilityBullet1'),
        t('producer.education.liabilityBullet2'),
        t('producer.education.liabilityBullet3'),
      ],
    },
    {
      key: 'ethics',
      title: t('producer.education.ethicsSectionTitle'),
      intro: t('producer.education.ethicsSectionIntro'),
      bullets: [t('producer.education.ethicsBullet1'), t('producer.education.ethicsBullet2')],
    },
    {
      key: 'more',
      title: t('producer.education.moreSectionTitle'),
      intro: t('producer.education.moreSectionIntro'),
      bullets: [t('producer.education.moreBullet1'), t('producer.education.moreBullet2')],
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        paddingTop: theme.spacing.md,
        paddingHorizontal: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        paddingBottom: Math.max(p.bottomInset, theme.spacing.xl),
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: '300',
          color: theme.colors.text.primary,
          lineHeight: 22,
          marginBottom: theme.spacing.sm,
        }}
      >
        {t('producer.education.pageDescription')}
      </Text>

      <View
        style={{
          borderRadius: theme.borderRadius.md,
          borderWidth: 1,
          borderColor: 'rgba(180, 83, 9, 0.35)',
          backgroundColor: 'rgba(254, 252, 232, 0.95)',
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
        }}
      >
        <Text style={{ fontSize: 14, color: '#78350f', lineHeight: 20 }}>{t('producer.education.comingSoon')}</Text>
      </View>

      {sections.map((s) => (
        <BulletCard key={s.key} title={s.title} intro={s.intro} bullets={s.bullets} />
      ))}

      <Text style={{ fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 }}>
        {t('producer.education.footerNote')}
      </Text>
    </ScrollView>
  );
}
