import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../constants/theme';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import AddTransactionModal from '../components/AddTransactionModal';
import AddBillReminderModal from '../components/AddBillReminderModal';
import { LinkedAccountsModal } from '../components/LinkedAccountsModal';
import SettingsDropdown from '../components/SettingsDropdown';
import { usePlaidLink } from '../hooks/usePlaidLink';
import { useTransactions } from '../hooks/useTransactions';

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const { linkToken, generateLinkToken, exchangePublicToken } = usePlaidLink();
  const { transactions, isLoading: transactionsLoading, fetchTransactions } = useTransactions();
  const [refreshing, setRefreshing] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddBillReminder, setShowAddBillReminder] = useState(false);
  const [showLinkedAccounts, setShowLinkedAccounts] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  // Calculate total balance from transactions
  useEffect(() => {
    const balance = transactions.reduce((acc, curr) => {
      return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
    }, 0);
    setTotalBalance(balance);
  }, [transactions]);

  // Fetch transactions
  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Settings */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={() => setShowSettingsDropdown(!showSettingsDropdown)}>
          <MaterialCommunityIcons name="cog" size={24} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            ${totalBalance.toFixed(2)}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowAddTransaction(true)}
          >
            <MaterialCommunityIcons
              name="plus-circle"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.actionText}>Add Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowAddBillReminder(true)}
          >
            <MaterialCommunityIcons
              name="bell-plus"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.actionText}>Add Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Budget')}
          >
            <MaterialCommunityIcons
              name="chart-pie"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.actionText}>View Budget</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length > 0 ? (
            transactions.slice(0, 5).map((transaction) => (
              <View key={transaction.id} style={styles.transaction}>
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionTitle}>{transaction.description}</Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.institution_name} • {transaction.category}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'income' ? colors.success : colors.error },
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent transactions</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              generateLinkToken();
              setShowLinkedAccounts(true);
            }}
          >
            <MaterialCommunityIcons 
              name="plus-circle" 
              size={24} 
              color={colors.textLight} 
            />
            <Text style={styles.addButtonText}>Link New Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <AddTransactionModal
        visible={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onAdd={() => {
          setShowAddTransaction(false);
          fetchTransactions();
        }}
        userId={user?.id || ''}
      />

      <AddBillReminderModal
        visible={showAddBillReminder}
        onClose={() => setShowAddBillReminder(false)}
        onAdd={() => {
          setShowAddBillReminder(false);
          fetchTransactions();
        }}
        userId={user?.id || ''}
      />

      <LinkedAccountsModal
        visible={showLinkedAccounts}
        onClose={() => setShowLinkedAccounts(false)}
        linkToken={linkToken}
        generateLinkToken={generateLinkToken}
        exchangePublicToken={exchangePublicToken}
        onSuccess={(publicToken) => {
          console.log('Got public token:', publicToken);
          fetchTransactions();
        }}
      />

      {showSettingsDropdown && (
        <SettingsDropdown
          onLinkBank={() => { 
            setShowSettingsDropdown(false);
            navigation.navigate('LinkAccountsScreen');
          }}
          onSystemSettings={() => { 
            setShowSettingsDropdown(false);
            navigation.navigate('SystemSettingsScreen');
          }}
          onLogout={() => { 
            setShowSettingsDropdown(false);
            handleLogout();
          }}
          onClose={() => setShowSettingsDropdown(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.textDark,
  },
  balanceCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: typography.sizes.md,
    color: colors.textLight,
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.lg,
    backgroundColor: colors.backgroundLight,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.textDark,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  transactionLeft: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: typography.sizes.md,
    color: colors.textDark,
    fontWeight: '500',
  },
  transactionCategory: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  transactionAmount: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray[600],
    fontSize: typography.sizes.md,
    marginTop: spacing.lg,
  },
  buttonContainer: {
    padding: spacing.lg,
    backgroundColor: colors.backgroundLight,
  },
  addButton: {
    alignItems: 'center',
  },
  addButtonText: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.textDark,
  },
});

export default DashboardScreen; 