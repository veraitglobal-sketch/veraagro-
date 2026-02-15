import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Truck, Package, Bell } from 'lucide-react-native';
import { theme } from '../../../lib/theme';

const rowStyle = {
  backgroundColor: theme.colors.surfaceElevated,
  borderRadius: theme.borderRadius.lg,
  padding: theme.spacing.md,
  borderWidth: 1,
  borderColor: theme.colors.border,
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
  const { t } = useTranslation();
  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text style={{ fontSize: 12, fontWeight: '400', color: theme.colors.text.tertiary, letterSpacing: 1.2, marginBottom: theme.spacing.md, textTransform: 'uppercase' }}>
        {t('producer.liveInfo.title')}
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        <TouchableOpacity onPress={onMissions} activeOpacity={0.7} style={rowStyle}>
          <View style={{ width: 40, height: 40, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
            <Truck size={20} color={theme.colors.primary} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.text.primary, marginBottom: 2 }}>{t('producer.liveInfo.missions')}</Text>
            <Text style={{ fontSize: 11, fontWeight: '400', color: theme.colors.text.secondary }}>
              {activeMissionsCount === 0 ? t('producer.liveInfo.noMissions') : t('producer.liveInfo.missionsCount', { count: activeMissionsCount })}
            </Text>
          </View>
          {activeMissionsCount > 0 && (
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: theme.colors.background, fontSize: 10, fontWeight: '300' }}>{activeMissionsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onBatches} activeOpacity={0.7} style={rowStyle}>
          <View style={{ width: 40, height: 40, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
            <Package size={20} color={theme.colors.primary} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.text.primary, marginBottom: 2 }}>{t('producer.liveInfo.batches')}</Text>
            <Text style={{ fontSize: 11, fontWeight: '400', color: theme.colors.text.secondary }}>
              {activeBatchesCount === 0 ? t('producer.liveInfo.noBatches') : t('producer.liveInfo.batchesCount', { count: activeBatchesCount })}
            </Text>
          </View>
          {activeBatchesCount > 0 && (
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: theme.colors.background, fontSize: 10, fontWeight: '300' }}>{activeBatchesCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onNotifications} activeOpacity={0.7} style={rowStyle}>
          <View style={{ width: 40, height: 40, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.warningLight, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
            <Bell size={20} color={theme.colors.warning} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.text.primary, marginBottom: 2 }}>{t('producer.liveInfo.notifications')}</Text>
            <Text style={{ fontSize: 11, fontWeight: '400', color: theme.colors.text.secondary }}>
              {unreadCount === 0 ? t('producer.liveInfo.allRead') : t('producer.liveInfo.unreadCount', { count: unreadCount })}
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
