import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';

const { width, height } = Dimensions.get('window');
type Nav = StackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <LinearGradient colors={[Colors.background, '#1A0A2E', Colors.background]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <LinearGradient colors={Colors.gradient} style={styles.logoCircle}>
            <Icon name="videocam" size={48} color={Colors.text} />
          </LinearGradient>
          <Text style={styles.appName}>VideoMatch</Text>
          <Text style={styles.tagline}>Meet real people, instantly.</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: 'globe-outline', text: 'Connect with people worldwide' },
            { icon: 'shield-checkmark-outline', text: 'Safe & moderated platform' },
            { icon: 'star-outline', text: 'Premium filters for better matches' },
          ].map((f) => (
            <View key={f.icon} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Icon name={f.icon} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <LinearGradient colors={Colors.gradient} style={styles.gradientBtn}>
              <Text style={styles.primaryBtnText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>.{'\n'}
            You must be 18+ to use VideoMatch.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'space-between', paddingVertical: Spacing.xxl },
  logoSection: { alignItems: 'center', marginTop: Spacing.xxl },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appName: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.text, letterSpacing: 1 },
  tagline: { fontSize: FontSize.lg, color: Colors.textSecondary, marginTop: Spacing.xs },
  features: { gap: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: { fontSize: FontSize.md, color: Colors.textSecondary, flex: 1 },
  actions: { gap: Spacing.md },
  primaryBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  gradientBtn: { paddingVertical: Spacing.md, alignItems: 'center', borderRadius: BorderRadius.lg },
  primaryBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  secondaryBtn: { paddingVertical: Spacing.sm, alignItems: 'center' },
  secondaryBtnText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium },
  legal: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  link: { color: Colors.primary },
});
