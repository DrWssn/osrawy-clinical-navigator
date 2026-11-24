import React from 'react';

interface NumericFieldProps {
  label: string;
  value: number | string;
  onChange: (val: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  actionTitle?: string;
  className?: string;
}

export const NumericField: React.FC<NumericFieldProps> = ({
  label,
  value,
  onChange,
  unit,
  min = 0,
  max = 999,
  step = 1,
  actionIcon,
  onAction,
  actionTitle,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-[var(--muted)] truncate uppercase tracking-wider">
          {label}
        </label>
        {actionIcon && onAction && (
          <button
            type="button"
            onClick={onAction}
            title={actionTitle}
            className="p-0.5 text-[var(--primary)] hover:opacity-80 active:scale-95 transition-transform"
          >
            {actionIcon}
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value === 0 ? '' : value}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onChange(isNaN(val) ? 0 : val);
          }}
          className="w-full h-10 px-3 bg-[var(--surface2)] text-[var(--text)] font-mono text-sm rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
        />
        {unit && (
          <span className="absolute end-2.5 text-[11px] font-medium text-[var(--muted)] pointer-events-none select-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};
