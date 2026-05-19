import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Video, Scale, HeartHandshake, BookMarked, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { HubNavTile, HubSectionTitle } from '../hubs/HubNavTile';

type EducationTopic = {
  key: string;
  icon: LucideIcon;
  title: string;
  intro: string;
  bullets: string[];
};

export default function GrowerEducationScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const [detail, setDetail] = useState<EducationTopic | null>(null);

  const topics = useMemo((): EducationTopic[] => {
    return [
      {
        key: 'video',
        icon: Video,
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
        icon: Scale,
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
        icon: HeartHandshake,
        title: t('producer.education.ethicsSectionTitle'),
        intro: t('producer.education.ethicsSectionIntro'),
        bullets: [t('producer.education.ethicsBullet1'), t('producer.education.ethicsBullet2')],
      },
      {
        key: 'more',
        icon: BookMarked,
        title: t('producer.education.moreSectionTitle'),
        intro: t('producer.education.moreSectionIntro'),
        bullets: [t('producer.education.moreBullet1'), t('producer.education.moreBullet2')],
      },
    ];
  }, [t]);

  return (
    <View style={growerUi.canvas}>
      <BioVeraSubpageHeader title={t('producer.education.screenTitle')} left="back" />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          growerUi.scrollContent,
          { paddingBottom: Math.max(p.bottomInset, 24) },
        ]}
      >
        <Text style={[growerUi.pageLead, { marginTop: 0 }]}>{t('producer.education.pageLeadOneLine')}</Text>
        <Text style={styles.comingSoon}>{t('producer.education.comingSoonShort')}</Text>

        <HubSectionTitle>{t('producer.education.topicsTitle')}</HubSectionTitle>
        {topics.map((topic) => (
          <HubNavTile
            key={topic.key}
            title={topic.title}
            description={topic.intro}
            icon={topic.icon}
            onPress={() => setDetail(topic)}
          />
        ))}

        <Text style={styles.footer}>{t('producer.education.footerNoteShort')}</Text>
      </ScrollView>

      <Modal visible={detail != null} animationType="slide" transparent presentationStyle="pageSheet">
        <Pressable style={styles.modalBackdrop} onPress={() => setDetail(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {detail?.title}
              </Text>
              <TouchableOpacity onPress={() => setDetail(null)} hitSlop={12} accessibilityRole="button">
                <X size={24} color={enterpriseColors.gray600} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {detail ? (
              <ScrollView
                style={{ maxHeight: 420 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                <Text style={styles.modalIntro}>{detail.intro}</Text>
                {detail.bullets.map((line) => (
                  <View key={line.slice(0, 48)} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{line}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  comingSoon: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    lineHeight: 20,
    marginBottom: 4,
  },
  footer: {
    fontSize: 12,
    color: enterpriseColors.gray600,
    lineHeight: 18,
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: enterpriseColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '78%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: enterpriseColors.gray900,
    lineHeight: 26,
  },
  modalIntro: {
    fontSize: 15,
    color: enterpriseColors.gray600,
    lineHeight: 22,
    marginBottom: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: enterpriseColors.primary,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: enterpriseColors.gray900,
    lineHeight: 22,
  },
});
