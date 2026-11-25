import React from 'react';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = ''
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`flex p-1 bg-[var(--surface2)] rounded-xl border border-[var(--line)] overflow-x-auto no-scrollbar gap-0.5 ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            className={`flex-1 min-w-fit shrink-0 flex items-center justify-center gap-1.5 py-1.5 px-2.5 sm:px-3 text-xs sm:text-sm font-medium rounded-lg transition-all active:scale-[0.98] select-none whitespace-nowrap ${
              isActive
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {opt.icon && <span className="w-4 h-4 shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`ms-1 px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--on-primary)]'
                    : 'bg-[var(--line)] text-[var(--muted)]'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
