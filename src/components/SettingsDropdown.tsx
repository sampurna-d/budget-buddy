import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface SettingsDropdownProps {
  onLinkBank: () => void;
  onSystemSettings: () => void;
  onLogout: () => void;
  onClose: () => void;
}

type RootStackParamList = {
  LinkedAccounts: undefined;
  SystemSettings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({ onLinkBank, onSystemSettings, onLogout, onClose }) => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.overlay}>
      <View style={styles.dropdownContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialCommunityIcons name="close" size={20} color={colors.textDark} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('LinkedAccounts')}>
          <MaterialCommunityIcons name="bank-plus" size={24} color={colors.primary} />
          <Text style={styles.optionText}>Link Bank/Credit Card</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('SystemSettings')}>
          <MaterialCommunityIcons name="cog" size={24} color={colors.primary} />
          <Text style={styles.optionText}>System Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.option, styles.logoutOption]} onPress={onLogout}>
          <MaterialCommunityIcons name="logout" size={24} color={colors.error} />
          <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 100,
  },
  dropdownContainer: {
    position: 'absolute',
    top: spacing.lg + 50,
    right: spacing.lg,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    elevation: 8,
    shadowColor: colors.gray ? colors.gray[600] : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    padding: spacing.sm,
    minWidth: 220,
    zIndex: 1000,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: 2,
    borderRadius: 8,
  },
  optionText: {
    fontSize: typography.sizes.md,
    color: colors.textDark,
    marginLeft: spacing.sm,
  },
  logoutOption: {
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.gray ? colors.gray[200] : '#eee',
  },
  logoutText: {
    color: colors.error,
  },
});

export default SettingsDropdown; 