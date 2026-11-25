import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Pill, Calculator, FileText, LayoutDashboard, HeartPulse, Stethoscope, ArrowRight } from 'lucide-react';
import { useAppStore, AppTab, AppSubTab } from '../../store/useAppStore';
import { searchFormulary } from '../../data/formulary';

interface SearchResult {
  id: string;
  type: 'screen' | 'drug' | 'tool' | 'guideline';
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  keywords?: string[];
  tab: AppTab;
  subTab?: AppSubTab;
}

const STATIC_ITEMS: SearchResult[] = [
  {
    id: 'cockpit',
    type: 'screen',
    titleEn: 'Visit Cockpit (Clinical Command Center)',
    titleAr: 'لوحة الزيارة (الخطوة التالية والأهداف)',
    subtitleEn: 'Next Best Step, 4-Domain Targets & Care Gaps',
    subtitleAr: 'التوصية ذات الأولوية، أهداف المؤشرات وفجوات الرعاية',
    keywords: ['home', 'summary', 'cockpit', 'الرئيسية', 'الزيارة'],
    tab: 'cockpit'
  },
  {
    id: 'crm-dm',
    type: 'screen',
    titleEn: 'Diabetes Management (ADA 2025)',
    titleAr: 'إدارة السكري (ADA 2025)',
    subtitleEn: 'Glycemic plan, SGLT2i/GLP-1 RA, Insulin & Screening',
    subtitleAr: 'خطة السكر، حماية الكلى والقلب، الإنسولين والفحوصات الدورية',
    keywords: ['diabetes', 'dm', 'a1c', 'sglt2', 'glp1', 'السكري', 'التراكمي'],
    tab: 'crm',
    subTab: 'dm'
  },
  {
    id: 'crm-htn',
    type: 'screen',
    titleEn: 'Hypertension & Pregnancy HTN',
    titleAr: 'ضغط الدم وارتفاع الضغط بالحمل',
    subtitleEn: 'BP staging, RAAS switching & 36h ARNI washout',
    subtitleAr: 'تصنيف الضغط، التحويل الدوائي وفترة التوقف ٣٦ ساعة',
    keywords: ['htn', 'bp', 'hypertension', 'arni', 'الضغط', 'ضغط الدم'],
    tab: 'crm',
    subTab: 'htn'
  },
  {
    id: 'crm-dlp',
    type: 'screen',
    titleEn: 'Lipids & 10-Yr ASCVD Risk',
    titleAr: 'الدهون وتقييم خطورة الشرايين 10 سنوات',
    subtitleEn: 'LDL targets, Statin/Ezetimibe/PCSK9i pathway',
    subtitleAr: 'أهداف الكوليسترول الضار، الستاتين وإيزيتيميب',
    keywords: ['lipids', 'ldl', 'ascvd', 'statin', 'الدهون', 'الكوليسترول'],
    tab: 'crm',
    subTab: 'dlp'
  },
  {
    id: 'pc-asthma',
    type: 'screen',
    titleEn: 'Asthma (GINA Track 1 MART)',
    titleAr: 'الربو الشعبي (مسار GINA MART)',
    subtitleEn: 'Asthma control, SABA overuse alert & Step 1–5',
    subtitleAr: 'تقييم انضباط الربو، تحذير الفنتولين والخطوات 1–5',
    keywords: ['asthma', 'gina', 'mart', 'saba', 'الربو', 'فنتولين'],
    tab: 'pc',
    subTab: 'asthma'
  },
  {
    id: 'pc-copd',
    type: 'screen',
    titleEn: 'COPD (GOLD ABE & Eosinophils)',
    titleAr: 'السدة الرئوية المزمنة (GOLD ABE)',
    subtitleEn: 'mMRC/CAT, Group A/B/E & ICS eosinophil stewardship',
    subtitleAr: 'تصنيف GOLD والـ Eosinophils لاستخدام الكورتيزون الاستنشاقي',
    keywords: ['copd', 'gold', 'eosinophils', 'السدة', 'الرئوية'],
    tab: 'pc',
    subTab: 'copd'
  },
  {
    id: 'pc-thyroid',
    type: 'screen',
    titleEn: 'Thyroid Panel (TSH / FT4 & LT4)',
    titleAr: 'الغدة الدرقية (TSH / FT4 والجرعات)',
    subtitleEn: 'Hypo/Hyperthyroidism, central hypo & pregnancy goals',
    subtitleAr: 'القصور والنشاط الدرقي، القصور المركزي وأهداف الحمل',
    keywords: ['thyroid', 'tsh', 'ft4', 'levothyroxine', 'الغدة', 'الدرقية'],
    tab: 'pc',
    subTab: 'thyroid'
  },
  {
    id: 'egfr',
    type: 'tool',
    titleEn: 'CKD-EPI 2021 Race-Free eGFR & eAG / Ca',
    titleAr: 'حاسبة الترشيح الكبيبي CKD-EPI 2021 والكالسيوم',
    subtitleEn: 'Kidney function eGFR, CrCl, eAG & Corrected Calcium',
    subtitleAr: 'معدل الترشيح الكلوي، تصفية الكرياتينين ومعدل السكر المقدر',
    keywords: ['egfr', 'ckd-epi', 'creatinine', 'crcl', 'eag', 'calcium', 'كلى', 'ترشيح'],
    tab: 'tools',
    subTab: 'egfr'
  },
  {
    id: 'kdigo',
    type: 'tool',
    titleEn: 'KDIGO 2024 Heat-Map Matrix',
    titleAr: 'مصفوفة KDIGO 2024 لأمراض الكلى',
    subtitleEn: 'Staging G1–G5 & A1–A3 Risk Stratification',
    subtitleAr: 'تصنيف المراحل G1–G5 والزلال A1–A3 وتوصيات التحويل',
    keywords: ['kdigo', 'uacr', 'albuminuria', 'زلال'],
    tab: 'tools',
    subTab: 'kdigo'
  },
  {
    id: 'fib4',
    type: 'tool',
    titleEn: 'FIB-4 Liver Fibrosis Index',
    titleAr: 'مؤشر تليف الكبد FIB-4 (MASLD)',
    subtitleEn: 'MASLD / NAFLD Screening & AASLD Cutoffs',
    subtitleAr: 'فحص تليف الكبد الدهني وحدود التحويل',
    keywords: ['fib4', 'masld', 'liver', 'كبد', 'تليف'],
    tab: 'tools',
    subTab: 'fib4'
  },
  {
    id: 'doac',
    type: 'tool',
    titleEn: 'DOAC Anticoagulation Dosing',
    titleAr: 'جرعات مضادات التجلط الفموية (DOAC)',
    subtitleEn: 'Apixaban 2-of-3 & Rivaroxaban Renal Dose',
    subtitleAr: 'ضبط جرعة أبيكسابان وريفاروكسابان حسب الكلى',
    keywords: ['doac', 'apixaban', 'rivaroxaban', 'تجلط', 'سيولة'],
    tab: 'tools',
    subTab: 'doac'
  },
  {
    id: 'steroids',
    type: 'tool',
    titleEn: 'Steroid Dose Equivalence',
    titleAr: 'معادل جرعات الكورتيزون',
    subtitleEn: 'Hydrocortisone, Prednisone, Methylprednisolone, Dexamethasone',
    subtitleAr: 'التحويل بين الهيدروكورتيزون والبريدنيزولون والديكساميثازون',
    keywords: ['steroid', 'prednisone', 'dexamethasone', 'كورتيزون'],
    tab: 'tools',
    subTab: 'steroids'
  },
  {
    id: 'rule15',
    type: 'guideline',
    titleEn: 'Rule of 15 (Hypoglycemia)',
    titleAr: 'قاعدة 15 لعلاج هبوط السكر',
    subtitleEn: 'Patient Education & Management Leaflet',
    subtitleAr: 'بروتوكول تثقيف المريض والتعامل الفوري مع هبوط السكر',
    keywords: ['hypoglycemia', 'rule 15', 'هبوط السكر'],
    tab: 'patient'
  },
  {
    id: 'sadmans',
    type: 'guideline',
    titleEn: 'SADMANS Sick-Day Rules',
    titleAr: 'قواعد أيام المرض (SADMANS)',
    subtitleEn: 'Withholding Nephrotoxic & Dehydration Drugs',
    subtitleAr: 'الأدوية الواجب إيقافها مؤقتاً عند الجفاف أو القيء',
    keywords: ['sadmans', 'sick day', 'أيام المرض', 'جفاف'],
    tab: 'patient'
  },
  {
    id: 'homebp',
    type: 'guideline',
    titleEn: 'Home Blood Pressure & Patient Hub',
    titleAr: 'الضغط المنزلي ومشاركة خطة المريض',
    subtitleEn: 'Offline QR, Follow-Up Schedule & Measurement Guide',
    subtitleAr: 'رمز QR بدون إنترنت، جدول المتابعة وقياس الضغط المنزلي',
    keywords: ['qr', 'follow up', 'متابعة', 'الضغط المنزلي'],
    tab: 'patient'
  }
];

