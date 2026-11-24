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
