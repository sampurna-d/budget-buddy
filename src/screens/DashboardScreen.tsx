import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../constants/theme';
import TransactionItem from '../components/TransactionItem';

// Temporary mock data
const mockTransactions = [
  {
    id: '1',
    type: 'expense',
    amount: 65.20,
    category: 'Shopping',
    date: new Date(),
    description: 'Walmart',
  },
  {
    id: '2',
    type: 'expense',
    amount: 1200.00,
    category: 'Housing',
    date: new Date(Date.now() - 86400000), // Yesterday
    description: 'Rent',
  },
];

const QuickAction = ({ 
  icon, 
  label, 
  onPress 
}: { 
  icon: keyof typeof MaterialCommunityIcons.glyphMap; 
  label: string; 
  onPress: () => void 
}) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={styles.quickActionIcon}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const DashboardScreen = () => {
  const handleQuickAction = (action: string) => {
    // TODO: Implement quick actions
    console.log(`Quick action: ${action}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>
      
      {/* Balance Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Balance</Text>
        <Text style={styles.balanceAmount}>$3,250.00</Text>
      </View>

      {/* Budget Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Budget</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '70%' }]} />
        </View>
        <Text style={styles.progressText}>$2,100 / $3,000</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <QuickAction
            icon="plus-circle-outline"
            label="Add"
            onPress={() => handleQuickAction('add')}
          />
          <QuickAction
            icon="chart-box-outline"
            label="Budget"
            onPress={() => handleQuickAction('budget')}
          />
          <QuickAction
            icon="bell-outline"
            label="Bills"
            onPress={() => handleQuickAction('bills')}
          />
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Transactions</Text>
        <View style={styles.transactionsList}>
          {mockTransactions.map(transaction => (
            <TransactionItem
              key={transaction.id}
              {...transaction}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.textLight,
  },
  card: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: typography.sizes.xxxl,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    marginVertical: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    ...shadows.xs,
  },
  quickActionLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textDark,
    fontWeight: '500',
  },
  transactionsList: {
    marginTop: spacing.sm,
  },
});

export default DashboardScreen; 