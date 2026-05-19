import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, LogOut } from 'lucide-react-native';
import { EnterpriseScreen } from '../../components/enterprise/EnterpriseScreen';
import { TabRootBody } from '../../components/enterprise/TabRootBody';
import { EnterpriseNavSection } from '../../components/enterprise/EnterpriseNavSection';
import { GrowerTabHeader } from '../../components/grower/GrowerTabHeader';
import { LanguageSettingsBlock } from '../../components/LanguageSettingsBlock';
import { useAuth } from '../../hooks/useAuth';
import { partnerSignInHref } from '../../lib/post-login-redirect';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { theme } from '../../lib/theme';

export default function LogisticsProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();
  const p = useBioVeraScreenPadding();

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '—';

  return (
    <EnterpriseScreen
      fillViewport
      withTopWash
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 12}
      header={<GrowerTabHeader title={t('logistics.hub.profile')} subtitle={name} />}
    >
      <TabRootBody>
        <EnterpriseNavSection
          items={[
            {
              key: 'notifications',
              title: t('notificationsCenter.title'),
              icon: Bell,
              onPress: () => router.push('/(logistics)/notifications'),
            },
          ]}
        />
        <View style={{ marginTop: 16 }}>
          <LanguageSettingsBlock />
        </View>
        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace(partnerSignInHref() as Parameters<typeof router.replace>[0]);
          }}
          style={{
            marginTop: 24,
            minHeight: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(197, 48, 48, 0.35)',
            backgroundColor: 'rgba(197, 48, 48, 0.06)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          accessibilityRole="button"
        >
          <LogOut size={18} color={theme.colors.error} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, fontWeight: '500', color: theme.colors.error }}>{t('logistics.signOut')}</Text>
        </TouchableOpacity>
      </TabRootBody>
    </EnterpriseScreen>
  );
}
