import { View, Text } from 'react-native';
import { Inbox, type LucideIcon } from 'lucide-react-native';
import { theme } from '../lib/theme';
import { useTranslation } from 'react-i18next';

type Props = {
  message?: string;
  icon?: LucideIcon;
};

export default function EmptyState({ message, icon: Icon = Inbox }: Props) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
      }}
    >
      <Icon size={48} color={theme.colors.text.tertiary} strokeWidth={1.25} />
      <Text
        style={{
          marginTop: 16,
          fontSize: 16,
          color: theme.colors.text.secondary,
          textAlign: 'center',
        }}
      >
        {message || t('common.noData')}
      </Text>
    </View>
  );
}
