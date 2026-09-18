import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { TRANSLATIONS, Language } from '../i18n/translations';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'en',

  setLanguage: async (lang: Language) => {
    set({ language: lang });
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('appLanguage', lang);
      } else {
        localStorage.setItem('appLanguage', lang);
      }
    } catch (_) {}
  },

  loadLanguage: async () => {
    try {
      let savedLang: string | null = null;
      if (Platform.OS !== 'web') {
        savedLang = await SecureStore.getItemAsync('appLanguage');
      } else {
        savedLang = localStorage.getItem('appLanguage');
      }
      if (savedLang === 'en' || savedLang === 'hi' || savedLang === 'mr') {
        set({ language: savedLang as Language });
      }
    } catch (_) {}
  },

  t: (key: keyof typeof TRANSLATIONS['en']) => {
    const lang = get().language;
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || String(key);
  },
}));
