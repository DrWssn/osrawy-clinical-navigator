import React, { useState } from 'react';
import { UserPlus, Bookmark, Trash2, Clock, Check, Sparkles } from 'lucide-react';
import { usePatientStore, PatientDraft, PatientState, DEFAULT_PATIENT } from '../../store/usePatientStore';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';

interface ClinicalPreset {
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  patch: Partial<PatientState>;
}

export const CLINICAL_CASE_PRESETS: ClinicalPreset[] = [
  {
    id: 'preset-cardiorenal-t2dm',
    titleEn: 'Cardio-Renal T2DM + CKD',
    titleAr: 'سكري + قصور كلوي وقلبي (G3b/A3)',
    subtitleEn: '58M · A1c 9.2% · eGFR 42 · UACR 320 · HFrEF',
    subtitleAr: '58 سنة · تراكمي 9.2% · ترشيح 42 · زلال 320 · قصور قلب',
    patch: {
      name: 'Khalid Al-Otaibi',
      age: 58,
      sex: 'm',
      wt: 98,
      ht: 172,
      a1c: 9.2,
      fpg: 210,
      egfr: 42,
      scr: 1.7,
      scrUnit: 'mg',
      uacr: 320,
      sbp: 154,
      dbp: 94,
      k: 4.8,
      dm: true,
      hf: 'hfref',
      ascvd: true,
      frail: false,
      pregnancy: false,
      asthma: false,
      copd: false,
      activeMeds: ['metformin', 'ramipril']
    }
  },
  {
    id: 'preset-preg-htn-asthma',
    titleEn: 'Pregnant HTN + Asthma',
    titleAr: 'حمل مع ارتفاع ضغط + ربو',
    subtitleEn: '29F · T1 (10w) · BP 146/92 · Asthma · TSH 7.8',
    subtitleAr: '29 سنة · حمل T1 · ضغط 146/92 · ربو · TSH 7.8',
    patch: {
      name: 'Noura Al-Harbi',
      age: 29,
      sex: 'f',
      wt: 72,
      ht: 163,
      pregnancy: true,
      trimester: 1,
      thyroidTrimester: 1,
      gestationalWeeks: 10,
      a1c: 6.4,
      fpg: 106,
      egfr: 112,
      scr: 0.6,
      scrUnit: 'mg',
      uacr: 18,
      sbp: 146,
      dbp: 92,
      k: 4.2,
      dm: true,
      hf: 'none',
      ascvd: false,
      frail: false,
      asthma: true,
      asthmaDaySymptoms: 3,
      asthmaRelieverPerWk: 3,
      copd: false,
      tsh: 7.8,
      ft4: 0.65,
      activeMeds: ['ramipril', 'atorvastatin']
    }
  },
  {
    id: 'preset-asthma-saba-overuse',
    titleEn: 'Uncontrolled Asthma (SABA Overuse)',
    titleAr: 'ربو غير منضبط (إفراط الفنتولين)',
    subtitleEn: '34F · Reliever 5x/wk · 4 canisters/yr · TSH 0.04',
    subtitleAr: '34 سنة · فنتولين 5 مرات/أسبوع · 4 عبوات/سنة · نشاط درقي',
    patch: {
      name: 'Salma Hassan',
      age: 34,
      sex: 'f',
      wt: 64,
      ht: 162,
      pregnancy: false,
      a1c: 5.4,
      fpg: 92,
      egfr: 105,
      scr: 0.7,
      scrUnit: 'mg',
      uacr: 10,
      sbp: 124,
      dbp: 78,
      k: 4.1,
      dm: false,
      hf: 'none',
      ascvd: false,
      frail: false,
      asthma: true,
      asthmaDaySymptoms: 4,
      asthmaNightWaking: true,
      asthmaRelieverPerWk: 5,
      asthmaActivityLimit: true,
      asthmaSabaCanistersYr: 4,
      copd: false,
      tsh: 0.04,
      ft4: 2.8,
      activeMeds: ['salbutamol']
    }
  },
  {
    id: 'preset-hypothyroid-cad-frail',
    titleEn: 'Overt Hypothyroid + CAD + Frail',
    titleAr: 'قصور درقي صريح + شرايين + وهن صحي',
    subtitleEn: '79M · Frail · eGFR 26 · TSH 18.4 · Simvastatin+Amlodipine',
    subtitleAr: '79 سنة · وهن صحي · ترشيح 26 · TSH 18.4 · تداخلات دوائية',
    patch: {
      name: 'Ibrahim Mansour',
      age: 79,
      sex: 'm',
      wt: 62,
      ht: 168,
      frail: true,
      pregnancy: false,
      a1c: 7.4,
      fpg: 138,
      egfr: 26,
      scr: 2.4,
      scrUnit: 'mg',
      uacr: 180,
      sbp: 136,
      dbp: 76,
      k: 5.3,
      dm: true,
      hf: 'none',
      ascvd: true,
      ldlC: 95,
      asthma: false,
      copd: false,
      tsh: 18.4,
      ft4: 0.45,
      activeMeds: ['metformin', 'amlodipine', 'simvastatin']
    }
  }
];

