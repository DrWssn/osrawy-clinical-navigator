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
          wrapper: 'bg-red-500/10 border-red-500/40 text-red-900 dark:text-red-200',
          icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />,
          btn: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          wrapper: 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
          btn: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      case 'info':
      default:
        return {
          wrapper: 'bg-sky-500/10 border-sky-500/40 text-sky-900 dark:text-sky-200',
          icon: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />,
          btn: 'bg-sky-600 hover:bg-sky-700 text-white'
        };
    }
  };

  const style = getStyle();

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-xl border text-xs sm:text-sm ${style.wrapper} ${className}`}>
      <div className="flex items-start gap-2.5">
        {style.icon}
        <div className="flex-1">
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
