import React, { useState, useRef, useEffect } from 'react';
import { Search, ClipboardList, Pill, MoreVertical, Globe, Moon, Sun, Settings } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';

export const TopBar: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const guardrails = usePatientStore(s => s.guardrails);

  const {
    activeTab,
    previousTab,
    setActiveTab,
    market,
    setMarket,
    lang,
    setLang,
    theme,
    setTheme,
    pushOverlay
  } = useAppStore();

  const isAr = lang === 'ar';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen || typeof document === 'undefined') return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const rawName = (patient.name || '').trim();
  const isDefaultEmptyName = !rawName || rawName === 'New Patient';
  const shortName = isDefaultEmptyName
    ? (isAr ? 'مريض جديد' : 'New Patient')
    : rawName.split(' ').slice(0, 2).join(' ');

  const badgeCount = patient.activeMeds.length + guardrails.filter(g => g.level === 'critical').length;
  const fallbackTab = previousTab && previousTab !== 'drugs' ? previousTab : 'cockpit';

  return (
    <header className="sticky top-0 z-30 h-12 w-full bg-[var(--topbar-bg)] text-[var(--topbar-text)] border-b border-[var(--topbar-border)] shadow-sm px-3 flex items-center select-none transition-colors">
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 min-w-0">
        {/* Start: Patient Pill */}
        <button
          type="button"
          onClick={() => pushOverlay('patient-switcher')}
          className="flex items-center gap-1.5 min-w-0 max-w-[50vw] sm:max-w-[280px] h-8 px-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 active:scale-95 transition-all"
          title={isAr ? 'تبديل المريض أو استعراض المسودات' : 'Switch patient or view drafts'}
          aria-label={isAr ? 'تبديل المريض' : 'Switch patient'}
        >
          <div className="w-5 h-5 rounded-full bg-white text-[var(--topbar-bg)] text-[10px] font-bold flex items-center justify-center shrink-0">
            {patient.sex === 'f' ? '♀' : '♂'}
          </div>
          <div className="flex items-baseline gap-1 min-w-0 truncate text-xs font-semibold text-[var(--topbar-text)]">
            <span className="truncate">{shortName}</span>
            <bdi dir="ltr" className="text-[10px] text-[var(--topbar-muted)] font-mono shrink-0">
              · {patient.age}{patient.sex.toUpperCase()}
            </bdi>
          </div>
          <span className="text-[10px] text-[var(--topbar-muted)] shrink-0">▾</span>
        </button>

        {/* End: Controls (single-row non-wrapping) */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Global Search */}
          <button
            type="button"
            onClick={() => pushOverlay('command-palette')}
            className="p-1.5 rounded-lg text-[var(--topbar-muted)] hover:text-[var(--topbar-text)] hover:bg-white/10 active:scale-95 transition-all"
            title={isAr ? 'البحث عن الأدوية والأدوات والتوصيات' : 'Search drugs, tools & guidelines'}
            aria-label={isAr ? 'بحث' : 'Search'}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Drug Directory Pill */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'drugs' ? fallbackTab : 'drugs')}
            className={`p-1.5 rounded-lg transition-all active:scale-95 ${
              activeTab === 'drugs'
                ? 'bg-white text-[var(--topbar-bg)] shadow-sm'
                : 'text-[var(--topbar-muted)] hover:text-[var(--topbar-text)] hover:bg-white/10'
            }`}
            title={isAr ? 'دليل الأدوية والجرعات' : 'Formulary & Drug Directory'}
            aria-label={isAr ? 'دليل الأدوية' : 'Formulary'}
          >
            <Pill className="w-5 h-5" />
          </button>

          {/* SOAP Cart Pill */}
          <button
            type="button"
            onClick={() => pushOverlay('soap-sheet')}
            className="relative p-1.5 rounded-lg text-[var(--topbar-muted)] hover:text-[var(--topbar-text)] hover:bg-white/10 active:scale-95 transition-all"
            title={isAr ? 'فتح ملاحظة SOAP والوصفة الطبية' : 'Open SOAP Consultation Note'}
            aria-label={isAr ? 'ملاحظة SOAP' : 'SOAP Note'}
          >
            <ClipboardList className="w-5 h-5" />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -end-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                {badgeCount}
              </span>
            )}
          </button>

          {/* More Menu (⋮) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-[var(--topbar-muted)] hover:text-[var(--topbar-text)] hover:bg-white/10 active:scale-95 transition-all"
              title={isAr ? 'القائمة والإعدادات' : 'Menu & Settings'}
              aria-label={isAr ? 'المزيد' : 'More'}
              aria-expanded={menuOpen}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute end-0 mt-1 w-56 bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-xl py-1 text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Language Switch */}
                <button
                  type="button"
                  onClick={() => {
                    setLang(lang === 'ar' ? 'en' : 'ar');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--surface2)] text-[var(--text)] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-[var(--muted)]" />
                    <span>{isAr ? 'اللغة' : 'Language'}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--primary)]">
                    {lang === 'ar' ? 'English' : 'عربي'}
                  </span>
                </button>

                {/* Market Switch */}
                <button
                  type="button"
                  onClick={() => {
                    setMarket(market === 'sa' ? 'eg' : 'sa');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--surface2)] text-[var(--text)] transition-colors border-t border-[var(--line)]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">🏷️</span>
                    <span>{isAr ? 'السوق والتسعير' : 'Market & Pricing'}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--primary)]">
                    {market === 'sa' ? (isAr ? '🇸🇦 السعودية (SAR)' : '🇸🇦 SAR') : (isAr ? '🇪🇬 مصر (EGP)' : '🇪🇬 EGP')}
                  </span>
                </button>

                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--surface2)] text-[var(--text)] transition-colors border-t border-[var(--line)]"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-[var(--muted)]" />
                    )}
                    <span>{isAr ? 'المظهر' : 'Theme'}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--muted)]">
                    {theme === 'dark' ? (isAr ? 'داكن' : 'Dark') : (isAr ? 'نهاري' : 'Light')}
                  </span>
                </button>

                {/* Doctor Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    pushOverlay('settings-sheet');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[var(--surface2)] text-[var(--text)] transition-colors border-t border-[var(--line)]"
                >
                  <Settings className="w-4 h-4 text-[var(--muted)]" />
                  <span>{isAr ? 'إعدادات الطبيب والعيادة' : 'Doctor Settings'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
