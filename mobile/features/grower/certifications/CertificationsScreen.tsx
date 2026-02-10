import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Award, Camera, Check, Clock } from 'lucide-react-native';
import { useCertificationsData, CertStatus } from './useCertificationsData';
import CertificatePhotoUpload from './CertificatePhotoUpload';
import { theme } from '../../../lib/theme';
import type { RequiredCert } from './useCertificationsData';

const statusLabel: Record<CertStatus, string> = {
  not_done: 'Nije završeno',
  pending: 'Čeka potvrdu',
  done: 'Završeno',
};

function CertRow({
  cert,
  status,
  onUpload,
}: {
  cert: RequiredCert;
  status: CertStatus;
  onUpload: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{cert.title}</Text>
        <View style={[styles.badge, status === 'done' && styles.badgeDone, status === 'pending' && styles.badgePending]}>
          {status === 'done' ? (
            <Check size={14} color={theme.colors.text.inverse} strokeWidth={2} />
          ) : status === 'pending' ? (
            <Clock size={14} color={theme.colors.warning} strokeWidth={1} />
          ) : null}
          <Text style={[styles.badgeText, status === 'done' && styles.badgeTextDone, status === 'pending' && styles.badgeTextPending]}>
            {statusLabel[status]}
          </Text>
        </View>
      </View>
      {cert.description ? <Text style={styles.cardDesc}>{cert.description}</Text> : null}
      {status !== 'done' && (
        <TouchableOpacity style={styles.uploadBtn} onPress={onUpload}>
          <Camera size={18} color={theme.colors.primary} strokeWidth={1} />
          <Text style={styles.uploadBtnText}>Pošalji fotografiju sertifikata</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function CertificationsScreen() {
  const { requiredCerts, pendingPhotos, loading, load, getStatusForCert, addPhoto } = useCertificationsData();
  const [uploadingCert, setUploadingCert] = useState<RequiredCert | null>(null);

  const handleSavePhoto = useCallback(
    async (entry: Parameters<typeof addPhoto>[0]) => {
      await addPhoto(entry);
      setUploadingCert(null);
    },
    [addPhoto]
  );

  if (uploadingCert) {
    return (
      <View style={styles.container}>
        <CertificatePhotoUpload
          cert={uploadingCert}
          onSave={handleSavePhoto}
          onCancel={() => setUploadingCert(null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Award size={28} color={theme.colors.primary} strokeWidth={1.5} />
        <Text style={styles.title}>Sertifikacije</Text>
        <Text style={styles.subtitle}>Obavezni sertifikati – pošaljite foto, mi potvrdimo</Text>
      </View>

      <FlatList
        data={requiredCerts}
        keyExtractor={(item) => item.id}
        onRefresh={load}
        refreshing={loading}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CertRow
            cert={item}
            status={getStatusForCert(item.id)}
            onUpload={() => setUploadingCert(item)}
          />
        )}
      />

      {pendingPhotos.length > 0 && (
        <View style={styles.pendingBar}>
          <Text style={styles.pendingText}>
            {pendingPhotos.filter((p) => p.status === 'pending').length} foto čeka slanje. Povucite nadole na dashboardu da pošaljete.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.md },
  title: { ...theme.typography.h3, color: theme.colors.text.primary, marginTop: 8 },
  subtitle: { ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: 4 },
  list: { padding: theme.spacing.md, paddingBottom: 100 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, flex: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeDone: { backgroundColor: theme.colors.successLight, borderColor: theme.colors.success },
  badgePending: { backgroundColor: theme.colors.warningLight, borderColor: theme.colors.warning },
  badgeText: { fontSize: 12, color: theme.colors.text.secondary },
  badgeTextDone: { color: theme.colors.success },
  badgeTextPending: { color: theme.colors.warning },
  cardDesc: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 4 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  uploadBtnText: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
  pendingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.warningLight,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.warning,
  },
  pendingText: { fontSize: 13, color: theme.colors.warning, textAlign: 'center' },
});
