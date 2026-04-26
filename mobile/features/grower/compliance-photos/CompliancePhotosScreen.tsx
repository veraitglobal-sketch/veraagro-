import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useCompliancePhotosData } from './useCompliancePhotosData';
import { PhotoUploadBlock } from './PhotoUploadBlock';
import { CompliancePhotosList } from './CompliancePhotosList';

/**
 * Compliance photos screen: header with upload, estate filter, list with refresh.
 * Uses useCompliancePhotosData once and passes data to blocks.
 */
export function CompliancePhotosScreen() {
  const { t } = useTranslation();
  const data = useCompliancePhotosData();
  const p = useBioVeraScreenPadding();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <PhotoUploadBlock
        onUpload={data.handleUpload}
        uploading={data.uploading}
        hasEstates={data.estates.length > 0}
      />

      {data.estates.length > 0 && (
        <View
          className="py-3 border-b-[0.5px]"
          style={{
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
          }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <TouchableOpacity
                onPress={() => data.setFilterEstate('all')}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  borderWidth: 0.5,
                  borderColor: data.filterEstate === 'all' ? colors.primary : colors.border,
                  backgroundColor: data.filterEstate === 'all' ? `${colors.primary}10` : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: data.filterEstate === 'all' ? colors.primary : colors.text.secondary,
                  letterSpacing: 0.3,
                }}>
                  {t('common.all')}
                </Text>
              </TouchableOpacity>
              {data.estates.map((estate) => (
                <TouchableOpacity
                  key={estate.id}
                  onPress={() => data.setFilterEstate(estate.id)}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.borderRadius.sm,
                    borderWidth: 0.5,
                    borderColor: data.filterEstate === estate.id ? colors.primary : colors.border,
                    backgroundColor: data.filterEstate === estate.id ? `${colors.primary}10` : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: data.filterEstate === estate.id ? colors.primary : colors.text.secondary,
                    letterSpacing: 0.3,
                  }}>
                    {estate.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={data.refreshing}
            onRefresh={data.onRefresh}
            tintColor={colors.primary}
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
          <CompliancePhotosList
            filteredPhotos={data.filteredPhotos}
            loading={data.loading}
          />
        </View>
      </ScrollView>
    </View>
  );
}
