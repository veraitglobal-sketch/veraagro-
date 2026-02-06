import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Camera, CheckCircle2, XCircle, Thermometer, Image as ImageIcon, PenTool } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../lib/colors';
import { digitalHandoverAPI } from '../../lib/api';
import StepIndicator from '../../components/StepIndicator';

/**
 * Manager Handover Complete Screen
 * Quality audit form with visual check, temperature, photos, and signature
 */
export default function HandoverCompleteScreen() {
  const router = useRouter();
  const { handoverId } = useLocalSearchParams<{ handoverId: string }>();
  const [step, setStep] = useState(2); // Start at step 2 (quality check)
  const [visualCheck, setVisualCheck] = useState<'FRESH' | 'DAMAGED' | null>(null);
  const [temperature, setTemperature] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // In production, upload to server and get URL
      // For now, use local URI
      const newPhotos = [...photos, result.assets[0].uri];
      if (newPhotos.length <= 2) {
        setPhotos(newPhotos);
      } else {
        Alert.alert('Limit', 'Maximum 2 photos allowed');
      }
    }
  };

  const handleComplete = async () => {
    if (!visualCheck) {
      Alert.alert('Required', 'Please select visual check status');
      return;
    }

    if (!temperature || isNaN(parseFloat(temperature))) {
      Alert.alert('Required', 'Please enter valid temperature');
      return;
    }

    if (photos.length < 2) {
      Alert.alert('Required', 'Please take 2 photos of the crates');
      return;
    }

    if (!handoverId) {
      Alert.alert('Error', 'Handover ID is missing');
      return;
    }

    setLoading(true);

    try {
      const result = await digitalHandoverAPI.complete({
        handoverId,
        qualityCheck: {
          visualCheck,
          temperature: parseFloat(temperature),
          photoUrls: photos, // In production, these should be uploaded URLs
          signature: signature || undefined,
          notes: notes || undefined,
        },
      });

      Alert.alert(
        'Handover Completed',
        visualCheck === 'DAMAGED'
          ? 'Quality issue reported. Admin has been notified.'
          : 'Handover completed successfully. Delivery receipt generated.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete handover');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 13, color: colors.text.secondary, fontWeight: '300' }}>
          Completing handover...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, letterSpacing: 0.5 }}>
          Quality Audit
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        <StepIndicator currentStep={step} totalSteps={3} labels={['Skeniranje', 'Provera', 'Potpis']} />

        {/* Visual Check */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '400', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.3 }}>
            Visual Check
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setVisualCheck('FRESH')}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 8,
                borderWidth: 0.5,
                borderColor: visualCheck === 'FRESH' ? colors.primary : colors.border,
                backgroundColor: visualCheck === 'FRESH' ? `${colors.primary}10` : colors.surface,
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <CheckCircle2 size={24} color={visualCheck === 'FRESH' ? colors.primary : colors.text.secondary} strokeWidth={1} />
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  fontWeight: '300',
                  color: visualCheck === 'FRESH' ? colors.primary : colors.text.secondary,
                }}
              >
                Sveže
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setVisualCheck('DAMAGED')}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 8,
                borderWidth: 0.5,
                borderColor: visualCheck === 'DAMAGED' ? colors.error : colors.border,
                backgroundColor: visualCheck === 'DAMAGED' ? `${colors.error}10` : colors.surface,
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <XCircle size={24} color={visualCheck === 'DAMAGED' ? colors.error : colors.text.secondary} strokeWidth={1} />
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  fontWeight: '300',
                  color: visualCheck === 'DAMAGED' ? colors.error : colors.text.secondary,
                }}
              >
                Oštećeno
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Temperature Check */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '400', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.3 }}>
            Temperature Check
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              backgroundColor: colors.surface,
            }}
          >
            <Thermometer size={20} color={colors.text.secondary} strokeWidth={1} />
            <TextInput
              value={temperature}
              onChangeText={setTemperature}
              placeholder="4.0"
              keyboardType="decimal-pad"
              style={{
                flex: 1,
                padding: 12,
                fontSize: 14,
                fontWeight: '300',
                color: colors.text.primary,
              }}
            />
            <Text style={{ fontSize: 13, color: colors.text.secondary, marginRight: 8 }}>°C</Text>
          </View>
        </View>

        {/* Photo Proof */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '400', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.3 }}>
            Photo Proof (2 photos required)
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[0, 1].map((index) => (
              <TouchableOpacity
                key={index}
                onPress={handleTakePhoto}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: 8,
                  borderWidth: 0.5,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.7}
              >
                {photos[index] ? (
                  <Text style={{ fontSize: 11, color: colors.text.secondary, fontWeight: '300' }}>Photo {index + 1}</Text>
                ) : (
                  <ImageIcon size={24} color={colors.text.secondary} strokeWidth={1} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={handleTakePhoto}
            style={{
              marginTop: 12,
              padding: 12,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: colors.surface,
            }}
            activeOpacity={0.7}
          >
            <Camera size={18} color={colors.primary} strokeWidth={1} />
            <Text style={{ marginTop: 4, fontSize: 11, color: colors.primary, fontWeight: '300' }}>
              {photos.length < 2 ? `Take Photo ${photos.length + 1}` : 'Replace Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '400', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.3 }}>
            Notes (Optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            multiline
            numberOfLines={3}
            style={{
              padding: 12,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.surface,
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.primary,
              minHeight: 80,
            }}
          />
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          onPress={handleComplete}
          disabled={loading}
          style={{
            marginTop: 32,
            marginBottom: 40,
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 14, fontWeight: '400', color: colors.background, letterSpacing: 0.5 }}>
            Complete Handover
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
