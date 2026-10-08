import React, { useState, useRef, useEffect } from 'react';
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

import Button from '../../components/ui/Button';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';

interface OtpScreenProps {
  navigation?: any;
  route?: any;
  emailOrPhone?: string;
  onBack?: () => void;
}

export default function OtpScreen({
  navigation,
  route,
  emailOrPhone: initialIdentifier = '',
  onBack,
}: OtpScreenProps = {}) {

  // Support both:
  // emailOrPhone prop
  // and React Navigation route.params.emailOrPhone
  const routeIdentifier =
    route?.params?.emailOrPhone || initialIdentifier || '';

  const [step, setStep] = useState<'request' | 'verify'>(
    routeIdentifier ? 'verify' : 'request'
  );

  const [identifier, setIdentifier] = useState(routeIdentifier);

  const [otp, setOtp] = useState([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(
    routeIdentifier ? 30 : 0
  );

  const refs = useRef<TextInput[]>([]);
  const setAuth = useAuthStore((s) => s.setAuth);

  // --------------------------------------------------
  // Countdown
  // --------------------------------------------------

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  // --------------------------------------------------
  // Start Countdown
  // --------------------------------------------------

  const startCountdown = () => {
    setCountdown(30);
  };

  // --------------------------------------------------
  // Format Mobile Number For Display
  // --------------------------------------------------

  const formatMobileNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');

    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }

    return number;
  };

  // --------------------------------------------------
  // Request OTP
  // --------------------------------------------------

  const handleRequestOtp = async () => {
    const mobile = identifier.trim().replace(/\D/g, '');

    if (!mobile) {
      Alert.alert(
        'Error',
        'Please enter your mobile number'
      );
      return;
    }

    if (mobile.length !== 10) {
      Alert.alert(
        'Invalid Mobile Number',
        'Please enter a valid 10-digit mobile number'
      );
      return;
    }

    setLoading(true);

    try {
      await authAPI.requestOtp({
        emailOrPhone: mobile,
      });

      setIdentifier(mobile);

      setOtp([
        '',
        '',
        '',
        '',
        '',
        '',
      ]);

      setStep('verify');

      startCountdown();

      Alert.alert(
        'OTP Sent',
        `OTP has been sent to +91 ${mobile}`
      );
    } catch (err: any) {
      console.error('OTP request error:', err);

      Alert.alert(
        'Error',
        err?.response?.data?.message ||
          'Failed to send OTP. Check backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // OTP Input
  // --------------------------------------------------

  const handleOtpChange = (
    value: string,
    index: number
  ) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');

    const newOtp = [...otp];

    newOtp[index] = numericValue.slice(-1);

    setOtp(newOtp);

    if (numericValue && index < 5) {
      refs.current[index + 1]?.focus();
    }

    if (!numericValue && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  // --------------------------------------------------
  // Verify OTP
  // --------------------------------------------------

  const handleVerify = async () => {
    const code = otp.join('');

    if (code.length !== 6) {
      Alert.alert(
        'Error',
        'Enter the complete 6-digit OTP'
      );
      return;
    }

    if (!identifier.trim()) {
      Alert.alert(
        'Error',
        'Mobile number is missing'
      );
      return;
    }

    setLoading(true);

    try {
      const { data } = await authAPI.verifyOtp({
        emailOrPhone: identifier.trim(),
        otp: code,
      });

      await setAuth(
        data.user,
        data.token
      );

      if (data.user?.preferredLanguage) {
        await useLanguageStore
          .getState()
          .setLanguage(
            data.user.preferredLanguage as any
          );
      }

      if (navigation) {
        navigation.navigate('MainTabs');
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);

      Alert.alert(
        'Invalid OTP',
        err?.response?.data?.message ||
          'The OTP entered is incorrect or has expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Change Mobile Number
  // --------------------------------------------------

  const handleChangeMobile = () => {
    setStep('request');

    setIdentifier('');

    setOtp([
      '',
      '',
      '',
      '',
      '',
      '',
    ]);

    setCountdown(0);
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >

      {/* Header */}

      <View style={styles.topHeader}>

        <TouchableOpacity
          onPress={() => {
            if (onBack) {
              onBack();
            } else if (navigation) {
              navigation.goBack();
            }
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backArrow}>
            ‹
          </Text>
        </TouchableOpacity>

        <View style={styles.centerBrand}>

          <Text style={styles.brandTitle}>
            Aaharmitra
          </Text>

          <Text style={styles.brandSub}>
            Food Safety, Healthy India
          </Text>

        </View>

      </View>

      {/* Main Card */}

      <View style={styles.card}>

        {step === 'request' ? (

          <>
            <Text style={styles.title}>
              Enter Your Mobile Number
            </Text>

            <Text style={styles.subtitle}>
              Enter your 10-digit mobile number to
              receive an OTP
            </Text>

            <View style={styles.mobileInputContainer}>

              <Text style={styles.countryCode}>
                +91
              </Text>

              <TextInput
                style={styles.mobileInput}
                placeholder="Enter mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                value={identifier}
                onChangeText={(value) => {
                  const numericValue =
                    value.replace(/\D/g, '');

                  setIdentifier(
                    numericValue
                  );
                }}
              />

            </View>

            <Button
              title="Send OTP"
              onPress={handleRequestOtp}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.actionBtn}
            />

          </>

        ) : (

          <>

            <Text style={styles.title}>
              Verify Your Mobile Number
            </Text>

            <Text style={styles.subtitle}>
              We have sent a 6-digit OTP to{'\n'}

              <Text style={styles.highlightText}>
                {formatMobileNumber(identifier)}
              </Text>
            </Text>

            {/* OTP Boxes */}

            <View style={styles.otpRow}>

              {otp.map((digit, i) => (

                <TextInput
                  key={i}
                  ref={(r) => {
                    if (r) {
                      refs.current[i] = r;
                    }
                  }}
                  style={[
                    styles.otpBox,
                    digit
                      ? styles.otpBoxFilled
                      : null,
                  ]}
                  maxLength={1}
                  keyboardType="numeric"
                  value={digit}
                  onChangeText={(value) =>
                    handleOtpChange(
                      value,
                      i
                    )
                  }
                  textAlign="center"
                  autoFocus={i === 0}
                />

              ))}

            </View>

            {/* Resend */}

            <Text style={styles.resendText}>

              {countdown > 0
                ? `Resend OTP in 00:${
                    countdown < 10
                      ? '0' + countdown
                      : countdown
                  }`
                : ''}

            </Text>

            {countdown === 0 && (

              <TouchableOpacity
                onPress={handleRequestOtp}
                style={styles.resendBtn}
              >

                <Text style={styles.resendLink}>
                  Resend OTP Now
                </Text>

              </TouchableOpacity>

            )}

            {/* Verify */}

            <Button
              title="Verify & Continue"
              onPress={handleVerify}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.actionBtn}
            />

            {/* Change Number */}

            <TouchableOpacity
              onPress={handleChangeMobile}
              style={styles.changeRow}
            >

              <Text style={styles.changeText}>
                Change Mobile Number
              </Text>

            </TouchableOpacity>

          </>

        )}

      </View>

    </KeyboardAvoidingView>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({

  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

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

  // Mobile number input

  mobileInputContainer: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginBottom: 24,
    paddingHorizontal: 14,
  },

  countryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 10,
  },

  mobileInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1E293B',
  },

  // OTP

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
