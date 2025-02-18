export const BUDGET_CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Entertainment',
  'Other'
] as const;

export type BudgetCategory = typeof BUDGET_CATEGORIES[number];

export const getCategoryColor = (percentSpent: number): string => {
  if (percentSpent >= 90) return '#ef4444'; // Red
  if (percentSpent >= 75) return '#f97316'; // Orange
  if (percentSpent >= 50) return '#eab308'; // Yellow
  return '#22c55e'; // Green
};

// Map Plaid categories to our budget categories
export const mapPlaidToBudgetCategory = (plaidCategory: string): BudgetCategory => {
  const categoryMap: { [key: string]: BudgetCategory } = {
    // Food
    'Food and Drink': 'Food',
    'Restaurants': 'Food',
    'Groceries': 'Food',

    // Transportation
    'Travel': 'Transportation',
    'Taxi': 'Transportation',
    'Gas': 'Transportation',
    'Parking': 'Transportation',
    'Public Transportation': 'Transportation',

    // Housing
    'Rent': 'Housing',
    'Mortgage': 'Housing',
    'Utilities': 'Housing',
    'Home Improvement': 'Housing',

    // Entertainment
    'Entertainment': 'Entertainment',
    'Movies': 'Entertainment',
    'Music': 'Entertainment',
    'Sports': 'Entertainment',
    'Games': 'Entertainment',

    // Default to Other
    'default': 'Other'
  };

  return categoryMap[plaidCategory] || 'Other';
}; 