import React from 'react';

interface ChipToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger' | 'warning' | 'primary';
  className?: string;
}

export const ChipToggle: React.FC<ChipToggleProps> = ({
  label,
  checked,
  onChange,
  icon,
  variant = 'default',
  className = ''
}) => {
  const getVariantStyles = () => {
    if (!checked) {
      return 'bg-[var(--surface2)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--text)]';
    }
    switch (variant) {
      case 'danger':
        return 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)] font-semibold';
      case 'warning':
        return 'bg-[var(--warn-bg)] text-[var(--warn-text)] border-[var(--warn-border)] font-semibold';
      case 'primary':
      default:
        return 'bg-primary/15 text-[var(--primary)] border-primary/40 font-semibold';
    }
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs border transition-all active:scale-95 select-none ${getVariantStyles()} ${className}`}
    >
      {icon && <span className="w-3.5 h-3.5 shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
};
