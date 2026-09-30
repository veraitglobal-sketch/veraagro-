import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnterpriseButton } from '../../design-system';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { seedsAPI } from '../../lib/api';
import { apiErrorMessage } from '../../lib/api-error';

type AuthUser = { id: string; roles?: string[] };

export default function UniversalSeedLinkScreen() {
  const { serial } = useLocalSearchParams<{ serial: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [verify, setVerify] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    (async () => {
      if (!serial) return;
      try {
        const raw = await AsyncStorage.getItem('auth_user');
        const user: AuthUser | null = raw ? JSON.parse(raw) : null;
        const roles = user?.roles || [];
        const isGrower = roles.some((r) => r === 'FARMER' || r === 'GROWER');
        if (isGrower && user?.id) {
          router.replace({ pathname: '/(producer)/planting-entry', params: { serial: String(serial) } });
          return;
        }
        if (roles.includes('MATERIAL_SUPPLIER')) {
          router.replace('/(supplier)/dashboard' as never);
          return;
        }
        const result = await seedsAPI.validate(String(serial));
        setVerify(result as Record<string, unknown>);
      } catch {
        setVerify({ error: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [serial, router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={enterpriseColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {verify?.origin ? (
          <>
            <Text style={styles.badge}>{t('seedScan.genuineTitle')}</Text>
            <Text style={styles.title}>{String((verify.origin as { product?: string }).product || '')}</Text>
          </>
        ) : (
          <Text style={styles.title}>{apiErrorMessage(verify, t('seedScan.notGenuine'))}</Text>
        )}
        <EnterpriseButton label={t('common.back')} onPress={() => router.back()} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f5f1' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  badge: { fontSize: 18, fontWeight: '700', color: enterpriseColors.primary, marginBottom: 8 },
  title: { fontSize: 16, color: enterpriseColors.gray900, marginBottom: 24 },
});
