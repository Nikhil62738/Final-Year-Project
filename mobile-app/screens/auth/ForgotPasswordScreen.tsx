import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Colors, FontSizes, Radius, Spacing } from '../../constants/colors';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authAPI } from '../../services/api';

interface ForgotPasswordScreenProps {
  navigation?: any;
  onBack?: () => void;
  onSuccess?: () => void;
}

export default function ForgotPasswordScreen({
  navigation,
  onBack,
  onSuccess,
}: ForgotPasswordScreenProps = {}) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (!emailOrPhone.trim()) {
      Alert.alert('Error', 'Enter your registered mobile number or email');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPasswordRequest({ emailOrPhone: emailOrPhone.trim() });
      setStep('reset');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Account not found. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!otp || !newPassword) {
      Alert.alert('Error', 'Enter OTP and new password');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPasswordVerify({
        emailOrPhone: emailOrPhone.trim(),
        otp,
        newPassword,
      });
      Alert.alert('Success', 'Password reset successfully!', [
        {
          text: 'Login',
          onPress: () => {
            if (onSuccess) onSuccess();
            else if (navigation) navigation.navigate('Login');
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => {
              if (onBack) onBack();
              else if (navigation) navigation.goBack();
            }}
            style={styles.backBtn}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={styles.centerBrand}>
            <Text style={styles.brandTitle}>Aaharmitra</Text>
            <Text style={styles.brandSub}>Food Safety, Healthy India</Text>
          </View>
        </View>

        <View style={styles.card}>
          {step === 'request' ? (
            <>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Enter your registered mobile number or email. We'll send you an OTP to reset your password.
              </Text>
              <Input
                label="Mobile Number or Email"
                placeholder="Enter mobile number or email"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Button
                title="Send Reset OTP"
                onPress={handleRequest}
                loading={loading}
                fullWidth
                size="lg"
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Enter OTP & New Password</Text>
              <Text style={styles.subtitle}>
                OTP sent to <Text style={styles.highlight}>{emailOrPhone}</Text>
              </Text>
              <Input
                label="OTP"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
              />
              <Input
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                isPassword
              />
              <Button
                title="Reset Password"
                onPress={handleReset}
                loading={loading}
                fullWidth
                size="lg"
              />
              <TouchableOpacity
                onPress={() => setStep('request')}
                style={styles.resendRow}
              >
                <Text style={styles.resendText}>← Change mobile/email</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flexGrow: 1, paddingBottom: 40 },
  topHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    top: 50,
    padding: 6,
  },
  backArrow: {
    fontSize: 28,
    color: '#1E293B',
    fontWeight: '300',
  },
  centerBrand: {
    alignItems: 'center',
  },
  emblemImage: {
    width: 32,
    height: 52,
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F4C3A',
  },
  brandSub: {
    fontSize: 11,
    color: '#64748B',
  },
  card: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 24,
  },
  highlight: {
    color: '#0F4C3A',
    fontWeight: '700',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 13,
    color: '#0F4C3A',
    fontWeight: '600',
  },
});
