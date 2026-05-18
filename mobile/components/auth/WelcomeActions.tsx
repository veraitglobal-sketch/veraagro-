import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { enterpriseUi } from '../../lib/enterprise-ui';

type Props = {
  loginLabel: string;
  registerLabel: string;
  onLogin: () => void;
  onRegister: () => void;
};

/** Welcome CTAs — shared auth panel + Vera primary / secondary row. */
export default function WelcomeActions({ loginLabel, registerLabel, onLogin, onRegister }: Props) {
  return (
    <View style={[enterpriseUi.authPanel, styles.gap]}>
      <TouchableOpacity
        style={enterpriseUi.authBtnPrimary}
        activeOpacity={0.9}
        onPress={onLogin}
        accessibilityRole="button"
        accessibilityLabel={loginLabel}
      >
        <Text style={enterpriseUi.authBtnPrimaryText}>{loginLabel}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={enterpriseUi.authBtnSecondary}
        activeOpacity={0.82}
        onPress={onRegister}
        accessibilityRole="button"
        accessibilityLabel={registerLabel}
      >
        <Text style={enterpriseUi.authBtnSecondaryText} numberOfLines={2}>
          {registerLabel}
        </Text>
        <View style={enterpriseUi.authChevronWrap}>
          <ChevronRight size={20} color="#2D5A27" strokeWidth={2} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: {
    gap: 10,
  },
});
