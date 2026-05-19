/**
 * Step 1: Manual – Packaging instructions
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FileText, Check } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';

interface Props {
  onViewed: () => void;
}

export default function StepInstructions({ onViewed }: Props) {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
      <View style={[enterpriseUi.inAppPanel, styles.card]}>
        <View style={styles.iconWell}>
          <FileText size={28} color={enterpriseColors.primary} strokeWidth={1.5} />
        </View>
        <Text style={enterpriseUi.navRowTitle}>{t('packingFlow.step1.title')}</Text>
        <Text style={[enterpriseUi.navRowSubtitle, styles.subtitle]}>{t('packingFlow.step1.subtitle')}</Text>

        <View style={styles.list}>
          <Bullet text={t('packingFlow.step1.item1')} />
          <Bullet text={t('packingFlow.step1.item2')} />
          <Bullet text={t('packingFlow.step1.item3')} />
          <Bullet text={t('packingFlow.step1.item4')} />
        </View>

        <TouchableOpacity
          style={[enterpriseUi.authBtnPrimary, styles.confirmBtn]}
          onPress={onViewed}
          activeOpacity={0.88}
        >
          <Check size={20} color={enterpriseColors.white} strokeWidth={2} />
          <Text style={enterpriseUi.authBtnPrimaryText}>{t('packingFlow.step1.confirm')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingBottom: 24 },
  card: {
    padding: 20,
  },
  iconWell: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: enterpriseColors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
  },
  list: {
    marginBottom: 20,
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: enterpriseColors.primary,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: enterpriseColors.gray900,
    lineHeight: 23,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
  },
});
