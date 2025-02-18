import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';
import { BUDGET_CATEGORIES, getCategoryColor, BudgetCategory } from '../constants/categories';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import EditBudgetModal from '../components/EditBudgetModal';
import { AIService } from '../services/aiService';
import { NotificationService } from '../services/notificationService';
import { Budget } from '../types/budget';

const getCategoryIcon = (category: BudgetCategory): keyof typeof MaterialCommunityIcons.glyphMap => {
  const iconMap: { [key in BudgetCategory]: keyof typeof MaterialCommunityIcons.glyphMap } = {
    'Food': 'food',
    'Transportation': 'car',
    'Housing': 'home',
    'Entertainment': 'movie',
    'Other': 'dots-horizontal'
  };
  return iconMap[category];
};

const BudgetScreen = () => {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAmounts, setShowAmounts] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchBudgets();
    initializeNotifications();
  }, [user]);

  useEffect(() => {
    if (transactions.length > 0 && budgets.length > 0) {
      scheduleNotifications();
    }
  }, [transactions, budgets]);

  const initializeNotifications = async () => {
    try {
      const initialized = await NotificationService.initialize();
      if (!initialized) {
        Alert.alert(
          'Notifications Disabled',
          'Enable notifications to receive personalized budget insights and tips.'
        );
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const scheduleNotifications = async () => {
    try {
      await NotificationService.scheduleRandomNotifications(transactions, budgets);
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const fetchBudgets = async () => {
    if (!user) return;

    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', firstDayOfMonth.toISOString());

      if (budgetError) throw budgetError;

      // Initialize budgets for all categories
      const initializedBudgets = BUDGET_CATEGORIES.map(category => {
        const existingBudget = budgetData?.find(b => b.category === category);
        return {
          category,
          amount: existingBudget?.amount || 0,
          spent: existingBudget?.spent || 0
        };
      });

      setBudgets(initializedBudgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const toggleAmountVisibility = (category: string) => {
    setShowAmounts(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Calculate total budget and spent amounts
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalPercentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const renderBudgetItem = (budget: Budget) => {
    const percentSpent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
    const progressColor = getCategoryColor(percentSpent);
    const icon = getCategoryIcon(budget.category);

    return (
      <Pressable
        key={budget.category}
        style={styles.budgetItem}
        onPress={() => toggleAmountVisibility(budget.category)}
      >
        <View style={styles.budgetHeader}>
          <View style={styles.categoryContainer}>
            <MaterialCommunityIcons 
              name={icon} 
              size={24} 
              color={colors.primary} 
              style={styles.categoryIcon}
            />
            <Text style={styles.categoryText}>{budget.category}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar,
              { width: `${Math.min(percentSpent, 100)}%`, backgroundColor: progressColor }
            ]}
          />
        </View>

        {showAmounts[budget.category] && (
          <View style={styles.amountDetails}>
            <Text style={styles.amountText}>
              Budget: ${budget.amount.toFixed(2)}
            </Text>
            <Text style={styles.amountText}>
              Remaining: ${(budget.amount - budget.spent).toFixed(2)}
            </Text>
            <Text style={styles.percentageText}>
              {percentSpent.toFixed(1)}% spent
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Budget</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setShowEditModal(true)}
        >
          <MaterialCommunityIcons name="pencil" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Total Budget Indicator */}
      <View style={styles.totalBudgetContainer}>
        <View style={styles.batteryContainer}>
          <View style={[styles.batteryLevel, { width: `${Math.min(totalPercentSpent, 100)}%` }]} />
        </View>
        <Text style={styles.totalBudgetText}>
          ${(totalBudget - totalSpent).toFixed(2)} remaining of ${totalBudget.toFixed(2)}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {budgets.map(renderBudgetItem)}
      </ScrollView>

      <EditBudgetModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        budgets={budgets}
        onSave={async (updatedBudgets) => {
          await fetchBudgets();
          setShowEditModal(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.textDark,
  },
  editButton: {
    padding: spacing.sm,
  },
  totalBudgetContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  batteryContainer: {
    width: '80%',
    height: 24,
    backgroundColor: colors.gray[200],
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  batteryLevel: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  totalBudgetText: {
    fontSize: typography.sizes.md,
    color: colors.textDark,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  budgetItem: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.gray[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: spacing.sm,
  },
  categoryText: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.textDark,
  },
  progressContainer: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  amountDetails: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  amountText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  percentageText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textDark,
  },
});

export default BudgetScreen; 