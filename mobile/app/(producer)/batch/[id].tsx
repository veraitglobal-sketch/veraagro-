import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, QrCode, Package, MapPin, Calendar, Truck, User, AlertCircle } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { batchesAPI } from '../../../lib/api';

/**
 * Batch Details Screen
 * Shows batch details, traceability, location history, and quality issues
 */
export default function BatchDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      loadBatch();
    }
  }, [id]);

  const loadBatch = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await batchesAPI.getOne(id);
      setBatch(data);
    } catch (error) {
      console.error('Error loading batch:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBatch();
    setRefreshing(false);
  };

  if (loading && !batch) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
          Učitavanje...
        </Text>
      </View>
    );
  }

  if (!batch) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
          Batch nije pronađen
        </Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PACKED': return colors.accent;
      case 'IN_HUB': return colors.warning;
      case 'IN_TRANSIT': return colors.primary;
      case 'DELIVERED': return colors.success || colors.primary;
      default: return colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PACKED': return 'Pakovano';
      case 'IN_HUB': return 'U hubu';
      case 'IN_TRANSIT': return 'U transportu';
      case 'DELIVERED': return 'Isporučeno';
      default: return status;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View 
        className="px-4 pt-12 pb-4 border-b-[0.5px] flex-row items-center"
        style={{ 
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: theme.spacing.md }}
        >
          <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text 
          className="text-lg flex-1"
          style={{ 
            color: colors.text.primary,
            fontWeight: '300',
            letterSpacing: 0.3,
          }}
        >
          Batch Detalji
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ padding: theme.spacing.md }}>
          {/* Batch ID & Status */}
          <View style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <QrCode size={18} color={colors.text.primary} strokeWidth={1} />
              <Text style={{
                fontSize: 15,
                fontWeight: '300',
                color: colors.text.primary,
                marginLeft: theme.spacing.xs,
                letterSpacing: 0.3,
              }}>
                {batch.batchId || batch.id}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.secondary,
              }}>
                Status
              </Text>
              <View style={{
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${getStatusColor(batch.status)}15`,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: getStatusColor(batch.status),
                  letterSpacing: 0.3,
                }}>
                  {getStatusLabel(batch.status)}
                </Text>
              </View>
            </View>
          </View>

          {/* Product Info */}
          <View style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Package size={18} color={colors.text.primary} strokeWidth={1} />
              <Text style={{
                fontSize: 15,
                fontWeight: '300',
                color: colors.text.primary,
                marginLeft: theme.spacing.xs,
                letterSpacing: 0.3,
              }}>
                Proizvod
              </Text>
            </View>
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              {batch.productName || 'Nepoznat proizvod'}
            </Text>
            {batch.quantity && (
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.secondary,
              }}>
                Količina: {batch.quantity} {batch.unit || 'kg'}
              </Text>
            )}
            {batch.harvestDate && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
                <Calendar size={14} color={colors.text.secondary} strokeWidth={1} />
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginLeft: 4,
                }}>
                  Berba: {new Date(batch.harvestDate).toLocaleDateString('sr-RS')}
                </Text>
              </View>
            )}
          </View>

          {/* Traceability */}
          <View style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}>
            <Text style={{
              fontSize: 15,
              fontWeight: '300',
              color: colors.text.primary,
              marginBottom: theme.spacing.md,
              letterSpacing: 0.3,
            }}>
              Traceability
            </Text>

            {batch.harvestedBy && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginBottom: theme.spacing.sm,
                paddingBottom: theme.spacing.sm,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.border,
              }}>
                <User size={14} color={colors.text.secondary} strokeWidth={1} />
                <View style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: colors.text.secondary,
                  }}>
                    Berba
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: colors.text.primary,
                  }}>
                    {batch.harvestedBy.firstName} {batch.harvestedBy.lastName}
                  </Text>
                </View>
              </View>
            )}

            {batch.transportedByDriver && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginBottom: theme.spacing.sm,
                paddingBottom: theme.spacing.sm,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.border,
              }}>
                <Truck size={14} color={colors.text.secondary} strokeWidth={1} />
                <View style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: colors.text.secondary,
                  }}>
                    Transport
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: colors.text.primary,
                  }}>
                    {batch.transportedByDriver.firstName} {batch.transportedByDriver.lastName}
                  </Text>
                </View>
              </View>
            )}

            {batch.currentHub && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
              }}>
                <MapPin size={14} color={colors.text.secondary} strokeWidth={1} />
                <View style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: colors.text.secondary,
                  }}>
                    Trenutna lokacija
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: colors.text.primary,
                  }}>
                    {batch.currentHub.name || 'Hub'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Location History */}
          {batch.locationHistory && Array.isArray(batch.locationHistory) && batch.locationHistory.length > 0 && (
            <View style={{
              backgroundColor: colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '300',
                color: colors.text.primary,
                marginBottom: theme.spacing.md,
                letterSpacing: 0.3,
              }}>
                Istorija lokacija
              </Text>
              <View style={{ gap: theme.spacing.sm }}>
                {batch.locationHistory.map((entry: any, index: number) => (
                  <View
                    key={index}
                    style={{
                      paddingBottom: index < batch.locationHistory.length - 1 ? theme.spacing.sm : 0,
                      borderBottomWidth: index < batch.locationHistory.length - 1 ? 0.5 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '300',
                      color: colors.text.primary,
                    }}>
                      {entry.hubId || entry.location || 'Nepoznata lokacija'}
                    </Text>
                    {entry.timestamp && (
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: colors.text.secondary,
                        marginTop: 2,
                      }}>
                        {new Date(entry.timestamp).toLocaleDateString('sr-RS', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quality Issues */}
          {batch.qualityIssues && (
            <View style={{
              backgroundColor: `${colors.error}10`,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: colors.error,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <AlertCircle size={18} color={colors.error} strokeWidth={1} />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '300',
                  color: colors.error,
                  marginLeft: theme.spacing.xs,
                  letterSpacing: 0.3,
                }}>
                  Problemi sa kvalitetom
                </Text>
              </View>
              {typeof batch.qualityIssues === 'string' ? (
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.primary,
                }}>
                  {batch.qualityIssues}
                </Text>
              ) : batch.qualityIssues.issue ? (
                <>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: colors.text.primary,
                  }}>
                    {batch.qualityIssues.issue}
                  </Text>
                  {batch.qualityIssues.timestamp && (
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: colors.text.secondary,
                      marginTop: theme.spacing.xs,
                    }}>
                      Prijavljeno: {new Date(batch.qualityIssues.timestamp).toLocaleDateString('sr-RS')}
                    </Text>
                  )}
                </>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
