import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { EnterpriseSettingsGroup } from './enterprise/EnterpriseSettingsGroup';
import { enterpriseColors, enterpriseUi } from '../lib/enterprise-ui';
import { growerUi } from '../lib/grower-ui';
import {
  BOOK_CALL_ROLES,
  DEFAULT_CALENDLY_URL,
  type BookCallRole,
  bookCallRoleFromUserRoles,
  buildCalendlyLink,
  calendlyUrlForRole,
} from '../../shared/book-call';

const MOBILE_CALENDLY_URLS = {
  default: process.env.EXPO_PUBLIC_CALENDLY_URL || DEFAULT_CALENDLY_URL,
  buyer: process.env.EXPO_PUBLIC_CALENDLY_URL_BUYER,
  producer: process.env.EXPO_PUBLIC_CALENDLY_URL_PRODUCER,
  supplier: process.env.EXPO_PUBLIC_CALENDLY_URL_SUPPLIER,
  logistics: process.env.EXPO_PUBLIC_CALENDLY_URL_LOGISTICS,
};

/** Opens the prefilled Bio Vera Calendly page (same helper and wording as the web /book-a-call page). */
export function openBookCall(role: BookCallRole, opts: { name?: string | null; email?: string | null; language?: string; source: string }) {
  const baseUrl = calendlyUrlForRole(role, MOBILE_CALENDLY_URLS);
  if (!baseUrl) return;
  void Linking.openURL(
    buildCalendlyLink({ baseUrl, role, name: opts.name, email: opts.email, language: opts.language, sourcePage: opts.source, source: 'biovera-app' }),
  );
}

/** Settings / profile block: "Book a free call" with the role taken from the signed-in account. */
export function BookCallBlock() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const role: BookCallRole = bookCallRoleFromUserRoles(user?.roles) ?? 'other';
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : null;
  const email = (user as { email?: string | null } | null)?.email ?? null;

  return (
    <EnterpriseSettingsGroup
      title={t('bookCall.navCta')}
      icon={<CalendarDays size={20} color={enterpriseColors.primary} strokeWidth={1.5} />}
    >
      <Text style={[growerUi.settingsRowDesc, { marginBottom: 14 }]}>{t('bookCall.heroSubtitle')}</Text>
      <View style={{ gap: 8 }}>
        <Text style={growerUi.settingsRowDesc}>
          {t('bookCall.talkingAs')} {t(`bookCall.role.${BOOK_CALL_ROLES.includes(role) ? role : 'other'}`)}
        </Text>
        <TouchableOpacity
          onPress={() => openBookCall(role, { name, email, language: i18n.language, source: 'app-settings' })}
          activeOpacity={0.88}
          style={[enterpriseUi.authSubmit, { minHeight: 48, justifyContent: 'center' }]}
          accessibilityRole="link"
        >
          <Text style={[enterpriseUi.authSubmitText, { textAlign: 'center', width: '100%' }]}>{t('bookCall.navCta')}</Text>
        </TouchableOpacity>
      </View>
    </EnterpriseSettingsGroup>
  );
}
