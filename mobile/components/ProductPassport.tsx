import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { BioVeraBottomSheet } from './enterprise/BioVeraBottomSheet';
import { useState, useEffect, useMemo, useCallback } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle2, MapPin, Package, Truck, Thermometer } from 'lucide-react-native';
import { theme } from '../lib/theme';
import { ProductPassport as ProductPassportType } from '../lib/api';

interface ProductPassportProps {
  visible: boolean;
  batchId: string | null;
  onClose: () => void;
}

function formatDateTime(
  iso: string | Date | undefined | null,
  locale: string,
  dash: string,
): string {
  if (iso == null) return dash;
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return dash;
  const loc = locale.toLowerCase().startsWith('sr') ? 'sr-Latn' : 'en-US';
  return d.toLocaleString(loc, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapCenter(p: ProductPassportType): { latitude: number; longitude: number } | null {
  const c = p.origin?.parcelMapCenter || p.origin?.estateMapCenter;
  if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {
    return { latitude: c.lat, longitude: c.lng };
  }
  return null;
}

/**
 * Digital passport — same data as web /passport (GET /qr/verify).
 */
export default function ProductPassport({ visible, batchId, onClose }: ProductPassportProps) {
  const { t, i18n } = useTranslation();
  const [passport, setPassport] = useState<ProductPassportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dash = t('buyer.passport.dash');
  const dateLocale = typeof i18n.language === 'string' ? i18n.language : 'en';

  const fmt = useCallback(
    (iso: string | Date | undefined | null) => formatDateTime(iso, dateLocale, dash),
    [dash, dateLocale],
  );

  const loadPassport = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const { passportAPI } = await import('../lib/api');
      const data = await passportAPI.getByBatchId(batchId);
      setPassport(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(message || t('buyer.passport.loadFailed'));
      console.error('Error loading passport:', err);
    } finally {
      setLoading(false);
    }
  }, [batchId, t]);

  useEffect(() => {
    if (visible && batchId) {
      void loadPassport();
    } else {
      setPassport(null);
      setError(null);
    }
  }, [visible, batchId, loadPassport]);

  const center = useMemo(() => (passport ? mapCenter(passport) : null), [passport]);

  return (
    <BioVeraBottomSheet visible={visible} onClose={onClose}>
        <View
          style={{
            maxHeight: '92%',
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.08)',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: theme.spacing.lg,
              borderBottomWidth: 0.5,
              borderBottomColor: 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <View style={{ flex: 1 }}>
              {passport && (
                <>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '400',
                      color: theme.colors.text.primary,
                      letterSpacing: 0.5,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    {passport.batch.productName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                    <CheckCircle2 size={14} color={theme.colors.primary} strokeWidth={1} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '400',
                        color: theme.colors.primary,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      {t('buyer.passport.digitalBadge')}
                    </Text>
                  </View>
                </>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surface,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <X size={18} color={theme.colors.text.secondary} strokeWidth={1} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator>
            {loading ? (
              <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '400',
                    color: theme.colors.text.secondary,
                    marginTop: theme.spacing.md,
                  }}
                >
                  {t('buyer.passport.loading')}
                </Text>
              </View>
            ) : error ? (
              <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center' }}>{error}</Text>
              </View>
            ) : passport ? (
              <>
                {center && (
                  <View
                    style={{
                      height: 180,
                      margin: theme.spacing.md,
                      borderRadius: theme.borderRadius.md,
                      overflow: 'hidden',
                      borderWidth: 0.5,
                      borderColor: 'rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <MapView
                      style={{ flex: 1 }}
                      initialRegion={{
                        ...center,
                        latitudeDelta: 0.04,
                        longitudeDelta: 0.04,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                    >
                      <Marker coordinate={center}>
                        <View
                          style={{
                            backgroundColor: theme.colors.primary,
                            padding: 8,
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: theme.colors.background,
                          }}
                        >
                          <MapPin size={16} color={theme.colors.text.inverse} strokeWidth={1.5} />
                        </View>
                      </Marker>
                    </MapView>
                  </View>
                )}

                <View style={{ paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                  <Text style={sectionLabel}>{t('buyer.passport.sectionProduct')}</Text>
                  <Text style={bodyText}>
                    {t('buyer.passport.batchSummary', {
                      quantity: String(passport.batch.quantity),
                      unit: passport.batch.unit,
                      batchId: passport.batch.batchId,
                    })}
                  </Text>
                  {passport.batch.status && (
                    <Text style={mutedText}>
                      {t('buyer.passport.statusLine', { status: passport.batch.status })}
                    </Text>
                  )}
                </View>

                <View style={blockPad}>
                  <Text style={sectionLabel}>{t('buyer.passport.sectionRegionOrigin')}</Text>
                  <Text style={titleText}>
                    {passport.origin.regionLabel ||
                      passport.origin.harvestRegion ||
                      passport.origin.harvestLocation ||
                      dash}
                  </Text>
                  {passport.origin.productionCountry ? (
                    <Text style={bodyText}>
                      {t('buyer.passport.countryLine', { country: passport.origin.productionCountry })}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <MapPin size={14} color={theme.colors.text.secondary} strokeWidth={1} />
                    <Text style={bodyText}>{passport.origin.farmName}</Text>
                  </View>
                  {(passport.origin.estateCalculatedAreaHa != null ||
                    passport.origin.parcelCalculatedAreaHa != null) && (
                    <Text style={mutedText}>
                      {[
                        passport.origin.estateCalculatedAreaHa != null
                          ? t('buyer.passport.fieldHa', {
                              ha: Number(passport.origin.estateCalculatedAreaHa).toFixed(2),
                            })
                          : '',
                        passport.origin.parcelCalculatedAreaHa != null
                          ? t('buyer.passport.plotHa', {
                              ha: Number(passport.origin.parcelCalculatedAreaHa).toFixed(2),
                            })
                          : '',
                      ]
                        .filter(Boolean)
                        .join(t('buyer.passport.areaJoin'))}
                    </Text>
                  )}
                </View>

                <View style={blockPad}>
                  <Text style={sectionLabel}>{t('buyer.passport.sectionFarmer')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Package size={14} color={theme.colors.text.secondary} strokeWidth={1} />
                    <Text style={bodyText}>{passport.farmer.name}</Text>
                  </View>
                </View>

                <View style={blockPad}>
                  <Text style={sectionLabel}>{t('buyer.passport.sectionJourney')}</Text>
                  {passport.timeline.harvested && (
                    <JourneyRow
                      label={t('buyer.passport.journeyHarvested')}
                      value={fmt(passport.timeline.harvested)}
                      detail={passport.origin.harvestLocation}
                    />
                  )}
                  {passport.timeline.verified && (
                    <JourneyRow
                      label={t('buyer.passport.journeyQualityCheck')}
                      value={fmt(passport.timeline.verified)}
                    />
                  )}
                  {passport.timeline.loaded && (
                    <JourneyRow label={t('buyer.passport.journeyPickedUp')} value={fmt(passport.timeline.loaded)} />
                  )}
                  {passport.timeline.arrived && (
                    <JourneyRow label={t('buyer.passport.journeyArrived')} value={fmt(passport.timeline.arrived)} />
                  )}
                </View>

                {passport.treatments && passport.treatments.length > 0 && (
                  <View style={blockPad}>
                    <Text style={sectionLabel}>{t('buyer.passport.sectionSpraying')}</Text>
                    {passport.treatments.map((row, i) => (
                      <View
                        key={i}
                        style={{
                          paddingVertical: 10,
                          borderBottomWidth: i < passport.treatments!.length - 1 ? 0.5 : 0,
                          borderBottomColor: theme.colors.border,
                        }}
                      >
                        <Text style={bodyText}>{row.productName}</Text>
                        <Text style={mutedText}>
                          {row.dosage}
                          {row.waterVolume != null
                            ? ` · ${t('buyer.passport.waterVol', { vol: String(row.waterVolume) })}`
                            : ''}
                          {row.reason ? ` · ${row.reason}` : ''}
                        </Text>
                        <Text style={mutedText}>{t('buyer.passport.applied', { when: fmt(row.appliedAt) })}</Text>
                        <Text style={mutedText}>
                          {t('buyer.passport.deviceTime', { when: fmt(row.deviceTimestamp) })}
                        </Text>
                        {row.gpsLatitude != null && row.gpsLongitude != null && (
                          <Text style={mutedText}>
                            {t('buyer.passport.gpsLine', {
                              lat: row.gpsLatitude.toFixed(5),
                              lng: row.gpsLongitude.toFixed(5),
                              acc:
                                row.gpsAccuracyM != null ? t('buyer.passport.gpsAccuracyM', { m: row.gpsAccuracyM }) : '',
                            })}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {passport.missions && passport.missions.length > 0 && (
                  <View style={blockPad}>
                    <Text style={sectionLabel}>{t('buyer.passport.sectionTransport')}</Text>
                    {passport.missions.map((m, i) => (
                      <View
                        key={`${m.missionNumber || 'm'}-${i}`}
                        style={{
                          marginBottom: theme.spacing.md,
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.surface,
                          borderRadius: theme.borderRadius.md,
                          borderWidth: 0.5,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Truck size={16} color={theme.colors.primary} strokeWidth={1.5} />
                          <Text style={bodyText}>
                            {(m.missionNumber || t('buyer.passport.transportFallback')) +
                              (m.status ? ` · ${m.status}` : '')}
                          </Text>
                        </View>
                        {m.logisticsPartner?.name && (
                          <Text style={bodyText}>{t('buyer.passport.carrierLine', { name: m.logisticsPartner.name })}</Text>
                        )}
                        {m.pickupAddress && (
                          <Text style={mutedText}>{t('buyer.passport.pickupLine', { address: m.pickupAddress })}</Text>
                        )}
                        {m.vehicle && (
                          <Text style={mutedText}>
                            {[m.vehicle.make, m.vehicle.model, m.vehicle.type].filter(Boolean).join(' ')} ·{' '}
                            {m.vehicle.vehicleNumber} · {m.vehicle.licensePlate}
                          </Text>
                        )}
                        {m.assignedAt && (
                          <Text style={mutedText}>{t('buyer.passport.assignedLine', { when: fmt(m.assignedAt) })}</Text>
                        )}
                        {m.pickedUpAt && (
                          <Text style={mutedText}>{t('buyer.passport.pickedUpLine', { when: fmt(m.pickedUpAt) })}</Text>
                        )}
                        {m.deliveredAt && (
                          <Text style={mutedText}>{t('buyer.passport.deliveredLine', { when: fmt(m.deliveredAt) })}</Text>
                        )}
                        {m.borderWaits && m.borderWaits.length > 0 && (
                          <View style={{ marginTop: 8 }}>
                            {m.borderWaits.map((b, j) => (
                              <Text key={j} style={mutedText}>
                                {t('buyer.passport.borderWait', {
                                  border: b.borderName || dash,
                                  arrival: fmt(b.borderArrivalTime),
                                  exit: fmt(b.borderExitTime),
                                  minutes: String(b.waitTimeMinutes ?? dash),
                                })}
                              </Text>
                            ))}
                          </View>
                        )}
                        {m.locationLogs && m.locationLogs.length > 0 && (
                          <View style={{ marginTop: 8 }}>
                            <Text style={{ fontSize: 13, color: theme.colors.text.tertiary, marginBottom: 4 }}>
                              {t('buyer.passport.gpsLogTitle', { count: m.locationLogs.length })}
                            </Text>
                            {m.locationLogs.slice(0, 8).map((log, j) => (
                              <Text key={j} style={{ fontSize: 13, color: theme.colors.text.secondary }}>
                                {fmt(log.timestamp)} · {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                                {log.address ? ` · ${log.address}` : ''}
                              </Text>
                            ))}
                            {m.locationLogs.length > 8 && (
                              <Text style={mutedText}>
                                {t('buyer.passport.moreGpsPoints', { n: m.locationLogs.length - 8 })}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {passport.coldChainProof?.temperatureData && passport.coldChainProof.temperatureData.length > 0 && (
                  <View style={blockPad}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Thermometer size={16} color={theme.colors.primary} strokeWidth={1.5} />
                      <Text style={sectionLabel}>{t('buyer.passport.sectionColdChain')}</Text>
                    </View>
                    {passport.coldChainProof.minTemp != null && (
                      <Text style={mutedText}>
                        {t('buyer.passport.tempSummary', {
                          min: String(passport.coldChainProof.minTemp),
                          max: String(passport.coldChainProof.maxTemp),
                          avg:
                            passport.coldChainProof.avgTemp != null
                              ? Number(passport.coldChainProof.avgTemp).toFixed(1)
                              : dash,
                        })}
                      </Text>
                    )}
                    <Text style={mutedText}>
                      {t('buyer.passport.tempReadingsCount', {
                        count: passport.coldChainProof.temperatureData.length,
                      })}
                    </Text>
                  </View>
                )}

                {passport.protocol360?.levels && passport.protocol360.levels.length > 0 && (
                  <View style={blockPad}>
                    <Text style={sectionLabel}>{t('buyer.passport.sectionProtocol360')}</Text>
                    {passport.protocol360.overallStatus && <Text style={bodyText}>{passport.protocol360.overallStatus}</Text>}
                    {passport.protocol360.levels.map((lv, j) => (
                      <Text key={j} style={mutedText}>
                        {lv.name}: {lv.badgeText || lv.status}
                      </Text>
                    ))}
                  </View>
                )}

                <View style={{ height: theme.spacing.xl }} />
              </>
            ) : null}
          </ScrollView>
        </View>
    </BioVeraBottomSheet>
  );
}

const sectionLabel = {
  fontSize: 14,
  fontWeight: '500' as const,
  color: theme.colors.text.secondary,
  letterSpacing: 0.6,
  textTransform: 'uppercase' as const,
  marginBottom: 6,
};

const blockPad = { paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.lg };

const bodyText = { fontSize: 13, fontWeight: '400' as const, color: theme.colors.text.primary, lineHeight: 20 };
const titleText = { fontSize: 17, fontWeight: '500' as const, color: theme.colors.text.primary, marginBottom: 4 };
const mutedText = { fontSize: 14, fontWeight: '400' as const, color: theme.colors.text.secondary, marginTop: 2, lineHeight: 16 };

function JourneyRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={mutedText}>{label}</Text>
      <Text style={bodyText}>{value}</Text>
      {detail ? <Text style={mutedText}>{detail}</Text> : null}
    </View>
  );
}
