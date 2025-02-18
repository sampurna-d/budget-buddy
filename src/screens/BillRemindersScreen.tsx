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
import AddBillReminderModal from '../components/AddBillReminderModal';
import { NotificationService } from '../services/notificationService';

interface BillReminder {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  recurring: boolean;
  recurring_period?: 'weekly' | 'monthly' | 'yearly';
  paid: boolean;
}

const BillRemindersScreen = () => {
  const [reminders, setReminders] = useState<BillReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchReminders();
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      const initialized = await NotificationService.initialize();
      if (!initialized) {
        Alert.alert(
          'Notifications Disabled',
          'Enable notifications to receive bill reminders.'
        );
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('bill_reminders')
        .select('*')
        .eq('user_id', user?.id)
        .gte('due_date', new Date().toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (error) throw error;

      setReminders(data || []);
      
      // Schedule notifications for all active reminders
      for (const reminder of data || []) {
        await NotificationService.scheduleBillReminder(reminder);
      }
    } catch (error: any) {
      console.error('Fetch reminders error:', error);
      Alert.alert('Error', 'Failed to load bill reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = () => {
    setShowAddModal(true);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (dueDate: string, paid: boolean) => {
    if (paid) return colors.success;
    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil < 0) return colors.error;
    if (daysUntil <= 3) return colors.warning;
    return colors.secondary;
  };

  const togglePaid = async (reminder: BillReminder) => {
    try {
      const updatedReminder = { ...reminder, paid: !reminder.paid };
      const { error } = await supabase
        .from('bill_reminders')
        .update({ paid: updatedReminder.paid })
        .eq('id', reminder.id);

      if (error) throw error;

      // Update notifications based on paid status
      if (updatedReminder.paid) {
        await NotificationService.cancelBillReminder(reminder.id);
      } else {
        await NotificationService.scheduleBillReminder(updatedReminder);
      }

      await fetchReminders();
    } catch (error: any) {
      console.error('Toggle paid error:', error);
      Alert.alert('Error', 'Failed to update bill status');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bill Reminders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddReminder}
        >
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={colors.textLight}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {reminders.map((reminder) => (
          <TouchableOpacity
            key={reminder.id}
            style={styles.reminderCard}
            onPress={() => togglePaid(reminder)}
          >
            <View style={styles.reminderHeader}>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderTitle}>{reminder.title}</Text>
                <Text style={styles.reminderAmount}>
                  {formatCurrency(reminder.amount)}
                </Text>
              </View>
              <View style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(reminder.due_date, reminder.paid) }
              ]} />
            </View>

            <View style={styles.reminderDetails}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={16}
                  color={colors.gray[600]}
                />
                <Text style={styles.detailText}>
                  Due: {new Date(reminder.due_date).toLocaleDateString()}
                </Text>
              </View>
              {reminder.recurring && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="refresh"
                    size={16}
                    color={colors.gray[600]}
                  />
                  <Text style={styles.detailText}>
                    Recurring: {reminder.recurring_period}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.reminderStatus}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(reminder.due_date, reminder.paid) }
              ]}>
                {reminder.paid ? 'Paid' : `Due in ${getDaysUntilDue(reminder.due_date)} days`}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {reminders.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="bell-off"
              size={48}
              color={colors.gray[400]}
            />
            <Text style={styles.emptyStateText}>No upcoming bills</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={handleAddReminder}
            >
              <Text style={styles.emptyStateButtonText}>Add Bill Reminder</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AddBillReminderModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={fetchReminders}
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
  reminderCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textDark,
  },
  reminderAmount: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: spacing.md,
  },
  reminderDetails: {
    marginTop: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  detailText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginLeft: spacing.xs,
  },
  reminderStatus: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    textAlign: 'right',
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

export default BillRemindersScreen; 