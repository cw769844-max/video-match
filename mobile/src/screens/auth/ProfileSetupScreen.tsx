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
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  createUserProfile,
  uploadProfilePhoto,
  calcAge,
} from '../../services/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { COUNTRIES, Config } from '../../constants/config';
import { Gender, RootStackParamList } from '../../types';

type RouteParams = RouteProp<RootStackParamList, 'ProfileSetup'>;

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function ProfileSetupScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { user, profile } = useAuthStore();

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [gender, setGender] = useState<Gender | null>(profile?.gender || null);
  const [dateOfBirth, setDateOfBirth] = useState<Date>(
    profile?.dateOfBirth ? new Date(profile.dateOfBirth) : new Date(2000, 0, 1),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [country, setCountry] = useState(profile?.country || '');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(profile?.profilePhotoUrl || null);
  const [loading, setLoading] = useState(false);

  async function pickPhoto() {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter your display name');
      return;
    }
    if (!gender) {
      Alert.alert('Error', 'Please select your gender');
      return;
    }
    if (!country) {
      Alert.alert('Error', 'Please select your country');
      return;
    }

    const age = calcAge(dateOfBirth.toISOString());
    if (age < Config.MIN_AGE) {
      Alert.alert('Age Restriction', `You must be at least ${Config.MIN_AGE} years old to use VideoMatch.`);
      return;
    }

    setLoading(true);
    try {
      let profilePhotoUrl = profile?.profilePhotoUrl;

      if (photoUri && photoUri !== profile?.profilePhotoUrl) {
        profilePhotoUrl = await uploadProfilePhoto(user!.uid, photoUri);
      }

      await createUserProfile(user!.uid, {
        uid: user!.uid,
        email: user!.email || '',
        displayName: displayName.trim(),
        gender,
        dateOfBirth: dateOfBirth.toISOString(),
        country,
        profilePhotoUrl,
      });

      if (!route.params?.isNewUser) {
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedCountry = COUNTRIES.find((c) => c.code === country);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>
          {route.params?.isNewUser ? 'Set up your profile' : 'Edit profile'}
        </Text>
        <Text style={styles.subtitle}>This information helps us keep VideoMatch safe for everyone.</Text>

        {/* Photo */}
        <TouchableOpacity style={styles.photoSection} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Icon name="camera" size={32} color={Colors.textMuted} />
            </View>
          )}
          <Text style={styles.photoLabel}>
            {photoUri ? 'Change photo' : 'Add profile photo'}
          </Text>
        </TouchableOpacity>

        {/* Display Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Display Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="How you'll appear to others"
              placeholderTextColor={Colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={30}
            />
          </View>
        </View>

        {/* Gender */}
        <View style={styles.field}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderGrid}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.genderChip, gender === g.value && styles.genderChipActive]}
                onPress={() => setGender(g.value)}
              >
                <Text style={[styles.genderChipText, gender === g.value && styles.genderChipTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date of Birth */}
        <View style={styles.field}>
          <Text style={styles.label}>Date of Birth (must be 10+)</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar-outline" size={20} color={Colors.textMuted} style={{ marginRight: Spacing.sm }} />
            <Text style={styles.dateText}>
              {dateOfBirth.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setDateOfBirth(date);
              }}
            />
          )}
        </View>

        {/* Country */}
        <View style={styles.field}>
          <Text style={styles.label}>Country</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowCountryPicker(!showCountryPicker)}
          >
            <Icon name="globe-outline" size={20} color={Colors.textMuted} style={{ marginRight: Spacing.sm }} />
            <Text style={[styles.dateText, !selectedCountry && { color: Colors.textMuted }]}>
              {selectedCountry?.name || 'Select your country'}
            </Text>
            <Icon name="chevron-down" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {showCountryPicker && (
            <View style={styles.countryList}>
              {COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={styles.countryItem}
                  onPress={() => {
                    setCountry(c.code);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={[styles.countryText, country === c.code && { color: Colors.primary }]}>
                    {c.name}
                  </Text>
                  {country === c.code && <Icon name="checkmark" size={16} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          <LinearGradient colors={Colors.gradient} style={styles.gradientBtn}>
            {loading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <Text style={styles.saveBtnText}>
                {route.params?.isNewUser ? 'Start Chatting' : 'Save Changes'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 20 },
  photoSection: { alignItems: 'center', marginBottom: Spacing.xl },
  photo: { width: 100, height: 100, borderRadius: 50, marginBottom: Spacing.sm },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: Spacing.sm,
  },
  photoLabel: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, fontWeight: FontWeight.medium },
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
  input: { flex: 1, color: Colors.text, fontSize: FontSize.md },
  dateText: { color: Colors.text, fontSize: FontSize.md },
  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  genderChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  genderChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  genderChipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  genderChipTextActive: { color: Colors.primary },
  countryList: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 250,
    overflow: 'scroll' as any,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countryText: { color: Colors.text, fontSize: FontSize.md },
  saveBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.md },
  gradientBtn: { height: 52, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
});
