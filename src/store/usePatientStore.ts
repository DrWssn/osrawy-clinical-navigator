import { create } from 'zustand';
import { evaluateSafetyGuardrails, GuardrailAlert } from '../engines/safety';
import { calculateBMI } from '../engines/calculators';

export interface PatientState {
  name: string;
  age: number;
  sex: 'm' | 'f';
  wt: number;
  ht: number;
  dur: number;
  hf: 'none' | 'hfref' | 'hfpef';
  a1c: number;
  fpg: number;
  egfr: number;
  uacr: number;
  sbp: number;
  dbp: number;
  k: number;
  tc: number;
  hdl: number;
  totalCholesterol: number;
  ldlC: number;
  hdlC: number;
  triglycerides: number;
  altUl: number;
  lipidUnit: 'mg' | 'mmol';
  smoker: boolean;
  statin: boolean;
  ascvd: boolean;
  diabetes: boolean;
  dm: boolean;
  statinIntolerant: boolean;
  pregnancy: boolean;
  postpartum: boolean;
  trimester: number;
  gestationalWeeks: number;
  asthma: boolean;
  copd: boolean;
  tsh: number;
  ft4: number;
  medications: string[];
  activeMeds: string[];
}

export interface PatientDraft {
  id: string;
  timestamp: number;
  patient: PatientState;
}

export const DEFAULT_PATIENT: PatientState = {
  name: 'Ahmed Mahmoud',
  age: 52,
  sex: 'm',
  wt: 96,
  ht: 170,
  dur: 4,
  hf: 'none',
  a1c: 8.9,
  fpg: 190,
  egfr: 68,
  uacr: 45,
  sbp: 148,
  dbp: 94,
  k: 4.6,
  tc: 210,
  hdl: 42,
  totalCholesterol: 210,
  ldlC: 130,
  hdlC: 42,
  triglycerides: 180,
  altUl: 28,
  lipidUnit: 'mg',
  smoker: false,
  statin: false,
  ascvd: false,
  diabetes: true,
  dm: true,
  statinIntolerant: false,
  pregnancy: false,
  postpartum: false,
  trimester: 2,
  gestationalWeeks: 16,
  asthma: false,
  copd: false,
  tsh: 2.5,
  ft4: 1.2,
  medications: ['metformin'],
  activeMeds: ['metformin']
};

let memoryStorage: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  } catch {}
  return memoryStorage[key] || null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch {}
  memoryStorage[key] = value;
}

function loadStoredPatient(): PatientState {
  try {
    const saved = getStorageItem('osrawy_active_patient');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PATIENT, ...parsed };
    }
  } catch {}
  return DEFAULT_PATIENT;
}

function persistPatient(pt: PatientState): void {
  try {
    setStorageItem('osrawy_active_patient', JSON.stringify(pt));
  } catch {}
}

export interface PatientStore {
  patient: PatientState;
  guardrails: GuardrailAlert[];
  bmi: string;
  setField: <K extends keyof PatientState>(key: K, value: PatientState[K]) => void;
  updatePatient: (patch: Partial<PatientState>) => void;
  setEGFR: (val: number) => void;
  setBloodPressure: (sbp: number, dbp: number) => void;
  toggleMedication: (medId: string) => void;
  resetPatient: () => void;
  saveDraft: (customName?: string) => string;
  loadDraft: (draftId: string) => boolean;
  deleteDraft: (draftId: string) => void;
  getDrafts: () => PatientDraft[];
}

export const usePatientStore = create<PatientStore>((set, get) => {
  const initialPatient = loadStoredPatient();
  const initialGuardrails = evaluateSafetyGuardrails(initialPatient);
  const initialBmi = String(calculateBMI(initialPatient.wt, initialPatient.ht)?.bmi || '—');

  function applyState(nextPt: PatientState) {
    if (nextPt.sex === 'm') {
      nextPt.pregnancy = false;
      nextPt.postpartum = false;
    }
    if (nextPt.tc !== undefined) nextPt.totalCholesterol = nextPt.tc;
    if (nextPt.hdl !== undefined) nextPt.hdlC = nextPt.hdl;
    if (nextPt.diabetes !== undefined) nextPt.dm = nextPt.diabetes;

    const guardrails = evaluateSafetyGuardrails(nextPt);
    const bmiCalc = calculateBMI(nextPt.wt, nextPt.ht);
    const bmi = String(bmiCalc ? bmiCalc.bmi : '—');
    persistPatient(nextPt);
    set({ patient: nextPt, guardrails, bmi });
  }

  return {
    patient: initialPatient,
    guardrails: initialGuardrails,
    bmi: initialBmi,

    setField: (key, value) => {
      const current = { ...get().patient, [key]: value };
      applyState(current);
    },

    updatePatient: (patch) => {
      const current = { ...get().patient, ...patch };
      applyState(current);
    },

    setEGFR: (val) => {
      const current = { ...get().patient, egfr: val };
      applyState(current);
    },

    setBloodPressure: (sbp, dbp) => {
      const current = { ...get().patient, sbp, dbp };
      applyState(current);
    },

    toggleMedication: (medId) => {
      const id = medId.toLowerCase();
      const currentMeds = [...get().patient.activeMeds];
      const idx = currentMeds.findIndex(m => m.toLowerCase() === id);
      if (idx !== -1) {
        currentMeds.splice(idx, 1);
      } else {
        currentMeds.push(id);
      }
      const nextPt = {
        ...get().patient,
        activeMeds: currentMeds,
        medications: currentMeds
      };
      applyState(nextPt);
    },

    resetPatient: () => {
      const fresh: PatientState = {
        ...DEFAULT_PATIENT,
        name: 'New Patient',
        medications: [],
        activeMeds: []
      };
      applyState(fresh);
    },

    saveDraft: (customName) => {
      const pt = get().patient;
      const draftId = `draft_${Date.now()}`;
      const draft: PatientDraft = {
        id: draftId,
        timestamp: Date.now(),
        patient: { ...pt, name: customName || pt.name }
      };
      try {
        const drafts = JSON.parse(getStorageItem('osrawy_patient_drafts') || '[]');
        drafts.unshift(draft);
        setStorageItem('osrawy_patient_drafts', JSON.stringify(drafts.slice(0, 20)));
      } catch {}
      return draftId;
    },

    loadDraft: (draftId) => {
      try {
        const drafts: PatientDraft[] = JSON.parse(getStorageItem('osrawy_patient_drafts') || '[]');
        const found = drafts.find(d => d.id === draftId);
        if (found) {
          applyState(found.patient);
          return true;
        }
      } catch {}
      return false;
    },

    deleteDraft: (draftId) => {
      try {
        const drafts: PatientDraft[] = JSON.parse(getStorageItem('osrawy_patient_drafts') || '[]');
        const filtered = drafts.filter(d => d.id !== draftId);
        setStorageItem('osrawy_patient_drafts', JSON.stringify(filtered));
      } catch {}
    },

    getDrafts: () => {
      try {
        return JSON.parse(getStorageItem('osrawy_patient_drafts') || '[]');
      } catch {}
      return [];
    }
  };
});
