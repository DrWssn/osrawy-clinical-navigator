import { describe, it, expect } from 'vitest';
import { evaluateKdigoMatrix, calculateFib4, evaluateDoacDosing, buildEmrNote } from '../src/engines/tools';
import { calculateSteroidEquivalence } from '../src/engines/calculators';

describe('Clinical Tools Engine (Cases 11, 12, 13, 17)', () => {
  describe('Case 11: KDIGO Heat-Map Matrix', () => {
    it('accurately classifies eGFR 38 + UACR 350 as G3bA3 Very High Risk', () => {
      const kdigo = evaluateKdigoMatrix(38, 350);
      expect(kdigo.stage).toBe('G3bA3');
      expect(kdigo.riskTier).toBe('VERY_HIGH');
      expect(kdigo.color).toBe('red');
      expect(kdigo.referral).toBe(true);
    });

    it('accurately classifies eGFR 75 + UACR 15 as G2A1 Low Risk', () => {
      const kdigo = evaluateKdigoMatrix(75, 15);
      expect(kdigo.stage).toBe('G2A1');
      expect(kdigo.riskTier).toBe('LOW');
      expect(kdigo.color).toBe('green');
      expect(kdigo.referral).toBe(false);
    });
  });

  describe('Case 12: FIB-4 Liver Fibrosis Screening', () => {
    it('identifies High Risk advanced fibrosis when FIB-4 > 2.67', () => {
      // Age 52, AST 65, ALT 50, Plt 110 -> (52 * 65) / (110 * sqrt(50)) = 3380 / 777.8 = 4.35
      const fib = calculateFib4(52, 65, 50, 110);
      expect(fib.score).toBeGreaterThan(2.67);
      expect(fib.riskTier).toBe('HIGH');
      expect(fib.referral).toBe(true);
    });

    it('identifies Low Risk when FIB-4 < 1.30 for age < 65', () => {
      // Age 40, AST 20, ALT 25, Plt 250 -> (40 * 20) / (250 * 5) = 800 / 1250 = 0.64
      const fib = calculateFib4(40, 20, 25, 250);
      expect(fib.score).toBeLessThan(1.30);
      expect(fib.riskTier).toBe('LOW');
      expect(fib.referral).toBe(false);
    });

    it('handles platelet count in /µL (e.g. 250,000) by converting to 10^9/L', () => {
      const fib1 = calculateFib4(40, 20, 25, 250);
      const fib2 = calculateFib4(40, 20, 25, 250000);
      expect(fib1.score).toBe(fib2.score);
    });
  });

  describe('Case 13: DOAC Dosing & 2-of-3 ABC Criteria', () => {
    it('reduces Apixaban to 2.5 mg PO BID when patient meets 2 of 3 criteria (Age >= 80, Wt <= 60, Cr >= 1.5)', () => {
      const ptABC = {
        age: 82,
        weightKg: 56,
        creatinineMgDl: 1.6,
        sex: 'f'
      };
      const doac = evaluateDoacDosing(ptABC);
      expect(doac.apixaban.reducedDose).toBe(true);
      expect(doac.apixaban.dose).toBe('2.5 mg PO BID');
      expect(doac.apixaban.criteriaCount).toBe(3);
    });

    it('prescribes standard Apixaban 5 mg PO BID when fewer than 2 criteria met', () => {
      const ptStd = {
        age: 62,
        weightKg: 75,
        creatinineMgDl: 1.0,
        sex: 'm'
      };
      const doac = evaluateDoacDosing(ptStd);
      expect(doac.apixaban.reducedDose).toBe(false);
      expect(doac.apixaban.dose).toBe('5 mg PO BID');
    });

    it('flags Apixaban and Rivaroxaban as contraindicated when CrCl < 15', () => {
      const ptEsrd = {
        age: 75,
        weightKg: 70,
        creatinineMgDl: 5.5,
        sex: 'm'
      };
      const doac = evaluateDoacDosing(ptEsrd);
      expect(doac.apixaban.contraindicated).toBe(true);
      expect(doac.rivaroxaban.contraindicated).toBe(true);
    });

    it('reduces Rivaroxaban to 15 mg daily with food when CrCl is 15-49 mL/min', () => {
      const ptRenal = {
        age: 72,
        weightKg: 65,
        creatinineMgDl: 1.8,
        sex: 'm'
      };
      const doac = evaluateDoacDosing(ptRenal);
      expect(doac.rivaroxaban.reducedDose).toBe(true);
      expect(doac.rivaroxaban.dose).toContain('15 mg');
      expect(doac.rivaroxaban.frequency).toContain('with food');
    });

    it('converts serum creatinine from µmol/L accurately (133 µmol/L = 1.5 mg/dL)', () => {
      const ptUmol = {
        age: 82,
        weightKg: 58,
        creatinineMgDl: 133,
        scrUnit: 'umol',
        sex: 'f'
      };
      const doac = evaluateDoacDosing(ptUmol);
      expect(doac.apixaban.reducedDose).toBe(true);
      expect(doac.apixaban.criteria.scrGte1_5).toBe(true);
    });
  });

  describe('Case 17: Steroid Equivalence & EMR Note Builders', () => {
    it('calculates steroid equivalence accurately (Prednisone 20mg = Dexamethasone 3mg)', () => {
      const eq = calculateSteroidEquivalence(20, 'prednisone');
      expect(eq.dexamethasone).toBe(3);
      expect(eq.hydrocortisone).toBe(80);
      expect(eq.methylprednisolone).toBe(16);
    });

    it('builds structured EMR note without UI or screen clutter', () => {
      const patient = { name: 'Ahmed', age: 52, sex: 'm', egfr: 68, sbp: 148, dbp: 94, k: 4.6, a1c: 8.9 };
      const note = buildEmrNote('diabetes', patient, { recommendation: 'Metformin 1000mg BID + SGLT2i' });
      expect(note).toContain('[Diabetes Management]');
      expect(note).toContain('HbA1c: 8.9%');
      expect(note).toContain('Plan: Metformin 1000mg BID + SGLT2i');
    });
  });
});
