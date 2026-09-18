import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing, FontSizes } from '../../constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  disabled,
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: FontSizes.sm },
    md: { paddingVertical: 14, paddingHorizontal: 20, fontSize: FontSizes.base },
    lg: { paddingVertical: 18, paddingHorizontal: 28, fontSize: FontSizes.md },
  }[size];

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isDisabled}
        style={[fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}
        {...props}
      >
        <LinearGradient
          colors={isDisabled ? ['#CBD5E1', '#94A3B8'] : ['#0F4C3A', '#0B382B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, { paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {leftIcon}
              <Text style={[styles.primaryText, { fontSize: sizeStyles.fontSize }, textStyle]}>
                {title}
              </Text>
              {rightIcon}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, { container: ViewStyle; text: TextStyle }> = {
    secondary: {
      container: { backgroundColor: Colors.secondary },
      text: { color: Colors.textInverse },
    },
    outline: {
      container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
      text: { color: Colors.primary },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: { color: Colors.primary },
    },
    danger: {
      container: { backgroundColor: Colors.danger },
      text: { color: Colors.textInverse },
    },
  };

  const vs = variantStyles[variant] || variantStyles.outline;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.base,
        vs.container,
        { paddingVertical: sizeStyles.paddingVertical, paddingHorizontal: sizeStyles.paddingHorizontal },
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={vs.text.color} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, vs.text, { fontSize: sizeStyles.fontSize }, textStyle]}>
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  primaryText: {
    color: Colors.textInverse,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
