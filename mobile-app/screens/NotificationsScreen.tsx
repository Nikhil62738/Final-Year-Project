import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Radius } from '../constants/colors';
import { notificationsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  trackingCode?: string;
  type: 'status_update' | 'reward';
  read: boolean;
  createdAt: string;
}

export default function NotificationsScreen({ navigation }: { navigation?: any } = {}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((state) => state.user);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (!user) {
        setNotifications([]);
        return;
      }
      const { data } = await notificationsAPI.getMine();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const openNotification = (notification: NotificationItem) => {
    if (!notification.read) {
      setNotifications((items) => items.map((item) => item._id === notification._id ? { ...item, read: true } : item));
      notificationsAPI.markRead(notification._id).catch(() => {});
    }
    if (notification.trackingCode) navigation?.navigate('Track', { initialCode: notification.trackingCode });
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        {navigation && <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backArrow}>‹</Text></TouchableOpacity>}
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(true); }} tintColor={Colors.primary} />}
      >
        {loading ? <View style={styles.centerBox}><ActivityIndicator size="large" color={Colors.primary} /></View> : notifications.length === 0 ? (
          <View style={styles.centerBox}><Text style={styles.emptyTitle}>No new notifications</Text><Text style={styles.emptySub}>Complaint and reward updates will appear here.</Text></View>
        ) : notifications.map((notification) => (
          <TouchableOpacity key={notification._id} style={[styles.card, !notification.read && styles.cardUnread]} onPress={() => openNotification(notification)}>
            <Text style={styles.icon}>{notification.type === 'reward' ? '🏆' : '🔔'}</Text>
            <View style={styles.body}><Text style={styles.title}>{notification.title}</Text><Text style={styles.message}>{notification.body}</Text><Text style={styles.date}>{new Date(notification.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text></View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { width: 36, padding: 4 },
  backArrow: { fontSize: 28, color: '#1E293B' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  content: { padding: 16, gap: 10, flexGrow: 1 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  emptySub: { marginTop: 6, fontSize: 13, color: '#64748B', textAlign: 'center' },
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#FFFFFF', borderRadius: Radius.lg, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cardUnread: { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
  icon: { fontSize: 22 },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  message: { marginTop: 4, fontSize: 13, color: '#475569', lineHeight: 18 },
  date: { marginTop: 8, fontSize: 11, color: '#94A3B8', fontWeight: '600' },
});
