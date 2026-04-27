import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { X, ScanLine } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { materialsAPI } from '../../../lib/api';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import type { MaterialFilterType } from './useMaterialsData';

const TYPE_VALUES: Array<Exclude<MaterialFilterType, 'all'>> = [
  'SEED',
  'PESTICIDE',
  'FERTILIZER',
  'OTHER',
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Add material to org whitelist: product name, barcode (manual or scan), category.
 */
export function AddMaterialSheet({ visible, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [type, setType] = useState<Exclude<MaterialFilterType, 'all'>>('OTHER');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!visible) return;
      let alive = true;
      (async () => {
        const b = await AsyncStorage.getItem('last_material_barcode');
        if (!alive || !b) return;
        setBarcode(b);
        await AsyncStorage.removeItem('last_material_barcode');
      })();
      return () => {
        alive = false;
      };
    }, [visible]),
  );

  const reset = useCallback(() => {
    setName('');
    setBarcode('');
    setManufacturer('');
    setType('OTHER');
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    const n = name.trim();
    const bc = barcode.trim();
    if (!n || !bc) {
      Alert.alert(t('error'), t('producer.materials.addForm.fillRequired'));
      return;
    }
    if (bc.length < 3) {
      Alert.alert(t('error'), t('producer.materials.addForm.barcodeShort'));
      return;
    }
    setSaving(true);
    try {
      await materialsAPI.submitGrower({
        productName: n,
        barcode: bc,
        materialType: type,
        manufacturer: manufacturer.trim() || undefined,
      });
      reset();
      onSuccess();
      onClose();
      Alert.alert(t('alerts.success'), t('producer.materials.addForm.saved'));
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e instanceof Error ? e.message : null) ||
        t('producer.materials.addForm.saveFailed');
      const line = Array.isArray(msg) ? msg.join(' ') : String(msg);
      Alert.alert(t('error'), line);
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = (k: string) => {
    const id = (() => {
      switch (k) {
        case 'SEED': return 'seed';
        case 'PESTICIDE': return 'pesticide';
        case 'FERTILIZER': return 'fertilizer';
        default: return 'other';
      }
    })();
    return t(`producer.materials.${id}`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('producer.materials.addForm.title')}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={10}>
            <X size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.lead}>{t('producer.materials.addForm.lead')}</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollInner}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>{t('producer.materials.addForm.name')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('producer.materials.addForm.namePh')}
            placeholderTextColor={theme.colors.text.tertiary}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.label}>{t('producer.materials.addForm.type')}</Text>
          <View style={styles.typeRow}>
            {TYPE_VALUES.map((k) => {
              const selected = type === k;
              return (
                <TouchableOpacity
                  key={k}
                  onPress={() => setType(k)}
                  style={[styles.typeChip, selected && styles.typeChipOn]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeChipText, selected && styles.typeChipTextOn]}>{typeLabel(k)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>{t('producer.materials.addForm.barcode')}</Text>
          <View style={styles.barcodeRow}>
            <TextInput
              value={barcode}
              onChangeText={setBarcode}
              placeholder={t('producer.materials.addForm.barcodePh')}
              placeholderTextColor={theme.colors.text.tertiary}
              style={[styles.input, styles.inputFlex]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() =>
                router.push({ pathname: '/(producer)/scanner', params: { returnTo: 'material-add' } } as any)
              }
            >
              <ScanLine size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>{t('producer.materials.addForm.barcodeHint')}</Text>

          <Text style={styles.label}>{t('producer.materials.addForm.manufacturer')}</Text>
          <TextInput
            value={manufacturer}
            onChangeText={setManufacturer}
            placeholder={t('producer.materials.addForm.manufacturerPh')}
            placeholderTextColor={theme.colors.text.tertiary}
            style={styles.input}
            autoCapitalize="words"
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnOff]}
            onPress={submit}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{t('producer.materials.addForm.save')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.text.primary, flex: 1 },
  closeBtn: { padding: 4 },
  lead: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 12,
    lineHeight: 20,
  },
  scroll: { flex: 1 },
  scrollInner: { padding: theme.spacing.lg, paddingBottom: 40 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface,
  },
  inputFlex: { flex: 1, marginBottom: 0 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  typeChipOn: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}12`,
  },
  typeChipText: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '500' },
  typeChipTextOn: { color: theme.colors.primary },
  barcodeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  hint: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 6, marginBottom: 8 },
  saveBtn: {
    marginTop: 24,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnOff: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
