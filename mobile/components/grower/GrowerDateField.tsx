import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown } from 'lucide-react-native';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { theme } from '../../lib/theme';
import { formatYmdForDisplay, parseYmd, toYmd } from '../../lib/date-ymd';

type Props = {
  value: string;
  onChange: (ymd: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
};

/**
 * Farmer-friendly date: tap to open calendar (iOS inline grid; Android calendar dialog).
 * Value is always `YYYY-MM-DD` for API payloads.
 */
export function GrowerDateField({ value, onChange, minimumDate, maximumDate, disabled = false }: Props) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [androidOpen, setAndroidOpen] = useState(false);

  const pickerDate = parseYmd(value);
  const display = formatYmdForDisplay(value, i18n.language) || t('producer.dateField.placeholder');

  const applyDate = (selected?: Date) => {
    if (!selected) return;
    onChange(toYmd(selected));
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setAndroidOpen(false);
      if (event.type === 'set' && selected) applyDate(selected);
      return;
    }
    if (selected) applyDate(selected);
  };

  const openPicker = () => {
    if (disabled) return;
    if (Platform.OS === 'android') {
      setAndroidOpen(true);
      return;
    }
    setExpanded((prev) => !prev);
  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        onPress={openPicker}
        activeOpacity={0.72}
        disabled={disabled}
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        accessibilityRole="button"
        accessibilityLabel={t('producer.dateField.a11y', { date: display })}
        accessibilityHint={t('producer.dateField.hint')}
      >
        <Calendar size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
        <Text style={[styles.triggerText, !value.trim() && styles.placeholder]} numberOfLines={2}>
          {display}
        </Text>
        <ChevronDown
          size={20}
          color={enterpriseColors.gray600}
          strokeWidth={1.5}
          style={expanded ? styles.chevronUp : undefined}
        />
      </TouchableOpacity>

      {Platform.OS === 'ios' && expanded ? (
        <View style={styles.iosPickerBox}>
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="inline"
            onChange={onPickerChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            locale={i18n.language?.startsWith('sr') ? 'sr-Latn' : 'en-US'}
            themeVariant="light"
            style={styles.iosPicker}
          />
          <TouchableOpacity
            onPress={() => setExpanded(false)}
            style={styles.doneBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.ok')}
          >
            <Text style={styles.doneBtnText}>{t('common.ok')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {Platform.OS === 'android' && androidOpen ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="calendar"
          onChange={onPickerChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 46,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.12)',
    borderRadius: 12,
    backgroundColor: enterpriseColors.white,
  },
  triggerDisabled: {
    opacity: 0.55,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    color: enterpriseColors.gray900,
  },
  placeholder: {
    color: enterpriseColors.gray600,
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  iosPickerBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.12)',
    borderRadius: 14,
    backgroundColor: enterpriseColors.white,
    overflow: 'hidden',
  },
  iosPicker: {
    width: '100%',
  },
  doneBtn: {
    alignSelf: 'flex-end',
    marginHorizontal: 12,
    marginBottom: 10,
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: enterpriseColors.primary,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.white,
  },
});
