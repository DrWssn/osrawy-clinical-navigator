import React, { useState } from 'react';
import { usePatientStore } from '../store/usePatientStore';
import { useAppStore, ToolsSubTab } from '../store/useAppStore';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { NumericField } from '../components/ui/NumericField';
import { evaluateKdigoMatrix, calculateFib4, evaluateDoacDosing } from '../engines/tools';
import {
  calculateSteroidEquivalence,
  calculateCkdEpi2021,
  calculateEag,
  calculateCorrectedCa
} from '../engines/calculators';

export const ToolsScreen: React.FC = () => {
  const { patient, setField } = usePatientStore();
  const { lang, toolsSubTab, setToolsSubTab } = useAppStore();
  const isAr = lang === 'ar';

  // Local state for FIB-4
  const [ast, setAst] = useState(patient.altUl || 32);
  const [alt, setAlt] = useState(patient.altUl || 28);
  const [plt, setPlt] = useState(220);

  // Local state for Corrected Calcium
  const [totalCa, setTotalCa] = useState(8.8);
  const [albumin, setAlbumin] = useState(3.2);

  // Local state for Steroids
  const [steroidDose, setSteroidDose] = useState(20);
  const [steroidDrug, setSteroidDrug] = useState<'hydrocortisone' | 'prednisone' | 'methylprednisolone' | 'dexamethasone'>('prednisone');

  // Tool evaluations
  const kdigo = evaluateKdigoMatrix(patient.egfr, patient.uacr);
  const ckdRes = calculateCkdEpi2021(patient.scr, patient.scrUnit, patient.age, patient.sex);
  const eagRes = calculateEag(patient.a1c);
  const corrCaRes = calculateCorrectedCa(totalCa, albumin);
  const fib4 = calculateFib4(patient.age, ast, alt, plt);
  const doac = evaluateDoacDosing(patient);
  const steroidResult = calculateSteroidEquivalence(steroidDose, steroidDrug);

  return (
    <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto pb-28">
      <SegmentedControl<ToolsSubTab>
        value={toolsSubTab}
        onChange={setToolsSubTab}
        options={[
          { id: 'kdigo', label: 'KDIGO' },
          { id: 'egfr', label: 'eGFR / Ca' },
          { id: 'fib4', label: 'FIB-4' },
          { id: 'doac', label: 'DOAC' },
          { id: 'steroids', label: isAr ? 'الكورتيزون' : 'Steroids' }
        ]}
      />

      {/* 1. KDIGO MATRIX */}
      {toolsSubTab === 'kdigo' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)]">
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
          <div className="p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-3">
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
                kdigo.color === 'red' ? 'bg-red-500/15 text-red-700 dark:text-red-400' :
                kdigo.color === 'orange' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                kdigo.color === 'yellow' ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300' :
                'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
              }`}>
                {isAr ? kdigo.riskLabelAr : kdigo.riskLabelEn}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--surface2)] border border-[var(--line)] text-xs text-[var(--muted)] leading-relaxed">
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

      {/* 1b. CKD-EPI 2021 eGFR, eAG & CORRECTED CALCIUM */}
      {toolsSubTab === 'egfr' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          {/* CKD-EPI 2021 Card */}
          <div className="p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {isAr ? 'حاسبة الترشيح الكبيبي (CKD-EPI 2021)' : 'CKD-EPI 2021 Race-Free eGFR'}
            </h4>
            <div className="grid grid-cols-2 gap-3 items-end">
              <NumericField
                label={isAr ? 'الكرياتينين SCr' : 'Serum Creatinine'}
                value={patient.scr}
                onChange={(v) => setField('scr', v)}
                unit={patient.scrUnit === 'umol' ? 'µmol/L' : 'mg/dL'}
                min={0.1}
                max={patient.scrUnit === 'umol' ? 2000 : 25}
                step={patient.scrUnit === 'umol' ? 5 : 0.1}
              />
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                  {isAr ? 'وحدة القياس' : 'Unit'}
                </label>
                <SegmentedControl<'mg' | 'umol'>
                  value={patient.scrUnit}
                  onChange={(val) => setField('scrUnit', val)}
                  options={[
                    { id: 'mg', label: 'mg/dL' },
                    { id: 'umol', label: 'µmol/L' }
                  ]}
                />
              </div>
            </div>

            {ckdRes && (
              <div className="p-3 rounded-lg bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-between gap-2">
                <div>
                  <div className="text-xl font-bold font-mono text-[var(--primary)]">
                    {ckdRes.egfrInt} <span className="text-xs font-normal text-[var(--muted)]">mL/min/1.73m² ({ckdRes.stage.stage})</span>
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">
                    {isAr ? ckdRes.stage.descAr : ckdRes.stage.descEn}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setField('egfr', ckdRes.egfrInt)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold shrink-0 active:scale-95 transition-all"
                >
                  {isAr ? 'تطبيق للمريض' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          {/* eAG from HbA1c Card */}
          <div className="p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">
                {isAr ? `متوسط السكر المقدر (eAG من A1c ${patient.a1c}%)` : `Estimated Average Glucose (eAG from A1c ${patient.a1c}%)`}
              </span>
              <div className="text-lg font-bold font-mono text-[var(--primary)] mt-0.5">
                {eagRes.eagMg} <small>mg/dL</small> · {eagRes.eagMmol} <small>mmol/L</small>
              </div>
            </div>
          </div>

          {/* Corrected Calcium Card */}
          <div className="p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {isAr ? 'الكالسيوم المصحح (Payne Formula)' : 'Corrected Calcium (Payne Formula)'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <NumericField
                label={isAr ? 'الكالسيوم الكلي' : 'Total Calcium'}
                value={totalCa}
                onChange={setTotalCa}
                unit="mg/dL"
                min={3}
                max={18}
                step={0.1}
              />
              <NumericField
                label={isAr ? 'الألبومين Albumin' : 'Albumin'}
                value={albumin}
                onChange={setAlbumin}
                unit="g/dL"
                min={0.5}
                max={6.5}
                step={0.1}
              />
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text)]">
                {isAr ? 'الكالسيوم المصحح:' : 'Corrected Ca:'}
              </span>
              <span className={`font-bold font-mono text-sm ${corrCaRes.isNormal ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {corrCaRes.correctedCa} mg/dL ({corrCaRes.isNormal ? (isAr ? 'طبيعي' : 'Normal') : (isAr ? 'غير طبيعي' : 'Abnormal')})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. FIB-4 LIVER FIBROSIS */}
      {toolsSubTab === 'fib4' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)]">
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
            <div className="p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-3">
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
                  fib4.riskTier === 'HIGH' ? 'bg-red-500/15 text-red-700 dark:text-red-400' :
                  fib4.riskTier === 'INTERMEDIATE' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                }`}>
                  {isAr ? fib4.riskLabelAr : fib4.riskLabelEn}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[var(--surface2)] border border-[var(--line)] text-xs text-[var(--muted)] leading-relaxed">
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
      {toolsSubTab === 'doac' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="p-3 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text)]">
              {isAr ? 'تصفية الكرياتينين المقدرة (CrCl):' : 'Calculated CrCl (Cockcroft-Gault):'}
            </span>
            <span className="text-sm font-bold font-mono text-[var(--primary)]">
              {doac.crcl} <small>mL/min</small>
            </span>
          </div>

          {/* Apixaban Card */}
          <div className="p-3.5 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[var(--text)]">
                {isAr ? doac.apixaban.drugAr : doac.apixaban.drug}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                doac.apixaban.contraindicated ? 'bg-red-500/15 text-red-700 dark:text-red-400' :
                doac.apixaban.reducedDose ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
              }`}>
                {doac.apixaban.reducedDose
                  ? (isAr ? 'جرعة مخفضة' : 'Reduced Dose')
                  : doac.apixaban.contraindicated
                    ? (isAr ? 'ممنوع' : 'Contraindicated')
                    : (isAr ? 'جرعة قياسية' : 'Standard Dose')}
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
          <div className="p-3.5 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[var(--text)]">
                {isAr ? doac.rivaroxaban.drugAr : doac.rivaroxaban.drug}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                doac.rivaroxaban.contraindicated ? 'bg-red-500/15 text-red-700 dark:text-red-400' :
                doac.rivaroxaban.reducedDose ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
              }`}>
                {doac.rivaroxaban.reducedDose
                  ? (isAr ? 'جرعة مخفضة' : 'Reduced Dose')
                  : doac.rivaroxaban.contraindicated
                    ? (isAr ? 'ممنوع' : 'Contraindicated')
                    : (isAr ? 'جرعة قياسية' : 'Standard Dose')}
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
      {toolsSubTab === 'steroids' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="p-3.5 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-3">
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
                <label className="text-[11px] font-semibold text-[var(--muted)]">
                  {isAr ? 'الدواء المختار:' : 'Selected Drug:'}
                </label>
                <select
                  value={steroidDrug}
                  onChange={(e) => setSteroidDrug(e.target.value as any)}
                  className="h-10 px-2 bg-[var(--input-bg)] text-[var(--text)] rounded-lg border border-[var(--line)] font-medium text-xs"
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
            <div className="p-3 rounded-xl bg-[var(--surface)] shadow-sm border border-[var(--line)] text-center">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">Hydrocortisone</span>
              <strong className="text-xl font-bold font-mono text-[var(--primary)]">{steroidResult.hydrocortisone} <small>mg</small></strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface)] shadow-sm border border-[var(--line)] text-center">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">Prednisone</span>
              <strong className="text-xl font-bold font-mono text-[var(--primary)]">{steroidResult.prednisone} <small>mg</small></strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface)] shadow-sm border border-[var(--line)] text-center">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">Methylprednisolone</span>
              <strong className="text-xl font-bold font-mono text-[var(--primary)]">{steroidResult.methylprednisolone} <small>mg</small></strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface)] shadow-sm border border-[var(--line)] text-center">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">Dexamethasone</span>
              <strong className="text-xl font-bold font-mono text-[var(--primary)]">{steroidResult.dexamethasone} <small>mg</small></strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
