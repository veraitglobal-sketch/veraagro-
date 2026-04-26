import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';

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
    <BioVeraSubpageHeader
      left="none"
      title={title}
      right={
        <TouchableOpacity
          onPress={onUpload}
          disabled={uploading || !hasEstates}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Camera size={20} color={colors.background} strokeWidth={1.5} />
          )}
        </TouchableOpacity>
      }
    />
  );
}
