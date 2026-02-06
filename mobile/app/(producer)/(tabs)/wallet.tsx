import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useAuth } from '../../../hooks/useAuth';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.178.27:3000';

interface WalletData {
  id: string;
  availableBalance: number;
  totalEarned: number;
  pendingBalance: number;
}

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  orderId?: string;
}

/**
 * Wallet Screen
 * Shows farmer's balance and transaction history
 * Matches buyer dashboard styling
 */
export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      
      // Load wallet
      const walletResponse = await axios.get(`${API_URL}/wallets/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWallet(walletResponse.data);

      // Load transactions
      const transactionsResponse = await axios.get(`${API_URL}/wallets/me/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(Array.isArray(transactionsResponse.data) ? transactionsResponse.data : []);
    } catch (error: any) {
      console.error('Error loading wallet:', error);
      // If wallet doesn't exist, show empty state
      if (error.response?.status !== 404) {
        // Show error only if it's not a 404
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: 60,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{ marginRight: theme.spacing.md }}
          >
            <ArrowLeft size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 18,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
          }}>
            Wallet
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: theme.spacing.lg }}>
          {/* Balance Card */}
          <View style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            marginBottom: theme.spacing.lg,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.05)',
            ...theme.shadows.md,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <Wallet size={24} color={theme.colors.text.inverse} strokeWidth={1.5} />
              <Text style={{
                fontSize: 12,
                fontWeight: '300',
                color: 'rgba(255, 255, 255, 0.9)',
                marginLeft: theme.spacing.sm,
                letterSpacing: 0.5,
              }}>
                Available Balance
              </Text>
            </View>
            <Text style={{
              fontSize: 36,
              fontWeight: '300',
              color: theme.colors.text.inverse,
              letterSpacing: 1,
              marginBottom: theme.spacing.xs,
            }}>
              {wallet?.availableBalance 
                ? wallet.availableBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                : '0,00 €'}
            </Text>
            {wallet && wallet.pendingBalance > 0 && (
              <Text style={{
                fontSize: 11,
                fontWeight: '300',
                color: 'rgba(255, 255, 255, 0.8)',
                letterSpacing: 0.3,
              }}>
                Pending: {wallet.pendingBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </Text>
            )}
          </View>

          {/* Total Earned */}
          {wallet && (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.3,
                }}>
                  Total Earned
                </Text>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  {wallet.totalEarned.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </Text>
              </View>
            </View>
          )}

          {/* Transactions */}
          <View>
            <Text style={{
              fontSize: 11,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.md,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
            }}>
              Transactions
            </Text>

            {transactions.length === 0 ? (
              <View style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.xl,
                alignItems: 'center',
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.3,
                }}>
                  No Transactions
                </Text>
              </View>
            ) : (
              <View style={{ gap: theme.spacing.sm }}>
                {transactions.map((transaction) => (
                  <View
                    key={transaction.id}
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      borderWidth: 0.5,
                      borderColor: 'rgba(0, 0, 0, 0.05)',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: transaction.type === 'CREDIT' 
                        ? `${theme.colors.success}15` 
                        : `${theme.colors.error}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing.md,
                    }}>
                      {transaction.type === 'CREDIT' ? (
                        <ArrowDownLeft size={20} color={theme.colors.success} strokeWidth={1.5} />
                      ) : (
                        <ArrowUpRight size={20} color={theme.colors.error} strokeWidth={1.5} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.xs,
                        letterSpacing: 0.3,
                      }}>
                        {transaction.description}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Calendar size={12} color={theme.colors.text.secondary} strokeWidth={1} />
                        <Text style={{
                          fontSize: 9,
                          fontWeight: '300',
                          color: theme.colors.text.secondary,
                          letterSpacing: 0.2,
                        }}>
                          {new Date(transaction.createdAt).toLocaleDateString('en-US')}
                        </Text>
                      </View>
                    </View>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '300',
                      color: transaction.type === 'CREDIT' ? theme.colors.success : theme.colors.error,
                      letterSpacing: 0.3,
                    }}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}
                      {transaction.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
