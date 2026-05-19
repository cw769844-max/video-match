import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '../../store/useAuthStore';
import { signOut } from '../../services/firebase';
import { openCustomerPortal } from '../../services/stripe';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';

interface SettingRowProps {
  icon: string;
  label: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
  destructive?: boolean;
}

function SettingRow({ icon, label, onPress, rightEl, destructive }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Icon name={icon} size={20} color={destructive ? Colors.error : Colors.primary} />
      </View>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
      {rightEl || (onPress && <Icon name="chevron-forward" size={16} color={Colors.textMuted} />)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { profile } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  }

  async function handleManageSubscription() {
    try {
      const { url } = await openCustomerPortal();
      if (url) await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Contact Support', 'Please email support@videomatch.app to delete your account.'),
        },
      ],
    );
  }

  const sections = [
    {
      title: 'Account',
      rows: [
        ...(profile?.isPremium
          ? [
              {
                icon: 'star',
                label: 'Manage Premium Subscription',
                onPress: handleManageSubscription,
              },
            ]
          : []),
        { icon: 'person-outline', label: 'Edit Profile', onPress: () => {} },
      ],
    },
    {
      title: 'Preferences',
      rows: [
        {
          icon: 'notifications-outline',
          label: 'Notifications',
          rightEl: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          ),
        },
      ],
    },
    {
      title: 'Support & Legal',
      rows: [
        {
          icon: 'help-circle-outline',
          label: 'Help & Support',
          onPress: () => Linking.openURL('mailto:support@videomatch.app'),
        },
        {
          icon: 'document-text-outline',
          label: 'Terms of Service',
          onPress: () => Linking.openURL('https://videomatch.app/terms'),
        },
        {
          icon: 'shield-outline',
          label: 'Privacy Policy',
          onPress: () => Linking.openURL('https://videomatch.app/privacy'),
        },
        {
          icon: 'information-circle-outline',
          label: 'App Version',
          rightEl: <Text style={styles.versionText}>1.0.0</Text>,
        },
      ],
    },
    {
      title: 'Danger Zone',
      rows: [
        { icon: 'log-out-outline', label: 'Sign Out', onPress: handleSignOut, destructive: true },
        { icon: 'trash-outline', label: 'Delete Account', onPress: handleDeleteAccount, destructive: true },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.rows.map((row, i) => (
                <View key={row.label}>
                  <SettingRow {...row} />
                  {i < section.rows.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text, marginBottom: Spacing.xl },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIconDestructive: { backgroundColor: Colors.error + '20' },
  rowLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  rowLabelDestructive: { color: Colors.error },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.md + 36 + Spacing.md },
  versionText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
