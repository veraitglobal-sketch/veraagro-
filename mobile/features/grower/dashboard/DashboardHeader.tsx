import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SyncStatus from '../../../components/SyncStatus';
import { theme } from '../../../lib/theme';

interface DashboardHeaderProps {
  farmName: string;
  partnerCode?: string;
  connected: boolean;
}

export default function DashboardHeader({ farmName, partnerCode, connected }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '600', color: theme.colors.text.primary, letterSpacing: -0.2 }}>
            {farmName}
          </Text>
          {partnerCode && (
            <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginTop: 4, lineHeight: 20 }}>
              {t('producer.dashboard.partner')}: {partnerCode}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: connected ? theme.colors.primary : theme.colors.text.tertiary,
            }}
          />
          <SyncStatus />
        </View>
      </View>
    </View>
  );
}
