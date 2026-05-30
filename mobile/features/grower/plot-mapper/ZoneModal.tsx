import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { dsColors, EnterpriseButton, EnterpriseTextField } from '../../../design-system';
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
                color: dsColors.gray900,
                letterSpacing: 0.5,
              }}
            >
              {selectedZone?.name}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={dsColors.muted} strokeWidth={1} />
            </TouchableOpacity>
          </View>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '400',
                  color: dsColors.muted,
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
                        borderColor: zoneCropType === crop ? dsColors.primary : dsColors.border,
                        borderRadius: 6,
                        backgroundColor:
                          zoneCropType === crop ? dsColors.primaryTint : dsColors.surface,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '400',
                          color: zoneCropType === crop ? dsColors.primary : dsColors.muted,
                        }}
                      >
                        {crop}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <EnterpriseTextField
              label={t('producer.plotMapper.plantingDate')}
              value={zonePlantingDate.toISOString().split('T')[0]}
              onChangeText={(text) => {
                const date = new Date(text);
                if (!isNaN(date.getTime())) setZonePlantingDate(date);
              }}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
            />

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '400',
                  color: dsColors.muted,
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
                      borderColor: zoneStatus === statusValue ? dsColors.primary : dsColors.border,
                      borderRadius: 6,
                      backgroundColor:
                        zoneStatus === statusValue ? dsColors.primaryTint : dsColors.surface,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '400',
                        color: zoneStatus === statusValue ? dsColors.primary : dsColors.muted,
                      }}
                    >
                      {t(`producer.plotMapper.cropStatus.${statusValue}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <EnterpriseButton
              label={t('producer.plotMapper.saveZone')}
              onPress={handleSave}
              fullWidth
              size="large"
            />
          </ScrollView>
            </TouchableWithoutFeedback>
        </View>
    </BioVeraBottomSheet>
  );
}
