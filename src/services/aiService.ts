import { BudgetCategory, BUDGET_CATEGORIES } from '../constants/categories';
import { OpenAI } from "openai";
import { env } from '../config/env';

interface SpendingPattern {
  frequentCategories: { category: BudgetCategory; frequency: number }[];
  averageSpending: { [key in BudgetCategory]: number };
  overspendingTendency: BudgetCategory[];
  savingOpportunities: BudgetCategory[];
  monthlyTrend: 'increasing' | 'decreasing' | 'stable';
}

interface Transaction {
  description: string;
  amount: number;
  date: string;
  category?: BudgetCategory;
}

interface Budget {
  category: BudgetCategory;
  amount: number;
  spent: number;
}

export class AIService {
  private static client = new OpenAI({ 
    apiKey: env.KLUSTER_API_KEY,
    baseURL: env.AI_BASE_URL,
    timeout: 5000,
    maxRetries: 2,
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  private static async makeAIRequest<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Extract meaningful error message
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        // Handle rate limit error specifically
        if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Using fallback categorization.';
        } else {
          // For other errors, just get the main message without the HTML
          errorMessage = error.message.split('\n')[0];
        }
      }
      console.warn(`AI Service: ${errorMessage}`);
      return fallback;
    }
  }

  private static aiModel = "klusterai/Meta-Llama-2-7B-Instruct";

  static async categorizeTransaction(transaction: Transaction): Promise<BudgetCategory> {
    return this.makeAIRequest(
      async () => {
        const prompt = `Given the transaction description "${transaction.description}" and amount $${transaction.amount}, 
          categorize it into one of these categories: ${BUDGET_CATEGORIES.join(', ')}. 
          Respond with just the category name.`;

        try {
          const completion = await this.client.chat.completions.create({
            model: this.aiModel,
            messages: [{ "role": "user", "content": prompt }],
            temperature: 0.3,
            max_tokens: 10
          });

          const category = completion.choices[0]?.message?.content?.trim() || 'Other';
          return BUDGET_CATEGORIES.includes(category as BudgetCategory) ? (category as BudgetCategory) : 'Other';
        } catch (error) {
          // Log only essential information for debugging
          if (error instanceof Error) {
            console.warn(`AI categorization failed: ${error.name}`);
          }
          throw error; // Re-throw to be handled by makeAIRequest
        }
      },
      this.fallbackCategorization(transaction.description)
    );
  }

  private static fallbackCategorization(description: string): BudgetCategory {
    const desc = description.toLowerCase();
    if (desc.match(/food|restaurant|grocery|meal|drink|cafe/)) return 'Food';
    if (desc.match(/transport|uber|lyft|taxi|gas|train|bus|subway/)) return 'Transportation';
    if (desc.match(/rent|mortgage|utilities|water|electricity|maintenance/)) return 'Housing';
    if (desc.match(/movie|game|netflix|spotify|entertainment|concert/)) return 'Entertainment';
    return 'Other';
  }

  static async analyzeSpendingPatterns(
    transactions: Transaction[],
    budgets: Budget[]
  ): Promise<SpendingPattern> {
    try {
      const prompt = `Analyze these transactions and budgets:
        Transactions: ${JSON.stringify(transactions)}
        Budgets: ${JSON.stringify(budgets)}
        Provide a spending analysis in this exact JSON format: ${JSON.stringify({
          frequentCategories: [{ category: 'example', frequency: 0 }],
          averageSpending: { Food: 0 },
          overspendingTendency: ['example'],
          savingOpportunities: ['example'],
          monthlyTrend: 'stable'
        })}`;

      const completion = await this.client.chat.completions.create({
        model: this.aiModel, // Using a smaller model
        messages: [{ "role": "user", "content": prompt }],
        temperature: 0.7, // Higher temperature for more creative analysis
        max_tokens: 500
      });

      const responseContent = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(responseContent);
    } catch (error) {
      console.error('Error analyzing spending patterns:', error);
      return this.getFallbackSpendingPattern(transactions, budgets);
    }
  }

  private static getFallbackSpendingPattern(transactions: Transaction[], budgets: Budget[]): SpendingPattern {
    // Add a fallback spending pattern calculation
    const categoryCounts = transactions.reduce((acc, t) => {
      const category = t.category || this.fallbackCategorization(t.description);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<BudgetCategory, number>);

    const defaultSpending = BUDGET_CATEGORIES.reduce((acc, category) => ({
      ...acc,
      [category]: budgets.find(b => b.category === category)?.spent || 0
    }), {} as Record<BudgetCategory, number>);

    return {
      frequentCategories: Object.entries(categoryCounts)
        .map(([category, frequency]) => ({ 
          category: category as BudgetCategory, 
          frequency 
        }))
        .sort((a, b) => b.frequency - a.frequency),
      averageSpending: defaultSpending,
      overspendingTendency: budgets.filter(b => b.spent > b.amount).map(b => b.category),
      savingOpportunities: budgets.filter(b => b.spent > b.amount * 0.8).map(b => b.category),
      monthlyTrend: 'stable'
    };
  }

  static async generateNotificationContent(
    spendingPattern: SpendingPattern,
    budgets: Budget[],
    notificationType: 'budget-alert' | 'spending-tip' | 'saving-opportunity'
  ): Promise<string> {
    try {
      const context = {
        spendingPattern,
        budgets,
        notificationType
      };

      const prompt = `Given this financial context: ${JSON.stringify(context)}
        Generate a friendly and encouraging ${notificationType} notification message.
        Keep it concise (max 2 sentences) and actionable.
        For budget alerts, mention the specific category and remaining amount.
        For spending tips, provide specific actionable advice based on the spending pattern.
        For saving opportunities, suggest specific areas where the user could save money.`;

      const completion = await this.client.chat.completions.create({
        model: this.aiModel,
        messages: [{ "role": "user", "content": prompt }]
      });

      const notificationText = completion.choices[0]?.message?.content?.trim() || this.getFallbackNotification(notificationType);
      return notificationText;
    } catch (error) {
      console.error('Error generating notification:', error);
      return this.getFallbackNotification(notificationType);
    }
  }

  private static getFallbackNotification(type: 'budget-alert' | 'spending-tip' | 'saving-opportunity'): string {
    const fallbacks = {
      'budget-alert': 'Your budget is running low. Consider reviewing your spending.',
      'spending-tip': 'Track your daily expenses to stay within your budget.',
      'saving-opportunity': 'Look for opportunities to save on regular expenses.'
    };
    return fallbacks[type];
  }
} 