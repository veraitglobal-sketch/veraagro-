import React from 'react';
import { View, Text } from 'react-native';
import { FilePlus, Calendar, MapPin } from 'lucide-react-native';
import { theme } from '../../../lib/theme';

interface Entry {
  id: string;
  type: string;
  createdAt: string;
  data?: { location?: unknown };
}

export default function RecentActivitySection({ entries }: { entries: Entry[] }) {
  const typeLabel = (type: string) =>
    type === 'SETVA' ? 'Planting' : type === 'PRSKANJE' ? 'Spraying' : type === 'BERBA' ? 'Harvest' : type;

  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.text.primary, letterSpacing: 0.5, marginBottom: theme.spacing.md }}>
        Recent Activity
      </Text>
      {entries.length === 0 ? (
        <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, borderWidth: 0.5, borderColor: 'rgba(0, 0, 0, 0.05)' }}>
          <Text style={{ fontSize: 11, fontWeight: '300', color: theme.colors.text.secondary, textAlign: 'center' }}>No recent activity</Text>
        </View>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {entries.map((entry) => (
            <View
              key={entry.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
                <FilePlus size={18} color={theme.colors.primary} strokeWidth={1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '300', color: theme.colors.text.primary, marginBottom: 2 }}>{typeLabel(entry.type)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Calendar size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                    <Text style={{ fontSize: 9, fontWeight: '300', color: theme.colors.text.secondary, marginLeft: 4 }}>
                      {new Date(entry.createdAt).toLocaleDateString('en-US')}
                    </Text>
                  </View>
                  {entry.data?.location != null && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MapPin size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                      <Text style={{ fontSize: 9, fontWeight: '300', color: theme.colors.text.secondary, marginLeft: 4 }}>GPS</Text>
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
