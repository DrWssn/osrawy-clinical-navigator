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
