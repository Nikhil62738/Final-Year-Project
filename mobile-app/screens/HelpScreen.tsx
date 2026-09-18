import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Colors, Radius } from '../constants/colors';

interface HelpScreenProps { navigation?: any; }

const FAQ = [
  { q: 'How do I report a food safety issue?', a: 'Tap the "Report" tab in the bottom navigation. You will be guided through a 4-step process to describe the issue, add location, upload evidence, and submit.' },
  { q: 'Who can see my complaint?', a: 'Your complaint details are kept private. Only assigned FDA officers can view it. A summary may appear in the public Transparency Register without your personal details.' },
  { q: 'How long does it take to resolve a complaint?', a: 'Most complaints are acknowledged within 24 hours. Resolution typically takes 7–30 working days depending on the severity of the issue.' },
  { q: 'Can I track my complaint without logging in?', a: 'Yes! Use the Track tab and enter your complaint tracking code (e.g. FDA-2026-XXXXX) to check the status without logging in.' },
  { q: 'How do I scan a food product?', a: 'Tap the "Scan" tab and point your camera at the barcode on the food package. The app will retrieve product info and ingredient details from the OpenFoodFacts database.' },
  { q: 'I forgot my password. What do I do?', a: 'On the Login screen, tap "Forgot Password?" and enter your registered mobile number or email. An OTP will be sent to verify your identity.' },
];

export default function HelpScreen({ navigation }: HelpScreenProps = {}) {
  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Contact Banner */}
        <View style={styles.contactBanner}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactSub}>Reach out to the FDA SafeWatch support team</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('tel:1800112100')}>
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactLabel}>1800-11-2100</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:support@fssai.gov.in')}>
              <Text style={styles.contactIcon}>✉️</Text>
              <Text style={styles.contactLabel}>support@fssai.gov.in</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

        {FAQ.map((item, i) => (
          <View key={i} style={styles.faqCard}>
            <Text style={styles.question}>❓ {item.q}</Text>
            <Text style={styles.answer}>{item.a}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>FDA SafeWatch is an initiative of the</Text>
          <Text style={styles.footerBold}>Food Safety & Standards Authority of India (FSSAI)</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4, width: 36 },
  backArrow: { fontSize: 28, color: '#1E293B', fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  content: { padding: 16 },
  contactBanner: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    padding: 20, marginBottom: 24,
  },
  contactTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginBottom: 4 },
  contactSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.md,
    paddingVertical: 12, alignItems: 'center', gap: 4,
  },
  contactIcon: { fontSize: 20 },
  contactLabel: { fontSize: 11, color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  faqTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  faqCard: {
    backgroundColor: '#FFFFFF', borderRadius: Radius.lg, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10,
  },
  question: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 8, lineHeight: 18 },
  answer: { fontSize: 13, color: '#475569', lineHeight: 19 },
  footer: { alignItems: 'center', paddingTop: 24 },
  footerText: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
  footerBold: { fontSize: 12, color: '#64748B', fontWeight: '700', textAlign: 'center', marginTop: 2 },
});
