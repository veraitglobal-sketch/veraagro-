import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CloudUpload, ChevronRight } from 'lucide-react-native';
import { theme } from '../../../lib/theme';

export interface SyncQueueStripProps {
  pendingCount: number;
  syncing: boolean;
  lastError: string | null;
  onOpenFieldLog: () => void;
  onSyncNow: () => void;
}

/** Always visible when queue or last error — same idea as web producer field-entry “Pending / Sync now”. */
export default function SyncQueueStrip({
  pendingCount,
  syncing,
  lastError,
  onOpenFieldLog,
  onSyncNow,
}: SyncQueueStripProps) {
  const { t } = useTranslation();

  const show = pendingCount > 0 || syncing || Boolean(lastError);
  if (!show) return null;

  return (
    <View
      style={{
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: pendingCount > 0 ? '#b45309' : theme.colors.border,
        backgroundColor: pendingCount > 0 ? 'rgba(180, 83, 9, 0.08)' : theme.colors.surfaceElevated,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
        <CloudUpload size={22} color={pendingCount > 0 ? '#b45309' : theme.colors.text.secondary} strokeWidth={1.75} />
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginLeft: theme.spacing.sm,
            flex: 1,
          }}
        >
          {t('producer.dashboard.syncStrip.title')}
        </Text>
        {syncing ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
      </View>

      {pendingCount > 0 ? (
        <Text style={{ fontSize: 15, color: theme.colors.text.secondary, lineHeight: 22, marginBottom: theme.spacing.sm }}>
          {t('producer.dashboard.syncStrip.pendingLine', { count: pendingCount })}
        </Text>
      ) : null}

      {lastError ? (
        <Text
          style={{
            fontSize: 14,
            color: '#b91c1c',
            lineHeight: 20,
            marginBottom: theme.spacing.sm,
          }}
          numberOfLines={3}
        >
          {t('producer.dashboard.syncStrip.errorLine')}: {lastError}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={onSyncNow}
        disabled={syncing}
        activeOpacity={0.8}
        style={{
          backgroundColor: theme.colors.primary,
          borderRadius: theme.borderRadius.md,
          paddingVertical: 15,
          paddingHorizontal: 16,
          minHeight: 48,
          opacity: syncing ? 0.65 : 1,
          marginBottom: theme.spacing.sm,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.inverse }}>
          {t('producer.dashboard.syncStrip.syncNow')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onOpenFieldLog}
        activeOpacity={0.75}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 10,
          minHeight: 44,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '500', color: theme.colors.primary }}>
          {t('producer.dashboard.syncStrip.openLog')}
        </Text>
        <ChevronRight size={20} color={theme.colors.primary} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}
