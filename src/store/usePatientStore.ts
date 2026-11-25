import { create } from 'zustand';
import { evaluateSafetyGuardrails, GuardrailAlert } from '../engines/safety';
import { evaluatePrimaryCare } from '../engines/primaryCare';
import { evaluateLipidPathway } from '../engines/lipids';
import { calculateBMI } from '../engines/calculators';

export interface PatientState {
  name: string;
  age: number;
  sex: 'm' | 'f';
  wt: number;
  ht: number;
  dur: number;
  hf: 'none' | 'hfref' | 'hfpef';
  frail: boolean;
  a1c: number;
  fpg: number;
  egfr: number;
  scr: number;
  scrUnit: 'mg' | 'umol';
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
  asthmaDaySymptoms: number;
  asthmaNightWaking: boolean;
  asthmaRelieverPerWk: number;
  asthmaActivityLimit: boolean;
  asthmaSabaCanistersYr: number;
  copd: boolean;
  copdMmrc: number;
  copdCat: number;
  copdExacerbations: number;
  copdHospitalizations: number;
  copdEosinophils: number;
  tsh: number;
  ft4: number;
  thyroidTrimester: 1 | 2 | 3;
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
  frail: false,
  a1c: 8.9,
  fpg: 190,
  egfr: 68,
  scr: 0.9,
  scrUnit: 'mg',
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
  asthmaDaySymptoms: 0,
  asthmaNightWaking: false,
  asthmaRelieverPerWk: 0,
  asthmaActivityLimit: false,
  asthmaSabaCanistersYr: 0,
  copd: false,
  copdMmrc: 0,
  copdCat: 0,
  copdExacerbations: 0,
  copdHospitalizations: 0,
  copdEosinophils: 150,
  tsh: 2.5,
  ft4: 1.2,
  thyroidTrimester: 2,
  medications: ['metformin'],
  activeMeds: ['metformin']
};

export function getScrMgDl(
  pt: Pick<PatientState, 'scr' | 'scrUnit'> | { scr?: number; scrUnit?: 'mg' | 'umol'; creatinineMgDl?: number }
): number {
  const raw = Number((pt as any)?.scr ?? (pt as any)?.creatinineMgDl ?? 0.9) || 0;
  if (raw <= 0) return 0;
  const mg = pt?.scrUnit === 'umol' ? raw / 88.4 : raw;
  return Math.round(mg * 100) / 100;
}

function normalizeAlert(raw: any, fallbackSource: string): GuardrailAlert {
  const level: 'critical' | 'warning' | 'info' =
    raw.level === 'critical' || raw.level === 'warning' || raw.level === 'info' ? raw.level : 'info';
  const titleEn = String(raw.titleEn || raw.title || '');
  const titleAr = String(raw.titleAr || raw.titleEn || '');
  const messageEn = String(raw.messageEn || raw.msgEn || raw.msg || '');
  const messageAr = String(raw.messageAr || raw.msgAr || raw.messageEn || '');
  const actionEn = String(raw.actionEn || '');
  const actionAr = String(raw.actionAr || '');
  const sourceEngine = String(raw.sourceEngine || raw.engine || fallbackSource);

  return {
    id: String(raw.id || `${sourceEngine}-${titleEn.slice(0, 24)}`),
    level,
    severity: raw.severity || level,
    engine: String(raw.engine || fallbackSource),
    sourceEngine,
    titleEn,
    titleAr,
    messageEn,
    messageAr,
    msgEn: raw.msgEn || messageEn,
    msgAr: raw.msgAr || messageAr,
    actionEn,
    actionAr,
    removeMedId: raw.removeMedId,
    text: raw.text || `${titleEn}: ${messageEn} | ${titleAr}: ${messageAr}`,
    message: raw.message || `${messageEn} | ${messageAr}`,
    msg: raw.msg || messageEn,
    title: raw.title || titleEn
  };
}

export function computeGuardrails(pt: PatientState): GuardrailAlert[] {
  const merged: GuardrailAlert[] = [];
  const seenIds = new Set<string>();

  const pushUnique = (raw: any, source: string) => {
    const normalized = normalizeAlert(raw, source);
    if (!seenIds.has(normalized.id)) {
      seenIds.add(normalized.id);
      merged.push(normalized);
    }
  };

  for (const a of evaluateSafetyGuardrails(pt)) {
    pushUnique(a, a.engine || 'safety');
  }

  try {
    const pc = evaluatePrimaryCare(pt);
    const pcAlerts = Array.isArray(pc?.allAlerts) ? pc.allAlerts : [];
    for (const a of pcAlerts) {
      if (a.level === 'critical' || a.level === 'warning' || a.level === 'info') {
        pushUnique(a, a.sourceEngine || 'primaryCare');
      }
    }
  } catch {}

  try {
    const lp = evaluateLipidPathway(pt);
    const lipidAlerts = Array.isArray(lp?.alerts) ? lp.alerts : [];
    for (const a of lipidAlerts) {
      pushUnique(a, 'lipids');
    }
  } catch {}

  return merged;
}

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

