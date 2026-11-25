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

  if (scrMg <= 0 || age <= 0 || age >= 140 || wt <= 0) return null;

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
  const eagMg = Math.max(0, Math.round(28.7 * a1c - 46.7));
  const eagMmol = Math.max(0, Math.round((eagMg / 18.018) * 10) / 10);
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
