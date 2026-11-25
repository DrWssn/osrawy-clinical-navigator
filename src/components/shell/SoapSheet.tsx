import React, { useState } from 'react';
import { Copy, Share2, Printer, Check } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { SegmentedControl } from '../ui/SegmentedControl';
import { buildStructuredSoapNote, buildPrescriptionReport, buildWhatsAppShareUrl } from '../../engines/exporters';
import { printClinicalReport } from '../../engines/printReport';

export const SoapSheet: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const { overlayStack, popOverlay, lang } = useAppStore();
  const isAr = lang === 'ar';

  const [mode, setMode] = useState<'soap' | 'rx'>('soap');
  const [copied, setCopied] = useState(false);

  const isOpen = overlayStack.includes('soap-sheet');

  const contentText = mode === 'soap'
    ? buildStructuredSoapNote(patient)
    : buildPrescriptionReport(lang, patient);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(contentText);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = contentText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleWhatsApp = () => {
    if (typeof window === 'undefined') return;
    const url = buildWhatsAppShareUrl('', contentText);
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    printClinicalReport(patient, undefined, lang);
  };

  return (
    <BottomSheet
      id="soap-sheet"
      isOpen={isOpen}
      onClose={() => popOverlay()}
      title={isAr ? 'ملخص الاستشارة الطبية والوصفة' : 'Clinical SOAP Consultation & Rx'}
      maxHeight="max-h-[92vh]"
    >
      <div className="flex flex-col gap-3 py-1">
        {/* Mode Selector */}
        <SegmentedControl
          value={mode}
          onChange={(val) => setMode(val as 'soap' | 'rx')}
          options={[
            { id: 'soap', label: isAr ? 'ملاحظة SOAP السريرية' : 'SOAP Clinical Note' },
            { id: 'rx', label: isAr ? 'الوصفة الطبية (Rx Report)' : 'Prescription (Rx)' }
          ]}
        />

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
              copied
                ? 'bg-[var(--safe-bg)] text-[var(--safe-text)] border-[var(--safe-border)]'
                : 'bg-[var(--surface2)] text-[var(--text)] border-[var(--line)] hover:bg-[var(--surface)]'
            }`}
          >
            {copied ? (
              <Check className="w-4 h-4 text-[var(--safe-text)]" />
            ) : (
              <Copy className="w-4 h-4 text-[var(--muted)]" />
            )}
            <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy')}</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold active:scale-95 transition-all shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--surface)] active:scale-95 transition-all text-xs font-semibold shrink-0"
            title={isAr ? 'طباعة A4 / PDF' : 'Print A4 / PDF'}
          >
            <Printer className="w-4 h-4 text-[var(--primary)]" />
            <span>{isAr ? 'طباعة A4' : 'Print A4'}</span>
          </button>
        </div>

        {/* Formatted Text Box */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] max-h-96 overflow-y-auto">
          <pre
            dir={mode === 'soap' ? 'ltr' : (isAr ? 'rtl' : 'ltr')}
            className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-[var(--text)] select-text"
          >
            {contentText}
          </pre>
        </div>
      </div>
    </BottomSheet>
  );
};
