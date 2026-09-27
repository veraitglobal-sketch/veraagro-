import { walletTransactionView, type WalletTransactionResponse } from '../lib/wallet-transaction';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import api from '../lib/api';
import { AppState } from 'react-native';
import { isLikelyNetworkError } from '../lib/api-error';
import { fetchGrowerOrdersFinancial, type OrdersFinancialSnapshot } from '../features/grower/dashboard/fetchGrowerOrdersFinancial';

export interface WalletData {
  id: string;
  availableBalance: number;
  totalEarned: number;
  pendingBalance: number;
}

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  sourceType?: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  orderId?: string;
}

type WalletContextValue = {
  wallet: WalletData | null;
  transactions: Transaction[];
  ordersFinancial: OrdersFinancialSnapshot | null;
  loading: boolean;
  loadError: boolean;
  reload: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ordersFinancial, setOrdersFinancial] = useState<OrdersFinancialSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const mountedRef = useRef(true);
  const requestGenRef = useRef(0);
  const hasWalletRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadWalletData = useCallback(async (opts?: { background?: boolean }) => {
    const background = opts?.background === true;
    const gen = ++requestGenRef.current;
    if (!background) {
      setLoading(true);
      setLoadError(false);
    }
    try {
      const [walletResponse, transactionsResponse, ordersFin] = await Promise.all([
        api.get<WalletData>('/wallets/me'),
        api.get<WalletTransactionResponse[]>('/wallets/me/transactions'),
        fetchGrowerOrdersFinancial(),
      ]);
      if (!mountedRef.current || gen !== requestGenRef.current) return;
      setWallet(walletResponse.data);
      hasWalletRef.current = true;
      setTransactions(Array.isArray(transactionsResponse.data) ? transactionsResponse.data.map(walletTransactionView) : []);
      setOrdersFinancial(ordersFin);
      setLoadError(false);
    } catch (error) {
      if (!mountedRef.current || gen !== requestGenRef.current) return;
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, wallet data skipped');
      } else {
        console.error('Error loading wallet:', error);
      }
      setLoadError(true);
    } finally {
      if (!mountedRef.current || gen !== requestGenRef.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWalletData();
  }, [loadWalletData]);

  const reload = useCallback(async () => {
    await loadWalletData({ background: hasWalletRef.current });
  }, [loadWalletData]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void reload();
    });
    return () => subscription.remove();
  }, [reload]);

  const value = useMemo(
    () => ({ wallet, transactions, ordersFinancial, loading, loadError, reload }),
    [wallet, transactions, ordersFinancial, loading, loadError, reload],
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return ctx;
}
