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
  const isRelaxedBp = patient.frail || patient.age >= 65;
  const targetSbp = isRelaxedBp ? 140 : 130;
  const targetDbp = isRelaxedBp ? 90 : 80;
  const deltaSbp = patient.sbp - targetSbp;
  const deltaDbp = patient.dbp - targetDbp;
  const bpAboveTarget = deltaSbp >= 0 || deltaDbp >= 0;
  const bpHeroBorder =
    classification.colorClass === 'badge-danger'
      ? 'border-s-4 border-s-[var(--danger-border)]'
      : classification.colorClass === 'badge-warning'
        ? 'border-s-4 border-s-[var(--warn-border)]'
        : 'border-s-4 border-s-[var(--safe-border)]';

  return (
    <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto pb-28">
      <SegmentedControl
        variant="underline"
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
          <div className={`p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] ${bpHeroBorder}`}>
            <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                {isAr ? 'قراءة ضغط الدم الحالية' : 'Current Blood Pressure'}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                classification.colorClass === 'badge-danger'
                  ? 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]'
                  : classification.colorClass === 'badge-warning'
                    ? 'bg-[var(--warn-bg)] text-[var(--warn-text)] border-[var(--warn-border)]'
                    : 'bg-[var(--safe-bg)] text-[var(--safe-text)] border-[var(--safe-border)]'
              }`}>
                {isAr ? classification.labelAr : classification.labelEn}
              </span>
            </div>

            {/* Live Target Gap Strip */}
            <div className={`mb-3 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-semibold flex items-center justify-between gap-2 ${
              bpAboveTarget
                ? 'bg-[var(--surface2)] border-[var(--line)] text-[var(--danger-text)]'
                : 'bg-[var(--safe-bg)] border-[var(--safe-border)] text-[var(--safe-text)]'
            }`}>
              <span className="font-sans font-semibold text-[var(--muted)]">
                {isAr ? `الهدف (<${targetSbp}/${targetDbp}):` : `Target (<${targetSbp}/${targetDbp}):`}
              </span>
              <bdi dir="ltr">
                {bpAboveTarget
                  ? `+${Math.max(0, deltaSbp)}/+${Math.max(0, deltaDbp)} mmHg ${isAr ? 'فوق الهدف' : 'above target'}`
                  : (isAr ? 'ضمن الهدف ✓' : 'At Target ✓')}
              </bdi>
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
              <div className="p-2 rounded-lg bg-[var(--surface2)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--muted)] block">Mean Arterial Pressure (MAP)</span>
                <strong className="text-sm font-mono text-[var(--text)]">{map} <small>mmHg</small></strong>
              </div>
              <div className="p-2 rounded-lg bg-[var(--surface2)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--muted)] block">Pulse Pressure (PP)</span>
                <strong className="text-sm font-mono text-[var(--text)]">{pp} <small>mmHg</small></strong>
              </div>
            </div>
          </div>

          {/* Labs: Renal & K+ */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)]">
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
          <div className="p-3 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-2">
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
          <div className="p-3 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-2">
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
          <div className="p-3 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex items-center justify-between">
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
          <div className="p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-3">
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

            <div className="p-3 rounded-lg bg-[var(--surface2)] border border-[var(--line)]">
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
          <div className="p-3.5 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {isAr ? 'حاسبة التبديل الآمن بين أدوية الضغط' : 'Antihypertensive Switch Calculator'}
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[var(--muted)]">Switch From:</label>
                <select
                  value={switchFrom}
                  onChange={(e) => setSwitchFrom(e.target.value)}
                  className="h-9 px-2 bg-[var(--input-bg)] text-[var(--text)] rounded-lg border border-[var(--line)] font-medium"
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
                  className="h-9 px-2 bg-[var(--input-bg)] text-[var(--text)] rounded-lg border border-[var(--line)] font-medium"
                >
                  <option value="sacubitril_valsartan">Sacubitril/Valsartan (ARNI)</option>
                  <option value="valsartan">Valsartan (ARB)</option>
                  <option value="telmisartan">Telmisartan (ARB)</option>
                  <option value="amlodipine">Amlodipine (CCB)</option>
                </select>
              </div>
            </div>

            {/* Washout & Switch Notes */}
            <div className="p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--line)]">
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
                  className={`p-3 rounded-xl border shadow-sm transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-[var(--surface)] border-[var(--line)]'
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
                          ? 'bg-[var(--primary)] text-[var(--on-primary)]'
                          : 'bg-[var(--surface2)] text-[var(--text)] border border-[var(--line)]'
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
