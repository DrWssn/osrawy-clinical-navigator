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
      className={`flex p-1 bg-[var(--surface2)] rounded-xl border border-[var(--line)] ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all active:scale-[0.98] select-none ${
              isActive
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {opt.icon && <span className="w-4 h-4">{opt.icon}</span>}
            <span className="truncate">{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`ms-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
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
