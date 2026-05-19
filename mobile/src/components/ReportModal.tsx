import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { sendReport } from '../services/socket';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';

const REASONS = [
  { value: 'nudity', label: 'Nudity or sexual content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'underage', label: 'Appears to be underage' },
  { value: 'other', label: 'Other' },
] as const;

type Reason = typeof REASONS[number]['value'];

interface Props {
  visible: boolean;
  reportedUid: string;
  roomId: string;
  onClose: () => void;
}

export default function ReportModal({ visible, reportedUid, roomId, onClose }: Props) {
  const [reason, setReason] = useState<Reason | null>(null);
  const [description, setDescription] = useState('');

  function handleSubmit() {
    if (!reason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }

    sendReport({ reportedUid, roomId, reason, description });
    Alert.alert('Report Submitted', 'Thank you for helping keep VideoMatch safe.');
    setReason(null);
    setDescription('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report User</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.subtitle}>
            Help us understand what's happening. Your report is anonymous.
          </Text>

          {REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.reasonItem, reason === r.value && styles.reasonItemActive]}
              onPress={() => setReason(r.value)}
            >
              <View style={[styles.radio, reason === r.value && styles.radioActive]}>
                {reason === r.value && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.reasonText, reason === r.value && styles.reasonTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}

          {reason && (
            <TextInput
              style={styles.descriptionInput}
              placeholder="Additional details (optional)"
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <LinearGradient colors={[Colors.error, '#CC0000']} style={styles.gradientBtn}>
              <Text style={styles.submitBtnText}>Submit Report</Text>
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
  body: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.sm },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  reasonItemActive: { borderColor: Colors.error, backgroundColor: Colors.error + '15' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { borderColor: Colors.error },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error },
  reasonText: { color: Colors.textSecondary, fontSize: FontSize.md },
  reasonTextActive: { color: Colors.text },
  descriptionInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSize.md,
    textAlignVertical: 'top',
    marginTop: Spacing.xs,
  },
  submitBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.md },
  gradientBtn: { height: 52, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
});
