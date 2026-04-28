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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sprout, Wheat } from 'lucide-react-native';
import { estatesAPI, harvestAnnouncementsAPI, parcelsAPI } from '../../../lib/api';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { theme } from '../../../lib/theme';

type EstateRow = { id: string; name: string };
type ParcelRow = { id: string; cropType?: string | null; approvedAt?: string | null; estateId: string };
type HaRow = {
  id: string;
  parcelId: string;
  announcementType: string;
  cropType: string;
  estimatedDate: string;
  status: string;
  notes?: string | null;
  parcel?: {
    id: string;
    cropType?: string | null;
    estates?: { name: string } | null;
  } | null;
};

export default function PlantingsScreen() {
  const { t, i18n } = useTranslation();
  const p = useBioVeraScreenPadding();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<HaRow[]>([]);
  const [approvedParcels, setApprovedParcels] = useState<(ParcelRow & { estateName: string })[]>([]);

  const [formParcelId, setFormParcelId] = useState('');
  const [formCrop, setFormCrop] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');

  const load = useCallback(async () => {
    setErr(null);
    try {
      const list = (await harvestAnnouncementsAPI.getMy()) as HaRow[];
      setAnnouncements(Array.isArray(list) ? list : []);
      const estates = (await estatesAPI.getAll()) as EstateRow[];
      const rows: (ParcelRow & { estateName: string })[] = [];
      for (const e of estates || []) {
        const parcels = (await parcelsAPI.getByEstate(e.id).catch(() => [])) as ParcelRow[];
        for (const par of parcels || []) {
          if (par.approvedAt) {
            rows.push({ ...par, estateName: e.name });
          }
        }
      }
      setApprovedParcels(rows);
      setFormParcelId((prev) => prev || (rows[0]?.id ?? ''));
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('producer.plantings.loadError'));
      setAnnouncements([]);
      setApprovedParcels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const plantings = useMemo(
    () => announcements.filter((a) => a.announcementType === 'PLANTING'),
    [announcements],
  );
  const harvests = useMemo(
    () => announcements.filter((a) => a.announcementType === 'HARVEST'),
    [announcements],
  );

  const formatDate = (iso: string) => {
    try {
      const tag = i18n.language?.startsWith('sr') ? 'sr-Latn' : 'en-GB';
      return new Date(iso).toLocaleString(tag, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  const submitPlanting = async () => {
    if (!formParcelId.trim() || !formCrop.trim() || !formDate) return;
    setSaving(true);
    setErr(null);
    try {
      await harvestAnnouncementsAPI.create({
        parcelId: formParcelId,
        announcementType: 'PLANTING',
        cropType: formCrop.trim(),
        estimatedDate: new Date(formDate + 'T12:00:00').toISOString(),
        notes: formNotes.trim() || undefined,
      });
      setFormCrop('');
      setFormNotes('');
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(' ') : msg;
      setErr(text || (e instanceof Error ? e.message : t('producer.plantings.loadError')));
    } finally {
      setSaving(false);
    }
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BioVeraSubpageHeader title={t('producer.plantings.screenTitle')} left="back" />
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
          {t('producer.plantings.intro')}
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

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} />
        ) : (
          <>
            <View
              style={{
                padding: theme.spacing.md,
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: theme.borderRadius.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginBottom: theme.spacing.lg,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: theme.spacing.sm, color: theme.colors.text.primary }}>
                {t('producer.plantings.formSectionTitle')}
              </Text>
              {approvedParcels.length === 0 ? (
                <Text style={{ fontSize: 14, color: theme.colors.warning }}>{t('producer.plantings.approvedOnlyHint')}</Text>
              ) : (
                <>
                  <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginBottom: 6 }}>
                    {t('producer.plantings.fieldParcel')}
                  </Text>
                  <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                    {approvedParcels.map((par) => {
                      const selected = formParcelId === par.id;
                      return (
                        <TouchableOpacity
                          key={par.id}
                          onPress={() => setFormParcelId(par.id)}
                          activeOpacity={0.85}
                          style={{
                            padding: theme.spacing.sm,
                            borderRadius: theme.borderRadius.md,
                            borderWidth: 2,
                            borderColor: selected ? theme.colors.primary : theme.colors.border,
                            backgroundColor: selected ? theme.colors.primaryLight : theme.colors.surface,
                          }}
                        >
                          <Text style={{ fontWeight: '600', color: theme.colors.text.primary }}>{par.estateName}</Text>
                          <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 }}>
                            {par.cropType || par.id.slice(0, 8)}…
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginBottom: 4 }}>
                    {t('producer.plantings.fieldCrop')}
                  </Text>
                  <TextInput
                    style={inputStyle}
                    value={formCrop}
                    onChangeText={setFormCrop}
                    placeholder={t('producer.plantings.phCrop')}
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                  <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginBottom: 4, marginTop: theme.spacing.md }}>
                    {t('producer.plantings.fieldDate')}
                  </Text>
                  <TextInput
                    style={inputStyle}
                    value={formDate}
                    onChangeText={setFormDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                  <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginBottom: 4, marginTop: theme.spacing.md }}>
                    {t('producer.plantings.fieldNotes')}
                  </Text>
                  <TextInput
                    style={[inputStyle, { minHeight: 72 }]}
                    value={formNotes}
                    onChangeText={setFormNotes}
                    multiline
                    placeholderTextColor={theme.colors.text.tertiary}
                  />

                  <TouchableOpacity
                    onPress={() => void submitPlanting()}
                    disabled={saving || !formCrop.trim()}
                    style={{
                      marginTop: theme.spacing.md,
                      paddingVertical: 14,
                      borderRadius: theme.borderRadius.md,
                      alignItems: 'center',
                      backgroundColor: saving || !formCrop.trim() ? theme.colors.border : theme.colors.primary,
                    }}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t('producer.plantings.submit')}</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>

            <HaBlock
              title={t('producer.plantings.sectionPlantings')}
              empty={t('producer.plantings.empty')}
              rows={plantings}
              Icon={Sprout}
              formatDate={formatDate}
              haStatus={(s) => t(`producer.plantings.ha_${s}`, { defaultValue: s })}
            />
            <HaBlock
              title={t('producer.plantings.sectionHarvests')}
              empty={t('producer.plantings.empty')}
              rows={harvests}
              Icon={Wheat}
              formatDate={formatDate}
              haStatus={(s) => t(`producer.plantings.ha_${s}`, { defaultValue: s })}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function HaBlock({
  title,
  empty,
  rows,
  Icon,
  formatDate,
  haStatus,
}: {
  title: string;
  empty: string;
  rows: HaRow[];
  Icon: typeof Sprout;
  formatDate: (iso: string) => string;
  haStatus: (s: string) => string;
}) {
  const { t } = useTranslation();
  if (!rows.length) {
    return (
      <View style={{ marginBottom: theme.spacing.md, opacity: 0.85 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Icon size={20} color={theme.colors.primary} strokeWidth={2} />
          <Text style={{ fontSize: 16, fontWeight: '700' }}>{title}</Text>
        </View>
        <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>{empty}</Text>
      </View>
    );
  }
  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.sm }}>
        <Icon size={20} color={theme.colors.primary} strokeWidth={2} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text.primary }}>{title}</Text>
      </View>
      {rows.map((a) => (
        <View
          key={a.id}
          style={{
            padding: theme.spacing.md,
            marginBottom: theme.spacing.sm,
            borderRadius: theme.borderRadius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
          }}
        >
          <Text style={{ fontWeight: '600', color: theme.colors.text.primary }}>{a.cropType}</Text>
          <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginTop: 4 }}>
            {a.parcel?.estates?.name || ''} · {a.parcel?.cropType || a.parcelId.slice(0, 8)}…
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginTop: 6 }}>
            {a.announcementType === 'PLANTING'
              ? t('producer.plantings.typePlanting')
              : t('producer.plantings.typeHarvest')}
            {' · '}
            {formatDate(a.estimatedDate)}
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: 4 }}>{haStatus(a.status)}</Text>
          {a.notes ? <Text style={{ fontSize: 13, marginTop: 6 }}>{a.notes}</Text> : null}
        </View>
      ))}
    </View>
  );
}
