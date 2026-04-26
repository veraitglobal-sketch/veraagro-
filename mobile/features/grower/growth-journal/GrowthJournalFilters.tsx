import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import type { Estate, Parcel } from '../../../lib/api';

interface GrowthJournalFiltersProps {
  estates: Estate[];
  parcels: Parcel[];
  filterEstate: string;
  filterParcel: string;
  onEstateChange: (estateId: string) => void;
  onParcelChange: (parcelId: string) => void;
}

export function GrowthJournalFilters({
  estates,
  parcels,
  filterEstate,
  filterParcel,
  onEstateChange,
  onParcelChange,
}: GrowthJournalFiltersProps) {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  if (estates.length === 0) return null;

  return (
    <View
      style={{
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.sm,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '300',
              color: colors.text.secondary,
              marginRight: theme.spacing.xs,
            }}
          >
            {t('producer.growthJournal.estateLabel')}
          </Text>
          {estates.map((estate) => (
            <TouchableOpacity
              key={estate.id}
              onPress={() => {
                onEstateChange(estate.id);
                onParcelChange('all');
              }}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.borderRadius.sm,
                borderWidth: 0.5,
                borderColor: filterEstate === estate.id ? colors.primary : colors.border,
                backgroundColor:
                  filterEstate === estate.id ? `${colors.primary}10` : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: filterEstate === estate.id ? colors.primary : colors.text.secondary,
                  letterSpacing: 0.3,
                }}
              >
                {estate.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {parcels.length > 0 && (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '300',
                color: colors.text.secondary,
                marginRight: theme.spacing.xs,
              }}
            >
              {t('producer.growthJournal.parcelLabel')}
            </Text>
            <TouchableOpacity
              onPress={() => onParcelChange('all')}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.borderRadius.sm,
                borderWidth: 0.5,
                borderColor: filterParcel === 'all' ? colors.primary : colors.border,
                backgroundColor: filterParcel === 'all' ? `${colors.primary}10` : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: filterParcel === 'all' ? colors.primary : colors.text.secondary,
                  letterSpacing: 0.3,
                }}
              >
                {t('common.all')}
              </Text>
            </TouchableOpacity>
            {parcels.map((parcel) => (
              <TouchableOpacity
                key={parcel.id}
                onPress={() => onParcelChange(parcel.id)}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  borderWidth: 0.5,
                  borderColor: filterParcel === parcel.id ? colors.primary : colors.border,
                  backgroundColor:
                    filterParcel === parcel.id ? `${colors.primary}10` : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: filterParcel === parcel.id ? colors.primary : colors.text.secondary,
                    letterSpacing: 0.3,
                  }}
                >
                  {parcel.cropType ||
                    t('producer.growthJournal.parcelShort', { id: parcel.id.slice(0, 4) })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
