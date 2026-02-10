import { View, Text } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import type { Transaction } from './useWalletData';

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isCredit = transaction.type === 'CREDIT';

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isCredit
            ? `${theme.colors.success}15`
            : `${theme.colors.error}15`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: theme.spacing.md,
        }}
      >
        {isCredit ? (
          <ArrowDownLeft size={20} color={theme.colors.success} strokeWidth={1.5} />
        ) : (
          <ArrowUpRight size={20} color={theme.colors.error} strokeWidth={1.5} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xs,
            letterSpacing: 0.3,
          }}
        >
          {transaction.description}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}
        >
          <Calendar size={12} color={theme.colors.text.secondary} strokeWidth={1} />
          <Text
            style={{
              fontSize: 9,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              letterSpacing: 0.2,
            }}
          >
            {new Date(transaction.createdAt).toLocaleDateString('sr-RS')}
          </Text>
        </View>
      </View>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '300',
          color: isCredit ? theme.colors.success : theme.colors.error,
          letterSpacing: 0.3,
        }}
      >
        {isCredit ? '+' : '-'}
        {transaction.amount.toLocaleString('de-DE', {
          style: 'currency',
          currency: 'EUR',
        })}
      </Text>
    </View>
  );
}
