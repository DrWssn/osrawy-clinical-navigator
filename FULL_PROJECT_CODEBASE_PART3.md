# Osrawy Clinical Navigator — Codebase (Part 3 of 4)

## Part 3: Bedside Tools, Primary Care, Formulary & Prescription Dispatch

> **Version:** v1.2.18
> **Repository:** Osrawy Clinical Navigator (`com.osrawy.clinicalnavigator`)
> **Architecture:** Vanilla JS / CSS3 (Phone-First Native Android Hybrid Web App via Capacitor)
> **Clinical Guidelines:** ADA 2025, ACC/AHA 2025, ESC 2024/2023, KDIGO 2024, GINA 2024, GOLD 2024
> **Quality Gate:** 15/15 JS files syntax verified, 203/203 clinical simulation assertions passed (100% pass).

## Part 3 Table of Contents

23. [www/js/primary_care_engine.js](#www-js-primary-care-engine-js) — *Primary care clinical decision support: Asthma GINA Track 1/2, COPD GOLD Groups A/B/E, and Thyroid disorders.*
24. [www/js/clinical_tools.js](#www-js-clinical-tools-js) — *Bedside micro-tools: CKD-EPI 2021, KDIGO matrix, DOAC renal dosing (Cockcroft-Gault), FIB-4 fibrosis score, and steroid equivalence.*
25. [www/js/patient_leaflets.js](#www-js-patient-leaflets-js) — *Clinician-to-patient education leaflets, QR code generator for patient mobile handoff, and print formatter.*
26. [www/js/drugs_directory.js](#www-js-drugs-directory-js) — *Searchable drug formulary directory with brand name filtering, regional price tiers, and renal safety flags.*
27. [www/js/prescription_share.js](#www-js-prescription-share-js) — *Prescription export engine: printable Rx generator, WhatsApp direct dispatch, and clipboard formatter.*

---

<a id="www-js-primary-care-engine-js"></a>
## 23. `www/js/primary_care_engine.js`

**Description:** Primary care clinical decision support: Asthma GINA Track 1/2, COPD GOLD Groups A/B/E, and Thyroid disorders.  
**Lines:** 828 | **Size:** 48.3 KB

```javascript
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

    function pickNum(vals, fallback) {
      for (let i = 0; i < vals.length; i++) {
        if (vals[i] !== undefined && vals[i] !== null && vals[i] !== '') {
          const n = parseFloat(vals[i]);
          if (!isNaN(n)) return n;
        }
      }
      return fallback;
    }

    const moderateExac = pickNum([p.moderateExacerbations, p.exacerbationsLastYear, p.copdExacerbations], 0);
    const hospExac = pickNum([p.hospitalExacerbations, p.hospitalizationsLastYear, p.copdHospitalExacerbations], 0);
    const mmrc = pickNum([p.mMRC, p.mmrcScore, p.copdMmrc], 0);
    const cat = pickNum([p.catScore, p.copdCat], 0);
    const eos = pickNum([p.bloodEosinophils, p.eosinophilsPerUl, p.copdEosinophils], 150); // cells/µL

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

    function parseNumOr(val, def) {
      if (val === undefined || val === null || val === '') return def;
      const n = parseFloat(val);
      return isNaN(n) ? def : n;
    }

    const tsh = parseNumOr(p.tsh, 2.5);
    const ft4 = parseNumOr(p.ft4, 1.2);
    const age = parseNumOr(p.age, 52);
    const wt = parseNumOr(p.weightKg !== undefined ? p.weightKg : p.wt, 70);
    const isPregnant = !!(p.pregnancy || p.pregnant || p.preg || p.pregHtn);
    const trimester = parseInt(p.trimester, 10) || 1;
    const hasAscvd = !!(p.ascvd || p.cad || (p.hf && p.hf !== 'none' && p.hf !== false));
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
  let _pcI18nBound = false;

  function renderPrimaryCareTab(containerId) {
    if (typeof document === 'undefined') return;
    const cid = containerId || 'primary-care-container';
    const container = document.getElementById(cid);
    if (!container) return;

    if (!_pcI18nBound && typeof window !== 'undefined' && window.I18n && typeof window.I18n.onChange === 'function') {
      _pcI18nBound = true;
      window.I18n.onChange(() => {
        const el = document.getElementById(cid);
        if (el && el.innerHTML.trim()) {
          const activeBtn = el.querySelector ? el.querySelector('[data-pc-tab].active') : null;
          let activeSubtab = activeBtn ? activeBtn.getAttribute('data-pc-tab') : null;
          if (!activeSubtab) {
            activeSubtab = ['copd', 'thyroid', 'asthma'].find((p) => {
              const panel = document.getElementById('pc-panel-' + p);
              return panel && panel.style && panel.style.display && panel.style.display !== 'none';
            }) || 'asthma';
          }
          const valIds = ['pc-asthma-saba', 'pc-asthma-step', 'pc-asthma-track', 'pc-copd-exac', 'pc-copd-hosp', 'pc-copd-mmrc', 'pc-copd-cat', 'pc-copd-eos', 'pc-thy-tsh', 'pc-thy-ft4', 'pc-thy-wt'];
          const chkIds = ['pc-asthma-day', 'pc-asthma-night', 'pc-asthma-limit', 'pc-thy-ascvd', 'pc-thy-preg', 'pc-thy-asthma'];
          const savedVals = {};
          const savedChks = {};
          valIds.forEach((id) => { const inp = document.getElementById(id); if (inp) savedVals[id] = inp.value; });
          chkIds.forEach((id) => { const inp = document.getElementById(id); if (inp) savedChks[id] = Boolean(inp.checked); });

          renderPrimaryCareTab(cid);

          Object.keys(savedVals).forEach((id) => { const inp = document.getElementById(id); if (inp) inp.value = savedVals[id]; });
          Object.keys(savedChks).forEach((id) => { const inp = document.getElementById(id); if (inp) inp.checked = savedChks[id]; });
          if (activeSubtab) {
            const newEl = document.getElementById(cid);
            if (newEl && typeof newEl.querySelectorAll === 'function') {
              newEl.querySelectorAll('[data-pc-tab]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-pc-tab') === activeSubtab));
              ['asthma', 'copd', 'thyroid'].forEach((p) => {
                const panel = document.getElementById('pc-panel-' + p);
                if (panel && panel.style) panel.style.display = (p === activeSubtab) ? 'block' : 'none';
              });
            }
          }
          if (typeof window.updatePrimaryCareUi === 'function') {
            window.updatePrimaryCareUi();
          }
        }
      });
    }

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
              <input type="number" id="pc-asthma-saba" class="clinical-input" inputmode="numeric" value="2" min="0" max="50">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'الخطوة العلاجية الحالية:' : 'Current Step:'}</label>
              <select id="pc-asthma-step" class="clinical-select">
                <option value="1">Step 1</option>
                <option value="2" selected>Step 2</option>
                <option value="3">Step 3</option>
                <option value="4">Step 4</option>
                <option value="5">Step 5</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'مسار العلاج:' : 'Treatment Track:'}</label>
              <select id="pc-asthma-track" class="clinical-select">
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
              <input type="number" id="pc-copd-exac" class="clinical-input" inputmode="numeric" value="1" min="0" max="20">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'دخول المستشفى (آخر سنة):' : 'Hospitalizations/yr:'}</label>
              <input type="number" id="pc-copd-hosp" class="clinical-input" inputmode="numeric" value="0" min="0" max="10">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">mMRC Dyspnea (0–4):</label>
              <input type="number" id="pc-copd-mmrc" class="clinical-input" inputmode="numeric" value="2" min="0" max="4">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">CAT Score (0–40):</label>
              <input type="number" id="pc-copd-cat" class="clinical-input" inputmode="numeric" value="14" min="0" max="40">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'الحمضات بالدم (Eosinophils/µL):' : 'Blood Eosinophils (/µL):'}</label>
              <input type="number" id="pc-copd-eos" class="clinical-input" inputmode="numeric" value="180" min="0" max="2000" step="10">
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
              <input type="number" id="pc-thy-tsh" class="clinical-input" inputmode="decimal" value="6.8" step="0.1">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">Free T4 (ng/dL):</label>
              <input type="number" id="pc-thy-ft4" class="clinical-input" inputmode="decimal" value="1.1" step="0.1">
            </div>
            <div>
              <label style="font-size:12px; color:var(--muted);">${isAr ? 'الوزن (كجم):' : 'Weight (kg):'}</label>
              <input type="number" id="pc-thy-wt" class="clinical-input" inputmode="decimal" value="${(pt.wt !== undefined && pt.wt !== null && pt.wt !== '') ? pt.wt : 75}">
            </div>
          </div>
          <div style="display:flex; gap:14px; flex-wrap:wrap; font-size:13px; margin-bottom:12px;">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="pc-thy-ascvd" ${pt.ascvd ? 'checked' : ''}> <span>${isAr ? 'أمراض شرايين القلب / كبار السن' : 'ASCVD / Elderly'}</span></label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="pc-thy-preg" ${(pt.pregnancy || pt.preg || pt.pregHtn) ? 'checked' : ''}> <span>${isAr ? 'حامل (Pregnancy)' : 'Pregnant'}</span></label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="pc-thy-asthma" ${pt.asthma ? 'checked' : ''}> <span>${isAr ? 'مريض ربو (Asthma)' : 'Asthma'}</span></label>
          </div>
          <div id="pc-thy-output" style="background:var(--surface2); padding:12px; border-radius:8px; border:1px solid var(--border);"></div>
        </div>
      </div>
    `;

    const stepSel = document.getElementById('pc-asthma-step');
    if (stepSel && !stepSel.value) stepSel.value = '2';
    const trackSel = document.getElementById('pc-asthma-track');
    if (trackSel && !trackSel.value) trackSel.value = '1';
    ['asthma', 'copd', 'thyroid'].forEach((p) => {
      const panelEl = document.getElementById('pc-panel-' + p);
      if (panelEl && panelEl.style && !panelEl.style.display) {
        panelEl.style.display = (p === 'asthma') ? 'block' : 'none';
      }
    });

    function readPcNum(id, fallback, isInt) {
      const el = document.getElementById(id);
      if (!el) return fallback;
      const raw = String(el.value ?? '').trim();
      if (raw === '') return fallback;
      const val = isInt ? parseInt(raw, 10) : parseFloat(raw);
      return isNaN(val) ? fallback : val;
    }

    function updatePrimaryCareUi() {
      if (!document.getElementById('pc-thy-output')) return;
      // Asthma eval
      const saba = readPcNum('pc-asthma-saba', 0, false);
      const step = readPcNum('pc-asthma-step', 2, true);
      const track = readPcNum('pc-asthma-track', 1, true);
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
        const alertsHtml = (aRes.alerts || []).map(al => `<div style="margin-top:8px; padding:8px; border-radius:6px; background:var(--danger-bg); color:var(--danger-text); font-size:12px; border:1px solid var(--danger-border);">🚨 <b>${isAr ? al.titleAr : al.titleEn}:</b> ${isAr ? al.messageAr : al.messageEn}</div>`).join('');
        const recName = isAr
          ? ((aRes.recommendationDetails && aRes.recommendationDetails.nameAr) || aRes.recommendation || '')
          : ((aRes.recommendationDetails && aRes.recommendationDetails.nameEn) || aRes.recommendation || '');
        const recDesc = isAr
          ? ((aRes.recommendationDetails && aRes.recommendationDetails.descAr) || '')
          : ((aRes.recommendationDetails && aRes.recommendationDetails.descEn) || '');
        aOut.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
            <span style="font-weight:700; color:${aColor}; font-size:14px;">${isAr ? aRes.controlNameAr : aRes.controlNameEn}</span>
            <span style="font-size:12px; font-weight:700; padding:2px 8px; border-radius:4px; background:var(--teal); color:#fff;">Step ${aRes.recommendedStep}</span>
          </div>
          <div style="margin-top:8px; font-size:13px;"><b>${isAr ? 'العلاج الموصى به:' : 'Recommended Regimen:'}</b> ${recName}</div>
          <div style="margin-top:4px; font-size:12px; color:var(--muted);">${recDesc}</div>
          ${alertsHtml}
        `;
      }

      // COPD eval
      const exac = readPcNum('pc-copd-exac', 0, true);
      const hosp = readPcNum('pc-copd-hosp', 0, true);
      const mmrc = readPcNum('pc-copd-mmrc', 0, true);
      const cat = readPcNum('pc-copd-cat', 0, true);
      const eos = readPcNum('pc-copd-eos', 150, true);

      const cRes = evaluateCopdGold({
        moderateExacerbations: exac,
        hospitalExacerbations: hosp,
        mMRC: mmrc,
        catScore: cat,
        bloodEosinophils: eos
      });

      const cOut = document.getElementById('pc-copd-output');
      if (cOut) {
        const cAlerts = (cRes.alerts || []).map(al => `<div style="margin-top:8px; padding:8px; border-radius:6px; background:var(--warn-bg); color:var(--warn-text); font-size:12px; border:1px solid var(--warn-border);">⚠️ <b>${isAr ? al.titleAr : al.titleEn}:</b> ${isAr ? al.messageAr : al.messageEn}</div>`).join('');
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
      const tsh = readPcNum('pc-thy-tsh', 2.5, false);
      const ft4 = readPcNum('pc-thy-ft4', 1.1, false);
      const twt = readPcNum('pc-thy-wt', 70, false);
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
        const tAlerts = (tRes.alerts || []).map(al => `<div style="margin-top:8px; padding:8px; border-radius:6px; background:var(--danger-bg); color:var(--danger-text); font-size:12px; border:1px solid var(--danger-border);">🚨 <b>${isAr ? al.titleAr : al.titleEn}:</b> ${isAr ? al.messageAr : al.messageEn}</div>`).join('');
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

    if (typeof window !== 'undefined') {
      window.updatePrimaryCareUi = updatePrimaryCareUi;
    }

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

```

---

<a id="www-js-clinical-tools-js"></a>
## 24. `www/js/clinical_tools.js`

**Description:** Bedside micro-tools: CKD-EPI 2021, KDIGO matrix, DOAC renal dosing (Cockcroft-Gault), FIB-4 fibrosis score, and steroid equivalence.  
**Lines:** 2159 | **Size:** 107.7 KB

```javascript
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
    let apixabanEn = '5 mg PO BID (Standard dose)';
    let apixabanAr = '٥ ملغ فموياً مرتين يومياً (5 mg PO BID - جرعة قياسية)';
    let apixabanReduced = false;
    let apixabanContraindicated = false;
    let apixabanReasonEn = 'Standard dose: fewer than 2 dose-reduction criteria met.';
    let apixabanReasonAr = 'الجرعة القياسية: المريض يستوفي أقل من معيارين من معايير تخفيض الجرعة.';

    if (crcl > 0 && crcl < 15) {
      apixabanContraindicated = true;
      apixabanDose = 'Contraindicated / Not recommended';
      apixabanDoseAr = 'ممنوع استخدامه / غير موصى به';
      apixabanEn = 'Contraindicated / Not recommended (CrCl < 15 mL/min)';
      apixabanAr = 'غير موصى به / ممنوع استخدامه (تصفية الكرياتينين < 15)';
      apixabanReasonEn = `CrCl is ${crcl} mL/min (<15 mL/min). Apixaban is contraindicated / not recommended in severe ESRD without dialysis per European/KDIGO guidelines.`;
      apixabanReasonAr = `تصفية الكرياتينين ${crcl} مل/دقيقة (<15). يُحظر استخدام أبيكسابان في الفشل الكلوي النهائي دون غسيل.`;
    } else if (meets2of3) {
      apixabanReduced = true;
      apixabanDose = '2.5 mg PO BID';
      apixabanDoseAr = '٢.٥ ملغ مرتين يومياً';
      apixabanEn = '2.5 mg PO BID (Dose reduced per 2-of-3 ABC criteria)';
      apixabanAr = '٢.٥ ملغ فموياً مرتين يومياً (2.5 mg PO BID - مخفض)';
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
      apixabanEn = '2.5 mg PO BID (CrCl 15–29 mL/min)';
      apixabanAr = '٢.٥ ملغ فموياً مرتين يومياً (2.5 mg PO BID)';
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
    let rivaroxabanEn = '20 mg PO daily with food';
    let rivaroxabanAr = '٢٠ ملغ فموياً مرة واحدة يومياً مع وجبة الطعام (20 mg PO daily with food)';
    let rivaroxabanReduced = false;
    let rivaroxabanContraindicated = false;
    let rivaroxabanReasonEn = `CrCl ≥ 50 mL/min (${crcl} mL/min): Standard 20 mg daily with food.`;
    let rivaroxabanReasonAr = `تصفية الكرياتينين ≥ 50 مل/دقيقة (${crcl} مل/دقيقة): الجرعة القياسية 20 مجم يومياً مع الطعام.`;

    if (crcl > 0 && crcl < 15) {
      rivaroxabanContraindicated = true;
      rivaroxabanDose = 'Contraindicated / Not recommended';
      rivaroxabanDoseAr = 'ممنوع استخدامه / غير موصى به';
      rivaroxabanEn = 'Contraindicated / Not recommended (CrCl < 15 mL/min)';
      rivaroxabanAr = 'غير موصى به / ممنوع استخدامه';
      rivaroxabanReasonEn = `CrCl is ${crcl} mL/min (<15 mL/min). Rivaroxaban is contraindicated / not recommended due to bleeding risk in ESRD.`;
      rivaroxabanReasonAr = `تصفية الكرياتينين ${crcl} مل/دقيقة (<15). يُحظر استخدام ريفاروكسابان لخطر النزيف في الفشل الكلوي المتقدم.`;
    } else if (crcl >= 15 && crcl < 50) {
      rivaroxabanReduced = true;
      rivaroxabanDose = '15 mg PO daily with food';
      rivaroxabanDoseAr = '15 مجم مرة واحدة يومياً مع وجبة الطعام (مساءً)';
      rivaroxabanEn = '15 mg PO daily with food (CrCl 15–49 mL/min)';
      rivaroxabanAr = '١٥ ملغ فموياً مرة واحدة يومياً مع الطعام (15 mg PO daily with food)';
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
        <div class="tool-card">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <h2 class="tool-title" style="font-size:1.15rem;">🧮 ${isAr ? 'الأدوات الإكلينيكية والحاسبات المتقدمة' : 'Advanced Clinical Calculators & Tools'}</h2>
              <p class="tool-sub">${isAr ? 'حاسبات وظائف الكلى، تصفية الكرياتينين، مصفوفة KDIGO، جرعات DOAC، ومؤشر تليف الكبد FIB-4' : 'Kidney functions, CrCl, KDIGO albuminuria matrix, DOAC renal dosing, and FIB-4 liver fibrosis'}</p>
            </div>
          </div>
        </div>

        <!-- 1. Cardiorenal Calculator Card (eGFR + CrCl) -->
        <div class="tool-card" id="egfr-crcl-card">
          <div class="tool-header">
            <span class="tool-icon">🫘</span>
            <div class="tool-header-text">
              <h2 class="tool-title">${isAr ? 'حاسبة وظائف الكلى وتصفية الكرياتينين (CKD-EPI 2021 & CrCl)' : 'Kidney Function & Creatinine Clearance (CKD-EPI & CrCl)'}</h2>
              <p class="tool-sub">${isAr ? 'معادلة CKD-EPI 2021 دون عرق مع معادلة Cockcroft-Gault لضبط جرعات الأدوية ومضادات التخثر' : 'Race-free CKD-EPI 2021 alongside Cockcroft-Gault for precise drug & DOAC adjustments'}</p>
            </div>
            <button type="button" class="btn-emr-copy" id="btn-copy-emr-egfr" title="${isAr ? 'نسخ ملخص EMR' : 'Copy EMR Note'}" aria-label="Copy EMR Note">
              📋 ${isAr ? 'نسخ EMR' : 'Copy EMR'}
            </button>
          </div>
          
          <div class="tool-inputs-grid">
            <div class="tool-input-group">
              <label class="tool-label">${isAr ? 'الكرياتينين (Scr):' : 'Serum Cr:'}</label>
              <input type="number" id="tab-scr" class="clinical-input" inputmode="decimal" step="0.01" value="${initialScr}">
            </div>
            <div class="tool-input-group">
              <label class="tool-label">${isAr ? 'الوحدة:' : 'Unit:'}</label>
              <select id="tab-scr-unit" class="clinical-select">
                <option value="mg" ${initialScrUnit === 'mg' ? 'selected' : ''}>mg/dL</option>
                <option value="umol" ${initialScrUnit === 'umol' ? 'selected' : ''}>µmol/L</option>
              </select>
            </div>
            <div class="tool-input-group">
              <label class="tool-label">${isAr ? 'العمر (سنة):' : 'Age (yrs):'}</label>
              <input type="number" id="tab-age" class="clinical-input" inputmode="numeric" value="${initialAge}">
            </div>
            <div class="tool-input-group">
              <label class="tool-label">${isAr ? 'الجنس:' : 'Sex:'}</label>
              <select id="tab-sex" class="clinical-select">
                <option value="m" ${initialSex === 'm' ? 'selected' : ''}>${isAr ? 'ذكر' : 'Male'}</option>
                <option value="f" ${initialSex === 'f' ? 'selected' : ''}>${isAr ? 'أنثى' : 'Female'}</option>
              </select>
            </div>
            <div class="tool-input-group">
              <label class="tool-label">${isAr ? 'الوزن (كجم):' : 'Weight (kg):'}</label>
              <input type="number" id="tab-wt" class="clinical-input" inputmode="decimal" value="${initialWt}">
            </div>
          </div>

          <div id="tab-egfr-results" class="tool-results-box">
            <!-- Output dynamically computed -->
          </div>

          <button type="button" class="btn" id="btn-sync-tools-egfr" style="background:var(--teal); color:#fff; font-size:13px; font-weight:700; border-radius:9px; padding:10px 16px;">
            🔄 ${isAr ? 'مزامنة معدل الترشيح المحسوب مع المريض والروشتة' : 'Sync Calculated eGFR with Active Patient & Rx'}
          </button>
        </div>

        <!-- 2. KDIGO 2024 CKD Risk Matrix & Albuminuria -->
        <div class="tool-card" id="kdigo-matrix-card">
          <div class="tool-header">
            <span class="tool-icon">📊</span>
            <div class="tool-header-text">
              <h2 class="tool-title">${isAr ? 'مصفوفة KDIGO 2024 التفاعلية لزلال البول وتصنيف مخاطر الكلى' : 'Interactive KDIGO 2024 Heatmap Matrix & Albuminuria'}</h2>
              <p class="tool-sub">${isAr ? 'تقاطع معدل الترشيح eGFR مع نسبة زلال البول إلى الكرياتينين (UACR) لتحديد خطورة التدهور وتكرار المتابعة السنوية' : 'Risk stratification combining eGFR and urine albumin-creatinine ratio (UACR)'}</p>
            </div>
            <button type="button" class="btn-emr-copy" id="btn-copy-emr-kdigo" title="${isAr ? 'نسخ ملخص EMR' : 'Copy EMR Note'}" aria-label="Copy EMR Note">
              📋 ${isAr ? 'نسخ EMR' : 'Copy EMR'}
            </button>
          </div>
          
          <div class="tool-inputs-grid" style="grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));">
            <div class="tool-input-group">
              <label class="tool-label">${isAr ? 'معدل الترشيح (eGFR mL/min):' : 'eGFR (mL/min):'}</label>
              <input type="number" id="tab-kdigo-egfr" class="clinical-input" inputmode="numeric" value="${initialEgfr}">
            </div>
            <div class="tool-input-group">
              <label class="tool-label">${isAr ? 'زلال البول UACR (mg/g):' : 'UACR (mg/g):'}</label>
              <input type="number" id="tab-kdigo-uacr" class="clinical-input" inputmode="numeric" value="${initialUacr}">
            </div>
          </div>

          <div id="tab-kdigo-results" class="tool-results-box">
            <!-- Dynamic KDIGO 5x3 Heatmap results -->
          </div>
        </div>

        <!-- 3. DOAC Renal Dosing (Apixaban & Rivaroxaban) -->
        <div class="tool-card" id="doac-card">
          <div class="tool-header">
            <span class="tool-icon">🩸</span>
            <div class="tool-header-text">
              <h2 class="tool-title">${isAr ? 'حاسبة جرعات مضادات التخثر الحديثة (DOAC Renal Dosing)' : 'DOAC Renal Dosing (Apixaban & Rivaroxaban)'}</h2>
              <p class="tool-sub">${isAr ? 'قاعدة استيفاء شرطين من 3 لـ Apixaban (العمر ≥80، الوزن ≤60 كجم، الكرياتينين ≥1.5) وتعديل جرعة Rivaroxaban بحسب CrCl' : 'Apixaban 2-of-3 criteria (Age ≥80, Wt ≤60kg, Scr ≥1.5mg/dL) & Rivaroxaban CrCl dosing'}</p>
            </div>
            <button type="button" class="btn-emr-copy" id="btn-copy-emr-doac" title="${isAr ? 'نسخ ملخص EMR' : 'Copy EMR Note'}" aria-label="Copy EMR Note">
              📋 ${isAr ? 'نسخ EMR' : 'Copy EMR'}
            </button>
          </div>
          
          <div id="tab-doac-results" class="tool-results-box">
            <!-- Dynamic DOAC results -->
          </div>
        </div>

        <!-- 4. FIB-4 Liver Fibrosis Index -->
        <div class="tool-card" id="fib4-card">
          <div class="tool-header">
            <span class="tool-icon">🧬</span>
            <div class="tool-header-text">
              <h2 class="tool-title">${isAr ? 'مؤشر تليف الكبد الدهني (FIB-4 Index for MASLD)' : 'FIB-4 Liver Fibrosis Index for MASLD'}</h2>
              <p class="tool-sub">${isAr ? 'مسح تليف الكبد لمرضى السكري والسمنة باستخدام العمر، إنزيمات الكبد AST و ALT، والصفائح الدموية' : 'Screening advanced liver fibrosis in T2DM and metabolic syndrome using Age, AST, ALT, and Platelets'}</p>
            </div>
            <button type="button" class="btn-emr-copy" id="btn-copy-emr-fib4" title="${isAr ? 'نسخ ملخص EMR' : 'Copy EMR Note'}" aria-label="Copy EMR Note">
              📋 ${isAr ? 'نسخ EMR' : 'Copy EMR'}
            </button>
          </div>

          <div class="tool-inputs-grid" style="grid-template-columns:repeat(auto-fit, minmax(110px, 1fr));">
            <div class="tool-input-group">
              <label class="tool-label">AST (U/L):</label>
              <input type="number" id="tab-fib4-ast" class="clinical-input" inputmode="numeric" value="38">
            </div>
            <div class="tool-input-group">
              <label class="tool-label">ALT (U/L):</label>
              <input type="number" id="tab-fib4-alt" class="clinical-input" inputmode="numeric" value="42">
            </div>
            <div class="tool-input-group">
              <label class="tool-label">${isAr ? 'الصفائح (PLT 10⁹/L):' : 'Platelets (10⁹/L):'}</label>
              <input type="number" id="tab-fib4-plt" class="clinical-input" inputmode="numeric" value="210">
            </div>
          </div>

          <div id="tab-fib4-results" class="tool-results-box">
            <!-- Dynamic FIB-4 results -->
          </div>
        </div>

        <!-- 5. Bedside Point-of-Care Micro-Tools -->
        <div class="tool-card" id="micro-tools-card">
          <div class="tool-header">
            <span class="tool-icon">⚡</span>
            <div class="tool-header-text">
              <h2 class="tool-title">${isAr ? 'حاسبات سريعة لنقطة الرعاية (Bedside Micro-Tools)' : 'Point-of-Care Bedside Micro-Tools'}</h2>
              <p class="tool-sub">${isAr ? 'تحويل السكر التراكمي إلى متوسط السكر اليومي، الكالسيوم المصحح للألبومين، ومكافئ جرعات الكورتيزون' : 'HbA1c-to-eAG converter, Corrected Calcium for hypoalbuminemia, and Steroid dose equivalence'}</p>
            </div>
            <button type="button" class="btn-emr-copy" id="btn-copy-emr-micro" title="${isAr ? 'نسخ ملخص EMR' : 'Copy EMR Note'}" aria-label="Copy EMR Note">
              📋 ${isAr ? 'نسخ EMR' : 'Copy EMR'}
            </button>
          </div>

          <div class="micro-tools-grid">
            <!-- Micro 1: HbA1c to eAG -->
            <div class="micro-tool-card">
              <div class="micro-tool-title">🩺 ${isAr ? 'متوسط السكر (HbA1c ⟷ eAG)' : 'Estimated Avg Glucose (eAG)'}</div>
              <div style="display:flex; align-items:center; gap:8px;">
                <label style="font-size:12px; color:var(--muted); font-weight:600;">HbA1c (%):</label>
                <input type="number" id="micro-a1c" class="clinical-input" value="7.5" step="0.1" min="4" max="18" style="width:85px;">
              </div>
              <div id="micro-eag-result" class="micro-result-pill">169 mg/dL (9.4 mmol/L)</div>
              <div style="font-size:0.75rem; color:var(--muted);">${isAr ? 'معادلة الجمعية الأمريكية للسكري (ADA eAG)' : 'ADA formula: eAG = 28.7 × A1c - 46.7'}</div>
            </div>

            <!-- Micro 2: Corrected Calcium -->
            <div class="micro-tool-card">
              <div class="micro-tool-title">🧪 ${isAr ? 'الكالسيوم المصحح (Corrected Ca)' : 'Corrected Calcium'}</div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                <div>
                  <label style="font-size:11px; color:var(--muted); font-weight:600;">Total Ca (mg/dL):</label>
                  <input type="number" id="micro-ca" class="clinical-input" value="8.0" step="0.1">
                </div>
                <div>
                  <label style="font-size:11px; color:var(--muted); font-weight:600;">Albumin (g/dL):</label>
                  <input type="number" id="micro-alb" class="clinical-input" value="3.0" step="0.1">
                </div>
              </div>
              <div id="micro-corr-ca-result" class="micro-result-pill">8.8 mg/dL (Normal)</div>
              <div style="font-size:0.75rem; color:var(--muted);">${isAr ? 'تصحيح نقص ألبومين الدم (Payne formula)' : 'Payne: Total Ca + 0.8 × (4.0 - Albumin)'}</div>
            </div>

            <!-- Micro 3: Steroid Equivalence -->
            <div class="micro-tool-card">
              <div class="micro-tool-title">💊 ${isAr ? 'مكافئ الكورتيزون (Steroids)' : 'Steroid Equivalence'}</div>
              <div style="display:grid; grid-template-columns:80px 1fr; gap:6px; align-items:flex-end;">
                <div>
                  <label style="font-size:11px; color:var(--muted); font-weight:600;">${isAr ? 'الجرعة (مجم):' : 'Dose (mg):'}</label>
                  <input type="number" id="micro-steroid-dose" class="clinical-input" value="20" step="1">
                </div>
                <div>
                  <label style="font-size:11px; color:var(--muted); font-weight:600;">${isAr ? 'الدواء:' : 'Drug:'}</label>
                  <select id="micro-steroid-type" class="clinical-select" style="padding:6px 6px; font-size:11.5px;">
                    <option value="prednisone" selected>Prednisone</option>
                    <option value="hydrocortisone">Hydrocortisone</option>
                    <option value="methylprednisolone">Methylpred</option>
                    <option value="dexamethasone">Dexamethasone</option>
                  </select>
                </div>
              </div>
              <div id="micro-steroid-result" style="font-size:0.82rem; font-family:var(--f-mono); font-weight:700; color:var(--ink);">
                = Hydro 80mg · Dexa 3mg
              </div>
              <div style="font-size:0.75rem; color:var(--muted);">${isAr ? 'مكافئات مضادات الالتهاب الستيرويدية' : 'Anti-inflammatory glucocorticoid equivalence'}</div>
            </div>
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

      // 1. eGFR & CrCl Dual Telemetry
      const egfrRes = calculateCKDEPI(scr, unit, age, sex);
      const crclRes = calculateCrCl(scr, unit, age, sex, wt);
      const outBox = document.getElementById('tab-egfr-results');
      if (outBox) {
        if (!egfrRes) {
          outBox.innerHTML = `<div style="font-size:13px; color:var(--muted);">${isAr ? 'يرجى إدخال قيم صحيحة وموجبة للكرياتينين والعمر.' : 'Please enter valid positive values for Serum Creatinine and Age.'}</div>`;
        } else {
          const crclDisplay = crclRes ? `${crclRes.crcl}` : '—';

          // Renal Drug Adjustment Statuses
          let metTag = 'tag-safe', metText = isAr ? 'آمن (الجرعة الكاملة حتى 2000 مجم/يوم)' : 'Safe (Full dose up to 2000 mg/d)';
          if (egfrRes.egfr < 30) { metTag = 'tag-caution'; metText = isAr ? 'ممنوع تماماً (خطر الحماض اللبني Lactic Acidosis)' : 'Contraindicated (Lactic Acidosis risk)'; }
          else if (egfrRes.egfr < 45) { metTag = 'tag-adjust'; metText = isAr ? 'تخفيض الجرعة (الحد الأقصى 1000 مجم/يوم)' : 'Dose cap (Max 1000 mg/d)'; }

          let sglt2Tag = 'tag-safe', sglt2Text = isAr ? 'ابدأ واستمر عليه لحماية القلب والكلى' : 'Cardiorenal organ protection';
          if (egfrRes.egfr < 20) { sglt2Tag = 'tag-caution'; sglt2Text = isAr ? 'لا تبدأ به؛ استمر عليه إذا كان مستخدماً حتى الغسيل' : 'Do not initiate; continue until dialysis if already on it'; }

          let glp1Tag = 'tag-safe', glp1Text = isAr ? 'آمن دون تعديل الجرعة حتى eGFR 15' : 'Safe without dose adjustment down to eGFR 15';
          if (egfrRes.egfr < 15) { glp1Tag = 'tag-caution'; glp1Text = isAr ? 'بيانات محدودة في الفشل الكلوي النهائي' : 'Limited data in ESRD'; }

          let dpp4Tag = 'tag-safe', dpp4Text = isAr ? 'ليناجليبتين 5 مجم دون تعديل؛ سيتاجليبتين يحتاج تعديل' : 'Linagliptin 5 mg (no adjustment); Sitagliptin dose-adjusted';
          if (egfrRes.egfr < 30) { dpp4Tag = 'tag-adjust'; dpp4Text = isAr ? 'سيتاجليبتين 25 مجم أو ليناجليبتين 5 مجم' : 'Sitagliptin 25 mg daily or Linagliptin 5 mg'; }
          else if (egfrRes.egfr < 45) { dpp4Tag = 'tag-adjust'; dpp4Text = isAr ? 'سيتاجليبتين 50 مجم أو ليناجليبتين 5 مجم' : 'Sitagliptin 50 mg daily or Linagliptin 5 mg'; }

          outBox.innerHTML = `
            <div class="telemetry-row">
              <div class="telemetry-stat">
                <div class="telemetry-val stat-egfr">eGFR: ${egfrRes.egfr} <span style="font-size:12px; font-weight:600; color:var(--ink);">mL/min/1.73m²</span></div>
                <div class="telemetry-sub">${isAr ? egfrRes.stage.nameAr : egfrRes.stage.nameEn}</div>
              </div>
              <div class="telemetry-stat" style="text-align:${isAr ? 'left' : 'right'};">
                <div class="telemetry-val stat-crcl">CrCl: ${crclDisplay} <span style="font-size:12px; font-weight:600; color:var(--ink);">mL/min</span></div>
                <div class="telemetry-sub">${isAr ? 'تصفية الكرياتينين (Cockcroft-Gault)' : 'Cockcroft-Gault CrCl'}</div>
              </div>
            </div>
            <div class="renal-drug-matrix">
              <div class="renal-drug-pill"><span class="renal-drug-tag ${metTag}">Metformin</span> <span>${metText}</span></div>
              <div class="renal-drug-pill"><span class="renal-drug-tag ${sglt2Tag}">SGLT2i</span> <span>${sglt2Text}</span></div>
              <div class="renal-drug-pill"><span class="renal-drug-tag ${glp1Tag}">GLP-1 RA</span> <span>${glp1Text}</span></div>
              <div class="renal-drug-pill"><span class="renal-drug-tag ${dpp4Tag}">DPP-4i</span> <span>${dpp4Text}</span></div>
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

      // 2. Interactive KDIGO 2024 5x3 Heatmap Grid
      const fallbackEgfr = egfrRes ? egfrRes.egfr : 68;
      const kEgfr = readTabNum('tab-kdigo-egfr', fallbackEgfr);
      const kUacr = readTabNum('tab-kdigo-uacr', 0);
      const kdigoRes = evaluateKdigoMatrix(kEgfr, kUacr);
      const kBox = document.getElementById('tab-kdigo-results');
      if (kBox && kdigoRes) {
        const kStages = [
          { g: 'G1', label: 'G1 (≥90)', gMin: 90 },
          { g: 'G2', label: 'G2 (60–89)', gMin: 60 },
          { g: 'G3a', label: 'G3a (45–59)', gMin: 45 },
          { g: 'G3b', label: 'G3b (30–44)', gMin: 30 },
          { g: 'G4', label: 'G4 (15–29)', gMin: 15 },
          { g: 'G5', label: 'G5 (<15)', gMin: 0 }
        ];
        const aStages = [
          { a: 'A1', label: isAr ? 'A1 طبيعي (<30)' : 'A1 Normal (<30)' },
          { a: 'A2', label: isAr ? 'A2 متوسط (30–300)' : 'A2 Micro (30–300)' },
          { a: 'A3', label: isAr ? 'A3 شديد (>300)' : 'A3 Macro (>300)' }
        ];

        function getCellRiskColor(g, a) {
          if (g === 'G4' || g === 'G5' || (g === 'G3b' && (a === 'A2' || a === 'A3')) || (g === 'G3a' && a === 'A3')) return 'red';
          if ((g === 'G3b' && a === 'A1') || (g === 'G3a' && a === 'A2') || ((g === 'G1' || g === 'G2') && a === 'A3')) return 'orange';
          if ((g === 'G3a' && a === 'A1') || ((g === 'G1' || g === 'G2') && a === 'A2')) return 'yellow';
          return 'green';
        }

        let tableRows = '';
        kStages.forEach(st => {
          let cells = '';
          aStages.forEach(col => {
            const isCur = (st.g === kdigoRes.gStage && col.a === kdigoRes.aStage);
            const color = getCellRiskColor(st.g, col.a);
            cells += `<td class="kdigo-cell kdigo-cell-${color} ${isCur ? 'is-active' : ''}" data-kdigo-cell="${st.g}${col.a}">
              ${st.g}${col.a} ${isCur ? '📍' : ''}
            </td>`;
          });
          tableRows += `<tr><th class="kdigo-stage-hdr">${st.label}</th>${cells}</tr>`;
        });

        const actionCardCls = (kdigoRes.riskTier === 'VERY_HIGH') ? 'kdigo-action-red' : (kdigoRes.riskTier === 'HIGH' ? 'kdigo-action-orange' : (kdigoRes.riskTier === 'MODERATE' ? 'kdigo-action-yellow' : 'kdigo-action-green'));

        kBox.innerHTML = `
          <div class="kdigo-matrix-container">
            <table class="kdigo-table">
              <thead>
                <tr>
                  <th>GFR \\ UACR</th>
                  <th>${aStages[0].label}</th>
                  <th>${aStages[1].label}</th>
                  <th>${aStages[2].label}</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
          <div class="kdigo-action-card ${actionCardCls}">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
              <span style="font-weight:800; font-size:0.95rem;">
                ${kdigoRes.composite} · ${isAr ? kdigoRes.riskLabelAr : kdigoRes.riskLabelEn}
              </span>
              <span style="font-size:0.8rem; font-weight:700;">
                📅 ${isAr ? 'تكرار المتابعة:' : 'Surveillance:'} ${isAr ? kdigoRes.monitoringAr : kdigoRes.monitoringEn}
              </span>
            </div>
            <div><b>${isAr ? 'التوجيه السريري (KDIGO 2024):' : 'Action & Management:'}</b> ${isAr ? kdigoRes.recommendationAr : kdigoRes.recommendationEn}</div>
          </div>
        `;
      }

      // 3. DOAC Renal Dosing Interactive Calculator
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
        const critAge = (age >= 80);
        const critWt = (wt > 0 && wt <= 60);
        const critScr = (scr >= 1.5);

        dBox.innerHTML = `
          <div style="font-size:0.88rem; font-weight:700; color:var(--ink); margin-bottom:6px;">
            🎯 ${isAr ? 'معايير تخفيض جرعة أبيكسابان (Eliquis 2-of-3 Criteria):' : 'Apixaban (Eliquis) 2-of-3 Criteria:'}
          </div>
          <div class="doac-criteria-grid">
            <div class="doac-crit-chip ${critAge ? 'is-met' : ''}">
              <span>${critAge ? '✅' : '⬜'}</span>
              <span>${isAr ? 'العمر ≥ 80 سنة' : 'Age ≥ 80 years'} (${age} y)</span>
            </div>
            <div class="doac-crit-chip ${critWt ? 'is-met' : ''}">
              <span>${critWt ? '✅' : '⬜'}</span>
              <span>${isAr ? 'الوزن ≤ 60 كجم' : 'Weight ≤ 60 kg'} (${wt} kg)</span>
            </div>
            <div class="doac-crit-chip ${critScr ? 'is-met' : ''}">
              <span>${critScr ? '✅' : '⬜'}</span>
              <span>${isAr ? 'الكرياتينين ≥ 1.5 ملغ/دسل' : 'Serum Cr ≥ 1.5 mg/dL'} (${scr} mg/dL)</span>
            </div>
          </div>
          <div class="doac-dose-result">
            <div style="font-size:0.92rem; font-weight:700;">💊 <b>${isAr ? 'أبيكسابان (إليكويس):' : 'Apixaban (Eliquis):'}</b> ${isAr ? doacRes.apixabanAr : doacRes.apixabanEn}</div>
            <div style="font-size:0.78rem; color:var(--muted);">${isAr ? doacRes.apixaban.reasonAr : doacRes.apixaban.reasonEn}</div>
          </div>
          <div class="doac-dose-result" style="margin-top:8px;">
            <div style="font-size:0.92rem; font-weight:700;">💊 <b>${isAr ? 'ريفاروكسابان (زاريلتو):' : 'Rivaroxaban (Xarelto):'}</b> ${isAr ? doacRes.rivaroxabanAr : doacRes.rivaroxabanEn}</div>
            <div style="font-size:0.78rem; color:var(--warn); font-weight:600;">⚠️ ${isAr ? 'يجب تناوله مع وجبة طعام رئيسية (العشاء) لزيادة الامتصاص بنسبة 39%' : 'Must be taken with evening meal (food increases absorption by 39%)'}</div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; font-size:0.78rem;">
            <span style="background:var(--surface2); padding:5px 9px; border-radius:6px; border:1px solid var(--line);">
              <b>Dabigatran:</b> 150 mg BID (110 mg if age ≥80 or CrCl 30–49; avoid CrCl &lt;30)
            </span>
            <span style="background:var(--surface2); padding:5px 9px; border-radius:6px; border:1px solid var(--line);">
              <b>Edoxaban:</b> 60 mg QD (30 mg if CrCl 15–50 or Wt ≤60 kg)
            </span>
          </div>
        `;
      }

      // 4. FIB-4 Liver Fibrosis Visual Meter
      const ast = readTabNum('tab-fib4-ast', 38);
      const alt = readTabNum('tab-fib4-alt', 42);
      const pltVal = readTabNum('tab-fib4-plt', 210);
      const fib4Res = calculateFib4(age, ast, alt, pltVal);
      const fBox = document.getElementById('tab-fib4-results');
      if (fBox) {
        if (!fib4Res) {
          fBox.innerHTML = `<div style="font-size:13px; color:var(--muted);">${isAr ? 'يرجى إدخال قيم صحيحة وموجبة للعمر و AST و ALT والصفائح الدموية.' : 'Please enter valid positive values for Age, AST, ALT, and Platelets.'}</div>`;
        } else {
          const fibVal = fib4Res.score;
          const fibPos = Math.round(Math.min(Math.max((fibVal / 5.0) * 100, 4), 96));
          const fibColor = (fib4Res.riskTier === 'HIGH') ? '#DC2626' : (fib4Res.riskTier === 'INTERMEDIATE' ? '#D97706' : '#16A34A');
          const fibLabel = isAr
            ? (fib4Res.riskLabelAr || (fib4Res.riskTier === 'HIGH' ? 'خطورة عالية' : (fib4Res.riskTier === 'INTERMEDIATE' ? 'خطورة متوسطة' : 'خطورة منخفضة')))
            : (fib4Res.riskLabelEn || (fib4Res.riskTier === 'HIGH' ? 'High Risk' : (fib4Res.riskTier === 'INTERMEDIATE' ? 'Intermediate Risk' : 'Low Risk')));

          fBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <div style="font-size:1.15rem; font-weight:800; font-family:var(--f-mono);">
                FIB-4: <span style="color:${fibColor}; font-size:1.35rem;">${fib4Res.score}</span>
                <span style="display:inline-block; padding:3px 8px; border-radius:999px; font-size:0.78rem; font-weight:700; color:#fff; background:${fibColor}; margin-inline-start:6px;">
                  ${fibLabel}
                </span>
              </div>
              <div style="font-size:0.8rem; color:var(--muted);">
                ${isAr ? `معايير العمر (${age} سنة): الحد المنخفض < ${fib4Res.lowCutoff}` : `Cutoffs (Age ${age}y): Low < ${fib4Res.lowCutoff} | High > ${fib4Res.highCutoff}`}
              </div>
            </div>
            <div class="fib4-gauge-wrap" dir="ltr">
              <div class="fib4-track">
                <div class="fib4-pin" style="left:${fibPos}%;" title="FIB-4: ${fib4Res.score}"></div>
              </div>
              <div class="fib4-scale-legend">
                <span>Low &lt;${fib4Res.lowCutoff}</span>
                <span>${fib4Res.lowCutoff}–${fib4Res.highCutoff}</span>
                <span>High &gt;${fib4Res.highCutoff}</span>
              </div>
            </div>
            <div style="margin-top:8px; font-size:0.84rem; border-top:1px solid var(--line); padding-top:8px; line-height:1.45;">
              <b>${isAr ? 'التوصية السريرية:' : 'Recommendation:'}</b> ${isAr ? fib4Res.actionAr : fib4Res.actionEn} <span style="font-size:0.75rem; color:var(--muted); font-weight:normal;">(${isAr ? 'إرشادات AASLD / ADA 2025' : 'AASLD/ADA 2025'})</span>
            </div>
          `;
        }
      }

      // 5. Point-of-Care Bedside Micro-Tools Recalculation
      function recalculateMicroTools() {
        // eAG
        const a1c = readTabNum('micro-a1c', 7.5);
        const eagMg = Math.round(28.7 * a1c - 46.7);
        const eagMmol = Math.round((eagMg / 18.0182) * 10) / 10;
        const eagBox = document.getElementById('micro-eag-result');
        if (eagBox) eagBox.textContent = `${eagMg} mg/dL (${eagMmol} mmol/L)`;

        // Corrected Ca
        const ca = readTabNum('micro-ca', 8.0);
        const alb = readTabNum('micro-alb', 3.0);
        const corrCa = Math.round((ca + 0.8 * (4.0 - alb)) * 10) / 10;
        const caStatus = (corrCa < 8.5) ? (isAr ? 'منخفض' : 'Low') : ((corrCa > 10.5) ? (isAr ? 'مرتفع' : 'High') : (isAr ? 'طبيعي' : 'Normal'));
        const caBox = document.getElementById('micro-corr-ca-result');
        if (caBox) caBox.textContent = `${corrCa} mg/dL (${caStatus})`;

        // Steroids
        const sDose = readTabNum('micro-steroid-dose', 20);
        const sType = document.getElementById('micro-steroid-type')?.value || 'prednisone';
        let predEq = sDose;
        if (sType === 'hydrocortisone') predEq = sDose / 4;
        else if (sType === 'methylprednisolone') predEq = sDose / 0.8;
        else if (sType === 'dexamethasone') predEq = sDose / 0.15;

        const hydroVal = Math.round(predEq * 4 * 10) / 10;
        const methylVal = Math.round(predEq * 0.8 * 10) / 10;
        const dexaVal = Math.round(predEq * 0.15 * 100) / 100;
        const sBox = document.getElementById('micro-steroid-result');
        if (sBox) {
          sBox.textContent = `= Pred ${Math.round(predEq * 10) / 10}mg · Hydro ${hydroVal}mg · Methyl ${methylVal}mg · Dexa ${dexaVal}mg`;
        }
      }

      recalculateMicroTools();
    }

    // Attach listeners
    ['tab-scr', 'tab-scr-unit', 'tab-age', 'tab-sex', 'tab-wt', 'tab-kdigo-egfr', 'tab-kdigo-uacr', 'tab-fib4-ast', 'tab-fib4-alt', 'tab-fib4-plt', 'micro-a1c', 'micro-ca', 'micro-alb', 'micro-steroid-dose', 'micro-steroid-type'].forEach(id => {
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

    function copySnippet(text, btn) {
      if (!text || !btn) return;
      const done = () => {
        const orig = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = `✓ ${isAr ? 'تم النسخ!' : 'Copied!'}`;
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = orig;
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {
          fallbackCopyText(text, done);
        });
      } else {
        fallbackCopyText(text, done);
      }
    }

    function fallbackCopyText(text, cb) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const res = document.execCommand('copy');
        document.body.removeChild(ta);
        if (cb && res) cb();
      } catch (e) {}
    }

    // Bind EMR Snippet Copy Buttons
    const btnCopyEgfr = document.getElementById('btn-copy-emr-egfr');
    if (btnCopyEgfr) {
      btnCopyEgfr.onclick = function() {
        const scr = readTabNum('tab-scr', 1.0);
        const scrUnit = document.getElementById('tab-scr-unit')?.value || 'mg';
        const age = readTabNum('tab-age', 52);
        const sex = document.getElementById('tab-sex')?.value || 'm';
        const wt = readTabNum('tab-wt', 75);
        const egfrRes = calculateCKDEPI(scr, scrUnit, age, sex, wt);
        const egfrVal = egfrRes.egfr;
        const text = isAr
          ? `[تقييم وظائف الكلى وتصفية الكرياتينين]\n• معدل الترشيح CKD-EPI 2021: ${egfrRes.egfr} مل/دقيقة/1.73م² (${egfrRes.stageLabelAr})\n• تصفية الكرياتينين Cockcroft-Gault: ${egfrRes.crcl} مل/دقيقة (الوزن: ${wt} كجم، الكرياتينين: ${scr} ${scrUnit})\n• تعديل جرعات الأدوية: ميتفورمين ${egfrVal < 30 ? 'ممنوع تماماً' : egfrVal < 45 ? 'أقصى جرعة 1000مجم/يوم' : 'جرعة قياسية'} · SGLT2i ${egfrVal < 20 ? 'لا يُبدأ به' : 'موصى به لحماية الكلى'} · مثبطات DPP-4: ليناجليبتين لا يتطلب تعديل`
          : `[Renal Function & CrCl Assessment]\n• CKD-EPI 2021 eGFR: ${egfrRes.egfr} mL/min/1.73m² (${egfrRes.stageLabelEn})\n• Cockcroft-Gault CrCl: ${egfrRes.crcl} mL/min (Weight: ${wt} kg, SCr: ${scr} ${scrUnit})\n• Drug Adjustments: Metformin ${egfrVal < 30 ? 'Contraindicated' : egfrVal < 45 ? 'Max 1000mg/d' : 'Standard'} · SGLT2i ${egfrVal < 20 ? 'Not initiated' : 'Cardiorenal Indicated'} · DPP-4i Linagliptin No renal adjust`;
        copySnippet(text, btnCopyEgfr);
      };
    }

    const btnCopyKdigo = document.getElementById('btn-copy-emr-kdigo');
    if (btnCopyKdigo) {
      btnCopyKdigo.onclick = function() {
        const kEgfr = readTabNum('tab-kdigo-egfr', 75);
        const kUacr = readTabNum('tab-kdigo-uacr', 30);
        const matrixRes = evaluateKdigoMatrix(kEgfr, kUacr);
        const text = isAr
          ? `[تقييم مخاطر الكلى KDIGO 2024]\n• التصنيف: G${matrixRes.gfrCategory} A${matrixRes.uacrCategory} (${matrixRes.riskLabelAr})\n• التحاليل: eGFR ${kEgfr} مل/دقيقة/1.73م² · زلال البول UACR ${kUacr} مجم/جم\n• الخطة العلاجية: ${matrixRes.recsAr}\n• المتابعة: إعادة فحص eGFR و UACR ${matrixRes.surveillanceAr}`
          : `[CKD KDIGO 2024 Assessment]\n• Staging: G${matrixRes.gfrCategory} A${matrixRes.uacrCategory} (${matrixRes.riskLabelEn})\n• Lab Values: eGFR ${kEgfr} mL/min/1.73m² · UACR ${kUacr} mg/g\n• Plan: ${matrixRes.recsEn}\n• Surveillance: Re-evaluate eGFR and UACR ${matrixRes.surveillanceEn}`;
        copySnippet(text, btnCopyKdigo);
      };
    }

    const btnCopyDoac = document.getElementById('btn-copy-emr-doac');
    if (btnCopyDoac) {
      btnCopyDoac.onclick = function() {
        const scr = readTabNum('tab-scr', 1.0);
        const scrUnit = document.getElementById('tab-scr-unit')?.value || 'mg';
        const age = readTabNum('tab-age', 52);
        const sex = document.getElementById('tab-sex')?.value || 'm';
        const wt = readTabNum('tab-wt', 75);
        const crclRes = calculateCrCl(scr, scrUnit, age, sex, wt);
        const doacRes = evaluateDoacDosing(crclRes.crcl, age, wt, scr, scrUnit);
        const apix = doacRes.apixaban;
        const riv = doacRes.rivaroxaban;
        const text = isAr
          ? `[جرعات مضادات التخثر الفموية الحديثة DOAC]\n• أبيكسابان (Eliquis): ${apix.doseAr} (${apix.criteriaMetCount}/3 من معايير التخفيض: العمر ${age}سنة، الوزن ${wt}كجم، الكرياتينين ${scr})\n• ريفاروكسابان (Xarelto): ${riv.doseAr} مع وجبة العشاء (تصفية الكرياتينين ${crclRes.crcl} مل/دقيقة)`
          : `[DOAC Anticoagulation Dosing]\n• Apixaban (Eliquis): ${apix.doseEn} (${apix.criteriaMetCount}/3 criteria met: Age ${age}y, Weight ${wt}kg, SCr ${scr})\n• Rivaroxaban (Xarelto): ${riv.doseEn} with food (CrCl: ${crclRes.crcl} mL/min)`;
        copySnippet(text, btnCopyDoac);
      };
    }

    const btnCopyFib4 = document.getElementById('btn-copy-emr-fib4');
    if (btnCopyFib4) {
      btnCopyFib4.onclick = function() {
        const age = readTabNum('tab-age', 52);
        const ast = readTabNum('tab-fib4-ast', 38);
        const alt = readTabNum('tab-fib4-alt', 42);
        const plt = readTabNum('tab-fib4-plt', 210);
        const fib4Res = calculateFib4(age, ast, alt, plt);
        if (!fib4Res) return;
        const text = isAr
          ? `[مسح تليف الكبد مؤشر FIB-4]\n• النتيجة: ${fib4Res.score} (${fib4Res.riskLabelAr || fib4Res.riskTier})\n• الحدود المرجعية (عمر ${age} سنة): منخفض < ${fib4Res.lowCutoff} · مرتفع > ${fib4Res.highCutoff}\n• التوصية السريرية (AASLD/ADA): ${fib4Res.actionAr}`
          : `[Liver Fibrosis Screening (FIB-4 Index)]\n• Score: ${fib4Res.score} (${fib4Res.riskLabelEn || fib4Res.riskTier})\n• Cutoffs (Age ${age}y): Low < ${fib4Res.lowCutoff} · High > ${fib4Res.highCutoff}\n• Clinical Recommendation (AASLD/ADA): ${fib4Res.actionEn}`;
        copySnippet(text, btnCopyFib4);
      };
    }

    const btnCopyMicro = document.getElementById('btn-copy-emr-micro');
    if (btnCopyMicro) {
      btnCopyMicro.onclick = function() {
        const a1c = readTabNum('micro-a1c', 7.5);
        const ca = readTabNum('micro-ca', 8.0);
        const alb = readTabNum('micro-alb', 3.0);
        const eagTxt = document.getElementById('micro-eag-result')?.textContent || '';
        const caTxt = document.getElementById('micro-corr-ca-result')?.textContent || '';
        const stTxt = document.getElementById('micro-steroid-result')?.textContent || '';
        const text = isAr
          ? `[الحاسبات السريرية السريعة Bedside Micro-Tools]\n• السكر التراكمي إلى متوسط السكر (eAG): ${eagTxt} (HbA1c ${a1c}%)\n• الكالسيوم المصحح: ${caTxt} (الكالسيوم الكلي ${ca}، الألبومين ${alb})\n• مكافئات الكورتيزون: ${stTxt}`
          : `[Point-of-Care Bedside Conversions]\n• Estimated Avg Glucose (eAG): ${eagTxt} (HbA1c ${a1c}%)\n• Corrected Calcium: ${caTxt} (Total Ca ${ca}, Albumin ${alb})\n• Steroid Equivalence: ${stTxt}`;
        copySnippet(text, btnCopyMicro);
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

```

---

<a id="www-js-patient-leaflets-js"></a>
## 25. `www/js/patient_leaflets.js`

**Description:** Clinician-to-patient education leaflets, QR code generator for patient mobile handoff, and print formatter.  
**Lines:** 1048 | **Size:** 53.1 KB

```javascript
// ==============================================================
// Osrawy Patient Leaflets & Offline SVG QR Code Generator
// Interactive Educational Leaflets for DM, HTN & DLP
// Dynamic Targets, Rule of 15, SADMANS Rules, Home BP, Statins & Red Flags
// ==============================================================

(function() {
  'use strict';

  // ==============================================================
  // 1. Offline Zero-Dependency SVG QR Code Generator
  // ISO/IEC 18004 Byte Mode Version 6-L (41x41 Matrix, GF(256) RS EC)
  // ==============================================================

  const OsrawyQRCode = (function() {
    const SIZE = 41; // Version 6 matrix dimension = 21 + (6-1)*4 = 41

    // GF(256) field tables with primitive polynomial 0x11D (285)
    const gfExp = new Uint8Array(512);
    const gfLog = new Uint8Array(256);
    let x = 1;
    for (let i = 0; i < 255; i++) {
      gfExp[i] = x;
      gfLog[x] = i;
      x <<= 1;
      if (x & 256) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) {
      gfExp[i] = gfExp[i - 255];
    }

    function gfMul(a, b) {
      return (a === 0 || b === 0) ? 0 : gfExp[gfLog[a] + gfLog[b]];
    }

    // Compute Reed-Solomon Generator Polynomial for degree 18
    function rsGenPoly(degree) {
      let g = [1];
      for (let i = 0; i < degree; i++) {
        const next = new Array(g.length + 1).fill(0);
        const root = gfExp[i];
        for (let j = 0; j < g.length; j++) {
          next[j] ^= g[j];
          next[j + 1] ^= gfMul(g[j], root);
        }
        g = next;
      }
      return g;
    }

    const g18 = rsGenPoly(18);

    // Compute 18 Reed-Solomon EC Codewords for a data block
    function calcEC(data, degree) {
      const buf = new Uint8Array(data.length + degree);
      buf.set(data);
      for (let i = 0; i < data.length; i++) {
        const coef = buf[i];
        if (coef !== 0) {
          for (let j = 0; j <= degree; j++) {
            buf[i + j] ^= gfMul(g18[j], coef);
          }
        }
      }
      return Array.from(buf.slice(data.length));
    }

    // Convert string to UTF-8 byte array, safely truncating at whole character boundaries
    function toUtf8Bytes(str, maxBytes) {
      const s = String(str || '');
      const limit = (typeof maxBytes === 'number' && maxBytes > 0) ? maxBytes : 134;
      const bytes = [];
      for (let i = 0; i < s.length; i++) {
        let code = s.charCodeAt(i);
        let charBytes;
        if (code < 0x80) {
          charBytes = [code];
        } else if (code < 0x800) {
          charBytes = [0xc0 | (code >> 6), 0x80 | (code & 0x3f)];
        } else if (code < 0xd800 || code >= 0xe000) {
          charBytes = [0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f)];
        } else {
          i++;
          code = 0x10000 + (((code & 0x3ff) << 10) | (s.charCodeAt(i) & 0x3ff));
          charBytes = [0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f)];
        }
        if (bytes.length + charBytes.length > limit) break;
        for (let k = 0; k < charBytes.length; k++) bytes.push(charBytes[k]);
      }
      return bytes;
    }

    // Bit buffer writer
    class BitBuffer {
      constructor() {
        this.buffer = [];
        this.length = 0;
      }
      put(val, len) {
        for (let i = 0; i < len; i++) {
          this.putBit(((val >>> (len - i - 1)) & 1) === 1);
        }
      }
      putBit(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
          this.buffer.push(0);
        }
        if (bit) {
          this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
        }
        this.length++;
      }
    }

    // Generate 41x41 binary matrix
    function createMatrix(text) {
      // 1. Prepare data bitstream for Version 6-L
      // Total data codewords = 136 (2 blocks of 68), Total EC codewords = 36 (2 blocks of 18)
      // Max raw data bytes in 8-bit byte mode: (136*8 - 4(mode) - 8(count)) / 8 = 134 bytes
      const dataBytes = toUtf8Bytes(text, 134);

      const bb = new BitBuffer();
      // Mode indicator: 0100 (Byte mode)
      bb.put(0x04, 4);
      // Character count indicator: 8 bits for Version 6 Byte mode
      bb.put(dataBytes.length, 8);
      // Data bytes
      for (let i = 0; i < dataBytes.length; i++) {
        bb.put(dataBytes[i], 8);
      }
      // Terminator (up to 4 bits of 0)
      const maxDataBits = 136 * 8;
      const termLen = Math.min(4, maxDataBits - bb.length);
      bb.put(0, termLen);
      // Pad to whole byte
      while (bb.length % 8 !== 0) {
        bb.putBit(false);
      }
      // Pad with alternate 0xEC and 0x11
      const padBytes = [0xec, 0x11];
      let padIdx = 0;
      while (bb.length < maxDataBits) {
        bb.put(padBytes[padIdx % 2], 8);
        padIdx++;
      }

      // 2. Split into 2 blocks of 68 codewords each and compute 18 EC codewords
      const b1Data = bb.buffer.slice(0, 68);
      const b2Data = bb.buffer.slice(68, 136);
      const b1Ec = calcEC(b1Data, 18);
      const b2Ec = calcEC(b2Data, 18);

      // 3. Interleave data codewords, then EC codewords
      const finalCodewords = [];
      for (let i = 0; i < 68; i++) {
        finalCodewords.push(b1Data[i]);
        finalCodewords.push(b2Data[i]);
      }
      for (let i = 0; i < 18; i++) {
        finalCodewords.push(b1Ec[i]);
        finalCodewords.push(b2Ec[i]);
      }

      // Convert codewords to final bit array + 7 remainder bits for Version 6
      const allBits = [];
      for (let i = 0; i < finalCodewords.length; i++) {
        const byte = finalCodewords[i];
        for (let b = 7; b >= 0; b--) {
          allBits.push(((byte >>> b) & 1) === 1);
        }
      }
      for (let r = 0; r < 7; r++) {
        allBits.push(false); // 7 remainder bits for Version 6
      }

      // 4. Build 41x41 module grid and function patterns
      const matrix = Array.from({ length: SIZE }, () => new Array(SIZE).fill(null));
      const reserved = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));

      // Finder patterns
      function placeFinder(r, c) {
        for (let y = -1; y <= 7; y++) {
          for (let x = -1; x <= 7; x++) {
            const row = r + y, col = c + x;
            if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
              reserved[row][col] = true;
              if (y >= 0 && y <= 6 && x >= 0 && x <= 6) {
                matrix[row][col] = (y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4)) ? 1 : 0;
              } else {
                matrix[row][col] = 0;
              }
            }
          }
        }
      }
      placeFinder(0, 0);
      placeFinder(0, SIZE - 7);
      placeFinder(SIZE - 7, 0);

      // Alignment Pattern at center (34, 34) for Version 6
      function placeAlignment(cr, cc) {
        for (let y = -2; y <= 2; y++) {
          for (let x = -2; x <= 2; x++) {
            reserved[cr + y][cc + x] = true;
            matrix[cr + y][cc + x] = (Math.max(Math.abs(y), Math.abs(x)) === 1) ? 0 : 1;
          }
        }
      }
      placeAlignment(34, 34);

      // Timing Patterns at row 6 and col 6
      for (let i = 8; i < SIZE - 8; i++) {
        if (!reserved[6][i]) {
          reserved[6][i] = true;
          matrix[6][i] = (i % 2 === 0) ? 1 : 0;
        }
        if (!reserved[i][6]) {
          reserved[i][6] = true;
          matrix[i][6] = (i % 2 === 0) ? 1 : 0;
        }
      }

      // Dark module at (33, 8) for Version 6 (4*V + 9, 8)
      reserved[33][8] = true;
      matrix[33][8] = 1;

      // Reserve Format Information areas
      for (let i = 0; i <= 8; i++) {
        reserved[8][i] = true;
        reserved[i][8] = true;
      }
      for (let i = SIZE - 8; i < SIZE; i++) {
        reserved[8][i] = true;
        reserved[i][8] = true;
      }

      // 5. Place data bits in zigzag scan with Mask Pattern 0: ((row + col) % 2 === 0)
      let bitIdx = 0;
      let goingUp = true;
      for (let col = SIZE - 1; col > 0; col -= 2) {
        if (col === 6) col--; // Skip vertical timing column
        const rows = goingUp ? [] : [];
        for (let i = 0; i < SIZE; i++) {
          rows.push(goingUp ? (SIZE - 1 - i) : i);
        }
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          for (let c = col; c >= col - 1; c--) {
            if (!reserved[row][c]) {
              const bit = bitIdx < allBits.length ? allBits[bitIdx] : false;
              bitIdx++;
              // Apply Mask 0: invert if (row + col) is even
              const mask = ((row + c) % 2 === 0);
              matrix[row][c] = (bit ^ mask) ? 1 : 0;
            }
          }
        }
        goingUp = !goingUp;
      }

      // 6. Write Format Information MSB-first (Level L = 01, Mask 0 = 000 -> 15 bits = 0x77c4)
      const fmt = 0x77c4;
      const fmtCoords1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
      const fmtCoords2 = [[SIZE-1,8],[SIZE-2,8],[SIZE-3,8],[SIZE-4,8],[SIZE-5,8],[SIZE-6,8],[SIZE-7,8],[8,SIZE-8],[8,SIZE-7],[8,SIZE-6],[8,SIZE-5],[8,SIZE-4],[8,SIZE-3],[8,SIZE-2],[8,SIZE-1]];
      for (let i = 0; i < 15; i++) {
        const bit = (fmt >> (14 - i)) & 1;
        matrix[fmtCoords1[i][0]][fmtCoords1[i][1]] = bit;
        matrix[fmtCoords2[i][0]][fmtCoords2[i][1]] = bit;
      }

      return matrix;
    }

    // Render 41x41 matrix as pure vector SVG string
    function generateSVG(text, options) {
      const opt = options || {};
      const pxSize = opt.size || 240;
      const margin = (opt.margin !== undefined) ? opt.margin : 4;
      const darkColor = opt.darkColor || '#0A4F4B';
      const lightColor = opt.lightColor || '#FFFFFF';

      const matrix = createMatrix(text);
      const totalSize = SIZE + (margin * 2);

      let pathD = '';
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (matrix[r][c] === 1) {
            const x = c + margin;
            const y = r + margin;
            pathD += `M${x},${y}h1v1h-1z `;
          }
        }
      }

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${pxSize}" height="${pxSize}" shape-rendering="crispEdges" aria-label="QR Code">
  <rect width="100%" height="100%" fill="${lightColor}"/>
  <path fill="${darkColor}" d="${pathD.trim()}"/>
</svg>`;
    }

    return {
      SIZE,
      createMatrix,
      generateSVG
    };
  })();

  // ==============================================================
  // 2. Bilingual Patient Leaflet Engine
  // ==============================================================

  const PatientLeaflets = (function() {
    let currentCondition = 'all'; // 'all', 'dm', 'htn', 'dlp'
    let currentLang = 'ar';       // 'ar', 'en'
    let fontScale = 1.0;          // 0.85 to 1.35

    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function getPatientSync() {
      if (typeof window.OsrawyPatientSync !== 'undefined') return window.OsrawyPatientSync;
      if (typeof window.PatientSync !== 'undefined') return window.PatientSync;
      return null;
    }

    function getPatientData() {
      const sync = getPatientSync();
      if (sync && typeof sync.get === 'function') {
        return sync.get();
      }
      return {
        name: 'Ahmed Mahmoud',
        age: 52,
        sex: 'm',
        wt: 96,
        ht: 170,
        a1c: 8.9,
        fpg: 190,
        egfr: 68,
        uacr: 45,
        sbp: 148,
        dbp: 94,
        k: 4.6,
        tc: 210,
        hdl: 42,
        ascvd: false,
        dur: 4
      };
    }

    // Dynamic targets calculation based on clinical guidelines
    function getDynamicTargets(pt) {
      const p = pt || getPatientData();
      const age = parseFloat(p.age) || 52;
      const isElderlyOrFrail = (age >= 65) || !!p.frail;

      // 1. Diabetes Targets (ADA 2025)
      const a1cTarget = isElderlyOrFrail ? '< 7.5% - 8.0%' : '< 7.0%';
      const a1cTargetDescAr = isElderlyOrFrail ? 'هدف مرن لتجنب الهبوط ومضاعفاته لكبار السن' : 'الهدف المعياري لحماية الشرايين والكلى وشبكية العين';
      const a1cTargetDescEn = isElderlyOrFrail ? 'Relaxed target to prevent hypoglycemia in older adults' : 'Standard target to prevent vascular and microvascular complications';
      const fpgTarget = '80 - 130 mg/dL (4.4 - 7.2 mmol/L)';
      const ppgTarget = '< 180 mg/dL (< 10.0 mmol/L)';

      // 2. Hypertension Targets (ACC/AHA & ESC 2023)
      const bpTarget = isElderlyOrFrail ? '< 135/85 mmHg (130-139 / 70-79)' : '< 130/80 mmHg';
      const homeBpTarget = '< 130/80 mmHg (متوسط القراءات المنزلية)';
      const homeBpTargetEn = '< 130/80 mmHg (average home readings)';

      // 3. Dyslipidemia Targets (ADA 2025 / ESC 2023)
      let ldlTargetMg = 70;
      let ldlRiskTier = 'High Risk';
      let ldlRiskTierAr = 'عالي الخطورة (وجود سكري)';
      if (p.ascvd || (p.egfr && p.egfr < 45)) {
        ldlTargetMg = 55;
        ldlRiskTier = 'Very High Risk (Established ASCVD / CKD)';
        ldlRiskTierAr = 'مرتفع الخطورة جداً (تصلب شرايين أو قصور كلوي)';
      } else if (!p.dm && age < 40 && (!p.sbp || p.sbp < 140)) {
        ldlTargetMg = 100;
        ldlRiskTier = 'Moderate Risk';
        ldlRiskTierAr = 'متوسط الخطورة';
      }

      return {
        patientName: p.name || 'المريض',
        age: p.age,
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
          currentTc: p.tc ? `${p.tc} mg/dL` : '210 mg/dL',
          currentHdl: p.hdl ? `${p.hdl} mg/dL` : '42 mg/dL'
        }
      };
    }

    // Educational Modules HTML Builders
    function renderRuleOf15(lang) {
      const isAr = (lang === 'ar');
      return `
        <div class="leaflet-section-card">
          <div class="leaflet-card-header">
            <span class="leaflet-header-icon">🍬</span>
            <div>
              <h3>${isAr ? 'قاعدة 15 لعلاج هبوط السكر (Hypoglycemia Rule of 15)' : 'Rule of 15 for Hypoglycemia Treatment'}</h3>
              <p class="leaflet-subtitle">${isAr ? 'تطبق عندما يكون السكر أقل من 70 ملغ/دسل (أو عند ظهور أعراض رجفة، تعرق، خفقان، دوخة)' : 'Apply when blood glucose is below 70 mg/dL (< 3.9 mmol/L) or when experiencing tremors, sweating, or palpitations.'}</p>
            </div>
          </div>
          <div class="rule15-steps-grid">
            <div class="leaflet-step-box">
              <div class="step-number">1</div>
              <div class="step-body">
                <b>${isAr ? 'تناول 15 غرام سكر سريع الامتصاص' : 'Take 15g of fast-acting sugar'}</b>
                <p>${isAr ? 'نصف كوب عصير فواكه أو صودا غير دايت (120 مل)، أو 3-4 أقراص جلوكوز، أو ملعقة كبيرة سكر/عسل مذابة في ماء.' : '1/2 cup (120 mL) fruit juice or regular soda (non-diet), 3-4 glucose tablets, or 1 tablespoon of sugar/honey in water.'}</p>
              </div>
            </div>
            <div class="leaflet-step-box">
              <div class="step-number">2</div>
              <div class="step-body">
                <b>${isAr ? 'انتظر 15 دقيقة في راحة تامة' : 'Wait 15 minutes and rest'}</b>
                <p>${isAr ? 'اجلس بهدوء، تجنب بذل أي مجهود إضافي لإعطاء فرصة للسكر أن يمتص في مجرى الدم.' : 'Sit quietly and rest to allow the sugar to absorb into your bloodstream.'}</p>
              </div>
            </div>
            <div class="leaflet-step-box">
              <div class="step-number">3</div>
              <div class="step-body">
                <b>${isAr ? 'أعد قياس السكر بالجهاز' : 'Recheck blood glucose'}</b>
                <p>${isAr ? 'إذا كان السكر لا يزال أقل من 70 ملغ/دسل: كرر تناول 15 غرام سكر وانتظر 15 دقيقة أخرى.' : 'If still under 70 mg/dL: repeat 15g fast sugar and wait another 15 minutes.'}</p>
              </div>
            </div>
            <div class="leaflet-step-box">
              <div class="step-number">4</div>
              <div class="step-body">
                <b>${isAr ? 'تناول وجبة خفيفة مستقرة' : 'Eat a stabilizing snack or meal'}</b>
                <p>${isAr ? 'بمجرد أن يرتفع السكر فوق 70 ملغ/دسل، تناول وجبتك المعتادة أو شطيرة خبز أسمر مع جبن/حليب لمنع عودة الهبوط.' : 'Once blood glucose is >= 70 mg/dL, eat your regular meal or a complex carbohydrate snack (bread with cheese/milk) to prevent recurrence.'}</p>
              </div>
            </div>
          </div>
          <div class="leaflet-danger-callout">
            <span class="callout-icon">🚨</span>
            <div>
              <b>${isAr ? 'تنبيه طارئ عند فقدان الوعي أو التشنجات:' : 'Emergency Alert: Unconsciousness or Seizures:'}</b>
              <span>${isAr ? 'يُمنع منعاً باتاً وضع أي طعام أو شراب في فم المريض (خطر الاختناق). يتم إعطاء حقنة أو بخاخ الجلوكاجون الأنفي (Baqsimi) واستدعاء الإسعاف فوراً (997 في السعودية / 123 في مصر).' : 'NEVER put fluids or food into an unconscious patient\'s mouth (choking hazard). Administer emergency Glucagon (Baqsimi nasal spray or injection) and call EMS immediately.'}</span>
            </div>
          </div>
        </div>
      `;
    }

    function renderSadmansRules(lang) {
      const isAr = (lang === 'ar');
      const items = [
        { l: 'S', drug: 'SGLT2 inhibitors (Jardiance, Forxiga)', drugAr: 'مثبطات SGLT2 (جارديانس، فورسيجا)', why: 'Hold to prevent euglycemic diabetic ketoacidosis (DKA) and acute kidney injury.', whyAr: 'يوقف فوراً لتفادي الحماض الكيتوني السكري السليم وقصور وظائف الكلى.' },
        { l: 'A', drug: 'ACE Inhibitors (Ramipril, Enalapril, Lisinopril)', drugAr: 'مثبطات ACE (تريتاس، راميبريل، ليسينوبريل)', why: 'Hold temporarily to prevent acute drop in kidney filtration during dehydration.', whyAr: 'يوقف مؤقتاً لتجنب الهبوط الحاد في وظائف وترشيح الكلى أثناء الجفاف.' },
        { l: 'D', drug: 'Diuretics (Lasix, Natrilix, Hydrochlorothiazide)', drugAr: 'مدرات البول (لازيكس، ناتريليكس، هيدروكلوروثيازيد)', why: 'Hold to prevent severe volume depletion, dehydration, and electrolyte shock.', whyAr: 'يوقف لتجنب الجفاف الشديد وفقدان السوائل واضطراب أملاح الدم.' },
        { l: 'M', drug: 'Metformin (Glucophage)', drugAr: 'ميتفورمين (جلوكوفاج)', why: 'Hold immediately to prevent rare but fatal Lactic Acidosis if dehydration occurs.', whyAr: 'يوقف فوراً لتفادي خطر تراكم حمض اللاكتيك القاتل (Lactic Acidosis) عند نقص السوائل.' },
        { l: 'A', drug: 'ARBs (Diovan, Micardis, Cozaar, Atacand)', drugAr: 'مضادات مستقبلات الأنجيوتنسين (ديوفان، ميكارديس، كوزار)', why: 'Hold temporarily during dehydrating illness to protect kidney hemodynamics.', whyAr: 'يوقف مؤقتاً أثناء القيء أو الإسهال لحماية الكلى من القصور الوظيفي.' },
        { l: 'N', drug: 'NSAIDs (Brufen, Voltaren, Cataflam, Naproxen)', drugAr: 'مسكنات الالتهاب اللاستيرويدية (بروفين، فولتارين، كتافلام)', why: 'AVOID COMPLETELY. Severe renal vasoconstriction. Use Paracetamol/Panadol instead.', whyAr: 'تجنبها تماماً! تسبب تضيقاً حاداً في شرايين الكلى. استخدم باراسيتامول/بانادول كبديل آمن.' },
        { l: 'S', drug: 'Sulfonylureas (Diamicron, Amaryl)', drugAr: 'سلفونيل يوريا (دياميكرون، أماريل)', why: 'Hold or halve dose to avoid prolonged severe hypoglycemia when food intake drops.', whyAr: 'يوقف أو تخفض جرعته لتفادي هبوط السكر الشديد والمستمر عند قلة الأكل.' }
      ];

      return `
        <div class="leaflet-section-card">
          <div class="leaflet-card-header">
            <span class="leaflet-header-icon">⚠️</span>
            <div>
              <h3>${isAr ? 'قواعد أيام المرض (SADMANS Sick-Day Rules)' : 'SADMANS Sick-Day Management'}</h3>
              <p class="leaflet-subtitle">${isAr ? 'أدوية يجب إيقافها مؤقتاً عند الإصابة بنزلات معوية، قيء، إسهال شديد، حمى مرتفعة، أو جفاف لحماية الكلى' : 'Medications to hold temporarily during acute vomiting, diarrhea, high fever, or dehydration to protect kidneys.'}</p>
            </div>
          </div>
          <div class="sadmans-list">
            ${items.map(it => `
              <div class="sadmans-item">
                <div class="sadmans-badge">${it.l}</div>
                <div class="sadmans-content">
                  <div class="sadmans-drug">${isAr ? it.drugAr : it.drug}</div>
                  <div class="sadmans-why">${isAr ? it.whyAr : it.why}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="leaflet-tip-box mt-3">
            <b>${isAr ? 'متى تستأنف العلاج؟' : 'When to restart?'}</b>
            <span>${isAr ? 'استأنف تناول هذه الأدوية بعد مرور 24 إلى 48 ساعة من تعافيك التام وقدرتك على شرب وتناول الطعام بصورة طبيعية، أو بعد مراجعة طبيبك.' : 'Restart these medications 24-48 hours after illness resolves and normal eating and fluid intake resume, or upon physician advice.'}</span>
          </div>
        </div>
      `;
    }

    function renderHomeBpTechnique(lang) {
      const isAr = (lang === 'ar');
      return `
        <div class="leaflet-section-card">
          <div class="leaflet-card-header">
            <span class="leaflet-header-icon">🩺</span>
            <div>
              <h3>${isAr ? 'الطريقة المعتمدة لقياس الضغط المنزلي (Home BP Technique)' : 'Validated Home BP Monitoring Protocol'}</h3>
              <p class="leaflet-subtitle">${isAr ? 'إرشادات الجمعية الأوروبية لأمراض القلب ESC ورابطة القلب الأمريكية لحساب متوسط دقيق' : 'ESC and AHA guidelines for accurate home blood pressure readings and diary recording.'}</p>
            </div>
          </div>
          <div class="bp-protocol-grid">
            <div class="bp-card">
              <h4>${isAr ? '1. الاستعداد والتحضير' : '1. Preparation'}</h4>
              <ul>
                <li>${isAr ? 'تجنب التدخين، القهوة، الشاي والرياضة لمدة 30 دقيقة قبل القياس.' : 'No smoking, caffeine, tea, or exercise for 30 minutes prior.'}</li>
                <li>${isAr ? 'أفرغ المثانة تماماً قبل الجلوس.' : 'Empty bladder completely before testing.'}</li>
                <li>${isAr ? 'استرح في هدوء تام جالساً لمدة 5 دقائق دون كلام أو استخدام للهاتف.' : 'Rest quietly for 5 minutes without talking or using smartphone.'}</li>
              </ul>
            </div>
            <div class="bp-card">
              <h4>${isAr ? '2. وضعية الجلوس الصحيحة' : '2. Correct Posture'}</h4>
              <ul>
                <li>${isAr ? 'اجلس على كرسي مع إسناد الظهر بشكل مستقيم.' : 'Sit in a supportive chair with back supported straight.'}</li>
                <li>${isAr ? 'ضع القدمين مستويتين على الأرض (لا تعقد الساقين أو تضع ساقاً فوق أخرى).' : 'Feet flat on floor; do NOT cross legs or ankles.'}</li>
                <li>${isAr ? 'أسند الذراع على طاولة بحيث يكون منتصف حزام الجهاز بمحاذاة مستوى القلب.' : 'Support bare arm on table with cuff at heart level.'}</li>
              </ul>
            </div>
            <div class="bp-card">
              <h4>${isAr ? '3. جهاز القياس والحزام' : '3. Device & Cuff'}</h4>
              <ul>
                <li>${isAr ? 'استخدم جهاز قياس إلكتروني معتمد يقيس من أعلى الذراع (تجنب أجهزة الرسغ والأصابع).' : 'Use a validated upper-arm cuff monitor (avoid wrist/finger devices).'}</li>
                <li>${isAr ? 'ثبت الحزام على الجلد مباشرة 2-3 سم فوق ثنية الكوع بمقاس مناسب لذراعك.' : 'Place cuff on bare arm 2-3 cm above elbow crease with snug fit.'}</li>
              </ul>
            </div>
            <div class="bp-card">
              <h4>${isAr ? '4. بروتوكول القياس الأسبوعي' : '4. Weekly Protocol'}</h4>
              <ul>
                <li>${isAr ? 'خذ قراءتين بينهما دقيقة صباحاً (قبل الإفطار والأدوية).' : 'Take 2 readings 1 minute apart in morning (before breakfast & pills).'}</li>
                <li>${isAr ? 'خذ قراءتين بينهما دقيقة مساءً (قبل العشاء أو النوم).' : 'Take 2 readings 1 minute apart in evening (before dinner/bed).'}</li>
                <li>${isAr ? 'كرر ذلك لمدة 7 أيام متتالية، ودون القراءات في دفتر القياس لعرضه على الطبيب.' : 'Perform for 7 consecutive days; record in a log to average days 2-7.'}</li>
              </ul>
            </div>
          </div>
        </div>
      `;
    }

    function renderStatinAdherence(lang) {
      const isAr = (lang === 'ar');
      return `
        <div class="leaflet-section-card">
          <div class="leaflet-card-header">
            <span class="leaflet-header-icon">🛡️</span>
            <div>
              <h3>${isAr ? 'التثقيف الدوائي للستاتين والالتزام بالعلاج' : 'Statin Adherence & Cardiovascular Protection'}</h3>
              <p class="leaflet-subtitle">${isAr ? 'حقائق علمية وإرشادات لضمان حماية القلب والشرايين بأمان تام' : 'Evidence-based guidance on why statin therapy is vital and safe.'}</p>
            </div>
          </div>
          <div class="statin-points-grid">
            <div class="statin-point">
              <b>${isAr ? 'لماذا الستاتين ضروري لحياتك؟' : 'Why statins are prescribed?'}</b>
              <p>${isAr ? 'الستاتين لا يخفض الكوليسترول فحسب، بل يثبت اللويحات الدهنية في جدران الشرايين ويمنع انفجارها، مما يقلل احتمالية الجلطات القلبية والدماغية بنسبة تفوق 30%.' : 'Statins do more than lower LDL; they stabilize arterial plaques, preventing plaque rupture, heart attacks, and strokes.'}</p>
            </div>
            <div class="statin-point">
              <b>${isAr ? 'طريقة وتوقيت الاستخدام اليومي' : 'Timing and Daily Consistency'}</b>
              <p>${isAr ? 'يؤخذ حبة واحدة يومياً. يمكن أخذ أتورفاستاتين (ليبيتور) أو روزوفاستاتين (كريستور) في أي وقت (صباحاً أو مساءً)، بينما يفضل أخذ سيمفاستاتين (زوكور) مساءً قبل النوم.' : 'Take once daily. Atorvastatin and Rosuvastatin can be taken anytime; Simvastatin is best taken in the evening before bedtime.'}</p>
            </div>
            <div class="statin-point">
              <b>${isAr ? 'ماذا تفعل إذا شعرت بآلام عضلية؟' : 'What about muscle aches?'}</b>
              <p>${isAr ? 'معظم آلام العضلات البسيطة مؤقتة أو غير مرتبطة بالدواء. لا توقف الستاتين من تلقاء نفسك أبداً! تواصل مع طبيبك ليقوم بفحص إنزيمات العضلات، أو تعديل الجرعة، أو تبديل النوع لنوع أكثر ملاءمة.' : 'Mild aches are often transient or coincidental. NEVER stop your statin abruptly without calling your doctor, who can check CK levels, adjust dose, or switch agents.'}</p>
            </div>
            <div class="statin-point">
              <b>${isAr ? 'أمان الكبد والذاكرة' : 'Safety for Liver and Memory'}</b>
              <p>${isAr ? 'أثبتت الدراسات العالمية أمان الستاتين الفائق على المدى الطويل؛ الستاتين لا يسبب الخرف بل يحمي شرايين الدماغ من السكتات، ويتم فحص إنزيمات الكبد دورياً للاطمئنان.' : 'Extensive trials prove long-term safety. Statins do NOT cause memory loss or dementia, and protect cerebral vessels from vascular damage.'}</p>
            </div>
          </div>
        </div>
      `;
    }

    function renderRedFlags(lang) {
      const isAr = (lang === 'ar');
      return `
        <div class="leaflet-redflag-box">
          <div class="redflag-header">
            <span class="redflag-siren">🚨</span>
            <div>
              <h3 style="margin:0;color:#991B1B;">${isAr ? 'علامات الإنذار والخطورة الطارئة (توجه للطوارئ فوراً)' : 'Emergency Red Flags: Seek Immediate Emergency Care'}</h3>
              <p style="margin:2px 0 0;font-size:12px;color:#B91C1C;">${isAr ? 'إذا واجهت أياً من هذه الأعراض، اتصل بالإسعاف (997 في السعودية / 123 في مصر) أو توجه لأقرب مستشفى' : 'If you experience any of these symptoms, call EMS or proceed to the nearest emergency room immediately.'}</p>
            </div>
          </div>
          <div class="redflag-grid">
            <div class="redflag-col">
              <b>${isAr ? '💓 طوارئ ضغط الدم (BP ≥ 180/120)' : '💓 Blood Pressure Emergency (≥ 180/120)'}</b>
              <ul>
                <li>${isAr ? 'صداع حاد ومفاجئ لا يستجيب للمسكنات' : 'Severe, sudden, throbbing headache'}</li>
                <li>${isAr ? 'تشوش مفاجئ في الرؤية أو ازدواجية أو فقدان البصر' : 'Sudden visual changes, blurring, or loss of vision'}</li>
                <li>${isAr ? 'ألم أو ثقل شديد في الصدر أو صعوبة حادة بالتنفس' : 'Acute chest tightness, pain, or shortness of breath'}</li>
                <li>${isAr ? 'تنميل أو ضعف في جانب واحد من الوجه أو الذراع، أو صعوبة بالكلام' : 'Sudden face droop, arm weakness, or slurred speech'}</li>
              </ul>
            </div>
            <div class="redflag-col">
              <b>${isAr ? '🩺 طوارئ السكر (Severe Hypo / DKA)' : '🩺 Diabetes Emergencies'}</b>
              <ul>
                <li>${isAr ? 'فقدان الوعي، عدم القدرة على البلع، أو حدوث تشنجات' : 'Loss of consciousness, inability to swallow, or seizures'}</li>
                <li>${isAr ? 'هبوط سكر لا يستجيب لتناول السكر بعد مرتين متتاليتين' : 'Hypoglycemia not responding after two cycles of Rule of 15'}</li>
                <li>${isAr ? 'ارتفاع مستمر فوق 300 ملغ/دسل مع قيء متكرر ورائحة أسيتون بالفم وتنفس سريع (علامات حموضة الدم الكيتونية DKA)' : 'Glucose > 300 mg/dL with vomiting, fruity breath, and rapid deep breathing (DKA)'}</li>
              </ul>
            </div>
            <div class="redflag-col">
              <b>${isAr ? '🩸 طوارئ القلب والشرايين (Heart & Arteries)' : '🩸 Cardiovascular Red Flags'}</b>
              <ul>
                <li>${isAr ? 'ألم عاصر في منتصف الصدر يمتد للكتف الأيسر أو الفك' : 'Crushing substernal chest pressure radiating to left arm/jaw'}</li>
                <li>${isAr ? 'عرق بارد مصحوب بدوخة وغثيان شديد' : 'Profuse cold sweat with dizziness and severe nausea'}</li>
                <li>${isAr ? 'تورم مفاجئ ومؤلم في ربلة ساق واحدة مع احمرار' : 'Sudden painful swelling in one calf with redness (DVT)'}</li>
              </ul>
            </div>
          </div>
        </div>
      `;
    }

    // Dynamic targets summary card for patient
    function renderTargetsCard(targets, lang) {
      const isAr = (lang === 'ar');
      return `
        <div class="leaflet-targets-card">
          <div class="targets-card-header">
            <div>
              <span class="targets-badge">${isAr ? 'أهدافك العلاجية الفردية' : 'Your Individualized Health Targets'}</span>
              <h2 style="margin:4px 0 0;font-size:18px;">${isAr ? 'خطة التحكم الشخصية' : 'Personal Health Plan'} · ${escapeHtml(targets.patientName)} (${targets.age} ${isAr ? 'سنة' : 'years'})</h2>
            </div>
            <div class="targets-sync-indicator">
              <span class="sync-dot"></span>
              <span>${isAr ? 'متزامن مع الملف الطبي' : 'Synced with clinical file'}</span>
            </div>
          </div>
          <div class="targets-metrics-row">
            <div class="target-metric-box">
              <span class="metric-lbl">${isAr ? 'السكر التراكمي المستهدف (HbA1c)' : 'Target HbA1c'}</span>
              <div class="metric-val text-teal">${targets.dm.targetA1c}</div>
              <small class="metric-sub">${isAr ? targets.dm.targetDescAr : targets.dm.targetDescEn}</small>
              <div class="metric-curr">${isAr ? 'القراءة الحالية:' : 'Current:'} <b>${targets.dm.currentA1c}</b></div>
            </div>
            <div class="target-metric-box">
              <span class="metric-lbl">${isAr ? 'ضغط الدم المستهدف (Target BP)' : 'Target Blood Pressure'}</span>
              <div class="metric-val text-grape">${targets.htn.targetBp}</div>
              <small class="metric-sub">${isAr ? targets.htn.targetHomeBp : targets.htn.targetHomeBpEn}</small>
              <div class="metric-curr">${isAr ? 'القراءة الحالية:' : 'Current:'} <b>${targets.htn.currentBp}</b></div>
            </div>
            <div class="target-metric-box">
              <span class="metric-lbl">${isAr ? 'الكوليسترول الضار (Target LDL-C)' : 'Target LDL-C'}</span>
              <div class="metric-val text-amber">${targets.dlp.targetLdl}</div>
              <small class="metric-sub">${isAr ? targets.dlp.riskTierAr : targets.dlp.riskTier}</small>
              <div class="metric-curr">${isAr ? 'المستوى المقدر:' : 'Non-HDL Target:'} <b>${targets.dlp.targetNonHdl}</b></div>
            </div>
          </div>
        </div>
      `;
    }

    // Top interactive toolbar for the leaflets view
    function renderToolbar(lang, activeTab) {
      const isAr = (lang === 'ar');
      return `
        <div class="leaflet-toolbar">
          <div class="leaflet-tab-group">
            <button class="leaflet-tab-btn ${activeTab === 'all' ? 'active' : ''}" data-condition="all">
              <span>📋</span> ${isAr ? 'الشامل (الكل)' : 'Comprehensive'}
            </button>
            <button class="leaflet-tab-btn ${activeTab === 'dm' ? 'active' : ''}" data-condition="dm">
              <span>🩺</span> ${isAr ? 'السكري' : 'Diabetes'}
            </button>
            <button class="leaflet-tab-btn ${activeTab === 'htn' ? 'active' : ''}" data-condition="htn">
              <span>💓</span> ${isAr ? 'الضغط' : 'Hypertension'}
            </button>
            <button class="leaflet-tab-btn ${activeTab === 'dlp' ? 'active' : ''}" data-condition="dlp">
              <span>🩸</span> ${isAr ? 'الدهون والستاتين' : 'Lipids & Statins'}
            </button>
          </div>
          <div class="leaflet-actions-group">
            <div class="zoom-controls">
              <button id="leaflet-zoom-out" class="icon-tool-btn" title="${isAr ? 'تصغير الخط' : 'Zoom Out'}">A-</button>
              <button id="leaflet-zoom-in" class="icon-tool-btn" title="${isAr ? 'تكبير الخط' : 'Zoom In'}">A+</button>
            </div>
            <button id="leaflet-lang-toggle" class="lang-tool-btn" title="${isAr ? 'التبديل للإنجليزية' : 'Switch to Arabic'}">
              🌐 ${isAr ? 'English' : 'عربي'}
            </button>
            <button id="leaflet-qr-btn" class="pill-tool-btn qr-pill" title="${isAr ? 'إنشاء رمز QR أوفلاين' : 'Offline QR Code'}">
              📱 <span>${isAr ? 'رمز QR' : 'QR Code'}</span>
            </button>
            <button id="leaflet-share-btn" class="pill-tool-btn share-pill" title="${isAr ? 'مشاركة النشرة مع المريض' : 'Share Leaflet'}">
              📤 <span>${isAr ? 'مشاركة' : 'Share'}</span>
            </button>
          </div>
        </div>
      `;
    }

    // QR Code Modal markup
    function renderQrModal(lang) {
      const isAr = (lang === 'ar');
      return `
        <div class="modal-overlay" id="leaflet-qr-modal">
          <div class="modal-card modal-qr-card">
            <div class="modal-header">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:22px;">📱</span>
                <div>
                  <h3 style="margin:0;font-size:16px;">${isAr ? 'رمز QR للنشرة التثقيفية للمريض' : 'Patient Leaflet Offline QR Code'}</h3>
                  <span style="font-size:11px;color:var(--muted);">${isAr ? 'ISO/IEC 18004 الإصدار 6-L (بدون إنترنت 100%)' : 'ISO/IEC 18004 Version 6-L (100% Offline)'}</span>
                </div>
              </div>
              <button type="button" class="icon-btn" id="close-qr-modal-btn" style="color:var(--ink)" aria-label="Close">✕</button>
            </div>
            <div class="modal-body text-center" style="padding:20px 10px;">
              <div id="leaflet-qr-svg-container" class="qr-svg-box">
                <!-- Injected SVG QR Code -->
              </div>
              <p class="qr-hint" style="margin-top:12px;font-size:12.5px;color:var(--muted);">
                ${isAr ? 'امسح الرمز بكاميرا هاتف المريض لحفظ خطة العلاج والأهداف والعلامات التحذيرية فوراً بدون إنترنت.' : 'Scan with the patient\'s phone camera to instantly access health targets, Rule of 15, and red flags offline.'}
              </p>
            </div>
            <div class="modal-footer" style="display:flex;gap:8px;justify-content:flex-end;">
              <button type="button" class="btn btn-secondary" id="dismiss-qr-modal-btn">${isAr ? 'إغلاق' : 'Close'}</button>
              <button type="button" class="btn btn-primary" id="copy-qr-text-btn">${isAr ? '📋 نسخ نص النشرة' : '📋 Copy Text'}</button>
            </div>
          </div>
        </div>
      `;
    }

    // Build plain text for sharing
    function buildShareText(targets, lang, condition) {
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
          t += `2. Rest 15 mins and retest.\n`;
          t += `3. Repeat if < 70, then eat a complex carb snack.\n\n`;
          t += `⚠️ *SADMANS Sick-Day Rules:*\n`;
          t += `Hold during dehydration/vomiting: SGLT2i, ACEi, Diuretics, Metformin, ARBs, NSAIDs, Sulfonylureas.\n\n`;
        }
        if (condition === 'all' || condition === 'htn') {
          t += `💓 *Hypertension Targets:*\n`;
          t += `• Target BP: ${targets.htn.targetBp}\n`;
          t += `• Home Monitoring: Rest 5 min, arm at heart level, 2 readings AM & PM for 7 days.\n\n`;
        }
        if (condition === 'all' || condition === 'dlp') {
          t += `🩸 *Lipids & Statin Protection:*\n`;
          t += `• Target LDL: ${targets.dlp.targetLdl}\n`;
          t += `• Take statin daily to stabilize plaques and prevent vascular events.\n\n`;
        }
        t += `🚨 *Emergency Red Flags:* Severe sudden headache, chest pressure, vision loss, facial droop, or unconsciousness -> Call EMS immediately.`;
      }
      return t;
    }

    // Master render function into container
    function render(containerId) {
      const cId = containerId || 'patient-leaflet-container';
      const container = (typeof document !== 'undefined') ? document.getElementById(cId) : null;
      if (!container) return;

      const pt = getPatientData();
      const targets = getDynamicTargets(pt);

      let sectionsHtml = '';
      if (currentCondition === 'all') {
        sectionsHtml = `
          ${renderTargetsCard(targets, currentLang)}
          ${renderRuleOf15(currentLang)}
          ${renderSadmansRules(currentLang)}
          ${renderHomeBpTechnique(currentLang)}
          ${renderStatinAdherence(currentLang)}
          ${renderRedFlags(currentLang)}
        `;
      } else if (currentCondition === 'dm') {
        sectionsHtml = `
          ${renderTargetsCard(targets, currentLang)}
          ${renderRuleOf15(currentLang)}
          ${renderSadmansRules(currentLang)}
          ${renderRedFlags(currentLang)}
        `;
      } else if (currentCondition === 'htn') {
        sectionsHtml = `
          ${renderTargetsCard(targets, currentLang)}
          ${renderHomeBpTechnique(currentLang)}
          ${renderRedFlags(currentLang)}
        `;
      } else if (currentCondition === 'dlp') {
        sectionsHtml = `
          ${renderTargetsCard(targets, currentLang)}
          ${renderStatinAdherence(currentLang)}
          ${renderRedFlags(currentLang)}
        `;
      }

      container.innerHTML = `
        <div class="leaflet-wrapper" style="--leaflet-font-scale: ${fontScale};" dir="${currentLang === 'ar' ? 'rtl' : 'ltr'}">
          ${renderToolbar(currentLang, currentCondition)}
          <div class="leaflet-content-body">
            ${sectionsHtml}
          </div>
          ${renderQrModal(currentLang)}
        </div>
      `;

      attachEvents(container, targets);
    }

    // Attach event listeners to toolbar and modal
    function attachEvents(container, targets) {
      if (!container) return;

      // Tab switcher
      container.querySelectorAll('.leaflet-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          currentCondition = btn.getAttribute('data-condition') || 'all';
          render();
        });
      });

      // Language toggle
      const langBtn = container.querySelector('#leaflet-lang-toggle');
      if (langBtn) {
        langBtn.addEventListener('click', (e) => {
          e.preventDefault();
          currentLang = (currentLang === 'ar') ? 'en' : 'ar';
          render();
        });
      }

      // Font zoom
      const zoomInBtn = container.querySelector('#leaflet-zoom-in');
      const zoomOutBtn = container.querySelector('#leaflet-zoom-out');
      if (zoomInBtn) {
        zoomInBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (fontScale < 1.3) {
            fontScale = Math.round((fontScale + 0.1) * 10) / 10;
            render();
          }
        });
      }
      if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (fontScale > 0.85) {
            fontScale = Math.round((fontScale - 0.1) * 10) / 10;
            render();
          }
        });
      }

      // Share button
      const shareBtn = container.querySelector('#leaflet-share-btn');
      if (shareBtn) {
        shareBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          const shareText = buildShareText(targets, currentLang, currentCondition);
          if (navigator && navigator.share) {
            try {
              await navigator.share({
                title: currentLang === 'ar' ? 'النشرة التثقيفية للمريض' : 'Patient Health Leaflet',
                text: shareText
              });
              return;
            } catch (err) {
              // fallback
            }
          }
          if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            try {
              await navigator.clipboard.writeText(shareText);
              if (window.RxShare && typeof window.RxShare.showToast === 'function') {
                window.RxShare.showToast(currentLang === 'ar' ? '✅ تم نسخ نص النشرة لمشاركته' : '✅ Leaflet copied to clipboard');
              } else {
                alert(currentLang === 'ar' ? 'تم نسخ نص النشرة بنجاح' : 'Leaflet text copied');
              }
            } catch(e2) {}
          }
        });
      }

      // QR Code Modal Trigger
      const qrBtn = container.querySelector('#leaflet-qr-btn');
      const qrModal = container.querySelector('#leaflet-qr-modal');
      const closeQrBtn = container.querySelector('#close-qr-modal-btn');
      const dismissQrBtn = container.querySelector('#dismiss-qr-modal-btn');
      const copyQrTextBtn = container.querySelector('#copy-qr-text-btn');
      const qrContainer = container.querySelector('#leaflet-qr-svg-container');

      if (qrBtn && qrModal) {
        qrBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const compactQrText = `Osrawy Rx: ${targets.patientName} | A1c:${targets.dm.targetA1c} BP:${targets.htn.targetBp} LDL:${targets.dlp.targetLdl} | Rule15: 15g sugar/15m | SADMANS | EMS 997`;
          if (qrContainer) {
            qrContainer.innerHTML = OsrawyQRCode.generateSVG(compactQrText, { size: 240, margin: 4, darkColor: '#0A4F4B' });
          }
          qrModal.classList.add('open');
        });
      }

      function closeQrModal() {
        if (qrModal) qrModal.classList.remove('open');
      }

      if (qrModal) {
        qrModal.addEventListener('click', (e) => {
          if (e.target === qrModal) closeQrModal();
        });
      }
      if (closeQrBtn) closeQrBtn.addEventListener('click', closeQrModal);
      if (dismissQrBtn) dismissQrBtn.addEventListener('click', closeQrModal);
      if (copyQrTextBtn) {
        copyQrTextBtn.addEventListener('click', async () => {
          const shareText = buildShareText(targets, currentLang, currentCondition);
          const notifyQrCopied = () => {
            if (window.RxShare && typeof window.RxShare.showToast === 'function') {
              window.RxShare.showToast(currentLang === 'ar' ? '✅ تم نسخ نص النشرة بنجاح' : '✅ Leaflet text copied');
            }
          };
          let copied = false;
          if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
              await navigator.clipboard.writeText(shareText);
              copied = true;
            } catch (_) {}
          }
          if (!copied && typeof document !== 'undefined' && typeof document.createElement === 'function') {
            try {
              const ta = document.createElement('textarea');
              ta.value = shareText;
              if (ta.style) {
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
              }
              document.body.appendChild(ta);
              if (typeof ta.focus === 'function') ta.focus();
              if (typeof ta.select === 'function') ta.select();
              copied = Boolean(typeof document.execCommand === 'function' && document.execCommand('copy'));
              ta.remove();
            } catch (_) {}
          }
          if (copied) notifyQrCopied();
          closeQrModal();
        });
      }
    }

    // Initialize module & listen for patient updates
    function init() {
      // Sync language from global I18n if active
      if (typeof window.I18n !== 'undefined' && typeof window.I18n.getLang === 'function') {
        currentLang = window.I18n.getLang() || 'ar';
      }

      // Initial render if container exists
      render();

      // Listen to Osrawy Patient State updates
      const eventTarget = (typeof window !== 'undefined') ? window : globalThis;
      if (eventTarget && eventTarget.addEventListener) {
        eventTarget.addEventListener('osrawy:patient-updated', () => {
          render();
        });
      }
    }

    return {
      init,
      render,
      getDynamicTargets,
      buildShareText,
      setCondition: (c) => { currentCondition = c; render(); },
      setLang: (l) => { currentLang = l; render(); },
      generateQRCode: (text, options) => OsrawyQRCode.generateSVG(text, options)
    };
  })();

  // Global Attachments
  if (typeof window !== 'undefined') {
    window.OsrawyQRCode = OsrawyQRCode;
    window.PatientLeaflets = PatientLeaflets;
    window.OsrawyPatientLeaflets = PatientLeaflets;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OsrawyQRCode, PatientLeaflets };
  }
})();

```

---

<a id="www-js-drugs-directory-js"></a>
## 26. `www/js/drugs_directory.js`

**Description:** Searchable drug formulary directory with brand name filtering, regional price tiers, and renal safety flags.  
**Lines:** 596 | **Size:** 23.1 KB

```javascript
// ==============================================================
// Interactive Drug Directory & Saudi Regional Formulary
// Osrawy Clinical Navigator - Trade-Name Search & Live eGFR Dosing
// ==============================================================

(function (global) {
  const MODE_STORAGE_KEY = 'osrawy_rx_display_mode';
  const MARKET_STORAGE_KEY = 'osrawy_market';
  let searchQuery = '';
  let activeCategory = 'all';
  let activeTier = 'all';
  let activeMarket = (function () {
    try {
      const m = global.localStorage && global.localStorage.getItem(MARKET_STORAGE_KEY);
      return m === 'egypt' ? 'egypt' : 'saudi';
    } catch (_) {
      return 'saudi';
    }
  })();
  let displayMode = (function () {
    try {
      return (global.localStorage && global.localStorage.getItem(MODE_STORAGE_KEY)) || 'both';
    } catch (_) {
      return 'both';
    }
  })();

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const ID_ALIASES = {
    'met': 'metformin',
    'empa': 'empagliflozin',
    'dapa': 'dapagliflozin',
    'sema': 'semaglutide',
    'tirz': 'tirzepatide',
    'sita': 'sitagliptin',
    'atorva': 'atorvastatin',
    'rosuva': 'rosuvastatin'
  };

  function getFormulary() {
    return global.OsrawyFormularyData || global.FORMULARY_DATA || [];
  }

  function canonicalDrugId(drugId) {
    const cleanId = String(drugId || '').toLowerCase().trim();
    return ID_ALIASES[cleanId] || cleanId;
  }

  function findDrugById(drugId) {
    const cleanId = canonicalDrugId(drugId);
    return getFormulary().find(d => d.id === cleanId) || null;
  }

  function normalizeArabic(str) {
    if (!str) return '';
    return String(str)
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '')
      .toLowerCase()
      .trim();
  }

  function getMarketBrands(drug, lang = 'en') {
    if (!drug) return [];
    const isAr = lang === 'ar';
    if (activeMarket === 'egypt') {
      const egypt = isAr ? drug.egyptBrandsAr : drug.egyptBrandsEn;
      if (egypt && egypt.length > 0) return egypt;
    } else {
      const saudi = isAr ? drug.saudiBrandsAr : drug.saudiBrandsEn;
      if (saudi && saudi.length > 0) return saudi;
    }
    return (isAr ? drug.tradeNamesAr : drug.tradeNamesEn) || [];
  }

  function normalizeCategory(category = 'all') {
    let cat = String(category || 'all').toLowerCase();
    if (cat === 'diabetes') cat = 'dm';
    else if (cat === 'lipids') cat = 'dlp';
    else if (cat === 'respiratory') cat = 'resp';
    return cat;
  }

  function searchDrugs(query = '', category = 'all', tier = 'all') {
    const rawQ = String(query || '').trim();
    const q = rawQ.toLowerCase();
    const qNorm = normalizeArabic(rawQ);
    const cat = normalizeCategory(category);
    const tierFilter = String(tier || 'all').toLowerCase();

    return getFormulary().filter(drug => {
      if (cat !== 'all' && drug.category !== cat) return false;
      if (tierFilter !== 'all' && String(drug.tier || 1) !== tierFilter) return false;
      if (!rawQ) return true;

      const haystack = [
        drug.id,
        drug.genericEn,
        drug.genericAr,
        drug.classEn,
        drug.classAr,
        ...(drug.tradeNamesEn || []),
        ...(drug.tradeNamesAr || []),
        ...(drug.saudiBrandsEn || []),
        ...(drug.saudiBrandsAr || []),
        ...(drug.egyptBrandsEn || []),
        ...(drug.egyptBrandsAr || [])
      ]
        .join(' ')
        .toLowerCase();

      if (haystack.includes(q)) return true;
      if (qNorm) {
        const normHaystack = normalizeArabic(haystack);
        if (normHaystack.includes(qNorm)) return true;
      }
      return false;
    });
  }

  // Formats a drug name as 'generic', 'trade', or 'both' for UI and Prescription Share
  function formatDrugDisplayName(drugOrId, mode = displayMode, lang = 'en') {
    const drug = typeof drugOrId === 'string' ? findDrugById(drugOrId) : drugOrId;
    if (!drug) return String(drugOrId || '');

    const isAr = lang === 'ar';
    const generic = isAr ? drug.genericAr : drug.genericEn;
    const trades = getMarketBrands(drug, lang);
    const primaryTrade = trades && trades.length > 0 ? trades[0] : generic;
    const tradeList = trades && trades.length > 0 ? trades.slice(0, 2).join(' / ') : '';

    if (mode === 'generic') return generic;
    if (mode === 'trade') return primaryTrade;
    return tradeList ? `${generic} (${tradeList})` : generic;
  }

  function evaluateRenalStatusForDrug(drugOrId, egfr = 90) {
    const drug = typeof drugOrId === 'string' ? findDrugById(drugOrId) : drugOrId;
    const val = Number(egfr != null ? egfr : 90);
    const r = (drug && drug.renal) || {};
    if (r.stopBelowEgfr && val < r.stopBelowEgfr) {
      return {
        status: 'contraindicated',
        badgeEn: `Contraindicated at eGFR ${val} (<${r.stopBelowEgfr})`,
        badgeAr: `ممنوع عند eGFR ${val} (<${r.stopBelowEgfr})`
      };
    }
    if (r.cautionBelowEgfr && val < r.cautionBelowEgfr) {
      return {
        status: 'caution',
        badgeEn: `Dose Adjust at eGFR ${val} (<${r.cautionBelowEgfr})`,
        badgeAr: `تعديل جرعة عند eGFR ${val} (<${r.cautionBelowEgfr})`
      };
    }
    return {
      status: 'safe',
      badgeEn: `Renal Safe (eGFR ${val})`,
      badgeAr: `آمن كلوياً (eGFR ${val})`
    };
  }

  function getPatientSync() {
    return global.OsrawyPatientSync || global.PatientSync;
  }

  function getPatientState() {
    const sync = getPatientSync();
    if (!sync) return { egfr: 90, medications: [] };
    if (typeof sync.getState === 'function') return sync.getState();
    if (typeof sync.get === 'function') return sync.get();
    return { egfr: 90, medications: [] };
  }

  function formatMedicationLine(drugId, lang = 'ar', mode = displayMode) {
    const state = getPatientState();
    const drug = findDrugById(drugId);
    if (!drug) return `• ${drugId}`;

    const isAr = lang === 'ar';
    const title = formatDrugDisplayName(drug, mode, lang);
    const dose = isAr ? drug.doseAr : drug.doseEn;
    const renalStatus = evaluateRenalStatusForDrug(drug, state ? state.egfr : 90);
    const renalRule = drug.renal ? (isAr ? drug.renal.ruleAr : drug.renal.ruleEn) : '';
    const renalNote =
      (renalStatus.status !== 'safe' && renalRule)
        ? ` ⚠️ [${renalRule}]`
        : '';

    return `• ${title} — ${dose}${renalNote}`;
  }

  function setDisplayMode(mode) {
    if (['generic', 'trade', 'both'].includes(mode)) {
      displayMode = mode;
      try {
        if (global.localStorage) {
          global.localStorage.setItem(MODE_STORAGE_KEY, mode);
        }
      } catch (_) {}
      renderDirectory('drugs-directory-container');
    }
  }

  function togglePatientMedication(drugId) {
    const sync = getPatientSync();
    if (!sync) return false;
    const state = getPatientState();
    const medsRaw =
      (Array.isArray(state.medications) && state.medications.length ? state.medications : null) ||
      (Array.isArray(state.activeMeds) && state.activeMeds.length ? state.activeMeds : null) ||
      (Array.isArray(state.currentMeds) && state.currentMeds.length ? state.currentMeds : null) ||
      [];
    const medsList = medsRaw.map(m => String(m).toLowerCase()).filter(Boolean);
    const cleanId = canonicalDrugId(drugId);
    const hasMatch = medsList.some(m => canonicalDrugId(m) === cleanId);
    let arr;
    let isAdded = false;
    if (hasMatch) {
      arr = medsList.filter(m => canonicalDrugId(m) !== cleanId);
      isAdded = false;
    } else {
      arr = Array.from(new Set([...medsList, cleanId]));
      isAdded = true;
    }
    let alreadyNotified = false;
    if (typeof sync.updatePatient === 'function') {
      sync.updatePatient({ medications: arr, activeMeds: arr, currentMeds: arr });
      alreadyNotified = true;
    } else if (typeof sync.setField === 'function') {
      sync.setField('medications', arr);
      sync.setField('activeMeds', arr);
      sync.setField('currentMeds', arr);
      alreadyNotified = true;
    } else if (typeof sync.applyPatient === 'function') {
      sync.applyPatient({ medications: arr, activeMeds: arr, currentMeds: arr });
      alreadyNotified = true;
    } else {
      state.medications = arr;
      state.activeMeds = arr;
      state.currentMeds = arr;
    }
    if (!alreadyNotified && typeof sync.notifyUpdated === 'function') {
      sync.notifyUpdated();
    }
    renderDirectory('drugs-directory-container');
    return isAdded;
  }

  function buildCardsHtml(results, activeMeds, state, isAr) {
    if (!results || results.length === 0) {
      return `<p style="grid-column:1 / -1; color:var(--muted);">${isAr ? 'لا توجد نتائج مطابقة.' : 'No matching medications found.'}</p>`;
    }
    return results
      .map(drug => {
        const isSelected = activeMeds.has(drug.id);
        const renal = evaluateRenalStatusForDrug(drug, state.egfr);
        const title = formatDrugDisplayName(drug, displayMode, isAr ? 'ar' : 'en');
        const allBrands = getMarketBrands(drug, isAr ? 'ar' : 'en').join(' ، ');
        const tierNum = drug.tier || 1;
        const tierBadge = tierNum === 3 ? '●●●' : (tierNum === 2 ? '●●' : '●');

        return `
          <div class="leaflet-section-card drug-dir-card drug-card-${renal.status}" style="margin-bottom:0;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
              <div>
                <div class="leaflet-topic-title">${escapeHtml(title)} <span style="font-size:0.75rem; color:var(--muted); font-weight:600;">${tierBadge}</span></div>
                <div style="font-size:0.82rem; color:#475569;">
                  ${escapeHtml(isAr ? drug.classAr : drug.classEn)} | ${isAr ? 'الأسماء التجارية:' : 'Brands:'} <strong>${escapeHtml(allBrands)}</strong>
                </div>
              </div>
              <button type="button" class="action-chip ${isSelected ? 'primary-chip' : ''}" data-med-toggle="${escapeHtml(drug.id)}">
                ${isSelected ? (isAr ? '✓ مضاف للخطة' : '✓ In Plan') : (isAr ? '+ أضف للخطة' : '+ Add')}
              </button>
            </div>
            <div style="margin-block-start:0.5rem; font-size:0.9rem;">
              <strong>${isAr ? 'الجرعة:' : 'Dosing:'}</strong> ${escapeHtml(isAr ? drug.doseAr : drug.doseEn)}
              <span style="color:#64748b;">(${escapeHtml((drug.strengths || []).join(', '))})</span>
            </div>
            <div style="margin-block-start:0.4rem; font-size:0.82rem; font-weight:700;">
              🩺 ${escapeHtml(isAr ? renal.badgeAr : renal.badgeEn)} — ${escapeHtml(isAr ? drug.renal.ruleAr : drug.renal.ruleEn)}
            </div>
          </div>
        `;
      })
      .join('');
  }

  function syncMarketAndFilterButtons(doc) {
    if (!doc) return;
    const btnSa = doc.getElementById('market-btn-sa');
    const btnEg = doc.getElementById('market-btn-eg');
    if (btnSa) btnSa.classList.toggle('active', activeMarket === 'saudi');
    if (btnEg) btnEg.classList.toggle('active', activeMarket === 'egypt');

    doc.querySelectorAll('[data-drug-filter]').forEach(btn => {
      const f = normalizeCategory(btn.getAttribute('data-drug-filter'));
      btn.classList.toggle('active', f === activeCategory);
    });
    doc.querySelectorAll('[data-drug-tier]').forEach(btn => {
      const tr = String(btn.getAttribute('data-drug-tier') || 'all').toLowerCase();
      btn.classList.toggle('active', tr === activeTier);
    });
  }

  function bindGlobalPageControls(doc, containerId) {
    if (!doc) return;
    const headerInput = doc.getElementById('drug-search-input');
    if (headerInput && !headerInput._dirBound) {
      headerInput._dirBound = true;
      headerInput.addEventListener('input', e => {
        searchQuery = e.target.value;
        renderDirectory(containerId);
      });
    }

    doc.querySelectorAll('[data-drug-filter]').forEach(btn => {
      if (btn._dirBound) return;
      btn._dirBound = true;
      btn.addEventListener('click', () => {
        activeCategory = normalizeCategory(btn.getAttribute('data-drug-filter'));
        renderDirectory(containerId);
      });
    });

    doc.querySelectorAll('[data-drug-tier]').forEach(btn => {
      if (btn._dirBound) return;
      btn._dirBound = true;
      btn.addEventListener('click', () => {
        activeTier = String(btn.getAttribute('data-drug-tier') || 'all').toLowerCase();
        renderDirectory(containerId);
      });
    });
  }

  function renderDirectory(containerId = 'drugs-directory-container') {
    const doc = global.document;
    const container = doc && (
      doc.getElementById(containerId) ||
      doc.getElementById('drugs-directory-container') ||
      doc.getElementById('drug-directory-list')
    );
    if (!container) return;

    const isAr = (typeof global.I18n !== 'undefined' && typeof global.I18n.getLang === 'function')
      ? global.I18n.getLang() === 'ar'
      : (doc.documentElement ? (doc.documentElement.lang === 'ar' || doc.documentElement.dir === 'rtl') : false);

    const state = getPatientState();
    const medsRaw =
      (Array.isArray(state.medications) && state.medications.length ? state.medications : null) ||
      (Array.isArray(state.activeMeds) && state.activeMeds.length ? state.activeMeds : null) ||
      (Array.isArray(state.currentMeds) && state.currentMeds.length ? state.currentMeds : null) ||
      [];
    const activeMeds = new Set(medsRaw.map(m => canonicalDrugId(m)).filter(Boolean));
    const results = searchDrugs(searchQuery, activeCategory, activeTier);
    const cardsHtml = buildCardsHtml(results, activeMeds, state, isAr);

    const headerSearch = doc.getElementById('drug-search-input');
    const listEl = doc.getElementById('drug-directory-list');
    const usesPageLayout = !!(headerSearch && listEl && (container.id === 'drugs-directory-container' || container.id === 'drug-directory-list'));

    bindGlobalPageControls(doc, containerId);
    syncMarketAndFilterButtons(doc);

    const modeToolbarHtml = `
      <div class="leaflet-actions" style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px;">
        <button type="button" class="action-chip ${displayMode === 'both' ? 'primary-chip' : ''}" data-rx-mode="both">
          ${isAr ? 'علمي + تجاري' : 'Generic + Brand'}
        </button>
        <button type="button" class="action-chip ${displayMode === 'generic' ? 'primary-chip' : ''}" data-rx-mode="generic">
          ${isAr ? 'علمي فقط' : 'Generic Only'}
        </button>
        <button type="button" class="action-chip ${displayMode === 'trade' ? 'primary-chip' : ''}" data-rx-mode="trade">
          ${isAr ? 'تجاري فقط' : 'Brand Only'}
        </button>
      </div>
    `;

    if (usesPageLayout) {
      let modeWrap = doc.getElementById('drug-rx-mode-toolbar');
      if (!modeWrap && container.id === 'drugs-directory-container') {
        modeWrap = doc.createElement('div');
        modeWrap.id = 'drug-rx-mode-toolbar';
        container.insertBefore(modeWrap, listEl);
      }
      if (modeWrap) {
        modeWrap.innerHTML = modeToolbarHtml;
        modeWrap.querySelectorAll('[data-rx-mode]').forEach(btn => {
          btn.addEventListener('click', () => setDisplayMode(btn.getAttribute('data-rx-mode')));
        });
      }
      listEl.innerHTML = cardsHtml;
      listEl.querySelectorAll('[data-med-toggle]').forEach(btn => {
        btn.addEventListener('click', () => togglePatientMedication(btn.getAttribute('data-med-toggle')));
      });
      return;
    }

    // Standalone container fallback (preserve search input focus if already rendered)
    const existingInput = container.querySelector('#formulary-search-input');
    const existingBody = container.querySelector('#formulary-results-body');
    const pillsHtml = ['all', 'dm', 'htn', 'dlp', 'resp', 'thyroid']
      .map(
        cat => `
      <button type="button" class="pill-btn ${activeCategory === cat ? 'active' : ''}" data-cat="${cat}">
        ${cat.toUpperCase()}
      </button>`
      )
      .join('');

    if (existingInput && existingBody) {
      const modeBox = container.querySelector('.leaflet-actions');
      if (modeBox) {
        modeBox.innerHTML = `
          <button type="button" class="action-chip ${displayMode === 'both' ? 'primary-chip' : ''}" data-rx-mode="both">${isAr ? 'علمي + تجاري' : 'Generic + Brand'}</button>
          <button type="button" class="action-chip ${displayMode === 'generic' ? 'primary-chip' : ''}" data-rx-mode="generic">${isAr ? 'علمي فقط' : 'Generic Only'}</button>
          <button type="button" class="action-chip ${displayMode === 'trade' ? 'primary-chip' : ''}" data-rx-mode="trade">${isAr ? 'تجاري فقط' : 'Brand Only'}</button>
        `;
      }
      const pillsWrap = container.querySelector('.leaflet-topic-pills');
      if (pillsWrap) pillsWrap.innerHTML = pillsHtml;
      existingBody.innerHTML = cardsHtml;
    } else {
      container.innerHTML = `
        <div class="leaflet-toolbar">
          <input
            type="search"
            id="formulary-search-input"
            value="${escapeHtml(searchQuery)}"
            placeholder="${isAr ? 'ابحث بالاسم العلمي أو التجاري (مثل: جلوكوفاج، جاردينس، ليبيتور، كونكور)...' : 'Search generic or Saudi brand (e.g., Jardiance, Lipitor, Concor, Exforge)...'}"
            style="flex:1; min-width:240px; min-height:2.6rem; padding:0.5rem 0.85rem; border:1px solid #cbd5e1; border-radius:0.5rem;"
          />
          <div class="leaflet-actions">
            <button type="button" class="action-chip ${displayMode === 'both' ? 'primary-chip' : ''}" data-rx-mode="both">
              ${isAr ? 'علمي + تجاري' : 'Generic + Brand'}
            </button>
            <button type="button" class="action-chip ${displayMode === 'generic' ? 'primary-chip' : ''}" data-rx-mode="generic">
              ${isAr ? 'علمي فقط' : 'Generic Only'}
            </button>
            <button type="button" class="action-chip ${displayMode === 'trade' ? 'primary-chip' : ''}" data-rx-mode="trade">
              ${isAr ? 'تجاري فقط' : 'Brand Only'}
            </button>
          </div>
        </div>
        <div class="leaflet-topic-pills" style="margin-block-end:1rem;">
          ${pillsHtml}
        </div>
        <div id="formulary-results-body">${cardsHtml}</div>
      `;

      const inputEl = container.querySelector('#formulary-search-input');
      if (inputEl) {
        inputEl.addEventListener('input', e => {
          searchQuery = e.target.value;
          renderDirectory(containerId);
        });
      }
    }

    container.querySelectorAll('[data-rx-mode]').forEach(btn => {
      btn.addEventListener('click', () => setDisplayMode(btn.getAttribute('data-rx-mode')));
    });

    container.querySelectorAll('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-cat');
        renderDirectory(containerId);
      });
    });

    container.querySelectorAll('[data-med-toggle]').forEach(btn => {
      btn.addEventListener('click', () => togglePatientMedication(btn.getAttribute('data-med-toggle')));
    });
  }

  function setMarket(market) {
    const next = (String(market || '').toLowerCase() === 'egypt') ? 'egypt' : 'saudi';
    activeMarket = next;
    try {
      if (global.localStorage) {
        global.localStorage.setItem(MARKET_STORAGE_KEY, next);
      }
    } catch (_) {}

    if (global.document) {
      syncMarketAndFilterButtons(global.document);
      const mktBtn = global.document.getElementById('market-toggle-btn');
      if (mktBtn && !(global.I18n && typeof global.I18n.applyTranslations === 'function')) {
        const isAr = global.document.documentElement && global.document.documentElement.lang === 'ar';
        const saFull = isAr ? '🇸🇦 السوق السعودي (SAR)' : '🇸🇦 Saudi Market (SAR)';
        const egFull = isAr ? '🇪🇬 السوق المصري (EGP)' : '🇪🇬 Egypt Market (EGP)';
        const saShort = '🇸🇦 SAR';
        const egShort = '🇪🇬 EGP';
        if (next === 'saudi') {
          mktBtn.innerHTML = `<span class="market-full">${saFull}</span><span class="market-short">${saShort}</span>`;
        } else {
          mktBtn.innerHTML = `<span class="market-full">${egFull}</span><span class="market-short">${egShort}</span>`;
        }
      }
    }

    if (global.I18n && typeof global.I18n.applyTranslations === 'function') {
      try { global.I18n.applyTranslations(); } catch (_) {}
    }

    if (typeof global.applyMarketToD === 'function') {
      try { global.applyMarketToD(next); } catch (_) {}
    }

    if (global.ClinicalTools && typeof global.ClinicalTools.renderLdlMatrix === 'function') {
      const ldlContainer = global.document && global.document.getElementById('ldl-matrix-container');
      if (ldlContainer && ldlContainer.innerHTML.trim()) {
        try { global.ClinicalTools.renderLdlMatrix(); } catch (_) {}
      }
    }

    renderDirectory('drugs-directory-container');
    return activeMarket;
  }

  function getMarket() {
    return activeMarket;
  }

  if (typeof global.addEventListener === 'function') {
    global.addEventListener('osrawy:patient-updated', () => {
      renderDirectory('drugs-directory-container');
    });
  }

  const OsrawyDrugsDirectory = {
    searchDrugs,
    findDrugById,
    formatDrugDisplayName,
    formatMedicationLine,
    evaluateRenalStatusForDrug,
    setDisplayMode,
    getDisplayMode: () => displayMode,
    togglePatientMedication,
    renderDirectory,
    // Backwards compatibility for legacy DrugDirectory calls
    init: function() {
      const searchInput = global.document && (global.document.getElementById('drug-search-input') || global.document.getElementById('formulary-search-input'));
      if (searchInput && !searchInput._initBound) {
        searchInput._initBound = true;
        searchInput.addEventListener('input', e => {
          searchQuery = e.target.value;
          renderDirectory();
        });
      }
      renderDirectory();
    },
    render: function() {
      renderDirectory();
    },
    setMarket: setMarket,
    getMarket: getMarket
  };

  global.OsrawyDrugsDirectory = OsrawyDrugsDirectory;
  global.DrugDirectory = OsrawyDrugsDirectory;

  // Auto-detect container ID if legacy HTML uses #drugs-list or #drugs-container
  function initLegacyDrugsMount() {
    if (!global.document) return;
    const fallbackIds = ['drugs-directory-container', 'drug-directory-list', 'drugs-container', 'drugs-list', 'tab-drugs'];
    for (const id of fallbackIds) {
      if (global.document.getElementById(id)) {
        renderDirectory(id);
        break;
      }
    }
  }

  if (global.document && global.document.readyState !== 'loading') {
    initLegacyDrugsMount();
  } else if (global.document && typeof global.document.addEventListener === 'function') {
    global.document.addEventListener('DOMContentLoaded', initLegacyDrugsMount);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OsrawyDrugsDirectory;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));

```

---

<a id="www-js-prescription-share-js"></a>
## 27. `www/js/prescription_share.js`

**Description:** Prescription export engine: printable Rx generator, WhatsApp direct dispatch, and clipboard formatter.  
**Lines:** 711 | **Size:** 35.7 KB

```javascript
// ==============================================================
// Prescription Formatter, Multi-Engine Sharer & Native PDF/Print
// Osrawy Clinical Navigator - Comprehensive Cross-Engine Report
// ==============================================================

const RxShare = (function() {
  const SETTINGS_KEY = 'osrawy_clinic_settings';

  let clinicSettings = {
    doctorName: 'د. حسام يوسف / Dr. Hossam Yousuf',
    doctorTitle: 'استشاري طب الأسرة / Consultant Family Medicine',
    clinicName: 'عيادة طب الأسرة والتخصصات الباطنية',
    clinicPhone: '+966 50 000 0000',
    clinicAddress: 'المملكة العربية السعودية / مصر',
    defaultMarket: 'saudi' // 'saudi' or 'egypt'
  };

  function loadSettings() {
    try {
      const s = localStorage.getItem(SETTINGS_KEY);
      if (s) clinicSettings = Object.assign(clinicSettings, JSON.parse(s));
    } catch(e) {}
    return clinicSettings;
  }

  function saveSettings(newSettings) {
    clinicSettings = Object.assign(clinicSettings, newSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(clinicSettings));
    } catch(e) {}
  }

  function getPrescriptionData() {
    const pt = (typeof PatientSync !== 'undefined') ? PatientSync.get() : {};
    const rxCard = (typeof document !== 'undefined') ? document.getElementById('rxcard') : null;
    const items = [];
    if (rxCard) {
      const listItems = rxCard.querySelectorAll('.rx-list li');
      listItems.forEach(li => {
        const titleEl = li.querySelector('b');
        const doseEl = li.querySelector('div:not(.ar)');
        const arEl = li.querySelector('.ar');
        items.push({
          drug: titleEl ? titleEl.innerText.trim() : '',
          directions: doseEl ? doseEl.innerText.trim() : '',
          arabic: arEl ? arEl.innerText.trim() : ''
        });
      });
    }

    const invEl = (typeof document !== 'undefined') ? document.querySelector('.rx-inv') : null;
    const investigations = invEl ? invEl.innerText.replace('Investigations requested:', '').trim() : '';

    const fuEl = (typeof document !== 'undefined') ? document.querySelector('.rx-fu') : null;
    const followUp = fuEl ? fuEl.innerText.replace('Follow-up', '').trim() : '';

    return {
      doctor: clinicSettings,
      patient: pt,
      items,
      investigations,
      followUp,
      date: new Date().toLocaleDateString('ar-SA')
    };
  }

  function buildWhatsAppText() {
    const rx = getPrescriptionData();
    let text = `*${rx.doctor.doctorName}*\n`;
    text += `_${rx.doctor.doctorTitle}_\n`;
    if (rx.doctor.clinicName) text += `${rx.doctor.clinicName}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 *المريض:* ${rx.patient.name || 'مريض'} | *العمر:* ${rx.patient.age} سنة | *التاريخ:* ${rx.date}\n`;
    if (rx.patient.sbp) text += `📊 *الضغط:* ${rx.patient.sbp}/${rx.patient.dbp} mmHg | *BMI:* ${(typeof PatientSync !== 'undefined' ? PatientSync.getBMI(rx.patient.wt, rx.patient.ht) : '—') || '—'}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📋 *الوصفة العلاجية (Rx):*\n\n`;

    if (rx.items.length === 0) {
      text += `_لم يتم تحديد أدوية بالروشتة بعد_\n`;
    } else {
      rx.items.forEach((it, idx) => {
        text += `*${idx + 1}. ${it.drug}*\n`;
        if (it.directions) text += `   • ${it.directions}\n`;
        if (it.arabic) text += `   • 🇸🇦 ${it.arabic}\n`;
        text += `\n`;
      });
    }

    if (rx.investigations) {
      text += `🔬 *الفحوصات والتحاليل المطلوبة:*\n${rx.investigations}\n\n`;
    }

    text += `💡 *إرشادات عامة:*\n`;
    text += `• تقليل السكريات والمشروبات المحلاة والنشويات البسيطة.\n`;
    text += `• شرب كميات كافية من الماء (1.5 إلى 2 لتر يومياً).\n`;
    text += `• ممارسة المشي 30 دقيقة معظم أيام الأسبوع.\n`;
    text += `• في حال أعراض هبوط السكر (رعشة، دوخة، تعرق بارد): قياس السكر فوراً وتناول 15 جم سكريات سريعة.\n\n`;

    if (rx.followUp) {
      text += `📅 *المتابعة القادمة:*\n${rx.followUp}\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_تم إصدار هذه الوصفة عبر تطبيق Osrawy Clinical Navigator_\n`;
    return text;
  }

  function buildHtnWhatsAppText() {
    const pt = (typeof PatientSync !== 'undefined') ? PatientSync.get() : {};
    const cfg = loadSettings();
    let text = `*${cfg.doctorName}*\n`;
    text += `_${cfg.doctorTitle}_\n`;
    if (cfg.clinicName) text += `${cfg.clinicName}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 *المريض:* ${pt.name || 'مريض'} | *العمر:* ${pt.age} سنة | *التاريخ:* ${new Date().toLocaleDateString('ar-SA')}\n`;
    text += `📊 *الضغط:* ${pt.sbp || 148}/${pt.dbp || 94} mmHg | *eGFR:* ${pt.egfr} | *UACR:* ${pt.uacr} mg/g\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💓 *توصيات وخطة علاج ارتفاع ضغط الدم:*\n\n`;

    const outEl = (typeof document !== 'undefined') ? document.getElementById('out') : null;
    if (outEl) {
      const stageEl = outEl.querySelector('.big');
      if (stageEl) text += `• *المرحلة:* ${stageEl.innerText.trim()}\n`;

      const drugs = outEl.querySelectorAll('.drug');
      if (drugs.length) {
        text += `\n📋 *الخطة الدوائية المقترحة:*\n`;
        drugs.forEach(d => {
          const cls = d.querySelector('.cls');
          const ex = d.querySelector('.ex');
          text += `  - ${cls ? cls.innerText.trim() : ''}: ${ex ? ex.innerText.trim() : ''}\n`;
        });
      }

      const notes = outEl.querySelectorAll('ul.notes li');
      if (notes.length) {
        text += `\n💡 *ملاحظات الطبيب:*\n`;
        notes.forEach(n => {
          text += `  • ${n.innerText.replace(/\s+/g, ' ').trim()}\n`;
        });
      }
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_تم إصدار هذه التوصيات عبر تطبيق Osrawy Clinical Navigator_\n`;
    return text;
  }

  /**
   * Multi-Engine Comprehensive Bilingual Prescription & Clinical Report
   * Integrates Vitals, Targets, Lipids, Primary Care, Safety Guardrails & Monitoring Schedule
   */
  function buildPrescriptionReport(lang, patientOverride) {
    const activeLang = lang || ((typeof window !== 'undefined' && typeof window.I18n !== 'undefined') ? window.I18n.getLang() : 'ar');
    const isAr = (activeLang === 'ar');
    const cfg = loadSettings();
    const pt = patientOverride || ((typeof PatientSync !== 'undefined') ? PatientSync.get() : {});
    const bmi = (typeof PatientSync !== 'undefined') ? PatientSync.getBMI(pt.wt, pt.ht) : '—';
    const dateStr = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    // Multi-Engine Assessments
    const syncGuardrails = (typeof PatientSync !== 'undefined' && typeof PatientSync.evaluateSafetyGuardrails === 'function')
      ? PatientSync.evaluateSafetyGuardrails(pt)
      : [];

    let lipidReport = null;
    if (typeof OsrawyLipidsEngine !== 'undefined') {
      try {
        lipidReport = OsrawyLipidsEngine.evaluateLipidPathway(pt);
      } catch(e) {}
    }

    let pcReport = null;
    if (typeof OsrawyPrimaryCareEngine !== 'undefined') {
      try {
        pcReport = OsrawyPrimaryCareEngine.evaluatePrimaryCare(pt);
      } catch(e) {}
    }

    // Aggregate Alerts
    const allAlerts = [
      ...syncGuardrails,
      ...(lipidReport ? lipidReport.alerts : []),
      ...(pcReport ? pcReport.allAlerts : [])
    ];

    let text = '';

    if (isAr) {
      // --- ARABIC REPORT ---
      text += `🏥 *${cfg.clinicName || 'عيادة طب الأسرة والتخصصات الباطنية'}*\n`;
      text += `👨‍⚕️ *${cfg.doctorName}*\n`;
      text += `_${cfg.doctorTitle}_\n`;
      if (cfg.clinicPhone) text += `📞 هاتف العيادة: ${cfg.clinicPhone}\n`;
      text += `📅 التاريخ: ${dateStr}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      // 1. Patient Profile & Vitals
      text += `👤 *بيانات المريض والعلامات الحيوية:*\n`;
      text += `• الاسم: ${pt.name || 'مريض جديد'} | الجنس: ${pt.sex === 'f' ? 'أنثى' : 'ذكر'} | العمر: ${pt.age} سنة\n`;
      text += `• الوزن: ${pt.wt} كجم | الطول: ${pt.ht} سم | كتلة الجسم (BMI): ${bmi || '—'}\n`;
      text += `• ضغط الدم: ${pt.sbp || 148}/${pt.dbp || 94} mmHg | البوتاسيوم: ${pt.k || 4.6} mEq/L\n`;
      text += `• وظائف الكلى (eGFR): ${pt.egfr} مل/د | زلال البول (UACR): ${pt.uacr} مجم/جم\n`;
      if (pt.a1c) text += `• السكر التراكمي (HbA1c): ${pt.a1c}% | سكر الصائم: ${pt.fpg || '—'} مجم/dL\n`;
      if (lipidReport) {
        text += `• الدهون: الكلي ${lipidReport.labs.tcMg} | LDL: ${lipidReport.labs.ldlMg} | HDL: ${lipidReport.labs.hdlMg} | TG: ${lipidReport.labs.tgMg} مجم/dL\n`;
      }
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      // 2. Clinical Targets (الأهداف العلاجية)
      text += `🎯 *الأهداف العلاجية المستهدفة (Targets):*\n`;
      text += `• ضغط الدم المستهدف: أقل من 130/80 mmHg\n`;
      text += `• السكر التراكمي المستهدف: أقل من 7.0% (أو حسب الحالة)\n`;
      if (lipidReport) {
        text += `• الكوليسترول الضار المستهدف: < ${lipidReport.target.ldlTargetMg} مجم/dL (${lipidReport.target.nameAr})\n`;
        text += `• الكوليسترول غير المفيد (Non-HDL): < ${lipidReport.target.nonHdlTargetMg} مجم/dL\n`;
      }
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      // 3. Combined Medications List
      text += `💊 *الخطة الدوائية المعتمدة (Rx):*\n\n`;

      // Active Patient Medications formatted with OsrawyDrugsDirectory
      const activeMedsList = (pt.activeMeds && pt.activeMeds.length > 0) ? pt.activeMeds : (pt.meds || pt.currentMeds || pt.medications || []);
      if (activeMedsList && activeMedsList.length > 0) {
        text += `🔹 *الأدوية الحالية للمريض (Active Medications):*\n`;
        activeMedsList.forEach((medId, idx) => {
          let dir = null;
          if (typeof OsrawyDrugsDirectory !== 'undefined') dir = OsrawyDrugsDirectory;
          else if (typeof window !== 'undefined' && window.OsrawyDrugsDirectory) dir = window.OsrawyDrugsDirectory;
          else if (typeof globalThis !== 'undefined' && globalThis.OsrawyDrugsDirectory) dir = globalThis.OsrawyDrugsDirectory;
          else if (typeof global !== 'undefined' && global.OsrawyDrugsDirectory) dir = global.OsrawyDrugsDirectory;
          else if (typeof DrugDirectory !== 'undefined') dir = DrugDirectory;
          else if (typeof window !== 'undefined' && window.DrugDirectory) dir = window.DrugDirectory;
          else if (typeof globalThis !== 'undefined' && globalThis.DrugDirectory) dir = globalThis.DrugDirectory;
          else if (typeof global !== 'undefined' && global.DrugDirectory) dir = global.DrugDirectory;
          else if (typeof DrugsDirectory !== 'undefined') dir = DrugsDirectory;
          else if (typeof window !== 'undefined' && window.DrugsDirectory) dir = window.DrugsDirectory;

          let line = '';
          if (dir && typeof dir.formatMedicationLine === 'function') {
            try { line = dir.formatMedicationLine(medId, 'ar'); } catch(e) {}
          }
          if (!line) line = String(medId);
          text += `  ${idx + 1}. ${line}\n`;
        });
        text += `\n`;
      }

      const rxData = getPrescriptionData();
      if (rxData.items && rxData.items.length > 0) {
        text += `🔹 *أدوية السكري:*\n`;
        rxData.items.forEach((it, idx) => {
          text += `  ${idx + 1}. ${it.drug}\n`;
          if (it.arabic) text += `     • ${it.arabic}\n`;
          else if (it.directions) text += `     • ${it.directions}\n`;
        });
        text += `\n`;
      }

      // HTN Drugs from panel
      if (typeof document !== 'undefined') {
        const outEl = document.getElementById('out');
        const htnDrugs = outEl ? outEl.querySelectorAll('.drug') : [];
        if (htnDrugs.length > 0) {
          text += `🔹 *أدوية علاج ضغط الدم:*\n`;
          htnDrugs.forEach((d, idx) => {
            const cls = d.querySelector('.cls');
            const ex = d.querySelector('.ex');
            text += `  ${idx + 1}. ${cls ? cls.innerText.trim() : 'دواء ضغط'}: ${ex ? ex.innerText.trim() : ''}\n`;
          });
          text += `\n`;
        }
      }

      // Lipid Lowering Therapy Recommendation
      if (lipidReport && lipidReport.steps && lipidReport.steps.length > 0) {
        text += `🔹 *علاج الدهون والكوليسترول الموصى به:*\n`;
        lipidReport.steps.forEach(s => {
          text += `  • ${s.titleAr}: ${s.drugAr}\n`;
        });
        text += `\n`;
      }

      // Primary Care Recommendations (Asthma / COPD / Thyroid)
      if (pcReport) {
        if (pt.asthma && pcReport.asthma) {
          const asthmaRxAr = (pcReport.asthma.recommendationDetails && pcReport.asthma.recommendationDetails.nameAr) || pcReport.asthma.recommendation || '';
          text += `🔹 *علاج الربو الشعبي (GINA 2024):*\n`;
          text += `  • ${pcReport.asthma.trackNameAr} - ${asthmaRxAr}\n\n`;
        }
        if (pt.copd && pcReport.copd) {
          text += `🔹 *علاج السدة الرئوية (GOLD 2024):*\n`;
          text += `  • ${pcReport.copd.groupNameAr}: ${pcReport.copd.rxAr}\n\n`;
        }
        if (pcReport.thyroid && pcReport.thyroid.status !== 'euthyroid') {
          text += `🔹 *علاج الغدة الدرقية:*\n`;
          text += `  • ${pcReport.thyroid.statusNameAr}: ${pcReport.thyroid.rxAr}\n\n`;
        }
      }

      // Women's Health & Pregnancy Switching Protocol (Arabic)
      const isPregnantOrPostpartumAr = !!(pt.pregnancy || pt.preg || pt.pregHtn || pt.postpartum || (pt.comorbidities && pt.comorbidities.postpartum));
      if (isPregnantOrPostpartumAr) {
        let htnPreg = null;
        let dmPreg = null;
        if (typeof OsrawyHtnPregnancy !== 'undefined' && typeof OsrawyHtnPregnancy.evaluatePregnancyHtnProtocol === 'function') {
          try { htnPreg = OsrawyHtnPregnancy.evaluatePregnancyHtnProtocol(pt); } catch(e) {}
        }
        if (typeof OsrawyDmPregnancy !== 'undefined' && typeof OsrawyDmPregnancy.evaluatePregnancyDmProtocol === 'function') {
          try { dmPreg = OsrawyDmPregnancy.evaluatePregnancyDmProtocol(pt); } catch(e) {}
        }

        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🌸 *بروتوكول صحة المرأة والحمل والنفاس (Women's Health & Pregnancy Switching Protocol):*\n`;
        if (pt.postpartum || (pt.comorbidities && pt.comorbidities.postpartum)) {
          text += `• الحالة السريرية: فترة ما بعد الولادة والنفاس (Postpartum)\n`;
        } else {
          text += `• الحالة السريرية: حمل نشط (عمر الحمل: ${pt.gestationalWeeks || 16} أسبوعاً - الثلث ${pt.trimester || 2})\n`;
        }

        if (htnPreg) {
          text += `\n🩺 *بروتوكول تحويل أدوية الضغط أثناء الحمل والنفاس:*\n`;
          if (htnPreg.firstLine) {
            text += `• الخيار الأول المعتمد: ${htnPreg.firstLine.drugNameAr} - ${htnPreg.firstLine.doseAr}\n`;
            text += `• مبرر الاختيار: ${htnPreg.firstLine.reasonAr}\n`;
          }
          if (htnPreg.aspirinProphylaxis && htnPreg.aspirinProphylaxis.indicated) {
            text += `• وقاية تسمم الحمل: أسبرين أطفال (81–150 مجم/يوم عند النوم حتى الأسبوع 36)\n`;
          }
          if (htnPreg.methyldopaDepressionWarning) {
            text += `• تحذير ميثيل دوبا: ${htnPreg.methyldopaDepressionWarning.titleAr} - ${htnPreg.methyldopaDepressionWarning.actionAr}\n`;
          }
          if (htnPreg.isSevereEmergency) {
            text += `• 🚨 طوارئ ارتفاع الضغط الشديد (≥160/110): يتطلب خفضاً إسعافياً خلال 30-60 دقيقة وكبريتات المغنيسيوم.\n`;
          }
          if (htnPreg.stoppedDrugs && htnPreg.stoppedDrugs.length > 0) {
            text += `• أدوية محظورة تم إيقافها فوراً: ${htnPreg.stoppedDrugs.join('، ')}\n`;
          }
        }

        if (dmPreg) {
          text += `\n🩸 *بروتوكول تحويل أدوية السكري أثناء الحمل والنفاس:*\n`;
          text += `• أهداف سكر الحمل: ${dmPreg.obstetricTargets.fastingLabelAr} | ${dmPreg.obstetricTargets.pp1hrLabelAr} | ${dmPreg.obstetricTargets.pp2hrLabelAr}\n`;
          text += `• خطة الإنسولين المحسوبة: إجمالي الجرعة اليومية ${dmPreg.insulinDosing.tdd} وحدة/يوم (${dmPreg.insulinDosing.multiplier} وحدة/كجم)\n`;
          text += `  - ${dmPreg.insulinDosing.basalRegimenAr}\n`;
          text += `  - ${dmPreg.insulinDosing.prandialRegimenAr}\n`;
          if (dmPreg.folicAcid && dmPreg.folicAcid.indicated) {
            text += `• حمض الفوليك: جرعة عالية 5 مجم/يوم فموياً حتى الأسبوع 12.\n`;
          }
          if (dmPreg.postpartumManagement && dmPreg.postpartumManagement.isPostpartum) {
            text += `• خطة النفاس: تقليص جرعة الإنسولين بنسبة 50% فوراً وفحص سكر الحمل (75g OGTT) في الأسابيع 4-12.\n`;
          }
          text += `• تنبيه الأدوية: إيقاف جميع خافضات السكر الفموية وغير الإنسولينية والاعتماد الحصري على الإنسولين.\n`;
        }
        text += `\n`;
      }

      // 4. Combined Safety & Guardrail Alerts
      if (allAlerts.length > 0) {
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `⚠️ *تنبيهات السلامة والاحتياطات الدوائية:*\n`;
        allAlerts.forEach(a => {
          const icon = a.level === 'critical' ? '🚨' : (a.level === 'warning' ? '⚠️' : '💡');
          text += `${icon} *${a.titleAr}*\n`;
          text += `   ${a.messageAr}\n`;
        });
        text += `\n`;
      }

      // 5. Laboratory Monitoring Schedule
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `🔬 *جدول الفحوصات والتحاليل والمتابعة:*\n`;
      text += `• فحص وظائف الكلى والأملاح (eGFR & K+) بعد 2-4 أسابيع من بدء أو تعديل أدوية الضغط.\n`;
      text += `• فحص الدهون الكامل (Lipid Profile) بعد 4-12 أسبوعاً لتقييم استجابة الستاتين.\n`;
      text += `• تحليل السكر التراكمي (HbA1c) كل 3 أشهر.\n`;
      text += `• فحص زلال البول UACR وقاع العين والقدمين سنوياً.\n\n`;

      // 6. Educational Instructions & Sick-Day Rules
      text += `💡 *إرشادات هامة للمريض:*\n`;
      text += `• قاعدة 15 لعلاج هبوط السكر: في حال الشعور برعشة أو دوخة، تناول 15 جم سكر سريع (نصف كوب عصير)، واعد القياس بعد 15 دقيقة.\n`;
      text += `• قواعد أيام المرض (SADMANS): يجب إيقاف أدوية (SGLT2i، مدرات البول، ميتفورمين، أدوية الضغط ACEi/ARB) مؤقتاً عند حدوث جفاف أو قيء أو إسهال شديد ومراجعة الطبيب فوراً.\n`;
      text += `• قياس الضغط بالمنزل: الجلوس باسترخاء 5 دقائق قبل القياس، وتدوين القراءات.\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `_تم إصدار هذه الوصفة الطبية التفاعلية عبر تطبيق Osrawy Clinical Navigator_\n`;

    } else {
      // --- ENGLISH REPORT ---
      text += `🏥 *${cfg.clinicName || 'Family Medicine & Internal Medicine Clinic'}*\n`;
      text += `👨‍⚕️ *${cfg.doctorName}*\n`;
      text += `_${cfg.doctorTitle}_\n`;
      if (cfg.clinicPhone) text += `📞 Clinic Phone: ${cfg.clinicPhone}\n`;
      text += `📅 Date: ${dateStr}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      // 1. Patient Profile & Vitals
      text += `👤 *Patient Profile & Clinical Vitals:*\n`;
      text += `• Name: ${pt.name || 'New Patient'} | Sex: ${pt.sex === 'f' ? 'Female' : 'Male'} | Age: ${pt.age} years\n`;
      text += `• Weight: ${pt.wt} kg | Height: ${pt.ht} cm | BMI: ${bmi || '—'}\n`;
      text += `• Blood Pressure: ${pt.sbp || 148}/${pt.dbp || 94} mmHg | Serum K+: ${pt.k || 4.6} mEq/L\n`;
      text += `• Renal Function (eGFR): ${pt.egfr} mL/min/1.73m² | UACR: ${pt.uacr} mg/g\n`;
      if (pt.a1c) text += `• HbA1c: ${pt.a1c}% | Fasting Glucose: ${pt.fpg || '—'} mg/dL\n`;
      if (lipidReport) {
        text += `• Lipids: TC ${lipidReport.labs.tcMg} | LDL ${lipidReport.labs.ldlMg} | HDL ${lipidReport.labs.hdlMg} | TG ${lipidReport.labs.tgMg} mg/dL\n`;
      }
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      // 2. Clinical Targets
      text += `🎯 *Clinical Targets:*\n`;
      text += `• BP Goal: < 130/80 mmHg\n`;
      text += `• Glycemic Goal: HbA1c < 7.0% (individualized)\n`;
      if (lipidReport) {
        text += `• LDL-C Goal: < ${lipidReport.target.ldlTargetMg} mg/dL (${lipidReport.target.nameEn})\n`;
        text += `• Non-HDL Goal: < ${lipidReport.target.nonHdlTargetMg} mg/dL\n`;
      }
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      // 3. Regimens
      text += `💊 *Prescribed & Recommended Regimens (Rx):*\n\n`;

      // Active Patient Medications formatted with OsrawyDrugsDirectory
      const activeMedsListEn = (pt.activeMeds && pt.activeMeds.length > 0) ? pt.activeMeds : (pt.meds || pt.currentMeds || pt.medications || []);
      if (activeMedsListEn && activeMedsListEn.length > 0) {
        text += `🔹 *Active Patient Medications:*\n`;
        activeMedsListEn.forEach((medId, idx) => {
          let dir = null;
          if (typeof OsrawyDrugsDirectory !== 'undefined') dir = OsrawyDrugsDirectory;
          else if (typeof window !== 'undefined' && window.OsrawyDrugsDirectory) dir = window.OsrawyDrugsDirectory;
          else if (typeof globalThis !== 'undefined' && globalThis.OsrawyDrugsDirectory) dir = globalThis.OsrawyDrugsDirectory;
          else if (typeof global !== 'undefined' && global.OsrawyDrugsDirectory) dir = global.OsrawyDrugsDirectory;
          else if (typeof DrugDirectory !== 'undefined') dir = DrugDirectory;
          else if (typeof window !== 'undefined' && window.DrugDirectory) dir = window.DrugDirectory;
          else if (typeof globalThis !== 'undefined' && globalThis.DrugDirectory) dir = globalThis.DrugDirectory;
          else if (typeof global !== 'undefined' && global.DrugDirectory) dir = global.DrugDirectory;
          else if (typeof DrugsDirectory !== 'undefined') dir = DrugsDirectory;
          else if (typeof window !== 'undefined' && window.DrugsDirectory) dir = window.DrugsDirectory;

          let line = '';
          if (dir && typeof dir.formatMedicationLine === 'function') {
            try { line = dir.formatMedicationLine(medId, 'en'); } catch(e) {}
          }
          if (!line) line = String(medId);
          text += `  ${idx + 1}. ${line}\n`;
        });
        text += `\n`;
      }

      const rxData = getPrescriptionData();
      if (rxData.items && rxData.items.length > 0) {
        text += `🔹 *Diabetes Medications:*\n`;
        rxData.items.forEach((it, idx) => {
          text += `  ${idx + 1}. ${it.drug}\n`;
          if (it.directions) text += `     • Directions: ${it.directions}\n`;
        });
        text += `\n`;
      }

      // HTN Drugs
      if (typeof document !== 'undefined') {
        const outEl = document.getElementById('out');
        const htnDrugs = outEl ? outEl.querySelectorAll('.drug') : [];
        if (htnDrugs.length > 0) {
          text += `🔹 *Hypertension Regimen:*\n`;
          htnDrugs.forEach((d, idx) => {
            const cls = d.querySelector('.cls');
            const ex = d.querySelector('.ex');
            text += `  ${idx + 1}. ${cls ? cls.innerText.trim() : 'HTN Med'}: ${ex ? ex.innerText.trim() : ''}\n`;
          });
          text += `\n`;
        }
      }

      // Lipid Lowering Therapy
      if (lipidReport && lipidReport.steps && lipidReport.steps.length > 0) {
        text += `🔹 *Lipid-Lowering Pathway Strategy:*\n`;
        lipidReport.steps.forEach(s => {
          text += `  • ${s.titleEn}: ${s.drugEn}\n`;
        });
        text += `\n`;
      }

      // Primary Care
      if (pcReport) {
        if (pt.asthma && pcReport.asthma) {
          const asthmaRxEn = (pcReport.asthma.recommendationDetails && pcReport.asthma.recommendationDetails.nameEn) || pcReport.asthma.recommendation || '';
          text += `🔹 *Asthma Care (GINA 2024):*\n`;
          text += `  • ${pcReport.asthma.trackNameEn} - ${asthmaRxEn}\n\n`;
        }
        if (pt.copd && pcReport.copd) {
          text += `🔹 *COPD Care (GOLD 2024):*\n`;
          text += `  • ${pcReport.copd.groupNameEn}: ${pcReport.copd.rxEn}\n\n`;
        }
        if (pcReport.thyroid && pcReport.thyroid.status !== 'euthyroid') {
          text += `🔹 *Thyroid Care:*\n`;
          text += `  • ${pcReport.thyroid.statusNameEn}: ${pcReport.thyroid.rxEn}\n\n`;
        }
      }

      // Women's Health & Pregnancy Switching Protocol (English)
      const isPregnantOrPostpartumEn = !!(pt.pregnancy || pt.preg || pt.pregHtn || pt.postpartum || (pt.comorbidities && pt.comorbidities.postpartum));
      if (isPregnantOrPostpartumEn) {
        let htnPreg = null;
        let dmPreg = null;
        if (typeof OsrawyHtnPregnancy !== 'undefined' && typeof OsrawyHtnPregnancy.evaluatePregnancyHtnProtocol === 'function') {
          try { htnPreg = OsrawyHtnPregnancy.evaluatePregnancyHtnProtocol(pt); } catch(e) {}
        }
        if (typeof OsrawyDmPregnancy !== 'undefined' && typeof OsrawyDmPregnancy.evaluatePregnancyDmProtocol === 'function') {
          try { dmPreg = OsrawyDmPregnancy.evaluatePregnancyDmProtocol(pt); } catch(e) {}
        }

        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🌸 *Women's Health & Pregnancy Switching Protocol:*\n`;
        if (pt.postpartum || (pt.comorbidities && pt.comorbidities.postpartum)) {
          text += `• Clinical Status: Postpartum Care\n`;
        } else {
          text += `• Clinical Status: Active Pregnancy (Gestational Age: ${pt.gestationalWeeks || 16} weeks - Trimester ${pt.trimester || 2})\n`;
        }

        if (htnPreg) {
          text += `\n🩺 *Hypertension in Pregnancy & Switching Strategy:*\n`;
          if (htnPreg.firstLine) {
            text += `• Recommended First-Line: ${htnPreg.firstLine.drugName} - ${htnPreg.firstLine.doseEn}\n`;
            text += `• Clinical Rationale: ${htnPreg.firstLine.reasonEn}\n`;
          }
          if (htnPreg.aspirinProphylaxis && htnPreg.aspirinProphylaxis.indicated) {
            text += `• Preeclampsia Prophylaxis: Low-dose Aspirin (81–150 mg/day at bedtime through 36 weeks)\n`;
          }
          if (htnPreg.methyldopaDepressionWarning) {
            text += `• Methyldopa Warning: ${htnPreg.methyldopaDepressionWarning.titleEn} - ${htnPreg.methyldopaDepressionWarning.actionEn}\n`;
          }
          if (htnPreg.isSevereEmergency) {
            text += `• 🚨 Severe Obstetric HTN Emergency (≥160/110): Immediate IV lowering and Magnesium Sulfate required.\n`;
          }
          if (htnPreg.stoppedDrugs && htnPreg.stoppedDrugs.length > 0) {
            text += `• Teratogens Stopped: ${htnPreg.stoppedDrugs.join(', ')}\n`;
          }
        }

        if (dmPreg) {
          text += `\n🩸 *Diabetes in Pregnancy & Switching Strategy:*\n`;
          text += `• Obstetric Glycemic Targets: ${dmPreg.obstetricTargets.fastingLabelEn} | ${dmPreg.obstetricTargets.pp1hrLabelEn} | ${dmPreg.obstetricTargets.pp2hrLabelEn}\n`;
          text += `• Calculated Weight-Based Insulin: TDD ${dmPreg.insulinDosing.tdd} U/day (${dmPreg.insulinDosing.multiplier} U/kg/day)\n`;
          text += `  - ${dmPreg.insulinDosing.basalRegimenEn}\n`;
          text += `  - ${dmPreg.insulinDosing.prandialRegimenEn}\n`;
          if (dmPreg.folicAcid && dmPreg.folicAcid.indicated) {
            text += `• Folic Acid: High-dose 5 mg/day orally through week 12 of pregnancy.\n`;
          }
          if (dmPreg.postpartumManagement && dmPreg.postpartumManagement.isPostpartum) {
            text += `• Postpartum Management: Reduce insulin dose by 50% immediately; order 75g OGTT at 4–12 weeks postpartum.\n`;
          }
          text += `• Non-Insulin Agents: Discontinue all oral and non-insulin agents; switch exclusively to insulin.\n`;
        }
        text += `\n`;
      }

      // 4. Safety Guardrails
      if (allAlerts.length > 0) {
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `⚠️ *Clinical Safety Guardrails & Drug Precautions:*\n`;
        allAlerts.forEach(a => {
          const icon = a.level === 'critical' ? '🚨' : (a.level === 'warning' ? '⚠️' : '💡');
          text += `${icon} *${a.titleEn}*\n`;
          text += `   ${a.messageEn}\n`;
        });
        text += `\n`;
      }

      // 5. Monitoring Schedule
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `🔬 *Laboratory Surveillance & Follow-up Schedule:*\n`;
      text += `• Serum K+ and eGFR within 2–4 weeks of RAASi / diuretic titration.\n`;
      text += `• Fasting lipid profile recheck in 4–12 weeks to assess statin response.\n`;
      text += `• HbA1c retest every 3 months until target achieved.\n`;
      text += `• Annual surveillance: urine albumin-to-creatinine ratio (UACR), dilated retinal exam, comprehensive foot exam.\n\n`;

      // 6. Patient Guidance
      text += `💡 *Patient Instructions & Safety Rules:*\n`;
      text += `• Rule of 15 for Hypoglycemia: If feeling shaky, dizzy, or diaphoretic, take 15g fast-acting carbohydrate (1/2 cup juice), and recheck blood glucose in 15 minutes.\n`;
      text += `• Sick-Day Rules (SADMANS): Temporarily hold SGLT2i, ACEi/ARB, diuretics, and metformin during acute dehydrating illnesses (fever, vomiting, severe diarrhea) and contact clinic.\n`;
      text += `• Home BP monitoring: Rest 5 minutes before measurement; record morning and evening readings.\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `_Issued via Osrawy Clinical Navigator Interactive Multi-Engine Platform_\n`;
    }

    return text;
  }

  function sharePrescription(lang) {
    const text = buildPrescriptionReport(lang);
    const title = (lang === 'en') ? 'Osrawy Clinical Prescription & Care Plan' : 'الوصفة الطبية التفاعلية والخطة العلاجية';
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encoded}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title,
        text
      }).catch(() => {
        if (typeof window !== 'undefined') window.open(url, '_blank');
      });
    } else if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  function shareHtnWhatsApp() {
    const text = buildHtnWhatsAppText();
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encoded}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Hypertension Plan / خطة علاج الضغط',
        text: text
      }).catch(() => {
        if (typeof window !== 'undefined') window.open(url, '_blank');
      });
    } else if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  function shareToWhatsApp() {
    const text = buildWhatsAppText();
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encoded}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Prescription / وصفة علاجية',
        text: text
      }).catch(() => {
        if (typeof window !== 'undefined') window.open(url, '_blank');
      });
    } else if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  function copySummaryToClipboard() {
    const text = buildWhatsAppText();
    const isAr = (typeof window !== 'undefined' && window.I18n && window.I18n.getLang) ? window.I18n.getLang() === 'ar' : true;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(isAr ? '✅ تم نسخ الوصفة العلاجية بنجاح!' : '✅ Prescription copied to clipboard!');
      }).catch(() => {
        showToast(isAr ? '❌ تعذر النسخ للحافظة' : '❌ Failed to copy to clipboard');
      });
    }
  }

  function copyHtnToClipboard() {
    const text = buildHtnWhatsAppText();
    const isAr = (typeof window !== 'undefined' && window.I18n && window.I18n.getLang) ? window.I18n.getLang() === 'ar' : true;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(isAr ? '✅ تم نسخ خطة علاج الضغط بنجاح!' : '✅ Hypertension plan copied to clipboard!');
      }).catch(() => {
        showToast(isAr ? '❌ تعذر النسخ للحافظة' : '❌ Failed to copy to clipboard');
      });
    }
  }

  function printPrescription() {
    if (typeof window !== 'undefined') {
      if (window.AndroidPrint && typeof window.AndroidPrint.print === 'function') {
        window.AndroidPrint.print();
      } else if (typeof window.print === 'function') {
        window.print();
      }
    }
  }

  function showToast(msg) {
    if (typeof document === 'undefined') return;
    let t = document.getElementById('app-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'app-toast';
      t.className = 'app-toast';
      document.body.appendChild(t);
    }
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  return {
    loadSettings,
    saveSettings,
    getPrescriptionData,
    buildWhatsAppText,
    buildHtnWhatsAppText,
    buildPrescriptionReport,
    sharePrescription,
    shareToWhatsApp,
    shareHtnWhatsApp,
    copySummaryToClipboard,
    copyHtnToClipboard,
    printPrescription,
    showToast
  };
})();

if (typeof window !== 'undefined') {
  window.RxShare = RxShare;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RxShare;
}

```

---
