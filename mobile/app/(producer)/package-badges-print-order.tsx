import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { GrowerStackHeader } from '../../components/grower/GrowerStackHeader';
import { EnterpriseScreen } from '../../components/enterprise/EnterpriseScreen';
import { enterpriseUi } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';

/**
 * Print orders and returns are managed in the material supplier account (web).
 */
export default function PackageBadgesPrintOrderInfoScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();

  return (
    <EnterpriseScreen
      contentPaddingBottom={Math.max(p.bottomInset, 24)}
      header={
        <GrowerStackHeader title={t('producer.packageBadges.printOrderInfoTitle')} />
      }
    >
      <View style={growerUi.scrollContent}>
        <View style={enterpriseUi.authPanel}>
          <Text style={enterpriseUi.inAppLead}>{t('producer.packageBadges.printOrderInfoBody')}</Text>
        </View>
      </View>
    </EnterpriseScreen>
  );
}
