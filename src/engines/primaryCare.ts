function parseNumOr(val: unknown, fallback: number): number {
  if (val === undefined || val === null || val === '') return fallback;
  const n = parseFloat(String(val));
  return isNaN(n) ? fallback : n;
}

export function evaluateAsthmaGina(patientInput: any): any {
  const p = patientInput || {};

  const dayPositive = (p.daySymptoms && p.daySymptoms !== 'none' && p.daySymptoms !== '0') ||
                      !!p.asthmaDaytime ||
                      (parseFloat(String(p.asthmaDaytimePerWk)) > 2);

  const nightWaking = !!(p.nightWaking || p.asthmaNightWaking);

  const relieverPositive = (p.relieverUse && p.relieverUse !== 'none' && p.relieverUse !== '0') ||
                           !!p.asthmaReliever ||
                           (parseFloat(String(p.sabaUsePerWeek)) > 2) ||
                           (parseFloat(String(p.asthmaRelieverPerWk)) > 2);

  const activityLimit = !!(p.activityLimit || p.asthmaActivityLimit);

  const sabaPerWk = parseFloat(String(p.sabaUsePerWeek)) || parseFloat(String(p.asthmaRelieverPerWk)) || (relieverPositive ? 4 : 0);
  const canistersPerYr = parseFloat(String(p.asthmaCanistersPerYr)) || 0;
  const currentStep = parseInt(String(p.currentStep || p.asthmaStep), 10) || 2;
  const preferredTrack = parseInt(String(p.preferredTrack || p.asthmaTrack), 10) || 1;

  let score = 0;
  if (dayPositive) score++;
  if (nightWaking) score++;
  if (relieverPositive) score++;
  if (activityLimit) score++;

  let controlLevel = 'well_controlled';
  let controlNameEn = 'Well Controlled';
  let controlNameAr = 'منضبط تماماً';
  let controlBadgeClass = 'badge-success';

  if (score >= 3) {
    controlLevel = 'uncontrolled';
    controlNameEn = 'Uncontrolled';
    controlNameAr = 'غير منضبط (بحاجة لتصعيد العلاج)';
    controlBadgeClass = 'badge-danger';
  } else if (score >= 1) {
    controlLevel = 'partly_controlled';
    controlNameEn = 'Partly Controlled';
    controlNameAr = 'منضبط جزئياً';
    controlBadgeClass = 'badge-warning';
  }

  const alerts: any[] = [];
  function addAlert(a: any) {
    a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
    a.message = `${a.messageEn} | ${a.messageAr}`;
    a.msg = a.messageEn;
    a.title = a.titleEn;
    alerts.push(a);
  }

  if (sabaPerWk >= 3 || canistersPerYr >= 3) {
    addAlert({
      id: 'asthma-saba-overuse',
      level: 'critical',
      titleEn: `SABA Overuse Alert: Reliever Used ${sabaPerWk}x/week (≥3x/wk)`,
      titleAr: `تحذير حرج: إفراط في استخدام بخاخ الفنتولين (${sabaPerWk} مرات/أسبوع - سابا)`,
      messageEn: `SABA overuse: Reliever use ≥3 times/week (${sabaPerWk}x/wk) or ≥3 canisters/year indicates poor asthma control and carries a substantially increased risk of severe, life-threatening asthma exacerbation and mortality. Urgent switch to an ICS-containing regimen is required. GINA Track 1 (MART: low-dose ICS-formoterol as reliever) is strongly preferred.`,
      messageAr: `إفراط في استخدام بخاخ الفنتولين (SABA) بمعدل ≥3 مرات أسبوعياً يشير لعدم التحكم بالربو ومخاطر عالية جداً لنوبات ربو مميتة ودخول المستشفى. يلزم فوراً الانتقال لبخاخ يحتوي على كورتيزون استنشاقي ومسار MART هو المفضل.`,
      actionEn: 'Switch patient to GINA Track 1 (MART: Budesonide/Formoterol) and counsel against SABA monotherapy.',
      actionAr: 'حوّل المريض لمسار MART (بوديسونيد/فورموتيرول كعلاج وقائي وإسعافي) وامتنع عن الفنتولين وحده.'
    });
  }

  const TRACK_1_STEPS: Record<number, any> = {
    1: {
      stepNumber: 1,
      title: 'Step 1–2: As-needed low-dose ICS-formoterol (MART)',
      nameEn: 'As-needed low-dose ICS-formoterol (Budesonide/Formoterol 160/4.5 mcg 1 puff prn)',
      nameAr: 'بوديسونيد/فورموتيرول (160/4.5 ميكروجرام) بخة واحدة عند اللزوم للأعراض',
      descEn: 'Reliever only; no daily maintenance needed for mild intermittent symptoms.',
      descAr: 'بخاخ عند اللزوم فقط؛ لا يحتاج بخاخاً يومياً ثابتاً في الأعراض الخفيفة.'
    },
    2: {
      stepNumber: 2,
      title: 'Step 2: As-needed low-dose ICS-formoterol (MART)',
      nameEn: 'As-needed low-dose ICS-formoterol (Budesonide/Formoterol 160/4.5 mcg 1 puff prn)',
      nameAr: 'بوديسونيد/فورموتيرول (160/4.5 ميكروجرام) بخة واحدة عند اللزوم للأعراض',
      descEn: 'Reliever only; or daily low-dose ICS maintenance if preferred.',
      descAr: 'بخاخ عند اللزوم؛ أو إضافة جرعة يومية خفيفة من الكورتيزون الاستنشاقي.'
    },
    3: {
      stepNumber: 3,
      title: 'Step 3: Low-dose maintenance and reliever therapy (MART)',
      nameEn: 'Low-dose MART: Budesonide/Formoterol 160/4.5 mcg 1 puff BID + 1 puff prn as reliever',
      nameAr: 'مسار MART جرعة منخفضة: بوديسونيد/فورموتيرول (160/4.5) بخة مرتين يومياً + بخة عند اللزوم',
      descEn: 'Low-dose maintenance ICS-formoterol plus as-needed reliever with the same inhaler.',
      descAr: 'جرعة يومية وقائية صباحاً ومساءً بالإضافة للاستخدام عند اللزوم بنفس البخاخ.'
    },
    4: {
      stepNumber: 4,
      title: 'Step 4: Medium-dose maintenance and reliever therapy (MART)',
      nameEn: 'Medium-dose MART: Budesonide/Formoterol 160/4.5 mcg 2 puffs BID + 1 puff prn',
      nameAr: 'مسار MART جرعة متوسطة: بوديسونيد/فورموتيرول (160/4.5) بختين مرتين يومياً + بخة عند اللزوم',
      descEn: 'Medium-dose maintenance ICS-formoterol plus as-needed reliever with the same inhaler.',
      descAr: 'زيادة الجرعة الوقائية لبختين صباحاً ومساءً مع الاستخدام الإسعافي عند اللزوم.'
    },
    5: {
      stepNumber: 5,
      title: 'Step 5: Add-on LAMA / Biologic / Specialist referral',
      nameEn: 'Step 5: Add LAMA (Tiotropium 5 mcg Respimat) OR High-dose MART + Specialist referral for Biologics',
      nameAr: 'الخطوة 5: إضافة تيوتروبيوم (LAMA) أو تحويل لاستشاري صدرية لبدء العلاجات البيولوجية',
      descEn: 'High-dose ICS-LABA + add-on LAMA, phenotypic assessment for severe asthma biologics.',
      descAr: 'كورتيزون عالي الكثافة مع لاما وتقييم العلاجات البيولوجية للأشكال الشديدة من الربو.'
    }
  };

  let recommendedStep = currentStep;
  if (controlLevel === 'uncontrolled') {
    recommendedStep = Math.min(currentStep + 1, 5);
  } else if (controlLevel === 'well_controlled' && currentStep > 2) {
    recommendedStep = currentStep;
  }

  const stepDetails = TRACK_1_STEPS[recommendedStep] || TRACK_1_STEPS[3];

  let recommendation = `GINA Track 1 MART: Step ${recommendedStep} (${stepDetails.title}). ${stepDetails.nameEn}`;
  if (controlLevel === 'uncontrolled' && recommendedStep > currentStep) {
    recommendation = `Uncontrolled asthma on Step ${currentStep}: Step up to Step ${recommendedStep} Low-Dose MART (ICS-Formoterol). ${stepDetails.nameEn}`;
  }

  return {
    engine: 'asthma',
    controlLevel,
    control: controlLevel,
    controlNameEn,
    controlNameAr,
    controlBadgeClass,
    score,
    sabaPerWk,
    currentStep,
    recommendedStep,
    preferredTrack,
    recommendation,
    stepDetails,
    alerts,
    guardrails: alerts
  };
}

