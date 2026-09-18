import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Radius } from '../../constants/colors';
import { STATUS_CONFIG } from '../../constants/categories';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status.replace('_', ' ').toUpperCase(),
    color: Colors.textMuted,
    icon: 'ℹ️',
  };

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${config.color}15`, borderColor: `${config.color}40` },
        isSmall && styles.badgeSm,
      ]}
    >
      <Text style={[styles.icon, isSmall && styles.iconSm]}>{config.icon}</Text>
      <Text
        style={[
          styles.label,
          { color: config.color },
          isSmall && styles.labelSm,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 4,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  icon: {
    fontSize: 12,
  },
  iconSm: {
    fontSize: 10,
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  labelSm: {
    fontSize: 10,
  },
});
