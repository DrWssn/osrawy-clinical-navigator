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

export interface ScreeningItem {
  id: string;
  test: string;
  frequency: string;
  why: string;
  nameEn: string;
  nameAr: string;
  freqEn: string;
  freqAr: string;
  dueReasonEn: string;
  dueReasonAr: string;
}

export interface ScreeningGroup {
  group: string;
  groupEn: string;
  groupAr: string;
  items: ScreeningItem[];
}

export interface DmPlanItem {
  id: string;
  action: 'active' | 'start' | 'cap' | 'stop';
  titleEn: string;
  titleAr: string;
  rationaleEn: string;
  rationaleAr: string;
  drugId?: string;
}

export function evaluateScreening(p: any): ScreeningGroup[] {
  const pt = p || {};
  const egfrRaw = pt.egfr;
  const egfr = (egfrRaw === undefined || egfrRaw === null)
    ? 90
    : (egfrRaw === '' ? 0 : (Number.isFinite(Number(egfrRaw)) ? Number(egfrRaw) : 0));
  const uacr = parseFloat(String(pt.uacr)) || 0;
  const a1c = parseFloat(String(pt.a1c)) || 7.0;
  const age = parseFloat(String(pt.age)) || 52;
  const isElderlyOrFrail = age >= 65 || !!pt.frail;
  const target = parseFloat(String(pt.targetA1c || (isElderlyOrFrail ? 7.5 : 7.0)));

  let kidFEn = 'Yearly';
  let kidFAr = 'سنوياً';
  if (egfr < 30) {
    kidFEn = 'Every 3 months';
    kidFAr = 'كل 3 أشهر';
  } else if (egfr < 45 || uacr > 300) {
    kidFEn = 'Every 3–4 months';
    kidFAr = 'كل 3–4 أشهر';
  } else if (egfr < 60 || uacr >= 30) {
    kidFEn = 'Every 6 months';
    kidFAr = 'كل 6 أشهر';
  }

  const a1cFreqEn = a1c > target ? 'Every 3 months (above target)' : 'Every 6 months (at target)';
  const a1cFreqAr = a1c > target ? 'كل 3 أشهر (أعلى من الهدف)' : 'كل 6 أشهر (ضمن الهدف)';
  const a1cWhyEn = a1c > target
    ? `Above individualized target (< ${target}%) — intensify therapy & recheck`
    : 'Adjust therapy until at goal and maintain stability';
  const a1cWhyAr = a1c > target
    ? `أعلى من الهدف المخصص (< ${target}%) — يلزم تعديل العلاج وإعادة الفحص`
    : 'مراقبة استقرار السكر التراكمي وتعديل الخطة عند الحاجة';

  return [
    {
      group: 'Diabetes control',
      groupEn: 'Diabetes control',
      groupAr: 'ضبط السكر والمتابعة',
      items: [
        {
          id: 'screen-hba1c',
          test: 'HbA1c',
          frequency: a1cFreqEn,
          why: a1cWhyEn,
          nameEn: 'HbA1c',
          nameAr: 'السكر التراكمي (HbA1c)',
          freqEn: a1cFreqEn,
          freqAr: a1cFreqAr,
          dueReasonEn: a1cWhyEn,
          dueReasonAr: a1cWhyAr
        },
        {
          id: 'screen-home-glucose',
          test: 'Home glucose log',
          frequency: '2–3 times per week',
          why: 'Review fasting and postprandial patterns at each consultation',
          nameEn: 'Home glucose log',
          nameAr: 'سجل قياس السكر المنزلي',
          freqEn: '2–3 times per week',
          freqAr: '2–3 مرات أسبوعياً',
          dueReasonEn: 'Review fasting and postprandial patterns at each consultation',
          dueReasonAr: 'مراجعة قراءات الصائم وبعد الأكل في كل زيارة'
        }
      ]
    },
    {
      group: 'Cardiorenal & Vascular',
      groupEn: 'Cardiorenal & Vascular',
      groupAr: 'الكلى والقلب والأوعية الدموية',
      items: [
        {
          id: 'screen-ckd',
          test: 'Kidney check (eGFR & UACR)',
          frequency: kidFEn,
          why: 'Detect and stage diabetic kidney disease early per KDIGO cadence',
          nameEn: 'Kidney check (eGFR & UACR)',
          nameAr: 'فحص الكلى والزلال (eGFR & UACR)',
          freqEn: kidFEn,
          freqAr: kidFAr,
          dueReasonEn: 'Detect and stage diabetic kidney disease early per KDIGO cadence',
          dueReasonAr: 'الكشف المبكر عن اعتلال الكلى السكري ومتابعته حسب KDIGO'
        },
        {
          id: 'screen-lipids',
          test: 'Lipid panel',
          frequency: 'Yearly',
          why: 'Assess ASCVD risk and LDL-C response to lipid therapy',
          nameEn: 'Lipid panel',
          nameAr: 'ملف الدهون (Lipid Panel)',
          freqEn: 'Yearly',
          freqAr: 'سنوياً',
          dueReasonEn: 'Assess ASCVD risk and LDL-C response to lipid therapy',
          dueReasonAr: 'تقييم مخاطر القلب ومتابعة استجابة LDL للستاتين'
        }
      ]
    },
    {
      group: 'Microvascular complications',
      groupEn: 'Microvascular complications',
      groupAr: 'المضاعفات الدقيقة (العين والقدم)',
      items: [
        {
          id: 'screen-eye',
          test: 'Comprehensive dilated eye exam',
          frequency: 'Yearly by ophthalmologist',
          why: 'Diabetic retinopathy screening',
          nameEn: 'Comprehensive dilated eye exam',
          nameAr: 'فحص قاع العين الشامل',
          freqEn: 'Yearly by ophthalmologist',
          freqAr: 'سنوياً لدى طبيب العيون',
          dueReasonEn: 'Diabetic retinopathy screening',
          dueReasonAr: 'الكشف المبكر عن اعتلال الشبكية السكري'
        },
        {
          id: 'screen-foot',
          test: 'Comprehensive foot exam',
          frequency: 'Yearly (plus visual inspection each visit)',
          why: 'Neuropathy and PAD ulcer prevention',
          nameEn: 'Comprehensive foot exam',
          nameAr: 'فحص القدم السكري الشامل',
          freqEn: 'Yearly (plus visual inspection each visit)',
          freqAr: 'سنوياً (مع فحص ظاهري في كل زيارة)',
          dueReasonEn: 'Neuropathy and PAD ulcer prevention',
          dueReasonAr: 'الوقاية من اعتلال الأعصاب وقرح القدم السكري'
        }
      ]
    }
  ];
}

