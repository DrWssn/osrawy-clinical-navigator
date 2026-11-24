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