export function evaluateCopdGold(patientInput: any): any {
  const p = patientInput || {};

  function pickNum(vals: unknown[], fallback: number): number {
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] !== undefined && vals[i] !== null && vals[i] !== '') {
        const n = parseFloat(String(vals[i]));
        if (!isNaN(n)) return n;
      }
    }
    return fallback;
  }

  const moderateExac = pickNum([p.moderateExacerbations, p.exacerbationsLastYear, p.copdExacerbations], 0);
  const hospExac = pickNum([p.hospitalExacerbations, p.hospitalizationsLastYear, p.copdHospitalExacerbations], 0);
  const mmrc = pickNum([p.mMRC, p.mmrcScore, p.copdMmrc], 0);
  const cat = pickNum([p.catScore, p.copdCat], 0);
  const eos = pickNum([p.bloodEosinophils, p.eosinophilsPerUl, p.copdEosinophils], 150);

  const isHighRisk = (moderateExac >= 2 || hospExac >= 1);
  const isHighSymptom = (mmrc >= 2 || cat >= 10);

  let group = 'A';
  let groupNameEn = 'Group A (Low Risk, Less Symptoms)';
  let groupNameAr = 'المجموعة A (خطر نوبات منخفض، أعراض طفيفة)';
  let primaryRxEn = 'Bronchodilator: Single LABA or LAMA as initial maintenance.';
  let primaryRxAr = 'موسع قصبات: موسع أحادي LABA أو LAMA كبداية.';

  if (isHighRisk) {
    group = 'E';
    groupNameEn = 'Group E (High Exacerbation Risk - Exacerbator phenotype)';
    groupNameAr = 'المجموعة E (خطر انتكاسات مرتفع - دخول مشفى أو ≥2 نوبة معتدلة)';

    if (eos >= 300) {
      primaryRxEn = 'Triple Therapy: LABA + LAMA + ICS (Fluticasone/Umeclidinium/Vilanterol OR Budesonide/Glycopyrrolate/Formoterol once/twice daily). Blood eosinophils ≥ 300 cells/µL strongly indicates ICS benefit to reduce exacerbations.';
      primaryRxAr = 'العلاج الثلاثي (Triple Therapy): LABA + LAMA + ICS معاً. ارتفاع الخلايا الحمضية (Eosinophils ≥ 300) مؤشر قوي لخفض النوبات الحادة ومعدلات دخول المستشفى.';
    } else {
      primaryRxEn = 'Dual Bronchodilation: LABA + LAMA (e.g. Tiotropium/Olodaterol or Umeclidinium/Vilanterol). If recurrent exacerbations persist despite LABA+LAMA and eosinophils ≥ 100, add ICS (Triple Therapy).';
      primaryRxAr = 'موسع قصبات مزدوج: LABA + LAMA. إذا استمرت النوبات رغم الموسع المزدوج مع eosinophils ≥ 100 يتم تصعيده للعلاج الثلاثي.';
    }
  } else if (isHighSymptom) {
    group = 'B';
    groupNameEn = 'Group B (Low Risk, More Symptoms - mMRC ≥ 2 or CAT ≥ 10)';
    groupNameAr = 'المجموعة B (خطر نوبات منخفض، أعراض ضيق تنفس واضحة)';
    primaryRxEn = 'Dual Bronchodilation: LABA + LAMA (combination inhaler) is superior to single bronchodilator for symptom and dyspnea reduction.';
    primaryRxAr = 'موسع قصبات مزدوج (LABA + LAMA): يوفر تخفيفاً متفوقاً لضيق التنفس وتحسين جودة الحياة مقارنة بالموسع الفردي.';
  }

  const alerts: any[] = [];
  function addAlert(a: any) {
    a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
    a.message = `${a.messageEn} | ${a.messageAr}`;
    a.msg = a.messageEn;
    a.title = a.titleEn;
    alerts.push(a);
  }

  if (eos < 100) {
    addAlert({
      id: 'copd-low-eos-pneumonia-risk',
      level: 'warning',
      titleEn: `Caution: Low Blood Eosinophils (${eos} cells/µL < 100) - Pneumonia Risk with ICS`,
      titleAr: `تحذير سريري: انخفاض الخلايا الحمضية (${eos} < 100) - خطر ذات الرئة عند استخدام الكورتيزون`,
      messageEn: `Blood eosinophil count is ${eos} cells/µL (< 100 cells/µL). GOLD 2024–2025 guidelines advise against initiating or maintaining ICS in this subgroup: negligible exacerbation reduction benefit combined with a substantially increased risk of severe bacterial pneumonia. Prefer LABA + LAMA bronchodilation.`,
      messageAr: `نسبة الحمضيات Eosinophils هي ${eos} (< 100). تنصح توصيات GOLD بتجنب مشتقات الكورتيزون الاستنشاقي (ICS) لعدم وجود فائدة مع زيادة خطر الإصابة بالتهاب الرئة البكتيري الحاد (ذات الرئة pneumonia). اعتمد على الموسع المزدوج LABA + LAMA.`,
      actionEn: 'Avoid ICS initiation; rely on dual bronchodilators (LABA + LAMA) and pulmonary rehabilitation.',
      actionAr: 'تجنب إضافة الكورتيزون الاستنشاقي واعتمد على موسعات الشعب المزدوجة والتأهيل الرئوي.'
    });
  }

  return {
    engine: 'copd',
    group,
    goldGroup: group,
    groupNameEn,
    groupNameAr,
    moderateExac,
    hospExac,
    mmrc,
    cat,
    eos,
    primaryRxEn,
    primaryRxAr,
    recommendation: primaryRxEn,
    alerts,
    guardrails: alerts
  };
}

