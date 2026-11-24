# Osrawy Clinical Navigator v2.0.0 — Codebase Part 2: Screens, UI Kit, Formulary & Bilingual i18n

Part 2 contains the consultation screens (Diabetes, HTN, Lipids, Tools, Patient Hub, Drug Directory), shell & UI components, 18-drug formulary catalog, and Arabic/English dictionaries.

## Table of Contents
1. [src\components\ui\AlertBanner.tsx](#src-components-ui-alertbanner-tsx)
2. [src\components\ui\BottomSheet.tsx](#src-components-ui-bottomsheet-tsx)
3. [src\components\ui\ChipToggle.tsx](#src-components-ui-chiptoggle-tsx)
4. [src\components\ui\EmrCopyButton.tsx](#src-components-ui-emrcopybutton-tsx)
5. [src\components\ui\NumericField.tsx](#src-components-ui-numericfield-tsx)
6. [src\components\ui\SegmentedControl.tsx](#src-components-ui-segmentedcontrol-tsx)
7. [src\components\ui\SvgGauge.tsx](#src-components-ui-svggauge-tsx)
8. [src\components\shell\BottomNav.tsx](#src-components-shell-bottomnav-tsx)
9. [src\components\shell\CommandPalette.tsx](#src-components-shell-commandpalette-tsx)
10. [src\components\shell\PatientSwitcherSheet.tsx](#src-components-shell-patientswitchersheet-tsx)
11. [src\components\shell\SafetyBanner.tsx](#src-components-shell-safetybanner-tsx)
12. [src\components\shell\SettingsSheet.tsx](#src-components-shell-settingssheet-tsx)
13. [src\components\shell\SoapSheet.tsx](#src-components-shell-soapsheet-tsx)
14. [src\components\shell\TopBar.tsx](#src-components-shell-topbar-tsx)
15. [src\components\shell\VitalsDrawerSheet.tsx](#src-components-shell-vitalsdrawersheet-tsx)
16. [src\components\shell\VitalsStrip.tsx](#src-components-shell-vitalsstrip-tsx)
17. [src\screens\DiabetesScreen.tsx](#src-screens-diabetesscreen-tsx)
18. [src\screens\DrugDirectoryScreen.tsx](#src-screens-drugdirectoryscreen-tsx)
19. [src\screens\HtnScreen.tsx](#src-screens-htnscreen-tsx)
20. [src\screens\LipidsScreen.tsx](#src-screens-lipidsscreen-tsx)
21. [src\screens\PatientHubScreen.tsx](#src-screens-patienthubscreen-tsx)
22. [src\screens\ToolsScreen.tsx](#src-screens-toolsscreen-tsx)
23. [src/data/formulary.ts](#src-data-formulary-ts)
24. [src/i18n/ar.ts](#src-i18n-ar-ts)
25. [src/i18n/en.ts](#src-i18n-en-ts)
26. [src/i18n/index.ts](#src-i18n-index-ts)
27. [src/styles/index.css](#src-styles-index-css)
28. [src/App.tsx](#src-app-tsx)
29. [src/main.tsx](#src-main-tsx)

---

## src\components\ui\AlertBanner.tsx

`typescript
import React from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface AlertBannerProps {
  level: 'critical' | 'warning' | 'info';
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  actionEn?: string;
  actionAr?: string;
  onAction?: () => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  level,
  titleEn,
  titleAr,
  messageEn,
  messageAr,
  actionEn,
  actionAr,
  onAction,
  className = ''
}) => {
  const lang = useAppStore(s => s.lang);
  const isAr = lang === 'ar';

  const title = isAr ? titleAr : titleEn;
  const message = isAr ? messageAr : messageEn;
  const action = isAr ? actionAr : actionEn;

  const getStyle = () => {
    switch (level) {
      case 'critical':
        return {
          wrapper: 'bg-red-500/10 border-red-500/40 text-red-900 dark:text-red-200',
          icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />,
          btn: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          wrapper: 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
          btn: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      case 'info':
      default:
        return {
          wrapper: 'bg-sky-500/10 border-sky-500/40 text-sky-900 dark:text-sky-200',
          icon: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />,
          btn: 'bg-sky-600 hover:bg-sky-700 text-white'
        };
    }
  };

  const style = getStyle();

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-xl border text-xs sm:text-sm ${style.wrapper} ${className}`}>
      <div className="flex items-start gap-2.5">
        {style.icon}
        <div className="flex-1">
          <h4 className="font-bold text-sm mb-0.5">{title}</h4>
          <p className="text-xs leading-relaxed opacity-90">{message}</p>
        </div>
      </div>

      {action && onAction && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onAction}
            className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg shadow-sm active:scale-95 transition-transform ${style.btn}`}
          >
            <span>{action}</span>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
};
`

---

## src\components\ui\BottomSheet.tsx

`typescript
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface BottomSheetProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  id,
  isOpen,
  onClose,
  title,
  children,
  maxHeight = 'max-h-[88vh]'
}) => {
  const pushOverlay = useAppStore(s => s.pushOverlay);
  const popOverlay = useAppStore(s => s.popOverlay);

  useEffect(() => {
    if (isOpen) {
      pushOverlay(id);
    }
    return () => {
      if (isOpen) {
        popOverlay();
      }
    };
  }, [isOpen, id, pushOverlay, popOverlay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        className={`relative z-10 flex flex-col w-full bg-[var(--surface)] text-[var(--text)] rounded-t-2xl shadow-2xl border-t border-[var(--line)] ${maxHeight} animate-in slide-in-from-bottom duration-200`}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 cursor-grab" onClick={onClose}>
          <div className="w-10 h-1.5 rounded-full bg-[var(--muted)] opacity-40" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--line)]">
          <h3 className="text-base font-semibold truncate text-[var(--text)]">
            {title || ''}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
`

---

## src\components\ui\ChipToggle.tsx

`typescript
import React from 'react';

interface ChipToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger' | 'warning' | 'primary';
  className?: string;
}

export const ChipToggle: React.FC<ChipToggleProps> = ({
  label,
  checked,
  onChange,
  icon,
  variant = 'default',
  className = ''
}) => {
  const getVariantStyles = () => {
    if (!checked) {
      return 'bg-[var(--surface2)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--text)]';
    }
    switch (variant) {
      case 'danger':
        return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40 font-semibold';
      case 'warning':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 font-semibold';
      case 'primary':
      default:
        return 'bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/40 font-semibold';
    }
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs border transition-all active:scale-95 select-none ${getVariantStyles()} ${className}`}
    >
      {icon && <span className="w-3.5 h-3.5 shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
};
`

---

## src\components\ui\EmrCopyButton.tsx

`typescript
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface EmrCopyButtonProps {
  getText: () => string;
  label?: string;
  className?: string;
}

export const EmrCopyButton: React.FC<EmrCopyButtonProps> = ({
  getText,
  label = 'Copy Note',
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const text = getText();
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 select-none ${
        copied
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
          : 'bg-[var(--surface2)] text-[var(--text)] border-[var(--line)] hover:bg-[var(--surface)]'
      } ${className}`}
    >
      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[var(--muted)]" />}
      <span>{copied ? 'Copied!' : label}</span>
    </button>
  );
};
`

---

## src\components\ui\NumericField.tsx

`typescript
import React from 'react';

interface NumericFieldProps {
  label: string;
  value: number | string;
  onChange: (val: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  actionTitle?: string;
  className?: string;
}

export const NumericField: React.FC<NumericFieldProps> = ({
  label,
  value,
  onChange,
  unit,
  min = 0,
  max = 999,
  step = 1,
  actionIcon,
  onAction,
  actionTitle,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-[var(--muted)] truncate uppercase tracking-wider">
          {label}
        </label>
        {actionIcon && onAction && (
          <button
            type="button"
            onClick={onAction}
            title={actionTitle}
            className="p-0.5 text-[var(--primary)] hover:opacity-80 active:scale-95 transition-transform"
          >
            {actionIcon}
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value === 0 ? '' : value}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onChange(isNaN(val) ? 0 : val);
          }}
          className="w-full h-10 px-3 bg-[var(--surface2)] text-[var(--text)] font-mono text-sm rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
        />
        {unit && (
          <span className="absolute end-2.5 text-[11px] font-medium text-[var(--muted)] pointer-events-none select-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};
`

---

## src\components\ui\SegmentedControl.tsx

`typescript
import React from 'react';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = ''
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`flex p-1 bg-[var(--surface2)] rounded-xl border border-[var(--line)] ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all active:scale-[0.98] select-none ${
              isActive
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {opt.icon && <span className="w-4 h-4">{opt.icon}</span>}
            <span className="truncate">{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`ms-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--line)] text-[var(--muted)]'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
`

---

## src\components\ui\SvgGauge.tsx

`typescript
import React from 'react';

interface HbA1cGaugeProps {
  value: number;
  target?: number;
  className?: string;
}

export const HbA1cGauge: React.FC<HbA1cGaugeProps> = ({
  value,
  target = 7.0,
  className = ''
}) => {
  // Map value (4% - 14%) to degrees (-90deg to +90deg)
  const clamped = Math.min(Math.max(value, 4.0), 14.0);
  const percent = (clamped - 4.0) / 10.0;
  const angle = -90 + percent * 180;

  let statusColor = '#10B981'; // Green
  let statusText = 'At Target';
  if (value > target + 1.5) {
    statusColor = '#EF4444'; // Red
    statusText = 'Significantly Above Goal';
  } else if (value > target) {
    statusColor = '#F59E0B'; // Amber
    statusText = 'Above Goal';
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-44 h-24 overflow-hidden">
        <svg viewBox="0 0 100 55" className="w-full h-full">
          {/* Background Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--line)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Green Zone (4 - 7%) */}
          <path
            d="M 10 50 A 40 40 0 0 1 38 18"
            fill="none"
            stroke="#10B981"
            strokeWidth="10"
          />
          {/* Amber Zone (7 - 8.5%) */}
          <path
            d="M 38 18 A 40 40 0 0 1 65 19"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="10"
          />
          {/* Red Zone (8.5 - 14%) */}
          <path
            d="M 65 19 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#EF4444"
            strokeWidth="10"
          />

          {/* Pivot center */}
          <circle cx="50" cy="50" r="4" fill="var(--text)" />

          {/* Needle */}
          <g transform={`rotate(${angle} 50 50)`} className="transition-transform duration-500 ease-out">
            <line x1="50" y1="50" x2="50" y2="16" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      <div className="flex flex-col items-center -mt-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-[var(--text)]">{value.toFixed(1)}</span>
          <span className="text-xs text-[var(--muted)] font-semibold">%</span>
        </div>
        <span className="text-[11px] font-semibold tracking-wide" style={{ color: statusColor }}>
          {statusText} (Target &lt; {target.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
};

interface LdlGapBarProps {
  currentLdl: number;
  targetLdl: number;
  unit?: string;
  className?: string;
}

export const LdlGapBar: React.FC<LdlGapBarProps> = ({
  currentLdl,
  targetLdl,
  unit = 'mg/dL',
  className = ''
}) => {
  const maxDisplay = Math.max(currentLdl * 1.15, targetLdl * 1.5, 160);
  const currentPercent = Math.min((currentLdl / maxDisplay) * 100, 100);
  const targetPercent = Math.min((targetLdl / maxDisplay) * 100, 100);
  const isAtGoal = currentLdl <= targetLdl;
  const gap = Math.max(currentLdl - targetLdl, 0);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[var(--muted)] font-medium">
          Current: <strong className="text-[var(--text)] font-mono">{currentLdl}</strong> {unit}
        </span>
        <span className="text-[var(--muted)] font-medium">
          Target: <strong className="text-[var(--primary)] font-mono">&lt; {targetLdl}</strong> {unit}
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-4 bg-[var(--surface2)] rounded-full overflow-hidden border border-[var(--line)]">
        {/* Fill bar */}
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isAtGoal ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'
          }`}
          style={{ width: `${currentPercent}%` }}
        />

        {/* Target goal indicator line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm z-10"
          style={{ insetInlineStart: `${targetPercent}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[11px]">
        {isAtGoal ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            ✓ At or below target
          </span>
        ) : (
          <span className="text-rose-600 dark:text-rose-400 font-semibold">
            Gap-to-goal: +{gap} {unit} ({Math.round((gap / currentLdl) * 100)}% reduction needed)
          </span>
        )}
      </div>
    </div>
  );
};
`

---

## src\components\shell\BottomNav.tsx

`typescript
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
`

---

## src\components\shell\CommandPalette.tsx

`typescript
import React, { useState, useMemo } from 'react';
import { Search, X, Pill, Calculator, FileText, ArrowRight } from 'lucide-react';
import { useAppStore, AppTab } from '../../store/useAppStore';
import { searchFormulary } from '../../data/formulary';

interface SearchResult {
  id: string;
  type: 'drug' | 'tool' | 'guideline';
  title: string;
  subtitle: string;
  tab: AppTab;
}

const STATIC_TOOLS: SearchResult[] = [
  { id: 'ckd-epi', type: 'tool', title: 'CKD-EPI 2021 Race-Free eGFR', subtitle: 'Kidney Function Calculator', tab: 'tools' },
  { id: 'crcl', type: 'tool', title: 'Cockcroft-Gault Creatinine Clearance', subtitle: 'Renal Drug Dosing (CrCl)', tab: 'tools' },
  { id: 'kdigo', type: 'tool', title: 'KDIGO 2024 Heat-Map Matrix', subtitle: 'Staging G1-G5 & A1-A3 Risk Stratification', tab: 'tools' },
  { id: 'fib4', type: 'tool', title: 'FIB-4 Liver Fibrosis Index', subtitle: 'MASLD / NAFLD Screening & AASLD Cutoffs', tab: 'tools' },
  { id: 'doac', type: 'tool', title: 'DOAC Anticoagulation Dosing', subtitle: 'Apixaban 2-of-3 & Rivaroxaban Renal Dose', tab: 'tools' },
  { id: 'steroids', type: 'tool', title: 'Steroid Dose Equivalence', subtitle: 'Hydrocortisone, Prednisone, Methylprednisolone, Dexamethasone', tab: 'tools' },
  { id: 'rule15', type: 'guideline', title: 'Rule of 15 (Hypoglycemia)', subtitle: 'Patient Education & Management Leaflet', tab: 'patient' },
  { id: 'sadmans', type: 'guideline', title: 'SADMANS Sick-Day Rules', subtitle: 'Withholding Nephrotoxic & Dehydration Drugs', tab: 'patient' },
  { id: 'homebp', type: 'guideline', title: 'Home Blood Pressure Monitoring', subtitle: 'Standardized Measurement Protocol', tab: 'patient' }
];

export const CommandPalette: React.FC = () => {
  const { overlayStack, popOverlay, setActiveTab, market, lang } = useAppStore();
  const isAr = lang === 'ar';
  const isOpen = overlayStack.includes('command-palette');

  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATIC_TOOLS;

    // Search formulary drugs
    const drugHits = searchFormulary(q, market).slice(0, 5).map(d => ({
      id: d.id,
      type: 'drug' as const,
      title: isAr ? `${d.genericAr} (${d.tradeNamesAr[0] || d.tradeNamesEn[0]})` : `${d.genericEn} (${d.tradeNamesEn[0] || d.tradeNamesAr[0]})`,
      subtitle: `${d.doseEn} · Tier ${d.tier}`,
      tab: 'drugs' as AppTab
    }));

    // Search tools & guidelines
    const toolHits = STATIC_TOOLS.filter(t =>
      t.title.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q)
    );

    return [...drugHits, ...toolHits];
  }, [query, market, isAr]);

  if (!isOpen) return null;

  const handleSelect = (item: SearchResult) => {
    setActiveTab(item.tab);
    popOverlay();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-start p-4 sm:p-6 sm:items-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => popOverlay()}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div className="relative z-10 w-full max-w-lg bg-[var(--surface)] text-[var(--text)] rounded-2xl shadow-2xl border border-[var(--line)] overflow-hidden mt-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line)]">
          <Search className="w-5 h-5 text-[var(--primary)] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن دواء، أداة سريرية، أو توصية...' : 'Search drugs, clinical tools, guidelines...'}
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">
              {isAr ? 'لم يتم العثور على نتائج مطابقة.' : 'No matching results found.'}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--surface2)] text-start active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center shrink-0 text-sm">
                      {item.type === 'drug' && <Pill className="w-4 h-4 text-[var(--primary)]" />}
                      {item.type === 'tool' && <Calculator className="w-4 h-4 text-emerald-500" />}
                      {item.type === 'guideline' && <FileText className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-[var(--text)] truncate">{item.title}</div>
                      <div className="text-[10px] text-[var(--muted)] truncate">{item.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--muted)] shrink-0 rtl:rotate-180" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`

---

## src\components\shell\PatientSwitcherSheet.tsx

`typescript
import React, { useState } from 'react';
import { UserPlus, Bookmark, Trash2, Clock, Check } from 'lucide-react';
import { usePatientStore, PatientDraft } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';

export const PatientSwitcherSheet: React.FC = () => {
  const { patient, resetPatient, saveDraft, loadDraft, deleteDraft, getDrafts } = usePatientStore();
  const { overlayStack, popOverlay, lang } = useAppStore();
  const isAr = lang === 'ar';

  const [draftName, setDraftName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isOpen = overlayStack.includes('patient-switcher');
  const drafts = getDrafts();

  const handleNewPatient = () => {
    resetPatient();
    popOverlay();
  };

  const handleSaveDraft = () => {
    saveDraft(draftName || patient.name);
    setDraftName('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSelectDraft = (draft: PatientDraft) => {
    loadDraft(draft.id);
    popOverlay();
  };

  return (
    <BottomSheet
      id="patient-switcher"
      isOpen={isOpen}
      onClose={() => popOverlay()}
      title={isAr ? 'إدارة المريض والمسودات السريرية' : 'Patient Manager & Saved Drafts'}
    >
      <div className="flex flex-col gap-4 py-1">
        {/* Active Patient Card */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-white text-sm font-bold flex items-center justify-center shrink-0">
              {patient.sex === 'f' ? '♀' : '♂'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text)]">{patient.name || 'New Patient'}</h4>
              <p className="text-[11px] text-[var(--muted)]">
                {patient.age}y · eGFR {patient.egfr} · BP {patient.sbp}/{patient.dbp} · {patient.activeMeds.length} meds
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
            Active
          </span>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleNewPatient}
            className="flex items-center justify-center gap-2 h-11 px-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface2)] text-[var(--text)] text-xs font-semibold active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4 text-[var(--primary)]" />
            <span>{isAr ? 'مريض جديد (تصفير)' : 'New Patient'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center justify-center gap-2 h-11 px-3 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold active:scale-95 transition-all shadow-sm"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            <span>{savedSuccess ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ كمسودة' : 'Save as Draft')}</span>
          </button>
        </div>

        {/* Saved Drafts List */}
        <div>
          <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
            {isAr ? 'المسودات المحفوظة مؤخراً' : 'Recent Patient Drafts'} ({drafts.length})
          </h4>

          {drafts.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--muted)] bg-[var(--surface2)] rounded-xl border border-dashed border-[var(--line)]">
              {isAr ? 'لا توجد مسودات محفوظة حالياً.' : 'No saved patient drafts yet.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              {drafts.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface2)] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectDraft(d)}
                    className="flex-1 text-start"
                  >
                    <div className="text-xs font-bold text-[var(--text)]">{d.patient.name}</div>
                    <div className="text-[10px] text-[var(--muted)] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(d.timestamp).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{d.patient.age}y · eGFR {d.patient.egfr}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteDraft(d.id)}
                    className="p-1.5 text-[var(--muted)] hover:text-red-600 transition-colors"
                    title="Delete draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
`

---

## src\components\shell\SafetyBanner.tsx

`typescript
import React from 'react';
import { usePatientStore } from '../../store/usePatientStore';
import { AlertBanner } from '../ui/AlertBanner';

export const SafetyBanner: React.FC = () => {
  const guardrails = usePatientStore(s => s.guardrails);

  if (!guardrails || guardrails.length === 0) return null;

  // Filter for critical or warning alerts
  const urgentAlerts = guardrails.filter(g => g.level === 'critical' || g.level === 'warning');
  if (urgentAlerts.length === 0) return null;

  const topAlert = urgentAlerts[0];

  return (
    <div className="w-full px-3 py-2 bg-[var(--surface)] border-b border-[var(--line)]">
      <AlertBanner
        level={topAlert.level}
        titleEn={topAlert.titleEn}
        titleAr={topAlert.titleAr}
        messageEn={topAlert.messageEn}
        messageAr={topAlert.messageAr}
        actionEn={topAlert.actionEn}
        actionAr={topAlert.actionAr}
      />
    </div>
  );
};
`

---

## src\components\shell\SettingsSheet.tsx

`typescript
import React, { useState } from 'react';
import { Check, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { loadSettings, saveSettings, DoctorSettings } from '../../engines/exporters';

export const SettingsSheet: React.FC = () => {
  const { overlayStack, popOverlay, lang } = useAppStore();
  const isAr = lang === 'ar';
  const isOpen = overlayStack.includes('settings-sheet');

  const [settings, setSettings] = useState<DoctorSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setUpdateMsg(null);
    setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateMsg(isAr ? 'أنت تستخدم أحدث إصدار سريري (v2.0.0).' : 'You are running the latest clinical version (v2.0.0).');
    }, 1200);
  };

  return (
    <BottomSheet
      id="settings-sheet"
      isOpen={isOpen}
      onClose={() => popOverlay()}
      title={isAr ? 'إعدادات الطبيب والعيادة' : 'Doctor Profile & Settings'}
    >
      <div className="flex flex-col gap-4 py-1">
        {/* Doctor Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            {isAr ? 'اسم الطبيب المعالج' : 'Doctor Name'}
          </label>
          <input
            type="text"
            value={settings.doctorName || ''}
            onChange={(e) => setSettings({ ...settings, doctorName: e.target.value })}
            className="w-full h-10 px-3 bg-[var(--surface2)] text-[var(--text)] text-xs font-semibold rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            {isAr ? 'اللقب والتخصص' : 'Title & Specialty'}
          </label>
          <input
            type="text"
            value={settings.doctorTitle || ''}
            onChange={(e) => setSettings({ ...settings, doctorTitle: e.target.value })}
            className="w-full h-10 px-3 bg-[var(--surface2)] text-[var(--text)] text-xs font-semibold rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Clinic Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            {isAr ? 'اسم المركز / العيادة' : 'Clinic / Hospital Name'}
          </label>
          <input
            type="text"
            value={settings.clinicName || ''}
            onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
            className="w-full h-10 px-3 bg-[var(--surface2)] text-[var(--text)] text-xs font-semibold rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Clinic Phone */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            {isAr ? 'هاتف العيادة (للتواصل في الوصفات)' : 'Clinic Phone (WhatsApp)'}
          </label>
          <input
            type="text"
            value={settings.clinicPhone || ''}
            onChange={(e) => setSettings({ ...settings, clinicPhone: e.target.value })}
            className="w-full h-10 px-3 bg-[var(--surface2)] text-[var(--text)] text-xs font-mono rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Save Profile Button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full h-10 flex items-center justify-center gap-2 bg-[var(--primary)] text-white text-xs font-semibold rounded-xl shadow-sm active:scale-[0.98] transition-all"
        >
          {saved ? <Check className="w-4 h-4" /> : null}
          <span>{saved ? (isAr ? 'تم حفظ التعديلات!' : 'Profile Saved!') : (isAr ? 'حفظ بيانات الطبيب' : 'Save Profile')}</span>
        </button>

        {/* App Version & Updater Section */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-[var(--text)]">Osrawy Clinical Navigator</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--muted)] font-bold">v2.0.0</span>
          </div>

          <button
            type="button"
            onClick={handleCheckUpdate}
            disabled={checkingUpdate}
            className="flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] text-xs font-medium hover:bg-[var(--line)] active:scale-95 transition-all mt-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--muted)] ${checkingUpdate ? 'animate-spin' : ''}`} />
            <span>{checkingUpdate ? (isAr ? 'جاري التحقق...' : 'Checking...') : (isAr ? 'التحقق من التحديثات' : 'Check for Updates')}</span>
          </button>

          {updateMsg && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold text-center mt-1">
              {updateMsg}
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
`

---

## src\components\shell\SoapSheet.tsx

`typescript
import React, { useState } from 'react';
import { Copy, Share2, Printer, Check } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { SegmentedControl } from '../ui/SegmentedControl';
import { buildStructuredSoapNote, buildPrescriptionReport, buildWhatsAppShareUrl } from '../../engines/exporters';

export const SoapSheet: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const { overlayStack, popOverlay, lang } = useAppStore();
  const isAr = lang === 'ar';

  const [mode, setMode] = useState<'soap' | 'rx'>('soap');
  const [copied, setCopied] = useState(false);

  const isOpen = overlayStack.includes('soap-sheet');

  const contentText = mode === 'soap'
    ? buildStructuredSoapNote(patient)
    : buildPrescriptionReport(lang, patient);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(contentText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = contentText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleWhatsApp = () => {
    const url = buildWhatsAppShareUrl('', contentText);
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <BottomSheet
      id="soap-sheet"
      isOpen={isOpen}
      onClose={() => popOverlay()}
      title={isAr ? 'ملخص الاستشارة الطبية والوصفة' : 'Clinical SOAP Consultation & Rx'}
      maxHeight="max-h-[92vh]"
    >
      <div className="flex flex-col gap-3 py-1">
        {/* Mode Selector */}
        <SegmentedControl
          value={mode}
          onChange={(val) => setMode(val as 'soap' | 'rx')}
          options={[
            { id: 'soap', label: isAr ? 'ملاحظة SOAP السريرية' : 'SOAP Clinical Note' },
            { id: 'rx', label: isAr ? 'الوصفة الطبية (Rx Report)' : 'Prescription (Rx)' }
          ]}
        />

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
              copied
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                : 'bg-[var(--surface2)] text-[var(--text)] border-[var(--line)] hover:bg-[var(--surface)]'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[var(--muted)]" />}
            <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy')}</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold active:scale-95 transition-all shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--line)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--surface)] active:scale-95 transition-all shrink-0"
            title="Print"
          >
            <Printer className="w-4 h-4 text-[var(--muted)]" />
          </button>
        </div>

        {/* Formatted Text Box */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] max-h-96 overflow-y-auto">
          <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-[var(--text)] select-text">
            {contentText}
          </pre>
        </div>
      </div>
    </BottomSheet>
  );
};
`

---

## src\components\shell\TopBar.tsx

`typescript
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
`

---

## src\components\shell\VitalsDrawerSheet.tsx

`typescript
import React from 'react';
import { usePatientStore } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { NumericField } from '../ui/NumericField';

export const VitalsDrawerSheet: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const setField = usePatientStore(s => s.setField);
  const setBloodPressure = usePatientStore(s => s.setBloodPressure);
  
  const overlayStack = useAppStore(s => s.overlayStack);
  const popOverlay = useAppStore(s => s.popOverlay);
  const lang = useAppStore(s => s.lang);
  const isAr = lang === 'ar';

  const isOpen = overlayStack.includes('vitals-drawer');

  return (
    <BottomSheet
      id="vitals-drawer"
      isOpen={isOpen}
      onClose={() => popOverlay()}
      title={isAr ? 'تعديل المؤشرات الحيوية والفحوصات' : 'Edit Patient Vitals & Labs'}
    >
      <div className="flex flex-col gap-4 py-1">
        {/* Blood Pressure Hero Card */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)]">
          <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider block mb-2">
            {isAr ? 'ضغط الدم (انقباضي / انبساطي)' : 'Blood Pressure (SBP / DBP)'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <NumericField
              label={isAr ? 'انقباضي SBP' : 'Systolic SBP'}
              value={patient.sbp}
              onChange={(val) => setBloodPressure(val, patient.dbp)}
              unit="mmHg"
              min={70}
              max={260}
            />
            <NumericField
              label={isAr ? 'انبساطي DBP' : 'Diastolic DBP'}
              value={patient.dbp}
              onChange={(val) => setBloodPressure(patient.sbp, val)}
              unit="mmHg"
              min={40}
              max={160}
            />
          </div>
        </div>

        {/* Renal & Electrolytes */}
        <div className="grid grid-cols-2 gap-3">
          <NumericField
            label={isAr ? 'معدل الترشيح eGFR' : 'Renal eGFR'}
            value={patient.egfr}
            onChange={(val) => setField('egfr', val)}
            unit="mL/min"
            min={5}
            max={150}
          />
          <NumericField
            label={isAr ? 'البوتاسيوم K+' : 'Potassium K+'}
            value={patient.k}
            onChange={(val) => setField('k', val)}
            unit="mEq/L"
            min={2.0}
            max={9.0}
            step={0.1}
          />
        </div>

        {/* Glycemic Labs */}
        <div className="grid grid-cols-2 gap-3">
          <NumericField
            label={isAr ? 'التراكمي HbA1c' : 'HbA1c'}
            value={patient.a1c}
            onChange={(val) => setField('a1c', val)}
            unit="%"
            min={4.0}
            max={18.0}
            step={0.1}
          />
          <NumericField
            label={isAr ? 'سكر الصائم FPG' : 'Fasting Glucose'}
            value={patient.fpg}
            onChange={(val) => setField('fpg', val)}
            unit="mg/dL"
            min={40}
            max={600}
          />
        </div>

        {/* Albuminuria & Weight */}
        <div className="grid grid-cols-2 gap-3">
          <NumericField
            label={isAr ? 'زلال البول UACR' : 'UACR (Albumin)'}
            value={patient.uacr}
            onChange={(val) => setField('uacr', val)}
            unit="mg/g"
            min={0}
            max={5000}
          />
          <NumericField
            label={isAr ? 'الوزن (كجم)' : 'Weight (kg)'}
            value={patient.wt}
            onChange={(val) => setField('wt', val)}
            unit="kg"
            min={30}
            max={250}
          />
        </div>

        <button
          type="button"
          onClick={() => popOverlay()}
          className="w-full h-11 mt-2 bg-[var(--primary)] text-white font-semibold rounded-xl active:scale-[0.98] transition-transform"
        >
          {isAr ? 'تأكيد وحفظ التعديلات' : 'Save Changes'}
        </button>
      </div>
    </BottomSheet>
  );
};
`

---

## src\components\shell\VitalsStrip.tsx

`typescript
import React from 'react';
import { usePatientStore } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';

export const VitalsStrip: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const bmi = usePatientStore(s => s.bmi);
  const pushOverlay = useAppStore(s => s.pushOverlay);

  // Status colors
  const getEgfrColor = () => {
    if (patient.egfr < 30) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30';
    if (patient.egfr < 60) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const getKColor = () => {
    if (patient.k >= 5.5) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30';
    if (patient.k > 5.0) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const getBpColor = () => {
    if (patient.sbp >= 140 || patient.dbp >= 90) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30';
    if (patient.sbp >= 130 || patient.dbp >= 80) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const getA1cColor = () => {
    if (patient.a1c > 8.5) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30';
    if (patient.a1c > 7.0) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div
      onClick={() => pushOverlay('vitals-drawer')}
      className="sticky top-12 z-20 h-9 w-full bg-[var(--surface)]/95 backdrop-blur-sm border-b border-[var(--line)] px-3 flex items-center gap-2 overflow-x-auto no-scrollbar cursor-pointer hover:bg-[var(--surface2)] transition-colors select-none"
      title="Tap to edit vitals"
    >
      {/* eGFR */}
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${getEgfrColor()}`}>
        <span className="opacity-80">eGFR:</span>
        <span className="font-mono">{patient.egfr}</span>
      </div>

      {/* K+ */}
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${getKColor()}`}>
        <span className="opacity-80">K+:</span>
        <span className="font-mono">{patient.k}</span>
      </div>

      {/* BP */}
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${getBpColor()}`}>
        <span className="opacity-80">BP:</span>
        <span className="font-mono">{patient.sbp}/{patient.dbp}</span>
      </div>

      {/* A1c */}
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${getA1cColor()}`}>
        <span className="opacity-80">A1c:</span>
        <span className="font-mono">{patient.a1c}%</span>
      </div>

      {/* BMI */}
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[var(--line)] bg-[var(--surface2)] text-[var(--muted)] text-[11px] font-semibold shrink-0">
        <span className="opacity-80">BMI:</span>
        <span className="font-mono text-[var(--text)]">{bmi}</span>
      </div>

      <div className="ms-auto text-[10px] text-[var(--muted)] shrink-0 opacity-70">
        Edit ✎
      </div>
    </div>
  );
};
`

---

## src\screens\DiabetesScreen.tsx

`typescript
import React, { useState } from 'react';
import { usePatientStore } from '../store/usePatientStore';
import { useAppStore } from '../store/useAppStore';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { NumericField } from '../components/ui/NumericField';
import { ChipToggle } from '../components/ui/ChipToggle';
import { HbA1cGauge } from '../components/ui/SvgGauge';
import { EmrCopyButton } from '../components/ui/EmrCopyButton';
import { evaluatePregnancyDmProtocol, calculateInsulin, evaluateScreening } from '../engines/diabetes';
import { buildEmrNote } from '../engines/tools';
import { FORMULARY } from '../data/formulary';

export const DiabetesScreen: React.FC = () => {
  const { patient, setField, toggleMedication } = usePatientStore();
  const { lang, market, pushOverlay } = useAppStore();
  const isAr = lang === 'ar';

  const [subTab, setSubTab] = useState<'inputs' | 'plan' | 'rx' | 'insulin' | 'screening'>('inputs');
  const [insSens, setInsSens] = useState<'low' | 'mid' | 'high'>('mid');

  const isPreg = patient.pregnancy;
  const pregProtocol = isPreg ? evaluatePregnancyDmProtocol(patient) : null;
  const screeningList = evaluateScreening(patient);
  const insulinCalc = calculateInsulin(patient.wt, insSens);

  return (
    <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto pb-24">
      {/* Sub-tab bar */}
      <SegmentedControl
        value={subTab}
        onChange={(val) => setSubTab(val as any)}
        options={[
          { id: 'inputs', label: isAr ? 'البيانات' : 'Inputs' },
          { id: 'plan', label: isAr ? 'الخطة' : 'Plan' },
          { id: 'rx', label: isAr ? 'الأدوية' : 'Rx' },
          { id: 'insulin', label: isAr ? 'الإنسولين' : 'Insulin' },
          { id: 'screening', label: isAr ? 'الفحوصات' : 'Screening' }
        ]}
      />

      {/* 1. INPUTS TAB */}
      {subTab === 'inputs' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          {/* Labs Grid 1 */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)]">
            <NumericField
              label={isAr ? 'التراكمي' : 'HbA1c'}
              value={patient.a1c}
              onChange={(v) => setField('a1c', v)}
              unit="%"
              step={0.1}
            />
            <NumericField
              label={isAr ? 'الصائم' : 'FPG'}
              value={patient.fpg}
              onChange={(v) => setField('fpg', v)}
              unit="mg/dL"
            />
            <NumericField
              label={isAr ? 'المدة' : 'Duration'}
              value={patient.dur}
              onChange={(v) => setField('dur', v)}
              unit="yrs"
            />
          </div>

          {/* Labs Grid 2 (Renal & Vitals) */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)]">
            <NumericField
              label="eGFR"
              value={patient.egfr}
              onChange={(v) => setField('egfr', v)}
              unit="mL/min"
              actionIcon="🧮"
              onAction={() => pushOverlay('vitals-drawer')}
              actionTitle="Calculate eGFR"
            />
            <NumericField
              label="UACR"
              value={patient.uacr}
              onChange={(v) => setField('uacr', v)}
              unit="mg/g"
            />
            <NumericField
              label="K+"
              value={patient.k}
              onChange={(v) => setField('k', v)}
              unit="mEq/L"
              step={0.1}
            />
          </div>

          {/* Comorbidities */}
          <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              {isAr ? 'الأمراض المصاحبة وعوامل الخطورة' : 'Comorbidities & Risk Modifiers'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              <ChipToggle
                label={isAr ? 'تصلب شرايين ASCVD' : 'ASCVD'}
                checked={patient.ascvd}
                onChange={(c) => setField('ascvd', c)}
                variant="danger"
              />
              <ChipToggle
                label={isAr ? 'اعتلال كلوي CKD' : 'CKD (eGFR<60 / UACR≥30)'}
                checked={patient.egfr < 60 || patient.uacr >= 30}
                onChange={() => {}}
                variant="warning"
              />
              <ChipToggle
                label={isAr ? 'قصور قلب HF' : 'Heart Failure'}
                checked={patient.hf !== 'none'}
                onChange={(c) => setField('hf', c ? 'hfref' : 'none')}
                variant="warning"
              />
              <ChipToggle
                label={isAr ? 'مدخن' : 'Smoker'}
                checked={patient.smoker}
                onChange={(c) => setField('smoker', c)}
              />
              {patient.sex === 'f' && (
                <ChipToggle
                  label={isAr ? 'حمل' : 'Pregnancy'}
                  checked={patient.pregnancy}
                  onChange={(c) => setField('pregnancy', c)}
                  variant="danger"
                />
              )}
            </div>
          </div>

          {/* Active Diabetes Medications */}
          <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              {isAr ? 'الأدوية الحالية للمريض (انقر للتبديل)' : 'Active DM Medications (Tap to toggle)'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['metformin', 'empagliflozin', 'dapagliflozin', 'semaglutide', 'tirzepatide', 'sitagliptin', 'gliclazide', 'glimepiride', 'insulin'].map((m) => {
                const isActive = patient.activeMeds.some(med => med.toLowerCase().includes(m));
                return (
                  <ChipToggle
                    key={m}
                    label={m.charAt(0).toUpperCase() + m.slice(1)}
                    checked={isActive}
                    onChange={() => toggleMedication(m)}
                    variant="primary"
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. PLAN TAB */}
      {subTab === 'plan' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          {/* HbA1c Gauge Card */}
          <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col items-center">
            <HbA1cGauge value={patient.a1c} target={7.0} />
          </div>

          {/* Pregnancy Protocol Alert if Active */}
          {isPreg && pregProtocol && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-900 dark:text-rose-200">
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                {isAr ? '🌸 بروتوكول السكر في الحمل (ADA 2025)' : '🌸 Obstetric Diabetes Protocol (ADA 2025)'}
              </h4>
              <p className="text-xs leading-relaxed">
                {isAr
                  ? 'أوقف فوراً جميع الحبوب غير الإنسولينية. العلاج المعتمد الوحيد هو الإنسولين القاعدي والوجبات.'
                  : 'Stop all oral and non-insulin agents immediately. Multi-dose basal-bolus insulin is the sole recommended therapy.'}
              </p>
              <div className="mt-2 text-xs font-semibold">
                {isAr ? 'الجرعة المحسوبة:' : 'Calculated Dosing:'} TDD {pregProtocol.dosing.tddUnits} U/d ({pregProtocol.dosing.basalUnits} U basal + {pregProtocol.dosing.mealBolusUnits} U/meal).
              </div>
            </div>
          )}

          {/* Standard Management Recommendation Card */}
          <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                {isAr ? 'الخطة العلاجية الدوائية الموصى بها (ADA 2025)' : 'Pharmacotherapy Plan (ADA 2025)'}
              </h4>
              <EmrCopyButton
                getText={() => buildEmrNote('diabetes', patient, {
                  recommendation: 'First-line: Metformin + SGLT2i / GLP-1 RA for cardiorenal protection'
                })}
              />
            </div>

            <div className="text-xs leading-relaxed text-[var(--text)] space-y-2 mt-1">
              <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                <strong className="text-[var(--text)] block mb-0.5">
                  {isAr ? '1. حماية الأعضاء الحيوية (الكلى والقلب):' : '1. Cardiorenal Protection:'}
                </strong>
                <p className="text-[var(--muted)]">
                  {patient.egfr < 60 || patient.uacr >= 30 || patient.hf !== 'none' || patient.ascvd
                    ? (isAr
                        ? 'المريض لديه اعتلال كلوي أو قصور قلب: يُوصى بشدة ببدء مثبط SGLT2 (داباجليفلوزين 10 مجم أو إمباجليفلوزين 10 مجم) لحماية الكلى والقلب.'
                        : 'Patient has CKD/HF/ASCVD risk: SGLT2 inhibitor (Empagliflozin 10mg or Dapagliflozin 10mg) strongly recommended for cardiorenal protection.')
                    : (isAr
                        ? 'مستوى الخطورة منخفض؛ يُعتمد على الميتفورمين مع نمط الحياة وضبط السكر.'
                        : 'Low cardiorenal risk: Base therapy on Metformin + comprehensive lifestyle.')}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                <strong className="text-[var(--text)] block mb-0.5">
                  {isAr ? '2. الميتفورمين ووظائف الكلى:' : '2. Metformin Renal Guardrails:'}
                </strong>
                <p className="text-[var(--muted)]">
                  {patient.egfr < 30
                    ? (isAr ? '🚨 eGFR < 30: الميتفورمين ممنوع تماماً لخطر الحماض اللبني.' : '🚨 eGFR < 30: Metformin is strictly contraindicated.')
                    : patient.egfr < 45
                    ? (isAr ? '⚠️ eGFR 30–44: الجرعة القصوى للميتفورمين 1000 مجم/يوم.' : '⚠️ eGFR 30–44: Metformin capped at maximum 1000 mg/day.')
                    : (isAr ? '✓ eGFR ≥ 45: ميتفورمين 1000 مجم مرتين يومياً آمن تماماً.' : '✓ eGFR ≥ 45: Full dose Metformin (up to 2000 mg/day) is safe.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RX TAB */}
      {subTab === 'rx' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {isAr ? 'الأدوية المعتمدة لمرض السكري' : 'Diabetes Formulary & Pricing'} ({market.toUpperCase()})
            </h4>
          </div>

          <div className="flex flex-col gap-2">
            {FORMULARY.filter(f => f.category === 'dm').slice(0, 8).map((drug) => {
              const isSelected = patient.activeMeds.some(m => m.toLowerCase().includes(drug.id));
              const brand = market === 'sa'
                ? (drug.saudiBrandsEn?.[0] || drug.tradeNamesEn[0])
                : (drug.egyptBrandsEn?.[0] || drug.tradeNamesEn[0]);

              return (
                <div
                  key={drug.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[var(--primary)]/10 border-[var(--primary)]/50'
                      : 'bg-[var(--surface2)] border-[var(--line)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-[var(--text)]">
                        {isAr ? drug.genericAr : drug.genericEn}
                        <span className="ms-1.5 text-[10px] text-[var(--primary)] font-semibold">
                          ({brand})
                        </span>
                      </h5>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        {isAr ? drug.doseAr : drug.doseEn}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMedication(drug.id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-transform active:scale-95 ${
                        isSelected
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)]'
                      }`}
                    >
                      {isSelected ? (isAr ? 'مضاف ✓' : 'Added ✓') : (isAr ? '+ إضافة' : '+ Add')}
                    </button>
                  </div>

                  {drug.renal && (
                    <div className="mt-2 pt-2 border-t border-[var(--line)]/60 text-[10px] text-[var(--muted)] flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>{isAr ? drug.renal.ruleAr : drug.renal.ruleEn}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. INSULIN TAB */}
      {subTab === 'insulin' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {isAr ? 'حاسبة بدء ومعايرة الإنسولين' : 'Insulin Initiation Calculator'}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <NumericField
                label={isAr ? 'الوزن (كجم)' : 'Weight (kg)'}
                value={patient.wt}
                onChange={(v) => setField('wt', v)}
                unit="kg"
              />
              <NumericField
                label={isAr ? 'سكر الصائم' : 'FPG'}
                value={patient.fpg}
                onChange={(v) => setField('fpg', v)}
                unit="mg/dL"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                {isAr ? 'حساسية الإنسولين' : 'Insulin Sensitivity'}
              </label>
              <SegmentedControl
                value={insSens}
                onChange={(v) => setInsSens(v as any)}
                options={[
                  { id: 'low', label: isAr ? 'منخفضة (0.1 U/kg)' : 'Low (0.1)' },
                  { id: 'mid', label: isAr ? 'معتدلة (0.15 U/kg)' : 'Standard (0.15)' },
                  { id: 'high', label: isAr ? 'مقاومة عالية (0.2 U/kg)' : 'Resistant (0.2)' }
                ]}
              />
            </div>
          </div>

          {/* Dosing Results Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-[var(--surface2)] rounded-xl border border-[var(--line)] text-center">
              <span className="text-[10px] uppercase font-bold text-[var(--muted)] block mb-1">
                {isAr ? 'جرعة البدء القاعدية' : 'Start Basal'}
              </span>
              <div className="text-2xl font-bold font-mono text-[var(--primary)]">
                {insulinCalc.basalStart}
                <small className="text-xs font-normal ms-1 text-[var(--muted)]">U/day</small>
              </div>
              <span className="text-[10px] text-[var(--muted)] block mt-1">
                {isAr ? 'مساءً أو قبل النوم' : 'Glargine/Degludec qhs'}
              </span>
            </div>

            <div className="p-3.5 bg-[var(--surface2)] rounded-xl border border-[var(--line)] text-center">
              <span className="text-[10px] uppercase font-bold text-[var(--muted)] block mb-1">
                {isAr ? 'إجمالي الجرعة المقدرة' : 'Est. TDD'}
              </span>
              <div className="text-2xl font-bold font-mono text-[var(--text)]">
                {insulinCalc.tddStart}
                <small className="text-xs font-normal ms-1 text-[var(--muted)]">U/day</small>
              </div>
              <span className="text-[10px] text-[var(--muted)] block mt-1">
                {isAr ? '50% قاعدي / 50% وجبات' : '50% Basal / 50% Prandial'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. SCREENING TAB */}
      {subTab === 'screening' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {isAr ? 'الفحوصات السريرية والمراقبة الدورية' : 'Surveillance & Complications Screening'}
            </h4>
          </div>

          <div className="flex flex-col gap-3">
            {screeningList.map((grp, gIdx) => (
              <div key={gIdx} className="p-3.5 bg-[var(--surface2)] rounded-xl border border-[var(--line)]">
                <h5 className="text-xs font-bold text-[var(--primary)] mb-2 uppercase tracking-wide">
                  {grp.group}
                </h5>
                <div className="flex flex-col gap-2">
                  {grp.items.map((item: any, iIdx: number) => (
                    <div key={iIdx} className="flex justify-between items-start text-xs border-b border-[var(--line)]/50 pb-2 last:border-0 last:pb-0">
                      <div>
                        <strong className="text-[var(--text)] block">{item.test}</strong>
                        <span className="text-[11px] text-[var(--muted)]">{item.why}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--text)] shrink-0">
                        {item.frequency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
`

---

## src\screens\DrugDirectoryScreen.tsx

`typescript
import React, { useState, useMemo } from 'react';
import { Search, X, Check, Plus, AlertCircle, ArrowLeft } from 'lucide-react';
import { usePatientStore } from '../store/usePatientStore';
import { useAppStore } from '../store/useAppStore';
import { FORMULARY } from '../data/formulary';

export const DrugDirectoryScreen: React.FC = () => {
  const { patient, toggleMedication } = usePatientStore();
  const { market, lang, setActiveTab, previousTab } = useAppStore();
  const isAr = lang === 'ar';

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: isAr ? 'الكل' : 'All' },
    { id: 'dm', label: isAr ? 'السكري' : 'Diabetes' },
    { id: 'htn', label: isAr ? 'الضغط' : 'Hypertension' },
    { id: 'dlp', label: isAr ? 'الدهون' : 'Lipids' },
    { id: 'pc', label: isAr ? 'الرعاية الأولية' : 'Primary Care' },
    { id: 'tools', label: isAr ? 'التخثر' : 'Anticoagulation' }
  ];

  const filteredDrugs = useMemo(() => {
    let list = FORMULARY;
    if (selectedCategory !== 'all') {
      list = list.filter(d => d.category === selectedCategory);
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter(d => {
      const brands = market === 'sa'
        ? [...(d.saudiBrandsEn || []), ...(d.saudiBrandsAr || [])]
        : [...(d.egyptBrandsEn || []), ...(d.egyptBrandsAr || [])];
      
      const names = [
        d.id.toLowerCase(),
        d.genericEn.toLowerCase(),
        d.genericAr.toLowerCase(),
        ...d.tradeNamesEn.map(t => t.toLowerCase()),
        ...d.tradeNamesAr.map(t => t.toLowerCase()),
        ...brands.map(b => b.toLowerCase())
      ];

      return names.some(n => n.includes(q));
    });
  }, [query, selectedCategory, market]);

  return (
    <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto pb-24">
      {/* Header bar with Back Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab(previousTab || 'dm')}
          className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-[var(--text)]">
            {isAr ? 'الدليل الدوائي والأسماء التجارية' : 'Formulary & Trade Directory'}
          </h2>
          <span className="text-[10px] text-[var(--muted)]">
            {market === 'sa' ? 'Saudi Arabia (SAR)' : 'Egypt (EGP)'} · {filteredDrugs.length} drugs
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="absolute start-3 w-4 h-4 text-[var(--muted)] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isAr ? 'ابحث باسم الدواء العلمي أو التجاري (جلوكوفاج، Jardiance...)' : 'Search by generic or trade name (Glucophage, Jardiance)...'}
          className="w-full h-10 ps-9 pe-8 bg-[var(--surface2)] text-xs text-[var(--text)] placeholder-[var(--muted)] font-medium rounded-xl border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute end-2.5 p-1 text-[var(--muted)] hover:text-[var(--text)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 border transition-all ${
              selectedCategory === cat.id
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-[var(--surface2)] text-[var(--muted)] border-[var(--line)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Drug Cards List */}
      <div className="flex flex-col gap-2.5">
        {filteredDrugs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted)] bg-[var(--surface2)] rounded-xl border border-dashed border-[var(--line)]">
            {isAr ? 'لا توجد أدوية مطابقة للبحث.' : 'No matching medications found.'}
          </div>
        ) : (
          filteredDrugs.map((drug) => {
            const isSelected = patient.activeMeds.some(m => m.toLowerCase().includes(drug.id));
            const marketBrands = market === 'sa'
              ? [...(drug.saudiBrandsEn || []), ...(drug.saudiBrandsAr || [])]
              : [...(drug.egyptBrandsEn || []), ...(drug.egyptBrandsAr || [])];
            
            const displayBrands = marketBrands.length > 0
              ? marketBrands
              : [...drug.tradeNamesEn, ...drug.tradeNamesAr];

            return (
              <div
                key={drug.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[var(--primary)]/10 border-[var(--primary)]/50'
                    : 'bg-[var(--surface2)] border-[var(--line)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-[var(--text)]">
                        {isAr ? drug.genericAr : drug.genericEn}
                      </h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--primary)] border border-[var(--line)] font-mono">
                        Tier {drug.tier}
                      </span>
                    </div>

                    {/* Trade Brands */}
                    <div className="text-[11px] font-semibold text-[var(--primary)] mt-0.5 truncate">
                      {displayBrands.slice(0, 3).join(' · ')}
                    </div>

                    {/* Dosing Guideline */}
                    <p className="text-[11px] text-[var(--muted)] mt-1 leading-relaxed">
                      {isAr ? drug.doseAr : drug.doseEn}
                    </p>
                  </div>

                  {/* Add / Remove Button */}
                  <button
                    type="button"
                    onClick={() => toggleMedication(drug.id)}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-transform active:scale-95 shrink-0 ${
                      isSelected
                        ? 'bg-[var(--primary)] text-white shadow-sm'
                        : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] hover:bg-[var(--line)]'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isSelected ? (isAr ? 'مضاف' : 'Added') : (isAr ? 'إضافة' : 'Add')}</span>
                  </button>
                </div>

                {/* Renal Rule Badge */}
                {drug.renal && (
                  <div className="mt-2.5 pt-2 border-t border-[var(--line)]/60 text-[10px] text-[var(--muted)] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="leading-tight">{isAr ? drug.renal.ruleAr : drug.renal.ruleEn}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
`

---

## src\screens\HtnScreen.tsx

`typescript
import React, { useState } from 'react';
import { usePatientStore } from '../store/usePatientStore';
import { useAppStore } from '../store/useAppStore';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { NumericField } from '../components/ui/NumericField';
import { ChipToggle } from '../components/ui/ChipToggle';
import { EmrCopyButton } from '../components/ui/EmrCopyButton';
import { classifyBp, calculateSwitch, evaluatePregnancyHtnProtocol } from '../engines/htn';
import { buildEmrNote } from '../engines/tools';
import { FORMULARY } from '../data/formulary';

export const HtnScreen: React.FC = () => {
  const { patient, setField, setBloodPressure, toggleMedication } = usePatientStore();
  const { lang, market } = useAppStore();
  const isAr = lang === 'ar';

  const [subTab, setSubTab] = useState<'inputs' | 'plan' | 'switch'>('inputs');
  const [lens, setLens] = useState<'acc' | 'esc'>('acc');
  const [switchFrom, setSwitchFrom] = useState('perindopril');
  const [switchTo, setSwitchTo] = useState('sacubitril_valsartan');

  // Math
  const pp = patient.sbp - patient.dbp; // Pulse Pressure
  const map = Math.round(patient.dbp + (pp / 3)); // Mean Arterial Pressure
  const classification = classifyBp(patient.sbp, patient.dbp, lens);
  const switchNotes = calculateSwitch(switchFrom, switchTo);
  const isPreg = patient.pregnancy;
  const pregProtocol = isPreg ? evaluatePregnancyHtnProtocol(patient) : null;

  return (
    <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto pb-24">
      <SegmentedControl
        value={subTab}
        onChange={(val) => setSubTab(val as any)}
        options={[
          { id: 'inputs', label: isAr ? 'البيانات والضغط' : 'Inputs' },
          { id: 'plan', label: isAr ? 'الخطة والهدف' : 'Plan' },
          { id: 'switch', label: isAr ? 'الأدوية والتبديل' : 'Rx & Switch' }
        ]}
      />

      {/* 1. INPUTS TAB */}
      {subTab === 'inputs' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          {/* BP Hero Card */}
          <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--line)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                {isAr ? 'قراءة ضغط الدم الحالية' : 'Current Blood Pressure'}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                classification.isSevere ? 'bg-red-500/15 text-red-600' : 'bg-emerald-500/15 text-emerald-600'
              }`}>
                {classification.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumericField
                label={isAr ? 'الانقباضي SBP' : 'Systolic SBP'}
                value={patient.sbp}
                onChange={(v) => setBloodPressure(v, patient.dbp)}
                unit="mmHg"
                min={70}
                max={260}
              />
              <NumericField
                label={isAr ? 'الانبساطي DBP' : 'Diastolic DBP'}
                value={patient.dbp}
                onChange={(v) => setBloodPressure(patient.sbp, v)}
                unit="mmHg"
                min={40}
                max={160}
              />
            </div>

            {/* Micro hemodynamic readouts */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--line)] text-center text-xs">
              <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--muted)] block">Mean Arterial Pressure (MAP)</span>
                <strong className="text-sm font-mono text-[var(--text)]">{map} <small>mmHg</small></strong>
              </div>
              <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--muted)] block">Pulse Pressure (PP)</span>
                <strong className="text-sm font-mono text-[var(--text)]">{pp} <small>mmHg</small></strong>
              </div>
            </div>
          </div>

          {/* Labs: Renal & K+ */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)]">
            <NumericField
              label={isAr ? 'وظائف الكلى eGFR' : 'Renal eGFR'}
              value={patient.egfr}
              onChange={(v) => setField('egfr', v)}
              unit="mL/min"
            />
            <NumericField
              label={isAr ? 'البوتاسيوم K+' : 'Potassium K+'}
              value={patient.k}
              onChange={(v) => setField('k', v)}
              unit="mEq/L"
              step={0.1}
            />
          </div>

          {/* Comorbidities */}
          <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              {isAr ? 'الحالات السريرية المصاحبة' : 'Comorbidities'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              <ChipToggle
                label={isAr ? 'سكري' : 'Diabetes'}
                checked={patient.diabetes}
                onChange={(c) => setField('diabetes', c)}
                variant="primary"
              />
              <ChipToggle
                label={isAr ? 'تصلب شرايين ASCVD' : 'ASCVD / CAD'}
                checked={patient.ascvd}
                onChange={(c) => setField('ascvd', c)}
                variant="danger"
              />
              <ChipToggle
                label={isAr ? 'قصور قلب HF' : 'Heart Failure'}
                checked={patient.hf !== 'none'}
                onChange={(c) => setField('hf', c ? 'hfref' : 'none')}
                variant="warning"
              />
              <ChipToggle
                label={isAr ? 'ربو' : 'Asthma'}
                checked={patient.asthma}
                onChange={(c) => setField('asthma', c)}
                variant="warning"
              />
              {patient.sex === 'f' && (
                <ChipToggle
                  label={isAr ? 'حمل' : 'Pregnancy'}
                  checked={patient.pregnancy}
                  onChange={(c) => setField('pregnancy', c)}
                  variant="danger"
                />
              )}
            </div>
          </div>

          {/* Active HTN Meds */}
          <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              {isAr ? 'أدوية الضغط النشطة للمريض' : 'Active Antihypertensive Meds'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['ramipril', 'perindopril', 'valsartan', 'losartan', 'amlodipine', 'indapamide', 'bisoprolol', 'spironolactone'].map((m) => {
                const isActive = patient.activeMeds.some(med => med.toLowerCase().includes(m));
                return (
                  <ChipToggle
                    key={m}
                    label={m.charAt(0).toUpperCase() + m.slice(1)}
                    checked={isActive}
                    onChange={() => toggleMedication(m)}
                    variant="primary"
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. PLAN TAB */}
      {subTab === 'plan' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          {/* Guideline Lens Selector */}
          <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text)]">
              {isAr ? 'الدليل الإرشادي المعتمد:' : 'Clinical Guideline Lens:'}
            </span>
            <div className="w-48">
              <SegmentedControl
                value={lens}
                onChange={(v) => setLens(v as any)}
                options={[
                  { id: 'acc', label: 'ACC/AHA 2017' },
                  { id: 'esc', label: 'ESC/ESH 2024' }
                ]}
              />
            </div>
          </div>

          {/* Pregnancy Alert if Active */}
          {isPreg && pregProtocol && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-900 dark:text-rose-200">
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                {isAr ? '🌸 بروتوكول الضغط في الحمل (ACOG / ESC)' : '🌸 Obstetric HTN Protocol (ACOG / ESC)'}
              </h4>
              <p className="text-xs leading-relaxed">
                {isAr
                  ? 'أوقف فوراً أدوية ACEi و ARB والسبيرونولاكتون ومدرات البول. العلاج الآمن: لابيتاول أو نيفيديبين ممتد المفعول.'
                  : 'Stop ACEi, ARB, MRA, and thiazides immediately. First-line therapy: Labetalol or Nifedipine ER.'}
              </p>
              <div className="mt-2 text-xs font-semibold">
                {isAr ? 'العلاج المختار:' : 'Selected Agent:'} {pregProtocol.firstLine.drugName} ({pregProtocol.firstLine.doseEn})
              </div>
            </div>
          )}

          {/* Recommendation Card */}
          <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                {isAr ? 'الخطة العلاجية الدوائية الموصى بها' : 'Blood Pressure Plan & Target'}
              </h4>
              <EmrCopyButton
                getText={() => buildEmrNote('htn', patient, {
                  classification: classification.label,
                  plan: 'Target BP < 130/80 mmHg. Initial dual combination: ACEi/ARB + CCB or Thiazide'
                })}
              />
            </div>

            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
              <strong className="text-xs text-[var(--text)] block mb-1">
                {isAr ? 'الهدف العلاجي لضغط الدم:' : 'Blood Pressure Target:'} &lt; 130/80 mmHg
              </strong>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                {patient.sbp >= 140 || patient.dbp >= 90
                  ? (isAr
                      ? 'ضغط الدم في المرحلة الثانية (Stage 2): يُوصى ببدء علاج ثنائي مركب (Dual Combination في حبة واحدة Single Pill): مثبط ACE / ARB مع محصر قنوات الكالسيوم (Amlodipine) أو مدر ثيازيدي (Indapamide).'
                      : 'Stage 2 Hypertension: Recommend initial dual combination therapy (preferably single-pill fixed-dose combination): ACEi or ARB + CCB (Amlodipine) or thiazide-like diuretic (Indapamide).')
                  : (isAr
                      ? 'الضغط منضبط أو في مرحلة الارتفاع الطفيف؛ يُوصى بتعديل نمط الحياة وإعادة القياس.'
                      : 'Blood pressure at target or elevated: Lifestyle modifications and regular home monitoring.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. SWITCH & RX TAB */}
      {subTab === 'switch' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          {/* Drug Switch Calculator Card */}
          <div className="p-3.5 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {isAr ? 'حاسبة التبديل الآمن بين أدوية الضغط' : 'Antihypertensive Switch Calculator'}
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[var(--muted)]">Switch From:</label>
                <select
                  value={switchFrom}
                  onChange={(e) => setSwitchFrom(e.target.value)}
                  className="h-9 px-2 bg-[var(--surface)] text-[var(--text)] rounded-lg border border-[var(--line)] font-medium"
                >
                  <option value="perindopril">Perindopril (ACEi)</option>
                  <option value="ramipril">Ramipril (ACEi)</option>
                  <option value="valsartan">Valsartan (ARB)</option>
                  <option value="losartan">Losartan (ARB)</option>
                  <option value="amlodipine">Amlodipine (CCB)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[var(--muted)]">Switch To:</label>
                <select
                  value={switchTo}
                  onChange={(e) => setSwitchTo(e.target.value)}
                  className="h-9 px-2 bg-[var(--surface)] text-[var(--text)] rounded-lg border border-[var(--line)] font-medium"
                >
                  <option value="sacubitril_valsartan">Sacubitril/Valsartan (ARNI)</option>
                  <option value="valsartan">Valsartan (ARB)</option>
                  <option value="telmisartan">Telmisartan (ARB)</option>
                  <option value="amlodipine">Amlodipine (CCB)</option>
                </select>
              </div>
            </div>

            {/* Washout & Switch Notes */}
            <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
              {switchNotes.map((note, idx) => (
                <p key={idx} className="text-xs text-[var(--text)] leading-relaxed flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold shrink-0">⚠️</span>
                  <span>{note}</span>
                </p>
              ))}
            </div>
          </div>

          {/* HTN Formulary List */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] px-1">
              {isAr ? 'أدوية الضغط في الدليل الدوائي' : 'HTN Formulary'} ({market.toUpperCase()})
            </h4>

            {FORMULARY.filter(f => f.category === 'htn').slice(0, 8).map((drug) => {
              const isSelected = patient.activeMeds.some(m => m.toLowerCase().includes(drug.id));
              const brand = market === 'sa'
                ? (drug.saudiBrandsEn?.[0] || drug.tradeNamesEn[0])
                : (drug.egyptBrandsEn?.[0] || drug.tradeNamesEn[0]);

              return (
                <div
                  key={drug.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[var(--primary)]/10 border-[var(--primary)]/50'
                      : 'bg-[var(--surface2)] border-[var(--line)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-[var(--text)]">
                        {isAr ? drug.genericAr : drug.genericEn}
                        <span className="ms-1.5 text-[10px] text-[var(--primary)] font-semibold">
                          ({brand})
                        </span>
                      </h5>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        {isAr ? drug.doseAr : drug.doseEn}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMedication(drug.id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-transform active:scale-95 ${
                        isSelected
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)]'
                      }`}
                    >
                      {isSelected ? (isAr ? 'مضاف ✓' : 'Added ✓') : (isAr ? '+ إضافة' : '+ Add')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
`

---

## src\screens\LipidsScreen.tsx

`typescript
import React, { useState } from 'react';
import { usePatientStore } from '../store/usePatientStore';
import { useAppStore } from '../store/useAppStore';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { NumericField } from '../components/ui/NumericField';
import { ChipToggle } from '../components/ui/ChipToggle';
import { LdlGapBar } from '../components/ui/SvgGauge';
import { EmrCopyButton } from '../components/ui/EmrCopyButton';
import { evaluateLipidPathway, RISK_TIERS } from '../engines/lipids';
import { buildEmrNote } from '../engines/tools';

export const LipidsScreen: React.FC = () => {
  const { patient, setField } = usePatientStore();
  const { lang } = useAppStore();
  const isAr = lang === 'ar';

  const [subTab, setSubTab] = useState<'inputs' | 'pathway' | 'matrix'>('inputs');

  const pathway = evaluateLipidPathway(patient);
  const target = pathway.target;
  const strat = pathway.stratification;

  return (
    <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto pb-24">
      <SegmentedControl
        value={subTab}
        onChange={(val) => setSubTab(val as any)}
        options={[
          { id: 'inputs', label: isAr ? 'التحاليل والدهون' : 'Lipid Panel' },
          { id: 'pathway', label: isAr ? 'المسار والهدف' : 'Pathway & Goal' },
          { id: 'matrix', label: isAr ? 'مصفوفة الخطورة' : 'Risk Matrix' }
        ]}
      />

      {/* 1. INPUTS TAB */}
      {subTab === 'inputs' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          {/* Unit Toggle Card */}
          <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text)]">
              {isAr ? 'وحدة قياس الدهون:' : 'Lipid Measurement Unit:'}
            </span>
            <div className="w-40">
              <SegmentedControl
                value={patient.lipidUnit}
                onChange={(v) => setField('lipidUnit', v as any)}
                options={[
                  { id: 'mg', label: 'mg/dL' },
                  { id: 'mmol', label: 'mmol/L' }
                ]}
              />
            </div>
          </div>

          {/* Lipid Labs Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-[var(--surface2)] rounded-xl border border-[var(--line)]">
            <NumericField
              label={isAr ? 'الكوليسترول الكلي TC' : 'Total Cholesterol (TC)'}
              value={patient.totalCholesterol || patient.tc}
              onChange={(v) => { setField('tc', v); setField('totalCholesterol', v); }}
              unit={patient.lipidUnit === 'mmol' ? 'mmol/L' : 'mg/dL'}
              step={patient.lipidUnit === 'mmol' ? 0.1 : 1}
            />
            <NumericField
              label={isAr ? 'الكوليسترول الضار LDL' : 'LDL-C (Direct/Friedewald)'}
              value={patient.ldlC}
              onChange={(v) => setField('ldlC', v)}
              unit={patient.lipidUnit === 'mmol' ? 'mmol/L' : 'mg/dL'}
              step={patient.lipidUnit === 'mmol' ? 0.1 : 1}
            />
            <NumericField
              label={isAr ? 'الدهون الثلاثية TG' : 'Triglycerides (TG)'}
              value={patient.triglycerides}
              onChange={(v) => setField('triglycerides', v)}
              unit={patient.lipidUnit === 'mmol' ? 'mmol/L' : 'mg/dL'}
              step={patient.lipidUnit === 'mmol' ? 0.1 : 1}
            />
            <NumericField
              label={isAr ? 'الكوليسترول المفيد HDL' : 'HDL-C'}
              value={patient.hdlC || patient.hdl}
              onChange={(v) => { setField('hdl', v); setField('hdlC', v); }}
              unit={patient.lipidUnit === 'mmol' ? 'mmol/L' : 'mg/dL'}
              step={patient.lipidUnit === 'mmol' ? 0.1 : 1}
            />
          </div>

          {/* Safety Labs & Modifiers */}
          <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              {isAr ? 'عوامل الخطورة والمعدلات' : 'Risk Modifiers & Safety Labs'}
            </label>
            <div className="grid grid-cols-2 gap-3 mb-1">
              <NumericField
                label={isAr ? 'إنزيم الكبد ALT' : 'ALT (Liver enzyme)'}
                value={patient.altUl}
                onChange={(v) => setField('altUl', v)}
                unit="U/L"
              />
              <NumericField
                label={isAr ? 'وظائف الكلى eGFR' : 'Renal eGFR'}
                value={patient.egfr}
                onChange={(v) => setField('egfr', v)}
                unit="mL/min"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-1">
              <ChipToggle
                label={isAr ? 'تصلب شرايين مثبت ASCVD' : 'Established ASCVD'}
                checked={patient.ascvd}
                onChange={(c) => setField('ascvd', c)}
                variant="danger"
              />
              <ChipToggle
                label={isAr ? 'عدم تحمل الستاتين' : 'Statin Intolerant'}
                checked={patient.statinIntolerant}
                onChange={(c) => setField('statinIntolerant', c)}
                variant="warning"
              />
              {patient.sex === 'f' && (
                <ChipToggle
                  label={isAr ? 'حمل' : 'Pregnancy'}
                  checked={patient.pregnancy}
                  onChange={(c) => setField('pregnancy', c)}
                  variant="danger"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PATHWAY & TARGETS TAB */}
      {subTab === 'pathway' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          {/* Risk Tier & Gap Bar Card */}
          <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">
                  {isAr ? 'تصنيف الخطورة القلبية (ESC/EAS)' : 'ASCVD Risk Tier'}
                </span>
                <h4 className="text-sm font-bold text-[var(--primary)]">
                  {isAr ? strat.tierDetails.nameAr : strat.tierDetails.nameEn}
                </h4>
              </div>
              <EmrCopyButton
                getText={() => buildEmrNote('lipids', patient, {
                  stratification: strat,
                  recommendation: pathway.recommendation
                })}
              />
            </div>

            <LdlGapBar
              currentLdl={pathway.labs.ldlMg}
              targetLdl={target.ldlTargetMg}
              unit="mg/dL"
            />
          </div>

          {/* Clinical Steps */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] px-1">
              {isAr ? 'مسار العلاج الدوائي المعتمد (Steps 1–3)' : 'Stepwise Pharmacotherapy Pathway'}
            </h4>

            {pathway.steps.map((st: any) => (
              <div key={st.stepNumber} className="p-3.5 bg-[var(--surface2)] rounded-xl border border-[var(--line)]">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-xs font-bold text-[var(--primary)]">
                    {isAr ? st.titleAr : st.titleEn}
                  </h5>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--line)]">
                    Step {st.stepNumber}
                  </span>
                </div>
                <strong className="text-xs text-[var(--text)] block mb-1">
                  {isAr ? st.drugAr : st.drugEn}
                </strong>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  {isAr ? st.detailAr : st.detailEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. RISK MATRIX TAB */}
      {subTab === 'matrix' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="p-3.5 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {isAr ? 'مصفوفة أهداف الكوليسترول (ESC/EAS 2023)' : 'ESC/EAS 2023 Lipid Target Matrix'}
            </h4>

            <div className="flex flex-col gap-2 text-xs">
              {Object.values(RISK_TIERS).map((tier) => (
                <div key={tier.key} className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-between">
                  <div>
                    <strong className="text-[var(--text)] block">{isAr ? tier.nameAr : tier.nameEn}</strong>
                    <span className="text-[11px] text-[var(--muted)]">Target LDL: &lt; {tier.ldlTargetMg} mg/dL (&lt; {tier.ldlTargetMmol} mmol/L)</span>
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[var(--surface2)] text-[var(--primary)]">
                    -{tier.reductionPercent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`

---

## src\screens\PatientHubScreen.tsx

`typescript
import React, { useState } from 'react';
import { usePatientStore } from '../store/usePatientStore';
import { useAppStore } from '../store/useAppStore';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { getDynamicTargets, buildShareText } from '../engines/leaflets';
import { generateSVG } from '../engines/qr';
import { Copy, Check } from 'lucide-react';

export const PatientHubScreen: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const { lang } = useAppStore();
  const isAr = lang === 'ar';

  const [subTab, setSubTab] = useState<'leaflets' | 'qr' | 'targets'>('leaflets');
  const [selectedLeaflet, setSelectedLeaflet] = useState<'rule15' | 'sadmans' | 'homebp' | 'redflags'>('rule15');
  const [copied, setCopied] = useState(false);

  const targets = getDynamicTargets(patient);
  const qrSvg = generateSVG('https://osrawy.app/patient/rx', { size: 220, darkColor: '#0A4F4B', lightColor: '#FFFFFF' });

  const handleCopyLeaflet = async () => {
    try {
      const text = buildShareText(targets, lang, 'all');
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto pb-24">
      <SegmentedControl
        value={subTab}
        onChange={(val) => setSubTab(val as any)}
        options={[
          { id: 'leaflets', label: isAr ? 'النشرات التثقيفية' : 'Leaflets' },
          { id: 'qr', label: isAr ? 'رمز QR للمريض' : 'QR Code' },
          { id: 'targets', label: isAr ? 'الأهداف العلاجية' : 'Care Targets' }
        ]}
      />

      {/* 1. LEAFLETS TAB */}
      {subTab === 'leaflets' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          {/* Quick copy row */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {isAr ? 'نشرات التوعية السريرية' : 'Patient Clinical Guides'}
            </span>
            <button
              type="button"
              onClick={handleCopyLeaflet}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--surface2)] border border-[var(--line)] text-[var(--text)] active:scale-95 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />}
              <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'مشاركة النشرة' : 'Share All')}</span>
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedLeaflet('rule15')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
                selectedLeaflet === 'rule15'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--surface2)] text-[var(--muted)] border-[var(--line)]'
              }`}
            >
              {isAr ? 'قاعدة 15 (الهبوط)' : 'Rule of 15'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedLeaflet('sadmans')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
                selectedLeaflet === 'sadmans'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--surface2)] text-[var(--muted)] border-[var(--line)]'
              }`}
            >
              {isAr ? 'أيام المرض (SADMANS)' : 'SADMANS Rules'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedLeaflet('homebp')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
                selectedLeaflet === 'homebp'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--surface2)] text-[var(--muted)] border-[var(--line)]'
              }`}
            >
              {isAr ? 'قياس الضغط المنزلي' : 'Home BP Protocol'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedLeaflet('redflags')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
                selectedLeaflet === 'redflags'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--surface2)] text-[var(--muted)] border-[var(--line)]'
              }`}
            >
              {isAr ? 'علامات الطوارئ' : 'Emergency Red Flags'}
            </button>
          </div>

          {/* Leaflet Content Cards */}
          {selectedLeaflet === 'rule15' && (
            <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2.5 leading-relaxed text-xs">
              <h4 className="text-sm font-bold text-[var(--primary)]">
                {isAr ? '🍬 قاعدة 15 لعلاج هبوط السكر في الدم (< 70 مجم/dL)' : '🍬 Rule of 15 for Hypoglycemia Treatment (< 70 mg/dL)'}
              </h4>
              <p className="text-[var(--text)]">
                {isAr
                  ? 'عند الشعور بالرعشة، التعرق البارد، خفقان القلب، أو الدوخة:'
                  : 'When experiencing shakiness, sweating, dizziness, or lightheadedness:'}
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-[var(--text)] ps-1">
                <li>{isAr ? 'تناول 15 جرام كربوهيدرات سريعة الامتصاص (نصف كوب عصير محلى / 3 أقراص جلوكوز / ملعقة طعام سكر مذابة في ماء).' : 'Consume 15 grams of fast-acting sugar (1/2 cup juice or soda / 3 glucose tabs / 1 tbsp sugar in water).'}</li>
                <li>{isAr ? 'استرح واجلس بهدوء لمدة 15 دقيقة دون مجهود.' : 'Rest quietly for 15 minutes.'}</li>
                <li>{isAr ? 'أعد فحص السكر بعد 15 دقيقة: إذا ما زال أقل من 70 مجم، كرر تناول 15 جرام سكر.' : 'Recheck blood glucose: if still < 70 mg/dL, repeat 15g sugar.'}</li>
                <li>{isAr ? 'بمجرد استقرار السكر فوق 70 مجم، تناول وجبة خفيفة مستقرة (مثل شريحة خبز مع جبن).' : 'Once glucose is >= 70 mg/dL, eat a meal or complex carb snack to maintain stability.'}</li>
              </ol>
            </div>
          )}

          {selectedLeaflet === 'sadmans' && (
            <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2.5 leading-relaxed text-xs">
              <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {isAr ? '⚠️ قواعد أيام المرض والتجفاف (SADMANS Rules)' : '⚠️ SADMANS Sick-Day Dehydration Rules'}
              </h4>
              <p className="text-[var(--text)]">
                {isAr
                  ? 'عند الإصابة بالحمى الشديدة، القيء المتكرر، الإسهال الحاد، أو عدم القدرة على شرب السوائل، يجب إيقاف الأدوية التالية مؤقتاً لتجنب الفشل الكلوي الحاد أو الحماض اللبني:'
                  : 'During acute dehydrating illnesses (fever, vomiting, severe diarrhea, low oral intake), temporarily WITHHOLD these medications to prevent Acute Kidney Injury (AKI) and ketoacidosis:'}
              </p>
              <ul className="space-y-1.5 text-[var(--text)]">
                <li><strong>S - SGLT2i:</strong> {isAr ? 'جارديانس، فورسيجا (خطر الحماض الكيتوني السكري الطبيعي eDKA)' : 'Empagliflozin, Dapagliflozin (euglycemic DKA risk)'}</li>
                <li><strong>A - ACE inhibitors:</strong> {isAr ? 'تريتاس، كوفرسيل (خطر هبوط وظائف الكلى)' : 'Ramipril, Perindopril (AKI risk)'}</li>
                <li><strong>D - Diuretics:</strong> {isAr ? 'إنداباميد، لازكس، هيدروكلوروثيازيد (خطر الجفاف الشديد)' : 'Indapamide, Furosemide, Thiazides (volume depletion)'}</li>
                <li><strong>M - Metformin:</strong> {isAr ? 'جلوكوفاج، ميتفورمين (خطر الحماض اللبني القاتل)' : 'Glucophage (lactic acidosis risk)'}</li>
                <li><strong>A - ARBs:</strong> {isAr ? 'فالسارتان، لوسارتان، إكسفورج (خطر قصور الكلى الحاد)' : 'Valsartan, Losartan (renal hemodynamics)'}</li>
                <li><strong>N - NSAIDs:</strong> {isAr ? 'بروفين، كتافلام، فولتارين (سمية كلوية حادة)' : 'Ibuprofen, Diclofenac, Naproxen (tubular toxicity)'}</li>
                <li><strong>S - Sulfonylureas:</strong> {isAr ? 'أماريل، دياميكرون (خطر هبوط السكر الشديد)' : 'Glimepiride, Gliclazide (severe hypoglycemia)'}</li>
              </ul>
            </div>
          )}

          {selectedLeaflet === 'homebp' && (
            <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2.5 leading-relaxed text-xs">
              <h4 className="text-sm font-bold text-[var(--primary)]">
                {isAr ? '💓 بروتوكول القياس المنزلي الصحيح لضغط الدم (HBPM)' : '💓 Standardized Home Blood Pressure Protocol (HBPM)'}
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-[var(--text)] ps-1">
                <li>{isAr ? 'الراحة التامة لمدة 5 دقائق قبل بدء القياس في غرفة هادئة.' : 'Rest comfortably for 5 minutes before measurement in a quiet room.'}</li>
                <li>{isAr ? 'الجلوس على كرسي مع إسناد الظهر ووضع القدمين مستويتين على الأرض (تجنب وضع ساق على ساق).' : 'Sit with back supported and feet flat on the floor (do not cross legs).'}</li>
                <li>{isAr ? 'إسناد الذراع على طاولة بحيث يكون السوار بمستوى القلب تماماً.' : 'Support arm on a table with the cuff at exact heart level.'}</li>
                <li>{isAr ? 'أخذ قراءتين متتاليتين يفصل بينهما دقيقة صباحاً ومساءً لمدة 7 أيام متتالية.' : 'Take 2 readings 1 minute apart morning and evening for 7 days.'}</li>
                <li>{isAr ? 'الهدف المنزلي المتوسط: أقل من 130/80 ملم زئبق.' : 'Average home BP target: < 130/80 mmHg.'}</li>
              </ul>
            </div>
          )}

          {selectedLeaflet === 'redflags' && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col gap-2.5 leading-relaxed text-xs text-red-900 dark:text-red-200">
              <h4 className="text-sm font-bold text-red-600 dark:text-red-400">
                {isAr ? '🚨 علامات الطوارئ الحرجة (التوجه الفوري للإسعاف)' : '🚨 Red Flag Symptoms (Call Emergency Stat)'}
              </h4>
              <ul className="list-disc list-inside space-y-1.5 ps-1">
                <li>{isAr ? 'ألم ضاغط أو حارق في الصدر ينتشر للكتف أو الفك الأيسر (اشتباه جلطة قلبية).' : 'Crushing substernal chest pain radiating to left arm/jaw.'}</li>
                <li>{isAr ? 'صداع مفاجئ شديد جداً كالصاعقة مع غثيان أو تشوش رؤية.' : 'Sudden thunderclap severe headache with visual changes.'}</li>
                <li>{isAr ? 'ثقل أو تنميل مفاجئ في جانب واحد من الوجه أو الذراع أو صعوبة في النطق.' : 'Facial droop, arm weakness, or slurred speech (FAST stroke signs).'}</li>
                <li>{isAr ? 'ضيق حاد في التنفس أثناء الاستلقاء أو خفقان سريع متسارع مصحوب بدوخة.' : 'Severe acute dyspnea, orthopnea, or syncope.'}</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 2. QR CODE TAB */}
      {subTab === 'qr' && (
        <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in duration-150">
          <div className="text-center">
            <h4 className="text-sm font-bold text-[var(--text)]">
              {isAr ? 'رمز QR للنشرة والوصفة الطبية' : 'Patient Digital Care QR Code'}
            </h4>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {isAr ? 'امسح الرمز بكاميرا الجوال لعرض الخطة والنشرات أوفلاين' : 'Scan with mobile camera to view offline care plan'}
            </p>
          </div>

          {/* QR Code Shield: Forced #FFFFFF background for dark-mode scan invariant */}
          <div
            className="p-4 rounded-2xl shadow-md border border-neutral-300 bg-white select-none"
            style={{ backgroundColor: '#FFFFFF' }}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          <span className="text-[11px] font-mono text-[var(--muted)]">
            100% Offline Vector SVG · No internet required
          </span>
        </div>
      )}

      {/* 3. TARGETS TAB */}
      {subTab === 'targets' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {isAr ? 'الأهداف العلاجية المخصصة للمريض' : 'Individualized Quality Clinical Targets'}
            </h4>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex justify-between items-center">
                <div>
                  <strong className="text-[var(--text)] block">{isAr ? 'السكر التراكمي المستهدف (HbA1c):' : 'Target HbA1c:'}</strong>
                  <span className="text-[11px] text-[var(--muted)]">{isAr ? targets.dm.targetDescAr : targets.dm.targetDescEn}</span>
                </div>
                <span className="text-sm font-bold font-mono text-emerald-600">{targets.dm.targetA1c}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex justify-between items-center">
                <div>
                  <strong className="text-[var(--text)] block">{isAr ? 'ضغط الدم المستهدف (BP):' : 'Target Blood Pressure:'}</strong>
                  <span className="text-[11px] text-[var(--muted)]">{targets.htn.targetHomeBpEn}</span>
                </div>
                <span className="text-sm font-bold font-mono text-emerald-600">{targets.htn.targetBp}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex justify-between items-center">
                <div>
                  <strong className="text-[var(--text)] block">{isAr ? 'الكوليسترول الضار المستهدف (LDL):' : 'Target LDL-C:'}</strong>
                  <span className="text-[11px] text-[var(--muted)]">{isAr ? targets.dlp.riskTierAr : targets.dlp.riskTier}</span>
                </div>
                <span className="text-sm font-bold font-mono text-emerald-600">{targets.dlp.targetLdl}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`

---

## src\screens\ToolsScreen.tsx

`typescript
import React, { useState } from 'react';
import { usePatientStore } from '../store/usePatientStore';
import { useAppStore } from '../store/useAppStore';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { NumericField } from '../components/ui/NumericField';
import { evaluateKdigoMatrix, calculateFib4, evaluateDoacDosing } from '../engines/tools';
import { calculateSteroidEquivalence } from '../engines/calculators';

export const ToolsScreen: React.FC = () => {
  const { patient, setField } = usePatientStore();
  const { lang } = useAppStore();
  const isAr = lang === 'ar';

  const [subTab, setSubTab] = useState<'kdigo' | 'fib4' | 'doac' | 'steroids'>('kdigo');

  // Local state for FIB-4
  const [ast, setAst] = useState(patient.altUl || 32);
  const [alt, setAlt] = useState(patient.altUl || 28);
  const [plt, setPlt] = useState(220);

  // Local state for Steroids
  const [steroidDose, setSteroidDose] = useState(20);
  const [steroidDrug, setSteroidDrug] = useState<'hydrocortisone' | 'prednisone' | 'methylprednisolone' | 'dexamethasone'>('prednisone');

  // Tool evaluations
  const kdigo = evaluateKdigoMatrix(patient.egfr, patient.uacr);
  const fib4 = calculateFib4(patient.age, ast, alt, plt);
  const doac = evaluateDoacDosing(patient);
  const steroidResult = calculateSteroidEquivalence(steroidDose, steroidDrug);

  return (
    <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto pb-24">
      <SegmentedControl
        value={subTab}
        onChange={(val) => setSubTab(val as any)}
        options={[
          { id: 'kdigo', label: 'KDIGO' },
          { id: 'fib4', label: 'FIB-4' },
          { id: 'doac', label: 'DOAC' },
          { id: 'steroids', label: isAr ? 'الكورتيزون' : 'Steroids' }
        ]}
      />

      {/* 1. KDIGO MATRIX */}
      {subTab === 'kdigo' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)]">
            <NumericField
              label="eGFR"
              value={patient.egfr}
              onChange={(v) => setField('egfr', v)}
              unit="mL/min"
            />
            <NumericField
              label="UACR"
              value={patient.uacr}
              onChange={(v) => setField('uacr', v)}
              unit="mg/g"
            />
          </div>

          {/* KDIGO Stage & Risk Card */}
          <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">
                  {isAr ? 'تصنيف المرحلة المركبة (KDIGO 2024)' : 'Composite KDIGO Stage'}
                </span>
                <h4 className="text-xl font-bold font-mono text-[var(--primary)]">
                  {kdigo.stage}
                </h4>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                kdigo.color === 'red' ? 'bg-red-500/15 text-red-600' :
                kdigo.color === 'orange' ? 'bg-amber-500/15 text-amber-600' :
                kdigo.color === 'yellow' ? 'bg-yellow-500/15 text-yellow-600' :
                'bg-emerald-500/15 text-emerald-600'
              }`}>
                {isAr ? kdigo.riskLabelAr : kdigo.riskLabelEn}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--muted)] leading-relaxed">
              <strong className="text-[var(--text)] block mb-1">
                {isAr ? 'التوصية والمتابعة السريرية:' : 'Clinical Action & Surveillance:'}
              </strong>
              {isAr ? kdigo.recommendationAr : kdigo.recommendationEn}
            </div>

            {kdigo.referral && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <span>🚨</span>
                <span>{isAr ? 'يُوصى بتحويل المريض لاستشاري أمراض الكلى (Nephrology Referral).' : 'Nephrology referral strongly indicated for advanced CKD.'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. FIB-4 LIVER FIBROSIS */}
      {subTab === 'fib4' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)]">
            <NumericField
              label="AST"
              value={ast}
              onChange={setAst}
              unit="U/L"
            />
            <NumericField
              label="ALT"
              value={alt}
              onChange={setAlt}
              unit="U/L"
            />
            <NumericField
              label={isAr ? 'الصفائح Plt' : 'Platelets'}
              value={plt}
              onChange={setPlt}
              unit="10⁹/L"
            />
          </div>

          {fib4 && (
            <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">
                    {isAr ? 'مؤشر تليف الكبد (FIB-4 Score)' : 'FIB-4 Fibrosis Score'}
                  </span>
                  <h4 className="text-2xl font-bold font-mono text-[var(--primary)]">
                    {fib4.score}
                  </h4>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  fib4.riskTier === 'HIGH' ? 'bg-red-500/15 text-red-600' :
                  fib4.riskTier === 'INTERMEDIATE' ? 'bg-amber-500/15 text-amber-600' :
                  'bg-emerald-500/15 text-emerald-600'
                }`}>
                  {isAr ? fib4.riskLabelAr : fib4.riskLabelEn}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--muted)] leading-relaxed">
                <strong className="text-[var(--text)] block mb-1">
                  {isAr ? fib4.interpretationAr : fib4.interpretationEn}
                </strong>
                <p>{isAr ? fib4.actionAr : fib4.actionEn}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. DOAC ANTICOAGULATION */}
      {subTab === 'doac' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text)]">
              {isAr ? 'تصفية الكرياتينين المقدرة (CrCl):' : 'Calculated CrCl (Cockcroft-Gault):'}
            </span>
            <span className="text-sm font-bold font-mono text-[var(--primary)]">
              {doac.crcl} <small>mL/min</small>
            </span>
          </div>

          {/* Apixaban Card */}
          <div className="p-3.5 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[var(--text)]">
                {isAr ? doac.apixaban.drugAr : doac.apixaban.drug}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                doac.apixaban.contraindicated ? 'bg-red-500/15 text-red-600' :
                doac.apixaban.reducedDose ? 'bg-amber-500/15 text-amber-600' :
                'bg-emerald-500/15 text-emerald-600'
              }`}>
                {doac.apixaban.reducedDose ? 'Reduced Dose' : (doac.apixaban.contraindicated ? 'Contraindicated' : 'Standard Dose')}
              </span>
            </div>

            <div className="text-sm font-bold font-mono text-[var(--primary)]">
              {isAr ? doac.apixaban.doseAr : doac.apixaban.doseEn}
            </div>

            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              {isAr ? doac.apixaban.reasonAr : doac.apixaban.reasonEn}
            </p>
          </div>

          {/* Rivaroxaban Card */}
          <div className="p-3.5 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[var(--text)]">
                {isAr ? doac.rivaroxaban.drugAr : doac.rivaroxaban.drug}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                doac.rivaroxaban.contraindicated ? 'bg-red-500/15 text-red-600' :
                doac.rivaroxaban.reducedDose ? 'bg-amber-500/15 text-amber-600' :
                'bg-emerald-500/15 text-emerald-600'
              }`}>
                {doac.rivaroxaban.reducedDose ? 'Reduced Dose' : (doac.rivaroxaban.contraindicated ? 'Contraindicated' : 'Standard Dose')}
              </span>
            </div>

            <div className="text-sm font-bold font-mono text-[var(--primary)]">
              {isAr ? doac.rivaroxaban.doseAr : doac.rivaroxaban.doseEn}
            </div>

            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              {isAr ? doac.rivaroxaban.reasonAr : doac.rivaroxaban.reasonEn}
            </p>
          </div>
        </div>
      )}

      {/* 4. STEROIDS EQUIVALENCE */}
      {subTab === 'steroids' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="p-3.5 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {isAr ? 'حاسبة التكافؤ بين مركبات الكورتيزون' : 'Steroid Equivalence Calculator'}
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <NumericField
                label={isAr ? 'الجرعة (مجم)' : 'Dose (mg)'}
                value={steroidDose}
                onChange={setSteroidDose}
                unit="mg"
                min={0.5}
                max={500}
                step={0.5}
              />
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[var(--muted)]">Selected Drug:</label>
                <select
                  value={steroidDrug}
                  onChange={(e) => setSteroidDrug(e.target.value as any)}
                  className="h-10 px-2 bg-[var(--surface)] text-[var(--text)] rounded-lg border border-[var(--line)] font-medium text-xs"
                >
                  <option value="prednisone">Prednisone</option>
                  <option value="hydrocortisone">Hydrocortisone</option>
                  <option value="methylprednisolone">Methylprednisolone</option>
                  <option value="dexamethasone">Dexamethasone</option>
                </select>
              </div>
            </div>
          </div>

          {/* Equivalence Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-center">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">Hydrocortisone</span>
              <strong className="text-xl font-bold font-mono text-[var(--primary)]">{steroidResult.hydrocortisone} <small>mg</small></strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-center">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">Prednisone</span>
              <strong className="text-xl font-bold font-mono text-[var(--primary)]">{steroidResult.prednisone} <small>mg</small></strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-center">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">Methylprednisolone</span>
              <strong className="text-xl font-bold font-mono text-[var(--primary)]">{steroidResult.methylprednisolone} <small>mg</small></strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-center">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">Dexamethasone</span>
              <strong className="text-xl font-bold font-mono text-[var(--primary)]">{steroidResult.dexamethasone} <small>mg</small></strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`

---

## src/data/formulary.ts

`typescript
// ==============================================================
// Clinical Knowledge Base & Bilingual Formulary (Saudi & Egypt)
// Osrawy Clinical Navigator v2.0
// ==============================================================

export interface DrugRenalRule {
  stopBelowEgfr: number;
  cautionBelowEgfr?: number;
  ruleEn: string;
  ruleAr: string;
}

export interface FormularyDrug {
  id: string;
  category: 'dm' | 'htn' | 'dlp' | 'pc' | 'tools' | 'resp' | 'thyroid';
  tier: 1 | 2 | 3;
  classEn: string;
  classAr: string;
  genericEn: string;
  genericAr: string;
  tradeNamesEn: string[];
  tradeNamesAr: string[];
  saudiBrandsEn?: string[];
  saudiBrandsAr?: string[];
  egyptBrandsEn?: string[];
  egyptBrandsAr?: string[];
  strengths: string[];
  doseEn: string;
  doseAr: string;
  renal: DrugRenalRule;
}

export const FORMULARY_CATALOG: FormularyDrug[] = [
  {
    "id": "metformin",
    "category": "dm",
    "tier": 1,
    "classEn": "Biguanide",
    "classAr": "بيجوانيد",
    "genericEn": "Metformin",
    "genericAr": "ميتفورمين",
    "tradeNamesEn": [
      "Glucophage",
      "Glucophage XR",
      "Cidophage",
      "Formit",
      "Diaphage"
    ],
    "tradeNamesAr": [
      "جلوكوفاج",
      "سيدوفاج",
      "فورميت",
      "ديافاج"
    ],
    "saudiBrandsEn": [
      "Glucophage",
      "Glucophage XR",
      "Formit"
    ],
    "saudiBrandsAr": [
      "جلوكوفاج",
      "جلوكوفاج XR",
      "فورميت"
    ],
    "egyptBrandsEn": [
      "Cidophage",
      "Glucophage",
      "Diaphage"
    ],
    "egyptBrandsAr": [
      "سيدوفاج",
      "جلوكوفاج",
      "ديافاج"
    ],
    "strengths": [
      "500 mg",
      "850 mg",
      "1000 mg"
    ],
    "doseEn": "500–1000 mg PO BID with meals (or XR 500–2000 mg once daily)",
    "doseAr": "٥٠٠-١٠٠٠ ملغ مرتين يومياً مع الوجبات (أو الممتد المفعول مرة يومياً)",
    "renal": {
      "stopBelowEgfr": 30,
      "cautionBelowEgfr": 45,
      "ruleEn": "eGFR <30: Contraindicated. eGFR 30–44: Max 1000 mg/day; do not initiate.",
      "ruleAr": "يُمنع عند eGFR <30. وعند 30–44 الحد الأقصى ١٠٠٠ ملغ يومياً."
    }
  },
  {
    "id": "empagliflozin",
    "category": "dm",
    "tier": 2,
    "classEn": "SGLT2 Inhibitor",
    "classAr": "مثبط SGLT2",
    "genericEn": "Empagliflozin",
    "genericAr": "إمباغليفلوزين",
    "tradeNamesEn": [
      "Jardiance",
      "Synjardy (with Metformin)",
      "Mellitofix",
      "Empacrystal"
    ],
    "tradeNamesAr": [
      "جاردينس",
      "سينجاردي",
      "ميليتوفيكس"
    ],
    "saudiBrandsEn": [
      "Jardiance",
      "Synjardy (with Metformin)"
    ],
    "saudiBrandsAr": [
      "جاردينس",
      "سينجاردي"
    ],
    "egyptBrandsEn": [
      "Mellitofix",
      "Empacrystal",
      "Jardiance"
    ],
    "egyptBrandsAr": [
      "ميليتوفيكس",
      "إمباكريستال",
      "جاردينس"
    ],
    "strengths": [
      "10 mg",
      "25 mg"
    ],
    "doseEn": "10–25 mg PO once daily in the morning",
    "doseAr": "١٠-٢٥ ملغ فموياً مرة واحدة صباحاً",
    "renal": {
      "stopBelowEgfr": 20,
      "cautionBelowEgfr": 45,
      "ruleEn": "Safe down to eGFR ≥20 for CKD/HF protection; less glucose lowering if eGFR <45.",
      "ruleAr": "آمن حتى eGFR ≥20 لحماية القلب والكلى؛ يقل مفعول خفض السكر تحت 45."
    }
  },
  {
    "id": "dapagliflozin",
    "category": "dm",
    "tier": 2,
    "classEn": "SGLT2 Inhibitor",
    "classAr": "مثبط SGLT2",
    "genericEn": "Dapagliflozin",
    "genericAr": "داباغليفلوزين",
    "tradeNamesEn": [
      "Forxiga",
      "Xigduo XR (with Metformin)",
      "Dapagloznal",
      "Dapaglif"
    ],
    "tradeNamesAr": [
      "فورسيجا",
      "زيجدو",
      "داباجلوزنال"
    ],
    "saudiBrandsEn": [
      "Forxiga",
      "Xigduo XR (with Metformin)"
    ],
    "saudiBrandsAr": [
      "فورسيجا",
      "زيجدو"
    ],
    "egyptBrandsEn": [
      "Dapagloznal",
      "Dapaglif",
      "Forflozin",
      "Forxiga"
    ],
    "egyptBrandsAr": [
      "داباجلوزنال",
      "داباجليف",
      "فورسيجا"
    ],
    "strengths": [
      "5 mg",
      "10 mg"
    ],
    "doseEn": "10 mg PO once daily",
    "doseAr": "١٠ ملغ فموياً مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 25,
      "cautionBelowEgfr": 45,
      "ruleEn": "Initiate down to eGFR ≥25 for CKD/HF protection.",
      "ruleAr": "يُستخدم حتى eGFR ≥25 لحماية الكلى والقلب."
    }
  },
  {
    "id": "semaglutide",
    "category": "dm",
    "tier": 3,
    "classEn": "GLP-1 Receptor Agonist",
    "classAr": "ناهض مستقبلات GLP-1",
    "genericEn": "Semaglutide",
    "genericAr": "سيماغلوتايد",
    "tradeNamesEn": [
      "Ozempic",
      "Wegovy"
    ],
    "tradeNamesAr": [
      "أوزمبيك",
      "ويغوفي"
    ],
    "strengths": [
      "0.25 mg",
      "0.5 mg",
      "1 mg",
      "2 mg"
    ],
    "doseEn": "0.25 mg SC weekly x4 wks, then 0.5–1 mg weekly",
    "doseAr": "٠.٢٥ ملغ تحت الجلد أسبوعياً لمدة ٤ أسابيع ثم ترفع إلى ٠.٥-١ ملغ",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 15,
      "ruleEn": "No renal dose adjustment required; monitor hydration if GI side effects occur.",
      "ruleAr": "لا يحتاج لتعديل الجرعة كلوياً؛ راقب الجفاف في حال حدوث قيء."
    }
  },
  {
    "id": "tirzepatide",
    "category": "dm",
    "tier": 3,
    "classEn": "Dual GIP/GLP-1 Agonist",
    "classAr": "ناهض مزدوج GIP/GLP-1",
    "genericEn": "Tirzepatide",
    "genericAr": "تيرزيباتايد",
    "tradeNamesEn": [
      "Mounjaro",
      "Zepbound"
    ],
    "tradeNamesAr": [
      "مونجارو"
    ],
    "strengths": [
      "2.5 mg",
      "5 mg",
      "7.5 mg",
      "10 mg",
      "12.5 mg",
      "15 mg"
    ],
    "doseEn": "Start 2.5 mg SC weekly x4 wks; increase by 2.5 mg every 4 wks",
    "doseAr": "٢.٥ ملغ تحت الجلد أسبوعياً لمدة ٤ أسابيع ثم ترفع تدريجياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 15,
      "ruleEn": "No renal dose adjustment required across CKD stages.",
      "ruleAr": "لا يتطلب تعديل الجرعة في القصور الكلوي."
    }
  },
  {
    "id": "sitagliptin",
    "category": "dm",
    "tier": 2,
    "classEn": "DPP-4 Inhibitor",
    "classAr": "مثبط DPP-4",
    "genericEn": "Sitagliptin",
    "genericAr": "سيتاغليبتين",
    "tradeNamesEn": [
      "Januvia",
      "Janumet (with Metformin)",
      "Sitavia",
      "Janaglip"
    ],
    "tradeNamesAr": [
      "جانوفيا",
      "جانوميت",
      "جاناجليب"
    ],
    "saudiBrandsEn": [
      "Januvia",
      "Janumet (with Metformin)",
      "Sitavia"
    ],
    "saudiBrandsAr": [
      "جانوفيا",
      "جانوميت"
    ],
    "egyptBrandsEn": [
      "Janaglip",
      "Sitagliptin generics",
      "Januvia"
    ],
    "egyptBrandsAr": [
      "جاناجليب",
      "سيتاجليبتين محلي",
      "جانوفيا"
    ],
    "strengths": [
      "25 mg",
      "50 mg",
      "100 mg"
    ],
    "doseEn": "100 mg PO once daily (adjust for eGFR)",
    "doseAr": "١٠٠ ملغ مرة يومياً (تعدل حسب وظائف الكلى)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 45,
      "ruleEn": "eGFR 30–44: 50 mg once daily. eGFR <30: 25 mg once daily.",
      "ruleAr": "عند eGFR 30–44: ٥٠ ملغ يومياً. وعند eGFR <30: ٢٥ ملغ يومياً."
    }
  },
  {
    "id": "perindopril",
    "category": "htn",
    "tier": 1,
    "classEn": "ACE Inhibitor",
    "classAr": "مثبط الإنزيم المحول للأنجيوتنسين (ACEi)",
    "genericEn": "Perindopril",
    "genericAr": "بيريندوبريل",
    "tradeNamesEn": [
      "Coversyl",
      "Coveram (with Amlodipine)",
      "Preterax",
      "Perindopril generics"
    ],
    "tradeNamesAr": [
      "كوفرسيل",
      "كوفرام"
    ],
    "saudiBrandsEn": [
      "Coversyl",
      "Coveram (with Amlodipine)",
      "Preterax"
    ],
    "saudiBrandsAr": [
      "كوفرسيل",
      "كوفرام"
    ],
    "egyptBrandsEn": [
      "Coversyl",
      "Coveram",
      "Preterax"
    ],
    "egyptBrandsAr": [
      "كوفرسيل",
      "كوفرام",
      "بريتراكس"
    ],
    "strengths": [
      "5 mg",
      "10 mg"
    ],
    "doseEn": "5–10 mg PO once daily",
    "doseAr": "٥-١٠ ملغ مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "eGFR <30: Start 2.5 mg daily; monitor Cr & K+ within 1–2 weeks.",
      "ruleAr": "عند eGFR <30: ابدأ بجرعة ٢.٥ ملغ وراقب الكرياتينين والبوتاسيوم."
    }
  },
  {
    "id": "valsartan",
    "category": "htn",
    "tier": 2,
    "classEn": "Angiotensin Receptor Blocker (ARB)",
    "classAr": "حاصر مستقبلات الأنجيوتنسين (ARB)",
    "genericEn": "Valsartan",
    "genericAr": "فالسارتان",
    "tradeNamesEn": [
      "Diovan",
      "Co-Diovan (with HCTZ)",
      "Exforge (with Amlodipine)",
      "Tareg"
    ],
    "tradeNamesAr": [
      "ديوفان",
      "كو-ديوفان",
      "إكسفورج",
      "تاريج"
    ],
    "saudiBrandsEn": [
      "Diovan",
      "Co-Diovan (with HCTZ)",
      "Exforge (with Amlodipine)"
    ],
    "saudiBrandsAr": [
      "ديوفان",
      "كو-ديوفان",
      "إكسفورج"
    ],
    "egyptBrandsEn": [
      "Tareg",
      "Diovan",
      "Exforge",
      "Co-Tareg"
    ],
    "egyptBrandsAr": [
      "تاريج",
      "ديوفان",
      "إكسفورج"
    ],
    "strengths": [
      "80 mg",
      "160 mg",
      "320 mg"
    ],
    "doseEn": "80–320 mg PO once daily",
    "doseAr": "٨٠-٣٢٠ ملغ مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "Use caution in severe CKD; hold if K+ ≥5.5 mmol/L or pregnancy.",
      "ruleAr": "حذر في القصور الكلوي الشديد؛ أوقفه إذا كان البوتاسيوم ≥5.5 أو في الحمل."
    }
  },
  {
    "id": "amlodipine",
    "category": "htn",
    "tier": 1,
    "classEn": "Dihydropyridine CCB",
    "classAr": "حاصر قنوات الكالسيوم",
    "genericEn": "Amlodipine",
    "genericAr": "أملوديبين",
    "tradeNamesEn": [
      "Norvasc",
      "Amlor",
      "Vascopin",
      "Alkapress"
    ],
    "tradeNamesAr": [
      "نورفاسك",
      "أملور",
      "ألكابريس"
    ],
    "saudiBrandsEn": [
      "Norvasc",
      "Amlor",
      "Vascopin"
    ],
    "saudiBrandsAr": [
      "نورفاسك",
      "أملور"
    ],
    "egyptBrandsEn": [
      "Alkapress",
      "Norvasc",
      "Vascopin"
    ],
    "egyptBrandsAr": [
      "ألكابريس",
      "نورفاسك"
    ],
    "strengths": [
      "5 mg",
      "10 mg"
    ],
    "doseEn": "5–10 mg PO once daily",
    "doseAr": "٥-١٠ ملغ مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal dose adjustment required; watch for ankle edema at 10 mg.",
      "ruleAr": "لا يتطلب تعديلاً كلوياً؛ قد يسبب تورم الكاحلين بجرعة ١٠ ملغ."
    }
  },
  {
    "id": "indapamide",
    "category": "htn",
    "tier": 1,
    "classEn": "Thiazide-Like Diuretic",
    "classAr": "مدر بول شبيه الثيازيد",
    "genericEn": "Indapamide",
    "genericAr": "إندابامايد",
    "tradeNamesEn": [
      "Natrilix SR",
      "Fludex",
      "Indapamide SR"
    ],
    "tradeNamesAr": [
      "ناتريليكس"
    ],
    "strengths": [
      "1.5 mg SR",
      "2.5 mg"
    ],
    "doseEn": "1.5 mg SR or 2.5 mg PO once daily in the morning",
    "doseAr": "١.٥ ملغ ممتد المفعول مرة واحدة صباحاً",
    "renal": {
      "stopBelowEgfr": 30,
      "cautionBelowEgfr": 45,
      "ruleEn": "Less effective when eGFR <30; switch to a loop diuretic if volume overloaded.",
      "ruleAr": "يفقد فعاليته عند eGFR <30؛ استبدله بمدر عروي (لازكس) عند الاحتقان."
    }
  },
  {
    "id": "bisoprolol",
    "category": "htn",
    "tier": 1,
    "classEn": "Cardioselective Beta-Blocker",
    "classAr": "حاصر بيتا انتقائي للقلب",
    "genericEn": "Bisoprolol",
    "genericAr": "بيسوبرولول",
    "tradeNamesEn": [
      "Concor",
      "BisoCard",
      "Bistol"
    ],
    "tradeNamesAr": [
      "كونكور",
      "بيزوكارد"
    ],
    "saudiBrandsEn": [
      "Concor",
      "BisoCard"
    ],
    "saudiBrandsAr": [
      "كونكور",
      "بيزوكارد"
    ],
    "egyptBrandsEn": [
      "Concor",
      "Bistol",
      "Concor Plus"
    ],
    "egyptBrandsAr": [
      "كونكور",
      "بيستول"
    ],
    "strengths": [
      "2.5 mg",
      "5 mg",
      "10 mg"
    ],
    "doseEn": "2.5–10 mg PO once daily",
    "doseAr": "٢.٥-١٠ ملغ مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 20,
      "ruleEn": "eGFR <20: Do not exceed 10 mg once daily.",
      "ruleAr": "عند eGFR <20: لا تتجاوز ١٠ ملغ يومياً."
    }
  },
  {
    "id": "spironolactone",
    "category": "htn",
    "tier": 1,
    "classEn": "Mineralocorticoid Receptor Antagonist (MRA)",
    "classAr": "مضاد الألدوستيرون",
    "genericEn": "Spironolactone",
    "genericAr": "سبيرونولاكتون",
    "tradeNamesEn": [
      "Aldactone",
      "Spirotone",
      "Spectone"
    ],
    "tradeNamesAr": [
      "ألداكتون"
    ],
    "saudiBrandsEn": [
      "Aldactone",
      "Spirotone"
    ],
    "saudiBrandsAr": [
      "ألداكتون"
    ],
    "egyptBrandsEn": [
      "Spectone",
      "Aldactone"
    ],
    "egyptBrandsAr": [
      "سبكتون",
      "ألداكتون"
    ],
    "strengths": [
      "25 mg",
      "50 mg",
      "100 mg"
    ],
    "doseEn": "25–50 mg PO once daily for resistant HTN or HFrEF",
    "doseAr": "٢٥-٥٠ ملغ مرة يومياً للضغط المقاوم أو قصور القلب",
    "renal": {
      "stopBelowEgfr": 30,
      "cautionBelowEgfr": 45,
      "ruleEn": "Avoid if eGFR <30 or baseline K+ >5.0 mmol/L.",
      "ruleAr": "يُمنع عند eGFR <30 أو إذا كان البوتاسيوم >5.0."
    }
  },
  {
    "id": "atorvastatin",
    "category": "dlp",
    "tier": 1,
    "classEn": "HMG-CoA Reductase Inhibitor (Statin)",
    "classAr": "ستاتين خافض للكوليسترول",
    "genericEn": "Atorvastatin",
    "genericAr": "أتورفاستاتين",
    "tradeNamesEn": [
      "Lipitor",
      "Lorvast",
      "Ator",
      "Tulip"
    ],
    "tradeNamesAr": [
      "ليبيتور",
      "لورفاست",
      "أتور"
    ],
    "saudiBrandsEn": [
      "Lipitor",
      "Lorvast",
      "Ator"
    ],
    "saudiBrandsAr": [
      "ليبيتور",
      "لورفاست"
    ],
    "egyptBrandsEn": [
      "Ator",
      "Lipitor",
      "Atoreza"
    ],
    "egyptBrandsAr": [
      "أتور",
      "ليبيتور"
    ],
    "strengths": [
      "10 mg",
      "20 mg",
      "40 mg",
      "80 mg"
    ],
    "doseEn": "High-intensity: 40–80 mg daily | Moderate: 10–20 mg daily",
    "doseAr": "عالي الشدة: ٤٠-٨٠ ملغ يومياً | متوسط الشدة: ١٠-٢٠ ملغ يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "Preferred statin in severe CKD: no renal dose adjustment needed at any eGFR.",
      "ruleAr": "الستاتين المفضل في القصور الكلوي: لا يحتاج لتعديل الجرعة مهما بلغ eGFR."
    }
  },
  {
    "id": "rosuvastatin",
    "category": "dlp",
    "tier": 2,
    "classEn": "HMG-CoA Reductase Inhibitor (Statin)",
    "classAr": "ستاتين خافض للكوليسترول",
    "genericEn": "Rosuvastatin",
    "genericAr": "روسوفاستاتين",
    "tradeNamesEn": [
      "Crestor",
      "Rosavi",
      "Rovista",
      "Crestolip"
    ],
    "tradeNamesAr": [
      "كريستور",
      "روزافي",
      "روفيستا"
    ],
    "saudiBrandsEn": [
      "Crestor",
      "Rosavi"
    ],
    "saudiBrandsAr": [
      "كريستور",
      "روزافي"
    ],
    "egyptBrandsEn": [
      "Rovista",
      "Crestolip",
      "Crestor"
    ],
    "egyptBrandsAr": [
      "روفيستا",
      "كريستوليب",
      "كريستور"
    ],
    "strengths": [
      "5 mg",
      "10 mg",
      "20 mg",
      "40 mg"
    ],
    "doseEn": "High-intensity: 20–40 mg daily | Moderate: 5–10 mg daily",
    "doseAr": "عالي الشدة: ٢٠-٤٠ ملغ يومياً | متوسط الشدة: ٥-١٠ ملغ يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "eGFR <30: Start at 5 mg and do not exceed 10 mg once daily.",
      "ruleAr": "عند eGFR <30: ابدأ بجرعة ٥ ملغ ولا تتجاوز ١٠ ملغ يومياً."
    }
  },
  {
    "id": "ezetimibe",
    "category": "dlp",
    "tier": 2,
    "classEn": "Cholesterol Absorption Inhibitor",
    "classAr": "مثبط امتصاص الكوليسترول",
    "genericEn": "Ezetimibe",
    "genericAr": "إيزيتيميب",
    "tradeNamesEn": [
      "Ezetrol",
      "Inegy (with Simvastatin)",
      "Rosuzet (with Rosuvastatin)",
      "Cholerose"
    ],
    "tradeNamesAr": [
      "إيزيترول",
      "إينيجي",
      "روزوزيت"
    ],
    "saudiBrandsEn": [
      "Ezetrol",
      "Inegy (with Simvastatin)",
      "Rosuzet (with Rosuvastatin)"
    ],
    "saudiBrandsAr": [
      "إيزيترول",
      "إينيجي",
      "روزوزيت"
    ],
    "egyptBrandsEn": [
      "Ezetrol",
      "Cholerose",
      "Atoreza"
    ],
    "egyptBrandsAr": [
      "إيزيترول",
      "كوليروز",
      "أتوريزا"
    ],
    "strengths": [
      "10 mg"
    ],
    "doseEn": "10 mg PO once daily",
    "doseAr": "١٠ ملغ مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal dose adjustment required.",
      "ruleAr": "لا يتطلب تعديلاً للجرعة الكلوية."
    }
  },
  {
    "id": "fenofibrate",
    "category": "dlp",
    "tier": 2,
    "classEn": "Fibrate (PPAR-α Agonist)",
    "classAr": "فايبرات خافض للدهون الثلاثية",
    "genericEn": "Fenofibrate",
    "genericAr": "فينوفايبرات",
    "tradeNamesEn": [
      "Lipanthyl",
      "Lipanthyl Supra"
    ],
    "tradeNamesAr": [
      "ليبانثيل"
    ],
    "strengths": [
      "145 mg",
      "160 mg",
      "48 mg"
    ],
    "doseEn": "145–160 mg PO once daily (adjust in CKD)",
    "doseAr": "١٤٥-١٦٠ ملغ مرة يومياً",
    "renal": {
      "stopBelowEgfr": 30,
      "cautionBelowEgfr": 60,
      "ruleEn": "eGFR <30: Contraindicated. eGFR 30–59: Max 48–54 mg daily.",
      "ruleAr": "يُمنع عند eGFR <30. وعند 30–59 تخفض الجرعة إلى ٤٨-٥٤ ملغ."
    }
  },
  {
    "id": "budesonide_formoterol",
    "category": "resp",
    "tier": 2,
    "classEn": "ICS + Fast-Onset LABA (MART)",
    "classAr": "كورتيزون مستنشق + موسع شعب سريع وطويل المفعول",
    "genericEn": "Budesonide / Formoterol",
    "genericAr": "بيوديسونيد / فورموتيرول",
    "tradeNamesEn": [
      "Symbicort Turbuhaler",
      "Pulmoton",
      "Foracort"
    ],
    "tradeNamesAr": [
      "سيمبيكورت",
      "بلموتون"
    ],
    "strengths": [
      "160/4.5 mcg",
      "320/9 mcg"
    ],
    "doseEn": "GINA Track 1: 160/4.5 mcg 1–2 puffs BD + 1 puff PRN reliever",
    "doseAr": "مسار GINA ١: بخة إلى بختين مرتين يومياً + بخة عند اللزوم",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal adjustment; rinse mouth after maintenance puffs.",
      "ruleAr": "لا يحتاج لتعديل كلوي؛ يجب المضمضة بالماء بعد الاستخدام."
    }
  },
  {
    "id": "levothyroxine",
    "category": "thyroid",
    "tier": 1,
    "classEn": "Thyroid Hormone Replacement",
    "classAr": "هرمون الغدة الدرقية التعويضي",
    "genericEn": "Levothyroxine",
    "genericAr": "ليفوثيروكسين",
    "tradeNamesEn": [
      "Euthyrox",
      "Eltroxin",
      "Thyroxin"
    ],
    "tradeNamesAr": [
      "إيوثيروكس",
      "إلتروكسين"
    ],
    "strengths": [
      "25 mcg",
      "50 mcg",
      "75 mcg",
      "100 mcg",
      "125 mcg",
      "150 mcg"
    ],
    "doseEn": "1.6 mcg/kg/day PO 30–60 min before breakfast (start 25–50 mcg in ASCVD/elderly)",
    "doseAr": "١.٦ مكغ/كغ صباحاً على الريق (ابدأ بـ ٢٥-٥٠ مكغ لمرضى القلب وكبار السن)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal adjustment; separate by 4 hours from calcium and iron.",
      "ruleAr": "افصل الجرعة ٤ ساعات عن حبوب الكالسيوم والحديد."
    }
  }
];

export const DRUG_BY_ID: Record<string, FormularyDrug> = {};
FORMULARY_CATALOG.forEach(d => {
  DRUG_BY_ID[d.id] = d;
});

export const FORMULARY = FORMULARY_CATALOG;

export function getDrugById(id: string): FormularyDrug | undefined {
  return DRUG_BY_ID[id];
}

export function searchFormulary(query: string, market: 'sa' | 'eg' = 'sa'): FormularyDrug[] {
  const q = query.trim().toLowerCase();
  if (!q) return FORMULARY_CATALOG;

  return FORMULARY_CATALOG.filter(d => {
    const brands = market === 'sa' 
      ? [...(d.saudiBrandsEn || []), ...(d.saudiBrandsAr || [])]
      : [...(d.egyptBrandsEn || []), ...(d.egyptBrandsAr || [])];
    
    const allNames = [
      d.genericEn.toLowerCase(),
      d.genericAr.toLowerCase(),
      ...d.tradeNamesEn.map(t => t.toLowerCase()),
      ...d.tradeNamesAr.map(t => t.toLowerCase()),
      ...brands.map(b => b.toLowerCase())
    ];

    return allNames.some(name => name.includes(q));
  });
}
`

---

## src/i18n/ar.ts

`typescript
export const ar = {
  "app_title": "دليل أوسراوي السريري",
  "app_subtitle": "د. حسام يوسف · طب الأسرة",
  "lang_toggle_btn": "🌐 English",
  "lang_toggle_title": "Switch interface to English / التبديل إلى الإنجليزية",
  "mkt_saudi_pill": "🇸🇦 السوق السعودي (SAR)",
  "mkt_egypt_pill": "🇪🇬 السوق المصري (EGP)",
  "btn_save_draft": "حفظ في المسودات (أوفلاين)",
  "btn_save_draft_label": "حفظ المسودة",
  "btn_quick_search": "البحث السريع والتنقل (Ctrl+K)",
  "btn_recent_drafts": "المسودات المحفوظة",
  "btn_drugs_directory": "دليل الأدوية والأسعار البديلة",
  "btn_theme": "تبديل الوضع الليلي",
  "btn_theme_label": "الوضع الليلي",
  "btn_settings": "إعدادات الطبيب والعيادة",
  "btn_settings_label": "الإعدادات",
  "btn_more": "المزيد",
  "bar_name": "الاسم:",
  "bar_age": "العمر:",
  "bar_years": "سنة",
  "bar_bmi": "BMI:",
  "bar_egfr": "eGFR:",
  "bar_uacr": "UACR:",
  "bar_bp": "الضغط:",
  "bar_new_patient": "مريض جديد",
  "nav_diabetes": "السكري",
  "nav_htn": "الضغط",
  "nav_dlp": "الدهون",
  "nav_tools": "الأدوات",
  "nav_leaflets": "النشرات",
  "nav_drugs": "الأدوية والأسعار",
  "nav_drafts": "المسودات",
  "quick_jump_rx": "الروشتة والتوصيات ⬇",
  "quick_jump_title": "انتقال سريع للروشتة والتوصيات",
  "opt_male": "ذكر",
  "opt_female": "أنثى",
  "opt_none": "لا يوجد",
  "btn_delete": "حذف",
  "btn_load_patient": "تحميل بيانات المريض ➔",
  "dia_eyebrow": "السكري النوع الثاني · البالغين · طب الأسرة",
  "dia_hero_title": "دليل أوسراوي <em>لعلاج السكري</em><br>Treatment Navigator",
  "dia_hero_byline": "إعداد <b>د. حسام يوسف</b>",
  "tab_plan": "العلاج والروشتة",
  "tab_scr": "الفحوصات والمسح",
  "tab_ins": "حاسبة الإنسولين",
  "tab_ref": "الأدوية والأسعار",
  "dia_h2_pt_data": "بيانات المريض",
  "dia_sub_pt_data": "تم تعبئة مريض كمثال. استبدلها ببيانات مريضك.",
  "dia_cheap_desc": "<b>العلاج الفعّال الأقل تكلفة أولاً</b><br>يرتب الخيارات الاقتصادية والمثائل المحلية أولاً مع الحفاظ على حماية القلب والكلى.",
  "dia_h3_basics": "البيانات الأساسية",
  "lbl_pname": "اسم المريض",
  "ph_pname": "مثال: أحمد محمود",
  "lbl_age": "العمر (سنة)",
  "lbl_sex": "الجنس",
  "lbl_wt": "الوزن (كجم)",
  "lbl_ht": "الطول (سم)",
  "lbl_dur": "مدة السكري (سنة)",
  "lbl_hf": "قصور القلب",
  "opt_hf_none": "لا يوجد",
  "opt_hf_ref": "HFrEF (انخفاض كسر القذف)",
  "opt_hf_pef": "HFpEF / HFmrEF",
  "dia_h3_labs": "التحاليل المخبرية",
  "lbl_a1c": "السكر التراكمي HbA1c (%)",
  "lbl_fpg": "سكر الصائم (مجم/ديسيلتر)",
  "lbl_egfr": "معدل ترشيح الكلى eGFR (مل/دقيقة)",
  "lbl_uacr": "زلال البول التراكمي UACR (مجم/جم)",
  "dia_h3_comorb": "الأمراض المصاحبة والمخاطر",
  "chk_ascvd": "أمراض قلب وشرايين مؤكدة (جلطة، ذبحة، قسطرة)",
  "chk_hrisk": "خطورة قلبية وعائية عالية (عمر ≥55 + عاملين خطورة)",
  "chk_masld": "الكبد الدهني الأيضي (MASLD)",
  "chk_smoker": "مدخن حالي أو سابق",
  "chk_hypo": "عرضة لهبوط السكر المتكرر",
  "chk_frail": "مريض مسن / وهن صحي عام",
  "chk_catab": "أعراض هدم حادة: نقص وزن، كيتون، فرط تبول",
  "chk_pancr": "تاريخ التهاب بنكرياس أو أورام الغدة الدرقية",
  "chk_geni": "التهابات مسالك أو فطرية تناسلية متكررة",
  "chk_preg": "حامل أو تخطط للحمل",
  "dia_h3_therapy": "العلاج الحالي",
  "chk_met": "ميتفورمين (Metformin)",
  "chk_su": "سلفونيل يوريا (Sulfonylurea)",
  "chk_dpp": "مثبطات DPP-4 (جانوفيا، جالفوس)",
  "chk_sglt": "مثبطات SGLT2 (فورسيجا، جارديانس)",
  "chk_glp": "مستقبلات GLP-1 / تيرزيباتيد (أوزمبيك، مونجارو)",
  "chk_pio": "بيوجليتازون (Actos)",
  "chk_ins": "إنسولين قاعدي (Basal insulin)",
  "scr_title_needed": "الفحوصات المطلوبة لهذا المريض",
  "scr_title_who": "من يجب فحصهم للكشف عن السكري النوع الثاني",
  "scr_sub_ada": "معايير الجمعية الأمريكية للسكري (ADA) للبالغين بدون أعراض.",
  "scr_item_1": "<b>جميع البالغين بعمر ≥35 سنة</b>؛ ويعاد كل 3 سنوات إذا كانت النتيجة طبيعية.",
  "scr_item_2": "<b>أي عمر، كتلة جسم BMI ≥25</b> (≥23 لآسيويين) <b>+ عامل خطورة أو أكثر</b>: قريب درجة أولى، أمراض قلب، ضغط دم، كبد دهني، تكيس مبايض، خمول، شواك أسود.",
  "scr_item_3": "<b>مرحلة ما قبل السكري</b>: سنوياً. <b>سكري الحمل السابق</b>: كل 3 سنوات على الأقل مدى الحياة.",
  "scr_item_4": "<b>مرضى نقص المناعة</b>، <b>مضادات الذهان</b>، <b>استخدام الكورتيزون المطول</b>.",
  "scr_item_5": "<b>صغار السن</b>: زيادة وزن بعد البلوغ أو عمر ≥10 + عامل خطورة.",
  "scr_h3_diag": "المعايير التشخيصية للسكري",
  "th_test": "الفحص",
  "th_normal": "طبيعي",
  "th_prediabetes": "ما قبل السكري",
  "th_diabetes": "تشخيص سكري",
  "td_a1c": "السكر التراكمي HbA1c",
  "td_fpg": "سكر بلازما صائم",
  "td_ogtt": "تحمل الجلوكوز بعد ساعتين (75 جم)",
  "td_rpg": "سكر عشوائي + أعراض",
  "scr_note": "في غياب الأعراض الصريحة، يتم التأكيد بفحص ثانٍ غير طبيعي. استخدم سكر البلازما بدلاً من التراكمي في حالات فقر الدم، اعتلالات الهيموجلوبين، الحمل، نقل دم حديث، أو الفشل الكلوي المتقدم.",
  "scr_h2_checklist": "قائمة مراجعة الزيارة السريرية",
  "scr_sub_checklist": "حدد الإجراءات المنجزة في هذه الزيارة.",
  "ins_h2_calc": "حاسبة جرعات الإنسولين",
  "ins_sub_calc": "جرعات البدء. يتم التعديل بناءً على قراءات السكر المنزلية.",
  "lbl_ifpg": "متوسط سكر الصائم (مجم/ديسيلتر)",
  "lbl_icur": "جرعة الإنسولين القاعدي الحالية (وحدة/يوم)",
  "lbl_itdd": "إجمالي الجرعة اليومية الحالية (وحدة)",
  "lbl_isens": "حساسية الإنسولين",
  "opt_sens_low": "حساس: مسن، نحيف، وظائف كلى <30، خطورة هبوط",
  "opt_sens_mid": "معتاد",
  "opt_sens_high": "مقاوم: سمنة مفرطة، كورتيزون، تراكمي >10",
  "ins_h3_regimen": "البروتوكول العلاجي",
  "btn_reg_basal": "بدء قاعدي",
  "btn_reg_titrate": "تعديل جرعة القاعدي",
  "btn_reg_bb": "قاعدي + سريع (Basal-bolus)",
  "btn_reg_premix": "مخلوط (Premixed)",
  "btn_reg_switch": "التحويل بين الأنواع",
  "lbl_switch_from": "نوع التحويل",
  "opt_sw_nph2": "NPH مرتين يومياً ← جلارجين U100 مرة واحدة",
  "opt_sw_nph1": "NPH مرة واحدة ← جلارجين U100",
  "opt_sw_g100g300": "جلارجين U100 ← جلارجين U300 (توجيو)",
  "opt_sw_g300g100": "جلارجين U300 ← جلارجين U100",
  "opt_sw_gdeg": "جلارجين U100 ← ديجلوديك (تريسيبا)",
  "opt_sw_premixbb": "إنسولين مخلوط مرتين ← نظام قاعدي وسريع",
  "ins_sec_title": "أنواع الإنسولين والخصائص الدوائية",
  "ins_sec_sub": "الإنسولين البشري هو الخيار الأقل تكلفة. تختلف الأسعار والتوافر محلياً؛ يُرجى التأكد مع الصيدلية.",
  "th_type": "النوع",
  "th_generic": "الاسم العلمي",
  "th_brand": "الاسم التجاري",
  "th_cost": "التكلفة",
  "th_onset": "بدء المفعول",
  "th_peak": "ذروة المفعول",
  "th_duration": "مدة الفعالية",
  "th_timing": "التوقيت",
  "ref_sec_title": "الأدوية الفموية وغير الإنسولين: الجرعات، الكلى، والأسعار",
  "ref_sec_sub": "الأسماء التجارية مرتبة حسب الأقل تكلفة أولاً. مسجلة في السعودية (SFDA) ومصر. الأسعار متغيرة محلياً.",
  "th_drug": "الدواء",
  "th_ref_brand": "الاسم التجاري (الأقل تكلفة أولاً)",
  "th_dose_range": "جرعة البدء ← القصوى",
  "th_kidney_egfr": "تعديل جرعة الكلى (eGFR)",
  "th_cautions": "أبرز المحاذير",
  "dia_footer": "مبني على معايير الجمعية الأمريكية للسكري (ADA) وإرشادات KDIGO وقوائم هيئة الغذاء والدواء السعودية (SFDA). أداة دعم قرار للأطباء؛ لا تغني عن التقييم السريري المستقل. · دليل أوسراوي السريري — د. حسام يوسف",
  "htn_title": "دليل أوسراوي <span>لعلاج ضغط الدم</span>",
  "htn_byline": "إعداد د. حسام يوسف",
  "htn_sub": "لأطباء الأسرة. أدخل متوسط قياسات الضغط المؤكدة والأمراض المصاحبة؛ سيقوم الدليل بتحديد المرحلة والهدف العلاجي والخطوة الدوائية التالية.",
  "htn_legend_bp": "ضغط الدم (المتوسط المؤكد، ملم زئبق)",
  "aria_systolic": "انقباضي",
  "aria_diastolic": "انبساطي",
  "lbl_age_years": "العمر (سنوات)",
  "lbl_cur_bp_drugs": "أدوية الضغط الحالية",
  "opt_meds_none": "لا يتناول (حالة جديدة)",
  "opt_meds_1": "فئة واحدة (1)",
  "opt_meds_2": "فئتان (2)",
  "opt_meds_3": "3 فئات فأكثر مع مدر",
  "lbl_cvd_risk": "احتمالية مخاطر القلب خلال 10 سنوات % (PREVENT)",
  "ph_risk": "اتركه فارغاً إن لم يُحسب",
  "chk_oob": "مؤكد بقياسات منزلية أو هولتر 24 ساعة",
  "htn_legend_comorb": "الأمراض المصاحبة والدواعي العلاجية الخاصة",
  "chk_htn_dm": "مرض السكري",
  "chk_cad": "قصور شرايين القلب / بعد جلطة قلبية",
  "chk_htn_hf": "قصور القلب (HFrEF)",
  "chk_stroke": "جلطة دماغية سابقة أو نوبة نقص تروية عابرة",
  "chk_af": "الرجفان الأذيني (AFib)",
  "chk_gout": "داء النقرس (Gout)",
  "chk_asthma": "الربو الشعبي (Asthma)",
  "chk_bph": "تضخم البروستاتا الحميد (BPH)",
  "chk_ortho": "هبوط ضغط انتصابي (عند الوقوف)",
  "chk_preg_htn": "حامل أو تخطط للحمل",
  "htn_legend_labs": "التحاليل المخبرية",
  "lbl_k": "بوتاسيوم الدم K⁺ (مليمول/لتر)",
  "hint_htn_labs": "UACR ≥30 مجم/جم يعتبر بيلة ألبومينية؛ eGFR <60 أو UACR ≥30 يعتبر قصوراً كلوياً مزمناً (CKD).",
  "htn_legend_prevent": "حاسبة مخاطر القلب والشرايين خلال 10 سنوات · AHA PREVENT",
  "lbl_tc": "الكوليسترول الكلي",
  "lbl_hdl": "الكوليسترول النافع HDL",
  "lbl_unit": "الوحدة",
  "chk_statin": "يتناول ستاتين (مخفض كوليسترول)",
  "hint_prevent": "تستخدم العمر، الجنس، الضغط الانقباضي، السكري، وظائف الكلى، وأدوية الضغط من الحقول أعلاه. صالحة للأعمار من 30 إلى 79 بدون مرض قلبي مسبق.",
  "htn_sec_rec": "التوصية العلاجية",
  "btn_whatsapp": "📲 واتساب",
  "btn_print": "🖨️ طباعة",
  "btn_copy": "📋 نسخ",
  "toast_copied": "تم النسخ",
  "htn_details_summary": "دليل الأدوية: الجرعات اليومية المعتادة للبالغين",
  "htn_th_class": "الفئة",
  "htn_th_drug": "الدواء",
  "htn_th_dose": "الجرعة/يوم",
  "htn_th_watch": "المحاذير والمتابعة",
  "htn_td_ace": "سعال جاف، وذمة وعائية، ↑بوتاسيوم، ↑كرياتينين. مشوه للجنين.",
  "htn_td_arb": "↑بوتاسيوم، ↑كرياتينين. مشوه للجنين. يُمنع مطلقاً مع مثبطات ACE.",
  "htn_td_ccb": "تورم الكاحلين، توهج الوجه.",
  "htn_td_thia": "↓صوديوم، ↓بوتاسيوم، ↑حمض اليوريك، ↑سكر الدم.",
  "htn_td_mra": "↑بوتاسيوم، تثدي لدى الرجال (مع سبيرونولاكتون).",
  "htn_td_bb": "بطء نبض، إرهاق. يفضل الانتقائي قلبياً مع مرضى الربو.",
  "htn_td_preg": "الحمل",
  "htn_td_preg_c": "متابعة مشتركة مع استشاري النساء والولادة.",
  "htn_tools_h": "تبديل الدواء وتعديل الجرعات",
  "htn_tools_desc": "تحويل الجرعات إلى جرعة مكافئة من دواء آخر، وخطة زيادة الجرعة. يُعاد تقييم الضغط دائماً بعد 2 إلى 4 أسابيع من التعديل.",
  "htn_switch_h3": "التحويل بين الأدوية",
  "lbl_from": "من",
  "lbl_cur_dose": "الجرعة الحالية",
  "lbl_to": "إلى",
  "htn_titrate_h3": "خطة زيادة الجرعة التدريجية",
  "lbl_drug": "الدواء",
  "htn_foot": "دعم قرار سريري فقط، مبني على إرشادات ضغط الدم لعام 2025 (AHA/ACC) وإرشادات 2024 (ESC). لا يغني عن التقييم السريري ودليل الممارسة الإكلينيكية السعودي.",
  "drugs_dir_title": "دليل الأدوية والأسعار البديلة",
  "drugs_dir_sub": "ابحث في دليل الأدوية حسب المادة الفعالة أو الاسم التجاري وفئات الأسعار",
  "drugs_btn_sa": "السوق السعودي 🇸🇦 (SAR)",
  "drugs_btn_eg": "السوق المصري 🇪🇬 (EGP)",
  "drugs_ph_search": "🔍 ابحث عن دواء... (مثال: Januvia, Forxiga, Metformin, Concor, Exforge)",
  "drugs_lbl_cat": "التصنيف:",
  "drugs_filter_all": "الكل",
  "drugs_filter_diabetes": "أدوية السكر",
  "drugs_filter_htn": "أدوية الضغط",
  "drugs_filter_dlp": "الدهون والكوليسترول",
  "drugs_filter_resp": "الربو والسدة الرئوية",
  "drugs_filter_thyroid": "الغدة الدرقية",
  "drugs_lbl_tier": "فئة السعر:",
  "drugs_tier_all": "جميع الفئات",
  "drugs_tier_1": "● اقتصادي / منخفض",
  "drugs_tier_2": "●● متوسط",
  "drugs_tier_3": "●●● عالي التكلفة",
  "drugs_empty_found": "لم يتم العثور على أدوية مطابقة للبحث",
  "drugs_empty_hint": "جرب البحث باسم المادة الفعالة أو الاسم التجاري في السوق السعودي",
  "drugs_brands_label": "الأسماء التجارية",
  "drugs_usual_dose": "الجرعة المعتادة:",
  "drugs_renal_adj": "ضبط وظائف الكلى (eGFR):",
  "drugs_cautions": "تنبيهات واحتياطات:",
  "mkt_saudi_short": "السوق السعودي 🇸🇦",
  "mkt_egypt_short": "السوق المصري 🇪🇬",
  "recent_title": "مسودات المرضى المحفوظة (أوفلاين)",
  "recent_sub": "يمكنك استرجاع أو استئناف بيانات أي مريض تم حفظه خلال جلسات العيادة",
  "recent_empty_title": "لا توجد مسودات مرضى محفوظة حالياً.",
  "recent_empty_sub": "عند إدخال بيانات مريض، انقر على 'حفظ في المسودات' للرجوع إليها لاحقاً بدون إنترنت.",
  "settings_title": "⚙️ بيانات الطبيب والعيادة (للروشتة والطباعة)",
  "settings_lbl_name": "اسم الطبيب:",
  "settings_lbl_title": "التخصص والدرجة العلمية:",
  "settings_lbl_clinic": "اسم العيادة / المركز الطبي:",
  "settings_lbl_phone": "رقم هاتف العيادة / الواتساب:",
  "settings_lbl_addr": "العنوان والمدينة:",
  "settings_btn_save": "حفظ الإعدادات",
  "update_sec_title": "🔄 تحديثات التطبيق (GitHub)",
  "update_sec_sub": "فحص وتحميل أحدث الإصدارات من GitHub",
  "btn_check_updates": "🔍 التحقق من وجود تحديثات الآن",
  "title_ldl_matrix": "أهداف الكوليسترول وخطة الستاتين (ADA 2025 / ESC 2023)",
  "btn_ldl_matrix_nav": "🎯 أهداف LDL والستاتين",
  "btn_calc": "حاسبة",
  "calc_egfr_btn_title": "حاسبة وظائف الكلى CKD-EPI 2021",
  "btn_ldl_dia_trigger": "🎯 أهداف LDL وخطة الستاتين (ADA 2025)",
  "btn_ldl_htn_trigger": "🎯 أهداف LDL وخطة الستاتين (ESC/ADA)",
  "calc_modal_title": "حاسبة وظائف الكلى (CKD-EPI 2021)",
  "calc_modal_sub": "معادلة CKD-EPI 2021 الخالية من العرق + Cockcroft-Gault CrCl",
  "calc_lbl_scr": "الكرياتينين بالدم (Serum Creatinine):",
  "calc_lbl_wt": "الوزن (كجم - لحساب CrCl):",
  "calc_hint_unit": "1 mg/dL = 88.4 µmol/L",
  "btn_apply_egfr": "✅ تطبيق الناتج على المريض",
  "btn_cancel": "إلغاء",
  "btn_close": "إغلاق",
  "dlp_inputs_title": "بيانات الدهون ومخاطر القلب (Lipids & ASCVD)",
  "lbl_ldl": "الكوليسترول الضار (LDL-C):",
  "lbl_tg": "الدهون الثلاثية (TG):",
  "lbl_alt": "إنزيم الكبد ALT (U/L):",
  "chk_statin_intol": "عدم تحمل الستاتين (Statin Intolerant)",
  "chk_on_ezetimibe": "يتناول إيزيتيميب (Ezetimibe)",
  "ldl_modal_title": "أهداف الكوليسترول وخطة الستاتين (ASCVD LDL-C Goals & Statins)",
  "ldl_modal_sub": "إرشادات الجمعية الأمريكية للسكري ADA 2025 والجمعية الأوروبية لأمراض القلب ESC 2023",
  "vitals_egfr_label": "الترشيح الكبيبي eGFR",
  "vitals_k_label": "البوتاسيوم K+",
  "vitals_sbp_label": "الضغط الانقباضي SBP",
  "vitals_dbp_label": "الضغط الانبساطي DBP",
  "vitals_preg_label": "الحمل / Pregnancy",
  "vitals_preg_no": "لا",
  "vitals_preg_yes": "نعم (حامل)",
  "vitals_quick_edit": "تعديل سريع",
  "soap_fab_label": "ملخص SOAP",
  "soap_drawer_title": "ملخص الاستشارة الطبية (SOAP)",
  "soap_pull_btn": "🔄 مزامنة",
  "soap_copy_btn": "📋 نسخ الملاحظة",
  "handoff_enter_btn": "📱 وضع شاشة المريض",
  "handoff_exit_btn": "✕ إنهاء وضع المريض"
} as const;

export default ar;
`

---

## src/i18n/en.ts

`typescript
export const en = {
  "app_title": "Osrawy Navigator",
  "app_subtitle": "Dr Hossam Yousuf · Family Practice",
  "lang_toggle_btn": "🌐 عربي",
  "lang_toggle_title": "التبديل إلى الواجهة العربية / Switch interface to Arabic",
  "mkt_saudi_pill": "🇸🇦 Saudi Market (SAR)",
  "mkt_egypt_pill": "🇪🇬 Egypt Market (EGP)",
  "btn_save_draft": "Save to drafts (Offline)",
  "btn_save_draft_label": "Save Draft",
  "btn_quick_search": "Quick Search & Navigation (Ctrl+K)",
  "btn_recent_drafts": "Saved Patient Drafts",
  "btn_drugs_directory": "Drug Directory & Generic Alternatives",
  "btn_theme": "Toggle Dark Mode",
  "btn_theme_label": "Night Mode",
  "btn_settings": "Doctor & Clinic Settings",
  "btn_settings_label": "Settings",
  "btn_more": "More",
  "bar_name": "Name:",
  "bar_age": "Age:",
  "bar_years": "y",
  "bar_bmi": "BMI:",
  "bar_egfr": "eGFR:",
  "bar_uacr": "UACR:",
  "bar_bp": "BP:",
  "bar_new_patient": "New Patient",
  "nav_diabetes": "Diabetes",
  "nav_htn": "Hypertension",
  "nav_dlp": "Lipids",
  "nav_tools": "Tools",
  "nav_leaflets": "Leaflets",
  "nav_drugs": "Drugs & Prices",
  "nav_drafts": "Drafts",
  "quick_jump_rx": "Live Rx & Plan ⬇",
  "quick_jump_title": "Quick jump to prescription & plan",
  "opt_male": "Male",
  "opt_female": "Female",
  "opt_none": "None",
  "btn_delete": "Delete",
  "btn_load_patient": "Load Patient Data ➔",
  "dia_eyebrow": "Type 2 diabetes · adults · family practice",
  "dia_hero_title": "Osrawy <em>Diabetes</em><br>Treatment Navigator",
  "dia_hero_byline": "by <b>Dr Hossam Yousuf</b>",
  "tab_plan": "Treatment & prescription",
  "tab_scr": "Screening",
  "tab_ins": "Insulin calculator",
  "tab_ref": "Drugs & prices",
  "dia_h2_pt_data": "Patient data",
  "dia_sub_pt_data": "Example patient pre-filled. Replace with your patient's values.",
  "dia_cheap_desc": "<b>Cheapest effective treatment first</b><br>Ranks low-cost options and local generics first, keeping heart and kidney protection.",
  "dia_h3_basics": "Basics",
  "lbl_pname": "Patient name",
  "ph_pname": "e.g. Ahmed Mahmoud",
  "lbl_age": "Age (y)",
  "lbl_sex": "Sex",
  "lbl_wt": "Weight (kg)",
  "lbl_ht": "Height (cm)",
  "lbl_dur": "Diabetes duration (y)",
  "lbl_hf": "Heart failure",
  "opt_hf_none": "None",
  "opt_hf_ref": "HFrEF",
  "opt_hf_pef": "HFpEF / HFmrEF",
  "dia_h3_labs": "Labs",
  "lbl_a1c": "HbA1c (%)",
  "lbl_fpg": "Fasting glucose (mg/dL)",
  "lbl_egfr": "eGFR (mL/min/1.73m²)",
  "lbl_uacr": "UACR (mg/g)",
  "dia_h3_comorb": "Comorbidities & risk",
  "chk_ascvd": "Established ASCVD (MI, stroke, PAD)",
  "chk_hrisk": "High CV risk (age ≥55 + ≥2 risk factors / LVH)",
  "chk_masld": "MASLD / fatty liver",
  "chk_smoker": "Current or ex-smoker",
  "chk_hypo": "High hypoglycemia risk",
  "chk_frail": "Frail / limited life expectancy",
  "chk_catab": "Catabolic: weight loss, polyuria, ketosis",
  "chk_pancr": "Pancreatitis / MTC / MEN2 history",
  "chk_geni": "Recurrent genital infections / UTI",
  "chk_preg": "Pregnant or planning pregnancy",
  "dia_h3_therapy": "Current therapy",
  "chk_met": "Metformin",
  "chk_su": "Sulfonylurea",
  "chk_dpp": "DPP-4 inhibitor",
  "chk_sglt": "SGLT2 inhibitor",
  "chk_glp": "GLP-1 RA / tirzepatide",
  "chk_pio": "Pioglitazone",
  "chk_ins": "Basal insulin",
  "scr_title_needed": "Screening needed for this patient",
  "scr_title_who": "Who to screen for type 2 diabetes",
  "scr_sub_ada": "ADA criteria for asymptomatic adults.",
  "scr_item_1": "<b>All adults ≥35 years</b>; repeat every 3 years if normal.",
  "scr_item_2": "<b>Any age, BMI ≥25 kg/m²</b> (≥23 Asian ancestry) <b>plus ≥1 risk factor</b>: first-degree relative with diabetes, CVD, hypertension, HDL &lt;35 or TG &gt;250 mg/dL, PCOS, inactivity, acanthosis nigricans, MASLD.",
  "scr_item_3": "<b>Prediabetes</b>: yearly. <b>Previous GDM</b>: at least every 3 years for life.",
  "scr_item_4": "<b>HIV</b>, <b>antipsychotics</b>, long-term <b>glucocorticoids</b>.",
  "scr_item_5": "<b>Youth</b>: overweight, after puberty or age ≥10, plus ≥1 risk factor.",
  "scr_h3_diag": "Diagnostic thresholds",
  "th_test": "Test",
  "th_normal": "Normal",
  "th_prediabetes": "Prediabetes",
  "th_diabetes": "Diabetes",
  "td_a1c": "HbA1c",
  "td_fpg": "Fasting plasma glucose",
  "td_ogtt": "2-h OGTT (75 g)",
  "td_rpg": "Random glucose + symptoms",
  "scr_note": "Without clear symptoms, confirm with a second abnormal result. Use plasma glucose instead of HbA1c in anemia, hemoglobinopathy, pregnancy, recent transfusion or advanced CKD.",
  "scr_h2_checklist": "Visit checklist",
  "scr_sub_checklist": "Tick items done this visit.",
  "ins_h2_calc": "Insulin dose calculator",
  "ins_sub_calc": "Starting doses. Titrate on home glucose readings.",
  "lbl_ifpg": "Mean fasting glucose (mg/dL)",
  "lbl_icur": "Current basal dose (U/day)",
  "lbl_itdd": "Current total daily dose (U)",
  "lbl_isens": "Insulin sensitivity",
  "opt_sens_low": "Sensitive: elderly, lean, eGFR <30, hypo risk",
  "opt_sens_mid": "Usual",
  "opt_sens_high": "Resistant: obese, steroids, HbA1c >10",
  "ins_h3_regimen": "Regimen",
  "btn_reg_basal": "Start basal",
  "btn_reg_titrate": "Titrate basal",
  "btn_reg_bb": "Basal-bolus",
  "btn_reg_premix": "Premixed",
  "btn_reg_switch": "Switch insulin",
  "lbl_switch_from": "Switch",
  "opt_sw_nph2": "NPH twice daily → glargine U100 once daily",
  "opt_sw_nph1": "NPH once daily → glargine U100",
  "opt_sw_g100g300": "Glargine U100 → glargine U300 (Toujeo)",
  "opt_sw_g300g100": "Glargine U300 → glargine U100",
  "opt_sw_gdeg": "Glargine U100 → degludec (Tresiba)",
  "opt_sw_premixbb": "Premixed twice daily → basal-bolus",
  "ins_sec_title": "Insulin products & pharmacology",
  "ins_sec_sub": "Human insulins are the lowest-cost choice. Availability and prices change; confirm with the pharmacy.",
  "th_type": "Type",
  "th_generic": "Generic",
  "th_brand": "Brand(s)",
  "th_cost": "Cost",
  "th_onset": "Onset",
  "th_peak": "Peak",
  "th_duration": "Duration",
  "th_timing": "Timing",
  "ref_sec_title": "Non-insulin drugs: dose, kidney, brands, cost",
  "ref_sec_sub": "Brands listed lowest cost first. Available in Saudi Arabia (SFDA) and Egypt. Prices change; confirm locally.",
  "th_drug": "Drug",
  "th_ref_brand": "Brand(s), lowest cost first",
  "th_dose_range": "Start → max dose",
  "th_kidney_egfr": "Kidney (eGFR)",
  "th_cautions": "Key cautions",
  "dia_footer": "Based on ADA Standards of Care in Diabetes, ADA/EASD consensus, KDIGO, and Saudi SFDA formularies. A decision aid for clinicians; it does not replace clinical judgement or the product label. · Osrawy Clinical Navigator — Dr Hossam Yousuf",
  "htn_title": "Osrawya HTN Treatment <span>Navigator</span>",
  "htn_byline": "by Dr Hossam Yousuf",
  "htn_sub": "For family physicians. Enter the confirmed average BP and the patient's comorbidities; the sheet updates the stage, target and next drug step. Pre-filled with an example patient.",
  "htn_legend_bp": "Blood pressure (confirmed average, mmHg)",
  "aria_systolic": "Systolic",
  "aria_diastolic": "Diastolic",
  "lbl_age_years": "Age (years)",
  "lbl_cur_bp_drugs": "Current BP drugs",
  "opt_meds_none": "None (new)",
  "opt_meds_1": "1 class",
  "opt_meds_2": "2 classes",
  "opt_meds_3": "3+ incl. diuretic",
  "lbl_cvd_risk": "10-year CVD risk % (PREVENT)",
  "ph_risk": "leave blank if not calculated",
  "chk_oob": "Confirmed by home/ambulatory BP",
  "htn_legend_comorb": "Comorbidities & compelling indications",
  "chk_htn_dm": "Diabetes",
  "chk_cad": "CAD / post-MI",
  "chk_htn_hf": "HFrEF",
  "chk_stroke": "Prior stroke / TIA",
  "chk_af": "Atrial fibrillation",
  "chk_gout": "Gout",
  "chk_asthma": "Asthma",
  "chk_bph": "BPH",
  "chk_ortho": "Orthostatic hypotension",
  "chk_preg_htn": "Pregnant / planning pregnancy",
  "htn_legend_labs": "Labs",
  "lbl_k": "K⁺ (mmol/L)",
  "hint_htn_labs": "UACR ≥30 mg/g counts as albuminuria; eGFR <60 or UACR ≥30 counts as CKD.",
  "htn_legend_prevent": "10-year CVD risk calculator · AHA PREVENT",
  "lbl_tc": "Total cholesterol",
  "lbl_hdl": "HDL cholesterol",
  "lbl_unit": "Units",
  "chk_statin": "On statin",
  "hint_prevent": "Uses age, sex, SBP, diabetes, eGFR and BP-drug use from above. Base model, total CVD (ASCVD + heart failure). Valid for ages 30–79 without known CVD. The result fills the risk field automatically; type in that field to override it.",
  "htn_sec_rec": "Recommendation",
  "btn_whatsapp": "📲 WhatsApp",
  "btn_print": "🖨️ Print",
  "btn_copy": "📋 Copy",
  "toast_copied": "Copied",
  "htn_details_summary": "Drug reference: usual adult daily doses",
  "htn_th_class": "Class",
  "htn_th_drug": "Drug",
  "htn_th_dose": "Dose/day",
  "htn_th_watch": "Watch for",
  "htn_td_ace": "Cough, angioedema, ↑K⁺, ↑creatinine. Teratogenic.",
  "htn_td_arb": "↑K⁺, ↑creatinine. Teratogenic. Never with ACE inhibitor.",
  "htn_td_ccb": "Ankle oedema, flushing.",
  "htn_td_thia": "↓Na⁺, ↓K⁺, ↑uric acid, ↑glucose.",
  "htn_td_mra": "↑K⁺, gynaecomastia (spironolactone).",
  "htn_td_bb": "Bradycardia, fatigue. Cardioselective in asthma.",
  "htn_td_preg": "Pregnancy",
  "htn_td_preg_c": "Co-manage with obstetrics.",
  "htn_tools_h": "Switch & titrate",
  "htn_tools_desc": "Convert a dose to an approximately equipotent dose of another drug, and plan dose increases. Equivalences are approximate BP-lowering equivalents from standard conversion tables; always reassess BP 2–4 weeks after a change.",
  "htn_switch_h3": "Switch drug",
  "lbl_from": "From",
  "lbl_cur_dose": "Current dose",
  "lbl_to": "To",
  "htn_titrate_h3": "Titration plan",
  "lbl_drug": "Drug",
  "htn_foot": "Decision support only, based on the 2025 AHA/ACC High Blood Pressure Guideline and the 2024 ESC Guidelines on Elevated BP and Hypertension. It does not replace clinical judgement, local formulary or the Saudi national hypertension guideline.",
  "drugs_dir_title": "Drug Directory & Generic Alternatives",
  "drugs_dir_sub": "Search drugs by active ingredient, brand name, and price tiers",
  "drugs_btn_sa": "Saudi Market 🇸🇦 (SAR)",
  "drugs_btn_eg": "Egyptian Market 🇪🇬 (EGP)",
  "drugs_ph_search": "🔍 Search drug... (e.g. Januvia, Forxiga, Metformin, Concor, Exforge)",
  "drugs_lbl_cat": "Category:",
  "drugs_filter_all": "All",
  "drugs_filter_diabetes": "Diabetes Drugs",
  "drugs_filter_htn": "HTN Drugs",
  "drugs_filter_dlp": "Lipids",
  "drugs_filter_resp": "Asthma / COPD",
  "drugs_filter_thyroid": "Thyroid",
  "drugs_lbl_tier": "Price Tier:",
  "drugs_tier_all": "All Tiers",
  "drugs_tier_1": "● Low / Economy",
  "drugs_tier_2": "●● Moderate",
  "drugs_tier_3": "●●● High Cost",
  "drugs_empty_found": "No drugs found matching",
  "drugs_empty_hint": "Try searching by generic or brand name in Saudi market",
  "drugs_brands_label": "Brand Names",
  "drugs_usual_dose": "Usual Dose:",
  "drugs_renal_adj": "Renal Adjustment (eGFR):",
  "drugs_cautions": "Cautions & Warnings:",
  "mkt_saudi_short": "Saudi Market 🇸🇦",
  "mkt_egypt_short": "Egypt Market 🇪🇬",
  "recent_title": "Saved Patient Drafts (Offline)",
  "recent_sub": "Retrieve or resume any patient saved during clinic consultations",
  "recent_empty_title": "No saved patient drafts yet.",
  "recent_empty_sub": "When entering patient data, click 'Save to drafts' to revisit anytime offline.",
  "settings_title": "⚙️ Doctor & Clinic Profile (For Rx & Print)",
  "settings_lbl_name": "Doctor Name:",
  "settings_lbl_title": "Title & Specialty:",
  "settings_lbl_clinic": "Clinic / Medical Center:",
  "settings_lbl_phone": "Clinic Phone / WhatsApp:",
  "settings_lbl_addr": "Address & City:",
  "settings_btn_save": "Save Settings",
  "update_sec_title": "🔄 App Updates (GitHub)",
  "update_sec_sub": "Check and download latest releases from GitHub",
  "btn_check_updates": "🔍 Check for Updates Now",
  "title_ldl_matrix": "🎯 ASCVD LDL-C Goals & Statin Intensity (ADA 2025 / ESC 2023)",
  "btn_ldl_matrix_nav": "🎯 LDL & Statins",
  "btn_calc": "Calc",
  "calc_egfr_btn_title": "CKD-EPI 2021 eGFR Calculator",
  "btn_ldl_dia_trigger": "🎯 LDL Goals & Statin Strategy (ADA 2025)",
  "btn_ldl_htn_trigger": "🎯 LDL Goals & Statin Strategy (ESC/ADA)",
  "calc_modal_title": "Kidney Function Calculator (CKD-EPI 2021)",
  "calc_modal_sub": "Race-Free CKD-EPI 2021 equation + Cockcroft-Gault CrCl",
  "calc_lbl_scr": "Serum Creatinine:",
  "calc_lbl_wt": "Weight (kg - for CrCl):",
  "calc_hint_unit": "1 mg/dL = 88.4 µmol/L",
  "btn_apply_egfr": "✅ Apply eGFR to Patient",
  "btn_cancel": "Cancel",
  "btn_close": "Close",
  "dlp_inputs_title": "Lipids & ASCVD Risk Profile",
  "lbl_ldl": "LDL-C:",
  "lbl_tg": "Triglycerides (TG):",
  "lbl_alt": "Liver ALT (U/L):",
  "chk_statin_intol": "Statin Intolerant",
  "chk_on_ezetimibe": "On Ezetimibe",
  "ldl_modal_title": "ASCVD LDL-C Goals & Statin Intensity Guide",
  "ldl_modal_sub": "ADA Standards of Care 2025 & ESC 2023 Guidelines",
  "vitals_egfr_label": "eGFR (mL/min)",
  "vitals_k_label": "Serum K+ (mmol/L)",
  "vitals_sbp_label": "Systolic BP (SBP)",
  "vitals_dbp_label": "Diastolic BP (DBP)",
  "vitals_preg_label": "Pregnancy Status",
  "vitals_preg_no": "No",
  "vitals_preg_yes": "Yes (Pregnant)",
  "vitals_quick_edit": "Quick Edit",
  "soap_fab_label": "SOAP Note",
  "soap_drawer_title": "EMR SOAP Consultation Summary",
  "soap_pull_btn": "🔄 Sync",
  "soap_copy_btn": "📋 Copy SOAP Note",
  "handoff_enter_btn": "📱 Patient Handoff Mode",
  "handoff_exit_btn": "✕ Exit Patient Mode"
} as const;

export default en;
`

---

## src/i18n/index.ts

`typescript
import { ar } from './ar';
import { en } from './en';

export type I18nKey = keyof typeof en;
export type Language = 'ar' | 'en';

export const dictionaries = { ar, en };

export function t(key: I18nKey, lang: Language = 'ar'): string {
  const dict = dictionaries[lang] || dictionaries.ar;
  return (dict as Record<string, string>)[key] || (en as Record<string, string>)[key] || key;
}

export { ar, en };
`

---

## src/styles/index.css

`css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --app-primary: #0A4F4B;
    --app-primary-dark: #062E2B;
    --brand-teal: #0A4F4B;
  }

  body {
    font-family: "IBM Plex Sans Arabic", system-ui, -apple-system, sans-serif;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
  }

  input, textarea, select {
    user-select: text;
    -webkit-user-select: text;
  }
}
`

---

## src/App.tsx

`typescript
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
`

---

## src/main.tsx

`typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`

---

