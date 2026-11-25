import { create } from 'zustand';

export type AppTab = 'cockpit' | 'crm' | 'pc' | 'tools' | 'patient' | 'drugs';
export type LegacyAppTab = 'dm' | 'htn' | 'dlp';
export type CrmSubTab = 'dm' | 'htn' | 'dlp';
export type PcSubTab = 'asthma' | 'copd' | 'thyroid';
export type ToolsSubTab = 'kdigo' | 'egfr' | 'fib4' | 'doac' | 'steroids';
export type AppSubTab = CrmSubTab | PcSubTab | ToolsSubTab;

export type AppMarket = 'sa' | 'eg';
export type AppLang = 'ar' | 'en';
export type AppTheme = 'light' | 'dark';
export type AppPalette = 'sapphire' | 'teal' | 'navy';

const CRM_SUB_TABS: readonly CrmSubTab[] = ['dm', 'htn', 'dlp'];
const PC_SUB_TABS: readonly PcSubTab[] = ['asthma', 'copd', 'thyroid'];
const TOOLS_SUB_TABS: readonly ToolsSubTab[] = ['kdigo', 'egfr', 'fib4', 'doac', 'steroids'];

function isLegacyCrmTab(tab: AppTab | LegacyAppTab): tab is LegacyAppTab {
  return tab === 'dm' || tab === 'htn' || tab === 'dlp';
}

export interface AppStore {
  activeTab: AppTab;
  previousTab: AppTab;
  crmSubTab: CrmSubTab;
  pcSubTab: PcSubTab;
  toolsSubTab: ToolsSubTab;
  market: AppMarket;
  lang: AppLang;
  theme: AppTheme;
  palette: AppPalette;
  overlayStack: string[];
  setActiveTab: (tab: AppTab | LegacyAppTab) => void;
  setCrmSubTab: (subTab: CrmSubTab) => void;
  setPcSubTab: (subTab: PcSubTab) => void;
  setToolsSubTab: (subTab: ToolsSubTab) => void;
  navigateTo: (tab: AppTab | LegacyAppTab, subTab?: AppSubTab) => void;
  setMarket: (market: AppMarket) => void;
  setLang: (lang: AppLang) => void;
  setTheme: (theme: AppTheme) => void;
  setPalette: (palette: AppPalette) => void;
  pushOverlay: (id: string) => void;
  popOverlay: () => boolean;
  closeAllOverlays: () => void;
  handleAndroidBack: () => boolean;
}

const memoryStorage: Record<string, string> = {};

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

const SYSTEM_BAR_CONFIG: Record<AppTheme, Record<AppPalette, { status: string; nav: string; lightStatus: boolean; lightNav: boolean }>> = {
  light: {
    sapphire: { status: '#1E3A8A', nav: '#FFFFFF', lightStatus: false, lightNav: true },
    teal:     { status: '#0A4F4B', nav: '#FFFFFF', lightStatus: false, lightNav: true },
    navy:     { status: '#0F172A', nav: '#FFFFFF', lightStatus: false, lightNav: true },
  },
  dark: {
    sapphire: { status: '#111A2E', nav: '#131C2E', lightStatus: false, lightNav: false },
    teal:     { status: '#0D1D1C', nav: '#10201F', lightStatus: false, lightNav: false },
    navy:     { status: '#0F172A', nav: '#111827', lightStatus: false, lightNav: false },
  }
};

function applyThemeAndPaletteToDom(theme: AppTheme, palette: AppPalette): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-palette', palette);
  }
  if (typeof window !== 'undefined') {
    const androidTheme = (window as unknown as {
      AndroidTheme?: { setSystemBars?: (s: string, n: string, ls: boolean, ln: boolean) => void };
    }).AndroidTheme;
    const cfg = SYSTEM_BAR_CONFIG[theme]?.[palette] || SYSTEM_BAR_CONFIG.light.sapphire;
    try {
      androidTheme?.setSystemBars?.(cfg.status, cfg.nav, cfg.lightStatus, cfg.lightNav);
    } catch {}
  }
}

