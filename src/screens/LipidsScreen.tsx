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
