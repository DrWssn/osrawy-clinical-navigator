import React from 'react';
import { useAppStore } from '../../store/useAppStore';

interface HbA1cGaugeProps {
  value: number;
  target?: number;
  className?: string;
}

export const HbA1cGauge: React.FC<HbA1cGaugeProps> = ({
  value,
  target = 7.0,
  className = ''
}) => {
  const lang = useAppStore(s => s.lang);
  const isAr = lang === 'ar';

  // Map value (4% - 14%) to degrees (-90deg to +90deg)
  const clamped = Math.min(Math.max(value, 4.0), 14.0);
  const percent = (clamped - 4.0) / 10.0;
  const angle = -90 + percent * 180;

  let statusColor = 'var(--safe-text)';
  let statusText = isAr ? 'ضمن الهدف' : 'At Target';
  if (value > target + 1.5) {
    statusColor = 'var(--danger-text)';
    statusText = isAr ? 'أعلى من الهدف بشكل ملحوظ' : 'Significantly Above Goal';
  } else if (value > target) {
    statusColor = 'var(--warn-text)';
    statusText = isAr ? 'أعلى من الهدف' : 'Above Goal';
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-44 h-24 overflow-hidden">
        <svg viewBox="0 0 100 55" className="w-full h-full">
          {/* Background Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--line)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Green Zone (4 - 7%) */}
          <path
            d="M 10 50 A 40 40 0 0 1 38 18"
            fill="none"
            stroke="#10B981"
            strokeWidth="10"
          />
          {/* Amber Zone (7 - 8.5%) */}
          <path
            d="M 38 18 A 40 40 0 0 1 65 19"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="10"
          />
          {/* Red Zone (8.5 - 14%) */}
          <path
            d="M 65 19 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#EF4444"
            strokeWidth="10"
          />

          {/* Pivot center */}
          <circle cx="50" cy="50" r="4" fill="var(--text)" />

          {/* Needle */}
          <g transform={`rotate(${angle} 50 50)`} className="transition-transform duration-500 ease-out">
            <line x1="50" y1="50" x2="50" y2="16" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      <div className="flex flex-col items-center -mt-2">
        <div className="flex items-baseline gap-1" dir="ltr">
          <span className="text-2xl font-bold font-mono tabular-nums text-[var(--text)]">{value.toFixed(1)}</span>
          <span className="text-xs text-[var(--muted)] font-semibold">%</span>
        </div>
        <span className="text-[11px] font-semibold tracking-wide text-center" style={{ color: statusColor }}>
          {statusText} ({isAr ? `الهدف < ${target.toFixed(1)}%` : `Target < ${target.toFixed(1)}%`})
        </span>
      </div>
    </div>
  );
};

interface LdlGapBarProps {
  currentLdl: number;
  targetLdl: number;
  unit?: string;
  className?: string;
}

export const LdlGapBar: React.FC<LdlGapBarProps> = ({
  currentLdl,
  targetLdl,
  unit = 'mg/dL',
  className = ''
}) => {
  const lang = useAppStore(s => s.lang);
  const isAr = lang === 'ar';

  const maxDisplay = Math.max(currentLdl * 1.15, targetLdl * 1.5, 160);
  const currentPercent = Math.min((currentLdl / maxDisplay) * 100, 100);
  const targetPercent = Math.min((targetLdl / maxDisplay) * 100, 100);
  const isAtGoal = currentLdl <= targetLdl;
  const gap = Math.max(currentLdl - targetLdl, 0);
  const reductionPct = currentLdl > 0 ? Math.round((gap / currentLdl) * 100) : 0;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between items-center text-xs gap-2">
        <span className="text-[var(--muted)] font-medium">
          {isAr ? 'الحالي:' : 'Current:'}{' '}
          <bdi dir="ltr">
            <strong className="text-[var(--text)] font-mono tabular-nums">{currentLdl}</strong> {unit}
          </bdi>
        </span>
        <span className="text-[var(--muted)] font-medium">
          {isAr ? 'الهدف:' : 'Target:'}{' '}
          <bdi dir="ltr">
            <strong className="text-[var(--primary)] font-mono tabular-nums">&lt; {targetLdl}</strong> {unit}
          </bdi>
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-4 bg-[var(--surface2)] rounded-full overflow-hidden border border-[var(--line)]">
        {/* Fill bar */}
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isAtGoal ? 'bg-[#10B981]' : 'bg-gradient-to-r from-[#F59E0B] to-[#EF4444]'
          }`}
          style={{ width: `${currentPercent}%` }}
        />

        {/* Target goal indicator line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[var(--text)] ring-1 ring-[var(--surface)] shadow-sm z-10"
          style={{ insetInlineStart: `${targetPercent}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[11px]">
        {isAtGoal ? (
          <span className="text-[var(--safe-text)] font-semibold">
            {isAr ? '✓ ضمن أو أقل من الهدف العلاجي' : '✓ At or below target'}
          </span>
        ) : (
          <span className="text-[var(--danger-text)] font-semibold">
            {isAr
              ? `الفجوة للهدف: +${gap} ${unit} (مطلوب خفض ${reductionPct}%)`
              : `Gap-to-goal: +${gap} ${unit} (${reductionPct}% reduction needed)`}
          </span>
        )}
      </div>
    </div>
  );
};