export function evaluateGeneralDmPlan(pt: any): DmPlanItem[] {
  const p = pt || {};
  const items: DmPlanItem[] = [];
  const medsRaw = Array.isArray(p.activeMeds)
    ? p.activeMeds
    : Array.isArray(p.meds)
      ? p.meds
      : Array.isArray(p.currentMeds)
        ? p.currentMeds
        : Array.isArray(p.medications)
          ? p.medications
          : [];
  const meds: string[] = medsRaw.map((m: unknown) => String(m).toLowerCase().trim());
  const hasMed = (...tokens: string[]) =>
    meds.some((m: string) => tokens.some(t => (t.length <= 3 ? m === t || m.startsWith(`${t}_`) || m.startsWith(`${t}-`) : m.includes(t))));

  const egfrRaw = p.egfr;
  const egfr = (egfrRaw === undefined || egfrRaw === null)
    ? 90
    : (egfrRaw === '' ? 0 : (Number.isFinite(Number(egfrRaw)) ? Number(egfrRaw) : 0));
  const uacr = parseFloat(String(p.uacr ?? 0)) || 0;
  const a1c = parseFloat(String(p.a1c ?? 7.0)) || 0;
  const wt = parseFloat(String(p.wt ?? p.weightKg ?? 75)) || 75;
  const age = parseFloat(String(p.age ?? 52)) || 52;
  const isFrail = !!p.frail;
  const isPreg = !!(p.pregnancy || p.preg || p.isPregnant || p.pregHtn);
  const hasAscvd = !!(p.ascvd || p.cad || p.stroke || p.pad);
  const hasHf = !!(p.hf && p.hf !== 'none' && p.hf !== false);
  const targetA1c = isFrail || age >= 65 ? 7.5 : 7.0;

  if (isPreg) {
    const pregStopList: Array<{ id: string; labelEn: string; labelAr: string }> = [
      { id: 'metformin', labelEn: 'Metformin', labelAr: 'الميتفورمين' },
      { id: 'empagliflozin', labelEn: 'Empagliflozin', labelAr: 'إمباغليفلوزين' },
      { id: 'dapagliflozin', labelEn: 'Dapagliflozin', labelAr: 'داباغليفلوزين' },
      { id: 'semaglutide', labelEn: 'Semaglutide', labelAr: 'سيماغلوتايد' },
      { id: 'tirzepatide', labelEn: 'Tirzepatide', labelAr: 'تيرزيباتايد' },
      { id: 'sitagliptin', labelEn: 'Sitagliptin', labelAr: 'سيتاغليبتين' },
      { id: 'gliclazide', labelEn: 'Gliclazide', labelAr: 'غليكلازايد' },
      { id: 'glimepiride', labelEn: 'Glimepiride', labelAr: 'غليميبرايد' }
    ];
    for (const agent of pregStopList) {
      if (hasMed(agent.id)) {
        items.push({
          id: `dm-plan-preg-stop-${agent.id}`,
          action: 'stop',
          drugId: agent.id,
          titleEn: `Stop ${agent.labelEn} in Pregnancy`,
          titleAr: `إيقاف ${agent.labelAr} أثناء الحمل`,
          rationaleEn: `${agent.labelEn} is not recommended during pregnancy; switch immediately to weight-based basal-bolus insulin.`,
          rationaleAr: `${agent.labelAr} غير معتمد أثناء الحمل؛ يجب التحويل فوراً إلى نظام الإنسولين.`
        });
      }
    }
    const hasInsulin = hasMed('insulin', 'insulin_glargine', 'nph', 'glarg');
    items.push({
      id: 'dm-plan-preg-insulin',
      action: hasInsulin ? 'active' : 'start',
      drugId: 'insulin_glargine',
      titleEn: hasInsulin ? 'Continue Basal-Bolus Insulin in Pregnancy' : 'Start Basal-Bolus Insulin Therapy',
      titleAr: hasInsulin ? 'الاستمرار على الإنسولين القاعدي/السريع في الحمل' : 'بدء علاج الإنسولين المكثف للحمل',
      rationaleEn: 'Insulin is the gold-standard sole recommended pharmacotherapy for diabetes in pregnancy (targets: FPG <95, 1h <140, 2h <120 mg/dL).',
      rationaleAr: 'الإنسولين هو الخيار الآمن والوحيد المعتمد في الحمل (صائم <95، بعد ساعة <140، بعد ساعتين <120).'
    });
    return items;
  }

  // 1. Metformin status
  const onMetformin = hasMed('metformin', 'met', 'glucophage', 'cidophage');
  if (onMetformin) {
    if (egfr < 30) {
      items.push({
        id: 'dm-plan-metformin-stop',
        action: 'stop',
        drugId: 'metformin',
        titleEn: egfr <= 0 ? 'Stop / Hold Metformin (eGFR ≤ 0 / Unverified Renal Function)' : 'Stop Metformin (eGFR < 30)',
        titleAr: egfr <= 0 ? 'إيقاف الميتفورمين (فشل كلوي حاد / وظائف كلى غير موثقة)' : 'إيقاف الميتفورمين فوراً (eGFR < 30)',
        rationaleEn: egfr <= 0
          ? `eGFR is ${egfr} mL/min/1.73m². Do not continue Metformin until renal function is verified ≥ 30 mL/min due to fatal lactic acidosis risk.`
          : `eGFR is ${egfr} mL/min/1.73m². Discontinue immediately due to fatal lactic acidosis risk.`,
        rationaleAr: egfr <= 0
          ? `معدل الترشيح الكبيبي ${egfr} مل/دقيقة؛ يُوقف الميتفورمين فوراً حتى التحقق من سلامة وظائف الكلى (≥ 30) لتفادي الحماض اللبني.`
          : `معدل الترشيح الكبيبي ${egfr} مل/دقيقة؛ يُمنع الميتفورمين لخطر الحماض اللبني المميت.`
      });
    } else if (egfr >= 30 && egfr < 45) {
      items.push({
        id: 'dm-plan-metformin-cap',
        action: 'cap',
        drugId: 'metformin',
        titleEn: 'Cap Metformin at ≤ 1000 mg/day (eGFR 30–44)',
        titleAr: 'تحديد جرعة الميتفورمين بـ ≤ 1000 مجم/يوم (eGFR 30–44)',
        rationaleEn: `eGFR is ${egfr} mL/min/1.73m² (Stage G3b). Reduce maximum daily dose to 1000 mg/day and monitor eGFR q3 months.`,
        rationaleAr: `معدل الترشيح ${egfr}؛ الحد الأقصى للجرعة 1000 مجم/يوم مع مراقبة الكلى كل 3 أشهر.`
      });
    } else {
      items.push({
        id: 'dm-plan-metformin-active',
        action: 'active',
        drugId: 'metformin',
        titleEn: 'Continue Metformin Foundation',
        titleAr: 'الاستمرار على الميتفورمين كعلاج أساسي',
        rationaleEn: `Renal function permits continuation (eGFR ${egfr} mL/min). Check B12 periodically on long-term therapy.`,
        rationaleAr: `وظائف الكلى (${egfr}) تسمح بالاستمرار مع فحص فيتامين B12 دورياً.`
      });
    }
  } else if (egfr >= 45) {
    items.push({
      id: 'dm-plan-metformin-start',
      action: 'start',
      drugId: 'metformin',
      titleEn: 'Initiate Metformin (First-Line Foundation)',
      titleAr: 'بدء الميتفورمين كخيار أول أساسي',
      rationaleEn: 'First-line foundational therapy for T2DM with eGFR ≥ 45 mL/min (weight-neutral, low hypoglycemia risk).',
      rationaleAr: 'العلاج الأساسي الأول للسكري من النوع الثاني مع eGFR ≥ 45 دون زيادة وزن أو هبوط سكر.'
    });
  }

  // 2. SGLT2i (Cardiorenal protection)
  const onEmpa = hasMed('empagliflozin', 'empa', 'jardiance');
  const onDapa = hasMed('dapagliflozin', 'dapa', 'forxiga');
  const activeSglt2 = onEmpa ? 'empagliflozin' : (onDapa ? 'dapagliflozin' : undefined);
  const needsCardiorenalSglt2 = (egfr > 0 && egfr < 60) || uacr >= 30 || hasAscvd || hasHf;

  if (activeSglt2) {
    if (egfr < 20) {
      items.push({
        id: 'dm-plan-sglt2-stop',
        action: 'stop',
        drugId: activeSglt2,
        titleEn: 'Review / Hold SGLT2i (eGFR < 20)',
        titleAr: 'مراجعة أو إيقاف مثبط SGLT2 (eGFR < 20)',
        rationaleEn: `eGFR is ${egfr} mL/min (< 20). Do not initiate; consult Nephrology regarding continuation.`,
        rationaleAr: `معدل الترشيح ${egfr} أقل من 20؛ يُستشار أخصائي الكلى قبل الاستمرار.`
      });
    } else {
      items.push({
        id: 'dm-plan-sglt2-active',
        action: 'active',
        drugId: activeSglt2,
        titleEn: `Continue ${onEmpa ? 'Empagliflozin' : 'Dapagliflozin'} (Cardiorenal Protection)`,
        titleAr: `الاستمرار على ${onEmpa ? 'إمباغليفلوزين' : 'داباغليفلوزين'} لحماية القلب والكلى`,
        rationaleEn: 'Active SGLT2 inhibitor slows CKD progression and reduces HF hospitalization and CV death.',
        rationaleAr: 'مثبط SGLT2 نشط يحمي الكلى ويقلل دخول المستشفى لقصور القلب والوفيات القلبية.'
      });
    }
  } else if (needsCardiorenalSglt2 && egfr >= 20) {
    items.push({
      id: 'dm-plan-sglt2-start',
      action: 'start',
      drugId: 'empagliflozin',
      titleEn: 'Start Empagliflozin 10 mg (Cardiorenal Priority)',
      titleAr: 'بدء إمباغليفلوزين 10 مجم (أولوية قلبية وكلوية)',
      rationaleEn: `Indicated for organ protection (CKD/albuminuria, ASCVD, or HF) with eGFR ${egfr} ≥ 20 mL/min regardless of baseline HbA1c.`,
      rationaleAr: `مُوصى به لحماية الكلى والقلب (زلال، اعتلال كلوي، تصلب شرايين أو قصور قلب) عند eGFR ≥ 20.`
    });
  }

  // 3. GLP-1 RA / Dual GIP-GLP-1
  const onSema = hasMed('semaglutide', 'sema', 'ozempic');
  const onTirz = hasMed('tirzepatide', 'tirz', 'mounjaro');
  if (onSema || onTirz) {
    items.push({
      id: 'dm-plan-glp1-active',
      action: 'active',
      drugId: onTirz ? 'tirzepatide' : 'semaglutide',
      titleEn: `Continue ${onTirz ? 'Tirzepatide' : 'Semaglutide'}`,
      titleAr: `الاستمرار على ${onTirz ? 'تيرزيباتايد' : 'سيماغلوتايد'}`,
      rationaleEn: 'Provides high glycemic efficacy, weight reduction, and proven ASCVD/renal protection.',
      rationaleAr: 'يوفر فعالية عالية في ضبط السكر وإنقاص الوزن وحماية القلب والكلى.'
    });
  } else if (hasAscvd || a1c > targetA1c || wt >= 90) {
    items.push({
      id: 'dm-plan-glp1-start',
      action: 'start',
      drugId: 'semaglutide',
      titleEn: 'Consider GLP-1 RA (Semaglutide Weekly)',
      titleAr: 'يُنصح بإضافة ناهض GLP-1 (سيماغلوتايد أسبوعياً)',
      rationaleEn: hasAscvd
        ? 'Established ASCVD: GLP-1 RA reduces MACE independently of HbA1c.'
        : `HbA1c (${a1c}%) above target (< ${targetA1c}%) and/or elevated weight (${wt} kg); high potency without hypoglycemia.`,
      rationaleAr: hasAscvd
        ? 'تصلب شرايين مثبت: يخفض الجلطات القلبية بفاعلية.'
        : `السكر التراكمي (${a1c}%) أعلى من الهدف أو مع زيادة الوزن؛ خفض قوي للسكر دون هبوط.`
    });
  }

  // 4. Sulfonylurea (Frail / Elderly / CKD hypoglycemia guardrail)
  const onGlimepiride = hasMed('glimepiride', 'amaryl');
  const onGliclazide = hasMed('gliclazide', 'diamicron');
  const activeSus: Array<{ id: 'glimepiride' | 'gliclazide'; en: string; ar: string }> = [];
  if (onGlimepiride) activeSus.push({ id: 'glimepiride', en: 'Glimepiride', ar: 'غليميبرايد' });
  if (onGliclazide) activeSus.push({ id: 'gliclazide', en: 'Gliclazide', ar: 'غليكلازايد' });

  for (const su of activeSus) {
    const isGlimep = su.id === 'glimepiride';
    if ((isGlimep && egfr < 30) || isFrail) {
      items.push({
        id: `dm-plan-su-stop-${su.id}`,
        action: isGlimep && (egfr < 30 || isFrail) ? 'stop' : 'cap',
        drugId: su.id,
        titleEn: `${isGlimep ? 'Stop / De-intensify' : 'Use Caution / De-intensify'} ${su.en}`,
        titleAr: `${isGlimep ? 'إيقاف أو تخفيض' : 'تخفيف جرعة'} ${su.ar}`,
        rationaleEn: isFrail || age >= 65
          ? `Frail/older adult: Sulfonylureas carry high risk of severe hypoglycemia and falls; de-intensify or switch to low-risk agent.`
          : `Severe CKD / invalid eGFR (${egfr} < 30): Active Glimepiride metabolites accumulate causing prolonged hypoglycemia.`,
        rationaleAr: isFrail || age >= 65
          ? `كبار السن/الهشاشة: السلفونيل يوريا ترفع خطر هبوط السكر الحاد والسقوط؛ يُوصى بتخفيضها أو استبدالها.`
          : `قصور كلوي شديد (eGFR ${egfr}): تتراكم نواتج غليميبرايد مسببة هبوط سكر مطول.`
      });
    } else if (egfr < 45 || age >= 65) {
      items.push({
        id: `dm-plan-su-cap-${su.id}`,
        action: 'cap',
        drugId: su.id,
        titleEn: `Caution / Low-Dose Cap for ${su.en}`,
        titleAr: `الحذر وتخفيض جرعة ${su.ar}`,
        rationaleEn: 'Monitor closely for hypoglycemia in older adults or Stage G3b CKD; prefer SGLT2i/DPP-4i/GLP-1 RA.',
        rationaleAr: 'راقب هبوط السكر في كبار السن أو القصور الكلوي؛ يفضل تقليل الجرعة.'
      });
    } else {
      items.push({
        id: `dm-plan-su-active-${su.id}`,
        action: 'active',
        drugId: su.id,
        titleEn: `Monitor ${su.en} for Hypoglycemia`,
        titleAr: `متابعة ${su.ar} والوقاية من هبوط السكر`,
        rationaleEn: 'Educate on Rule of 15 and sick-day rules (SADMANS).',
        rationaleAr: 'تثقيف المريض بقاعدة 15 وقواعد أيام المرض (SADMANS).'
      });
    }
  }

  // 5. DPP-4i (Sitagliptin) renal dose cap
  if (hasMed('sitagliptin', 'sita', 'januvia')) {
    if (egfr < 45) {
      items.push({
        id: 'dm-plan-sita-cap',
        action: 'cap',
        drugId: 'sitagliptin',
        titleEn: `Renal Adjust Sitagliptin (${egfr < 30 ? '25 mg' : '50 mg'} daily)`,
        titleAr: `تعديل جرعة سيتاغليبتين كلوياً (${egfr < 30 ? '25 مجم' : '50 مجم'} يومياً)`,
        rationaleEn: egfr < 30
          ? 'eGFR < 30: Reduce Sitagliptin to 25 mg once daily.'
          : 'eGFR 30–44: Reduce Sitagliptin to 50 mg once daily.',
        rationaleAr: egfr < 30
          ? 'تحت eGFR 30: خفّض سيتاغليبتين إلى 25 مجم يومياً.'
          : 'بين eGFR 30–44: خفّض سيتاغليبتين إلى 50 مجم يومياً.'
      });
    } else {
      items.push({
        id: 'dm-plan-sita-active',
        action: 'active',
        drugId: 'sitagliptin',
        titleEn: 'Continue Sitagliptin 100 mg Daily',
        titleAr: 'الاستمرار على سيتاغليبتين 100 مجم يومياً',
        rationaleEn: 'Weight-neutral, low hypoglycemia risk.',
        rationaleAr: 'محايد على الوزن ولا يسبب هبوط سكر.'
      });
    }
  }

  // 6. Basal Insulin
  const onInsulin = hasMed('insulin', 'insulin_glargine', 'nph', 'glarg');
  if (onInsulin) {
    items.push({
      id: 'dm-plan-insulin-active',
      action: 'active',
      drugId: 'insulin_glargine',
      titleEn: 'Continue Basal Insulin & Titrate to Fasting Goal',
      titleAr: 'الاستمرار على الإنسولين القاعدي ومعايرته لهدف الصائم',
      rationaleEn: egfr < 30
        ? 'Reduce insulin dose cautiously in severe CKD due to decreased renal insulin clearance.'
        : 'Titrate by 2 U every 3 days to reach fasting glucose 80–130 mg/dL without nocturnal hypoglycemia.',
      rationaleAr: egfr < 30
        ? 'خفّض جرعة الإنسولين بحذر في الفشل الكلوي الشديد لتفادي هبوط السكر.'
        : 'عاير الجرعة بمقدار وحدتين كل 3 أيام للوصول لصائم 80–130 مجم/ديسيلتر.'
    });
  } else if (a1c >= 9.5) {
    items.push({
      id: 'dm-plan-insulin-start',
      action: 'start',
      drugId: 'insulin_glargine',
      titleEn: 'Consider Basal Insulin Initiation (HbA1c ≥ 9.5%)',
      titleAr: 'النظر في بدء الإنسولين القاعدي (التراكمي ≥ 9.5%)',
      rationaleEn: `Marked hyperglycemia (HbA1c ${a1c}%): Initiate basal insulin (0.1–0.2 U/kg/day) alongside GLP-1 RA/SGLT2i if symptomatic or catabolic.`,
      rationaleAr: `ارتفاع شديد بالسكر (${a1c}%): يُنصح ببدء إنسولين قاعدي (0.1–0.2 وحدة/كجم/يوم) خاصة مع الأعراض.`
    });
  }

  return items;
}
