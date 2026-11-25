export interface PatientTargets {
  patientName: string;
  age: number | string;
  isFrail?: boolean;
  isElderlyOrFrail?: boolean;
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
    targetBpAr?: string;
    targetHomeBp: string;
    targetHomeBpEn: string;
    targetHomeBpAr: string;
    currentK: string;
  };
  dlp: {
    riskTier: string;
    riskTierAr: string;
    ldlTargetMg: number;
    targetLdl: string;
    targetNonHdl: string;
    targetTg: string;
    currentTc: string;
    currentHdl: string;
  };
}

export interface FollowUpItem {
  id: string;
  priority: 'urgent' | 'soon' | 'routine';
  timeframeEn: string;
  timeframeAr: string;
  titleEn: string;
  titleAr: string;
  reasonEn: string;
  reasonAr: string;
}

export interface SadmansItem {
  id: string;
  letter: 'S' | 'A' | 'D' | 'M' | 'N';
  classKey: 'sglt2i' | 'acei' | 'diuretic' | 'metformin' | 'arb' | 'nsaid' | 'su';
  classEn: string;
  classAr: string;
  examplesEn: string;
  examplesAr: string;
  riskEn: string;
  riskAr: string;
  isActive: boolean;
  matchedMeds: string[];
}

export function getDynamicTargets(pt?: any): PatientTargets {
  const p = pt || {};
  const age = parseFloat(String(p.age)) || 52;
  const isFrail = !!p.frail;
  const isElderlyOrFrail = (age >= 65) || isFrail;
  const egfrRaw = p.egfr;
  const egfr = (egfrRaw === undefined || egfrRaw === null)
    ? 68
    : (typeof egfrRaw === 'string' && egfrRaw.trim() === ''
      ? 0
      : (Number.isFinite(Number(egfrRaw)) ? Number(egfrRaw) : 0));

  const a1cTarget = isElderlyOrFrail ? '< 7.5% - 8.0%' : '< 7.0%';
  const a1cTargetDescAr = isElderlyOrFrail
    ? 'هدف مرن (< 7.5%–8.0%) لتجنب هبوط السكر ومضاعفاته لكبار السن وذوي الهشاشة'
    : 'الهدف المعياري لحماية الشرايين والكلى وشبكية العين';
  const a1cTargetDescEn = isElderlyOrFrail
    ? 'Relaxed target (< 7.5%–8.0%) to prevent hypoglycemia in older or frail adults'
    : 'Standard target to prevent vascular and microvascular complications';
  const fpgTarget = isElderlyOrFrail ? '90 - 150 mg/dL (5.0 - 8.3 mmol/L)' : '80 - 130 mg/dL (4.4 - 7.2 mmol/L)';
  const ppgTarget = '< 180 mg/dL (< 10.0 mmol/L)';

  const bpTarget = isElderlyOrFrail ? '< 140/90 mmHg (130-139 / 80)' : '< 130/80 mmHg';
  const bpTargetAr = isElderlyOrFrail ? '< 140/90 ملم زئبق (130-139 / 80)' : '< 130/80 ملم زئبق';
  const homeBpTarget = isElderlyOrFrail
    ? '< 135/85 mmHg (متوسط القراءات المنزلية)'
    : '< 130/80 mmHg (متوسط القراءات المنزلية)';
  const homeBpTargetEn = isElderlyOrFrail
    ? '< 135/85 mmHg (average home readings)'
    : '< 130/80 mmHg (average home readings)';
  const homeBpTargetAr = isElderlyOrFrail
    ? '< 135/85 ملم زئبق (متوسط القراءات المنزلية)'
    : '< 130/80 ملم زئبق (متوسط القراءات المنزلية)';

  let ldlTargetMg = 70;
  let ldlRiskTier = 'High Risk';
  let ldlRiskTierAr = 'عالي الخطورة (وجود سكري)';
  if (p.ascvd || egfr < 45) {
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
    isFrail,
    isElderlyOrFrail,
    dm: {
      currentA1c: p.a1c ? `${p.a1c}%` : '8.9%',
      targetA1c: a1cTarget,
      targetDescAr: a1cTargetDescAr,
      targetDescEn: a1cTargetDescEn,
      currentFpg: p.fpg ? `${p.fpg} mg/dL` : '190 mg/dL',
      targetFpg: fpgTarget,
      targetPpg: ppgTarget,
      currentEgfr: `${egfr} mL/min`
    },
    htn: {
      currentBp: (p.sbp && p.dbp) ? `${p.sbp}/${p.dbp} mmHg` : '148/94 mmHg',
      targetBp: bpTarget,
      targetBpAr: bpTargetAr,
      targetHomeBp: homeBpTarget,
      targetHomeBpEn: homeBpTargetEn,
      targetHomeBpAr: homeBpTargetAr,
      currentK: p.k ? `${p.k} mmol/L` : '4.6 mmol/L'
    },
    dlp: {
      riskTier: ldlRiskTier,
      riskTierAr: ldlRiskTierAr,
      ldlTargetMg,
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

export function buildFollowUpSchedule(pt?: any): FollowUpItem[] {
  const p = pt || {};
  const items: FollowUpItem[] = [];
  const targets = getDynamicTargets(p);

  const k = parseFloat(String(p.k ?? 4.6)) || 0;
  const sbp = parseFloat(String(p.sbp ?? 120)) || 0;
  const dbp = parseFloat(String(p.dbp ?? 80)) || 0;
  const egfr = parseFloat(String(p.egfr ?? 90)) || 0;
  const uacr = parseFloat(String(p.uacr ?? 0)) || 0;
  const a1c = parseFloat(String(p.a1c ?? 6.5)) || 0;
  const tsh = parseFloat(String(p.tsh ?? 2.5));
  const isMmol = p.lipidUnit === 'mmol' || p.lipidUnit === 'mmol/L';
  const rawTg = parseFloat(String(p.triglycerides ?? p.tg ?? 0)) || 0;
  const tgMg = isMmol ? rawTg * 88.57 : rawTg;
  const rawLdl = parseFloat(String(p.ldlC ?? p.ldl ?? 0)) || 0;
  const ldlMg = isMmol ? rawLdl * 38.67 : rawLdl;
  const isPregnant = !!(p.pregnancy || p.preg || p.pregHtn);
  const isDm = !!(p.diabetes || p.dm);

  const medsRaw = Array.isArray(p.activeMeds)
    ? p.activeMeds
    : Array.isArray(p.meds)
      ? p.meds
      : Array.isArray(p.medications)
        ? p.medications
        : [];
  const meds: string[] = medsRaw.map((m: unknown) => String(m).toLowerCase());
  const onRaasOrMra = meds.some((m: string) =>
    ['perindopril', 'ramipril', 'lisinopril', 'enalapril', 'valsartan', 'losartan', 'telmisartan', 'sacubitril', 'spironolactone'].some(t => m.includes(t))
  );

  // Urgent items
  if (k >= 5.5) {
    items.push({
      id: 'fu-urgent-k',
      priority: 'urgent',
      timeframeEn: '24–72 hours (STAT)',
      timeframeAr: 'خلال 24–72 ساعة (عاجل)',
      titleEn: 'STAT ECG & Repeat Serum Potassium / BMP',
      titleAr: 'تخطيط قلب عاجل وإعادة فحص البوتاسيوم ووظائف الكلى',
      reasonEn: `Severe hyperkalemia (K+ = ${k} mEq/L ≥ 5.5) carries immediate arrhythmia risk.`,
      reasonAr: `ارتفاع حاد بالبوتاسيوم (${k} ≥ 5.5) يحمل خطر اضطراب نظم القلب.`
    });
  }

  if (isPregnant) {
    items.push({
      id: 'fu-urgent-obstetric',
      priority: 'urgent',
      timeframeEn: 'Every 1–2 weeks',
      timeframeAr: 'كل 1–2 أسبوع',
      titleEn: 'Obstetric & Cardio-Endocrine Review',
      titleAr: 'متابعة نسائية وغدد صماء وضغط الحمل',
      reasonEn: 'Review daily home BP & glucose logs (recheck TSH every 4 weeks if hypothyroid).',
      reasonAr: 'مراجعة سجل الضغط والسكر المنزلي (وفحص TSH كل 4 أسابيع عند قصور الغدة).'
    });
  }

  if (sbp >= 160 || dbp >= 100) {
    items.push({
      id: 'fu-urgent-bp',
      priority: 'urgent',
      timeframeEn: '1–2 weeks',
      timeframeAr: 'خلال 1–2 أسبوع',
      titleEn: 'Urgent Blood Pressure & Organ Symptom Reassessment',
      titleAr: 'إعادة تقييم عاجلة لضغط الدم وأعراض الأعضاء الحيوية',
      reasonEn: `Marked BP elevation (${sbp}/${dbp} mmHg) requires 7-day HBPM review and rapid titration.`,
      reasonAr: `ارتفاع شديد بضغط الدم (${sbp}/${dbp}) يستدعي مراجعة القياس المنزلي وتعديل العلاج سريعاً.`
    });
  }

  // Soon items
  if ((k > 5.0 && k < 5.5) || onRaasOrMra) {
    items.push({
      id: 'fu-soon-bmp',
      priority: 'soon',
      timeframeEn: '1–2 weeks',
      timeframeAr: 'خلال 1–2 أسبوع',
      titleEn: 'Basic Metabolic Panel (eGFR, Creatinine, K+)',
      titleAr: 'فحص وظائف الكلى والأملاح (eGFR، الكرياتينين، البوتاسيوم)',
      reasonEn: k > 5.0
        ? `Borderline hyperkalemia (K+ = ${k} mEq/L > 5.0); verify trend.`
        : 'Monitor renal hemodynamics and K+ on active RAAS/MRA therapy.',
      reasonAr: k > 5.0
        ? `ارتفاع طفيف في البوتاسيوم (${k} > 5.0) يتطلب المتابعة.`
        : 'مراقبة وظائف الكلى والبوتاسيوم مع أدوية RAAS أو MRA.'
    });
  }

  if ((sbp >= 140 || dbp >= 90) && sbp < 160 && dbp < 100) {
    items.push({
      id: 'fu-soon-htn',
      priority: 'soon',
      timeframeEn: '2–4 weeks',
      timeframeAr: 'خلال 2–4 أسابيع',
      titleEn: 'Clinic BP + 7-Day Home BP Log Review',
      titleAr: 'مراجعة ضغط الدم وسجل القياس المنزلي لـ 7 أيام',
      reasonEn: `Current BP (${sbp}/${dbp} mmHg) is above target (${targets.htn.targetBp}).`,
      reasonAr: `الضغط الحالي (${sbp}/${dbp}) أعلى من الهدف (${targets.htn.targetBp}).`
    });
  }

  if (tgMg >= 500) {
    items.push({
      id: 'fu-soon-tg',
      priority: 'soon',
      timeframeEn: '2–4 weeks',
      timeframeAr: 'خلال 2–4 أسابيع',
      titleEn: 'Repeat Fasting Triglycerides',
      titleAr: 'إعادة فحص الدهون الثلاثية صائماً',
      reasonEn: `Severe hypertriglyceridemia (${Math.round(tgMg)} mg/dL ≥ 500) — monitor response to avoid acute pancreatitis.`,
      reasonAr: `ارتفاع شديد بالدهون الثلاثية (${Math.round(tgMg)} ≥ 500) — متابعة لمنع التهاب البنكرياس.`
    });
  }

  if (!isNaN(tsh) && (tsh > 4.5 || tsh < 0.4)) {
    items.push({
      id: 'fu-soon-thyroid',
      priority: 'soon',
      timeframeEn: isPregnant ? '4 weeks' : '6–8 weeks',
      timeframeAr: isPregnant ? '4 أسابيع' : '6–8 أسابيع',
      titleEn: 'Repeat TSH & Free T4',
      titleAr: 'إعادة فحص وظائف الغدة الدرقية (TSH & FT4)',
      reasonEn: `Abnormal TSH (${tsh} mIU/L) — titrate thyroid therapy after equilibration.`,
      reasonAr: `اضطراب TSH (${tsh}) — معايرة الجرعة بعد استقرار الهرمون.`
    });
  }

  if (ldlMg > targets.dlp.ldlTargetMg) {
    items.push({
      id: 'fu-soon-lipids',
      priority: 'soon',
      timeframeEn: '4–12 weeks',
      timeframeAr: 'خلال 4–12 أسبوعاً',
      titleEn: 'Repeat Fasting Lipid Profile',
      titleAr: 'إعادة تحليل ملف الدهون',
      reasonEn: `LDL-C (${Math.round(ldlMg)} mg/dL) exceeds target (< ${targets.dlp.ldlTargetMg} mg/dL).`,
      reasonAr: `الكوليسترول الضار (${Math.round(ldlMg)}) أعلى من الهدف (< ${targets.dlp.ldlTargetMg}).`
    });
  }

  if (egfr < 60 || uacr >= 30) {
    const ckdTimeEn = egfr < 30 ? '3 months' : (egfr < 45 || uacr > 300 ? '3–4 months' : '6 months');
    const ckdTimeAr = egfr < 30 ? '3 أشهر' : (egfr < 45 || uacr > 300 ? '3–4 أشهر' : '6 أشهر');
    items.push({
      id: 'fu-ckd-kdigo',
      priority: egfr < 30 ? 'soon' : 'routine',
      timeframeEn: ckdTimeEn,
      timeframeAr: ckdTimeAr,
      titleEn: 'KDIGO Renal Monitoring (eGFR + UACR)',
      titleAr: 'متابعة وظائف الكلى وزلال البول (eGFR + UACR)',
      reasonEn: `CKD surveillance cadence for eGFR ${egfr} / UACR ${uacr} mg/g.`,
      reasonAr: `متابعة دورية للاعتلال الكلوي (eGFR ${egfr} / زلال ${uacr}).`
    });
  }

  if (isDm) {
    const a1cGoalNum = targets.isElderlyOrFrail ? 7.5 : 7.0;
    const aboveA1c = a1c > a1cGoalNum;
    items.push({
      id: 'fu-dm-a1c',
      priority: aboveA1c ? 'soon' : 'routine',
      timeframeEn: aboveA1c ? '3 months' : '6 months',
      timeframeAr: aboveA1c ? '3 أشهر' : '6 أشهر',
      titleEn: 'HbA1c Reassessment',
      titleAr: 'إعادة فحص السكر التراكمي (HbA1c)',
      reasonEn: aboveA1c
        ? `HbA1c (${a1c}%) is above individualized goal (${targets.dm.targetA1c}).`
        : `HbA1c (${a1c}%) is at goal — maintain 6-month surveillance.`,
      reasonAr: aboveA1c
        ? `التراكمي (${a1c}%) أعلى من الهدف المخصص (${targets.dm.targetA1c}).`
        : `التراكمي (${a1c}%) ضمن الهدف — متابعة كل 6 أشهر.`
    });

    items.push({
      id: 'fu-dm-microvascular',
      priority: 'routine',
      timeframeEn: '12 months (Annual)',
      timeframeAr: 'كل 12 شهراً (سنوياً)',
      titleEn: 'Comprehensive Dilated Eye & Diabetic Foot Exam',
      titleAr: 'فحص قاع العين السنوي وفحص القدم السكري الشامل',
      reasonEn: 'Annual screening for diabetic retinopathy, neuropathy, and PAD.',
      reasonAr: 'فحص سنوي للوقاية من اعتلال الشبكية واعتلال الأعصاب وقرح القدم.'
    });
  }

  const order: Record<FollowUpItem['priority'], number> = { urgent: 0, soon: 1, routine: 2 };
  return items.sort((a, b) => order[a.priority] - order[b.priority]);
}

export function getTailoredSadmans(pt?: any): SadmansItem[] {
  const p = pt || {};
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

  const findMatches = (tokens: string[], flag?: boolean): string[] => {
    const matched = meds.filter((m: string) =>
      tokens.some(t => (t.length <= 3 ? m === t || m.startsWith(`${t}_`) || m.startsWith(`${t}-`) : m.includes(t)))
    );
    if (flag && matched.length === 0) matched.push('class-flag');
    return matched;
  };

  const defs: Array<Omit<SadmansItem, 'isActive' | 'matchedMeds'> & { tokens: string[]; flag?: boolean }> = [
    {
      id: 'sadmans-s-sglt2i',
      letter: 'S',
      classKey: 'sglt2i',
      classEn: 'SGLT2 Inhibitors',
      classAr: 'مثبطات SGLT2',
      examplesEn: 'Empagliflozin (Jardiance), Dapagliflozin (Forxiga)',
      examplesAr: 'إمباغليفلوزين (جاردينس)، داباغليفلوزين (فورسيجا)',
      riskEn: 'Volume depletion & euglycemic diabetic ketoacidosis (euDKA) during vomiting/dehydration/fasting.',
      riskAr: 'نقص السوائل وخطر الحماض الكيتوني السويّ السكر أثناء القيء أو الجفاف أو الصيام.',
      tokens: ['empagliflozin', 'dapagliflozin', 'canagliflozin', 'empa', 'dapa', 'jardiance', 'forxiga']
    },
    {
      id: 'sadmans-a-acei',
      letter: 'A',
      classKey: 'acei',
      classEn: 'ACE Inhibitors',
      classAr: 'مثبطات ACEi',
      examplesEn: 'Ramipril (Tritace), Perindopril (Coversyl), Lisinopril, Enalapril',
      examplesAr: 'راميبريل (تريتاس)، بيريندوبريل (كوفرسيل)، ليسينوبريل، إنالابريل',
      riskEn: 'Efferent arteriolar dilation decreases GFR during hypovolemia, risking acute kidney injury (AKI).',
      riskAr: 'توسع الشريان الصادر يخفض معدل الترشيح أثناء الجفاف مما يسبب إصابة كلوية حادة (AKI).',
      tokens: ['perindopril', 'ramipril', 'lisinopril', 'enalapril', 'captopril', 'coveram', 'tritace', 'coversyl', 'acei'],
      flag: !!p.acei
    },
    {
      id: 'sadmans-d-diuretic',
      letter: 'D',
      classKey: 'diuretic',
      classEn: 'Diuretics',
      classAr: 'مدرات البول',
      examplesEn: 'Indapamide (Natrilix), HCTZ, Furosemide, Spironolactone',
      examplesAr: 'إنداباميد (ناتريليكس)، هيدروكلوروثيازيد، فوروسيميد، سبيرونولاكتون',
      riskEn: 'Worsens dehydration, hypotension, prerenal AKI, and electrolyte disturbances.',
      riskAr: 'تفاقم الجفاف وهبوط الضغط والقصور الكلوي الحاد واضطراب الأملاح.',
      tokens: ['indapamide', 'furosemide', 'hydrochlorothiazide', 'hctz', 'spironolactone', 'chlorthalidone', 'preterax']
    },
    {
      id: 'sadmans-m-metformin',
      letter: 'M',
      classKey: 'metformin',
      classEn: 'Metformin',
      classAr: 'الميتفورمين',
      examplesEn: 'Metformin (Glucophage / Cidophage)',
      examplesAr: 'ميتفورمين (جلوكوفاج / سيدوفاج)',
      riskEn: 'Accumulates during dehydration/AKI and increases risk of severe lactic acidosis.',
      riskAr: 'يتراكم عند الجفاف أو تدهور الكلى ويرفع خطر الحماض اللبني المميت.',
      tokens: ['metformin', 'met', 'glucophage', 'cidophage', 'janumet', 'synjardy', 'xigduo']
    },
    {
      id: 'sadmans-a-arb',
      letter: 'A',
      classKey: 'arb',
      classEn: 'ARBs / ARNI',
      classAr: 'حاصرات ARB / ARNI',
      examplesEn: 'Valsartan, Losartan, Telmisartan, Sacubitril/Valsartan (Entresto)',
      examplesAr: 'فالسارتان، لوسارتان، تيلميسارتان، ساكوبيتريل/فالسارتان (إنتريستو)',
      riskEn: 'Reduces intraglomerular pressure during dehydration, risking AKI and hyperkalemia.',
      riskAr: 'يخفض الضغط الكبيبي أثناء الجفاف مما قد يسبب قصوراً كلوياً حاداً وارتفاع البوتاسيوم.',
      tokens: ['valsartan', 'losartan', 'telmisartan', 'candesartan', 'sacubitril_valsartan', 'sacubitril', 'exforge', 'twynsta', 'arb'],
      flag: !!p.arb
    },
    {
      id: 'sadmans-n-nsaid',
      letter: 'N',
      classKey: 'nsaid',
      classEn: 'NSAIDs',
      classAr: 'المسكنات المضادة للالتهاب',
      examplesEn: 'Ibuprofen, Diclofenac, Naproxen, Celecoxib',
      examplesAr: 'إيبوبروفين (بروفين)، ديكلوفيناك (فولتارين)، نابروكسين، سيليكوكسيب',
      riskEn: 'Afferent arteriolar constriction precipitates AKI ("triple whammy" with RAAS + diuretic).',
      riskAr: 'انقباض الشريان الوارد يسبب فشلاً كلوياً حاداً خاصة مع أدوية الضغط ومدرات البول.',
      tokens: ['ibuprofen', 'diclofenac', 'naproxen', 'celecoxib', 'ketoprofen', 'meloxicam', 'nsaid']
    },
    {
      id: 'sadmans-s-su',
      letter: 'S',
      classKey: 'su',
      classEn: 'Sulfonylureas',
      classAr: 'السلفونيل يوريا',
      examplesEn: 'Gliclazide (Diamicron), Glimepiride (Amaryl)',
      examplesAr: 'غليكلازايد (دياميكرون)، غليميبرايد (أماريل)',
      riskEn: 'High risk of severe prolonged hypoglycemia when oral food/fluid intake is reduced.',
      riskAr: 'خطر شديد لهبوط السكر الحاد والمطوّل عند قلة الأكل أو القيء.',
      tokens: ['gliclazide', 'glimepiride', 'glibenclamide', 'glyburide', 'amaryl', 'diamicron']
    }
  ];

  return defs.map(({ tokens, flag, ...rest }) => {
    const matchedMeds = findMatches(tokens, flag);
    return {
      ...rest,
      isActive: matchedMeds.length > 0,
      matchedMeds
    };
  });
}
