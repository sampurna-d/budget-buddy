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
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';
import { supabase } from '../config/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AddBillReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
  userId: string;
}

const AddBillReminderModal: React.FC<AddBillReminderModalProps> = ({
  visible,
  onClose,
  onAdd,
  userId,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurringPeriod, setRecurringPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const handleAmountChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    const parts = cleanedText.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleanedText);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleSave = async () => {
    if (!title || !amount) {
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
        .from('bill_reminders')
        .insert({
          user_id: userId,
          title: title.trim(),
          amount: numAmount,
          due_date: dueDate.toISOString().split('T')[0],
          recurring,
          recurring_period: recurring ? recurringPeriod : null,
          paid: false,
        });

      if (error) throw error;

      onAdd();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Save reminder error:', error);
      Alert.alert('Error', error.message || 'Failed to add bill reminder');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDueDate(new Date());
    setRecurring(false);
    setRecurringPeriod('monthly');
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
            <Text style={styles.title}>Add Bill Reminder</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.gray[600]}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter bill title"
              editable={!loading}
            />

            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              editable={!loading}
            />

            <Text style={styles.label}>Due Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {dueDate.toLocaleDateString()}
              </Text>
              <MaterialCommunityIcons
                name="calendar"
                size={24}
                color={colors.gray[600]}
              />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDueDate(selectedDate);
                  }
                }}
              />
            )}

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Recurring Bill</Text>
              <Switch
                value={recurring}
                onValueChange={setRecurring}
                trackColor={{ false: colors.gray[300], true: colors.primary }}
              />
            </View>

            {recurring && (
              <View style={styles.periodButtons}>
                {(['weekly', 'monthly', 'yearly'] as const).map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodButton,
                      recurringPeriod === period && styles.periodButtonActive,
                    ]}
                    onPress={() => setRecurringPeriod(period)}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        recurringPeriod === period && styles.periodButtonTextActive,
                      ]}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Adding...' : 'Add Reminder'}
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
  dateButton: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dateButtonText: {
    fontSize: typography.sizes.md,
    color: colors.textDark,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  periodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  periodButton: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    marginHorizontal: spacing.xs,
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    color: colors.gray[600],
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: colors.textLight,
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

export default AddBillReminderModal; 