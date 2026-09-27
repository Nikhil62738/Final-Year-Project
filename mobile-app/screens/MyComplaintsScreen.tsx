import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Colors, FontSizes, Radius, Spacing } from '../constants/colors';
import { complaintsAPI } from '../services/api';
import { STATUS_CONFIG } from '../constants/categories';

interface MyComplaintsScreenProps {
  navigation?: any;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MyComplaintsScreen({ navigation }: MyComplaintsScreenProps = {}) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchComplaints = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      // const { data } = await complaintsAPI.getMyHistory();
      // setComplaints(Array.isArray(data) ? data : []);
      const { data } = await complaintsAPI.getMyHistory();

      const complaints = Array.isArray(data)
        ? data
        : Array.isArray(data?.complaints)
          ? data.complaints
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setComplaints(complaints);

      console.log('MY COMPLAINTS RESPONSE:', data);
    } catch (err: any) {
      console.log('MY COMPLAINTS ERROR STATUS:', err?.response?.status);
      console.log('MY COMPLAINTS ERROR DATA:', err?.response?.data);
      console.log('MY COMPLAINTS ERROR MESSAGE:', err?.message);

      setError('Failed to load complaints. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComplaints(true);
  }, []);

  const statusCfg = (status: string) =>
    STATUS_CONFIG[status] || { label: status, color: '#94A3B8', icon: '📋' };

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>My Complaints</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading complaints…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load complaints</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchComplaints()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={complaints.length === 0 ? styles.emptyContainer : styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {complaints.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📂</Text>
              <Text style={styles.emptyTitle}>No complaints yet</Text>
              <Text style={styles.emptySub}>
                Your submitted complaints will appear here. Use the Report tab to file a new complaint.
              </Text>
            </View>
          ) : (
            complaints.map((c) => {
              const cfg = statusCfg(c.status);
              return (
                <TouchableOpacity
                  key={c._id}
                  style={styles.card}
                  onPress={() => {
                    if (navigation) navigation.navigate('Track', { initialCode: c.trackingCode });
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.statusPill, { backgroundColor: cfg.color + '18' }]}>
                      <Text style={[styles.statusPillText, { color: cfg.color }]}>
                        {cfg.icon} {cfg.label}
                      </Text>
                    </View>
                    <Text style={styles.date}>{formatDate(c.createdAt)}</Text>
                  </View>

                  <Text style={styles.trackCode}>{c.trackingCode}</Text>
                  <Text style={styles.category}>{c.category?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text>
                  {c.vendorName ? <Text style={styles.vendor}>{c.vendorName}</Text> : null}
                  {c.district ? (
                    <Text style={styles.location}>📍 {c.taluka ? `${c.taluka}, ` : ''}{c.district}</Text>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <Text style={styles.tapText}>Tap to view timeline →</Text>
                    {c.upvotes > 0 && (
                      <View style={styles.votePill}>
                        <Text style={styles.voteText}>👍 {c.upvotes}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B' },
  errorEmoji: { fontSize: 40, marginBottom: 12 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  errorSub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  listContainer: { padding: 16, gap: 12 },
  emptyState: { alignItems: 'center' },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 11, color: '#94A3B8' },
  trackCode: { fontSize: 16, fontWeight: '900', color: '#0F4C3A', marginBottom: 4 },
  category: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  vendor: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  location: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  tapText: { fontSize: 11, color: '#0F4C3A', fontWeight: '600' },
  votePill: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  voteText: { fontSize: 11, color: '#16A34A', fontWeight: '600' },
});
