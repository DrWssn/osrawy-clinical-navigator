import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePatientStore, DEFAULT_PATIENT, getScrMgDl, normalizeLegacyPatientRecord } from '../src/store/usePatientStore';
import { useAppStore } from '../src/store/useAppStore';
import { buildPrescriptionReport } from '../src/engines/exporters';
import { evaluatePregnancyHtnProtocol } from '../src/engines/htn';

describe('Zustand Stores & Android Back Stack (Step 3)', () => {
  beforeEach(() => {
    usePatientStore.getState().resetPatient();
    useAppStore.getState().closeAllOverlays();
    useAppStore.getState().navigateTo('crm', 'dm');
    useAppStore.getState().navigateTo('pc', 'asthma');
    useAppStore.getState().navigateTo('tools', 'kdigo');
    useAppStore.getState().setActiveTab('cockpit');
  });

  describe('usePatientStore', () => {
    it('initializes with default patient and recalculates guardrails reactively', () => {
      const state = usePatientStore.getState();
      expect(state.patient.name).toBe('New Patient');
      expect(state.guardrails).toBeDefined();
    });

    it('forces pregnancy to false when sex changes to male', () => {
      const store = usePatientStore.getState();
      store.updatePatient({ sex: 'f', pregnancy: true });
      expect(usePatientStore.getState().patient.pregnancy).toBe(true);

      store.setField('sex', 'm');
      expect(usePatientStore.getState().patient.pregnancy).toBe(false);
    });

    it('triggers Metformin contraindication immediately when eGFR drops below 30', () => {
      const store = usePatientStore.getState();
      store.updatePatient({ egfr: 75, activeMeds: ['metformin'] });
      let guardrails = usePatientStore.getState().guardrails;
      let hasCrit = guardrails.some(g => g.id === 'guardrail-metformin-crit');
      expect(hasCrit).toBe(false);

      store.setEGFR(24);
      guardrails = usePatientStore.getState().guardrails;
      hasCrit = guardrails.some(g => g.id === 'guardrail-metformin-crit');
      expect(hasCrit).toBe(true);
    });

    it('toggles medication correctly and syncs activeMeds', () => {
      const store = usePatientStore.getState();
      store.toggleMedication('jardiance');
      expect(usePatientStore.getState().patient.activeMeds).toContain('jardiance');

      store.toggleMedication('jardiance');
      expect(usePatientStore.getState().patient.activeMeds).not.toContain('jardiance');
    });

    it('saves, loads, and deletes patient drafts', () => {
      const store = usePatientStore.getState();
      store.updatePatient({ name: 'Draft Patient Test', age: 45 });
      const draftId = store.saveDraft('Draft Patient Test');
      expect(typeof draftId).toBe('string');

      store.resetPatient();
      expect(usePatientStore.getState().patient.name).toBe('New Patient');

      const loaded = store.loadDraft(draftId);
      expect(loaded).toBe(true);
      expect(usePatientStore.getState().patient.name).toBe('Draft Patient Test');
      expect(usePatientStore.getState().patient.age).toBe(45);

      store.deleteDraft(draftId);
      const drafts = store.getDrafts();
      expect(drafts.some(d => d.id === draftId)).toBe(false);
    });

    it('provides M1 defaults (scr, scrUnit, frail, primary care) with zero spurious critical/warning alerts', () => {
      expect(DEFAULT_PATIENT.scr).toBe(0.9);
      expect(DEFAULT_PATIENT.scrUnit).toBe('mg');
      expect(DEFAULT_PATIENT.frail).toBe(false);
      expect(DEFAULT_PATIENT.copdEosinophils).toBe(150);

      usePatientStore.getState().updatePatient({ ...DEFAULT_PATIENT });
      const guardrails = usePatientStore.getState().guardrails;
      const urgent = guardrails.filter(g => g.level === 'critical' || g.level === 'warning');
      expect(urgent.length).toBe(0);
    });

    it('converts serum creatinine via getScrMgDl', () => {
      expect(getScrMgDl({ scr: 0.9, scrUnit: 'mg' })).toBe(0.9);
      expect(getScrMgDl({ scr: 133, scrUnit: 'umol' })).toBe(1.5);
    });

    it('syncs activeMeds: [] to medications and clears Metformin critical alert', () => {
      const store = usePatientStore.getState();
      store.updatePatient({ egfr: 22, activeMeds: ['metformin'] });
      expect(usePatientStore.getState().guardrails.some(g => g.id === 'guardrail-metformin-crit')).toBe(true);

      store.updatePatient({ activeMeds: [] });
      expect(usePatientStore.getState().patient.medications).toEqual([]);
      expect(usePatientStore.getState().guardrails.some(g => g.id === 'guardrail-metformin-crit')).toBe(false);
    });

    it('merges lipid and primaryCare alerts into unified guardrails while gating disabled respiratory flags', () => {
      const store = usePatientStore.getState();

      // Disabled COPD should not emit low-eos warning even when copdEosinophils < 100
      store.updatePatient({ copd: false, copdEosinophils: 50, asthma: false, asthmaRelieverPerWk: 5 });
      expect(usePatientStore.getState().guardrails.some(g => g.id === 'copd-low-eos-pneumonia-risk')).toBe(false);
      expect(usePatientStore.getState().guardrails.some(g => g.id === 'asthma-saba-overuse')).toBe(false);

      // Enabling COPD/Asthma & Lipid interactions surfaces unified alerts with removeMedId
      store.updatePatient({
        copd: true,
        copdEosinophils: 50,
        asthma: true,
        asthmaRelieverPerWk: 4,
        tsh: 0.05,
        ft4: 2.5,
        triglycerides: 580,
        activeMeds: ['amlodipine', 'simvastatin']
      });
      const guardrails = usePatientStore.getState().guardrails;
      const ids = guardrails.map(g => g.id);
      expect(ids).toContain('copd-low-eos-pneumonia-risk');
      expect(ids).toContain('asthma-saba-overuse');
      expect(ids).toContain('thyroid-propranolol-bronchospasm');
      expect(ids).toContain('lipid-severe-tg-pancreatitis');
      const simvaAlert = guardrails.find(g => g.id === 'lipid-amlodipine-simvastatin-interaction');
      expect(simvaAlert?.removeMedId).toBe('simvastatin');
      expect(simvaAlert?.sourceEngine).toBe('lipids');
    });

    it('backfills DEFAULT_PATIENT fields when loading a legacy partial draft', () => {
      const storage = new Map<string, string>();
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => { storage.set(k, v); },
        removeItem: (k: string) => { storage.delete(k); },
        clear: () => { storage.clear(); }
      });
      try {
        const store = usePatientStore.getState();
        const legacyDraft = {
          id: 'draft_legacy_1',
          timestamp: 1700000000000,
          patient: { name: 'Legacy Patient', age: 61, egfr: 55 }
        };
        localStorage.setItem('osrawy_patient_drafts', JSON.stringify([legacyDraft]));
        expect(store.loadDraft('draft_legacy_1')).toBe(true);
        const loadedPt = usePatientStore.getState().patient;
        expect(loadedPt.name).toBe('Legacy Patient');
        expect(loadedPt.scr).toBe(DEFAULT_PATIENT.scr);
        expect(loadedPt.scrUnit).toBe(DEFAULT_PATIENT.scrUnit);
        expect(loadedPt.frail).toBe(DEFAULT_PATIENT.frail);
        expect(loadedPt.copdEosinophils).toBe(DEFAULT_PATIENT.copdEosinophils);
        store.deleteDraft('draft_legacy_1');
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('reconciles legacy alias keys in loadDraft and loadStoredPatient without phantom DEFAULT_PATIENT metformin', async () => {
      const storage = new Map<string, string>();
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => { storage.set(k, v); },
        removeItem: (k: string) => { storage.delete(k); },
        clear: () => { storage.clear(); }
      });
      try {
        const legacyV1Patient = {
          name: 'Legacy V1',
          age: 60,
          sex: 'm',
          egfr: 25,
          totalCholesterol: 310,
          hdlC: 35,
          dm: false,
          medications: ['simvastatin', 'amlodipine']
        };

        // Direct helper bidirectional check
        const revNorm = normalizeLegacyPatientRecord({
          activeMeds: ['ramipril'],
          tc: 240,
          hdl: 50,
          diabetes: false
        });
        expect(revNorm.medications).toEqual(['ramipril']);
        expect(revNorm.totalCholesterol).toBe(240);
        expect(revNorm.hdlC).toBe(50);
        expect(revNorm.dm).toBe(false);

        // 1. loadDraft check
        const store = usePatientStore.getState();
        localStorage.setItem(
          'osrawy_patient_drafts',
          JSON.stringify([{ id: 'draft_legacy_v1', timestamp: 1700000001000, patient: legacyV1Patient }])
        );
        expect(store.loadDraft('draft_legacy_v1')).toBe(true);
        const stateAfterDraft = usePatientStore.getState();
        expect(stateAfterDraft.patient.activeMeds).toEqual(['simvastatin', 'amlodipine']);
        expect(stateAfterDraft.patient.medications).toEqual(['simvastatin', 'amlodipine']);
        expect(stateAfterDraft.patient.tc).toBe(310);
        expect(stateAfterDraft.patient.totalCholesterol).toBe(310);
        expect(stateAfterDraft.patient.hdl).toBe(35);
        expect(stateAfterDraft.patient.hdlC).toBe(35);
        expect(stateAfterDraft.patient.diabetes).toBe(false);
        expect(stateAfterDraft.patient.dm).toBe(false);
        expect(stateAfterDraft.guardrails.some(g => g.id === 'lipid-amlodipine-simvastatin-interaction')).toBe(true);
        expect(stateAfterDraft.guardrails.some(g => g.id === 'guardrail-metformin-crit')).toBe(false);

        const rxReport = buildPrescriptionReport('en', stateAfterDraft.patient);
        expect(rxReport).toContain('Simvastatin');
        expect(rxReport).toContain('Amlodipine');
        expect(rxReport).not.toContain('Metformin');

        // 2. loadStoredPatient check via fresh store module load
        localStorage.setItem('osrawy_active_patient', JSON.stringify(legacyV1Patient));
        vi.resetModules();
        const freshModule = await import('../src/store/usePatientStore');
        const hydrated = freshModule.usePatientStore.getState();
        expect(hydrated.patient.activeMeds).toEqual(['simvastatin', 'amlodipine']);
        expect(hydrated.patient.medications).toEqual(['simvastatin', 'amlodipine']);
        expect(hydrated.patient.tc).toBe(310);
        expect(hydrated.patient.totalCholesterol).toBe(310);
        expect(hydrated.patient.hdl).toBe(35);
        expect(hydrated.patient.hdlC).toBe(35);
        expect(hydrated.patient.diabetes).toBe(false);
        expect(hydrated.patient.dm).toBe(false);
        expect(hydrated.guardrails.some(g => g.id === 'lipid-amlodipine-simvastatin-interaction')).toBe(true);
        expect(hydrated.guardrails.some(g => g.id === 'guardrail-metformin-crit')).toBe(false);
      } finally {
        vi.unstubAllGlobals();
        vi.resetModules();
      }
    });

    it('syncs activeMeds: [] over stale medications, mirrors legacy alias updates in setField/updatePatient, and guards non-array draft storage', () => {
      const storage = new Map<string, string>();
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => { storage.set(k, v); },
        removeItem: (k: string) => { storage.delete(k); },
        clear: () => { storage.clear(); }
      });
      try {
        const norm = normalizeLegacyPatientRecord({
          activeMeds: [],
          medications: ['ramipril']
        });
        expect(norm.activeMeds).toEqual([]);
        expect(norm.medications).toEqual([]);

        const store = usePatientStore.getState();
        localStorage.setItem(
          'osrawy_patient_drafts',
          JSON.stringify([{
            id: 'draft_empty_over_stale',
            timestamp: 1700000002000,
            patient: { name: 'Empty Meds', pregnancy: false, activeMeds: [], medications: ['ramipril'] }
          }])
        );
        expect(store.loadDraft('draft_empty_over_stale')).toBe(true);
        const loaded = usePatientStore.getState().patient;
        expect(loaded.activeMeds).toEqual([]);
        expect(loaded.medications).toEqual([]);
        expect(
          evaluatePregnancyHtnProtocol(loaded).alerts.some((a: any) => a.id === 'htn-preg-teratogenic-stop')
        ).toBe(false);

        // Mirror totalCholesterol, hdlC, dm in setField & updatePatient
        store.setField('totalCholesterol', 310);
        store.setField('hdlC', 35);
        store.setField('dm', false);
        let current = usePatientStore.getState().patient;
        expect(current.tc).toBe(310);
        expect(current.totalCholesterol).toBe(310);
        expect(current.hdl).toBe(35);
        expect(current.hdlC).toBe(35);
        expect(current.diabetes).toBe(false);
        expect(current.dm).toBe(false);

        store.updatePatient({ totalCholesterol: 280, hdlC: 38, dm: true });
        current = usePatientStore.getState().patient;
        expect(current.tc).toBe(280);
        expect(current.totalCholesterol).toBe(280);
        expect(current.hdl).toBe(38);
        expect(current.hdlC).toBe(38);
        expect(current.diabetes).toBe(true);
        expect(current.dm).toBe(true);

        // Malformed non-array draft storage resilience
        for (const bad of ['null', '123', '""', '{}', '{bad']) {
          localStorage.setItem('osrawy_patient_drafts', bad);
          expect(store.getDrafts()).toEqual([]);
          expect(store.loadDraft('missing')).toBe(false);
          expect(() => store.deleteDraft('missing')).not.toThrow();
          const savedId = store.saveDraft('Recovered Draft');
          expect(Array.isArray(store.getDrafts())).toBe(true);
          expect(store.getDrafts().some(d => d.id === savedId)).toBe(true);
        }
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('useAppStore & Android Back Button Stack', () => {
    it('initializes with cockpit default and sub-tab defaults', async () => {
      vi.resetModules();
      const freshApp = await import('../src/store/useAppStore');
      const state = freshApp.useAppStore.getState();
      expect(state.activeTab).toBe('cockpit');
      expect(state.crmSubTab).toBe('dm');
      expect(state.pcSubTab).toBe('asthma');
      expect(state.toolsSubTab).toBe('kdigo');
    });

    it('manages overlay stack with deduplicated push and single pop', () => {
      const store = useAppStore.getState();
      store.pushOverlay('modal-settings');
      store.pushOverlay('modal-settings'); // duplicate ignored
      store.pushOverlay('sheet-vitals');
      expect(useAppStore.getState().overlayStack).toEqual(['modal-settings', 'sheet-vitals']);

      const popped = store.popOverlay();
      expect(popped).toBe(true);
      expect(useAppStore.getState().overlayStack).toEqual(['modal-settings']);

      expect(store.popOverlay()).toBe(true);
      expect(useAppStore.getState().overlayStack).toEqual([]);
      expect(store.popOverlay()).toBe(false);
    });

    it('supports navigateTo deep-linking and legacy dm/htn/dlp aliases for M3 compatibility', () => {
      const store = useAppStore.getState();

      store.navigateTo('crm', 'htn');
      expect(useAppStore.getState().activeTab).toBe('crm');
      expect(useAppStore.getState().crmSubTab).toBe('htn');
      expect(useAppStore.getState().previousTab).toBe('cockpit');

      store.navigateTo('pc', 'thyroid');
      expect(useAppStore.getState().activeTab).toBe('pc');
      expect(useAppStore.getState().pcSubTab).toBe('thyroid');
      expect(useAppStore.getState().previousTab).toBe('crm');

      store.navigateTo('tools', 'egfr');
      expect(useAppStore.getState().activeTab).toBe('tools');
      expect(useAppStore.getState().toolsSubTab).toBe('egfr');

      // Legacy M3 compatibility (e.g., DrugDirectoryScreen calling setActiveTab('dm' | 'htn' | 'dlp'))
      store.setActiveTab('dlp');
      expect(useAppStore.getState().activeTab).toBe('crm');
      expect(useAppStore.getState().crmSubTab).toBe('dlp');
    });

    it('handles Android back press in priority order (overlay -> previous tab -> cockpit -> minimize)', () => {
      const store = useAppStore.getState();

      // Step 1: Open an overlay
      store.pushOverlay('soap-sheet');
      expect(store.handleAndroidBack()).toBe(true);
      expect(useAppStore.getState().overlayStack.length).toBe(0);

      // Step 2: In 'drugs' directory tab, back returns to previous tab ('pc')
      store.navigateTo('pc', 'copd');
      store.setActiveTab('drugs');
      expect(store.handleAndroidBack()).toBe(true);
      expect(useAppStore.getState().activeTab).toBe('pc');

      // Step 3: On 'pc' tab, back returns to home 'cockpit' tab
      expect(store.handleAndroidBack()).toBe(true);
      expect(useAppStore.getState().activeTab).toBe('cockpit');

      // Step 4: On home 'cockpit' tab with no overlays, back returns false (allowing native minimize)
      expect(store.handleAndroidBack()).toBe(false);
    });

    it('persists market, lang, theme, and palette changes', () => {
      const store = useAppStore.getState();
      expect(store.palette).toBe('sapphire');

      store.setMarket('eg');
      expect(useAppStore.getState().market).toBe('eg');

      store.setLang('en');
      expect(useAppStore.getState().lang).toBe('en');

      store.setTheme('dark');
      expect(useAppStore.getState().theme).toBe('dark');

      store.setPalette('teal');
      expect(useAppStore.getState().palette).toBe('teal');

      store.setPalette('navy');
      expect(useAppStore.getState().palette).toBe('navy');
    });
  });
});
