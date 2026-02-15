import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera } from 'lucide-react-native';
import { colors } from '../../../lib/colors';

export interface PhotoUploadBlockProps {
  onUpload: () => void;
  uploading: boolean;
  hasEstates: boolean;
  title?: string;
}

/**
 * Header row with title and camera button for uploading compliance photo.
 * Receives data from useCompliancePhotosData.
 */
export function PhotoUploadBlock({
  onUpload,
  uploading,
  hasEstates,
  title = 'Compliance Fotografije',
}: PhotoUploadBlockProps) {
  return (
    <View
      className="px-4 pt-12 pb-4 border-b-[0.5px] flex-row items-center justify-between"
      style={{
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
      }}
    >
      <Text
        className="text-lg flex-1"
        style={{
          color: colors.text.primary,
          fontWeight: '300',
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
      <TouchableOpacity
        onPress={onUpload}
        disabled={uploading || !hasEstates}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : (
          <Camera size={20} color={colors.background} strokeWidth={1.5} />
        )}
      </TouchableOpacity>
    </View>
  );
}
