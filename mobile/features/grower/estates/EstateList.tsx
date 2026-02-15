import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Calendar, Edit, Trash2, Package } from 'lucide-react-native';
import type { Estate } from '../../../lib/api';
import { theme } from '../../../lib/theme';

export interface EstateListProps {
  estates: Estate[];
  loading: boolean;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  onPressEstate: (estate: Estate) => void;
  onPressNew: () => void;
  onPressEdit: (estate: Estate, e: { stopPropagation?: () => void }) => void;
  onDelete: (estate: Estate, e: { stopPropagation?: () => void }) => void;
}

/**
 * List of estate cards: loading, empty with "Add Estate" CTA, or list.
 * Receives data and handlers from useEstatesData and screen (router).
 */
export function EstateList({
  estates,
  loading,
  getStatusColor,
  getStatusLabel,
  onPressEstate,
  onPressNew,
  onPressEdit,
  onDelete,
}: EstateListProps) {
  if (loading) {
    return (
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
    );
  }

  if (estates.length === 0) {
    return (
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
          onPress={onPressNew}
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
    );
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {estates.map((estate) => (
        <TouchableOpacity
          key={estate.id}
          onPress={() => onPressEstate(estate)}
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
                onPress={(e) => onPressEdit(estate, e)}
                activeOpacity={0.7}
                style={{ padding: theme.spacing.xs }}
              >
                <Edit size={18} color={theme.colors.text.secondary} strokeWidth={1} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => onDelete(estate, e)}
                activeOpacity={0.7}
                style={{ padding: theme.spacing.xs }}
              >
                <Trash2 size={18} color={theme.colors.error} strokeWidth={1} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
