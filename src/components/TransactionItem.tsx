import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';

interface TransactionItemProps {
  type: string;
  amount: number;
  category: string;
  date: Date;
  description: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

const getCategoryIcon = (category: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const icons: { [key: string]: keyof typeof MaterialCommunityIcons.glyphMap } = {
    food: 'food',
    shopping: 'cart',
    transport: 'car',
    housing: 'home',
    utilities: 'lightning-bolt',
    entertainment: 'movie',
    health: 'medical-bag',
    other: 'dots-horizontal',
  };
  return icons[category.toLowerCase()] || 'dots-horizontal';
};

const TransactionItem: React.FC<TransactionItemProps> = ({
  type,
  amount,
  category,
  date,
  description,
  icon,
}) => {
  const isExpense = type === 'expense';
  const iconName = icon || getCategoryIcon(category);
  const formattedAmount = isExpense ? `-$${Math.abs(amount).toFixed(2)}` : `$${amount.toFixed(2)}`;
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={iconName}
          size={24}
          color={colors.gray[600]}
        />
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.category}>{category}</Text>
      </View>
      <View style={styles.rightContainer}>
        <Text style={[
          styles.amount,
          { color: isExpense ? colors.error : colors.success }
        ]}>
          {formattedAmount}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    marginVertical: spacing.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  detailsContainer: {
    flex: 1,
  },
  description: {
    fontSize: typography.sizes.md,
    fontWeight: '500',
    color: colors.textDark,
  },
  category: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: 2,
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  date: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
});

export default TransactionItem; 