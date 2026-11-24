import { create } from 'zustand';

export type AppTab = 'dm' | 'htn' | 'dlp' | 'tools' | 'patient' | 'drugs';
export type AppMarket = 'sa' | 'eg';
export type AppLang = 'ar' | 'en';
export type AppTheme = 'light' | 'dark';

export interface AppStore {
  activeTab: AppTab;
  previousTab: AppTab;
  market: AppMarket;
  lang: AppLang;
  theme: AppTheme;
  overlayStack: string[];
  setActiveTab: (tab: AppTab) => void;
  setMarket: (market: AppMarket) => void;
  setLang: (lang: AppLang) => void;
  setTheme: (theme: AppTheme) => void;
  pushOverlay: (id: string) => void;
  popOverlay: () => boolean;
  closeAllOverlays: () => void;
  handleAndroidBack: () => boolean;
}

let memoryStorage: Record<string, string> = {};

function getStoredString<T extends string>(key: string, fallback: T): T {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(key);
      if (val) return val as T;
    }
  } catch {}
  return (memoryStorage[key] as T) || fallback;
}

function setStoredString(key: string, val: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
      return;
    }
  } catch {}
  memoryStorage[key] = val;
}

export const useAppStore = create<AppStore>((set, get) => {
  const initialMarket = getStoredString<AppMarket>('osrawy_market', 'sa');
  const initialLang = getStoredString<AppLang>('osrawy_lang', 'ar');
  const initialTheme = getStoredString<AppTheme>('osrawy_theme', 'light');

  if (typeof document !== 'undefined') {
    document.documentElement.lang = initialLang;
    document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('data-theme', initialTheme);
  }

  return {
    activeTab: 'dm',
    previousTab: 'dm',
    market: initialMarket,
    lang: initialLang,
    theme: initialTheme,
    overlayStack: [],

    setActiveTab: (tab) => {
      const current = get().activeTab;
      if (current !== tab) {
        set({ activeTab: tab, previousTab: current });
      }
    },

    setMarket: (market) => {
      setStoredString('osrawy_market', market);
      set({ market });
    },

    setLang: (lang) => {
      setStoredString('osrawy_lang', lang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      }
      set({ lang });
    },

    setTheme: (theme) => {
      setStoredString('osrawy_theme', theme);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      set({ theme });
    },

    pushOverlay: (id) => {
      const stack = [...get().overlayStack, id];
      set({ overlayStack: stack });
    },

    popOverlay: () => {
      const stack = [...get().overlayStack];
      if (stack.length > 0) {
        stack.pop();
        set({ overlayStack: stack });
        return true;
      }
      return false;
    },

    closeAllOverlays: () => {
      set({ overlayStack: [] });
    },

    handleAndroidBack: () => {
      // 1. If an overlay/modal/sheet is open, close it first
      const stack = [...get().overlayStack];
      if (stack.length > 0) {
        stack.pop();
        set({ overlayStack: stack });
        return true;
      }

      // 2. If viewing drug directory or non-main tab, return to previous tab
      const currentTab = get().activeTab;
      if (currentTab === 'drugs') {
        const prev = get().previousTab || 'dm';
        set({ activeTab: prev });
        return true;
      }

      // 3. If not on primary home tab (dm), navigate back to dm
      if (currentTab !== 'dm') {
        set({ activeTab: 'dm' });
        return true;
      }

      // 4. On root screen with no overlays: allow default Android back action (minimize)
      return false;
    }
  };
});

// Setup native Android back press bridge
if (typeof window !== 'undefined') {
  (window as any).handleAndroidBack = () => {
    return useAppStore.getState().handleAndroidBack();
  };
}
