import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Colors, Radius, FontSizes, Spacing } from '../constants/colors';
import api from '../services/api';

interface HelpScreenProps { navigation?: any; }

type Message = { id: string; sender: 'bot' | 'user'; text: string };

const FAQ = [
  { q: 'How do I report a food safety issue?', a: 'Tap the "Report" tab in the bottom navigation. You will be guided through a 4-step process to describe the issue, add location, upload evidence, and submit.' },
  { q: 'Who can see my complaint?', a: 'Your complaint details are kept private. Only assigned FDA officers can view it. A summary may appear in the public Transparency Register without your personal details.' },
  { q: 'How long does it take to resolve a complaint?', a: 'Most complaints are acknowledged within 24 hours. Resolution typically takes 7–30 working days depending on the severity of the issue.' },
  { q: 'Can I track my complaint without logging in?', a: 'Yes! Use the Track tab and enter your complaint tracking code (e.g. FDA-2026-XXXXX) to check the status without logging in.' },
  { q: 'How do I scan a food product?', a: 'Tap the "Scan" tab and point your camera at the barcode on the food package. The app verifies FSSAI registration, checks ingredients and allergens, and shows a Nutri-Score. Only food barcodes are accepted.' },
  { q: 'How do Safety Alerts work?', a: 'Safety Alerts notify citizens about urgent food recalls, adulteration notices, and FSSAI advisories. You can find them on the Home screen under the "Safety Alerts" tab.' },
  { q: 'What is the Vendor Historical Profile?', a: 'When you view a complaint, tapping the vendor\'s name opens their full safety profile — including all past complaints, regulatory actions, citizen ratings, and risk score.' },
  { q: 'How do I rate a complaint resolution?', a: 'Once your complaint is resolved, a "Rate Resolution" option appears on the complaint detail page. You can give 1–5 stars and write feedback about the officer\'s action.' },
  { q: 'I forgot my password. What do I do?', a: 'On the Login screen, tap "Forgot Password?" and enter your registered mobile number or email. An OTP will be sent to verify your identity.' },
];

const QUICK_TOPICS = [
  { icon: '📝', title: 'File a complaint', answer: 'Tap the "Report" tab in the bottom navigation. Fill in vendor details, select category, upload evidence photos, and pin location on the map. You\'ll receive a tracking code immediately after submission.' },
  { icon: '🔍', title: 'Track my complaint', answer: 'Go to the "Track" tab and enter your 10-character tracking code (e.g. FDA-2026-ABCDE). You can view officer notes, inspection updates, and current status in real time — no login required.' },
  { icon: '📷', title: 'Scan a food product', answer: 'Open the "Scan" tab and point your camera at a food barcode. The app shows FSSAI license status, Nutri-Score, ingredient breakdown, allergen warnings, and a health safety score. Only food items are accepted.' },
  { icon: '🚨', title: 'View Safety Alerts', answer: 'On the Home screen, tap the "Safety Alerts" button. You will see the latest food recalls, adulteration notices, and FSSAI advisories for Maharashtra. Filter by Critical, Warning, or Advisory.' },
  { icon: '🏪', title: 'Vendor risk profiles', answer: 'In any complaint detail, tap the vendor\'s name to open their historical safety profile. It shows total complaints, resolved cases, past regulatory actions, citizen satisfaction ratings, and an automated risk score.' },
  { icon: '⭐', title: 'Rate a resolution', answer: 'After your complaint is marked "Resolved", a satisfaction rating form appears. Give 1–5 stars and optionally write feedback about the officer\'s action. Your review helps improve accountability.' },
  { icon: '🌐', title: 'Change language', answer: 'On the Home screen, tap the globe 🌐 icon at the top right to switch between English, Marathi, and Hindi. Your preference is saved automatically.' },
  { icon: '🔐', title: 'Login / Register', answer: 'Tap the "Login" or "Register" button on the Home screen. You need an account to submit complaints. Guest users can still track complaints and browse Safety Alerts without logging in.' },
];

const INITIAL_MESSAGE: Message = {
  id: '0',
  sender: 'bot',
  text: '👋 Hi! I\'m Aaharmitra, your food safety friend. Ask me about complaints, tracking, food scans, alerts, or other app features.',
};

