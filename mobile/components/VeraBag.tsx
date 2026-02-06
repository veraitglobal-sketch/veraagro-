import { View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Camera, Image as ImageIcon, X, Package } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
// Watermark will be added via overlay in UI
import { colors } from '../lib/colors';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

interface Photo {
  id: string;
  uri: string;
  category: 'SEED_PLANTING' | 'TREATMENT' | 'HARVEST';
  timestamp: string;
  watermark?: string; // Base64 watermark image
}

interface VeraBagProps {
  batchId?: string;
  parcelId?: string;
  onSave?: (photos: Photo[]) => void;
}

const CATEGORIES = [
  { value: 'SEED_PLANTING', label: 'Seme i Setva', icon: Package },
  { value: 'TREATMENT', label: 'Tretman', icon: Package },
  { value: 'HARVEST', label: 'Berba', icon: Package },
] as const;

/**
 * VeraBag Component
 * Digital bag for visual evidence with watermark
 */
export default function VeraBag({ batchId, parcelId, onSave }: VeraBagProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'SEED_PLANTING' | 'TREATMENT' | 'HARVEST'>('SEED_PLANTING');
  const [uploading, setUploading] = useState(false);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      await addPhotoWithWatermark(result.assets[0].uri);
    }
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      await addPhotoWithWatermark(result.assets[0].uri);
    }
  };

  const addPhotoWithWatermark = async (uri: string) => {
    setUploading(true);
    try {
      // Create watermark with VERA logo and timestamp
      const timestamp = new Date().toLocaleString('sr-RS', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // In production, use proper watermark library
      // For now, we'll add metadata
      const photo: Photo = {
        id: `photo-${Date.now()}`,
        uri,
        category: selectedCategory,
        timestamp,
        watermark: `VERA • ${timestamp}`, // Text watermark for now
      };

      setPhotos((prev) => [...prev, photo]);
      
      // Call onSave callback
      if (onSave) {
        onSave([...photos, photo]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add photo');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== photoId);
      if (onSave) {
        onSave(updated);
      }
      return updated;
    });
  };

  const getPhotosByCategory = (category: typeof selectedCategory) => {
    return photos.filter((p) => p.category === category);
  };

  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: 'rgba(26, 48, 33, 0.2)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <View
        style={{
          padding: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(26, 48, 33, 0.2)',
          backgroundColor: `${colors.primary}05`,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Package size={16} color={colors.primary} strokeWidth={1} />
              <Text style={{ fontSize: 11, fontWeight: '300', color: colors.primary, letterSpacing: 1.5 }}>
                VERA
              </Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary, letterSpacing: 0.3 }}>
              Vera Digital Bag
            </Text>
            {batchId && (
              <Text style={{ fontSize: 10, fontWeight: '300', color: colors.text.secondary, marginTop: 2 }}>
                Batch {batchId}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Category Tabs */}
      <View
        style={{
          flexDirection: 'row',
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(26, 48, 33, 0.2)',
          backgroundColor: colors.surface,
        }}
      >
        {CATEGORIES.map((category) => {
          const IconComponent = category.icon;
          const photoCount = getPhotosByCategory(category.value as any).length;
          const isActive = selectedCategory === category.value;

          return (
            <TouchableOpacity
              key={category.value}
              onPress={() => setSelectedCategory(category.value as any)}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 8,
                alignItems: 'center',
                borderBottomWidth: isActive ? 1 : 0,
                borderBottomColor: isActive ? colors.primary : 'transparent',
                backgroundColor: isActive ? colors.background : 'transparent',
              }}
              activeOpacity={0.7}
            >
              <IconComponent size={16} color={isActive ? colors.primary : colors.text.secondary} strokeWidth={1} />
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: isActive ? colors.primary : colors.text.secondary,
                  marginTop: 4,
                  textAlign: 'center',
                }}
                numberOfLines={2}
              >
                {category.label}
              </Text>
              {photoCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 8, fontWeight: '600', color: colors.background }}>
                    {photoCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Photo Gallery */}
      <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>
          {getPhotosByCategory(selectedCategory).length === 0 ? (
            <View
              style={{
                padding: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 0.5,
                borderColor: 'rgba(26, 48, 33, 0.2)',
                borderStyle: 'dashed',
                borderRadius: 8,
                backgroundColor: colors.surface,
              }}
            >
              <ImageIcon size={32} color={colors.text.tertiary} strokeWidth={1} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginTop: 12,
                  textAlign: 'center',
                }}
              >
                No photos in this category
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {getPhotosByCategory(selectedCategory).map((photo, index) => (
                <Animated.View
                  key={photo.id}
                  entering={FadeInDown.delay(index * 50)}
                  exiting={FadeOut}
                  style={{
                    width: '31%',
                    aspectRatio: 1,
                    position: 'relative',
                  }}
                >
                  <Image
                    source={{ uri: photo.uri }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 8,
                      borderWidth: 0.5,
                      borderColor: 'rgba(26, 48, 33, 0.2)',
                    }}
                    resizeMode="cover"
                  />
                  {/* Watermark Overlay */}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      right: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ fontSize: 7, fontWeight: '300', color: colors.text.primary }}>
                      {photo.watermark}
                    </Text>
                  </View>
                  {/* Remove Button */}
                  <TouchableOpacity
                    onPress={() => removePhoto(photo.id)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    <X size={12} color={colors.background} strokeWidth={1.5} />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Upload Buttons */}
          <View style={{ marginTop: 16, gap: 8 }}>
            <TouchableOpacity
              onPress={handleTakePhoto}
              disabled={uploading}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                borderWidth: 0.5,
                borderColor: colors.primary,
                borderRadius: 8,
                backgroundColor: colors.surface,
                gap: 8,
              }}
              activeOpacity={0.7}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Camera size={18} color={colors.primary} strokeWidth={1} />
              )}
              <Text style={{ fontSize: 12, fontWeight: '300', color: colors.primary, letterSpacing: 0.3 }}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePickFromGallery}
              disabled={uploading}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                borderWidth: 0.5,
                borderColor: colors.border,
                borderRadius: 8,
                backgroundColor: colors.surface,
                gap: 8,
              }}
              activeOpacity={0.7}
            >
              <ImageIcon size={18} color={colors.text.secondary} strokeWidth={1} />
              <Text style={{ fontSize: 12, fontWeight: '300', color: colors.text.secondary, letterSpacing: 0.3 }}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
