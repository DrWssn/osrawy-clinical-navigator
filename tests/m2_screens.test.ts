import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('zustand', async () => {
  const actual = await vi.importActual<typeof import('zustand')>('zustand');
  const { createStore } = await vi.importActual<typeof import('zustand/vanilla')>('zustand/vanilla');
  const wrappedCreate = (createState: any) => {
    const api = createStore(createState);
    api.getInitialState = () => api.getState();
    const useBoundStore = (selector?: any) => actual.useStore(api, selector);
    Object.assign(useBoundStore, api);
    return useBoundStore;
  };
  return {
    ...actual,
    create: wrappedCreate as typeof actual.create
  };
});

import { usePatientStore, DEFAULT_PATIENT } from '../src/store/usePatientStore';
import { useAppStore } from '../src/store/useAppStore';
import { App } from '../src/App';
import { CockpitScreen } from '../src/screens/CockpitScreen';
import { PrimaryCareScreen } from '../src/screens/PrimaryCareScreen';
import { CrmScreen } from '../src/screens/CrmScreen';
import { SafetyBanner } from '../src/components/shell/SafetyBanner';
import { BottomNav } from '../src/components/shell/BottomNav';
import { TopBar } from '../src/components/shell/TopBar';
import { VitalsStrip } from '../src/components/shell/VitalsStrip';
import { VitalsDrawerSheet } from '../src/components/shell/VitalsDrawerSheet';
import { PatientSwitcherSheet, CLINICAL_CASE_PRESETS } from '../src/components/shell/PatientSwitcherSheet';
import { SoapSheet } from '../src/components/shell/SoapSheet';
import { BottomSheet } from '../src/components/ui/BottomSheet';

const el = React.createElement;

