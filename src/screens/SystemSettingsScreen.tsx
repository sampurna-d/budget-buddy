import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';

const SystemSettingsScreen = () => {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [biometrics, setBiometrics] = React.useState(false);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>System Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.gray[300], true: colors.primary }}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.gray[300], true: colors.primary }}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Biometric Login</Text>
          <Switch
            value={biometrics}
            onValueChange={setBiometrics}
            trackColor={{ false: colors.gray[300], true: colors.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: colors.gray ? colors.gray[400] : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray ? colors.gray[200] : '#eee',
  },
  settingLabel: {
    fontSize: typography.sizes.md,
    color: colors.textDark,
  },
  versionText: {
    fontSize: typography.sizes.md,
    color: colors.textLight,
  },
});

export default SystemSettingsScreen; 