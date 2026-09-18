import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, FontSizes, Radius, Spacing } from '../constants/colors';
import { COMPLAINT_CATEGORIES } from '../constants/categories';

interface ComplaintCardProps {
  complaint: any;
  onPress?: () => void;
  onVote?: () => void;
  showVote?: boolean;
  hasVoted?: boolean;
}

export default function ComplaintCard({
  complaint,
  onPress,
  onVote,
  showVote = true,
  hasVoted = false,
}: ComplaintCardProps) {
  const catObj = COMPLAINT_CATEGORIES.find((c) => c.id === complaint.category);
  const categoryLabel = catObj?.label || complaint.category || 'Food Safety Issue';
  const postDate = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleDateString('en-US')
    : '9/18/2026';

  const statusLabel =
    complaint.status === 'submitted'
      ? 'Submitted'
      : complaint.status === 'under_review'
      ? 'Under Review'
      : complaint.status === 'action_taken'
      ? 'Action Taken'
      : complaint.status === 'resolved'
      ? 'Resolved'
      : complaint.status === 'closed'
      ? 'Closed'
      : 'Submitted';

  const locationStr = complaint.address
    ? complaint.district
      ? `${complaint.address} (${complaint.district})`
      : complaint.address
    : complaint.district || 'Maharashtra';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Left Vote Column */}
      {showVote && (
        <TouchableOpacity
          style={[styles.voteBox, hasVoted && styles.voteBoxActive]}
          onPress={onVote}
          activeOpacity={0.7}
        >
          <Text style={[styles.voteArrow, hasVoted && styles.voteArrowActive]}>▲</Text>
          <Text style={[styles.voteNumber, hasVoted && styles.voteNumberActive]}>
            {complaint.upvotes || 0}
          </Text>
          <Text style={[styles.voteLabel, hasVoted && styles.voteLabelActive]}>
            {hasVoted ? 'VOTED' : 'VOTE'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Right Details Column */}
      <View style={styles.contentCol}>
        {/* Top Pills Row */}
        <View style={styles.pillsRow}>
          <View style={styles.trackingPill}>
            <Text style={styles.trackingText}>{complaint.trackingCode || 'FDA-2026-000001'}</Text>
          </View>

          <View
            style={[
              styles.statusPill,
              complaint.status === 'resolved'
                ? styles.statusPillGreen
                : complaint.status === 'under_review'
                ? styles.statusPillBlue
                : styles.statusPillAmber,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                complaint.status === 'resolved'
                  ? styles.statusTextGreen
                  : complaint.status === 'under_review'
                  ? styles.statusTextBlue
                  : styles.statusTextAmber,
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Issue / Category Title */}
        <Text style={styles.title} numberOfLines={1}>
          {categoryLabel}
        </Text>

        {/* Vendor & Location */}
        <Text style={styles.vendorText} numberOfLines={1}>
          Vendor: <Text style={styles.vendorBold}>{complaint.vendorName || 'Local Vendor'}</Text>{' '}
          <Text style={styles.vendorLoc}>({locationStr})</Text>
        </Text>

        {/* Description snippet if present */}
        {complaint.description ? (
          <Text style={styles.descText} numberOfLines={2}>
            {complaint.description}
          </Text>
        ) : null}

        {/* Category & Posted Date Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerCategory}>Category: {categoryLabel}</Text>
          <Text style={styles.footerPosted}>Posted: {postDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  voteBox: {
    width: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  voteBoxActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  voteArrow: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  voteArrowActive: {
    color: '#2563EB',
  },
  voteNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 1,
  },
  voteNumberActive: {
    color: '#2563EB',
  },
  voteLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  voteLabelActive: {
    color: '#2563EB',
  },
  contentCol: {
    flex: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trackingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.3,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillAmber: {
    backgroundColor: '#FEF3C7',
  },
  statusPillBlue: {
    backgroundColor: '#E0E7FF',
  },
  statusPillGreen: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextAmber: {
    color: '#D97706',
  },
  statusTextBlue: {
    color: '#4F46E5',
  },
  statusTextGreen: {
    color: '#15803D',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  vendorText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 18,
  },
  vendorBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  vendorLoc: {
    color: '#64748B',
  },
  descText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  footerCategory: {
    fontSize: 11,
    color: '#94A3B8',
  },
  footerPosted: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
