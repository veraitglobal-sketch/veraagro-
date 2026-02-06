import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Plus, MapPin, Calendar, Edit, Trash2, Package } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { estatesAPI, Estate } from '../../lib/api';

/**
 * Estates Management Screen
 * List of all estates with details, add, edit, delete
 */
export default function EstatesScreen() {
  const router = useRouter();
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEstates();
  }, []);

  const loadEstates = async () => {
    try {
      setLoading(true);
      const data = await estatesAPI.getAll();
      setEstates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading estates:', error);
      setEstates([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEstates();
    setRefreshing(false);
  };

  const handleDelete = (estate: Estate) => {
    Alert.alert(
      'Delete Estate',
      `Are you sure you want to delete "${estate.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await estatesAPI.delete(estate.id);
              await loadEstates();
            } catch (error) {
              Alert.alert('Error', 'Unable to delete estate');
              console.error('Error deleting estate:', error);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CERTIFIED': return theme.colors.primary;
      case 'ACTIVE': return theme.colors.accent;
      case 'PENDING_SETUP': return theme.colors.warning;
      default: return theme.colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CERTIFIED': return 'Certified';
      case 'ACTIVE': return 'Active';
      case 'PENDING_SETUP': return 'Pending Setup';
      default: return status;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: 60,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '300',
          color: theme.colors.text.primary,
          letterSpacing: 0.5,
          flex: 1,
        }}>
          My Estates
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(producer)/estates/new')}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={20} color={theme.colors.background} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Estates List */}
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
        <View style={{ padding: theme.spacing.md }}>
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
          ) : estates.length === 0 ? (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.xl,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
            }}>
              <MapPin size={48} color={theme.colors.text.tertiary} strokeWidth={1} />
              <Text style={{
                fontSize: 12,
                fontWeight: '300',
                color: theme.colors.text.primary,
                marginTop: theme.spacing.md,
                marginBottom: theme.spacing.xs,
                letterSpacing: 0.3,
                textAlign: 'center',
              }}>
                No Estates
              </Text>
              <Text style={{
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.lg,
                letterSpacing: 0.2,
                textAlign: 'center',
              }}>
                Add your first estate to get started
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(producer)/estates/new')}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.md,
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <Text style={{
                  color: theme.colors.background,
                  fontSize: 11,
                  fontWeight: '300',
                  letterSpacing: 0.3,
                }}>
                  Add Estate
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {estates.map((estate) => (
                <TouchableOpacity
                  key={estate.id}
                  onPress={() => router.push(`/(producer)/estates/${estate.id}`)}
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
                      width: 48,
                      height: 48,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: `${getStatusColor(estate.status)}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing.sm,
                    }}>
                      <MapPin size={24} color={getStatusColor(estate.status)} strokeWidth={1} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.xs,
                        letterSpacing: 0.3,
                      }}>
                        {estate.name}
                      </Text>
                      {estate.location && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                          <MapPin size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                          <Text style={{
                            fontSize: 9,
                            fontWeight: '300',
                            color: theme.colors.text.secondary,
                            marginLeft: 4,
                            letterSpacing: 0.2,
                          }}>
                            {estate.location}
                          </Text>
                        </View>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginTop: theme.spacing.xs }}>
                        <View style={{
                          paddingHorizontal: theme.spacing.xs,
                          paddingVertical: 2,
                          borderRadius: theme.borderRadius.sm,
                          backgroundColor: `${getStatusColor(estate.status)}15`,
                        }}>
                          <Text style={{
                            fontSize: 9,
                            fontWeight: '300',
                            color: getStatusColor(estate.status),
                            letterSpacing: 0.3,
                          }}>
                            {getStatusLabel(estate.status)}
                          </Text>
                        </View>
                        {estate.calculatedArea > 0 && (
                          <Text style={{
                            fontSize: 9,
                            fontWeight: '300',
                            color: theme.colors.text.secondary,
                            letterSpacing: 0.2,
                          }}>
                            {estate.calculatedArea.toFixed(2)} m²
                          </Text>
                        )}
                        {estate.parcels && estate.parcels.length > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Package size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                            <Text style={{
                              fontSize: 9,
                              fontWeight: '300',
                              color: theme.colors.text.secondary,
                              marginLeft: 4,
                              letterSpacing: 0.2,
                            }}>
                              {estate.parcels.length} {estate.parcels.length === 1 ? 'parcel' : 'parcels'}
                            </Text>
                          </View>
                        )}
                      </View>
                      {estate.daysRemaining !== undefined && estate.daysRemaining !== null && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
                          <Calendar size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                          <Text style={{
                            fontSize: 9,
                            fontWeight: '300',
                            color: theme.colors.text.secondary,
                            marginLeft: 4,
                            letterSpacing: 0.2,
                          }}>
                            {estate.daysRemaining} days until certification
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/(producer)/estates/${estate.id}/edit`);
                        }}
                        activeOpacity={0.7}
                        style={{
                          padding: theme.spacing.xs,
                        }}
                      >
                        <Edit size={18} color={theme.colors.text.secondary} strokeWidth={1} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(estate);
                        }}
                        activeOpacity={0.7}
                        style={{
                          padding: theme.spacing.xs,
                        }}
                      >
                        <Trash2 size={18} color={theme.colors.error} strokeWidth={1} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
