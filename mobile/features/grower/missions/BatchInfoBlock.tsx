import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import type { Mission } from '../../../lib/api';

interface BatchInfoBlockProps {
  mission: Mission;
}

export default function BatchInfoBlock({ mission }: BatchInfoBlockProps) {
  const { t } = useTranslation();
  if (!mission.batch) return null;
  const batch = mission.batch as { batchId?: string; productName?: string };
  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Package size={18} color={colors.text.primary} strokeWidth={1} />
        <Text
          style={{
            fontSize: 17,
            fontWeight: '300',
            color: colors.text.primary,
            marginLeft: theme.spacing.xs,
            letterSpacing: 0.3,
          }}
        >
          {t('producer.missionsCreate.batchLabel')}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '300',
          color: colors.text.secondary,
        }}
      >
        {batch.batchId || mission.batchId}
      </Text>
      {batch.productName && (
        <Text
          style={{
            fontSize: 16,
            fontWeight: '300',
            color: colors.text.secondary,
            marginTop: theme.spacing.xs,
          }}
        >
          {batch.productName}
        </Text>
      )}
    </View>
  );
}
