import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { EnterpriseTextField } from '../../../design-system';

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
    <View style={styles.root}>
      <Text style={styles.heading}>{t('producer.plotMapper.dimensionsHeading')}</Text>
      <View style={styles.row}>
        <EnterpriseTextField
          label={t('producer.plotMapper.length')}
          value={length}
          onChangeText={onLengthChange}
          placeholder="150"
          keyboardType="decimal-pad"
          containerStyle={styles.field}
        />
        <EnterpriseTextField
          label={t('producer.plotMapper.width')}
          value={width}
          onChangeText={onWidthChange}
          placeholder="80"
          keyboardType="decimal-pad"
          containerStyle={styles.field}
        />
      </View>
      {totalArea > 0 ? (
        <Text style={styles.areaText}>
          {t('producer.plotMapper.totalArea')}: {totalArea.toLocaleString(dateLocale)} m²
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    marginBottom: 0,
  },
  areaText: {
    marginTop: 8,
    fontSize: 14,
  },
});
