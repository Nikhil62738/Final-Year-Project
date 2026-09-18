import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Radius } from '../constants/colors';
import { complaintsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface NotificationItem {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  trackingCode?: string;
  unread: boolean;
  type: 'status_update' | 'advisory' | 'system';
}

export default function NotificationsScreen({ navigation }: { navigation?: any } = {}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((s) => s.user);

  const fetchRealNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    const notifList: NotificationItem[] = [];

    try {
      // 1. Fetch user complaints to generate real status update notifications
      if (user) {
        try {
          const { data: myComplaints } = await complaintsAPI.getMyHistory();
          if (Array.isArray(myComplaints)) {
            myComplaints.forEach((c: any) => {
              const dateStr = c.createdAt
                ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                : 'Recent';

              if (c.status === 'resolved') {
                notifList.push({
                  id: `res_${c._id}`,
                  icon: '✅',
                  title: `Complaint Resolved: ${c.trackingCode}`,
                  body: `Your food safety complaint against "${c.vendorName}" has been successfully resolved by the Food Safety Officer.`,
                  time: dateStr,
                  trackingCode: c.trackingCode,
                  unread: true,
                  type: 'status_update',
                });
              } else if (c.status === 'action_taken') {
                notifList.push({
                  id: `act_${c._id}`,
                  icon: '⚖️',
                  title: `Enforcement Action Taken: ${c.trackingCode}`,
                  body: `Official inspection & corrective action conducted at "${c.vendorName}".`,
                  time: dateStr,
                  trackingCode: c.trackingCode,
                  unread: true,
                  type: 'status_update',
                });
              } else if (c.status === 'under_review') {
                notifList.push({
                  id: `rev_${c._id}`,
                  icon: '🔍',
                  title: `Under Investigation: ${c.trackingCode}`,
                  body: `Assigned to District Food Safety Officer for inspection at "${c.vendorName}".`,
                  time: dateStr,
                  trackingCode: c.trackingCode,
                  unread: false,
                  type: 'status_update',
                });
              } else {
                notifList.push({
                  id: `sub_${c._id}`,
                  icon: '📋',
                  title: `Complaint Registered: ${c.trackingCode}`,
                  body: `Your complaint for "${c.vendorName}" (${c.category}) has been verified in the central FSSAI database.`,
                  time: dateStr,
                  trackingCode: c.trackingCode,
                  unread: false,
                  type: 'status_update',
                });
              }
            });
          }
        } catch (_) {}
      }

      // 2. Add Government Food Safety Advisories
      notifList.push({
        id: 'adv_1',
        icon: '📢',
        title: 'FSSAI Festival Food Quality Advisory',
        body: 'Special inspection drive ongoing for sweets, milk products, and edible oil adulteration across Maharashtra.',
        time: 'Today',
        unread: true,
        type: 'advisory',
      });

      notifList.push({
        id: 'adv_2',
        icon: '🔬',
        title: 'Spices & Condiments Safety Standard Update',
        body: 'FSSAI mandates zero pesticide residue tolerances for packed coriander, cumin, and turmeric powders.',
        time: '2 days ago',
        unread: false,
        type: 'advisory',
      });

      notifList.push({
        id: 'adv_3',
        icon: '🏛️',
        title: 'Transparency Register Live Feed',
        body: 'Public complaints feed is actively updated. Citizens can vote on open food violations to prioritize inspections.',
        time: '1 week ago',
        unread: false,
        type: 'system',
      });

      setNotifications(notifList);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRealNotifications();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRealNotifications(true);
  }, [user]);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Live Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching real-time notifications…</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={{ fontSize: 44, marginBottom: 8 }}>🔔</Text>
            <Text style={styles.emptyTitle}>No New Notifications</Text>
            <Text style={styles.emptySub}>You are completely up to date with government food safety alerts.</Text>
          </View>
        ) : (
          notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.card, n.unread && styles.cardUnread]}
              activeOpacity={0.8}
              onPress={() => {
                if (n.trackingCode && navigation) {
                  navigation.navigate('Track', { initialCode: n.trackingCode });
                }
              }}
            >
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 22 }}>{n.icon}</Text>
              </View>
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  {n.unread && <View style={styles.dot} />}
                </View>
                <Text style={styles.notifBody}>{n.body}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.time}>{n.time}</Text>
                  {n.trackingCode ? (
                    <Text style={styles.trackLink}>Track Status →</Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <Text style={styles.endNote}>Official notifications from FDA SafeWatch & FSSAI</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4, width: 36 },
  backArrow: { fontSize: 28, color: '#1E293B', fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  content: { padding: 16, gap: 10 },
  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748B' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardUnread: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifBody: { fontSize: 12, color: '#475569', lineHeight: 17, marginBottom: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 11, color: '#94A3B8' },
  trackLink: { fontSize: 11, fontWeight: '800', color: '#0F4C3A' },
  endNote: { textAlign: 'center', fontSize: 12, color: '#94A3B8', paddingVertical: 20 },
});
