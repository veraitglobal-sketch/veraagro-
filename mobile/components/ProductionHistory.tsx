import { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ProductionEvent } from '../../shared/passport/production-history';
import { intlLocaleFor } from '../../shared/i18n/format';
import { historyFactLabel } from '../../shared/passport/history-labels';

export default function ProductionHistory({ events = [], gaps = [] }: { events?: ProductionEvent[]; gaps?: string[] }) {
  const { t, i18n } = useTranslation();
  const [all, setAll] = useState(false);
  const label = (key: string) => t(`glossary.productionHistory.${key}`);
  const date = (value: string | null) => value ? new Date(value).toLocaleString(intlLocaleFor(i18n.language)) : label('unknown');
  return <View style={{ marginVertical: 16 }}>
    <Text style={{ fontSize: 17, fontWeight: '600' }}>{label('title')}</Text>
    <Text style={{ color: '#64748b', marginVertical: 8 }}>{label('lead')}</Text>
    {gaps.length ? <Text style={{ color: '#92400e', marginBottom: 10 }}>{label('missing')}: {gaps.map(label).join(' · ')}</Text> : null}
    {!events.length ? <Text>{label('unknown')}</Text> : null}
    {(all ? events : events.slice(0, 12)).map(e => <View key={e.id} style={{ borderLeftWidth: 1, borderLeftColor: '#bbd3b6', paddingLeft: 12, marginBottom: 16 }}>
      <Text style={{ fontWeight: '600' }}>{label(e.kind)}</Text>
      <Text style={{ color: '#64748b', fontSize: 12 }}>{date(e.date)}{e.endDate ? ` – ${date(e.endDate)}` : ''}</Text>
      <Text style={{ color: '#64748b', fontSize: 12 }}>{label('source')}: {label(e.source)}</Text>
      {e.recordedAt ? <Text style={{ color: '#64748b', fontSize: 12 }}>{label('recordedAt')}: {date(e.recordedAt)}</Text> : null}
      {e.facts.map((f, i) => <Text key={i} style={{ marginTop: 3 }}>{label(f.label)}: {historyFactLabel(t, f)}</Text>)}
      {e.photos?.map((photo, i) => <Image key={i} source={{ uri: photo }} style={{ height: 110, width: 160, marginTop: 6, borderRadius: 6 }} />)}
    </View>)}
    {events.length > 12 ? <TouchableOpacity accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }} onPress={() => setAll(!all)}><Text style={{ color: '#2D5A27' }}>{label(all ? 'less' : 'all')} ({events.length})</Text></TouchableOpacity> : null}
  </View>;
}
