import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, FontSizes, Radius, Spacing } from '../constants/colors';
import StatusTimeline from '../components/StatusTimeline';
import ComplaintCard from '../components/ComplaintCard';
import Button from '../components/ui/Button';
import { complaintsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface TrackScreenProps {
  navigation?: any;
  route?: any;
  initialCode?: string;
}

export default function TrackComplaintScreen({
  navigation,
  route,
  initialCode = '',
}: TrackScreenProps = {}) {
  const codeParam = route?.params?.initialCode || initialCode;
  const [code, setCode] = useState(codeParam);
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [loadingMyComplaints, setLoadingMyComplaints] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((s) => s.user);

  const fetchMyComplaints = async (silent = false) => {
    if (!user) {
      setMyComplaints([]);
      return;
    }
    if (!silent) setLoadingMyComplaints(true);
    try {
      const { data } = await complaintsAPI.getMyHistory();
      setMyComplaints(Array.isArray(data) ? data : []);
    } catch {
      // silent catch
    } finally {
      setLoadingMyComplaints(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, [user]);

  useEffect(() => {
    if (codeParam) {
      setCode(codeParam);
      handleTrack(codeParam);
    }
  }, [codeParam]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyComplaints(true);
  }, [user]);

  const handleTrack = async (lookupCode?: string) => {
    const codeToSearch = (lookupCode || code).trim();
    if (!codeToSearch) {
      Alert.alert('Tracking Code Required', 'Please enter your FDA tracking code (e.g. FDA-2026-000001).');
      return;
    }
    setLoading(true);
    try {
      const { data } = await complaintsAPI.track(codeToSearch);
      setComplaint(data);
    } catch (err: any) {
      setComplaint(null);
      if (err?.response?.status === 404) {
        Alert.alert(
          'Complaint Not Found',
          `No food safety complaint found for code "${codeToSearch}". Please check the code and try again.`
        );
      } else {
        Alert.alert('Connection Error', 'Could not reach server. Please check your backend connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {complaint ? 'Complaint Investigation Details' : 'Track & Manage Complaints'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Search by Tracking Code Input Card */}
        <View style={styles.searchCard}>
          <Text style={styles.inputLabel}>Track by FDA Tracking Code</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. FDA-2026-000001"
              placeholderTextColor="#94A3B8"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.trackBtn} onPress={() => handleTrack()}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.trackBtnText}>Track</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>
            Enter any tracking code to view live officer inspection & resolution status.
          </Text>
        </View>

        {/* LOADING SINGLE COMPLAINT */}
        {loading && !complaint && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingSub}>Retrieving official inspection records…</Text>
          </View>
        )}

        {/* SINGLE COMPLAINT DETAIL & TIMELINE VIEW */}
        {complaint && !loading && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeaderRow}>
              <Text style={styles.sectionHeader}>Official Complaint Record</Text>
              <TouchableOpacity
                onPress={() => {
                  setComplaint(null);
                  setCode('');
                }}
              >
                <Text style={styles.viewAllLink}>‹ All My Complaints</Text>
              </TouchableOpacity>
            </View>

            <ComplaintCard complaint={complaint} showVote={false} />

            {/* Status Progress Timeline */}
            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>🏛️ Investigation & Resolution Progress</Text>
              <StatusTimeline
                history={
                  complaint.statusHistory || [
                    {
                      status: 'submitted',
                      at: complaint.createdAt || new Date().toISOString(),
                      publicNote: 'Complaint registered and verified in FDA SafeWatch.',
                    },
                  ]
                }
                actionNotes={complaint.actionNotes}
              />
            </View>

            {/* Officer Resolution Proof */}
            {complaint.resolutionProof && complaint.resolutionProof.length > 0 && (
              <View style={styles.proofBox}>
                <Text style={styles.proofTitle}>📸 Officer Resolution Proof</Text>
                <Text style={styles.proofSub}>Verified evidence provided by assigned Food Safety Officer.</Text>
              </View>
            )}

            <Button
              title="Track Another Code"
              variant="outline"
              onPress={() => {
                setComplaint(null);
                setCode('');
              }}
              fullWidth
              style={{ marginTop: 20 }}
            />
          </View>
        )}

        {/* MY REGISTERED COMPLAINTS LIST (Shown when no specific complaint is active) */}
        {!complaint && !loading && (
          <View style={styles.myComplaintsSection}>
            <View style={styles.myComplaintsHeaderRow}>
              <Text style={styles.myComplaintsTitle}>📋 My Registered Complaints</Text>
              <Text style={styles.myComplaintsCount}>
                {myComplaints.length} {myComplaints.length === 1 ? 'Report' : 'Reports'}
              </Text>
            </View>

            {loadingMyComplaints ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingSub}>Loading your registered complaints…</Text>
              </View>
            ) : !user ? (
              <View style={styles.authNoticeCard}>
                <Text style={{ fontSize: 28, marginBottom: 6 }}>🔒</Text>
                <Text style={styles.authNoticeTitle}>Log In to View Your Complaints</Text>
                <Text style={styles.authNoticeSub}>
                  Log in to see all food safety reports registered by your account and track their resolution status in one tap.
                </Text>
                <TouchableOpacity
                  style={styles.loginActionBtn}
                  onPress={() => navigation?.navigate('Login')}
                >
                  <Text style={styles.loginActionText}>Log In to Account</Text>
                </TouchableOpacity>
              </View>
            ) : myComplaints.length === 0 ? (
              <View style={styles.emptyMyComplaints}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>📝</Text>
                <Text style={styles.emptyTitle}>No Complaints Registered</Text>
                <Text style={styles.emptySub}>
                  You haven't filed any food safety reports yet. When you report an issue, it will automatically appear here with real-time status tracking.
                </Text>
                <TouchableOpacity
                  style={styles.reportNewBtn}
                  onPress={() => navigation?.navigate('Report')}
                >
                  <Text style={styles.reportNewBtnText}>+ Report a Food Issue</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myComplaints.map((item) => (
                <ComplaintCard
                  key={item._id}
                  complaint={item}
                  showVote={false}
                  onPress={() => {
                    setCode(item.trackingCode);
                    handleTrack(item.trackingCode);
                  }}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingBottom: 40 },
  topHeader: {
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
  backBtn: { padding: 4, width: 32 },
  backArrow: { fontSize: 28, color: '#1E293B' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  searchCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    fontWeight: '700',
  },
  trackBtn: {
    backgroundColor: '#0F4C3A',
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  hintText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingSub: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
  },
  resultContainer: {
    paddingHorizontal: 16,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F4C3A',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F4C3A',
    marginBottom: 14,
  },
  proofBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 12,
  },
  proofTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 2,
  },
  proofSub: {
    fontSize: 11,
    color: '#3B82F6',
  },
  myComplaintsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  myComplaintsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  myComplaintsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  myComplaintsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  authNoticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  authNoticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  authNoticeSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  loginActionBtn: {
    backgroundColor: '#0F4C3A',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
  },
  loginActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyMyComplaints: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  reportNewBtn: {
    backgroundColor: '#0F4C3A',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  reportNewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
