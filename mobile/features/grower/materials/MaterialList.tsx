import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react-native';
import type { Material } from '../../../lib/api';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import type { MaterialFilterType } from './useMaterialsData';
import { useAppLocaleTag } from '../../../lib/date-locale';

export interface MaterialListProps {
  filteredMaterials: Material[];
  loading: boolean;
  searchQuery: string;
  filterType: MaterialFilterType;
  lastSync: Date | null;
  getTypeColor: (type: string) => string;
  getTypeLabel: (type: string) => string;
}

/**
 * List of whitelist materials: loading state, empty state, or material cards.
 * Receives data from useMaterialsData (call hook in parent and pass props).
 */
export function MaterialList({
  filteredMaterials,
  loading,
  searchQuery,
  filterType,
  lastSync,
  getTypeColor,
  getTypeLabel,
}: MaterialListProps) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  if (loading) {
    return (
      <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
          {t('producer.materials.loading')}
        </Text>
      </View>
    );
  }

  if (filteredMaterials.length === 0) {
    return (
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
            ? t('producer.materials.noResults')
            : t('producer.materials.noMaterials')}
        </Text>
      </View>
    );
  }

  return (
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
          {t('producer.materials.materialCount', { count: filteredMaterials.length })}
        </Text>
        {lastSync && (
          <Text style={{
            fontSize: 15,
            fontWeight: '300',
            color: colors.text.tertiary,
          }}>
            {t('producer.materials.lastSync')}: {lastSync.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
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
                  backgroundColor: `${getTypeColor(material.type ?? 'OTHER')}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: theme.spacing.sm,
                }}
              >
                <Package size={20} color={getTypeColor(material.type ?? 'OTHER')} strokeWidth={1} />
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
                  fontSize: 15,
                  fontWeight: '300',
                  color: colors.text.secondary,
                }}>
                  {t('producer.materials.barcode')}: {material.barcode}
                </Text>
                {material.manufacturer && (
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '300',
                    color: colors.text.secondary,
                    marginTop: 2,
                  }}>
                    {t('producer.materials.manufacturer')}: {material.manufacturer}
                  </Text>
                )}
              </View>
              <View style={{
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${getTypeColor(material.type ?? 'OTHER')}15`,
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '300',
                  color: getTypeColor(material.type ?? 'OTHER'),
                  letterSpacing: 0.3,
                }}>
                  {material.type === 'FERTILIZER' ? t('producer.materials.fertilizer') : material.type === 'PESTICIDE' ? t('producer.materials.pesticide') : material.type === 'SEED' ? t('producer.materials.seed') : t('producer.materials.other')}
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
                  fontSize: 15,
                  fontWeight: '300',
                  color: colors.text.secondary,
                }}>
                  {t('producer.materials.certification')}: {material.certification}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </>
  );
}
