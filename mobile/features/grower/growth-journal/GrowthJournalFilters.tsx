import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import type { Estate, Parcel } from '../../../lib/api';

export type ParcelPlanOption = { id: string; label: string };

interface GrowthJournalFiltersProps {
  estates: Estate[];
  parcels: Parcel[];
  filterEstate: string;
  filterParcel: string;
  onEstateChange: (estateId: string) => void;
  onParcelChange: (parcelId: string) => void;
  /** Plans (zasad / berba) for the selected parcel */
  parcelPlans?: ParcelPlanOption[];
  activePlanId?: string;
  onPlanChange?: (planId: string) => void;
  plansLoading?: boolean;
}

export function GrowthJournalFilters({
  estates,
  parcels,
  filterEstate,
  filterParcel,
  onEstateChange,
  onParcelChange,
  parcelPlans = [],
  activePlanId = '',
  onPlanChange,
  plansLoading = false,
}: GrowthJournalFiltersProps) {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  if (estates.length === 0) return null;

  const labelStyle = {
    fontSize: 12,
    fontWeight: '300' as const,
    color: colors.text.secondary,
    marginBottom: theme.spacing.xs,
  };

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
      <Text style={labelStyle}>{t('producer.growthJournal.estateLabel')}</Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
          marginBottom: parcels.length > 0 ? theme.spacing.md : 0,
        }}
      >
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
              backgroundColor: filterEstate === estate.id ? `${colors.primary}10` : 'transparent',
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
        <>
          <Text style={labelStyle}>{t('producer.growthJournal.parcelLabel')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
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
        </>
      )}
      {parcels.length > 0 && filterParcel !== 'all' && onPlanChange && (
        <>
          <Text style={{ ...labelStyle, marginTop: theme.spacing.md }}>
            {t('producer.growthJournal.planLabel')}{' '}
            {plansLoading ? `(${t('producer.growthJournal.plansLoading')})` : null}
          </Text>
          {parcelPlans.length === 0 && !plansLoading ? (
            <Text style={{ fontSize: 12, color: colors.text.secondary, lineHeight: 18 }}>
              {t('producer.growthJournal.noPlansForParcel')}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {parcelPlans.map((plan) => {
                const sel = activePlanId === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => onPlanChange(plan.id)}
                    style={{
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      borderRadius: theme.borderRadius.sm,
                      borderWidth: 0.5,
                      borderColor: sel ? colors.primary : colors.border,
                      backgroundColor: sel ? `${colors.primary}10` : 'transparent',
                      maxWidth: '100%',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: sel ? colors.primary : colors.text.secondary,
                        letterSpacing: 0.2,
                      }}
                      numberOfLines={3}
                    >
                      {plan.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
}
