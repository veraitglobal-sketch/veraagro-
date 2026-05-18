import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { CloudUpload, ChevronRight } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { tString } from '../../../lib/i18n-strings';

export interface SyncQueueStripProps {
  pendingCount: number;
  legacyFieldLogCount?: number;
  syncing: boolean;
  lastError: string | null;
  onOpenFieldLog: () => void;
  onSyncNow: () => void;
  /** Permanently remove unsent rows from this device (no server upload). */
  onClearLocalQueue?: () => void;
  onPurgeLegacyFieldLog?: () => void;
  /** Tighter layout for producer home (less vertical space). */
  compact?: boolean;
  /**
   * Hide the secondary “open field log” CTA — e.g. when the home NextStepCard already shows the same action.
   */
  hideOpenLogCta?: boolean;
}

/** Older builds stored raw i18n keys in AsyncStorage — normalize for display. */
function humanizeStoredSyncError(
  lastError: string | null,
  pendingCount: number,
  t: TFunction,
): string | null {
  if (!lastError) return null;
  const trimmed = lastError.trim();
  if (trimmed === 'producer.sync.itemsNotSent' || /^producer\.sync\.itemsNotSent\b/.test(trimmed)) {
    const c = Math.max(1, pendingCount);
    return tString(t, 'producer.sync.itemsNotSent', { count: c });
  }
  return trimmed;
}

