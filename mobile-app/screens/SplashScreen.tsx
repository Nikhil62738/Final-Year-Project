import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLanguageStore } from '../store/languageStore';
import { Language } from '../i18n/translations';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const { language, setLanguage } = useLanguageStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');

    // Subtle breathing pulse for emblem & branding
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    // Auto-advance after 2.8s
    const timer = setTimeout(() => {
      onDone();
    }, 2800);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, []);

  const cycleLanguage = () => {
    const sequence: Language[] = ['en', 'hi', 'mr'];
    const nextIdx = (sequence.indexOf(language) + 1) % sequence.length;
    setLanguage(sequence[nextIdx]);
  };

  const getLanguageLabel = () => {
    switch (language) {
      case 'hi':
        return 'HI';
      case 'mr':
        return 'MR';
      default:
        return 'EN';
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFCF9" />

      {/* Top Header with Language Selector matching Image 2 */}
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <TouchableOpacity
          style={styles.langPill}
          onPress={cycleLanguage}
          activeOpacity={0.7}
        >
          <Text style={styles.langGlobe}>🌐</Text>
          <Text style={styles.langText}>{getLanguageLabel()}</Text>
          <Text style={styles.langChevron}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* Center Content: Lion Emblem (Image 3) + National Identity */}
      <Animated.View
        style={[
          styles.mainContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.titleText}>Aaharmitra</Text>
        <Text style={styles.subtitleText}>Food Safety, Healthy India</Text>

        {/* Indian Tricolor Mini Accent Bar */}
        <View style={styles.tricolorBar}>
          <View style={[styles.tricolorSegment, { backgroundColor: '#FF9933' }]} />
          <View
            style={[
              styles.tricolorSegment,
              { backgroundColor: '#FFFFFF', borderWidth: 0.5, borderColor: '#D1D5DB' },
            ]}
          />
          <View style={[styles.tricolorSegment, { backgroundColor: '#138808' }]} />
        </View>

        {/* Taglines */}
        <Text style={styles.taglineMain}>Scan • Report • Track • Stay Safe</Text>
        <Text style={styles.taglineSub}>For Safer Food. A Healthier India.</Text>
      </Animated.View>

      {/* Monument Silhouettes & Sweeping Tricolor Wave Banner (Image 2) */}
      <View style={styles.artContainer}>
        <Image
          source={require('../assets/splash_monuments.png')}
          style={styles.monumentsArt}
          resizeMode="cover"
        />
      </View>

      {/* Loading Spinner & Bottom Footer matching Image 2 */}
      <View style={styles.bottomSection}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color="#0E6E4E" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>

        {/* Divider with Government Initiative note */}
        <View style={styles.footerRow}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>A Government of India Initiative</Text>
          <View style={styles.footerLine} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FCFCF9',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    zIndex: 10,
  },
  topBarSpacer: {
    flex: 1,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF3EE',
    borderWidth: 1,
    borderColor: '#D2E7DD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 5,
  },
  langGlobe: {
    fontSize: 14,
  },
  langText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F4C3A',
  },
  langChevron: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F4C3A',
    marginTop: -1,
  },
  mainContent: {
    alignItems: 'center',
    paddingHorizontal: 28,
    marginTop: 6,
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emblemImage: {
    width: 64,
    height: 106,
  },
  satyamevaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
    letterSpacing: 0.4,
  },
  govText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  titleText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0D4B38',
    letterSpacing: -0.5,
    marginTop: 18,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : undefined,
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10523E',
    marginTop: 4,
  },
  tricolorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 14,
    marginBottom: 14,
  },
  tricolorSegment: {
    width: 28,
    height: 4,
    borderRadius: 2,
  },
  taglineMain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    letterSpacing: 0.3,
  },
  taglineSub: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },
  artContainer: {
    width: width,
    height: 190,
    overflow: 'hidden',
    marginTop: 'auto',
    marginBottom: 6,
  },
  monumentsArt: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
    paddingHorizontal: 24,
  },
  spinnerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    paddingHorizontal: 12,
  },
});
