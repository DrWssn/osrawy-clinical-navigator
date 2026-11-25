import { describe, it, expect } from 'vitest';
import { calculateSwitch, classifyBp, evaluatePregnancyHtnProtocol } from '../src/engines/htn';

describe('Hypertension Engine (Switch Washout, BP Classification & Pregnancy)', () => {
  describe('calculateSwitch (Drug IDs & Class Keys)', () => {
    it('triggers mandatory 36h washout for ACEi drug IDs -> sacubitril_valsartan / ARNI', () => {
      const pairs: Array<[string, string]> = [
        ['perindopril', 'sacubitril_valsartan'],
        ['ramipril', 'arni'],
        ['lisinopril', 'sacubitril_valsartan'],
        ['enalapril', 'sacubitril_valsartan'],
        ['ace', 'arni'],
        ['sacubitril_valsartan', 'ramipril'],
      ];

      for (const [from, to] of pairs) {
        const res = calculateSwitch(from, to);
        expect(res.ok).toBe(true);
        expect(res.washoutHours).toBe(36);
        expect(res.requiresWashout).toBe(true);
        expect(res.noteEn).toContain('36');
        expect(res.noteAr).toContain('36');
        // Hybrid Array backward compatibility for HtnScreen.tsx .map()
        expect(Array.isArray(res)).toBe(true);
        expect(res.map(s => s).length).toBe(1);
      }
    });

    it('requires 0h washout for ARB -> ARNI and ACEi -> ARB switches', () => {
      const arbToArni = calculateSwitch('valsartan', 'sacubitril_valsartan');
      expect(arbToArni.ok).toBe(true);
      expect(arbToArni.washoutHours).toBe(0);

      const arbClass = calculateSwitch('arb', 'arni');
      expect(arbClass.ok).toBe(true);
      expect(arbClass.washoutHours).toBe(0);

      const aceToArb = calculateSwitch('perindopril', 'losartan');
      expect(aceToArb.ok).toBe(true);
      expect(aceToArb.washoutHours).toBe(0);
    });

    it('returns ok: false when switching to the same drug', () => {
      const same = calculateSwitch('perindopril', 'perindopril');
      expect(same.ok).toBe(false);
      expect(same.washoutHours).toBe(0);
    });
  });

  describe('classifyBp (Bilingual & Badge Color Class)', () => {
    it('returns bilingual labels and badge classes for ACC & ESC lenses', () => {
      const crisis = classifyBp(185, 110);
      expect(crisis.isSevere).toBe(true);
      expect(crisis.colorClass).toBe('badge-danger');
      expect(crisis.labelEn).toBe(crisis.label);
      expect(crisis.labelAr.length).toBeGreaterThan(0);

      const stage2 = classifyBp(145, 92, 'acc');
      expect(stage2.stage).toBe(2);
      expect(stage2.colorClass).toBe('badge-danger');

      const escElev = classifyBp(132, 82, 'esc');
      expect(escElev.stage).toBe(1);
      expect(escElev.colorClass).toBe('badge-warning');

      const normal = classifyBp(116, 72, 'acc');
      expect(normal.stage).toBe(0);
      expect(normal.colorClass).toBe('badge-success');
    });
  });

  describe('evaluatePregnancyHtnProtocol expanded teratogen matching', () => {
    it('detects perindopril and losartan as teratogens and provides Arabic stoppedDrugsAr', () => {
      const res = evaluatePregnancyHtnProtocol({
        pregnancy: false,
        medications: ['perindopril', 'losartan'],
      });
      expect(res.alerts.some((a: any) => a.code === 'STOP_TERATOGENIC_HTN_MEDS')).toBe(true);
      expect(Array.isArray(res.stoppedDrugsAr)).toBe(true);
      expect(res.stoppedDrugsAr.length).toBeGreaterThan(0);
    });

    it('prioritizes explicit empty activeMeds: [] over stale medications array', () => {
      const resEmpty = evaluatePregnancyHtnProtocol({
        pregnancy: false,
        activeMeds: [],
        medications: ['ramipril'],
      });
      expect(resEmpty.alerts.some((a: any) => a.id === 'htn-preg-teratogenic-stop')).toBe(false);

      const resActive = evaluatePregnancyHtnProtocol({
        pregnancy: false,
        activeMeds: ['ramipril'],
        medications: [],
      });
      expect(resActive.alerts.some((a: any) => a.id === 'htn-preg-teratogenic-stop')).toBe(true);
    });
  });
});
