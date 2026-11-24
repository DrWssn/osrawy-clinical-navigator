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
