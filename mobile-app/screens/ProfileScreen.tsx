import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Colors, FontSizes, Radius, Spacing } from '../constants/colors';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { userAPI } from '../services/api';
import { LANGUAGES } from '../constants/categories';

interface ProfileScreenProps {
  navigation?: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps = {}) {
  const { user, setAuth, token, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [language, setLanguage] = useState('en');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [rewardPoints, setRewardPoints] = useState(user?.rewardPoints || 0);

  // Fetch full profile from server
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await userAPI.getProfile();
        setName(data.name || '');
        setPhone(data.phone || '');
        setLanguage(data.preferredLanguage || 'en');
        setRewardPoints(data.rewardPoints || 0);
      } catch {
        // fallback to cached store values
        setName(user?.name || '');
        setPhone(user?.phone || '');
      } finally {
        setLoadingProfile(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile({ name: name.trim(), phone: phone.trim(), preferredLanguage: language });
      // Update the auth store with new name/language
      if (user && token) await setAuth({ ...user, name: data.name, preferredLanguage: language }, token);
      await useLanguageStore.getState().setLanguage(language as any);
      setEditing(false);
      Alert.alert('Success', 'Profile and preferred language updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); } }
      ]
    );
  };

  if (loadingProfile) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  const initial = (name || user?.name || 'U').charAt(0).toUpperCase();

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          {navigation && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            onPress={() => editing ? null : setEditing(true)}
            style={styles.editBtn}
          >
            {!editing && <Text style={styles.editText}>Edit</Text>}
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{name || user?.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>🏛️ Citizen</Text>
          </View>
          <View style={styles.pointsPill}>
            <Text style={styles.pointsText}>🏆 {rewardPoints} reward points</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor="#94A3B8"
              />
            ) : (
              <Text style={styles.fieldValue}>{name || '—'}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={[styles.fieldValue, styles.emailMuted]}>{user?.email || '—'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Mobile</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
              />
            ) : (
              <Text style={styles.fieldValue}>{phone ? `+91 ${phone}` : '—'}</Text>
            )}
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferred Language</Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                disabled={!editing}
                onPress={() => setLanguage(lang.code)}
                style={[styles.langChip, language === lang.code && styles.langChipActive]}
              >
                <Text style={[styles.langText, language === lang.code && styles.langTextActive]}>
                  {lang.label.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save / Cancel Buttons */}
        {editing && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setEditing(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B' },
  container: { paddingBottom: 40 },
  header: {
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4, width: 50 },
  backArrow: { fontSize: 28, color: '#1E293B', fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  editBtn: { width: 50, alignItems: 'flex-end' },
  editText: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  avatarSection: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFFFFF' },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarInitial: { fontSize: 32, color: '#FFFFFF', fontWeight: '900' },
  userName: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  rolePill: {
    backgroundColor: '#EAF4F1', paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1, borderColor: '#D1E7DD',
  },
  roleText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  pointsPill: { marginTop: 10, backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.full },
  pointsText: { fontSize: 12, color: '#92400E', fontWeight: '800' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: Radius.lg,
    marginHorizontal: 16, marginTop: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', width: 80 },
  fieldValue: { fontSize: 14, color: '#1E293B', fontWeight: '500', flex: 1, textAlign: 'right' },
  emailMuted: { color: '#94A3B8' },
  fieldInput: {
    flex: 1, fontSize: 14, color: '#1E293B', textAlign: 'right',
    borderBottomWidth: 1.5, borderBottomColor: Colors.primary, paddingBottom: 2,
  },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  langRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  langChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1.5, borderColor: '#E2E8F0' },
  langChipActive: { borderColor: Colors.primary, backgroundColor: '#EAF4F1' },
  langText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  langTextActive: { color: Colors.primary, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center' },
  cancelText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center',
    marginHorizontal: 16, marginTop: 24, paddingVertical: 16,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: '#FEE2E2', backgroundColor: '#FFF5F5',
  },
  logoutIcon: { fontSize: 18 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
