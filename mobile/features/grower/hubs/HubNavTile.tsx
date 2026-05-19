import type { ComponentType } from 'react';
import { Text } from 'react-native';
import { EnterpriseListRow } from '../../../components/enterprise/EnterpriseListRow';
import { growerUi } from '../../../lib/grower-ui';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

export type HubNavTileProps = {
  title: string;
  description?: string;
  icon: ComponentType<IconProps>;
  onPress: () => void;
};

export function HubNavTile({ title, description, icon, onPress }: HubNavTileProps) {
  return <EnterpriseListRow title={title} description={description} icon={icon} onPress={onPress} />;
}

export function HubSectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={growerUi.sectionLabel}>{children}</Text>;
}
