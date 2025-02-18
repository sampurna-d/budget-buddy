import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AIService } from './aiService';
import { Budget } from '../types/budget';
import { Transaction } from '../types/transaction';

// Define strict types for our notification system
type NotificationPriority = 'default' | 'high' | 'max';
type NotificationType = 'budget-alert' | 'spending-tip' | 'saving-opportunity' | 'bill-reminder';

interface NotificationConfig {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: NotificationPriority;
  sound?: boolean;
}

interface ScheduleConfig extends NotificationConfig {
  hour?: number;
  minute?: number;
  weekDay?: number;
  date?: Date;
  repeats?: boolean;
}

export class NotificationService {
  private static readonly CHANNEL_ID = 'default';
  private static readonly MIN_HOUR = 9;  // 9 AM
  private static readonly MAX_HOUR = 20; // 8 PM
  private static isInitialized = false;

  /**
   * Initialize the notification service with proper configuration and permissions
   */
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Set up notification handler
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Configure Android channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      this.isInitialized = status === 'granted';
      return this.isInitialized;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Schedule AI-powered notifications based on user's financial data
   */
  static async scheduleRandomNotifications(
    transactions: Transaction[],
    budgets: Budget[]
  ): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return;
    }

    try {
      const spendingPattern = await AIService.analyzeSpendingPatterns(transactions, budgets);
      
      await Promise.all([
        this.scheduleBudgetAlerts(budgets, spendingPattern),
        this.scheduleSpendingTips(spendingPattern),
        this.scheduleSavingOpportunities(spendingPattern)
      ]);
    } catch (error) {
      console.error('Failed to schedule random notifications:', error);
    }
  }

  /**
   * Schedule a notification with type checking and error handling
   */
  private static async scheduleNotification(config: ScheduleConfig): Promise<string | null> {
    try {
      // Validate time constraints
      if (config.hour !== undefined && (config.hour < this.MIN_HOUR || config.hour > this.MAX_HOUR)) {
        throw new Error(`Hour must be between ${this.MIN_HOUR} and ${this.MAX_HOUR}`);
      }

      const now = Date.now();
      let targetTime: number;

      if (config.date) {
        targetTime = config.date.getTime();
      } else if (config.weekDay !== undefined) {
        targetTime = this.getNextWeekday(config.weekDay, config.hour || 9, config.minute || 0).getTime();
      } else {
        targetTime = this.getNextTime(config.hour || 9, config.minute || 0).getTime();
      }

      // Ensure we're not scheduling in the past
      if (targetTime <= now) {
        targetTime += 24 * 60 * 60 * 1000; // Add one day
      }

      const notification = await Notifications.scheduleNotificationAsync({
        content: {
          title: config.title,
          body: config.body,
          data: config.data || {},
          sound: config.sound ?? true,
          priority: this.getPriorityLevel(config.priority)
        },
        trigger: {
          seconds: Math.floor((targetTime - now) / 1000),
          repeats: false
        } as Notifications.TimeIntervalTriggerInput
      });

      return notification;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Schedule budget alerts based on spending patterns
   */
  private static async scheduleBudgetAlerts(
    budgets: Budget[],
    spendingPattern: any
  ): Promise<void> {
    const alerts = budgets
      .filter(budget => (budget.spent / budget.amount) * 100 >= 80)
      .map(async budget => {
        const message = await AIService.generateNotificationContent(
          spendingPattern,
          budgets,
          'budget-alert'
        );

        return this.scheduleNotification({
          title: 'Budget Alert',
          body: message,
          hour: this.getRandomHour(),
          minute: this.getRandomMinute(),
          priority: 'high'
        });
      });

    await Promise.all(alerts);
  }

  /**
   * Schedule spending tips throughout the week
   */
  private static async scheduleSpendingTips(spendingPattern: any): Promise<void> {
    const numberOfTips = Math.floor(Math.random() * 2) + 2;
    const tips = Array(numberOfTips).fill(null).map(async () => {
      const message = await AIService.generateNotificationContent(
        spendingPattern,
        [],
        'spending-tip'
      );

      return this.scheduleNotification({
        title: 'Spending Tip',
        body: message,
        hour: this.getRandomHour(),
        minute: this.getRandomMinute(),
        weekDay: this.getRandomWeekDay(),
        priority: 'default'
      });
    });

    await Promise.all(tips);
  }

  /**
   * Schedule saving opportunity notifications
   */
  private static async scheduleSavingOpportunities(spendingPattern: any): Promise<void> {
    const numberOfOpportunities = Math.floor(Math.random() * 2) + 1;
    const opportunities = Array(numberOfOpportunities).fill(null).map(async () => {
      const message = await AIService.generateNotificationContent(
        spendingPattern,
        [],
        'saving-opportunity'
      );

      return this.scheduleNotification({
        title: 'Saving Opportunity',
        body: message,
        hour: this.getRandomHour(),
        minute: this.getRandomMinute(),
        weekDay: this.getRandomWeekDay(),
        priority: 'default'
      });
    });

    await Promise.all(opportunities);
  }

  /**
   * Set up Android notification channel
   */
  private static async setupAndroidChannel(): Promise<void> {
    await Notifications.setNotificationChannelAsync(this.CHANNEL_ID, {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  /**
   * Get the next occurrence of a specific weekday
   */
  private static getNextWeekday(weekDay: number, hour: number, minute: number): Date {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    
    while (date.getDay() !== weekDay || date <= new Date()) {
      date.setDate(date.getDate() + 1);
    }
    
    return date;
  }

  /**
   * Get the next occurrence of a specific time
   */
  private static getNextTime(hour: number, minute: number): Date {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    
    if (date <= new Date()) {
      date.setDate(date.getDate() + 1);
    }
    
    return date;
  }

  /**
   * Convert priority string to Android notification priority
   */
  private static getPriorityLevel(priority?: NotificationPriority): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'max':
        return Notifications.AndroidNotificationPriority.MAX;
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  /**
   * Generate a random hour within acceptable bounds
   */
  private static getRandomHour(): number {
    return Math.floor(Math.random() * (this.MAX_HOUR - this.MIN_HOUR + 1)) + this.MIN_HOUR;
  }

  /**
   * Generate a random minute
   */
  private static getRandomMinute(): number {
    return Math.floor(Math.random() * 60);
  }

  /**
   * Generate a random weekday (0-6)
   */
  private static getRandomWeekDay(): number {
    return Math.floor(Math.random() * 7);
  }

  static async scheduleBillReminder(reminder: {
    id: string;
    title: string;
    amount: number;
    due_date: string;
    recurring: boolean;
    recurring_period?: 'weekly' | 'monthly' | 'yearly';
    paid: boolean;
  }): Promise<string | null> {
    if (!this.isInitialized) await this.initialize();
    
    const dueDate = new Date(reminder.due_date);
    dueDate.setHours(9, 0, 0, 0);
    
    if (dueDate < new Date() || reminder.paid) return null;
    
    return this.scheduleNotification({
      title: 'Bill Due Today',
      body: `${reminder.title} - $${reminder.amount.toFixed(2)} is due today`,
      date: dueDate,
      data: { reminderId: reminder.id }
    });
  }

  static async cancelBillReminder(reminderId: string): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const reminders = scheduled.filter(n => n.content.data?.reminderId === reminderId);
    await Promise.all(reminders.map(n => 
      Notifications.cancelScheduledNotificationAsync(n.identifier)
    ));
  }
} 