export function normalizeLegacyPatientRecord(raw: any): Partial<PatientState> {
  if (!raw || typeof raw !== 'object') return {};
  const normalized: any = { ...raw };

  if (Array.isArray(normalized.activeMeds)) {
    normalized.activeMeds = [...normalized.activeMeds];
    normalized.medications = [...normalized.activeMeds];
  } else if (Array.isArray(normalized.medications)) {
    normalized.activeMeds = [...normalized.medications];
    normalized.medications = [...normalized.medications];
  }

  if (normalized.tc === undefined && normalized.totalCholesterol !== undefined) {
    normalized.tc = normalized.totalCholesterol;
  } else if (normalized.totalCholesterol === undefined && normalized.tc !== undefined) {
    normalized.totalCholesterol = normalized.tc;
  }

  if (normalized.hdl === undefined && normalized.hdlC !== undefined) {
    normalized.hdl = normalized.hdlC;
  } else if (normalized.hdlC === undefined && normalized.hdl !== undefined) {
    normalized.hdlC = normalized.hdl;
  }

  if (normalized.diabetes === undefined && normalized.dm !== undefined) {
    normalized.diabetes = normalized.dm;
  } else if (normalized.dm === undefined && normalized.diabetes !== undefined) {
    normalized.dm = normalized.diabetes;
  }

  return normalized;
}

function loadStoredPatient(): PatientState {
  try {
    const saved = getStorageItem('osrawy_active_patient');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PATIENT, ...normalizeLegacyPatientRecord(parsed) };
    }
  } catch {}
  return DEFAULT_PATIENT;
}

function persistPatient(pt: PatientState): void {
  try {
    setStorageItem('osrawy_active_patient', JSON.stringify(pt));
  } catch {}
}

function readDraftsStorage(): PatientDraft[] {
  try {
    const parsed = JSON.parse(getStorageItem('osrawy_patient_drafts') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
  const initialGuardrails = computeGuardrails(initialPatient);
  const initialBmi = String(calculateBMI(initialPatient.wt, initialPatient.ht)?.bmi || '—');

  function applyState(nextPt: PatientState) {
    if (nextPt.sex === 'm') {
      nextPt.pregnancy = false;
      nextPt.postpartum = false;
    }
    if (Array.isArray(nextPt.activeMeds)) {
      nextPt.activeMeds = [...nextPt.activeMeds];
      nextPt.medications = [...nextPt.activeMeds];
    } else if (Array.isArray(nextPt.medications)) {
      nextPt.activeMeds = [...nextPt.medications];
      nextPt.medications = [...nextPt.medications];
    }
    if (nextPt.tc !== undefined) nextPt.totalCholesterol = nextPt.tc;
    if (nextPt.hdl !== undefined) nextPt.hdlC = nextPt.hdl;
    if (nextPt.diabetes !== undefined) nextPt.dm = nextPt.diabetes;

    const guardrails = computeGuardrails(nextPt);
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
      if (key === 'activeMeds' && Array.isArray(value)) {
        current.medications = [...value];
      } else if (key === 'medications' && Array.isArray(value)) {
        current.activeMeds = [...value];
      } else if (key === 'totalCholesterol') {
        current.tc = value as PatientState['tc'];
      } else if (key === 'tc') {
        current.totalCholesterol = value as PatientState['totalCholesterol'];
      } else if (key === 'hdlC') {
        current.hdl = value as PatientState['hdl'];
      } else if (key === 'hdl') {
        current.hdlC = value as PatientState['hdlC'];
      } else if (key === 'dm') {
        current.diabetes = value as PatientState['diabetes'];
      } else if (key === 'diabetes') {
        current.dm = value as PatientState['dm'];
      }
      applyState(current);
    },

    updatePatient: (patch) => {
      const current = { ...get().patient, ...patch };
      if (patch.activeMeds !== undefined && patch.medications === undefined) {
        current.medications = [...patch.activeMeds];
      } else if (patch.medications !== undefined && patch.activeMeds === undefined) {
        current.activeMeds = [...patch.medications];
      }
      if (patch.totalCholesterol !== undefined && patch.tc === undefined) {
        current.tc = patch.totalCholesterol;
      } else if (patch.tc !== undefined && patch.totalCholesterol === undefined) {
        current.totalCholesterol = patch.tc;
      }
      if (patch.hdlC !== undefined && patch.hdl === undefined) {
        current.hdl = patch.hdlC;
      } else if (patch.hdl !== undefined && patch.hdlC === undefined) {
        current.hdlC = patch.hdl;
      }
      if (patch.dm !== undefined && patch.diabetes === undefined) {
        current.diabetes = patch.dm;
      } else if (patch.diabetes !== undefined && patch.dm === undefined) {
        current.dm = patch.diabetes;
      }
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
        const drafts = readDraftsStorage();
        drafts.unshift(draft);
        setStorageItem('osrawy_patient_drafts', JSON.stringify(drafts.slice(0, 20)));
      } catch {}
      return draftId;
    },

    loadDraft: (draftId) => {
      try {
        const drafts = readDraftsStorage();
        const found = drafts.find(d => d && d.id === draftId);
        if (found) {
          applyState({ ...DEFAULT_PATIENT, ...normalizeLegacyPatientRecord(found.patient) });
          return true;
        }
      } catch {}
      return false;
    },

    deleteDraft: (draftId) => {
      try {
        const drafts = readDraftsStorage();
        const filtered = drafts.filter(d => d && d.id !== draftId);
        setStorageItem('osrawy_patient_drafts', JSON.stringify(filtered));
      } catch {}
    },

    getDrafts: () => {
      return readDraftsStorage();
    }
  };
});
