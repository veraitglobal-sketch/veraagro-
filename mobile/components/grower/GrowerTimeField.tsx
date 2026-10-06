import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Clock, ChevronDown } from 'lucide-react-native';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { theme } from '../../lib/theme';

type Props = {
  value: string;
  onChange: (hhmm: string) => void;
  disabled?: boolean;
};

function parseTime(value: string): Date {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  const d = new Date();
  d.setSeconds(0, 0);
  if (!match) {
    d.setHours(8, 0, 0, 0);
    return d;
  }
  d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d;
}

function formatTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return '';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

/** Tap-to-pick local time (`HH:mm`) for field diary and weather forms. */
export function GrowerTimeField({ value, onChange, disabled = false }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [androidOpen, setAndroidOpen] = useState(false);
  const display = formatTime(value) || t('producer.timeField.placeholder');
  const pickerDate = parseTime(value);

  const applyTime = (selected?: Date) => {
    if (!selected) return;
    const hh = String(selected.getHours()).padStart(2, '0');
    const mm = String(selected.getMinutes()).padStart(2, '0');
    onChange(`${hh}:${mm}`);
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setAndroidOpen(false);
      if (event.type === 'set' && selected) applyTime(selected);
      return;
    }
    if (selected) applyTime(selected);
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
        accessibilityLabel={t('producer.timeField.a11y', { time: display })}
        accessibilityHint={t('producer.timeField.hint')}
      >
        <Clock size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
        <Text style={[styles.triggerText, !formatTime(value) && styles.placeholder]} numberOfLines={1}>
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
            mode="time"
            display="spinner"
            onChange={onPickerChange}
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
        <DateTimePicker value={pickerDate} mode="time" display="default" onChange={onPickerChange} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
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
  triggerDisabled: { opacity: 0.55 },
  triggerText: { flex: 1, fontSize: 15, color: enterpriseColors.gray900 },
  placeholder: { color: enterpriseColors.gray600 },
  chevronUp: { transform: [{ rotate: '180deg' }] },
  iosPickerBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.12)',
    borderRadius: 14,
    backgroundColor: enterpriseColors.white,
    overflow: 'hidden',
  },
  iosPicker: { width: '100%' },
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
  doneBtnText: { fontSize: 15, fontWeight: '600', color: enterpriseColors.white },
});
