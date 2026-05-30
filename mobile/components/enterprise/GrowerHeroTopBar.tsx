import type { ReactNode } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const LOGO = require('../../assets/logo-white.png');

type Props = {
  rightSlot?: ReactNode;
  onNotifications?: () => void;
};

/** Top bar on hero gradient — frosted logo + notifications. */
export function GrowerHeroTopBar({ rightSlot, onNotifications }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  const openNotifications = () => {
    if (onNotifications) {
      onNotifications();
      return;
    }
    router.push('/(producer)/notifications');
  };

  return (
    <View style={styles.row}>
      <View style={styles.brand} accessibilityLabel={t('producer.brand.wordmarkA11y')}>
        <View style={styles.logoShell}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
        </View>
      </View>
      {rightSlot ?? (
        <Pressable
          onPress={openNotifications}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={t('producer.liveInfo.notifications')}
          hitSlop={10}
        >
          <Bell size={21} color="#FFFFFF" strokeWidth={1.85} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoShell: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 30,
    height: 30,
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
  },
});
