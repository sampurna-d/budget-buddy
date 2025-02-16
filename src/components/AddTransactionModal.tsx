import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';
import { supabase } from '../config/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
  userId: string;
}

const categories = [
  { name: 'Housing', icon: 'home' },
  { name: 'Food', icon: 'food' },
  { name: 'Transportation', icon: 'car' },
  { name: 'Utilities', icon: 'lightning-bolt' },
  { name: 'Entertainment', icon: 'movie' },
  { name: 'Shopping', icon: 'cart' },
  { name: 'Healthcare', icon: 'medical-bag' },
  { name: 'Other', icon: 'dots-horizontal' },
] as const;

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  onAdd,
  userId,
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState<Date | null>(null);

  const handleAmountChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    const parts = cleanedText.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleanedText);
  };

  const handleSave = async () => {
    if (!amount || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: numAmount,
          type,
          category,
          description: description.trim() || category,
          date: new Date().toISOString(),
        });

      if (error) throw error;

      // If it's an expense, update the budget spent amount
      if (type === 'expense') {
        const { error: budgetError } = await supabase.rpc('update_budget_spent', {
          p_user_id: userId,
          p_category: category,
          p_amount: numAmount,
        });

        if (budgetError) throw budgetError;
      }

      onAdd();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Save transaction error:', error);
      Alert.alert('Error', error.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('');
    setType('expense');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Transaction</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.gray[600]}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'expense' && styles.typeButtonActive,
                ]}
                onPress={() => setType('expense')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'expense' && styles.typeButtonTextActive,
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'income' && styles.typeButtonActive,
                ]}
                onPress={() => setType('income')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'income' && styles.typeButtonTextActive,
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              editable={!loading}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              editable={!loading}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryButton,
                    category === cat.name && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat.name)}
                >
                  <MaterialCommunityIcons
                    name={cat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color={
                      category === cat.name ? colors.primary : colors.gray[600]
                    }
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat.name && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
              />
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Adding...' : 'Add Transaction'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.textDark,
  },
  form: {
    padding: spacing.lg,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeButtonActive: {
    backgroundColor: colors.backgroundLight,
    ...Platform.select({
      ios: {
        shadowColor: colors.gray[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  typeButtonText: {
    color: colors.gray[600],
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: colors.primary,
  },
  label: {
    fontSize: typography.sizes.md,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: 8,
    fontSize: typography.sizes.md,
    marginBottom: spacing.lg,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  categoryButton: {
    width: '25%',
    padding: spacing.xs,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryButtonActive: {
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  categoryButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  categoryButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.textLight,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
});

export default AddTransactionModal; 