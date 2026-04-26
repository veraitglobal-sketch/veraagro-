import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { Wallet, Settings, LogOut, MapPin, Package, Truck, Bell, Image as ImageIcon, CheckCircle, FileText, Camera } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useRouter } from 'expo-router';
import { offlineStorage } from '../../../lib/offline-storage';
import { useState, useEffect } from 'react';
import { estatesAPI, Estate } from '../../../lib/api';

/**
 * Profile / Settings Screen
 * Wallet and settings
 * Matches buyer dashboard styling
 */
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [estates, setEstates] = useState<Estate[]>([]);

  useEffect(() => {
    loadPendingCount();
    loadEstates();
  }, []);

  const loadPendingCount = async () => {
    const entries = await offlineStorage.getPendingEntries();
    setPendingCount(entries.filter(e => e.status === 'pending').length);
  };

  const loadEstates = async () => {
    try {
      const data = await estatesAPI.getAll();
      setEstates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading estates:', error);
      setEstates([]);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.md }}>
        {/* User Info */}
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.md,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.05)',
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
            marginBottom: theme.spacing.xs,
          }}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={{
            fontSize: 11,
            fontWeight: '300',
            color: theme.colors.text.secondary,
            letterSpacing: 0.3,
          }}>
            {user?.partnerCode}
          </Text>
          {user?.email && (
            <Text style={{
              fontSize: 11,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginTop: theme.spacing.xs,
              letterSpacing: 0.2,
            }}>
              {user.email}
            </Text>
          )}
        </View>

        {/* Wallet */}
        <TouchableOpacity
          onPress={() => router.push('/(producer)/(tabs)/wallet')}
          activeOpacity={0.7}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.05)',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Wallet size={24} color={theme.colors.primary} strokeWidth={1} />
          <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.3,
              marginBottom: 2,
            }}>
              Wallet
            </Text>
            <Text style={{
              fontSize: 9,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              letterSpacing: 0.2,
            }}>
              Transaction and balance overview
            </Text>
          </View>
        </TouchableOpacity>

        {/* Pending Entries */}
        {pendingCount > 0 && (
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.05)',
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.xs,
            }}>
              Awaiting Sync
            </Text>
            <Text style={{
              fontSize: 11,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              letterSpacing: 0.3,
            }}>
              {pendingCount} {pendingCount === 1 ? 'entry' : 'entries'} waiting to be sent
            </Text>
          </View>
        )}

        {/* Quick Links */}
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
            marginBottom: theme.spacing.sm,
          }}>
            Quick Access
          </Text>
          <View style={{ gap: theme.spacing.sm }}>
            <TouchableOpacity
              onPress={() => router.push('/(producer)/estates')}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MapPin size={20} color={theme.colors.text.secondary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  Estates
                </Text>
                {estates.length > 0 && (
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    marginTop: 2,
                    letterSpacing: 0.2,
                  }}>
                    {estates.length} {estates.length === 1 ? 'estate' : 'estates'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(producer)/batches')}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Package size={20} color={theme.colors.text.secondary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  Batches
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(producer)/missions')}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Truck size={20} color={theme.colors.text.secondary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  Missions
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(producer)/orders')}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <FileText size={20} color={theme.colors.text.secondary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  Orders
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(producer)/notifications')}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Bell size={20} color={theme.colors.text.secondary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  Notifications
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(producer)/compliance-photos')}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Camera size={20} color={theme.colors.text.secondary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  Compliance Photos
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(producer)/quality-entry')}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <CheckCircle size={20} color={theme.colors.text.secondary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  Quality Entry
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(producer)/materials')}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Package size={20} color={theme.colors.text.secondary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  Material Whitelist
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(producer)/growth-journal')}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <ImageIcon size={20} color={theme.colors.text.secondary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  Growth Journal
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <TouchableOpacity
          onPress={() => router.push('/(producer)/(tabs)/settings')}
          activeOpacity={0.7}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.05)',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Settings size={24} color={theme.colors.text.secondary} strokeWidth={1} />
          <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.3,
              marginBottom: 2,
            }}>
              Settings
            </Text>
            <Text style={{
              fontSize: 9,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              letterSpacing: 0.2,
            }}>
              Notifications and options
            </Text>
          </View>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: theme.colors.error,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <LogOut size={24} color={theme.colors.error} strokeWidth={1} />
          <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.error,
              letterSpacing: 0.3,
            }}>
              Log Out
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
