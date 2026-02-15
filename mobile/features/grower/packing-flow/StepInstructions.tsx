/**
 * Step 1: Manual – Packaging instructions
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FileText, Check } from 'lucide-react-native';
import { theme } from '../../../lib/theme';

interface Props {
  onViewed: () => void;
}

export default function StepInstructions({ onViewed }: Props) {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.card}>
        <FileText size={32} color={theme.colors.primary} style={styles.icon} />
        <Text style={styles.title}>{t('packingFlow.step1.title')}</Text>
        <Text style={styles.subtitle}>{t('packingFlow.step1.subtitle')}</Text>

        <View style={styles.list}>
          <Bullet text={t('packingFlow.step1.item1')} />
          <Bullet text={t('packingFlow.step1.item2')} />
          <Bullet text={t('packingFlow.step1.item3')} />
          <Bullet text={t('packingFlow.step1.item4')} />
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={onViewed}>
          <Check size={20} color="#fff" />
          <Text style={styles.confirmBtnText}>{t('packingFlow.step1.confirm')}</Text>
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
  inner: { paddingBottom: theme.spacing.xl },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  icon: { marginBottom: theme.spacing.md },
  title: { ...theme.typography.h3, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginBottom: theme.spacing.lg },
  list: { marginBottom: theme.spacing.lg, gap: theme.spacing.sm },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginTop: 8,
  },
  bulletText: { ...theme.typography.body, color: theme.colors.text.primary, flex: 1 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
