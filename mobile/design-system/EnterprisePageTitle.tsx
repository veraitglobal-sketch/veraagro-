import type { ReactNode } from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { dsTypography } from './theme';

type Props = {
  title: string;
  description?: string;
  eyebrow?: string;
  statusLine?: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EnterprisePageTitle({
  title,
  description,
  eyebrow,
  statusLine,
  right,
  style,
}: Props) {
  return (
    <View style={[{ marginBottom: 20 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {eyebrow ? <Text style={dsTypography.eyebrow}>{eyebrow}</Text> : null}
          <Text style={[dsTypography.pageTitle, eyebrow ? { marginTop: 8 } : null]}>{title}</Text>
          {description ? <Text style={dsTypography.pageLead}>{description}</Text> : null}
          {statusLine ? <Text style={dsTypography.statusLine}>{statusLine}</Text> : null}
        </View>
        {right ? <View style={{ flexShrink: 0 }}>{right}</View> : null}
      </View>
    </View>
  );
}
