import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { CloudUpload } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { EnterpriseNotice } from '../../../components/enterprise/EnterpriseNotice';
import { tString } from '../../../lib/i18n-strings';

export interface SyncQueueStripProps {
  pendingCount: number;
  legacyFieldLogCount?: number;
  syncing: boolean;
  lastError: string | null;
  onOpenFieldLog: () => void;
  onSyncNow: () => void;
  onClearLocalQueue?: () => void;
  onPurgeLegacyFieldLog?: () => void;
  compact?: boolean;
  hideOpenLogCta?: boolean;
}

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

  const errorDisplay = humanizeStoredSyncError(lastError, pendingCount, t);
  const pendingLine =
    pendingCount > 0
      ? tString(t, 'producer.dashboard.syncStrip.pendingLine', { count: pendingCount })
      : '';

  if (compact) {
    return (
      <View style={[enterpriseUi.authPanel, { marginBottom: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: errorDisplay ? 8 : 10 }}>
          <CloudUpload size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
          <Text style={growerUi.settingsRowTitle} numberOfLines={2}>
            {t('producer.dashboard.syncStrip.title')}
            {pendingLine ? ` · ${pendingLine}` : ''}
          </Text>
          {syncing ? <ActivityIndicator size="small" color={enterpriseColors.primary} /> : null}
        </View>

        {errorDisplay ? (
          <Text style={[growerUi.settingsRowDesc, { color: enterpriseColors.destructive, marginBottom: 10 }]} numberOfLines={3}>
            {errorDisplay}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={onSyncNow}
            disabled={syncing}
            activeOpacity={0.88}
            style={[growerUi.btnPrimary, { flex: 1, opacity: syncing ? 0.65 : 1 }]}
          >
            <Text style={growerUi.btnPrimaryText}>{t('producer.dashboard.syncStrip.syncNow')}</Text>
          </TouchableOpacity>
          {!hideOpenLogCta ? (
            <TouchableOpacity
              onPress={onOpenFieldLog}
              activeOpacity={0.88}
              style={[enterpriseUi.buttonOutline, { flex: 1 }]}
            >
              <Text style={enterpriseUi.buttonOutlineText} numberOfLines={1}>
                {t('producer.tabs.fieldLog')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <EnterpriseNotice
      title={t('producer.dashboard.syncStrip.title')}
      body={
        [
          pendingLine,
          errorDisplay ? `${t('producer.dashboard.syncStrip.errorLine')}: ${errorDisplay}` : null,
        ]
          .filter(Boolean)
          .join('\n') || undefined
      }
      onPress={onSyncNow}
      actionLabel={syncing ? undefined : t('producer.dashboard.syncStrip.syncNow')}
    />
  );
}
