import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Colors, Radius } from '../constants/colors';

interface AboutScreenProps { navigation?: any; }

export default function AboutScreen({ navigation }: AboutScreenProps = {}) {
  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>About FDA SafeWatch</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Brand Card */}
        <View style={styles.brandCard}>
          <Image
            source={require('../assets/app-logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.appName}>FDA SafeWatch</Text>
          <Text style={styles.tagline}>Food Safety, Healthy India</Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Mission */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardBody}>
            FDA SafeWatch empowers citizens to report food safety violations directly to regulatory authorities.
            By bridging the gap between the public and the Food Safety & Standards Authority of India (FSSAI),
            we ensure faster resolution of food safety concerns across India.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Key Features</Text>
          {[
            { icon: '📝', text: 'File food safety complaints in minutes' },
            { icon: '🔍', text: 'Real-time complaint tracking' },
            { icon: '📷', text: 'Barcode scanner for product safety info' },
            { icon: '🏛️', text: 'Transparency register of resolved cases' },
            { icon: '🤖', text: 'AI-powered duplicate detection' },
            { icon: '🔒', text: 'Secure end-to-end complaint handling' },
          ].map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Legal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legal</Text>
          <Text style={styles.cardBody}>
            This application is governed by the Food Safety and Standards Act, 2006. All complaints are handled
            in accordance with FSSAI regulations and the Information Technology Act, 2000.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.cardBody}>
            Product safety data is sourced from OpenFoodFacts, an open food products database made by everyone,
            for everyone. It is available under the Open Database Licence.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLine}>© 2026 Government of India</Text>
          <Text style={styles.footerLine}>Food Safety & Standards Authority of India</Text>
          <View style={styles.tricolor}>
            <View style={[styles.stripe, { backgroundColor: '#FF9933' }]} />
            <View style={[styles.stripe, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.stripe, { backgroundColor: '#138808' }]} />
          </View>
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
  brandCard: {
    alignItems: 'center', backgroundColor: Colors.primary,
    borderRadius: Radius.lg, padding: 32, marginBottom: 16,
  },
  logoImg: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 12,
  },
  appName: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginBottom: 4 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  versionPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: Radius.full },
  versionText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: Radius.lg,
    padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  cardBody: { fontSize: 13, color: '#475569', lineHeight: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  featureIcon: { fontSize: 18 },
  featureText: { fontSize: 13, color: '#1E293B', fontWeight: '500', flex: 1 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  footer: { alignItems: 'center', paddingTop: 24 },
  footerLine: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
  tricolor: { flexDirection: 'row', marginTop: 16, height: 5, width: 80, borderRadius: 2, overflow: 'hidden' },
  stripe: { flex: 1 },
});
