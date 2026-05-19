import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '../../store/useAuthStore';
import { createCheckoutSession, openCustomerPortal } from '../../services/stripe';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { Config } from '../../constants/config';

const FEATURES = [
  { icon: 'options-outline', title: 'Gender Filter', desc: 'Choose to match with men, women, or non-binary' },
  { icon: 'people-outline', title: 'Age Range Filter', desc: 'Match with people in your preferred age range' },
  { icon: 'globe-outline', title: 'Location Filter', desc: 'Connect with people from specific countries' },
  { icon: 'flash-outline', title: 'Priority Matching', desc: 'Skip the queue and get matched faster' },
  { icon: 'shield-checkmark-outline', title: 'Verified Badge', desc: 'Show others you\'re a trusted member' },
];

const PLANS = [
  {
    id: 'monthly',
    priceId: Config.STRIPE_MONTHLY_PRICE_ID,
    label: 'Monthly',
    price: '$9.99',
    period: '/month',
    tag: null,
  },
  {
    id: 'yearly',
    priceId: Config.STRIPE_YEARLY_PRICE_ID,
    label: 'Yearly',
    price: '$59.99',
    period: '/year',
    tag: 'Save 50%',
  },
];

export default function PremiumScreen() {
  const { profile } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    try {
      const { url } = await createCheckoutSession(plan.priceId);
      if (url) {
        await Linking.openURL(url);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not start checkout');
    } finally {
      setLoading(false);
    }
  }

  async function handleManage() {
    setLoading(true);
    try {
      const { url } = await openCustomerPortal();
      if (url) await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  if (profile?.isPremium) {
    const expiry = profile.premiumExpiry
      ? new Date(profile.premiumExpiry).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <LinearGradient colors={['#2A1A40', Colors.surface]} style={styles.activeBanner}>
            <Icon name="star" size={48} color={Colors.premium} />
            <Text style={styles.activeBannerTitle}>You're Premium!</Text>
            <Text style={styles.activeBannerSub}>
              {expiry ? `Active until ${expiry}` : 'Active subscription'}
            </Text>
          </LinearGradient>

          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.icon} style={styles.featureRow}>
                <View style={[styles.featureIconBg, { backgroundColor: Colors.premium + '20' }]}>
                  <Icon name={f.icon} size={22} color={Colors.premium} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
                <Icon name="checkmark-circle" size={22} color={Colors.success} />
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.manageBtn} onPress={handleManage} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <>
                <Icon name="settings-outline" size={18} color={Colors.text} />
                <Text style={styles.manageBtnText}>Manage Subscription</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <LinearGradient colors={['#2A1A40', Colors.background]} style={styles.hero}>
          <Icon name="star" size={56} color={Colors.premium} />
          <Text style={styles.heroTitle}>VideoMatch Premium</Text>
          <Text style={styles.heroSub}>Better matches. More connections.</Text>
        </LinearGradient>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.featureRow}>
              <View style={styles.featureIconBg}>
                <Icon name={f.icon} size={22} color={Colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plans */}
        <Text style={styles.plansTitle}>Choose your plan</Text>
        <View style={styles.plans}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selectedPlan === plan.id && styles.planCardActive]}
              onPress={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
            >
              {plan.tag && (
                <View style={styles.planTag}>
                  <Text style={styles.planTagText}>{plan.tag}</Text>
                </View>
              )}
              <View style={[styles.planRadio, selectedPlan === plan.id && styles.planRadioActive]}>
                {selectedPlan === plan.id && <View style={styles.planRadioDot} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planLabel}>{plan.label}</Text>
                <Text style={styles.planPrice}>
                  {plan.price}
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe} disabled={loading}>
          <LinearGradient colors={Colors.premiumGradient} style={styles.gradientBtn}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Icon name="star" size={20} color="#000" />
                <Text style={styles.subscribeBtnText}>Get Premium</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          Subscriptions auto-renew unless cancelled. Cancel anytime in account settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.xxl },
  hero: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  heroTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  heroSub: { fontSize: FontSize.md, color: Colors.textSecondary },
  activeBanner: {
    alignItems: 'center',
    padding: Spacing.xxl,
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.premium + '40',
  },
  activeBannerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  activeBannerSub: { fontSize: FontSize.md, color: Colors.textSecondary },
  features: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  featureDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  plansTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  plans: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardActive: { borderColor: Colors.premium },
  planTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.premium,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  planTagText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#000' },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planRadioActive: { borderColor: Colors.premium },
  planRadioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.premium },
  planInfo: { flex: 1 },
  planLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  planPrice: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.premium },
  planPeriod: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.regular },
  subscribeBtn: { marginHorizontal: Spacing.lg, marginTop: Spacing.xl, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  gradientBtn: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  subscribeBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: '#000' },
  legalNote: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md, paddingHorizontal: Spacing.xl },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    height: 52,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  manageBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text },
});
