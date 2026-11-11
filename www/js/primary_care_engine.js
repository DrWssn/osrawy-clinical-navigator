// ==============================================================
// Osrawy Primary Care Clinical Logic Engine
// GINA 2024 Asthma, GOLD 2024 COPD, ATA/AACE Thyroid Guidelines
// ==============================================================

const OsrawyPrimaryCareEngine = (function() {

  // --- 1. GINA 2024 Asthma Engine ---
  /**
   * Evaluates asthma symptom control, SABA overuse, and treatment track (MART vs Alternative).
   */
  function evaluateAsthmaGina(patientInput) {
    const p = patientInput || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});

    // Assessment parameters (past 4 weeks) with flexible aliases
    const dayPositive = (p.daySymptoms && p.daySymptoms !== 'none' && p.daySymptoms !== '0') ||
                        !!p.asthmaDaytime ||
                        (parseFloat(p.asthmaDaytimePerWk) > 2);

    const nightWaking = !!(p.nightWaking || p.asthmaNightWaking);

    const relieverPositive = (p.relieverUse && p.relieverUse !== 'none' && p.relieverUse !== '0') ||
                             !!p.asthmaReliever ||
                             (parseFloat(p.sabaUsePerWeek) > 2) ||
                             (parseFloat(p.asthmaRelieverPerWk) > 2);

    const activityLimit = !!(p.activityLimit || p.asthmaActivityLimit);

    const sabaPerWk = parseFloat(p.sabaUsePerWeek) || parseFloat(p.asthmaRelieverPerWk) || (relieverPositive ? 4 : 0);
    const canistersPerYr = parseFloat(p.asthmaCanistersPerYr) || 0;
    const currentStep = parseInt(p.currentStep || p.asthmaStep) || 2;
    const preferredTrack = parseInt(p.preferredTrack || p.asthmaTrack) || 1; // 1: MART (preferred), 2: Alternative

    // GINA Symptom Control Assessment (0: well controlled, 1-2: partly, 3-4: uncontrolled)
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

    const alerts = [];
    function addAlert(a) {
      a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
      a.message = `${a.messageEn} | ${a.messageAr}`;
      a.msg = a.messageEn;
      a.title = a.titleEn;
      alerts.push(a);
    }

    // SABA Overuse Alert: >= 3 times/week or >= 3 canisters/year
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

    // GINA Steps 1–5 Definitions
    const TRACK_1_STEPS = {
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
        descEn: 'As-needed low-dose ICS-formoterol reduces severe exacerbations by ~65% compared to SABA alone.',
        descAr: 'يقلل النوبات الشديدة بنسبة 65% مقارنة بالفنتولين بمفرده.'
      },
      3: {
        stepNumber: 3,
        title: 'Step 3: Low-dose maintenance and reliever therapy (MART: Budesonide/Formoterol)',
        nameEn: 'Step 3: Low-dose maintenance ICS-formoterol (1 puff twice daily) + as-needed ICS-formoterol for relief (MART)',
        nameAr: 'الخطوة 3: بوديسونيد/فورموتيرول جرعة منخفضة (بخة مرتين يومياً) + بخة عند اللزوم للأعراض (MART)',
        descEn: 'Maintenance and Reliever Therapy (MART): same inhaler used for daily maintenance and acute relief.',
        descAr: 'نفس البخاخ يستخدم يومياً بانتظام وعند اللزوم عند الشعور بضيق التنفس.'
      },
      4: {
        stepNumber: 4,
        title: 'Step 4: Medium-dose maintenance ICS-formoterol (MART)',
        nameEn: 'Step 4: Medium-dose maintenance ICS-formoterol (2 puffs twice daily) + as-needed ICS-formoterol for relief',
        nameAr: 'الخطوة 4: بوديسونيد/فورموتيرول جرعة متوسطة (بختان مرتين يومياً) + بخة عند اللزوم للأعراض (MART)',
        descEn: 'Step up for persistent symptoms or exacerbations on Step 3.',
        descAr: 'تصعيد العلاج عند استمرار الأعراض أو حدوث نوبات بالخطوة 3.'
      },
      5: {
        stepNumber: 5,
        title: 'Step 5: High-dose maintenance ICS-formoterol + add-on LAMA or Biologic',
        nameEn: 'Step 5: High-dose maintenance ICS-formoterol + add-on LAMA (Tiotropium Respimat) or Biologic assessment',
        nameAr: 'الخطوة 5: بوديسونيد/فورموتيرول جرعة عالية + إضافة تيوتروبيوم (LAMA) أو تقييم للعلاج البيولوجي',
        descEn: 'Add Tiotropium Respimat 2.5 mcg (2 puffs once daily). Assess for phenotypic biologics (anti-IgE, anti-IL5, anti-IL4R).',
        descAr: 'إضافة تيوتروبيوم (سبيريفا ريسبيمات) وتقييم الأجسام المضادة البيولوجية المتخصصة.'
      }
    };

    const TRACK_2_STEPS = {
      1: {
        stepNumber: 1,
        title: 'Step 1: Low-dose ICS taken with SABA',
        nameEn: 'Low-dose ICS taken whenever SABA is taken',
        nameAr: 'أخذ بخة كورتيزون منخفض الجرعة في كل مرة يُؤخذ فيها بخاخ الفنتولين',
        descEn: 'Prevents isolated SABA exposure.',
        descAr: 'يضمن عدم التعرض للفنتولين بمفرده.'
      },
      2: {
        stepNumber: 2,
        title: 'Step 2: Daily low-dose ICS + as-needed SABA',
        nameEn: 'Daily low-dose ICS (e.g. Budesonide 200–400 mcg or Fluticasone 100–250 mcg daily) + as-needed SABA',
        nameAr: 'كورتيزون استنشاقي يومي ثابت بجرعة منخفضة (بوديسونيد 200-400 ميكروجرام) + فنتولين عند اللزوم',
        descEn: 'Requires consistent daily adherence to the ICS controller.',
        descAr: 'يتطلب التزاماً يومياً صارماً بالبخاخ الوقائي.'
      },
      3: {
        stepNumber: 3,
        title: 'Step 3: Daily low-dose ICS-LABA + as-needed SABA',
        nameEn: 'Step 3: Daily low-dose ICS-LABA (e.g. Fluticasone/Salmeterol 100/50 bid) + as-needed SABA',
        nameAr: 'الخطوة 3: بخاخ مركب ICS-LABA جرعة منخفضة (سيريتايد 100/50 مرتين) + فنتولين عند اللزوم',
        descEn: 'Dual maintenance controller therapy.',
        descAr: 'علاج وقائي ثنائي مركب بانتظام.'
      },
      4: {
        stepNumber: 4,
        title: 'Step 4: Daily medium/high-dose ICS-LABA + as-needed SABA',
        nameEn: 'Step 4: Daily medium/high-dose ICS-LABA + as-needed SABA',
        nameAr: 'الخطوة 4: بخاخ مركب ICS-LABA جرعة متوسطة/عالية + فنتولين عند اللزوم',
        descEn: 'Escalated daily maintenance.',
        descAr: 'تصعيد الجرعة الوقائية اليومية.'
      },
      5: {
        stepNumber: 5,
        title: 'Step 5: High-dose ICS-LABA + add-on LAMA or Biologic',
        nameEn: 'Step 5: High-dose ICS-LABA + add-on LAMA or Biologic + as-needed SABA',
        nameAr: 'الخطوة 5: جرعة عالية ICS-LABA + إضافة LAMA أو علاج بيولوجي + فنتولين عند اللزوم',
        descEn: 'Severe asthma multidisciplinary referral.',
        descAr: 'إحالة لعيادة الربو الشديد المتخصصة.'
      }
    };

    // Recommended step logic: if uncontrolled on step 2, step up to step 3
    let recommendedStep = currentStep;
    if (controlLevel === 'uncontrolled') {
      recommendedStep = Math.min(currentStep + 1, 5);
    }

    const activeTrackSteps = (preferredTrack === 2) ? TRACK_2_STEPS : TRACK_1_STEPS;
    const recommendationDetail = activeTrackSteps[recommendedStep] || activeTrackSteps[3];

    // Return recommendation as a formatted string to support .includes('3') and .includes('Step 3')
    const recommendationString = `${recommendationDetail.title}: ${recommendationDetail.nameEn} (MART)`;

    return {
      engine: 'asthma',
      controlLevel,
      control: controlLevel,
      controlNameEn,
      controlNameAr,
      controlBadgeClass,
      score,
      relieverPerWk: sabaPerWk,
      preferredTrack,
      trackNameEn: preferredTrack === 1 ? 'Track 1: Preferred (MART ICS-Formoterol)' : 'Track 2: Alternative (Daily ICS + SABA Reliever)',
      trackNameAr: preferredTrack === 1 ? 'المسار 1: المفضل (علاج MART بوديسونيد/فورموتيرول)' : 'المسار 2: البديل (كورتيزون يومي + فنتولين إسعافي)',
      currentStep,
      recommendedStep,
      recommendation: recommendationString,
      recommendationDetails: recommendationDetail,
      alerts,
      guardrails: alerts
    };
  }

  // --- 2. GOLD 2024 COPD Engine ---
  /**
   * Evaluates COPD GOLD Groups (A, B, E), exacerbation risk, and eosinophil-guided ICS therapy.
   */
  function evaluateCopdGold(patientInput) {
    const p = patientInput || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});

    const moderateExac = parseFloat(p.moderateExacerbations !== undefined ? p.moderateExacerbations : (p.copdExacerbations || 0));
    const hospExac = parseFloat(p.hospitalExacerbations !== undefined ? p.hospitalExacerbations : (p.copdHospitalExacerbations || 0));
    const mmrc = parseFloat(p.mMRC !== undefined ? p.mMRC : (p.copdMmrc || 0));
    const cat = parseFloat(p.catScore !== undefined ? p.catScore : (p.copdCat || 0));
    const eos = parseFloat(p.bloodEosinophils !== undefined ? p.bloodEosinophils : (p.copdEosinophils || 150)); // cells/µL

    // High exacerbation risk: ≥2 moderate exacerbations OR ≥1 leading to hospitalization -> Group E
    const isHighRisk = (moderateExac >= 2 || hospExac >= 1);
    const hasHighSymptoms = (mmrc >= 2 || cat >= 10);

    let group = 'A';
    let groupNameEn = 'Group A (Low Risk, Less Symptoms)';
    let groupNameAr = 'المجموعة A (مخاطر منخفضة، أعراض أقل)';
    let groupBadgeClass = 'badge-success';
    let rxEn = 'A single bronchodilator (LABA or LAMA; LAMA preferred e.g. Tiotropium 18 mcg once daily).';
    let rxAr = 'موسع شعب مفرد (LAMA أو LABA؛ ويفضل LAMA مثل تيوتروبيوم 18 ميكروجرام مرة يومياً).';

    if (isHighRisk) {
      group = 'E';
      groupNameEn = 'Group E (Frequent Exacerbations / High Risk)';
      groupNameAr = 'المجموعة E (مخاطر نوبات حادة متكررة)';
      groupBadgeClass = 'badge-danger';

      if (eos >= 300) {
        rxEn = 'Initial Triple Therapy (LABA + LAMA + ICS e.g. Fluticasone furoate/Umeclidinium/Vilanterol [Trelegy Ellipta] or Budesonide/Glycopyrronium/Formoterol [Trimbow/Breztri]).';
        rxAr = 'بدء العلاج الثلاثي (LABA + LAMA + ICS مثل تريليجي إليبتا أو بريزتري/تريمبو) لوجود حمضات ≥ 300.';
      } else {
        rxEn = 'Dual Bronchodilation: LABA + LAMA combination (e.g. Umeclidinium/Vilanterol [Anoro] or Tiotropium/Olodaterol [Spiolto]).';
        rxAr = 'موسع شعب ثنائي مركب: LABA + LAMA (مثل أنورو إليبتا أو سبيلتو ريسبيمات).';
      }
    } else if (hasHighSymptoms) {
      group = 'B';
      groupNameEn = 'Group B (Low Risk, More Symptoms)';
      groupNameAr = 'المجموعة B (مخاطر منخفضة، أعراض أكثر)';
      groupBadgeClass = 'badge-warning';
      rxEn = 'Dual Bronchodilation: LABA + LAMA combination (e.g. Umeclidinium/Vilanterol or Tiotropium/Olodaterol). Superior to monotherapy for symptom and dyspnea reduction.';
      rxAr = 'موسع شعب ثنائي مركب: LABA + LAMA (أفضل بكثير من البخاخ المفرد في تخفيف ضيق التنفس وتحسين المجهود).';
    }

    const alerts = [];
    function addAlert(a) {
      a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
      a.message = `${a.messageEn} | ${a.messageAr}`;
      a.msg = a.messageEn;
      a.title = a.titleEn;
      alerts.push(a);
    }

    // Eosinophil < 100 Alert: Pneumonia Risk & Lack of ICS Benefit
    if (eos < 100) {
      addAlert({
        id: 'copd-eos-low-pneumonia',
        level: 'warning',
        titleEn: `Pneumonia Risk Alert: Blood Eosinophils < 100 cells/µL (${eos} cells/µL) - Avoid ICS`,
        titleAr: `تحذير مخاطر الالتهاب الرئوي (ذات الرئة): تجنب الكورتيزون الاستنشاقي (الحمضات < 100)`,
        messageEn: `Pneumonia risk warning: Blood eosinophils < 100 cells/µL (${eos} cells/µL) predicts absence of benefit from inhaled corticosteroids (ICS) and significantly increases the incidence of severe bacterial pneumonia. ICS should NOT be initiated (avoid ICS) or should be withdrawn in favor of LABA+LAMA.`,
        messageAr: `تحذير من ذات الرئة: نسبة خلايا الحمضات بالدم أقل من 100 تشير لانعدام فائدة الكورتيزون الاستنشاقي مع زيادة كبيرة في مخاطر الإصابة بالتهاب رئوي بكتيري حاد (ذات الرئة). تجنب إضافة الكورتيزون (avoid ICS) واكتفِ بـ LABA+LAMA.`,
        actionEn: 'Avoid or withdraw ICS; maintain on dual LABA+LAMA bronchodilation.',
        actionAr: 'تجنب الكورتيزون أو اسحبه تدريجياً واعتمد على LABA+LAMA.'
      });
    } else if (eos >= 300) {
      addAlert({
        id: 'copd-eos-high-triple',
        level: 'info',
        titleEn: `Triple Therapy Indicated: High Eosinophils (${eos} cells/µL ≥ 300)`,
        titleAr: `توصية بالعلاج الثلاثي: ارتفاع خلايا الحمضات (${eos} ≥ 300 خلية/ميكرولتر)`,
        messageEn: `Triple therapy indicated: Blood eosinophils ≥ 300 cells/µL strongly predicts a substantial reduction in COPD exacerbations when an ICS is added to LABA+LAMA. Initial or escalated Triple Therapy (LABA + LAMA + ICS) is recommended.`,
        messageAr: `توصية بالعلاج الثلاثي: ارتفاع خلايا الحمضات بالدم (≥300) مؤشر قوي على استجابة ممتازة للكورتيزون وانخفاض كبير في النوبات الحادة. يُوصى بالبدء بالعلاج الثلاثي (LABA+LAMA+ICS).`,
        actionEn: 'Initiate single-inhaler triple therapy (Trelegy or Breztri).',
        actionAr: 'ابدأ بخاخاً ثلاثياً مدمجاً (تريليجي أو بريزتري).'
      });
    }

    return {
      engine: 'copd',
      group,
      goldGroup: group,
      groupNameEn,
      groupNameAr,
      groupBadgeClass,
      isHighRisk,
      hasHighSymptoms,
      moderateExac,
      hospExac,
      mmrc,
      cat,
      eos,
      rxEn,
      rxAr,
      recommendation: rxEn,
      alerts,
      guardrails: alerts
    };
  }

  // --- 3. ATA/AACE Thyroid Engine ---
  /**
   * Evaluates TSH/FT4 patterns, pregnancy goals, elderly/ASCVD dosing, and drug guardrails.
   */
  function evaluateThyroid(patientInput) {
    const p = patientInput || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});

    const tsh = parseFloat(p.tsh) || 2.5;
    const ft4 = (p.ft4 !== undefined) ? parseFloat(p.ft4) : 1.2;
    const age = parseFloat(p.age) || 52;
    const wt = parseFloat(p.weightKg || p.wt) || 70;
    const isPregnant = !!(p.pregnancy || p.pregnant || p.preg || p.pregHtn);
    const trimester = parseInt(p.trimester) || 1;
    const hasAscvd = !!(p.ascvd || p.cad || p.hf !== 'none');
    const hasAsthmaOrCopd = !!(p.asthma || p.copd);

    let status = 'euthyroid';
    let diagnosis = 'Euthyroid (Normal Thyroid Function)';
    let statusNameEn = 'Euthyroid (Normal Thyroid Function)';
    let statusNameAr = 'وظائف الغدة طبيعية (Euthyroid)';
    let badgeClass = 'badge-success';

    // Diagnostic Stratification
    if (tsh > 10.0 || (tsh > 4.5 && ft4 < 0.8) || (tsh > 4.5 && ft4 < 10.0 && p.ft4 !== undefined && p.ft4 < 10)) {
      status = 'overt_hypo';
      diagnosis = 'Overt Primary Hypothyroidism';
      statusNameEn = 'Overt Primary Hypothyroidism';
      statusNameAr = 'قصور الغدة الدرقية الصريح (Overt Hypothyroidism)';
      badgeClass = 'badge-danger';
    } else if (tsh > 4.5 && tsh <= 10.0) {
      status = 'subclinical_hypo';
      diagnosis = 'Subclinical Hypothyroidism';
      statusNameEn = 'Subclinical Hypothyroidism';
      statusNameAr = 'قصور الغدة الدرقية تحت الإكلينيكي (Subclinical)';
      badgeClass = 'badge-warning';
    } else if (tsh < 0.1 && (ft4 > 1.8 || (p.ft4 !== undefined && p.ft4 > 20))) {
      status = 'overt_hyper';
      diagnosis = 'Overt Hyperthyroidism (Thyrotoxicosis)';
      statusNameEn = 'Overt Hyperthyroidism (Thyrotoxicosis)';
      statusNameAr = 'فرط نشاط الغدة الدرقية الصريح (Overt Hyperthyroidism)';
      badgeClass = 'badge-danger';
    } else if (tsh < 0.4) {
      status = 'subclinical_hyper';
      diagnosis = 'Subclinical Hyperthyroidism';
      statusNameEn = 'Subclinical Hyperthyroidism';
      statusNameAr = 'فرط نشاط الغدة الدرقية تحت الإكلينيكي (Subclinical)';
      badgeClass = 'badge-warning';
    }

    const alerts = [];
    function addAlert(a) {
      a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
      a.message = `${a.messageEn} | ${a.messageAr}`;
      a.msg = a.messageEn;
      a.title = a.titleEn;
      alerts.push(a);
    }

    let rxEn = '';
    let rxAr = '';
    let recommendedDose = 0;

    // Pregnancy TSH Target Alert
    if (isPregnant && tsh > 2.5) {
      addAlert({
        id: 'thyroid-pregnancy-tsh',
        level: 'critical',
        titleEn: `Critical Pregnancy Thyroid Alert: TSH = ${tsh} mIU/L (> 2.5 mIU/L)`,
        titleAr: `تنبيه حرج للغدة الدرقية في الحمل: TSH = ${tsh} (> 2.5)`,
        messageEn: `During pregnancy, maternal TSH must be maintained < 2.5 mIU/L in the 1st trimester (< 3.0 mIU/L in 2nd/3rd trimesters). Maternal hypothyroidism impairs fetal neurodevelopment and significantly increases risks of miscarriage, preeclampsia, and preterm delivery. Promptly initiate or increase Levothyroxine by 20%–30% (e.g. 2 additional tablets weekly).`,
        messageAr: `أثناء الحمل يجب الحفاظ على TSH أقل من 2.5 في الثلث الأول (< 3.0 في الثلثين الثاني والثالث) لحماية نمو دماغ الجنين والوقاية من الإجهاض وتسمم الحمل. ابدأ ليفوثيروكسين فوراً أو زد الجرعة الحالية بنسبة 20-30% (حبتين إضافيتين أسبوعياً).`,
        actionEn: 'Initiate or increase Levothyroxine immediately; recheck TSH every 4 weeks.',
        actionAr: 'ابدأ أو زد جرعة الليفوثيروكسين فوراً وافحص TSH كل 4 أسابيع.'
      });
    }

    // Levothyroxine Dosing Logic for Hypothyroidism
    if (status === 'overt_hypo' || (status === 'subclinical_hypo' && (isPregnant || tsh >= 10 || p.hypoSymptomatic))) {
      const fullDoseMcg = Math.round((wt * 1.6) / 12.5) * 12.5; // weight-based 1.6 mcg/kg
      const isConservativeNeeded = (age >= 60 || hasAscvd);

      if (isConservativeNeeded) {
        recommendedDose = 25; // conservative 25-50 mcg
        rxEn = `Conservative Levothyroxine Initiation: Start Levothyroxine 25–50 mcg once daily (12.5–25 mcg if severe cardiac disease). Titrate by 12.5–25 mcg every 6–8 weeks based on TSH.`;
        rxAr = `بدء محافظ: ليفوثيروكسين 25 إلى 50 ميكروجرام يومياً (12.5-25 ميكروجرام للحالات القلبية الشديدة) وتزاد الجرعة بمقدار 12.5-25 كل 6-8 أسابيع حسب TSH.`;

        addAlert({
          id: 'thyroid-conservative-start',
          level: 'warning',
          titleEn: `Conservative Dosing Guardrail: Elderly / Known ASCVD (Age ${age})`,
          titleAr: `تنبيه جرعة محافظة: كبار السن أو مرضى القلب (العمر ${age})`,
          messageEn: `Full weight-based replacement (1.6 mcg/kg = ~${fullDoseMcg} mcg) can precipitate myocardial ischemia, angina, or fatal cardiac arrhythmias in elderly patients or those with coronary artery disease. Start conservatively at 25–50 mcg/day and titrate slowly.`,
          messageAr: `الجرعة الكاملة حسب الوزن (~${fullDoseMcg} ميكروجرام) قد تسبب ذبحة صدرية أو تسارعاً خطيراً في نبضات القلب لدى كبار السن ومرضى الشرايين. ابدأ بجرعة منخفضة 25-50 ميكروجرام وتدرج ببطء.`,
          actionEn: 'Start Levothyroxine at 25–50 mcg/day; titrate every 6–8 weeks.',
          actionAr: 'ابدأ بجرعة 25-50 ميكروجرام يومياً وتابع بالتحليل كل 6-8 أسابيع.'
        });
      } else {
        recommendedDose = fullDoseMcg;
        rxEn = `Full Replacement: Levothyroxine ~${fullDoseMcg} mcg (~1.6 mcg/kg/day) once daily on an empty stomach with plain water 30–60 minutes before breakfast. Recheck TSH in 6–8 weeks.`;
        rxAr = `جرعة تعويضية كاملة: ليفوثيروكسين ~${fullDoseMcg} ميكروجرام (1.6 ميكروجرام/كجم/يوم) يومياً على معدة فارغة مع ماء فقط قبل الإفطار بـ 30-60 دقيقة. يعاد تحليل TSH بعد 6-8 أسابيع.`;
      }
    }

    // Hyperthyroidism Management & Propranolol Guardrail
    if (status === 'overt_hyper') {
      let thionamideEn = '';
      let thionamideAr = '';

      if (isPregnant && trimester === 1) {
        thionamideEn = 'Propylthiouracil (PTU) 50–100 mg tid is preferred in 1st trimester (lower teratogenicity than Carbimazole).';
        thionamideAr = 'بروبيل ثيويوراسيل (PTU) 50-100 مجم 3 مرات يومياً في الثلث الأول من الحمل لتجنب تشوهات الأجنة.';
      } else {
        thionamideEn = 'Carbimazole 15–30 mg daily (or Methimazole 10–20 mg daily) is drug of choice (lower hepatotoxicity risk than PTU).';
        thionamideAr = 'كاربيميزول 15-30 مجم يومياً (أو ميثيمازول 10-20 مجم) هو الخيار الأول لقلة مخاطره على الكبد مقارنة بـ PTU.';
      }

      // Propranolol vs Asthma/COPD Guardrail
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

  // --- 4. Master Primary Care Aggregator ---
  function evaluatePrimaryCare(patientInput) {
    const p = patientInput || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});

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

  // --- 5. Interactive Primary Care Tab UI Renderer ---
  function renderPrimaryCareTab(containerId) {
    if (typeof document === 'undefined') return;
    const cid = containerId || 'primary-care-container';
    const container = document.getElementById(cid);
    if (!container) return;

    const pt = (typeof window.PatientSync !== 'undefined' && typeof window.PatientSync.get === 'function') ? window.PatientSync.get() : {};
    const isAr = (typeof window.I18n !== 'undefined' && typeof window.I18n.getLang === 'function')
      ? window.I18n.getLang() === 'ar'
      : true;

    container.innerHTML = `
      <div class="primary-care-suite" style="margin-bottom:20px;">
        <div class="panel" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <h2 style="margin:0 0 4px 0;">🫁 ${isAr ? 'بروتوكولات الرعاية الأولية (الربو، السدة الرئوية، الغدة الدرقية)' : 'Primary Care Protocols (Asthma GINA, COPD GOLD, Thyroid)'}</h2>
              <p class="sub" style="margin:0;">${isAr ? 'أدوات تصعيد البخاخات (MART) وتقييم GOLD 2024 وحساب جرعات الليفوثيروكسين' : 'Interactive Asthma GINA Track 1 MART, COPD GOLD Group A/B/E, and Thyroid management'}</p>
            </div>
          </div>
          <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;" id="pc-subtabs">
            <button type="button" class="filter-chip active" data-pc-tab="asthma">🌬️ ${isAr ? 'الربو القصبي (GINA 2024)' : 'Asthma (GINA)'}</button>
            <button type="button" class="filter-chip" data-pc-tab="copd">🫁 ${isAr ? 'السدة الرئوية (GOLD 2024)' : 'COPD (GOLD)'}</button>
            <button type="button" class="filter-chip" data-pc-tab="thyroid">🦋 ${isAr ? 'الغدة الدرقية (Thyroid)' : 'Thyroid'}</button>
          </div>
        </div>

        <!-- 1. Asthma Panel -->
        <div class="panel" id="pc-panel-asthma">
          <div class="ph" style="--c:var(--sky);--cs:var(--sky-soft)"><span class="ic">🌬️</span><h2>${isAr ? 'مُصعّد علاج الربو (GINA 2024 Track 1 MART)' : 'GINA 2024 Asthma Controller Escalator'}</h2></div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:10px; margin:12px 0;">
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'مرات الفنتولين أسبوعياً (SABA):' : 'SABA puffs/week:'}</label>
              <input type="number" id="pc-asthma-saba" value="2" min="0" max="50" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'الخطوة العلاجية الحالية:' : 'Current Step:'}</label>
              <select id="pc-asthma-step" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
                <option value="1">Step 1</option>
                <option value="2" selected>Step 2</option>
                <option value="3">Step 3</option>
                <option value="4">Step 4</option>
                <option value="5">Step 5</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'مسار العلاج:' : 'Treatment Track:'}</label>
              <select id="pc-asthma-track" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
                <option value="1" selected>${isAr ? 'المسار 1 (MART - المفضل)' : 'Track 1 (MART Preferred)'}</option>
                <option value="2">${isAr ? 'المسار 2 (البديل SABA)' : 'Track 2 (Alternative)'}</option>
              </select>
            </div>
          </div>
          <div style="display:flex; gap:14px; flex-wrap:wrap; font-size:13px; margin-bottom:12px;">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="pc-asthma-day"> <span>${isAr ? 'أعراض نهارية > مرتين/أسبوع' : 'Daytime symptoms >2x/wk'}</span></label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="pc-asthma-night"> <span>${isAr ? 'استيقاظ ليلي بسبب الربو' : 'Night waking'}</span></label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="pc-asthma-limit"> <span>${isAr ? 'تقييد النشاط اليومي' : 'Activity limitation'}</span></label>
          </div>
          <div id="pc-asthma-output" style="background:var(--surface2); padding:12px; border-radius:8px; border:1px solid var(--border);"></div>
        </div>

        <!-- 2. COPD Panel -->
        <div class="panel" id="pc-panel-copd" style="display:none;">
          <div class="ph" style="--c:var(--teal);--cs:var(--teal-soft)"><span class="ic">🫁</span><h2>${isAr ? 'مقيّم السدة الرئوية المزمنة (GOLD 2024 A/B/E)' : 'GOLD 2024 COPD Group Classifier'}</h2></div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin:12px 0;">
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'النوبات المتوسطة آخر سنة:' : 'Exacerbations/yr:'}</label>
              <input type="number" id="pc-copd-exac" value="1" min="0" max="20" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'دخول المستشفى (آخر سنة):' : 'Hospitalizations/yr:'}</label>
              <input type="number" id="pc-copd-hosp" value="0" min="0" max="10" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">mMRC Dyspnea (0–4):</label>
              <input type="number" id="pc-copd-mmrc" value="2" min="0" max="4" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">CAT Score (0–40):</label>
              <input type="number" id="pc-copd-cat" value="14" min="0" max="40" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'الحمضات بالدم (Eosinophils/µL):' : 'Blood Eosinophils (/µL):'}</label>
              <input type="number" id="pc-copd-eos" value="180" min="0" max="2000" step="10" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
          </div>
          <div id="pc-copd-output" style="background:var(--surface2); padding:12px; border-radius:8px; border:1px solid var(--border);"></div>
        </div>

        <!-- 3. Thyroid Panel -->
        <div class="panel" id="pc-panel-thyroid" style="display:none;">
          <div class="ph" style="--c:var(--grape);--cs:var(--grape-soft)"><span class="ic">🦋</span><h2>${isAr ? 'تقييم الغدة الدرقية والليفوثيروكسين (ATA / AACE)' : 'Thyroid Disease & Levothyroxine Dosing'}</h2></div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin:12px 0;">
            <div>
              <label style="font-size:12px; color:var(--muted);">TSH (mIU/L):</label>
              <input type="number" id="pc-thy-tsh" value="6.8" step="0.1" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">Free T4 (ng/dL):</label>
              <input type="number" id="pc-thy-ft4" value="1.1" step="0.1" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'الوزن (كجم):' : 'Weight (kg):'}</label>
              <input type="number" id="pc-thy-wt" value="${pt.wt || 75}" style="width:100%; padding:6px 8px; border-radius:6px; border:1px solid var(--border);">
            </div>
          </div>
          <div style="display:flex; gap:14px; flex-wrap:wrap; font-size:13px; margin-bottom:12px;">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="pc-thy-ascvd" ${pt.ascvd ? 'checked' : ''}> <span>${isAr ? 'أمراض شرايين القلب / كبار السن' : 'ASCVD / Elderly'}</span></label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="pc-thy-preg" ${pt.pregnancy ? 'checked' : ''}> <span>${isAr ? 'حامل (Pregnancy)' : 'Pregnant'}</span></label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="pc-thy-asthma" ${pt.asthma ? 'checked' : ''}> <span>${isAr ? 'مريض ربو (Asthma)' : 'Asthma'}</span></label>
          </div>
          <div id="pc-thy-output" style="background:var(--surface2); padding:12px; border-radius:8px; border:1px solid var(--border);"></div>
        </div>
      </div>
    `;

    function updatePrimaryCareUi() {
      // Asthma eval
      const saba = parseFloat(document.getElementById('pc-asthma-saba')?.value) || 0;
      const step = parseInt(document.getElementById('pc-asthma-step')?.value, 10) || 2;
      const track = parseInt(document.getElementById('pc-asthma-track')?.value, 10) || 1;
      const day = !!document.getElementById('pc-asthma-day')?.checked;
      const night = !!document.getElementById('pc-asthma-night')?.checked;
      const limit = !!document.getElementById('pc-asthma-limit')?.checked;

      const aRes = evaluateAsthmaGina({
        sabaUsePerWeek: saba,
        asthmaReliever: saba > 2,
        asthmaDaytime: day,
        asthmaNightWaking: night,
        asthmaActivityLimit: limit,
        currentStep: step,
        preferredTrack: track
      });

      const aOut = document.getElementById('pc-asthma-output');
      if (aOut) {
        const aColor = aRes.controlLevel === 'uncontrolled' ? '#DC2626' : (aRes.controlLevel === 'partly_controlled' ? '#D97706' : '#16A34A');
        const alertsHtml = (aRes.alerts || []).map(al => `<div style="margin-top:8px; padding:8px; border-radius:6px; background:#FEF2F2; color:#991B1B; font-size:12px; border:1px solid #FCA5A5;">🚨 <b>${isAr ? al.titleAr : al.titleEn}:</b> ${isAr ? al.messageAr : al.messageEn}</div>`).join('');
        aOut.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
            <span style="font-weight:700; color:${aColor}; font-size:14px;">${isAr ? aRes.controlNameAr : aRes.controlNameEn}</span>
            <span style="font-size:12px; font-weight:700; padding:2px 8px; border-radius:4px; background:var(--teal); color:#fff;">Step ${aRes.recommendedStep}</span>
          </div>
          <div style="margin-top:8px; font-size:13px;"><b>${isAr ? 'العلاج الموصى به:' : 'Recommended Regimen:'}</b> ${isAr ? (aRes.stepDetails?.nameAr || aRes.rxAr) : (aRes.stepDetails?.nameEn || aRes.rxEn)}</div>
          <div style="margin-top:4px; font-size:12px; color:var(--muted);">${isAr ? (aRes.stepDetails?.descAr || '') : (aRes.stepDetails?.descEn || '')}</div>
          ${alertsHtml}
        `;
      }

      // COPD eval
      const exac = parseInt(document.getElementById('pc-copd-exac')?.value, 10) || 0;
      const hosp = parseInt(document.getElementById('pc-copd-hosp')?.value, 10) || 0;
      const mmrc = parseInt(document.getElementById('pc-copd-mmrc')?.value, 10) || 0;
      const cat = parseInt(document.getElementById('pc-copd-cat')?.value, 10) || 0;
      const eos = parseInt(document.getElementById('pc-copd-eos')?.value, 10) || 0;

      const cRes = evaluateCopdGold({
        exacerbationsLastYear: exac,
        hospitalizationsLastYear: hosp,
        mmrcScore: mmrc,
        catScore: cat,
        eosinophilsPerUl: eos
      });

      const cOut = document.getElementById('pc-copd-output');
      if (cOut) {
        const cAlerts = (cRes.alerts || []).map(al => `<div style="margin-top:8px; padding:8px; border-radius:6px; background:#FFFBEB; color:#92400E; font-size:12px; border:1px solid #FDE68A;">⚠️ <b>${isAr ? al.titleAr : al.titleEn}:</b> ${isAr ? al.messageAr : al.messageEn}</div>`).join('');
        cOut.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; font-size:14px; color:var(--teal);">${isAr ? cRes.groupNameAr : cRes.groupNameEn}</span>
            <span style="font-size:12px; padding:2px 8px; border-radius:4px; background:var(--sky); color:#fff;">Group ${cRes.group}</span>
          </div>
          <div style="margin-top:8px; font-size:13px;"><b>${isAr ? 'العلاج القياسي:' : 'Therapy:'}</b> ${isAr ? cRes.rxAr : cRes.rxEn}</div>
          ${cAlerts}
        `;
      }

      // Thyroid eval
      const tsh = parseFloat(document.getElementById('pc-thy-tsh')?.value) || 2.5;
      const ft4 = parseFloat(document.getElementById('pc-thy-ft4')?.value) || 1.1;
      const twt = parseFloat(document.getElementById('pc-thy-wt')?.value) || 70;
      const ascvd = !!document.getElementById('pc-thy-ascvd')?.checked;
      const tPreg = !!document.getElementById('pc-thy-preg')?.checked;
      const tAsthma = !!document.getElementById('pc-thy-asthma')?.checked;

      const tRes = evaluateThyroid({
        tsh: tsh,
        ft4: ft4,
        wt: twt,
        ascvd: ascvd,
        pregnancy: tPreg,
        asthma: tAsthma
      });

      const tOut = document.getElementById('pc-thy-output');
      if (tOut) {
        const tAlerts = (tRes.alerts || []).map(al => `<div style="margin-top:8px; padding:8px; border-radius:6px; background:#FEF2F2; color:#991B1B; font-size:12px; border:1px solid #FCA5A5;">🚨 <b>${isAr ? al.titleAr : al.titleEn}:</b> ${isAr ? al.messageAr : al.messageEn}</div>`).join('');
        tOut.innerHTML = `
          <div style="font-weight:700; font-size:14px; color:var(--grape);">${isAr ? tRes.statusNameAr : tRes.statusNameEn}</div>
          <div style="margin-top:8px; font-size:13px;"><b>${isAr ? 'الخطة العلاجية:' : 'Management:'}</b> ${isAr ? tRes.rxAr : tRes.rxEn}</div>
          ${tAlerts}
        `;
      }
    }

    // Bind subtab switcher
    container.querySelectorAll('[data-pc-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-pc-tab');
        container.querySelectorAll('[data-pc-tab]').forEach(b => b.classList.toggle('active', b === btn));
        ['asthma', 'copd', 'thyroid'].forEach(p => {
          const el = document.getElementById('pc-panel-' + p);
          if (el) el.style.display = (p === target) ? 'block' : 'none';
        });
      });
    });

    // Bind inputs
    container.querySelectorAll('input, select').forEach(inp => {
      inp.addEventListener('input', updatePrimaryCareUi);
      inp.addEventListener('change', updatePrimaryCareUi);
    });

    updatePrimaryCareUi();
  }

  return {
    evaluateAsthmaGina,
    evaluateCopdGold,
    evaluateThyroid,
    evaluatePrimaryCare,
    renderPrimaryCareTab
  };
})();

if (typeof window !== 'undefined') {
  window.OsrawyPrimaryCareEngine = OsrawyPrimaryCareEngine;
  window.PrimaryCareEngine = OsrawyPrimaryCareEngine;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OsrawyPrimaryCareEngine;
}
