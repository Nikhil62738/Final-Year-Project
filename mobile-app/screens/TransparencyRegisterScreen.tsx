import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors, Radius } from '../constants/colors';
import { complaintsAPI } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import { useAuthStore } from '../store/authStore';

interface TransparencyScreenProps {
  navigation?: any;
}

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'adulteration', label: 'Adulteration' },
  { id: 'expired_product', label: 'Expired' },
  { id: 'unhygienic_premises', label: 'Unhygienic' },
  { id: 'mislabeling', label: 'Mislabeling' },
  { id: 'pest_contamination', label: 'Pest' },
  { id: 'foreign_matter', label: 'Foreign Matter' },
  { id: 'other', label: 'Other' },
];

export default function TransparencyRegisterScreen({ navigation }: TransparencyScreenProps = {}) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});
  const user = useAuthStore((s) => s.user);

  const fetchRecords = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: any = {};
      if (category) params.category = category;
      const { data } = await complaintsAPI.getPublic(params);
      const list = Array.isArray(data) ? data : [];
      setRecords(list);

      // Check which complaints user has already voted on
      if (user) {
        const votes: Record<string, boolean> = {};
        list.forEach((c) => {
          if (c.voters && Array.isArray(c.voters) && (user.id || user._id)) {
            votes[c._id] = c.voters.includes(user.id || user._id);
          }
        });
        setVotedMap(votes);
      }
    } catch {
      Alert.alert('Error', 'Failed to load public food safety feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [category]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecords(true);
  }, [category]);

  const handleVote = async (complaintId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to vote on citizen reports.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation?.navigate('Login') },
      ]);
      return;
    }

    const isCurrentlyVoted = votedMap[complaintId];
    
    // Optimistic UI update
    setVotedMap((prev) => ({ ...prev, [complaintId]: !isCurrentlyVoted }));
    setRecords((prev) =>
      prev.map((c) => {
        if (c._id === complaintId) {
          const delta = isCurrentlyVoted ? -1 : 1;
          return { ...c, upvotes: Math.max(0, (c.upvotes || 0) + delta) };
        }
        return c;
      })
    );

    try {
      await complaintsAPI.vote(complaintId);
    } catch (err: any) {
      // Revert if failed
      setVotedMap((prev) => ({ ...prev, [complaintId]: isCurrentlyVoted }));
      setRecords((prev) =>
        prev.map((c) => {
          if (c._id === complaintId) {
            const delta = isCurrentlyVoted ? 1 : -1;
            return { ...c, upvotes: Math.max(0, (c.upvotes || 0) + delta) };
          }
          return c;
        })
      );
      Alert.alert('Vote Failed', 'Could not register vote. Please try again.');
    }
  };

  const filtered = records.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.vendorName?.toLowerCase().includes(q) ||
      r.district?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.trackingCode?.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.flex}>
      {/* Header matching previous clean version */}
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Transparency Register</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendor, district, issue…"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: '#94A3B8', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category filter chips */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.filterChip, category === c.id && styles.filterChipActive]}
              onPress={() => setCategory(c.id)}
            >
              <Text style={[styles.filterText, category === c.id && styles.filterTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Records Feed */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading transparency register…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📋</Text>
            <Text style={styles.emptyTitle}>No Public Reports</Text>
            <Text style={styles.emptySub}>
              {search ? `No reports matching "${search}"` : 'No public food safety reports registered.'}
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <ComplaintCard
              key={item._id}
              complaint={item}
              showVote={true}
              hasVoted={votedMap[item._id]}
              onVote={() => handleVote(item._id)}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('Track', { initialCode: item.trackingCode });
                }
              }}
            />
          ))
        )}
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
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B', padding: 0 },
  filterWrapper: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#0F4C3A',
  },
  filterText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '700' },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
