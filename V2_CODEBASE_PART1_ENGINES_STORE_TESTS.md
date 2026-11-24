# Osrawy Clinical Navigator v2.0.0 — Codebase Part 1: Architecture, Clinical Engines, State Store & Test Suites

Part 1 contains the root configs, zero-DOM clinical engines (calculators, safety guardrails, ADA 2025, ACC/AHA HTN, KDIGO, DOAC, GINA, GOLD), reactive Zustand stores, and full Vitest clinical test suites.

## Table of Contents
1. [package.json](#package-json)
2. [tsconfig.json](#tsconfig-json)
3. [vite.config.ts](#vite-config-ts)
4. [tailwind.config.cjs](#tailwind-config-cjs)
5. [capacitor.config.json](#capacitor-config-json)
6. [index.html](#index-html)
7. [src\engines\calculators.ts](#src-engines-calculators-ts)
8. [src\engines\diabetes.ts](#src-engines-diabetes-ts)
9. [src\engines\exporters.ts](#src-engines-exporters-ts)
10. [src\engines\htn.ts](#src-engines-htn-ts)
11. [src\engines\index.ts](#src-engines-index-ts)
12. [src\engines\leaflets.ts](#src-engines-leaflets-ts)
13. [src\engines\lipids.ts](#src-engines-lipids-ts)
14. [src\engines\primaryCare.ts](#src-engines-primarycare-ts)
15. [src\engines\qr.ts](#src-engines-qr-ts)
16. [src\engines\safety.ts](#src-engines-safety-ts)
17. [src\engines\tools.ts](#src-engines-tools-ts)
18. [src\store\useAppStore.ts](#src-store-useappstore-ts)
19. [src\store\usePatientStore.ts](#src-store-usepatientstore-ts)
20. [tests\formulary_exporters.test.ts](#tests-formulary_exporters-test-ts)
21. [tests\lipids.test.ts](#tests-lipids-test-ts)
22. [tests\obstetrics.test.ts](#tests-obstetrics-test-ts)
23. [tests\primaryCare.test.ts](#tests-primarycare-test-ts)
24. [tests\safety.test.ts](#tests-safety-test-ts)
25. [tests\smoke.test.ts](#tests-smoke-test-ts)
26. [tests\store.test.ts](#tests-store-test-ts)
27. [tests\tools.test.ts](#tests-tools-test-ts)

---

## package.json

`json
{
  "name": "osrawy-clinical-navigator",
  "version": "2.0.0",
  "type": "module",
  "description": "Osrawy Diabetes and Hypertension Clinical Treatment Navigator",
  "main": "www/index.html",
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build": "tsc --noEmit && vite build && cap sync android",
    "cap:android": "cap open android"
  },
  "author": "Dr Hossam Yousuf",
  "license": "ISC",
  "dependencies": {
    "@capacitor/android": "^6.2.0",
    "@capacitor/cli": "^6.2.0",
    "@capacitor/core": "^6.2.0",
    "lucide-react": "^1.79.0",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "zustand": "^5.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.3.0",
    "autoprefixer": "^10.7.0",
    "postcss": "^8.5.33",
    "tailwindcss": "^3.4.19",
    "typescript": "^7.0.2",
    "vite": "^8.3.8",
    "vitest": "^5.1.1"
  }
}
`

---

## tsconfig.json

`json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "tests", "vite.config.ts"]
}
`

---

## vite.config.ts

`typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'www',
    emptyOutDir: true,
    target: 'es2020',
  },
  server: {
    port: 3000,
  },
});
`

---

## tailwind.config.cjs

`javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#16A34A',
          600: '#0A4F4B',
          700: '#083E3A',
          800: '#062E2B',
          900: '#041F1D',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
`

---

## capacitor.config.json

`json
{
  "appId": "com.osrawy.clinicalnavigator",
  "appName": "Osrawy Navigator",
  "webDir": "www",
  "server": {
    "androidScheme": "https"
  },
  "android": {
    "backgroundColor": "#0F2B2A"
  }
}
`

---

## index.html

`html
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <title>Osrawy Clinical Navigator</title>
  <link rel="stylesheet" href="/fonts/fonts.css">
  <link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">
</head>
<body class="bg-slate-50 text-slate-900 antialiased selection:bg-teal-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`

---

## src\engines\calculators.ts

`typescript
// ==============================================================
// Clinical Calculators (Pure Zero-DOM Functions)
// CKD-EPI 2021, Cockcroft-Gault CrCl, BMI, eAG, Corrected Calcium, Steroids
// ==============================================================

export interface CkdEpiResult {
  egfr: number;
  egfrInt: number;
  scrMg: number;
  scrUmol: number;
  stage: {
    stage: string;
    kdigoClass: string;
    descEn: string;
    descAr: string;
    actionEn: string;
    actionAr: string;
    isSevere: boolean;
    isModerate: boolean;
    color: string;
  };
}

export function getStageInfo(egfr: number) {
  if (egfr >= 90) {
    return {
      stage: 'G1',
      kdigoClass: 'G1',
      descEn: 'Normal or High (≥90 mL/min/1.73m²)',
      descAr: 'طبيعي أو مرتفع (≥90 مل/دقيقة/1.73م²)',
      actionEn: 'Normal kidney function. Screen annually if diabetes/HTN.',
      actionAr: 'وظائف كلى طبيعية. فحص سنوي لمرضى السكري والضغط.',
      isSevere: false,
      isModerate: false,
      color: '#16A34A'
    };
  } else if (egfr >= 60) {
    return {
      stage: 'G2',
      kdigoClass: 'G2',
      descEn: 'Mildly Decreased (60–89 mL/min/1.73m²)',
      descAr: 'انخفاض طفيف (60–89 مل/دقيقة/1.73م²)',
      actionEn: 'Mild reduction. Monitor annually. Control BP and glycemia.',
      actionAr: 'انخفاض طفيف. متابعة سنوية وضبط الضغط والسكر.',
      isSevere: false,
      isModerate: false,
      color: '#65A30D'
    };
  } else if (egfr >= 45) {
    return {
      stage: 'G3a',
      kdigoClass: 'G3a',
      descEn: 'Mildly to Moderately Decreased (45–59 mL/min/1.73m²)',
      descAr: 'انخفاض طفيف إلى متوسط (45–59 مل/دقيقة/1.73م²)',
      actionEn: 'Evaluate CKD etiology. Monitor eGFR and UACR every 6 months. Renal dosing for SGLT2i/GLP-1.',
      actionAr: 'تقييم سبب القصور. فحص وظائف الكلى والزلال كل 6 أشهر. تعديل جرعات الأدوية.',
      isSevere: false,
      isModerate: true,
      color: '#D97706'
    };
  } else if (egfr >= 30) {
    return {
      stage: 'G3b',
      kdigoClass: 'G3b',
      descEn: 'Moderately to Severely Decreased (30–44 mL/min/1.73m²)',
      descAr: 'انخفاض متوسط إلى شديد (30–44 مل/دقيقة/1.73م²)',
      actionEn: 'Cap Metformin at 1000 mg/d (do not initiate). SGLT2i protection. Monitor every 3–4 months.',
      actionAr: 'الحد الأقصى للميتفورمين 1000 ملغ/يوم (لا تبدأ لمريض جديد). مراقبة كل 3-4 أشهر.',
      isSevere: false,
      isModerate: true,
      color: '#EA580C'
    };
  } else if (egfr >= 15) {
    return {
      stage: 'G4',
      kdigoClass: 'G4',
      descEn: 'Severely Decreased (15–29 mL/min/1.73m²)',
      descAr: 'انخفاض شديد (15–29 مل/دقيقة/1.73م²)',
      actionEn: 'Contraindicated: Metformin. Prepare for RRT/nephrology referral. Cap Rosuvastatin <=10 mg.',
      actionAr: 'ممنوع الميتفورمين. تحويل لأخصائي الكلى. الحد الأقصى لروسوفاستاتين 10 ملغ.',
      isSevere: true,
      isModerate: false,
      color: '#DC2626'
    };
  } else {
    return {
      stage: 'G5',
      kdigoClass: 'G5',
      descEn: 'Kidney Failure (ESRD <15 mL/min/1.73m²)',
      descAr: 'فشل كلوي نهائي (<15 مل/دقيقة/1.73م²)',
      actionEn: 'Dialysis or kidney transplant evaluation. Nephrology co-management mandatory.',
      actionAr: 'تقييم الغسيل الكلوي أو الزراعة. متابعة متخصصة إلزامية.',
      isSevere: true,
      isModerate: false,
      color: '#991B1B'
    };
  }
}

/**
 * CKD-EPI 2021 Race-Free Equation
 */
export function calculateCkdEpi2021(
  scrInput: number | string,
  scrUnit: 'mg' | 'umol' = 'mg',
  ageInput: number | string = 52,
  sexInput: 'm' | 'f' | string = 'm'
): CkdEpiResult | null {
  const scr = parseFloat(String(scrInput)) || 0;
  const age = parseFloat(String(ageInput)) || 0;
  const sex = String(sexInput).toLowerCase() === 'f' ? 'f' : 'm';

  if (scr <= 0 || age <= 0) return null;

  const scrMg = (scrUnit === 'umol') ? (scr / 88.4) : scr;
  const kappa = (sex === 'f') ? 0.7 : 0.9;
  const alpha = (sex === 'f') ? -0.241 : -0.302;
  const genderMult = (sex === 'f') ? 1.012 : 1.0;

  const ratio = scrMg / kappa;
  const minVal = Math.min(ratio, 1.0);
  const maxVal = Math.max(ratio, 1.0);

  const egfr = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age) * genderMult;
  const egfrRound = Math.round(egfr * 10) / 10;
  const egfrInt = Math.round(egfr);

  return {
    egfr: egfrRound,
    egfrInt: egfrInt,
    scrMg: Math.round(scrMg * 100) / 100,
    scrUmol: Math.round(scrMg * 88.4 * 10) / 10,
    stage: getStageInfo(egfrInt)
  };
}

/**
 * Cockcroft-Gault Creatinine Clearance (CrCl)
 */
export function calculateCrCl(
  arg1: any,
  arg2?: any,
  arg3?: any,
  arg4?: any,
  arg5?: any
): { crcl: number; crclInt: number; scrMg: number; age: number; wt: number; sex: 'm' | 'f' } | null {
  let age = 0, wt = 0, scrMg = 0, sex: 'm' | 'f' = 'm';

  if (typeof arg2 === 'string' && (arg2 === 'mg' || arg2 === 'umol')) {
    const scr = parseFloat(arg1) || 0;
    scrMg = (arg2 === 'umol') ? (scr / 88.4) : scr;
    age = parseFloat(arg3) || 0;
    sex = String(arg4).toLowerCase() === 'f' ? 'f' : 'm';
    wt = parseFloat(arg5) || 0;
  } else if (typeof arg1 === 'object' && arg1 !== null) {
    age = parseFloat(arg1.age) || 0;
    wt = parseFloat(arg1.weightKg || arg1.wt || arg1.weight) || 0;
    const sVal = parseFloat(arg1.creatinineMgDl || arg1.scr || arg1.creatinine || arg1.scrMg) || 0;
    const u = arg1.scrUnit || arg1.unit || 'mg';
    scrMg = (u === 'umol') ? (sVal / 88.4) : sVal;
    sex = String(arg1.sex || arg1.gender || 'm').toLowerCase() === 'f' ? 'f' : 'm';
  } else {
    age = parseFloat(arg1) || 0;
    wt = parseFloat(arg2) || 0;
    scrMg = parseFloat(arg3) || 0;
    sex = String(arg4 || 'm').toLowerCase() === 'f' ? 'f' : 'm';
  }

  if (scrMg <= 0 || age <= 0 || wt <= 0) return null;

  const factor = (sex === 'f') ? 0.85 : 1.0;
  const crcl = ((140 - age) * wt) / (72 * scrMg) * factor;
  const crclRound = Math.round(crcl * 10) / 10;
  const crclInt = Math.round(crcl);

  return {
    crcl: crclRound,
    crclInt,
    scrMg: Math.round(scrMg * 100) / 100,
    age,
    wt,
    sex
  };
}

/**
 * Body Mass Index (BMI)
 */
export function calculateBMI(wtKg: number, htCm: number) {
  if (wtKg <= 0 || htCm <= 0) {
    return { bmi: 0, category: 'Unknown', categoryAr: 'غير محدد', isOverweight: false, isObese: false };
  }
  const htM = htCm / 100;
  const bmi = Math.round((wtKg / (htM * htM)) * 10) / 10;

  let category = 'Normal';
  let categoryAr = 'طبيعي';
  let isOverweight = false;
  let isObese = false;

  if (bmi < 18.5) {
    category = 'Underweight';
    categoryAr = 'نقص في الوزن';
  } else if (bmi < 25) {
    category = 'Normal';
    categoryAr = 'وزن طبيعي';
  } else if (bmi < 30) {
    category = 'Overweight';
    categoryAr = 'زيادة في الوزن';
    isOverweight = true;
  } else if (bmi < 35) {
    category = 'Obesity Class I';
    categoryAr = 'سمنة من الدرجة الأولى';
    isObese = true;
  } else if (bmi < 40) {
    category = 'Obesity Class II';
    categoryAr = 'سمنة من الدرجة الثانية';
    isObese = true;
  } else {
    category = 'Obesity Class III (Severe)';
    categoryAr = 'سمنة مفرطة من الدرجة الثالثة';
    isObese = true;
  }

  return { bmi, category, categoryAr, isOverweight, isObese };
}

/**
 * Estimated Average Glucose (eAG) from HbA1c
 * Formula: eAG (mg/dL) = 28.7 * A1c - 46.7
 */
export function calculateEag(a1c: number) {
  if (a1c <= 0) return { eagMg: 0, eagMmol: 0 };
  const eagMg = Math.round(28.7 * a1c - 46.7);
  const eagMmol = Math.round((eagMg / 18.018) * 10) / 10;
  return { eagMg, eagMmol };
}

/**
 * Corrected Calcium for Hypoalbuminemia (Payne Formula)
 * Formula: Corrected Ca = Total Ca + 0.8 * (4.0 - Albumin)
 */
export function calculateCorrectedCa(totalCa: number, albumin: number) {
  if (totalCa <= 0 || albumin <= 0) return { correctedCa: totalCa, isNormal: true };
  const corr = totalCa + 0.8 * (4.0 - albumin);
  const correctedCa = Math.round(corr * 10) / 10;
  const isNormal = correctedCa >= 8.5 && correctedCa <= 10.5;
  return { correctedCa, isNormal };
}

/**
 * Glucocorticoid Steroid Equivalence
 */
export function calculateSteroidEquivalence(doseMg: number, steroidType: string) {
  const dose = parseFloat(String(doseMg)) || 0;
  const type = String(steroidType).toLowerCase();

  let predEquiv = dose;
  if (type === 'hydrocortisone') predEquiv = dose * 0.25; // 20mg hydro = 5mg pred
  else if (type === 'methylprednisolone') predEquiv = dose * 1.25; // 4mg methyl = 5mg pred
  else if (type === 'dexamethasone') predEquiv = dose * 6.67; // 0.75mg dexa = 5mg pred

  const hydro = Math.round(predEquiv * 4 * 10) / 10;
  const methyl = Math.round(predEquiv * 0.8 * 10) / 10;
  const dexa = Math.round((predEquiv / 6.67) * 10) / 10;
  const pred = Math.round(predEquiv * 10) / 10;

  return {
    prednisone: pred,
    hydrocortisone: hydro,
    methylprednisolone: methyl,
    dexamethasone: dexa,
    summaryEn: `Hydro ${hydro}mg · Methyl ${methyl}mg · Dexa ${dexa}mg`,
    summaryAr: `هيدروكورتيزون ${hydro} ملغ · ميثيل بريد ${methyl} ملغ · ديكسا ${dexa} ملغ`
  };
}
`

---

## src\engines\diabetes.ts

`typescript
export function evaluatePregnancyDmProtocol(patientInput: any): any {
  const pt = patientInput || {};
  const wt = parseFloat(String(pt.wt !== undefined ? pt.wt : (pt.weightKg !== undefined ? pt.weightKg : pt.weight))) || 70;
  const isPregnant = !!(pt.pregnancy || pt.preg || pt.isPregnant || pt.pregHtn);
  const isPostpartum = !!(pt.postpartum || (pt.comorbidities && pt.comorbidities.postpartum));
  let trimester = parseInt(String(pt.trimester), 10);
  const weeks = parseFloat(String(pt.gestationalWeeks !== undefined ? pt.gestationalWeeks : (pt.weeks !== undefined ? pt.weeks : 16))) || 16;

  if (!trimester || isNaN(trimester) || trimester < 1 || trimester > 3) {
    if (weeks <= 13) trimester = 1;
    else if (weeks <= 26) trimester = 2;
    else trimester = 3;
  }

  const alerts: any[] = [];

  const stoppedAgents = [
    { classEn: 'Biguanides', name: 'Metformin', reasonEn: 'Crosses placenta; insulin is preferred first-line', reasonAr: 'يعبر المشيمة والإنسولين هو الخيار الأول' },
    { classEn: 'SGLT2 inhibitors', name: 'Dapagliflozin, Empagliflozin', reasonEn: 'Contraindicated; fetal renal abnormalities in animal studies', reasonAr: 'ممنوع تماماً؛ تشوهات كلوية جنينية' },
    { classEn: 'GLP-1 RA / Dual GIP/GLP-1', name: 'Semaglutide, Tirzepatide, Dulaglutide, Liraglutide', reasonEn: 'Contraindicated; embryonic toxicity in animal studies', reasonAr: 'ممنوع تماماً؛ سمية جنينية في الدراسات' },
    { classEn: 'Sulfonylureas', name: 'Glimepiride, Gliclazide, Glibenclamide', reasonEn: 'Risk of fetal hyperinsulinemia, macrosomia, and severe neonatal hypoglycemia', reasonAr: 'خطر هبوط سكر وليدي حاد وتضخم الجنين' },
    { classEn: 'DPP-4 inhibitors', name: 'Sitagliptin, Vildagliptin, Linagliptin', reasonEn: 'Insufficient pregnancy safety data; discontinue', reasonAr: 'عدم كفاية بيانات الأمان في الحمل' },
    { classEn: 'TZDs', name: 'Pioglitazone', reasonEn: 'Contraindicated; fluid retention, fetal harm', reasonAr: 'ممنوع تماماً في الحمل' }
  ];

  alerts.push({
    id: 'dm-preg-stop-non-insulin',
    code: 'STOP_NON_INSULIN_PREGNANCY_DRUGS',
    level: 'critical',
    type: 'critical',
    titleEn: 'Stop All Non-Insulin DM Agents: Switch to Multi-Dose Insulin',
    titleAr: 'إيقاف جميع خافضات السكر الفموية وغير الإنسولينية: التحويل للإنسولين',
    messageEn: 'All oral and injectable non-insulin antidiabetic agents (Metformin, SGLT2i, GLP-1 RA, Tirzepatide, Sulfonylureas, DPP-4i, TZDs) must be stopped. Insulin is the gold standard and sole recommended pharmacotherapy for diabetes in pregnancy (ADA Standards of Care 2024/2025).',
    messageAr: 'يجب إيقاف جميع حبوب وحقن السكر غير الإنسولينية فوراً (ميتفورمين، مثبطات SGLT2، منشطات GLP-1، مونجارو، سلفونيل يوريا). الإنسولين هو العلاج الذهبي والوحيد المعتمد والآمن في الحمل.',
    actionEn: 'Discontinue oral/GLP-1 agents immediately; initiate intensive basal-bolus insulin therapy.',
    actionAr: 'أوقف الأدوية الفموية فوراً وابدأ نظام الإنسولين المكثف (قاعدي وسريع).'
  });

  let tddMultiplier = 0.8;
  let trimesterNameEn = '2nd Trimester (Weeks 14–26)';
  let trimesterNameAr = 'الثلث الثاني (الأسابيع 14–26)';
  if (trimester === 1) {
    tddMultiplier = 0.7;
    trimesterNameEn = '1st Trimester (Weeks 1–13)';
    trimesterNameAr = 'الثلث الأول (الأسابيع 1–13)';
  } else if (trimester === 3) {
    tddMultiplier = 0.9;
    trimesterNameEn = '3rd Trimester (Weeks 27–40)';
    trimesterNameAr = 'الثلث الثالث (الأسابيع 27–40)';
  }

  const tdd = Math.round(wt * tddMultiplier * 10) / 10;
  const basalTotal = Math.round(tdd * 0.5 * 10) / 10;
  const prandialTotal = Math.round(tdd * 0.5 * 10) / 10;
  const prandialPerMeal = Math.round((prandialTotal / 3) * 10) / 10;

  const basalUnits = Math.round(tdd * 0.5);
  const prandialTotalUnits = Math.round(tdd * 0.5);
  const mealBolusUnits = Math.round(prandialTotalUnits / 3);

  const insulinDosing = {
    weightKg: wt,
    trimester,
    trimesterNameEn,
    trimesterNameAr,
    multiplier: tddMultiplier,
    tdd,
    tddUnits: Math.round(tdd),
    basalTotal,
    basalUnits,
    prandialTotal,
    prandialTotalUnits,
    prandialPerMeal,
    prandialPerMealUnits: mealBolusUnits,
    mealBolusUnits,
    mealBolus: mealBolusUnits,
    split: '50% Basal / 50% Prandial across 3 meals',
    basalRegimenEn: `Basal Insulin: ${basalUnits} units/day (e.g. NPH insulin divided twice daily [2/3 morning, 1/3 bedtime] OR Insulin Detemir/Glargine once/twice daily)`,
    basalRegimenAr: `الإنسولين القاعدي: ${basalUnits} وحدة/يوم (إنسولين NPH مقسم مرتين يومياً [ثلثين صباحاً وثلث قبل النوم] أو ديتيمير/لانتوس)`,
    prandialRegimenEn: `Prandial Insulin: ${prandialTotalUnits} units/day divided into ~${mealBolusUnits} units before each of 3 main meals (Breakfast: ${mealBolusUnits} U, Lunch: ${mealBolusUnits} U, Dinner: ${mealBolusUnits} U) using rapid analogue (Aspart or Lispro)`,
    prandialRegimenAr: `إنسولين الوجبات السريع: ${prandialTotalUnits} وحدة/يوم مقسمة ~${mealBolusUnits} وحدات قبل كل وجبة من الوجبات الـ 3 الرئيسية (فطور، غداء، عشاء) باستخدام إنسولين سريع المفعول (نوفورابيد أو هيومالوج)`
  };

  const isFirstTrimesterFolic = !isPostpartum && (weeks <= 12 || trimester === 1);
  const folicAcid = {
    indicated: isFirstTrimesterFolic,
    dose: '5 mg/day orally',
    timing: 'Preconception up to 12 weeks of gestation',
    titleEn: 'High-Dose Folic Acid (5 mg/day) - Early Pregnancy (Weeks 1–12)',
    titleAr: 'حمض الفوليك بجرعة عالية (5 مجم/يوم) - الحمل المبكر (الأسابيع 1–12)',
    messageEn: 'High-dose Folic Acid 5 mg once daily is strongly indicated from preconception through the first 12 weeks of gestation for women with pre-existing diabetes to prevent neural tube defects and major congenital anomalies.',
    messageAr: 'يُوصى بحمض الفوليك بجرعة عالية (5 مجم يومياً) من قبل الحمل وحتى نهاية الأسبوع الـ 12 من الحمل لمرضى السكري للوقاية من تشوهات الأنبوب العصبي والتشوهات الخلقية الكبرى للجنين.'
  };
  if (isFirstTrimesterFolic) {
    alerts.push({
      id: 'dm-preg-folic-acid-high-dose',
      level: 'info',
      type: 'info',
      titleEn: folicAcid.titleEn,
      titleAr: folicAcid.titleAr,
      messageEn: folicAcid.messageEn,
      messageAr: folicAcid.messageAr,
      actionEn: 'Prescribe Folic Acid 5 mg PO once daily through week 12 of pregnancy.',
      actionAr: 'وصف حمض الفوليك 5 مجم يومياً فموياً حتى الأسبوع الـ 12 من الحمل.'
    });
  }

  const postpartumInsulinReductionPercent = 50;
  const postpartumTdd = Math.round(tdd * 0.5 * 10) / 10;
  const postpartumManagement = {
    isPostpartum,
    insulinReductionPercent: postpartumInsulinReductionPercent,
    postpartumTdd,
    insulinReductionEn: `Immediately upon delivery of the placenta, insulin resistance drops precipitously. Reduce insulin doses by ~50% (estimated postpartum TDD: ${postpartumTdd} U/day) or revert to pre-pregnancy regimen to prevent severe maternal hypoglycemia.`,
    insulinReductionAr: `فور خروج المشيمة، تهبط مقاومة الإنسولين هبوطاً حاداً ومفاجئاً. يجب تخفيض جرعة الإنسولين بنسبة 50% فوراً (جرعة النفاس المقدرة: ${postpartumTdd} وحدة/يوم) لتجنب هبوط السكر الحاد المميت.`,
    gdmScreeningEn: 'Postpartum GDM Screening: For women with Gestational Diabetes Mellitus (GDM), perform a 75-g 2-hour Oral Glucose Tolerance Test (OGTT) at 4–12 weeks postpartum to screen for persistent diabetes or prediabetes.',
    gdmScreeningAr: 'فحص سكر النفاس: للسيدات المصابات بسكر الحمل (GDM)، يجب إجراء اختبار تحمل الجلوكوز (75g OGTT) بعد 4 إلى 12 أسبوعاً من الولادة للتأكد من زوال سكر الحمل والكشف عن السكري أو مرحلة ما قبل السكري.'
  };

  if (isPostpartum) {
    alerts.push({
      id: 'dm-postpartum-insulin-cut',
      level: 'warning',
      type: 'warning',
      titleEn: 'Postpartum Insulin Dose Reduction (-50%) & Hypoglycemia Warning',
      titleAr: 'تخفيض جرعة الإنسولين بنسبة 50% بعد الولادة فوراً والتحذير من هبوط السكر',
      messageEn: postpartumManagement.insulinReductionEn,
      messageAr: postpartumManagement.insulinReductionAr,
      actionEn: 'Halve the pre-delivery insulin dose immediately postpartum and monitor blood glucose closely.',
      actionAr: 'قلص جرعة الإنسولين للنصف فوراً وراقب السكر باستمرار.'
    });
    alerts.push({
      id: 'dm-postpartum-gdm-ogtt-screen',
      level: 'info',
      type: 'info',
      titleEn: 'Postpartum GDM 75g OGTT Screening (Weeks 4–12)',
      titleAr: 'فحص سكر الحمل بعد الولادة (اختبار OGTT 75g في الأسبوع 4–12)',
      messageEn: postpartumManagement.gdmScreeningEn,
      messageAr: postpartumManagement.gdmScreeningAr,
      actionEn: 'Order 75g 2-hr OGTT at 4–12 weeks postpartum.',
      actionAr: 'طلب فحص 75g OGTT بعد 4-12 أسبوعاً من الولادة.'
    });
  }

  const obstetricTargets = {
    fasting: 95,
    pp1hr: 140,
    pp2hr: 120,
    fastingMgDl: '<95 mg/dL (<5.3 mmol/L)',
    pp1hrMgDl: '<140 mg/dL (<7.8 mmol/L)',
    pp2hrMgDl: '<120 mg/dL (<6.7 mmol/L)',
    fastingMmol: 5.3,
    pp1hrMmol: 7.8,
    pp2hrMmol: 6.7,
    a1cPercent: 6.0,
    fastingLabel: '< 95 mg/dL',
    pp1hrLabel: '< 140 mg/dL',
    pp2hrLabel: '< 120 mg/dL',
    fastingLabelEn: 'Fasting: < 95 mg/dL (< 5.3 mmol/L)',
    fastingLabelAr: 'سكر الصائم: أقل من 95 مجم/ديسيلتر (< 5.3 مليمول/لتر)',
    pp1hrLabelEn: '1-Hour Postprandial: < 140 mg/dL (< 7.8 mmol/L)',
    pp1hrLabelAr: 'بعد الأكل بساعة: أقل من 140 مجم/ديسيلتر (< 7.8 مليمول/لتر)',
    pp2hrLabelEn: '2-Hour Postprandial: < 120 mg/dL (< 6.7 mmol/L)',
    pp2hrLabelAr: 'بعد الأكل بساعتين: أقل من 120 مجم/ديسيلتر (< 6.7 مليمول/لتر)',
    a1cLabelEn: 'HbA1c Target in Pregnancy: < 6.0% (without significant hypoglycemia)',
    a1cLabelAr: 'السكر التراكمي المستهدف: أقل من 6.0% (دون حدوث هبوط سكر متكرر)'
  };

  return {
    isPregnant,
    isPostpartum,
    trimester,
    gestationalWeeks: weeks,
    dosing: insulinDosing,
    insulinDosing,
    folicAcid,
    postpartumManagement,
    obstetricTargets,
    targets: obstetricTargets,
    stoppedAgents,
    alerts
  };
}

export function calculateInsulin(weightKg: number, sensitivity: 'low' | 'mid' | 'high' = 'mid'): {
  basalStart: number;
  tddStart: number;
} {
  const f = ({ low: [0.1, 0.3], mid: [0.15, 0.4], high: [0.2, 0.5] }[sensitivity]) || [0.15, 0.4];
  const basalStart = Math.max(10, Math.round(weightKg * f[0]));
  const tddStart = Math.round(weightKg * f[1]);
  return { basalStart, tddStart };
}

export function evaluateScreening(p: any): any[] {
  const egfr = parseFloat(String(p.egfr)) || 90;
  const uacr = parseFloat(String(p.uacr)) || 0;
  const a1c = parseFloat(String(p.a1c)) || 7.0;
  const target = parseFloat(String(p.targetA1c || 7.0));

  let kidF = 'Yearly';
  if (egfr < 30) kidF = 'Every 3 months';
  else if (egfr < 45 || uacr > 300) kidF = 'Every 3–4 months';
  else if (egfr < 60 || uacr >= 30) kidF = 'Every 6 months';

  return [
    {
      group: 'Diabetes control',
      items: [
        { test: 'HbA1c', frequency: a1c > target ? 'Every 3 months (above target)' : 'Every 6 months (at target)', why: 'Adjust therapy until at goal' },
        { test: 'Home glucose log', frequency: '2–3 times per week', why: 'Review at each consultation' }
      ]
    },
    {
      group: 'Cardiorenal & Vascular',
      items: [
        { test: 'Kidney check (eGFR & UACR)', frequency: kidF, why: 'Detect and stage diabetic kidney disease early' },
        { test: 'Lipid panel', frequency: 'Yearly', why: 'Assess ASCVD risk and statin response' }
      ]
    },
    {
      group: 'Microvascular complications',
      items: [
        { test: 'Comprehensive dilated eye exam', frequency: 'Yearly by ophthalmologist', why: 'Diabetic retinopathy screening' },
        { test: 'Comprehensive foot exam', frequency: 'Yearly (plus visual inspection each visit)', why: 'Neuropathy and PAD ulcer prevention' }
      ]
    }
  ];
}
`

---

## src\engines\exporters.ts

`typescript
import { calculateBMI } from './calculators';
import { evaluateSafetyGuardrails } from './safety';
import { evaluateLipidPathway } from './lipids';
import { evaluatePrimaryCare } from './primaryCare';
import { evaluatePregnancyHtnProtocol } from './htn';
import { evaluatePregnancyDmProtocol } from './diabetes';
import { FORMULARY } from '../data/formulary';

export interface DoctorSettings {
  doctorName?: string;
  doctorTitle?: string;
  clinicName?: string;
  clinicPhone?: string;
}

export const DEFAULT_DOCTOR_SETTINGS: DoctorSettings = {
  doctorName: 'د. حسام يوسف / Dr. Hossam Yousuf',
  doctorTitle: 'استشاري طب الأسرة / Consultant Family Medicine',
  clinicName: 'عيادة طب الأسرة والتخصصات الباطنية',
  clinicPhone: '+966 50 000 0000'
};

export function loadSettings(): DoctorSettings {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('osrawy_settings');
      if (saved) return { ...DEFAULT_DOCTOR_SETTINGS, ...JSON.parse(saved) };
    } catch {}
  }
  return DEFAULT_DOCTOR_SETTINGS;
}

export function saveSettings(settings: DoctorSettings): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('osrawy_settings', JSON.stringify(settings));
    } catch {}
  }
}

export function buildPrescriptionReport(lang: 'ar' | 'en' = 'ar', patientOverride?: any, settingsOverride?: DoctorSettings): string {
  const isAr = (lang === 'ar');
  const cfg = settingsOverride || loadSettings();
  const pt = patientOverride || {};
  const bmiCalc = calculateBMI(pt.wt || 70, pt.ht || 170);
  const bmi = bmiCalc ? bmiCalc.bmi : '—';
  const dateStr = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const syncGuardrails = evaluateSafetyGuardrails(pt);
  let lipidReport: any = null;
  try {
    lipidReport = evaluateLipidPathway(pt);
  } catch {}

  let pcReport: any = null;
  try {
    pcReport = evaluatePrimaryCare(pt);
  } catch {}

  const allAlerts = [
    ...syncGuardrails,
    ...(lipidReport?.alerts || []),
    ...(pcReport?.allAlerts || [])
  ];

  let text = '';

  if (isAr) {
    text += `🏥 *${cfg.clinicName || 'عيادة طب الأسرة والتخصصات الباطنية'}*\n`;
    text += `👨‍⚕️ *${cfg.doctorName}*\n`;
    text += `_${cfg.doctorTitle}_\n`;
    if (cfg.clinicPhone) text += `📞 هاتف العيادة: ${cfg.clinicPhone}\n`;
    text += `📅 التاريخ: ${dateStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `👤 *بيانات المريض والعلامات الحيوية:*\n`;
    text += `• الاسم: ${pt.name || 'مريض جديد'} | الجنس: ${pt.sex === 'f' ? 'أنثى' : 'ذكر'} | العمر: ${pt.age || '-'} سنة\n`;
    text += `• الوزن: ${pt.wt || '-'} كجم | الطول: ${pt.ht || '-'} سم | كتلة الجسم (BMI): ${bmi}\n`;
    text += `• ضغط الدم: ${pt.sbp || 148}/${pt.dbp || 94} mmHg | البوتاسيوم: ${pt.k || 4.6} mEq/L\n`;
    text += `• وظائف الكلى (eGFR): ${pt.egfr || '-'} مل/د | زلال البول (UACR): ${pt.uacr || '-'} مجم/جم\n`;
    if (pt.a1c) text += `• السكر التراكمي (HbA1c): ${pt.a1c}% | سكر الصائم: ${pt.fpg || '—'} مجم/dL\n`;
    if (lipidReport) {
      text += `• الدهون: الكلي ${lipidReport.labs.tcMg} | LDL: ${lipidReport.labs.ldlMg} | HDL: ${lipidReport.labs.hdlMg} | TG: ${lipidReport.labs.tgMg} مجم/dL\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `🎯 *الأهداف العلاجية المستهدفة (Targets):*\n`;
    text += `• ضغط الدم المستهدف: أقل من 130/80 mmHg\n`;
    text += `• السكر التراكمي المستهدف: أقل من 7.0% (أو حسب الحالة)\n`;
    if (lipidReport) {
      text += `• الكوليسترول الضار المستهدف: < ${lipidReport.target.ldlTargetMg} مجم/dL (${lipidReport.target.nameAr})\n`;
      text += `• الكوليسترول غير المفيد (Non-HDL): < ${lipidReport.target.nonHdlTargetMg} مجم/dL\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `💊 *الخطة الدوائية المعتمدة (Rx):*\n\n`;

    const activeMedsList: string[] = (pt.activeMeds && pt.activeMeds.length > 0)
      ? pt.activeMeds
      : (pt.meds || pt.currentMeds || pt.medications || []);

    if (activeMedsList.length > 0) {
      text += `🔹 *الأدوية الحالية للمريض (Active Medications):*\n`;
      activeMedsList.forEach((medId, idx) => {
        const drug = FORMULARY.find((f: any) => f.id.toLowerCase() === medId.toLowerCase() || (f.genericEn && f.genericEn.toLowerCase().includes(medId.toLowerCase())));
        if (drug) {
          const brand = drug.tradeNamesAr?.[0] || drug.tradeNamesEn?.[0] || drug.genericAr || drug.genericEn;
          text += `  ${idx + 1}. *${drug.genericAr || drug.genericEn}* (${brand}) - ${drug.doseAr || drug.doseEn}\n`;
        } else {
          text += `  ${idx + 1}. *${medId}*\n`;
        }
      });
      text += `\n`;
    }

    if (pt.pregnancy || pt.preg || pt.pregHtn || pt.postpartum) {
      let htnPreg: any = null;
      let dmPreg: any = null;
      try { htnPreg = evaluatePregnancyHtnProtocol(pt); } catch {}
      try { dmPreg = evaluatePregnancyDmProtocol(pt); } catch {}

      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `🌸 *بروتوكول صحة المرأة والحمل (Women's Health Protocol):*\n`;
      if (pt.postpartum) {
        text += `• الحالة السريرية: رعاية ما بعد الولادة (فترة النفاس - Postpartum)\n`;
      } else {
        text += `• الحالة السريرية: حمل نشط (عمر الحمل: ${pt.gestationalWeeks || 16} أسبوعاً - الثلث ${pt.trimester || 2})\n`;
      }

      if (htnPreg) {
        text += `\n🩺 *خطة علاج الضغط أثناء الحمل والبدائل الآمنة:*\n`;
        if (htnPreg.firstLine) {
          text += `• العلاج المعتمد: ${htnPreg.firstLine.drugNameAr} - ${htnPreg.firstLine.doseAr}\n`;
          text += `• المبرر السريري: ${htnPreg.firstLine.reasonAr}\n`;
        }
        if (htnPreg.aspirinProphylaxis?.indicated) {
          text += `• الوقاية من تسمم الحمل: أسبرين أطفال (81-150 مجم يومياً قبل النوم حتى الأسبوع 36)\n`;
        }
        if (htnPreg.stoppedDrugs?.length) {
          text += `• أدوية محظورة وموقوفة فوراً: ${htnPreg.stoppedDrugs.join('، ')}\n`;
        }
      }

      if (dmPreg) {
        text += `\n🩸 *خطة علاج السكر أثناء الحمل وحساب الإنسولين:*\n`;
        text += `• الأهداف السكرية أثناء الحمل: ${dmPreg.obstetricTargets.fastingLabelAr} | ${dmPreg.obstetricTargets.pp1hrLabelAr} | ${dmPreg.obstetricTargets.pp2hrLabelAr}\n`;
        text += `• جرعة الإنسولين المحسوبة بالوزن: ${dmPreg.insulinDosing.tddUnits} وحدة/يوم (${dmPreg.insulinDosing.multiplier} وحدة/كجم)\n`;
        text += `  - ${dmPreg.insulinDosing.basalRegimenAr}\n`;
        text += `  - ${dmPreg.insulinDosing.prandialRegimenAr}\n`;
        if (dmPreg.folicAcid?.indicated) {
          text += `• حمض الفوليك: جرعة عالية 5 مجم يومياً حتى نهاية الأسبوع 12 من الحمل.\n`;
        }
      }
      text += `\n`;
    }

    if (allAlerts.length > 0) {
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `⚠️ *تنبيهات السلامة الدوائية والموانع (Safety Guardrails):*\n`;
      allAlerts.forEach(a => {
        const icon = a.level === 'critical' ? '🚨' : (a.level === 'warning' ? '⚠️' : '💡');
        text += `${icon} *${a.titleAr || a.titleEn}*\n`;
        text += `   ${a.messageAr || a.messageEn}\n`;
      });
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💡 *إرشادات المريض وسلامة العلاج:*\n`;
    text += `• قاعدة 15 لعلاج هبوط السكر: تناول 15 جرام سكر سريع، استرح 15 دقيقة، وأعد الفحص.\n`;
    text += `• قواعد أيام المرض (SADMANS): أوقف مؤقتاً مدرات البول وأدوية الضغط والسكري عند القيء الشديد أو الجفاف وتواصل مع العيادة.\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_تم إصدار التقرير عبر المنصة السريرية الذكية - Osrawy Clinical Navigator_\n`;
  } else {
    text += `🏥 *${cfg.clinicName || 'Family Medicine & Internal Specialties Clinic'}*\n`;
    text += `👨‍⚕️ *${cfg.doctorName}*\n`;
    text += `_${cfg.doctorTitle}_\n`;
    if (cfg.clinicPhone) text += `📞 Clinic Phone: ${cfg.clinicPhone}\n`;
    text += `📅 Date: ${dateStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `👤 *Patient Profile & Clinical Vitals:*\n`;
    text += `• Name: ${pt.name || 'New Patient'} | Sex: ${pt.sex === 'f' ? 'Female' : 'Male'} | Age: ${pt.age || '-'} years\n`;
    text += `• Weight: ${pt.wt || '-'} kg | Height: ${pt.ht || '-'} cm | BMI: ${bmi}\n`;
    text += `• Blood Pressure: ${pt.sbp || 148}/${pt.dbp || 94} mmHg | Serum K+: ${pt.k || 4.6} mEq/L\n`;
    text += `• Renal Function (eGFR): ${pt.egfr || '-'} mL/min/1.73m² | UACR: ${pt.uacr || '-'} mg/g\n`;
    if (pt.a1c) text += `• Glycated Hemoglobin (HbA1c): ${pt.a1c}% | FPG: ${pt.fpg || '—'} mg/dL\n`;
    if (lipidReport) {
      text += `• Lipid Panel: TC ${lipidReport.labs.tcMg} | LDL-C: ${lipidReport.labs.ldlMg} | HDL-C: ${lipidReport.labs.hdlMg} | TG: ${lipidReport.labs.tgMg} mg/dL\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `🎯 *Clinical Targets & Quality Measures:*\n`;
    text += `• Target Blood Pressure: < 130/80 mmHg\n`;
    text += `• Target HbA1c: < 7.0% (individualized)\n`;
    if (lipidReport) {
      text += `• Target LDL-C: < ${lipidReport.target.ldlTargetMg} mg/dL (${lipidReport.target.nameEn})\n`;
      text += `• Target Non-HDL: < ${lipidReport.target.nonHdlTargetMg} mg/dL\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `💊 *Prescribed Medications & Management Plan (Rx):*\n\n`;

    const activeMedsList: string[] = (pt.activeMeds && pt.activeMeds.length > 0)
      ? pt.activeMeds
      : (pt.meds || pt.currentMeds || pt.medications || []);

    if (activeMedsList.length > 0) {
      text += `🔹 *Active Patient Medications:*\n`;
      activeMedsList.forEach((medId, idx) => {
        const drug = FORMULARY.find((f: any) => f.id.toLowerCase() === medId.toLowerCase() || (f.genericEn && f.genericEn.toLowerCase().includes(medId.toLowerCase())));
        if (drug) {
          const brand = drug.tradeNamesAr?.[0] || drug.tradeNamesEn?.[0] || drug.genericAr || drug.genericEn;
          text += `  ${idx + 1}. *${drug.genericAr || drug.genericEn}* (${brand}) - ${drug.doseAr || drug.doseEn}\n`;
        } else {
          text += `  ${idx + 1}. *${medId}*\n`;
        }
      });
      text += `\n`;
    }

    if (pt.pregnancy || pt.preg || pt.pregHtn || pt.postpartum) {
      let htnPreg: any = null;
      let dmPreg: any = null;
      try { htnPreg = evaluatePregnancyHtnProtocol(pt); } catch {}
      try { dmPreg = evaluatePregnancyDmProtocol(pt); } catch {}

      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `🌸 *Women's Health & Pregnancy Switching Protocol:*\n`;
      if (pt.postpartum) {
        text += `• Clinical Status: Postpartum Care\n`;
      } else {
        text += `• Clinical Status: Active Pregnancy (Gestational Age: ${pt.gestationalWeeks || 16} weeks - Trimester ${pt.trimester || 2})\n`;
      }

      if (htnPreg) {
        text += `\n🩺 *Hypertension in Pregnancy & Switching Strategy:*\n`;
        if (htnPreg.firstLine) {
          text += `• Recommended First-Line: ${htnPreg.firstLine.drugName} - ${htnPreg.firstLine.doseEn}\n`;
          text += `• Clinical Rationale: ${htnPreg.firstLine.reasonEn}\n`;
        }
        if (htnPreg.aspirinProphylaxis?.indicated) {
          text += `• Preeclampsia Prophylaxis: Low-dose Aspirin (81–150 mg/day at bedtime through 36 weeks)\n`;
        }
        if (htnPreg.stoppedDrugs?.length) {
          text += `• Teratogens Stopped: ${htnPreg.stoppedDrugs.join(', ')}\n`;
        }
      }

      if (dmPreg) {
        text += `\n🩸 *Diabetes in Pregnancy & Switching Strategy:*\n`;
        text += `• Obstetric Glycemic Targets: ${dmPreg.obstetricTargets.fastingLabelEn} | ${dmPreg.obstetricTargets.pp1hrLabelEn} | ${dmPreg.obstetricTargets.pp2hrLabelEn}\n`;
        text += `• Calculated Weight-Based Insulin: TDD ${dmPreg.insulinDosing.tddUnits} U/day (${dmPreg.insulinDosing.multiplier} U/kg/day)\n`;
        text += `  - ${dmPreg.insulinDosing.basalRegimenEn}\n`;
        text += `  - ${dmPreg.insulinDosing.prandialRegimenEn}\n`;
        if (dmPreg.folicAcid?.indicated) {
          text += `• Folic Acid: High-dose 5 mg/day orally through week 12 of pregnancy.\n`;
        }
      }
      text += `\n`;
    }

    if (allAlerts.length > 0) {
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `⚠️ *Clinical Safety Guardrails & Drug Precautions:*\n`;
      allAlerts.forEach(a => {
        const icon = a.level === 'critical' ? '🚨' : (a.level === 'warning' ? '⚠️' : '💡');
        text += `${icon} *${a.titleEn}*\n`;
        text += `   ${a.messageEn}\n`;
      });
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💡 *Patient Instructions & Safety Rules:*\n`;
    text += `• Rule of 15 for Hypoglycemia: If feeling shaky or dizzy, take 15g fast carbohydrate (1/2 cup juice) and recheck in 15 minutes.\n`;
    text += `• Sick-Day Rules (SADMANS): Hold SGLT2i, ACEi/ARBs, and diuretics during vomiting or dehydration.\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Issued via Osrawy Clinical Navigator Interactive Multi-Engine Platform_\n`;
  }

  return text;
}

export function buildStructuredSoapNote(patient: any, engines?: { diabetes?: any; htn?: any; lipids?: any; primaryCare?: any }): string {
  const p = patient || {};
  const dateStr = new Date().toISOString().split('T')[0];

  let note = `═══════════════════════════════════════════════════════════════\n`;
  note += `OSRAWY CLINICAL SOAP NOTE · ${dateStr}\n`;
  note += `Patient: ${p.name || 'Anonymous'} · Age: ${p.age || '-'} · Sex: ${p.sex === 'f' ? 'F' : 'M'}\n`;
  note += `═══════════════════════════════════════════════════════════════\n\n`;

  note += `[S] SUBJECTIVE:\n`;
  note += `• Primary complaints & chronic disease follow-up.\n`;
  if (p.smoker) note += `• Active smoker.\n`;
  if (p.ascvd) note += `• Established ASCVD history.\n`;
  if (p.pregnancy) note += `• Active pregnancy (Gestational age: ${p.gestationalWeeks || '-'} weeks).\n`;
  note += `\n`;

  note += `[O] OBJECTIVE:\n`;
  note += `• BP: ${p.sbp || '-'}/${p.dbp || '-'} mmHg | K+: ${p.k || '-'} mEq/L\n`;
  note += `• Weight: ${p.wt || '-'} kg | Height: ${p.ht || '-'} cm\n`;
  note += `• Renal: eGFR ${p.egfr || '-'} mL/min/1.73m² | UACR ${p.uacr || '-'} mg/g\n`;
  if (p.a1c) note += `• Glycemic: HbA1c ${p.a1c}% | FPG ${p.fpg || '-'} mg/dL\n`;
  if (p.tc || p.totalCholesterol) note += `• Lipids: TC ${p.tc || p.totalCholesterol} | LDL ${p.ldlC || p.ldl || '-'} | HDL ${p.hdlC || p.hdl || '-'} | TG ${p.triglycerides || p.tg || '-'}\n`;
  note += `\n`;

  note += `[A] ASSESSMENT:\n`;
  const guardrails = evaluateSafetyGuardrails(p);
  if (guardrails.length > 0) {
    note += `• Safety Alerts:\n`;
    guardrails.forEach(g => {
      note += `  - [${g.level.toUpperCase()}] ${g.titleEn}: ${g.actionEn}\n`;
    });
  }
  if (engines?.lipids?.stratification) {
    note += `• Dyslipidemia: ${engines.lipids.stratification.tier} Risk (LDL Target < ${engines.lipids.target.ldlTargetMg} mg/dL)\n`;
  }
  note += `\n`;

  note += `[P] PLAN:\n`;
  const activeMeds = p.medications || p.activeMeds || [];
  if (activeMeds.length > 0) {
    note += `• Active Medications: ${activeMeds.join(', ')}\n`;
  }
  note += `• Targets: BP < 130/80 mmHg, HbA1c < 7.0%\n`;
  note += `• Follow-up: Repeat labs in 4–12 weeks. Reinforce SADMANS sick-day rules.\n`;

  return note;
}

export function buildWhatsAppShareUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
`

---

## src\engines\htn.ts

`typescript
export function evaluatePregnancyHtnProtocol(patientInput: any): any {
  const pt = patientInput || {};
  const sbp = parseFloat(String(pt.sbp !== undefined ? pt.sbp : (pt.s !== undefined ? pt.s : 148))) || 0;
  const dbp = parseFloat(String(pt.dbp !== undefined ? pt.dbp : (pt.d !== undefined ? pt.d : 94))) || 0;
  const isPregnant = !!(pt.pregnancy || pt.preg || pt.isPregnant || pt.pregHtn || (pt.comorbidities && pt.comorbidities.pregnancy));
  const isPostpartum = !!(pt.postpartum || (pt.comorbidities && pt.comorbidities.postpartum));
  const weeks = parseFloat(String(pt.gestationalWeeks !== undefined ? pt.gestationalWeeks : (pt.weeks !== undefined ? pt.weeks : 16))) || 16;
  const hasAsthma = !!(pt.asthma || (pt.comorbidities && pt.comorbidities.asthma));
  const medsRaw = pt.medications || pt.activeMeds || pt.meds || pt.currentMeds || [];
  const meds: string[] = Array.isArray(medsRaw) ? medsRaw.map(m => String(m).toLowerCase()) : [];

  const alerts: any[] = [];
  const stoppedDrugs: string[] = [
    'ACE inhibitors (e.g. Perindopril, Ramipril)',
    'ARBs (e.g. Valsartan, Losartan)',
    'MRAs (e.g. Spironolactone)',
    'Thiazides / Thiazide-like diuretics (e.g. Indapamide, HCTZ)'
  ];

  const detectedTeratogens = meds.filter(m =>
    m.includes('valsartan') || m.includes('ramipril') || m.includes('indapamide') || m.includes('ace') || m.includes('arb')
  );
  if (detectedTeratogens.length > 0 || isPregnant) {
    alerts.push({
    id: 'htn-preg-teratogenic-stop',
    code: 'STOP_TERATOGENIC_HTN_MEDS',
    level: 'critical',
    type: 'critical',
    titleEn: 'Teratogenic Alert: Stop ACEi, ARB, MRA & Thiazides Immediately',
    titleAr: 'تنبيه تشوه الأجنة الحرج: إيقاف أدوية ACEi و ARB والسبيرونولاكتون ومدرات البول فوراً',
    messageEn: 'ACE inhibitors, ARBs, MRAs (Spironolactone), and Thiazide diuretics are contraindicated in pregnancy due to severe fetotoxicity (renal dysgenesis, oligohydramnios, skull hypoplasia, and neonatal death). Immediately discontinue and switch to pregnancy-safe antihypertensives (Labetalol, Nifedipine ER, or Methyldopa).',
    messageAr: 'مثبطات ACE، حاصرات ARB، مضادات MRA (سبيرونولاكتون)، ومدرات البول الثيازيدية محظورة تماماً في الحمل لتسببها بتشوهات جنينية قاتلة في الكلى وعظام الجمجمة. أوقفها فوراً واستبدلها بأدوية ضغط آمنة للحمل.',
    actionEn: 'Discontinue ACEi/ARB/MRA/Thiazides immediately; initiate Labetalol or Nifedipine ER.',
    actionAr: 'أوقف هذه الأدوية فوراً وابدأ لابيتاول أو نيفيديبين ممتد المفعول.'
  });
  }

  // 2. Severe obstetric HTN emergency alert (>= 160/110)
  const isSevereEmergency = (sbp >= 160 || dbp >= 110);
  if (isSevereEmergency) {
    alerts.push({
      id: 'htn-preg-severe-emergency',
      code: 'OBSTETRIC_HYPERTENSIVE_EMERGENCY',
      level: 'critical',
      type: 'critical',
      titleEn: 'OBSTETRIC EMERGENCY: Severe Hypertension (BP ≥ 160/110 mmHg)',
      titleAr: 'طوارئ نسائية وتوليد حرجة: ارتفاع ضغط شديد حاد (≥ 160/110)',
      messageEn: `Blood pressure is ${sbp}/${dbp} mmHg (≥ 160/110 mmHg). Immediate acute blood pressure lowering is required within 30–60 minutes to prevent maternal intracranial hemorrhage, stroke, encephalopathy, and placental abruption. First-line IV therapy: IV Labetalol (20 mg IV push, repeat 40–80 mg q10min up to 300 mg) OR IV Hydralazine (5–10 mg IV push) OR oral rapid Nifedipine ER/capsule 10–20 mg PO. Start Magnesium Sulfate for seizure prophylaxis if preeclampsia with severe features. Transfer urgently to labor & delivery / obstetric HDU.`,
      messageAr: `ضغط الدم ${sbp}/${dbp} ملم زئبق (≥ 160/110). يتطلب تدخلاً علاجياً عاجلاً خلال 30 إلى 60 دقيقة لحماية الأم من النزيف الدماغي والسكتة الدماغية وانفصال المشيمة. العلاج الإسعافي: لابيتاول وريدي (IV Labetalol) أو هيدرالازين وريدي أو نيفيديبين 10-20 مجم فموياً، مع كبريتات المغنيسيوم (Magnesium Sulfate) لحماية الأم من التشنجات (Eclampsia). تحويل عاجل لقسم الولادة.`,
      actionEn: 'Administer IV Labetalol or IV Hydralazine / oral Nifedipine; evaluate for preeclampsia with severe features.',
      actionAr: 'إعطاء لابيتاول وريدي أو هيدرالازين وريدي، وتقييم تسمم الحمل الشديد وإعطاء كبريتات المغنيسيوم.'
    });
  }

  // 3. Postpartum Methyldopa depression warning
  let methyldopaDepressionWarning: any = null;
  if (isPostpartum) {
    methyldopaDepressionWarning = {
      id: 'htn-postpartum-methyldopa-depression',
      level: 'warning',
      type: 'warning',
      titleEn: 'Postpartum Warning: Avoid Methyldopa (Depression & Sedation Risk)',
      titleAr: 'تحذير فترة النفاس: تجنب ميثيل دوبا (خطر اكتئاب ما بعد الولادة)',
      messageEn: 'Methyldopa is strongly associated with an increased risk of severe postpartum depression (PPD), sedation, and psychomotor impairment. Avoid Methyldopa during the postpartum period, especially in women with personal or family history of mood disorders. Preferred postpartum antihypertensives compatible with breastfeeding: Labetalol, Enalapril, or Nifedipine ER.',
      messageAr: 'يرتبط عقار ميثيل دوبا (Methyldopa) بزيادة خطر الإصابة باكتئاب ما بعد الولادة (Postpartum Depression) والخمول الشديد. تجنب ميثيل دوبا بعد الولادة تماماً، ويفضل استخدام لابيتاول أو إنالابريل أو نيفيديبين ممتد المفعول، وهي آمنة تماماً مع الرضاعة الطبيعية.',
      actionEn: 'Avoid/taper Methyldopa postpartum; use Labetalol, Enalapril, or Nifedipine ER (breastfeeding safe).',
      actionAr: 'تجنب ميثيل دوبا بعد الولادة واستخدم لابيتاول أو إنالابريل أو نيفيديبين ممتد المفعول.'
    };
    alerts.push(methyldopaDepressionWarning);
  }

  // 4. Preeclampsia Aspirin prophylaxis (weeks 12-36)
  const aspirinIndicated = !isPostpartum && (weeks >= 12 && weeks <= 36);
  const aspirinProphylaxis = {
    indicated: aspirinIndicated,
    dose: '81–162 mg once daily at bedtime (recommended: 81–150 mg/day)',
    timing: 'Start between weeks 12 and 16, continue until 36 weeks (or delivery)',
    titleEn: 'Preeclampsia Prevention: Low-Dose Aspirin Prophylaxis (Weeks 12–36)',
    titleAr: 'الوقاية من تسمم الحمل: أسبرين أطفال وقائي (الأسابيع 12–36)',
    messageEn: `Gestational age is ${weeks} weeks (within the critical 12–36 weeks window). Low-dose Aspirin (81–150 mg/day, taken at bedtime) is strongly recommended for women with chronic hypertension, gestational hypertension, prior preeclampsia, diabetes, or multiple gestation to significantly reduce the risk of preeclampsia, preterm birth, and fetal growth restriction.`,
    messageAr: `عمر الحمل ${weeks} أسبوعاً (ضمن الفترة المستهدفة 12–36 أسبوعاً). يُوصى بشدة ببدء أسبرين الأطفال (81-150 مجم يومياً قبل النوم) للوقاية من تسمم الحمل (Preeclampsia) وتأخر نمو الجنين والولادة المبكرة.`
  };
  if (aspirinIndicated) {
    alerts.push({
      id: 'htn-preg-aspirin-prophylaxis',
      level: 'info',
      type: 'info',
      titleEn: aspirinProphylaxis.titleEn,
      titleAr: aspirinProphylaxis.titleAr,
      messageEn: aspirinProphylaxis.messageEn,
      messageAr: aspirinProphylaxis.messageAr,
      actionEn: 'Prescribe Aspirin 81–150 mg PO daily at bedtime until 36 weeks gestation.',
      actionAr: 'وصف أسبرين أطفال 81-150 مجم يومياً قبل النوم حتى الأسبوع 36 من الحمل.'
    });
  }

  // 5. Asthma-aware first-line selection
  let firstLineDrug: any = {};
  if (hasAsthma) {
    firstLineDrug = {
      drugId: 'nifedipine_er',
      drugName: 'Nifedipine Extended-Release (ER)',
      drugNameAr: 'نيفيديبين ممتد المفعول (Nifedipine ER)',
      tradeNames: ['Adalat LA', 'Procardia XL', 'Epilat Retard'],
      doseEn: '30 mg orally once daily (titrate up to 60–90 mg once daily as needed; max 120 mg/day)',
      doseAr: '30 مجم فموياً مرة واحدة يومياً صباحاً (يمكن زيادتها إلى 60-90 مجم عند الحاجة، الجرعة القصوى 120 مجم)',
      reasonEn: 'Maternal asthma present: Beta-blockers (including Labetalol) carry significant bronchospasm risk and are contraindicated/avoided. Nifedipine ER (dihydropyridine CCB) is the preferred asthma-safe first-line antihypertensive in pregnancy.',
      reasonAr: 'المريضة تعاني من الربو الشعبي: تُمنع حاصرات بيتا (بما فيها لابيتاول) لخطر التشنج الشعبي الحاد. نيفيديبين ممتد المفعول (Nifedipine ER) هو الخيار الأول الآمن لمرضى الربو والحمل.',
      asthmaAware: true
    };
  } else {
    firstLineDrug = {
      drugId: 'labetalol',
      drugName: 'Labetalol',
      drugNameAr: 'لابيتاول (Labetalol)',
      tradeNames: ['Trandate', 'Labetalol'],
      doseEn: '100–200 mg orally twice daily (titrate weekly up to 400–800 mg twice daily; max 2400 mg/day)',
      doseAr: '100–200 مجم فموياً مرتين يومياً (تتم المعايرة تدريجياً حتى 400-800 مجم مرتين يومياً؛ الحد الأقصى 2400 مجم/يوم)',
      reasonEn: 'First-line standard oral antihypertensive for chronic/gestational hypertension in pregnancy. Safe in non-asthmatic mothers.',
      reasonAr: 'الخيار العلاجي الأول القياسي لارتفاع ضغط الدم أثناء الحمل للأمهات غير المصابات بالربو الشعبي.',
      asthmaAware: false
    };
  }

  const alternativeDrugs = [
    {
      drugName: 'Methyldopa (Aldomet)',
      drugNameAr: 'ميثيل دوبا (ألدوميت)',
      doseEn: '250 mg orally twice or thrice daily (max 2000–3000 mg/day)',
      doseAr: '250 مجم فموياً مرتين إلى ثلاث مرات يومياً (الحد الأقصى 2000-3000 مجم/يوم)',
      notesEn: 'Established fetal safety record; note sedation side-effect and avoid postpartum due to depression risk.',
      notesAr: 'آمن تاريخياً على الجنين، يسبب الخمول، ويُمنع في فترة النفاس لتجنب اكتئاب ما بعد الولادة.'
    },
    {
      drugName: hasAsthma ? 'Hydralazine' : 'Nifedipine ER',
      drugNameAr: hasAsthma ? 'هيدرالازين' : 'نيفيديبين ممتد المفعول',
      doseEn: hasAsthma ? '10–25 mg orally 3–4 times daily' : '30–60 mg orally once daily',
      doseAr: hasAsthma ? '10–25 مجم 3-4 مرات يومياً' : '30–60 مجم مرة واحدة يومياً'
    }
  ];

  const steps: any[] = [];

  if (isPregnant && (weeks >= 12 && weeks <= 36)) {
    steps.push({
      code: 'PREECLAMPSIA_ASPIRIN_PROPHYLAXIS',
      step: 0,
      titleEn: 'Preeclampsia Prevention: Low-Dose Aspirin Prophylaxis (Weeks 12–36)',
      titleAr: 'الوقاية من تسمم الحمل: أسبرين أطفال وقائي (الأسابيع 12–36)',
      drugEn: 'Aspirin 81–150 mg daily at bedtime',
      drugAr: 'أسبرين أطفال 81-150 مجم يومياً قبل النوم',
      timing: 'Weeks 12 to 36',
      descriptionEn: 'Start between weeks 12 and 16, continue until 36 weeks gestation or delivery.'
    });
  }

  if (hasAsthma) {
    steps.push({
      code: 'PREGNANCY_HTN_STEP_1_NIFEDIPINE',
      step: 1,
      drugId: 'nifedipine_er',
      drugEn: 'Nifedipine ER 30 mg PO once daily',
      drugAr: 'نيفيديبين ممتد المفعول 30 مجم فموياً مرة واحدة يومياً',
      titleEn: 'Step 1 (Asthma-Aware): Nifedipine ER',
      titleAr: 'الخطوة الأولى (مع مراعاة الربو): نيفيديبين ممتد المفعول',
      reasonEn: 'Maternal asthma present: Beta-blockers (Labetalol) carry significant bronchospasm risk and are contraindicated/avoided. Nifedipine ER (dihydropyridine CCB) is the preferred asthma-safe first-line antihypertensive in pregnancy.',
      reasonAr: 'المريضة تعاني من الربو: لابيتاول ممنوع لتجنب نوبات الربو والتشنج الشعبي. نيفيديبين ممتد المفعول هو الخيار الأول الآمن.'
    });
  } else {
    steps.push({
      code: 'PREGNANCY_HTN_STEP_1_LABETALOL',
      step: 1,
      drugId: 'labetalol',
      drugEn: 'Labetalol 100–200 mg PO twice daily',
      drugAr: 'لابيتاول 100-200 مجم فموياً مرتين يومياً',
      titleEn: 'Step 1: Labetalol',
      titleAr: 'الخطوة الأولى: لابيتاول',
      reasonEn: 'First-line standard oral antihypertensive for chronic/gestational hypertension in pregnancy.',
      reasonAr: 'الخيار العلاجي الأول القياسي لارتفاع ضغط الدم أثناء الحمل.'
    });
  }

  return {
    isPregnant,
    isPostpartum,
    gestationalWeeks: weeks,
    hasAsthma,
    isSevereEmergency,
    firstLine: firstLineDrug,
    firstLineSelection: firstLineDrug,
    firstLineDrug,
    alternatives: alternativeDrugs,
    aspirinProphylaxis,
    methyldopaDepressionWarning,
    stoppedDrugs,
    alerts,
    steps
  };
}

export function classifyBp(sbp: number, dbp: number, lens: 'acc' | 'esc' = 'acc'): { label: string; stage: number; isSevere: boolean } {
  if (sbp >= 180 || dbp >= 120) {
    return { label: 'Severe hypertension', stage: 3, isSevere: true };
  }
  if (lens === 'acc') {
    if (sbp >= 140 || dbp >= 90) return { label: 'Stage 2 hypertension', stage: 2, isSevere: false };
    if (sbp >= 130 || dbp >= 80) return { label: 'Stage 1 hypertension', stage: 1, isSevere: false };
    if (sbp >= 120) return { label: 'Elevated BP', stage: 0.5, isSevere: false };
    return { label: 'Normal BP', stage: 0, isSevere: false };
  } else {
    if (sbp >= 140 || dbp >= 90) return { label: 'Hypertension', stage: 2, isSevere: false };
    if (sbp >= 120 || dbp >= 70) return { label: 'Elevated BP', stage: 1, isSevere: false };
    return { label: 'Non-elevated BP', stage: 0, isSevere: false };
  }
}

export function calculateSwitch(fromDrug: string, toDrug: string): string[] {
  const notes: string[] = [];
  const from = (fromDrug || '').toLowerCase();
  const to = (toDrug || '').toLowerCase();

  if (from === to) return ['Same drug selected.'];
  if (from.includes('ace') && to.includes('arni')) {
    notes.push('Stop the ACE inhibitor and wait at least 36 hours before the first dose of sacubitril/valsartan (angioedema risk).');
  } else if (from.includes('arni') && to.includes('ace')) {
    notes.push('Wait at least 36 hours after the last sacubitril/valsartan dose before starting the ACE inhibitor.');
  } else if (from.includes('arb') && to.includes('arni')) {
    notes.push('Stop the ARB and give sacubitril/valsartan at the time of the next scheduled dose. Do not give both.');
  } else if (from.includes('ace') && to.includes('arb')) {
    notes.push('Stop the ACE inhibitor and start the ARB the next day; no washout needed. If the reason is angioedema, an ARB carries a small risk of recurrence: discuss with a specialist or use another class.');
  } else {
    notes.push('Stop the old drug and start the new one at the next scheduled dose; monitor BP and electrolytes within 2–4 weeks.');
  }
  return notes;
}
`

---

## src\engines\index.ts

`typescript
export * from './calculators';
export * from './safety';
export * from './lipids';
export * from './primaryCare';
export * from './tools';
export * from './qr';
export * from './leaflets';
export * from './htn';
export * from './diabetes';
export * from './exporters';
`

---

## src\engines\leaflets.ts

`typescript
export interface PatientTargets {
  patientName: string;
  age: number | string;
  dm: {
    currentA1c: string;
    targetA1c: string;
    targetDescAr: string;
    targetDescEn: string;
    currentFpg: string;
    targetFpg: string;
    targetPpg: string;
    currentEgfr: string;
  };
  htn: {
    currentBp: string;
    targetBp: string;
    targetHomeBp: string;
    targetHomeBpEn: string;
    currentK: string;
  };
  dlp: {
    riskTier: string;
    riskTierAr: string;
    targetLdl: string;
    targetNonHdl: string;
    targetTg: string;
    currentTc: string;
    currentHdl: string;
  };
}

export function getDynamicTargets(pt?: any): PatientTargets {
  const p = pt || {};
  const age = parseFloat(String(p.age)) || 52;
  const isElderlyOrFrail = (age >= 65) || !!p.frail;

  const a1cTarget = isElderlyOrFrail ? '< 7.5% - 8.0%' : '< 7.0%';
  const a1cTargetDescAr = isElderlyOrFrail ? 'هدف مرن لتجنب الهبوط ومضاعفاته لكبار السن' : 'الهدف المعياري لحماية الشرايين والكلى وشبكية العين';
  const a1cTargetDescEn = isElderlyOrFrail ? 'Relaxed target to prevent hypoglycemia in older adults' : 'Standard target to prevent vascular and microvascular complications';
  const fpgTarget = '80 - 130 mg/dL (4.4 - 7.2 mmol/L)';
  const ppgTarget = '< 180 mg/dL (< 10.0 mmol/L)';

  const bpTarget = isElderlyOrFrail ? '< 135/85 mmHg (130-139 / 70-79)' : '< 130/80 mmHg';
  const homeBpTarget = '< 130/80 mmHg (متوسط القراءات المنزلية)';
  const homeBpTargetEn = '< 130/80 mmHg (average home readings)';

  let ldlTargetMg = 70;
  let ldlRiskTier = 'High Risk';
  let ldlRiskTierAr = 'عالي الخطورة (وجود سكري)';
  if (p.ascvd || (p.egfr && parseFloat(String(p.egfr)) < 45)) {
    ldlTargetMg = 55;
    ldlRiskTier = 'Very High Risk (Established ASCVD / CKD)';
    ldlRiskTierAr = 'مرتفع الخطورة جداً (تصلب شرايين أو قصور كلوي)';
  } else if (!p.dm && !p.diabetes && age < 40 && (!p.sbp || parseFloat(String(p.sbp)) < 140)) {
    ldlTargetMg = 100;
    ldlRiskTier = 'Moderate Risk';
    ldlRiskTierAr = 'متوسط الخطورة';
  }

  return {
    patientName: p.name || 'Ahmed Mahmoud',
    age: p.age || 52,
    dm: {
      currentA1c: p.a1c ? `${p.a1c}%` : '8.9%',
      targetA1c: a1cTarget,
      targetDescAr: a1cTargetDescAr,
      targetDescEn: a1cTargetDescEn,
      currentFpg: p.fpg ? `${p.fpg} mg/dL` : '190 mg/dL',
      targetFpg: fpgTarget,
      targetPpg: ppgTarget,
      currentEgfr: p.egfr ? `${p.egfr} mL/min` : '68 mL/min'
    },
    htn: {
      currentBp: (p.sbp && p.dbp) ? `${p.sbp}/${p.dbp} mmHg` : '148/94 mmHg',
      targetBp: bpTarget,
      targetHomeBp: homeBpTarget,
      targetHomeBpEn: homeBpTargetEn,
      currentK: p.k ? `${p.k} mmol/L` : '4.6 mmol/L'
    },
    dlp: {
      riskTier: ldlRiskTier,
      riskTierAr: ldlRiskTierAr,
      targetLdl: `< ${ldlTargetMg} mg/dL (< ${(ldlTargetMg / 38.67).toFixed(1)} mmol/L)`,
      targetNonHdl: `< ${ldlTargetMg + 30} mg/dL`,
      targetTg: '< 150 mg/dL (< 1.7 mmol/L)',
      currentTc: p.tc || p.totalCholesterol ? `${p.tc || p.totalCholesterol} mg/dL` : '210 mg/dL',
      currentHdl: p.hdl || p.hdlC ? `${p.hdl || p.hdlC} mg/dL` : '42 mg/dL'
    }
  };
}

export function buildShareText(targetsInput?: any, lang: 'ar' | 'en' = 'ar', condition: 'all' | 'dm' | 'htn' | 'dlp' = 'all'): string {
  const targets = targetsInput || getDynamicTargets();
  const isAr = (lang === 'ar');
  let t = '';

  if (isAr) {
    t += `📋 *النشرة التثقيفية الطبية والخطة العلاجية*\n`;
    t += `👤 المريض: ${targets.patientName} (${targets.age} سنة)\n`;
    t += `👨‍⚕️ عيادة د. حسام يوسف - طب الأسرة\n`;
    t += `──────────────────────\n`;
    if (condition === 'all' || condition === 'dm') {
      t += `🎯 *أهداف السكري (ADA 2025):*\n`;
      t += `• السكر التراكمي المستهدف: ${targets.dm.targetA1c}\n`;
      t += `• السكر الصائم: ${targets.dm.targetFpg}\n`;
      t += `• السكر بعد الأكل بساعتين: ${targets.dm.targetPpg}\n\n`;
      t += `🍬 *قاعدة 15 لعلاج هبوط السكر (< 70 ملغ/دسل):*\n`;
      t += `1. تناول 15 غرام سكر سريع (نصف كوب عصير / 3 أقراص جلوكوز / ملعقة سكر كبيرة).\n`;
      t += `2. استرح 15 دقيقة ثم أعد القياس.\n`;
      t += `3. كرر إذا ما زال أقل من 70، ثم تناول وجبة خفيفة مستقرة.\n\n`;
      t += `⚠️ *قواعد أيام المرض (SADMANS):*\n`;
      t += `أوقف مؤقتاً عند القيء/الجفاف: جارديانس/فورسيجا، تريتاس/مثبطات ACE، مدرات البول، جلوكوفاج، المسكنات (بروفين/فولتارين)، وأماريل/دياميكرون.\n\n`;
    }
    if (condition === 'all' || condition === 'htn') {
      t += `💓 *أهداف وضوابط ضغط الدم:*\n`;
      t += `• الضغط المستهدف: ${targets.htn.targetBp}\n`;
      t += `• القياس المنزلي الصحيح: راحة 5 دقائق، الظهر مسنود، الذراع بمستوى القلب، قراءتان صباحاً ومساءً لمدة 7 أيام.\n\n`;
    }
    if (condition === 'all' || condition === 'dlp') {
      t += `🩸 *أهداف الكوليسترول والستاتين:*\n`;
      t += `• مستوى LDL المستهدف: ${targets.dlp.targetLdl}\n`;
      t += `• التزم بحبة الستاتين يومياً لحماية الشرايين ومنع الجلطات.\n\n`;
    }
    t += `🚨 *علامات الطوارئ القصوى:* صداع مفاجئ شديد، تشوش رؤية، ألم بالصدر، تنميل بالوجه أو اليد، فقدان وعي -> اتصل بالإسعاف (997 في السعودية / 123 في مصر) فوراً.`;
  } else {
    t += `📋 *Patient Health Education & Care Plan*\n`;
    t += `👤 Patient: ${targets.patientName} (${targets.age} y)\n`;
    t += `👨‍⚕️ Dr. Hossam Yousuf · Family Practice\n`;
    t += `──────────────────────\n`;
    if (condition === 'all' || condition === 'dm') {
      t += `🎯 *Diabetes Targets:*\n`;
      t += `• Target HbA1c: ${targets.dm.targetA1c}\n`;
      t += `• Fasting Glucose: ${targets.dm.targetFpg}\n`;
      t += `• 2h Post-prandial: ${targets.dm.targetPpg}\n\n`;
      t += `🍬 *Rule of 15 for Hypoglycemia (< 70 mg/dL):*\n`;
      t += `1. Take 15g fast sugar (1/2 cup juice or 3 glucose tabs).\n`;
      t += `2. Rest 15 minutes, recheck glucose.\n`;
      t += `3. Repeat if still < 70, then eat a complex carb snack.\n\n`;
      t += `⚠️ *SADMANS Sick-Day Rules:*\n`;
      t += `Temporarily withhold with dehydration/vomiting: SGLT2i, ACEi/ARBs, Diuretics, Metformin, NSAIDs, Sulfonylureas.\n\n`;
    }
    if (condition === 'all' || condition === 'htn') {
      t += `💓 *Blood Pressure Targets & Guidelines:*\n`;
      t += `• Target BP: ${targets.htn.targetBp}\n`;
      t += `• Home Monitoring: Rest 5 min, back supported, arm at heart level, 2 readings morning & evening for 7 days.\n\n`;
    }
    if (condition === 'all' || condition === 'dlp') {
      t += `🩸 *Lipids & Statin Goals:*\n`;
      t += `• Target LDL-C: ${targets.dlp.targetLdl}\n`;
      t += `• Take statin consistently daily to protect arteries and prevent events.\n\n`;
    }
    t += `🚨 *Emergency Red Flags:* Sudden severe headache, vision changes, chest pain, facial/arm weakness, syncope -> Call Emergency (997 KSA / 123 Egypt) immediately.`;
  }

  return t;
}
`

---

## src\engines\lipids.ts

`typescript
export const CHOL_FACTOR = 38.67;
export const TG_FACTOR = 88.57;

export interface RiskTierInfo {
  key: string;
  nameEn: string;
  nameAr: string;
  badgeClass: string;
  ldlTargetMg: number;
  ldlTargetMmol: number;
  nonHdlTargetMg: number;
  nonHdlTargetMmol: number;
  reductionPercent: number;
  statinGoalEn: string;
  statinGoalAr: string;
}

export const RISK_TIERS: Record<string, RiskTierInfo> = {
  VERY_HIGH: {
    key: 'VERY_HIGH',
    nameEn: 'Very High Risk',
    nameAr: 'خطر مرتفع جداً (Very High Risk)',
    badgeClass: 'lipid-badge-very-high',
    ldlTargetMg: 55,
    ldlTargetMmol: 1.4,
    nonHdlTargetMg: 85,
    nonHdlTargetMmol: 2.2,
    reductionPercent: 50,
    statinGoalEn: 'High-intensity statin at maximum tolerated dose. Achieve ≥50% LDL-C reduction AND LDL-C < 55 mg/dL (< 1.4 mmol/L). Add Ezetimibe 10 mg if target not achieved.',
    statinGoalAr: 'ستاتين عالي الكثافة بأقصى جرعة محتملة لخفض LDL بنسبة ≥50% والوصول لأقل من 55 مجم/ديسيلتر. أضف إيزيتيميب 10 مجم عند عدم تحقق الهدف.'
  },
  HIGH: {
    key: 'HIGH',
    nameEn: 'High Risk',
    nameAr: 'خطر مرتفع (High Risk)',
    badgeClass: 'lipid-badge-high',
    ldlTargetMg: 70,
    ldlTargetMmol: 1.8,
    nonHdlTargetMg: 100,
    nonHdlTargetMmol: 2.6,
    reductionPercent: 50,
    statinGoalEn: 'High-intensity statin (or moderate-intensity titrated). Achieve ≥50% LDL-C reduction AND LDL-C < 70 mg/dL (< 1.8 mmol/L). Add Ezetimibe if needed.',
    statinGoalAr: 'ستاتين عالي الكثافة لخفض LDL بنسبة ≥50% والوصول لأقل من 70 مجم/ديسيلتر. أضف إيزيتيميب 10 مجم عند الحاجة.'
  },
  MODERATE: {
    key: 'MODERATE',
    nameEn: 'Moderate Risk',
    nameAr: 'خطر متوسط (Moderate Risk)',
    badgeClass: 'lipid-badge-moderate',
    ldlTargetMg: 100,
    ldlTargetMmol: 2.6,
    nonHdlTargetMg: 130,
    nonHdlTargetMmol: 3.4,
    reductionPercent: 30,
    statinGoalEn: 'Moderate-intensity statin. Achieve LDL-C < 100 mg/dL (< 2.6 mmol/L). Re-evaluate lipid profile in 4–12 weeks.',
    statinGoalAr: 'ستاتين متوسط الكثافة للوصول لمستوى LDL أقل من 100 مجم/ديسيلتر. يعاد تقييم التحليل بعد 4-12 أسبوعاً.'
  },
  LOW: {
    key: 'LOW',
    nameEn: 'Low Risk',
    nameAr: 'خطر منخفض (Low Risk)',
    badgeClass: 'lipid-badge-low',
    ldlTargetMg: 116,
    ldlTargetMmol: 3.0,
    nonHdlTargetMg: 145,
    nonHdlTargetMmol: 3.8,
    reductionPercent: 0,
    statinGoalEn: 'Lifestyle interventions (diet, exercise, smoking cessation). Consider moderate statin if LDL remains elevated after 3 months.',
    statinGoalAr: 'تعديل نمط الحياة (حمية، رياضة، إيقاف التدخين). يُنظر في ستاتين خفيف إلى متوسط إذا استمر الارتفاع بعد 3 أشهر.'
  }
};

function parseNumOr(val: unknown, fallback: number): number {
  if (val === undefined || val === null || val === '') return fallback;
  const n = parseFloat(String(val));
  return isNaN(n) ? fallback : n;
}

function pickDefined(...args: unknown[]): unknown {
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== undefined && args[i] !== null && args[i] !== '') return args[i];
  }
  return undefined;
}

export function toMgDl(val: number | string, type: 'cholesterol' | 'tg' | 'triglycerides' = 'cholesterol'): number {
  const num = parseFloat(String(val)) || 0;
  if (num <= 0) return 0;
  const factor = (type === 'tg' || type === 'triglycerides') ? TG_FACTOR : CHOL_FACTOR;
  return Math.round(num * factor * 10) / 10;
}

export function toMmolL(val: number | string, type: 'cholesterol' | 'tg' | 'triglycerides' = 'cholesterol'): number {
  const num = parseFloat(String(val)) || 0;
  if (num <= 0) return 0;
  const factor = (type === 'tg' || type === 'triglycerides') ? TG_FACTOR : CHOL_FACTOR;
  return Math.round((num / factor) * 100) / 100;
}

export function estimate10YrAscvdRisk(patient: any): { riskPercent: number; category: string; isEstablishedAscvd: boolean } {
  const p = patient || {};
  const age = parseNumOr(p.age, 52);
  const sex = (p.sex === 'f') ? 'f' : 'm';
  const smoker = (p.smoker || p.smk) ? 1 : 0;
  const dm = (p.diabetes || p.dm) ? 1 : 0;
  const sbp = parseNumOr(p.sbp, 130);
  const tx = (p.medsCount && parseInt(String(p.medsCount), 10) > 0) ? 1 : 0;

  let tc = parseNumOr(pickDefined(p.totalCholesterol, p.tc), 200);
  let hdl = parseNumOr(pickDefined(p.hdlC, p.hdl), 45);
  const unit = p.lipidUnit || p.lunit || 'mg';
  if (unit === 'mmol' || unit === 'mmol/L') {
    tc = toMgDl(tc, 'cholesterol');
    hdl = toMgDl(hdl, 'cholesterol');
  }

  if (p.ascvd || p.cad || p.stroke || p.pad) {
    return { riskPercent: 35.0, category: 'VERY_HIGH', isEstablishedAscvd: true };
  }

  const cAge = Math.min(Math.max(age, 40), 79);
  const cTc = Math.min(Math.max(tc, 130), 320);
  const cHdl = Math.min(Math.max(hdl, 20), 100);
  const cSbp = Math.min(Math.max(sbp, 90), 200);

  const lnAge = Math.log(cAge);
  const lnTc = Math.log(cTc);
  const lnHdl = Math.log(cHdl);
  const lnSbp = Math.log(cSbp);

  let indiv = 0;
  let mean = 0;
  let s10 = 0;

  if (sex === 'f') {
    indiv = -29.799 * lnAge +
            4.884 * (lnAge * lnAge) +
            13.540 * lnTc -
            3.114 * (lnAge * lnTc) -
            13.578 * lnHdl +
            3.149 * (lnAge * lnHdl) +
            (tx ? 2.019 : 1.957) * lnSbp +
            7.574 * smoker -
            1.665 * (lnAge * smoker) +
            0.661 * dm;
    mean = -29.18;
    s10 = 0.9665;
  } else {
    indiv = 12.344 * lnAge +
            11.853 * lnTc -
            2.664 * (lnAge * lnTc) -
            7.990 * lnHdl +
            1.769 * (lnAge * lnHdl) +
            (tx ? 1.797 : 1.764) * lnSbp +
            7.837 * smoker -
            1.795 * (lnAge * smoker) +
            0.658 * dm;
    mean = 61.18;
    s10 = 0.9144;
  }

  const exponent = indiv - mean;
  const risk = 1 - Math.pow(s10, Math.exp(exponent));
  const riskPercent = Math.min(Math.max(Math.round(risk * 1000) / 10, 0.5), 85.0);

  let category = 'LOW';
  if (riskPercent >= 20) category = 'VERY_HIGH';
  else if (riskPercent >= 10) category = 'HIGH';
  else if (riskPercent >= 5) category = 'MODERATE';

  return { riskPercent, category, isEstablishedAscvd: false };
}

export function stratifyRisk(patient: any): any {
  const p = patient || {};
  const egfr = parseNumOr(p.egfr, 90);
  const uacr = parseNumOr(p.uacr, 10);
  const age = parseNumOr(p.age, 50);
  const dur = parseNumOr(p.dur, 0);
  const dm = !!(p.diabetes || p.dm);
  const ascvd = !!(p.ascvd || p.cad || p.stroke || p.pad);

  let tc = parseNumOr(pickDefined(p.totalCholesterol, p.tc), 200);
  let ldl = parseNumOr(pickDefined(p.ldlC, p.ldl), 0);
  const unit = p.lipidUnit || p.lunit || 'mg';
  if (unit === 'mmol' || unit === 'mmol/L') {
    tc = toMgDl(tc, 'cholesterol');
    if (ldl > 0) ldl = toMgDl(ldl, 'cholesterol');
  }

  const ascvdEst = estimate10YrAscvdRisk(p);

  let tierKey = 'LOW';
  let reasonEn = 'Calculated 10-Yr ASCVD Risk < 5%';
  let reasonAr = 'مخاطر قلبية 10 سنوات أقل من 5%';

  // 1. VERY HIGH RISK
  if (ascvd ||
      egfr < 30 ||
      (dm && (uacr >= 300 || dur >= 20 || (age >= 50 && (p.smoker || p.smk || p.sbp >= 140)))) ||
      ascvdEst.riskPercent >= 20) {
    tierKey = 'VERY_HIGH';
    reasonEn = ascvd ? 'Established ASCVD (Secondary Prevention)' : (egfr < 30 ? 'Severe CKD (eGFR < 30 mL/min)' : (dm && uacr >= 300 ? 'Diabetes with Severe Target Organ Damage' : '10-Yr ASCVD Risk ≥ 20%'));
    reasonAr = ascvd ? 'مرض قلبي وعائي مثبت (وقاية ثانوية)' : (egfr < 30 ? 'اعتلال كلوي شديد (eGFR < 30)' : (dm && uacr >= 300 ? 'سكري مع ضرر بأعضاء حيوية وزلال شديد' : 'مخاطر قلبية 10 سنوات ≥ 20%'));
  }
  // 2. HIGH RISK
  else if ((dm && (dur >= 10 || age >= 40 || p.smoker || p.smk)) ||
      (egfr >= 30 && egfr < 60) ||
      tc > 310 || ldl > 190 ||
      parseFloat(String(p.sbp)) >= 180 ||
      ascvdEst.riskPercent >= 10) {
    tierKey = 'HIGH';
    reasonEn = dm ? 'Diabetes Mellitus (Age ≥40 or Duration ≥10 yrs)' : (egfr < 60 ? 'Moderate CKD (Stage G3)' : (tc > 310 || ldl > 190 ? 'Severe Single Risk Factor (Severe Hypercholesterolemia)' : '10-Yr ASCVD Risk 10–20%'));
    reasonAr = dm ? 'داء السكري (عمر ≥40 أو مدة ≥10 سنوات)' : (egfr < 60 ? 'اعتلال كلوي متوسط (المرحلة 3)' : (tc > 310 || ldl > 190 ? 'ارتفاع كوليسترول شديد منفرد' : 'مخاطر قلبية 10 سنوات 10-20%'));
  }
  // 3. MODERATE RISK
  else if ((dm && age < 40 && dur < 10) || ascvdEst.riskPercent >= 5) {
    tierKey = 'MODERATE';
    reasonEn = dm ? 'Young Patient with Diabetes <10 yrs duration' : '10-Yr ASCVD Risk 5–10%';
    reasonAr = dm ? 'مريض سكري شاب بدون مضاعفات ومدة <10 سنوات' : 'مخاطر قلبية 10 سنوات 5-10%';
  }

  const tierObj = RISK_TIERS[tierKey];

  return {
    tier: tierKey,
    riskKey: tierKey,
    level: tierKey,
    tierDetails: tierObj,
    ldlTargetMg: tierObj.ldlTargetMg,
    ldlTargetMmol: tierObj.ldlTargetMmol,
    nonHdlTargetMg: tierObj.nonHdlTargetMg,
    nonHdlTargetMmol: tierObj.nonHdlTargetMmol,
    target: { ldl: tierObj.ldlTargetMg, nonHdl: tierObj.nonHdlTargetMg },
    targets: { ldl: tierObj.ldlTargetMg, nonHdl: tierObj.nonHdlTargetMg },
    ascvdRisk: ascvdEst.riskPercent,
    reasonEn,
    reasonAr
  };
}

export function evaluateLipidPathway(patientInput: any): any {
  const p = patientInput || {};
  const unit = p.lipidUnit || p.lunit || 'mg';
  const isMmol = (unit === 'mmol' || unit === 'mmol/L');

  let tcMg = parseNumOr(pickDefined(p.totalCholesterol, p.tc), 200);
  let hdlMg = parseNumOr(pickDefined(p.hdlC, p.hdl), 45);
  let tgMg = parseNumOr(pickDefined(p.triglycerides, p.tg), 160);
  let ldlMg = parseNumOr(pickDefined(p.ldlC, p.ldl), 0);

  if (isMmol) {
    tcMg = toMgDl(tcMg, 'cholesterol');
    hdlMg = toMgDl(hdlMg, 'cholesterol');
    tgMg = toMgDl(tgMg, 'tg');
    if (ldlMg > 0) ldlMg = toMgDl(ldlMg, 'cholesterol');
  }

  if (ldlMg <= 0 && tcMg > 0 && hdlMg > 0) {
    if (tgMg < 400) {
      ldlMg = Math.max(Math.round((tcMg - hdlMg - (tgMg / 5)) * 10) / 10, 20);
    } else {
      ldlMg = Math.round(tcMg * 0.6);
    }
  }

  const nonHdlMg = Math.round((tcMg - hdlMg) * 10) / 10;
  const egfr = parseNumOr(p.egfr, 90);
  const altUl = parseNumOr(pickDefined(p.altUl, p.alt), 25);
  const isPregnant = !!(p.pregnancy || p.pregnant || p.preg || p.pregHtn);

  const currentDrugs: string[] = (
    Array.isArray(p.currentDrugs) ? p.currentDrugs :
    (Array.isArray(p.medications) ? p.medications :
    (Array.isArray(p.activeMeds) ? p.activeMeds : []))
  ).map((d: any) => String(d).toLowerCase());

  const hasDrug = (name: string) => currentDrugs.some(d => d.includes(name.toLowerCase()));
  const onStatin = !!(p.onStatin || p.statin || p.currentStatin || hasDrug('atorva') || hasDrug('rosuva') || hasDrug('simva'));
  const onEzetimibe = !!(p.onEzetimibe || p.ezetimibe || hasDrug('ezetimibe'));

  const strat = stratifyRisk(p);
  const target = strat.tierDetails;

  const alerts: any[] = [];
  function addAlert(alert: any) {
    alerts.push(alert);
  }

  // 1. Pregnancy Statin Contraindication
  if (isPregnant) {
    addAlert({
      id: 'lipid-pregnancy-crit',
      level: 'critical',
      code: 'PREGNANCY_STATIN_CONTRAINDICATED',
      titleEn: 'Contraindicated: Statins in Pregnancy',
      titleAr: 'موانع استخدام حرجة: الستاتينات ممنوعة تماماً أثناء الحمل',
      messageEn: 'All HMG-CoA reductase inhibitors (Statins) and lipid-lowering therapies (Ezetimibe, Fibrates, PCSK9i) are contraindicated during pregnancy and breastfeeding due to potential fetal teratogenicity and disruption of fetal cholesterol synthesis. Discontinue immediately.',
      messageAr: 'تُمنع جميع مركبات الستاتين وأدوية خفض الدهون منعاً باتاً أثناء الحمل والرضاعة لاحتمال تشوه الأجنة وتأثيرها على تكوين دماغ الجنين. أوقف العلاج فوراً.',
      actionEn: 'Discontinue statin / lipid therapy immediately; reassess postpartum.',
      actionAr: 'أوقف أدوية الدهون فوراً وأعد التقييم بعد انتهاء فترة الرضاعة.'
    });
  }

  // 2. Severe Hypertriglyceridemia (TG >= 500 mg/dL)
  if (tgMg >= 500) {
    addAlert({
      id: 'lipid-severe-tg-pancreatitis',
      level: 'critical',
      code: 'SEVERE_HYPERTRIGLYCERIDEMIA_PANCREATITIS',
      titleEn: `Critical Risk: Severe Hypertriglyceridemia (TG = ${Math.round(tgMg)} mg/dL) - Acute Pancreatitis Risk`,
      titleAr: `تحذير حرج: فرط ثلاثي الجليسريد الشديد (TG = ${Math.round(tgMg)}) - خطر التهاب البنكرياس الحاد`,
      messageEn: `Triglyceride level is ${Math.round(tgMg)} mg/dL (≥ 500 mg/dL / ≥ 5.6 mmol/L). High risk of acute necrotizing pancreatitis! Urgent TG lowering takes priority over LDL targets. Initiate Fenofibrate 145 mg daily or high-dose prescription Omega-3 (Icosapent ethyl 4g/day). Strict fat/refined carbohydrate restriction and avoid alcohol.`,
      messageAr: `مستوى الدهون الثلاثية ${Math.round(tgMg)} مجم (≥ 500). خطر شديد لحدوث التهاب البنكرياس الحاد المميت! الأولوية القصوى لخفض الدهون الثلاثية أولاً قبل الستاتين: ابدأ فوراً فينوفيبرات (Fenofibrate 145 mg) أو أوميغا-3 نقي عالي التركيز (4 جم يومياً) مع حمية خالية تماماً من السكريات البسيطة والدهون.`,
      actionEn: 'Start Fenofibrate 145 mg daily or Omega-3 4g/day urgently; strict dietary intervention.',
      actionAr: 'ابدأ فينوفيبرات 145 مجم أو أوميغا-3 مركز 4 جم يومياً فوراً مع حمية غذائية صارمة.'
    });
  } else if (tgMg >= 135 && tgMg < 500 && (p.ascvd || p.cad || strat.tier === 'VERY_HIGH') && onStatin) {
    addAlert({
      id: 'lipid-moderate-tg-icosapent',
      level: 'info',
      code: 'MODERATE_TG_ICOSAPENT_ETHYL',
      titleEn: `Recommendation: Persistent TG Elevation (TG = ${Math.round(tgMg)} mg/dL) on Statin`,
      titleAr: `توصية سريرية: استمرار ارتفاع الدهون الثلاثية (${Math.round(tgMg)} مجم) رغم الستاتين`,
      messageEn: `Fasting TG is ${Math.round(tgMg)} mg/dL (135–499 mg/dL) despite statin therapy in an established ASCVD / high-risk patient. Consider adding Icosapent ethyl (purified EPA Omega-3) 2g BID to reduce cardiovascular death and ischemic events (REDUCE-IT trial).`,
      messageAr: `الدهون الثلاثية لا تزال مرتفعة (${Math.round(tgMg)} مجم) لدى مريض قلب عالي الخطورة رغم الستاتين. يُوصى بإضافة إيكوسابينت إيثيل (Icosapent ethyl 2g BID / أوميغا-3 نقي) لخفض خطر الجلطات والوفيات القلبية بنسبة 25%.`,
      actionEn: 'Consider adding Icosapent ethyl 2g twice daily for residual cardiovascular risk reduction.',
      actionAr: 'انظر في إضافة إيكوسابينت إيثيل 2 جم مرتين يومياً للحد من المخاطر المتبقية.'
    });
  }

  // 3. Amlodipine + Simvastatin Interaction
  const hasAmlodipine = !!(p.amlodipine || hasDrug('amlodipine') || hasDrug('exforge') || hasDrug('coveram') || hasDrug('twynsta'));
  const hasSimvastatin = !!(p.simvastatin || hasDrug('simvastatin') || String(p.currentStatin).toLowerCase().includes('simva'));
  if (hasAmlodipine && hasSimvastatin) {
    addAlert({
      id: 'lipid-amlodipine-simvastatin-interaction',
      level: 'critical',
      code: 'AMLODIPINE_SIMVASTATIN_INTERACTION',
      titleEn: 'Drug Interaction: Amlodipine + Simvastatin (Dose Cap ≤ 20 mg/day)',
      titleAr: 'تفاعل دوائي خطير: أملوديبين مع سيمفاستاتين (الحد الأقصى للجرعة ≤ 20 مجم)',
      messageEn: 'Amlodipine inhibits CYP3A4 metabolism of Simvastatin, doubling systemic simvastatin exposure and substantially increasing the risk of rhabdomyolysis and fatal myopathy. The daily dose of Simvastatin must NOT exceed 20 mg/day when co-administered with amlodipine. Strong recommendation: Switch to Atorvastatin (40–80 mg) or Rosuvastatin (20–40 mg) which avoid this interaction.',
      messageAr: 'الأملوديبين يثبط استقلاب السيمفاستاتين مما يضاعف تركيزه في الدم ويرفع خطر انحلال العضلات السام (Rhabdomyolysis) والفشل الكلوي. الجرعة القصوى للسيمفاستاتين مع الأملوديبين هي 20 مجم/يوم فقط. يُفضل بشدة التحويل إلى أتورفاستاتين أو روزوفاستاتين.',
      actionEn: 'Cap Simvastatin at 20 mg/day or switch to Atorvastatin/Rosuvastatin.',
      actionAr: 'حدد جرعة السيمفاستاتين بـ 20 مجم/يوم كحد أقصى أو بدّله إلى أتورفاستاتين.'
    });
  }

  // 4. Rosuvastatin Renal Dose Cap at eGFR < 30
  const hasRosuvastatin = !!(p.rosuvastatin || hasDrug('rosuva') || String(p.currentStatin).toLowerCase().includes('rosuva'));
  if (egfr > 0 && egfr < 30 && hasRosuvastatin) {
    addAlert({
      id: 'lipid-rosuvastatin-renal-cap',
      level: 'warning',
      code: 'ROSUVASTATIN_RENAL_DOSE_CAP',
      titleEn: 'Renal Dose Guardrail: Rosuvastatin Cap ≤ 10 mg/day (eGFR < 30)',
      titleAr: 'تنبيه كلوي: الحد الأقصى لروزوفاستاتين 10 مجم/يوم (eGFR < 30)',
      messageEn: `eGFR is ${egfr} mL/min/1.73m² (Severe CKD). Rosuvastatin systemic plasma concentration increases 3-fold in severe renal impairment. Starting dose is 5 mg daily; maximum renal dose cap is 10 mg daily (20 mg and 40 mg doses are contraindicated due to myopathy and proteinuria risks).`,
      messageAr: `معدل الترشيح الكبيبي ${egfr} مل/دقيقة. تركيز الروزوفاستاتين يتضاعف 3 مرات في الفشل الكلوي الشديد. جرعة البدء 5 مجم يومياً، والجرعة القصوى (Cap) هي 10 مجم يومياً (تُمنع جرعات 20 و 40 مجم تماماً لخطر تلف العضلات).`,
      actionEn: 'Cap Rosuvastatin at maximum 10 mg/day; monitor CK and renal function.',
      actionAr: 'اخفض جرعة روزوفاستاتين إلى 10 مجم/يوم كحد أقصى.'
    });
  }

  // 5. Steps Construction
  const steps: any[] = [];
  const ldlAboveTarget = ldlMg > target.ldlTargetMg;

  // Step 1
  steps.push({
    stepNumber: 1,
    titleEn: 'Step 1: Statin Therapy Initiation & Maximization',
    titleAr: 'الخطوة 1: بدء وتكثيف جرعة الستاتين (Step 1 Statin Optimization)',
    drugEn: (target.key === 'VERY_HIGH' || target.key === 'HIGH')
      ? 'Atorvastatin 40–80 mg daily OR Rosuvastatin 20–40 mg daily (High-intensity)'
      : 'Atorvastatin 20 mg daily OR Rosuvastatin 10 mg daily (Moderate-intensity)',
    drugAr: (target.key === 'VERY_HIGH' || target.key === 'HIGH')
      ? 'أتورفاستاتين 40-80 مجم يومياً أو روزوفاستاتين 20-40 مجم (كثافة عالية)'
      : 'أتورفاستاتين 20 مجم يومياً أو روزوفاستاتين 10 مجم (كثافة متوسطة)',
    detailEn: `Aim for ≥50% LDL-C reduction and achieve target < ${target.ldlTargetMg} mg/dL (< ${target.ldlTargetMmol} mmol/L). Recheck lipid panel in 4–12 weeks.`,
    detailAr: `الهدف خفض LDL بنسبة ≥50% والوصول لأقل من ${target.ldlTargetMg} مجم/ديسيلتر (< ${target.ldlTargetMmol} مليمول/لتر). يُعاد الفحص بعد 4-12 أسبوعاً.`
  });

  // Step 2
  steps.push({
    stepNumber: 2,
    titleEn: 'Step 2: Add Ezetimibe 10 mg (Combination Therapy)',
    titleAr: 'الخطوة 2: إضافة إيزيتيميب 10 مجم (Step 2 Ezetimibe Step-up)',
    drugEn: 'Ezetimibe 10 mg PO once daily (with or without statin)',
    drugAr: 'إيزيتيميب 10 مجم فموياً مرة واحدة يومياً (يُؤخذ مع الستاتين)',
    detailEn: (onStatin && ldlAboveTarget)
      ? `Patient is on statin but LDL-C (${Math.round(ldlMg)} mg/dL) remains above target (< ${target.ldlTargetMg} mg/dL). Add Ezetimibe 10 mg daily to high-intensity statin to achieve additional 15%–20% LDL-C reduction (IMPROVE-IT trial).`
      : `Recommended if target LDL (< ${target.ldlTargetMg} mg/dL) is not achieved on maximally tolerated statin dose alone.`,
    detailAr: (onStatin && ldlAboveTarget)
      ? `المريض يتناول الستاتين ولكن LDL (${Math.round(ldlMg)} مجم) لا يزال أعلى من الهدف المحدد (< ${target.ldlTargetMg} مجم). أضف إيزيتيميب 10 مجم يومياً مع الستاتين لخفض إضافي بنسبة 15-20%.`
      : `تتم إضافته في حال عدم الوصول للهدف المنشود (< ${target.ldlTargetMg} مجم) باستخدام الستاتين وحده.`
  });

  // Step 3
  steps.push({
    stepNumber: 3,
    titleEn: 'Step 3: PCSK9 Inhibitor Escalation (Extreme / Refractory Risk)',
    titleAr: 'الخطوة 3: تصعيد العلاج بحقن مثبطات PCSK9 (Step 3 PCSK9 Escalation)',
    drugEn: 'Evolocumab (Repatha) 140 mg SC q2w OR Alirocumab (Praluent) 75–150 mg SC q2w',
    drugAr: 'إيفولوكوماب (ريباطا) 140 مجم تحت الجلد كل أسبوعين، أو أليروكوماب (برالوانت) 75-150 مجم',
    detailEn: (onEzetimibe || (target.key === 'VERY_HIGH' && ldlAboveTarget))
      ? `If patient remains above LDL target (< ${target.ldlTargetMg} mg/dL) despite maximally tolerated statin + Ezetimibe 10 mg: add PCSK9 inhibitor (Evolocumab 140mg q2w or Alirocumab; provides additional 50%–60% LDL reduction; FOURIER / ODYSSEY Outcomes trials).`
      : `Reserved for refractory hypercholesterolemia or extreme cardiovascular risk patients unable to achieve targets on Statin + Ezetimibe.`,
    detailAr: (onEzetimibe || (target.key === 'VERY_HIGH' && ldlAboveTarget))
      ? `في حال بقاء LDL أعلى من الهدف (< ${target.ldlTargetMg} مجم) رغم تناول أقصى جرعة ستاتين مع إيزيتيميب 10 مجم: يتم إضافة حقن PCSK9 (إيفولوكوماب 140 مجم) لخفض إضافي بنسبة 50-60%.`
      : `يُخصص لمرضى فرط كوليسترول الدم الوراثي أو الحالات المستعصية شديدة الخطورة.`
  });

  // Step 4
  if (tgMg >= 500) {
    steps.push({
      stepNumber: 4,
      titleEn: 'Step 4: Severe Hypertriglyceridemia Urgent Pancreatitis Prevention',
      titleAr: 'الخطوة 4: الخطة العاجلة لخفض الدهون الثلاثية والوقاية من التهاب البنكرياس',
      drugEn: (egfr >= 30) ? 'Fenofibrate micronized 145 mg or 160 mg once daily with food' : 'Prescription Omega-3 Acid Ethyl Esters 4 g/day (Fenofibrate avoided in eGFR <30)',
      drugAr: (egfr >= 30) ? 'فينوفيبرات 145 أو 160 مجم يومياً مع الوجبة' : 'أوميغا-3 نقي عالي التركيز 4 جم يومياً (يُتجنب الفينوفيبرات لأن eGFR < 30)',
      detailEn: `Urgent TG reduction is imperative to prevent acute pancreatitis. Recheck lipid panel within 2–4 weeks. Combine with strict restriction of refined carbs, fats, and alcohol.`,
      detailAr: `خفض عاجل للدهون الثلاثية للوقاية من التهاب البنكرياس الحاد، مع إعادة الفحص خلال 2-4 أسابيع والالتزام بحمية خالية من السكريات البسيطة.`
    });
  }

  const gapMg = Math.round(Math.max(ldlMg - target.ldlTargetMg, 0));
  const gapPercent = Math.round(((ldlMg - target.ldlTargetMg) / ldlMg) * 100);

  let recommendation = isPregnant
    ? 'Statins and lipid-lowering drugs are contraindicated in pregnancy / أدوية الدهون ممنوعة تماماً أثناء الحمل'
    : (target.key === 'VERY_HIGH'
        ? (onEzetimibe ? 'Step 3: Add PCSK9 inhibitor (Evolocumab) for refractory LDL > 55 mg/dL' : (onStatin ? 'Step 2: Add Ezetimibe 10 mg to high-intensity statin' : 'Step 1: High-intensity statin (Atorvastatin 40–80 mg)'))
        : (target.key === 'HIGH'
            ? (onStatin ? 'Step 2: Titrate statin or add Ezetimibe 10 mg' : 'Step 1: High-intensity statin (Atorvastatin 40–80 mg or Rosuvastatin 20 mg)')
            : 'Moderate-intensity statin or lifestyle intervention'));

  return {
    patient: p,
    isMmol,
    labs: {
      tcMg: Math.round(tcMg),
      tcMmol: toMmolL(tcMg, 'cholesterol'),
      hdlMg: Math.round(hdlMg),
      hdlMmol: toMmolL(hdlMg, 'cholesterol'),
      tgMg: Math.round(tgMg),
      tgMmol: toMmolL(tgMg, 'tg'),
      ldlMg: Math.round(ldlMg),
      ldlMmol: toMmolL(ldlMg, 'cholesterol'),
      nonHdlMg: Math.round(nonHdlMg),
      nonHdlMmol: toMmolL(nonHdlMg, 'cholesterol'),
      altUl
    },
    stratification: strat,
    target,
    gap: {
      isAtTarget: ldlMg <= target.ldlTargetMg,
      gapMg: gapMg > 0 ? gapMg : 0,
      gapMmol: gapMg > 0 ? toMmolL(gapMg, 'cholesterol') : 0,
      neededReductionPercent: gapPercent > 0 ? gapPercent : 0
    },
    onStatin,
    onEzetimibe,
    recommendation,
    alerts,
    guardrails: alerts,
    steps
  };
}
`

---

## src\engines\primaryCare.ts

`typescript
function parseNumOr(val: unknown, fallback: number): number {
  if (val === undefined || val === null || val === '') return fallback;
  const n = parseFloat(String(val));
  return isNaN(n) ? fallback : n;
}

export function evaluateAsthmaGina(patientInput: any): any {
  const p = patientInput || {};

  const dayPositive = (p.daySymptoms && p.daySymptoms !== 'none' && p.daySymptoms !== '0') ||
                      !!p.asthmaDaytime ||
                      (parseFloat(String(p.asthmaDaytimePerWk)) > 2);

  const nightWaking = !!(p.nightWaking || p.asthmaNightWaking);

  const relieverPositive = (p.relieverUse && p.relieverUse !== 'none' && p.relieverUse !== '0') ||
                           !!p.asthmaReliever ||
                           (parseFloat(String(p.sabaUsePerWeek)) > 2) ||
                           (parseFloat(String(p.asthmaRelieverPerWk)) > 2);

  const activityLimit = !!(p.activityLimit || p.asthmaActivityLimit);

  const sabaPerWk = parseFloat(String(p.sabaUsePerWeek)) || parseFloat(String(p.asthmaRelieverPerWk)) || (relieverPositive ? 4 : 0);
  const canistersPerYr = parseFloat(String(p.asthmaCanistersPerYr)) || 0;
  const currentStep = parseInt(String(p.currentStep || p.asthmaStep), 10) || 2;
  const preferredTrack = parseInt(String(p.preferredTrack || p.asthmaTrack), 10) || 1;

  let score = 0;
  if (dayPositive) score++;
  if (nightWaking) score++;
  if (relieverPositive) score++;
  if (activityLimit) score++;

  let controlLevel = 'well_controlled';
  let controlNameEn = 'Well Controlled';
  let controlNameAr = 'منضبط تماماً';
  let controlBadgeClass = 'badge-success';

  if (score >= 3) {
    controlLevel = 'uncontrolled';
    controlNameEn = 'Uncontrolled';
    controlNameAr = 'غير منضبط (بحاجة لتصعيد العلاج)';
    controlBadgeClass = 'badge-danger';
  } else if (score >= 1) {
    controlLevel = 'partly_controlled';
    controlNameEn = 'Partly Controlled';
    controlNameAr = 'منضبط جزئياً';
    controlBadgeClass = 'badge-warning';
  }

  const alerts: any[] = [];
  function addAlert(a: any) {
    a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
    a.message = `${a.messageEn} | ${a.messageAr}`;
    a.msg = a.messageEn;
    a.title = a.titleEn;
    alerts.push(a);
  }

  if (sabaPerWk >= 3 || canistersPerYr >= 3) {
    addAlert({
      id: 'asthma-saba-overuse',
      level: 'critical',
      titleEn: `SABA Overuse Alert: Reliever Used ${sabaPerWk}x/week (≥3x/wk)`,
      titleAr: `تحذير حرج: إفراط في استخدام بخاخ الفنتولين (${sabaPerWk} مرات/أسبوع - سابا)`,
      messageEn: `SABA overuse: Reliever use ≥3 times/week (${sabaPerWk}x/wk) or ≥3 canisters/year indicates poor asthma control and carries a substantially increased risk of severe, life-threatening asthma exacerbation and mortality. Urgent switch to an ICS-containing regimen is required. GINA Track 1 (MART: low-dose ICS-formoterol as reliever) is strongly preferred.`,
      messageAr: `إفراط في استخدام بخاخ الفنتولين (SABA) بمعدل ≥3 مرات أسبوعياً يشير لعدم التحكم بالربو ومخاطر عالية جداً لنوبات ربو مميتة ودخول المستشفى. يلزم فوراً الانتقال لبخاخ يحتوي على كورتيزون استنشاقي ومسار MART هو المفضل.`,
      actionEn: 'Switch patient to GINA Track 1 (MART: Budesonide/Formoterol) and counsel against SABA monotherapy.',
      actionAr: 'حوّل المريض لمسار MART (بوديسونيد/فورموتيرول كعلاج وقائي وإسعافي) وامتنع عن الفنتولين وحده.'
    });
  }

  const TRACK_1_STEPS: Record<number, any> = {
    1: {
      stepNumber: 1,
      title: 'Step 1–2: As-needed low-dose ICS-formoterol (MART)',
      nameEn: 'As-needed low-dose ICS-formoterol (Budesonide/Formoterol 160/4.5 mcg 1 puff prn)',
      nameAr: 'بوديسونيد/فورموتيرول (160/4.5 ميكروجرام) بخة واحدة عند اللزوم للأعراض',
      descEn: 'Reliever only; no daily maintenance needed for mild intermittent symptoms.',
      descAr: 'بخاخ عند اللزوم فقط؛ لا يحتاج بخاخاً يومياً ثابتاً في الأعراض الخفيفة.'
    },
    2: {
      stepNumber: 2,
      title: 'Step 2: As-needed low-dose ICS-formoterol (MART)',
      nameEn: 'As-needed low-dose ICS-formoterol (Budesonide/Formoterol 160/4.5 mcg 1 puff prn)',
      nameAr: 'بوديسونيد/فورموتيرول (160/4.5 ميكروجرام) بخة واحدة عند اللزوم للأعراض',
      descEn: 'Reliever only; or daily low-dose ICS maintenance if preferred.',
      descAr: 'بخاخ عند اللزوم؛ أو إضافة جرعة يومية خفيفة من الكورتيزون الاستنشاقي.'
    },
    3: {
      stepNumber: 3,
      title: 'Step 3: Low-dose maintenance and reliever therapy (MART)',
      nameEn: 'Low-dose MART: Budesonide/Formoterol 160/4.5 mcg 1 puff BID + 1 puff prn as reliever',
      nameAr: 'مسار MART جرعة منخفضة: بوديسونيد/فورموتيرول (160/4.5) بخة مرتين يومياً + بخة عند اللزوم',
      descEn: 'Low-dose maintenance ICS-formoterol plus as-needed reliever with the same inhaler.',
      descAr: 'جرعة يومية وقائية صباحاً ومساءً بالإضافة للاستخدام عند اللزوم بنفس البخاخ.'
    },
    4: {
      stepNumber: 4,
      title: 'Step 4: Medium-dose maintenance and reliever therapy (MART)',
      nameEn: 'Medium-dose MART: Budesonide/Formoterol 160/4.5 mcg 2 puffs BID + 1 puff prn',
      nameAr: 'مسار MART جرعة متوسطة: بوديسونيد/فورموتيرول (160/4.5) بختين مرتين يومياً + بخة عند اللزوم',
      descEn: 'Medium-dose maintenance ICS-formoterol plus as-needed reliever with the same inhaler.',
      descAr: 'زيادة الجرعة الوقائية لبختين صباحاً ومساءً مع الاستخدام الإسعافي عند اللزوم.'
    },
    5: {
      stepNumber: 5,
      title: 'Step 5: Add-on LAMA / Biologic / Specialist referral',
      nameEn: 'Step 5: Add LAMA (Tiotropium 5 mcg Respimat) OR High-dose MART + Specialist referral for Biologics',
      nameAr: 'الخطوة 5: إضافة تيوتروبيوم (LAMA) أو تحويل لاستشاري صدرية لبدء العلاجات البيولوجية',
      descEn: 'High-dose ICS-LABA + add-on LAMA, phenotypic assessment for severe asthma biologics.',
      descAr: 'كورتيزون عالي الكثافة مع لاما وتقييم العلاجات البيولوجية للأشكال الشديدة من الربو.'
    }
  };

  let recommendedStep = currentStep;
  if (controlLevel === 'uncontrolled') {
    recommendedStep = Math.min(currentStep + 1, 5);
  } else if (controlLevel === 'well_controlled' && currentStep > 2) {
    recommendedStep = currentStep;
  }

  const stepDetails = TRACK_1_STEPS[recommendedStep] || TRACK_1_STEPS[3];

  let recommendation = `GINA Track 1 MART: Step ${recommendedStep} (${stepDetails.title}). ${stepDetails.nameEn}`;
  if (controlLevel === 'uncontrolled' && recommendedStep > currentStep) {
    recommendation = `Uncontrolled asthma on Step ${currentStep}: Step up to Step ${recommendedStep} Low-Dose MART (ICS-Formoterol). ${stepDetails.nameEn}`;
  }

  return {
    engine: 'asthma',
    controlLevel,
    control: controlLevel,
    controlNameEn,
    controlNameAr,
    controlBadgeClass,
    score,
    sabaPerWk,
    currentStep,
    recommendedStep,
    preferredTrack,
    recommendation,
    stepDetails,
    alerts,
    guardrails: alerts
  };
}

export function evaluateCopdGold(patientInput: any): any {
  const p = patientInput || {};

  function pickNum(vals: unknown[], fallback: number): number {
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] !== undefined && vals[i] !== null && vals[i] !== '') {
        const n = parseFloat(String(vals[i]));
        if (!isNaN(n)) return n;
      }
    }
    return fallback;
  }

  const moderateExac = pickNum([p.moderateExacerbations, p.exacerbationsLastYear, p.copdExacerbations], 0);
  const hospExac = pickNum([p.hospitalExacerbations, p.hospitalizationsLastYear, p.copdHospitalExacerbations], 0);
  const mmrc = pickNum([p.mMRC, p.mmrcScore, p.copdMmrc], 0);
  const cat = pickNum([p.catScore, p.copdCat], 0);
  const eos = pickNum([p.bloodEosinophils, p.eosinophilsPerUl, p.copdEosinophils], 150);

  const isHighRisk = (moderateExac >= 2 || hospExac >= 1);
  const isHighSymptom = (mmrc >= 2 || cat >= 10);

  let group = 'A';
  let groupNameEn = 'Group A (Low Risk, Less Symptoms)';
  let groupNameAr = 'المجموعة A (خطر نوبات منخفض، أعراض طفيفة)';
  let primaryRxEn = 'Bronchodilator: Single LABA or LAMA as initial maintenance.';
  let primaryRxAr = 'موسع قصبات: موسع أحادي LABA أو LAMA كبداية.';

  if (isHighRisk) {
    group = 'E';
    groupNameEn = 'Group E (High Exacerbation Risk - Exacerbator phenotype)';
    groupNameAr = 'المجموعة E (خطر انتكاسات مرتفع - دخول مشفى أو ≥2 نوبة معتدلة)';

    if (eos >= 300) {
      primaryRxEn = 'Triple Therapy: LABA + LAMA + ICS (Fluticasone/Umeclidinium/Vilanterol OR Budesonide/Glycopyrrolate/Formoterol once/twice daily). Blood eosinophils ≥ 300 cells/µL strongly indicates ICS benefit to reduce exacerbations.';
      primaryRxAr = 'العلاج الثلاثي (Triple Therapy): LABA + LAMA + ICS معاً. ارتفاع الخلايا الحمضية (Eosinophils ≥ 300) مؤشر قوي لخفض النوبات الحادة ومعدلات دخول المستشفى.';
    } else {
      primaryRxEn = 'Dual Bronchodilation: LABA + LAMA (e.g. Tiotropium/Olodaterol or Umeclidinium/Vilanterol). If recurrent exacerbations persist despite LABA+LAMA and eosinophils ≥ 100, add ICS (Triple Therapy).';
      primaryRxAr = 'موسع قصبات مزدوج: LABA + LAMA. إذا استمرت النوبات رغم الموسع المزدوج مع eosinophils ≥ 100 يتم تصعيده للعلاج الثلاثي.';
    }
  } else if (isHighSymptom) {
    group = 'B';
    groupNameEn = 'Group B (Low Risk, More Symptoms - mMRC ≥ 2 or CAT ≥ 10)';
    groupNameAr = 'المجموعة B (خطر نوبات منخفض، أعراض ضيق تنفس واضحة)';
    primaryRxEn = 'Dual Bronchodilation: LABA + LAMA (combination inhaler) is superior to single bronchodilator for symptom and dyspnea reduction.';
    primaryRxAr = 'موسع قصبات مزدوج (LABA + LAMA): يوفر تخفيفاً متفوقاً لضيق التنفس وتحسين جودة الحياة مقارنة بالموسع الفردي.';
  }

  const alerts: any[] = [];
  function addAlert(a: any) {
    a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
    a.message = `${a.messageEn} | ${a.messageAr}`;
    a.msg = a.messageEn;
    a.title = a.titleEn;
    alerts.push(a);
  }

  if (eos < 100) {
    addAlert({
      id: 'copd-low-eos-pneumonia-risk',
      level: 'warning',
      titleEn: `Caution: Low Blood Eosinophils (${eos} cells/µL < 100) - Pneumonia Risk with ICS`,
      titleAr: `تحذير سريري: انخفاض الخلايا الحمضية (${eos} < 100) - خطر ذات الرئة عند استخدام الكورتيزون`,
      messageEn: `Blood eosinophil count is ${eos} cells/µL (< 100 cells/µL). GOLD 2024–2025 guidelines advise against initiating or maintaining ICS in this subgroup: negligible exacerbation reduction benefit combined with a substantially increased risk of severe bacterial pneumonia. Prefer LABA + LAMA bronchodilation.`,
      messageAr: `نسبة الحمضيات Eosinophils هي ${eos} (< 100). تنصح توصيات GOLD بتجنب مشتقات الكورتيزون الاستنشاقي (ICS) لعدم وجود فائدة مع زيادة خطر الإصابة بالتهاب الرئة البكتيري الحاد (ذات الرئة pneumonia). اعتمد على الموسع المزدوج LABA + LAMA.`,
      actionEn: 'Avoid ICS initiation; rely on dual bronchodilators (LABA + LAMA) and pulmonary rehabilitation.',
      actionAr: 'تجنب إضافة الكورتيزون الاستنشاقي واعتمد على موسعات الشعب المزدوجة والتأهيل الرئوي.'
    });
  }

  return {
    engine: 'copd',
    group,
    goldGroup: group,
    groupNameEn,
    groupNameAr,
    moderateExac,
    hospExac,
    mmrc,
    cat,
    eos,
    primaryRxEn,
    primaryRxAr,
    recommendation: primaryRxEn,
    alerts,
    guardrails: alerts
  };
}

export function evaluateThyroid(patientInput: any): any {
  const p = patientInput || {};

  const tsh = parseNumOr(p.tsh, 2.5);
  const ft4 = parseNumOr(p.ft4, 1.2);
  const age = parseNumOr(p.age, 52);
  const wt = parseNumOr(p.weightKg !== undefined ? p.weightKg : p.wt, 70);
  const isPregnant = !!(p.pregnancy || p.pregnant || p.preg || p.pregHtn);
  const hasAscvd = !!(p.ascvd || p.cad || (p.hf && p.hf !== 'none' && p.hf !== false));
  const hasAsthmaOrCopd = !!(p.asthma || p.copd);

  let status = 'euthyroid';
  let diagnosis = 'Euthyroid (Normal Thyroid Function)';
  let statusNameEn = 'Euthyroid (Normal Thyroid Function)';
  let statusNameAr = 'وظائف الغدة طبيعية (Euthyroid)';
  let badgeClass = 'badge-success';

  if (tsh > 4.5 && ft4 < 0.8) {
    status = 'overt_hypo';
    diagnosis = 'Overt Hypothyroidism (Elevated TSH + Low FT4)';
    statusNameEn = 'Overt Hypothyroidism';
    statusNameAr = 'قصور الغدة الدرقية الصريح (Overt Hypothyroidism)';
    badgeClass = 'badge-danger';
  } else if (tsh > 4.5 && ft4 >= 0.8 && ft4 <= 1.8) {
    status = 'subclinical_hypo';
    diagnosis = 'Subclinical Hypothyroidism (Elevated TSH + Normal FT4)';
    statusNameEn = 'Subclinical Hypothyroidism';
    statusNameAr = 'قصور الغدة الدرقية تحت الإكلينيكي (Subclinical)';
    badgeClass = 'badge-warning';
  } else if (tsh < 0.4 && ft4 > 1.8) {
    status = 'overt_hyper';
    diagnosis = 'Overt Hyperthyroidism / Thyrotoxicosis (Low TSH + High FT4)';
    statusNameEn = 'Overt Hyperthyroidism / Thyrotoxicosis';
    statusNameAr = 'فرط نشاط الغدة الدرقية الصريح (Hyperthyroidism)';
    badgeClass = 'badge-danger';
  } else if (tsh < 0.4 && ft4 >= 0.8 && ft4 <= 1.8) {
    status = 'subclinical_hyper';
    diagnosis = 'Subclinical Hyperthyroidism (Low TSH + Normal FT4)';
    statusNameEn = 'Subclinical Hyperthyroidism';
    statusNameAr = 'فرط نشاط الغدة الدرقية تحت الإكلينيكي';
    badgeClass = 'badge-warning';
  }

  const alerts: any[] = [];
  function addAlert(a: any) {
    a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
    a.message = `${a.messageEn} | ${a.messageAr}`;
    a.msg = a.messageEn;
    a.title = a.titleEn;
    alerts.push(a);
  }

  let recommendedDose = 0;
  let rxEn = '';
  let rxAr = '';

  if (status === 'overt_hypo') {
    if (hasAscvd || age >= 65) {
      recommendedDose = 25;
      rxEn = `Conservative Levothyroxine starting dose: 25–50 mcg PO daily (Patient has established ASCVD or age ≥65). Titrate by 12.5–25 mcg every 6–8 weeks based on repeat TSH to prevent precipitation of angina, myocardial ischemia, or arrhythmia.`;
      rxAr = `جرعة ليفوثيروكسين تحفظية للبدء: 25 إلى 50 ميكروجرام يومياً على معدة فارغة لوجود أمراض قلبية أو كبر السن. تُرفع الجرعة تدريجياً كل 6-8 أسابيع لتفادي نوبات الذبحة الصدرية.`;
    } else if (isPregnant) {
      recommendedDose = Math.round(wt * 1.8);
      rxEn = `Pregnancy Levothyroxine replacement: ~1.8 mcg/kg/day (~${recommendedDose} mcg daily). Maternal thyroid hormone is critical for fetal neurological development. Maintain trimester-specific TSH target (<2.5 mIU/L in T1; <3.0 in T2/T3). Recheck TSH every 4 weeks.`;
      rxAr = `علاج قصور الغدة أثناء الحمل: ليفوثيروكسين بجرعة ~1.8 ميكروجرام/كجم (~${recommendedDose} ميكروجرام يومياً) لأهميته لتطور مخ الجنين مع المحافظة على TSH < 2.5.`;
    } else {
      recommendedDose = Math.round(wt * 1.6);
      rxEn = `Full replacement Levothyroxine dose: ~1.6 mcg/kg/day (~${recommendedDose} mcg PO daily). Take first thing in the morning with water, 30–60 minutes before breakfast. Recheck TSH in 6–8 weeks for titration.`;
      rxAr = `جرعة إحلال كاملة من الليفوثيروكسين: ~1.6 ميكروجرام/كجم/يوم (~${recommendedDose} ميكروجرام فموياً يومياً). يُؤخذ صباحاً على الريق مع الماء قبل الإفطار بنصف ساعة إلى ساعة. يعاد فحص TSH بعد 6-8 أسابيع.`;
    }
  } else if (status === 'overt_hyper') {
    let thionamideEn = 'Carbimazole 15–30 mg daily (or Methimazole 10–20 mg daily) preferred over PTU due to lower hepatotoxicity risk.';
    let thionamideAr = 'كاربيميزول 15-30 مجم يومياً (أو ميثيمازول 10-20 مجم) هو الخيار الأول لقلة مخاطره على الكبد مقارنة بـ PTU.';

    if (hasAsthmaOrCopd) {
      addAlert({
        id: 'thyroid-propranolol-bronchospasm',
        level: 'critical',
        titleEn: 'Contraindication: Propranolol (Inderal) in Asthma/COPD - Severe Bronchospasm Risk',
        titleAr: 'موانع استخدام حرجة: حظر البروبرانولول (إندرال) لمرضى الربو والسدة الرئوية - خطر انقباض قصبي',
        messageEn: 'Bronchospasm alert: Non-selective beta-blockers like Propranolol (Inderal) can trigger severe, potentially fatal bronchospasm in patients with Asthma or COPD. For adrenergic symptom relief (palpitations, tremor), use a cardioselective Beta-1 blocker (Bisoprolol 2.5–5 mg) with extreme caution, or preferably use a non-DHP Calcium Channel Blocker (Diltiazem 30–60 mg tid or Verapamil).',
        messageAr: 'تحذير انقباض قصبي وتشنج: حاصرات بيتا غير الانتقائية (مثل إندرال / بروبرانولول) تسبب تشنجاً حاداً وخطيراً بالقصبات الهوائية في مرضى الربو أو السدة الرئوية. للسيطرة على خفقان القلب والرعشة، استخدم محصر قنوات الكالسيوم (ديلتيازيم) أو محصر بيتا-1 انتقائي (بيسوبرولول) بحذر شديد.',
        actionEn: 'Avoid Propranolol; use Diltiazem or cautious selective Beta-1 blocker.',
        actionAr: 'تجنب إندرال واستخدم ديلتيازيم أو بيسوبرولول بحذر شديد.'
      });
      rxEn = `${thionamideEn} For symptom control: Diltiazem 30–60 mg tid (avoid Propranolol due to Asthma/COPD bronchospasm risk).`;
      rxAr = `${thionamideAr} للسيطرة على الأعراض والخفقان: ديلتيازيم 30-60 مجم 3 مرات يومياً (تجنب إندرال لوجود ربو/سدة).`;
    } else {
      rxEn = `${thionamideEn} For symptom control: Propranolol 10–40 mg tid–qid for rapid tremor and tachycardia relief.`;
      rxAr = `${thionamideAr} للسيطرة على الأعراض: بروبرانولول (إندرال) 10-40 مجم 3 مرات يومياً لعلاج الخفقان والرعشة.`;
    }
  } else if (status === 'subclinical_hypo' && !rxEn) {
    rxEn = 'Mild subclinical hypothyroidism (TSH 4.5–9.9 mIU/L): Repeat TSH + Free T4 + Anti-TPO in 6–12 weeks. Consider Levothyroxine trial only if symptomatic, pregnant, planning pregnancy, or Anti-TPO positive.';
    rxAr = 'قصور تحت إكلينيكي خفيف (TSH بين 4.5 و 9.9): يُعاد فحص TSH و Free T4 مع Anti-TPO بعد 6–12 أسبوعاً. لا يبدأ الليفوثيروكسين إلا مع وجود أعراض أو حمل أو التخطيط للحمل.';
  } else if (status === 'subclinical_hyper') {
    rxEn = 'Subclinical hyperthyroidism (TSH 0.1–0.39 mIU/L): Repeat TSH + Free T4/T3 in 6–12 weeks; evaluate for Graves/toxic nodule if persistent, especially if age ≥ 65 or cardiovascular/osteoporosis risk.';
    rxAr = 'فرط نشاط تحت إكلينيكي: يُعاد فحص TSH و Free T4/T3 خلال 6–12 أسبوعاً؛ تقييم أسباب فرط النشاط ومتابعة نبض القلب وهشاشة العظام (خاصة بعمر ≥ 65).';
  } else if (status === 'euthyroid') {
    rxEn = 'Euthyroid state: No thyroid hormone replacement or antithyroid therapy required. Routine monitoring only if clinically indicated.';
    rxAr = 'وظائف الغدة الدرقية طبيعية: لا يتطلب علاجاً دوائياً للغدة الدرقية حالياً.';
  }

  return {
    engine: 'thyroid',
    status,
    diagnosis,
    statusNameEn,
    statusNameAr,
    badgeClass,
    tsh,
    ft4,
    isPregnant,
    hasAscvd,
    hasAsthmaOrCopd,
    recommendedDose,
    startingDose: recommendedDose,
    doseMcg: recommendedDose,
    rxEn,
    rxAr,
    alerts,
    guardrails: alerts
  };
}

export function evaluatePrimaryCare(patientInput: any): any {
  const p = patientInput || {};
  const asthma = evaluateAsthmaGina(p);
  const copd = evaluateCopdGold(p);
  const thyroid = evaluateThyroid(p);

  const allAlerts = [
    ...asthma.alerts,
    ...copd.alerts,
    ...thyroid.alerts
  ];

  return {
    patient: p,
    asthma,
    copd,
    thyroid,
    allAlerts
  };
}
`

---

## src\engines\qr.ts

`typescript
const SIZE = 41; // Version 6 matrix dimension = 21 + (6-1)*4 = 41

const gfExp = new Uint8Array(512);
const gfLog = new Uint8Array(256);
let x = 1;
for (let i = 0; i < 255; i++) {
  gfExp[i] = x;
  gfLog[x] = i;
  x <<= 1;
  if (x & 256) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) {
  gfExp[i] = gfExp[i - 255];
}

function gfMul(a: number, b: number): number {
  return (a === 0 || b === 0) ? 0 : gfExp[gfLog[a] + gfLog[b]];
}

function rsGenPoly(degree: number): number[] {
  let g = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(g.length + 1).fill(0);
    const root = gfExp[i];
    for (let j = 0; j < g.length; j++) {
      next[j] ^= g[j];
      next[j + 1] ^= gfMul(g[j], root);
    }
    g = next;
  }
  return g;
}

const g18 = rsGenPoly(18);

function calcEC(data: number[], degree: number): number[] {
  const buf = new Uint8Array(data.length + degree);
  buf.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = buf[i];
    if (coef !== 0) {
      for (let j = 0; j <= degree; j++) {
        buf[i + j] ^= gfMul(g18[j], coef);
      }
    }
  }
  return Array.from(buf.slice(data.length));
}

function toUtf8Bytes(str: string, maxBytes: number = 134): number[] {
  const s = String(str || '');
  const limit = (typeof maxBytes === 'number' && maxBytes > 0) ? maxBytes : 134;
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let code = s.charCodeAt(i);
    let charBytes: number[];
    if (code < 0x80) {
      charBytes = [code];
    } else if (code < 0x800) {
      charBytes = [0xc0 | (code >> 6), 0x80 | (code & 0x3f)];
    } else if (code < 0xd800 || code >= 0xe000) {
      charBytes = [0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f)];
    } else {
      i++;
      code = 0x10000 + (((code & 0x3ff) << 10) | (s.charCodeAt(i) & 0x3ff));
      charBytes = [0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f)];
    }
    if (bytes.length + charBytes.length > limit) break;
    for (let k = 0; k < charBytes.length; k++) bytes.push(charBytes[k]);
  }
  return bytes;
}

class BitBuffer {
  buffer: number[] = [];
  length: number = 0;

  put(val: number, len: number) {
    for (let i = 0; i < len; i++) {
      this.putBit(((val >>> (len - i - 1)) & 1) === 1);
    }
  }

  putBit(bit: boolean) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    }
    this.length++;
  }
}

export function createQrMatrix(text: string): (number | null)[][] {
  const dataBytes = toUtf8Bytes(text, 134);
  const bb = new BitBuffer();
  bb.put(0x04, 4);
  bb.put(dataBytes.length, 8);
  for (let i = 0; i < dataBytes.length; i++) {
    bb.put(dataBytes[i], 8);
  }
  const maxDataBits = 136 * 8;
  const termLen = Math.min(4, maxDataBits - bb.length);
  bb.put(0, termLen);
  while (bb.length % 8 !== 0) {
    bb.putBit(false);
  }
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bb.length < maxDataBits) {
    bb.put(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const b1Data = bb.buffer.slice(0, 68);
  const b2Data = bb.buffer.slice(68, 136);
  const b1Ec = calcEC(b1Data, 18);
  const b2Ec = calcEC(b2Data, 18);

  const finalCodewords: number[] = [];
  for (let i = 0; i < 68; i++) {
    finalCodewords.push(b1Data[i]);
    finalCodewords.push(b2Data[i]);
  }
  for (let i = 0; i < 18; i++) {
    finalCodewords.push(b1Ec[i]);
    finalCodewords.push(b2Ec[i]);
  }

  const allBits: boolean[] = [];
  for (let i = 0; i < finalCodewords.length; i++) {
    const byte = finalCodewords[i];
    for (let b = 7; b >= 0; b--) {
      allBits.push(((byte >> b) & 1) === 1);
    }
  }
  for (let r = 0; r < 7; r++) {
    allBits.push(false);
  }

  const matrix: (number | null)[][] = Array.from({ length: SIZE }, () => new Array(SIZE).fill(null));
  const reserved: boolean[][] = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));

  function placeFinder(r: number, c: number) {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const row = r + y, col = c + x;
        if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
          reserved[row][col] = true;
          if (y >= 0 && y <= 6 && x >= 0 && x <= 6) {
            matrix[row][col] = (y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4)) ? 1 : 0;
          } else {
            matrix[row][col] = 0;
          }
        }
      }
    }
  }
  placeFinder(0, 0);
  placeFinder(0, SIZE - 7);
  placeFinder(SIZE - 7, 0);

  function placeAlignment(cr: number, cc: number) {
    for (let y = -2; y <= 2; y++) {
      for (let x = -2; x <= 2; x++) {
        reserved[cr + y][cc + x] = true;
        matrix[cr + y][cc + x] = (Math.max(Math.abs(y), Math.abs(x)) === 1) ? 0 : 1;
      }
    }
  }
  placeAlignment(34, 34);

  for (let i = 8; i < SIZE - 8; i++) {
    if (!reserved[6][i]) {
      reserved[6][i] = true;
      matrix[6][i] = (i % 2 === 0) ? 1 : 0;
    }
    if (!reserved[i][6]) {
      reserved[i][6] = true;
      matrix[i][6] = (i % 2 === 0) ? 1 : 0;
    }
  }

  reserved[33][8] = true;
  matrix[33][8] = 1;

  for (let i = 0; i <= 8; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = SIZE - 8; i < SIZE; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }

  let bitIdx = 0;
  let goingUp = true;
  for (let col = SIZE - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    const rows: number[] = [];
    for (let i = 0; i < SIZE; i++) {
      rows.push(goingUp ? (SIZE - 1 - i) : i);
    }
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = col; c >= col - 1; c--) {
        if (!reserved[row][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx] : false;
          bitIdx++;
          const mask = ((row + c) % 2 === 0);
          matrix[row][c] = ((bit ? 1 : 0) ^ (mask ? 1 : 0)) ? 1 : 0;
        }
      }
    }
    goingUp = !goingUp;
  }

  const fmt = 0x77c4;
  const fmtCoords1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  const fmtCoords2 = [[SIZE-1,8],[SIZE-2,8],[SIZE-3,8],[SIZE-4,8],[SIZE-5,8],[SIZE-6,8],[SIZE-7,8],[8,SIZE-8],[8,SIZE-7],[8,SIZE-6],[8,SIZE-5],[8,SIZE-4],[8,SIZE-3],[8,SIZE-2],[8,SIZE-1]];
  for (let i = 0; i < 15; i++) {
    const bit = (fmt >> (14 - i)) & 1;
    matrix[fmtCoords1[i][0]][fmtCoords1[i][1]] = bit;
    matrix[fmtCoords2[i][0]][fmtCoords2[i][1]] = bit;
  }

  return matrix;
}

export function generateSVG(text: string, options?: { size?: number; margin?: number; darkColor?: string; lightColor?: string }): string {
  const opt = options || {};
  const pxSize = opt.size || 240;
  const margin = (opt.margin !== undefined) ? opt.margin : 4;
  const darkColor = opt.darkColor || '#0A4F4B';
  const lightColor = opt.lightColor || '#FFFFFF';

  const matrix = createQrMatrix(text);
  const totalSize = SIZE + (margin * 2);

  let pathD = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (matrix[r][c] === 1) {
        const cx = c + margin;
        const cy = r + margin;
        pathD += `M${cx},${cy}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${pxSize}" height="${pxSize}" shape-rendering="crispEdges" aria-label="QR Code">
  <rect width="100%" height="100%" fill="${lightColor}"/>
  <path fill="${darkColor}" d="${pathD.trim()}"/>
</svg>`;
}

export const OsrawyQRCode = {
  SIZE,
  createMatrix: createQrMatrix,
  generateSVG
};
`

---

## src\engines\safety.ts

`typescript
export interface GuardrailAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  engine: string;
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  actionEn: string;
  actionAr: string;
  text?: string;
  message?: string;
  msg?: string;
  title?: string;
}

export interface DrugClassDefinition {
  id: string;
  nameEn: string;
  nameAr: string;
  drugs: string[];
}

export const DRUG_CLASSES: Record<string, DrugClassDefinition> = {
  biguanide: { id: 'biguanide', nameEn: 'Biguanide (Metformin)', nameAr: 'بيجوانيد (ميتفورمين)', drugs: ['met', 'metformin'] },
  su: { id: 'su', nameEn: 'Sulfonylurea', nameAr: 'سلفونيل يوريا', drugs: ['gliclazide', 'glimepiride'] },
  tzd: { id: 'tzd', nameEn: 'Thiazolidinedione', nameAr: 'ثيازوليدينديون', drugs: ['pio'] },
  sglt2i: { id: 'sglt2i', nameEn: 'SGLT2 inhibitor', nameAr: 'مثبطات SGLT2', drugs: ['dapa', 'empa', 'dapagliflozin', 'empagliflozin'] },
  dpp4i: { id: 'dpp4i', nameEn: 'DPP-4 inhibitor', nameAr: 'مثبطات DPP-4', drugs: ['sita', 'vilda', 'lina', 'sitagliptin'] },
  glp1ra: { id: 'glp1ra', nameEn: 'GLP-1 receptor agonist', nameAr: 'محفزات مستقبلات GLP-1', drugs: ['sema', 'osema', 'tirz', 'dula', 'lira'] },
  insulin: { id: 'insulin', nameEn: 'Insulin', nameAr: 'إنسولين', drugs: ['nph', 'glarg'] },
  acei: { id: 'acei', nameEn: 'ACE inhibitor', nameAr: 'مثبطات الإنزيم المحول للأنجيوتنسين', drugs: ['perindopril', 'ramipril', 'coveram', 'lisinopril', 'enalapril', 'captopril'] },
  arb: { id: 'arb', nameEn: 'Angiotensin Receptor Blocker (ARB)', nameAr: 'حاصرات مستقبلات الأنجيوتنسين', drugs: ['valsartan', 'losartan', 'telmisartan', 'candesartan', 'exforge', 'twynsta'] },
  ccb: { id: 'ccb', nameEn: 'Calcium Channel Blocker (CCB)', nameAr: 'حاصرات قنوات الكالسيوم', drugs: ['amlodipine'] },
  thiazide: { id: 'thiazide', nameEn: 'Thiazide / Thiazide-like diuretic', nameAr: 'مدرات البول الثيازيدية', drugs: ['indapamide', 'hydrochlorothiazide'] },
  bb: { id: 'bb', nameEn: 'Beta-blocker', nameAr: 'حاصرات بيتا', drugs: ['bisoprolol', 'labetalol', 'metoprolol', 'atenolol', 'propranolol'] },
  mra: { id: 'mra', nameEn: 'Mineralocorticoid Receptor Antagonist (MRA)', nameAr: 'مضادات مستقبلات القشرانيات المعدنية', drugs: ['spironolactone', 'eplerenone'] },
  statin: { id: 'statin', nameEn: 'Statin (HMG-CoA Reductase Inhibitor)', nameAr: 'مركبات الستاتين المخفضة للكوليسترول', drugs: ['atorva', 'rosuva', 'atorvastatin', 'rosuvastatin', 'simvastatin'] },
  fibrate: { id: 'fibrate', nameEn: 'Fibrate (PPAR-alpha agonist)', nameAr: 'مجموعة الفايبريت لخفض الدهون الثلاثية', drugs: ['fenofibrate', 'gemfibrozil'] },
  ezetimibe: { id: 'ezetimibe', nameEn: 'Cholesterol Absorption Inhibitor', nameAr: 'إيزيتيميب (مانع امتصاص الكوليسترول)', drugs: ['ezetimibe'] },
  pcsk9i: { id: 'pcsk9i', nameEn: 'PCSK9 Inhibitor', nameAr: 'مثبطات بروتين PCSK9', drugs: ['evolocumab', 'alirocumab'] }
};

function parseNumOr(val: unknown, fallback: number): number {
  if (val === undefined || val === null || val === '') return fallback;
  const n = parseFloat(String(val));
  return isNaN(n) ? fallback : n;
}

export function evaluateSafetyGuardrails(state: any): GuardrailAlert[] {
  const p = state || {};
  const alerts: GuardrailAlert[] = [];
  const egfr = parseNumOr(p.egfr, 0);
  const k = parseNumOr(p.k, 0);

  const medsRaw =
    (Array.isArray(p.meds) && p.meds.length ? p.meds : null) ||
    (Array.isArray(p.activeMeds) && p.activeMeds.length ? p.activeMeds : null) ||
    (Array.isArray(p.currentMeds) && p.currentMeds.length ? p.currentMeds : null) ||
    p.medications ||
    [];
  const meds: string[] = Array.isArray(medsRaw) ? medsRaw.map(m => String(m).toLowerCase()) : [];

  const hasDrug = (name: string) => meds.some(m => m.includes(name.toLowerCase()));
  const hasClass = (clsKey: string) => {
    if (!DRUG_CLASSES[clsKey]) return false;
    return DRUG_CLASSES[clsKey].drugs.some(d => meds.some(m => m.includes(d)));
  };

  function addAlert(a: GuardrailAlert) {
    a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
    a.message = `${a.messageEn} | ${a.messageAr}`;
    a.msg = a.messageEn;
    a.title = a.titleEn;
    alerts.push(a);
  }

  // 1. Metformin Renal Guardrails
  const onMetformin = hasDrug('met') || hasDrug('metformin') || hasClass('biguanide') || (p.diabetes && !p.hypo);
  if (egfr > 0 && egfr < 30 && onMetformin) {
    addAlert({
      id: 'guardrail-metformin-crit',
      level: 'critical',
      engine: 'diabetes',
      titleEn: 'Critical Alert: Metformin Contraindicated (eGFR < 30)',
      titleAr: 'تنبيه حرج: الميتفورمين ممنوع تماماً (eGFR < 30)',
      messageEn: `eGFR is ${egfr} mL/min/1.73m². Metformin carries a life-threatening risk of fatal lactic acidosis when eGFR < 30. Discontinue metformin immediately. Contraindicated in severe CKD.`,
      messageAr: `معدل الترشيح الكبيبي eGFR هو ${egfr} مل/دقيقة. يُحظر استخدام الميتفورمين تماماً لخطر الحماض اللبني (حمض اللاكتيك lactic acidosis) المميت. أوقف الميتفورمين فوراً.`,
      actionEn: 'Discontinue Metformin immediately and consider alternative agents.',
      actionAr: 'أوقف الميتفورمين فوراً واستبدله ببدائل آمنة كلوياً.'
    });
  } else if (egfr >= 30 && egfr < 45 && onMetformin) {
    addAlert({
      id: 'guardrail-metformin-warn',
      level: 'warning',
      engine: 'diabetes',
      titleEn: 'Renal Dose Guardrail: Metformin 1000 mg/day Cap (eGFR 30–44)',
      titleAr: 'تنبيه كلوي: الحد الأقصى للميتفورمين 1000 مجم/يوم (eGFR 30–44)',
      messageEn: `eGFR is ${egfr} mL/min/1.73m² (Stage G3b). Dose cap: Metformin dose must not exceed 1000 mg/day (500 mg twice daily). Do not initiate new therapy at this stage.`,
      messageAr: `معدل الترشيح الكبيبي eGFR هو ${egfr} مل/دقيقة. الجرعة القصوى (cap) للميتفورمين هي 1000 مجم/يوم (500 مجم مرتين مع الوجبات). لا تبدأ علاجاً جديداً.`,
      actionEn: 'Cap Metformin dose at 1000 mg/day and monitor renal function every 3 months.',
      actionAr: 'قلص جرعة الميتفورمين إلى 1000 مجم/يوم وراقب وظائف الكلى كل 3 أشهر.'
    });
  }

  // 2. Dual RAAS Blockade (ACEi + ARB)
  const hasAcei = !!p.acei || hasClass('acei') || hasDrug('ace') || hasDrug('perindopril') || hasDrug('ramipril') || hasDrug('lisinopril') || hasDrug('enalapril') || hasDrug('coveram');
  const hasArb = !!p.arb || hasClass('arb') || hasDrug('arb') || hasDrug('valsartan') || hasDrug('losartan') || hasDrug('telmisartan') || hasDrug('candesartan') || hasDrug('exforge') || hasDrug('twynsta');
  if (hasAcei && hasArb) {
    addAlert({
      id: 'guardrail-dual-raas',
      level: 'critical',
      engine: 'htn',
      titleEn: 'Contraindication: Dual RAAS Blockade (ACEi + ARB)',
      titleAr: 'موانع استخدام حرجة: الجمع بين مثبطات ACE وحاصرات ARB (ازدواج)',
      messageEn: 'Dual RAAS blockade (ACE inhibitor + ARB) is contraindicated: provides no cardiovascular benefit and substantially increases risk of severe hyperkalemia, acute kidney injury (AKI), and syncope. Discontinue one immediately.',
      messageAr: 'يُمنع منعاً باتاً الجمع المزدوج بين (ACEi و ARB) لعدم وجود فائدة قلبية مع خطر شديد من الفشل الكلوي الحاد وارتفاع البوتاسيوم القاتل.',
      actionEn: 'Discontinue either ACEi or ARB immediately; maintain single RAAS blockade.',
      actionAr: 'أوقف أحدهما فوراً واكتفِ بنوع واحد فقط من حاصرات الرينين أنجيوتنسين.'
    });
  }

  // 3. Hyperkalemia (K+ Guardrails)
  if (k >= 5.5) {
    addAlert({
      id: 'guardrail-hyperkalemia-crit',
      level: 'critical',
      engine: 'htn',
      titleEn: `Critical Alert: Severe Hyperkalemia (K+ = ${k} mEq/L)`,
      titleAr: `تنبيه حرج: ارتفاع حاد في البوتاسيوم (K+ = ${k} mEq/L)`,
      messageEn: `Serum potassium is ${k} mEq/L (≥ 5.5). Life-threatening arrhythmia risk! Immediately discontinue/hold ACEi, ARB, and MRA (Spironolactone). Recheck urgent ECG and serum electrolytes.`,
      messageAr: `نسبة البوتاسيوم في الدم ${k} mEq/L (≥ 5.5). خطر اضطراب نظم القلب القاتل! أوقف فوراً مثبطات ACEi و ARB والسبيرونولاكتون (MRA) واطلب تخطيط قلب فوري.`,
      actionEn: 'Stop RAAS inhibitors and MRA immediately; order urgent stat ECG and repeat K+.',
      actionAr: 'أوقف فوراً أدوية الضغط المسببة لارتفاع البوتاسيوم واطلب تخطيط قلب فوري.'
    });
  } else if (k > 5.0) {
    addAlert({
      id: 'guardrail-hyperkalemia-warn',
      level: 'warning',
      engine: 'htn',
      titleEn: `Warning: Elevated Potassium (K+ = ${k} mEq/L) - Avoid MRA`,
      titleAr: `تحذير: ارتفاع البوتاسيوم (K+ = ${k}) - تجنب السبيرونولاكتون (MRA)`,
      messageEn: `Serum potassium is ${k} mEq/L (> 5.0). Precaution: Avoid initiating or up-titrating MRA (Spironolactone/Eplerenone). Exercise caution with ACEi/ARB and monitor electrolytes within 1–2 weeks.`,
      messageAr: `نسبة البوتاسيوم ${k} mEq/L. تجنب بدء أو زيادة جرعة السبيرونولاكتون (MRA). توخّ الحذر مع أدوية الضغط وراقب البوتاسيوم بعد أسبوع إلى أسبوعين.`,
      actionEn: 'Avoid MRA initiation/titration; recheck K+ and renal profile in 1-2 weeks.',
      actionAr: 'تجنب أدوية MRA وأعد فحص وظائف الكلى والبوتاسيوم بعد 1-2 أسبوع.'
    });
  }

  // 4. Pregnancy Teratogenicity
  if (p.pregnancy || p.preg || p.pregHtn) {
    addAlert({
      id: 'guardrail-pregnancy-teratogen',
      level: 'critical',
      engine: 'multidisciplinary',
      titleEn: 'Teratogenic Alert: Pregnancy / Planning Pregnancy - Stop RAAS / SGLT2i / Statins',
      titleAr: 'تنبيه تشوه الأجنة: الحمل أو التخطيط للحمل - إيقاف أدوية الضغط والستاتين',
      messageEn: 'Pregnancy detected: Stop ACEi, ARB, MRA, SGLT2i, and Statins immediately! Contraindicated due to fetal renal dysgenesis, skull hypoplasia, and perinatal death (FDA Category D/X teratogenicity). Switch HTN to Labetalol, Methyldopa, or Nifedipine; switch DM to Insulin.',
      messageAr: 'تنبيه الحمل: أوقف فوراً أدوية (ACEi, ARB, MRA, SGLT2i, Statins)! ممنوع تماماً ومحظر لتسببه بتشوهات مميتة للكلى الجنينية وتكلس العظام. أدوية الضغط الآمنة للحمل: ميثيل دوبا، لابيتاول، أو نيفيديبين. علاج السكر الآمن: الإنسولين.',
      actionEn: 'Switch HTN to Labetalol/Methyldopa; switch DM to Insulin; discontinue Statins/SGLT2i immediately.',
      actionAr: 'حوّل علاج الضغط إلى لابيتاول أو ميثيل دوبا، وعلاج السكر للإنسولين، وأوقف الستاتين فوراً.'
    });
  }

  // 5. Cross-Engine Organ Protection Recommendation
  const hasCkd = (egfr > 0 && egfr < 60) || (parseFloat(p.uacr) >= 30);
  const hasHf = p.hf && p.hf !== 'none' && p.hf !== false;
  if ((hasCkd || hasHf) && egfr >= 20 && !p.pregnancy && !p.preg && !p.pregHtn) {
    addAlert({
      id: 'guardrail-sglt2-organ-protect',
      level: 'info',
      engine: 'cardiorenal',
      titleEn: 'Cardio-Renal Organ Protection: SGLT2 Inhibitor Indicated',
      titleAr: 'حماية الأعضاء الحيوية: توصية بمثبطات SGLT2 لحماية الكلى والقلب',
      messageEn: `Patient has CKD (eGFR ${egfr}, UACR ${p.uacr || 30} mg/g) and/or Heart Failure with eGFR ≥ 20. SGLT2 inhibitor (Dapagliflozin 10mg or Empagliflozin 10mg) is strongly recommended for renal protection, organ protection, slowing CKD progression, and reducing cardiovascular events.`,
      messageAr: `المريض لديه اعتلال كلوي أو قصور قلب مع وظائف كلى eGFR ≥ 20. يُوصى بشدة ببدء مثبطات SGLT2 (داباجليفلوزين 10 مجم أو إمباجليفلوزين 10 مجم) لحماية الكلى والأعضاء وخفض الوفيات.`,
      actionEn: 'Add SGLT2i (Dapagliflozin 10mg or Empagliflozin 10mg daily) for cardiorenal protection.',
      actionAr: 'أضف مثبط SGLT2 (داباجليفلوزين 10 مجم أو إمباجليفلوزين 10 مجم يومياً).'
    });
  }

  return alerts;
}
`

---

## src\engines\tools.ts

`typescript
import { calculateCrCl } from './calculators';

export function evaluateKdigoMatrix(egfrVal: any, acrVal?: any): any {
  let egfr = 0, acr = 0;
  if (typeof egfrVal === 'object' && egfrVal !== null) {
    egfr = parseFloat(String(egfrVal.egfr || egfrVal.eGFR)) || 0;
    acr = parseFloat(String(egfrVal.acrMgG || egfrVal.uacr || egfrVal.acr || egfrVal.urineAcr)) || 0;
  } else {
    egfr = parseFloat(String(egfrVal)) || 0;
    acr = parseFloat(String(acrVal)) || 0;
  }

  let gStage = 'G1';
  let gDescEn = 'Normal or high (≥90 mL/min/1.73m²)';
  let gDescAr = 'طبيعي أو مرتفع (≥90 مل/دقيقة)';
  if (egfr >= 90) {
    gStage = 'G1';
  } else if (egfr >= 60) {
    gStage = 'G2';
    gDescEn = 'Mildly decreased (60–89 mL/min/1.73m²)';
    gDescAr = 'انخفاض طفيف (60–89 مل/دقيقة)';
  } else if (egfr >= 45) {
    gStage = 'G3a';
    gDescEn = 'Mildly to moderately decreased (45–59 mL/min/1.73m²)';
    gDescAr = 'انخفاض طفيف إلى متوسط (45–59 مل/دقيقة)';
  } else if (egfr >= 30) {
    gStage = 'G3b';
    gDescEn = 'Moderately to severely decreased (30–44 mL/min/1.73m²)';
    gDescAr = 'انخفاض متوسط إلى شديد (30–44 مل/دقيقة)';
  } else if (egfr >= 15) {
    gStage = 'G4';
    gDescEn = 'Severely decreased (15–29 mL/min/1.73m²)';
    gDescAr = 'انخفاض شديد (15–29 مل/دقيقة)';
  } else {
    gStage = 'G5';
    gDescEn = 'Kidney failure (<15 mL/min/1.73m²)';
    gDescAr = 'فشل كلوي نهائي (<15 مل/دقيقة)';
  }

  let aStage = 'A1';
  let aDescEn = 'Normal to mildly increased (<30 mg/g or <3 mg/mmol)';
  let aDescAr = 'طبيعي أو ارتفاع طفيف (<30 مجم/جم)';
  if (acr < 30) {
    aStage = 'A1';
  } else if (acr <= 300) {
    aStage = 'A2';
    aDescEn = 'Moderately increased (30–300 mg/g or 3–30 mg/mmol)';
    aDescAr = 'ارتفاع متوسط / بيلة ألبومينية دقيقة (30–300 مجم/جم)';
  } else {
    aStage = 'A3';
    aDescEn = 'Severely increased (>300 mg/g or >30 mg/mmol)';
    aDescAr = 'ارتفاع شديد / بيلة ألبومينية صريحة (>300 مجم/جم)';
  }

  const composite = `${gStage}${aStage}`;

  let risk = 'low';
  let riskTier = 'LOW';
  let color = 'green';
  let riskLabelEn = 'Low Risk';
  let riskLabelAr = 'خطورة منخفضة';
  let monitoringEn = '1 time per year';
  let monitoringAr = 'مرة واحدة سنوياً';
  let monitorPerYear = 1;
  let referral = false;
  let recommendationEn = '';
  let recommendationAr = '';

  if (gStage === 'G4' || gStage === 'G5' || (gStage === 'G3b' && (aStage === 'A2' || aStage === 'A3')) || (gStage === 'G3a' && aStage === 'A3')) {
    risk = 'very_high';
    riskTier = 'VERY_HIGH';
    color = 'red';
    riskLabelEn = 'Very High Risk';
    riskLabelAr = 'خطورة عالية جداً';
    monitoringEn = '3 to 4+ times per year; Nephrology referral recommended';
    monitoringAr = '3 إلى 4+ مرات سنوياً؛ يُوصى بتحويل المريض لاستشاري أمراض الكلى';
    monitorPerYear = 4;
    referral = true;
    recommendationEn = 'Very high risk of CKD progression, ESKD, and cardiovascular mortality. SGLT2i and ACEi/ARB recommended if indicated. Nephrology referral strongly recommended.';
    recommendationAr = 'خطورة عالية جداً لتدهور وظائف الكلى والفشل الكلوي وأمراض القلب. يُوصى بمثبطات SGLT2 وحاصرات الرينين، مع تحويل عاجل لأخصائي الكلى.';
  } else if ((gStage === 'G3b' && aStage === 'A1') || (gStage === 'G3a' && aStage === 'A2') || ((gStage === 'G1' || gStage === 'G2') && aStage === 'A3')) {
    risk = 'high';
    riskTier = 'HIGH';
    color = 'orange';
    riskLabelEn = 'High Risk';
    riskLabelAr = 'خطورة عالية';
    monitoringEn = '2 times per year';
    monitoringAr = 'مرتان سنوياً';
    monitorPerYear = 2;
    referral = (aStage === 'A3' || gStage === 'G3b');
    recommendationEn = 'High risk of CKD progression and CV events. Optimize BP (<130/80), initiate ACEi/ARB for albuminuria, add SGLT2i for cardiorenal protection, and monitor every 6 months.';
    recommendationAr = 'خطورة عالية لتدهور وظائف الكلى. اضبط الضغط (<130/80)، ابدأ أدوية ACEi/ARB للزلال وأضف مثبط SGLT2 لحماية الكلى، وراقب كل 6 أشهر.';
  } else if ((gStage === 'G3a' && aStage === 'A1') || ((gStage === 'G1' || gStage === 'G2') && aStage === 'A2')) {
    risk = 'moderate';
    riskTier = 'MODERATE';
    color = 'yellow';
    riskLabelEn = 'Moderately Increased Risk';
    riskLabelAr = 'خطورة متزايدة بشكل معتدل';
    monitoringEn = '1 time per year';
    monitoringAr = 'مرة واحدة سنوياً';
    monitorPerYear = 1;
    referral = false;
    recommendationEn = 'Moderately increased risk. Screen and treat cardiovascular risk factors, optimize glycemic & BP control, re-evaluate eGFR and UACR annually.';
    recommendationAr = 'خطورة متزايدة بشكل معتدل. علاج عوامل الخطورة القلبية، ضبط السكر وضغط الدم، وإعادة فحص وظائف الكلى وزلال البول سنوياً.';
  } else {
    risk = 'low';
    riskTier = 'LOW';
    color = 'green';
    riskLabelEn = 'Low Risk (No evidence of CKD if no structural damage)';
    riskLabelAr = 'خطورة منخفضة (لا يوجد دليل على اعتلال الكلى ما لم توجد علامات نسيجية)';
    monitoringEn = '1 time per year (if high risk for CKD: diabetes/HTN)';
    monitoringAr = 'مرة واحدة سنوياً (إذا كان المريض معرضاً لخطر الاعتلال كالسكري والضغط)';
    monitorPerYear = 1;
    referral = false;
    recommendationEn = 'Low risk. Maintain healthy lifestyle, monitor annually if diabetic or hypertensive.';
    recommendationAr = 'خطورة منخفضة. الحفاظ على نمط حياة صحي وإعادة الفحص سنوياً لمرضى السكري والضغط.';
  }

  return {
    egfr,
    acrMgG: acr,
    gStage,
    aStage,
    stage: composite,
    composite,
    risk: riskTier,
    riskTier,
    riskLevel: risk,
    color,
    riskLabelEn,
    riskLabelAr,
    gDescEn,
    gDescAr,
    aDescEn,
    aDescAr,
    monitoringEn,
    monitoringAr,
    monitorPerYear,
    referral,
    recommendationEn,
    recommendationAr,
    actionEn: recommendationEn,
    actionAr: recommendationAr
  };
}

export function calculateFib4(arg1: any, arg2?: any, arg3?: any, arg4?: any): any {
  let age = 0, ast = 0, alt = 0, plt = 0;

  if (typeof arg1 === 'object' && arg1 !== null) {
    age = parseFloat(String(arg1.age)) || 0;
    ast = parseFloat(String(arg1.astUl || arg1.ast || arg1.got)) || 0;
    alt = parseFloat(String(arg1.altUl || arg1.alt || arg1.gpt)) || 0;
    plt = parseFloat(String(arg1.platelets10e9L || arg1.platelets || arg1.plt)) || 0;
  } else {
    age = parseFloat(String(arg1)) || 0;
    ast = parseFloat(String(arg2)) || 0;
    alt = parseFloat(String(arg3)) || 0;
    plt = parseFloat(String(arg4)) || 0;
  }

  if (plt > 1000) {
    plt = plt / 1000;
  }

  if (age <= 0 || ast <= 0 || alt <= 0 || plt <= 0) return null;

  const fib4 = (age * ast) / (plt * Math.sqrt(alt));
  const scoreRound = Math.round(fib4 * 100) / 100;

  const lowCutoff = (age >= 65) ? 2.00 : 1.30;
  const highCutoff = 2.67;

  let risk = 'LOW';
  let riskTier = 'LOW';
  let referral = false;
  let interpretationEn = '';
  let interpretationAr = '';
  let actionEn = '';
  let actionAr = '';
  let planEn = '';
  let planAr = '';

  if (scoreRound > highCutoff) {
    risk = 'HIGH';
    riskTier = 'HIGH';
    referral = true;
    interpretationEn = `High risk of advanced liver fibrosis / cirrhosis (F3–F4). Score: ${scoreRound} (> 2.67).`;
    interpretationAr = `خطورة عالية لتليف الكبد المتقدم أو التشمع (F3–F4). النتيجة: ${scoreRound} (> 2.67).`;
    actionEn = 'Refer to Gastroenterology / Hepatology for specialized liver fibrosis assessment (FibroScan / VCTE) and avoid hepatotoxic medications.';
    actionAr = 'يُوصى بتحويل المريض فوراً لاستشاري الكبد والجهاز الهضمي لعمل قياس مرونة الكبد (FibroScan / VCTE) وتجنب الأدوية السامة للكبد.';
    planEn = actionEn;
    planAr = actionAr;
  } else if (scoreRound >= lowCutoff) {
    risk = 'INTERMEDIATE';
    riskTier = 'INTERMEDIATE';
    referral = false;
    interpretationEn = `Indeterminate / Intermediate risk of advanced fibrosis. Score: ${scoreRound} (${lowCutoff}–${highCutoff}).`;
    interpretationAr = `خطورة غير مؤكدة / متوسطة لتليف الكبد. النتيجة: ${scoreRound} (${lowCutoff}–${highCutoff}).`;
    actionEn = 'Second-line non-invasive assessment indicated: Enhanced Liver Fibrosis (ELF) test or vibration-controlled transient elastography (VCTE / FibroScan).';
    actionAr = 'يُوصى بفحص تأكيدي ثانوي: قياس مرونة الكبد (FibroScan) أو تحليل ELF لتحديد دقيق لدرجة التليف.';
    planEn = actionEn;
    planAr = actionAr;
  } else {
    risk = 'LOW';
    riskTier = 'LOW';
    referral = false;
    interpretationEn = `Low risk of advanced liver fibrosis (F0–F1). Score: ${scoreRound} (< ${lowCutoff}). Negative predictive value > 90%.`;
    interpretationAr = `خطورة منخفضة لتليف الكبد المتقدم (F0–F1). النتيجة: ${scoreRound} (< ${lowCutoff}). القيمة التنبؤية السلبية تتجاوز 90%.`;
    actionEn = 'Continue lifestyle interventions, manage metabolic comorbidities, and repeat FIB-4 screening in 2–3 years (or 1–2 years if high metabolic risk).';
    actionAr = 'الاستمرار في تحسين نمط الحياة وضبط السكر والدهون، وتكرار فحص FIB-4 كل 2-3 سنوات.';
    planEn = actionEn;
    planAr = actionAr;
  }

  const res: any = new Number(scoreRound);
  res.score = scoreRound;
  res.fib4 = scoreRound;
  res.value = scoreRound;
  res.risk = risk;
  res.riskTier = riskTier;
  res.riskLevel = risk;
  res.riskLabelEn = riskTier === 'HIGH' ? 'High Risk' : (riskTier === 'INTERMEDIATE' ? 'Intermediate Risk' : 'Low Risk');
  res.riskLabelAr = riskTier === 'HIGH' ? 'خطورة عالية' : (riskTier === 'INTERMEDIATE' ? 'خطورة متوسطة' : 'خطورة منخفضة');
  res.referral = referral;
  res.interpretationEn = interpretationEn;
  res.interpretationAr = interpretationAr;
  res.actionEn = actionEn;
  res.actionAr = actionAr;
  res.planEn = planEn;
  res.planAr = planAr;
  res.lowCutoff = lowCutoff;
  res.highCutoff = highCutoff;
  res.age = age;
  res.ast = ast;
  res.alt = alt;
  res.platelets = plt;
  res.toString = () => String(scoreRound);
  res.valueOf = () => scoreRound;
  return res;
}

export function evaluateDoacDosing(patientInput: any): any {
  const pt = patientInput || {};
  const age = parseFloat(String(pt.age)) || 0;
  const wt = parseFloat(String(pt.weightKg || pt.wt || pt.weight)) || 0;
  const scrVal = parseFloat(String(pt.creatinineMgDl || pt.scr || pt.creatinine || pt.scrMg)) || 0;
  const unit = pt.scrUnit || pt.unit || 'mg';
  const scrMg = (unit === 'umol') ? (scrVal / 88.4) : scrVal;
  const sexRaw = String(pt.sex || pt.gender || 'm').toLowerCase();
  const sex = (sexRaw === 'f' || sexRaw === 'female') ? 'f' : 'm';

  let crcl = parseFloat(String(pt.crcl));
  if (isNaN(crcl) || crcl <= 0) {
    const calc = calculateCrCl(age, wt, scrMg, sex);
    crcl = calc ? calc.crcl : 0;
  }

  // Apixaban (Eliquis)
  const critAge = (age >= 80);
  const critWeight = (wt > 0 && wt <= 60);
  const critScr = (scrMg >= 1.5);
  const criteriaCount = (critAge ? 1 : 0) + (critWeight ? 1 : 0) + (critScr ? 1 : 0);
  const meets2of3 = (criteriaCount >= 2);

  let apixabanDose = '5 mg PO BID';
  let apixabanDoseAr = '٥ ملغ مرتين يومياً';
  let apixabanEn = '5 mg PO BID (Standard dose)';
  let apixabanAr = '٥ ملغ فموياً مرتين يومياً (5 mg PO BID - جرعة قياسية)';
  let apixabanReduced = false;
  let apixabanContraindicated = false;
  let apixabanReasonEn = 'Standard dose: fewer than 2 dose-reduction criteria met.';
  let apixabanReasonAr = 'الجرعة القياسية: المريض يستوفي أقل من معيارين من معايير تخفيض الجرعة.';

  if (crcl > 0 && crcl < 15) {
    apixabanContraindicated = true;
    apixabanDose = 'Contraindicated / Not recommended';
    apixabanDoseAr = 'ممنوع استخدامه / غير موصى به';
    apixabanEn = 'Contraindicated / Not recommended (CrCl < 15 mL/min)';
    apixabanAr = 'غير موصى به / ممنوع استخدامه (تصفية الكرياتينين < 15)';
    apixabanReasonEn = `CrCl is ${crcl} mL/min (<15 mL/min). Apixaban is contraindicated / not recommended in severe ESRD without dialysis per European/KDIGO guidelines.`;
    apixabanReasonAr = `تصفية الكرياتينين ${crcl} مل/دقيقة (<15). يُحظر استخدام أبيكسابان في الفشل الكلوي النهائي دون غسيل.`;
  } else if (meets2of3) {
    apixabanReduced = true;
    apixabanDose = '2.5 mg PO BID';
    apixabanDoseAr = '٢.٥ ملغ مرتين يومياً';
    apixabanEn = '2.5 mg PO BID (Dose reduced per 2-of-3 ABC criteria)';
    apixabanAr = '٢.٥ ملغ فموياً مرتين يومياً (2.5 mg PO BID - مخفض)';
    const metList: string[] = [];
    if (critAge) metList.push(`Age ≥ 80 (${age} y)`);
    if (critWeight) metList.push(`Weight <= 60 kg (${wt} kg)`);
    if (critScr) metList.push(`Serum Creatinine ≥ 1.5 mg/dL (${scrMg} mg/dL)`);
    apixabanReasonEn = `Dose reduced to 2.5 mg PO BID: Patient meets ${criteriaCount} of 3 dose-reduction criteria [${metList.join(', ')}].`;
    apixabanReasonAr = `تم تخفيض الجرعة إلى ٢.٥ ملغ (2.5 mg PO BID) لاستيفاء ${criteriaCount} من 3 معايير لتخفيض الجرعة (${metList.join('، ')}).`;
  } else if (crcl >= 15 && crcl < 30) {
    apixabanReduced = true;
    apixabanDose = '2.5 mg PO BID';
    apixabanDoseAr = '٢.٥ ملغ مرتين يومياً';
    apixabanEn = '2.5 mg PO BID (CrCl 15–29 mL/min)';
    apixabanAr = '٢.٥ ملغ فموياً مرتين يومياً (2.5 mg PO BID)';
    apixabanReasonEn = `CrCl 15–29 mL/min (${crcl} mL/min): Dose reduction to 2.5 mg PO BID recommended for advanced renal impairment.`;
    apixabanReasonAr = `تصفية الكرياتينين 15–29 مل/دقيقة: يُوصى بتخفيض الجرعة إلى ٢.٥ ملغ مرتين يومياً لقصور وظائف الكلى.`;
  }

  const apixaban = {
    drug: 'Apixaban (Eliquis)',
    drugAr: 'أبيكسابان (إليكويس)',
    dose: apixabanDose,
    doseEn: apixabanDose,
    doseAr: apixabanDoseAr,
    frequency: 'twice daily',
    frequencyAr: 'مرتين يومياً',
    reducedDose: apixabanReduced,
    contraindicated: apixabanContraindicated,
    criteriaCount,
    meets2of3,
    criteria: {
      ageGte80: critAge,
      weightLte60: critWeight,
      scrGte1_5: critScr
    },
    reasonEn: apixabanReasonEn,
    reasonAr: apixabanReasonAr,
    clinicalNotesEn: 'Take with or without food. Monitor renal function at least annually (every 3–6 months if CrCl < 50 mL/min).',
    clinicalNotesAr: 'يؤخذ مع أو بدون طعام. راقب وظائف الكلى سنوياً على الأقل (وكل 3-6 أشهر إذا كانت التصفية < 50 مل/دقيقة).'
  };

  // Rivaroxaban (Xarelto)
  let rivaroxabanDose = '20 mg PO daily with food';
  let rivaroxabanDoseAr = '20 مجم مرة واحدة يومياً مع وجبة العشاء/الطعام';
  let rivaroxabanEn = '20 mg PO daily with food';
  let rivaroxabanAr = '٢٠ ملغ فموياً مرة واحدة يومياً مع وجبة الطعام (20 mg PO daily with food)';
  let rivaroxabanReduced = false;
  let rivaroxabanContraindicated = false;
  let rivaroxabanReasonEn = `CrCl ≥ 50 mL/min (${crcl} mL/min): Standard 20 mg daily with food.`;
  let rivaroxabanReasonAr = `تصفية الكرياتينين ≥ 50 مل/دقيقة (${crcl} مل/دقيقة): الجرعة القياسية 20 مجم يومياً مع الطعام.`;

  if (crcl > 0 && crcl < 15) {
    rivaroxabanContraindicated = true;
    rivaroxabanDose = 'Contraindicated / Not recommended';
    rivaroxabanDoseAr = 'ممنوع استخدامه / غير موصى به';
    rivaroxabanEn = 'Contraindicated / Not recommended (CrCl < 15 mL/min)';
    rivaroxabanAr = 'غير موصى به / ممنوع استخدامه';
    rivaroxabanReasonEn = `CrCl is ${crcl} mL/min (<15 mL/min). Rivaroxaban is contraindicated / not recommended due to bleeding risk in ESRD.`;
    rivaroxabanReasonAr = `تصفية الكرياتينين ${crcl} مل/دقيقة (<15). يُحظر استخدام ريفاروكسابان لخطر النزيف في الفشل الكلوي المتقدم.`;
  } else if (crcl >= 15 && crcl < 50) {
    rivaroxabanReduced = true;
    rivaroxabanDose = '15 mg PO daily with food';
    rivaroxabanDoseAr = '15 مجم مرة واحدة يومياً مع وجبة الطعام (مساءً)';
    rivaroxabanEn = '15 mg PO daily with food (CrCl 15–49 mL/min)';
    rivaroxabanAr = '١٥ ملغ فموياً مرة واحدة يومياً مع الطعام (15 mg PO daily with food)';
    rivaroxabanReasonEn = `CrCl 15–49 mL/min (${crcl} mL/min): Dose reduced to 15 mg once daily with food to maintain therapeutic exposure.`;
    rivaroxabanReasonAr = `تصفية الكرياتينين 15–49 مل/دقيقة (${crcl} مل/دقيقة): تم تخفيض الجرعة إلى 15 مجم مرة واحدة يومياً مع وجبة الطعام.`;
  }

  const rivaroxaban = {
    drug: 'Rivaroxaban (Xarelto)',
    drugAr: 'ريفاروكسابان (زاريلتو)',
    dose: rivaroxabanDose,
    doseEn: rivaroxabanDose,
    doseAr: rivaroxabanDoseAr,
    frequency: 'once daily with food',
    frequencyAr: 'مرة واحدة يومياً مع وجبة طعام رئيسية',
    reducedDose: rivaroxabanReduced,
    contraindicated: rivaroxabanContraindicated,
    reasonEn: rivaroxabanReasonEn,
    reasonAr: rivaroxabanReasonAr,
    clinicalNotesEn: 'MUST be taken with food (preferably evening meal) for adequate absorption (AUC increases by 39% with food).',
    clinicalNotesAr: 'يجب تناوله مع الطعام (يفضل مع وجبة العشاء) لضمان الامتصاص الكامل؛ الطعام يزيد من التوافر الحيوي بنسبة 39%.'
  };

  return {
    crcl,
    apixabanEn,
    apixabanAr,
    rivaroxabanEn,
    rivaroxabanAr,
    apixaban,
    rivaroxaban
  };
}

export function buildEmrNote(engine: string, patient: any, details: any): string {
  const p = patient || {};
  const dateStr = new Date().toISOString().split('T')[0];
  let note = `[Osrawy Clinical Note - ${dateStr}]\n`;
  note += `Patient: ${p.name || 'Anonymous'} | Age: ${p.age || '-'} | Sex: ${p.sex || '-'}\n`;
  note += `eGFR: ${p.egfr || '-'} mL/min | BP: ${p.sbp || '-'}/${p.dbp || '-'} mmHg | K+: ${p.k || '-'} mEq/L\n\n`;

  if (engine === 'diabetes') {
    note += `[Diabetes Management]\n`;
    note += `HbA1c: ${p.a1c || '-'}% | FPG: ${p.fpg || '-'} mg/dL | Duration: ${p.dur || '-'} yrs\n`;
    if (details?.recommendation) note += `Plan: ${details.recommendation}\n`;
  } else if (engine === 'htn') {
    note += `[Hypertension Management]\n`;
    note += `BP: ${p.sbp || '-'}/${p.dbp || '-'} mmHg\n`;
    if (details?.classification) note += `Classification: ${details.classification}\n`;
    if (details?.plan) note += `Plan: ${details.plan}\n`;
  } else if (engine === 'lipids') {
    note += `[Lipids Management]\n`;
    note += `LDL-C: ${p.ldlC || '-'} mg/dL | TC: ${p.tc || p.totalCholesterol || '-'} mg/dL | TG: ${p.triglycerides || '-'} mg/dL\n`;
    if (details?.stratification) note += `Risk Tier: ${details.stratification.tier}\n`;
    if (details?.recommendation) note += `Recommendation: ${details.recommendation}\n`;
  }

  return note;
}
`

---

## src\store\useAppStore.ts

`typescript
import { create } from 'zustand';

export type AppTab = 'dm' | 'htn' | 'dlp' | 'tools' | 'patient' | 'drugs';
export type AppMarket = 'sa' | 'eg';
export type AppLang = 'ar' | 'en';
export type AppTheme = 'light' | 'dark';

export interface AppStore {
  activeTab: AppTab;
  previousTab: AppTab;
  market: AppMarket;
  lang: AppLang;
  theme: AppTheme;
  overlayStack: string[];
  setActiveTab: (tab: AppTab) => void;
  setMarket: (market: AppMarket) => void;
  setLang: (lang: AppLang) => void;
  setTheme: (theme: AppTheme) => void;
  pushOverlay: (id: string) => void;
  popOverlay: () => boolean;
  closeAllOverlays: () => void;
  handleAndroidBack: () => boolean;
}

let memoryStorage: Record<string, string> = {};

function getStoredString<T extends string>(key: string, fallback: T): T {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(key);
      if (val) return val as T;
    }
  } catch {}
  return (memoryStorage[key] as T) || fallback;
}

function setStoredString(key: string, val: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
      return;
    }
  } catch {}
  memoryStorage[key] = val;
}

export const useAppStore = create<AppStore>((set, get) => {
  const initialMarket = getStoredString<AppMarket>('osrawy_market', 'sa');
  const initialLang = getStoredString<AppLang>('osrawy_lang', 'ar');
  const initialTheme = getStoredString<AppTheme>('osrawy_theme', 'light');

  if (typeof document !== 'undefined') {
    document.documentElement.lang = initialLang;
    document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('data-theme', initialTheme);
  }

  return {
    activeTab: 'dm',
    previousTab: 'dm',
    market: initialMarket,
    lang: initialLang,
    theme: initialTheme,
    overlayStack: [],

    setActiveTab: (tab) => {
      const current = get().activeTab;
      if (current !== tab) {
        set({ activeTab: tab, previousTab: current });
      }
    },

    setMarket: (market) => {
      setStoredString('osrawy_market', market);
      set({ market });
    },

    setLang: (lang) => {
      setStoredString('osrawy_lang', lang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      }
      set({ lang });
    },

    setTheme: (theme) => {
      setStoredString('osrawy_theme', theme);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      set({ theme });
    },

    pushOverlay: (id) => {
      const stack = [...get().overlayStack, id];
      set({ overlayStack: stack });
    },

    popOverlay: () => {
      const stack = [...get().overlayStack];
      if (stack.length > 0) {
        stack.pop();
        set({ overlayStack: stack });
        return true;
      }
      return false;
    },

    closeAllOverlays: () => {
      set({ overlayStack: [] });
    },

    handleAndroidBack: () => {
      // 1. If an overlay/modal/sheet is open, close it first
      const stack = [...get().overlayStack];
      if (stack.length > 0) {
        stack.pop();
        set({ overlayStack: stack });
        return true;
      }

      // 2. If viewing drug directory or non-main tab, return to previous tab
      const currentTab = get().activeTab;
      if (currentTab === 'drugs') {
        const prev = get().previousTab || 'dm';
        set({ activeTab: prev });
        return true;
      }

      // 3. If not on primary home tab (dm), navigate back to dm
      if (currentTab !== 'dm') {
        set({ activeTab: 'dm' });
        return true;
      }

      // 4. On root screen with no overlays: allow default Android back action (minimize)
      return false;
    }
  };
});

// Setup native Android back press bridge
if (typeof window !== 'undefined') {
  (window as any).handleAndroidBack = () => {
    return useAppStore.getState().handleAndroidBack();
  };
}
`

---

## src\store\usePatientStore.ts

`typescript
import { create } from 'zustand';
import { evaluateSafetyGuardrails, GuardrailAlert } from '../engines/safety';
import { calculateBMI } from '../engines/calculators';

export interface PatientState {
  name: string;
  age: number;
  sex: 'm' | 'f';
  wt: number;
  ht: number;
  dur: number;
  hf: 'none' | 'hfref' | 'hfpef';
  a1c: number;
  fpg: number;
  egfr: number;
  uacr: number;
  sbp: number;
  dbp: number;
  k: number;
  tc: number;
  hdl: number;
  totalCholesterol: number;
  ldlC: number;
  hdlC: number;
  triglycerides: number;
  altUl: number;
  lipidUnit: 'mg' | 'mmol';
  smoker: boolean;
  statin: boolean;
  ascvd: boolean;
  diabetes: boolean;
  dm: boolean;
  statinIntolerant: boolean;
  pregnancy: boolean;
  postpartum: boolean;
  trimester: number;
  gestationalWeeks: number;
  asthma: boolean;
  copd: boolean;
  tsh: number;
  ft4: number;
  medications: string[];
  activeMeds: string[];
}

export interface PatientDraft {
  id: string;
  timestamp: number;
  patient: PatientState;
}

export const DEFAULT_PATIENT: PatientState = {
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
  trimester: 2,
  gestationalWeeks: 16,
  asthma: false,
  copd: false,
  tsh: 2.5,
  ft4: 1.2,
  medications: ['metformin'],
  activeMeds: ['metformin']
};

let memoryStorage: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  } catch {}
  return memoryStorage[key] || null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch {}
  memoryStorage[key] = value;
}

function loadStoredPatient(): PatientState {
  try {
    const saved = getStorageItem('osrawy_active_patient');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PATIENT, ...parsed };
    }
  } catch {}
  return DEFAULT_PATIENT;
}

function persistPatient(pt: PatientState): void {
  try {
    setStorageItem('osrawy_active_patient', JSON.stringify(pt));
  } catch {}
}

export interface PatientStore {
  patient: PatientState;
  guardrails: GuardrailAlert[];
  bmi: string;
  setField: <K extends keyof PatientState>(key: K, value: PatientState[K]) => void;
  updatePatient: (patch: Partial<PatientState>) => void;
  setEGFR: (val: number) => void;
  setBloodPressure: (sbp: number, dbp: number) => void;
  toggleMedication: (medId: string) => void;
  resetPatient: () => void;
  saveDraft: (customName?: string) => string;
  loadDraft: (draftId: string) => boolean;
  deleteDraft: (draftId: string) => void;
  getDrafts: () => PatientDraft[];
}

export const usePatientStore = create<PatientStore>((set, get) => {
  const initialPatient = loadStoredPatient();
  const initialGuardrails = evaluateSafetyGuardrails(initialPatient);
  const initialBmi = String(calculateBMI(initialPatient.wt, initialPatient.ht)?.bmi || '—');

  function applyState(nextPt: PatientState) {
    if (nextPt.sex === 'm') {
      nextPt.pregnancy = false;
      nextPt.postpartum = false;
    }
    if (nextPt.tc !== undefined) nextPt.totalCholesterol = nextPt.tc;
    if (nextPt.hdl !== undefined) nextPt.hdlC = nextPt.hdl;
    if (nextPt.diabetes !== undefined) nextPt.dm = nextPt.diabetes;

    const guardrails = evaluateSafetyGuardrails(nextPt);
    const bmiCalc = calculateBMI(nextPt.wt, nextPt.ht);
    const bmi = String(bmiCalc ? bmiCalc.bmi : '—');
    persistPatient(nextPt);
    set({ patient: nextPt, guardrails, bmi });
  }

  return {
    patient: initialPatient,
    guardrails: initialGuardrails,
    bmi: initialBmi,

    setField: (key, value) => {
      const current = { ...get().patient, [key]: value };
      applyState(current);
    },

    updatePatient: (patch) => {
      const current = { ...get().patient, ...patch };
      applyState(current);
    },

    setEGFR: (val) => {
      const current = { ...get().patient, egfr: val };
      applyState(current);
    },

    setBloodPressure: (sbp, dbp) => {
      const current = { ...get().patient, sbp, dbp };
      applyState(current);
    },

    toggleMedication: (medId) => {
      const id = medId.toLowerCase();
      const currentMeds = [...get().patient.activeMeds];
      const idx = currentMeds.findIndex(m => m.toLowerCase() === id);
      if (idx !== -1) {
        currentMeds.splice(idx, 1);
      } else {
        currentMeds.push(id);
      }
      const nextPt = {
        ...get().patient,
        activeMeds: currentMeds,
        medications: currentMeds
      };
      applyState(nextPt);
    },

    resetPatient: () => {
      const fresh: PatientState = {
        ...DEFAULT_PATIENT,
        name: 'New Patient',
        medications: [],
        activeMeds: []
      };
      applyState(fresh);
    },

    saveDraft: (customName) => {
      const pt = get().patient;
      const draftId = `draft_${Date.now()}`;
      const draft: PatientDraft = {
        id: draftId,
        timestamp: Date.now(),
        patient: { ...pt, name: customName || pt.name }
      };
      try {
        const drafts = JSON.parse(getStorageItem('osrawy_patient_drafts') || '[]');
        drafts.unshift(draft);
        setStorageItem('osrawy_patient_drafts', JSON.stringify(drafts.slice(0, 20)));
      } catch {}
      return draftId;
    },

    loadDraft: (draftId) => {
      try {
        const drafts: PatientDraft[] = JSON.parse(getStorageItem('osrawy_patient_drafts') || '[]');
        const found = drafts.find(d => d.id === draftId);
        if (found) {
          applyState(found.patient);
          return true;
        }
      } catch {}
      return false;
    },

    deleteDraft: (draftId) => {
      try {
        const drafts: PatientDraft[] = JSON.parse(getStorageItem('osrawy_patient_drafts') || '[]');
        const filtered = drafts.filter(d => d.id !== draftId);
        setStorageItem('osrawy_patient_drafts', JSON.stringify(filtered));
      } catch {}
    },

    getDrafts: () => {
      try {
        return JSON.parse(getStorageItem('osrawy_patient_drafts') || '[]');
      } catch {}
      return [];
    }
  };
});
`

---

## tests\formulary_exporters.test.ts

`typescript
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
`

---

## tests\lipids.test.ts

`typescript
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
`

---

## tests\obstetrics.test.ts

`typescript
import { describe, it, expect } from 'vitest';
import { evaluatePregnancyHtnProtocol } from '../src/engines/htn';
import { evaluatePregnancyDmProtocol } from '../src/engines/diabetes';

describe('Obstetric Medicine & Pregnancy Protocols (Cases 15 & 16)', () => {
  describe('Case 15: Pregnant Patient with Hypertension & Asthma', () => {
    const obHtn = evaluatePregnancyHtnProtocol({
      sbp: 164,
      dbp: 112,
      gestationalWeeks: 16,
      comorbidities: { pregnancy: true, asthma: true },
      medications: ['valsartan', 'indapamide']
    });

    it('triggers OBSTETRIC_HYPERTENSIVE_EMERGENCY alert for severe HTN (164/112)', () => {
      const emergencyAlert = obHtn.alerts && obHtn.alerts.some((a: any) =>
        a.code === 'OBSTETRIC_HYPERTENSIVE_EMERGENCY' || JSON.stringify(a).toLowerCase().includes('emergency')
      );
      expect(emergencyAlert).toBe(true);
    });

    it('triggers STOP_TERATOGENIC_HTN_MEDS alert for Valsartan and Indapamide', () => {
      const teratoStop = obHtn.alerts && obHtn.alerts.some((a: any) =>
        a.code === 'STOP_TERATOGENIC_HTN_MEDS' || JSON.stringify(a).toLowerCase().includes('teratogenic')
      );
      expect(teratoStop).toBe(true);
    });

    it('triggers PREECLAMPSIA_ASPIRIN_PROPHYLAXIS step at 16 weeks gestation', () => {
      const aspirinStep = obHtn.steps && obHtn.steps.some((s: any) =>
        s.code === 'PREECLAMPSIA_ASPIRIN_PROPHYLAXIS' || JSON.stringify(s).toLowerCase().includes('aspirin')
      );
      expect(aspirinStep).toBe(true);
    });

    it('pivots first-line therapy to Nifedipine ER when maternal asthma is present', () => {
      const nifedipineStep = obHtn.steps && obHtn.steps.some((s: any) =>
        s.code === 'PREGNANCY_HTN_STEP_1_NIFEDIPINE' || JSON.stringify(s).toLowerCase().includes('nifedipine')
      );
      expect(nifedipineStep).toBe(true);
      expect(obHtn.firstLine.drugId).toBe('nifedipine_er');
    });
  });

  describe('Case 16: Pregnant Patient with Diabetes in Trimester 3', () => {
    const obDm = evaluatePregnancyDmProtocol({
      weightKg: 80,
      trimester: 3,
      gestationalWeeks: 30,
      comorbidities: { pregnancy: true },
      medications: ['empagliflozin', 'semaglutide']
    });

    it('triggers STOP_NON_INSULIN_PREGNANCY_DRUGS alert for oral/GLP-1 agents', () => {
      const stopOral = obDm.alerts && obDm.alerts.some((a: any) =>
        a.code === 'STOP_NON_INSULIN_PREGNANCY_DRUGS' || JSON.stringify(a).toLowerCase().includes('stop')
      );
      expect(stopOral).toBe(true);
    });

    it('calculates 80 kg Trimester 3 TDD as 72 U/day (0.9 U/kg/day)', () => {
      expect(obDm.dosing.tddUnits).toBe(72);
    });

    it('calculates basal insulin as 36 U/day (50% of TDD)', () => {
      expect(obDm.dosing.basalUnits).toBe(36);
    });

    it('calculates meal bolus as 12 U before each of 3 meals', () => {
      expect(obDm.dosing.mealBolusUnits).toBe(12);
    });

    it('enforces obstetric glycemic fasting target <95 mg/dL', () => {
      expect(obDm.targets.fastingMgDl).toContain('<95');
    });
  });
});
`

---

## tests\primaryCare.test.ts

`typescript
import { describe, it, expect } from 'vitest';
import { evaluateAsthmaGina, evaluateCopdGold, evaluateThyroid, evaluatePrimaryCare } from '../src/engines/primaryCare';

describe('Primary Care Engine (Cases 6, 7, 8, 18)', () => {
  describe('Case 6: Asthma GINA & SABA Overuse', () => {
    it('accurately classifies patient with >= 3 symptoms as Uncontrolled', () => {
      const asthmaPt = {
        condition: 'asthma',
        currentStep: 2,
        daySymptoms: '>2_week',
        nightWaking: true,
        relieverUse: '>2_week',
        activityLimit: true,
        sabaUsePerWeek: 4,
        preferredTrack: 1
      };
      const asthmaRes = evaluateAsthmaGina(asthmaPt);
      const isUncontrolled = (asthmaRes.controlLevel || asthmaRes.control || '').toLowerCase().includes('uncontrolled');
      expect(isUncontrolled).toBe(true);
    });

    it('triggers SABA overuse warning and mortality alert when SABA use >= 3x/week', () => {
      const asthmaPt = {
        sabaUsePerWeek: 4,
        daySymptoms: 'none',
        nightWaking: false,
        relieverUse: 'none',
        activityLimit: false
      };
      const asthmaRes = evaluateAsthmaGina(asthmaPt);
      const sabaAlert = (asthmaRes.alerts || []).some((a: any) =>
        JSON.stringify(a).toLowerCase().includes('saba') ||
        JSON.stringify(a).toLowerCase().includes('overuse') ||
        JSON.stringify(a).includes('إفراط')
      );
      expect(sabaAlert).toBe(true);
    });

    it('steps up uncontrolled asthma on Step 2 to Step 3 Low-Dose MART (ICS-Formoterol)', () => {
      const asthmaPt = {
        currentStep: 2,
        daySymptoms: '>2_week',
        nightWaking: true,
        relieverUse: '>2_week',
        activityLimit: true,
        preferredTrack: 1
      };
      const asthmaRes = evaluateAsthmaGina(asthmaPt);
      expect(asthmaRes.recommendedStep).toBe(3);
    });
  });

  describe('Case 7: COPD GOLD & Inhaled Corticosteroid Guardrails', () => {
    it('classifies frequent exacerbations into GOLD Group E', () => {
      const copdPtE = {
        condition: 'copd',
        moderateExacerbations: 2,
        hospitalExacerbations: 1,
        mMRC: 2,
        catScore: 18,
        bloodEosinophils: 360
      };
      const copdResE = evaluateCopdGold(copdPtE);
      expect(copdResE.group).toBe('E');
    });

    it('recommends Triple Therapy (LABA + LAMA + ICS) for GOLD Group E with eosinophils >= 300', () => {
      const copdPtE = {
        condition: 'copd',
        moderateExacerbations: 2,
        bloodEosinophils: 360
      };
      const copdResE = evaluateCopdGold(copdPtE);
      const tripleTherapy = JSON.stringify(copdResE).toLowerCase().includes('triple') ||
                            (JSON.stringify(copdResE).toLowerCase().includes('laba') &&
                             JSON.stringify(copdResE).toLowerCase().includes('lama') &&
                             JSON.stringify(copdResE).toLowerCase().includes('ics'));
      expect(tripleTherapy).toBe(true);
    });

    it('triggers pneumonia risk warning against ICS when eosinophils < 100', () => {
      const copdPtLowEos = {
        condition: 'copd',
        moderateExacerbations: 2,
        bloodEosinophils: 60
      };
      const copdResLowEos = evaluateCopdGold(copdPtLowEos);
      const pneumoniaRisk = JSON.stringify(copdResLowEos).toLowerCase().includes('pneumonia') ||
                            JSON.stringify(copdResLowEos).includes('ذات الرئة') ||
                            JSON.stringify(copdResLowEos).toLowerCase().includes('avoid ics');
      expect(pneumoniaRisk).toBe(true);
    });
  });

  describe('Case 8: Thyroid Disorders & Cardiovascular Precautions', () => {
    it('diagnoses Overt Hypothyroidism with elevated TSH and low FT4', () => {
      const overtHypoPt = {
        tsh: 16.5,
        ft4: 0.6,
        weightKg: 70,
        ascvd: false,
        age: 38
      };
      const overtRes = evaluateThyroid(overtHypoPt);
      expect(overtRes.status).toBe('overt_hypo');
    });

    it('calculates weight-based ~1.6 mcg/kg Levothyroxine replacement for standard young patient', () => {
      const overtHypoPt = {
        tsh: 16.5,
        ft4: 0.6,
        weightKg: 70,
        ascvd: false,
        age: 38
      };
      const overtRes = evaluateThyroid(overtHypoPt);
      expect(overtRes.recommendedDose).toBeGreaterThanOrEqual(100);
      expect(overtRes.recommendedDose).toBeLessThanOrEqual(125);
    });

    it('prescribes conservative Levothyroxine starting dose (25-50 mcg/d) for patient with ASCVD', () => {
      const ascvdHypoPt = {
        tsh: 18.0,
        ft4: 0.5,
        weightKg: 85,
        ascvd: true,
        age: 66
      };
      const ascvdRes = evaluateThyroid(ascvdHypoPt);
      expect(ascvdRes.recommendedDose).toBeGreaterThanOrEqual(25);
      expect(ascvdRes.recommendedDose).toBeLessThanOrEqual(50);
    });

    it('triggers Propranolol bronchospasm caution alert in hyperthyroidism with asthma', () => {
      const hyperThyroidPt = {
        tsh: 0.05,
        ft4: 2.8,
        asthma: true
      };
      const hyperRes = evaluateThyroid(hyperThyroidPt);
      const bronchospasmAlert = JSON.stringify(hyperRes).toLowerCase().includes('bronchospasm') ||
                                JSON.stringify(hyperRes).toLowerCase().includes('propranolol') ||
                                JSON.stringify(hyperRes).includes('ربو');
      expect(bronchospasmAlert).toBe(true);
    });
  });

  describe('Case 18: Primary Care Edge Cases', () => {
    it('handles TSH = 0 and missing inputs gracefully without throwing', () => {
      const edgePt = { tsh: 0, ft4: 0, hf: undefined };
      const pc = evaluatePrimaryCare(edgePt);
      expect(pc).toBeDefined();
      expect(pc.asthma).toBeDefined();
      expect(pc.copd).toBeDefined();
      expect(pc.thyroid).toBeDefined();
    });
  });
});
`

---

## tests\safety.test.ts

`typescript
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
`

---

## tests\smoke.test.ts

`typescript
import { describe, it, expect } from 'vitest';

describe('V2 Environment Smoke Test', () => {
  it('verifies Vitest test runner is operational', () => {
    expect(1 + 1).toBe(2);
  });
});
`

---

## tests\store.test.ts

`typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { usePatientStore } from '../src/store/usePatientStore';
import { useAppStore } from '../src/store/useAppStore';

describe('Zustand Stores & Android Back Stack (Step 3)', () => {
  beforeEach(() => {
    usePatientStore.getState().resetPatient();
    useAppStore.getState().closeAllOverlays();
    useAppStore.getState().setActiveTab('dm');
  });

  describe('usePatientStore', () => {
    it('initializes with default patient and recalculates guardrails reactively', () => {
      const state = usePatientStore.getState();
      expect(state.patient.name).toBe('New Patient');
      expect(state.guardrails).toBeDefined();
    });

    it('forces pregnancy to false when sex changes to male', () => {
      const store = usePatientStore.getState();
      store.updatePatient({ sex: 'f', pregnancy: true });
      expect(usePatientStore.getState().patient.pregnancy).toBe(true);

      store.setField('sex', 'm');
      expect(usePatientStore.getState().patient.pregnancy).toBe(false);
    });

    it('triggers Metformin contraindication immediately when eGFR drops below 30', () => {
      const store = usePatientStore.getState();
      store.updatePatient({ egfr: 75, activeMeds: ['metformin'] });
      let guardrails = usePatientStore.getState().guardrails;
      let hasCrit = guardrails.some(g => g.id === 'guardrail-metformin-crit');
      expect(hasCrit).toBe(false);

      store.setEGFR(24);
      guardrails = usePatientStore.getState().guardrails;
      hasCrit = guardrails.some(g => g.id === 'guardrail-metformin-crit');
      expect(hasCrit).toBe(true);
    });

    it('toggles medication correctly and syncs activeMeds', () => {
      const store = usePatientStore.getState();
      store.toggleMedication('jardiance');
      expect(usePatientStore.getState().patient.activeMeds).toContain('jardiance');

      store.toggleMedication('jardiance');
      expect(usePatientStore.getState().patient.activeMeds).not.toContain('jardiance');
    });

    it('saves, loads, and deletes patient drafts', () => {
      const store = usePatientStore.getState();
      store.updatePatient({ name: 'Draft Patient Test', age: 45 });
      const draftId = store.saveDraft('Draft Patient Test');
      expect(typeof draftId).toBe('string');

      store.resetPatient();
      expect(usePatientStore.getState().patient.name).toBe('New Patient');

      const loaded = store.loadDraft(draftId);
      expect(loaded).toBe(true);
      expect(usePatientStore.getState().patient.name).toBe('Draft Patient Test');
      expect(usePatientStore.getState().patient.age).toBe(45);

      store.deleteDraft(draftId);
      const drafts = store.getDrafts();
      expect(drafts.some(d => d.id === draftId)).toBe(false);
    });
  });

  describe('useAppStore & Android Back Button Stack', () => {
    it('manages overlay stack with push and pop', () => {
      const store = useAppStore.getState();
      store.pushOverlay('modal-settings');
      store.pushOverlay('sheet-vitals');
      expect(useAppStore.getState().overlayStack).toEqual(['modal-settings', 'sheet-vitals']);

      const popped = store.popOverlay();
      expect(popped).toBe(true);
      expect(useAppStore.getState().overlayStack).toEqual(['modal-settings']);
    });

    it('handles Android back press in priority order (overlay -> previous tab -> home -> minimize)', () => {
      const store = useAppStore.getState();
      
      // Step 1: Open an overlay
      store.pushOverlay('soap-sheet');
      expect(store.handleAndroidBack()).toBe(true);
      expect(useAppStore.getState().overlayStack.length).toBe(0);

      // Step 2: In 'drugs' directory tab, back returns to previous tab
      store.setActiveTab('htn');
      store.setActiveTab('drugs');
      expect(store.handleAndroidBack()).toBe(true);
      expect(useAppStore.getState().activeTab).toBe('htn');

      // Step 3: On 'htn' tab, back returns to home 'dm' tab
      expect(store.handleAndroidBack()).toBe(true);
      expect(useAppStore.getState().activeTab).toBe('dm');

      // Step 4: On home 'dm' tab with no overlays, back returns false (allowing native minimize)
      expect(store.handleAndroidBack()).toBe(false);
    });

    it('persists market, lang, and theme changes', () => {
      const store = useAppStore.getState();
      store.setMarket('eg');
      expect(useAppStore.getState().market).toBe('eg');

      store.setLang('en');
      expect(useAppStore.getState().lang).toBe('en');

      store.setTheme('dark');
      expect(useAppStore.getState().theme).toBe('dark');
    });
  });
});
`

---

## tests\tools.test.ts

`typescript
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
`

---

