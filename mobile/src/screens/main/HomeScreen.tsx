import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { useCallStore } from '../../store/useCallStore';
import { useAuthStore } from '../../store/useAuthStore';
import FilterModal from '../../components/FilterModal';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { MatchFilters } from '../../types';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();
  const { status, filters, setFilters } = useCallStore();
  const { startSearching, stopSearching } = useMatchmaking();
  const [showFilters, setShowFilters] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Navigate to video call when matched
  useEffect(() => {
    if (status === 'connecting' || status === 'connected') {
      navigation.navigate('VideoCall' as never);
    }
  }, [status]);

  // Pulsing animation while searching
  useEffect(() => {
    if (status === 'searching') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [status]);

  const activeFiltersCount = [
    filters.genders && filters.genders.length > 0,
    filters.ageRange,
    filters.countries && filters.countries.length > 0,
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>VideoMatch</Text>
        {profile?.isPremium && (
          <View style={styles.premiumBadge}>
            <Icon name="star" size={12} color={Colors.premium} />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
      </View>

      {/* Online count */}
      <View style={styles.onlineRow}>
        <View style={styles.onlineDot} />
        <Text style={styles.onlineText}>People are online now</Text>
      </View>

      {/* Main button */}
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            onPress={status === 'searching' ? stopSearching : startSearching}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={status === 'searching' ? [Colors.error, '#CC0000'] : Colors.gradient}
              style={styles.startBtn}
            >
              <Icon
                name={status === 'searching' ? 'stop' : 'videocam'}
                size={36}
                color={Colors.text}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.btnLabel}>
          {status === 'searching' ? 'Finding a match...' : 'Tap to start'}
        </Text>

        {status === 'searching' && (
          <Text style={styles.searchingHint}>Tap again to cancel</Text>
        )}
      </View>

      {/* Filters (premium only) */}
      {profile?.isPremium ? (
        <View style={styles.filtersSection}>
          <TouchableOpacity
            style={[styles.filterBtn, activeFiltersCount > 0 && styles.filterBtnActive]}
            onPress={() => setShowFilters(true)}
          >
            <Icon name="options-outline" size={20} color={activeFiltersCount > 0 ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.filterBtnText, activeFiltersCount > 0 && styles.filterBtnTextActive]}>
              {activeFiltersCount > 0 ? `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active` : 'No filters'}
            </Text>
            <Icon name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.premiumPromo}>
          <LinearGradient colors={['#2A1A40', Colors.surface]} style={styles.premiumCard}>
            <Icon name="star" size={24} color={Colors.premium} />
            <View style={styles.premiumCardText}>
              <Text style={styles.premiumCardTitle}>Unlock Premium Filters</Text>
              <Text style={styles.premiumCardDesc}>Filter by gender, age & location</Text>
            </View>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => navigation.navigate('Premium' as never)}
            >
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      <FilterModal
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onApply={(f: MatchFilters) => setFilters(f)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  appName: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text, flex: 1 },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.premium + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.premium + '40',
  },
  premiumText: { fontSize: FontSize.xs, color: Colors.premium, fontWeight: FontWeight.semibold },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  onlineText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  startBtn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  btnLabel: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  searchingHint: { fontSize: FontSize.sm, color: Colors.textMuted },
  filtersSection: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: { borderColor: Colors.primary + '60', backgroundColor: Colors.primary + '10' },
  filterBtnText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.md },
  filterBtnTextActive: { color: Colors.primary },
  premiumPromo: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.premium + '30',
  },
  premiumCardText: { flex: 1 },
  premiumCardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  premiumCardDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  upgradeBtn: {
    backgroundColor: Colors.premium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  upgradeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000' },
});
