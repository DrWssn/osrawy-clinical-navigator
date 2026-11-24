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
