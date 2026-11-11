// ==============================================================
// Osrawy Clinical Tools: CKD-EPI 2021 Calculator & ASCVD LDL-C Goals Matrix
// Inker LA et al. NEJM 2021 (Race-Free eGFR) & Cockcroft-Gault CrCl
// ADA Standards of Care 2025 / ESC-EAS Dyslipidemia Guidelines 2023
// ==============================================================

const ClinicalTools = (function() {

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- 1. CKD-EPI 2021 Race-Free Equation & Cockcroft-Gault ---

  /**
   * CKD-EPI 2021 Race-Free eGFR equation
   * Reference: Inker LA, Eneanya ND, Coresh J, et al. New Creatinine- and Cystatin C–Based Equations
   * to Estimate GFR without Race. N Engl J Med 2021; 385:1737-1749.
   *
   * eGFR = 142 * min(Scr/kappa, 1)^alpha * max(Scr/kappa, 1)^-1.200 * 0.9938^Age * (1.012 if female else 1.0)
   * Female: kappa = 0.7, alpha = -0.241, gender multiplier = 1.012
   * Male:   kappa = 0.9, alpha = -0.302, gender multiplier = 1.000
   * 1 mg/dL = 88.4 µmol/L
   */
  function calculateCKDEPI(scrVal, scrUnit, ageVal, sexVal) {
    const scr = parseFloat(scrVal) || 0;
    const age = parseFloat(ageVal) || 0;
    const sex = (sexVal === 'f') ? 'f' : 'm';

    if (scr <= 0 || age <= 0) return null;

    // Convert µmol/L to mg/dL if needed
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
   * Formula: CrCl = ((140 - Age) * Weight_kg) / (72 * Scr_mg_dL) * (0.85 if female else 1.0)
   * Signature: calculateCrCl(age, weightKg, creatinineMgDl, sex)
   * Also supports legacy signature: calculateCrCl(scrVal, scrUnit, ageVal, sexVal, wtVal)
   * or object parameter: calculateCrCl({ age, weightKg, creatinineMgDl, sex })
   */
  function calculateCrCl(arg1, arg2, arg3, arg4, arg5) {
    let age = 0, wt = 0, scrMg = 0, sex = 'm';

    if (typeof arg2 === 'string' && (arg2 === 'mg' || arg2 === 'umol')) {
      // Legacy: calculateCrCl(scrVal, scrUnit, ageVal, sexVal, wtVal)
      const scr = parseFloat(arg1) || 0;
      scrMg = (arg2 === 'umol') ? (scr / 88.4) : scr;
      age = parseFloat(arg3) || 0;
      sex = (arg4 === 'f') ? 'f' : 'm';
      wt = parseFloat(arg5) || 0;
    } else if (typeof arg1 === 'object' && arg1 !== null) {
      // Object input: { age, weightKg/wt, creatinineMgDl/scr, sex }
      age = parseFloat(arg1.age) || 0;
      wt = parseFloat(arg1.weightKg || arg1.wt || arg1.weight) || 0;
      const sVal = parseFloat(arg1.creatinineMgDl || arg1.scr || arg1.creatinine || arg1.scrMg) || 0;
      const u = arg1.scrUnit || arg1.unit || 'mg';
      scrMg = (u === 'umol') ? (sVal / 88.4) : sVal;
      const sRaw = String(arg1.sex || arg1.gender || 'm').toLowerCase();
      sex = (sRaw === 'f' || sRaw === 'female') ? 'f' : 'm';
    } else {
      // Standard: calculateCrCl(age, weightKg, creatinineMgDl, sex)
      age = parseFloat(arg1) || 0;
      wt = parseFloat(arg2) || 0;
      scrMg = parseFloat(arg3) || 0;
      const sRaw = String(arg4 || 'm').toLowerCase();
      sex = (sRaw === 'f' || sRaw === 'female') ? 'f' : 'm';
    }

    if (scrMg <= 0 || age <= 0 || wt <= 0) return null;

    const factor = (sex === 'f') ? 0.85 : 1.0;
    const crcl = ((140 - age) * wt) / (72 * scrMg) * factor;
    const crclRound = Math.round(crcl * 10) / 10;
    const crclInt = Math.round(crcl);

    const numObj = new Number(crclRound);
    numObj.crcl = crclRound;
    numObj.crclInt = crclInt;
    numObj.value = crclRound;
    numObj.age = age;
    numObj.weightKg = wt;
    numObj.creatinineMgDl = Math.round(scrMg * 100) / 100;
    numObj.sex = sex;
    numObj.toString = () => String(crclRound);
    numObj.valueOf = () => crclRound;
    return numObj;
  }

  /**
   * KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD
   * Prognosis of CKD by GFR and Albuminuria Categories (Heatmap Matrix)
   * @param {number|object} egfrVal - eGFR in mL/min/1.73m² (or object with egfr & acrMgG)
   * @param {number} [acrVal] - Urine Albumin-to-Creatinine Ratio (UACR) in mg/g
   */
  function evaluateKdigoMatrix(egfrVal, acrVal) {
    let egfr = 0, acr = 0;
    if (typeof egfrVal === 'object' && egfrVal !== null) {
      egfr = parseFloat(egfrVal.egfr || egfrVal.eGFR) || 0;
      acr = parseFloat(egfrVal.acrMgG || egfrVal.uacr || egfrVal.acr || egfrVal.urineAcr) || 0;
    } else {
      egfr = parseFloat(egfrVal) || 0;
      acr = parseFloat(acrVal) || 0;
    }

    // Determine G-stage (KDIGO 2024)
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

    // Determine A-stage (Albuminuria KDIGO 2024)
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

    // KDIGO 2024 Matrix Tiers:
    // Green (Low risk): G1A1, G2A1
    // Yellow (Moderately increased risk): G1A2, G2A2, G3aA1
    // Orange (High risk): G1A3, G2A3, G3aA2, G3bA1
    // Red (Very high risk): G3aA3, G3bA2, G3bA3, G4A1, G4A2, G4A3, G5A1, G5A2, G5A3
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

  /**
   * FIB-4 (Fibrosis-4 Index) for Liver Fibrosis Screening in MASLD/NAFLD
   * Formula: FIB-4 = (Age [yr] × AST [U/L]) / (Platelets [10^9/L] × √ALT [U/L])
   * Guidelines: AASLD / EASL / ADA 2024-2025 Standards of Care
   */
  function calculateFib4(arg1, arg2, arg3, arg4) {
    let age = 0, ast = 0, alt = 0, plt = 0;

    if (typeof arg1 === 'object' && arg1 !== null) {
      age = parseFloat(arg1.age) || 0;
      ast = parseFloat(arg1.astUl || arg1.ast || arg1.got) || 0;
      alt = parseFloat(arg1.altUl || arg1.alt || arg1.gpt) || 0;
      plt = parseFloat(arg1.platelets10e9L || arg1.platelets || arg1.plt) || 0;
    } else {
      age = parseFloat(arg1) || 0;
      ast = parseFloat(arg2) || 0;
      alt = parseFloat(arg3) || 0;
      plt = parseFloat(arg4) || 0;
    }

    // Protect against platelet count in /uL vs 10^9/L (e.g. 250,000 vs 250)
    if (plt > 1000) {
      plt = plt / 1000;
    }

    if (age <= 0 || ast <= 0 || alt <= 0 || plt <= 0) return null;

    const fib4 = (age * ast) / (plt * Math.sqrt(alt));
    const scoreRound = Math.round(fib4 * 100) / 100;

    // Cutoffs (AASLD / ADA 2024-2025):
    // Age < 65: Low risk < 1.30, High risk > 2.67, Indeterminate 1.30 - 2.67
    // Age >= 65: Low risk < 2.00, High risk > 2.67, Indeterminate 2.00 - 2.67
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

    const res = new Number(scoreRound);
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

  /**
   * DOAC (Direct Oral Anticoagulant) Renal & Clinical Dosing Evaluation
   * Evaluates Apixaban (Eliquis) based on 2-of-3 criteria & CrCl
   * Evaluates Rivaroxaban (Xarelto) based on CrCl
   * Reference: ESC 2024 / AHA-ACC-ACCP-HRS AF Guidelines
   */
  function evaluateDoacDosing(patientInput) {
    const pt = patientInput || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});
    const age = parseFloat(pt.age) || 0;
    const wt = parseFloat(pt.weightKg || pt.wt || pt.weight) || 0;
    const scrVal = parseFloat(pt.creatinineMgDl || pt.scr || pt.creatinine || pt.scrMg) || 0;
    const unit = pt.scrUnit || pt.unit || 'mg';
    const scrMg = (unit === 'umol') ? (scrVal / 88.4) : scrVal;
    const sexRaw = String(pt.sex || pt.gender || 'm').toLowerCase();
    const sex = (sexRaw === 'f' || sexRaw === 'female') ? 'f' : 'm';

    // CrCl from input or calculated via Cockcroft-Gault
    let crcl = parseFloat(pt.crcl);
    if (isNaN(crcl) || crcl <= 0) {
      const calc = calculateCrCl(age, wt, scrMg, sex);
      crcl = calc ? calc.crcl : 0;
    }

    // --- 1. Apixaban (Eliquis) Dosing ---
    // Standard dose for NVAF: 5 mg BID
    // Reduced dose to 2.5 mg BID if >= 2 of 3 criteria met:
    // 1) Age >= 80 years
    // 2) Body weight <= 60 kg
    // 3) Serum creatinine >= 1.5 mg/dL (133 umol/L)
    const critAge = (age >= 80);
    const critWeight = (wt > 0 && wt <= 60);
    const critScr = (scrMg >= 1.5);
    const criteriaCount = (critAge ? 1 : 0) + (critWeight ? 1 : 0) + (critScr ? 1 : 0);
    const meets2of3 = (criteriaCount >= 2);

    let apixabanDose = '5 mg PO BID';
    let apixabanDoseAr = '٥ ملغ مرتين يومياً';
    let apixabanEn = 'Apixaban: 5 mg PO BID (Standard dose)';
    let apixabanAr = 'أبيكسابان: ٥ ملغ فموياً مرتين يومياً (5 mg PO BID)';
    let apixabanReduced = false;
    let apixabanContraindicated = false;
    let apixabanReasonEn = 'Standard dose: fewer than 2 dose-reduction criteria met.';
    let apixabanReasonAr = 'الجرعة القياسية: المريض يستوفي أقل من معيارين من معايير تخفيض الجرعة.';

    if (crcl > 0 && crcl < 15) {
      apixabanContraindicated = true;
      apixabanDose = 'Contraindicated / Not recommended';
      apixabanDoseAr = 'ممنوع استخدامه / غير موصى به';
      apixabanEn = 'Apixaban: Contraindicated / Not recommended (CrCl < 15 mL/min)';
      apixabanAr = 'أبيكسابان: غير موصى به / ممنوع استخدامه (تصفية الكرياتينين < 15)';
      apixabanReasonEn = `CrCl is ${crcl} mL/min (<15 mL/min). Apixaban is contraindicated / not recommended in severe ESRD without dialysis per European/KDIGO guidelines.`;
      apixabanReasonAr = `تصفية الكرياتينين ${crcl} مل/دقيقة (<15). يُحظر استخدام أبيكسابان في الفشل الكلوي النهائي دون غسيل.`;
    } else if (meets2of3) {
      apixabanReduced = true;
      apixabanDose = '2.5 mg PO BID';
      apixabanDoseAr = '٢.٥ ملغ مرتين يومياً';
      apixabanEn = 'Apixaban: 2.5 mg PO BID (Dose reduced per 2-of-3 ABC criteria)';
      apixabanAr = 'أبيكسابان: ٢.٥ ملغ فموياً مرتين يومياً (2.5 mg PO BID - مخفض)';
      const metList = [];
      if (critAge) metList.push(`Age ≥ 80 (${age} y)`);
      if (critWeight) metList.push(`Weight <= 60 kg (${wt} kg)`);
      if (critScr) metList.push(`Serum Creatinine ≥ 1.5 mg/dL (${scrMg} mg/dL)`);
      apixabanReasonEn = `Dose reduced to 2.5 mg PO BID: Patient meets ${criteriaCount} of 3 dose-reduction criteria [${metList.join(', ')}].`;
      apixabanReasonAr = `تم تخفيض الجرعة إلى ٢.٥ ملغ (2.5 mg PO BID) لاستيفاء ${criteriaCount} من 3 معايير لتخفيض الجرعة (${metList.join('، ')}).`;
    } else if (crcl >= 15 && crcl < 30) {
      apixabanReduced = true;
      apixabanDose = '2.5 mg PO BID';
      apixabanDoseAr = '٢.٥ ملغ مرتين يومياً';
      apixabanEn = 'Apixaban: 2.5 mg PO BID (CrCl 15–29 mL/min)';
      apixabanAr = 'أبيكسابان: ٢.٥ ملغ فموياً مرتين يومياً (2.5 mg PO BID)';
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

    // --- 2. Rivaroxaban (Xarelto) Dosing ---
    // Standard dose for NVAF: 20 mg once daily with the evening meal / with food
    // Renal reduction: CrCl 15-49 mL/min -> 15 mg once daily with food
    // CrCl < 15 mL/min: Contraindicated / avoid
    let rivaroxabanDose = '20 mg PO daily with food';
    let rivaroxabanDoseAr = '20 مجم مرة واحدة يومياً مع وجبة العشاء/الطعام';
    let rivaroxabanEn = 'Rivaroxaban: 20 mg PO daily with food';
    let rivaroxabanAr = 'ريفاروكسابان: ٢٠ ملغ فموياً مرة واحدة يومياً مع وجبة الطعام (20 mg PO daily with food)';
    let rivaroxabanReduced = false;
    let rivaroxabanContraindicated = false;
    let rivaroxabanReasonEn = `CrCl ≥ 50 mL/min (${crcl} mL/min): Standard 20 mg daily with food.`;
    let rivaroxabanReasonAr = `تصفية الكرياتينين ≥ 50 مل/دقيقة (${crcl} مل/دقيقة): الجرعة القياسية 20 مجم يومياً مع الطعام.`;

    if (crcl > 0 && crcl < 15) {
      rivaroxabanContraindicated = true;
      rivaroxabanDose = 'Contraindicated / Not recommended';
      rivaroxabanDoseAr = 'ممنوع استخدامه / غير موصى به';
      rivaroxabanEn = 'Rivaroxaban: Contraindicated / Not recommended (CrCl < 15 mL/min)';
      rivaroxabanAr = 'ريفاروكسابان: غير موصى به / ممنوع استخدامه';
      rivaroxabanReasonEn = `CrCl is ${crcl} mL/min (<15 mL/min). Rivaroxaban is contraindicated / not recommended due to bleeding risk in ESRD.`;
      rivaroxabanReasonAr = `تصفية الكرياتينين ${crcl} مل/دقيقة (<15). يُحظر استخدام ريفاروكسابان لخطر النزيف في الفشل الكلوي المتقدم.`;
    } else if (crcl >= 15 && crcl < 50) {
      rivaroxabanReduced = true;
      rivaroxabanDose = '15 mg PO daily with food';
      rivaroxabanDoseAr = '15 مجم مرة واحدة يومياً مع وجبة الطعام (مساءً)';
      rivaroxabanEn = 'Rivaroxaban: 15 mg PO daily with food (CrCl 15–49 mL/min)';
      rivaroxabanAr = 'ريفاروكسابان: ١٥ ملغ فموياً مرة واحدة يومياً مع الطعام (15 mg PO daily with food)';
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

  function getStageInfo(egfr) {
    if (egfr >= 90) {
      return {
        code: 'G1',
        nameEn: 'Stage G1: Normal or high kidney function',
        nameAr: 'المرحلة G1: وظائف كلوية طبيعية أو مرتفعة',
        badgeClass: 'badge-stage-g1',
        descEn: 'eGFR ≥90 mL/min/1.73m² (evaluate for albuminuria/hematuria)',
        descAr: 'معدل الترشيح ≥90 مل/دقيقة (افحص زلال البول UACR لتأكيد أو نفي اعتلال الكلى)',
        metforminEn: 'Safe at standard doses (up to 2000–2550 mg/day).',
        metforminAr: 'آمن بالجرعة الكاملة حتى 2000-2550 مجم/يوم.',
        sglt2iEn: 'Initiate or continue if indicated for glycemic, cardiovascular, or kidney protection.',
        sglt2iAr: 'ابدأ أو استمر عليه لضبط السكر وحماية القلب والكلى.'
      };
    } else if (egfr >= 60) {
      return {
        code: 'G2',
        nameEn: 'Stage G2: Mildly decreased kidney function',
        nameAr: 'المرحلة G2: انخفاض طفيف في وظائف الكلى',
        badgeClass: 'badge-stage-g2',
        descEn: 'eGFR 60–89 mL/min/1.73m²',
        descAr: 'معدل الترشيح 60–89 مل/دقيقة',
        metforminEn: 'Safe at standard doses. Reassess eGFR at least annually.',
        metforminAr: 'آمن بالجرعة الكاملة. يعاد فحص وظائف الكلى سنوياً.',
        sglt2iEn: 'Initiate or continue if indicated for DM, ASCVD, HF, or CKD.',
        sglt2iAr: 'ابدأ أو استمر عليه لدواعي السكري والقلب والكلى.'
      };
    } else if (egfr >= 45) {
      return {
        code: 'G3a',
        nameEn: 'Stage G3a: Mild to moderately decreased',
        nameAr: 'المرحلة G3a: انخفاض طفيف إلى متوسط في وظائف الكلى',
        badgeClass: 'badge-stage-g3a',
        descEn: 'eGFR 45–59 mL/min/1.73m²',
        descAr: 'معدل الترشيح 45–59 مل/دقيقة',
        metforminEn: 'Max dose 2000 mg/day. Monitor renal function every 3–6 months.',
        metforminAr: 'الجرعة القصوى 2000 مجم/يوم. راقب وظائف الكلى كل 3-6 أشهر.',
        sglt2iEn: 'Proven kidney & CV benefit. Dose titration per product label.',
        sglt2iAr: 'فائدة كلوية وقلبية مثبتة. استمر عليه لدواعي الحماية.'
      };
    } else if (egfr >= 30) {
      return {
        code: 'G3b',
        nameEn: 'Stage G3b: Moderately to severely decreased',
        nameAr: 'المرحلة G3b: انخفاض متوسط إلى شديد في وظائف الكلى',
        badgeClass: 'badge-stage-g3b',
        descEn: 'eGFR 30–44 mL/min/1.73m²',
        descAr: 'معدل الترشيح 30–44 مل/دقيقة',
        metforminEn: 'Max dose 1000 mg/day. Do NOT initiate in new patients; reassess risks vs benefits.',
        metforminAr: 'الجرعة القصوى 1000 مجم/يوم. لا تبدأ علاجاً جديداً، وراقب المريض كل 3 أشهر.',
        sglt2iEn: 'Initiate or continue for cardiorenal benefit down to eGFR 20.',
        sglt2iAr: 'مسموح بالبدء أو الاستمرار للحماية الكلوية حتى معدل ترشيح 20.'
      };
    } else if (egfr >= 15) {
      return {
        code: 'G4',
        nameEn: 'Stage G4: Severely decreased kidney function',
        nameAr: 'المرحلة G4: انخفاض شديد في وظائف الكلى',
        badgeClass: 'badge-stage-g4',
        descEn: 'eGFR 15–29 mL/min/1.73m² (refer to nephrology)',
        descAr: 'معدل الترشيح 15–29 مل/دقيقة (تحويل لأخصائي الكلى)',
        metforminEn: 'CONTRAINDICATED. Discontinue immediately (risk of lactic acidosis).',
        metforminAr: 'ممنوع استخدامه نهائياً. يجب إيقافه لتجنب حموضة الدم اللبنية.',
        sglt2iEn: 'If already on SGLT2i, continue until dialysis for cardiorenal protection (ADA 2025 / KDIGO).',
        sglt2iAr: 'إذا كان المريض يتناوله مسبقاً، يستمر عليه حتى بدء الغسيل الكلوي لحماية القلب والكلى.'
      };
    } else {
      return {
        code: 'G5',
        nameEn: 'Stage G5: Kidney failure / ESKD',
        nameAr: 'المرحلة G5: فشل كلوي نهائي (ESKD)',
        badgeClass: 'badge-stage-g5',
        descEn: 'eGFR <15 mL/min/1.73m² (requires dialysis or transplant evaluation)',
        descAr: 'معدل الترشيح <15 مل/دقيقة (يحتاج تقييم غسيل كلوى أو زراعة)',
        metforminEn: 'CONTRAINDICATED.',
        metforminAr: 'ممنوع منعاً باتاً.',
        sglt2iEn: 'Contraindicated for initiation. Coordinate with nephrology.',
        sglt2iAr: 'لا يُبدأ في هذه المرحلة. يتم التنسيق مع استشاري الكلى.'
      };
    }
  }

  // --- 2. ASCVD LDL-C Goals Matrix & Statin Intensity Guide ---

  /**
   * Risk categories based on ADA 2025 Standards of Care & ESC 2023 Guidelines
   */
  const LDL_GOALS = {
    very_high: {
      id: 'very_high',
      titleEn: 'Very High Cardiovascular Risk',
      titleAr: 'خطورة قلبية وعائية عالية جداً (Very High Risk)',
      criteriaEn: 'Established ASCVD (CAD, MI, stroke, PAD, CABG/PCI), or DM + microvascular complications / severe organ damage, or severe CKD (eGFR <30).',
      criteriaAr: 'أمراض قلب وشرايين مؤكدة (جلطة قلبية، ذبحة، سكتة دماغية، تصلب شرايين طرفية، قسطرة)، أو سكري مع مضاعفات وعائية دقيقة شديدة، أو قصور كلى شديد (eGFR <30).',
      targetEn: '< 55 mg/dL (< 1.4 mmol/L) AND ≥ 50% reduction from baseline',
      targetAr: 'أقل من 55 مجم/ديسيلتر (< 1.4 مليمول/لتر) مع تخفيض ≥ 50% من خط الأساس',
      targetMg: 55,
      targetMmol: 1.4,
      statinEn: 'High-Intensity Statin at maximum tolerated dose. Add Ezetimibe 10 mg if target not achieved. Consider PCSK9 inhibitor or Bempedoic acid for extreme risk or secondary prevention.',
      statinAr: 'ستاتين عالي الكثافة (High-Intensity) بالجرعة القصوى المحتملة. أضف إيزيتيميب 10 مجم إذا لم يتحقق الهدف. يُنظر في مثبطات PCSK9 للحالات المستعصية.'
    },
    high: {
      id: 'high',
      titleEn: 'High Cardiovascular Risk',
      titleAr: 'خطورة قلبية وعائية عالية (High Risk)',
      criteriaEn: 'Diabetes duration ≥ 10 years without severe complications, or DM + 1–2 risk factors, or moderate CKD (eGFR 30–59), or 10-year CVD risk ≥10% to <20%.',
      criteriaAr: 'سكري مستمر منذ ≥10 سنوات دون مضاعفات شديدة، أو سكري مع 1-2 عوامل خطورة (ضغط، تدخين، دهون)، أو قصور كلى متوسط (eGFR 30–59)، أو خطر 10 سنوات ≥10% إلى <20%.',
      targetEn: '< 70 mg/dL (< 1.8 mmol/L) AND ≥ 50% reduction from baseline',
      targetAr: 'أقل من 70 مجم/ديسيلتر (< 1.8 مليمول/لتر) مع تخفيض ≥ 50% من خط الأساس',
      targetMg: 70,
      targetMmol: 1.8,
      statinEn: 'High-Intensity Statin (or Moderate-Intensity titrated to achieve ≥50% LDL-C reduction). Add Ezetimibe 10 mg if target not reached.',
      statinAr: 'ستاتين عالي الكثافة (أو متوسط الكثافة مع المعايرة لخفض LDL بنسبة ≥50%). أضف إيزيتيميب 10 مجم عند الحاجة.'
    },
    moderate: {
      id: 'moderate',
      titleEn: 'Moderate Cardiovascular Risk',
      titleAr: 'خطورة قلبية وعائية متوسطة (Moderate Risk)',
      criteriaEn: 'Young patients (T1D <35 y, T2D <50 y) with DM duration <10 y without other risk factors; or 10-year CVD risk 5% to <10%.',
      criteriaAr: 'مرضى السكري صغار السن (نوع 1 <35 سنة، نوع 2 <50 سنة) مع مدة سكري <10 سنوات وبدون عوامل خطورة إضافية؛ أو خطر 10 سنوات 5% إلى <10%.',
      targetEn: '< 100 mg/dL (< 2.6 mmol/L)',
      targetAr: 'أقل من 100 مجم/ديسيلتر (< 2.6 مليمول/لتر)',
      targetMg: 100,
      targetMmol: 2.6,
      statinEn: 'Moderate-Intensity Statin. Recheck lipid panel in 4–12 weeks.',
      statinAr: 'ستاتين متوسط الكثافة (Moderate-Intensity). يعاد فحص الدهون بعد 4-12 أسبوعاً.'
    },
    low: {
      id: 'low',
      titleEn: 'Low Cardiovascular Risk',
      titleAr: 'خطورة قلبية وعائية منخفضة (Low Risk)',
      criteriaEn: 'Calculated 10-year CVD risk <5% without DM, CKD, or severe risk factor.',
      criteriaAr: 'خطر قلبي وعائي لعشر سنوات <5% دون سكري أو اعتلال كلى أو عوامل خطورة كبرى.',
      targetEn: '< 116 mg/dL (< 3.0 mmol/L)',
      targetAr: 'أقل من 116 مجم/ديسيلتر (< 3.0 مليمول/لتر)',
      targetMg: 116,
      targetMmol: 3.0,
      statinEn: 'Lifestyle modifications first. Consider low-to-moderate intensity statin if LDL remains elevated.',
      statinAr: 'تعديل نمط الحياة أولاً. يُنظر في ستاتين منخفض إلى متوسط الكثافة إذا استمر ارتفاع الكوليسترول.'
    }
  };

  /**
   * Statin Intensity Categorization & Formulary Trade Names in Saudi Arabia & Egypt
   */
  const STATIN_REGIMENS = [
    {
      intensity: 'high',
      labelEn: 'High Intensity (Lowers LDL-C ≥ 50%)',
      labelAr: 'كثافة عالية (تخفيض LDL بنسبة ≥ 50%)',
      badgeClass: 'badge-intensity-high',
      drugs: [
        {
          name: 'Atorvastatin',
          dose: '40 – 80 mg once daily',
          doseAr: '40 – 80 مجم مرة واحدة مساءً',
          saudi: {
            brands: ['Lipitor (Viatris/Pfizer)', 'Atorva (SPIMACO)', 'Storvas', 'Lorvast'],
            tier: 'Tier 1 Generic (32–55 SAR) / Originator Lipitor (~85–118 SAR)',
            tierAr: 'اقتصادي محلي (32-55 ريال) / ليبيتور الأصلي (~85-118 ريال)'
          },
          egypt: {
            brands: ['Ator (EIPICO)', 'Lipitor (Pfizer)', 'Lipona', 'Atorstat'],
            tier: 'Tier 1 Generic (45–88 EGP) / Originator Lipitor (~140–240 EGP)',
            tierAr: 'اقتصادي مصري (45-88 جنيه) / ليبيتور (~140-240 جنيه)'
          }
        },
        {
          name: 'Rosuvastatin',
          dose: '20 – 40 mg once daily',
          doseAr: '20 – 40 مجم مرة واحدة يومياً',
          saudi: {
            brands: ['Crestor (AstraZeneca)', 'Rosuvast (SPIMACO)', 'Justor', 'Aditor'],
            tier: 'Tier 1 Generic (42–72 SAR) / Originator Crestor (~95–165 SAR)',
            tierAr: 'اقتصادي محلي (42-72 ريال) / كريستور الأصلي (~95-165 ريال)'
          },
          egypt: {
            brands: ['Crestor (AstraZeneca)', 'Rosutor (Eva Pharma)', 'Aditor', 'Rosuvast'],
            tier: 'Tier 1 Generic (65–130 EGP) / Originator Crestor (~180–350 EGP)',
            tierAr: 'اقتصادي محلي (65-130 جنيه) / كريستور (~180-350 جنيه)'
          }
        }
      ]
    },
    {
      intensity: 'moderate',
      labelEn: 'Moderate Intensity (Lowers LDL-C 30% to <50%)',
      labelAr: 'كثافة متوسطة (تخفيض LDL بنسبة 30% إلى <50%)',
      badgeClass: 'badge-intensity-moderate',
      drugs: [
        {
          name: 'Atorvastatin',
          dose: '10 – 20 mg once daily',
          doseAr: '10 – 20 مجم مرة واحدة مساءً',
          saudi: {
            brands: ['Atorva (SPIMACO)', 'Lipitor', 'Storvas'],
            tier: 'Tier 1 (30–45 SAR)',
            tierAr: 'اقتصادي محلي (30-45 ريال)'
          },
          egypt: {
            brands: ['Ator', 'Lipona', 'Lipitor'],
            tier: 'Tier 1 (40–70 EGP)',
            tierAr: 'اقتصادي محلي (40-70 جنيه)'
          }
        },
        {
          name: 'Rosuvastatin',
          dose: '5 – 10 mg once daily',
          doseAr: '5 – 10 مجم مرة واحدة يومياً',
          saudi: {
            brands: ['Rosuvast', 'Justor', 'Crestor'],
            tier: 'Tier 1 (38–58 SAR)',
            tierAr: 'اقتصادي محلي (38-58 ريال)'
          },
          egypt: {
            brands: ['Rosutor', 'Aditor', 'Crestor'],
            tier: 'Tier 1 (55–90 EGP)',
            tierAr: 'اقتصادي محلي (55-90 جنيه)'
          }
        },
        {
          name: 'Simvastatin',
          dose: '20 – 40 mg once daily in evening',
          doseAr: '20 – 40 مجم مساءً',
          saudi: {
            brands: ['Zocor (MSD)', 'Zocord'],
            tier: 'Tier 1 (25–40 SAR)',
            tierAr: 'اقتصادي (25-40 ريال)'
          },
          egypt: {
            brands: ['Zocor', 'Simvacor'],
            tier: 'Tier 1 (30–50 EGP)',
            tierAr: 'اقتصادي (30-50 جنيه)'
          }
        }
      ]
    },
    {
      intensity: 'low',
      labelEn: 'Low Intensity (Lowers LDL-C < 30%)',
      labelAr: 'كثافة منخفضة (تخفيض LDL بنسبة < 30%)',
      badgeClass: 'badge-intensity-low',
      drugs: [
        {
          name: 'Simvastatin',
          dose: '10 mg once daily',
          doseAr: '10 مجم مساءً',
          saudi: { brands: ['Zocor 10mg'], tier: 'Tier 1 (20–30 SAR)', tierAr: 'اقتصادي' },
          egypt: { brands: ['Zocor 10mg', 'Generics'], tier: 'Tier 1 (20–35 EGP)', tierAr: 'اقتصادي' }
        },
        {
          name: 'Pravastatin',
          dose: '10 – 20 mg once daily',
          doseAr: '10 – 20 مجم يومياً',
          saudi: { brands: ['Pravachol'], tier: 'Tier 1 (25–35 SAR)', tierAr: 'اقتصادي' },
          egypt: { brands: ['Pravachol generics'], tier: 'Tier 1 (25–40 EGP)', tierAr: 'اقتصادي' }
        }
      ]
    }
  ];

  const ADD_ON_THERAPIES = [
    {
      name: 'Ezetimibe 10 mg',
      nameAr: 'إيزيتيميب (Ezetimibe 10 mg)',
      effectEn: 'Lowers LDL-C by additional 15% – 20%. Recommended first-line add-on when statin alone is insufficient or not tolerated.',
      effectAr: 'يخفض LDL بنسبة إضافية 15% إلى 20%. الخيار الإضافي الأول عندما لا تكفي أقصى جرعة ستاتين أو في حال عدم التحمل.',
      saudi: {
        brands: ['Ezetrol 10mg (MSD, ~82 SAR)', 'Atozet (Atorvastatin + Ezetimibe, ~115–145 SAR)', 'Rosuzet (Rosuvastatin + Ezetimibe, ~110–140 SAR)']
      },
      egypt: {
        brands: ['Ezetrol 10mg (~110 EGP)', 'Atozet (~180–260 EGP)', 'Lipitrex Plus (~120–190 EGP)']
      }
    },
    {
      name: 'PCSK9 Inhibitors / Bempedoic Acid',
      nameAr: 'مثبطات PCSK9 / حمض البيمبيدويك',
      effectEn: 'Lowers LDL-C by 50% – 60%. Evolocumab (Repatha) 140 mg SC Q2W or Alirocumab (Praluent) 75/150 mg SC Q2W. Reserved for Very High Risk patients not at goal.',
      effectAr: 'تخفيض إضافي بنسبة 50% إلى 60%. ريباثا (Repatha) أو برالوانت (Praluent) حقن تحت الجلد كل أسبوعين. مخصصة للحالات عالية الخطورة جداً.',
      saudi: {
        brands: ['Repatha (Evolocumab 140mg/mL pen, ~1,400 SAR/mo)', 'Praluent (Alirocumab, ~1,350 SAR/mo)']
      },
      egypt: {
        brands: ['Repatha (Evolocumab, specialized hospital supply)']
      }
    }
  ];

  // --- 3. Clinical Patient Assessment ---

  function assessPatientLdlRisk(pt) {
    if (!pt) {
      if (typeof window.PatientSync !== 'undefined' && typeof window.PatientSync.get === 'function') {
        pt = window.PatientSync.get();
      } else {
        pt = {};
      }
    }

    const ascvd = !!pt.ascvd;
    const dm = (pt.a1c && pt.a1c >= 6.5) || !!pt.dur || !!pt.dm;
    const dur = parseFloat(pt.dur) || 0;
    const age = parseFloat(pt.age) || 52;
    const egfr = parseFloat(pt.egfr) || 68;
    const uacr = parseFloat(pt.uacr) || 45;
    const smoker = !!pt.smoker;
    const htn = (parseFloat(pt.sbp) >= 140 || parseFloat(pt.dbp) >= 90);

    let riskKey = 'moderate';
    let reasonsEn = [];
    let reasonsAr = [];

    if (ascvd) {
      riskKey = 'very_high';
      reasonsEn.push('Established clinical ASCVD (CAD, MI, stroke, PAD)');
      reasonsAr.push('أمراض قلب وشرايين مؤكدة (جلطة، ذبحة، قسطرة، تصلب أوعية)');
    } else if (egfr < 30) {
      riskKey = 'very_high';
      reasonsEn.push('Severe CKD (eGFR < 30 mL/min/1.73m²)');
      reasonsAr.push('قصور كلوي شديد (eGFR < 30)');
    } else if (uacr >= 300) {
      riskKey = 'very_high';
      reasonsEn.push('Severe target organ damage (severely increased albuminuria UACR ≥300 mg/g)');
      reasonsAr.push('اعتلال كلوي واعتلال أعضاء شديد (زلال البول UACR ≥300)');
    } else if (dm) {
      // Patient has Diabetes
      if (dur >= 10 || smoker || htn || age >= 50 || egfr < 60 || uacr >= 30) {
        riskKey = 'high';
        reasonsEn.push('Diabetes with ≥1 cardiovascular risk factor or CKD/albuminuria');
        reasonsAr.push('مريض سكري مع عامل خطورة قلبي وعائي إضافي أو اعتلال كلى');
      } else {
        riskKey = 'moderate';
        reasonsEn.push('Young patient with short diabetes duration (<10 y) and no other major risk factors');
        reasonsAr.push('مريض سكري شاب مع مدة إصابة قصيرة وبدون عوامل خطورة مصاحبة');
      }
    } else {
      // Non-diabetic
      if (egfr < 60 || uacr >= 30) {
        riskKey = 'high';
        reasonsEn.push('Moderate CKD (eGFR 30–59 or albuminuria)');
        reasonsAr.push('اعتلال كلى متوسط (eGFR 30–59 أو زلال بول)');
      } else if (age >= 65 || (smoker && htn)) {
        riskKey = 'high';
        reasonsEn.push('Elevated estimated 10-year CVD risk');
        reasonsAr.push('خطورة قلبية وعائية مرتفعة');
      } else {
        riskKey = 'moderate';
        reasonsEn.push('General primary prevention');
        reasonsAr.push('وقاية أولية عامة');
      }
    }

    const goal = LDL_GOALS[riskKey];

    return {
      riskKey: riskKey,
      goal: goal,
      reasonsEn: reasonsEn.join('; '),
      reasonsAr: reasonsAr.join('؛ ')
    };
  }

  // --- 4. Modal Triggers & UI Interaction ---

  function openEgfrModal() {
    const modal = document.getElementById('egfr-modal');
    if (!modal) return;

    // Pre-populate with active patient values
    const pt = (typeof window.PatientSync !== 'undefined') ? window.PatientSync.get() : {};
    const ageInput = document.getElementById('calc-age');
    const sexSelect = document.getElementById('calc-sex');
    const wtInput = document.getElementById('calc-wt');
    const scrInput = document.getElementById('calc-scr');
    const unitSelect = document.getElementById('calc-scr-unit');

    if (ageInput && pt.age) ageInput.value = pt.age;
    if (sexSelect && pt.sex) sexSelect.value = pt.sex;
    if (wtInput && pt.wt) wtInput.value = pt.wt;
    if (unitSelect) {
      unitSelect.value = (pt.scrUnit === 'umol') ? 'umol' : 'mg';
      if (unitSelect.dataset) unitSelect.dataset.prevUnit = unitSelect.value;
    }

    if (scrInput) {
      if (pt.scr !== undefined && pt.scr !== null && parseFloat(pt.scr) > 0) {
        scrInput.value = pt.scr;
      } else {
        scrInput.value = (unitSelect && unitSelect.value === 'umol') ? '88.4' : '1.0';
      }
    }

    renderEgfrCalculation();
    modal.classList.add('open');
  }

  function closeEgfrModal() {
    const modal = document.getElementById('egfr-modal');
    if (modal) modal.classList.remove('open');
  }

  function renderEgfrCalculation() {
    const scrInput = document.getElementById('calc-scr');
    const unitSelect = document.getElementById('calc-scr-unit');
    const ageInput = document.getElementById('calc-age');
    const sexSelect = document.getElementById('calc-sex');
    const wtInput = document.getElementById('calc-wt');
    const outBox = document.getElementById('calc-egfr-output');

    if (!scrInput || !unitSelect || !ageInput || !sexSelect || !outBox) return;

    const scr = scrInput.value;
    const unit = unitSelect.value || 'mg';
    const age = ageInput.value;
    const sex = sexSelect.value;
    const wt = wtInput ? wtInput.value : 70;

    const res = calculateCKDEPI(scr, unit, age, sex);
    const crclRes = calculateCrCl(scr, unit, age, sex, wt);

    const isAr = (typeof window.I18n !== 'undefined' && window.I18n.getLang() === 'ar');

    if (!res) {
      outBox.innerHTML = `
        <div class="calc-placeholder">
          ${isAr ? 'يرجى إدخال قيمة الكرياتينين والعمر لحساب معدل الترشيح' : 'Please enter serum creatinine and age to calculate eGFR.'}
        </div>
      `;
      const applyBtn = document.getElementById('btn-apply-calculated-egfr');
      if (applyBtn) applyBtn.disabled = true;
      return;
    }

    const stage = res.stage;
    const stageName = isAr ? stage.nameAr : stage.nameEn;
    const stageDesc = isAr ? stage.descAr : stage.descEn;
    const metNote = isAr ? stage.metforminAr : stage.metforminEn;
    const sgltNote = isAr ? stage.sglt2iAr : stage.sglt2iEn;
    const crclVal = crclRes ? `${crclRes.crcl} mL/min` : '—';

    outBox.innerHTML = `
      <div class="calc-result-card ${stage.badgeClass}">
        <div class="calc-result-header">
          <div>
            <span class="calc-stage-pill">${stage.code}</span>
            <span class="calc-stage-title"><b>${stageName}</b></span>
          </div>
          <div class="calc-egfr-big">${res.egfr} <small>mL/min/1.73m²</small></div>
        </div>
        <div class="calc-result-sub">${stageDesc}</div>

        <div class="calc-sub-grid">
          <div class="calc-sub-item">
            <span class="calc-sub-lbl">${isAr ? 'الكرياتينين بالميليجرام:' : 'Creatinine (mg/dL):'}</span>
            <b>${res.scrMg} mg/dL</b>
          </div>
          <div class="calc-sub-item">
            <span class="calc-sub-lbl">${isAr ? 'الكرياتينين بالميكرومول:' : 'Creatinine (µmol/L):'}</span>
            <b>${res.scrUmol} µmol/L</b>
          </div>
          <div class="calc-sub-item">
            <span class="calc-sub-lbl">${isAr ? 'تصفية الكرياتينين (Cockcroft-Gault CrCl):' : 'CrCl (Cockcroft-Gault):'}</span>
            <b>${crclVal}</b>
          </div>
        </div>

        <div class="calc-clinical-pearls">
          <div class="pearl-row">
            <span class="pearl-tag">Metformin</span>
            <span class="pearl-text">${metNote}</span>
          </div>
          <div class="pearl-row">
            <span class="pearl-tag">SGLT2i</span>
            <span class="pearl-text">${sgltNote}</span>
          </div>
        </div>
      </div>
    `;

    const applyBtn = document.getElementById('btn-apply-calculated-egfr');
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.setAttribute('data-calculated-egfr', res.egfrInt);
    }
  }

  function applyCalculatedEGFR() {
    const applyBtn = document.getElementById('btn-apply-calculated-egfr');
    if (!applyBtn) return;
    const val = parseInt(applyBtn.getAttribute('data-calculated-egfr'), 10);
    if (isNaN(val)) return;

    // 1. Update PatientSync active patient (updatePatient / setEGFR already syncs DOM & triggers engines)
    let syncedViaSetEgfr = false;
    if (typeof window.PatientSync !== 'undefined') {
      const scrEl = document.getElementById('calc-scr');
      const scrUnitEl = document.getElementById('calc-scr-unit');
      const scrVal = scrEl ? parseFloat(scrEl.value) : NaN;
      const scrUnitVal = (scrUnitEl && scrUnitEl.value === 'umol') ? 'umol' : 'mg';
      const modal = document.getElementById('egfr-modal');
      const isModalOpen = !!(modal && modal.classList && modal.classList.contains('open'));

      if (typeof window.PatientSync.updatePatient === 'function' && (!isNaN(scrVal) && scrVal > 0)) {
        const patch = {
          egfr: val,
          scr: scrVal,
          scrUnit: scrUnitVal
        };
        if (isModalOpen) {
          const ageEl = document.getElementById('calc-age');
          const sexEl = document.getElementById('calc-sex');
          const wtEl = document.getElementById('calc-wt');
          const ageVal = ageEl ? parseFloat(ageEl.value) : NaN;
          const wtVal = wtEl ? parseFloat(wtEl.value) : NaN;
          if (!isNaN(ageVal) && ageVal > 0) patch.age = ageVal;
          if (sexEl && sexEl.value) patch.sex = sexEl.value;
          if (!isNaN(wtVal) && wtVal > 0) patch.wt = wtVal;
        }
        window.PatientSync.updatePatient(patch);
        syncedViaSetEgfr = true;
      } else if (typeof window.PatientSync.setEGFR === 'function') {
        window.PatientSync.setEGFR(val);
        syncedViaSetEgfr = true;
      } else {
        const pt = window.PatientSync.get();
        if (pt) {
          pt.egfr = val;
          if (!isNaN(scrVal) && scrVal > 0) {
            pt.scr = scrVal;
            pt.scrUnit = scrUnitVal;
          }
        }
        window.PatientSync.saveActive();
        window.PatientSync.updatePatientBar();
        if (typeof window.PatientSync.notifyUpdated === 'function') {
          window.PatientSync.notifyUpdated();
        }
      }
    }

    if (!syncedViaSetEgfr) {
      // 2. Fallback: Update Diabetes form #egfr & HTN form #htn-egfr
      const diaEgfr = document.getElementById('egfr');
      if (diaEgfr) {
        diaEgfr.value = val;
      }

      const htnEgfr = document.getElementById('htn-egfr');
      if (htnEgfr) {
        htnEgfr.value = val;
      }

      // 3. Fallback: Trigger engines recalculation
      if (typeof window.plan === 'function') {
        window.plan();
      }
      if (typeof window.htnRender === 'function') {
        window.htnRender();
      }
      if (typeof window.htnRenderTitrate === 'function') {
        window.htnRenderTitrate();
      }
    }

    // 5. Close modal
    closeEgfrModal();

    // 6. Show feedback toast
    const isAr = (typeof window.I18n !== 'undefined' && window.I18n.getLang() === 'ar');
    const msg = isAr
      ? `✅ تم تطبيق معدل ترشيح الكلى (${val} مل/دقيقة) على ملف المريض بنجاح!`
      : `✅ Applied eGFR (${val} mL/min/1.73m²) to patient record successfully!`;

    if (typeof window.RxShare !== 'undefined' && typeof window.RxShare.showToast === 'function') {
      window.RxShare.showToast(msg);
    }
  }

  function openLdlModal() {
    const modal = document.getElementById('ldl-modal');
    if (!modal) return;
    renderLdlMatrix();
    modal.classList.add('open');
  }

  function closeLdlModal() {
    const modal = document.getElementById('ldl-modal');
    if (modal) modal.classList.remove('open');
  }

  function renderLdlMatrix() {
    const container = document.getElementById('ldl-matrix-container');
    if (!container) return;

    const isAr = (typeof window.I18n !== 'undefined' && window.I18n.getLang() === 'ar');
    const currentMarket = (typeof window.DrugDirectory !== 'undefined' && window.DrugDirectory.getMarket)
      ? window.DrugDirectory.getMarket()
      : 'saudi';

    const assessment = assessPatientLdlRisk();
    const pt = (typeof window.PatientSync !== 'undefined') ? window.PatientSync.get() : {};

    let html = `
      <!-- Active Patient Personalized Recommendation -->
      <div class="ldl-patient-eval-banner">
        <div class="ldl-eval-top">
          <div>
            <span class="ldl-badge-glow ${assessment.riskKey}">${isAr ? 'تقييم خطورة المريض الحالي:' : 'Active Patient Assessment:'} <b>${isAr ? assessment.goal.titleAr : assessment.goal.titleEn}</b></span>
            <div class="ldl-eval-name">${escapeHtml(pt.name) || (isAr ? 'مريض العيادة' : 'Current Patient')} · ${pt.age || 52} ${isAr ? 'سنة' : 'y'} · ${pt.sex === 'f' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}</div>
          </div>
          <div class="ldl-target-highlight">
            <small>${isAr ? 'الهدف العلاجي لـ LDL:' : 'Target LDL-C Goal:'}</small>
            <div class="target-val">${isAr ? assessment.goal.targetAr : assessment.goal.targetEn}</div>
          </div>
        </div>
        <div class="ldl-eval-reason">
          <b>${isAr ? 'محددات التصنيف:' : 'Stratification Criteria:'}</b> ${isAr ? assessment.reasonsAr : assessment.reasonsEn}
        </div>
        <div class="ldl-eval-action">
          <b>${isAr ? 'الخطة الدوائية الموصى بها:' : 'Recommended Statin Regimen:'}</b> ${isAr ? assessment.goal.statinAr : assessment.goal.statinEn}
        </div>
      </div>

      <!-- Market Switcher for Formularies -->
      <div class="ldl-market-toggle-bar">
        <span class="ldl-mkt-lbl">${isAr ? 'عرض الأسماء والأسعار حسب السوق:' : 'Formulary & Prices Market:'}</span>
        <div class="ldl-mkt-btn-group">
          <button type="button" class="btn-mkt-chip ${currentMarket === 'saudi' ? 'active' : ''}" onclick="ClinicalTools.setMatrixMarket('saudi')">
            🇸🇦 ${isAr ? 'السعودية (SAR)' : 'Saudi Arabia (SAR)'}
          </button>
          <button type="button" class="btn-mkt-chip ${currentMarket === 'egypt' ? 'active' : ''}" onclick="ClinicalTools.setMatrixMarket('egypt')">
            🇪🇬 ${isAr ? 'مصر (EGP)' : 'Egypt (EGP)'}
          </button>
        </div>
      </div>

      <!-- LDL Goals Matrix Table -->
      <div class="ldl-section-title">
        <h3>🎯 ${isAr ? 'مصفوفة أهداف LDL-C حسب إرشادات ADA 2025 / ESC 2023' : 'ASCVD LDL-C Goals Matrix (ADA 2025 / ESC 2023)'}</h3>
      </div>
      <div class="tbl ldl-matrix-table-wrap">
        <table class="ldl-matrix-table">
          <thead>
            <tr>
              <th>${isAr ? 'فئة الخطورة' : 'Risk Category'}</th>
              <th>${isAr ? 'معايير التصنيف السريرية' : 'Clinical Criteria'}</th>
              <th>${isAr ? 'هدف LDL-C الموصى به' : 'Target LDL-C Goal'}</th>
              <th>${isAr ? 'كثافة الستاتين الموصى بها' : 'Recommended Statin Strategy'}</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Render 4 Risk Categories
    ['very_high', 'high', 'moderate', 'low'].forEach(k => {
      const g = LDL_GOALS[k];
      const isSelected = (assessment.riskKey === k);
      html += `
        <tr class="${isSelected ? 'selected-patient-tier' : ''}">
          <td class="tier-cell">
            <span class="ldl-risk-tag ${k}">${isAr ? g.titleAr : g.titleEn}</span>
            ${isSelected ? `<span class="patient-match-pill">${isAr ? '👈 مريضك هنا' : '👈 Active Patient'}</span>` : ''}
          </td>
          <td>${isAr ? g.criteriaAr : g.criteriaEn}</td>
          <td class="target-cell"><b>${isAr ? g.targetAr : g.targetEn}</b></td>
          <td>${isAr ? g.statinAr : g.statinEn}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>

      <!-- Statin Intensity & Formularies Guide -->
      <div class="ldl-section-title" style="margin-top:20px">
        <h3>💊 ${isAr ? 'دليل جرعات الستاتين والبدائل التجارية وفئات الأسعار' : 'Statin Intensity Guide & Trade Formularies'}</h3>
        <p class="sub">${isAr ? 'تشمل الأسماء التجارية الأصلية والمكافئات المعتمدة وفئات التكلفة' : 'Includes originator brands and approved generics in local currencies'}</p>
      </div>

      <div class="statin-intensity-cards">
    `;

    STATIN_REGIMENS.forEach(reg => {
      html += `
        <div class="statin-regimen-card ${reg.badgeClass}">
          <div class="regimen-header">
            <h4>${isAr ? reg.labelAr : reg.labelEn}</h4>
          </div>
          <div class="regimen-body">
      `;

      reg.drugs.forEach(d => {
        const mktData = (currentMarket === 'egypt') ? d.egypt : d.saudi;
        const tierText = isAr ? mktData.tierAr : mktData.tier;
        html += `
          <div class="statin-drug-row">
            <div class="drug-main-info">
              <span class="drug-name"><b>${d.name}</b></span>
              <span class="drug-dose-badge">${isAr ? d.doseAr : d.dose}</span>
            </div>
            <div class="drug-brand-tags">
              ${mktData.brands.map(b => `<span class="brand-pill">${b}</span>`).join('')}
            </div>
            <div class="drug-price-tier">
              <small>💰 ${tierText}</small>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += `
      </div>

      <!-- Add-On Lipid Lowering Therapies -->
      <div class="ldl-section-title" style="margin-top:20px">
        <h3>➕ ${isAr ? 'العلاجات الإضافية عند عدم الوصول للهدف' : 'Add-On Lipid Lowering Therapies'}</h3>
      </div>
      <div class="addon-therapies-grid">
    `;

    ADD_ON_THERAPIES.forEach(ad => {
      const mktData = (currentMarket === 'egypt') ? ad.egypt : ad.saudi;
      html += `
        <div class="addon-card">
          <div class="addon-header">
            <b>${isAr ? ad.nameAr : ad.name}</b>
          </div>
          <p class="addon-effect">${isAr ? ad.effectAr : ad.effectEn}</p>
          <div class="addon-brands">
            <span class="addon-brand-lbl">${isAr ? 'الخيارات المتاحة:' : 'Available Formulations:'}</span>
            ${mktData.brands.map(b => `<span class="brand-pill">${b}</span>`).join('')}
          </div>
        </div>
      `;
    });

    html += `
      </div>

      <!-- Extreme Risk & Clinical Notes -->
      <div class="ldl-clinical-notes">
        <b>💡 ${isAr ? 'ملاحظة سريرية هامة (ADA 2025 / ESC 2023):' : 'Key Clinical Practice Pearls (ADA 2025 / ESC 2023):'}</b>
        <ul>
          <li>${isAr ? 'في مرضى الخطورة القصوى (حادث قلبي وعائي ثانٍ خلال عامين): الهدف العلاجي لـ LDL يكون < 40 مجم/ديسيلتر (< 1.0 مليمول/لتر).' : 'For Extreme Risk (e.g. recurrent vascular event within 2 years): LDL-C goal is < 40 mg/dL (< 1.0 mmol/L).'}</li>
          <li>${isAr ? 'يتم فحص الدهون بعد 4 إلى 12 أسبوعاً من بدء الستاتين أو تعديل الجرعة للتأكد من انخفاض LDL بنسبة ≥ 50%.' : 'Reassess fasting lipid profile 4–12 weeks after statin initiation or dose adjustment to verify ≥50% LDL-C reduction.'}</li>
          <li>${isAr ? 'لا يُشترط التوقف عن الستاتين عند ارتفاع طفيف في وظائف الكبد ما لم تتجاوز الإنزيمات 3 أضعاف الحد الطبيعي (3x ULN).' : 'Routine LFT monitoring during stable therapy is not recommended unless baseline liver enzymes exceed 3x ULN or symptoms occur.'}</li>
        </ul>
      </div>
    `;

    container.innerHTML = html;
  }

  function setMatrixMarket(market) {
    if (typeof window.DrugDirectory !== 'undefined' && typeof window.DrugDirectory.setMarket === 'function') {
      window.DrugDirectory.setMarket(market);
    }
    renderLdlMatrix();
  }

  let _toolsI18nBound = false;

  function ensureToolsI18nBound() {
    if (_toolsI18nBound) return;
    if (typeof window !== 'undefined' && typeof window.I18n !== 'undefined' && typeof window.I18n.onChange === 'function') {
      _toolsI18nBound = true;
      window.I18n.onChange(() => {
        const egfrModal = document.getElementById('egfr-modal');
        const ldlModal = document.getElementById('ldl-modal');
        if (egfrModal && egfrModal.classList.contains('open')) {
          renderEgfrCalculation();
        }
        if (ldlModal && ldlModal.classList.contains('open')) {
          renderLdlMatrix();
        }
        const toolsContainer = document.getElementById('clinical-tools-container');
        if (toolsContainer && toolsContainer.innerHTML.trim()) {
          const toolIds = ['tab-scr', 'tab-scr-unit', 'tab-age', 'tab-sex', 'tab-wt', 'tab-kdigo-egfr', 'tab-kdigo-uacr', 'tab-fib4-ast', 'tab-fib4-alt', 'tab-fib4-plt'];
          const savedTools = {};
          toolIds.forEach((id) => { const inp = document.getElementById(id); if (inp) savedTools[id] = inp.value; });
          renderToolsTab('clinical-tools-container');
          Object.keys(savedTools).forEach((id) => { const inp = document.getElementById(id); if (inp) inp.value = savedTools[id]; });
          if (typeof window.recalculateToolsTab === 'function') {
            window.recalculateToolsTab();
          }
        }
      });
    }
  }

  function init() {
    // 1. Wire up CKD-EPI modal live inputs
    const scrInput = document.getElementById('calc-scr');
    const unitSelect = document.getElementById('calc-scr-unit');
    const ageInput = document.getElementById('calc-age');
    const sexSelect = document.getElementById('calc-sex');
    const wtInput = document.getElementById('calc-wt');

    if (scrInput) {
      scrInput.addEventListener('input', renderEgfrCalculation);
      scrInput.addEventListener('change', renderEgfrCalculation);
    }

    if (unitSelect) {
      if (unitSelect.dataset && !unitSelect.dataset.prevUnit) {
        unitSelect.dataset.prevUnit = unitSelect.value || 'mg';
      }
      unitSelect.addEventListener('change', () => {
        const nextUnit = unitSelect.value || 'mg';
        const prevUnit = (unitSelect.dataset && unitSelect.dataset.prevUnit) ? unitSelect.dataset.prevUnit : nextUnit;
        // Only convert Scr when unit actually flips between mg/dL and µmol/L
        if (prevUnit !== nextUnit && scrInput && scrInput.value) {
          const curVal = parseFloat(scrInput.value);
          if (!isNaN(curVal) && curVal > 0) {
            if (nextUnit === 'umol') {
              scrInput.value = (curVal * 88.4).toFixed(1);
            } else {
              scrInput.value = (curVal / 88.4).toFixed(2);
            }
          }
        }
        if (unitSelect.dataset) unitSelect.dataset.prevUnit = nextUnit;
        renderEgfrCalculation();
      });
    }

    if (ageInput) ageInput.addEventListener('input', renderEgfrCalculation);
    if (sexSelect) sexSelect.addEventListener('change', renderEgfrCalculation);
    if (wtInput) wtInput.addEventListener('input', renderEgfrCalculation);

    // 2. Wire Apply eGFR button
    const applyBtn = document.getElementById('btn-apply-calculated-egfr');
    if (applyBtn) {
      applyBtn.addEventListener('click', applyCalculatedEGFR);
    }

    // 3. Wire open/close buttons for EGFR Modal
    document.querySelectorAll('.btn-open-egfr-calc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openEgfrModal();
      });
    });

    const closeEgfrBtn = document.getElementById('close-egfr-modal-btn');
    if (closeEgfrBtn) {
      closeEgfrBtn.addEventListener('click', closeEgfrModal);
    }

    // 4. Wire open/close buttons for LDL Modal
    document.querySelectorAll('.btn-open-ldl-calc, #btn-open-ldl-modal, .btn-open-ldl-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openLdlModal();
      });
    });

    const closeLdlBtn = document.getElementById('close-ldl-modal-btn');
    if (closeLdlBtn) {
      closeLdlBtn.addEventListener('click', closeLdlModal);
    }

    // 5. Close on backdrop click
    const egfrModal = document.getElementById('egfr-modal');
    if (egfrModal) {
      egfrModal.addEventListener('click', (e) => {
        if (e.target === egfrModal) closeEgfrModal();
      });
    }

    const ldlModal = document.getElementById('ldl-modal');
    if (ldlModal) {
      ldlModal.addEventListener('click', (e) => {
        if (e.target === ldlModal) closeLdlModal();
      });
    }

    // 6. Listen to I18n language change to refresh modal and tab content
    ensureToolsI18nBound();
  }

  // --- 7. Interactive Clinical Tools Tab Renderer ---

  function renderToolsTab(containerId) {
    if (typeof document === 'undefined') return;
    const cid = containerId || 'clinical-tools-container';
    const container = document.getElementById(cid);
    if (!container) return;

    ensureToolsI18nBound();

    const pt = (typeof window.PatientSync !== 'undefined' && typeof window.PatientSync.get === 'function') ? window.PatientSync.get() : {};
    const isAr = (typeof window.I18n !== 'undefined' && typeof window.I18n.getLang === 'function')
      ? window.I18n.getLang() === 'ar'
      : true;

    const initialAge = (pt.age !== undefined && pt.age !== null && pt.age !== '') ? pt.age : 58;
    const initialSex = pt.sex || 'm';
    const initialWt = (pt.wt !== undefined && pt.wt !== null && pt.wt !== '') ? pt.wt : 82;
    const initialScr = (pt.scr && parseFloat(pt.scr) > 0) ? pt.scr : 1.1;
    const initialScrUnit = (pt.scrUnit === 'umol') ? 'umol' : 'mg';
    const initialEgfr = (pt.egfr !== undefined && pt.egfr !== null && pt.egfr !== '') ? pt.egfr : 68;
    const initialUacr = (pt.uacr !== undefined && pt.uacr !== null && pt.uacr !== '') ? pt.uacr : 30;

    container.innerHTML = `
      <div class="clinical-tools-dashboard" style="margin-bottom:24px;">
        <!-- Header -->
        <div class="panel" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <h2 style="margin:0 0 4px 0;">🧮 ${isAr ? 'الأدوات الإكلينيكية والحاسبات المتقدمة' : 'Advanced Clinical Calculators & Tools'}</h2>
              <p class="sub" style="margin:0;">${isAr ? 'حاسبات وظائف الكلى، تصفية الكرياتينين، زلال البول KDIGO، جرعات DOAC، ومؤشر تليف الكبد FIB-4' : 'Kidney functions, CrCl, KDIGO albuminuria matrix, DOAC renal dosing, and FIB-4 liver fibrosis'}</p>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button type="button" class="btn" id="btn-tools-open-drugs" style="background:var(--teal); color:#fff; font-size:12px; padding:6px 12px;">
                💊 ${isAr ? 'دليل الأدوية والأسعار' : 'Drugs Directory'}
              </button>
              <button type="button" class="btn" id="btn-tools-open-recent" style="font-size:12px; padding:6px 12px;">
                💾 ${isAr ? 'مسودات المرضى' : 'Saved Drafts'}
              </button>
            </div>
          </div>
        </div>

        <!-- 1. Cardiorenal Calculator Card (eGFR + CrCl) -->
        <div class="panel" style="margin-bottom:16px;">
          <div class="ph" style="--c:var(--teal);--cs:var(--teal-soft)">
            <span class="ic">🫘</span>
            <h2>${isAr ? 'حاسبة وظائف الكلى وتصفية الكرياتينين (CKD-EPI 2021 & CrCl)' : 'Kidney Function & Creatinine Clearance (CKD-EPI & CrCl)'}</h2>
          </div>
          <p class="sub">${isAr ? 'معادلة CKD-EPI 2021 دون عرق مع معادلة Cockcroft-Gault لضبط جرعات الأدوية ومضادات التخثر' : 'Race-free CKD-EPI 2021 alongside Cockcroft-Gault for precise drug & DOAC adjustments'}</p>
          
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:14px;">
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'الكرياتينين (Scr):' : 'Serum Cr:'}</label>
              <input type="number" id="tab-scr" step="0.01" value="${initialScr}" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'الوحدة:' : 'Unit:'}</label>
              <select id="tab-scr-unit" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
                <option value="mg" ${initialScrUnit === 'mg' ? 'selected' : ''}>mg/dL</option>
                <option value="umol" ${initialScrUnit === 'umol' ? 'selected' : ''}>µmol/L</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'العمر (سنة):' : 'Age (yrs):'}</label>
              <input type="number" id="tab-age" value="${initialAge}" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'الجنس:' : 'Sex:'}</label>
              <select id="tab-sex" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
                <option value="m" ${initialSex === 'm' ? 'selected' : ''}>${isAr ? 'ذكر' : 'Male'}</option>
                <option value="f" ${initialSex === 'f' ? 'selected' : ''}>${isAr ? 'أنثى' : 'Female'}</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'الوزن (كجم):' : 'Weight (kg):'}</label>
              <input type="number" id="tab-wt" value="${initialWt}" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
          </div>

          <div id="tab-egfr-results" style="background:var(--surface2); padding:12px; border-radius:8px; border:1px solid var(--border); margin-bottom:12px;">
            <!-- Output dynamically computed -->
          </div>

          <button type="button" class="btn" id="btn-sync-tools-egfr" style="background:var(--teal); color:#fff; font-size:13px;">
            🔄 ${isAr ? 'مزامنة معدل الترشيح المحسوب مع المريض والروشتة' : 'Sync Calculated eGFR with Active Patient & Rx'}
          </button>
        </div>

        <!-- 2. KDIGO 2024 CKD Risk Matrix & Albuminuria -->
        <div class="panel" style="margin-bottom:16px;">
          <div class="ph" style="--c:var(--sun);--cs:var(--sun-soft)">
            <span class="ic">📊</span>
            <h2>${isAr ? 'مصفوفة KDIGO 2024 لزلال البول وتصنيف مخاطر الكلى' : 'KDIGO 2024 Heatmap & Albuminuria Staging'}</h2>
          </div>
          <p class="sub">${isAr ? 'تقاطع معدل الترشيح eGFR مع نسبة زلال البول إلى الكرياتينين (UACR) لتحديد خطورة التدهور وتكرار المتابعة' : 'Risk stratification combining eGFR and urine albumin-creatinine ratio (UACR)'}</p>
          
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:14px;">
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'معدل الترشيح (eGFR mL/min):' : 'eGFR (mL/min):'}</label>
              <input type="number" id="tab-kdigo-egfr" value="${initialEgfr}" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'زلال البول UACR (mg/g):' : 'UACR (mg/g):'}</label>
              <input type="number" id="tab-kdigo-uacr" value="${initialUacr}" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
          </div>

          <div id="tab-kdigo-results" style="background:var(--surface2); padding:12px; border-radius:8px; border:1px solid var(--border);">
            <!-- Dynamic KDIGO results -->
          </div>
        </div>

        <!-- 3. DOAC Renal Dosing (Apixaban & Rivaroxaban) -->
        <div class="panel" style="margin-bottom:16px;">
          <div class="ph" style="--c:var(--sky);--cs:var(--sky-soft)">
            <span class="ic">🩸</span>
            <h2>${isAr ? 'حاسبة جرعات مضادات التخثر الحديثة (DOAC Renal Dosing)' : 'DOAC Renal Dosing (Apixaban & Rivaroxaban)'}</h2>
          </div>
          <p class="sub">${isAr ? 'قاعدة استيفاء شرطين من 3 لـ Apixaban (العمر ≥80، الوزن ≤60 كجم، الكرياتينين ≥1.5) وتعديل جرعة Rivaroxaban بحسب CrCl' : 'Apixaban 2-of-3 criteria (Age ≥80, Wt ≤60kg, Scr ≥1.5mg/dL) & Rivaroxaban CrCl dosing'}</p>
          
          <div id="tab-doac-results" style="background:var(--surface2); padding:12px; border-radius:8px; border:1px solid var(--border);">
            <!-- Dynamic DOAC results -->
          </div>
        </div>

        <!-- 4. FIB-4 Liver Fibrosis Index -->
        <div class="panel" style="margin-bottom:16px;">
          <div class="ph" style="--c:var(--grape);--cs:var(--grape-soft)">
            <span class="ic">🫁</span>
            <h2>${isAr ? 'مؤشر تليف الكبد الدهني (FIB-4 Index for MASLD)' : 'FIB-4 Liver Fibrosis Index for MASLD'}</h2>
          </div>
          <p class="sub">${isAr ? 'مسح تليف الكبد لمرضى السكري والسمنة باستخدام العمر، إنزيمات الكبد AST و ALT، والصفائح الدموية' : 'Screening advanced liver fibrosis in T2DM and metabolic syndrome using Age, AST, ALT, and Platelets'}</p>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:10px; margin-bottom:12px;">
            <div>
              <label style="font-size:12px; color:var(--muted);">AST (U/L):</label>
              <input type="number" id="tab-fib4-ast" value="38" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">ALT (U/L):</label>
              <input type="number" id="tab-fib4-alt" value="42" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'الصفائح الدموية (PLT 10⁹/L):' : 'Platelets (10⁹/L):'}</label>
              <input type="number" id="tab-fib4-plt" value="210" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
          </div>

          <div id="tab-fib4-results" style="background:var(--surface2); padding:12px; border-radius:8px; border:1px solid var(--border);">
            <!-- Dynamic FIB-4 results -->
          </div>
        </div>
      </div>
    `;

    const tabUnitSel = document.getElementById('tab-scr-unit');
    if (tabUnitSel && !tabUnitSel.value) tabUnitSel.value = initialScrUnit;
    const tabSexSel = document.getElementById('tab-sex');
    if (tabSexSel && !tabSexSel.value) tabSexSel.value = initialSex;

    // Calculation helper
    function readTabNum(id, fallback) {
      const el = document.getElementById(id);
      if (!el) return fallback;
      const raw = String(el.value ?? '').trim();
      if (raw === '') return fallback;
      const val = parseFloat(raw);
      return isNaN(val) ? fallback : val;
    }

    function recalculateToolsTab() {
      if (!document.getElementById('tab-egfr-results')) return;
      const scr = readTabNum('tab-scr', 1.0);
      const unit = document.getElementById('tab-scr-unit')?.value || 'mg';
      const age = readTabNum('tab-age', 58);
      const sex = document.getElementById('tab-sex')?.value || 'm';
      const wt = readTabNum('tab-wt', 80);

      // 1. eGFR & CrCl
      const egfrRes = calculateCKDEPI(scr, unit, age, sex);
      const crclRes = calculateCrCl(scr, unit, age, sex, wt);
      const outBox = document.getElementById('tab-egfr-results');
      if (outBox) {
        if (!egfrRes) {
          outBox.innerHTML = `<div style="font-size:13px; color:var(--muted);">${isAr ? 'يرجى إدخال قيم صحيحة وموجبة للكرياتينين والعمر.' : 'Please enter valid positive values for Serum Creatinine and Age.'}</div>`;
        } else {
          const crclDisplay = crclRes ? `${crclRes.crcl}` : '—';
          outBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <div>
                <div style="font-size:18px; font-weight:700; color:var(--teal);">eGFR: ${egfrRes.egfr} <span style="font-size:12px; font-weight:normal; color:var(--ink);">mL/min/1.73m²</span></div>
                <div style="font-size:13px; font-weight:600; color:var(--muted);">${isAr ? egfrRes.stage.nameAr : egfrRes.stage.nameEn}</div>
              </div>
              <div style="text-align:${isAr ? 'left' : 'right'};">
                <div style="font-size:16px; font-weight:700; color:var(--grape);">CrCl: ${crclDisplay} <span style="font-size:12px; font-weight:normal; color:var(--ink);">mL/min</span></div>
                <div style="font-size:11px; color:var(--muted);">(Cockcroft-Gault)</div>
              </div>
            </div>
            <div style="margin-top:8px; font-size:12px; border-top:1px solid var(--border); padding-top:6px;">
              <b>${isAr ? 'أمان الميتفورمين:' : 'Metformin:'}</b> ${isAr ? egfrRes.stage.metforminAr : egfrRes.stage.metforminEn} | 
              <b>${isAr ? 'مثبطات SGLT2:' : 'SGLT2i:'}</b> ${isAr ? egfrRes.stage.sglt2iAr : egfrRes.stage.sglt2iEn}
            </div>
          `;
        }
      }

      // Sync button
      const syncBtn = document.getElementById('btn-sync-tools-egfr');
      if (syncBtn) {
        syncBtn.onclick = function() {
          if (!egfrRes) return;
          const roundedEgfr = (typeof egfrRes.egfrInt === 'number') ? egfrRes.egfrInt : Math.round(egfrRes.egfr);
          if (window.PatientSync) {
            if (typeof window.PatientSync.updatePatient === 'function') {
              window.PatientSync.updatePatient({
                egfr: roundedEgfr,
                age: age,
                sex: sex,
                wt: wt,
                scr: scr,
                scrUnit: unit
              });
            } else if (typeof window.PatientSync.setEGFR === 'function') {
              window.PatientSync.setEGFR(roundedEgfr);
            }
            if (typeof recalculateToolsTab === 'function') {
              recalculateToolsTab();
            }
            if (window.RxShare && typeof window.RxShare.showToast === 'function') {
              window.RxShare.showToast(isAr ? `✅ تم تحديث معدل الترشيح إلى ${roundedEgfr} mL/min ومزامنته` : `✅ eGFR updated to ${roundedEgfr} mL/min and synced`);
            }
          }
        };
      }

      // 2. KDIGO
      const fallbackEgfr = egfrRes ? egfrRes.egfr : 68;
      const kEgfr = readTabNum('tab-kdigo-egfr', fallbackEgfr);
      const kUacr = readTabNum('tab-kdigo-uacr', 30);
      const kdigoRes = evaluateKdigoMatrix(kEgfr, kUacr);
      const kBox = document.getElementById('tab-kdigo-results');
      if (kBox && kdigoRes) {
        const riskColor = (kdigoRes.riskTier === 'VERY_HIGH') ? '#DC2626' : (kdigoRes.riskTier === 'HIGH' ? '#EA580C' : (kdigoRes.riskTier === 'MODERATE' ? '#D97706' : '#16A34A'));
        kBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <span style="display:inline-block; padding:3px 8px; border-radius:4px; font-weight:700; color:#fff; background:${riskColor}; font-size:12px;">
                ${kdigoRes.composite} (${isAr ? kdigoRes.riskLabelAr : kdigoRes.riskLabelEn})
              </span>
            </div>
            <div style="font-size:12px; color:var(--muted);">
              <b>${isAr ? 'تكرار المتابعة:' : 'Surveillance:'}</b> ${isAr ? kdigoRes.monitoringAr : kdigoRes.monitoringEn}
            </div>
          </div>
          <div style="margin-top:8px; font-size:12px; border-top:1px solid var(--border); padding-top:6px;">
            <b>${isAr ? 'الإجراء والتوجيه:' : 'Action:'}</b> ${isAr ? kdigoRes.recommendationAr : kdigoRes.recommendationEn}
          </div>
        `;
      }

      // 3. DOAC
      const doacRes = evaluateDoacDosing({
        age: age,
        weightKg: wt,
        creatinineMgDl: scr,
        scrUnit: unit,
        sex: sex,
        crcl: crclRes ? crclRes.crcl : 0
      });
      const dBox = document.getElementById('tab-doac-results');
      if (dBox && doacRes) {
        dBox.innerHTML = `
          <div style="font-size:13px; font-weight:600; margin-bottom:4px;">
            💊 <b>Apixaban (Eliquis):</b> ${isAr ? doacRes.apixabanAr : doacRes.apixabanEn}
          </div>
          <div style="font-size:13px; font-weight:600; border-top:1px solid var(--border); padding-top:6px; margin-top:4px;">
            💊 <b>Rivaroxaban (Xarelto):</b> ${isAr ? doacRes.rivaroxabanAr : doacRes.rivaroxabanEn}
          </div>
        `;
      }

      // 4. FIB-4
      const ast = readTabNum('tab-fib4-ast', 38);
      const alt = readTabNum('tab-fib4-alt', 42);
      const pltVal = readTabNum('tab-fib4-plt', 210);
      const fib4Res = calculateFib4(age, ast, alt, pltVal);
      const fBox = document.getElementById('tab-fib4-results');
      if (fBox) {
        if (!fib4Res) {
          fBox.innerHTML = `<div style="font-size:13px; color:var(--muted);">${isAr ? 'يرجى إدخال قيم صحيحة وموجبة للعمر و AST و ALT والصفائح الدموية.' : 'Please enter valid positive values for Age, AST, ALT, and Platelets.'}</div>`;
        } else {
          const fibColor = (fib4Res.riskTier === 'HIGH') ? '#DC2626' : (fib4Res.riskTier === 'INTERMEDIATE' ? '#D97706' : '#16A34A');
          const fibLabel = isAr
            ? (fib4Res.riskLabelAr || (fib4Res.riskTier === 'HIGH' ? 'خطورة عالية' : (fib4Res.riskTier === 'INTERMEDIATE' ? 'خطورة متوسطة' : 'خطورة منخفضة')))
            : (fib4Res.riskLabelEn || (fib4Res.riskTier === 'HIGH' ? 'High Risk' : (fib4Res.riskTier === 'INTERMEDIATE' ? 'Intermediate Risk' : 'Low Risk')));
          fBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <div style="font-size:15px; font-weight:700;">
                FIB-4: <span style="color:${fibColor};">${fib4Res.score}</span> 
                <span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600; color:#fff; background:${fibColor}; margin-right:4px;">
                  ${fibLabel}
                </span>
              </div>
            </div>
            <div style="margin-top:6px; font-size:12px; border-top:1px solid var(--border); padding-top:4px;">
              <b>${isAr ? 'التوصية السريرية:' : 'Recommendation:'}</b> ${isAr ? fib4Res.actionAr : fib4Res.actionEn}
            </div>
          `;
        }
      }
    }

    // Attach listeners
    ['tab-scr', 'tab-scr-unit', 'tab-age', 'tab-sex', 'tab-wt', 'tab-kdigo-egfr', 'tab-kdigo-uacr', 'tab-fib4-ast', 'tab-fib4-alt', 'tab-fib4-plt'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', recalculateToolsTab);
        el.addEventListener('change', recalculateToolsTab);
      }
    });

    const openDrugsBtn = document.getElementById('btn-tools-open-drugs');
    if (openDrugsBtn) {
      openDrugsBtn.onclick = function() {
        if (typeof window.switchMainTab === 'function') window.switchMainTab('tab-drugs');
        else {
          document.querySelectorAll('.osrawy-nav-btn, .main-nav-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === 'tab-drugs'));
          document.querySelectorAll('.main-view-section, .tab-panel').forEach(s => s.style.display = (s.id === 'tab-drugs') ? 'block' : 'none');
          if (window.DrugDirectory && typeof window.DrugDirectory.render === 'function') window.DrugDirectory.render();
        }
      };
    }

    const openRecentBtn = document.getElementById('btn-tools-open-recent');
    if (openRecentBtn) {
      openRecentBtn.onclick = function() {
        if (typeof window.switchMainTab === 'function') window.switchMainTab('tab-recent');
        else {
          document.querySelectorAll('.osrawy-nav-btn, .main-nav-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === 'tab-recent'));
          document.querySelectorAll('.main-view-section, .tab-panel').forEach(s => s.style.display = (s.id === 'tab-recent') ? 'block' : 'none');
          if (typeof window.renderRecentPatients === 'function') window.renderRecentPatients();
        }
      };
    }

    if (typeof window !== 'undefined') {
      window.recalculateToolsTab = recalculateToolsTab;
    }

    // Initial calculation
    recalculateToolsTab();
  }

  return {
    calculateCKDEPI,
    calculateCrCl,
    evaluateKdigoMatrix,
    calculateFib4,
    evaluateDoacDosing,
    getStageInfo,
    assessPatientLdlRisk,
    openEgfrModal,
    closeEgfrModal,
    applyCalculatedEGFR,
    openLdlModal,
    closeLdlModal,
    renderLdlMatrix,
    setMatrixMarket,
    renderToolsTab,
    init,
    LDL_GOALS,
    STATIN_REGIMENS,
    ADD_ON_THERAPIES
  };
})();

if (typeof window !== 'undefined') {
  window.ClinicalTools = ClinicalTools;
  window.OsrawyClinicalTools = ClinicalTools;
}

if (typeof global !== 'undefined') {
  global.ClinicalTools = ClinicalTools;
  global.OsrawyClinicalTools = ClinicalTools;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClinicalTools;
}
