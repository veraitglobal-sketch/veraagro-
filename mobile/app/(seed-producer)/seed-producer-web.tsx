import { Linking, Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnterpriseButton } from '../../design-system';
import { GrowerStackHeader } from '../../components/grower/GrowerStackHeader';
import { growerUi } from '../../lib/grower-ui';
import { enterpriseColors } from '../../lib/enterprise-ui';

const WEB_PORTAL = 'https://biovera.app/seed-producer';

export default function SeedProducerWebNoticeScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={growerUi.canvas} edges={['bottom']}>
      <GrowerStackHeader title={t('seedProducerMobile.title')} />
      <View style={styles.body}>
        <Text style={styles.text}>{t('seedProducerMobile.body')}</Text>
        <EnterpriseButton
          label={t('seedProducerMobile.openWeb')}
          onPress={() => void Linking.openURL(WEB_PORTAL)}
          fullWidth
          size="large"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 16 },
  text: { fontSize: 16, lineHeight: 24, color: enterpriseColors.gray900 },
});
