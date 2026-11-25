import React from 'react';
import { Calculator } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { NumericField } from '../ui/NumericField';
import { SegmentedControl } from '../ui/SegmentedControl';
import { ChipToggle } from '../ui/ChipToggle';
import { calculateCkdEpi2021 } from '../../engines/calculators';

export const VitalsDrawerSheet: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const bmi = usePatientStore(s => s.bmi);
  const setField = usePatientStore(s => s.setField);
  const setBloodPressure = usePatientStore(s => s.setBloodPressure);

  const overlayStack = useAppStore(s => s.overlayStack);
  const popOverlay = useAppStore(s => s.popOverlay);
  const lang = useAppStore(s => s.lang);
  const isAr = lang === 'ar';

  const isOpen = overlayStack.includes('vitals-drawer');
  const ckdRes = calculateCkdEpi2021(patient.scr, patient.scrUnit, patient.age, patient.sex);

  return (
    <BottomSheet
      id="vitals-drawer"
      isOpen={isOpen}
      onClose={() => popOverlay()}
      title={isAr ? 'بيانات المريض والمؤشرات الحيوية والتحاليل' : 'Patient Profile, Vitals & Labs'}
      maxHeight="max-h-[92vh]"
    >
      <div className="flex flex-col gap-4 py-1">
        {/* 1. Patient Demographics */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
              {isAr ? 'البيانات الأساسية' : 'Patient Demographics'}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--text)]">
              BMI <bdi dir="ltr">{bmi}</bdi>
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              {isAr ? 'اسم المريض' : 'Patient Name'}
            </label>
            <input
              type="text"
              value={patient.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder={isAr ? 'أدخل اسم المريض' : 'Enter patient name'}
              className="w-full h-10 px-3 bg-[var(--input-bg)] text-[var(--text)] text-xs font-semibold rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumericField
              label={isAr ? 'العمر' : 'Age'}
              value={patient.age}
              onChange={(val) => setField('age', val)}
              unit={isAr ? 'سنة' : 'yr'}
              min={1}
              max={120}
            />
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                {isAr ? 'الجنس' : 'Sex'}
              </label>
              <SegmentedControl<'m' | 'f'>
                value={patient.sex}
                onChange={(val) => setField('sex', val)}
                options={[
                  { id: 'm', label: isAr ? 'ذكر' : 'Male' },
                  { id: 'f', label: isAr ? 'أنثى' : 'Female' }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumericField
              label={isAr ? 'الطول (سم)' : 'Height (cm)'}
              value={patient.ht}
              onChange={(val) => setField('ht', val)}
              unit="cm"
              min={100}
              max={230}
            />
            <NumericField
              label={isAr ? 'الوزن (كجم)' : 'Weight (kg)'}
              value={patient.wt}
              onChange={(val) => setField('wt', val)}
              unit="kg"
              min={25}
              max={250}
            />
          </div>
        </div>

        {/* 2. Blood Pressure Hero Card */}
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

        {/* 3. Renal Function & Inline CKD-EPI 2021 */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
          <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
            {isAr ? 'وظائف الكلى والأملاح (CKD-EPI 2021)' : 'Renal Function & Electrolytes'}
          </span>

          <div className="grid grid-cols-2 gap-3 items-end">
            <NumericField
              label={isAr ? 'كرياتينين الدم SCr' : 'Serum Creatinine'}
              value={patient.scr}
              onChange={(val) => setField('scr', val)}
              unit={patient.scrUnit === 'umol' ? 'µmol/L' : 'mg/dL'}
              min={0.1}
              max={patient.scrUnit === 'umol' ? 2000 : 25}
              step={patient.scrUnit === 'umol' ? 5 : 0.1}
            />
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                {isAr ? 'وحدة الكرياتينين' : 'SCr Unit'}
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
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-[var(--text)] flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                  <span>
                    {isAr
                      ? `CKD-EPI 2021: ${ckdRes.egfrInt} مل/د (${ckdRes.stage.stage})`
                      : `CKD-EPI 2021: ${ckdRes.egfrInt} mL/min (${ckdRes.stage.stage})`}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--muted)] truncate">
                  {isAr ? ckdRes.stage.descAr : ckdRes.stage.descEn}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setField('egfr', ckdRes.egfrInt)}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--on-primary)] text-[11px] font-bold shrink-0 active:scale-95 transition-all"
              >
                {isAr ? `تطبيق (${ckdRes.egfrInt})` : `Calc & Apply (${ckdRes.egfrInt})`}
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            <NumericField
              label={isAr ? 'الترشيح eGFR' : 'eGFR'}
              value={patient.egfr}
              onChange={(val) => setField('egfr', val)}
              unit="mL/m"
              min={1}
              max={160}
            />
            <NumericField
              label={isAr ? 'البوتاسيوم K+' : 'K+'}
              value={patient.k}
              onChange={(val) => setField('k', val)}
              unit="mEq/L"
              min={2.0}
              max={9.0}
              step={0.1}
            />
            <NumericField
              label={isAr ? 'زلال UACR' : 'UACR'}
              value={patient.uacr}
              onChange={(val) => setField('uacr', val)}
              unit="mg/g"
              min={0}
              max={5000}
            />
          </div>
        </div>

        {/* 4. Glycemic & Thyroid Labs */}
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
          <NumericField
            label={isAr ? 'هرمون TSH' : 'TSH'}
            value={patient.tsh}
            onChange={(val) => setField('tsh', val)}
            unit="mIU/L"
            min={0.01}
            max={100}
            step={0.05}
          />
          <NumericField
            label={isAr ? 'ثيروكسين FT4' : 'Free T4'}
            value={patient.ft4}
            onChange={(val) => setField('ft4', val)}
            unit="ng/dL"
            min={0.1}
            max={10}
            step={0.05}
          />
        </div>

        {/* 5. Clinical Conditions, Frailty & Pregnancy */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
          <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
            {isAr ? 'الأمراض المزمنة وعوامل الخطورة' : 'Conditions & Clinical Flags'}
          </span>

          <div className="flex flex-wrap gap-2">
            <ChipToggle
              label={isAr ? 'وهن / كبار السن (Frail)' : 'Frail / Elderly'}
              checked={patient.frail}
              onChange={(c) => setField('frail', c)}
              variant="warning"
            />
            <ChipToggle
              label={isAr ? 'السكري T2DM' : 'Diabetes (T2DM)'}
              checked={Boolean(patient.dm || patient.diabetes)}
              onChange={(c) => setField('dm', c)}
              variant="primary"
            />
            <ChipToggle
              label={isAr ? 'تصلب شرايين / CAD' : 'ASCVD / CAD'}
              checked={patient.ascvd}
              onChange={(c) => setField('ascvd', c)}
              variant="danger"
            />
            <ChipToggle
              label={isAr ? 'ربو شعبي' : 'Asthma'}
              checked={patient.asthma}
              onChange={(c) => setField('asthma', c)}
              variant="primary"
            />
            <ChipToggle
              label={isAr ? 'سدة رئوية COPD' : 'COPD'}
              checked={patient.copd}
              onChange={(c) => setField('copd', c)}
              variant="primary"
            />
            <ChipToggle
              label={isAr ? 'مدخن' : 'Smoker'}
              checked={patient.smoker}
              onChange={(c) => setField('smoker', c)}
              variant="warning"
            />
            <ChipToggle
              label={isAr ? 'تحسس للستاتين' : 'Statin Intolerant'}
              checked={patient.statinIntolerant}
              onChange={(c) => setField('statinIntolerant', c)}
              variant="warning"
            />
            {patient.sex === 'f' && (
              <ChipToggle
                label={isAr ? 'حمل نشط' : 'Pregnancy'}
                checked={patient.pregnancy}
                onChange={(c) => setField('pregnancy', c)}
                variant="danger"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              {isAr ? 'قصور القلب (Heart Failure)' : 'Heart Failure Phenotype'}
            </label>
            <SegmentedControl<'none' | 'hfref' | 'hfpef'>
              value={patient.hf}
              onChange={(val) => setField('hf', val)}
              options={[
                { id: 'none', label: isAr ? 'لا يوجد' : 'None' },
                { id: 'hfref', label: 'HFrEF' },
                { id: 'hfpef', label: 'HFpEF' }
              ]}
            />
          </div>

          {patient.sex === 'f' && patient.pregnancy && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                {isAr ? 'ثلث الحمل (Trimester)' : 'Pregnancy Trimester'}
              </label>
              <SegmentedControl<'1' | '2' | '3'>
                value={String(patient.thyroidTrimester || 1) as '1' | '2' | '3'}
                onChange={(val) => {
                  const tri = Number(val) as 1 | 2 | 3;
                  setField('thyroidTrimester', tri);
                  setField('trimester', tri);
                }}
                options={[
                  { id: '1', label: isAr ? 'الثلث 1 (T1)' : 'Trimester 1' },
                  { id: '2', label: isAr ? 'الثلث 2 (T2)' : 'Trimester 2' },
                  { id: '3', label: isAr ? 'الثلث 3 (T3)' : 'Trimester 3' }
                ]}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => popOverlay()}
          className="w-full h-11 mt-1 bg-[var(--primary)] text-[var(--on-primary)] font-semibold rounded-xl active:scale-[0.98] transition-transform shadow-sm"
        >
          {isAr ? 'تأكيد وحفظ التعديلات' : 'Save Changes'}
        </button>
      </div>
    </BottomSheet>
  );
};