export default function SyncQueueStrip({
  pendingCount,
  legacyFieldLogCount = 0,
  syncing,
  lastError,
  onOpenFieldLog,
  onSyncNow,
  onClearLocalQueue,
  onPurgeLegacyFieldLog,
  compact = false,
  hideOpenLogCta = false,
}: SyncQueueStripProps) {
  const { t } = useTranslation();

  const show = pendingCount > 0 || legacyFieldLogCount > 0 || syncing || Boolean(lastError);
  if (!show) return null;

  const padV = compact ? 6 : theme.spacing.sm;
  const hintInCard = !compact && Boolean(lastError);
  const errorDisplay = humanizeStoredSyncError(lastError, pendingCount, t);

  if (compact) {
    return (
      <View
        style={{
          borderRadius: theme.borderRadius.md,
          borderWidth: 1,
          borderColor: pendingCount > 0 ? '#b45309' : theme.colors.border,
          backgroundColor: pendingCount > 0 ? 'rgba(180, 83, 9, 0.08)' : theme.colors.surfaceElevated,
          paddingVertical: padV,
          paddingHorizontal: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <CloudUpload size={16} color={pendingCount > 0 ? '#b45309' : theme.colors.text.secondary} strokeWidth={1.75} />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginLeft: 8,
              flex: 1,
            }}
            numberOfLines={2}
          >
            {t('producer.dashboard.syncStrip.title')}
            {pendingCount > 0
              ? ` · ${tString(t, 'producer.dashboard.syncStrip.pendingLine', { count: pendingCount })}`
              : ''}
          </Text>
          {syncing ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
        </View>

        {errorDisplay ? (
          <>
            <Text
              style={{
                fontSize: 12,
                color: '#b91c1c',
                lineHeight: 16,
                marginBottom: 4,
              }}
              numberOfLines={2}
            >
              {t('producer.dashboard.syncStrip.errorLine')}: {errorDisplay}
            </Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  t('producer.dashboard.syncStrip.helpWhyTitle'),
                  t('producer.sync.itemsNotSentHint'),
                  [{ text: t('alerts.ok') }],
                )
              }
              style={{ marginBottom: 8, alignSelf: 'flex-start' }}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 8 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary }}>
                {t('producer.dashboard.syncStrip.helpWhy')}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={onSyncNow}
            disabled={syncing}
            activeOpacity={0.8}
            style={{
              flex: hideOpenLogCta ? 1 : undefined,
              flexGrow: 1,
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.md,
              paddingVertical: 10,
              paddingHorizontal: 10,
              minHeight: 40,
              opacity: syncing ? 0.65 : 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text.inverse }} numberOfLines={1}>
              {t('producer.dashboard.syncStrip.syncNow')}
            </Text>
          </TouchableOpacity>
          {!hideOpenLogCta ? (
            <TouchableOpacity
              onPress={onOpenFieldLog}
              activeOpacity={0.75}
              style={{
                flex: 1,
                borderRadius: theme.borderRadius.md,
                paddingVertical: 10,
                paddingHorizontal: 10,
                minHeight: 40,
                borderWidth: 1,
                borderColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primary }} numberOfLines={1}>
                {t('producer.dashboard.syncStrip.openLog')}
              </Text>
              <ChevronRight size={16} color={theme.colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          ) : null}
        </View>
        {legacyFieldLogCount > 0 && onPurgeLegacyFieldLog ? (
          <TouchableOpacity
            onPress={onPurgeLegacyFieldLog}
            disabled={syncing}
            activeOpacity={0.75}
            style={{ marginTop: 8, alignSelf: 'flex-start', opacity: syncing ? 0.5 : 1 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.error }}>
              {t('producer.sync.purgeLegacyOnly')} ({legacyFieldLogCount})
            </Text>
          </TouchableOpacity>
        ) : null}
        {onClearLocalQueue && (pendingCount > 0 || errorDisplay) ? (
          <TouchableOpacity
            onPress={onClearLocalQueue}
            disabled={syncing}
            activeOpacity={0.75}
            style={{ marginTop: 8, alignSelf: 'flex-start', opacity: syncing ? 0.5 : 1 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.error }}>
              {t('producer.sync.clearLocalQueue')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={{
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: pendingCount > 0 ? '#b45309' : theme.colors.border,
        backgroundColor: pendingCount > 0 ? 'rgba(180, 83, 9, 0.08)' : theme.colors.surfaceElevated,
        paddingVertical: padV,
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <CloudUpload size={18} color={pendingCount > 0 ? '#b45309' : theme.colors.text.secondary} strokeWidth={1.75} />
        <Text
          style={{
            fontSize: 14,
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
        <Text style={{ fontSize: 13, color: theme.colors.text.secondary, lineHeight: 18, marginBottom: theme.spacing.sm }}>
          {tString(t, 'producer.dashboard.syncStrip.pendingLine', { count: pendingCount })}
        </Text>
      ) : null}

      {errorDisplay ? (
        <>
          <Text
            style={{
              fontSize: 13,
              color: '#b91c1c',
              lineHeight: 18,
              marginBottom: 6,
            }}
            numberOfLines={4}
          >
            {t('producer.dashboard.syncStrip.errorLine')}: {errorDisplay}
          </Text>
          {hintInCard ? (
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text.secondary,
                lineHeight: 17,
                marginBottom: theme.spacing.sm,
              }}
            >
              {t('producer.sync.itemsNotSentHint')}
            </Text>
          ) : null}
        </>
      ) : null}

      <TouchableOpacity
        onPress={onSyncNow}
        disabled={syncing}
        activeOpacity={0.8}
        style={{
          backgroundColor: theme.colors.primary,
          borderRadius: theme.borderRadius.md,
          paddingVertical: 12,
          paddingHorizontal: 14,
          minHeight: 44,
          opacity: syncing ? 0.65 : 1,
          marginBottom: hideOpenLogCta ? 0 : theme.spacing.xs,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text.inverse }}>
          {t('producer.dashboard.syncStrip.syncNow')}
        </Text>
      </TouchableOpacity>

      {!hideOpenLogCta ? (
        <TouchableOpacity
          onPress={onOpenFieldLog}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 8,
            minHeight: 40,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.primary }}>
            {t('producer.dashboard.syncStrip.openLog')}
          </Text>
          <ChevronRight size={18} color={theme.colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      ) : null}

      {legacyFieldLogCount > 0 && onPurgeLegacyFieldLog ? (
        <TouchableOpacity
          onPress={onPurgeLegacyFieldLog}
          disabled={syncing}
          activeOpacity={0.75}
          style={{ paddingVertical: 8, minHeight: 40, opacity: syncing ? 0.5 : 1 }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.error }}>
            {t('producer.sync.purgeLegacyOnly')} ({legacyFieldLogCount})
          </Text>
        </TouchableOpacity>
      ) : null}

      {onClearLocalQueue && (pendingCount > 0 || errorDisplay) ? (
        <TouchableOpacity
          onPress={onClearLocalQueue}
          disabled={syncing}
          activeOpacity={0.75}
          style={{ paddingVertical: 8, minHeight: 40, opacity: syncing ? 0.5 : 1 }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.error }}>
            {t('producer.sync.clearLocalQueue')}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