export const CommandPalette: React.FC = () => {
  const { overlayStack, popOverlay, navigateTo, market, lang } = useAppStore();
  const isAr = lang === 'ar';
  const isOpen = overlayStack.includes('command-palette');

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQuery('');
        popOverlay();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, popOverlay]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATIC_ITEMS;

    const drugHits: SearchResult[] = searchFormulary(q, market).slice(0, 6).map(d => ({
      id: d.id,
      type: 'drug',
      titleEn: `${d.genericEn} (${d.tradeNamesEn[0] || d.tradeNamesAr[0] || d.genericEn})`,
      titleAr: `${d.genericAr} (${d.tradeNamesAr[0] || d.tradeNamesEn[0] || d.genericAr})`,
      subtitleEn: `${d.doseEn} · Tier ${d.tier}`,
      subtitleAr: `${d.doseAr} · الفئة ${d.tier}`,
      tab: 'drugs'
    }));

    const itemHits = STATIC_ITEMS.filter(t =>
      t.titleEn.toLowerCase().includes(q) ||
      t.titleAr.toLowerCase().includes(q) ||
      t.subtitleEn.toLowerCase().includes(q) ||
      t.subtitleAr.toLowerCase().includes(q) ||
      (t.keywords && t.keywords.some(k => k.toLowerCase().includes(q)))
    );

    return [...drugHits, ...itemHits];
  }, [query, market]);

  if (!isOpen) return null;

  const handleSelect = (item: SearchResult) => {
    navigateTo(item.tab, item.subTab);
    setQuery('');
    popOverlay();
  };

  const handleClose = () => {
    setQuery('');
    popOverlay();
  };

  const renderIcon = (item: SearchResult) => {
    if (item.type === 'drug') return <Pill className="w-4 h-4 text-[var(--primary)]" />;
    if (item.type === 'tool') return <Calculator className="w-4 h-4 text-[var(--safe-text)]" />;
    if (item.type === 'guideline') return <FileText className="w-4 h-4 text-[var(--warn-text)]" />;
    if (item.tab === 'crm') return <HeartPulse className="w-4 h-4 text-[var(--danger-text)]" />;
    if (item.tab === 'pc') return <Stethoscope className="w-4 h-4 text-[var(--info-text)]" />;
    return <LayoutDashboard className="w-4 h-4 text-[var(--primary)]" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-start p-4 sm:p-6 sm:items-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? 'البحث السريع' : 'Quick Search'}
        className="relative z-10 w-full max-w-lg bg-[var(--surface)] text-[var(--text)] rounded-2xl shadow-2xl border border-[var(--line)] overflow-hidden mt-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line)]">
          <Search className="w-5 h-5 text-[var(--primary)] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن دواء، أداة سريرية، أو قسم...' : 'Search drugs, clinical tools, screens...'}
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={isAr ? 'مسح البحث' : 'Clear search'}
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
                      {renderIcon(item)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--text)] truncate">
                        {isAr ? item.titleAr : item.titleEn}
                      </div>
                      <div className="text-[10px] text-[var(--muted)] truncate">
                        {isAr ? item.subtitleAr : item.subtitleEn}
                      </div>
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
