import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Colors, FontSizes, Radius, Spacing } from '../constants/colors';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { Language } from '../i18n/translations';
import { userAPI } from '../services/api';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation?: any;
  onReport?: () => void;
  onScan?: () => void;
  onTrack?: () => void;
  onTransparency?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
}

export default function HomeScreen({
  navigation,
  onReport,
  onScan,
  onTrack,
  onTransparency,
  onLogin,
  onRegister,
}: HomeScreenProps = {}) {
  const user = useAuthStore((s) => s.user);
  const { language, setLanguage, t } = useLanguageStore();
  
  const [liveLocation, setLiveLocation] = useState<string>('Detecting location…');
  const [locLoading, setLocLoading] = useState<boolean>(true);
  const [showLangModal, setShowLangModal] = useState<boolean>(false);

  // Live GPS Location Detection
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (geo) {
            const city = geo.city || geo.subregion || geo.district || 'Lonere';
            const state = geo.region || geo.country || 'Maharashtra';
            setLiveLocation(`${city}, ${state}`);
          } else {
            setLiveLocation('Mumbai, Maharashtra');
          }
        } else {
          setLiveLocation('Mumbai, Maharashtra');
        }
      } catch {
        setLiveLocation('Mumbai, Maharashtra');
      } finally {
        setLocLoading(false);
      }
    })();
  }, []);

  const handleSelectLanguage = async (newLang: Language) => {
    await setLanguage(newLang);
    setShowLangModal(false);
    if (user) {
      try {
        await userAPI.updateProfile({ preferredLanguage: newLang });
      } catch (_) {}
    }
  };

  const FEATURES = [
    {
      id: 'report',
      icon: '📝',
      label: t('report'),
      subtitle: t('reportSub'),
      bg: '#EAF4F1',
      handler: onReport,
    },
    {
      id: 'scan',
      icon: '📷',
      label: t('scan'),
      subtitle: t('scanSub'),
      bg: '#EAF4F1',
      handler: onScan,
    },
    {
      id: 'track',
      icon: '🔍',
      label: t('track'),
      subtitle: t('trackSub'),
      bg: '#EAF4F1',
      handler: onTrack,
    },
    {
      id: 'transparency',
      icon: '🏛️',
      label: t('transparency'),
      subtitle: t('transparencySub'),
      bg: '#EAF4F1',
      handler: onTransparency,
    },
  ];

  const WHY_ITEMS = [
    { icon: '🛡️', label: 'Safer Food', desc: 'Active monitoring' },
    { icon: '❤️', label: 'Healthy Citizens', desc: 'Prevent illness' },
    { icon: '💪', label: 'Stronger India', desc: 'Safe food standards' },
  ];

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.locationDropdown}
            onPress={() => {
              setLocLoading(true);
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(async (loc) => {
                const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                if (geo) setLiveLocation(`${geo.city || geo.district || 'Lonere'}, ${geo.region || 'Maharashtra'}`);
                setLocLoading(false);
              }).catch(() => setLocLoading(false));
            }}
          >
            <Text style={styles.locIcon}>📍</Text>
            <Text style={styles.locText}>
              {locLoading ? t('locationDetecting') : `${liveLocation} ▾`}
            </Text>
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => navigation?.navigate('Notifications')}
            >
              <Text style={styles.actionIcon}>🔔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.langPill}
              onPress={() => setShowLangModal(true)}
            >
              <Text style={styles.langPillText}>
                {language === 'en' ? '🌐 EN' : language === 'hi' ? '🌐 हिंदी' : '🌐 मराठी'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Brand Title Bar */}
        <View style={styles.brandBar}>
          <Image
            source={require('../assets/app-logo.png')}
            style={styles.brandLogoImg}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle}>{t('brandTitle')}</Text>
            <Text style={styles.brandSubtitle}>{t('brandSubtitle')}</Text>
          </View>
          <Image
            source={require('../assets/emblem.png')}
            style={styles.emblemImage}
            resizeMode="contain"
          />
        </View>

        {/* Hero Banner — Fresh Produce with Gradient Overlay */}
        <ImageBackground
          source={require('../assets/hero-produce-bg.jpg')}
          style={styles.heroCard}
          imageStyle={styles.heroBgImg}
          resizeMode="cover"
        >
          {/* Gradient overlay: dark green left → transparent right */}
          <LinearGradient
            colors={['rgba(10,55,40,0.92)', 'rgba(10,55,40,0.72)', 'rgba(10,55,40,0.25)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Content row */}
          <View style={styles.heroContent}>
            {/* Left side — headline + subtitle + dots */}
            <View style={styles.heroLeft}>
              <Text style={styles.heroHeadline}>{t('heroHeadline')}</Text>
              <Text style={styles.heroSub}>{t('heroSub')}</Text>
              <View style={styles.heroDots}>
                <View style={[styles.heroDot, { backgroundColor: '#E87C3E' }]} />
                <View style={[styles.heroDot, { backgroundColor: '#2E8B57' }]} />
              </View>
            </View>
            {/* Right side — FSSAI quote card */}
            <View style={styles.heroQuoteCard}>
              <Text style={styles.heroQuoteTitle}>{t('heroCardTitle')}</Text>
              <Text style={styles.heroQuoteText}>{t('heroCardQuote')}</Text>
              <Text style={styles.heroQuoteAuthor}>{t('heroCardAuthor')}</Text>
            </View>
          </View>
        </ImageBackground>

        {/* 4 Feature Buttons Grid */}
        <View style={styles.gridContainer}>
          {FEATURES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.gridCard, { backgroundColor: item.bg }]}
              onPress={item.handler}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircleBig}>
                <Text style={styles.featureIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.featureLabel}>{item.label}</Text>
              <Text style={styles.featureSub}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats Bar */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statNum}>1,420+</Text>
            <Text style={styles.statLbl}>{t('statResolved')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNum}>48h</Text>
            <Text style={styles.statLbl}>{t('statTime')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNum}>86</Text>
            <Text style={styles.statLbl}>{t('statInspections')}</Text>
          </View>
        </View>

        {/* Why It Matters */}
        <View style={styles.whySection}>
          <Text style={styles.sectionTitle}>Why It Matters</Text>
          <View style={styles.whyRow}>
            {WHY_ITEMS.map((w) => (
              <View key={w.label} style={styles.whyCard}>
                <Text style={styles.whyEmoji}>{w.icon}</Text>
                <Text style={styles.whyTitle}>{w.label}</Text>
                <Text style={styles.whyDesc}>{w.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Auth Prompt if not logged in */}
        {!user && (
          <View style={styles.authBanner}>
            <Text style={styles.authPromptTitle}>Citizen Services</Text>
            <Text style={styles.authPromptSub}>Log in or register to submit reports & track actions</Text>
            <View style={styles.authBtnRow}>
              <TouchableOpacity style={styles.loginBtnSmall} onPress={onLogin}>
                <Text style={styles.loginBtnSmallText}>{t('login')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.regBtnSmall} onPress={onRegister}>
                <Text style={styles.regBtnSmallText}>{t('register')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal visible={showLangModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
            <Text style={styles.modalSub}>Choose your preferred language for FDA SafeWatch</Text>

            <View style={{ gap: 10, marginVertical: 16 }}>
              {[
                { code: 'en' as Language, label: 'English (Default)', native: 'English' },
                { code: 'hi' as Language, label: 'Hindi (हिंदी)', native: 'हिंदी' },
                { code: 'mr' as Language, label: 'Marathi (मराठी)', native: 'मराठी' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.langOption, language === item.code && styles.langOptionActive]}
                  onPress={() => handleSelectLanguage(item.code)}
                >
                  <Text style={[styles.langOptionText, language === item.code && styles.langOptionTextActive]}>
                    {item.label}
                  </Text>
                  {language === item.code && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowLangModal(false)}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  locationDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  locIcon: {
    fontSize: 14,
  },
  locText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  langPill: {
    backgroundColor: '#0F4C3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  langPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  brandLogoImg: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  emblemImage: {
    width: 22,
    height: 36,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F4C3A',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  heroCard: {
    marginHorizontal: 0,
    marginTop: 4,
    height: 220,
    overflow: 'hidden',
  },
  heroBgImg: {
    width: '100%',
    height: '100%',
  },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  heroLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
    marginBottom: 10,
  },
  heroDots: {
    flexDirection: 'row',
    gap: 6,
  },
  heroDot: {
    width: 22,
    height: 4,
    borderRadius: 2,
  },
  heroQuoteCard: {
    width: 140,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  heroQuoteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F4C3A',
    lineHeight: 16,
    marginBottom: 8,
  },
  heroQuoteText: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 13,
    marginBottom: 4,
  },
  heroQuoteAuthor: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F4C3A',
    textAlign: 'right',
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 10,
  },
  gridCard: {
    width: (width - 44) / 2,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircleBig: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D7D9D4',
  },
  featureIcon: {
    fontSize: 22,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F4C3A',
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F4C3A',
    marginBottom: 2,
  },
  statLbl: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  whySection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  whyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  whyCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  whyEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  whyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
    textAlign: 'center',
  },
  whyDesc: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  authBanner: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#EAF4F1',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C3DFD6',
  },
  authPromptTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F4C3A',
    marginBottom: 4,
  },
  authPromptSub: {
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 14,
  },
  authBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  loginBtnSmall: {
    flex: 1,
    backgroundColor: '#0F4C3A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginBtnSmallText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  regBtnSmall: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0F4C3A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  regBtnSmallText: {
    color: '#0F4C3A',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langOptionActive: {
    backgroundColor: '#EAF4F1',
    borderColor: '#0F4C3A',
  },
  langOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  langOptionTextActive: {
    color: '#0F4C3A',
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F4C3A',
  },
  closeModalBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
});
