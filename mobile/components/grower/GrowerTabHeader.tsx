import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { growerStyles, growerUi } from '../../lib/grower-ui';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** In-screen tab header — matches welcome/home (white band on gray-50). */
export function GrowerTabHeader({ title, subtitle, right, style }: Props) {
  return (
    <View style={[growerStyles.headerBar, style]}>
      <View style={growerStyles.headerRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={growerUi.pageTitle} numberOfLines={2} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={growerUi.pageLead} numberOfLines={3}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={{ flexShrink: 0 }}>{right}</View> : null}
      </View>
    </View>
  );
}
