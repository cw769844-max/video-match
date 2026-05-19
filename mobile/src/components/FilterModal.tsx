import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { MatchFilters, Gender } from '../types';
import { COUNTRIES, Config } from '../constants/config';

const GENDERS: { value: Gender; label: string; icon: string }[] = [
  { value: 'male', label: 'Male', icon: 'male' },
  { value: 'female', label: 'Female', icon: 'female' },
  { value: 'non_binary', label: 'Non-binary', icon: 'transgender' },
];

interface Props {
  visible: boolean;
  filters: MatchFilters;
  onClose: () => void;
  onApply: (filters: MatchFilters) => void;
}

export default function FilterModal({ visible, filters, onClose, onApply }: Props) {
  const [selectedGenders, setSelectedGenders] = useState<Gender[]>(filters.genders || []);
  const [ageMin, setAgeMin] = useState(filters.ageRange?.min ?? Config.MIN_AGE);
  const [ageMax, setAgeMax] = useState(filters.ageRange?.max ?? Config.MAX_AGE);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(filters.countries || []);

  function toggleGender(g: Gender) {
    setSelectedGenders((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  }

  function toggleCountry(code: string) {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code],
    );
  }

  function adjustAge(field: 'min' | 'max', delta: number) {
    if (field === 'min') {
      const next = Math.max(Config.MIN_AGE, Math.min(ageMax - 1, ageMin + delta));
      setAgeMin(next);
    } else {
      const next = Math.max(ageMin + 1, Math.min(Config.MAX_AGE, ageMax + delta));
      setAgeMax(next);
    }
  }

  function handleApply() {
    onApply({
      genders: selectedGenders.length > 0 ? selectedGenders : undefined,
      ageRange: { min: ageMin, max: ageMax },
      countries: selectedCountries.length > 0 ? selectedCountries : undefined,
    });
    onClose();
  }

  function handleReset() {
    setSelectedGenders([]);
    setAgeMin(Config.MIN_AGE);
    setAgeMax(Config.MAX_AGE);
    setSelectedCountries([]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Match Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Gender Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Match with</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => {
                const active = selectedGenders.includes(g.value);
                return (
                  <TouchableOpacity
                    key={g.value}
                    style={[styles.genderChip, active && styles.genderChipActive]}
                    onPress={() => toggleGender(g.value)}
                  >
                    <Icon name={g.icon} size={18} color={active ? Colors.text : Colors.textMuted} />
                    <Text style={[styles.genderChipText, active && styles.genderChipTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.hint}>Leave empty to match with anyone</Text>
          </View>

          {/* Age Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Age Range</Text>
            <View style={styles.ageRow}>
              <View style={styles.ageControl}>
                <Text style={styles.ageLabel}>Min Age</Text>
                <View style={styles.ageCounter}>
                  <TouchableOpacity style={styles.ageBtn} onPress={() => adjustAge('min', -1)}>
                    <Icon name="remove" size={18} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.ageValue}>{ageMin}</Text>
                  <TouchableOpacity style={styles.ageBtn} onPress={() => adjustAge('min', 1)}>
                    <Icon name="add" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <Icon name="arrow-forward" size={20} color={Colors.textMuted} />

              <View style={styles.ageControl}>
                <Text style={styles.ageLabel}>Max Age</Text>
                <View style={styles.ageCounter}>
                  <TouchableOpacity style={styles.ageBtn} onPress={() => adjustAge('max', -1)}>
                    <Icon name="remove" size={18} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.ageValue}>{ageMax}</Text>
                  <TouchableOpacity style={styles.ageBtn} onPress={() => adjustAge('max', 1)}>
                    <Icon name="add" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Country Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Country</Text>
            <View style={styles.countryGrid}>
              {COUNTRIES.map((c) => {
                const active = selectedCountries.includes(c.code);
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.countryChip, active && styles.countryChipActive]}
                    onPress={() => toggleCountry(c.code)}
                  >
                    <Text style={[styles.countryChipText, active && styles.countryChipTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.hint}>Leave empty to match globally</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <LinearGradient colors={Colors.gradient} style={styles.gradientBtn}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  resetText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  scroll: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, gap: Spacing.lg },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted },
  genderRow: { flexDirection: 'row', gap: Spacing.sm },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  genderChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  genderChipText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  genderChipTextActive: { color: Colors.primary },
  ageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  ageControl: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  ageLabel: { color: Colors.textSecondary, fontSize: FontSize.sm },
  ageCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  ageBtn: { width: 40, height: 44, justifyContent: 'center', alignItems: 'center' },
  ageValue: { width: 44, textAlign: 'center', color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  countryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  countryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  countryChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  countryChipText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  countryChipTextActive: { color: Colors.primary, fontWeight: FontWeight.medium },
  footer: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  applyBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  gradientBtn: { height: 52, justifyContent: 'center', alignItems: 'center' },
  applyBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
});
