import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.178.27:3000';

export interface WalletData {
  id: string;
  availableBalance: number;
  totalEarned: number;
  pendingBalance: number;
}

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  orderId?: string;
}

export function useWalletData() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');

      const walletResponse = await axios.get(`${API_URL}/wallets/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWallet(walletResponse.data);

      const transactionsResponse = await axios.get(
        `${API_URL}/wallets/me/transactions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions(
        Array.isArray(transactionsResponse.data) ? transactionsResponse.data : []
      );
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  return { wallet, transactions, loading, reload: loadWalletData };
}
