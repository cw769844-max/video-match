import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { registerWithEmail, signInWithGoogle, signInWithApple } from '../../services/firebase';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { RootStackParamList } from '../../types';

type Nav = StackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email.trim() || !password || !confirm) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Error', 'You must agree to the Terms of Service and be 10+');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (!agreedToTerms) {
      Alert.alert('Error', 'You must agree to the Terms of Service and be 10+');
      return;
    }
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApple() {
    if (!agreedToTerms) {
      Alert.alert('Error', 'You must agree to the Terms of Service and be 10+');
      return;
    }
    setLoading(true);
    try {
      await signInWithApple();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join thousands of people worldwide</Text>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Icon name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Icon name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password (min 8 characters)"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Icon name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={Colors.textMuted}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Icon name="checkmark" size={14} color={Colors.text} />}
            </View>
            <Text style={styles.termsText}>
              I am 10+ and agree to the{' '}
              <Text style={styles.link}>Terms of Service</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
            <LinearGradient colors={Colors.gradient} style={styles.gradientBtn}>
              {loading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <Text style={styles.primaryBtnText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign up with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialBtns}>
          <TouchableOpacity style={styles.socialBtn} onPress={handleGoogle} disabled={loading}>
            <Icon name="logo-google" size={22} color={Colors.text} />
            <Text style={styles.socialBtnText}>Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.socialBtn} onPress={handleApple} disabled={loading}>
              <Icon name="logo-apple" size={22} color={Colors.text} />
              <Text style={styles.socialBtnText}>Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  back: { marginBottom: Spacing.xl, width: 40 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
  form: { gap: Spacing.md },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 52,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.text, fontSize: FontSize.md },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  termsText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  link: { color: Colors.primary },
  primaryBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  gradientBtn: { height: 52, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl, gap: Spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: FontSize.sm },
  socialBtns: { flexDirection: 'row', gap: Spacing.md },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  socialBtnText: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  loginLink: { marginTop: Spacing.xl, alignItems: 'center' },
  loginText: { color: Colors.textSecondary, fontSize: FontSize.md },
  loginTextBold: { color: Colors.primary, fontWeight: FontWeight.bold },
});
