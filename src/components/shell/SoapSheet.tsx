import React, { useState } from 'react';
import { Copy, Share2, Printer, Check } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { SegmentedControl } from '../ui/SegmentedControl';
import { buildStructuredSoapNote, buildPrescriptionReport, buildWhatsAppShareUrl } from '../../engines/exporters';

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
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(contentText);
      } else {
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
    const url = buildWhatsAppShareUrl('', contentText);
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
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
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                : 'bg-[var(--surface2)] text-[var(--text)] border-[var(--line)] hover:bg-[var(--surface)]'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[var(--muted)]" />}
            <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy')}</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold active:scale-95 transition-all shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--line)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--surface)] active:scale-95 transition-all shrink-0"
            title="Print"
          >
            <Printer className="w-4 h-4 text-[var(--muted)]" />
          </button>
        </div>

        {/* Formatted Text Box */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] max-h-96 overflow-y-auto">
          <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-[var(--text)] select-text">
            {contentText}
          </pre>
        </div>
      </div>
    </BottomSheet>
  );
};
