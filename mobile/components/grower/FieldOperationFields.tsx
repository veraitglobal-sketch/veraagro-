import { View, Text, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EnterpriseTextField, EnterpriseTextArea } from '../../design-system';
import { GrowerDateField } from './GrowerDateField';
import { GrowerTimeField } from './GrowerTimeField';
import { GrowerSelectField } from './GrowerSelectField';
import type { OperationForm } from '../../lib/field-operation';
import type { FieldOperationType } from '../../../shared/passport/field-operation';

function splitIsoDateTime(iso: string): { date: string; time: string } {
  if (!iso.trim()) return { date: '', time: '' };
  const [date, timePart] = iso.split('T');
  return { date: date ?? '', time: (timePart ?? '').slice(0, 5) };
}

function joinIsoDateTime(date: string, time: string): string {
  if (!date.trim()) return '';
  const clock = /^\d{1,2}:\d{2}$/.test(time.trim()) ? time.trim() : '08:00';
  return `${date}T${clock}`;
}

export default function FieldOperationFields({ type, value, onChange, notes, onNotesChange }: {
  type: FieldOperationType; value: OperationForm; onChange: (value: OperationForm) => void;
  notes: string; onNotesChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const label = (key: string) => t(`glossary.productionHistory.${key}`);
  const change = (key: keyof OperationForm, text: string) => onChange({ ...value, [key]: text });
  const material = type === 'SPRAYING' || type === 'FERTILIZING';
  const occurredDate = value.occurredAt.slice(0, 10);
  const occurredTime = value.occurredAt.slice(11, 16);
  const ended = splitIsoDateTime(value.endedAt);

  return <View style={{ gap: 10, marginVertical: 14 }}>
    <Text>{label('operationTime')}</Text>
    {Platform.OS === 'web' ? (
      <EnterpriseTextField
        accessibilityLabel={label('operationTime')}
        value={occurredDate}
        onChangeText={(date) => change('occurredAt', `${date}T${occurredTime || '08:00'}`)}
        placeholder="YYYY-MM-DD"
      />
    ) : (
      <GrowerDateField
        value={occurredDate}
        maximumDate={new Date()}
        onChange={(date) => change('occurredAt', `${date}T${occurredTime || '08:00'}`)}
      />
    )}
    <Text>{label('operationClock')}</Text>
    {Platform.OS === 'web' ? (
      <EnterpriseTextField
        label={label('operationClock')}
        value={occurredTime}
        onChangeText={(time) => change('occurredAt', `${occurredDate}T${time}`)}
        placeholder="HH:mm"
      />
    ) : (
      <GrowerTimeField
        value={occurredTime}
        onChange={(time) => change('occurredAt', `${occurredDate}T${time}`)}
      />
    )}
    <Text>{label('operationEnd')}</Text>
    <Text style={{ color: '#64748b', fontSize: 12, marginTop: -6 }}>{label('operationEndHint')}</Text>
    {Platform.OS === 'web' ? (
      <EnterpriseTextField
        label={label('operationEnd')}
        value={value.endedAt}
        onChangeText={(text) => change('endedAt', text)}
        placeholder="YYYY-MM-DDTHH:mm"
      />
    ) : (
      <>
        <GrowerDateField
          value={ended.date}
          maximumDate={new Date()}
          onChange={(date) => change('endedAt', joinIsoDateTime(date, ended.time))}
        />
        <GrowerTimeField
          value={ended.time}
          onChange={(time) => change('endedAt', joinIsoDateTime(ended.date || occurredDate, time))}
        />
      </>
    )}
    {material ? <>
      <EnterpriseTextField label={label('materialName')} value={value.materialName} onChangeText={text => change('materialName', text)} />
      <EnterpriseTextField label={label('usedQuantity')} value={value.quantity} keyboardType="decimal-pad" onChangeText={text => change('quantity', text)} />
      <GrowerSelectField placeholder={label('unit')} label={label('unit')} valueId={value.unit} options={['L', 'mL', 'kg', 'g'].map(id => ({ id, label: id }))} onSelect={id => change('unit', id)} />
    </> : null}
    {type !== 'INSPECTION' ? <>
      <EnterpriseTextField label={label(type === 'IRRIGATION' ? 'waterRequired' : 'waterOptional')} value={value.waterLitres} keyboardType="decimal-pad" onChangeText={text => change('waterLitres', text)} />
      <EnterpriseTextField label={label('areaOptional')} value={value.areaHa} keyboardType="decimal-pad" onChangeText={text => change('areaHa', text)} />
      <EnterpriseTextField label={label('method')} value={value.method} onChangeText={text => change('method', text)} />
    </> : null}
    <EnterpriseTextArea label={label(type === 'INSPECTION' ? 'inspectionFindings' : 'notes')} value={notes} onChangeText={onNotesChange} minRows={3} />
    <Text style={{ color: '#64748b', fontSize: 12 }}>{label('operationHelp')}</Text>
  </View>;
}
