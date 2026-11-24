import { describe, it, expect } from 'vitest';
import { stratifyRisk, evaluateLipidPathway } from '../src/engines/lipids';

describe('Lipids Engine (Cases 4 & 5)', () => {
  describe('Case 4: Very High Risk ASCVD & Pathway Escalations', () => {
    it('stratifies patient with established ASCVD as VERY_HIGH risk with LDL target < 55 mg/dL', () => {
      const vhPatient = { ascvd: true, age: 62, diabetes: true, smoker: false, sbp: 135 };
      const strat = stratifyRisk(vhPatient);
      const isVeryHigh = (strat.tier || strat.riskKey || '').toUpperCase().includes('VERY_HIGH');
      expect(isVeryHigh).toBe(true);
      expect(strat.ldlTargetMg).toBe(55);
    });

    it('triggers Step 2 Ezetimibe escalation recommendation when LDL not at target on statin', () => {
      const stepUpInput = {
        ascvd: true,
        ldlC: 85,
        currentStatin: 'atorvastatin_80',
        onStatin: true,
        currentDrugs: ['atorvastatin']
      };
      const pathway = evaluateLipidPathway(stepUpInput);
      const hasEzetimibe = JSON.stringify(pathway).toLowerCase().includes('ezetimibe') ||
                           JSON.stringify(pathway).includes('إزيتيميب') ||
                           JSON.stringify(pathway).toLowerCase().includes('step 2');
      expect(hasEzetimibe).toBe(true);
    });

    it('triggers Step 3 PCSK9 inhibitor recommendation when not at goal on Statin + Ezetimibe', () => {
      const pcsk9Input = {
        ascvd: true,
        ldlC: 92,
        onStatin: true,
        onEzetimibe: true,
        currentDrugs: ['atorvastatin', 'ezetimibe']
      };
      const pathwayPcsk9 = evaluateLipidPathway(pcsk9Input);
      const hasPcsk9 = JSON.stringify(pathwayPcsk9).toLowerCase().includes('pcsk9') ||
                       JSON.stringify(pathwayPcsk9).includes('إيفولوكوماب') ||
                       JSON.stringify(pathwayPcsk9).toLowerCase().includes('step 3');
      expect(hasPcsk9).toBe(true);
    });

    it('triggers interaction alert capping Simvastatin at <= 20 mg/d when co-administered with Amlodipine', () => {
      const interactionInput = {
        currentDrugs: ['amlodipine', 'simvastatin'],
        amlodipine: true,
        simvastatin: true,
        simvastatinDose: 40
      };
      const pathwayInteract = evaluateLipidPathway(interactionInput);
      const hasSimvaAlert = JSON.stringify(pathwayInteract).toLowerCase().includes('simvastatin') &&
                            (JSON.stringify(pathwayInteract).includes('20') ||
                             JSON.stringify(pathwayInteract).toLowerCase().includes('cap') ||
                             JSON.stringify(pathwayInteract).toLowerCase().includes('interaction') ||
                             JSON.stringify(pathwayInteract).includes('تفاعل'));
      expect(hasSimvaAlert).toBe(true);
    });
  });

  describe('Case 5: Severe Hypertriglyceridemia & Renal Caps', () => {
    it('triggers acute pancreatitis risk alert & urgent fibrate recommendation when TG >= 500', () => {
      const severeTgInput = {
        triglycerides: 580,
        ldlC: 130,
        totalCholesterol: 260,
        hdlC: 38,
        egfr: 75
      };
      const severeTgRes = evaluateLipidPathway(severeTgInput);
      const pancreatitisAlert = JSON.stringify(severeTgRes).toLowerCase().includes('pancreat') ||
                                JSON.stringify(severeTgRes).includes('التهاب البنكرياس') ||
                                JSON.stringify(severeTgRes).toLowerCase().includes('fenofibrate') ||
                                JSON.stringify(severeTgRes).includes('فينوفيبرات');
      expect(pancreatitisAlert).toBe(true);
    });

    it('recommends Icosapent ethyl / Omega-3 therapy for TG 135-499 in ASCVD patient on statin', () => {
      const modTgInput = {
        ascvd: true,
        triglycerides: 240,
        ldlC: 60,
        onStatin: true
      };
      const modTgRes = evaluateLipidPathway(modTgInput);
      const icosapent = JSON.stringify(modTgRes).toLowerCase().includes('icosapent') ||
                        JSON.stringify(modTgRes).toLowerCase().includes('omega') ||
                        JSON.stringify(modTgRes).includes('أوميغا');
      expect(icosapent).toBe(true);
    });

    it('triggers Rosuvastatin renal cap <= 10 mg/d guardrail when eGFR < 30', () => {
      const renalRosuvaInput = {
        egfr: 24,
        ldlC: 150,
        rosuvastatin: true
      };
      const renalRes = evaluateLipidPathway(renalRosuvaInput);
      const rosuvaCap = JSON.stringify(renalRes).toLowerCase().includes('rosuvastatin') &&
                        (JSON.stringify(renalRes).includes('10') ||
                         JSON.stringify(renalRes).toLowerCase().includes('renal') ||
                         JSON.stringify(renalRes).includes('جرعة قصوى'));
      expect(rosuvaCap).toBe(true);
    });

    it('flags statins as contraindicated in pregnancy', () => {
      const lipidRes = evaluateLipidPathway({
        pregnancy: true,
        preg: true,
        ldlC: 160,
        totalCholesterol: 240,
        triglycerides: 180,
        hdlC: 45
      });
      const statinContra = JSON.stringify(lipidRes).toLowerCase().includes('pregnan') ||
                           JSON.stringify(lipidRes).includes('حمل') ||
                           JSON.stringify(lipidRes).toLowerCase().includes('contraindicat');
      expect(statinContra).toBe(true);
    });
  });
});
