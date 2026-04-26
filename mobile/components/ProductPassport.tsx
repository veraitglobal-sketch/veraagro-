import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { X, CheckCircle2, MapPin, Package, Truck, Thermometer } from 'lucide-react-native';
import { theme } from '../lib/theme';
import { ProductPassport as ProductPassportType } from '../lib/api';

interface ProductPassportProps {
  visible: boolean;
  batchId: string | null;
  onClose: () => void;
}

function formatDateTime(iso: string | Date | undefined | null): string {
  if (iso == null) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
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
  const [passport, setPassport] = useState<ProductPassportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && batchId) {
      loadPassport();
    } else {
      setPassport(null);
      setError(null);
    }
  }, [visible, batchId]);

  const loadPassport = async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const { passportAPI } = await import('../lib/api');
      const data = await passportAPI.getByBatchId(batchId);
      setPassport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load passport');
      console.error('Error loading passport:', err);
    } finally {
      setLoading(false);
    }
  };

  const center = useMemo(() => (passport ? mapCenter(passport) : null), [passport]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: theme.borderRadius.xl,
            borderTopRightRadius: theme.borderRadius.xl,
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
                      fontWeight: '300',
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
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.primary,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      Digital passport
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
                    fontSize: 12,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    marginTop: theme.spacing.md,
                  }}
                >
                  Loading passport...
                </Text>
              </View>
            ) : error ? (
              <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: theme.colors.text.secondary, textAlign: 'center' }}>{error}</Text>
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
                  <Text style={sectionLabel}>Product</Text>
                  <Text style={bodyText}>
                    {passport.batch.quantity} {passport.batch.unit} · Batch {passport.batch.batchId}
                  </Text>
                  {passport.batch.status && (
                    <Text style={mutedText}>Status: {passport.batch.status}</Text>
                  )}
                </View>

                <View style={blockPad}>
                  <Text style={sectionLabel}>Region & origin</Text>
                  <Text style={titleText}>{passport.origin.regionLabel || passport.origin.harvestRegion || passport.origin.harvestLocation || '—'}</Text>
                  {passport.origin.productionCountry ? (
                    <Text style={bodyText}>Country: {passport.origin.productionCountry}</Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <MapPin size={14} color={theme.colors.text.secondary} strokeWidth={1} />
                    <Text style={bodyText}>{passport.origin.farmName}</Text>
                  </View>
                  {(passport.origin.estateCalculatedAreaHa != null || passport.origin.parcelCalculatedAreaHa != null) && (
                    <Text style={mutedText}>
                      {passport.origin.estateCalculatedAreaHa != null
                        ? `Field: ${Number(passport.origin.estateCalculatedAreaHa).toFixed(2)} ha`
                        : ''}
                      {passport.origin.parcelCalculatedAreaHa != null
                        ? ` · Plot: ${Number(passport.origin.parcelCalculatedAreaHa).toFixed(2)} ha`
                        : ''}
                    </Text>
                  )}
                </View>

                <View style={blockPad}>
                  <Text style={sectionLabel}>Farmer</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Package size={14} color={theme.colors.text.secondary} strokeWidth={1} />
                    <Text style={bodyText}>{passport.farmer.name}</Text>
                  </View>
                </View>

                <View style={blockPad}>
                  <Text style={sectionLabel}>Journey</Text>
                  {passport.timeline.harvested && (
                    <JourneyRow label="Harvested" value={formatDateTime(passport.timeline.harvested)} detail={passport.origin.harvestLocation} />
                  )}
                  {passport.timeline.verified && (
                    <JourneyRow label="Quality check" value={formatDateTime(passport.timeline.verified)} />
                  )}
                  {passport.timeline.loaded && (
                    <JourneyRow label="Picked up" value={formatDateTime(passport.timeline.loaded)} />
                  )}
                  {passport.timeline.arrived && (
                    <JourneyRow label="Arrived" value={formatDateTime(passport.timeline.arrived)} />
                  )}
                </View>

                {passport.treatments && passport.treatments.length > 0 && (
                  <View style={blockPad}>
                    <Text style={sectionLabel}>Spraying & inputs</Text>
                    {passport.treatments.map((t, i) => (
                      <View
                        key={i}
                        style={{
                          paddingVertical: 10,
                          borderBottomWidth: i < passport.treatments!.length - 1 ? 0.5 : 0,
                          borderBottomColor: theme.colors.border,
                        }}
                      >
                        <Text style={bodyText}>{t.productName}</Text>
                        <Text style={mutedText}>
                          {t.dosage}
                          {t.waterVolume != null ? ` · water ${t.waterVolume} L` : ''}
                          {t.reason ? ` · ${t.reason}` : ''}
                        </Text>
                        <Text style={mutedText}>Applied: {formatDateTime(t.appliedAt)}</Text>
                        <Text style={mutedText}>Device time: {formatDateTime(t.deviceTimestamp)}</Text>
                        {t.gpsLatitude != null && t.gpsLongitude != null && (
                          <Text style={mutedText}>
                            GPS: {t.gpsLatitude.toFixed(5)}, {t.gpsLongitude.toFixed(5)}
                            {t.gpsAccuracyM != null ? ` (±${t.gpsAccuracyM}m)` : ''}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {passport.missions && passport.missions.length > 0 && (
                  <View style={blockPad}>
                    <Text style={sectionLabel}>Transport</Text>
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
                            {m.missionNumber || 'Transport'} {m.status ? `· ${m.status}` : ''}
                          </Text>
                        </View>
                        {m.logisticsPartner?.name && <Text style={bodyText}>Carrier: {m.logisticsPartner.name}</Text>}
                        {m.pickupAddress && <Text style={mutedText}>Pickup: {m.pickupAddress}</Text>}
                        {m.vehicle && (
                          <Text style={mutedText}>
                            {[m.vehicle.make, m.vehicle.model, m.vehicle.type].filter(Boolean).join(' ')} · {m.vehicle.vehicleNumber} · {m.vehicle.licensePlate}
                          </Text>
                        )}
                        {m.assignedAt && <Text style={mutedText}>Assigned: {formatDateTime(m.assignedAt)}</Text>}
                        {m.pickedUpAt && <Text style={mutedText}>Picked up: {formatDateTime(m.pickedUpAt)}</Text>}
                        {m.deliveredAt && <Text style={mutedText}>Delivered: {formatDateTime(m.deliveredAt)}</Text>}
                        {m.borderWaits && m.borderWaits.length > 0 && (
                          <View style={{ marginTop: 8 }}>
                            {m.borderWaits.map((b, j) => (
                              <Text key={j} style={mutedText}>
                                Border {b.borderName || ''}: {formatDateTime(b.borderArrivalTime)} – {formatDateTime(b.borderExitTime)} ({b.waitTimeMinutes} min)
                              </Text>
                            ))}
                          </View>
                        )}
                        {m.locationLogs && m.locationLogs.length > 0 && (
                          <View style={{ marginTop: 8 }}>
                            <Text style={{ fontSize: 10, color: theme.colors.text.tertiary, marginBottom: 4 }}>GPS log ({m.locationLogs.length})</Text>
                            {m.locationLogs.slice(0, 8).map((log, j) => (
                              <Text key={j} style={{ fontSize: 10, color: theme.colors.text.secondary }}>
                                {formatDateTime(log.timestamp)} · {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                                {log.address ? ` · ${log.address}` : ''}
                              </Text>
                            ))}
                            {m.locationLogs.length > 8 && (
                              <Text style={mutedText}>+{m.locationLogs.length - 8} more points</Text>
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
                      <Text style={sectionLabel}>Cold chain</Text>
                    </View>
                    {passport.coldChainProof.minTemp != null && (
                      <Text style={mutedText}>
                        Min {passport.coldChainProof.minTemp}°C · Max {passport.coldChainProof.maxTemp}°C · Avg{' '}
                        {passport.coldChainProof.avgTemp != null ? Number(passport.coldChainProof.avgTemp).toFixed(1) : '—'}°C
                      </Text>
                    )}
                    <Text style={mutedText}>{passport.coldChainProof.temperatureData.length} temperature readings</Text>
                  </View>
                )}

                {passport.protocol360?.levels && passport.protocol360.levels.length > 0 && (
                  <View style={blockPad}>
                    <Text style={sectionLabel}>Protocol 360</Text>
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
      </View>
    </Modal>
  );
}

const sectionLabel = {
  fontSize: 11,
  fontWeight: '500' as const,
  color: theme.colors.text.secondary,
  letterSpacing: 0.6,
  textTransform: 'uppercase' as const,
  marginBottom: 6,
};

const blockPad = { paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.lg };

const bodyText = { fontSize: 13, fontWeight: '400' as const, color: theme.colors.text.primary, lineHeight: 20 };
const titleText = { fontSize: 17, fontWeight: '500' as const, color: theme.colors.text.primary, marginBottom: 4 };
const mutedText = { fontSize: 11, fontWeight: '300' as const, color: theme.colors.text.secondary, marginTop: 2, lineHeight: 16 };

function JourneyRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={mutedText}>{label}</Text>
      <Text style={bodyText}>{value}</Text>
      {detail ? <Text style={mutedText}>{detail}</Text> : null}
    </View>
  );
}
