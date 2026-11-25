import { describe, it, expect } from 'vitest';
import { evaluateScreening, evaluateGeneralDmPlan } from '../src/engines/diabetes';
import { getDynamicTargets, buildFollowUpSchedule, getTailoredSadmans } from '../src/engines/leaflets';

describe('Diabetes Screening/Plan & Leaflets Follow-up/SADMANS', () => {
  describe('evaluateScreening (Bilingual & Frail Target)', () => {
    it('preserves legacy keys while providing full EN/AR fields and KDIGO renal frequency', () => {
      const groups = evaluateScreening({ egfr: 25, uacr: 400, a1c: 8.2, frail: false });
      expect(groups.length).toBe(3);
      for (const grp of groups) {
        expect(grp.groupEn).toBe(grp.group);
        expect(grp.groupAr.length).toBeGreaterThan(0);
        for (const item of grp.items) {
          expect(item.id).toBeTruthy();
          expect(item.nameEn).toBe(item.test);
          expect(item.nameAr.length).toBeGreaterThan(0);
          expect(item.freqEn).toBe(item.frequency);
          expect(item.freqAr.length).toBeGreaterThan(0);
          expect(item.dueReasonEn).toBe(item.why);
          expect(item.dueReasonAr.length).toBeGreaterThan(0);
        }
      }
      const ckdItem = groups[1].items.find(i => i.id === 'screen-ckd');
      expect(ckdItem?.freqEn).toBe('Every 3 months');
      expect(ckdItem?.freqAr).toBe('كل 3 أشهر');
    });

    it('relaxes A1c goal for frail patients when targetA1c is not explicitly set', () => {
      const frailGroups = evaluateScreening({ egfr: 80, uacr: 10, a1c: 7.3, age: 50, frail: true });
      const a1cItem = frailGroups[0].items.find(i => i.id === 'screen-hba1c');
      expect(a1cItem?.freqEn).toContain('Every 6 months');
    });

    it('assigns every 3 months kidney cadence for explicit egfr: 0 and Yearly when omitted', () => {
      const zeroGroups = evaluateScreening({ egfr: 0 });
      const zeroCkd = zeroGroups[1].items.find(i => i.id === 'screen-ckd');
      expect(zeroCkd?.freqEn).toBe('Every 3 months');
      expect(zeroCkd?.freqAr).toBe('كل 3 أشهر');

      const omittedGroups = evaluateScreening({});
      const omittedCkd = omittedGroups[1].items.find(i => i.id === 'screen-ckd');
      expect(omittedCkd?.freqEn).toBe('Yearly');
    });
  });

  describe('evaluateGeneralDmPlan (Medication-Aware Plan)', () => {
    it('recommends SGLT2i start for CKD/ASCVD patient on Metformin only', () => {
      const plan = evaluateGeneralDmPlan({ egfr: 52, uacr: 80, ascvd: true, a1c: 7.8, activeMeds: ['metformin'] });
      expect(plan.some(i => i.drugId === 'metformin' && i.action === 'active')).toBe(true);
      expect(plan.some(i => i.drugId === 'empagliflozin' && i.action === 'start')).toBe(true);
    });

    it('caps Metformin at eGFR 38 and stops Metformin at eGFR 22', () => {
      const capPlan = evaluateGeneralDmPlan({ egfr: 38, activeMeds: ['metformin'] });
      expect(capPlan.some(i => i.drugId === 'metformin' && i.action === 'cap')).toBe(true);

      const stopPlan = evaluateGeneralDmPlan({ egfr: 22, activeMeds: ['metformin'] });
      expect(stopPlan.some(i => i.drugId === 'metformin' && i.action === 'stop')).toBe(true);
    });

    it('flags sulfonylurea hypoglycemia risk in frail patients and oral agent stop in pregnancy', () => {
      const frailPlan = evaluateGeneralDmPlan({ egfr: 70, frail: true, age: 58, activeMeds: ['glimepiride'] });
      expect(frailPlan.some(i => i.drugId === 'glimepiride' && (i.action === 'stop' || i.action === 'cap'))).toBe(true);

      const pregPlan = evaluateGeneralDmPlan({ pregnancy: true, activeMeds: ['metformin', 'empagliflozin'] });
      expect(pregPlan.some(i => i.drugId === 'metformin' && i.action === 'stop')).toBe(true);
      expect(pregPlan.some(i => i.drugId === 'empagliflozin' && i.action === 'stop')).toBe(true);
      expect(pregPlan.some(i => i.drugId === 'insulin_glargine' && i.action === 'start')).toBe(true);
    });

    it('treats explicit egfr <= 0 as severe/unverified renal impairment (stops metformin & glimepiride) and evaluates dual SU independently', () => {
      const zeroEgfrPlan = evaluateGeneralDmPlan({
        diabetes: true,
        egfr: 0,
        activeMeds: ['metformin', 'glimepiride']
      });
      expect(zeroEgfrPlan.some(i => i.id === 'dm-plan-metformin-active')).toBe(false);
      expect(zeroEgfrPlan.some(i => i.drugId === 'metformin' && i.action === 'stop')).toBe(true);
      expect(zeroEgfrPlan.some(i => i.drugId === 'glimepiride' && i.action === 'stop')).toBe(true);

      const dualSuPlan = evaluateGeneralDmPlan({
        diabetes: true,
        egfr: 25,
        activeMeds: ['glimepiride', 'gliclazide']
      });
      expect(dualSuPlan.some(i => i.drugId === 'glimepiride' && i.action === 'stop')).toBe(true);
      expect(dualSuPlan.some(i => i.drugId === 'gliclazide' && i.action === 'cap')).toBe(true);
    });
  });

  describe('getDynamicTargets (Frailty Relaxation)', () => {
    it('relaxes A1c and BP targets when frail is true even for age < 65', () => {
      const t = getDynamicTargets({ age: 50, frail: true, dm: true, diabetes: true });
      expect(t.isFrail).toBe(true);
      expect(t.isElderlyOrFrail).toBe(true);
      expect(t.dm.targetA1c).toBe('< 7.5% - 8.0%');
      expect(t.htn.targetBp).toContain('< 140/90');
      expect(t.htn.targetHomeBpAr).toContain('< 135/85');
      expect(t.dlp.ldlTargetMg).toBe(70);
    });

    it('treats explicit egfr: 0 (and empty string) as severe CKD instead of falling back to 68 / 70', () => {
      const zeroTargets = getDynamicTargets({ egfr: 0 });
      expect(zeroTargets.dm.currentEgfr).toBe('0 mL/min');
      expect(zeroTargets.dlp.ldlTargetMg).toBe(55);

      const emptyTargets = getDynamicTargets({ egfr: '' });
      expect(emptyTargets.dm.currentEgfr).toBe('0 mL/min');
      expect(emptyTargets.dlp.ldlTargetMg).toBe(55);

      const omittedTargets = getDynamicTargets({});
      expect(omittedTargets.dm.currentEgfr).toBe('68 mL/min');
      expect(omittedTargets.dlp.ldlTargetMg).toBe(70);
    });
  });

  describe('buildFollowUpSchedule & getTailoredSadmans', () => {
    it('prioritizes urgent follow-ups for K+ >= 5.5, pregnancy, and SBP >= 160', () => {
      const schedule = buildFollowUpSchedule({
        k: 5.7,
        pregnancy: true,
        sbp: 168,
        dbp: 104,
        egfr: 42,
        a1c: 8.6,
        diabetes: true,
        ldlC: 110,
        activeMeds: ['ramipril']
      });
      expect(schedule.length).toBeGreaterThanOrEqual(4);
      expect(schedule[0].priority).toBe('urgent');
      expect(schedule.some(s => s.id === 'fu-urgent-k')).toBe(true);
      expect(schedule.some(s => s.id === 'fu-urgent-obstetric')).toBe(true);
      expect(schedule.some(s => s.id === 'fu-urgent-bp')).toBe(true);
    });

    it('flags active SADMANS drug classes matching activeMeds', () => {
      const sadmans = getTailoredSadmans({ activeMeds: ['empagliflozin', 'ramipril', 'metformin'] });
      expect(sadmans.length).toBe(7);
      const activeKeys = sadmans.filter(s => s.isActive).map(s => s.classKey).sort();
      expect(activeKeys).toEqual(['acei', 'metformin', 'sglt2i']);
    });
  });
});
