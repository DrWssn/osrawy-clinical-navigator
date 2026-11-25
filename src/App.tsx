import React from 'react';
import {
  LayoutDashboard,
  HeartPulse,
  Stethoscope,
  Calculator,
  ClipboardCheck,
  Pill
} from 'lucide-react';
import { useAppStore, AppTab } from './store/useAppStore';

// Shell components
import { TopBar } from './components/shell/TopBar';
import { VitalsStrip } from './components/shell/VitalsStrip';
import { SafetyBanner } from './components/shell/SafetyBanner';
import { BottomNav } from './components/shell/BottomNav';
import { VitalsDrawerSheet } from './components/shell/VitalsDrawerSheet';
import { PatientSwitcherSheet } from './components/shell/PatientSwitcherSheet';
import { SoapSheet } from './components/shell/SoapSheet';
import { CommandPalette } from './components/shell/CommandPalette';
import { SettingsSheet } from './components/shell/SettingsSheet';

// Screens
import { CockpitScreen } from './screens/CockpitScreen';
import { CrmScreen } from './screens/CrmScreen';
import { PrimaryCareScreen } from './screens/PrimaryCareScreen';
import { ToolsScreen } from './screens/ToolsScreen';
import { PatientHubScreen } from './screens/PatientHubScreen';
import { DrugDirectoryScreen } from './screens/DrugDirectoryScreen';

export const App: React.FC = () => {
  const activeTab = useAppStore(s => s.activeTab);
  const crmSubTab = useAppStore(s => s.crmSubTab);
  const pcSubTab = useAppStore(s => s.pcSubTab);
  const lang = useAppStore(s => s.lang);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const navigateTo = useAppStore(s => s.navigateTo);
  const isAr = lang === 'ar';

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'cockpit':
        return <CockpitScreen />;
      case 'crm':
        return <CrmScreen />;
      case 'pc':
        return <PrimaryCareScreen />;
      case 'tools':
        return <ToolsScreen />;
      case 'patient':
        return <PatientHubScreen />;
      case 'drugs':
        return <DrugDirectoryScreen />;
      default:
        return <CockpitScreen />;
    }
  };

  const railItems: Array<{ id: AppTab; labelEn: string; labelAr: string; icon: React.ReactNode }> = [
    { id: 'cockpit', labelEn: 'Visit Cockpit', labelAr: 'لوحة الزيارة', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'crm',     labelEn: 'Cardio-Metabolic', labelAr: 'القلب والأيض', icon: <HeartPulse className="w-4 h-4" /> },
    { id: 'pc',      labelEn: 'Primary Care', labelAr: 'الرعاية الأولية', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'tools',   labelEn: 'Clinical Tools', labelAr: 'الأدوات السريرية', icon: <Calculator className="w-4 h-4" /> },
    { id: 'patient', labelEn: 'Patient Hub', labelAr: 'بوابة المريض', icon: <ClipboardCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans transition-colors duration-200">
      {/* 1. Global Single-Row 48px Top Navigation Bar */}
      <TopBar />

      {/* 2. Sticky 36px Vitals Strip */}
      <VitalsStrip />

      {/* 3. Expandable Multi-Alert Safety Guardrail Banner */}
      <SafetyBanner />

      {/* 4. Responsive Shell Body: Desktop Rail (>= md) + Active Screen */}
      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col md:flex-row md:gap-5 md:px-4">
        <aside
          aria-label={isAr ? 'القائمة الجانبية' : 'Desktop navigation'}
          className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:py-3"
        >
          <div className="sticky top-24 flex flex-col gap-1 p-2 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
            {railItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-start ${
                      isActive
                        ? 'bg-primary/15 text-[var(--primary)] font-bold'
                        : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)]'
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                  </button>

                  {item.id === 'crm' && activeTab === 'crm' && (
                    <div className="ps-7 flex flex-col gap-0.5 pb-1">
                      {(['dm', 'htn', 'dlp'] as const).map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => navigateTo('crm', sub)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] text-start transition-colors ${
                            crmSubTab === sub
                              ? 'bg-[var(--surface2)] text-[var(--primary)] font-bold'
                              : 'text-[var(--muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          {sub === 'dm'
                            ? (isAr ? 'السكري' : 'Diabetes')
                            : sub === 'htn'
                              ? (isAr ? 'ضغط الدم' : 'Hypertension')
                              : (isAr ? 'الدهون والشرايين' : 'Lipids & ASCVD')}
                        </button>
                      ))}
                    </div>
                  )}

                  {item.id === 'pc' && activeTab === 'pc' && (
                    <div className="ps-7 flex flex-col gap-0.5 pb-1">
                      {(['asthma', 'copd', 'thyroid'] as const).map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => navigateTo('pc', sub)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] text-start transition-colors ${
                            pcSubTab === sub
                              ? 'bg-[var(--surface2)] text-[var(--primary)] font-bold'
                              : 'text-[var(--muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          {sub === 'asthma'
                            ? (isAr ? 'الربو (GINA)' : 'Asthma (GINA)')
                            : sub === 'copd'
                              ? (isAr ? 'السدة (GOLD)' : 'COPD (GOLD)')
                              : (isAr ? 'الغدة الدرقية' : 'Thyroid')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="my-1 border-t border-[var(--line)]" />

            <button
              type="button"
              onClick={() => setActiveTab('drugs')}
              aria-current={activeTab === 'drugs' ? 'page' : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-start ${
                activeTab === 'drugs'
                  ? 'bg-primary/15 text-[var(--primary)] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)]'
              }`}
            >
              <Pill className="w-4 h-4 shrink-0" />
              <span className="truncate">{isAr ? 'دليل الأدوية' : 'Formulary'}</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 w-full overflow-x-hidden md:py-2">
          {renderActiveScreen()}
        </main>
      </div>

      {/* 5. Clean 5-Tab Mobile Bottom Navigation (hidden on desktop and drug directory) */}
      {activeTab !== 'drugs' && <BottomNav />}

      {/* 6. Global Interactive Sheets & Modals */}
      <VitalsDrawerSheet />
      <PatientSwitcherSheet />
      <SoapSheet />
      <CommandPalette />
      <SettingsSheet />
    </div>
  );
};

export default App;
