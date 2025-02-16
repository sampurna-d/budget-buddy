import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import EditBudgetModal from '../components/EditBudgetModal';

interface BudgetCategory {
  id: string;
  category: string;
  amount: number;
  spent: number;
  month: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const defaultCategories: Omit<BudgetCategory, 'id' | 'month'>[] = [
  { category: 'Housing', amount: 0, spent: 0, icon: 'home' },
  { category: 'Food', amount: 0, spent: 0, icon: 'food' },
  { category: 'Transportation', amount: 0, spent: 0, icon: 'car' },
  { category: 'Utilities', amount: 0, spent: 0, icon: 'lightning-bolt' },
  { category: 'Entertainment', amount: 0, spent: 0, icon: 'movie' },
  { category: 'Shopping', amount: 0, spent: 0, icon: 'cart' },
  { category: 'Healthcare', amount: 0, spent: 0, icon: 'medical-bag' },
  { category: 'Other', amount: 0, spent: 0, icon: 'dots-horizontal' },
];

const BudgetScreen = () => {
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const { user } = useAuth();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user?.id)
        .eq('month', currentMonth + '-01');

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedBudgets = data.map(budget => ({
          ...budget,
          icon: defaultCategories.find(cat => cat.category === budget.category)?.icon || 'dots-horizontal'
        }));
        setBudgets(formattedBudgets);
      } else {
        // Create initial budgets for each category
        const { data: newBudgets, error: insertError } = await supabase
          .from('budgets')
          .insert(
            defaultCategories.map(cat => ({
              user_id: user?.id,
              category: cat.category,
              amount: 0,
              spent: 0,
              month: currentMonth + '-01'
            }))
          )
          .select();

        if (insertError) throw insertError;

        if (newBudgets) {
          const formattedBudgets = newBudgets.map(budget => ({
            ...budget,
            icon: defaultCategories.find(cat => cat.category === budget.category)?.icon || 'dots-horizontal'
          }));
          setBudgets(formattedBudgets);
        }
      }
    } catch (error: any) {
      console.error('Fetch budgets error:', error);
      Alert.alert('Error', 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (spent: number, amount: number) => {
    if (amount === 0) return 0;
    return Math.min((spent / amount) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return colors.error;
    if (progress >= 80) return colors.warning;
    return colors.secondary;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleEditBudget = (category: BudgetCategory) => {
    setSelectedCategory(category);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Budget</Text>
        <Text style={styles.subtitle}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalTitle}>Total Budget</Text>
        <Text style={styles.totalAmount}>
          {formatCurrency(budgets.reduce((sum, budget) => sum + budget.amount, 0))}
        </Text>
        <Text style={styles.totalSpent}>
          Spent: {formatCurrency(budgets.reduce((sum, budget) => sum + budget.spent, 0))}
        </Text>
      </View>

      <View style={styles.categoriesContainer}>
        {budgets.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => handleEditBudget(category)}
          >
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIcon}>
                <MaterialCommunityIcons
                  name={category.icon}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.category}</Text>
                <Text style={styles.categoryAmount}>
                  {formatCurrency(category.spent)} / {formatCurrency(category.amount)}
                </Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${calculateProgress(category.spent, category.amount)}%`,
                      backgroundColor: getProgressColor(calculateProgress(category.spent, category.amount))
                    }
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {selectedCategory && (
        <EditBudgetModal
          visible={!!selectedCategory}
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          onUpdate={fetchBudgets}
          userId={user?.id || ''}
        />
      )}
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
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.gray[300],
    marginTop: spacing.xs,
  },
  totalCard: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    elevation: 2,
  },
  totalTitle: {
    fontSize: typography.sizes.md,
    color: colors.gray[600],
  },
  totalAmount: {
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  totalSpent: {
    fontSize: typography.sizes.md,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  categoriesContainer: {
    padding: spacing.md,
  },
  categoryCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textDark,
  },
  categoryAmount: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: 2,
  },
  progressContainer: {
    height: 24,
    justifyContent: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default BudgetScreen; 