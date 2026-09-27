import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import {
  dsColors,
  dsTypography,
  inputContainerStyle,
  inputHeight,
} from './theme';

export type EnterpriseFieldSize = 'default' | 'farmer';

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  size?: EnterpriseFieldSize;
  containerStyle?: StyleProp<ViewStyle>;
};

export function EnterpriseTextField({
  label,
  hint,
  error,
  required = false,
  size = 'default',
  containerStyle,
  editable = true,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error?.trim());
  const h = inputHeight(size);

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label ? (
        <Text style={dsTypography.fieldLabel}>
          {label}
          {required ? ' *' : ''}
        </Text>
      ) : null}
      <TextInput
        {...inputProps}
        editable={editable}
        placeholderTextColor={dsColors.muted}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
        style={[
          inputContainerStyle(focused, hasError),
          {
            minHeight: h,
            paddingVertical: size === 'farmer' ? 16 : 14,
            fontSize: size === 'farmer' ? 16 : 15,
            color: dsColors.gray900,
            opacity: editable ? 1 : 0.55,
          },
        ]}
      />
      {hasError ? (
        <Text style={dsTypography.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={dsTypography.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

type PasswordProps = Omit<Props, 'secureTextEntry'> & {
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
};

export function EnterprisePasswordField({
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password',
  ...props
}: PasswordProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[{ marginBottom: 16 }, props.containerStyle]}>
      {props.label ? (
        <Text style={dsTypography.fieldLabel}>
          {props.label}
          {props.required ? ' *' : ''}
        </Text>
      ) : null}
      <PasswordInputInner {...props} visible={visible} onToggle={() => setVisible((v) => !v)} showLabel={showPasswordLabel} hideLabel={hidePasswordLabel} />
      {props.error?.trim() ? (
        <Text style={dsTypography.fieldError}>{props.error}</Text>
      ) : props.hint ? (
        <Text style={dsTypography.fieldHint}>{props.hint}</Text>
      ) : null}
    </View>
  );
}

function PasswordInputInner({
  visible,
  onToggle,
  showLabel,
  hideLabel,
  size = 'default',
  editable = true,
  error,
  ...inputProps
}: Omit<PasswordProps, 'label' | 'hint' | 'containerStyle'> & {
  visible: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error?.trim());
  const h = inputHeight(size);

  return (
    <View style={[inputContainerStyle(focused, hasError), styles.passwordRow, { minHeight: h }]}>
      <TextInput
        {...inputProps}
        editable={editable}
        secureTextEntry={!visible}
        placeholderTextColor={dsColors.muted}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
        style={styles.passwordInput}
      />
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visible ? hideLabel : showLabel}
        style={styles.eyeBtn}
      >
        {visible ? (
          <EyeOff size={20} color={dsColors.muted} strokeWidth={1.75} />
        ) : (
          <Eye size={20} color={dsColors.muted} strokeWidth={1.75} />
        )}
      </Pressable>
    </View>
  );
}

const styles = {
  passwordRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: dsColors.gray900,
  },
  eyeBtn: {
    padding: 8,
  },
};

type TextAreaProps = Omit<Props, 'multiline'> & {
  minRows?: number;
  showCount?: boolean;
};

export function EnterpriseTextArea({
  minRows = 3,
  showCount = false,
  maxLength,
  value,
  size = 'default',
  ...rest
}: TextAreaProps) {
  const minHeight = Math.max(120, minRows * 24 + 28);
  const count = typeof value === 'string' ? value.length : 0;

  return (
    <View>
      <EnterpriseTextField
        {...rest}
        value={value}
        maxLength={maxLength}
        size={size}
        multiline
        textAlignVertical="top"
        containerStyle={{ marginBottom: showCount ? 4 : 16 }}
      />
      {showCount && maxLength ? (
        <Text
          style={[
            dsTypography.fieldHint,
            { textAlign: 'right', marginBottom: 16, marginTop: -8 },
          ]}
        >
          {count}/{maxLength}
        </Text>
      ) : null}
    </View>
  );
}
