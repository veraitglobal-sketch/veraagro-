import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { Camera, FilePlus, Wheat, Calendar, MapPin, Package, Bell, Truck, Wallet, Image as ImageIcon, TrendingUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SyncStatus from '../../../components/SyncStatus';
import TrustScoreWidget from '../../../components/TrustScoreWidget';
import { theme } from '../../../lib/theme';
import { estatesAPI, Estate, fieldEntriesAPI, FieldEntry, missionsAPI, Mission, batchesAPI, notificationsAPI, Notification } from '../../../lib/api';
import { syncService } from '../../../lib/sync-service';
import { useSocket } from '../../../hooks/useSocket';

/**
 * Producer Dashboard
 * Matches buyer dashboard styling - minimalist, clean design
 */
export default function ProducerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { socket, connected, notifications: socketNotifications } = useSocket();
  const [estates, setEstates] = useState<Estate[]>([]);
  const [trustScore, setTrustScore] = useState(75);
  const [recentEntries, setRecentEntries] = useState<FieldEntry[]>([]);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [financialData, setFinancialData] = useState<{
    totalEarned: number;
    pendingBalance: number;
    availableBalance: number;
    nextPayout?: string;
  } | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (!connected) {
        loadLiveData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, connected]);

  useEffect(() => {
    if (socketNotifications.length > 0) {
      setNotifications(prev => {
        const merged = [...socketNotifications, ...prev];
        const unique = merged.filter((n, index, self) => 
          index === self.findIndex(t => t.id === n.id)
        );
        return unique;
      });
      
      const unread = socketNotifications.filter(n => !n.read).length;
      setUnreadCount(prev => prev + unread);
      loadLiveData();
    }
  }, [socketNotifications]);

  const loadData = async () => {
    await Promise.all([
      loadEstates(),
      loadRecentEntries(),
      loadLiveData(),
    ]);
    if (user?.trustScore) {
      setTrustScore(user.trustScore);
    }
  };

  const loadLiveData = async () => {
    try {
      await Promise.all([
        loadMissions(),
        loadBatches(),
        loadNotifications(),
        loadFinancialData(),
      ]);
    } catch (error) {
      console.error('Error loading live data:', error);
    }
  };

  const loadFinancialData = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.178.27:3000';
      const response = await fetch(`${API_URL}/wallets/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const wallet = await response.json();
        setFinancialData({
          totalEarned: wallet.totalEarned || 0,
          pendingBalance: wallet.pendingBalance || 0,
          availableBalance: wallet.availableBalance || 0,
          nextPayout: wallet.nextPayoutDate,
        });
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadData(),
        syncService.syncPendingEntries(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const loadEstates = async () => {
    try {
      const data = await estatesAPI.getAll();
      setEstates(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading estates:', error);
      // Set empty array on error to prevent UI crashes
      setEstates([]);
    }
  };

  const loadRecentEntries = async () => {
    try {
      const entries = await fieldEntriesAPI.getAll();
      const sorted = (Array.isArray(entries) ? entries : [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentEntries(sorted);
    } catch (error: any) {
      console.error('Error loading recent entries:', error);
      setRecentEntries([]);
    }
  };

  const loadMissions = async () => {
    try {
      const missions = await missionsAPI.getAll();
      const active = (Array.isArray(missions) ? missions : []).filter((m: any) => 
        m?.status === 'PENDING' || m?.status === 'ASSIGNED' || m?.status === 'IN_TRANSIT'
      );
      setActiveMissions(active);
    } catch (error: any) {
      console.error('Error loading missions:', error);
      setActiveMissions([]);
    }
  };

  const loadBatches = async () => {
    try {
      const batches = await batchesAPI.getAll();
      const active = (Array.isArray(batches) ? batches : []).filter((b: any) => 
        b?.status === 'PACKED' || b?.status === 'IN_HUB' || b?.status === 'IN_TRANSIT'
      ).slice(0, 5);
      setActiveBatches(active);
    } catch (error: any) {
      console.error('Error loading batches:', error);
      setActiveBatches([]);
    }
  };

  const loadNotifications = async () => {
    try {
      const notifs = await notificationsAPI.getAll();
      const notifications = Array.isArray(notifs) ? notifs : [];
      setNotifications(notifications);
      const unread = notifications.filter((n: any) => !n?.read && !n?.readAt).length;
      setUnreadCount(unread);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const handleScanInput = () => {
    router.push('/(producer)/scanner');
  };

  const handleNewEntry = () => {
    router.push('/(producer)/(tabs)/field-log');
  };

  const handleReportHarvest = () => {
    router.push('/(producer)/(tabs)/harvest');
  };

  const handleVeraBag = () => {
    router.push('/(producer)/vera-bag');
  };

  const handleVeraInsights = () => {
    router.push('/(producer)/vera-insights');
  };

  const handleViewMissions = () => {
    router.push('/(producer)/missions');
  };

  const handleViewBatches = () => {
    router.push('/(producer)/batches');
  };

  const handleViewNotifications = () => {
    router.push('/(producer)/notifications');
  };

  const handleViewWallet = () => {
    router.push('/(producer)/(tabs)/wallet');
  };

  const farmName = estates[0]?.name || 'My Farm';

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.text.secondary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={{
        paddingTop: 60,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 1,
            }}>
              {farmName}
            </Text>
            {user?.partnerCode && (
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                marginTop: 4,
                letterSpacing: 0.3,
              }}>
                Partner: {user.partnerCode}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: connected ? theme.colors.primary : theme.colors.text.tertiary,
            }} />
            <SyncStatus />
          </View>
        </View>
      </View>

      <View style={{ padding: theme.spacing.md }}>
        {/* Trust Score Widget */}
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          marginBottom: theme.spacing.md,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.05)',
          alignItems: 'center',
        }}>
          <TrustScoreWidget score={trustScore} size={140} />
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
            marginBottom: theme.spacing.md,
          }}>
            Quick Actions
          </Text>
          
          <View style={{ gap: theme.spacing.sm }}>
            {/* Scan Input Button */}
            <TouchableOpacity
              onPress={handleScanInput}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 70,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${theme.colors.accent}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.md,
              }}>
                <Camera size={24} color={theme.colors.accent} strokeWidth={1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                  marginBottom: 2,
                }}>
                  Scan Input
                </Text>
                <Text style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.2,
                }}>
                  Scan material barcode
                </Text>
              </View>
            </TouchableOpacity>

            {/* New Entry Button */}
            <TouchableOpacity
              onPress={handleNewEntry}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 70,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${theme.colors.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.md,
              }}>
                <FilePlus size={24} color={theme.colors.primary} strokeWidth={1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                  marginBottom: 2,
                }}>
                  New Entry
                </Text>
                <Text style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.2,
                }}>
                  Add work to journal
                </Text>
              </View>
            </TouchableOpacity>

            {/* Report Harvest Button */}
            <TouchableOpacity
              onPress={handleReportHarvest}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 70,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${theme.colors.warning}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.md,
              }}>
                <Wheat size={24} color={theme.colors.warning} strokeWidth={1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                  marginBottom: 2,
                }}>
                  Report Harvest
                </Text>
                <Text style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.2,
                }}>
                  Enter estimated quantity
                </Text>
              </View>
            </TouchableOpacity>

            {/* Vera Bag Button */}
            <TouchableOpacity
              onPress={handleVeraBag}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 70,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${theme.colors.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.md,
              }}>
                <ImageIcon size={24} color={theme.colors.primary} strokeWidth={1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                  marginBottom: 2,
                }}>
                  Vera Digital Bag
                </Text>
                <Text style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.2,
                }}>
                  Add visual evidence
                </Text>
              </View>
            </TouchableOpacity>

            {/* Vera Insights Button */}
            <TouchableOpacity
              onPress={handleVeraInsights}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 70,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${theme.colors.accent}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.md,
              }}>
                <TrendingUp size={24} color={theme.colors.accent} strokeWidth={1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                  marginBottom: 2,
                }}>
                  Vera Insights
                </Text>
                <Text style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.2,
                }}>
                  Market intelligence and recommendations
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Information Section */}
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
            marginBottom: theme.spacing.md,
          }}>
            Live Information
          </Text>

          <View style={{ gap: theme.spacing.sm }}>
            {/* Active Missions */}
            <TouchableOpacity
              onPress={handleViewMissions}
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
              <View style={{
                width: 40,
                height: 40,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${theme.colors.accent}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.sm,
              }}>
                <Truck size={20} color={theme.colors.accent} strokeWidth={1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                  marginBottom: 2,
                }}>
                  Active Missions
                </Text>
                <Text style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.2,
                }}>
                  {activeMissions.length === 0 
                    ? 'No active missions' 
                    : `${activeMissions.length} ${activeMissions.length === 1 ? 'mission' : 'missions'}`}
                </Text>
              </View>
              {activeMissions.length > 0 && (
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: theme.colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ 
                    color: theme.colors.background, 
                    fontSize: 10, 
                    fontWeight: '300' 
                  }}>
                    {activeMissions.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Active Batches */}
            <TouchableOpacity
              onPress={handleViewBatches}
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
              <View style={{
                width: 40,
                height: 40,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${theme.colors.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.sm,
              }}>
                <Package size={20} color={theme.colors.primary} strokeWidth={1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                  marginBottom: 2,
                }}>
                  Active Batches
                </Text>
                <Text style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.2,
                }}>
                  {activeBatches.length === 0 
                    ? 'No active batches' 
                    : `${activeBatches.length} ${activeBatches.length === 1 ? 'batch' : 'batches'}`}
                </Text>
              </View>
              {activeBatches.length > 0 && (
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ 
                    color: theme.colors.background, 
                    fontSize: 10, 
                    fontWeight: '300' 
                  }}>
                    {activeBatches.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              onPress={handleViewNotifications}
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
              <View style={{
                width: 40,
                height: 40,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${theme.colors.warning}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.sm,
              }}>
                <Bell size={20} color={theme.colors.warning} strokeWidth={1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                  marginBottom: 2,
                }}>
                  Notifications
                </Text>
                <Text style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.2,
                }}>
                  {unreadCount === 0 
                    ? 'All read' 
                    : `${unreadCount} ${unreadCount === 1 ? 'unread' : 'unread'}`}
                </Text>
              </View>
              {unreadCount > 0 && (
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: theme.colors.warning,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ 
                    color: theme.colors.background, 
                    fontSize: 10, 
                    fontWeight: '300' 
                  }}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Summary */}
        {financialData && (
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.md,
            }}>
              Financial Summary
            </Text>
            <TouchableOpacity
              onPress={handleViewWallet}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.sm,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
              }}
            >
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: theme.spacing.sm 
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: `${theme.colors.primary}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: theme.spacing.sm,
                  }}>
                    <Wallet size={20} color={theme.colors.primary} strokeWidth={1} />
                  </View>
                  <View>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: theme.colors.text.primary,
                      letterSpacing: 0.3,
                      marginBottom: 2,
                    }}>
                      Total Earned
                    </Text>
                    <Text style={{
                      fontSize: 9,
                      fontWeight: '300',
                      color: theme.colors.text.secondary,
                      letterSpacing: 0.2,
                    }}>
                      Available: {financialData.availableBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </Text>
                  </View>
                </View>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: theme.colors.primary,
                  letterSpacing: 0.3,
                }}>
                  {financialData.totalEarned.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </Text>
              </View>
              {financialData.pendingBalance > 0 && (
                <View style={{ 
                  paddingTop: theme.spacing.sm, 
                  borderTopWidth: 0.5, 
                  borderTopColor: 'rgba(0, 0, 0, 0.05)',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontSize: 9,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.2,
                  }}>
                    Pending
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.warning,
                    letterSpacing: 0.3,
                  }}>
                    {financialData.pendingBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </Text>
                </View>
              )}
              {financialData.nextPayout && (
                <View style={{ 
                  paddingTop: theme.spacing.xs,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Calendar size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                  <Text style={{
                    fontSize: 9,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    marginLeft: 4,
                    letterSpacing: 0.2,
                  }}>
                    Next payout: {new Date(financialData.nextPayout).toLocaleDateString('en-US')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Activity */}
        <View>
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
            marginBottom: theme.spacing.md,
          }}>
            Recent Activity
          </Text>
          {recentEntries.length === 0 ? (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.sm,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                textAlign: 'center',
                letterSpacing: 0.3,
              }}>
                No recent activity
              </Text>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {recentEntries.map((entry) => (
                <View
                  key={entry.id}
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
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: `${theme.colors.primary}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: theme.spacing.sm,
                  }}>
                    <FilePlus size={18} color={theme.colors.primary} strokeWidth={1} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: theme.colors.text.primary,
                      marginBottom: 2,
                      letterSpacing: 0.3,
                    }}>
                      {entry.type === 'SETVA' ? 'Planting' : 
                       entry.type === 'PRSKANJE' ? 'Spraying' : 
                       entry.type === 'BERBA' ? 'Harvest' : entry.type}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Calendar size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                        <Text style={{
                          fontSize: 9,
                          fontWeight: '300',
                          color: theme.colors.text.secondary,
                          marginLeft: 4,
                          letterSpacing: 0.2,
                        }}>
                          {new Date(entry.createdAt).toLocaleDateString('en-US')}
                        </Text>
                      </View>
                      {entry.data.location && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MapPin size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                          <Text style={{
                            fontSize: 9,
                            fontWeight: '300',
                            color: theme.colors.text.secondary,
                            marginLeft: 4,
                            letterSpacing: 0.2,
                          }}>
                            GPS
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
