import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';
import { usePlaidLink } from '../hooks/usePlaidLink';
import { LinkedAccountsModal } from '../components/LinkedAccountsModal';
import { useAuth } from '../contexts/AuthContext';

const getInstitutionIcon = (accountTypes: string[]) => {
  if (accountTypes.includes('investment')) return 'chart-line';
  if (accountTypes.includes('credit')) return 'credit-card';
  return 'bank';
};

const formatAccountType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const LinkedAccountsScreen = () => {
  const { linkToken, generateLinkToken, institutions, loadInstitutions, exchangePublicToken } = usePlaidLink();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadInstitutions();
  }, []);

  const handleAccountLinked = () => {
    loadInstitutions();
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Linked Banks</Text>
        
        {institutions && institutions.length > 0 ? (
          institutions.map((institution) => (
            <View key={institution.id} style={styles.institutionCard}>
              <MaterialCommunityIcons 
                name={getInstitutionIcon(institution.accounts.map(a => a.type))}
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.institutionInfo}>
                <Text style={styles.institutionName}>{institution.name}</Text>
                <View style={styles.accountTypes}>
                  {institution.accounts.map((account, index) => (
                    <Text key={account.type} style={styles.accountType}>
                      {index > 0 ? ' • ' : ''}
                      {formatAccountType(account.type)}
                      {account.count > 1 ? ` (${account.count})` : ''}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyStateContainer}>
            <MaterialCommunityIcons 
              name="bank-plus" 
              size={48} 
              color={colors.gray[400]} 
            />
            <Text style={styles.noAccountsText}>No banks linked yet</Text>
            <Text style={styles.noAccountsSubtext}>
              Link your bank accounts to start tracking your finances automatically
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            generateLinkToken();
            setIsModalVisible(true);
          }}
        >
          <MaterialCommunityIcons 
            name="plus-circle" 
            size={24} 
            color={colors.textLight} 
          />
          <Text style={styles.addButtonText}>Link New Bank</Text>
        </TouchableOpacity>
      </View>

      {user && (
        <LinkedAccountsModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          linkToken={linkToken}
          generateLinkToken={generateLinkToken}
          exchangePublicToken={exchangePublicToken}
          onSuccess={(publicToken) => {
            console.log('Got public token:', publicToken);
            handleAccountLinked();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: spacing.xl,
  },
  institutionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: colors.gray[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  institutionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  institutionName: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  accountTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  accountType: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  noAccountsText: {
    textAlign: 'center',
    color: colors.gray[600],
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  noAccountsSubtext: {
    textAlign: 'center',
    color: colors.gray[500],
    fontSize: typography.sizes.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  buttonContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: colors.textLight,
    fontSize: typography.sizes.md,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

export default LinkedAccountsScreen; 