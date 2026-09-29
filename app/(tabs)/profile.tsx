import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth, signOut } from '@/lib/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const currentProfile = await getProfile(user.id);
    setProfile(currentProfile);
    setDraftName(currentProfile?.full_name ?? '');
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSaveName = async () => {
    if (!user || !draftName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }

    setSaving(true);
    const { error } = await updateProfile(user.id, {
      full_name: draftName.trim(),
    });
    setSaving(false);

    if (error) {
      Alert.alert('Error', error);
      return;
    }

    setProfile((current) =>
      current ? { ...current, full_name: draftName.trim() } : current
    );
    setEditing(false);
  };

  const handleSignOut = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { error } = await signOut();
      if (error) {
        throw error;
      }
      router.replace('/login');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to sign out.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      {loading ? (
        <Text style={styles.subtitle}>Loading profile...</Text>
      ) : user ? (
        <View style={styles.infoCard}>
          <View
            style={[
              styles.roleBadge,
              profile?.role === 'student' && styles.roleBadgeStudent,
            ]}
          >
            <Text style={styles.roleBadgeText}>
              {profile
                ? profile.role === 'teacher'
                  ? 'Teacher'
                  : 'Student'
                : 'Role unavailable'}
            </Text>
          </View>

          <Text style={styles.label}>Full Name</Text>
          {editing ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={draftName}
                onChangeText={setDraftName}
                editable={!saving}
                autoFocus
              />
              <Pressable onPress={handleSaveName} disabled={saving}>
                <Text style={styles.actionText}>{saving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.nameRow} onPress={() => setEditing(true)}>
              <Text style={styles.value}>
                {profile?.full_name || 'Tap to add your name'}
              </Text>
              <Text style={styles.editHint}>Edit</Text>
            </Pressable>
          )}

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{profile?.email ?? user.email}</Text>

          <Text style={styles.label}>User ID</Text>
          <Text style={styles.valueSmall}>{user.id}</Text>
        </View>
      ) : (
        <Text style={styles.subtitle}>No signed-in user.</Text>
      )}

      <AppButton
        title="Sign Out"
        icon="log-out-outline"
        onPress={handleSignOut}
        disabled={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: 24,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF4EF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  roleBadgeStudent: {
    backgroundColor: COLORS.surface,
  },
  roleBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  value: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  valueSmall: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.textPrimary,
  },
  actionText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  editHint: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
