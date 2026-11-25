import React, { useState } from 'react';
import { usePatientStore } from '../store/usePatientStore';
import { useAppStore } from '../store/useAppStore';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { NumericField } from '../components/ui/NumericField';
import { ChipToggle } from '../components/ui/ChipToggle';
import { LdlGapBar } from '../components/ui/SvgGauge';
import { EmrCopyButton } from '../components/ui/EmrCopyButton';
import { evaluateLipidPathway, RISK_TIERS } from '../engines/lipids';
import { calculate10YrAscvdRisk, AscvdRace } from '../engines/ascvd';
import { buildEmrNote } from '../engines/tools';

export const LipidsScreen: React.FC = () => {
  const { patient, setField } = usePatientStore();
  const { lang } = useAppStore();
  const isAr = lang === 'ar';

  const [subTab, setSubTab] = useState<'inputs' | 'pathway' | 'ascvd' | 'matrix'>('inputs');
  const [race, setRace] = useState<AscvdRace>('white_other');
  const [treatedBp, setTreatedBp] = useState<boolean>(() => {
    const htnMeds = ['ramipril', 'perindopril', 'valsartan', 'losartan', 'amlodipine', 'indapamide', 'bisoprolol', 'spironolactone'];
    return Boolean(patient.activeMeds && patient.activeMeds.some(m => htnMeds.includes(m.toLowerCase())));
  });

  const pathway = evaluateLipidPathway(patient);
  const target = pathway.target;
  const strat = pathway.stratification;

  const ascvd = calculate10YrAscvdRisk({
    age: patient.age || 52,
    sex: patient.sex === 'f' ? 'F' : 'M',
    race,
    tc: patient.tc || patient.totalCholesterol || 200,
    hdl: patient.hdl || patient.hdlC || 50,
    sbp: patient.sbp || 130,
    treatedBp,
    smoker: Boolean(patient.smoker),
    diabetes: Boolean(patient.diabetes || patient.dm),
  });

  return (
    <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto pb-24">
      <SegmentedControl
        value={subTab}
        onChange={(val) => setSubTab(val as any)}
        options={[
          { id: 'inputs', label: isAr ? 'التحاليل' : 'Labs' },
          { id: 'pathway', label: isAr ? 'المسار' : 'Pathway' },
          { id: 'ascvd', label: isAr ? 'خطورة 10 سنوات' : '10-Yr ASCVD' },
          { id: 'matrix', label: isAr ? 'المصفوفة' : 'Matrix' }
        ]}
      />

      {/* 1. INPUTS TAB */}
      {subTab === 'inputs' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          {/* Unit Toggle Card */}
          <div className="p-3 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex items-center justify-between">
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
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)]">
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
          <div className="p-3 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-2">
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
          <div className="p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-3">
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
              <div key={st.stepNumber} className="p-3.5 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)]">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-xs font-bold text-[var(--primary)]">
                    {isAr ? st.titleAr : st.titleEn}
                  </h5>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface2)] border border-[var(--line)]">
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

      {/* 3. ASCVD 10-YEAR RISK TAB */}
      {subTab === 'ascvd' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          {/* Hero Risk Card */}
          <div className="p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">
                  {isAr ? 'حاسبة خطورة الشرايين (ACC/AHA 10-Yr PCE)' : '10-Year ASCVD Risk Estimator (PCE)'}
                </span>
                <h4 className="text-sm font-bold text-[var(--text)]">
                  {isAr ? ascvd.statinRecommendation.headlineAr : ascvd.statinRecommendation.headlineEn}
                </h4>
              </div>
              <EmrCopyButton
                getText={() =>
                  `ASCVD 10-Yr Risk: ${ascvd.riskScorePercent}% (${ascvd.riskCategory.toUpperCase()}) | Recommendation: ${ascvd.statinRecommendation.headlineEn} - ${ascvd.statinRecommendation.detailsEn}`
                }
              />
            </div>

            {/* Score & Visual Gauge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)]">
              <div>
                <div className="text-3xl font-black font-mono tracking-tight text-[var(--text)]">
                  {ascvd.riskScorePercent}%
                </div>
                <span className="text-[11px] text-[var(--muted)] font-medium">
                  {isAr ? 'احتمال حدوث جلطة قلبية أو سكتة خلال 10 سنوات' : '10-year risk of hard ASCVD event'}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono ${
                    ascvd.riskCategory === 'high'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : ascvd.riskCategory === 'intermediate'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : ascvd.riskCategory === 'borderline'
                      ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {ascvd.riskCategory.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Guideline Statin Recommendation */}
            <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                {isAr ? 'التوصية الدوائية للستاتين (ACC/AHA 2019 & ADA 2025)' : 'Guideline Statin Recommendation'}
              </span>
              <p className="text-xs text-[var(--text)] font-semibold leading-relaxed">
                {isAr ? ascvd.statinRecommendation.detailsAr : ascvd.statinRecommendation.detailsEn}
              </p>
            </div>

            {ascvd.warning && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px]">
                {ascvd.warning}
              </div>
            )}
          </div>

          {/* Parameters & Modifiers */}
          <div className="p-3.5 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {isAr ? 'المحددات والمعاملات السريرية' : 'Clinical Predictors & Cohort'}
            </h4>

            {/* Race Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text)]">
                {isAr ? 'المجموعة العرقية للمعادلة:' : 'Cohort Population:'}
              </span>
              <div className="w-48">
                <SegmentedControl
                  value={race}
                  onChange={(v) => setRace(v as any)}
                  options={[
                    { id: 'white_other', label: isAr ? 'عرب / آخرون' : 'Other / White' },
                    { id: 'african_american', label: isAr ? 'أفرو-أمريكي' : 'Afr. American' }
                  ]}
                />
              </div>
            </div>

            {/* Treated BP Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text)]">
                {isAr ? 'يتناول أدوية ضغط الدم (Treated BP):' : 'On Antihypertensive Therapy:'}
              </span>
              <ChipToggle
                label={treatedBp ? (isAr ? 'نعم (مُعالج)' : 'Yes (Treated)') : (isAr ? 'لا (غير مُعالج)' : 'No (Untreated)')}
                checked={treatedBp}
                onChange={setTreatedBp}
                variant="primary"
              />
            </div>

            {/* Active Values Summary */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--line)] text-center">
              <div className="p-2 rounded-lg bg-[var(--surface2)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--muted)] block">{isAr ? 'العمر' : 'Age'}</span>
                <strong className="text-xs font-mono">{patient.age}y</strong>
              </div>
              <div className="p-2 rounded-lg bg-[var(--surface2)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--muted)] block">SBP</span>
                <strong className="text-xs font-mono">{patient.sbp} mmHg</strong>
              </div>
              <div className="p-2 rounded-lg bg-[var(--surface2)] border border-[var(--line)]">
                <span className="text-[10px] text-[var(--muted)] block">TC / HDL</span>
                <strong className="text-xs font-mono">{patient.tc || patient.totalCholesterol || 200} / {patient.hdl || patient.hdlC || 50}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. RISK MATRIX TAB */}
      {subTab === 'matrix' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="p-3.5 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {isAr ? 'مصفوفة أهداف الكوليسترول (ESC/EAS 2023)' : 'ESC/EAS 2023 Lipid Target Matrix'}
            </h4>

            <div className="flex flex-col gap-2 text-xs">
              {Object.values(RISK_TIERS).map((tier) => (
                <div key={tier.key} className="p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-between">
                  <div>
                    <strong className="text-[var(--text)] block">{isAr ? tier.nameAr : tier.nameEn}</strong>
                    <span className="text-[11px] text-[var(--muted)]">Target LDL: &lt; {tier.ldlTargetMg} mg/dL (&lt; {tier.ldlTargetMmol} mmol/L)</span>
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--primary)]">
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
