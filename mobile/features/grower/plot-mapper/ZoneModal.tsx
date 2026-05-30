import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { CROP_TYPES, CROP_STATUS_VALUES } from './constants';
import type { Zone } from './types';
import { BioVeraBottomSheet } from '../../../components/enterprise/BioVeraBottomSheet';

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
    <BioVeraBottomSheet visible={visible} onClose={onClose} keyboardAvoiding>
        <View style={{ padding: 20 }}>
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
                fontWeight: '400',
                color: theme.colors.text.primary,
                letterSpacing: 0.5,
              }}
            >
              {selectedZone?.name}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={theme.colors.text.secondary} strokeWidth={1} />
            </TouchableOpacity>
          </View>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '400',
                  color: theme.colors.text.secondary,
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
                        borderColor: zoneCropType === crop ? theme.colors.primary : theme.colors.border,
                        borderRadius: 6,
                        backgroundColor:
                          zoneCropType === crop ? `${theme.colors.primary}10` : theme.colors.surface,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '400',
                          color: zoneCropType === crop ? theme.colors.primary : theme.colors.text.secondary,
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
                  fontSize: 14,
                  fontWeight: '400',
                  color: theme.colors.text.secondary,
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
                  borderColor: theme.colors.border,
                  borderRadius: 6,
                  backgroundColor: theme.colors.surface,
                  fontSize: 13,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '400',
                  color: theme.colors.text.secondary,
                  marginBottom: 6,
                }}
              >
                {t('common.status')}
              </Text>
              <View style={{ gap: 8 }}>
                {CROP_STATUS_VALUES.map((statusValue) => (
                  <TouchableOpacity
                    key={statusValue}
                    onPress={() => setZoneStatus(statusValue)}
                    style={{
                      padding: 12,
                      borderWidth: 0.5,
                      borderColor: zoneStatus === statusValue ? theme.colors.primary : theme.colors.border,
                      borderRadius: 6,
                      backgroundColor:
                        zoneStatus === statusValue ? `${theme.colors.primary}10` : theme.colors.surface,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '400',
                        color: zoneStatus === statusValue ? theme.colors.primary : theme.colors.text.secondary,
                      }}
                    >
                      {t(`producer.plotMapper.cropStatus.${statusValue}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              style={{
                backgroundColor: theme.colors.primary,
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
                  color: theme.colors.background,
                  letterSpacing: 0.5,
                }}
              >
                {t('producer.plotMapper.saveZone')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
            </TouchableWithoutFeedback>
        </View>
    </BioVeraBottomSheet>
  );
}
