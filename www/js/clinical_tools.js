// ==============================================================
// Osrawy Clinical Tools: CKD-EPI 2021 Calculator & ASCVD LDL-C Goals Matrix
// Inker LA et al. NEJM 2021 (Race-Free eGFR) & Cockcroft-Gault CrCl
// ADA Standards of Care 2025 / ESC-EAS Dyslipidemia Guidelines 2023
// ==============================================================

const ClinicalTools = (function() {

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
   * CrCl = ((140 - Age) * Weight) / (72 * Scr_mg) * (0.85 if female else 1.0)
   */
  function calculateCrCl(scrVal, scrUnit, ageVal, sexVal, wtVal) {
    const scr = parseFloat(scrVal) || 0;
    const age = parseFloat(ageVal) || 0;
    const sex = (sexVal === 'f') ? 'f' : 'm';
    const wt = parseFloat(wtVal) || 0;

    if (scr <= 0 || age <= 0 || wt <= 0) return null;
    const scrMg = (scrUnit === 'umol') ? (scr / 88.4) : scr;

    const factor = (sex === 'f') ? 0.85 : 1.0;
    const crcl = ((140 - age) * wt) / (72 * scrMg) * factor;

    return {
      crcl: Math.round(crcl * 10) / 10,
      crclInt: Math.round(crcl)
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
    if (unitSelect && !unitSelect.value) unitSelect.value = 'mg';

    // If Scr is empty, suggest 1.0 mg/dL or 88 µmol/L
    if (scrInput && !scrInput.value) {
      scrInput.value = (unitSelect && unitSelect.value === 'umol') ? '88.4' : '1.0';
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

    // 1. Update PatientSync active patient
    if (typeof window.PatientSync !== 'undefined') {
      if (typeof window.PatientSync.setEGFR === 'function') {
        window.PatientSync.setEGFR(val);
      } else {
        const pt = window.PatientSync.get();
        if (pt) pt.egfr = val;
        window.PatientSync.saveActive();
        window.PatientSync.updatePatientBar();
      }
    }

    // 2. Update Diabetes form #egfr
    const diaEgfr = document.getElementById('egfr');
    if (diaEgfr) {
      diaEgfr.value = val;
    }

    // 3. Update HTN form #htn-egfr
    const htnEgfr = document.getElementById('htn-egfr');
    if (htnEgfr) {
      htnEgfr.value = val;
    }

    // 4. Trigger engines recalculation
    if (typeof window.plan === 'function') {
      window.plan();
    }
    if (typeof window.htnRender === 'function') {
      window.htnRender();
    }
    if (typeof window.htnRenderTitrate === 'function') {
      window.htnRenderTitrate();
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
            <div class="ldl-eval-name">${pt.name || (isAr ? 'مريض العيادة' : 'Current Patient')} · ${pt.age || 52} ${isAr ? 'سنة' : 'y'} · ${pt.sex === 'f' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}</div>
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
      unitSelect.addEventListener('change', () => {
        // Automatically convert the current number in scrInput when unit changes
        if (scrInput && scrInput.value) {
          const curVal = parseFloat(scrInput.value);
          if (!isNaN(curVal) && curVal > 0) {
            if (unitSelect.value === 'umol') {
              scrInput.value = (curVal * 88.4).toFixed(1);
            } else {
              scrInput.value = (curVal / 88.4).toFixed(2);
            }
          }
        }
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

    // 6. Listen to I18n language change to refresh modal content if open
    if (typeof window.I18n !== 'undefined' && typeof window.I18n.onChange === 'function') {
      window.I18n.onChange(() => {
        if (egfrModal && egfrModal.classList.contains('open')) {
          renderEgfrCalculation();
        }
        if (ldlModal && ldlModal.classList.contains('open')) {
          renderLdlMatrix();
        }
      });
    }
  }

  return {
    calculateCKDEPI,
    calculateCrCl,
    getStageInfo,
    assessPatientLdlRisk,
    openEgfrModal,
    closeEgfrModal,
    applyCalculatedEGFR,
    openLdlModal,
    closeLdlModal,
    renderLdlMatrix,
    setMatrixMarket,
    init,
    LDL_GOALS,
    STATIN_REGIMENS,
    ADD_ON_THERAPIES
  };
})();

if (typeof window !== 'undefined') {
  window.ClinicalTools = ClinicalTools;
}
