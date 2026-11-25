import React, { useState, useMemo } from 'react';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Check, Trash2 } from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';

const SEVERITY_ORDER: Record<'critical' | 'warning' | 'info', number> = {
  critical: 0,
  warning: 1,
  info: 2
};

const MED_ALIASES: Record<string, string[]> = {
  metformin: ['metformin', 'met', 'glucophage', 'cidophage'],
  rosuvastatin: ['rosuvastatin', 'rosuva', 'crestor'],
  simvastatin: ['simvastatin', 'simva', 'zocor'],
  propranolol: ['propranolol', 'prop', 'inderal'],
  atorvastatin: ['atorvastatin', 'atorva', 'lipitor'],
  ramipril: ['ramipril', 'tritace'],
  perindopril: ['perindopril', 'coversyl', 'coveram'],
  sacubitril_valsartan: ['sacubitril_valsartan', 'entresto', 'arni'],
};

function matchesRemoveMed(activeMed: string, targetId: string): boolean {
  const m = activeMed.toLowerCase().trim();
  const t = targetId.toLowerCase().trim();
  if (!m || !t) return false;
  if (m === t) return true;
  const aliases = MED_ALIASES[t];
  if (aliases && aliases.some(a => m === a || m.includes(a))) return true;
  return t.length > 4 && m.includes(t);
}

export const SafetyBanner: React.FC = () => {
  const guardrails = usePatientStore(s => s.guardrails);
  const patient = usePatientStore(s => s.patient);
  const setField = usePatientStore(s => s.setField);
  const lang = useAppStore(s => s.lang);
  const isAr = lang === 'ar';

  const [expanded, setExpanded] = useState(false);
  const [ackedMap, setAckedMap] = useState<Record<string, string>>({});

  const sortedAlerts = useMemo(() => {
    if (!guardrails || guardrails.length === 0) return [];
    return [...guardrails].sort(
      (a, b) => (SEVERITY_ORDER[a.level] ?? 9) - (SEVERITY_ORDER[b.level] ?? 9)
    );
  }, [guardrails]);

  if (sortedAlerts.length === 0) return null;

  const critCount = sortedAlerts.filter(g => g.level === 'critical').length;
  const warnCount = sortedAlerts.filter(g => g.level === 'warning').length;
  const infoCount = sortedAlerts.filter(g => g.level === 'info').length;

  const isAlertAcked = (id: string, sig: string) => ackedMap[id] === sig;
  const toggleAck = (id: string, sig: string) => {
    setAckedMap(prev => {
      const next = { ...prev };
      if (next[id] === sig) {
        delete next[id];
      } else {
        next[id] = sig;
      }
      return next;
    });
  };

  const handleRemoveMed = (removeMedId: string) => {
    const updated = patient.activeMeds.filter(m => !matchesRemoveMed(m, removeMedId));
    setField('activeMeds', updated);
  };

  const topUnacked =
    sortedAlerts.find(g => !isAlertAcked(g.id, `${g.level}:${g.titleEn}`)) || sortedAlerts[0];

  const barTone =
    critCount > 0
      ? 'bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger-text)]'
      : warnCount > 0
        ? 'bg-[var(--warn-bg)] border-[var(--warn-border)] text-[var(--warn-text)]'
        : 'bg-[var(--info-bg)] border-[var(--info-border)] text-[var(--info-text)]';

  const summaryTitle = isAr ? topUnacked.titleAr : topUnacked.titleEn;

  return (
    <div className="w-full bg-[var(--surface)] border-b border-[var(--line)] px-3 py-1.5">
      <div className="max-w-5xl mx-auto">
        {/* Compact 1-Line Severity Summary Bar */}
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(prev => !prev)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${barTone}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {critCount > 0 ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : warnCount > 0 ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Info className="w-4 h-4 shrink-0" />
            )}
            <span className="font-bold truncate">{summaryTitle}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {critCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#DC2626] text-white text-[10px] font-bold">
                {critCount} {isAr ? 'حرج' : 'Critical'}
              </span>
            )}
            {warnCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#D97706] text-white text-[10px] font-bold">
                {warnCount} {isAr ? 'تحذير' : 'Warn'}
              </span>
            )}
            {infoCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-[10px] font-bold">
                {infoCount} {isAr ? 'معلومة' : 'Info'}
              </span>
            )}
            <span className="text-[10px] font-semibold opacity-80 hidden sm:inline">
              {expanded ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'مراجعة' : 'Review')}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Expandable Multi-Alert Drawer */}
        {expanded && (
          <div className="mt-2 flex flex-col gap-2 max-h-72 overflow-y-auto overscroll-contain pe-0.5 animate-in fade-in duration-150">
            {sortedAlerts.map((g) => {
              const sig = `${g.level}:${g.titleEn}`;
              const acked = isAlertAcked(g.id, sig);
              const canRemoveMed = Boolean(
                g.removeMedId && patient.activeMeds.some(m => matchesRemoveMed(m, g.removeMedId!))
              );

              const cardStyle =
                g.level === 'critical'
                  ? 'bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger-text)]'
                  : g.level === 'warning'
                    ? 'bg-[var(--warn-bg)] border-[var(--warn-border)] text-[var(--warn-text)]'
                    : 'bg-[var(--info-bg)] border-[var(--info-border)] text-[var(--info-text)]';

              const levelLabel =
                g.level === 'critical'
                  ? (isAr ? 'حرج' : 'CRITICAL')
                  : g.level === 'warning'
                    ? (isAr ? 'تحذير' : 'WARNING')
                    : (isAr ? 'توصية' : 'INFO');

              return (
                <div
                  key={g.id}
                  className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 transition-opacity ${cardStyle} ${
                    acked ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-[10px] font-extrabold tracking-wide">
                        {levelLabel}
                      </span>
                      {(g.sourceEngine || g.engine) && (
                        <span className="px-1.5 py-0.5 rounded-md border border-current/25 text-[10px] font-semibold uppercase opacity-80">
                          {g.sourceEngine || g.engine}
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm">
                    {isAr ? g.titleAr : g.titleEn}
                  </h4>

                  <p className="text-[11px] leading-relaxed opacity-90">
                    {isAr ? g.messageAr : g.messageEn}
                  </p>

                  {(g.actionEn || g.actionAr) && (
                    <p className="text-[11px] font-semibold opacity-95">
                      {isAr ? `الإجراء: ${g.actionAr || g.actionEn}` : `Action: ${g.actionEn || g.actionAr}`}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                    {canRemoveMed && g.removeMedId && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMed(g.removeMedId!)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[11px] font-semibold shadow-sm active:scale-95 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isAr ? `إيقاف ${g.removeMedId}` : `Remove ${g.removeMedId}`}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleAck(g.id, sig)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] text-[11px] font-semibold active:scale-95 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {acked
                          ? (isAr ? 'تم الاطلاع ✓' : 'Acknowledged ✓')
                          : (isAr ? 'تأكيد الاطلاع' : 'Acknowledge')}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
