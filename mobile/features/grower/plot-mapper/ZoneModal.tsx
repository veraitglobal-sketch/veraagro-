import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { CROP_TYPES, CROP_STATUSES } from './constants';
import type { Zone } from './types';

interface ZoneModalProps {
  visible: boolean;
  selectedZone: Zone | null;
  onClose: () => void;
  onSave: (
    zoneCropType: string,
    zonePlantingDate: Date,
    zoneStatus: string
  ) => void;
}

export function ZoneModal({
  visible,
  selectedZone,
  onClose,
  onSave,
}: ZoneModalProps) {
  const { t } = useTranslation();
  const [zoneCropType, setZoneCropType] = useState('');
  const [zonePlantingDate, setZonePlantingDate] = useState(new Date());
  const [zoneStatus, setZoneStatus] = useState('');

  useEffect(() => {
    if (selectedZone) {
      setZoneCropType(selectedZone.cropType || '');
      setZonePlantingDate(
        selectedZone.plantingDate ? new Date(selectedZone.plantingDate) : new Date()
      );
      setZoneStatus(selectedZone.status || '');
    }
  }, [selectedZone]);

  const handleSave = () => {
    onSave(zoneCropType, zonePlantingDate, zoneStatus);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 20,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '300',
                color: colors.text.primary,
                letterSpacing: 0.5,
              }}
            >
              {selectedZone?.name}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={colors.text.secondary} strokeWidth={1} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginBottom: 6,
                }}
              >
                {t('producer.plotMapper.cropType')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CROP_TYPES.map((crop) => (
                    <TouchableOpacity
                      key={crop}
                      onPress={() => setZoneCropType(crop)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: 0.5,
                        borderColor: zoneCropType === crop ? colors.primary : colors.border,
                        borderRadius: 6,
                        backgroundColor:
                          zoneCropType === crop ? `${colors.primary}10` : colors.surface,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '300',
                          color: zoneCropType === crop ? colors.primary : colors.text.secondary,
                        }}
                      >
                        {crop}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginBottom: 6,
                }}
              >
                {t('producer.plotMapper.plantingDate')}
              </Text>
              <TextInput
                value={zonePlantingDate.toISOString().split('T')[0]}
                onChangeText={(text) => {
                  const date = new Date(text);
                  if (!isNaN(date.getTime())) setZonePlantingDate(date);
                }}
                placeholder="YYYY-MM-DD"
                style={{
                  padding: 12,
                  borderWidth: 0.5,
                  borderColor: colors.border,
                  borderRadius: 6,
                  backgroundColor: colors.surface,
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginBottom: 6,
                }}
              >
                Status
              </Text>
              <View style={{ gap: 8 }}>
                {CROP_STATUSES.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    onPress={() => setZoneStatus(status.value)}
                    style={{
                      padding: 12,
                      borderWidth: 0.5,
                      borderColor: zoneStatus === status.value ? colors.primary : colors.border,
                      borderRadius: 6,
                      backgroundColor:
                        zoneStatus === status.value ? `${colors.primary}10` : colors.surface,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '300',
                        color: zoneStatus === status.value ? colors.primary : colors.text.secondary,
                      }}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 6,
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '400',
                  color: colors.background,
                  letterSpacing: 0.5,
                }}
              >
                {t('producer.plotMapper.saveZone')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
