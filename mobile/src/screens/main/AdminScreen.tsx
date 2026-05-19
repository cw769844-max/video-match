import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '../../store/useAuthStore';
import { useCallStore } from '../../store/useCallStore';
import { adminGetAllProfiles, adminSetBan, adminSetAdmin } from '../../services/adminApi';
import { getSocket } from '../../services/socket';
import { calcAge } from '../../services/firebase';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { COUNTRIES } from '../../constants/config';
import { UserProfile } from '../../types';

// ── User card ─────────────────────────────────────────────────────────────────

interface UserCardProps {
  user: UserProfile;
  isSuperAdmin: boolean;
  onViewDetail: (u: UserProfile) => void;
  onForceMatch: (u: UserProfile) => void;
  onToggleBan: (u: UserProfile) => void;
  onToggleAdmin: (u: UserProfile) => void;
}

function UserCard({
  user,
  isSuperAdmin,
  onViewDetail,
  onForceMatch,
  onToggleBan,
  onToggleAdmin,
}: UserCardProps) {
  const age = user.dateOfBirth ? calcAge(user.dateOfBirth) : null;
  const country = COUNTRIES.find((c) => c.code === user.country)?.name ?? user.country;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onViewDetail(user)} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        {user.profilePhotoUrl ? (
          <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Icon name="person" size={20} color={Colors.textMuted} />
          </View>
        )}
        {user.isAdmin && (
          <View style={[styles.roleBadge, user.isSuperAdmin && styles.superBadge]}>
            <Icon name={user.isSuperAdmin ? 'shield' : 'shield-outline'} size={10} color="#000" />
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>{user.displayName}</Text>
          {user.isPremium && <Icon name="star" size={13} color={Colors.premium} />}
          {user.isBanned && (
            <View style={styles.bannedChip}>
              <Text style={styles.bannedChipText}>BANNED</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSub} numberOfLines={1}>
          {[user.gender?.replace('_', ' '), age != null ? `${age}y` : null, country]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <Text style={styles.cardEmail} numberOfLines={1}>{user.email}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onForceMatch(user)}>
          <Icon name="videocam" size={18} color={Colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onToggleBan(user)}>
          <Icon
            name={user.isBanned ? 'checkmark-circle-outline' : 'ban-outline'}
            size={18}
            color={user.isBanned ? Colors.success : Colors.error}
          />
        </TouchableOpacity>
        {isSuperAdmin && !user.isSuperAdmin && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onToggleAdmin(user)}>
            <Icon
              name={user.isAdmin ? 'shield' : 'shield-outline'}
              size={18}
              color={user.isAdmin ? Colors.premium : Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function UserDetailModal({
  user,
  visible,
  isSuperAdmin,
  onClose,
  onToggleBan,
  onToggleAdmin,
  onForceMatch,
}: {
  user: UserProfile | null;
  visible: boolean;
  isSuperAdmin: boolean;
  onClose: () => void;
  onToggleBan: (u: UserProfile) => void;
  onToggleAdmin: (u: UserProfile) => void;
  onForceMatch: (u: UserProfile) => void;
}) {
  if (!user) return null;

  const age = user.dateOfBirth ? calcAge(user.dateOfBirth) : null;
  const country = COUNTRIES.find((c) => c.code === user.country)?.name ?? user.country;

  const rows = [
    { label: 'UID', value: user.uid },
    { label: 'Email', value: user.email },
    { label: 'Gender', value: user.gender?.replace('_', ' ') },
    { label: 'Age', value: age != null ? `${age} years old` : '—' },
    { label: 'Country', value: country || '—' },
    { label: 'DOB', value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '—' },
    { label: 'Premium', value: user.isPremium ? `Yes (expires ${user.premiumExpiry ? new Date(user.premiumExpiry).toLocaleDateString() : 'n/a'})` : 'No' },
    { label: 'Admin', value: user.isAdmin ? (user.isSuperAdmin ? 'Super Admin' : 'Admin') : 'No' },
    { label: 'Reports received', value: String(user.reportCount ?? 0) },
    { label: 'Banned', value: user.isBanned ? 'Yes' : 'No' },
    { label: 'Joined', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
    { label: 'Last seen', value: user.lastSeen ? new Date(user.lastSeen).toLocaleString() : '—' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>User Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.modalScroll}>
          <View style={styles.modalAvatarRow}>
            {user.profilePhotoUrl ? (
              <Image source={{ uri: user.profilePhotoUrl }} style={styles.modalAvatar} />
            ) : (
              <View style={[styles.modalAvatar, styles.avatarPlaceholder]}>
                <Icon name="person" size={36} color={Colors.textMuted} />
              </View>
            )}
            <Text style={styles.modalName}>{user.displayName}</Text>
          </View>

          <View style={styles.detailCard}>
            {rows.map((row, i) => (
              <View key={row.label} style={[styles.detailRow, i < rows.length - 1 && styles.detailBorder]}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue} numberOfLines={2}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalActionBtn} onPress={() => { onForceMatch(user); onClose(); }}>
              <LinearGradient colors={[Colors.accent, '#00B8A0']} style={styles.gradientAction}>
                <Icon name="videocam" size={18} color="#000" />
                <Text style={styles.modalActionBtnText}>Force Match</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => { onToggleBan(user); onClose(); }}
            >
              <LinearGradient
                colors={user.isBanned ? [Colors.success, '#388E3C'] : [Colors.error, '#C62828']}
                style={styles.gradientAction}
              >
                <Icon name={user.isBanned ? 'checkmark-circle-outline' : 'ban-outline'} size={18} color="#fff" />
                <Text style={[styles.modalActionBtnText, { color: '#fff' }]}>
                  {user.isBanned ? 'Unban User' : 'Ban User'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {isSuperAdmin && !user.isSuperAdmin && (
              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => { onToggleAdmin(user); onClose(); }}
              >
                <LinearGradient
                  colors={user.isAdmin ? ['#78350F', '#92400E'] : [Colors.premium, '#E65C00']}
                  style={styles.gradientAction}
                >
                  <Icon name={user.isAdmin ? 'shield' : 'shield-outline'} size={18} color="#000" />
                  <Text style={styles.modalActionBtnText}>
                    {user.isAdmin ? 'Revoke Admin' : 'Grant Admin'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const { profile } = useAuthStore();
  const { setStatus } = useCallStore();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUid, setLastUid] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]); // UIDs currently online

  const isSuperAdmin = !!profile?.isSuperAdmin;

  const loadProfiles = useCallback(async (reset = false) => {
    try {
      const { profiles: data, lastUid: newLastUid } = await adminGetAllProfiles(50, reset ? undefined : lastUid);
      const next = reset ? data : [...profiles, ...data];
      setProfiles(next);
      setFiltered(next);
      setLastUid(newLastUid);
      setHasMore(data.length === 50);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lastUid, profiles]);

  useEffect(() => {
    loadProfiles(true);

    // Subscribe to online users via socket
    const socket = getSocket();
    if (socket) {
      socket.emit('admin-get-online-users');
      socket.on('admin-online-users', ({ users }: { users: Array<{ uid: string }> }) => {
        setOnlineUsers(users.map((u) => u.uid));
      });
    }

    return () => {
      getSocket()?.off('admin-online-users');
    };
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(profiles);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      profiles.filter(
        (p) =>
          p.displayName?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.uid?.toLowerCase().includes(q) ||
          p.country?.toLowerCase().includes(q),
      ),
    );
  }, [search, profiles]);

  function handleForceMatch(user: UserProfile) {
    Alert.alert(
      'Force Match',
      `Start a video call with ${user.displayName}?\n\nIf they are not currently searching, ask them to tap "Start" first.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Match Now',
          onPress: () => {
            const socket = getSocket();
            if (!socket) {
              Alert.alert('Error', 'Not connected to server. Start searching first.');
              return;
            }
            socket.emit('admin-force-match', { targetUid: user.uid });
          },
        },
      ],
    );
  }

  async function handleToggleBan(user: UserProfile) {
    const action = user.isBanned ? 'unban' : 'ban';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: user.isBanned ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await adminSetBan(user.uid, !user.isBanned);
              setProfiles((prev) =>
                prev.map((p) => (p.uid === user.uid ? { ...p, isBanned: !p.isBanned } : p)),
              );
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ],
    );
  }

  async function handleToggleAdmin(user: UserProfile) {
    const action = user.isAdmin ? 'revoke admin from' : 'grant admin to';
    Alert.alert(
      'Admin Status',
      `Are you sure you want to ${action} ${user.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user.isAdmin ? 'Revoke' : 'Grant',
          onPress: async () => {
            try {
              await adminSetAdmin(user.uid, !user.isAdmin);
              setProfiles((prev) =>
                prev.map((p) => (p.uid === user.uid ? { ...p, isAdmin: !p.isAdmin } : p)),
              );
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ],
    );
  }

  const stats = {
    total: profiles.length,
    online: onlineUsers.length,
    premium: profiles.filter((p) => p.isPremium).length,
    banned: profiles.filter((p) => p.isBanned).length,
    admins: profiles.filter((p) => p.isAdmin).length,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Icon name={isSuperAdmin ? 'shield' : 'shield-outline'} size={20} color={Colors.premium} />
        </View>
      </View>

      {/* Stats bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        {[
          { label: 'Total', value: stats.total, color: Colors.primary },
          { label: 'Online', value: stats.online, color: Colors.success },
          { label: 'Premium', value: stats.premium, color: Colors.premium },
          { label: 'Admins', value: stats.admins, color: Colors.accent },
          { label: 'Banned', value: stats.banned, color: Colors.error },
        ].map((s) => (
          <View key={s.label} style={styles.statChip}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Icon name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: Spacing.sm }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, UID, country..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* User list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            isSuperAdmin={isSuperAdmin}
            onViewDetail={(u) => { setSelectedUser(u); setShowDetail(true); }}
            onForceMatch={handleForceMatch}
            onToggleBan={handleToggleBan}
            onToggleAdmin={handleToggleAdmin}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadProfiles(true); }}
            tintColor={Colors.primary}
          />
        }
        onEndReached={() => { if (hasMore && !loading) loadProfiles(); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={hasMore ? <ActivityIndicator color={Colors.primary} style={{ padding: Spacing.md }} /> : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

      <UserDetailModal
        user={selectedUser}
        visible={showDetail}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setShowDetail(false)}
        onToggleBan={handleToggleBan}
        onToggleAdmin={handleToggleAdmin}
        onForceMatch={handleForceMatch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.premium + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsScroll: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  statChip: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    alignItems: 'center',
    minWidth: 64,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: FontSize.md },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLeft: { position: 'relative', marginRight: Spacing.sm },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  superBadge: { backgroundColor: Colors.premium },
  cardBody: { flex: 1, gap: 2 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, flexShrink: 1 },
  bannedChip: {
    backgroundColor: Colors.error + '30',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  bannedChipText: { fontSize: 9, color: Colors.error, fontWeight: FontWeight.bold },
  cardSub: { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'capitalize' },
  cardEmail: { fontSize: FontSize.xs, color: Colors.textMuted },
  cardActions: { flexDirection: 'row', gap: 2 },
  actionBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  separator: { height: Spacing.sm },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  modalScroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  modalAvatarRow: { alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.sm },
  modalAvatar: { width: 80, height: 80, borderRadius: 40 },
  modalName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  detailCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailLabel: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    flex: 2,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  modalActions: { gap: Spacing.md },
  modalActionBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  gradientAction: {
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalActionBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#000' },
});
