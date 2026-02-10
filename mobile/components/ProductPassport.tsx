import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import MapView, { Polygon, Marker } from 'react-native-maps';
import { X, CheckCircle2, MapPin, Calendar, Package, Truck, ArrowRight, Award, FileText, Check } from 'lucide-react-native';
import { theme } from '../lib/theme';
import { ProductPassport as ProductPassportType } from '../lib/api';

interface ProductPassportProps {
  visible: boolean;
  batchId: string | null;
  onClose: () => void;
}

/**
 * ProductPassport Modal
 * Digital passport view showing product origin, timeline, and map
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

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()}. ${months[d.getMonth()]}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: theme.borderRadius.xl,
          borderTopRightRadius: theme.borderRadius.xl,
          maxHeight: '90%',
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.08)',
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: theme.spacing.lg,
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(0, 0, 0, 0.08)',
          }}>
            <View style={{ flex: 1 }}>
              {passport && (
                <>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.5,
                    marginBottom: theme.spacing.xs,
                  }}>
                    {passport.batch.productName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                    <CheckCircle2 size={14} color={theme.colors.primary} strokeWidth={1} />
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: theme.colors.primary,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}>
                      Vera Certified
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

          {/* Content */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  marginTop: theme.spacing.md,
                  letterSpacing: 0.3,
                }}>
                  Loading passport...
                </Text>
              </View>
            ) : error ? (
              <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  textAlign: 'center',
                  letterSpacing: 0.3,
                }}>
                  {error}
                </Text>
              </View>
            ) : passport ? (
              <>
                {/* Map Section */}
                {passport.map.center && (
                  <View style={{
                    height: 200,
                    margin: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    overflow: 'hidden',
                    borderWidth: 0.5,
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                  }}>
                    <MapView
                      style={{ flex: 1 }}
                      initialRegion={{
                        latitude: passport.map.center!.latitude,
                        longitude: passport.map.center!.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                    >
                      <Marker
                        coordinate={{
                          latitude: passport.map.center!.latitude,
                          longitude: passport.map.center!.longitude,
                        }}
                      >
                        <View style={{
                          backgroundColor: theme.colors.primary,
                          padding: 8,
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: theme.colors.background,
                        }}>
                          <MapPin size={16} color={theme.colors.text.inverse} strokeWidth={1.5} />
                        </View>
                      </Marker>
                      {passport.map.polygon && Array.isArray(passport.map.polygon) && (
                        <Polygon
                          coordinates={(passport.map.polygon
                            .map((coord: any) => {
                              if (Array.isArray(coord) && coord.length === 2) {
                                return { latitude: coord[0], longitude: coord[1] };
                              } else if (typeof coord === 'object' && coord != null && 'lat' in coord) {
                                return { latitude: (coord as { lat: number; lng: number }).lat, longitude: (coord as { lat: number; lng: number }).lng };
                              }
                              return null;
                            })
                            .filter((c): c is { latitude: number; longitude: number } => c != null))}
                          fillColor={`${theme.colors.primary}20`}
                          strokeColor={theme.colors.primary}
                          strokeWidth={1}
                        />
                      )}
                    </MapView>
                  </View>
                )}

                {/* Origin Info */}
                <View style={{ padding: theme.spacing.md, gap: theme.spacing.sm }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '400',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    marginBottom: theme.spacing.xs,
                  }}>
                    Origin
                  </Text>
                  
                  <View style={{ gap: theme.spacing.xs }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                      <MapPin size={14} color={theme.colors.text.secondary} strokeWidth={1} />
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                        letterSpacing: 0.3,
                      }}>
                        {passport.origin.estate.name}
                      </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                      <Package size={14} color={theme.colors.text.secondary} strokeWidth={1} />
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                        letterSpacing: 0.3,
                      }}>
                        Farmer: {passport.origin.farmer.name}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Timeline */}
                <View style={{ padding: theme.spacing.md, paddingTop: 0 }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '400',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    marginBottom: theme.spacing.md,
                  }}>
                    Journey
                  </Text>
                  
                  <View style={{ gap: theme.spacing.md }}>
                    {passport.timeline.map((item, index) => (
                      <View key={index} style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                        {/* Vertical Line */}
                        <View style={{ alignItems: 'center', width: 24 }}>
                          {index < passport.timeline.length - 1 && (
                            <View style={{
                              width: 0.5,
                              flex: 1,
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              marginTop: 4,
                            }} />
                          )}
                          <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            borderWidth: 0.5,
                            borderColor: theme.colors.primary,
                            backgroundColor: theme.colors.background,
                          }} />
                        </View>
                        
                        {/* Content */}
                        <View style={{ flex: 1, paddingBottom: theme.spacing.sm }}>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '300',
                            color: theme.colors.text.primary,
                            letterSpacing: 0.3,
                            marginBottom: 2,
                          }}>
                            {item.stage}
                          </Text>
                          <Text style={{
                            fontSize: 10,
                            fontWeight: '300',
                            color: theme.colors.text.secondary,
                            letterSpacing: 0.2,
                          }}>
                            {formatDate(item.date)} • {item.location}
                          </Text>
                          {item.farmer && (
                            <Text style={{
                              fontSize: 9,
                              fontWeight: '300',
                              color: theme.colors.text.secondary,
                              letterSpacing: 0.2,
                              opacity: 0.6,
                              marginTop: 2,
                            }}>
                              by {item.farmer}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Vera Integrity Score */}
                <View style={{
                  margin: theme.spacing.md,
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.5,
                    marginBottom: theme.spacing.sm,
                  }}>
                    Vera Integrity Score
                  </Text>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '300',
                    color: theme.colors.primary,
                    letterSpacing: 0.5,
                    marginBottom: theme.spacing.md,
                  }}>
                    98/100
                  </Text>
                  
                  <View style={{ gap: theme.spacing.xs }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                      <Check size={12} color={theme.colors.primary} strokeWidth={1.5} />
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        letterSpacing: 0.2,
                      }}>
                        No Pesticides: Confirmed by leaf analysis
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                      <Check size={12} color={theme.colors.primary} strokeWidth={1.5} />
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        letterSpacing: 0.2,
                      }}>
                        Water Quality: Controlled irrigation
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                      <Check size={12} color={theme.colors.primary} strokeWidth={1.5} />
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        letterSpacing: 0.2,
                      }}>
                        Soil Health: High humus level
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Certification & Compliance */}
                <View style={{
                  margin: theme.spacing.md,
                  marginTop: 0,
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '400',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    marginBottom: theme.spacing.md,
                  }}>
                    Certification & Compliance
                  </Text>

                  {/* Trust Badges */}
                  <View style={{
                    flexDirection: 'row',
                    gap: theme.spacing.md,
                    marginBottom: theme.spacing.md,
                  }}>
                    {[
                      { name: 'EU Organic', code: 'EU-ORG', valid: true },
                      { name: 'Demeter', code: 'DEM', valid: true },
                      { name: 'GlobalG.A.P.', code: 'GGAP', valid: false },
                    ].map((badge) => (
                      <View
                        key={badge.code}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          padding: theme.spacing.sm,
                          backgroundColor: badge.valid ? `${theme.colors.primary}08` : theme.colors.surface,
                          borderRadius: theme.borderRadius.sm,
                          borderWidth: 0.5,
                          borderColor: badge.valid ? `${theme.colors.primary}20` : 'rgba(0, 0, 0, 0.08)',
                        }}
                      >
                        <Award
                          size={20}
                          color={badge.valid ? theme.colors.primary : theme.colors.text.tertiary}
                          strokeWidth={1}
                        />
                        <Text style={{
                          fontSize: 9,
                          fontWeight: '300',
                          color: badge.valid ? theme.colors.primary : theme.colors.text.tertiary,
                          letterSpacing: 0.2,
                          marginTop: theme.spacing.xs,
                          textAlign: 'center',
                        }}>
                          {badge.name}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Lab Results */}
                  <TouchableOpacity
                    onPress={() => {
                      // TODO: Open PDF download
                      Linking.openURL('https://example.com/lab-results.pdf').catch(err => {
                        console.error('Failed to open PDF:', err);
                      });
                    }}
                    style={{
                      marginBottom: theme.spacing.md,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                      <FileText size={12} color={theme.colors.primary} strokeWidth={1} />
                      <Text style={{
                        fontSize: 10,
                        fontWeight: '300',
                        color: theme.colors.primary,
                        letterSpacing: 0.2,
                        textDecorationLine: 'underline',
                      }}>
                        Download Laboratory Analysis (PDF)
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Verification Data */}
                  <View style={{
                    paddingLeft: theme.spacing.md,
                    borderLeftWidth: 0.5,
                    borderLeftColor: 'rgba(45, 90, 39, 0.2)', // emerald-900/20
                    gap: theme.spacing.xs,
                  }}>
                    <Text style={{
                      fontSize: 10,
                      fontWeight: '300',
                      color: theme.colors.text.secondary,
                      letterSpacing: 0.2,
                    }}>
                      Certification Body: DE-ÖKO-006
                    </Text>
                    <Text style={{
                      fontSize: 10,
                      fontWeight: '300',
                      color: theme.colors.text.secondary,
                      letterSpacing: 0.2,
                    }}>
                      Last Soil Control: 15. Jan 2026
                    </Text>
                    <Text style={{
                      fontSize: 10,
                      fontWeight: '300',
                      color: theme.colors.text.secondary,
                      letterSpacing: 0.2,
                    }}>
                      Karenz (Remaining Period): 0 - Safe
                    </Text>
                  </View>
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
