export function evaluatePregnancyHtnProtocol(patientInput: any): any {
  const pt = patientInput || {};
  const sbp = parseFloat(String(pt.sbp !== undefined ? pt.sbp : (pt.s !== undefined ? pt.s : 148))) || 0;
  const dbp = parseFloat(String(pt.dbp !== undefined ? pt.dbp : (pt.d !== undefined ? pt.d : 94))) || 0;
  const isPregnant = !!(pt.pregnancy || pt.preg || pt.isPregnant || pt.pregHtn || (pt.comorbidities && pt.comorbidities.pregnancy));
  const isPostpartum = !!(pt.postpartum || (pt.comorbidities && pt.comorbidities.postpartum));
  const weeks = parseFloat(String(pt.gestationalWeeks !== undefined ? pt.gestationalWeeks : (pt.weeks !== undefined ? pt.weeks : 16))) || 16;
  const hasAsthma = !!(pt.asthma || (pt.comorbidities && pt.comorbidities.asthma));
  const medsRaw = pt.medications || pt.activeMeds || pt.meds || pt.currentMeds || [];
  const meds: string[] = Array.isArray(medsRaw) ? medsRaw.map(m => String(m).toLowerCase()) : [];

  const alerts: any[] = [];
  const stoppedDrugs: string[] = [
    'ACE inhibitors (e.g. Perindopril, Ramipril)',
    'ARBs (e.g. Valsartan, Losartan)',
    'MRAs (e.g. Spironolactone)',
    'Thiazides / Thiazide-like diuretics (e.g. Indapamide, HCTZ)'
  ];

  const detectedTeratogens = meds.filter(m =>
    m.includes('valsartan') || m.includes('ramipril') || m.includes('indapamide') || m.includes('ace') || m.includes('arb')
  );
  if (detectedTeratogens.length > 0 || isPregnant) {
    alerts.push({
    id: 'htn-preg-teratogenic-stop',
    code: 'STOP_TERATOGENIC_HTN_MEDS',
    level: 'critical',
    type: 'critical',
    titleEn: 'Teratogenic Alert: Stop ACEi, ARB, MRA & Thiazides Immediately',
    titleAr: 'تنبيه تشوه الأجنة الحرج: إيقاف أدوية ACEi و ARB والسبيرونولاكتون ومدرات البول فوراً',
    messageEn: 'ACE inhibitors, ARBs, MRAs (Spironolactone), and Thiazide diuretics are contraindicated in pregnancy due to severe fetotoxicity (renal dysgenesis, oligohydramnios, skull hypoplasia, and neonatal death). Immediately discontinue and switch to pregnancy-safe antihypertensives (Labetalol, Nifedipine ER, or Methyldopa).',
    messageAr: 'مثبطات ACE، حاصرات ARB، مضادات MRA (سبيرونولاكتون)، ومدرات البول الثيازيدية محظورة تماماً في الحمل لتسببها بتشوهات جنينية قاتلة في الكلى وعظام الجمجمة. أوقفها فوراً واستبدلها بأدوية ضغط آمنة للحمل.',
    actionEn: 'Discontinue ACEi/ARB/MRA/Thiazides immediately; initiate Labetalol or Nifedipine ER.',
    actionAr: 'أوقف هذه الأدوية فوراً وابدأ لابيتاول أو نيفيديبين ممتد المفعول.'
  });
  }

  // 2. Severe obstetric HTN emergency alert (>= 160/110)
  const isSevereEmergency = (sbp >= 160 || dbp >= 110);
  if (isSevereEmergency) {
    alerts.push({
      id: 'htn-preg-severe-emergency',
      code: 'OBSTETRIC_HYPERTENSIVE_EMERGENCY',
      level: 'critical',
      type: 'critical',
      titleEn: 'OBSTETRIC EMERGENCY: Severe Hypertension (BP ≥ 160/110 mmHg)',
      titleAr: 'طوارئ نسائية وتوليد حرجة: ارتفاع ضغط شديد حاد (≥ 160/110)',
      messageEn: `Blood pressure is ${sbp}/${dbp} mmHg (≥ 160/110 mmHg). Immediate acute blood pressure lowering is required within 30–60 minutes to prevent maternal intracranial hemorrhage, stroke, encephalopathy, and placental abruption. First-line IV therapy: IV Labetalol (20 mg IV push, repeat 40–80 mg q10min up to 300 mg) OR IV Hydralazine (5–10 mg IV push) OR oral rapid Nifedipine ER/capsule 10–20 mg PO. Start Magnesium Sulfate for seizure prophylaxis if preeclampsia with severe features. Transfer urgently to labor & delivery / obstetric HDU.`,
      messageAr: `ضغط الدم ${sbp}/${dbp} ملم زئبق (≥ 160/110). يتطلب تدخلاً علاجياً عاجلاً خلال 30 إلى 60 دقيقة لحماية الأم من النزيف الدماغي والسكتة الدماغية وانفصال المشيمة. العلاج الإسعافي: لابيتاول وريدي (IV Labetalol) أو هيدرالازين وريدي أو نيفيديبين 10-20 مجم فموياً، مع كبريتات المغنيسيوم (Magnesium Sulfate) لحماية الأم من التشنجات (Eclampsia). تحويل عاجل لقسم الولادة.`,
      actionEn: 'Administer IV Labetalol or IV Hydralazine / oral Nifedipine; evaluate for preeclampsia with severe features.',
      actionAr: 'إعطاء لابيتاول وريدي أو هيدرالازين وريدي، وتقييم تسمم الحمل الشديد وإعطاء كبريتات المغنيسيوم.'
    });
  }

  // 3. Postpartum Methyldopa depression warning
  let methyldopaDepressionWarning: any = null;
  if (isPostpartum) {
    methyldopaDepressionWarning = {
      id: 'htn-postpartum-methyldopa-depression',
      level: 'warning',
      type: 'warning',
      titleEn: 'Postpartum Warning: Avoid Methyldopa (Depression & Sedation Risk)',
      titleAr: 'تحذير فترة النفاس: تجنب ميثيل دوبا (خطر اكتئاب ما بعد الولادة)',
      messageEn: 'Methyldopa is strongly associated with an increased risk of severe postpartum depression (PPD), sedation, and psychomotor impairment. Avoid Methyldopa during the postpartum period, especially in women with personal or family history of mood disorders. Preferred postpartum antihypertensives compatible with breastfeeding: Labetalol, Enalapril, or Nifedipine ER.',
      messageAr: 'يرتبط عقار ميثيل دوبا (Methyldopa) بزيادة خطر الإصابة باكتئاب ما بعد الولادة (Postpartum Depression) والخمول الشديد. تجنب ميثيل دوبا بعد الولادة تماماً، ويفضل استخدام لابيتاول أو إنالابريل أو نيفيديبين ممتد المفعول، وهي آمنة تماماً مع الرضاعة الطبيعية.',
      actionEn: 'Avoid/taper Methyldopa postpartum; use Labetalol, Enalapril, or Nifedipine ER (breastfeeding safe).',
      actionAr: 'تجنب ميثيل دوبا بعد الولادة واستخدم لابيتاول أو إنالابريل أو نيفيديبين ممتد المفعول.'
    };
    alerts.push(methyldopaDepressionWarning);
  }

  // 4. Preeclampsia Aspirin prophylaxis (weeks 12-36)
  const aspirinIndicated = !isPostpartum && (weeks >= 12 && weeks <= 36);
  const aspirinProphylaxis = {
    indicated: aspirinIndicated,
    dose: '81–162 mg once daily at bedtime (recommended: 81–150 mg/day)',
    timing: 'Start between weeks 12 and 16, continue until 36 weeks (or delivery)',
    titleEn: 'Preeclampsia Prevention: Low-Dose Aspirin Prophylaxis (Weeks 12–36)',
    titleAr: 'الوقاية من تسمم الحمل: أسبرين أطفال وقائي (الأسابيع 12–36)',
    messageEn: `Gestational age is ${weeks} weeks (within the critical 12–36 weeks window). Low-dose Aspirin (81–150 mg/day, taken at bedtime) is strongly recommended for women with chronic hypertension, gestational hypertension, prior preeclampsia, diabetes, or multiple gestation to significantly reduce the risk of preeclampsia, preterm birth, and fetal growth restriction.`,
    messageAr: `عمر الحمل ${weeks} أسبوعاً (ضمن الفترة المستهدفة 12–36 أسبوعاً). يُوصى بشدة ببدء أسبرين الأطفال (81-150 مجم يومياً قبل النوم) للوقاية من تسمم الحمل (Preeclampsia) وتأخر نمو الجنين والولادة المبكرة.`
  };
  if (aspirinIndicated) {
    alerts.push({
      id: 'htn-preg-aspirin-prophylaxis',
      level: 'info',
      type: 'info',
      titleEn: aspirinProphylaxis.titleEn,
      titleAr: aspirinProphylaxis.titleAr,
      messageEn: aspirinProphylaxis.messageEn,
      messageAr: aspirinProphylaxis.messageAr,
      actionEn: 'Prescribe Aspirin 81–150 mg PO daily at bedtime until 36 weeks gestation.',
      actionAr: 'وصف أسبرين أطفال 81-150 مجم يومياً قبل النوم حتى الأسبوع 36 من الحمل.'
    });
  }

  // 5. Asthma-aware first-line selection
  let firstLineDrug: any = {};
  if (hasAsthma) {
    firstLineDrug = {
      drugId: 'nifedipine_er',
      drugName: 'Nifedipine Extended-Release (ER)',
      drugNameAr: 'نيفيديبين ممتد المفعول (Nifedipine ER)',
      tradeNames: ['Adalat LA', 'Procardia XL', 'Epilat Retard'],
      doseEn: '30 mg orally once daily (titrate up to 60–90 mg once daily as needed; max 120 mg/day)',
      doseAr: '30 مجم فموياً مرة واحدة يومياً صباحاً (يمكن زيادتها إلى 60-90 مجم عند الحاجة، الجرعة القصوى 120 مجم)',
      reasonEn: 'Maternal asthma present: Beta-blockers (including Labetalol) carry significant bronchospasm risk and are contraindicated/avoided. Nifedipine ER (dihydropyridine CCB) is the preferred asthma-safe first-line antihypertensive in pregnancy.',
      reasonAr: 'المريضة تعاني من الربو الشعبي: تُمنع حاصرات بيتا (بما فيها لابيتاول) لخطر التشنج الشعبي الحاد. نيفيديبين ممتد المفعول (Nifedipine ER) هو الخيار الأول الآمن لمرضى الربو والحمل.',
      asthmaAware: true
    };
  } else {
    firstLineDrug = {
      drugId: 'labetalol',
      drugName: 'Labetalol',
      drugNameAr: 'لابيتاول (Labetalol)',
      tradeNames: ['Trandate', 'Labetalol'],
      doseEn: '100–200 mg orally twice daily (titrate weekly up to 400–800 mg twice daily; max 2400 mg/day)',
      doseAr: '100–200 مجم فموياً مرتين يومياً (تتم المعايرة تدريجياً حتى 400-800 مجم مرتين يومياً؛ الحد الأقصى 2400 مجم/يوم)',
      reasonEn: 'First-line standard oral antihypertensive for chronic/gestational hypertension in pregnancy. Safe in non-asthmatic mothers.',
      reasonAr: 'الخيار العلاجي الأول القياسي لارتفاع ضغط الدم أثناء الحمل للأمهات غير المصابات بالربو الشعبي.',
      asthmaAware: false
    };
  }

  const alternativeDrugs = [
    {
      drugName: 'Methyldopa (Aldomet)',
      drugNameAr: 'ميثيل دوبا (ألدوميت)',
      doseEn: '250 mg orally twice or thrice daily (max 2000–3000 mg/day)',
      doseAr: '250 مجم فموياً مرتين إلى ثلاث مرات يومياً (الحد الأقصى 2000-3000 مجم/يوم)',
      notesEn: 'Established fetal safety record; note sedation side-effect and avoid postpartum due to depression risk.',
      notesAr: 'آمن تاريخياً على الجنين، يسبب الخمول، ويُمنع في فترة النفاس لتجنب اكتئاب ما بعد الولادة.'
    },
    {
      drugName: hasAsthma ? 'Hydralazine' : 'Nifedipine ER',
      drugNameAr: hasAsthma ? 'هيدرالازين' : 'نيفيديبين ممتد المفعول',
      doseEn: hasAsthma ? '10–25 mg orally 3–4 times daily' : '30–60 mg orally once daily',
      doseAr: hasAsthma ? '10–25 مجم 3-4 مرات يومياً' : '30–60 مجم مرة واحدة يومياً'
    }
  ];

  const steps: any[] = [];

  if (isPregnant && (weeks >= 12 && weeks <= 36)) {
    steps.push({
      code: 'PREECLAMPSIA_ASPIRIN_PROPHYLAXIS',
      step: 0,
      titleEn: 'Preeclampsia Prevention: Low-Dose Aspirin Prophylaxis (Weeks 12–36)',
      titleAr: 'الوقاية من تسمم الحمل: أسبرين أطفال وقائي (الأسابيع 12–36)',
      drugEn: 'Aspirin 81–150 mg daily at bedtime',
      drugAr: 'أسبرين أطفال 81-150 مجم يومياً قبل النوم',
      timing: 'Weeks 12 to 36',
      descriptionEn: 'Start between weeks 12 and 16, continue until 36 weeks gestation or delivery.'
    });
  }

  if (hasAsthma) {
    steps.push({
      code: 'PREGNANCY_HTN_STEP_1_NIFEDIPINE',
      step: 1,
      drugId: 'nifedipine_er',
      drugEn: 'Nifedipine ER 30 mg PO once daily',
      drugAr: 'نيفيديبين ممتد المفعول 30 مجم فموياً مرة واحدة يومياً',
      titleEn: 'Step 1 (Asthma-Aware): Nifedipine ER',
      titleAr: 'الخطوة الأولى (مع مراعاة الربو): نيفيديبين ممتد المفعول',
      reasonEn: 'Maternal asthma present: Beta-blockers (Labetalol) carry significant bronchospasm risk and are contraindicated/avoided. Nifedipine ER (dihydropyridine CCB) is the preferred asthma-safe first-line antihypertensive in pregnancy.',
      reasonAr: 'المريضة تعاني من الربو: لابيتاول ممنوع لتجنب نوبات الربو والتشنج الشعبي. نيفيديبين ممتد المفعول هو الخيار الأول الآمن.'
    });
  } else {
    steps.push({
      code: 'PREGNANCY_HTN_STEP_1_LABETALOL',
      step: 1,
      drugId: 'labetalol',
      drugEn: 'Labetalol 100–200 mg PO twice daily',
      drugAr: 'لابيتاول 100-200 مجم فموياً مرتين يومياً',
      titleEn: 'Step 1: Labetalol',
      titleAr: 'الخطوة الأولى: لابيتاول',
      reasonEn: 'First-line standard oral antihypertensive for chronic/gestational hypertension in pregnancy.',
      reasonAr: 'الخيار العلاجي الأول القياسي لارتفاع ضغط الدم أثناء الحمل.'
    });
  }

  return {
    isPregnant,
    isPostpartum,
    gestationalWeeks: weeks,
    hasAsthma,
    isSevereEmergency,
    firstLine: firstLineDrug,
    firstLineSelection: firstLineDrug,
    firstLineDrug,
    alternatives: alternativeDrugs,
    aspirinProphylaxis,
    methyldopaDepressionWarning,
    stoppedDrugs,
    alerts,
    steps
  };
}

