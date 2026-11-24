import { describe, it, expect, beforeEach } from 'vitest';
import { usePatientStore } from '../src/store/usePatientStore';
import { useAppStore } from '../src/store/useAppStore';

describe('Zustand Stores & Android Back Stack (Step 3)', () => {
  beforeEach(() => {
    usePatientStore.getState().resetPatient();
    useAppStore.getState().closeAllOverlays();
    useAppStore.getState().setActiveTab('dm');
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
  });

  describe('useAppStore & Android Back Button Stack', () => {
    it('manages overlay stack with push and pop', () => {
      const store = useAppStore.getState();
      store.pushOverlay('modal-settings');
      store.pushOverlay('sheet-vitals');
      expect(useAppStore.getState().overlayStack).toEqual(['modal-settings', 'sheet-vitals']);

      const popped = store.popOverlay();
      expect(popped).toBe(true);
      expect(useAppStore.getState().overlayStack).toEqual(['modal-settings']);
    });

    it('handles Android back press in priority order (overlay -> previous tab -> home -> minimize)', () => {
      const store = useAppStore.getState();
      
      // Step 1: Open an overlay
      store.pushOverlay('soap-sheet');
      expect(store.handleAndroidBack()).toBe(true);
      expect(useAppStore.getState().overlayStack.length).toBe(0);

      // Step 2: In 'drugs' directory tab, back returns to previous tab
      store.setActiveTab('htn');
      store.setActiveTab('drugs');
      expect(store.handleAndroidBack()).toBe(true);
      expect(useAppStore.getState().activeTab).toBe('htn');

      // Step 3: On 'htn' tab, back returns to home 'dm' tab
      expect(store.handleAndroidBack()).toBe(true);
      expect(useAppStore.getState().activeTab).toBe('dm');

      // Step 4: On home 'dm' tab with no overlays, back returns false (allowing native minimize)
      expect(store.handleAndroidBack()).toBe(false);
    });

    it('persists market, lang, and theme changes', () => {
      const store = useAppStore.getState();
      store.setMarket('eg');
      expect(useAppStore.getState().market).toBe('eg');

      store.setLang('en');
      expect(useAppStore.getState().lang).toBe('en');

      store.setTheme('dark');
      expect(useAppStore.getState().theme).toBe('dark');
    });
  });
});
