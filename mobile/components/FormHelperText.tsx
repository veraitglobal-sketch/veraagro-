import { Text, type StyleProp, type TextStyle } from 'react-native';
import { theme } from '../lib/theme';

type Props = {
  children: string;
  style?: StyleProp<TextStyle>;
};

/** Short hint below a form field — min 13px, readable in sunlight. */
export function FormHelperText({ children, style }: Props) {
  return (
    <Text
      style={[
        {
          fontSize: 13,
          fontWeight: '400',
          color: theme.colors.text.secondary,
          marginTop: 4,
          marginBottom: 8,
          lineHeight: 18,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
