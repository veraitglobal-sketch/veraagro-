import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';

/**
 * Print orders and returns are managed in the material supplier account (web).
 * Grower app shows an explanation only — no API calls here.
 */
export default function PackageBadgesPrintOrderInfoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useBioVeraScreenPadding();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={[
          styles.top,
          { paddingTop: insets.top + 8, paddingLeft: p.screenPaddingLeft, paddingRight: p.screenPaddingRight },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}
        >
          <ChevronLeft size={22} color={theme.colors.text.primary} />
          <Text style={{ color: theme.colors.text.secondary, fontSize: 16 }}>{t('common.back')}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Info size={22} color={theme.colors.primary} />
          <Text style={{ fontSize: 20, fontWeight: '600', color: theme.colors.text.primary, flex: 1 }} numberOfLines={3}>
            {t('producer.packageBadges.printOrderInfoTitle')}
          </Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: p.screenPaddingLeft,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        <Text style={styles.body}>{t('producer.packageBadges.printOrderInfoBody')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 12 },
  body: { fontSize: 17, color: theme.colors.text.secondary, lineHeight: 26 },
});
