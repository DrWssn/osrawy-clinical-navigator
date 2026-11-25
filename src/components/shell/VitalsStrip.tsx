import React from 'react';
import { usePatientStore } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';

export const VitalsStrip: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const bmi = usePatientStore(s => s.bmi);
  const pushOverlay = useAppStore(s => s.pushOverlay);
  const lang = useAppStore(s => s.lang);
  const isAr = lang === 'ar';

  const dangerCls = 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]';
  const warnCls = 'bg-[var(--warn-bg)] text-[var(--warn-text)] border-[var(--warn-border)]';
  const safeCls = 'bg-[var(--safe-bg)] text-[var(--safe-text)] border-[var(--safe-border)]';

  const getEgfrColor = () => {
    if (patient.egfr < 30) return dangerCls;
    if (patient.egfr < 60) return warnCls;
    return safeCls;
  };

  const getKColor = () => {
    if (patient.k >= 5.5) return dangerCls;
    if (patient.k > 5.0) return warnCls;
    return safeCls;
  };

  const getBpColor = () => {
    if (patient.sbp >= 140 || patient.dbp >= 90) return dangerCls;
    if (patient.sbp >= 130 || patient.dbp >= 80) return warnCls;
    return safeCls;
  };

  const getA1cColor = () => {
    if (patient.a1c > 8.5) return dangerCls;
    if (patient.a1c > 7.0) return warnCls;
    return safeCls;
  };

  const openVitals = () => pushOverlay('vitals-drawer');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openVitals}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openVitals();
        }
      }}
      className="sticky top-12 z-20 h-9 w-full bg-surface/95 backdrop-blur-sm border-b border-[var(--line)] px-3 flex items-center cursor-pointer hover:bg-[var(--surface2)] transition-colors select-none"
      title={isAr ? 'انقر لتعديل المؤشرات الحيوية والتحاليل' : 'Tap to edit vitals & labs'}
    >
      <div className="w-full max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* eGFR */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${getEgfrColor()}`}>
          <span className="opacity-80">eGFR:</span>
          <bdi dir="ltr" className="font-mono tabular-nums">{patient.egfr}</bdi>
        </div>

        {/* K+ */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${getKColor()}`}>
          <span className="opacity-80">K+:</span>
          <bdi dir="ltr" className="font-mono tabular-nums">{patient.k}</bdi>
        </div>

        {/* BP */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${getBpColor()}`}>
          <span className="opacity-80">BP:</span>
          <bdi dir="ltr" className="font-mono tabular-nums">{patient.sbp}/{patient.dbp}</bdi>
        </div>

        {/* A1c */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${getA1cColor()}`}>
          <span className="opacity-80">A1c:</span>
          <bdi dir="ltr" className="font-mono tabular-nums">{patient.a1c}%</bdi>
        </div>

        {/* BMI */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[var(--line)] bg-[var(--surface2)] text-[var(--muted)] text-[11px] font-semibold shrink-0">
          <span className="opacity-80">BMI:</span>
          <bdi dir="ltr" className="font-mono tabular-nums text-[var(--text)]">{bmi}</bdi>
        </div>

        <div className="ms-auto text-[10px] text-[var(--muted)] shrink-0 font-medium">
          {isAr ? 'تعديل ✎' : 'Edit ✎'}
        </div>
      </div>
    </div>
  );
};
