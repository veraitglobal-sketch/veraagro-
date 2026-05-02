import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../lib/api-url';
import { fetchGrowerOrdersFinancial, type OrdersFinancialSnapshot } from '../dashboard/fetchGrowerOrdersFinancial';

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
  const [ordersFinancial, setOrdersFinancial] = useState<OrdersFinancialSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');

      const [walletResponse, transactionsResponse, ordersFin] = await Promise.all([
        axios.get(`${API_URL}/wallets/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/wallets/me/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchGrowerOrdersFinancial(),
      ]);
      setWallet(walletResponse.data);

      setTransactions(
        Array.isArray(transactionsResponse.data) ? transactionsResponse.data : [],
      );
      setOrdersFinancial(ordersFin);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  return { wallet, transactions, ordersFinancial, loading, reload: loadWalletData };
}
