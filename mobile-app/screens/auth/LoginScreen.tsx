import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Colors, FontSizes, Radius, Spacing } from '../../constants/colors';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';

interface LoginScreenProps {
  navigation?: any;
  onNavigateRegister?: () => void;
  onNavigateForgotPassword?: () => void;
  onNavigateOtp?: () => void;
}

export default function LoginScreen({
  navigation,
  onNavigateRegister,
  onNavigateForgotPassword,
  onNavigateOtp,
}: LoginScreenProps = {}) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ emailOrPhone?: string; password?: string }>({});
  const setAuth = useAuthStore((s) => s.setAuth);

  const validate = () => {
    const errs: typeof errors = {};
    if (!emailOrPhone.trim()) errs.emailOrPhone = 'Enter your mobile number or email';
    if (!password) errs.password = 'Enter your password';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await authAPI.login({ emailOrPhone: emailOrPhone.trim(), password });
      await setAuth(data.user, data.token);
      if (data.user?.preferredLanguage) {
        await useLanguageStore.getState().setLanguage(data.user.preferredLanguage as any);
      }
      if (navigation) navigation.navigate('MainTabs');
    } catch (err: any) {
      Alert.alert(
        'Login Failed',
        err?.response?.data?.message || 'Invalid credentials. Please check your connection and credentials.'
      );
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
        {/* Top Header with Back and Emblem */}
        <View style={styles.topHeader}>
          {navigation && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
          )}
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

        {/* Form Card matching Screen 3 */}
        <View style={styles.card}>
          <Text style={styles.title}>Login to Your Account</Text>
          <Text style={styles.subtitle}>
            Access your complaints, saved products and get real-time updates.
          </Text>

          <Input
            label="Mobile Number or Email"
            placeholder="Enter mobile number or email"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.emailOrPhone}
          />

          <Input
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            isPassword
            error={errors.password}
          />

          <TouchableOpacity
            onPress={onNavigateForgotPassword}
            style={styles.forgotRow}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.loginBtn}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Continue with OTP"
            variant="outline"
            onPress={onNavigateOtp}
            fullWidth
            size="lg"
            leftIcon={<Text>📱</Text>}
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateRegister}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 24,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 12,
    color: '#0F4C3A',
    fontWeight: '700',
  },
  loginBtn: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 13,
    color: '#64748B',
  },
  registerLink: {
    fontSize: 13,
    color: '#0F4C3A',
    fontWeight: '800',
  },
});
