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
import { Colors } from '../constants/colors';
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

export default function TransparencyRegisterScreen({
  navigation,
}: TransparencyScreenProps = {}) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const user = useAuthStore((s) => s.user);

  /**
   * Fetch ONLY the complaints registered by the logged-in user.
   */
  const fetchRecords = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      // Transparency Register is user-specific.
      if (!user) {
        setRecords([]);
        return;
      }

      const { data } = await complaintsAPI.getMyHistory();

      console.log('Transparency Register response:', data);

      // Handle different possible API response structures.
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.complaints)
          ? data.complaints
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.data?.complaints)
              ? data.data.complaints
              : [];

      setRecords(list);


    } catch (error: any) {
      console.error('Transparency Register error:', error);

      setRecords([]);
      Alert.alert(
        'Error',
        'Failed to load your transparency register.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Load user complaints when user/category changes.
   *
   * Category is filtered locally, so changing category does
   * not need another API request.
   */
  useEffect(() => {
    fetchRecords();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecords(true);
  }, [user]);


  /**
   * Search + category filtering.
   *
   * The API already returns only this user's complaints.
   * These filters are applied locally.
   */
  const filtered = records.filter((record) => {
    // Category filter
    if (category) {
      const recordCategory =
        record.category ||
        record.issueCategory ||
        record.complaintCategory ||
        '';

      if (recordCategory !== category) {
        return false;
      }
    }

    // Search filter
    if (!search.trim()) {
      return true;
    }

    const q = search.toLowerCase().trim();

    return (
      record.vendorName?.toLowerCase().includes(q) ||
      record.district?.toLowerCase().includes(q) ||
      record.description?.toLowerCase().includes(q) ||
      record.trackingCode?.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.headerTitle}>
          Transparency Register
        </Text>

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
              <Text
                style={{
                  color: '#94A3B8',
                  fontSize: 16,
                }}
              >
                ✕
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category filter chips */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
          }}
        >
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.filterChip,
                category === item.id &&
                styles.filterChipActive,
              ]}
              onPress={() => setCategory(item.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  category === item.id &&
                  styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Records Feed */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator
              size="large"
              color={Colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading your transparency register…
            </Text>
          </View>
        ) : !user ? (
          <View style={styles.emptyState}>
            <Text
              style={{
                fontSize: 44,
                marginBottom: 12,
              }}
            >
              🔐
            </Text>

            <Text style={styles.emptyTitle}>
              Login Required
            </Text>

            <Text style={styles.emptySub}>
              Please log in to view your registered complaints.
            </Text>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() =>
                navigation?.navigate('Login')
              }
            >
              <Text style={styles.loginButtonText}>
                Login
              </Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text
              style={{
                fontSize: 44,
                marginBottom: 12,
              }}
            >
              📋
            </Text>

            <Text style={styles.emptyTitle}>
              No Registered Complaints
            </Text>

            <Text style={styles.emptySub}>
              {search
                ? `No complaints matching "${search}"`
                : category
                  ? 'No complaints found in this category.'
                  : 'You have not registered any complaints yet.'}
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <ComplaintCard
              key={item._id}
              complaint={item}
              showVote={false}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('Track', {
                    initialCode: item.trackingCode,
                  });
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
  flex: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

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

  backBtn: {
    padding: 4,
    width: 36,
  },

  backArrow: {
    fontSize: 28,
    color: '#1E293B',
    fontWeight: '300',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },

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

  searchIcon: {
    fontSize: 16,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    padding: 0,
  },

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

  filterText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

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
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },

  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },

  loginButton: {
    marginTop: 18,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});