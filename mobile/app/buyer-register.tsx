import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import { theme } from '../lib/theme';
import { api } from '../lib/api';

/**
 * Buyer Registration Screen
 * For commercial buyers (mini markets, piljarnice)
 * Automatically creates Hub location if GPS is provided
 */
export default function BuyerRegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Form fields
  const [partnerCode, setPartnerCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  
  // Location
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState('');

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to appear on the map');
        return;
      }

      // Get current location
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(coords);

      // Reverse geocode to get address
      try {
        const addresses = await Location.reverseGeocodeAsync(coords);
        if (addresses.length > 0) {
          const addr = addresses[0];
          const fullAddress = [
            addr.street,
            addr.streetNumber,
            addr.postalCode,
            addr.city,
            addr.country,
          ].filter(Boolean).join(', ');
          
          setLocationAddress(fullAddress);
          if (!address) setAddress(addr.street || '');
          if (!city) setCity(addr.city || '');
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get location');
      console.error('Location error:', error);
    } finally {
      setGettingLocation(false);
    }
  };

  const handleRegister = async () => {
    // Validation
    if (!partnerCode || !firstName || !lastName || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // If location is provided, address and city are required
    if (location && (!address || !city)) {
      Alert.alert('Error', 'Address and city are required when location is provided');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/auth/register/buyer', {
        partnerCode,
        email: email || undefined,
        phone: phone || undefined,
        firstName,
        lastName,
        password,
        businessName: businessName || undefined,
        location: location || undefined,
        address: address || undefined,
        city: city || undefined,
      });

      Alert.alert(
        'Success',
        response.data.hub
          ? 'Registration successful! Your location will appear on the map after admin approval.'
          : 'Registration successful! You can add your location in your profile.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/buyer-login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || error.message || 'Registration failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: 60,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: theme.spacing.md }}
          >
            <ArrowLeft size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 18,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 1,
          }}>
            Register as Buyer
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.spacing.lg }}>
        {/* Info */}
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.lg,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.1)',
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.secondary,
            lineHeight: 18,
            letterSpacing: 0.2,
          }}>
            Register your business (mini market, piljarnica) to appear on the map where customers can find BioVera products.
          </Text>
        </View>

        {/* Required Fields */}
        <Text style={{
          fontSize: 11,
          fontWeight: '300',
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          Required Information
        </Text>

        <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <View>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 4,
              textTransform: 'uppercase',
            }}>
              Partner Code *
            </Text>
            <TextInput
              value={partnerCode}
              onChangeText={setPartnerCode}
              placeholder="Enter partner code"
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                fontSize: 13,
                fontWeight: '300',
                color: theme.colors.text.primary,
              }}
            />
          </View>

          <View>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 4,
              textTransform: 'uppercase',
            }}>
              First Name *
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                fontSize: 13,
                fontWeight: '300',
                color: theme.colors.text.primary,
              }}
            />
          </View>

          <View>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 4,
              textTransform: 'uppercase',
            }}>
              Last Name *
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                fontSize: 13,
                fontWeight: '300',
                color: theme.colors.text.primary,
              }}
            />
          </View>

          <View>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 4,
              textTransform: 'uppercase',
            }}>
              Password *
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                fontSize: 13,
                fontWeight: '300',
                color: theme.colors.text.primary,
              }}
            />
          </View>
        </View>

        {/* Optional Fields */}
        <Text style={{
          fontSize: 11,
          fontWeight: '300',
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          Optional Information
        </Text>

        <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <View>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 4,
              textTransform: 'uppercase',
            }}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                fontSize: 13,
                fontWeight: '300',
                color: theme.colors.text.primary,
              }}
            />
          </View>

          <View>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 4,
              textTransform: 'uppercase',
            }}>
              Phone
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                fontSize: 13,
                fontWeight: '300',
                color: theme.colors.text.primary,
              }}
            />
          </View>

          <View>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 4,
              textTransform: 'uppercase',
            }}>
              Business Name
            </Text>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Name of your shop"
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                fontSize: 13,
                fontWeight: '300',
                color: theme.colors.text.primary,
              }}
            />
          </View>
        </View>

        {/* Location Section */}
        <Text style={{
          fontSize: 11,
          fontWeight: '300',
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          Location (for Map)
        </Text>

        <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={gettingLocation}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: location ? theme.colors.primary : 'rgba(0, 0, 0, 0.1)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <MapPin size={16} color={location ? theme.colors.primary : theme.colors.text.secondary} strokeWidth={1} />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: location ? theme.colors.primary : theme.colors.text.secondary,
                  marginLeft: theme.spacing.sm,
                }}>
                  {location ? 'Location Set' : 'Get Current Location'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {location && (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.1)',
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                marginBottom: 4,
              }}>
                Detected Address:
              </Text>
              <Text style={{
                fontSize: 12,
                fontWeight: '300',
                color: theme.colors.text.primary,
              }}>
                {locationAddress || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
              </Text>
            </View>
          )}

          <View>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 4,
              textTransform: 'uppercase',
            }}>
              Address {location ? '*' : ''}
            </Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Street address"
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                fontSize: 13,
                fontWeight: '300',
                color: theme.colors.text.primary,
              }}
            />
          </View>

          <View>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 4,
              textTransform: 'uppercase',
            }}>
              City {location ? '*' : ''}
            </Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="City"
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                fontSize: 13,
                fontWeight: '300',
                color: theme.colors.text.primary,
              }}
            />
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            alignItems: 'center',
            marginTop: theme.spacing.lg,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{
              fontSize: 14,
              fontWeight: '300',
              color: '#fff',
              letterSpacing: 1,
            }}>
              Register
            </Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity
          onPress={() => router.push('/buyer-login')}
          style={{ marginTop: theme.spacing.md, alignItems: 'center' }}
        >
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.secondary,
          }}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
