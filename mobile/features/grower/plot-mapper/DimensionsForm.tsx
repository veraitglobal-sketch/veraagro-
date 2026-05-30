import { View, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../lib/theme';
import { useAppLocaleTag } from '../../../lib/date-locale';

interface DimensionsFormProps {
  length: string;
  width: string;
  totalArea: number;
  onLengthChange: (v: string) => void;
  onWidthChange: (v: string) => void;
}

export function DimensionsForm({
  length,
  width,
  totalArea,
  onLengthChange,
  onWidthChange,
}: DimensionsFormProps) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '400',
          color: theme.colors.text.primary,
          marginBottom: 12,
          letterSpacing: 0.3,
        }}
      >
        {t('producer.plotMapper.dimensionsHeading')}
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              marginBottom: 6,
            }}
          >
            {t('producer.plotMapper.length')}
          </Text>
          <TextInput
            value={length}
            onChangeText={onLengthChange}
            placeholder="150"
            keyboardType="decimal-pad"
            style={{
              padding: 12,
              borderWidth: 0.5,
              borderColor: theme.colors.border,
              borderRadius: 6,
              backgroundColor: theme.colors.surface,
              fontSize: 13,
              fontWeight: '400',
              color: theme.colors.text.primary,
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              marginBottom: 6,
            }}
          >
            {t('producer.plotMapper.width')}
          </Text>
          <TextInput
            value={width}
            onChangeText={onWidthChange}
            placeholder="80"
            keyboardType="decimal-pad"
            style={{
              padding: 12,
              borderWidth: 0.5,
              borderColor: theme.colors.border,
              borderRadius: 6,
              backgroundColor: theme.colors.surface,
              fontSize: 13,
              fontWeight: '400',
              color: theme.colors.text.primary,
            }}
          />
        </View>
      </View>
      {totalArea > 0 && (
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            fontWeight: '400',
            color: theme.colors.text.secondary,
          }}
        >
          {t('producer.plotMapper.totalArea')}: {totalArea.toLocaleString(dateLocale)} m²
        </Text>
      )}
    </View>
  );
}
