import { describe, it, expect } from 'vitest';
import { generatePrintableHtml } from '../src/engines/printReport';
import { PatientState } from '../src/store/usePatientStore';

describe('Printable A4 Clinical Report Generator', () => {
  const mockPatient: PatientState = {
    name: 'Ahmed Mahmoud',
    age: 52,
    sex: 'm',
    wt: 96,
    ht: 170,
    dur: 4,
    hf: 'none',
    a1c: 8.9,
    fpg: 190,
    egfr: 68,
    uacr: 45,
    sbp: 148,
    dbp: 94,
    k: 4.6,
    tc: 210,
    hdl: 42,
    totalCholesterol: 210,
    ldlC: 130,
    hdlC: 42,
    triglycerides: 180,
    altUl: 28,
    lipidUnit: 'mg',
    smoker: false,
    statin: false,
    ascvd: false,
    diabetes: true,
    dm: true,
    statinIntolerant: false,
    pregnancy: false,
    postpartum: false,
    trimester: 0,
    gestationalWeeks: 0,
    asthma: false,
    copd: false,
    tsh: 2.1,
    ft4: 14,
    medications: ['metformin'],
    activeMeds: ['metformin'],
  };

  it('generates valid A4 HTML document containing patient demographics and vitals', () => {
    const html = generatePrintableHtml(mockPatient, undefined, 'ar');

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Ahmed Mahmoud');
    expect(html).toContain('148/94');
    expect(html).toContain('8.9%');
    expect(html).toContain('68');
    expect(html).toContain('4.6');
  });

  it('populates prescription table with active medications from formulary', () => {
    const html = generatePrintableHtml(mockPatient, undefined, 'ar');

    // Contains Metformin generic and brand name
    expect(html).toContain('ميتفورمين');
    expect(html).toContain('جلوكوفاج');
    expect(html).toContain('Rx');
  });

  it('includes offline vector SVG QR code and doctor signature block', () => {
    const html = generatePrintableHtml(mockPatient, undefined, 'ar');

    expect(html).toContain('<svg');
    expect(html).toContain('توقيع وختم الطبيب المعالج');
  });

  it('respects English language mode', () => {
    const html = generatePrintableHtml(mockPatient, undefined, 'en');

    expect(html).toContain('Blood Pressure');
    expect(html).toContain('Physician Signature & Stamp');
    expect(html).toContain('Metformin');
  });
});
