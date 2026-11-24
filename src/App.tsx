import React from 'react';
import { useAppStore } from './store/useAppStore';

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
import { DiabetesScreen } from './screens/DiabetesScreen';
import { HtnScreen } from './screens/HtnScreen';
import { LipidsScreen } from './screens/LipidsScreen';
import { ToolsScreen } from './screens/ToolsScreen';
import { PatientHubScreen } from './screens/PatientHubScreen';
import { DrugDirectoryScreen } from './screens/DrugDirectoryScreen';

export const App: React.FC = () => {
  const activeTab = useAppStore(s => s.activeTab);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dm':
        return <DiabetesScreen />;
      case 'htn':
        return <HtnScreen />;
      case 'dlp':
        return <LipidsScreen />;
      case 'tools':
        return <ToolsScreen />;
      case 'patient':
        return <PatientHubScreen />;
      case 'drugs':
        return <DrugDirectoryScreen />;
      default:
        return <DiabetesScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans transition-colors duration-200">
      {/* 1. Global Single-Row 48px Top Navigation Bar */}
      <TopBar />

      {/* 2. Sticky 34px Vitals Strip */}
      <VitalsStrip />

      {/* 3. Conditional Safety Guardrail Banner */}
      <SafetyBanner />

      {/* 4. Active Screen */}
      <main className="flex-1 w-full overflow-x-hidden">
        {renderActiveScreen()}
      </main>

      {/* 5. Clean 5-Tab Material Bottom Navigation (hidden on drug directory) */}
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
