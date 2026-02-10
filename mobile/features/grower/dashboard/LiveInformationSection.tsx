import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Truck, Package, Bell } from 'lucide-react-native';
import { theme } from '../../../lib/theme';

const rowStyle = {
  backgroundColor: theme.colors.surface,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.sm,
  borderWidth: 0.5,
  borderColor: 'rgba(0, 0, 0, 0.05)',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
};

export default function LiveInformationSection({
  activeMissionsCount,
  activeBatchesCount,
  unreadCount,
  onMissions,
  onBatches,
  onNotifications,
}: {
  activeMissionsCount: number;
  activeBatchesCount: number;
  unreadCount: number;
  onMissions: () => void;
  onBatches: () => void;
  onNotifications: () => void;
}) {
  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.text.primary, letterSpacing: 0.5, marginBottom: theme.spacing.md }}>
        Live Information
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        <TouchableOpacity onPress={onMissions} activeOpacity={0.7} style={rowStyle}>
          <View style={{ width: 40, height: 40, borderRadius: theme.borderRadius.sm, backgroundColor: `${theme.colors.accent}15`, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
            <Truck size={20} color={theme.colors.accent} strokeWidth={1} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '300', color: theme.colors.text.primary, marginBottom: 2 }}>Active Missions</Text>
            <Text style={{ fontSize: 9, fontWeight: '300', color: theme.colors.text.secondary }}>
              {activeMissionsCount === 0 ? 'No active missions' : `${activeMissionsCount} mission(s)`}
            </Text>
          </View>
          {activeMissionsCount > 0 && (
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: theme.colors.background, fontSize: 10, fontWeight: '300' }}>{activeMissionsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onBatches} activeOpacity={0.7} style={rowStyle}>
          <View style={{ width: 40, height: 40, borderRadius: theme.borderRadius.sm, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
            <Package size={20} color={theme.colors.primary} strokeWidth={1} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '300', color: theme.colors.text.primary, marginBottom: 2 }}>Active Batches</Text>
            <Text style={{ fontSize: 9, fontWeight: '300', color: theme.colors.text.secondary }}>
              {activeBatchesCount === 0 ? 'No active batches' : `${activeBatchesCount} batch(es)`}
            </Text>
          </View>
          {activeBatchesCount > 0 && (
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: theme.colors.background, fontSize: 10, fontWeight: '300' }}>{activeBatchesCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onNotifications} activeOpacity={0.7} style={rowStyle}>
          <View style={{ width: 40, height: 40, borderRadius: theme.borderRadius.sm, backgroundColor: `${theme.colors.warning}15`, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
            <Bell size={20} color={theme.colors.warning} strokeWidth={1} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '300', color: theme.colors.text.primary, marginBottom: 2 }}>Notifications</Text>
            <Text style={{ fontSize: 9, fontWeight: '300', color: theme.colors.text.secondary }}>
              {unreadCount === 0 ? 'All read' : `${unreadCount} unread`}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.warning, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: theme.colors.background, fontSize: 10, fontWeight: '300' }}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
