import { describe, it, expect } from 'vitest';
import { getDynamicTargets, buildShareText } from '../src/engines/leaflets';
import { generateSVG } from '../src/engines/qr';
import { buildPrescriptionReport, buildWhatsAppShareUrl } from '../src/engines/exporters';
import { searchFormulary } from '../src/data/formulary';
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
});