export function classifyBp(sbp: number, dbp: number, lens: 'acc' | 'esc' = 'acc'): { label: string; stage: number; isSevere: boolean } {
  if (sbp >= 180 || dbp >= 120) {
    return { label: 'Severe hypertension', stage: 3, isSevere: true };
  }
  if (lens === 'acc') {
    if (sbp >= 140 || dbp >= 90) return { label: 'Stage 2 hypertension', stage: 2, isSevere: false };
    if (sbp >= 130 || dbp >= 80) return { label: 'Stage 1 hypertension', stage: 1, isSevere: false };
    if (sbp >= 120) return { label: 'Elevated BP', stage: 0.5, isSevere: false };
    return { label: 'Normal BP', stage: 0, isSevere: false };
  } else {
    if (sbp >= 140 || dbp >= 90) return { label: 'Hypertension', stage: 2, isSevere: false };
    if (sbp >= 120 || dbp >= 70) return { label: 'Elevated BP', stage: 1, isSevere: false };
    return { label: 'Non-elevated BP', stage: 0, isSevere: false };
  }
}

export function calculateSwitch(fromDrug: string, toDrug: string): string[] {
  const notes: string[] = [];
  const from = (fromDrug || '').toLowerCase();
  const to = (toDrug || '').toLowerCase();

  if (from === to) return ['Same drug selected.'];
  if (from.includes('ace') && to.includes('arni')) {
    notes.push('Stop the ACE inhibitor and wait at least 36 hours before the first dose of sacubitril/valsartan (angioedema risk).');
  } else if (from.includes('arni') && to.includes('ace')) {
    notes.push('Wait at least 36 hours after the last sacubitril/valsartan dose before starting the ACE inhibitor.');
  } else if (from.includes('arb') && to.includes('arni')) {
    notes.push('Stop the ARB and give sacubitril/valsartan at the time of the next scheduled dose. Do not give both.');
  } else if (from.includes('ace') && to.includes('arb')) {
    notes.push('Stop the ACE inhibitor and start the ARB the next day; no washout needed. If the reason is angioedema, an ARB carries a small risk of recurrence: discuss with a specialist or use another class.');
  } else {
    notes.push('Stop the old drug and start the new one at the next scheduled dose; monitor BP and electrolytes within 2–4 weeks.');
  }
  return notes;
}
