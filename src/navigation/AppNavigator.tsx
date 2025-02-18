import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView, StatusBar, Platform, View } from 'react-native';
import { colors } from '../constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BudgetScreen from '../screens/BudgetScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BillRemindersScreen from '../screens/BillRemindersScreen';
import LinkedAccountsScreen from '../screens/LinkedAccountsScreen';
import SystemSettingsScreen from '../screens/SystemSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Main tab navigation
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#1A365D',
        tabBarInactiveTintColor: '#718096',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Budget" 
        component={BudgetScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-pie" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bank-transfer" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Bills" 
        component={BillRemindersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Root navigation
const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // You might want to add a loading screen here
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.backgroundLight }}>
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
          backgroundColor={colors.primary}
        />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.primary,
              },
              headerTintColor: colors.textLight,
              contentStyle: {
                backgroundColor: colors.backgroundLight,
              },
            }}
          >
            {!user ? (
              // Auth stack
              <Stack.Screen 
                name="Auth" 
                component={AuthScreen}
                options={{ headerShown: false }}
              />
            ) : (
              // Main app stack
              <Stack.Screen
                name="MainTabs"
                component={TabNavigator}
                options={{ headerShown: false }}
              />
            )}
            <Stack.Screen 
              name="LinkedAccounts" 
              component={LinkedAccountsScreen}
              options={{ title: 'Link Bank Account' }}
            />
            <Stack.Screen 
              name="SystemSettings" 
              component={SystemSettingsScreen}
              options={{ title: 'System Settings' }}
            />
            <Stack.Screen 
              name="Transactions" 
              component={TransactionsScreen}
              options={{ title: 'Transactions' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default AppNavigator; 