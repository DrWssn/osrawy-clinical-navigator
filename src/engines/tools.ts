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
