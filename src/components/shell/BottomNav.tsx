import React from 'react';
import { useAppStore, AppTab } from '../../store/useAppStore';

interface NavItem {
  id: AppTab;
  labelEn: string;
  labelAr: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dm', labelEn: 'Diabetes', labelAr: 'السكري', icon: '🩸' },
  { id: 'htn', labelEn: 'HTN', labelAr: 'الضغط', icon: '💓' },
  { id: 'dlp', labelEn: 'Lipids', labelAr: 'الدهون', icon: '🧪' },
  { id: 'tools', labelEn: 'Tools', labelAr: 'الأدوات', icon: '🧮' },
  { id: 'patient', labelEn: 'Patient', labelAr: 'المريض', icon: '📋' }
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, lang } = useAppStore();
  const isAr = lang === 'ar';

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--line)] shadow-lg select-none pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-14 items-center justify-around px-1 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'text-[var(--primary)] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--text)] font-medium'
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-full text-base transition-all ${
                  isActive ? 'bg-[var(--primary)]/15 scale-105' : ''
                }`}
              >
                <span>{item.icon}</span>
              </div>
              <span className="text-[10px] mt-0.5 truncate tracking-tight">
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
