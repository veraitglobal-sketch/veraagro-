import { useCallback, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Crypto from 'expo-crypto';
import { buildWeatherFieldEntryBody } from '../../../shared/passport/weather-entry';
import { currentStorageOwner, offlineStorageForOwner } from '../../lib/offline-storage';
import { useAuth } from '../../contexts/AuthContext';
import { syncService } from '../../lib/sync-service';
import { apiErrorMessage } from '../../lib/api-error';
import { isDeviceOnline } from '../../lib/network-utils';
import { GrowerDateField } from './GrowerDateField';
import { GrowerTimeField } from './GrowerTimeField';
import { toYmd } from '../../lib/date-ymd';

type SaveState = 'idle' | 'local' | 'syncing' | 'sent' | 'error';

function defaultTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function WeatherObservationForm({
  farmId,
  parcelId,
  plantingId,
  onSaved,
}: {
  farmId: string;
  parcelId: string;
  plantingId?: string;
  onSaved?: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const owner = user?.id;
  const scope = `${owner}:${farmId}:${parcelId}:${plantingId}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const saving = useRef(false);
  const draftRevision = useRef(0);
  const label = (key: string) => t(`glossary.productionHistory.${key}`);
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState(() => toYmd(new Date()));
  const [fromTime, setFromTime] = useState(defaultTime);
  const [untilDate, setUntilDate] = useState('');
  const [untilTime, setUntilTime] = useState('');
  const [minimumC, setMinimumC] = useState('');
  const [maximumC, setMaximumC] = useState('');
  const [frost, setFrost] = useState<'unknown' | 'yes' | 'no'>('unknown');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');

  const frostObserved = frost === 'unknown' ? null : frost === 'yes';
  const fromIso = `${fromDate}T${fromTime}`;
  const untilIso = untilDate.trim() ? `${untilDate}T${untilTime || fromTime}` : '';

  const resetDraft = () => {
    setFromDate(toYmd(new Date()));
    setFromTime(defaultTime());
    setUntilDate('');
    setUntilTime('');
    setMinimumC('');
    setMaximumC('');
    setFrost('unknown');
    setNotes('');
  };

  const statusMessage = () => {
    if (message) return message;
    if (saveState === 'local') return label('savedLocal');
    if (saveState === 'syncing') return label('sending');
    if (saveState === 'sent') return label('savedSent');
    if (saveState === 'error') return label('saveError');
    return '';
  };

  const save = useCallback(async () => {
    if (saving.current || !plantingId || !owner) return;
    if (!minimumC.trim() || !maximumC.trim()) {
      setSaveState('error');
      setMessage(label('temperatureRequired'));
      return;
    }
    saving.current = true;
    const revision = draftRevision.current;
    const id = Crypto.randomUUID();
    const unchanged = () => currentScope.current === scope && draftRevision.current === revision;
    setBusy(true);
    setMessage('');
    try {
      const payload = buildWeatherFieldEntryBody({
        farmId,
        parcelId,
        plantingId,
        clientReference: id,
        from: fromIso,
        until: untilIso || fromIso,
        minimumC,
        maximumC,
        frostObserved,
        notes,
      });
      if (await currentStorageOwner() !== owner) return;
      const offlineStorage = offlineStorageForOwner(owner);
      await offlineStorage.savePendingWeatherObservation({
        id,
        farmId,
        parcelId,
        plantingId,
        payload,
      });
      // The queue now owns this immutable event and retries it independently.
      // Do not clear anything typed while the durable write was in progress.
      if (unchanged()) {
        resetDraft();
        setSaveState('local');
      }
      if (currentScope.current === scope) onSaved?.();

      if (!(await isDeviceOnline())) {
        if (unchanged()) setMessage(label('savedLocal'));
        return;
      }

      if (await currentStorageOwner() !== owner || currentScope.current !== scope) return;
      if (unchanged()) setSaveState('syncing');
      const result = await syncService.syncPendingWeatherObservations(owner);
      const remaining = (await offlineStorage.getPendingWeatherObservations()).find((row) => row.id === id);
      if (await currentStorageOwner() !== owner || currentScope.current !== scope) return;
      onSaved?.();
      if (!unchanged()) return;
      if (!remaining) {
        setSaveState('sent');
        setMessage(label('savedSent'));
        return;
      }
      if (remaining.status === 'error') {
        setSaveState('error');
        setMessage(remaining.error ?? label('saveError'));
        return;
      }
      if (result.failed > 0) {
        setSaveState('local');
        setMessage(label('savedLocal'));
      }
    } catch (err: unknown) {
      if (unchanged()) {
        setSaveState('error');
        setMessage(apiErrorMessage(err, label('saveError')));
      }
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }, [owner, scope, plantingId, farmId, parcelId, fromIso, untilIso, minimumC, maximumC, frostObserved, notes, label, onSaved]);

  const markDirty = () => {
    draftRevision.current++;
    setSaveState('idle');
    setMessage('');
  };

  return (
    <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, marginVertical: 12 }}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setOpen(!open)}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Text style={{ fontWeight: '600' }}>{label('addWeather')}</Text>
      </TouchableOpacity>
      {open ? (
        <>
          <Text style={{ color: '#64748b', marginBottom: 8 }}>{label('weatherHelp')}</Text>
          {!plantingId ? <Text style={{ marginBottom: 8 }}>{label('choosePlanting')}</Text> : null}
          <Text style={{ color: '#64748b', marginBottom: 8 }}>{label('dateHelpMobile')}</Text>

          <Text style={{ marginBottom: 4 }}>{label('from')}</Text>
          <View style={{ gap: 8, marginBottom: 12 }}>
            <GrowerDateField value={fromDate} maximumDate={new Date()} onChange={(d) => { setFromDate(d); markDirty(); }} />
            <GrowerTimeField value={fromTime} onChange={(time) => { setFromTime(time); markDirty(); }} />
          </View>

          <Text style={{ marginBottom: 4 }}>{label('until')}</Text>
          <View style={{ gap: 8, marginBottom: 12 }}>
            <GrowerDateField
              value={untilDate || fromDate}
              maximumDate={new Date()}
              onChange={(d) => { setUntilDate(d); markDirty(); }}
            />
            <GrowerTimeField
              value={untilTime || fromTime}
              onChange={(time) => { setUntilTime(time); markDirty(); }}
            />
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text>{label('minimumC')}</Text>
            <TextInput
              accessibilityLabel={label('minimumC')}
              value={minimumC}
              onChangeText={(value) => { setMinimumC(value); markDirty(); }}
              keyboardType="decimal-pad"
              style={{ minHeight: 44, borderWidth: 1, borderColor: '#d1d5db', padding: 8, borderRadius: 6 }}
            />
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text>{label('maximumC')}</Text>
            <TextInput
              accessibilityLabel={label('maximumC')}
              value={maximumC}
              onChangeText={(value) => { setMaximumC(value); markDirty(); }}
              keyboardType="decimal-pad"
              style={{ minHeight: 44, borderWidth: 1, borderColor: '#d1d5db', padding: 8, borderRadius: 6 }}
            />
          </View>

          <Text>{label('frost')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {(['unknown', 'yes', 'no'] as const).map((value) => (
              <TouchableOpacity
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ checked: frost === value }}
                onPress={() => { setFrost(value); markDirty(); }}
                style={{
                  minHeight: 44,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: frost === value ? '#2D5A27' : '#d1d5db',
                }}
              >
                <Text>{label(value)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text>{label('notes')}</Text>
            <TextInput
              accessibilityLabel={label('notes')}
              value={notes}
              onChangeText={(value) => { setNotes(value); markDirty(); }}
              multiline
              style={{ minHeight: 44, borderWidth: 1, borderColor: '#d1d5db', padding: 8, borderRadius: 6 }}
            />
          </View>

          <TouchableOpacity
            disabled={busy || !plantingId}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy || !plantingId }}
            onPress={() => void save()}
            style={{
              minHeight: 44,
              marginTop: 8,
              justifyContent: 'center',
              opacity: busy || !plantingId ? 0.4 : 1,
            }}
          >
            <Text style={{ color: '#2D5A27', fontWeight: '600' }}>{t('common.save')}</Text>
          </TouchableOpacity>
          {statusMessage() ? (
            <Text accessibilityLiveRegion="polite" style={{ marginTop: 8, color: saveState === 'error' ? '#b91c1c' : '#64748b' }}>
              {statusMessage()}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
