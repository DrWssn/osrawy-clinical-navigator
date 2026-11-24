import React, { useState } from 'react';
import { UserPlus, Bookmark, Trash2, Clock, Check } from 'lucide-react';
import { usePatientStore, PatientDraft } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';

export const PatientSwitcherSheet: React.FC = () => {
  const { patient, resetPatient, saveDraft, loadDraft, deleteDraft, getDrafts } = usePatientStore();
  const { overlayStack, popOverlay, lang } = useAppStore();
  const isAr = lang === 'ar';

  const [draftName, setDraftName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isOpen = overlayStack.includes('patient-switcher');
  const drafts = getDrafts();

  const handleNewPatient = () => {
    resetPatient();
    popOverlay();
  };

  const handleSaveDraft = () => {
    saveDraft(draftName || patient.name);
    setDraftName('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSelectDraft = (draft: PatientDraft) => {
    loadDraft(draft.id);
    popOverlay();
  };

  return (
    <BottomSheet
      id="patient-switcher"
      isOpen={isOpen}
      onClose={() => popOverlay()}
      title={isAr ? 'إدارة المريض والمسودات السريرية' : 'Patient Manager & Saved Drafts'}
    >
      <div className="flex flex-col gap-4 py-1">
        {/* Active Patient Card */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-white text-sm font-bold flex items-center justify-center shrink-0">
              {patient.sex === 'f' ? '♀' : '♂'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text)]">{patient.name || 'New Patient'}</h4>
              <p className="text-[11px] text-[var(--muted)]">
                {patient.age}y · eGFR {patient.egfr} · BP {patient.sbp}/{patient.dbp} · {patient.activeMeds.length} meds
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
            Active
          </span>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleNewPatient}
            className="flex items-center justify-center gap-2 h-11 px-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface2)] text-[var(--text)] text-xs font-semibold active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4 text-[var(--primary)]" />
            <span>{isAr ? 'مريض جديد (تصفير)' : 'New Patient'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center justify-center gap-2 h-11 px-3 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold active:scale-95 transition-all shadow-sm"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            <span>{savedSuccess ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ كمسودة' : 'Save as Draft')}</span>
          </button>
        </div>

        {/* Saved Drafts List */}
        <div>
          <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
            {isAr ? 'المسودات المحفوظة مؤخراً' : 'Recent Patient Drafts'} ({drafts.length})
          </h4>

          {drafts.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--muted)] bg-[var(--surface2)] rounded-xl border border-dashed border-[var(--line)]">
              {isAr ? 'لا توجد مسودات محفوظة حالياً.' : 'No saved patient drafts yet.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              {drafts.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface2)] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectDraft(d)}
                    className="flex-1 text-start"
                  >
                    <div className="text-xs font-bold text-[var(--text)]">{d.patient.name}</div>
                    <div className="text-[10px] text-[var(--muted)] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(d.timestamp).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{d.patient.age}y · eGFR {d.patient.egfr}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteDraft(d.id)}
                    className="p-1.5 text-[var(--muted)] hover:text-red-600 transition-colors"
                    title="Delete draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
