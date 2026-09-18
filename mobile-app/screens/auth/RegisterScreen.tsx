import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { Colors, FontSizes, Radius, Spacing } from '../../constants/colors';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authAPI, userAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { LANGUAGES } from '../../constants/categories';

interface RegisterScreenProps {
  navigation?: any;
  onNavigateLogin?: () => void;
  onOtpVerify?: (emailOrPhone: string) => void;
}

export default function RegisterScreen({
  navigation,
  onNavigateLogin,
  onOtpVerify,
}: RegisterScreenProps = {}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [language, setLanguage] = useState('en');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Enter a valid email address';
    }
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!agreed) errs.agreed = 'You must agree to the terms';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Generate a unique email if not provided (backend requires email)
      const emailToSend = form.email.trim().toLowerCase() ||
        `${form.phone.trim()}@fdaapp.gov.in`;

      const { data } = await authAPI.register({
        name: form.name.trim(),
        email: emailToSend,
        phone: form.phone.trim(),
        password: form.password,
      });
      await setAuth({ ...data.user, preferredLanguage: language }, data.token);
      await useLanguageStore.getState().setLanguage(language as any);
      try {
        await userAPI.updateProfile({ preferredLanguage: language });
      } catch (_) {}
      if (navigation) navigation.navigate('MainTabs');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Please check your connection and try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
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

        <View style={styles.card}>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Join us in making food safer for India.</Text>

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={form.name}
            onChangeText={(v) => update('name', v)}
            error={errors.name}
          />

          <Input
            label="Mobile Number *"
            placeholder="Enter 10-digit mobile number"
            value={form.phone}
            onChangeText={(v) => update('phone', v)}
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phone}
            leftIcon={<Text style={styles.prefix}>+91</Text>}
          />

          <Input
            label="Email Address (optional)"
            placeholder="Enter email address"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Create Password"
            placeholder="At least 6 characters"
            value={form.password}
            onChangeText={(v) => update('password', v)}
            isPassword
            error={errors.password}
          />

          {/* Preferred Language */}
          <Text style={styles.sectionLabel}>Preferred Language</Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                style={[styles.langChip, language === lang.code && styles.langChipActive]}
              >
                <Text style={[styles.langText, language === lang.code && styles.langTextActive]}>
                  {lang.label.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Terms checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => {
              setAgreed(!agreed);
              setErrors((e) => ({ ...e, agreed: '' }));
            }}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Terms of Use</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.agreed ? <Text style={styles.errorText}>{errors.agreed}</Text> : null}

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.createBtn}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateLogin}>
              <Text style={styles.loginLink}>Login</Text>
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
  topHeader: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, alignItems: 'center' },
  backBtn: { position: 'absolute', left: 20, top: 50, padding: 6 },
  backArrow: { fontSize: 28, color: '#1E293B', fontWeight: '300' },
  centerBrand: { alignItems: 'center' },
  emblemImage: { width: 32, height: 52, marginBottom: 6 },
  brandTitle: { fontSize: 18, fontWeight: '900', color: '#0F4C3A' },
  brandSub: { fontSize: 11, color: '#64748B' },
  card: { paddingHorizontal: 24, paddingTop: 10 },
  title: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#64748B', marginBottom: 20 },
  prefix: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 8, marginTop: 4 },
  langRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  langChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0' },
  langChipActive: { borderColor: '#0F4C3A', backgroundColor: '#EAF4F1' },
  langText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  langTextActive: { color: '#0F4C3A', fontWeight: '700' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: '#CBD5E1', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: '#0F4C3A', backgroundColor: '#0F4C3A' },
  checkMark: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  termsText: { fontSize: 12, color: '#64748B', flex: 1 },
  termsLink: { color: '#0F4C3A', fontWeight: '700' },
  errorText: { fontSize: 11, color: '#EF4444', marginBottom: 12, marginTop: -8 },
  createBtn: { marginTop: 8 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { fontSize: 13, color: '#64748B' },
  loginLink: { fontSize: 13, color: '#0F4C3A', fontWeight: '800' },
});
