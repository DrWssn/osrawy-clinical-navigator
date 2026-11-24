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
