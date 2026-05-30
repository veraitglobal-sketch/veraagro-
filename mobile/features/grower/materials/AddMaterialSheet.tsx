import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { X, ScanLine } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { materialsAPI } from '../../../lib/api';
import { apiErrorMessage } from '../../../lib/api-error';
import type { MaterialFilterType } from './useMaterialsData';
import { BioVeraBottomSheet } from '../../../components/enterprise/BioVeraBottomSheet';
import {
  EnterpriseButton,
  EnterpriseTextField,
  dsColors,
} from '../../../design-system';

/** Tap order: seed, fertilizer, pesticide, other — user picks before typing name / barcode. */
const TYPE_VALUES: Array<Exclude<MaterialFilterType, 'all'>> = [
  'SEED',
  'FERTILIZER',
  'PESTICIDE',
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
  const [type, setType] = useState<Exclude<MaterialFilterType, 'all'>>('SEED');
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
    setType('SEED');
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
      const line = apiErrorMessage(e, t('producer.materials.addForm.saveFailed'));
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

  const namePlaceholder = (k: Exclude<MaterialFilterType, 'all'>) =>
    t(`producer.materials.addForm.namePh_${k}`, { defaultValue: t('producer.materials.addForm.namePh') });

  return (
    <BioVeraBottomSheet visible={visible} onClose={handleClose} keyboardAvoiding>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('producer.materials.addForm.title')}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={10}>
            <X size={24} color={dsColors.muted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.lead}>{t('producer.materials.addForm.leadPickType')}</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollInner}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.pickTypeHeading}>{t('producer.materials.addForm.pickTypeFirst')}</Text>
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

          <Text style={styles.subLead}>{t('producer.materials.addForm.thenDetails')}</Text>

          <EnterpriseTextField
            label={t('producer.materials.addForm.name')}
            value={name}
            onChangeText={setName}
            placeholder={namePlaceholder(type)}
            autoCapitalize="words"
            size="farmer"
          />

          <Text style={styles.barcodeLabel}>{t('producer.materials.addForm.barcode')}</Text>
          <View style={styles.barcodeRow}>
            <View style={styles.barcodeField}>
              <EnterpriseTextField
                value={barcode}
                onChangeText={setBarcode}
                placeholder={t('producer.materials.addForm.barcodePh')}
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={styles.barcodeInputWrap}
              />
            </View>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() =>
                router.push({
                  pathname: '/(producer)/scanner',
                  params: { returnTo: 'material-add', materialKind: type },
                } as never)
              }
              accessibilityRole="button"
              accessibilityLabel={t('producer.materials.addForm.barcode')}
            >
              <ScanLine size={22} color={dsColors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>{t('producer.materials.addForm.barcodeHint')}</Text>

          <EnterpriseTextField
            label={t('producer.materials.addForm.manufacturer')}
            value={manufacturer}
            onChangeText={setManufacturer}
            placeholder={t('producer.materials.addForm.manufacturerPh')}
            autoCapitalize="words"
            size="farmer"
          />

          <EnterpriseButton
            label={t('producer.materials.addForm.save')}
            onPress={submit}
            loading={saving}
            disabled={saving}
            fullWidth
            size="large"
            style={styles.saveBtn}
          />
        </ScrollView>
      </View>
    </BioVeraBottomSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: dsColors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: dsColors.border,
  },
  title: { fontSize: 18, fontWeight: '600', color: dsColors.gray900, flex: 1 },
  closeBtn: { padding: 4 },
  lead: {
    fontSize: 14,
    color: dsColors.muted,
    paddingHorizontal: 16,
    paddingTop: 12,
    lineHeight: 20,
  },
  pickTypeHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: dsColors.gray900,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  subLead: {
    fontSize: 13,
    color: dsColors.muted,
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 18,
  },
  scroll: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 40 },
  barcodeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: dsColors.gray700,
    marginBottom: 6,
  },
  barcodeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 4 },
  barcodeField: { flex: 1 },
  barcodeInputWrap: { marginBottom: 0 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: dsColors.border,
    backgroundColor: dsColors.surface,
  },
  typeChipOn: {
    borderColor: dsColors.primary,
    backgroundColor: dsColors.primaryTint,
  },
  typeChipText: { fontSize: 13, color: dsColors.muted, fontWeight: '500' },
  typeChipTextOn: { color: dsColors.primary },
  scanBtn: {
    width: 48,
    height: 48,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dsColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dsColors.surface,
  },
  hint: { fontSize: 14, color: dsColors.muted, marginTop: 4, marginBottom: 8, lineHeight: 20 },
  saveBtn: {
    marginTop: 8,
  },
});