export default function HelpScreen({ navigation }: HelpScreenProps = {}) {
  const [activeTab, setActiveTab] = useState<'faq' | 'chat'>('chat');
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const sendMessage = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    try {
      const { data } = await api.post('/api/assistant/ask', { question: text });
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: data.answer }]);
    } catch {
      const matched = QUICK_TOPICS.find(t => t.title.toLowerCase() === text.toLowerCase());
      const faqMatch = FAQ.find(f => text.toLowerCase().includes(f.q.toLowerCase().split(' ').slice(0, 3).join(' ')));
      const answer = matched?.answer || faqMatch?.a || findKeywordAnswer(text);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: answer }]);
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  function findKeywordAnswer(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('scan') || lower.includes('barcode')) return QUICK_TOPICS[2].answer;
    if (lower.includes('report') || lower.includes('complaint') || lower.includes('file')) return QUICK_TOPICS[0].answer;
    if (lower.includes('track') || lower.includes('status') || lower.includes('code')) return QUICK_TOPICS[1].answer;
    if (lower.includes('alert') || lower.includes('recall') || lower.includes('safety')) return QUICK_TOPICS[3].answer;
    if (lower.includes('vendor') || lower.includes('profile') || lower.includes('history')) return QUICK_TOPICS[4].answer;
    if (lower.includes('rate') || lower.includes('rating') || lower.includes('review')) return QUICK_TOPICS[5].answer;
    if (lower.includes('language') || lower.includes('marathi') || lower.includes('hindi')) return QUICK_TOPICS[6].answer;
    if (lower.includes('login') || lower.includes('register') || lower.includes('account')) return QUICK_TOPICS[7].answer;
    if (lower.includes('password') || lower.includes('forgot')) return FAQ[8].a;
    if (lower.includes('time') || lower.includes('long') || lower.includes('resolve')) return FAQ[2].a;
    return '🤖 I\'m not sure about that, but I can help with filing complaints, tracking status, scanning food items, safety alerts, or vendor profiles. Try tapping one of the quick topics below!';
  }

  const handleQuickTopic = (topic: typeof QUICK_TOPICS[0]) => {
    sendMessage(topic.title);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>🤖 Aaharmitra</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faq' && styles.tabActive]}
          onPress={() => setActiveTab('faq')}
        >
          <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>❓ FAQ</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'chat' ? (
        <View style={styles.flex}>
          {/* Chat Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.msgRow, msg.sender === 'user' ? styles.msgRowUser : styles.msgRowBot]}>
                {msg.sender === 'bot' && (
                  <View style={styles.botAvatar}>
                    <Text style={{ fontSize: 14 }}>🤖</Text>
                  </View>
                )}
                <View style={[styles.bubble, msg.sender === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
                  <Text style={[styles.bubbleText, msg.sender === 'user' && { color: '#fff' }]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}

            {/* Quick Topics */}
            <View style={styles.quickSection}>
              <Text style={styles.quickLabel}>QUICK TOPICS</Text>
              <View style={styles.quickGrid}>
                {QUICK_TOPICS.map((topic, i) => (
                  <TouchableOpacity key={i} style={styles.quickChip} onPress={() => handleQuickTopic(topic)}>
                    <Text style={styles.quickChipIcon}>{topic.icon}</Text>
                    <Text style={styles.quickChipText}>{topic.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask about complaints, scanning, alerts..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => inputText.trim() && sendMessage(inputText.trim())}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && { opacity: 0.4 }]}
              onPress={() => inputText.trim() && sendMessage(inputText.trim())}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.faqContent}>
          {/* Contact Banner */}
          <View style={styles.contactBanner}>
            <Text style={styles.contactTitle}>Need Live Help?</Text>
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
      )}
    </KeyboardAvoidingView>
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

  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    margin: 12,
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
  },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#0F172A', fontWeight: '800' },

  // Chat
  chatContent: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 16 },
  msgRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },
  botAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 13.5, color: '#1E293B', lineHeight: 20 },

  quickSection: { marginTop: 18, marginBottom: 8 },
  quickLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
  },
  quickChipIcon: { fontSize: 14 },
  quickChipText: { fontSize: 12.5, fontWeight: '700', color: '#334155' },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  chatInput: {
    flex: 1, backgroundColor: '#F1F5F9', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: '#1E293B',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },

  // FAQ
  faqContent: { padding: 16 },
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
