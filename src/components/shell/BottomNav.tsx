import React from 'react';
import { LayoutDashboard, HeartPulse, Stethoscope, Calculator, ClipboardCheck } from 'lucide-react';
import { useAppStore, AppTab } from '../../store/useAppStore';

interface NavItem {
  id: AppTab;
  labelEn: string;
  labelAr: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'cockpit', labelEn: 'Cockpit',      labelAr: 'الرئيسية',      icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { id: 'crm',     labelEn: 'CRM',          labelAr: 'القلب والأيض',  icon: <HeartPulse className="w-[18px] h-[18px]" /> },
  { id: 'pc',      labelEn: 'Primary Care', labelAr: 'رعاية أولية',   icon: <Stethoscope className="w-[18px] h-[18px]" /> },
  { id: 'tools',   labelEn: 'Tools',        labelAr: 'الأدوات',       icon: <Calculator className="w-[18px] h-[18px]" /> },
  { id: 'patient', labelEn: 'Patient',      labelAr: 'المريض',        icon: <ClipboardCheck className="w-[18px] h-[18px]" /> }
];

export const BottomNav: React.FC = () => {
  const activeTab = useAppStore(s => s.activeTab);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const lang = useAppStore(s => s.lang);
  const isAr = lang === 'ar';

  return (
    <nav
      aria-label={isAr ? 'التنقل السفلي' : 'Bottom navigation'}
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-[var(--line)] shadow-lg select-none pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-14 items-center justify-around px-1 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'text-[var(--primary)] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--text)] font-medium'
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-full transition-all ${
                  isActive ? 'bg-primary/15 scale-105' : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 max-w-full whitespace-nowrap truncate tracking-tight px-0.5">
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
