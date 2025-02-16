import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';
import { supabase } from '../config/supabase';

interface EditBudgetModalProps {
  visible: boolean;
  category: {
    id: string;
    category: string;
    amount: number;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    month: string;
  };
  onClose: () => void;
  onUpdate: () => void;
  userId: string;
}

const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  visible,
  category,
  onClose,
  onUpdate,
  userId,
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category.amount > 0) {
      setAmount(category.amount.toString());
    } else {
      setAmount('');
    }
  }, [category]);

  const handleAmountChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    const parts = cleanedText.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleanedText);
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount || '0');
    if (isNaN(numAmount) || numAmount < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('budgets')
        .upsert({
          user_id: userId,
          category: category.category,
          amount: numAmount,
          month: category.month,
        }, {
          onConflict: 'user_id,category,month'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to update budget');
    } finally {
      setLoading(false);
    }
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
            <MaterialCommunityIcons
              name={category.icon}
              size={24}
              color={colors.primary}
            />
            <Text style={styles.title}>{category.category}</Text>
          </View>

          <Text style={styles.label}>Monthly Budget Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            placeholder="Enter amount"
            editable={!loading}
            autoFocus
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {loading ? 'Saving...' : 'Save'}
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
    padding: spacing.lg,
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.textDark,
    marginLeft: spacing.md,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
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