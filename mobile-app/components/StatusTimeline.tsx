import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing } from '../constants/colors';
import { STATUS_CONFIG } from '../constants/categories';

interface TimelineEvent {
  status: string;
  at: string;
  publicNote?: string;
}

interface StatusTimelineProps {
  history: TimelineEvent[];
  actionNotes?: any[];
}

export default function StatusTimeline({ history, actionNotes = [] }: StatusTimelineProps) {
  const allEvents: Array<{ status: string; at: string; publicNote?: string; type: string; actionType?: string }> = [
    ...history.map((h) => ({ ...h, type: 'status', actionType: undefined })),
    ...actionNotes.map((n) => ({
      status: 'action',
      at: n.at,
      publicNote: n.publicNote || n.note,
      type: 'action',
      actionType: n.actionType,
    })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const ACTION_TYPE_LABELS: Record<string, string> = {
    warning_issued: '⚠️ Warning Issued',
    fine_imposed: '💰 Fine Imposed',
    license_suspended: '🔒 License Suspended',
    sample_sent_to_lab: '🧪 Sample Sent to Lab',
    no_violation_found: '✅ No Violation Found',
    other: '📝 Action Taken',
  };

  return (
    <View style={styles.container}>
      {allEvents.map((event, index) => {
        const isLast = index === allEvents.length - 1;
        const config = STATUS_CONFIG[event.status];
        const isAction = event.type === 'action';
        const date = new Date(event.at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        const time = new Date(event.at).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <View key={index} style={styles.eventRow}>
            {/* Line */}
            <View style={styles.lineContainer}>
              <View
                style={[
                  styles.dot,
                  isAction
                    ? styles.actionDot
                    : { backgroundColor: config?.color || Colors.textMuted },
                ]}
              >
                <Text style={styles.dotIcon}>
                  {isAction ? '⚡' : config?.icon || '📋'}
                </Text>
              </View>
              {!isLast && <View style={styles.line} />}
            </View>

            {/* Content */}
            <View style={[styles.content, !isLast && styles.contentGap]}>
              <View style={styles.eventHeader}>
                <Text
                  style={[
                    styles.eventTitle,
                    isAction
                      ? styles.actionTitle
                      : { color: config?.color || Colors.textMuted },
                  ]}
                >
                  {isAction
                    ? (event.actionType ? ACTION_TYPE_LABELS[event.actionType] : undefined) || '📝 Action Taken'
                    : config?.label || event.status}
                </Text>
                <Text style={styles.timestamp}>
                  {date} · {time}
                </Text>
              </View>
              {event.publicNote ? (
                <Text style={styles.note}>{event.publicNote}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: Spacing.sm },
  eventRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  lineContainer: {
    alignItems: 'center',
    width: 32,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDot: { backgroundColor: '#FEF3C7' },
  dotIcon: { fontSize: 14 },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    minHeight: 20,
    marginVertical: 4,
  },
  content: {
    flex: 1,
    paddingBottom: Spacing.base,
  },
  contentGap: { paddingBottom: Spacing.lg },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  eventTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    flex: 1,
  },
  actionTitle: { color: Colors.warning },
  timestamp: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  note: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
});
