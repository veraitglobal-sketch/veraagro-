import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Wallet } from 'lucide-react-native';
import { theme } from '../../../lib/theme';

interface WalletBalanceCardProps {
  availableBalance: number;
  pendingBalance: number;
}

export function WalletBalanceCard({
  availableBalance,
  pendingBalance,
}: WalletBalanceCardProps) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.lg,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        ...(theme.shadows?.md || {}),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}
      >
        <Wallet size={24} color={theme.colors.text.inverse} strokeWidth={1.5} />
        <Text
          style={{
            fontSize: 12,
            fontWeight: '300',
            color: 'rgba(255, 255, 255, 0.9)',
            marginLeft: theme.spacing.sm,
            letterSpacing: 0.5,
          }}
        >
          {t('producer.wallet.available')}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 36,
          fontWeight: '300',
          color: theme.colors.text.inverse,
          letterSpacing: 1,
          marginBottom: theme.spacing.xs,
        }}
      >
        {availableBalance != null
          ? availableBalance.toLocaleString('en-US', {
              style: 'currency',
              currency: 'EUR',
            })
          : '0,00 €'}
      </Text>
      {pendingBalance > 0 && (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '300',
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: 0.3,
          }}
        >
          {t('producer.wallet.pending')}:{' '}
          {pendingBalance.toLocaleString('en-US', {
            style: 'currency',
            currency: 'EUR',
          })}
        </Text>
      )}
    </View>
  );
}
