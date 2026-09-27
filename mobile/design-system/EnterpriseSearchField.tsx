import { View, TextInput, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Search } from 'lucide-react-native';
import { dsColors } from './theme';

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
};

/** iOS-style filled search bar with inline icon. */
export function EnterpriseSearchField({ value, onChangeText, placeholder, style }: Props) {
  return (
    <View style={[styles.box, style]}>
      <Search size={16} color={dsColors.gray600} strokeWidth={1.9} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={dsColors.gray600}
        accessibilityLabel={placeholder}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.06)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: dsColors.gray900,
    paddingVertical: 0,
  },
});
