import { View, Text, TextInput } from 'react-native';
import { colors } from '../../../lib/colors';

interface DimensionsFormProps {
  length: string;
  width: string;
  totalArea: number;
  onLengthChange: (v: string) => void;
  onWidthChange: (v: string) => void;
}

export function DimensionsForm({
  length,
  width,
  totalArea,
  onLengthChange,
  onWidthChange,
}: DimensionsFormProps) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '400',
          color: colors.text.primary,
          marginBottom: 12,
          letterSpacing: 0.3,
        }}
      >
        Dimenzije
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '300',
              color: colors.text.secondary,
              marginBottom: 6,
            }}
          >
            Dužina (m)
          </Text>
          <TextInput
            value={length}
            onChangeText={onLengthChange}
            placeholder="150"
            keyboardType="decimal-pad"
            style={{
              padding: 12,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 6,
              backgroundColor: colors.surface,
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.primary,
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '300',
              color: colors.text.secondary,
              marginBottom: 6,
            }}
          >
            Širina (m)
          </Text>
          <TextInput
            value={width}
            onChangeText={onWidthChange}
            placeholder="80"
            keyboardType="decimal-pad"
            style={{
              padding: 12,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 6,
              backgroundColor: colors.surface,
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.primary,
            }}
          />
        </View>
      </View>
      {totalArea > 0 && (
        <Text
          style={{
            marginTop: 8,
            fontSize: 11,
            fontWeight: '300',
            color: colors.text.secondary,
          }}
        >
          Ukupna površina: {totalArea.toLocaleString()} m²
        </Text>
      )}
    </View>
  );
}
