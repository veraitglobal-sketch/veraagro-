import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';

export type GrowerSelectOption = { id: string; label: string; subtitle?: string };

type Props = {
  label: string;
  placeholder: string;
  valueId: string;
  options: GrowerSelectOption[];
  onSelect: (id: string) => void;
  disabled?: boolean;
  hint?: string;
  /** Optional filter above list (e.g. crop search). */
  listSearchPlaceholder?: string;
  listSearchValue?: string;
  onListSearchChange?: (text: string) => void;
};

export function GrowerSelectField({
  label,
  placeholder,
  valueId,
  options,
  onSelect,
  disabled = false,
  hint,
  listSearchPlaceholder,
  listSearchValue,
  onListSearchChange,
}: Props) {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => options.find((o) => o.id === valueId), [options, valueId]);
  const display = selected?.label ?? placeholder;

  return (
    <View style={styles.wrap}>
      <Text style={enterpriseUi.inAppSectionLabel}>{label}</Text>
      <TouchableOpacity
        onPress={() => !disabled && options.length > 0 && setOpen(true)}
        activeOpacity={0.72}
        disabled={disabled || options.length === 0}
        style={[styles.trigger, (disabled || options.length === 0) && styles.triggerDisabled]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display}`}
      >
        <Text
          style={[styles.triggerText, !selected && styles.triggerPlaceholder]}
          numberOfLines={2}
        >
          {display}
        </Text>
        <ChevronDown size={20} color={enterpriseColors.gray600} strokeWidth={1.5} />
      </TouchableOpacity>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(p.bottomInset, 16) }]}>
            <View style={[styles.sheetHeader, { paddingHorizontal: p.screenPaddingLeft }]}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={12} accessibilityRole="button">
                <X size={22} color={enterpriseColors.gray600} />
              </TouchableOpacity>
            </View>
            {onListSearchChange && listSearchPlaceholder ? (
              <View style={{ paddingHorizontal: p.screenPaddingLeft, paddingBottom: 10 }}>
                <TextInput
                  style={growerUi.formInput}
                  value={listSearchValue ?? ''}
                  onChangeText={onListSearchChange}
                  placeholder={listSearchPlaceholder}
                  placeholderTextColor={enterpriseColors.gray600}
                />
              </View>
            ) : null}
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 420 }}
              contentContainerStyle={{
                paddingHorizontal: p.screenPaddingLeft,
                paddingRight: p.screenPaddingRight,
                paddingBottom: 8,
              }}
              renderItem={({ item }) => {
                const picked = item.id === valueId;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onSelect(item.id);
                      setOpen(false);
                    }}
                    activeOpacity={0.72}
                    style={[styles.row, picked && styles.rowPicked]}
                  >
                    <View style={styles.rowCopy}>
                      <Text style={[styles.rowText, picked && styles.rowTextPicked]} numberOfLines={3}>
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text style={styles.rowSubtitle} numberOfLines={2}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    {picked ? <Check size={20} color={enterpriseColors.primary} strokeWidth={2} /> : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={enterpriseUi.navRowSubtitle}>{t('common.noResults')}</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  triggerDisabled: {
    opacity: 0.55,
    backgroundColor: enterpriseColors.gray100,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    color: enterpriseColors.gray900,
    lineHeight: 22,
  },
  triggerPlaceholder: {
    color: enterpriseColors.gray600,
  },
  hint: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    marginTop: 6,
    lineHeight: 20,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: enterpriseColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '78%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  rowPicked: {
    backgroundColor: enterpriseColors.primaryTint,
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowText: {
    fontSize: 17,
    color: enterpriseColors.gray900,
    lineHeight: 23,
  },
  rowTextPicked: {
    fontWeight: '600',
    color: enterpriseColors.primary,
  },
  rowSubtitle: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    marginTop: 4,
    lineHeight: 19,
  },
});
