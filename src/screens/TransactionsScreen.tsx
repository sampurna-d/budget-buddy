import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import TransactionItem from '../components/TransactionItem';
import AddTransactionModal from '../components/AddTransactionModal';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  description: string;
  date: string;
}

const TransactionsScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error: any) {
      console.error('Fetch transactions error:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = () => {
    setShowAddModal(true);
  };

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });

    return groups;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddTransaction}
        >
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={colors.textLight}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {Object.entries(groupedTransactions).map(([date, transactions]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{date}</Text>
            {transactions.map(transaction => (
              <TransactionItem
                key={transaction.id}
                type={transaction.type}
                amount={transaction.amount}
                category={transaction.category}
                date={new Date(transaction.date)}
                description={transaction.description}
              />
            ))}
          </View>
        ))}

        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="currency-usd-off"
              size={48}
              color={colors.gray[400]}
            />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={handleAddTransaction}
            >
              <Text style={styles.emptyStateButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AddTransactionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={fetchTransactions}
        userId={user?.id || ''}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.textLight,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: typography.sizes.lg,
    color: colors.gray[600],
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: colors.textLight,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
});

export default TransactionsScreen; 