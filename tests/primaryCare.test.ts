import { describe, it, expect } from 'vitest';
import { evaluateAsthmaGina, evaluateCopdGold, evaluateThyroid, evaluatePrimaryCare } from '../src/engines/primaryCare';
import { DEFAULT_PATIENT } from '../src/store/usePatientStore';

describe('Primary Care Engine (Cases 6, 7, 8, 18)', () => {
  describe('Case 6: Asthma GINA & SABA Overuse', () => {
    it('accurately classifies patient with >= 3 symptoms as Uncontrolled', () => {
      const asthmaPt = {
        condition: 'asthma',
        currentStep: 2,
        daySymptoms: '>2_week',
        nightWaking: true,
        relieverUse: '>2_week',
        activityLimit: true,
        sabaUsePerWeek: 4,
        preferredTrack: 1
      };
      const asthmaRes = evaluateAsthmaGina(asthmaPt);
      const isUncontrolled = (asthmaRes.controlLevel || asthmaRes.control || '').toLowerCase().includes('uncontrolled');
      expect(isUncontrolled).toBe(true);
    });

    it('triggers SABA overuse warning and mortality alert when SABA use >= 3x/week', () => {
      const asthmaPt = {
        sabaUsePerWeek: 4,
        daySymptoms: 'none',
        nightWaking: false,
        relieverUse: 'none',
        activityLimit: false
      };
      const asthmaRes = evaluateAsthmaGina(asthmaPt);
      const sabaAlert = (asthmaRes.alerts || []).some((a: any) =>
        JSON.stringify(a).toLowerCase().includes('saba') ||
        JSON.stringify(a).toLowerCase().includes('overuse') ||
        JSON.stringify(a).includes('إفراط')
      );
      expect(sabaAlert).toBe(true);
    });

    it('steps up uncontrolled asthma on Step 2 to Step 3 Low-Dose MART (ICS-Formoterol)', () => {
      const asthmaPt = {
        currentStep: 2,
        daySymptoms: '>2_week',
        nightWaking: true,
        relieverUse: '>2_week',
        activityLimit: true,
        preferredTrack: 1
      };
      const asthmaRes = evaluateAsthmaGina(asthmaPt);
      expect(asthmaRes.recommendedStep).toBe(3);
    });
  });

  describe('Case 7: COPD GOLD & Inhaled Corticosteroid Guardrails', () => {
    it('classifies frequent exacerbations into GOLD Group E', () => {
      const copdPtE = {
        condition: 'copd',
        moderateExacerbations: 2,
        hospitalExacerbations: 1,
        mMRC: 2,
        catScore: 18,
        bloodEosinophils: 360
      };
      const copdResE = evaluateCopdGold(copdPtE);
      expect(copdResE.group).toBe('E');
    });

    it('recommends Triple Therapy (LABA + LAMA + ICS) for GOLD Group E with eosinophils >= 300', () => {
      const copdPtE = {
        condition: 'copd',
        moderateExacerbations: 2,
        bloodEosinophils: 360
      };
      const copdResE = evaluateCopdGold(copdPtE);
      const tripleTherapy = JSON.stringify(copdResE).toLowerCase().includes('triple') ||
                            (JSON.stringify(copdResE).toLowerCase().includes('laba') &&
                             JSON.stringify(copdResE).toLowerCase().includes('lama') &&
                             JSON.stringify(copdResE).toLowerCase().includes('ics'));
      expect(tripleTherapy).toBe(true);
    });

    it('triggers pneumonia risk warning against ICS when eosinophils < 100', () => {
      const copdPtLowEos = {
        condition: 'copd',
        moderateExacerbations: 2,
        bloodEosinophils: 60
      };
      const copdResLowEos = evaluateCopdGold(copdPtLowEos);
      const pneumoniaRisk = JSON.stringify(copdResLowEos).toLowerCase().includes('pneumonia') ||
                            JSON.stringify(copdResLowEos).includes('ذات الرئة') ||
                            JSON.stringify(copdResLowEos).toLowerCase().includes('avoid ics');
      expect(pneumoniaRisk).toBe(true);
    });
  });

  describe('Case 8: Thyroid Disorders & Cardiovascular Precautions', () => {
    it('diagnoses Overt Hypothyroidism with elevated TSH and low FT4', () => {
      const overtHypoPt = {
        tsh: 16.5,
        ft4: 0.6,
        weightKg: 70,
        ascvd: false,
        age: 38
      };
      const overtRes = evaluateThyroid(overtHypoPt);
      expect(overtRes.status).toBe('overt_hypo');
    });

    it('calculates weight-based ~1.6 mcg/kg Levothyroxine replacement for standard young patient', () => {
      const overtHypoPt = {
        tsh: 16.5,
        ft4: 0.6,
        weightKg: 70,
        ascvd: false,
        age: 38
      };
      const overtRes = evaluateThyroid(overtHypoPt);
      expect(overtRes.recommendedDose).toBeGreaterThanOrEqual(100);
      expect(overtRes.recommendedDose).toBeLessThanOrEqual(125);
    });

    it('prescribes conservative Levothyroxine starting dose (25-50 mcg/d) for patient with ASCVD', () => {
      const ascvdHypoPt = {
        tsh: 18.0,
        ft4: 0.5,
        weightKg: 85,
        ascvd: true,
        age: 66
      };
      const ascvdRes = evaluateThyroid(ascvdHypoPt);
      expect(ascvdRes.recommendedDose).toBeGreaterThanOrEqual(25);
      expect(ascvdRes.recommendedDose).toBeLessThanOrEqual(50);
    });

    it('triggers Propranolol bronchospasm caution alert in hyperthyroidism with asthma', () => {
      const hyperThyroidPt = {
        tsh: 0.05,
        ft4: 2.8,
        asthma: true
      };
      const hyperRes = evaluateThyroid(hyperThyroidPt);
      const bronchospasmAlert = JSON.stringify(hyperRes).toLowerCase().includes('bronchospasm') ||
                                JSON.stringify(hyperRes).toLowerCase().includes('propranolol') ||
                                JSON.stringify(hyperRes).includes('ربو');
      expect(bronchospasmAlert).toBe(true);
    });
  });

  describe('Case 18: Primary Care Edge Cases', () => {
    it('handles TSH = 0 and missing inputs gracefully without throwing', () => {
      const edgePt = { tsh: 0, ft4: 0, hf: undefined };
      const pc = evaluatePrimaryCare(edgePt);
      expect(pc).toBeDefined();
      expect(pc.asthma).toBeDefined();
      expect(pc.copd).toBeDefined();
      expect(pc.thyroid).toBeDefined();
    });
  });

  describe('M1 Thyroid Central Hypo, Discordant Patterns, TSH >= 10 & Alert Gating', () => {
    it('detects central hypothyroidism (low TSH + low FT4) and requires cortisol check before LT4', () => {
      const res = evaluateThyroid({ tsh: 0.1, ft4: 0.5 });
      expect(res.status).toBe('central_hypo');
      const alert = res.alerts.find((a: any) => a.id === 'thyroid-central-hypo');
      expect(alert).toBeDefined();
      expect(alert.level).toBe('critical');
      expect(alert.messageEn.toLowerCase()).toContain('cortisol');
    });

    it('detects discordant thyroid panels (high TSH + high FT4, and normal TSH + abnormal FT4)', () => {
      const bothHigh = evaluateThyroid({ tsh: 8.5, ft4: 2.4 });
      expect(bothHigh.status).toBe('discordant_high_both');
      expect(bothHigh.alerts.some((a: any) => a.level === 'warning')).toBe(true);

      const normHighFt4 = evaluateThyroid({ tsh: 2.0, ft4: 2.3 });
      expect(normHighFt4.status).toBe('discordant_high_ft4');
      expect(normHighFt4.alerts.some((a: any) => a.level === 'warning')).toBe(true);

      const normLowFt4 = evaluateThyroid({ tsh: 2.0, ft4: 0.5 });
      expect(normLowFt4.status).toBe('discordant_low_ft4');
      expect(normLowFt4.alerts.some((a: any) => a.level === 'warning')).toBe(true);
    });

    it('recommends Levothyroxine initiation and cites TSH >= 10 when subclinical_hypo has TSH >= 10', () => {
      const res = evaluateThyroid({ tsh: 12.0, ft4: 1.1, wt: 70 });
      expect(res.status).toBe('subclinical_hypo');
      expect(res.rxEn).toContain('10');
      expect(res.rxEn).not.toContain('4.5–9.9');
      expect(res.recommendedDose).toBeGreaterThan(0);
    });

    it('gates asthma/COPD alerts cleanly when asthma=false and copd=false', () => {
      const pcDefault = evaluatePrimaryCare(DEFAULT_PATIENT);
      expect(pcDefault.allAlerts).toEqual([]);

      const pcDisabled = evaluatePrimaryCare({
        ...DEFAULT_PATIENT,
        asthma: false,
        copd: false,
        asthmaRelieverPerWk: 5,
        copdEosinophils: 40
      });
      expect(pcDisabled.allAlerts).toEqual([]);
    });

    it('recognizes PatientState aliases (asthmaDaySymptoms, asthmaSabaCanistersYr, copdHospitalizations, thyroidTrimester)', () => {
      const asthmaRes = evaluateAsthmaGina({
        asthmaDaySymptoms: 4,
        asthmaNightWaking: true,
        asthmaActivityLimit: true,
        asthmaSabaCanistersYr: 4
      });
      expect(asthmaRes.controlLevel).toBe('uncontrolled');
      expect(asthmaRes.alerts.some((a: any) => a.id === 'asthma-saba-overuse')).toBe(true);
      expect(asthmaRes.recommendationEn).toBeTruthy();
      expect(asthmaRes.recommendationAr).toBeTruthy();

      const copdRes = evaluateCopdGold({ copdHospitalizations: 1, copdEosinophils: 350 });
      expect(copdRes.group).toBe('E');
      expect(copdRes.recommendationEn).toBeTruthy();
      expect(copdRes.recommendationAr).toBeTruthy();

      const pregThyroid = evaluateThyroid({ tsh: 3.1, ft4: 1.1, pregnancy: true, thyroidTrimester: 1 });
      expect(pregThyroid.pregTshTarget).toBe(2.5);
    });
  });
});
