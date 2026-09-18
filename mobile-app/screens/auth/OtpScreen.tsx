import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Colors, FontSizes, Radius, Spacing } from '../../constants/colors';
import Button from '../../components/ui/Button';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';

interface OtpScreenProps {
  navigation?: any;
  emailOrPhone?: string;
  onBack?: () => void;
}

export default function OtpScreen({
  navigation,
  emailOrPhone: initialIdentifier = '',
  onBack,
}: OtpScreenProps = {}) {
  const [step, setStep] = useState<'request' | 'verify'>(initialIdentifier ? 'verify' : 'request');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const refs = useRef<TextInput[]>([]);
  const setAuth = useAuthStore((s) => s.setAuth);

  const startCountdown = () => {
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleRequestOtp = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Enter your mobile number or email');
      return;
    }
    setLoading(true);
    try {
      await authAPI.requestOtp({ emailOrPhone: identifier.trim() });
      setStep('verify');
      startCountdown();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send OTP. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    }
    if (!value && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Error', 'Enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOtp({ emailOrPhone: identifier.trim(), otp: code });
      await setAuth(data.user, data.token);
      if (data.user?.preferredLanguage) {
        await useLanguageStore.getState().setLanguage(data.user.preferredLanguage as any);
      }
      if (navigation) navigation.navigate('MainTabs');
    } catch (err: any) {
      Alert.alert('Invalid OTP', err?.response?.data?.message || 'The OTP entered is incorrect or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
          <Image
            source={require('../../assets/emblem.png')}
            style={styles.emblemImage}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>FDA SafeWatch</Text>
          <Text style={styles.brandSub}>Food Safety, Healthy India</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Verify Your Mobile Number</Text>
        <Text style={styles.subtitle}>
          We have sent a 6-digit OTP to{'\n'}
          <Text style={styles.highlightText}>{identifier || '+91 98765 43210'}</Text>
        </Text>

        {/* 6 OTP boxes matching Screen 5 */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => {
                if (r) refs.current[i] = r;
              }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              maxLength={1}
              keyboardType="numeric"
              value={digit}
              onChangeText={(v) => handleOtpChange(v, i)}
              textAlign="center"
              autoFocus={i === 0}
            />
          ))}
        </View>

        <Text style={styles.resendText}>
          {countdown > 0 ? `Resend OTP in 00:${countdown < 10 ? '0' + countdown : countdown}` : ''}
        </Text>
        {countdown === 0 && (
          <TouchableOpacity onPress={handleRequestOtp} style={styles.resendBtn}>
            <Text style={styles.resendLink}>Resend OTP Now</Text>
          </TouchableOpacity>
        )}

        <Button
          title="Verify & Continue"
          onPress={step === 'request' ? handleRequestOtp : handleVerify}
          loading={loading}
          fullWidth
          size="lg"
          style={styles.actionBtn}
        />

        <TouchableOpacity
          onPress={() => {
            setStep('request');
            setOtp(['', '', '', '', '', '']);
          }}
          style={styles.changeRow}
        >
          <Text style={styles.changeText}>Change Mobile Number</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
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
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  highlightText: {
    fontWeight: '800',
    color: '#1E293B',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F4C3A',
    backgroundColor: '#F8FAFC',
  },
  otpBoxFilled: {
    borderColor: '#0F4C3A',
    backgroundColor: '#EAF4F1',
  },
  resendText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 24,
  },
  resendBtn: {
    marginBottom: 24,
  },
  resendLink: {
    fontSize: 13,
    color: '#0F4C3A',
    fontWeight: '700',
  },
  actionBtn: {
    width: '100%',
    marginBottom: 20,
  },
  changeRow: {
    padding: 8,
  },
  changeText: {
    fontSize: 13,
    color: '#0F4C3A',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