export const useAppStore = create<AppStore>((set, get) => {
  const initialMarket = getStoredString<AppMarket>('osrawy_market', 'sa');
  const initialLang = getStoredString<AppLang>('osrawy_lang', 'ar');
  const initialTheme = getStoredString<AppTheme>('osrawy_theme', 'light');
  const storedPalette = getStoredString<string>('osrawy_palette', 'sapphire');
  const initialPalette: AppPalette =
    storedPalette === 'sapphire' || storedPalette === 'teal' || storedPalette === 'navy'
      ? storedPalette
      : 'sapphire';

  if (typeof document !== 'undefined') {
    document.documentElement.lang = initialLang;
    document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';
  }
  applyThemeAndPaletteToDom(initialTheme, initialPalette);

  return {
    activeTab: 'cockpit',
    previousTab: 'cockpit',
    crmSubTab: 'dm',
    pcSubTab: 'asthma',
    toolsSubTab: 'kdigo',
    market: initialMarket,
    lang: initialLang,
    theme: initialTheme,
    palette: initialPalette,
    overlayStack: [],

    setActiveTab: (tab) => {
      if (isLegacyCrmTab(tab)) {
        get().navigateTo('crm', tab);
        return;
      }
      const current = get().activeTab;
      if (current !== tab) {
        set({ activeTab: tab, previousTab: current });
      }
    },

    setCrmSubTab: (crmSubTab) => set({ crmSubTab }),
    setPcSubTab: (pcSubTab) => set({ pcSubTab }),
    setToolsSubTab: (toolsSubTab) => set({ toolsSubTab }),

    navigateTo: (tab, subTab) => {
      const targetTab: AppTab = isLegacyCrmTab(tab) ? 'crm' : tab;
      const effectiveSub = isLegacyCrmTab(tab) ? tab : subTab;
      const current = get().activeTab;

      const patch: Partial<AppStore> = {
        activeTab: targetTab,
        previousTab: current !== targetTab ? current : get().previousTab,
      };

      if (targetTab === 'crm' && effectiveSub && (CRM_SUB_TABS as readonly string[]).includes(effectiveSub)) {
        patch.crmSubTab = effectiveSub as CrmSubTab;
      } else if (targetTab === 'pc' && effectiveSub && (PC_SUB_TABS as readonly string[]).includes(effectiveSub)) {
        patch.pcSubTab = effectiveSub as PcSubTab;
      } else if (targetTab === 'tools' && effectiveSub && (TOOLS_SUB_TABS as readonly string[]).includes(effectiveSub)) {
        patch.toolsSubTab = effectiveSub as ToolsSubTab;
      }

      set(patch);
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
      applyThemeAndPaletteToDom(theme, get().palette);
      set({ theme });
    },

    setPalette: (palette) => {
      setStoredString('osrawy_palette', palette);
      applyThemeAndPaletteToDom(get().theme, palette);
      set({ palette });
    },

    pushOverlay: (id) => {
      const current = get().overlayStack;
      if (current.includes(id)) return;
      set({ overlayStack: [...current, id] });
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

      // 2. If viewing drug directory, return to previous tab
      const currentTab = get().activeTab;
      if (currentTab === 'drugs') {
        const prev = get().previousTab;
        set({ activeTab: prev && prev !== 'drugs' ? prev : 'cockpit' });
        return true;
      }

      // 3. If not on primary home tab (cockpit), navigate back to cockpit
      if (currentTab !== 'cockpit') {
        set({ activeTab: 'cockpit' });
        return true;
      }

      // 4. On root screen with no overlays: allow default Android back action (minimize)
      return false;
    }
  };
});

// Setup native Android back press bridge
if (typeof window !== 'undefined') {
  (window as unknown as { handleAndroidBack?: () => boolean }).handleAndroidBack = () => {
    return useAppStore.getState().handleAndroidBack();
  };
}
