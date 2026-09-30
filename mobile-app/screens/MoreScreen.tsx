import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Colors, FontSizes, Radius, Spacing } from '../constants/colors';
import { useAuthStore } from '../store/authStore';

interface MoreScreenProps {
  navigation?: any;
}

interface MenuItem {
  icon: string;
  label: string;
  screen: string;
  requiresAuth?: boolean;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    items: [
      { icon: '🏠', label: 'Home', screen: 'Home' },
      { icon: '📝', label: 'Report Complaint', screen: 'Report', requiresAuth: true },
      { icon: '📷', label: 'Scan Food Product', screen: 'Scan Food' },
      { icon: '🔍', label: 'Track Complaint', screen: 'Track', requiresAuth: true },
      { icon: '🏛️', label: 'My Complaint', screen: 'Transparency', requiresAuth: true },
    ],
  },
  {
    title: 'My Account',
    items: [
      { icon: '📂', label: 'My Complaints', screen: 'MyComplaints', requiresAuth: true },
      { icon: '📦', label: 'Saved Products', screen: 'SavedProducts', requiresAuth: true },
      { icon: '🔔', label: 'Notifications', screen: 'Notifications', requiresAuth: true },
      { icon: '👤', label: 'My Profile', screen: 'Profile', requiresAuth: true },
    ],
  },
  {
    title: 'App',
    items: [
      { icon: '❓', label: 'Help & Support', screen: 'Help' },
      { icon: 'ℹ️', label: 'About FDA SafeWatch', screen: 'About' },
    ],
  },
];

export default function MoreScreen({ navigation }: MoreScreenProps = {}) {
  const { user, logout } = useAuthStore();

  const navigate = (screen: string, requiresAuth?: boolean) => {
    if (requiresAuth && !user) {
      Alert.alert(
        'Login Required',
        'Please login to access this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation?.navigate('Login') },
        ]
      );
      return;
    }
    navigation?.navigate(screen);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  return (
    <View style={styles.flex}>
      {/* Header matching Screen 6 */}
      <View style={styles.header}>
        <Text style={styles.welcomeLabel}>Welcome</Text>
        <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
        {user && (
          <View style={styles.citizenBadge}>
            <Text style={styles.citizenText}>Citizen</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
        {MENU_SECTIONS.map((section, si) => (
          <View key={si} style={styles.section}>
            {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
            <View style={styles.sectionCard}>
              {section.items.map((item, ii) => (
                <View key={item.label}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigate(item.screen, item.requiresAuth)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuIcon}>
                      <Text style={styles.menuIconText}>{item.icon}</Text>
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuChevron}>›</Text>
                  </TouchableOpacity>
                  {ii < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Auth actions at bottom */}
        {user ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.authSection}>
            <TouchableOpacity style={styles.loginBtn} onPress={() => navigation?.navigate('Login')}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.registerBtn} onPress={() => navigation?.navigate('Register')}>
              <Text style={styles.registerText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* App version footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>FDA SafeWatch v1.0 • Government of India Initiative</Text>
          <Text style={styles.footerSub}>🏛️ Food Safety & Standards Authority</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  welcomeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 2 },
  userName: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 },
  citizenBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  citizenText: { fontSize: 11, color: '#FFFFFF', fontWeight: '700' },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  sectionCard: {
    backgroundColor: '#FFFFFF', borderRadius: Radius.lg,
    borderWidth: 1, borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  menuIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  menuIconText: { fontSize: 17 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  menuChevron: { fontSize: 20, color: '#CBD5E1', fontWeight: '300' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 62 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center',
    marginHorizontal: 16, marginTop: 24, paddingVertical: 16,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: '#FEE2E2', backgroundColor: '#FFF5F5',
  },
  logoutIcon: { fontSize: 18 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  authSection: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 24 },
  loginBtn: {
    flex: 1, backgroundColor: Colors.primary, paddingVertical: 14,
    borderRadius: Radius.md, alignItems: 'center',
  },
  loginText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  registerBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.primary,
    paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center',
  },
  registerText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  footer: { alignItems: 'center', paddingTop: 32, paddingHorizontal: 20 },
  footerText: { fontSize: 11, color: '#CBD5E1', textAlign: 'center' },
  footerSub: { fontSize: 11, color: '#CBD5E1', marginTop: 4 },
});
