import { View, Text, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Image as ImageIcon } from 'lucide-react-native';
import type { CompliancePhoto } from '../../../lib/api';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';

export interface CompliancePhotosListProps {
  filteredPhotos: CompliancePhoto[];
  loading: boolean;
}

/**
 * List of compliance photo cards: loading state, empty state, or photo list.
 * Receives data from useCompliancePhotosData.
 */
export function CompliancePhotosList({ filteredPhotos, loading }: CompliancePhotosListProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
          {t('producer.compliance.loading')}
        </Text>
      </View>
    );
  }

  if (filteredPhotos.length === 0) {
    return (
      <View
        className="bg-white rounded-lg p-6 border-[0.5px] items-center"
        style={{ borderColor: colors.border }}
      >
        <ImageIcon size={32} color={colors.text.tertiary} strokeWidth={1} />
        <Text
          className="text-[13px] mt-3 text-center"
          style={{ color: colors.text.secondary }}
        >
          {t('producer.compliance.noPhotos')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {filteredPhotos.map((photo) => (
        <View
          key={photo.id}
          style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}
        >
          {photo.photoUrl && (
            <Image
              source={{ uri: photo.photoUrl }}
              style={{
                width: '100%',
                height: 200,
                borderRadius: theme.borderRadius.sm,
                marginBottom: theme.spacing.sm,
              }}
              resizeMode="cover"
            />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
            <MapPin size={14} color={colors.text.secondary} strokeWidth={1} />
            <Text style={{
              fontSize: 11,
              fontWeight: '300',
              color: colors.text.secondary,
              marginLeft: 4,
            }}>
              {photo.gpsLocation.lat.toFixed(6)}, {photo.gpsLocation.lng.toFixed(6)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Calendar size={14} color={colors.text.secondary} strokeWidth={1} />
            <Text style={{
              fontSize: 11,
              fontWeight: '300',
              color: colors.text.secondary,
              marginLeft: 4,
            }}>
              {new Date(photo.createdAt).toLocaleDateString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
