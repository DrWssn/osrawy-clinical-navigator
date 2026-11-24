import React from 'react';
import { usePatientStore } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';

export const VitalsStrip: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const bmi = usePatientStore(s => s.bmi);
  const pushOverlay = useAppStore(s => s.pushOverlay);

  // Status colors
  const getEgfrColor = () => {
    if (patient.egfr < 30) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30';
    if (patient.egfr < 60) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const getKColor = () => {
    if (patient.k >= 5.5) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30';
    if (patient.k > 5.0) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const getBpColor = () => {
    if (patient.sbp >= 140 || patient.dbp >= 90) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30';
    if (patient.sbp >= 130 || patient.dbp >= 80) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const getA1cColor = () => {
    if (patient.a1c > 8.5) return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30';
    if (patient.a1c > 7.0) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div
      onClick={() => pushOverlay('vitals-drawer')}
      className="sticky top-12 z-20 h-9 w-full bg-[var(--surface)]/95 backdrop-blur-sm border-b border-[var(--line)] px-3 flex items-center gap-2 overflow-x-auto no-scrollbar cursor-pointer hover:bg-[var(--surface2)] transition-colors select-none"
      title="Tap to edit vitals"
    >
      {/* eGFR */}
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${getEgfrColor()}`}>
        <span className="opacity-80">eGFR:</span>
        <span className="font-mono">{patient.egfr}</span>
      </div>

      {/* K+ */}
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${getKColor()}`}>
        <span className="opacity-80">K+:</span>
        <span className="font-mono">{patient.k}</span>
      </div>

      {/* BP */}
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${getBpColor()}`}>
        <span className="opacity-80">BP:</span>
        <span className="font-mono">{patient.sbp}/{patient.dbp}</span>
      </div>

      {/* A1c */}
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${getA1cColor()}`}>
        <span className="opacity-80">A1c:</span>
        <span className="font-mono">{patient.a1c}%</span>
      </div>

      {/* BMI */}
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[var(--line)] bg-[var(--surface2)] text-[var(--muted)] text-[11px] font-semibold shrink-0">
        <span className="opacity-80">BMI:</span>
        <span className="font-mono text-[var(--text)]">{bmi}</span>
      </div>

      <div className="ms-auto text-[10px] text-[var(--muted)] shrink-0 opacity-70">
        Edit ✎
      </div>
    </div>
  );
};
