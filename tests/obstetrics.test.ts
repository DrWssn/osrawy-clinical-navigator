import { describe, it, expect } from 'vitest';
import { evaluatePregnancyHtnProtocol } from '../src/engines/htn';
import { evaluatePregnancyDmProtocol } from '../src/engines/diabetes';

describe('Obstetric Medicine & Pregnancy Protocols (Cases 15 & 16)', () => {
  describe('Case 15: Pregnant Patient with Hypertension & Asthma', () => {
    const obHtn = evaluatePregnancyHtnProtocol({
      sbp: 164,
      dbp: 112,
      gestationalWeeks: 16,
      comorbidities: { pregnancy: true, asthma: true },
      medications: ['valsartan', 'indapamide']
    });

    it('triggers OBSTETRIC_HYPERTENSIVE_EMERGENCY alert for severe HTN (164/112)', () => {
      const emergencyAlert = obHtn.alerts && obHtn.alerts.some((a: any) =>
        a.code === 'OBSTETRIC_HYPERTENSIVE_EMERGENCY' || JSON.stringify(a).toLowerCase().includes('emergency')
      );
      expect(emergencyAlert).toBe(true);
    });

    it('triggers STOP_TERATOGENIC_HTN_MEDS alert for Valsartan and Indapamide', () => {
      const teratoStop = obHtn.alerts && obHtn.alerts.some((a: any) =>
        a.code === 'STOP_TERATOGENIC_HTN_MEDS' || JSON.stringify(a).toLowerCase().includes('teratogenic')
      );
      expect(teratoStop).toBe(true);
    });

    it('triggers PREECLAMPSIA_ASPIRIN_PROPHYLAXIS step at 16 weeks gestation', () => {
      const aspirinStep = obHtn.steps && obHtn.steps.some((s: any) =>
        s.code === 'PREECLAMPSIA_ASPIRIN_PROPHYLAXIS' || JSON.stringify(s).toLowerCase().includes('aspirin')
      );
      expect(aspirinStep).toBe(true);
    });

    it('pivots first-line therapy to Nifedipine ER when maternal asthma is present', () => {
      const nifedipineStep = obHtn.steps && obHtn.steps.some((s: any) =>
        s.code === 'PREGNANCY_HTN_STEP_1_NIFEDIPINE' || JSON.stringify(s).toLowerCase().includes('nifedipine')
      );
      expect(nifedipineStep).toBe(true);
      expect(obHtn.firstLine.drugId).toBe('nifedipine_er');
    });
  });

  describe('Case 16: Pregnant Patient with Diabetes in Trimester 3', () => {
    const obDm = evaluatePregnancyDmProtocol({
      weightKg: 80,
      trimester: 3,
      gestationalWeeks: 30,
      comorbidities: { pregnancy: true },
      medications: ['empagliflozin', 'semaglutide']
    });

    it('triggers STOP_NON_INSULIN_PREGNANCY_DRUGS alert for oral/GLP-1 agents', () => {
      const stopOral = obDm.alerts && obDm.alerts.some((a: any) =>
        a.code === 'STOP_NON_INSULIN_PREGNANCY_DRUGS' || JSON.stringify(a).toLowerCase().includes('stop')
      );
      expect(stopOral).toBe(true);
    });

    it('calculates 80 kg Trimester 3 TDD as 72 U/day (0.9 U/kg/day)', () => {
      expect(obDm.dosing.tddUnits).toBe(72);
    });

    it('calculates basal insulin as 36 U/day (50% of TDD)', () => {
      expect(obDm.dosing.basalUnits).toBe(36);
    });

    it('calculates meal bolus as 12 U before each of 3 meals', () => {
      expect(obDm.dosing.mealBolusUnits).toBe(12);
    });

    it('enforces obstetric glycemic fasting target <95 mg/dL', () => {
      expect(obDm.targets.fastingMgDl).toContain('<95');
    });
  });
});
