import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BudgetCategory, BUDGET_CATEGORIES } from '../constants/categories';

interface Budget {
  category: BudgetCategory;
  amount: number;
  spent: number;
}

interface EditBudgetModalProps {
  visible: boolean;
  budgets: Budget[];
  onClose: () => void;
  onSave: (updatedBudgets: Budget[]) => Promise<void>;
}

const EditBudgetModal = ({
  visible,
  budgets,
  onClose,
  onSave,
}: EditBudgetModalProps) => {
  const { user } = useAuth();
  const [amounts, setAmounts] = useState<{ [key in BudgetCategory]?: string }>(
    budgets.reduce((acc, budget) => ({
      ...acc,
      [budget.category]: budget.amount.toString()
    }), {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAmountChange = (category: BudgetCategory, value: string) => {
    setAmounts(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate all amounts
    const updatedBudgets: Budget[] = [];
    for (const budget of budgets) {
      const numAmount = parseFloat(amounts[budget.category] || '0');
      if (isNaN(numAmount) || numAmount < 0) {
        Alert.alert('Invalid Amount', `Please enter a valid amount for ${budget.category}`);
        return;
      }
      updatedBudgets.push({
        ...budget,
        amount: numAmount
      });
    }

    setIsSubmitting(true);
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ).toISOString();

      // Update all budgets in a single batch
      const updates = updatedBudgets.map(budget => ({
        user_id: user.id,
        category: budget.category,
        amount: budget.amount,
        month: firstDayOfMonth,
        spent: budget.spent
      }));

      const { error } = await supabase
        .from('budgets')
        .upsert(updates, {
          onConflict: 'user_id,category,month'
        });

      if (error) throw error;
      await onSave(updatedBudgets);
    } catch (error) {
      console.error('Error saving budgets:', error);
      Alert.alert('Error', 'Failed to save budgets');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Edit Monthly Budgets</Text>
          
          <ScrollView style={styles.scrollView}>
            {budgets.map(budget => (
              <View key={budget.category} style={styles.budgetItem}>
                <View style={styles.categoryHeader}>
                  <MaterialCommunityIcons 
                    name={getCategoryIcon(budget.category)} 
                    size={24} 
                    color={colors.primary} 
                  />
                  <Text style={styles.category}>{budget.category}</Text>
                </View>

                <View style={styles.amountInput}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={amounts[budget.category]}
                    onChangeText={(value) => handleAmountChange(budget.category, value)}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {isSubmitting ? 'Saving...' : 'Save All'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  scrollView: {
    marginBottom: spacing.lg,
  },
  budgetItem: {
    marginBottom: spacing.lg,
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  category: {
    fontSize: typography.sizes.lg,
    color: colors.textDark,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundLight,
  },
  currencySymbol: {
    fontSize: typography.sizes.lg,
    color: colors.gray[600],
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.lg,
    color: colors.textDark,
    padding: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textDark,
  },
  saveButtonText: {
    color: colors.textLight,
  },
});

export default EditBudgetModal; 