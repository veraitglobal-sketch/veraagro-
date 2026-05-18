import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps, type ViewStyle } from 'react-native';
import { enterpriseUi } from '../../lib/enterprise-ui';
import { theme } from '../../lib/theme';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  containerStyle?: ViewStyle;
};

export default function AuthTextField({
  label,
  hint,
  containerStyle,
  onFocus,
  onBlur,
  style,
  placeholderTextColor = theme.colors.text.tertiary,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={enterpriseUi.authLabel}>{label}</Text>
      {hint ? <Text style={enterpriseUi.authHint}>{hint}</Text> : null}
      <View style={[enterpriseUi.authInput, focused && enterpriseUi.authInputFocused]}>
        <TextInput
          {...rest}
          placeholderTextColor={placeholderTextColor}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, style]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 14,
  },
  input: {
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 48,
  },
});
