import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Platform } from 'react-native';
import { Transaction } from '../types/transaction';
import { BudgetCategory, mapPlaidToBudgetCategory } from '../constants/categories';
import { AIService } from '../services/aiService';

const TRANSACTIONS_PER_PAGE = 20;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface TransactionCache {
  data: Transaction[];
  timestamp: number;
}

let transactionCache: TransactionCache | null = null;

interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  type?: 'income' | 'expense';
  institution?: string;
  category?: string;
}

interface PlaidAccount {
  id: string;
  name: string;
  plaid_items: {
    institution_name: string;
  };
}

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  category: string[];
}

interface ManualTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { user } = useAuth();

  const clearCache = useCallback(() => {
    transactionCache = null;
  }, []);

  const fetchTransactions = useCallback(async (refresh: boolean = false) => {
    if (!user) return;

    if (refresh) {
      setPage(1);
      clearCache();
    }

    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check cache for first page
      if (page === 1 && transactionCache && !refresh) {
        const now = Date.now();
        if (now - transactionCache.timestamp < CACHE_DURATION) {
          setTransactions(transactionCache.data);
          setIsLoading(false);
          return;
        }
      }

      // Calculate offset
      const offset = (page - 1) * TRANSACTIONS_PER_PAGE;

      // 1. Fetch manual transactions with pagination
      const { data: manualTransactions, error: manualError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(offset, offset + TRANSACTIONS_PER_PAGE - 1);

      if (manualError) throw manualError;

      // 2. Fetch Plaid transactions with pagination
      const SERVER_URL = Platform.select({
        android: 'http://10.0.2.2:3000',
        ios: 'http://127.0.0.1:3000',
        default: 'http://localhost:3000'
      });

      const response = await fetch(`${SERVER_URL}/api/plaid/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          offset,
          limit: TRANSACTIONS_PER_PAGE,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Plaid transactions');
      }

      const data = await response.json();
      
      // 3. Process and merge transactions
      const processedTransactions: Transaction[] = [];

      // Process Plaid transactions in parallel
      const plaidTransactionsPromises = data.transactions.map(async (transaction: any) => {
        let category: BudgetCategory;
        try {
          category = await AIService.categorizeTransaction({
            description: transaction.name,
            amount: transaction.amount,
            date: transaction.date
          });
        } catch {
          category = 'Other';
        }

        return {
          id: transaction.transaction_id,
          description: transaction.name,
          amount: Math.abs(transaction.amount),
          date: transaction.date,
          category,
          type: transaction.amount < 0 ? 'expense' : 'income',
          institution_name: transaction.institution_name || 'Unknown Bank',
          account_name: transaction.account_name || 'Unknown Account',
          is_plaid: true
        };
      });

      const plaidTransactions = await Promise.all(plaidTransactionsPromises);
      processedTransactions.push(...plaidTransactions);

      // Process manual transactions
      if (manualTransactions) {
        processedTransactions.push(...manualTransactions.map(t => ({
          ...t,
          is_plaid: false
        })));
      }

      // Sort by date (most recent first)
      processedTransactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Update cache if this is the first page
      if (page === 1) {
        transactionCache = {
          data: processedTransactions,
          timestamp: Date.now()
        };
      }

      setTransactions(prev => 
        page === 1 ? processedTransactions : [...prev, ...processedTransactions]
      );
      setHasMore(processedTransactions.length === TRANSACTIONS_PER_PAGE);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, [user, page, isLoading]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  return {
    transactions,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh: () => fetchTransactions(true),
    clearCache,
    fetchTransactions
  };
}; 