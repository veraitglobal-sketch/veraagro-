import { View, StyleSheet } from 'react-native';
import { EnterpriseButton } from '../../design-system';

type Props = {
  loginLabel: string;
  registerLabel: string;
  onLogin: () => void;
  onRegister: () => void;
};

export default function WelcomeActions({ loginLabel, registerLabel, onLogin, onRegister }: Props) {
  return (
    <View style={styles.stack}>
      <EnterpriseButton label={loginLabel} onPress={onLogin} variant="primary" size="large" fullWidth />
      <EnterpriseButton
        label={registerLabel}
        onPress={onRegister}
        variant="outline"
        size="large"
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
});
