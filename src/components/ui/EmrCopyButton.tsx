import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface EmrCopyButtonProps {
  getText: () => string;
  label?: string;
  labelAr?: string;
  className?: string;
}

export const EmrCopyButton: React.FC<EmrCopyButtonProps> = ({
  getText,
  label,
  labelAr,
  className = ''
}) => {
  const lang = useAppStore(s => s.lang);
  const isAr = lang === 'ar';
  const [copied, setCopied] = useState(false);

  const defaultLabel = isAr ? 'نسخ الملاحظة' : 'Copy Note';
  const resolvedLabel = isAr ? (labelAr || label || defaultLabel) : (label || defaultLabel);

  const handleCopy = async () => {
    try {
      const text = getText();
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 select-none ${
        copied
          ? 'bg-[var(--safe-bg)] text-[var(--safe-text)] border-[var(--safe-border)]'
          : 'bg-[var(--surface2)] text-[var(--text)] border-[var(--line)] hover:bg-[var(--surface)]'
      } ${className}`}
    >
      {copied ? (
        <Check className="w-4 h-4 text-[var(--safe-text)]" />
      ) : (
        <Copy className="w-4 h-4 text-[var(--muted)]" />
      )}
      <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : resolvedLabel}</span>
    </button>
  );
};
