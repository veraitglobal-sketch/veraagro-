import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Package, Filter, Download } from 'lucide-react-native';
import { colors } from '../../lib/colors';
import { theme } from '../../lib/theme';
import { materialsAPI, Material } from '../../lib/api';
import { offlineStorage } from '../../lib/offline-storage';

/**
 * Materials Management Screen
 * View whitelist materials with search and filters
 */
export default function MaterialsScreen() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'FERTILIZER' | 'PESTICIDE' | 'SEED' | 'OTHER'>('all');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchQuery, filterType]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await materialsAPI.getWhitelist();
      setMaterials(data);
      
      // Save to offline cache
      if (data.length > 0) {
        const barcodes = data.map(m => m.barcode);
        await offlineStorage.saveWhitelist(barcodes);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      // Try to load from cache
      const cachedBarcodes = await offlineStorage.getWhitelist();
      if (cachedBarcodes.length > 0) {
        // Convert cached barcodes to Material format
        const cachedMaterials: Material[] = cachedBarcodes.map(barcode => ({
          id: barcode,
          barcode,
          name: barcode,
          type: 'OTHER',
        }));
        setMaterials(cachedMaterials);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = materials;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(m => 
        m.barcode.toLowerCase().includes(query) ||
        m.name.toLowerCase().includes(query) ||
        m.manufacturer?.toLowerCase().includes(query)
      );
    }

    setFilteredMaterials(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMaterials();
    setRefreshing(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FERTILIZER': return colors.accent;
      case 'PESTICIDE': return colors.warning;
      case 'SEED': return colors.primary;
      default: return colors.text.secondary;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'FERTILIZER': return 'Đubrivo';
      case 'PESTICIDE': return 'Pesticid';
      case 'SEED': return 'Seme';
      case 'OTHER': return 'Ostalo';
      default: return type;
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
            letterSpacing: 0.5,
          }}
        >
          Whitelist Materijala
        </Text>
        {lastSync && (
          <TouchableOpacity
            onPress={loadMaterials}
            style={{ marginLeft: theme.spacing.sm }}
          >
            <Download size={20} color={colors.text.secondary} strokeWidth={1} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View 
        className="px-4 py-3 border-b-[0.5px]"
        style={{ 
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: theme.borderRadius.sm,
          borderWidth: 0.5,
          borderColor: colors.border,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        }}>
          <Search size={16} color={colors.text.secondary} strokeWidth={1} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Pretraži po barkodu ili nazivu..."
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.primary,
              marginLeft: theme.spacing.sm,
            }}
          />
        </View>
      </View>

      {/* Filters */}
      <View 
        className="px-4 py-3 border-b-[0.5px]"
        style={{ 
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {[
              { id: 'all' as const, label: 'Sve' },
              { id: 'FERTILIZER' as const, label: 'Đubrivo' },
              { id: 'PESTICIDE' as const, label: 'Pesticid' },
              { id: 'SEED' as const, label: 'Seme' },
              { id: 'OTHER' as const, label: 'Ostalo' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilterType(f.id)}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  borderWidth: 0.5,
                  borderColor: filterType === f.id ? colors.primary : colors.border,
                  backgroundColor: filterType === f.id ? `${colors.primary}10` : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: filterType === f.id ? colors.primary : colors.text.secondary,
                  letterSpacing: 0.3,
                }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Materials List */}
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
          {loading ? (
            <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
              <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
                Učitavanje...
              </Text>
            </View>
          ) : filteredMaterials.length === 0 ? (
            <View 
              className="bg-white rounded-lg p-6 border-[0.5px] items-center"
              style={{ borderColor: colors.border }}
            >
              <Package size={32} color={colors.text.tertiary} strokeWidth={1} />
              <Text 
                className="text-[13px] mt-3 text-center"
                style={{ color: colors.text.secondary }}
              >
                {searchQuery || filterType !== 'all' 
                  ? 'Nema rezultata' 
                  : 'Nema materijala na whitelist-i'}
              </Text>
            </View>
          ) : (
            <>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: theme.spacing.sm,
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.secondary,
                }}>
                  {filteredMaterials.length} {filteredMaterials.length === 1 ? 'materijal' : 'materijala'}
                </Text>
                {lastSync && (
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: colors.text.tertiary,
                  }}>
                    Poslednja sinhronizacija: {lastSync.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
              <View style={{ gap: theme.spacing.sm }}>
                {filteredMaterials.map((material) => (
                  <View
                    key={material.id}
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      borderWidth: 0.5,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.xs }}>
                      <View 
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: theme.borderRadius.sm,
                          backgroundColor: `${getTypeColor(material.type)}15`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: theme.spacing.sm,
                        }}
                      >
                        <Package size={20} color={getTypeColor(material.type)} strokeWidth={1} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '300',
                          color: colors.text.primary,
                          marginBottom: theme.spacing.xs,
                          letterSpacing: 0.3,
                        }}>
                          {material.name || material.barcode}
                        </Text>
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '300',
                          color: colors.text.secondary,
                        }}>
                          Barkod: {material.barcode}
                        </Text>
                        {material.manufacturer && (
                          <Text style={{
                            fontSize: 11,
                            fontWeight: '300',
                            color: colors.text.secondary,
                            marginTop: 2,
                          }}>
                            Proizvođač: {material.manufacturer}
                          </Text>
                        )}
                      </View>
                      <View style={{
                        paddingHorizontal: theme.spacing.sm,
                        paddingVertical: 4,
                        borderRadius: theme.borderRadius.sm,
                        backgroundColor: `${getTypeColor(material.type)}15`,
                      }}>
                        <Text style={{
                          fontSize: 10,
                          fontWeight: '300',
                          color: getTypeColor(material.type),
                          letterSpacing: 0.3,
                        }}>
                          {getTypeLabel(material.type)}
                        </Text>
                      </View>
                    </View>
                    {material.certification && (
                      <View style={{
                        marginTop: theme.spacing.xs,
                        paddingTop: theme.spacing.xs,
                        borderTopWidth: 0.5,
                        borderTopColor: colors.border,
                      }}>
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '300',
                          color: colors.text.secondary,
                        }}>
                          Sertifikat: {material.certification}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
