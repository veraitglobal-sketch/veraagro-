import React from 'react';
import { View, Text } from 'react-native';
import SyncStatus from '../../../components/SyncStatus';
import { theme } from '../../../lib/theme';

interface DashboardHeaderProps {
  farmName: string;
  partnerCode?: string;
  connected: boolean;
}

export default function DashboardHeader({ farmName, partnerCode, connected }: DashboardHeaderProps) {
  return (
    <View
      style={{
        paddingTop: 60,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '300', color: theme.colors.text.primary, letterSpacing: 1 }}>
            {farmName}
          </Text>
          {partnerCode && (
            <Text style={{ fontSize: 13, fontWeight: '300', color: theme.colors.text.secondary, marginTop: 4, letterSpacing: 0.3 }}>
              Partner: {partnerCode}
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
