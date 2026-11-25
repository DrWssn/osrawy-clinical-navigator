import React from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface AlertBannerProps {
  level: 'critical' | 'warning' | 'info';
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  actionEn?: string;
  actionAr?: string;
  onAction?: () => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  level,
  titleEn,
  titleAr,
  messageEn,
  messageAr,
  actionEn,
  actionAr,
  onAction,
  className = ''
}) => {
  const lang = useAppStore(s => s.lang);
  const isAr = lang === 'ar';

  const title = isAr ? titleAr : titleEn;
  const message = isAr ? messageAr : messageEn;
  const action = isAr ? actionAr : actionEn;

  const getStyle = () => {
    switch (level) {
      case 'critical':
        return {
          wrapper: 'bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger-text)]',
          icon: <AlertCircle className="w-5 h-5 text-[var(--danger-text)] shrink-0" />,
          btn: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
        };
      case 'warning':
        return {
          wrapper: 'bg-[var(--warn-bg)] border-[var(--warn-border)] text-[var(--warn-text)]',
          icon: <AlertTriangle className="w-5 h-5 text-[var(--warn-text)] shrink-0" />,
          btn: 'bg-[#D97706] hover:bg-[#B45309] text-white'
        };
      case 'info':
      default:
        return {
          wrapper: 'bg-[var(--info-bg)] border-[var(--info-border)] text-[var(--info-text)]',
          icon: <Info className="w-5 h-5 text-[var(--info-text)] shrink-0" />,
          btn: 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)]'
        };
    }
  };

  const style = getStyle();

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-xl border text-xs sm:text-sm ${style.wrapper} ${className}`}>
      <div className="flex items-start gap-2.5">
        {style.icon}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm mb-0.5">{title}</h4>
          <p className="text-xs leading-relaxed opacity-90">{message}</p>
        </div>
      </div>

      {action && onAction && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onAction}
            className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg shadow-sm active:scale-95 transition-transform ${style.btn}`}
          >
            <span>{action}</span>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
};
