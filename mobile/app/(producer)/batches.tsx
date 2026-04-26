import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Package, QrCode, Calendar } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { batchesAPI } from '../../lib/api';

/**
 * Batches Screen
 * List of all batches with status and traceability
 * Matches buyer dashboard styling
 */
export default function BatchesScreen() {
  const p = useBioVeraScreenPadding();
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'PACKED' | 'IN_HUB' | 'IN_TRANSIT' | 'DELIVERED'>('all');

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await batchesAPI.getAll();
      setBatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading batches:', error);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBatches();
    setRefreshing(false);
  };

  const filteredBatches = filter === 'all' 
    ? batches 
    : batches.filter(b => b.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PACKED': return theme.colors.accent;
      case 'IN_HUB': return theme.colors.warning;
      case 'IN_TRANSIT': return theme.colors.primary;
      case 'DELIVERED': return theme.colors.success || theme.colors.primary;
      default: return theme.colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PACKED': return 'Packed';
      case 'IN_HUB': return 'In Hub';
      case 'IN_TRANSIT': return 'In Transit';
      case 'DELIVERED': return 'Delivered';
      default: return status;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: p.headerTop,
        paddingBottom: theme.spacing.md,
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ marginRight: theme.spacing.md }}
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 18,
          fontWeight: '300',
          color: theme.colors.text.primary,
          letterSpacing: 0.5,
          flex: 1,
        }}>
          Batches
        </Text>
      </View>

      {/* Filters */}
      <View style={{
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {[
              { id: 'all' as const, label: 'All' },
              { id: 'PACKED' as const, label: 'Packed' },
              { id: 'IN_HUB' as const, label: 'In Hub' },
              { id: 'IN_TRANSIT' as const, label: 'In Transit' },
              { id: 'DELIVERED' as const, label: 'Delivered' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  borderWidth: 0.5,
                  borderColor: filter === f.id ? theme.colors.primary : 'rgba(0, 0, 0, 0.05)',
                  backgroundColor: filter === f.id ? `${theme.colors.primary}10` : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: filter === f.id ? theme.colors.primary : theme.colors.text.secondary,
                  letterSpacing: 0.3,
                }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Batches List */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View
          style={{
            paddingTop: theme.spacing.md,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          {loading ? (
            <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
              <Text style={{
                color: theme.colors.text.secondary,
                fontSize: 11,
                fontWeight: '300',
                letterSpacing: 0.3,
              }}>
                Loading...
              </Text>
            </View>
          ) : filteredBatches.length === 0 ? (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.xl,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
            }}>
              <Package size={32} color={theme.colors.text.tertiary} strokeWidth={1} />
              <Text style={{
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                marginTop: theme.spacing.sm,
                letterSpacing: 0.3,
                textAlign: 'center',
              }}>
                No Batches
              </Text>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {filteredBatches.map((batch) => (
                <TouchableOpacity
                  key={batch.id}
                  onPress={() => router.push(`/(producer)/batch/${batch.id}`)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    borderWidth: 0.5,
                    borderColor: 'rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: `${getStatusColor(batch.status)}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing.sm,
                    }}>
                      <Package size={20} color={getStatusColor(batch.status)} strokeWidth={1} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                        <QrCode size={14} color={theme.colors.text.secondary} strokeWidth={1} />
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '300',
                          color: theme.colors.text.primary,
                          marginLeft: theme.spacing.xs,
                          letterSpacing: 0.3,
                        }}>
                          {batch.batchId || batch.id.slice(0, 8)}
                        </Text>
                      </View>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                        letterSpacing: 0.2,
                      }}>
                        {batch.productName || 'Product'}
                      </Text>
                      {batch.quantity && (
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '300',
                          color: theme.colors.text.secondary,
                          marginTop: 2,
                          letterSpacing: 0.2,
                        }}>
                          {batch.quantity} {batch.unit || 'kg'}
                        </Text>
                      )}
                    </View>
                    <View style={{
                      paddingHorizontal: theme.spacing.sm,
                      paddingVertical: theme.spacing.xs,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: `${getStatusColor(batch.status)}15`,
                    }}>
                      <Text style={{
                        fontSize: 9,
                        fontWeight: '300',
                        color: getStatusColor(batch.status),
                        letterSpacing: 0.3,
                      }}>
                        {getStatusLabel(batch.status)}
                      </Text>
                    </View>
                  </View>

                  {batch.harvestDate && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: theme.spacing.xs,
                    }}>
                      <Calendar size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                      <Text style={{
                        fontSize: 9,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                        marginLeft: 4,
                        letterSpacing: 0.2,
                      }}>
                        Harvest: {new Date(batch.harvestDate).toLocaleDateString('en-US')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
