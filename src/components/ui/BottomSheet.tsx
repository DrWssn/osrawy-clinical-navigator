import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  id,
  isOpen,
  onClose,
  title,
  children,
  maxHeight = 'max-h-[88vh]'
}) => {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        data-sheet-id={id}
        className={`relative z-10 flex flex-col w-full sm:max-w-xl sm:mx-auto sm:rounded-2xl sm:mb-4 bg-[var(--surface)] text-[var(--text)] rounded-t-2xl shadow-2xl border-t sm:border border-[var(--line)] ${maxHeight} animate-in slide-in-from-bottom duration-200`}
        role="dialog"
        aria-modal="true"
        aria-label={title || id}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 cursor-grab" onClick={onClose}>
          <div className="w-10 h-1.5 rounded-full bg-[var(--muted)] opacity-40" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--line)]">
          <h3 className="text-base font-semibold truncate text-[var(--text)]">
            {title || ''}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
