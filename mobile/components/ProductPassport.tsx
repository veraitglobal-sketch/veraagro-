import { historyFactLabel } from '../../shared/passport/history-labels';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Linking } from 'react-native';
import { BioVeraBottomSheet } from './enterprise/BioVeraBottomSheet';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MapPin, Truck, Thermometer, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react-native';
import { theme } from '../lib/theme';
import { ProductPassport as ProductPassportType } from '../lib/api';
import { PassportRequestGuard } from '../../shared/passport/stale-fetch-guard';
import { passportEstimateSourceKey } from '../../shared/passport/estimate-source';
import ReportProblemForm from './ReportProblemForm';
import { passportDocumentUrl } from '../../shared/passport/document-url';
import { API_URL } from '../lib/api-url';
import { productNameLabel } from '../../shared/i18n/labels';
import { intlLocaleFor } from '../../shared/i18n/format';
import ProductionHistory from './ProductionHistory';
import { seedOriginDetails } from '../../shared/passport/seed-origin';

interface ProductPassportProps {
  visible: boolean;
  batchId: string | null;
  badgeSerial?: string | null;
  onClose: () => void;
}

function formatDateTime(iso: string | Date | undefined | null, locale: string, dash: string): string {
  if (iso == null) return dash;
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return dash;
  const loc = intlLocaleFor(locale);
  return d.toLocaleString(loc, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string | Date | undefined | null, locale: string, dash: string) {
  if (iso == null) return dash;
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return dash;
  const loc = intlLocaleFor(locale);
  return d.toLocaleDateString(loc, { day: '2-digit', month: 'short', year: 'numeric' });
}

function CollapsibleBlock({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, paddingVertical: 8 }}
        accessibilityRole="button"
      >
        <Text style={sectionLabel}>{title}</Text>
        {open ? <ChevronUp size={18} color={theme.colors.text.secondary} /> : <ChevronDown size={18} color={theme.colors.text.secondary} />}
      </TouchableOpacity>
      {open ? <View style={{ paddingTop: 4 }}>{children}</View> : null}
    </View>
  );
}