describe('M2 UI, Shell, Cockpit & Primary Care Rendering', () => {
  beforeEach(() => {
    usePatientStore.getState().resetPatient();
    usePatientStore.getState().updatePatient({ ...DEFAULT_PATIENT });
    useAppStore.getState().closeAllOverlays();
    useAppStore.getState().setLang('en');
    useAppStore.getState().navigateTo('cockpit');
  });

  it('renders App cleanly in both EN and AR without undefined/NaN leaks', () => {
    for (const lang of ['en', 'ar'] as const) {
      useAppStore.getState().setLang(lang);
      const html = renderToStaticMarkup(el(App));
      expect(html.length).toBeGreaterThan(500);
      expect(html).not.toContain('NaN');
      expect(html).not.toContain('undefined');
    }
  });

  it('renders 5-tab BottomNav in EN and AR', () => {
    useAppStore.getState().setLang('en');
    const enHtml = renderToStaticMarkup(el(BottomNav));
    expect(enHtml).toContain('Cockpit');
    expect(enHtml).toContain('CRM');
    expect(enHtml).toContain('Primary Care');
    expect(enHtml).toContain('Tools');
    expect(enHtml).toContain('Patient');

    useAppStore.getState().setLang('ar');
    const arHtml = renderToStaticMarkup(el(BottomNav));
    expect(arHtml).toContain('الرئيسية');
    expect(arHtml).toContain('القلب والأيض');
    expect(arHtml).toContain('رعاية أولية');
    expect(arHtml).toContain('الأدوات');
    expect(arHtml).toContain('المريض');
  });

  it('localizes TopBar and VitalsStrip in Arabic mode', () => {
    usePatientStore.getState().resetPatient();
    useAppStore.getState().setLang('ar');

    const topHtml = renderToStaticMarkup(el(TopBar));
    expect(topHtml).toContain('مريض جديد');
    expect(topHtml).not.toContain('>New Patient<');

    const stripHtml = renderToStaticMarkup(el(VitalsStrip));
    expect(stripHtml).toContain('تعديل ✎');
    expect(stripHtml).not.toContain('Edit ✎');
  });

  it('renders CockpitScreen with 4-domain targets, Next Best Step, Frailty relaxation & Care Gaps', () => {
    usePatientStore.getState().updatePatient({
      ...DEFAULT_PATIENT,
      egfr: 42,
      uacr: 320,
      a1c: 9.2,
      sbp: 154,
      dbp: 94,
      ldlC: 145,
      ascvd: true,
      frail: true,
      activeMeds: ['metformin']
    });

    const htmlEn = renderToStaticMarkup(el(CockpitScreen));
    expect(htmlEn).toContain('Visit Clinical Cockpit');
    expect(htmlEn).toContain('HbA1c');
    expect(htmlEn).toContain('LDL-C');
    expect(htmlEn).toContain('eGFR / KDIGO');
    expect(htmlEn).toContain('7.5% - 8.0%');
    expect(htmlEn).toContain('Accept &amp; Add to Rx');
    expect(htmlEn).toContain('MASLD Liver Fibrosis Screening (FIB-4)');

    // Toggling empagliflozin reflects active Rx immediately
    usePatientStore.getState().toggleMedication('empagliflozin');
    const updatedHtml = renderToStaticMarkup(el(CockpitScreen));
    expect(updatedHtml).toContain('In Active Rx');

    useAppStore.getState().setLang('ar');
    const htmlAr = renderToStaticMarkup(el(CockpitScreen));
    expect(htmlAr).toContain('لوحة قيادة الزيارة السريرية');
    expect(htmlAr).toContain('فحص تليف الكبد الدهني');
  });

  it('renders PrimaryCareScreen across Asthma (GINA), COPD (GOLD) and Thyroid with clinical alerts', () => {
    // 1. Asthma SABA overuse
    usePatientStore.getState().updatePatient({
      ...DEFAULT_PATIENT,
      asthma: true,
      asthmaDaySymptoms: 4,
      asthmaNightWaking: true,
      asthmaRelieverPerWk: 5,
      asthmaSabaCanistersYr: 4,
      activeMeds: ['salbutamol']
    });
    useAppStore.getState().navigateTo('pc', 'asthma');
    const asthmaHtml = renderToStaticMarkup(el(PrimaryCareScreen));
    expect(asthmaHtml).toContain('GINA Track 1');
    expect(asthmaHtml).toContain('SABA Overuse Alert');
    expect(asthmaHtml).toContain('Budesonide / Formoterol');

    // 2. COPD low eosinophils ICS caution
    usePatientStore.getState().updatePatient({
      ...DEFAULT_PATIENT,
      copd: true,
      copdMmrc: 3,
      copdExacerbations: 2,
      copdEosinophils: 60
    });
    useAppStore.getState().navigateTo('pc', 'copd');
    const copdHtml = renderToStaticMarkup(el(PrimaryCareScreen));
    expect(copdHtml).toContain('Group E');
    expect(copdHtml).toContain('Low Blood Eosinophils');
    expect(copdHtml).toContain('Avoid ICS');

    // 3. Central Hypothyroidism LT4 block + Hyperthyroid Asthma Propranolol block
    usePatientStore.getState().updatePatient({
      ...DEFAULT_PATIENT,
      tsh: 0.1,
      ft4: 0.4
    });
    useAppStore.getState().navigateTo('pc', 'thyroid');
    const centralHtml = renderToStaticMarkup(el(PrimaryCareScreen));
    expect(centralHtml).toContain('Central Hypothyroidism');
    expect(centralHtml).toContain('Blocked');

    usePatientStore.getState().updatePatient({
      ...DEFAULT_PATIENT,
      asthma: true,
      tsh: 0.04,
      ft4: 2.8
    });
    const hyperAsthmaHtml = renderToStaticMarkup(el(PrimaryCareScreen));
    expect(hyperAsthmaHtml).toContain('Propranolol');
    expect(hyperAsthmaHtml).toContain('Blocked');
  });

  it('renders CrmScreen wrapper cleanly across dm, htn, and dlp sub-tabs', () => {
    for (const sub of ['dm', 'htn', 'dlp'] as const) {
      useAppStore.getState().navigateTo('crm', sub);
      const html = renderToStaticMarkup(el(CrmScreen));
      expect(html).toContain('Diabetes');
      expect(html).toContain('Hypertension');
      expect(html).toContain('Lipids &amp; ASCVD');
    }
  });

  it('renders expandable SafetyBanner with critical, warning, and info counts', () => {
    usePatientStore.getState().updatePatient({
      ...DEFAULT_PATIENT,
      egfr: 24,
      k: 5.2,
      copd: true,
      copdEosinophils: 50,
      asthma: true,
      asthmaRelieverPerWk: 5,
      triglycerides: 580,
      activeMeds: ['metformin', 'amlodipine', 'simvastatin']
    });

    const html = renderToStaticMarkup(el(SafetyBanner));
    expect(html).toContain('Critical');
    expect(html).toContain('Warn');
    expect(html).toContain('Info');
  });

  it('does not double-push BottomSheet id onto overlayStack when open', () => {
    useAppStore.getState().pushOverlay('vitals-drawer');
    expect(useAppStore.getState().overlayStack).toEqual(['vitals-drawer']);

    const sheetHtml = renderToStaticMarkup(
      el(
        BottomSheet,
        {
          id: 'vitals-drawer',
          isOpen: true,
          onClose: () => useAppStore.getState().popOverlay(),
          title: 'Vitals',
          children: el('div', null, 'Body')
        }
      )
    );
    expect(sheetHtml).toContain('data-sheet-id="vitals-drawer"');
    expect(useAppStore.getState().overlayStack).toEqual(['vitals-drawer']);

    // Single popOverlay dismisses in 1 step
    expect(useAppStore.getState().handleAndroidBack()).toBe(true);
    expect(useAppStore.getState().overlayStack).toEqual([]);
  });

  it('renders VitalsDrawerSheet with demographics, CKD-EPI 2021 apply, thyroid labs & pregnancy trimester', () => {
    usePatientStore.getState().updatePatient({
      ...DEFAULT_PATIENT,
      sex: 'f',
      pregnancy: true,
      thyroidTrimester: 1,
      scr: 1.4
    });
    useAppStore.getState().pushOverlay('vitals-drawer');
    const html = renderToStaticMarkup(el(VitalsDrawerSheet));
    expect(html).toContain('CKD-EPI 2021');
    expect(html).toContain('Calc &amp; Apply');
    expect(html).toContain('TSH');
    expect(html).toContain('Free T4');
    expect(html).toContain('Trimester 1');
  });

  it('renders PatientSwitcherSheet with 4 presets and filters malformed localStorage drafts safely', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => { storage.set(k, v); },
      removeItem: (k: string) => { storage.delete(k); },
      clear: () => { storage.clear(); }
    });
    try {
      localStorage.setItem(
        'osrawy_patient_drafts',
        JSON.stringify([
          null,
          { id: 'bad-no-patient' },
          { id: 'good-1', timestamp: 1700000000000, patient: { name: 'Valid Draft', age: 50, egfr: 80 } }
        ])
      );
      useAppStore.getState().pushOverlay('patient-switcher');
      const html = renderToStaticMarkup(el(PatientSwitcherSheet));
      expect(CLINICAL_CASE_PRESETS.length).toBe(4);
      expect(html).toContain('Cardio-Renal T2DM + CKD');
      expect(html).toContain('Valid Draft');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('renders SoapSheet with dir="ltr" on SOAP clinical note even in Arabic UI', () => {
    useAppStore.getState().setLang('ar');
    useAppStore.getState().pushOverlay('soap-sheet');
    const html = renderToStaticMarkup(el(SoapSheet));
    expect(html).toContain('dir="ltr"');
    expect(html).toContain('OSRAWY CLINICAL SOAP NOTE');
  });
});
