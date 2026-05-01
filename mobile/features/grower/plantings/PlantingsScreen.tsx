import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Wheat, Plus, X } from 'lucide-react-native';
import { estatesAPI, harvestAnnouncementsAPI, parcelsAPI } from '../../../lib/api';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { theme } from '../../../lib/theme';
import {
  CROP_CATALOG,
  type CropCategoryId,
  type CropVarietyRow,
  cropTypeForLocale,
  formatArea,
} from './crop-catalog';

type EstateRow = { id: string; name: string };
type ParcelAug = {
  id: string;
  cropType?: string | null;
  approvedAt?: string | null;
  estateId: string;
  calculatedArea?: number;
  estateName: string;
};

type HaRow = {
  id: string;
  parcelId: string;
  announcementType: string;
  cropType: string;
  estimatedDate: string;
  status: string;
  notes?: string | null;
  createdAt?: string;
  estimatedQuantity?: number | null;
  parcel?: {
    id: string;
    cropType?: string | null;
    calculatedArea?: number;
    estates?: { name: string } | null;
  } | null;
};

export default function PlantingsScreen() {
  const { t, i18n } = useTranslation();
  const p = useBioVeraScreenPadding();
  const langSr = !!i18n.language?.startsWith('sr');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [announcementsWarn, setAnnouncementsWarn] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<HaRow[]>([]);
  const [parcelList, setParcelList] = useState<ParcelAug[]>([]);

  /** Add modal */
  const [addOpen, setAddOpen] = useState(false);
  const [formParcelId, setFormParcelId] = useState('');
  const [selectedVariety, setSelectedVariety] = useState<CropVarietyRow | null>(null);
  const [customCropOther, setCustomCropOther] = useState('');
  const [cropFilter, setCropFilter] = useState<CropCategoryId | 'all'>('all');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [cropSearch, setCropSearch] = useState('');
  const [addFormErr, setAddFormErr] = useState<string | null>(null);

  /** Detail */
  const [detailHa, setDetailHa] = useState<HaRow | null>(null);

  const parcelById = useMemo(() => new Map(parcelList.map((q) => [q.id, q])), [parcelList]);

  const load = useCallback(async () => {
    setErr(null);
    setAnnouncementsWarn(null);
    try {
      const estates = (await estatesAPI.getAll()) as EstateRow[];
      const rows: ParcelAug[] = [];
      for (const e of estates || []) {
        const parcels = (await parcelsAPI.getByEstate(e.id).catch(() => [])) as Array<ParcelAug & { calculatedArea?: number }>;
        for (const par of parcels || []) {
          if (par.approvedAt) {
            rows.push({
              id: par.id,
              cropType: par.cropType,
              approvedAt: par.approvedAt,
              estateId: par.estateId,
              calculatedArea: typeof par.calculatedArea === 'number' ? par.calculatedArea : undefined,
              estateName: e.name,
            });
          }
        }
      }
      setParcelList(rows);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('producer.plantings.loadError'));
      setParcelList([]);
      setAnnouncements([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const list = (await harvestAnnouncementsAPI.getMy()) as HaRow[];
      setAnnouncements(Array.isArray(list) ? list : []);
    } catch {
      setAnnouncements([]);
      setAnnouncementsWarn(t('producer.plantings.announcementsLoadWarn'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetAddForm = useCallback(() => {
    setFormParcelId('');
    setSelectedVariety(null);
    setCustomCropOther('');
    setCropFilter('all');
    setCropSearch('');
    setAddFormErr(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNotes('');
  }, []);

  /** When modal opens with exactly one parcel, bind it reliably (avoids stale batching vs resetAddForm). */
  useEffect(() => {
    if (!addOpen) return;
    if (parcelList.length === 1) setFormParcelId(parcelList[0].id);
  }, [addOpen, parcelList]);
  const openAdd = () => {
    resetAddForm();
    setErr(null);
    setAddOpen(true);
  };

  const plantingsSorted = useMemo(() => {
    const list = announcements.filter((a) => a.announcementType === 'PLANTING');
    return [...list].sort((a, b) => {
      const ta = new Date(a.createdAt || a.estimatedDate).getTime();
      const tb = new Date(b.createdAt || b.estimatedDate).getTime();
      return tb - ta;
    });
  }, [announcements]);

  const harvestsSorted = useMemo(() => {
    const list = announcements.filter((a) => a.announcementType === 'HARVEST');
    return [...list].sort((a, b) => {
      const ta = new Date(a.createdAt || a.estimatedDate).getTime();
      const tb = new Date(b.createdAt || b.estimatedDate).getTime();
      return tb - ta;
    });
  }, [announcements]);

  const formatWhen = useCallback(
    (iso: string) => {
      try {
        const tag = langSr ? 'sr-Latn' : 'en-GB';
        return new Date(iso).toLocaleString(tag, { dateStyle: 'short', timeStyle: 'short' });
      } catch {
        return iso;
      }
    },
    [langSr],
  );

  const cropLabelChosen = (): string => {
    const custom = customCropOther.trim();
    if (custom) return custom;
    if (selectedVariety) return cropTypeForLocale(selectedVariety, langSr);
    return '';
  };

  const submitPlanting = async () => {
    setAddFormErr(null);
    const crop = cropLabelChosen().trim();
    if (!formParcelId.trim()) {
      setAddFormErr(t('producer.plantings.validationParcel'));
      return;
    }
    if (!crop) {
      setAddFormErr(t('producer.plantings.validationCrop'));
      return;
    }
    if (!formDate.trim()) {
      setAddFormErr(t('producer.plantings.validationDate'));
      return;
    }

    setSaving(true);
    setErr(null);
    try {
      await harvestAnnouncementsAPI.create({
        parcelId: formParcelId,
        announcementType: 'PLANTING',
        cropType: crop,
        estimatedDate: new Date(formDate + 'T12:00:00').toISOString(),
        notes: formNotes.trim() || undefined,
      });
      setAddOpen(false);
      resetAddForm();
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(' ') : msg;
      const fallback = text || (e instanceof Error ? e.message : t('producer.plantings.loadError'));
      setAddFormErr(fallback);
      setErr(fallback);
    } finally {
      setSaving(false);
    }
  };

  const resolvedParcelFor = (ha: HaRow): ParcelAug | undefined => {
    const local = parcelById.get(ha.parcelId);
    if (local) return local;
    if (ha.parcel?.id) {
      return {
        id: ha.parcel.id,
        cropType: ha.parcel.cropType,
        estateId: '',
        calculatedArea: ha.parcel.calculatedArea,
        estateName: ha.parcel.estates?.name || '—',
        approvedAt: 'x',
      };
    }
    return undefined;
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface,
  } as const;

  const visibleVarieties = useMemo(() => {
    if (cropFilter === 'all') {
      return CROP_CATALOG.flatMap((c) => c.items.map((it) => ({ cat: c.id, row: it })));
    }
    const cat = CROP_CATALOG.find((c) => c.id === cropFilter);
    return (cat?.items ?? []).map((row) => ({ cat: cropFilter, row }));
  }, [cropFilter]);

  const filteredVarieties = useMemo(() => {
    const q = cropSearch.trim().toLowerCase();
    if (!q) return visibleVarieties;
    return visibleVarieties.filter(({ row }) => {
      const sr = row.cropTypeSr.toLowerCase();
      const en = row.cropTypeEn.toLowerCase();
      const loc = cropTypeForLocale(row, langSr).toLowerCase();
      return sr.includes(q) || en.includes(q) || loc.includes(q);
    });
  }, [visibleVarieties, cropSearch, langSr]);

  const sheetHeight = Math.round(Dimensions.get('window').height * 0.88);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BioVeraSubpageHeader
        title={t('producer.plantings.screenTitle')}
        left="back"
        right={
          <TouchableOpacity onPress={() => openAdd()} accessibilityLabel={t('producer.plantings.addAccessibility')} hitSlop={10}>
            <Plus size={26} color={theme.colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={{
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingBottom: Math.max(p.bottomInset, theme.spacing.xl),
        }}
      >
        <Text style={{ fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20, marginBottom: theme.spacing.md }}>
          {t('producer.plantings.introShort')}
        </Text>

        {err ? (
          <View
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.errorLight,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <Text style={{ color: theme.colors.error, fontSize: 14 }}>{err}</Text>
          </View>
        ) : null}

        {announcementsWarn && !err ? (
          <View
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.warningLight,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md,
              borderWidth: 1,
              borderColor: `${theme.colors.warning}35`,
            }}
          >
            <Text style={{ color: theme.colors.text.primary, fontSize: 14 }}>{announcementsWarn}</Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} />
        ) : (
          <>
            <Text style={{ fontSize: 17, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.sm }}>
              {t('producer.plantings.listTitle')}
            </Text>

            {plantingsSorted.length === 0 ? (
              <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }}>
                {t('producer.plantings.empty')}
              </Text>
            ) : (
              plantingsSorted.map((a) => {
                const pr = resolvedParcelFor(a);
                const areaM2 =
                  typeof pr?.calculatedArea === 'number'
                    ? pr.calculatedArea
                    : typeof a.parcel?.calculatedArea === 'number'
                      ? a.parcel.calculatedArea
                      : null;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setDetailHa(a)}
                    style={({ pressed }) => ({
                      padding: theme.spacing.md,
                      marginBottom: theme.spacing.sm,
                      borderRadius: theme.borderRadius.lg,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: pressed ? theme.colors.primaryLight : theme.colors.surfaceElevated,
                    })}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text.primary }}>{a.cropType}</Text>
                    <Text style={{ fontSize: 14, color: theme.colors.primary, marginTop: 6, fontWeight: '600' }}>
                      📍{' '}
                      {pr?.estateName ?? a.parcel?.estates?.name ?? ''}
                      {' — '}
                      {pr?.cropType ?? a.parcel?.cropType ?? a.parcelId.slice(0, 8)}
                      {areaM2 != null ? ` · ${formatArea(areaM2, langSr)}` : ''}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginTop: 8 }}>
                      {formatWhen(a.estimatedDate)} · {t(`producer.plantings.ha_${a.status}`, { defaultValue: a.status })}
                    </Text>
                  </Pressable>
                );
              })
            )}

            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: theme.colors.text.primary,
                marginTop: theme.spacing.lg,
                marginBottom: theme.spacing.sm,
              }}
            >
              {t('producer.plantings.sectionHarvests')}
            </Text>
            {harvestsSorted.length === 0 ? (
              <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>{t('producer.plantings.harvestEmpty')}</Text>
            ) : (
              harvestsSorted.map((a) => {
                const pr = resolvedParcelFor(a);
                const areaM2 =
                  typeof pr?.calculatedArea === 'number'
                    ? pr.calculatedArea
                    : typeof a.parcel?.calculatedArea === 'number'
                      ? a.parcel.calculatedArea
                      : null;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setDetailHa(a)}
                    style={({ pressed }) => ({
                      padding: theme.spacing.md,
                      marginBottom: theme.spacing.sm,
                      borderRadius: theme.borderRadius.lg,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: pressed ? theme.colors.primaryLight : theme.colors.surfaceElevated,
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Wheat size={18} color={theme.colors.primary} strokeWidth={2} />
                      <Text style={{ fontSize: 15, fontWeight: '700', flex: 1 }}>{a.cropType}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600' }}>
                      📍 {pr?.estateName ?? a.parcel?.estates?.name ?? ''}
                      {' — '}
                      {pr?.cropType ?? a.parcel?.cropType ?? ''}
                      {areaM2 != null ? ` · ${formatArea(areaM2, langSr)}` : ''}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginTop: 8 }}>
                      {formatWhen(a.estimatedDate)} · {t(`producer.plantings.ha_${a.status}`, { defaultValue: a.status })}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Detail modal */}
      <Modal visible={detailHa != null} animationType="slide" transparent presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: theme.borderRadius.lg,
              borderTopRightRadius: theme.borderRadius.lg,
              paddingHorizontal: p.screenPaddingLeft,
              paddingBottom: Math.max(p.bottomInset, theme.spacing.md),
              maxHeight: '88%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.sm }}>
              <Text style={{ fontSize: 18, fontWeight: '700', flex: 1 }}>{t('producer.plantings.detailTitle')}</Text>
              <TouchableOpacity onPress={() => setDetailHa(null)} hitSlop={12}>
                <X size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
            {detailHa ? (
              <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
                <DetailBody ha={detailHa} pr={resolvedParcelFor(detailHa)} langSr={langSr} t={t} formatWhen={formatWhen} formatAreaFn={formatArea} />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Add planting modal — fixed footer save, compact crop list + search */}
      <Modal visible={addOpen} animationType="slide" transparent presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{
              height: sheetHeight,
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: theme.borderRadius.lg,
              borderTopRightRadius: theme.borderRadius.lg,
              paddingHorizontal: p.screenPaddingLeft,
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.sm }}>
                <Text style={{ fontSize: 18, fontWeight: '700', flex: 1 }}>{t('producer.plantings.formSectionTitle')}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setAddFormErr(null);
                    setAddOpen(false);
                  }}
                  hitSlop={12}
                >
                  <X size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {parcelList.length === 0 ? (
                <Text style={{ paddingVertical: theme.spacing.lg, color: theme.colors.warning }}>{t('producer.plantings.approvedOnlyHint')}</Text>
              ) : (
                <>
                  <ScrollView
                    style={{ flex: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: theme.spacing.sm }}
                  >
                    {parcelList.length === 1 ? (
                      <View
                        style={{
                          padding: theme.spacing.sm,
                          marginBottom: theme.spacing.md,
                          borderRadius: theme.borderRadius.md,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.surfaceElevated,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary }}>{t('producer.plantings.parcelLockedHint')}</Text>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, marginTop: 6 }}>
                          {parcelList[0].estateName}
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginTop: 4 }}>
                          {parcelList[0].cropType || '—'}
                          {typeof parcelList[0].calculatedArea === 'number'
                            ? ` · ${formatArea(parcelList[0].calculatedArea, langSr)}`
                            : ''}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: theme.colors.text.secondary }}>
                          {t('producer.plantings.selectParcel')}
                        </Text>
                        <ScrollView
                          nestedScrollEnabled
                          keyboardShouldPersistTaps="handled"
                          style={{ maxHeight: 128, marginBottom: theme.spacing.md }}
                          showsVerticalScrollIndicator
                        >
                          <View style={{ gap: theme.spacing.xs }}>
                            {parcelList.map((par) => {
                              const sel = formParcelId === par.id;
                              const aM2 =
                                typeof par.calculatedArea === 'number'
                                  ? `${formatArea(par.calculatedArea, langSr)}`
                                  : '—';
                              return (
                                <TouchableOpacity
                                  key={par.id}
                                  onPress={() => {
                                    setFormParcelId(par.id);
                                    setAddFormErr(null);
                                  }}
                                  activeOpacity={0.85}
                                  style={{
                                    padding: theme.spacing.sm,
                                    borderRadius: theme.borderRadius.md,
                                    borderWidth: 2,
                                    borderColor: sel ? theme.colors.primary : theme.colors.border,
                                    backgroundColor: sel ? theme.colors.primaryLight : theme.colors.surface,
                                  }}
                                >
                                  <Text style={{ fontWeight: '700', color: theme.colors.text.primary }}>{par.estateName}</Text>
                                  <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 }}>
                                    {par.cropType || `${par.id.slice(0, 8)}…`} · {aM2}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </ScrollView>
                      </>
                    )}

                    <Text style={{ fontSize: 15, fontWeight: '700', marginBottom: theme.spacing.xs }}>
                      {t('producer.plantings.createPlantingHeading')}
                    </Text>

                    <Text style={{ fontSize: 12, marginBottom: 6, color: theme.colors.text.secondary }}>
                      {t('producer.plantings.pickCategory')}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.sm }}>
                      <TouchableOpacity onPress={() => setCropFilter('all')} style={chipStyles(cropFilter === 'all', theme)}>
                        <Text style={{ fontWeight: '600', fontSize: 13 }}>{t('producer.plantings.filterAll')}</Text>
                      </TouchableOpacity>
                      {CROP_CATALOG.map((c) => (
                        <TouchableOpacity key={c.id} onPress={() => setCropFilter(c.id)} style={chipStyles(cropFilter === c.id, theme)}>
                          <Text style={{ fontWeight: '600', fontSize: 13 }}>{langSr ? c.labelSr : c.labelEn}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={{ fontSize: 12, marginBottom: 6, color: theme.colors.text.secondary }}>
                      {t('producer.plantings.pickVariety')}
                    </Text>
                    <TextInput
                      style={[inputStyle, { marginBottom: 8, paddingVertical: 10 }]}
                      value={cropSearch}
                      onChangeText={setCropSearch}
                      placeholder={t('producer.plantings.cropSearchPlaceholder')}
                      placeholderTextColor={theme.colors.text.tertiary}
                    />

                    <View
                      style={{
                        maxHeight: 168,
                        marginBottom: theme.spacing.sm,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: theme.borderRadius.md,
                        backgroundColor: theme.colors.surface,
                        overflow: 'hidden',
                      }}
                    >
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
                        {filteredVarieties.length === 0 ? (
                          <Text style={{ fontSize: 13, color: theme.colors.text.tertiary, padding: theme.spacing.md }}>
                            {t('producer.plantings.noCropMatch')}
                          </Text>
                        ) : (
                          filteredVarieties.map(({ row }, idx) => {
                            const label = cropTypeForLocale(row, langSr);
                            const picked =
                              selectedVariety?.cropTypeSr === row.cropTypeSr &&
                              selectedVariety?.cropTypeEn === row.cropTypeEn;
                            return (
                              <TouchableOpacity
                                key={`${row.cropTypeEn}-${idx}`}
                                onPress={() => {
                                  setSelectedVariety(row);
                                  setCustomCropOther('');
                                  setAddFormErr(null);
                                }}
                                style={{
                                  paddingVertical: 12,
                                  paddingHorizontal: theme.spacing.md,
                                  borderBottomWidth: idx < filteredVarieties.length - 1 ? 1 : 0,
                                  borderBottomColor: theme.colors.border,
                                  backgroundColor: picked ? theme.colors.primaryLight : theme.colors.surface,
                                }}
                              >
                                <Text style={{ fontSize: 15, color: theme.colors.text.primary, fontWeight: picked ? '700' : '500' }}>
                                  {label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </ScrollView>
                    </View>

                    <Text style={{ fontSize: 12, marginBottom: 4, color: theme.colors.text.secondary }}>
                      {t('producer.plantings.customCropHint')}
                    </Text>
                    <TextInput
                      style={[inputStyle, { marginBottom: theme.spacing.sm, paddingVertical: 10 }]}
                      value={customCropOther}
                      onChangeText={(txt) => {
                        setCustomCropOther(txt);
                        if (txt.trim()) {
                          setSelectedVariety(null);
                          setAddFormErr(null);
                        }
                      }}
                      placeholder={t('producer.plantings.customCropPlaceholder')}
                      placeholderTextColor={theme.colors.text.tertiary}
                    />

                    <Text style={{ fontSize: 12, marginBottom: 4, color: theme.colors.text.secondary }}>
                      {t('producer.plantings.fieldDate')}
                    </Text>
                    <TextInput
                      style={[inputStyle, { marginBottom: theme.spacing.sm, paddingVertical: 10 }]}
                      value={formDate}
                      onChangeText={(v) => {
                        setFormDate(v);
                        setAddFormErr(null);
                      }}
                    />

                    <Text style={{ fontSize: 12, marginBottom: 4, color: theme.colors.text.secondary }}>
                      {t('producer.plantings.fieldNotes')}
                    </Text>
                    <TextInput
                      style={[inputStyle, { minHeight: 56, marginBottom: 4, paddingVertical: 10 }]}
                      value={formNotes}
                      onChangeText={setFormNotes}
                      multiline
                      placeholderTextColor={theme.colors.text.tertiary}
                    />
                  </ScrollView>

                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: theme.colors.border,
                      paddingTop: theme.spacing.sm,
                      paddingBottom: Math.max(p.bottomInset, theme.spacing.sm),
                    }}
                  >
                    {addFormErr ? (
                      <Text
                        style={{
                          color: theme.colors.error,
                          fontSize: 13,
                          marginBottom: theme.spacing.sm,
                          lineHeight: 18,
                        }}
                      >
                        {addFormErr}
                      </Text>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => void submitPlanting()}
                      disabled={saving}
                      style={{
                        paddingVertical: 14,
                        borderRadius: theme.borderRadius.md,
                        alignItems: 'center',
                        backgroundColor: saving ? theme.colors.text.tertiary : theme.colors.primary,
                        opacity: saving ? 0.85 : 1,
                      }}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t('producer.plantings.submit')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function chipStyles(active: boolean, th: typeof theme): object {
  return {
    marginRight: 8,
    marginBottom: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: th.borderRadius.md,
    borderWidth: 2,
    borderColor: active ? th.colors.primary : th.colors.border,
    backgroundColor: active ? th.colors.primaryLight : th.colors.surface,
  };
}

function DetailBody({
  ha,
  pr,
  langSr,
  t,
  formatWhen,
  formatAreaFn,
}: {
  ha: HaRow;
  pr?: ParcelAug;
  langSr: boolean;
  t: (k: string, o?: Record<string, unknown>) => string;
  formatWhen: (iso: string) => string;
  formatAreaFn: (m2: number, lng: boolean) => string;
}) {
  const areaM2 =
    typeof pr?.calculatedArea === 'number'
      ? pr.calculatedArea
      : typeof ha.parcel?.calculatedArea === 'number'
        ? ha.parcel.calculatedArea
        : null;
  return (
    <View style={{ paddingBottom: theme.spacing.lg }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.text.primary }}>{ha.cropType}</Text>
      <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginTop: 6 }}>
        {ha.announcementType === 'PLANTING' ? t('producer.plantings.typePlanting') : t('producer.plantings.typeHarvest')}
      </Text>

      <Text style={{ fontSize: 14, fontWeight: '700', marginTop: theme.spacing.md, color: theme.colors.text.primary }}>{t('producer.plantings.detailParcel')}</Text>
      <Text style={{ fontSize: 15, color: theme.colors.text.secondary, marginTop: 4 }}>
        {pr?.estateName ?? ha.parcel?.estates?.name ?? '—'}
      </Text>
      <Text style={{ fontSize: 15, color: theme.colors.text.secondary, marginTop: 4 }}>
        {t('producer.plantings.detailBlock')}: {pr?.cropType ?? ha.parcel?.cropType ?? ha.parcelId.slice(0, 8)}
      </Text>
      {areaM2 != null ? (
        <Text style={{ fontSize: 15, color: theme.colors.text.secondary, marginTop: 4 }}>
          {t('producer.plantings.detailArea')}: {formatAreaFn(areaM2, langSr)}
        </Text>
      ) : null}

      <Text style={{ fontSize: 14, fontWeight: '700', marginTop: theme.spacing.md }}>{t('producer.plantings.detailPlanDate')}</Text>
      <Text style={{ marginTop: 4, color: theme.colors.text.secondary }}>{formatWhen(ha.estimatedDate)}</Text>

      {ha.createdAt ? (
        <>
          <Text style={{ fontSize: 14, fontWeight: '700', marginTop: theme.spacing.md }}>{t('producer.plantings.detailRecorded')}</Text>
          <Text style={{ marginTop: 4, color: theme.colors.text.tertiary, fontSize: 13 }}>{formatWhen(ha.createdAt)}</Text>
        </>
      ) : null}

      {typeof ha.estimatedQuantity === 'number' ? (
        <>
          <Text style={{ fontSize: 14, fontWeight: '700', marginTop: theme.spacing.md }}>{t('producer.plantings.detailQtyKg')}</Text>
          <Text style={{ marginTop: 4, color: theme.colors.text.secondary }}>{ha.estimatedQuantity} kg</Text>
        </>
      ) : null}

      <Text style={{ fontSize: 14, fontWeight: '700', marginTop: theme.spacing.md }}>{t('producer.plantings.detailStatus')}</Text>
      <Text style={{ marginTop: 4, color: theme.colors.text.secondary }}>{t(`producer.plantings.ha_${ha.status}`, { defaultValue: ha.status })}</Text>

      {ha.notes ? (
        <>
          <Text style={{ fontSize: 14, fontWeight: '700', marginTop: theme.spacing.md }}>{t('producer.plantings.fieldNotes')}</Text>
          <Text style={{ marginTop: 4, color: theme.colors.text.secondary, lineHeight: 22 }}>{ha.notes}</Text>
        </>
      ) : null}
    </View>
  );
}
