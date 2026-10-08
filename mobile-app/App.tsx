import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkForUpdate, downloadAndInstallUpdate } from './services/updateService';
import * as Application from 'expo-application';

// Screens
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import ReportComplaintScreen from './screens/ReportComplaintScreen';
import TrackComplaintScreen from './screens/TrackComplaintScreen';
import TransparencyRegisterScreen from './screens/TransparencyRegisterScreen';
import ScanProductScreen from './screens/ScanProductScreen';
import MyComplaintsScreen from './screens/MyComplaintsScreen';
import SavedProductsScreen from './screens/SavedProductsScreen';
import ProfileScreen from './screens/ProfileScreen';
import MoreScreen from './screens/MoreScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import HelpScreen from './screens/HelpScreen';
import AboutScreen from './screens/AboutScreen';

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import OtpScreen from './screens/auth/OtpScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';

import { useAuthStore } from './store/authStore';
import { Colors } from './constants/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab icon mapping
const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Report: '📝',
  'Scan Food': '📷',
  Track: '🔍',
  More: '☰',
};

function TabNavigator({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();

  const requireAuth = (cb: () => void) => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please log in to access this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    cb();
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          height: 62 + insets.bottom,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused }) => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: focused ? 22 : 19 }}>{TAB_ICONS[route.name] || '•'}</Text>
          </View>
        ),
      })}
    >
      {/* Home — public */}
      <Tab.Screen name="Home">
        {(props) => (
          <HomeScreen
            {...props}
            onReport={() => requireAuth(() => props.navigation.navigate('Report'))}
            onScan={() => props.navigation.navigate('Scan Food')}
            onTrack={() => props.navigation.navigate('Track')}
            onTransparency={() => requireAuth(() => props.navigation.navigate('Transparency'))}
            onLogin={() => props.navigation.navigate('Login')}
            onRegister={() => props.navigation.navigate('Register')}
          />
        )}
      </Tab.Screen>

      {/* Report — auth required */}
      <Tab.Screen
        name="Report"
        listeners={{
          tabPress: (e) => {
            if (!user) {
              e.preventDefault();
              Alert.alert('Login Required', 'Please log in to report a food safety complaint.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log In', onPress: () => navigation.navigate('Login') },
              ]);
            }
          },
        }}
      >
        {(props) => <ReportComplaintScreen {...props} />}
      </Tab.Screen>

      {/* Scan Food — public */}
      <Tab.Screen name="Scan Food">
        {(props) => <ScanProductScreen {...props} />}
      </Tab.Screen>

      {/* Track — public (by tracking code) */}
      <Tab.Screen name="Track">
        {(props) => <TrackComplaintScreen {...props} initialCode={(props.route?.params as any)?.initialCode} />}
      </Tab.Screen>

      {/* More — user menu */}
      <Tab.Screen name="More">
        {(props) => <MoreScreen {...props} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

import { useLanguageStore } from './store/languageStore';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const [updateInfo, setUpdateInfo] =
    useState<{
      version: string;
      apkUrl: string;
      forceUpdate?: boolean;
      releaseNotes?: string;
    } | null>(null);

  const [checkingUpdate, setCheckingUpdate] = useState(true);

  const [downloadingUpdate, setDownloadingUpdate] =
    useState(false);

  const [downloadProgress, setDownloadProgress] =
    useState(0);

  const loadAuth = useAuthStore((s) => s.loadAuth);
  const loadLanguage = useLanguageStore((s) => s.loadLanguage);

  useEffect(() => {
    loadAuth();
    loadLanguage();

    checkUpdate();
  }, []);

  const checkUpdate = async () => {
    try {
      setCheckingUpdate(true);

      const update = await checkForUpdate();

      if (update) {
        console.log('UPDATE AVAILABLE:', update);
        setUpdateInfo(update);
      } else {
        console.log('APP IS UP TO DATE');
      }
    } catch (error) {
      console.log('UPDATE CHECK FAILED:', error);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleUpdate = async () => {
    if (!updateInfo) return;

    try {
      setDownloadingUpdate(true);
      setDownloadProgress(0);

      await downloadAndInstallUpdate(
        updateInfo,
        (progress) => {
          setDownloadProgress(progress);
        }
      );
    } catch (error: any) {
      console.log('UPDATE DOWNLOAD ERROR:', error);

      Alert.alert(
        'Update Failed',
        error?.message ||
          'Unable to download the update. Please try again.'
      );
    } finally {
      setDownloadingUpdate(false);
    }
  };

  if (showSplash) {
    return (
      <SplashScreen
        onDone={() => setShowSplash(false)}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />

        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
          />

          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onNavigateRegister={() =>
                  props.navigation.navigate('Register')
                }
                onNavigateForgotPassword={() =>
                  props.navigation.navigate('ForgotPassword')
                }
                onNavigateOtp={() =>
                  props.navigation.navigate('Otp')
                }
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Register">
            {(props) => (
              <RegisterScreen
                {...props}
                onNavigateLogin={() =>
                  props.navigation.navigate('Login')
                }
                onOtpVerify={(emailOrPhone: string) =>
                  props.navigation.navigate('Otp', {
                    emailOrPhone,
                  })
                }
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Otp">
            {(props) => (
              <OtpScreen
                {...props}
                emailOrPhone={
                  (props.route?.params as any)
                    ?.emailOrPhone
                }
                onBack={() => props.navigation.goBack()}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="ForgotPassword">
            {(props) => (
              <ForgotPasswordScreen
                {...props}
                onBack={() => props.navigation.goBack()}
                onSuccess={() =>
                  props.navigation.navigate('Login')
                }
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Transparency">
            {(props) => (
              <TransparencyRegisterScreen {...props} />
            )}
          </Stack.Screen>

          <Stack.Screen name="MyComplaints">
            {(props) => (
              <MyComplaintsScreen {...props} />
            )}
          </Stack.Screen>

          <Stack.Screen name="SavedProducts">
            {(props) => (
              <SavedProductsScreen {...props} />
            )}
          </Stack.Screen>

          <Stack.Screen name="Profile">
            {(props) => (
              <ProfileScreen {...props} />
            )}
          </Stack.Screen>

          <Stack.Screen name="Track">
            {(props) => (
              <TrackComplaintScreen
                {...props}
                initialCode={(props.route?.params as any)?.initialCode}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Report">
            {(props) => <ReportComplaintScreen {...props} />}
          </Stack.Screen>

          <Stack.Screen name="Notifications">
            {(props) => (
              <NotificationsScreen {...props} />
            )}
          </Stack.Screen>

          <Stack.Screen name="Help">
            {(props) => <HelpScreen {...props} />}
          </Stack.Screen>

          <Stack.Screen name="About">
            {(props) => <AboutScreen {...props} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>

      {/* REMOTE UPDATE MODAL */}
      {updateInfo && !checkingUpdate && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            zIndex: 9999,
            elevation: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 24,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 15,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>🚀</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>
                  Update Available
                </Text>
                <Text style={{ fontSize: 13, color: '#64748B' }}>
                  v{Application.nativeApplicationVersion || '1.0.0'} → v{updateInfo.version}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 14, color: '#334155', lineHeight: 21, marginBottom: 14 }}>
              A new version of Aaharmitra is ready to install with latest food safety features and improvements.
            </Text>

            {updateInfo.releaseNotes ? (
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 18, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4, textTransform: 'uppercase' }}>
                  What's New:
                </Text>
                <Text style={{ fontSize: 13, color: '#334155', lineHeight: 18 }}>
                  {updateInfo.releaseNotes}
                </Text>
              </View>
            ) : null}

            {downloadingUpdate ? (
              <View style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F4C3A', marginBottom: 8 }}>
                  Downloading update APK ({Math.round(downloadProgress * 100)}%)...
                </Text>
                <View style={{ height: 10, backgroundColor: '#E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                  <View
                    style={{
                      height: '100%',
                      width: `${Math.max(5, Math.round(downloadProgress * 100))}%`,
                      backgroundColor: Colors.primary,
                      borderRadius: 10,
                    }}
                  />
                </View>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 6, textAlign: 'center' }}>
                  Please wait, installer will launch once download finishes.
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                {!updateInfo.forceUpdate && (
                  <TouchableOpacity
                    onPress={() => setUpdateInfo(null)}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      backgroundColor: '#F1F5F9',
                    }}
                  >
                    <Text style={{ fontWeight: '700', color: '#64748B', fontSize: 14 }}>Later</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleUpdate}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 22,
                    backgroundColor: Colors.primary,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                    Update Now ⚡
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaProvider>
  );
}
