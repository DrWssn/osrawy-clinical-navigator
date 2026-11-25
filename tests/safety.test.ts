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

  describe('M1 Safety Precision Fixes', () => {
    it('does not trigger critical Metformin alert for diabetic with eGFR < 30 when not taking Metformin', () => {
      const ptNoMet = { diabetes: true, dm: true, egfr: 22, activeMeds: [] };
      const alerts = evaluateSafetyGuardrails(ptNoMet);
      expect(alerts.some(a => a.id === 'guardrail-metformin-crit')).toBe(false);
      expect(alerts.some(a => a.id === 'guardrail-metformin-avoid-info' && a.level === 'info')).toBe(true);
    });

    it('does not falsely match metoprolol as metformin or carbimazole as ARB', () => {
      const pt = { egfr: 22, diabetes: false, activeMeds: ['metoprolol', 'ramipril', 'carbimazole'] };
      const alerts = evaluateSafetyGuardrails(pt);
      expect(alerts.some(a => a.id === 'guardrail-metformin-crit')).toBe(false);
      expect(alerts.some(a => a.id === 'guardrail-dual-raas')).toBe(false);
    });

    it('respects explicit empty activeMeds: [] over stale medications array', () => {
      const pt = { egfr: 22, diabetes: false, activeMeds: [], medications: ['metformin'] };
      const alerts = evaluateSafetyGuardrails(pt);
      expect(alerts.some(a => a.id === 'guardrail-metformin-crit')).toBe(false);
    });

    it('populates removeMedId and msgEn/msgAr/severity/sourceEngine on critical Metformin alert', () => {
      const alerts = evaluateSafetyGuardrails({ egfr: 20, activeMeds: ['metformin'] });
      const metAlert = alerts.find(a => a.id === 'guardrail-metformin-crit');
      expect(metAlert?.removeMedId).toBe('metformin');
      expect(metAlert?.severity).toBe('critical');
      expect(metAlert?.msgEn).toBeTruthy();
      expect(metAlert?.msgAr).toBeTruthy();
      expect(metAlert?.sourceEngine).toBe('diabetes');
    });

    it('preserves explicit uacr: 0 in SGLT2i organ-protection message instead of defaulting to 30', () => {
      const alerts = evaluateSafetyGuardrails({ egfr: 45, uacr: 0, activeMeds: [] });
      const sglt2 = alerts.find(a => a.id === 'guardrail-sglt2-organ-protect');
      expect(sglt2?.messageEn).toContain('UACR 0 mg/g');
    });

    it('treats explicit egfr: 0 as severe renal impairment (triggers critical Metformin alert) while omitted egfr falls back safely to 90', () => {
      const zeroEgfrAlerts = evaluateSafetyGuardrails({ egfr: 0, activeMeds: ['metformin'] });
      expect(zeroEgfrAlerts.some(a => a.id === 'guardrail-metformin-crit')).toBe(true);

      const omittedEgfrAlerts = evaluateSafetyGuardrails({ activeMeds: ['metformin'] });
      expect(omittedEgfrAlerts.some(a => a.id === 'guardrail-metformin-crit')).toBe(false);
    });

    it('detects duplicate pure ARB + ARNI without self-flagging standalone sacubitril_valsartan', () => {
      const dupAlerts = evaluateSafetyGuardrails({ activeMeds: ['valsartan', 'sacubitril_valsartan'] });
      const dupAlert = dupAlerts.find(a => a.id === 'guardrail-arb-arni-dup-crit');
      expect(dupAlert).toBeDefined();
      expect(dupAlert?.level).toBe('critical');
      expect(dupAlert?.titleAr).toContain('ARNI');
      expect(dupAlerts.some(a => a.id === 'guardrail-dual-raas')).toBe(false);

      const irbesartanEntrestoAlerts = evaluateSafetyGuardrails({ activeMeds: ['irbesartan', 'entresto'] });
      expect(irbesartanEntrestoAlerts.some(a => a.id === 'guardrail-arb-arni-dup-crit')).toBe(true);

      const standaloneArniAlerts = evaluateSafetyGuardrails({ activeMeds: ['sacubitril_valsartan'] });
      expect(standaloneArniAlerts.some(a => a.id === 'guardrail-arb-arni-dup-crit')).toBe(false);
      expect(standaloneArniAlerts.some(a => a.id === 'guardrail-dual-raas')).toBe(false);

      const aceArniAlerts = evaluateSafetyGuardrails({ activeMeds: ['ramipril', 'sacubitril_valsartan'] });
      expect(aceArniAlerts.some(a => a.id === 'guardrail-dual-raas')).toBe(true);
      expect(aceArniAlerts.some(a => a.id === 'guardrail-arb-arni-dup-crit')).toBe(false);

      const aceIrbesartanAlerts = evaluateSafetyGuardrails({ activeMeds: ['ramipril', 'irbesartan'] });
      expect(aceIrbesartanAlerts.some(a => a.id === 'guardrail-dual-raas')).toBe(true);
    });
  });
});
