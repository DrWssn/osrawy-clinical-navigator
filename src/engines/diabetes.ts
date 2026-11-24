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
