import { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import CatalogDocuments from './CatalogDocuments';
import { useTranslation } from 'react-i18next';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { EnterpriseButton, EnterpriseTextField, EnterpriseTextArea } from '../../../design-system';
import { estatesAPI, harvestAnnouncementsAPI } from '../../../lib/api';
import { growerCatalogAPI } from '../../../lib/api/grower-catalog';
import { theme } from '../../../lib/theme';
import { growerUi } from '../../../lib/grower-ui';
import { apiErrorMessage } from '../../../lib/api-error';

type EstateRow = { id: string; name: string };
type PlantingRow = { id: string; cropType: string; estimatedDate: string; estateId?: string };

export default function GrowerCatalogScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof growerCatalogAPI.list>>>([]);
  const [estates, setEstates] = useState<EstateRow[]>([]);
  const [plantings, setPlantings] = useState<PlantingRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    variety: '',
    description: '',
    storageConditions: '',
    estateId: '',
    sourcePlantingId: '',
    plannedQuantityKg: '',
    imageUrl: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, e, plans] = await Promise.all([
        growerCatalogAPI.list(),
        estatesAPI.getAll(),
        harvestAnnouncementsAPI.getMy(),
      ]);
      setProducts(Array.isArray(p) ? p : []);
      const estateRows = (Array.isArray(e) ? e : []).map((x: { id: string; name: string }) => ({ id: x.id, name: x.name }));
      setEstates(estateRows);
      const plantingRows = (Array.isArray(plans) ? plans : [])
        .filter((x: { announcementType?: string }) => String(x.announcementType).toUpperCase() === 'PLANTING')
        .map((x: { id: string; cropType: string; estimatedDate: string; parcel?: { estateId?: string } }) => ({
          id: x.id,
          cropType: x.cropType,
          estimatedDate: x.estimatedDate,
          estateId: x.parcel?.estateId,
        }));
      setPlantings(plantingRows);
      setForm((f) => f.estateId ? f : ({ ...f, estateId: estateRows.length === 1 ? estateRows[0].id : '' }));
    } catch (err) {
      Alert.alert(t('error'), apiErrorMessage(err, t('producer.catalog.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      variety: '',
      description: '',
      storageConditions: '',
      estateId: estates[0]?.id ?? '',
      sourcePlantingId: '',
      plannedQuantityKg: '',
      imageUrl: '',
    });
  };

  const save = async () => {
    if (!form.name.trim() || !form.estateId || !(Number(form.plannedQuantityKg) > 0)) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        variety: form.variety.trim(),
        description: form.description.trim(),
        storageConditions: form.storageConditions.trim(),
        estateId: form.estateId,
        sourcePlantingId: form.sourcePlantingId || (editingId ? null : undefined),
        plannedQuantityKg: Number(form.plannedQuantityKg),
        imageUrl: form.imageUrl.trim(),
      };
      if (editingId) await growerCatalogAPI.update(editingId, body);
      else await growerCatalogAPI.create(body);
      resetForm();
      await load();
      Alert.alert(t('alerts.success'), t('producer.catalog.saved'));
    } catch (err) {
      Alert.alert(t('error'), apiErrorMessage(err, t('producer.catalog.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const edit = (row: (typeof products)[0]) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      variety: row.variety ?? '',
      description: row.description ?? '',
      storageConditions: row.storageConditions ?? '',
      estateId: row.estateId ?? estates[0]?.id ?? '',
      sourcePlantingId: row.sourcePlantingId ?? '',
      plannedQuantityKg: String(row.plannedQuantityKg ?? ''),
      imageUrl: row.imageUrl ?? '',
    });
  };

  const pickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { Alert.alert(t('error'), t('producer.catalogMedia.photoPermission')); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5, base64: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64 || asset.base64.length > 2_400_000) { Alert.alert(t('error'), t('producer.catalogMedia.photoSize')); return; }
      setForm(previous => ({ ...previous, imageUrl: `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` }));
    } catch (e) { Alert.alert(t('error'), apiErrorMessage(e, t('producer.catalog.saveFailed'))); }
  };
  const savedProduct = products.find(p => p.id === editingId);

  return (
    <View style={growerUi.canvas}>
      <BioVeraSubpageHeader title={t('producer.catalog.title')} left="back" />
      <ScrollView contentContainerStyle={[growerUi.scrollContent, { paddingBottom: 48 }]}>
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            <Text style={styles.lead}>
              {t('producer.catalog.lead')}
            </Text>
            <Text style={styles.label}>{t('producer.catalogMedia.estate')}</Text>
            <View style={{ gap: 6, marginBottom: 12 }}>{estates.map(estate => <EnterpriseButton key={estate.id}
              label={estate.name} variant={form.estateId === estate.id ? 'primary' : 'secondary'}
              onPress={() => setForm(previous => ({ ...previous, estateId: estate.id, sourcePlantingId: '' }))} />)}</View>
            <EnterpriseTextField
              label={t('producer.catalog.name')}
              value={form.name}
              onChangeText={(name) => setForm((f) => ({ ...f, name }))}
              size="farmer"
            />
            <EnterpriseTextField
              label={t('producer.catalog.variety')}
              value={form.variety}
              onChangeText={(variety) => setForm((f) => ({ ...f, variety }))}
              size="farmer"
            />
            <EnterpriseTextField label={t('producer.catalogMedia.plannedQuantity')} value={form.plannedQuantityKg}
              keyboardType="decimal-pad" onChangeText={value => setForm(previous => ({ ...previous, plannedQuantityKg: value.replace(',', '.') }))} />
            <EnterpriseTextArea
              label={t('producer.catalog.description')}
              value={form.description}
              onChangeText={(description) => setForm((f) => ({ ...f, description }))}
              minRows={3}
            />
            <EnterpriseTextArea
              label={t('producer.catalog.storage')}
              value={form.storageConditions}
              onChangeText={(storageConditions) => setForm((f) => ({ ...f, storageConditions }))}
              minRows={2}
            />
            {form.imageUrl ? <Image source={{ uri: form.imageUrl }} style={{ height: 140, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" /> : null}
            <EnterpriseButton label={t('producer.catalogMedia.pickPhoto')} onPress={() => void pickPhoto()} variant="secondary" disabled={saving} />
            <Text style={styles.label}>{t('producer.catalog.planting')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.chip, !form.sourcePlantingId && styles.chipOn]}
                onPress={() => setForm((f) => ({ ...f, sourcePlantingId: '' }))}
              >
                <Text style={styles.chipText}>{t('producer.catalog.noPlanting')}</Text>
              </TouchableOpacity>
              {plantings.filter(p => !p.estateId || p.estateId === form.estateId).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, form.sourcePlantingId === p.id && styles.chipOn]}
                  onPress={() => setForm((f) => ({ ...f, sourcePlantingId: p.id }))}
                >
                  <Text style={styles.chipText}>{p.cropType} · {p.estimatedDate.slice(0, 10)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <EnterpriseButton
              label={saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
              onPress={() => void save()}
              loading={saving}
              disabled={saving || !form.name.trim() || !form.estateId || !(Number(form.plannedQuantityKg) > 0)}
              size="large"
            />
            {editingId ? (
              <TouchableOpacity onPress={resetForm} style={{ marginTop: 12, minHeight: 44, justifyContent: 'center' }}>
                <Text style={{ color: theme.colors.text.secondary }}>{t('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
            ) : null}
            {savedProduct?.estateId ? <CatalogDocuments key={savedProduct.id} productId={savedProduct.id} estateId={savedProduct.estateId} /> : null}
            <View style={{ marginTop: 24, gap: 10 }}>
              {products.map((row) => (
                <TouchableOpacity key={row.id} style={styles.row} onPress={() => edit(row)}>
                  <Text style={styles.rowTitle}>{row.name}{row.variety ? ` · ${row.variety}` : ''}</Text>
                  <Text style={styles.rowSub} numberOfLines={2}>
                    {row.description?.trim() || t('buyer.passport.notRecorded', 'Not recorded')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 16, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary, marginBottom: 8 },
  chip: {
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  chipOn: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}15` },
  chipText: { fontSize: 13, color: theme.colors.text.primary },
  row: {
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: theme.colors.background,
  },
  rowTitle: { fontSize: 15, fontWeight: '500', color: theme.colors.text.primary },
  rowSub: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 4 },
});
