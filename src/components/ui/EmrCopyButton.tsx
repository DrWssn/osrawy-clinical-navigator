import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface EmrCopyButtonProps {
  getText: () => string;
  label?: string;
  className?: string;
}

export const EmrCopyButton: React.FC<EmrCopyButtonProps> = ({
  getText,
  label = 'Copy Note',
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const text = getText();
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
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
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
          : 'bg-[var(--surface2)] text-[var(--text)] border-[var(--line)] hover:bg-[var(--surface)]'
      } ${className}`}
    >
      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[var(--muted)]" />}
      <span>{copied ? 'Copied!' : label}</span>
    </button>
  );
};
