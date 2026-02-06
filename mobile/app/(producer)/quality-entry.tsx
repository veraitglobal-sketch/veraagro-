import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Package, CheckCircle, XCircle, Save } from 'lucide-react-native';
import { colors } from '../../lib/colors';
import { theme } from '../../lib/theme';
import { qualityEntryAPI, QualityEntry, batchesAPI } from '../../lib/api';

/**
 * Quality Entry Screen
 * Create and view quality entries for batches
 */
export default function QualityEntryScreen() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [qualityEntry, setQualityEntry] = useState<QualityEntry | null>(null);
  const [qualityScore, setQualityScore] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadQualityEntry();
    } else {
      setQualityEntry(null);
    }
  }, [selectedBatchId]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await batchesAPI.getAll();
      // Filter only PACKED batches
      const packedBatches = data.filter(b => b.status === 'PACKED');
      setBatches(packedBatches);
      if (packedBatches.length > 0 && !selectedBatchId) {
        setSelectedBatchId(packedBatches[0].id);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQualityEntry = async () => {
    if (!selectedBatchId) return;
    try {
      const entry = await qualityEntryAPI.getByBatch(selectedBatchId);
      setQualityEntry(entry);
      if (entry) {
        setQualityScore(entry.qualityScore?.toString() || '');
        setNotes(entry.notes || '');
      } else {
        setQualityScore('');
        setNotes('');
      }
    } catch (error) {
      console.error('Error loading quality entry:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBatches(), selectedBatchId ? loadQualityEntry() : Promise.resolve()]);
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!selectedBatchId) {
      Alert.alert('Greška', 'Izaberite batch');
      return;
    }

    if (qualityScore && (isNaN(parseFloat(qualityScore)) || parseFloat(qualityScore) < 0 || parseFloat(qualityScore) > 100)) {
      Alert.alert('Greška', 'Ocena kvaliteta mora biti između 0 i 100');
      return;
    }

    try {
      setSaving(true);
      await qualityEntryAPI.create({
        batchId: selectedBatchId,
        qualityScore: qualityScore ? parseFloat(qualityScore) : undefined,
        notes: notes.trim() || undefined,
      });
      await loadQualityEntry();
      Alert.alert('Uspešno', 'Kvalitet je sačuvan');
    } catch (error: any) {
      Alert.alert('Greška', error.message || 'Ne mogu da sačuvam kvalitet');
      console.error('Error saving quality entry:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return colors.warning;
      case 'SUBMITTED': return colors.accent;
      case 'APPROVED': return colors.primary;
      case 'REJECTED': return colors.error;
      default: return colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Nacrt';
      case 'SUBMITTED': return 'Poslato';
      case 'APPROVED': return 'Odobreno';
      case 'REJECTED': return 'Odbijeno';
      default: return status;
    }
  };

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

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
          Unos Kvaliteta
        </Text>
        {qualityEntry && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Save size={24} color={colors.primary} strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        )}
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
          {/* Batch Selection */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.secondary,
              marginBottom: theme.spacing.xs,
              letterSpacing: 0.3,
            }}>
              Batch
            </Text>
            {loading ? (
              <View style={{ padding: theme.spacing.md, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : batches.length === 0 ? (
              <View style={{
                backgroundColor: colors.background,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: colors.border,
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.secondary,
                }}>
                  Nema batch-ova za unos kvaliteta
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  {batches.map((batch) => (
                    <TouchableOpacity
                      key={batch.id}
                      onPress={() => setSelectedBatchId(batch.id)}
                      style={{
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        borderRadius: theme.borderRadius.sm,
                        borderWidth: 0.5,
                        borderColor: selectedBatchId === batch.id ? colors.primary : colors.border,
                        backgroundColor: selectedBatchId === batch.id ? `${colors.primary}10` : colors.background,
                      }}
                    >
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '300',
                        color: selectedBatchId === batch.id ? colors.primary : colors.text.secondary,
                        letterSpacing: 0.3,
                      }}>
                        {batch.batchId || batch.id.slice(0, 8)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          {selectedBatch && (
            <>
              {/* Batch Info */}
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
                    {selectedBatch.productName || 'Proizvod'}
                  </Text>
                </View>
                {selectedBatch.quantity && (
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: colors.text.secondary,
                  }}>
                    {selectedBatch.quantity} {selectedBatch.unit || 'kg'}
                  </Text>
                )}
              </View>

              {/* Quality Entry Status */}
              {qualityEntry && (
                <View style={{
                  backgroundColor: colors.background,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                  borderWidth: 0.5,
                  borderColor: colors.border,
                }}>
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
                      backgroundColor: `${getStatusColor(qualityEntry.status)}15`,
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '300',
                        color: getStatusColor(qualityEntry.status),
                        letterSpacing: 0.3,
                      }}>
                        {getStatusLabel(qualityEntry.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Quality Score */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                  letterSpacing: 0.3,
                }}>
                  Ocena kvaliteta (0-100, opciono)
                </Text>
                <TextInput
                  value={qualityScore}
                  onChangeText={setQualityScore}
                  placeholder="npr. 85"
                  keyboardType="numeric"
                  style={{
                    fontSize: 15,
                    fontWeight: '300',
                    color: colors.text.primary,
                    borderWidth: 0.5,
                    borderColor: colors.border,
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.md,
                    backgroundColor: colors.background,
                  }}
                />
              </View>

              {/* Notes */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                  letterSpacing: 0.3,
                }}>
                  Napomene (opciono)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Dodatne napomene o kvalitetu..."
                  multiline
                  numberOfLines={4}
                  style={{
                    fontSize: 15,
                    fontWeight: '300',
                    color: colors.text.primary,
                    borderWidth: 0.5,
                    borderColor: colors.border,
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.md,
                    backgroundColor: colors.background,
                    minHeight: 100,
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              {/* Save Button */}
              {(!qualityEntry || qualityEntry.status === 'DRAFT') && (
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  style={{
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                  }}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={{
                      fontSize: 15,
                      fontWeight: '300',
                      color: colors.background,
                      letterSpacing: 0.3,
                    }}>
                      {qualityEntry ? 'Ažuriraj' : 'Sačuvaj'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