export default function ProductPassport({ visible, batchId, badgeSerial = null, onClose }: ProductPassportProps) {
  const { t, i18n } = useTranslation();
  const [passport, setPassport] = useState<ProductPassportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedForBatchId, setLoadedForBatchId] = useState<string | null>(null);
  const [loadedForBadgeSerial, setLoadedForBadgeSerial] = useState<string | null>(null);
  const requestGuard = useRef(new PassportRequestGuard());

  const dash = t('buyer.passport.dash');
  const notRecorded = t('buyer.passport.notRecorded');
  const dateLocale = typeof i18n.language === 'string' ? i18n.language : 'en';

  const fmt = useCallback((iso: string | Date | undefined | null) => formatDateTime(iso, dateLocale, dash), [dash, dateLocale]);
  const fmtDate = useCallback((iso: string | Date | undefined | null) => formatDate(iso, dateLocale, dash), [dash, dateLocale]);

  const estimateSourceLabel = useCallback(
    (source: string) => {
      const key = passportEstimateSourceKey(source);
      const i18nKey = `buyer.passport.estimateSource.${key}`;
      const translated = t(i18nKey);
      return translated === i18nKey ? source : translated;
    },
    [t],
  );

  const loadPassport = useCallback(async () => {
    if (!batchId) return;
    const seq = requestGuard.current.begin();
    const targetBatchId = batchId;
    const targetBadge = badgeSerial?.trim() || null;
    setLoading(true);
    setError(null);
    setPassport(null);
    setLoadedForBatchId(null);
    setLoadedForBadgeSerial(null);
    try {
      const { passportAPI } = await import('../lib/api');
      const data = await passportAPI.getByBatchId(targetBatchId, targetBadge);
      if (!requestGuard.current.isLatest(seq)) return;
      setPassport(data);
      setLoadedForBatchId(targetBatchId);
      setLoadedForBadgeSerial(targetBadge);
    } catch (err: unknown) {
      if (!requestGuard.current.isLatest(seq)) return;
      setError(err instanceof Error ? err.message : t('buyer.passport.loadFailed'));
      setPassport(null);
    } finally {
      if (requestGuard.current.isLatest(seq)) setLoading(false);
    }
  }, [batchId, badgeSerial, t]);

  useEffect(() => {
    if (visible && batchId) void loadPassport();
    else if (!visible) {
      requestGuard.current.invalidate();
      setPassport(null);
      setError(null);
      setLoadedForBatchId(null);
      setLoadedForBadgeSerial(null);
      setLoading(false);
    }
  }, [visible, batchId, badgeSerial, loadPassport]);

  const summary = passport?.summary;
  const showPassport =
    passport &&
    loadedForBatchId === batchId &&
    (loadedForBadgeSerial ?? null) === (badgeSerial?.trim() || null);
  const photoUri = summary?.productPhotoUrl ?? passport?.photos?.[0]?.url ?? null;

  const deliveryAt = useMemo(() => {
    if (!passport) return null;
    if (passport.timeline?.arrived) return passport.timeline.arrived;
    const missionDelivered = (passport.missions ?? []).find((m) => m.deliveredAt)?.deliveredAt;
    return missionDelivered ?? null;
  }, [passport]);

  const warnings = useMemo(() => {
    if (!passport) return [];
    const msgs: string[] = [];
    if (passport.batch.isCompromised) msgs.push(t('buyer.passport.warningTemperature'));
    if (passport.seedOrigin?.some((s) => s.recalled) || passport.warnings?.some((w) => w.code === 'SEED_RECALLED')) {
      msgs.push(t('buyer.passport.warningSeedRecalled'));
    }
    return msgs;
  }, [passport, t]);

  const fieldWorkGeneral = useMemo(() => {
    return (passport?.fieldWork ?? []).filter((e) => !/^(PRSKANJE|PRIHRANA|SPRAYING|SPRAY|TREATMENT|FERTILIZING|FERTILIZER|PESTICIDE)/i.test(e.type));
  }, [passport?.fieldWork]);

  const coldChain = passport?.coldChainProof;
  const tempCriteriaResult = useMemo(() => {
    if (!coldChain?.hasReadings) return null;
    if (coldChain.readingsWithinCriteria === true) return t('buyer.passport.tempWithinCriteria');
    if (coldChain.readingsWithinCriteria === false) return t('buyer.passport.tempOutsideCriteria');
    return notRecorded;
  }, [coldChain, notRecorded, t]);

  return (
    <BioVeraBottomSheet visible={visible} onClose={onClose}>
      <View style={{ maxHeight: '92%', borderWidth: 0.5, borderColor: 'rgba(0, 0, 0, 0.08)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.lg, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0, 0, 0, 0.08)' }}>
          <View style={{ flex: 1 }}>
            {showPassport && (
              <>
                <Text style={{ fontSize: 16, fontWeight: '500', color: theme.colors.text.primary }}>{productNameLabel(t, summary?.productName ?? passport!.batch.productName)}</Text>
                <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 }}>{summary?.variety?.trim() ? summary.variety : notRecorded}</Text>
                {summary?.productDescription ? (
                  <Text style={{ fontSize: 13, color: theme.colors.text.primary, marginTop: 6 }}>{summary.productDescription}</Text>
                ) : null}
              </>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <X size={18} color={theme.colors.text.secondary} strokeWidth={1} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator>
          {loading ? (
            <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginTop: theme.spacing.md }}>{t('buyer.passport.loading')}</Text>
            </View>
          ) : error ? (
            <View style={{ padding: theme.spacing.xl, alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center' }}>{error}</Text>
              <TouchableOpacity onPress={() => void loadPassport()} style={{ minHeight: 48, paddingHorizontal: 20, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: theme.colors.text.inverse, fontSize: 15 }}>{t('buyer.passport.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : showPassport ? (
            <View style={{ padding: theme.spacing.md }}>
              {warnings.map((msg) => (
                <View key={msg} style={{ flexDirection: 'row', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, marginBottom: theme.spacing.sm }}>
                  <AlertTriangle size={16} color="#B45309" />
                  <Text style={{ flex: 1, fontSize: 13, color: '#92400E' }}>{msg}</Text>
                </View>
              ))}

              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ width: '100%', height: 160, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md, backgroundColor: theme.colors.surface }} resizeMode="cover" />
              ) : null}

              <View style={blockPad}>
                <Text style={mutedText}>{t('buyer.passport.lotQuantity', { quantity: String(summary?.lot.totalQuantity ?? passport!.batch.quantity), unit: summary?.lot.unit ?? passport!.batch.unit })}</Text>
                <Text style={mutedText}>{t('buyer.passport.batchLine', { batchId: summary?.lot.batchId ?? passport!.batch.batchId })}</Text>
                {summary?.identifiedPackaging ? (
                  <Text style={mutedText}>{t('buyer.passport.thisPackage', { serial: summary.identifiedPackaging.badgeSerial, type: summary.identifiedPackaging.badgeType })}</Text>
                ) : null}
                <Text style={bodyText}>{t('buyer.passport.harvestDate')}: {fmtDate(summary?.actualHarvestDate ?? passport!.batch.harvestDate) ?? notRecorded}</Text>
                {summary?.actualPackDate ? (
                  <Text style={bodyText}>{t('buyer.passport.packDate', 'Packed on')}: {fmtDate(summary.actualPackDate) ?? notRecorded}</Text>
                ) : null}
              </View>

              <View style={blockPad}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MapPin size={14} color={theme.colors.text.secondary} />
                  <Text style={bodyText}>{summary?.producerName ?? passport!.origin.farmName}</Text>
                </View>
                <Text style={mutedText}>{summary?.regionLabel ?? passport!.origin.regionLabel ?? dash}</Text>
              </View>

              {(summary?.storage.productStorageConditions || summary?.storage.platformStandard || summary?.storage.declaredShelfLifeHours != null || summary?.storage.freshnessEstimate) ? (
                <View style={blockPad}>
                  {summary?.storage.productStorageConditions ? (
                    <Text style={mutedText}>{t('buyer.passport.productStorage', 'Storage')}: {summary.storage.productStorageConditions}</Text>
                  ) : null}
                  {summary?.storage.platformStandard ? (
                    <Text style={mutedText}>{t('buyer.passport.platformStandard')}: {summary.storage.platformStandard.label}</Text>
                  ) : null}
                  {summary?.storage.declaredShelfLifeHours != null ? (
                    <Text style={mutedText}>{t('buyer.passport.declaredShelfLife', 'Declared shelf life')}: {summary.storage.declaredShelfLifeHours} h</Text>
                  ) : null}
                  {summary?.storage.freshnessEstimate?.remainingHours != null ? (
                    <Text style={mutedText}>
                      {t('buyer.passport.freshnessEstimate')}: ~{Math.round(summary.storage.freshnessEstimate.remainingHours)} h ({estimateSourceLabel(summary.storage.freshnessEstimate.source)})
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {passport!.originCandidate?.status === 'PENDING_DOCUMENTATION' && passport!.originCandidate.verified === false ? (
                <View style={{ borderWidth: 1, borderColor: '#fde68a', backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <Text style={{ fontWeight: '600' }}>{t('glossary.productionHistory.candidateSupplier')}</Text>
                  <Text style={{ marginTop: 4 }}>{passport!.originCandidate.supplierName}</Text>
                  <Text style={{ color: '#92400e', marginTop: 8, fontWeight: '600' }}>{t('glossary.productionHistory.pendingOrigin')}</Text>
                  <Text style={mutedText}>{t('glossary.productionHistory.pendingOriginHelp')}</Text>
                </View>
              ) : null}
              <ProductionHistory events={passport!.productionHistory} gaps={passport!.historyGaps} />
              <CollapsibleBlock title={t('buyer.passport.sectionOrigin')}>
                {passport!.parcelInfo ? <Text style={mutedText}>{t('buyer.passport.crop')}: {productNameLabel(t, passport!.parcelInfo.cropType) || notRecorded}</Text> : null}
                {fieldWorkGeneral.map((e, i) => (
                  <Text key={`fw-${i}`} style={mutedText}>{historyFactLabel(t, { label: 'activity', value: e.type })}{e.materialName ? ` · ${e.materialName}` : ''} · {fmt(e.occurredAt)}</Text>
                ))}
                {(passport!.treatments ?? []).map((row, i) => (
                  <Text key={`tr-${i}`} style={mutedText}>
                    {row.productName}
                    {row.dosage ? ` · ${row.dosage}` : ''}
                    {' · '}{fmt(row.appliedAt)}
                  </Text>
                ))}
                {(passport!.growthLogs ?? []).map((g, i) => (
                  <View key={`gl-${i}`} style={{ marginTop: 6 }}>
                    <Text style={mutedText}>
                      {g.growthStage ?? t('buyer.passport.growthLog')} · {fmt(g.networkTimestamp)}
                    </Text>
                    {g.notes ? <Text style={mutedText}>{g.notes}</Text> : null}
                    {g.imageUrl ? (
                      <Image source={{ uri: g.imageUrl }} style={{ width: '100%', height: 120, borderRadius: theme.borderRadius.md, marginTop: 6, backgroundColor: theme.colors.surface }} resizeMode="cover" />
                    ) : null}
                  </View>
                ))}
                {(passport!.seedOrigin ?? []).map((s, i) => (
                  <View key={`sd-${i}`} style={{ marginTop: 10 }}>
                    <Text style={[mutedText, { fontWeight: '600' }, s.recalled ? { color: '#B45309' } : undefined]}>
                      {productNameLabel(t, s.product)}{s.recalled ? ` · ${t('buyer.passport.warningSeedRecalled')}` : ''}
                    </Text>
                    {seedOriginDetails(s, t, fmtDate).map(detail => (
                      <Text key={detail.label} style={mutedText}>{detail.label}: {detail.value}</Text>
                    ))}
                  </View>
                ))}
              </CollapsibleBlock>

              <CollapsibleBlock title={t('buyer.passport.sectionHarvestPack')}>
                {(passport!.packingRecords ?? []).map((p, i) => (
                  <Text key={`pr-${i}`} style={mutedText}>
                    {[p.packagingType ?? p.packLabel, p.packSizeKg != null ? `${p.packSizeKg} kg` : null, p.packedPackCount != null ? `${p.packedPackCount}×` : null]
                      .filter(Boolean)
                      .join(' · ')}
                    {p.packedAt ? ` · ${fmtDate(p.packedAt)}` : ''}
                    {p.declaredShelfLifeHours != null ? ` · ${t('buyer.passport.declaredShelfLife', 'Declared shelf life')}: ${p.declaredShelfLifeHours} h` : ''}
                  </Text>
                ))}
                {(passport!.lotPackagingFormats ?? []).map((p, i) => (
                  <Text key={i} style={mutedText}>
                    {[p.label, p.packSizeKg != null ? `${p.packSizeKg} kg` : null].filter(Boolean).join(' · ')} ({t('buyer.passport.lotOrdersScope')})
                  </Text>
                ))}
                {(passport!.packageBadges ?? []).map((b, i) => (
                  <Text key={i} style={mutedText}>{b.serial} · {b.type}</Text>
                ))}
                {!(passport!.packingRecords?.length || passport!.lotPackagingFormats?.length || passport!.packageBadges?.length) ? (
                  <Text style={mutedText}>{notRecorded}</Text>
                ) : null}
              </CollapsibleBlock>

              <CollapsibleBlock title={t('buyer.passport.sectionQuality')}>
                {passport!.qualityEntry?.weatherAtHarvestSummary ? <Text style={mutedText}>{passport!.qualityEntry.weatherAtHarvestSummary}</Text> : null}
                {passport!.qualityEntry?.notes ? <Text style={mutedText}>{passport!.qualityEntry.notes}</Text> : null}
                {passport!.qualityEntry?.status ? <Text style={mutedText}>{t('buyer.passport.qualityStatus')}: {passport!.qualityEntry.status}</Text> : null}
                {passport!.protocol360?.overallStatus ? (
                  <Text style={mutedText}>{t('buyer.passport.protocol360Overall')}: {passport!.protocol360.overallStatus}</Text>
                ) : null}
                {(passport!.protocol360?.levels ?? []).map((level, i) => (
                  <Text key={`p360-${i}`} style={mutedText}>
                    {t('buyer.passport.protocol360Level', { level: level.level, name: level.name, status: level.status })}
                  </Text>
                ))}
                {!passport!.qualityEntry && !(passport!.protocol360?.levels?.length) ? <Text style={mutedText}>{notRecorded}</Text> : null}
                {(passport!.growthLogs ?? []).filter((g) => g.labResultUrl).map((g, i) => (
                  <TouchableOpacity key={i} onPress={() => g.labResultUrl && void Linking.openURL(g.labResultUrl)}>
                    <Text style={{ fontSize: 13, color: theme.colors.primary, marginTop: 4 }}>{t('buyer.passport.labDocument')}</Text>
                  </TouchableOpacity>
                ))}
              </CollapsibleBlock>

              <CollapsibleBlock title={t('buyer.passport.sectionJourney')}>
                {passport!.timeline.harvested && <Text style={mutedText}>{t('buyer.passport.journeyHarvested')}: {fmt(passport!.timeline.harvested)}</Text>}
                {passport!.timeline.loaded && <Text style={mutedText}>{t('buyer.passport.journeyPickedUp')}: {fmt(passport!.timeline.loaded)}</Text>}
                {deliveryAt ? (
                  <Text style={mutedText}>{t('buyer.passport.journeyArrived')}: {fmt(deliveryAt)}</Text>
                ) : (
                  <Text style={mutedText}>{t('buyer.passport.journeyArrived')}: {notRecorded}</Text>
                )}
                {coldChain?.hasReadings ? (
                  <View style={{ marginTop: 8, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Thermometer size={14} color={theme.colors.primary} />
                      <Text style={mutedText}>
                        {t('buyer.passport.tempReadingsCount', { count: coldChain.readingsCount ?? 0 })}
                      </Text>
                    </View>
                    {coldChain.minTemp != null && coldChain.maxTemp != null ? (
                      <Text style={mutedText}>
                        {t('buyer.passport.tempSummary', {
                          min: coldChain.minTemp.toFixed(1),
                          max: coldChain.maxTemp.toFixed(1),
                          avg: coldChain.avgTemp != null ? coldChain.avgTemp.toFixed(1) : dash,
                        })}
                      </Text>
                    ) : null}
                    {coldChain.evaluationCriteria ? (
                      <Text style={mutedText}>{t('buyer.passport.tempCriteria')}: {coldChain.evaluationCriteria}</Text>
                    ) : null}
                    {tempCriteriaResult ? (
                      <Text style={mutedText}>{t('buyer.passport.tempResult')}: {tempCriteriaResult}</Text>
                    ) : null}
                  </View>
                ) : (
                  <Text style={mutedText}>{t('buyer.passport.noTempReadings')}</Text>
                )}
                <Text style={[mutedText, { fontStyle: 'italic' }]}>{t('buyer.passport.spotReadingsDisclaimer')}</Text>
                {(passport!.missions ?? []).slice(0, 2).map((m, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <Truck size={14} color={theme.colors.primary} />
                    <Text style={mutedText}>
                      {m.missionNumber ?? t('buyer.passport.transportFallback')}
                      {m.pickedUpAt ? ` · ${fmt(m.pickedUpAt)}` : ''}
                      {m.deliveredAt ? ` · ${t('buyer.passport.deliveredLine', { when: fmt(m.deliveredAt) })}` : ''}
                    </Text>
                  </View>
                ))}
              </CollapsibleBlock>

              {(passport!.passportDocuments?.length ?? 0) > 0 ? (
                <CollapsibleBlock title={t('buyer.passport.sectionDocuments', 'Documents')}>
                  {(passport!.passportDocuments ?? []).map((doc) => (
                    <TouchableOpacity key={doc.id} onPress={() => {
                      const url = passportDocumentUrl(doc.url, API_URL);
                      if (url) void Linking.openURL(url);
                    }}>
                      <Text style={{ fontSize: 13, color: theme.colors.primary, marginBottom: 4 }}>
                        {doc.title}
                        {doc.verificationStatus === 'CONFIRMED' ? ` · ${t('buyer.passport.docConfirmed', 'verified')}` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </CollapsibleBlock>
              ) : null}

              {batchId ? <ReportProblemForm batchId={batchId} badgeSerial={badgeSerial} /> : null}

              <View style={{ height: theme.spacing.xl }} />
            </View>
          ) : null}
        </ScrollView>
      </View>
    </BioVeraBottomSheet>
  );
}

const sectionLabel = { fontSize: 14, fontWeight: '500' as const, color: theme.colors.text.secondary, letterSpacing: 0.6, textTransform: 'uppercase' as const };
const blockPad = { marginBottom: theme.spacing.lg };
const bodyText = { fontSize: 14, color: theme.colors.text.primary, lineHeight: 20 };
const mutedText = { fontSize: 13, color: theme.colors.text.secondary, marginTop: 4, lineHeight: 18 };
