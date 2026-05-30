import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, type Href } from 'expo-router';
import { Plus, Pencil, Trash2, ImagePlus, Eye, Package } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { b2bSuppliersAPI } from '../../lib/api';
import { apiErrorMessage } from '../../lib/api-error';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';
import EmptyState from '../../components/EmptyState';
import { pickFromGallery } from '../../lib/camera-picker';
import { SupplierStorefrontHeader } from './SupplierStorefrontHeader';
import { BioVeraBottomSheet } from '../../components/enterprise/BioVeraBottomSheet';
import {
  validateSupplierCatalogForm,
  type SupplierCatalogFormErrors,
} from '../../lib/supplier-shop-validation';

export type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  listPrice: number | null;
  sku: string | null;
  imageUrl: string | null;
};

const UNITS = ['bag', 'kg', 'l', 'pcs', 'box', 'roll'];

export default function SupplierCatalogScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [mapApproved, setMapApproved] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    unit: 'bag',
    listPrice: '',
    sku: '',
  });
  const [fieldErrors, setFieldErrors] = useState<SupplierCatalogFormErrors>({});

  const load = useCallback(async () => {
    try {
      const [catalog, profile] = await Promise.all([
        b2bSuppliersAPI.getMyCatalog(),
        b2bSuppliersAPI.getMyProfile().catch(() => null),
      ]);
      setItems(Array.isArray(catalog) ? catalog : []);
      if (profile && typeof profile === 'object') {
        const p = profile as {
          businessName?: string;
          city?: string;
          country?: string;
          mapApproved?: boolean;
        };
        setBusinessName(String(p.businessName || ''));
        setCity(String(p.city || ''));
        setCountry(String(p.country || ''));
        setMapApproved(p.mapApproved);
      }
    } catch (e: unknown) {
      Alert.alert(t('error'), apiErrorMessage(e, t('supplier.loadFailed')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const resetForm = () => {
    setForm({ name: '', description: '', unit: 'bag', listPrice: '', sku: '' });
    setFieldErrors({});
    setEditingId(null);
    setPendingImageUri(null);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (it: CatalogItem) => {
    setEditingId(it.id);
    setPendingImageUri(null);
    setFieldErrors({});
    setForm({
      name: it.name,
      description: it.description || '',
      unit: it.unit || 'bag',
      listPrice: it.listPrice != null ? String(it.listPrice) : '',
      sku: it.sku || '',
    });
    setModalOpen(true);
  };

  const pickImage = async () => {
    const asset = await pickFromGallery({ t, allowsEditing: true, quality: 0.85 });
    if (!asset?.uri) return;
    if (editingId) {
      setSaving(true);
      try {
        await b2bSuppliersAPI.uploadCatalogItemImage(editingId, asset.uri);
        await load();
      } catch (e: unknown) {
        Alert.alert(t('error'), apiErrorMessage(e, t('supplier.store.imageFailed')));
      } finally {
        setSaving(false);
      }
    } else {
      setPendingImageUri(asset.uri);
    }
  };

  const saveItem = async () => {
    const { valid, errors, listPrice } = validateSupplierCatalogForm(form, t);
    setFieldErrors(errors);
    if (!valid) return;
    setSaving(true);
    try {
      if (editingId) {
        await b2bSuppliersAPI.updateCatalogItem(editingId, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          unit: form.unit.trim() || 'bag',
          listPrice: listPrice ?? null,
          sku: form.sku.trim() || undefined,
        });
      } else {
        const created = await b2bSuppliersAPI.createCatalogItem({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          unit: form.unit.trim() || 'bag',
          listPrice,
          sku: form.sku.trim() || undefined,
        });
        if (pendingImageUri && created.id) {
          await b2bSuppliersAPI.uploadCatalogItemImage(created.id, pendingImageUri);
        }
      }
      setModalOpen(false);
      resetForm();
      await load();
    } catch (e: unknown) {
      Alert.alert(t('error'), apiErrorMessage(e, t('supplier.updateFailed')));
    } finally {
      setSaving(false);
    }
  };

  const removeItem = (id: string) => {
    Alert.alert(t('supplier.store.deleteTitle'), t('supplier.store.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('supplier.store.deleteConfirm'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await b2bSuppliersAPI.deleteCatalogItem(id);
              if (editingId === id) {
                setModalOpen(false);
                resetForm();
              }
              await load();
            } catch (e: unknown) {
              Alert.alert(t('error'), apiErrorMessage(e, t('supplier.updateFailed')));
            }
          })();
        },
      },
    ]);
  };

  const previewAsGrower = () => {
    if (!user?.id) return;
    router.push(`/b2b-supplier/${encodeURIComponent(user.id)}` as Href);
  };

  const editingItem = editingId ? items.find((x) => x.id === editingId) : null;
  const previewImage = pendingImageUri || editingItem?.imageUrl || null;

  if (loading) {
    return (
      <View style={[growerUi.canvas, styles.centered]}>
        <ActivityIndicator size="large" color={enterpriseColors.primary} />
      </View>
    );
  }

  return (
    <View style={growerUi.canvas}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={enterpriseColors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <SupplierStorefrontHeader
          businessName={businessName || t('supplier.partnerStore')}
          city={city}
          country={country}
          mapApproved={mapApproved}
          catalogPreview={items.slice(0, 3).map((x) => ({ id: x.id, name: x.name, imageUrl: x.imageUrl }))}
        />

        <TouchableOpacity
          onPress={previewAsGrower}
          activeOpacity={0.72}
          style={[enterpriseUi.inAppPanel, styles.previewBtn]}
        >
          <Eye size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
          <Text style={styles.previewBtnText}>{t('supplier.store.previewAsGrower')}</Text>
        </TouchableOpacity>

        <View style={styles.listHead}>
          <Text style={enterpriseUi.inAppSectionLabel}>{t('supplier.store.catalogTitle')}</Text>
          <TouchableOpacity onPress={openAdd} activeOpacity={0.88} style={styles.addChip}>
            <Plus size={18} color={enterpriseColors.white} strokeWidth={2} />
            <Text style={styles.addChipText}>{t('supplier.store.addProduct')}</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <>
            <EmptyState message={t('supplier.store.emptyCatalog')} icon={Package} />
            <TouchableOpacity onPress={openAdd} style={[enterpriseUi.authBtnPrimary, styles.emptyCta]}>
              <Text style={enterpriseUi.authBtnPrimaryText}>{t('supplier.store.addProduct')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          items.map((it) => (
            <View key={it.id} style={[enterpriseUi.inAppPanel, styles.productRow]}>
              <View style={styles.productMain}>
                <View style={styles.imageWrap}>
                  {it.imageUrl ? (
                    <Image source={{ uri: it.imageUrl }} style={styles.productImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Package size={28} color={enterpriseColors.gray600} strokeWidth={1.5} />
                    </View>
                  )}
                </View>
                <View style={styles.productCopy}>
                  <Text style={enterpriseUi.navRowTitle}>{it.name}</Text>
                  {it.description ? (
                    <Text style={enterpriseUi.navRowSubtitle} numberOfLines={2}>
                      {it.description}
                    </Text>
                  ) : null}
                  <Text style={styles.meta}>
                    {it.unit}
                    {it.listPrice != null ? ` · €${it.listPrice.toFixed(2)}` : ''}
                    {it.sku ? ` · ${it.sku}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => openEdit(it)} style={styles.iconBtn} activeOpacity={0.72}>
                  <Pencil size={18} color={enterpriseColors.primary} strokeWidth={1.5} />
                  <Text style={styles.iconBtnText}>{t('supplier.store.edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeItem(it.id)}
                  style={styles.iconBtn}
                  activeOpacity={0.72}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.delete')}
                >
                  <Trash2 size={18} color={enterpriseColors.destructive} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <BioVeraBottomSheet visible={modalOpen} onClose={() => setModalOpen(false)} keyboardAvoiding>
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>
              {editingId ? t('supplier.store.editProduct') : t('supplier.store.newProduct')}
            </Text>

            <TouchableOpacity onPress={() => void pickImage()} activeOpacity={0.88} style={styles.photoBox}>
              {previewImage ? (
                <Image source={{ uri: previewImage }} style={styles.photoPreview} resizeMode="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <ImagePlus size={32} color={enterpriseColors.primary} strokeWidth={1.5} />
                  <Text style={styles.photoHint}>{t('supplier.store.addPhoto')}</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={growerUi.formLabel}>{t('supplier.store.nameLabel')}</Text>
            <TextInput
              style={[growerUi.formInput, fieldErrors.name && styles.inputError]}
              value={form.name}
              onChangeText={(v) => {
                setForm((f) => ({ ...f, name: v }));
                if (fieldErrors.name) setFieldErrors((e) => ({ ...e, name: undefined }));
              }}
              placeholder={t('supplier.store.namePlaceholder')}
              placeholderTextColor={enterpriseColors.gray600}
            />
            {fieldErrors.name ? <Text style={styles.fieldError}>{fieldErrors.name}</Text> : null}

            <Text style={growerUi.formLabel}>{t('supplier.store.descLabel')}</Text>
            <TextInput
              style={[growerUi.formInput, styles.textArea]}
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              multiline
              placeholder={t('supplier.store.descPlaceholder')}
              placeholderTextColor={enterpriseColors.gray600}
            />

            <Text style={growerUi.formLabel}>{t('supplier.store.unitLabel')}</Text>
            <View style={styles.unitRow}>
              {UNITS.map((u) => {
                const on = form.unit === u;
                return (
                  <TouchableOpacity
                    key={u}
                    onPress={() => setForm((f) => ({ ...f, unit: u }))}
                    style={[growerUi.filterChip, on && growerUi.filterChipOn]}
                  >
                    <Text style={[growerUi.filterChipText, on && growerUi.filterChipTextOn]}>{u}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={growerUi.formLabel}>{t('supplier.store.priceLabel')}</Text>
            <TextInput
              style={[growerUi.formInput, fieldErrors.listPrice && styles.inputError]}
              value={form.listPrice}
              onChangeText={(v) => {
                setForm((f) => ({ ...f, listPrice: v }));
                if (fieldErrors.listPrice) setFieldErrors((e) => ({ ...e, listPrice: undefined }));
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={enterpriseColors.gray600}
            />
            {fieldErrors.listPrice ? <Text style={styles.fieldError}>{fieldErrors.listPrice}</Text> : null}

            <Text style={growerUi.formLabel}>{t('supplier.store.skuLabel')}</Text>
            <TextInput
              style={growerUi.formInput}
              value={form.sku}
              onChangeText={(v) => setForm((f) => ({ ...f, sku: v }))}
              placeholder={t('supplier.store.skuPlaceholder')}
              placeholderTextColor={enterpriseColors.gray600}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void saveItem()}
                disabled={saving}
                style={[enterpriseUi.authBtnPrimary, styles.saveBtn, saving && styles.saveDisabled]}
              >
                {saving ? (
                  <ActivityIndicator color={enterpriseColors.white} />
                ) : (
                  <Text style={enterpriseUi.authBtnPrimaryText}>{t('supplier.store.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </BioVeraBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginBottom: 20,
  },
  previewBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: enterpriseColors.primary,
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: enterpriseColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addChipText: {
    color: enterpriseColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCta: {
    marginTop: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  productRow: {
    padding: 14,
    marginBottom: 10,
  },
  productMain: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: enterpriseColors.gray100,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCopy: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    fontSize: 13,
    color: enterpriseColors.gray600,
    marginTop: 6,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  iconBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.primary,
  },
  modal: {
    flex: 1,
    backgroundColor: enterpriseColors.canvas,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: enterpriseColors.gray900,
    marginBottom: 16,
  },
  photoBox: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: '100%',
    height: 200,
  },
  photoPlaceholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: enterpriseColors.gray100,
    gap: 8,
  },
  photoHint: {
    fontSize: 15,
    color: enterpriseColors.primary,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 16,
    color: enterpriseColors.gray600,
    fontWeight: '500',
  },
  saveBtn: {
    minHeight: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  saveDisabled: {
    opacity: 0.5,
  },
  inputError: {
    borderColor: enterpriseColors.destructive,
  },
  fieldError: {
    fontSize: 13,
    color: enterpriseColors.destructive,
    marginTop: 4,
    marginBottom: 8,
  },
});