export function evaluateThyroid(patientInput: any): any {
  const p = patientInput || {};

  const tsh = parseNumOr(p.tsh, 2.5);
  const ft4 = parseNumOr(p.ft4, 1.2);
  const age = parseNumOr(p.age, 52);
  const wt = parseNumOr(p.weightKg !== undefined ? p.weightKg : p.wt, 70);
  const isPregnant = !!(p.pregnancy || p.pregnant || p.preg || p.pregHtn);
  const hasAscvd = !!(p.ascvd || p.cad || (p.hf && p.hf !== 'none' && p.hf !== false));
  const hasAsthmaOrCopd = !!(p.asthma || p.copd);

  let status = 'euthyroid';
  let diagnosis = 'Euthyroid (Normal Thyroid Function)';
  let statusNameEn = 'Euthyroid (Normal Thyroid Function)';
  let statusNameAr = 'وظائف الغدة طبيعية (Euthyroid)';
  let badgeClass = 'badge-success';

  if (tsh > 4.5 && ft4 < 0.8) {
    status = 'overt_hypo';
    diagnosis = 'Overt Hypothyroidism (Elevated TSH + Low FT4)';
    statusNameEn = 'Overt Hypothyroidism';
    statusNameAr = 'قصور الغدة الدرقية الصريح (Overt Hypothyroidism)';
    badgeClass = 'badge-danger';
  } else if (tsh > 4.5 && ft4 >= 0.8 && ft4 <= 1.8) {
    status = 'subclinical_hypo';
    diagnosis = 'Subclinical Hypothyroidism (Elevated TSH + Normal FT4)';
    statusNameEn = 'Subclinical Hypothyroidism';
    statusNameAr = 'قصور الغدة الدرقية تحت الإكلينيكي (Subclinical)';
    badgeClass = 'badge-warning';
  } else if (tsh < 0.4 && ft4 > 1.8) {
    status = 'overt_hyper';
    diagnosis = 'Overt Hyperthyroidism / Thyrotoxicosis (Low TSH + High FT4)';
    statusNameEn = 'Overt Hyperthyroidism / Thyrotoxicosis';
    statusNameAr = 'فرط نشاط الغدة الدرقية الصريح (Hyperthyroidism)';
    badgeClass = 'badge-danger';
  } else if (tsh < 0.4 && ft4 >= 0.8 && ft4 <= 1.8) {
    status = 'subclinical_hyper';
    diagnosis = 'Subclinical Hyperthyroidism (Low TSH + Normal FT4)';
    statusNameEn = 'Subclinical Hyperthyroidism';
    statusNameAr = 'فرط نشاط الغدة الدرقية تحت الإكلينيكي';
    badgeClass = 'badge-warning';
  }

  const alerts: any[] = [];
  function addAlert(a: any) {
    a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
    a.message = `${a.messageEn} | ${a.messageAr}`;
    a.msg = a.messageEn;
    a.title = a.titleEn;
    alerts.push(a);
  }

  let recommendedDose = 0;
  let rxEn = '';
  let rxAr = '';

  if (status === 'overt_hypo') {
    if (hasAscvd || age >= 65) {
      recommendedDose = 25;
      rxEn = `Conservative Levothyroxine starting dose: 25–50 mcg PO daily (Patient has established ASCVD or age ≥65). Titrate by 12.5–25 mcg every 6–8 weeks based on repeat TSH to prevent precipitation of angina, myocardial ischemia, or arrhythmia.`;
      rxAr = `جرعة ليفوثيروكسين تحفظية للبدء: 25 إلى 50 ميكروجرام يومياً على معدة فارغة لوجود أمراض قلبية أو كبر السن. تُرفع الجرعة تدريجياً كل 6-8 أسابيع لتفادي نوبات الذبحة الصدرية.`;
    } else if (isPregnant) {
      recommendedDose = Math.round(wt * 1.8);
      rxEn = `Pregnancy Levothyroxine replacement: ~1.8 mcg/kg/day (~${recommendedDose} mcg daily). Maternal thyroid hormone is critical for fetal neurological development. Maintain trimester-specific TSH target (<2.5 mIU/L in T1; <3.0 in T2/T3). Recheck TSH every 4 weeks.`;
      rxAr = `علاج قصور الغدة أثناء الحمل: ليفوثيروكسين بجرعة ~1.8 ميكروجرام/كجم (~${recommendedDose} ميكروجرام يومياً) لأهميته لتطور مخ الجنين مع المحافظة على TSH < 2.5.`;
    } else {
      recommendedDose = Math.round(wt * 1.6);
      rxEn = `Full replacement Levothyroxine dose: ~1.6 mcg/kg/day (~${recommendedDose} mcg PO daily). Take first thing in the morning with water, 30–60 minutes before breakfast. Recheck TSH in 6–8 weeks for titration.`;
      rxAr = `جرعة إحلال كاملة من الليفوثيروكسين: ~1.6 ميكروجرام/كجم/يوم (~${recommendedDose} ميكروجرام فموياً يومياً). يُؤخذ صباحاً على الريق مع الماء قبل الإفطار بنصف ساعة إلى ساعة. يعاد فحص TSH بعد 6-8 أسابيع.`;
    }
  } else if (status === 'overt_hyper') {
    let thionamideEn = 'Carbimazole 15–30 mg daily (or Methimazole 10–20 mg daily) preferred over PTU due to lower hepatotoxicity risk.';
    let thionamideAr = 'كاربيميزول 15-30 مجم يومياً (أو ميثيمازول 10-20 مجم) هو الخيار الأول لقلة مخاطره على الكبد مقارنة بـ PTU.';

    if (hasAsthmaOrCopd) {
      addAlert({
        id: 'thyroid-propranolol-bronchospasm',
        level: 'critical',
        titleEn: 'Contraindication: Propranolol (Inderal) in Asthma/COPD - Severe Bronchospasm Risk',
        titleAr: 'موانع استخدام حرجة: حظر البروبرانولول (إندرال) لمرضى الربو والسدة الرئوية - خطر انقباض قصبي',
        messageEn: 'Bronchospasm alert: Non-selective beta-blockers like Propranolol (Inderal) can trigger severe, potentially fatal bronchospasm in patients with Asthma or COPD. For adrenergic symptom relief (palpitations, tremor), use a cardioselective Beta-1 blocker (Bisoprolol 2.5–5 mg) with extreme caution, or preferably use a non-DHP Calcium Channel Blocker (Diltiazem 30–60 mg tid or Verapamil).',
        messageAr: 'تحذير انقباض قصبي وتشنج: حاصرات بيتا غير الانتقائية (مثل إندرال / بروبرانولول) تسبب تشنجاً حاداً وخطيراً بالقصبات الهوائية في مرضى الربو أو السدة الرئوية. للسيطرة على خفقان القلب والرعشة، استخدم محصر قنوات الكالسيوم (ديلتيازيم) أو محصر بيتا-1 انتقائي (بيسوبرولول) بحذر شديد.',
        actionEn: 'Avoid Propranolol; use Diltiazem or cautious selective Beta-1 blocker.',
        actionAr: 'تجنب إندرال واستخدم ديلتيازيم أو بيسوبرولول بحذر شديد.'
      });
      rxEn = `${thionamideEn} For symptom control: Diltiazem 30–60 mg tid (avoid Propranolol due to Asthma/COPD bronchospasm risk).`;
      rxAr = `${thionamideAr} للسيطرة على الأعراض والخفقان: ديلتيازيم 30-60 مجم 3 مرات يومياً (تجنب إندرال لوجود ربو/سدة).`;
    } else {
      rxEn = `${thionamideEn} For symptom control: Propranolol 10–40 mg tid–qid for rapid tremor and tachycardia relief.`;
      rxAr = `${thionamideAr} للسيطرة على الأعراض: بروبرانولول (إندرال) 10-40 مجم 3 مرات يومياً لعلاج الخفقان والرعشة.`;
    }
  } else if (status === 'subclinical_hypo' && !rxEn) {
    rxEn = 'Mild subclinical hypothyroidism (TSH 4.5–9.9 mIU/L): Repeat TSH + Free T4 + Anti-TPO in 6–12 weeks. Consider Levothyroxine trial only if symptomatic, pregnant, planning pregnancy, or Anti-TPO positive.';
    rxAr = 'قصور تحت إكلينيكي خفيف (TSH بين 4.5 و 9.9): يُعاد فحص TSH و Free T4 مع Anti-TPO بعد 6–12 أسبوعاً. لا يبدأ الليفوثيروكسين إلا مع وجود أعراض أو حمل أو التخطيط للحمل.';
  } else if (status === 'subclinical_hyper') {
    rxEn = 'Subclinical hyperthyroidism (TSH 0.1–0.39 mIU/L): Repeat TSH + Free T4/T3 in 6–12 weeks; evaluate for Graves/toxic nodule if persistent, especially if age ≥ 65 or cardiovascular/osteoporosis risk.';
    rxAr = 'فرط نشاط تحت إكلينيكي: يُعاد فحص TSH و Free T4/T3 خلال 6–12 أسبوعاً؛ تقييم أسباب فرط النشاط ومتابعة نبض القلب وهشاشة العظام (خاصة بعمر ≥ 65).';
  } else if (status === 'euthyroid') {
    rxEn = 'Euthyroid state: No thyroid hormone replacement or antithyroid therapy required. Routine monitoring only if clinically indicated.';
    rxAr = 'وظائف الغدة الدرقية طبيعية: لا يتطلب علاجاً دوائياً للغدة الدرقية حالياً.';
  }

  return {
    engine: 'thyroid',
    status,
    diagnosis,
    statusNameEn,
    statusNameAr,
    badgeClass,
    tsh,
    ft4,
    isPregnant,
    hasAscvd,
    hasAsthmaOrCopd,
    recommendedDose,
    startingDose: recommendedDose,
    doseMcg: recommendedDose,
    rxEn,
    rxAr,
    alerts,
    guardrails: alerts
  };
}

export function evaluatePrimaryCare(patientInput: any): any {
  const p = patientInput || {};
  const asthma = evaluateAsthmaGina(p);
  const copd = evaluateCopdGold(p);
  const thyroid = evaluateThyroid(p);

  const allAlerts = [
    ...asthma.alerts,
    ...copd.alerts,
    ...thyroid.alerts
  ];

  return {
    patient: p,
    asthma,
    copd,
    thyroid,
    allAlerts
  };
}
