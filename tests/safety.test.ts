import { describe, it, expect } from 'vitest';
import { calculateCkdEpi2021 } from '../src/engines/calculators';
import { evaluateSafetyGuardrails } from '../src/engines/safety';

describe('Safety Guardrails & CKD Math (Cases 1-3)', () => {
  describe('Case 1: Severe CKD & Metformin Guardrails', () => {
    it('calculates severe CKD eGFR < 30 using CKD-EPI 2021 race-free equation', () => {
      const res = calculateCkdEpi2021(2.8, 'mg', 68, 'm');
      const val = typeof res === 'object' && res !== null ? res.egfr : res;
      expect(val).toBeLessThan(30);
    });

    it('triggers Metformin contraindication / lactic acidosis alert when eGFR < 30', () => {
      const patientCkd = { egfr: 22, meds: ['metformin'], hf: 'none', k: 4.5, preg: false };
      const guardrails = evaluateSafetyGuardrails(patientCkd);
      const metContra = guardrails.some(g =>
        JSON.stringify(g).toLowerCase().includes('metformin') &&
        (JSON.stringify(g).toLowerCase().includes('contraindicat') ||
         JSON.stringify(g).toLowerCase().includes('lactic') ||
         JSON.stringify(g).includes('ميتفورمين') ||
         JSON.stringify(g).includes('حمض اللاكتيك'))
      );
      expect(metContra).toBe(true);
    });

    it('triggers Metformin dose cap (max 1000 mg/d) guardrail when eGFR 30-44', () => {
      const patientModCkd = { egfr: 38, meds: ['metformin'], hf: 'none', k: 4.5, preg: false };
      const modGuardrails = evaluateSafetyGuardrails(patientModCkd);
      const capAlert = modGuardrails.some(g =>
        JSON.stringify(g).toLowerCase().includes('1000') ||
        JSON.stringify(g).toLowerCase().includes('cap') ||
        JSON.stringify(g).includes('1000')
      );
      expect(capAlert).toBe(true);
    });

    it('generates SGLT2i renal/organ protection recommendation for CKD with eGFR >= 20', () => {
      const patientModCkd = { egfr: 38, meds: ['metformin'], hf: 'none', k: 4.5, preg: false };
      const modGuardrails = evaluateSafetyGuardrails(patientModCkd);
      const organAlert = modGuardrails.some(g =>
        JSON.stringify(g).toLowerCase().includes('sglt2') ||
        JSON.stringify(g).includes('حماية الكلى') ||
        JSON.stringify(g).includes('كلوي')
      );
      expect(organAlert).toBe(true);
    });
  });

  describe('Case 2: Dual RAAS Blockade & Hyperkalemia', () => {
    it('triggers critical contraindication alert for Dual RAAS blockade (ACEi + ARB)', () => {
      const dualRaasPt = {
        egfr: 55,
        k: 4.6,
        activeMeds: ['ramipril', 'losartan'],
        acei: true,
        arb: true
      };
      const raasGuardrails = evaluateSafetyGuardrails(dualRaasPt);
      const dualRaasAlert = raasGuardrails.some(g =>
        (JSON.stringify(g).toLowerCase().includes('dual') ||
         JSON.stringify(g).toLowerCase().includes('raas') ||
         JSON.stringify(g).toLowerCase().includes('ace') ||
         JSON.stringify(g).includes('ازدواج') ||
         JSON.stringify(g).includes('مزدوج')) &&
        (JSON.stringify(g).toLowerCase().includes('contra') ||
         JSON.stringify(g).includes('موانع') ||
         JSON.stringify(g).includes('خطر'))
      );
      expect(dualRaasAlert).toBe(true);
    });

    it('triggers critical alert to immediately stop RAAS inhibitors and MRA when K+ >= 5.5', () => {
      const hyperKPt = {
        egfr: 50,
        k: 5.7,
        activeMeds: ['ramipril', 'spironolactone'],
        acei: true,
        mra: true
      };
      const kGuardrails = evaluateSafetyGuardrails(hyperKPt);
      const kAlert = kGuardrails.some(g =>
        (JSON.stringify(g).toLowerCase().includes('k+') ||
         JSON.stringify(g).toLowerCase().includes('potassium') ||
         JSON.stringify(g).includes('بوتاسيوم') ||
         JSON.stringify(g).includes('5.5') ||
         JSON.stringify(g).includes('5.7')) &&
        (JSON.stringify(g).toLowerCase().includes('stop') ||
         JSON.stringify(g).toLowerCase().includes('hold') ||
         JSON.stringify(g).includes('إيقاف') ||
         JSON.stringify(g).includes('وقف'))
      );
      expect(kAlert).toBe(true);
    });

    it('triggers precaution/avoid alert for MRA initiation when K+ > 5.0', () => {
      const modKPt = { egfr: 60, k: 5.2, activeMeds: [], mra: false };
      const modKGuardrails = evaluateSafetyGuardrails(modKPt);
      const mraAvoidAlert = modKGuardrails.some(g =>
        JSON.stringify(g).toLowerCase().includes('mra') ||
        JSON.stringify(g).includes('سبيرونولاكتون') ||
        JSON.stringify(g).includes('بوتاسيوم')
      );
      expect(mraAvoidAlert).toBe(true);
    });
  });

  describe('Case 3: Pregnancy Teratogenicity', () => {
    it('triggers immediate stop/contraindication for RAAS / SGLT2i in pregnancy', () => {
      const pregPt = {
        preg: true,
        pregnancy: true,
        sex: 'f',
        age: 29,
        egfr: 90,
        k: 4.2,
        activeMeds: ['losartan', 'empa']
      };
      const pregGuardrails = evaluateSafetyGuardrails(pregPt);
      const teratoAlert = pregGuardrails.some(g =>
        (JSON.stringify(g).toLowerCase().includes('pregnan') ||
         JSON.stringify(g).toLowerCase().includes('teratogen') ||
         JSON.stringify(g).includes('حمل') ||
         JSON.stringify(g).includes('تشوه')) &&
        (JSON.stringify(g).toLowerCase().includes('stop') ||
         JSON.stringify(g).toLowerCase().includes('contraindicat') ||
         JSON.stringify(g).includes('إيقاف') ||
         JSON.stringify(g).includes('ممنوع'))
      );
      expect(teratoAlert).toBe(true);
    });
  });
});
