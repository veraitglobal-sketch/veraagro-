import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Check, Clock } from 'lucide-react-native';
import { useCertificationsData, CertStatus } from './useCertificationsData';
import CertificatePhotoUpload from './CertificatePhotoUpload';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { EnterpriseNotice } from '../../../components/enterprise/EnterpriseNotice';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerStyles, growerUi } from '../../../lib/grower-ui';
import EmptyState from '../../../components/EmptyState';
import type { RequiredCert } from './useCertificationsData';

function statusPillStyle(status: CertStatus) {
  if (status === 'done') {
    return { bg: enterpriseColors.primaryTint, text: enterpriseColors.primary };
  }
  if (status === 'pending') {
    return { bg: enterpriseColors.gray100, text: enterpriseColors.gray700 };
  }
  return { bg: enterpriseColors.gray100, text: enterpriseColors.gray600 };
}

function CertRow({
  cert,
  status,
  onUpload,
  t,
}: {
  cert: RequiredCert;
  status: CertStatus;
  onUpload: () => void;
  t: (k: string) => string;
}) {
  const statusLabel = {
    not_done: t('producer.certifications.notDone'),
    pending: t('producer.certifications.pending'),
    done: t('producer.certifications.done'),
  };
  const tone = statusPillStyle(status);

  return (
    <View style={[enterpriseUi.inAppPanel, styles.card]}>
      <View style={styles.cardHeader}>
        <Text style={enterpriseUi.navRowTitle}>{cert.title}</Text>
        <View style={[growerStyles.statusPill, { backgroundColor: tone.bg }]}>
          {status === 'done' ? (
            <Check size={14} color={tone.text} strokeWidth={2} />
          ) : status === 'pending' ? (
            <Clock size={14} color={tone.text} strokeWidth={1.5} />
          ) : null}
          <Text style={[growerStyles.statusPillText, { color: tone.text }]}>{statusLabel[status]}</Text>
        </View>
      </View>
      {cert.description ? (
        <Text style={[enterpriseUi.navRowSubtitle, styles.cardDesc]}>{cert.description}</Text>
      ) : null}
      {status !== 'done' ? (
        <TouchableOpacity
          style={[enterpriseUi.authBtnPrimary, styles.uploadBtn]}
          onPress={onUpload}
          activeOpacity={0.88}
        >
          <Camera size={18} color={enterpriseColors.white} strokeWidth={1.5} />
          <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.certifications.sendPhoto')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function CertificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requiredCerts, pendingPhotos, loading, listRefreshing, loadError, load, getStatusForCert, addPhoto } =
    useCertificationsData();
  const [uploadingCert, setUploadingCert] = useState<RequiredCert | null>(null);

  const refreshList = useCallback(async () => {
    await load({ silent: true });
  }, [load]);

  const handleSavePhoto = useCallback(
    async (entry: Parameters<typeof addPhoto>[0]) => {
      await addPhoto(entry);
      setUploadingCert(null);
    },
    [addPhoto],
  );

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(producer)/(tabs)/profile');
    }
  };

  const pendingCount = pendingPhotos.filter((p) => p.status === 'pending').length;
  const listBottomPad = Math.max(insets.bottom, 12) + 58 + (pendingCount > 0 ? 56 : 16);

  if (uploadingCert) {
    return (
      <View style={growerUi.canvas}>
        <GrowerStackHeader title={uploadingCert.title} onBack={() => setUploadingCert(null)} />
        <CertificatePhotoUpload
          cert={uploadingCert}
          onSave={handleSavePhoto}
          onCancel={() => setUploadingCert(null)}
        />
      </View>
    );
  }

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader
        title={t('producer.tabs.certifications')}
        subtitle={t('producer.certifications.subtitle')}
        onBack={goBack}
      />
      <FlatList
        data={requiredCerts}
        keyExtractor={(item) => item.id}
        onRefresh={() => void refreshList()}
        refreshing={listRefreshing}
        style={styles.flex}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        ListHeaderComponent={
          <>
            {loading && !listRefreshing ? (
              <ActivityIndicator style={{ paddingVertical: 12 }} color={enterpriseColors.primary} />
            ) : null}
            {loadError ? (
              <View style={[growerUi.emptyCard, styles.errorCard]}>
                <Text style={enterpriseUi.navRowSubtitle}>{t('producer.certifications.loadError')}</Text>
                <TouchableOpacity
                  onPress={() => void load()}
                  style={styles.retryBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.retry')}
                >
                  <Text style={[enterpriseUi.navRowTitle, { color: enterpriseColors.primary }]}>
                    {t('producer.wallet.retry')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading && !loadError ? (
            <EmptyState message={t('producer.certifications.empty')} />
          ) : null
        }
        renderItem={({ item }) => (
          <CertRow
            cert={item}
            status={getStatusForCert(item.id)}
            onUpload={() => setUploadingCert(item)}
            t={t}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      {pendingCount > 0 ? (
        <View style={[styles.pendingWrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <EnterpriseNotice title={t('producer.certifications.photosPending', { count: pendingCount })} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  card: {
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardDesc: {
    marginTop: 6,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    marginTop: 14,
  },
  pendingWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
  },
  errorCard: {
    marginBottom: 10,
  },
  retryBtn: {
    marginTop: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
});
