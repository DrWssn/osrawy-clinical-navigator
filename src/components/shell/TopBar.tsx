import React, { useState, useRef, useEffect } from 'react';
import { Search, ClipboardList, Pill, MoreVertical, Globe, Moon, Sun, Settings } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';

export const TopBar: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const guardrails = usePatientStore(s => s.guardrails);
  
  const {
    activeTab,
    setActiveTab,
    market,
    setMarket,
    lang,
    setLang,
    theme,
    setTheme,
    pushOverlay
  } = useAppStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Compute initials & short name
  const shortName = patient.name ? patient.name.split(' ').slice(0, 2).join(' ') : 'New Patient';
  const badgeCount = patient.activeMeds.length + guardrails.filter(g => g.level === 'critical').length;

  return (
    <header className="sticky top-0 z-30 h-12 w-full bg-[var(--surface)] text-[var(--text)] border-b border-[var(--line)] shadow-sm px-3 flex items-center justify-between select-none">
      {/* Start: Patient Pill (Ahmed M. · 52M ▾) */}
      <button
        type="button"
        onClick={() => pushOverlay('patient-switcher')}
        className="flex items-center gap-2 max-w-[210px] sm:max-w-[280px] h-8 px-2.5 rounded-full bg-[var(--surface2)] hover:bg-[var(--line)] border border-[var(--line)] active:scale-95 transition-all"
        title="Switch patient or view drafts"
      >
        <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {patient.sex === 'f' ? '♀' : '♂'}
        </div>
        <div className="flex items-baseline gap-1 truncate text-xs font-semibold">
          <span className="truncate">{shortName}</span>
          <span className="text-[10px] text-[var(--muted)] font-mono shrink-0">
            · {patient.age}{patient.sex.toUpperCase()}
          </span>
        </div>
        <span className="text-[10px] text-[var(--muted)] shrink-0">▾</span>
      </button>

      {/* End: Controls */}
      <div className="flex items-center gap-1">
        {/* Global Search */}
        <button
          type="button"
          onClick={() => pushOverlay('command-palette')}
          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] active:scale-95 transition-all"
          title="Search drugs, tools & guidelines"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Drug Directory Pill */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'drugs' ? 'dm' : 'drugs')}
          className={`p-1.5 rounded-lg transition-all active:scale-95 ${
            activeTab === 'drugs'
              ? 'bg-[var(--primary)] text-white'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)]'
          }`}
          title="Formulary & Drug Directory"
          aria-label="Drugs"
        >
          <Pill className="w-5 h-5" />
        </button>

        {/* SOAP Cart Pill */}
        <button
          type="button"
          onClick={() => pushOverlay('soap-sheet')}
          className="relative p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] active:scale-95 transition-all"
          title="Open SOAP Consultation Note"
          aria-label="SOAP Note"
        >
          <ClipboardList className="w-5 h-5" />
          {badgeCount > 0 && (
            <span className="absolute -top-1 -end-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {badgeCount}
            </span>
          )}
        </button>

        {/* More Menu (⋮) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] active:scale-95 transition-all"
            title="Menu & Settings"
            aria-label="More"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute end-0 mt-1 w-52 bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-xl py-1 text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
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
                  <span>Language</span>
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
                  <span>Market & Pricing</span>
                </div>
                <span className="text-[11px] font-bold text-[var(--primary)]">
                  {market === 'sa' ? '🇸🇦 SAR' : '🇪🇬 EGP'}
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
                  <span>Theme</span>
                </div>
                <span className="text-[11px] font-semibold text-[var(--muted)]">
                  {theme === 'dark' ? 'Dark' : 'Light'}
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
                <span>Doctor Settings</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
