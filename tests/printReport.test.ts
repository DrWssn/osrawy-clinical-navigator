import { describe, it, expect, vi, afterEach } from 'vitest';
import { generatePrintableHtml, printClinicalReport } from '../src/engines/printReport';
import { DEFAULT_PATIENT, PatientState } from '../src/store/usePatientStore';

describe('Printable A4 Clinical Report Generator', () => {
  const mockPatient: PatientState = {
    ...DEFAULT_PATIENT,
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
    ft4: 1.4,
    medications: ['metformin'],
    activeMeds: ['metformin'],
  };

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

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

  it('respects English language mode and outputs clean version & LDL target without double prefix', () => {
    const html = generatePrintableHtml(mockPatient, undefined, 'en');

    expect(html).toContain('Blood Pressure');
    expect(html).toContain('Physician Signature & Stamp');
    expect(html).toContain('Metformin');
    expect(html).toContain('v2.1.0');
    expect(html).not.toContain('· v2.0<');
    expect(html).not.toContain('&lt; <');
    expect(html).not.toContain('mmol/L) mg/dL');
    expect(html).not.toContain('https://');
  });

  it('resolves insulin alias and uses compact offline QR payload', () => {
    const html = generatePrintableHtml({ ...mockPatient, activeMeds: ['insulin', 'ramipril'] }, undefined, 'en');
    expect(html).toContain('Insulin Glargine');
    expect(html).toContain('Ramipril');
  });

  it('invokes AndroidPrint.print() when available instead of iframe.print()', () => {
    vi.useFakeTimers();
    const androidPrintSpy = vi.fn();
    const iframePrintSpy = vi.fn();
    const mockIframe: any = {
      id: 'osrawy-print-iframe',
      style: {},
      contentWindow: {
        document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
        focus: vi.fn(),
        print: iframePrintSpy,
      },
    };
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => mockIframe),
      createElement: vi.fn(() => mockIframe),
      body: { appendChild: vi.fn() },
    });
    vi.stubGlobal('window', {
      AndroidPrint: { print: androidPrintSpy },
      print: vi.fn(),
    });

    printClinicalReport(mockPatient, undefined, 'en');
    vi.advanceTimersByTime(400);

    expect(androidPrintSpy).toHaveBeenCalledTimes(1);
    expect(iframePrintSpy).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('outputs zero Arabic characters in English printable HTML when English doctor settings are provided', () => {
    const html = generatePrintableHtml(
      mockPatient,
      { doctorName: 'Dr. Test', clinicName: 'Clinic', doctorTitle: 'Consultant Physician', clinicPhone: '' },
      'en'
    );
    expect(html).toContain('Serum K+');
    expect(/[\u0600-\u06FF]/.test(html)).toBe(false);
  });

  it('invokes AndroidPrint.print() even when iframe document is null (!iframeDoc)', () => {
    const androidPrintSpy = vi.fn();
    const windowPrintSpy = vi.fn();
    const mockIframe: any = {
      id: 'osrawy-print-iframe',
      style: {},
      contentWindow: null,
      contentDocument: null,
    };
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => mockIframe),
      createElement: vi.fn(() => mockIframe),
      body: { appendChild: vi.fn() },
    });
    vi.stubGlobal('window', {
      AndroidPrint: { print: androidPrintSpy },
      print: windowPrintSpy,
    });

    printClinicalReport(mockPatient, undefined, 'en');

    expect(androidPrintSpy).toHaveBeenCalledTimes(1);
    expect(windowPrintSpy).not.toHaveBeenCalled();
  });
});
