import React from 'react';
import { useAppStore, CrmSubTab } from '../store/useAppStore';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { DiabetesScreen } from './DiabetesScreen';
import { HtnScreen } from './HtnScreen';
import { LipidsScreen } from './LipidsScreen';

export const CrmScreen: React.FC = () => {
  const crmSubTab = useAppStore(s => s.crmSubTab);
  const setCrmSubTab = useAppStore(s => s.setCrmSubTab);
  const lang = useAppStore(s => s.lang);
  const isAr = lang === 'ar';

  return (
    <div className="flex flex-col w-full">
      {/* Sticky Cardio-Metabolic Domain Switcher */}
      <div className="sticky top-[84px] z-10 bg-[var(--bg)]/95 backdrop-blur-sm border-b border-[var(--line)]/60 px-3 py-2">
        <div className="max-w-lg mx-auto">
          <SegmentedControl<CrmSubTab>
            value={crmSubTab}
            onChange={setCrmSubTab}
            options={[
              { id: 'dm', label: isAr ? 'السكري' : 'Diabetes' },
              { id: 'htn', label: isAr ? 'ضغط الدم' : 'Hypertension' },
              { id: 'dlp', label: isAr ? 'الدهون والشرايين' : 'Lipids & ASCVD' }
            ]}
          />
        </div>
      </div>

      {/* Active Cardio-Metabolic Sub-Screen */}
      {crmSubTab === 'dm' && <DiabetesScreen />}
      {crmSubTab === 'htn' && <HtnScreen />}
      {crmSubTab === 'dlp' && <LipidsScreen />}
    </div>
  );
};
