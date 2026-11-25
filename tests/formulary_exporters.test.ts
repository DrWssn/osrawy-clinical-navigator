import { describe, it, expect } from 'vitest';
import { getDynamicTargets, buildShareText } from '../src/engines/leaflets';
import { generateSVG, buildOfflinePatientQrPayload, getUtf8ByteLength, QR_MAX_UTF8_BYTES } from '../src/engines/qr';
import { buildPrescriptionReport, buildStructuredSoapNote, buildWhatsAppShareUrl } from '../src/engines/exporters';
import { searchFormulary, getDrugById, DRUG_BY_ID, getDrugSafetyStatus } from '../src/data/formulary';
import { ar } from '../src/i18n/ar';
import { en } from '../src/i18n/en';

describe('Formulary, Exporters, Leaflets & I18n (Cases 9, 10, 19, 20)', () => {
  describe('Case 9: Patient Leaflets & Offline QR Generator', () => {
    it('returns multi-engine clinical targets from getDynamicTargets', () => {
      const targets = getDynamicTargets();
      expect(targets.dm).toBeDefined();
      expect(targets.htn).toBeDefined();
      expect(targets.dlp).toBeDefined();
    });

    it('exports Arabic patient leaflet with Rule of 15 and SADMANS rules', () => {
      const targets = getDynamicTargets();
      const arShareText = buildShareText(targets, 'ar', 'all');
      const hasArRule15 = arShareText.includes('15') || arShareText.includes('هبوط');
      const hasArSadmans = arShareText.includes('SADMANS') || arShareText.includes('أيام المرض');
      expect(hasArRule15).toBe(true);
      expect(hasArSadmans).toBe(true);
    });

    it('exports English patient leaflet with Rule of 15 and SADMANS rules', () => {
      const targets = getDynamicTargets();
      const enShareText = buildShareText(targets, 'en', 'all');
      const hasEnRule15 = enShareText.includes('15') || enShareText.toLowerCase().includes('hypoglycemia');
      const hasEnSadmans = enShareText.includes('SADMANS') || enShareText.toLowerCase().includes('sick day');
      expect(hasEnRule15).toBe(true);
      expect(hasEnSadmans).toBe(true);
    });

    it('outputs valid 100% offline SVG markup from QR code generator', () => {
      const svg = generateSVG('https://osrawy.app/patient/rx-12345', { size: 200 });
      expect(typeof svg).toBe('string');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('viewBox=');
    });
  });

  describe('Case 10: Formulary Trade Name Search in AR & EN', () => {
    it('maps English trade name "Jardiance" to empagliflozin', () => {
      const hits = searchFormulary('Jardiance');
      expect(hits.length).toBeGreaterThanOrEqual(1);
      expect(hits[0].id).toBe('empagliflozin');
    });

    it('maps Arabic trade name "جلوكوفاج" to metformin', () => {
      const hits = searchFormulary('جلوكوفاج');
      expect(hits.length).toBeGreaterThanOrEqual(1);
      expect(hits[0].id).toBe('metformin');
    });

    it('maps "Concor" to bisoprolol', () => {
      const hits = searchFormulary('Concor');
      expect(hits.length).toBeGreaterThanOrEqual(1);
      expect(hits[0].id).toBe('bisoprolol');
    });
  });

  describe('Case 19: Prescription Share Export in AR & EN', () => {
    const pt = {
      name: 'Ahmed Mahmoud',
      age: 52,
      sex: 'm',
      wt: 96,
      ht: 170,
      egfr: 68,
      uacr: 45,
      sbp: 148,
      dbp: 94,
      k: 4.6,
      a1c: 8.9,
      fpg: 190,
      activeMeds: ['metformin', 'ramipril']
    };

    it('builds detailed Arabic prescription report with clinical sections', () => {
      const arReport = buildPrescriptionReport('ar', pt);
      expect(arReport.length).toBeGreaterThan(100);
      const hasSections = arReport.includes('بيانات المريض') && arReport.includes('الأهداف') && arReport.includes('الخطة الدوائية');
      expect(hasSections).toBe(true);
    });

    it('builds detailed English prescription report with clinical sections', () => {
      const enReport = buildPrescriptionReport('en', pt);
      expect(enReport.length).toBeGreaterThan(100);
      const hasSections = enReport.includes('Patient Profile') && enReport.includes('Clinical Targets') && enReport.includes('Prescribed Medications');
      expect(hasSections).toBe(true);
    });

    it('generates valid WhatsApp share URL with encoded text', () => {
      const url = buildWhatsAppShareUrl('+966500000000', 'Hello Doctor');
      expect(url).toContain('https://wa.me/966500000000?text=Hello%20Doctor');
    });
  });

  describe('Case 20: Translation Parity (Arabic and English Dictionaries)', () => {
    it('has exact matching keys in Arabic and English dictionaries', () => {
      const arKeys = Object.keys(ar).sort();
      const enKeys = Object.keys(en).sort();
      expect(arKeys.length).toBe(enKeys.length);
      expect(arKeys).toEqual(enKeys);
    });
  });

  describe('M1 Formulary Completeness, Safety Badges, EN Rx & Offline QR Payload', () => {
    it('includes all 18 newly added core formulary drugs and resolves insulin alias', () => {
      const requiredIds = [
        'gliclazide', 'glimepiride', 'insulin_glargine',
        'ramipril', 'losartan', 'telmisartan', 'sacubitril_valsartan',
        'labetalol', 'nifedipine_er', 'methyldopa',
        'simvastatin', 'evolocumab',
        'salbutamol', 'tiotropium',
        'carbimazole', 'propranolol',
        'apixaban', 'rivaroxaban'
      ];
      for (const id of requiredIds) {
        expect(DRUG_BY_ID[id]).toBeDefined();
      }
      expect(getDrugById('insulin')?.id).toBe('insulin_glargine');
    });

    it('computes accurate getDrugSafetyStatus badges for renal, asthma, pregnancy, K+, and frailty', () => {
      expect(getDrugSafetyStatus(DRUG_BY_ID.metformin, { egfr: 25 }).status).toBe('contraindicated');
      expect(getDrugSafetyStatus(DRUG_BY_ID.metformin, { egfr: 38 }).status).toBe('caution');
      expect(getDrugSafetyStatus(DRUG_BY_ID.metformin, { egfr: 75 }).status).toBe('safe');

      expect(getDrugSafetyStatus(DRUG_BY_ID.propranolol, { asthma: true }).status).toBe('contraindicated');
      expect(getDrugSafetyStatus(DRUG_BY_ID.atorvastatin, { pregnancy: true }).status).toBe('contraindicated');
      expect(getDrugSafetyStatus(DRUG_BY_ID.valsartan, { pregnancy: true }).status).toBe('contraindicated');
      expect(getDrugSafetyStatus(DRUG_BY_ID.empagliflozin, { pregnancy: true }).status).toBe('contraindicated');

      expect(getDrugSafetyStatus(DRUG_BY_ID.spironolactone, { k: 5.2 }).status).toBe('contraindicated');
      expect(getDrugSafetyStatus(DRUG_BY_ID.ramipril, { k: 5.6 }).status).toBe('contraindicated');
      expect(getDrugSafetyStatus(DRUG_BY_ID.glimepiride, { frail: true }).status).toBe('caution');
      expect(getDrugSafetyStatus(DRUG_BY_ID.simvastatin, { activeMeds: ['amlodipine'] }).status).toBe('caution');
    });

    it('enforces strict contraindicated > caution precedence and recognizes arni alias in getDrugSafetyStatus', () => {
      // K+ > 5.0 caution must NOT shadow ACEi <-> ARNI or dual RAAS contraindications
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.sacubitril_valsartan, { k: 5.2, egfr: 65, activeMeds: ['perindopril'] }).status
      ).toBe('contraindicated');
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.perindopril, { k: 5.2, egfr: 65, activeMeds: ['sacubitril_valsartan'] }).status
      ).toBe('contraindicated');
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.valsartan, { k: 5.2, egfr: 65, activeMeds: ['ramipril'] }).status
      ).toBe('contraindicated');

      // Standalone K+ > 5.0 without DDI still returns caution
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.valsartan, { k: 5.2, egfr: 65, activeMeds: [] }).status
      ).toBe('caution');

      // 'arni' token alias in activeMeds triggers contraindication for ACEi
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.perindopril, { k: 4.5, egfr: 75, activeMeds: ['arni'] }).status
      ).toBe('contraindicated');

      // Discordant CrCl (~25 mL/min -> caution) vs eGFR (10 < stopBelowEgfr 15 -> contraindicated) on rivaroxaban
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.rivaroxaban, {
          age: 65,
          wt: 70,
          sex: 'm',
          scr: 2.9,
          scrUnit: 'mg',
          egfr: 10
        }).status
      ).toBe('contraindicated');
    });

    it('treats explicit egfr: 0 as contraindicated while omitted egfr defaults to safe, and flags ARB + ARNI duplicate therapy', () => {
      expect(getDrugSafetyStatus(DRUG_BY_ID.metformin, { egfr: 0 }).status).toBe('contraindicated');
      expect(getDrugSafetyStatus(DRUG_BY_ID.rivaroxaban, { egfr: 0 }).status).toBe('contraindicated');
      expect(getDrugSafetyStatus(DRUG_BY_ID.apixaban, { egfr: 0 }).status).toBe('contraindicated');
      expect(getDrugSafetyStatus(DRUG_BY_ID.glimepiride, { egfr: 0 }).status).toBe('contraindicated');

      expect(getDrugSafetyStatus(DRUG_BY_ID.metformin, {}).status).toBe('safe');
      expect(getDrugSafetyStatus(DRUG_BY_ID.rivaroxaban, {}).status).toBe('safe');
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.rivaroxaban, { scr: 1.0, wt: 70, age: 150, sex: 'm' }).status
      ).toBe('safe');

      expect(
        getDrugSafetyStatus(DRUG_BY_ID.valsartan, { activeMeds: ['sacubitril_valsartan'] }).status
      ).toBe('contraindicated');
    });

    it('warns with caution for sacubitril_valsartan + pure ARB (valsartan/irbesartan) without self-flagging and preserves contraindication precedence', () => {
      const sacValPlusValsartan = getDrugSafetyStatus(DRUG_BY_ID.sacubitril_valsartan, {
        activeMeds: ['valsartan']
      });
      expect(sacValPlusValsartan.status).toBe('caution');
      expect(sacValPlusValsartan.reasonEn).toContain('Stop active ARB');
      expect(sacValPlusValsartan.reasonAr).toContain('ARB');

      expect(
        getDrugSafetyStatus(DRUG_BY_ID.sacubitril_valsartan, { activeMeds: ['irbesartan'] }).status
      ).toBe('caution');
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.ramipril, { activeMeds: ['irbesartan'] }).status
      ).toBe('contraindicated');

      // sacubitril_valsartan must not self-flag when already in activeMeds
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.sacubitril_valsartan, { activeMeds: ['sacubitril_valsartan'] }).status
      ).toBe('safe');

      // Contraindications (ACEi 36h washout, K+ >= 5.5, pregnancy) override pure-ARB caution
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.sacubitril_valsartan, { activeMeds: ['ramipril'] }).status
      ).toBe('contraindicated');
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.sacubitril_valsartan, { activeMeds: ['valsartan', 'ramipril'] }).status
      ).toBe('contraindicated');
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.sacubitril_valsartan, { k: 5.5, activeMeds: ['valsartan'] }).status
      ).toBe('contraindicated');
      expect(
        getDrugSafetyStatus(DRUG_BY_ID.sacubitril_valsartan, { pregnancy: true, activeMeds: ['valsartan'] }).status
      ).toBe('contraindicated');
    });

    it('respects explicit empty activeMeds: [] over stale medications in buildPrescriptionReport', () => {
      const report = buildPrescriptionReport('en', {
        name: 'Empty Meds Test',
        activeMeds: [],
        medications: ['metformin', 'ramipril']
      });
      expect(report).not.toContain('Active Patient Medications:');
      expect(report).not.toContain('Glucophage');
    });

    it('outputs English drug names/brands/doses (zero Arabic leak) in EN prescription report', () => {
      const pt = {
        name: 'John Doe',
        age: 55,
        sex: 'm',
        wt: 80,
        ht: 175,
        egfr: 72,
        uacr: 20,
        sbp: 142,
        dbp: 88,
        k: 4.5,
        a1c: 7.8,
        activeMeds: ['metformin', 'ramipril', 'empagliflozin']
      };
      const enReport = buildPrescriptionReport('en', pt);
      const rxSection = enReport.split('Active Patient Medications:')[1]?.split('Clinical Safety')[0] || enReport;
      expect(rxSection).toContain('Metformin');
      expect(rxSection).toContain('Ramipril');
      expect(rxSection).toContain('Empagliflozin');
      expect(/[\u0600-\u06FF]/.test(rxSection)).toBe(false);
    });

    it('wires dynamic frail targets and primaryCare/lipids alerts into buildStructuredSoapNote', () => {
      const soap = buildStructuredSoapNote({
        name: 'Test Frail',
        age: 60,
        sex: 'm',
        frail: true,
        asthma: true,
        asthmaRelieverPerWk: 5,
        triglycerides: 560,
        activeMeds: ['metformin']
      });
      expect(soap).toContain('< 140/90 mmHg');
      expect(soap).toContain('< 7.5% - 8.0%');
      expect(soap).toContain('SABA Overuse');
      expect(soap).toContain('Severe Hypertriglyceridemia');
    });

    it('builds compact offline QR payload <= 134 UTF-8 bytes with no external URL', () => {
      const payload = buildOfflinePatientQrPayload({
        name: 'أحمد محمود عبد الرحمن القحطاني',
        sbp: 152,
        dbp: 94,
        a1c: 8.6,
        egfr: 44,
        k: 4.9,
        frail: true,
        ascvd: true,
        activeMeds: [
          'metformin', 'empagliflozin', 'semaglutide', 'ramipril', 'amlodipine',
          'indapamide', 'atorvastatin', 'ezetimibe', 'budesonide_formoterol', 'levothyroxine', 'apixaban'
        ]
      });
      expect(payload).not.toContain('https://');
      expect(payload).toContain('OSRAWY|');
      expect(getUtf8ByteLength(payload)).toBeLessThanOrEqual(QR_MAX_UTF8_BYTES);
    });
  });
});
