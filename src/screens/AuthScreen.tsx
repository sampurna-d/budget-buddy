import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        Alert.alert(
          'Success',
          'Account created successfully! You can now sign in.',
          [{ text: 'OK', onPress: () => setIsLogin(true) }]
        );
      }
    } catch (error: any) {
      let message = 'An error occurred';
      if (error.message.includes('email not confirmed')) {
        message = 'Please confirm your email before signing in';
      } else if (error.message.includes('Invalid login credentials')) {
        message = 'Invalid email or password';
      } else if (error.message.includes('User already registered')) {
        message = 'An account with this email already exists';
      }
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const isValidForm = validateEmail(email) && validatePassword(password);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
      
      <TextInput
        style={[styles.input, !validateEmail(email) && email.length > 0 && styles.inputError]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isLoading}
      />
      {!validateEmail(email) && email.length > 0 && (
        <Text style={styles.errorText}>Please enter a valid email</Text>
      )}
      
      <TextInput
        style={[styles.input, !validatePassword(password) && password.length > 0 && styles.inputError]}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      {!validatePassword(password) && password.length > 0 && (
        <Text style={styles.errorText}>Password must be at least 6 characters</Text>
      )}
      
      <TouchableOpacity 
        style={[styles.button, !isValidForm && styles.buttonDisabled]}
        onPress={handleAuth}
        disabled={!isValidForm || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.textLight} />
        ) : (
          <Text style={styles.buttonText}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.switchButton}
        onPress={() => {
          setIsLogin(!isLogin);
          setEmail('');
          setPassword('');
        }}
        disabled={isLoading}
      >
        <Text style={styles.switchText}>
          {isLogin ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xs,
    fontSize: typography.sizes.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.gray[400],
  },
  buttonText: {
    color: colors.textLight,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  switchText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
  },
});

export default AuthScreen; 