export const PatientSwitcherSheet: React.FC = () => {
  const { patient, updatePatient, resetPatient, saveDraft, loadDraft, deleteDraft, getDrafts } = usePatientStore();
  const { overlayStack, popOverlay, lang } = useAppStore();
  const isAr = lang === 'ar';

  const [draftName, setDraftName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [, setDraftsVersion] = useState(0);

  const isOpen = overlayStack.includes('patient-switcher');
  const drafts = getDrafts().filter(
    (d): d is PatientDraft => Boolean(d && typeof d.id === 'string' && d.patient && typeof d.patient === 'object')
  );

  const handleNewPatient = () => {
    resetPatient();
    popOverlay();
  };

  const handleSaveDraft = () => {
    saveDraft(draftName.trim() || patient.name);
    setDraftName('');
    setSavedSuccess(true);
    setDraftsVersion(v => v + 1);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSelectDraft = (draft: PatientDraft) => {
    loadDraft(draft.id);
    popOverlay();
  };

  const handleDeleteDraft = (id: string) => {
    deleteDraft(id);
    setDraftsVersion(v => v + 1);
  };

  const handleApplyPreset = (preset: ClinicalPreset) => {
    updatePatient({ ...DEFAULT_PATIENT, ...preset.patch });
    popOverlay();
  };

  const displayName =
    !patient.name || patient.name === 'New Patient'
      ? (isAr ? 'مريض جديد' : 'New Patient')
      : patient.name;

  return (
    <BottomSheet
      id="patient-switcher"
      isOpen={isOpen}
      onClose={() => popOverlay()}
      title={isAr ? 'إدارة المريض والحالات السريرية' : 'Patient Manager, Presets & Drafts'}
      maxHeight="max-h-[90vh]"
    >
      <div className="flex flex-col gap-4 py-1">
        {/* Active Patient Card */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-sm font-bold flex items-center justify-center shrink-0">
              {patient.sex === 'f' ? '♀' : '♂'}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-[var(--text)] truncate">{displayName}</h4>
              <p className="text-[11px] text-[var(--muted)] truncate">
                <bdi dir="ltr">
                  {patient.age}{isAr ? ' سنة' : 'y'} · eGFR {patient.egfr} · BP {patient.sbp}/{patient.dbp}
                </bdi>{' '}
                · {patient.activeMeds.length} {isAr ? 'أدوية' : 'meds'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--safe-bg)] text-[var(--safe-text)] border border-[var(--safe-border)] shrink-0">
            {isAr ? 'نشط' : 'Active'}
          </span>
        </div>

        {/* Save Draft Name + Quick Actions */}
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={isAr ? 'اسم المسودة (اختياري)...' : 'Draft label (optional)...'}
            aria-label={isAr ? 'اسم المسودة' : 'Draft label'}
            className="w-full h-10 px-3 bg-[var(--input-bg)] text-[var(--text)] text-xs font-semibold rounded-xl border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
          />

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
              className="flex items-center justify-center gap-2 h-11 px-3 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold active:scale-95 transition-all shadow-sm"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{savedSuccess ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ كمسودة' : 'Save as Draft')}</span>
            </button>
          </div>
        </div>

        {/* 1-Tap Clinical Case Presets */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
              {isAr ? 'حالات سريرية جاهزة (نقرة واحدة)' : '1-Tap Clinical Case Presets'}
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CLINICAL_CASE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface2)] text-start transition-all active:scale-[0.98]"
              >
                <div className="text-xs font-bold text-[var(--text)]">
                  {isAr ? preset.titleAr : preset.titleEn}
                </div>
                <div className="text-[10px] text-[var(--muted)] mt-0.5 truncate">
                  {isAr ? preset.subtitleAr : preset.subtitleEn}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Saved Drafts List */}
        <div>
          <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
            {isAr ? 'المسودات المحفوظة مؤخراً' : 'Recent Patient Drafts'} ({drafts.length})
          </h4>

          {drafts.length === 0 ? (
            <div className="p-5 text-center text-xs text-[var(--muted)] bg-[var(--surface2)] rounded-xl border border-dashed border-[var(--line)]">
              {isAr ? 'لا توجد مسودات محفوظة حالياً.' : 'No saved patient drafts yet.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
              {drafts.map((d) => {
                const dName = d.patient.name || (isAr ? 'مريض بدون اسم' : 'Unnamed Patient');
                const dAge = d.patient.age ?? '-';
                const dEgfr = d.patient.egfr ?? '-';
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface2)] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectDraft(d)}
                      className="flex-1 text-start min-w-0"
                    >
                      <div className="text-xs font-bold text-[var(--text)] truncate">{dName}</div>
                      <div className="text-[10px] text-[var(--muted)] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{new Date(d.timestamp || Date.now()).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                        <span>·</span>
                        <bdi dir="ltr">
                          {dAge}{isAr ? ' سنة' : 'y'} · eGFR {dEgfr}
                        </bdi>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(d.id)}
                      className="p-1.5 text-[var(--muted)] hover:text-[var(--danger-text)] transition-colors shrink-0"
                      title={isAr ? 'حذف المسودة' : 'Delete draft'}
                      aria-label={isAr ? 'حذف المسودة' : 'Delete draft'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
