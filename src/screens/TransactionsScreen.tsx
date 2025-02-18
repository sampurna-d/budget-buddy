import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';
import { useTransactions } from '../hooks/useTransactions';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Transaction } from '../types/transaction';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatAmount = (amount: number) => {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
};

const getTransactionIcon = (category: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const iconMap: { [key: string]: keyof typeof MaterialCommunityIcons.glyphMap } = {
    'Food': 'food',
    'Transportation': 'car',
    'Housing': 'home',
    'Entertainment': 'movie',
    'Other': 'cash'
  };

  return iconMap[category] || 'cash';
};

const TransactionsScreen = () => {
  const { 
    transactions, 
    isLoading, 
    error, 
    hasMore, 
    loadMore,
    refresh 
  } = useTransactions();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const filteredTransactions = transactions.filter(t => 
    selectedType === 'all' || t.type === selectedType
  );

  const renderTransactionItem: ListRenderItem<Transaction> = useCallback(({ item: transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionIcon}>
        <MaterialCommunityIcons 
          name={getTransactionIcon(transaction.category || 'Other')}
          size={24}
          color={colors.primary}
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionName}>
          {transaction.description}
        </Text>
        <Text style={styles.transactionMeta}>
          {transaction.institution_name || 'Manual'} • {transaction.category}
        </Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        transaction.type === 'income' 
          ? styles.incomeAmount 
          : styles.expenseAmount
      ]}>
        {transaction.type === 'income' ? '+' : '-'}
        {formatAmount(transaction.amount)}
      </Text>
    </View>
  ), []);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={48} 
          color={colors.error} 
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={onRefresh}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            selectedType === 'all' && styles.filterButtonActive
          ]}
          onPress={() => setSelectedType('all')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedType === 'all' && styles.filterButtonTextActive
          ]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            selectedType === 'income' && styles.filterButtonActive
          ]}
          onPress={() => setSelectedType('income')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedType === 'income' && styles.filterButtonTextActive
          ]}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            selectedType === 'expense' && styles.filterButtonActive
          ]}
          onPress={() => setSelectedType('expense')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedType === 'expense' && styles.filterButtonTextActive
          ]}>Expenses</Text>
        </TouchableOpacity>
      </View>

      <FlashList
        data={filteredTransactions}
        renderItem={renderTransactionItem}
        estimatedItemSize={80}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : (
            <View style={styles.centerContainer}>
              <MaterialCommunityIcons 
                name="cash-remove" 
                size={48} 
                color={colors.gray[400]} 
              />
              <Text style={styles.noTransactionsText}>No transactions found</Text>
            </View>
          )
        }
        ListFooterComponent={
          hasMore && !refreshing ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    color: colors.gray[600],
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  dateGroup: {
    marginBottom: spacing.md,
  },
  dateHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.gray[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[100],
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  transactionName: {
    fontSize: typography.sizes.md,
    fontWeight: '500',
    color: colors.textDark,
  },
  transactionMeta: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
  incomeAmount: {
    color: colors.success,
  },
  expenseAmount: {
    color: colors.error,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.gray[600],
    fontSize: typography.sizes.md,
  },
  noTransactionsText: {
    marginTop: spacing.md,
    color: colors.gray[600],
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.error,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.textLight,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});

export default TransactionsScreen; 