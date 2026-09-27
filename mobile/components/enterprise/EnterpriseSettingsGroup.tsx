import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';

type GroupProps = {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
};

/** White settings panel — same surface as login form card. */
export function EnterpriseSettingsGroup({ title, icon, children }: GroupProps) {
  return (
    <View style={styles.group}>
      {title ? (
        <View style={styles.groupHead}>
          {icon}
          <Text style={growerUi.settingsGroupTitle}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

type ToggleRowProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  value: boolean;
  onValueChange: (v: boolean) => void;
};

export function EnterpriseSettingsToggleRow({
  title,
  description,
  icon,
  value,
  onValueChange,
}: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
      <View style={styles.toggleCopy}>
        <Text style={growerUi.settingsRowTitle}>{title}</Text>
        {description ? <Text style={growerUi.settingsRowDesc}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: enterpriseColors.gray200, true: enterpriseColors.primary }}
        thumbColor={enterpriseColors.white}
      />
    </View>
  );
}

type ButtonRowProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  disabled?: boolean;
};

export function EnterpriseSettingsButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: ButtonRowProps) {
  const btnStyle =
    variant === 'primary'
      ? growerUi.btnPrimary
      : variant === 'danger'
        ? styles.btnDanger
        : styles.btnOutline;
  const textStyle =
    variant === 'primary'
      ? growerUi.btnPrimaryText
      : variant === 'danger'
        ? styles.btnDangerText
        : styles.btnOutlineText;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.88}
      style={[btnStyle, styles.btnFull, disabled && styles.btnDisabled]}
      accessibilityRole="button"
    >
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

type LinkRowProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  onPress: () => void;
};

export function EnterpriseSettingsLinkRow({ title, description, icon, onPress }: LinkRowProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.linkRow} accessibilityRole="button">
      {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={growerUi.settingsRowTitle}>{title}</Text>
        {description ? <Text style={growerUi.settingsRowDesc}>{description}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  group: {
    ...growerUi.formPanel,
    marginBottom: 12,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconSlot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E8F1E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingVertical: 4,
  },
  toggleCopy: {
    flex: 1,
    minWidth: 0,
  },
  btnFull: {
    width: '100%',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnOutline: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnOutlineText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: enterpriseColors.primary,
  },
  btnDanger: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: enterpriseColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnDangerText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#B91C1C',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingVertical: 4,
  },
});
