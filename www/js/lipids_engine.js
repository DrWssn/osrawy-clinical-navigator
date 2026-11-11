// ==============================================================
// Osrawy Lipids Engine - ASCVD Risk, Stratification & Lipid Pathway
// ADA Standards of Care 2025 / ESC-EAS Dyslipidemia Guidelines 2023
// ==============================================================

const OsrawyLipidsEngine = (function() {

  // --- 1. Unit Conversion Utilities ---
  // Cholesterol factor: 1 mmol/L = 38.67 mg/dL
  // Triglycerides factor: 1 mmol/L = 88.57 mg/dL
  const CHOL_FACTOR = 38.67;
  const TG_FACTOR = 88.57;

  function toMgDl(val, type = 'cholesterol') {
    const num = parseFloat(val) || 0;
    if (num <= 0) return 0;
    const factor = (type === 'tg' || type === 'triglycerides') ? TG_FACTOR : CHOL_FACTOR;
    return Math.round(num * factor * 10) / 10;
  }

  function toMmolL(val, type = 'cholesterol') {
    const num = parseFloat(val) || 0;
    if (num <= 0) return 0;
    const factor = (type === 'tg' || type === 'triglycerides') ? TG_FACTOR : CHOL_FACTOR;
    return Math.round((num / factor) * 100) / 100;
  }

  // --- 2. 10-Year ASCVD Risk Estimation (ACC/AHA Pooled Cohort Equations) ---
  function estimate10YrAscvdRisk(patient) {
    const p = patient || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});
    const age = parseFloat(p.age) || 52;
    const sex = (p.sex === 'f') ? 'f' : 'm';
    const smoker = (p.smoker || p.smk) ? 1 : 0;
    const dm = (p.diabetes || p.dm) ? 1 : 0;
    const sbp = parseFloat(p.sbp) || 130;
    const tx = (p.medsCount && parseInt(p.medsCount) > 0) ? 1 : 0;

    // Get TC and HDL in mg/dL
    let tc = parseFloat(p.totalCholesterol || p.tc) || 200;
    let hdl = parseFloat(p.hdlC || p.hdl) || 45;
    const unit = p.lipidUnit || p.lunit || 'mg';
    if (unit === 'mmol' || unit === 'mmol/L') {
      tc = toMgDl(tc, 'cholesterol');
      hdl = toMgDl(hdl, 'cholesterol');
    }

    // Established ASCVD overrides calculated risk to >20%
    if (p.ascvd || p.cad || p.stroke || p.pad) {
      return { riskPercent: 35.0, category: 'VERY_HIGH', isEstablishedAscvd: true };
    }

    // Clamp values to valid PCE ranges
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
      // Non-Hispanic White/Other Women Coefficients
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
      // Non-Hispanic White/Other Men Coefficients
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

  // --- 3. Risk Stratification (ADA 2025 / ESC-EAS 2023) ---
  const RISK_TIERS = {
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

  function stratifyRisk(patient) {
    const p = patient || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});
    const egfr = parseFloat(p.egfr) || 90;
    const uacr = parseFloat(p.uacr) || 10;
    const age = parseFloat(p.age) || 50;
    const dur = parseFloat(p.dur) || 0;
    const dm = !!(p.diabetes || p.dm);
    const ascvd = !!(p.ascvd || p.cad || p.stroke || p.pad);

    let tc = parseFloat(p.totalCholesterol || p.tc) || 200;
    let ldl = parseFloat(p.ldlC || p.ldl) || 0;
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
        parseFloat(p.sbp) >= 180 ||
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

  // --- 4. Comprehensive Clinical Pathway & Multi-Drug Guardrails ---
  function evaluateLipidPathway(patientInput) {
    const p = patientInput || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});
    const unit = p.lipidUnit || p.lunit || 'mg';
    const isMmol = (unit === 'mmol' || unit === 'mmol/L');

    // Parse laboratory values into standard mg/dL for internal clinical logic
    let tcMg = parseFloat(p.totalCholesterol || p.tc) || 200;
    let hdlMg = parseFloat(p.hdlC || p.hdl) || 45;
    let tgMg = parseFloat(p.triglycerides || p.tg) || 160;
    let ldlMg = parseFloat(p.ldlC || p.ldl) || 0;

    if (isMmol) {
      tcMg = toMgDl(tcMg, 'cholesterol');
      hdlMg = toMgDl(hdlMg, 'cholesterol');
      tgMg = toMgDl(tgMg, 'tg');
      if (ldlMg > 0) ldlMg = toMgDl(ldlMg, 'cholesterol');
    }

    // Friedewald equation if LDL not directly provided and TG < 400
    if (ldlMg <= 0 && tcMg > 0 && hdlMg > 0) {
      if (tgMg < 400) {
        ldlMg = Math.max(Math.round((tcMg - hdlMg - (tgMg / 5)) * 10) / 10, 20);
      } else {
        ldlMg = Math.round(tcMg * 0.6); // approximation when TG is very high
      }
    }

    const nonHdlMg = Math.round((tcMg - hdlMg) * 10) / 10;
    const egfr = parseFloat(p.egfr) || 90;
    const altUl = parseFloat(p.altUl || p.alt) || 25;
    const isPregnant = !!(p.pregnancy || p.preg || p.pregHtn);
    const isStatinIntolerant = !!(p.statinIntolerant);
    const strat = stratifyRisk(p);
    const target = strat.tierDetails;

    const rawDrugs = p.currentDrugs || p.meds || p.activeMeds || [];
    const activeDrugs = Array.isArray(rawDrugs) ? rawDrugs.map(d => String(d).toLowerCase()) : [];

    const alerts = [];
    const steps = [];

    function addAlert(a) {
      a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
      a.message = `${a.messageEn} | ${a.messageAr}`;
      a.msg = a.messageEn;
      a.title = a.titleEn;
      alerts.push(a);
    }

    // --- Safety Guardrails ---

    // 1. Pregnancy Contraindication Guardrail
    if (isPregnant) {
      addAlert({
        id: 'lipid-guardrail-pregnancy',
        level: 'critical',
        titleEn: 'Contraindication: Pregnancy / Lactation (Statins/Ezetimibe/PCSK9i)',
        titleAr: 'موانع استخدام قطعية: الحمل والرضاعة (أدوية الدهون)',
        messageEn: 'Statins, Ezetimibe, and PCSK9 inhibitors are contraindicated in pregnancy and breastfeeding (teratogenicity, FDA Category X). Cholesterol synthesis is vital for fetal development. Discontinue lipid-lowering pharmacotherapy immediately.',
        messageAr: 'تُحظر أدوية الستاتين والإيزيتيميب ومثبطات PCSK9 نهائياً أثناء الحمل والرضاعة لاحتمال تشوه الأجنة. أوقف جميع أدوية الدهون فوراً واعتمد على الحمية الغذائية فقط.',
        actionEn: 'Discontinue statin/ezetimibe immediately; manage strictly with nutrition/lifestyle.',
        actionAr: 'أوقف أدوية الدهون فوراً واعتمد على التغذية الصحية السليمة.'
      });
    }

    // 2. Hepatic Safety Guardrail: ALT > 3x ULN (> 120 U/L)
    if (altUl > 120) {
      addAlert({
        id: 'lipid-guardrail-hepatic-alt',
        level: 'critical',
        titleEn: `Hepatic Guardrail: Serum ALT > 3x ULN (${altUl} U/L)`,
        titleAr: `تنبيه كبدي: ارتفاع إنزيم الكبد ALT أكثر من 3 أضعاف (${altUl} وحدة/لتر)`,
        messageEn: `Active liver transaminitis (ALT ${altUl} U/L > 120 U/L). Withhold or temporarily suspend statin therapy until transaminases resolve. Evaluate etiology (viral hepatitis, NASH, biliary, or medication-induced). Recheck ALT in 2–4 weeks.`,
        messageAr: `ارتفاع إنزيمات الكبد النشطة ALT (${altUl} وحدة/لتر). أوقف أو أرجئ بدء الستاتين حتى عودة الإنزيمات لطبيعتها مع فحص أسباب الاعتلال الكبدي، ويعاد التحليل بعد 2-4 أسابيع.`,
        actionEn: 'Hold statin therapy; investigate hepatic etiology and retest ALT in 2-4 weeks.',
        actionAr: 'أوقف الستاتين مؤقتاً، وافحص وظائف الكبد بعد 2-4 أسابيع.'
      });
    }

    // 3. Drug Interaction Alert: Amlodipine + Simvastatin <= 20mg Cap
    const hasAmlodipine = p.amlodipine || activeDrugs.some(d => d.includes('amlodipine') || d.includes('exforge') || d.includes('coveram') || d.includes('twynsta'));
    const onSimvastatin = p.simvastatin || (p.statinDrug === 'simvastatin') || activeDrugs.some(d => d.includes('simvastatin'));
    if (hasAmlodipine && onSimvastatin) {
      addAlert({
        id: 'lipid-guardrail-amlodipine-simva',
        level: 'warning',
        titleEn: 'Drug Interaction Guardrail: Amlodipine + Simvastatin (Cap ≤ 20 mg/day)',
        titleAr: 'تداخل دوائي هام: أملوديبين مع سيمفاستاتين (تفاعل - الحد الأقصى 20 مجم/يوم)',
        messageEn: 'Drug interaction: Amlodipine inhibits CYP3A4 metabolism of Simvastatin, increasing simvastatin AUC by ~77% and substantially raising the risk of severe myopathy and rhabdomyolysis. Simvastatin dose MUST NOT exceed 20 mg/day cap. Alternatively, switch to Atorvastatin or Rosuvastatin which do not have this restriction.',
        messageAr: 'تداخل دوائي وتفاعل: الأملوديبين يثبط تكسير السيمفاستاتين مما يضاعف تركيزه بالدم ويزيد خطر انحلال العضلات (Rhabdomyolysis). يجب ألا تتجاوز جرعة سيمفاستاتين 20 مجم/يوم، أو يُفضل التحويل إلى أتورفاستاتين أو روزوفاستاتين.',
        actionEn: 'Limit Simvastatin to 20 mg/day maximum cap, or switch to Atorvastatin 20–40 mg.',
        actionAr: 'اخفض السيمفاستاتين إلى 20 مجم كحد أقصى أو حوّل إلى أتورفاستاتين.'
      });
    }

    // 4. Renal Guardrail: Rosuvastatin Cap 10mg if eGFR < 30
    const onRosuvastatin = p.rosuvastatin || (p.statinDrug === 'rosuvastatin') || activeDrugs.some(d => d.includes('rosuvastatin') || d.includes('crestor'));
    if (egfr > 0 && egfr < 30 && (onRosuvastatin || target.key === 'VERY_HIGH' || target.key === 'HIGH')) {
      addAlert({
        id: 'lipid-guardrail-rosuva-renal',
        level: 'warning',
        titleEn: 'Renal Guardrail: Rosuvastatin Dose Cap 10 mg/day (eGFR < 30)',
        titleAr: 'تنبيه كلوي: الحد الأقصى والجرعة القصوى للروزوفاستاتين 10 مجم/يوم (eGFR < 30)',
        messageEn: `Severe renal impairment (eGFR ${egfr} mL/min/1.73m²). Rosuvastatin clearance is markedly reduced. Maximum dose cap is 10 mg once daily (start at 5 mg daily). Atorvastatin does not require renal dose adjustment and is preferred in advanced CKD.`,
        messageAr: `قصور كلوي شديد (eGFR ${egfr}). أقصى جرعة مسموحة وجرعة قصوى من روزوفاستاتين (كريستور) هي 10 مجم يومياً (ويبدأ بجرعة 5 مجم). أتورفاستاتين (ليبيتور) لا يحتاج لتعديل كلوي وهو الخيار الأنسب.`,
        actionEn: 'Cap Rosuvastatin at 10 mg daily (start 5 mg), or use Atorvastatin without renal restriction.',
        actionAr: 'حدد جرعة الروزوفاستاتين بـ 10 مجم كحد أقصى أو استخدم أتورفاستاتين.'
      });
    }

    // 5. Hypertriglyceridemia Guardrails:
    // Severe TG >= 500 mg/dL: Pancreatitis Alert & Urgent Fibrate
    if (tgMg >= 500) {
      addAlert({
        id: 'lipid-guardrail-pancreatitis-tg',
        level: 'critical',
        titleEn: `CRITICAL ALERT: Severe Hypertriglyceridemia (TG = ${Math.round(tgMg)} mg/dL) - Acute Pancreatitis Risk`,
        titleAr: `تنبيه حرج جداً: ارتفاع خطير في الدهون الثلاثية (${Math.round(tgMg)} مجم/ديسيلتر) - التهاب البنكرياس`,
        messageEn: `Triglycerides ≥ 500 mg/dL (${Math.round(tgMg)} mg/dL / ${toMmolL(tgMg, 'tg')} mmol/L) carries an imminent risk of acute pancreatitis! Immediate TG-lowering takes priority over LDL goals. Initiate Fenofibrate (145 mg or 160 mg daily; renal dose adjustment required; avoid/contraindicated if eGFR < 30) or prescription Omega-3 ethyl esters (4 g/day). Eliminate dietary simple sugars and alcohol.`,
        messageAr: `الدهون الثلاثية ≥ 500 مجم/ديسيلتر تهدد بحدوث التهاب البنكرياس الحاد! الأولوية العاجلة هي خفض الدهون الثلاثية. ابدأ فينوفيبرات (Fenofibrate 145/160 مجم يومياً مع تعديل الجرعة لوظائف الكلى) أو أوميغا-3 بجرعة 4 جم يومياً.`,
        actionEn: 'Start Fenofibrate 145mg/160mg (if eGFR ≥30) or Omega-3 4g/day immediately to prevent pancreatitis.',
        actionAr: 'ابدأ فوراً فينوفيبرات (إذا كان eGFR ≥30) أو أوميغا-3 (4 جم يومياً) للوقاية من التهاب البنكرياس.'
      });
    } else if (tgMg >= 135 && tgMg < 500 && (p.ascvd || (p.diabetes && strat.ascvdRisk >= 10) || p.onStatin)) {
      // Moderate persistent TG 135-499: REDUCE-IT trial recommendation
      addAlert({
        id: 'lipid-recommendation-icosapent',
        level: 'info',
        titleEn: `Recommendation: Icosapent Ethyl / Omega-3 for Persistent Hypertriglyceridemia (TG 135–499 mg/dL)`,
        titleAr: `توصية علاجية: إيكوزابنت إيثيل / أوميغا-3 لارتفاع الدهون الثلاثية المستمر`,
        messageEn: `In patients with established ASCVD or high-risk diabetes on maximally tolerated statin with TG 135–499 mg/dL (current TG: ${Math.round(tgMg)} mg/dL), adding Icosapent Ethyl (Vascepa / Omega-3) 2 g twice daily with food significantly reduces ischemic cardiovascular events and cardiovascular death (REDUCE-IT trial).`,
        messageAr: `في مرضى القلب والسكري عالي الخطورة الخاضعين لجرعة ستاتين مع بقاء الدهون الثلاثية بين 135 و 499، يُوصى بإضافة إيكوزابنت إيثيل (Icosapent ethyl / أوميغا-3 2g مرتين يومياً) لخفض الوفيات والجلطات القلبية بنسبة 25%.`,
        actionEn: 'Consider Icosapent ethyl 2 g twice daily with meals to lower residual cardiovascular risk.',
        actionAr: 'أضف إيكوزابنت إيثيل 2 جم مرتين يومياً مع الوجبات.'
      });
    }

    // --- Sequential Step-by-Step Lipid Treatment Pathway ---

    // Step 1: Statin Selection
    if (isStatinIntolerant) {
      steps.push({
        stepNumber: 1,
        titleEn: 'Step 1: Statin-Intolerant Non-Statin Strategy',
        titleAr: 'الخطوة 1: استراتيجية عدم تحمل الستاتين (Statin Intolerance)',
        drugEn: 'Ezetimibe 10 mg once daily + Bempedoic Acid 180 mg once daily (or PCSK9 Inhibitor)',
        drugAr: 'إيزيتيميب 10 مجم يومياً + حمض البيمبيدويك 180 مجم يومياً (أو حقن PCSK9)',
        detailEn: 'For confirmed statin-associated muscle symptoms (SAMS) or intolerance: initiate Ezetimibe 10 mg daily (15–20% LDL reduction) combined with Bempedoic Acid (Nexletol 180 mg; provides additional 15–25% LDL reduction without muscle aching as it requires hepatic activation). For very high risk, proceed directly to PCSK9 inhibitor.',
        detailAr: 'في حالات عدم تحمل الستاتين المثبتة: ابدأ بإيزيتيميب 10 مجم يومياً مع بيمبيدويك أسيد 180 مجم (يخفض الكوليسترول دون التسبب بآلام عضلية لأنه ينشط فقط بالكبد). للحالات عالية الخطورة جداً يتم اللجوء لحقن PCSK9 مباشرة.'
      });
    } else if (target.key === 'VERY_HIGH') {
      const rosuvaDose = (egfr > 0 && egfr < 30) ? '10 mg once daily (capped for eGFR <30)' : '20 – 40 mg once daily';
      steps.push({
        stepNumber: 1,
        titleEn: 'Step 1: High-Intensity Statin Therapy (Max Tolerated Dose)',
        titleAr: 'الخطوة 1: ستاتين عالي الكثافة بالجرعة القصوى المحتملة',
        drugEn: `Atorvastatin 40–80 mg once daily OR Rosuvastatin ${rosuvaDose}`,
        drugAr: `أتورفاستاتين 40–80 مجم مساءً أو روزوفاستاتين ${egfr < 30 ? '10 مجم (الحد الأقصى لاعتلال الكلى)' : '20-40 مجم يومياً'}`,
        detailEn: `Goal: achieve ≥50% LDL-C reduction AND target LDL-C < 55 mg/dL (< 1.4 mmol/L) and Non-HDL < 85 mg/dL (< 2.2 mmol/L). Reassess fasting lipid panel in 4–12 weeks.`,
        detailAr: `الهدف: خفض LDL بنسبة ≥50% والوصول لأقل من 55 مجم/ديسيلتر (< 1.4 مليمول) و Non-HDL < 85. يُعاد التحليل بعد 4-12 أسبوعاً.`
      });
    } else if (target.key === 'HIGH') {
      steps.push({
        stepNumber: 1,
        titleEn: 'Step 1: High-Intensity Statin (or Moderate-Intensity Titrated)',
        titleAr: 'الخطوة 1: ستاتين عالي الكثافة (أو متوسط الكثافة مع المعايرة)',
        drugEn: 'Atorvastatin 40–80 mg daily OR Rosuvastatin 10–20 mg daily',
        drugAr: 'أتورفاستاتين 40-80 مجم أو روزوفاستاتين 10-20 مجم يومياً',
        detailEn: `Goal: achieve ≥50% LDL-C reduction AND target LDL-C < 70 mg/dL (< 1.8 mmol/L) and Non-HDL < 100 mg/dL (< 2.6 mmol/L).`,
        detailAr: `الهدف: خفض LDL بنسبة ≥50% والوصول لأقل من 70 مجم/ديسيلتر (< 1.8 مليمول) و Non-HDL < 100.`
      });
    } else if (target.key === 'MODERATE') {
      steps.push({
        stepNumber: 1,
        titleEn: 'Step 1: Moderate-Intensity Statin Therapy',
        titleAr: 'الخطوة 1: ستاتين متوسط الكثافة',
        drugEn: 'Atorvastatin 10–20 mg OR Rosuvastatin 5–10 mg daily',
        drugAr: 'أتورفاستاتين 10-20 مجم أو روزوفاستاتين 5-10 مجم يومياً',
        detailEn: `Goal: achieve 30%–49% LDL-C reduction AND target LDL-C < 100 mg/dL (< 2.6 mmol/L).`,
        detailAr: `الهدف: خفض LDL بنسبة 30-49% والوصول لأقل من 100 مجم/ديسيلتر (< 2.6 مليمول).`
      });
    } else {
      steps.push({
        stepNumber: 1,
        titleEn: 'Step 1: Lifestyle Interventions & Dietary Modification',
        titleAr: 'الخطوة 1: تعديل نمط الحياة والنظام الغذائي',
        drugEn: 'Therapeutic Lifestyle Changes (TLC) · Dietary fiber, exercise',
        drugAr: 'تعديل نمط الحياة، تقليل الدهون المشبعة، المشي 150 دقيقة أسبوعياً',
        detailEn: `Target LDL-C < 116 mg/dL (< 3.0 mmol/L). If LDL remains above target after 3 months of lifestyle modification, consider initiating moderate-intensity statin.`,
        detailAr: `الهدف LDL أقل من 116 مجم/ديسيلتر. إذا استمر الارتفاع بعد 3 أشهر من الحمية والرياضة، يُنظر في بدء ستاتين خفيف إلى متوسط.`
      });
    }

    // Step 2: Ezetimibe Escalation
    const onStatin = !!(p.onStatin || p.currentStatin || p.statin || activeDrugs.some(d => d.includes('statin')));
    const onEzetimibe = !!(p.onEzetimibe || activeDrugs.some(d => d.includes('ezetimibe')));
    const ldlAboveTarget = ldlMg > target.ldlTargetMg;

    steps.push({
      stepNumber: 2,
      titleEn: 'Step 2: Ezetimibe 10 mg Add-on Escalation',
      titleAr: 'الخطوة 2: إضافة إيزيتيميب 10 مجم (Step 2 Ezetimibe Escalation)',
      drugEn: 'Ezetimibe 10 mg once daily (or Single-Pill Combination e.g. Atozet / Rosuzet)',
      drugAr: 'إيزيتيميب 10 مجم يومياً (أو حبة مشتركة مثل أتوزيت / روزوزيت)',
      detailEn: (onStatin || ldlAboveTarget)
        ? `Current LDL-C (${Math.round(ldlMg)} mg/dL) exceeds target (< ${target.ldlTargetMg} mg/dL). Add Ezetimibe 10 mg once daily to statin therapy to achieve an additional 15%–20% LDL reduction (IMPROVE-IT trial).`
        : `Indicated if LDL-C rises above target (< ${target.ldlTargetMg} mg/dL) on statin monotherapy.`,
      detailAr: (onStatin || ldlAboveTarget)
        ? `مستوى LDL الحالي (${Math.round(ldlMg)} مجم) أعلى من الهدف المحدد (< ${target.ldlTargetMg} مجم). أضف إيزيتيميب 10 مجم يومياً مع الستاتين لخفض إضافي بنسبة 15-20%.`
        : `تتم إضافته في حال عدم الوصول للهدف المنشود (< ${target.ldlTargetMg} مجم) باستخدام الستاتين وحده.`
    });

    // Step 3: PCSK9 Inhibitor Escalation
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

    // Step 4: Triglyceride Management Step
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
      recommendation,
      alerts,
      guardrails: alerts,
      steps
    };
  }

  // --- 5. DOM Rendering Summary ---
  function renderLipidsSummary(containerId) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById(containerId);
    if (!container) return;

    const patient = (typeof PatientSync !== 'undefined') ? PatientSync.get() : {};
    const pathway = evaluateLipidPathway(patient);
    const isAr = (typeof window.I18n !== 'undefined' && window.I18n.getLang() === 'ar');

    const t = pathway.target;
    const labs = pathway.labs;
    const strat = pathway.stratification;
    const gap = pathway.gap;

    let alertsHtml = '';
    pathway.alerts.forEach(a => {
      const cls = (a.level === 'critical') ? 'lipid-alert-danger' : (a.level === 'warning' ? 'lipid-alert-warning' : 'lipid-alert-info');
      const icon = (a.level === 'critical') ? '🚨' : (a.level === 'warning' ? '⚠️' : '💡');
      alertsHtml += `
        <div class="lipid-alert ${cls}">
          <div class="lipid-alert-title">${icon} ${isAr ? a.titleAr : a.titleEn}</div>
          <div class="lipid-alert-msg">${isAr ? a.messageAr : a.messageEn}</div>
          <div class="lipid-alert-action"><b>${isAr ? 'الإجراء الموصى به:' : 'Action:'}</b> ${isAr ? a.actionAr : a.actionEn}</div>
        </div>
      `;
    });

    let stepsHtml = '';
    pathway.steps.forEach(s => {
      stepsHtml += `
        <div class="lipid-step-card">
          <div class="lipid-step-header">
            <span class="lipid-step-num">${s.stepNumber}</span>
            <span class="lipid-step-title">${isAr ? s.titleAr : s.titleEn}</span>
          </div>
          <div class="lipid-step-drug">💊 <b>${isAr ? s.drugAr : s.drugEn}</b></div>
          <div class="lipid-step-desc">${isAr ? s.detailAr : s.detailEn}</div>
        </div>
      `;
    });

    const ldlTargetDisplay = pathway.isMmol ? `${t.ldlTargetMmol} mmol/L` : `${t.ldlTargetMg} mg/dL`;
    const ldlCurrentDisplay = pathway.isMmol ? `${labs.ldlMmol} mmol/L` : `${labs.ldlMg} mg/dL`;
    const nonHdlTargetDisplay = pathway.isMmol ? `${t.nonHdlTargetMmol} mmol/L` : `${t.nonHdlTargetMg} mg/dL`;
    const nonHdlCurrentDisplay = pathway.isMmol ? `${labs.nonHdlMmol} mmol/L` : `${labs.nonHdlMg} mg/dL`;

    const statusBadge = gap.isAtTarget
      ? `<span class="lipid-status-tag lipid-status-ok">✅ ${isAr ? 'الهدف محقق' : 'At Target'}</span>`
      : `<span class="lipid-status-tag lipid-status-elevated">⚠️ ${isAr ? `فوق الهدف بـ ${pathway.isMmol ? gap.gapMmol : gap.gapMg}` : `${pathway.isMmol ? gap.gapMmol : gap.gapMg} above goal`}</span>`;

    container.innerHTML = `
      <div class="lipids-wrapper ${isAr ? 'rtl' : 'ltr'}">
        <!-- Hero Risk Stratification Banner -->
        <div class="lipid-hero-card">
          <div class="lipid-hero-main">
            <div class="lipid-tier-row">
              <span class="lipid-badge ${t.badgeClass}">${isAr ? t.nameAr : t.nameEn}</span>
              ${statusBadge}
            </div>
            <div class="lipid-reason">${isAr ? strat.reasonAr : strat.reasonEn}</div>
            <div class="lipid-ascvd-est">
              📊 <b>${isAr ? 'مخاطر القلب والشرايين لـ 10 سنوات (ASCVD Risk):' : '10-Year ASCVD Risk:'}</b> ${strat.ascvdRisk}%
            </div>
          </div>
        </div>

        <!-- Metrics Grid: Current vs Targets -->
        <div class="lipid-metrics-grid">
          <div class="lipid-metric-box">
            <div class="lipid-metric-lbl">${isAr ? 'الكوليسترول الضار (LDL-C)' : 'LDL-C'}</div>
            <div class="lipid-metric-val ${gap.isAtTarget ? 'text-success' : 'text-danger'}">${ldlCurrentDisplay}</div>
            <div class="lipid-metric-target">${isAr ? 'الهدف:' : 'Target:'} <b>&lt; ${ldlTargetDisplay}</b></div>
          </div>

          <div class="lipid-metric-box">
            <div class="lipid-metric-lbl">${isAr ? 'الكوليسترول غير المفيد (Non-HDL)' : 'Non-HDL'}</div>
            <div class="lipid-metric-val">${nonHdlCurrentDisplay}</div>
            <div class="lipid-metric-target">${isAr ? 'الهدف:' : 'Target:'} <b>&lt; ${nonHdlTargetDisplay}</b></div>
          </div>

          <div class="lipid-metric-box">
            <div class="lipid-metric-lbl">${isAr ? 'الدهون الثلاثية (Triglycerides)' : 'Triglycerides'}</div>
            <div class="lipid-metric-val ${labs.tgMg >= 500 ? 'text-critical' : ''}">${pathway.isMmol ? `${labs.tgMmol} mmol/L` : `${labs.tgMg} mg/dL`}</div>
            <div class="lipid-metric-target">${isAr ? 'الهدف:' : 'Target:'} <b>&lt; 150 mg/dL</b></div>
          </div>

          <div class="lipid-metric-box">
            <div class="lipid-metric-lbl">${isAr ? 'الكوليسترول الكلي و HDL' : 'Total & HDL'}</div>
            <div class="lipid-metric-val">${pathway.isMmol ? `${labs.tcMmol} / ${labs.hdlMmol}` : `${labs.tcMg} / ${labs.hdlMg}`}</div>
            <div class="lipid-metric-target">${isAr ? 'إنزيم الكبد ALT:' : 'Liver ALT:'} <b>${labs.altUl} U/L</b></div>
          </div>
        </div>

        <!-- Safety Guardrails Alerts -->
        ${alertsHtml ? `<div class="lipid-alerts-section">${alertsHtml}</div>` : ''}

        <!-- Sequential Treatment Pathway -->
        <div class="lipid-pathway-section">
          <h3 class="lipid-section-title">🎯 ${isAr ? 'خطة العلاج المتسلسلة (ADA 2025 / ESC 2023)' : 'Sequential Treatment Pathway (ADA/ESC)'}</h3>
          <div class="lipid-steps-list">
            ${stepsHtml}
          </div>
        </div>

        <!-- Monitoring Timeline -->
        <div class="lipid-timeline-box">
          <b>📅 ${isAr ? 'جدول المتابعة والتحاليل:' : 'Laboratory Monitoring Schedule:'}</b>
          <ul>
            <li>${isAr ? 'إعادة فحص الدهون الكامل (Lipid Profile) بعد 4 إلى 12 أسبوعاً من بدء أو زيادة جرعة الستاتين.' : 'Reassess fasting lipid profile in 4–12 weeks after statin initiation or dose adjustment.'}</li>
            <li>${isAr ? 'فحص إنزيمات الكبد (ALT/AST) عند البدء أو عند ظهور أعراض، وفحص CK في حال وجود آلام عضلية شديدة.' : 'Check ALT at baseline and repeat if symptomatic; check serum CK if significant muscle pain occurs.'}</li>
            <li>${isAr ? 'فحص زلال البول UACR ووظائف الكلى eGFR سنوياً لمرضى السكري والضغط.' : 'Annual surveillance of eGFR and UACR for all DM/HTN patients.'}</li>
          </ul>
        </div>
      </div>
    `;
  }

  // Reactive subscription to cross-engine updates
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('osrawy:patient-updated', function(e) {
      const el = (typeof document !== 'undefined') ? (document.getElementById('lipid-engine-summary') || document.getElementById('lipids-container') || document.getElementById('ldl-matrix-container')) : null;
      if (el) {
        renderLipidsSummary(el.id);
      }
    });
  }

  return {
    toMgDl,
    toMmolL,
    estimate10YrAscvdRisk,
    stratifyRisk,
    evaluateLipidPathway,
    renderLipidsSummary,
    RISK_TIERS
  };
})();

if (typeof window !== 'undefined') {
  window.OsrawyLipidsEngine = OsrawyLipidsEngine;
  window.LipidsEngine = OsrawyLipidsEngine;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OsrawyLipidsEngine;
}
