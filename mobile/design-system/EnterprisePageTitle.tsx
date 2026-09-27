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
  /** Stack-header scale (20pt) instead of page hero scale. */
  compact?: boolean;
};

export function EnterprisePageTitle({
  title,
  description,
  eyebrow,
  statusLine,
  right,
  style,
  compact = false,
}: Props) {
  return (
    <View style={[{ marginBottom: 20 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {eyebrow ? <Text style={dsTypography.eyebrow}>{eyebrow}</Text> : null}
          <Text style={[dsTypography.pageTitle, compact && COMPACT_TITLE, eyebrow ? { marginTop: 8 } : null]}>{title}</Text>
          {description ? <Text style={[dsTypography.pageLead, compact && COMPACT_LEAD]}>{description}</Text> : null}
          {statusLine ? <Text style={dsTypography.statusLine}>{statusLine}</Text> : null}
        </View>
        {right ? <View style={{ flexShrink: 0 }}>{right}</View> : null}
      </View>
    </View>
  );
}

const COMPACT_TITLE = { fontSize: 20, lineHeight: 25, letterSpacing: -0.45, color: '#111827' };
const COMPACT_LEAD = { fontSize: 13, lineHeight: 18, marginTop: 2 };
