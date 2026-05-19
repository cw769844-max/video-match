import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { calcAge } from '../../services/firebase';
import { COUNTRIES } from '../../constants/config';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();

  if (!profile) return null;

  const age = profile.dateOfBirth ? calcAge(profile.dateOfBirth) : null;
  const country = COUNTRIES.find((c) => c.code === profile.country)?.name ?? profile.country;

  const infoRows = [
    { icon: 'person-outline', label: 'Display Name', value: profile.displayName },
    {
      icon: profile.gender === 'male' ? 'male' : profile.gender === 'female' ? 'female' : 'transgender',
      label: 'Gender',
      value: profile.gender?.replace('_', ' ') ?? '—',
    },
    {
      icon: 'calendar-outline',
      label: 'Age',
      value: age != null ? `${age} years old` : '—',
    },
    { icon: 'globe-outline', label: 'Country', value: country || '—' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <LinearGradient colors={['#1A0A2E', Colors.background]} style={styles.hero}>
          <View style={styles.avatarWrapper}>
            {profile.profilePhotoUrl ? (
              <Image source={{ uri: profile.profilePhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="person" size={44} color={Colors.textMuted} />
              </View>
            )}
            {profile.isPremium && (
              <View style={styles.premiumBadge}>
                <Icon name="star" size={12} color="#000" />
              </View>
            )}
          </View>

          <Text style={styles.displayName}>{profile.displayName}</Text>

          {profile.isSuperAdmin ? (
            <View style={[styles.premiumTag, { backgroundColor: Colors.premium + '30' }]}>
              <Icon name="shield" size={12} color={Colors.premium} />
              <Text style={styles.premiumTagText}>Super Admin</Text>
            </View>
          ) : profile.isAdmin ? (
            <View style={[styles.premiumTag, { backgroundColor: Colors.accent + '25' }]}>
              <Icon name="shield-outline" size={12} color={Colors.accent} />
              <Text style={[styles.premiumTagText, { color: Colors.accent }]}>Admin</Text>
            </View>
          ) : profile.isPremium ? (
            <View style={styles.premiumTag}>
              <Icon name="star" size={12} color={Colors.premium} />
              <Text style={styles.premiumTagText}>Premium Member</Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* Info */}
        <View style={styles.card}>
          {infoRows.map((row, i) => (
            <View key={row.label} style={[styles.infoRow, i < infoRows.length - 1 && styles.infoRowBorder]}>
              <View style={styles.infoIconBg}>
                <Icon name={row.icon} size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('ProfileSetup', { isNewUser: false })}
        >
          <Icon name="create-outline" size={20} color={Colors.primary} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.xxl },
  hero: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.primary },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.premium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  displayName: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.premium + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  premiumTagText: { fontSize: FontSize.sm, color: Colors.premium, fontWeight: FontWeight.semibold },
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium, textTransform: 'capitalize', marginTop: 2 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editBtnText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
});
