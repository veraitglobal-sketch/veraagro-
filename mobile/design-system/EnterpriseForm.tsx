import type { ReactNode } from 'react';
import { View } from 'react-native';
import { EnterprisePanel } from './EnterprisePanel';
import { EnterprisePageTitle } from './EnterprisePageTitle';
import { EnterpriseButton } from './EnterpriseButton';

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
  submitLabel: string;
  onSubmit: () => void;
  loading?: boolean;
  submitDisabled?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  footer?: ReactNode;
};

/** Standard grower form — panel + fields + primary CTA. */
export function EnterpriseForm({
  title,
  description,
  children,
  submitLabel,
  onSubmit,
  loading = false,
  submitDisabled = false,
  cancelLabel,
  onCancel,
  footer,
}: Props) {
  return (
    <View>
      {title ? (
        <EnterprisePageTitle title={title} description={description} style={{ marginBottom: 16 }} />
      ) : null}
      <EnterprisePanel padding="md">{children}</EnterprisePanel>
      <View style={{ marginTop: 16, gap: 10 }}>
        {cancelLabel && onCancel ? (
          <EnterpriseButton
            label={cancelLabel}
            onPress={onCancel}
            variant="secondary"
            fullWidth
            disabled={loading}
          />
        ) : null}
        <EnterpriseButton
          label={submitLabel}
          onPress={onSubmit}
          variant="primary"
          size="large"
          fullWidth
          loading={loading}
          disabled={submitDisabled}
        />
        {footer}
      </View>
    </View>
  );
}
