import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FilePlus, Calendar, MapPin } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useAppLocaleTag } from '../../../lib/date-locale';

interface Entry {
  id: string;
  type: string;
  createdAt: string;
  data?: { location?: unknown };
}

export default function RecentActivitySection({ entries }: { entries: Entry[] }) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  const typeLabel = (type: string) =>
    type === 'SETVA' ? t('producer.recentActivity.planting') : type === 'PRSKANJE' ? t('producer.recentActivity.spraying') : type === 'BERBA' ? t('producer.recentActivity.harvest') : type;

  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: '400', color: theme.colors.text.tertiary, letterSpacing: 1.2, marginBottom: theme.spacing.md, textTransform: 'uppercase' }}>
        {t('producer.recentActivity.title')}
      </Text>
      {entries.length === 0 ? (
        <View style={{ backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ fontSize: 12, fontWeight: '400', color: theme.colors.text.secondary, textAlign: 'center' }}>{t('producer.recentActivity.noActivity')}</Text>
        </View>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {entries.map((entry) => (
            <View
              key={entry.id}
              style={{
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
                <FilePlus size={18} color={theme.colors.primary} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '300', color: theme.colors.text.primary, marginBottom: 2 }}>{typeLabel(entry.type)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Calendar size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                    <Text style={{ fontSize: 9, fontWeight: '300', color: theme.colors.text.secondary, marginLeft: 4 }}>
                      {new Date(entry.createdAt).toLocaleDateString(dateLocale)}
                    </Text>
                  </View>
                  {entry.data?.location != null && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MapPin size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                      <Text style={{ fontSize: 9, fontWeight: '300', color: theme.colors.text.secondary, marginLeft: 4 }}>{t('producer.recentActivity.gpsAbbrev')}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
