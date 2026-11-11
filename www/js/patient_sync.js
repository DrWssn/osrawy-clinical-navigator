// ==============================================================
// Patient State Synchronization & Local Draft Management
// Osrawy Clinical Navigator - Reactive Cross-Engine Hub
// ==============================================================

const PatientSync = (function() {
  const STORAGE_KEY = 'osrawy_patient_drafts';
  const ACTIVE_KEY = 'osrawy_active_patient';

  // Drug classes for multi-engine interactions and safety checks
  const DRUG_CLASSES = {
    biguanide: { id: 'biguanide', nameEn: 'Biguanide (Metformin)', nameAr: 'بيجوانيد (ميتفورمين)', drugs: ['met', 'metformin'] },
    su: { id: 'su', nameEn: 'Sulfonylurea', nameAr: 'سلفونيل يوريا', drugs: ['gliclazide', 'glimepiride'] },
    tzd: { id: 'tzd', nameEn: 'Thiazolidinedione', nameAr: 'ثيازوليدينديون', drugs: ['pio'] },
    sglt2i: { id: 'sglt2i', nameEn: 'SGLT2 inhibitor', nameAr: 'مثبطات SGLT2', drugs: ['dapa', 'empa', 'dapagliflozin', 'empagliflozin'] },
    dpp4i: { id: 'dpp4i', nameEn: 'DPP-4 inhibitor', nameAr: 'مثبطات DPP-4', drugs: ['sita', 'vilda', 'lina', 'sitagliptin'] },
    glp1ra: { id: 'glp1ra', nameEn: 'GLP-1 receptor agonist', nameAr: 'محفزات مستقبلات GLP-1', drugs: ['sema', 'osema', 'tirz', 'dula', 'lira'] },
    insulin: { id: 'insulin', nameEn: 'Insulin', nameAr: 'إنسولين', drugs: ['nph', 'glarg'] },
    acei: { id: 'acei', nameEn: 'ACE inhibitor', nameAr: 'مثبطات الإنزيم المحول للأنجيوتنسين', drugs: ['perindopril', 'ramipril', 'coveram', 'lisinopril', 'enalapril', 'captopril'] },
    arb: { id: 'arb', nameEn: 'Angiotensin Receptor Blocker (ARB)', nameAr: 'حاصرات مستقبلات الأنجيوتنسين', drugs: ['valsartan', 'losartan', 'telmisartan', 'candesartan', 'exforge', 'twynsta'] },
    ccb: { id: 'ccb', nameEn: 'Calcium Channel Blocker (CCB)', nameAr: 'حاصرات قنوات الكالسيوم', drugs: ['amlodipine'] },
    thiazide: { id: 'thiazide', nameEn: 'Thiazide / Thiazide-like diuretic', nameAr: 'مدرات البول الثيازيدية', drugs: ['indapamide', 'hydrochlorothiazide'] },
    bb: { id: 'bb', nameEn: 'Beta-blocker', nameAr: 'حاصرات بيتا', drugs: ['bisoprolol', 'labetalol', 'metoprolol', 'atenolol', 'propranolol'] },
    mra: { id: 'mra', nameEn: 'Mineralocorticoid Receptor Antagonist (MRA)', nameAr: 'مضادات مستقبلات القشرانيات المعدنية', drugs: ['spironolactone', 'eplerenone'] },
    statin: { id: 'statin', nameEn: 'Statin (HMG-CoA Reductase Inhibitor)', nameAr: 'مركبات الستاتين المخفضة للكوليسترول', drugs: ['atorva', 'rosuva', 'atorvastatin', 'rosuvastatin', 'simvastatin'] },
    fibrate: { id: 'fibrate', nameEn: 'Fibrate (PPAR-alpha agonist)', nameAr: 'مجموعة الفايبريت لخفض الدهون الثلاثية', drugs: ['fenofibrate', 'gemfibrozil'] },
    ezetimibe: { id: 'ezetimibe', nameEn: 'Cholesterol Absorption Inhibitor', nameAr: 'إيزيتيميب (مانع امتصاص الكوليسترول)', drugs: ['ezetimibe'] },
    pcsk9i: { id: 'pcsk9i', nameEn: 'PCSK9 Inhibitor', nameAr: 'مثبطات بروتين PCSK9', drugs: ['evolocumab', 'alirocumab'] }
  };

  const defaultState = {
    name: 'Ahmed Mahmoud',
    age: 52,
    sex: 'm',
    wt: 96,
    ht: 170,
    dur: 4,
    hf: 'none',
    a1c: 8.9,
    fpg: 190,
    egfr: 68,
    uacr: 45,
    sbp: 148,
    dbp: 94,
    k: 4.6,
    tc: 210,
    hdl: 42,
    lunit: 'mg',
    lipidUnit: 'mg', // 'mg' or 'mmol'
    totalCholesterol: 210,
    ldlC: 130,
    hdlC: 42,
    triglycerides: 180,
    altUl: 28, // ALT liver transaminase U/L
    smoker: false,
    statin: false,
    ascvd: false,
    diabetes: true,
    dm: true,
    oob: true,
    cheap: true,
    statinIntolerant: false,
    pregnancy: false,
    trimester: 2,
    gestationalWeeks: 16,
    comorbidities: {
      postpartum: false,
      asthma: false
    },
    postpartum: false,
    asthma: false,
    copd: false,
    medsCount: '0',
    medications: [],
    activeMeds: ['met'],
    currentMeds: []
  };

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseNumOr(val, fallback) {
    if (val === undefined || val === null) return fallback;
    const s = String(val).trim();
    if (s === '') return fallback;
    const n = parseFloat(s);
    return isNaN(n) ? fallback : n;
  }

  let currentPatient = JSON.parse(JSON.stringify(defaultState));

  function getBMI(wt, ht) {
    if (!wt || !ht) return null;
    return (wt / ((ht / 100) ** 2)).toFixed(1);
  }

  /**
   * CKD-EPI 2021 Race-Free eGFR equation
   * Reference: Inker LA et al. N Engl J Med 2021; 385:1737-1749.
   */
  function calculateCkdEpi2021(scrVal, scrUnit, ageVal, sexVal) {
    const scr = parseFloat(scrVal) || 0;
    const age = parseFloat(ageVal) || 0;
    const sex = (sexVal === 'f') ? 'f' : 'm';
    if (scr <= 0 || age <= 0) return 0;

    const scrMg = (scrUnit === 'umol') ? (scr / 88.4) : scr;
    const kappa = (sex === 'f') ? 0.7 : 0.9;
    const alpha = (sex === 'f') ? -0.241 : -0.302;
    const genderMult = (sex === 'f') ? 1.012 : 1.0;

    const ratio = scrMg / kappa;
    const minVal = Math.min(ratio, 1.0);
    const maxVal = Math.max(ratio, 1.0);

    const egfr = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age) * genderMult;
    const egfrRound = Math.round(egfr * 10) / 10;

    // Return a Number object with custom properties to support both primitive comparison and object access
    const numObj = new Number(egfrRound);
    numObj.egfr = egfrRound;
    numObj.egfrInt = Math.round(egfr);
    numObj.toString = () => String(egfrRound);
    return numObj;
  }

  /**
   * Evaluates cross-engine clinical safety guardrails:
   * 1. Metformin renal guardrails (eGFR < 30 lactic acidosis critical alert, eGFR 30-44 cap 1000mg/d)
   * 2. Dual RAAS blockade (ACEi + ARB contraindicated alert)
   * 3. Hyperkalemia (K+ >= 5.5 stop RAAS/MRA alert, K+ > 5.0 avoid MRA)
   * 4. Pregnancy teratogenicity (stop ACEi/ARB/MRA/SGLT2i/Statins immediately)
   * 5. Cross-engine organ protection recommendation (SGLT2i when CKD/HF eGFR >= 20)
   */
  function evaluateSafetyGuardrails(state) {
    const p = state || currentPatient;
    const alerts = [];
    const egfr = parseNumOr(p.egfr, 0);
    const k = parseNumOr(p.k, 0);
    const medsRaw =
      (Array.isArray(p.meds) && p.meds.length ? p.meds : null) ||
      (Array.isArray(p.activeMeds) && p.activeMeds.length ? p.activeMeds : null) ||
      (Array.isArray(p.currentMeds) && p.currentMeds.length ? p.currentMeds : null) ||
      p.medications ||
      [];
    const meds = Array.isArray(medsRaw) ? medsRaw.map(m => String(m).toLowerCase()) : [];

    // Helper to check if a class or drug is active
    const hasDrug = (name) => meds.some(m => m.includes(name));
    const hasClass = (clsKey) => {
      if (!DRUG_CLASSES[clsKey]) return false;
      return DRUG_CLASSES[clsKey].drugs.some(d => meds.some(m => m.includes(d)));
    };

    function addAlert(a) {
      a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
      a.message = `${a.messageEn} | ${a.messageAr}`;
      a.msg = a.messageEn;
      a.title = a.titleEn;
      alerts.push(a);
    }

    // 1. Metformin Renal Guardrails
    const onMetformin = hasDrug('met') || hasDrug('metformin') || hasClass('biguanide') || (p.diabetes && !p.hypo);
    if (egfr > 0 && egfr < 30 && onMetformin) {
      addAlert({
        id: 'guardrail-metformin-crit',
        level: 'critical',
        engine: 'diabetes',
        titleEn: 'Critical Alert: Metformin Contraindicated (eGFR < 30)',
        titleAr: 'تنبيه حرج: الميتفورمين ممنوع تماماً (eGFR < 30)',
        messageEn: `eGFR is ${egfr} mL/min/1.73m². Metformin carries a life-threatening risk of fatal lactic acidosis when eGFR < 30. Discontinue metformin immediately. Contraindicated in severe CKD.`,
        messageAr: `معدل الترشيح الكبيبي eGFR هو ${egfr} مل/دقيقة. يُحظر استخدام الميتفورمين تماماً لخطر الحماض اللبني (حمض اللاكتيك lactic acidosis) المميت. أوقف الميتفورمين فوراً.`,
        actionEn: 'Discontinue Metformin immediately and consider alternative agents.',
        actionAr: 'أوقف الميتفورمين فوراً واستبدله ببدائل آمنة كلوياً.'
      });
    } else if (egfr >= 30 && egfr < 45 && onMetformin) {
      addAlert({
        id: 'guardrail-metformin-warn',
        level: 'warning',
        engine: 'diabetes',
        titleEn: 'Renal Dose Guardrail: Metformin 1000 mg/day Cap (eGFR 30–44)',
        titleAr: 'تنبيه كلوي: الحد الأقصى للميتفورمين 1000 مجم/يوم (eGFR 30–44)',
        messageEn: `eGFR is ${egfr} mL/min/1.73m² (Stage G3b). Dose cap: Metformin dose must not exceed 1000 mg/day (500 mg twice daily). Do not initiate new therapy at this stage.`,
        messageAr: `معدل الترشيح الكبيبي eGFR هو ${egfr} مل/دقيقة. الجرعة القصوى (cap) للميتفورمين هي 1000 مجم/يوم (500 مجم مرتين مع الوجبات). لا تبدأ علاجاً جديداً.`,
        actionEn: 'Cap Metformin dose at 1000 mg/day and monitor renal function every 3 months.',
        actionAr: 'قلص جرعة الميتفورمين إلى 1000 مجم/يوم وراقب وظائف الكلى كل 3 أشهر.'
      });
    }

    // 2. Dual RAAS Blockade (ACEi + ARB)
    const hasAcei = !!p.acei || hasClass('acei') || hasDrug('ace') || hasDrug('perindopril') || hasDrug('ramipril') || hasDrug('lisinopril') || hasDrug('enalapril') || hasDrug('coveram');
    const hasArb = !!p.arb || hasClass('arb') || hasDrug('arb') || hasDrug('valsartan') || hasDrug('losartan') || hasDrug('telmisartan') || hasDrug('candesartan') || hasDrug('exforge') || hasDrug('twynsta');
    if (hasAcei && hasArb) {
      addAlert({
        id: 'guardrail-dual-raas',
        level: 'critical',
        engine: 'htn',
        titleEn: 'Contraindication: Dual RAAS Blockade (ACEi + ARB)',
        titleAr: 'موانع استخدام حرجة: الجمع بين مثبطات ACE وحاصرات ARB (ازدواج)',
        messageEn: 'Dual RAAS blockade (ACE inhibitor + ARB) is contraindicated: provides no cardiovascular benefit and substantially increases risk of severe hyperkalemia, acute kidney injury (AKI), and syncope. Discontinue one immediately.',
        messageAr: 'يُمنع منعاً باتاً الجمع المزدوج بين (ACEi و ARB) لعدم وجود فائدة قلبية مع خطر شديد من الفشل الكلوي الحاد وارتفاع البوتاسيوم القاتل.',
        actionEn: 'Discontinue either ACEi or ARB immediately; maintain single RAAS blockade.',
        actionAr: 'أوقف أحدهما فوراً واكتفِ بنوع واحد فقط من حاصرات الرينين.'
      });
    }

    // 3. Hyperkalemia Guardrails
    if (k >= 5.5) {
      addAlert({
        id: 'guardrail-hyperkalemia-crit',
        level: 'critical',
        engine: 'cardiorenal',
        titleEn: `Critical Alert: Severe Hyperkalemia (K+ = ${k} mEq/L) - Stop RAAS & MRA`,
        titleAr: `تنبيه حرج: ارتفاع شديد في البوتاسيوم (K+ = ${k}) - إيقاف RAAS والسبيرونولاكتون`,
        messageEn: `Serum potassium (K+) is ${k} mEq/L (≥ 5.5). Stop RAAS inhibitors (ACEi/ARB) and MRA (Spironolactone) immediately. Hold potassium supplements. Obtain urgent 12-lead ECG, assess for cardiac toxicity, and recheck potassium.`,
        messageAr: `نسبة البوتاسيوم K+ هي ${k} mEq/L. يجب إيقاف (stop/hold) مثبطات الرينين-أنجيوتنسين ومدرات البول MRA (سبيرونولاكتون) فوراً. اطلب تخطيط قلب عاجل ECG وفحص بوتاسيوم تأكيدي.`,
        actionEn: 'Stop RAAS/MRA immediately; order urgent ECG & potassium retest.',
        actionAr: 'أوقف أدوية RAAS/MRA فوراً واطلب تخطيط قلب عاجل وفحص بوتاسيوم تأكيدي.'
      });
    } else if (k > 5.0) {
      addAlert({
        id: 'guardrail-hyperkalemia-warn',
        level: 'warning',
        engine: 'htn',
        titleEn: `Warning: Elevated Potassium (K+ = ${k} mEq/L) - Avoid MRA`,
        titleAr: `تحذير: ارتفاع البوتاسيوم (K+ = ${k}) - تجنب السبيرونولاكتون (MRA)`,
        messageEn: `Serum potassium is ${k} mEq/L (> 5.0). Precaution: Avoid initiating or up-titrating MRA (Spironolactone/Eplerenone). Exercise caution with ACEi/ARB and monitor electrolytes within 1–2 weeks.`,
        messageAr: `نسبة البوتاسيوم ${k} mEq/L. تجنب بدء أو زيادة جرعة السبيرونولاكتون (MRA). توخّ الحذر مع أدوية الضغط وراقب البوتاسيوم بعد أسبوع إلى أسبوعين.`,
        actionEn: 'Avoid MRA initiation/titration; recheck K+ and renal profile in 1-2 weeks.',
        actionAr: 'تجنب أدوية MRA وأعد فحص وظائف الكلى والبوتاسيوم بعد 1-2 أسبوع.'
      });
    }

    // 4. Pregnancy Teratogenicity
    if (p.pregnancy || p.preg || p.pregHtn) {
      addAlert({
        id: 'guardrail-pregnancy-teratogen',
        level: 'critical',
        engine: 'multidisciplinary',
        titleEn: 'Teratogenic Alert: Pregnancy / Planning Pregnancy - Stop RAAS / SGLT2i / Statins',
        titleAr: 'تنبيه تشوه الأجنة: الحمل أو التخطيط للحمل - إيقاف أدوية الضغط والستاتين',
        messageEn: 'Pregnancy detected: Stop ACEi, ARB, MRA, SGLT2i, and Statins immediately! Contraindicated due to fetal renal dysgenesis, skull hypoplasia, and perinatal death (FDA Category D/X teratogenicity). Switch HTN to Labetalol, Methyldopa, or Nifedipine; switch DM to Insulin.',
        messageAr: 'تنبيه الحمل: أوقف فوراً أدوية (ACEi, ARB, MRA, SGLT2i, Statins)! ممنوع تماماً ومحظر لتسببه بتشوهات مميتة للكلى الجنينية وتكلس العظام. أدوية الضغط الآمنة للحمل: ميثيل دوبا، لابيتاول، أو نيفيديبين. علاج السكر الآمن: الإنسولين.',
        actionEn: 'Switch HTN to Labetalol/Methyldopa; switch DM to Insulin; discontinue Statins/SGLT2i immediately.',
        actionAr: 'حوّل علاج الضغط إلى لابيتاول أو ميثيل دوبا، وعلاج السكر للإنسولين، وأوقف الستاتين فوراً.'
      });
    }

    // 5. Cross-Engine Organ Protection Recommendation
    const hasCkd = (egfr > 0 && egfr < 60) || (parseFloat(p.uacr) >= 30);
    const hasHf = p.hf && p.hf !== 'none';
    if ((hasCkd || hasHf) && egfr >= 20 && !p.pregnancy && !p.preg && !p.pregHtn) {
      addAlert({
        id: 'guardrail-sglt2-organ-protect',
        level: 'info',
        engine: 'cardiorenal',
        titleEn: 'Cardio-Renal Organ Protection: SGLT2 Inhibitor Indicated',
        titleAr: 'حماية الأعضاء الحيوية: توصية بمثبطات SGLT2 لحماية الكلى والقلب',
        messageEn: `Patient has CKD (eGFR ${egfr}, UACR ${p.uacr || 30} mg/g) and/or Heart Failure with eGFR ≥ 20. SGLT2 inhibitor (Dapagliflozin 10mg or Empagliflozin 10mg) is strongly recommended for renal protection, organ protection, slowing CKD progression, and reducing cardiovascular events.`,
        messageAr: `المريض لديه اعتلال كلوي أو قصور قلب مع وظائف كلى eGFR ≥ 20. يُوصى بشدة ببدء مثبطات SGLT2 (داباجليفلوزين 10 مجم أو إمباجليفلوزين 10 مجم) لحماية الكلى والأعضاء وخفض الوفيات.`,
        actionEn: 'Add SGLT2i (Dapagliflozin 10mg or Empagliflozin 10mg daily) for cardiorenal protection.',
        actionAr: 'أضف مثبط SGLT2 (داباجليفلوزين 10 مجم أو إمباجليفلوزين 10 مجم يومياً).'
      });
    }

    return alerts;
  }

  let isDispatching = false;

  function notifyUpdated() {
    const guardrails = evaluateSafetyGuardrails(currentPatient);
    if (!isDispatching && typeof window !== 'undefined') {
      try {
        isDispatching = true;
        if (typeof window.CustomEvent === 'function') {
          const ev = new CustomEvent('osrawy:patient-updated', {
            detail: { state: Object.assign({}, currentPatient), guardrails }
          });
          window.dispatchEvent(ev);
        } else if (typeof document !== 'undefined' && typeof document.createEvent === 'function') {
          const ev = document.createEvent('CustomEvent');
          ev.initCustomEvent('osrawy:patient-updated', false, false, { state: Object.assign({}, currentPatient), guardrails });
          window.dispatchEvent(ev);
        }
      } catch(e) {
      } finally {
        isDispatching = false;
      }
    }
    return guardrails;
  }

  function getEffectiveMedsList(pt) {
    if (!pt || typeof pt !== 'object') return [];
    if (Array.isArray(pt.medications) && pt.medications.length) return pt.medications.slice();
    if (Array.isArray(pt.activeMeds) && pt.activeMeds.length) return pt.activeMeds.slice();
    if (Array.isArray(pt.currentMeds) && pt.currentMeds.length) return pt.currentMeds.slice();
    return [];
  }

  function isMetMed(m) {
    const l = String(m || '').toLowerCase();
    return l === 'met' || l === 'metformin';
  }

  function isEzetMed(m) {
    const l = String(m || '').toLowerCase();
    return l === 'ezetimibe' || l.includes('ezetimibe');
  }

  function setDomValue(el, val) {
    if (!el || val === undefined || val === null) return;
    if (typeof document !== 'undefined' && document.activeElement === el) return;
    const str = String(val);
    if (String(el.value) !== str) el.value = str;
  }

  function setDomChecked(el, val) {
    if (!el) return;
    const next = !!val;
    if (Boolean(el.checked) !== next) el.checked = next;
  }

  function normalizePatientState(patchOrPt, isFullApply) {
    const medKeys = ['medications', 'activeMeds', 'currentMeds'];
    const providedMedKeys = (patchOrPt && typeof patchOrPt === 'object')
      ? medKeys.filter(k => Array.isArray(patchOrPt[k]))
      : [];

    let resolvedMeds;
    if (providedMedKeys.length > 0) {
      const nonEmptyKey = providedMedKeys.find(k => patchOrPt[k].length > 0);
      resolvedMeds = nonEmptyKey ? patchOrPt[nonEmptyKey].slice() : [];
      currentPatient.medications = resolvedMeds.slice();
      currentPatient.activeMeds = resolvedMeds.slice();
      currentPatient.currentMeds = resolvedMeds.slice();
    } else if (isFullApply) {
      resolvedMeds = getEffectiveMedsList(currentPatient);
      currentPatient.medications = resolvedMeds.slice();
      currentPatient.activeMeds = resolvedMeds.slice();
      currentPatient.currentMeds = resolvedMeds.slice();
    } else {
      resolvedMeds = getEffectiveMedsList(currentPatient);
    }

    const patchDmTx = (patchOrPt && patchOrPt.dmTherapy && typeof patchOrPt.dmTherapy === 'object') ? patchOrPt.dmTherapy : null;
    const prevDmTx = (currentPatient.dmTherapy && typeof currentPatient.dmTherapy === 'object') ? currentPatient.dmTherapy : {};

    if (providedMedKeys.length > 0) {
      if (isFullApply && patchDmTx && patchDmTx.met !== undefined) {
        const hasMetBefore = resolvedMeds.some(isMetMed);
        if (patchDmTx.met && !hasMetBefore) {
          resolvedMeds.unshift('met');
        } else if (!patchDmTx.met && hasMetBefore) {
          resolvedMeds = resolvedMeds.filter(m => !isMetMed(m));
        }
        currentPatient.medications = resolvedMeds.slice();
        currentPatient.activeMeds = resolvedMeds.slice();
        currentPatient.currentMeds = resolvedMeds.slice();
      }
      const hasMet = resolvedMeds.some(isMetMed);
      const hasEzet = resolvedMeds.some(isEzetMed);
      currentPatient.dmTherapy = Object.assign({}, prevDmTx, patchDmTx || {}, {
        met: (isFullApply && patchDmTx && patchDmTx.met !== undefined) ? !!patchDmTx.met : hasMet
      });
      currentPatient.onEzetimibe = hasEzet;
    } else {
      let medsDirty = false;
      if (patchDmTx && patchDmTx.met !== undefined) {
        const wantMet = !!patchDmTx.met;
        const hasMet = resolvedMeds.some(isMetMed);
        if (wantMet && !hasMet) {
          resolvedMeds.unshift('met');
          medsDirty = true;
        } else if (!wantMet && hasMet) {
          resolvedMeds = resolvedMeds.filter(m => !isMetMed(m));
          medsDirty = true;
        }
        currentPatient.dmTherapy = Object.assign({}, prevDmTx, patchDmTx, { met: wantMet });
      } else if (isFullApply) {
        currentPatient.dmTherapy = Object.assign({}, prevDmTx, { met: resolvedMeds.some(isMetMed) });
      } else if (patchDmTx) {
        currentPatient.dmTherapy = Object.assign({}, prevDmTx, patchDmTx);
      }

      if (patchOrPt && patchOrPt.onEzetimibe !== undefined) {
        const wantEzet = !!patchOrPt.onEzetimibe;
        const hasEzet = resolvedMeds.some(isEzetMed);
        if (wantEzet && !hasEzet) {
          resolvedMeds.push('ezetimibe');
          medsDirty = true;
        } else if (!wantEzet && hasEzet) {
          resolvedMeds = resolvedMeds.filter(m => !isEzetMed(m));
          medsDirty = true;
        }
        currentPatient.onEzetimibe = wantEzet;
      } else if (isFullApply) {
        currentPatient.onEzetimibe = resolvedMeds.some(isEzetMed);
      }

      if (medsDirty) {
        currentPatient.medications = resolvedMeds.slice();
        currentPatient.activeMeds = resolvedMeds.slice();
        currentPatient.currentMeds = resolvedMeds.slice();
      }
    }

    if (patchOrPt && typeof patchOrPt === 'object') {
      if (patchOrPt.tc !== undefined && patchOrPt.totalCholesterol === undefined) {
        currentPatient.totalCholesterol = currentPatient.tc;
      } else if (patchOrPt.totalCholesterol !== undefined && patchOrPt.tc === undefined) {
        currentPatient.tc = currentPatient.totalCholesterol;
      } else if (isFullApply) {
        const resolvedTc = (patchOrPt.tc !== undefined) ? patchOrPt.tc : currentPatient.totalCholesterol;
        if (resolvedTc !== undefined) {
          currentPatient.tc = resolvedTc;
          currentPatient.totalCholesterol = resolvedTc;
        }
      }

      if (patchOrPt.hdl !== undefined && patchOrPt.hdlC === undefined) {
        currentPatient.hdlC = currentPatient.hdl;
      } else if (patchOrPt.hdlC !== undefined && patchOrPt.hdl === undefined) {
        currentPatient.hdl = currentPatient.hdlC;
      } else if (isFullApply) {
        const resolvedHdl = (patchOrPt.hdl !== undefined) ? patchOrPt.hdl : currentPatient.hdlC;
        if (resolvedHdl !== undefined) {
          currentPatient.hdl = resolvedHdl;
          currentPatient.hdlC = resolvedHdl;
        }
      }

      if (patchOrPt.lunit !== undefined && patchOrPt.lipidUnit === undefined) {
        currentPatient.lipidUnit = currentPatient.lunit;
      } else if (patchOrPt.lipidUnit !== undefined && patchOrPt.lunit === undefined) {
        currentPatient.lunit = currentPatient.lipidUnit;
      } else if (isFullApply) {
        const resolvedUnit = patchOrPt.lunit || patchOrPt.lipidUnit || currentPatient.lunit || 'mg';
        currentPatient.lunit = resolvedUnit;
        currentPatient.lipidUnit = resolvedUnit;
      }

      if (patchOrPt.diabetes !== undefined && patchOrPt.dm === undefined) {
        currentPatient.dm = !!currentPatient.diabetes;
      } else if (patchOrPt.dm !== undefined && patchOrPt.diabetes === undefined) {
        currentPatient.diabetes = !!currentPatient.dm;
      } else if (isFullApply) {
        const hasDm = (patchOrPt.diabetes !== undefined)
          ? !!patchOrPt.diabetes
          : ((patchOrPt.dm !== undefined) ? !!patchOrPt.dm : true);
        currentPatient.diabetes = hasDm;
        currentPatient.dm = hasDm;
      }

      if (patchOrPt.sex === 'm' && !('pregnancy' in patchOrPt || 'preg' in patchOrPt || 'pregHtn' in patchOrPt)) {
        currentPatient.pregnancy = false;
        currentPatient.preg = false;
        currentPatient.pregHtn = false;
      } else if ('pregnancy' in patchOrPt || 'preg' in patchOrPt || 'pregHtn' in patchOrPt || isFullApply) {
        const isPreg = ('pregnancy' in patchOrPt)
          ? !!patchOrPt.pregnancy
          : (('preg' in patchOrPt)
            ? !!patchOrPt.preg
            : (('pregHtn' in patchOrPt)
              ? !!patchOrPt.pregHtn
              : !!(currentPatient.pregnancy || currentPatient.preg || currentPatient.pregHtn)));
        currentPatient.pregnancy = isPreg;
        currentPatient.preg = isPreg;
        currentPatient.pregHtn = isPreg;
      }
    }
  }

  function syncDomFromState(isFullResetOrApply) {
    if (typeof document === 'undefined') return;
    const $ = id => document.getElementById(id);

    // Diabetes inputs
    setDomValue($('pname'), currentPatient.name || '');
    setDomValue($('age'), currentPatient.age);
    setDomValue($('sex'), currentPatient.sex || 'm');
    setDomValue($('wt'), currentPatient.wt);
    setDomValue($('iwt'), currentPatient.wt);
    setDomValue($('ht'), currentPatient.ht);
    setDomValue($('dur'), currentPatient.dur);
    setDomValue($('hf'), currentPatient.hf || 'none');
    setDomValue($('a1c'), currentPatient.a1c);
    setDomValue($('fpg'), currentPatient.fpg);
    setDomValue($('ifpg'), currentPatient.fpg);
    setDomValue($('egfr'), currentPatient.egfr);
    setDomValue($('uacr'), currentPatient.uacr);
    setDomChecked($('cheap'), currentPatient.cheap !== false);
    setDomChecked($('ascvd'), currentPatient.ascvd);
    setDomChecked($('hrisk'), currentPatient.hrisk);
    setDomChecked($('masld'), currentPatient.masld);
    setDomChecked($('smoker'), currentPatient.smoker);
    setDomChecked($('hypo'), currentPatient.hypo);
    setDomChecked($('frail'), currentPatient.frail);
    setDomChecked($('catab'), currentPatient.catab);
    setDomChecked($('pancr'), currentPatient.pancr);
    setDomChecked($('geni'), currentPatient.geni);
    const isPreg = !!(currentPatient.pregnancy || currentPatient.preg || currentPatient.pregHtn);
    setDomChecked($('preg'), isPreg);

    const dmTx = currentPatient.dmTherapy || {};
    const allMeds = getEffectiveMedsList(currentPatient);
    const hasMet = (dmTx.met !== undefined) ? !!dmTx.met : allMeds.some(isMetMed);
    setDomChecked($('c-met'), hasMet);
    setDomChecked($('c-su'), dmTx.su);
    setDomChecked($('c-dpp'), dmTx.dpp);
    setDomChecked($('c-sglt'), dmTx.sglt);
    setDomChecked($('c-glp'), dmTx.glp);
    setDomChecked($('c-pio'), dmTx.pio);
    setDomChecked($('c-ins'), dmTx.ins);

    // HTN inputs
    setDomValue($('sbp'), currentPatient.sbp);
    setDomValue($('dbp'), currentPatient.dbp);
    setDomValue($('htn-age'), currentPatient.age);
    setDomValue($('htn-sex'), currentPatient.sex || 'm');
    setDomValue($('meds'), String(currentPatient.medsCount !== undefined ? currentPatient.medsCount : '0'));
    setDomChecked($('oob'), currentPatient.oob);
    setDomValue($('htn-egfr'), currentPatient.egfr);
    setDomValue($('htn-uacr'), currentPatient.uacr);
    setDomValue($('k'), currentPatient.k);
    setDomChecked($('dm'), currentPatient.diabetes !== false && currentPatient.dm !== false);
    setDomChecked($('cad'), currentPatient.ascvd);
    setDomChecked($('hf-htn'), currentPatient.hf === 'hfref');
    setDomChecked($('stroke'), currentPatient.stroke);
    setDomChecked($('af'), currentPatient.af);
    setDomChecked($('gout'), currentPatient.gout);
    setDomChecked($('asthma'), currentPatient.asthma);
    setDomChecked($('bph'), currentPatient.bph);
    setDomChecked($('smk'), currentPatient.smoker);
    setDomChecked($('statin'), currentPatient.statin);
    setDomChecked($('frail-htn'), currentPatient.frail);
    setDomChecked($('ortho'), currentPatient.ortho);
    setDomChecked($('preg-htn'), isPreg);

    const tcVal = currentPatient.tc !== undefined ? currentPatient.tc : currentPatient.totalCholesterol;
    const hdlVal = currentPatient.hdl !== undefined ? currentPatient.hdl : currentPatient.hdlC;
    const lunitVal = currentPatient.lunit || currentPatient.lipidUnit || 'mg';
    setDomValue($('tc'), tcVal);
    setDomValue($('hdl'), hdlVal);
    setDomValue($('lunit'), lunitVal);

    // DLP inputs
    setDomValue($('dlp-ldl'), currentPatient.ldlC);
    setDomValue($('dlp-tc'), tcVal);
    setDomValue($('dlp-hdl'), hdlVal);
    setDomValue($('dlp-tg'), currentPatient.triglycerides);
    setDomValue($('dlp-alt'), currentPatient.altUl);
    setDomValue($('dlp-unit'), lunitVal);
    setDomChecked($('dlp-statin-intol'), currentPatient.statinIntolerant);
    setDomChecked($('dlp-ezetimibe'), currentPatient.onEzetimibe || allMeds.some(isEzetMed));

    // Tools / Primary Care mounted inputs if currently rendered
    setDomValue($('tab-age'), currentPatient.age);
    setDomValue($('tab-sex'), currentPatient.sex || 'm');
    setDomValue($('tab-wt'), currentPatient.wt);
    if (currentPatient.scr !== undefined && currentPatient.scr !== null && currentPatient.scr !== '') {
      setDomValue($('tab-scr'), currentPatient.scr);
      setDomValue($('tab-scr-unit'), currentPatient.scrUnit || 'mg');
    } else if (isFullResetOrApply) {
      setDomValue($('tab-scr'), 1.1);
      setDomValue($('tab-scr-unit'), currentPatient.scrUnit || 'mg');
    }
    setDomValue($('tab-kdigo-egfr'), currentPatient.egfr);
    setDomValue($('tab-kdigo-uacr'), currentPatient.uacr);
    setDomValue($('pc-thy-wt'), currentPatient.wt);
    setDomChecked($('pc-thy-ascvd'), currentPatient.ascvd);
    setDomChecked($('pc-thy-preg'), isPreg);
    setDomChecked($('pc-thy-asthma'), currentPatient.asthma);
  }

  function renderEngines() {
    if (typeof window !== 'undefined') {
      if (typeof window.plan === 'function') window.plan();
      if (typeof window.htnRender === 'function') window.htnRender();
      if (typeof window.htnRenderTitrate === 'function') window.htnRenderTitrate();
      if (typeof window.renderPregnancyCards === 'function') window.renderPregnancyCards(currentPatient);
      if (typeof window.recalculateToolsTab === 'function') window.recalculateToolsTab();
      if (typeof window.updatePrimaryCareUi === 'function') window.updatePrimaryCareUi();
    }
  }

  function loadActive() {
    try {
      const s = localStorage.getItem(ACTIVE_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        currentPatient = Object.assign(currentPatient, parsed);
        normalizePatientState(parsed, true);
      }
    } catch(e) {}
    return currentPatient;
  }

  function saveActive() {
    try {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(currentPatient));
    } catch(e) {}
  }

  function getRecentList() {
    try {
      const list = localStorage.getItem(STORAGE_KEY);
      return list ? JSON.parse(list) : [];
    } catch(e) {
      return [];
    }
  }

  function saveToRecent(label) {
    try {
      const list = getRecentList();
      const item = {
        id: 'pt_' + Date.now(),
        timestamp: new Date().toLocaleString(),
        label: label || currentPatient.name || 'Anonymous Patient',
        data: JSON.parse(JSON.stringify(currentPatient))
      };
      const updated = [item, ...list.filter(x => x.label !== item.label).slice(0, 19)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch(e) {
      return [];
    }
  }

  function removeRecent(id) {
    try {
      const list = getRecentList().filter(x => x.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return list;
    } catch(e) {
      return [];
    }
  }

  // Cross-tab two-way sync
  let isSyncing = false;

  function syncFromDiabetes() {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const $ = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
      if (!$('pname')) return;

      const prevSex = currentPatient.sex;
      currentPatient.name = $('pname').value || '';
      currentPatient.age = parseNumOr($('age').value, 52);
      currentPatient.sex = $('sex').value || 'm';
      currentPatient.wt = parseNumOr($('wt').value, 96);
      currentPatient.ht = parseNumOr($('ht').value, 170);
      currentPatient.dur = parseNumOr($('dur').value, 4);
      currentPatient.hf = $('hf').value || 'none';
      currentPatient.a1c = parseNumOr($('a1c').value, 8.9);
      currentPatient.fpg = parseNumOr($('fpg').value, 190);
      currentPatient.egfr = parseNumOr($('egfr').value, 68);
      currentPatient.uacr = parseNumOr($('uacr').value, 45);
      currentPatient.ascvd = !!($('ascvd') && $('ascvd').checked);
      currentPatient.hrisk = !!($('hrisk') && $('hrisk').checked);
      currentPatient.masld = !!($('masld') && $('masld').checked);
      currentPatient.smoker = !!($('smoker') && $('smoker').checked);
      if ($('hypo')) currentPatient.hypo = $('hypo').checked;
      if ($('frail')) currentPatient.frail = $('frail').checked;
      currentPatient.catab = !!($('catab') && $('catab').checked);
      currentPatient.pancr = !!($('pancr') && $('pancr').checked);
      currentPatient.geni = !!($('geni') && $('geni').checked);
      if ($('cheap')) currentPatient.cheap = $('cheap').checked;
      currentPatient.diabetes = true;
      currentPatient.dm = true;

      if (prevSex !== 'm' && currentPatient.sex === 'm') {
        currentPatient.pregnancy = false;
        currentPatient.preg = false;
        currentPatient.pregHtn = false;
        setDomChecked($('preg'), false);
        setDomChecked($('preg-htn'), false);
      } else if ($('preg')) {
        const isPreg = !!$('preg').checked;
        currentPatient.pregnancy = isPreg;
        currentPatient.preg = isPreg;
        currentPatient.pregHtn = isPreg;
      }

      // Preserve all Diabetes therapy checkboxes for draft save/restore
      currentPatient.dmTherapy = {
        met: !!($('c-met') && $('c-met').checked),
        su: !!($('c-su') && $('c-su').checked),
        dpp: !!($('c-dpp') && $('c-dpp').checked),
        sglt: !!($('c-sglt') && $('c-sglt').checked),
        glp: !!($('c-glp') && $('c-glp').checked),
        pio: !!($('c-pio') && $('c-pio').checked),
        ins: !!($('c-ins') && $('c-ins').checked)
      };

      // Sync #c-met checkbox cleanly with medications/activeMeds/currentMeds without erasing other added drugs
      if ($('c-met')) {
        const baseMeds = getEffectiveMedsList(currentPatient);
        const hasMet = baseMeds.some(isMetMed);
        let nextMeds = baseMeds.slice();
        if ($('c-met').checked) {
          if (!hasMet) nextMeds.unshift('met');
        } else {
          nextMeds = nextMeds.filter(m => !isMetMed(m));
        }
        currentPatient.activeMeds = nextMeds.slice();
        currentPatient.medications = nextMeds.slice();
        currentPatient.currentMeds = nextMeds.slice();
      }

      // Propagate to HTN & mounted Tools/PC inputs if present
      setDomValue($('htn-age'), currentPatient.age);
      setDomValue($('htn-sex'), currentPatient.sex);
      setDomValue($('htn-egfr'), currentPatient.egfr);
      setDomValue($('htn-uacr'), currentPatient.uacr);
      setDomChecked($('cad'), currentPatient.ascvd);
      setDomChecked($('hf-htn'), currentPatient.hf === 'hfref');
      setDomChecked($('smk'), currentPatient.smoker);
      setDomChecked($('dm'), true);
      if ($('frail')) setDomChecked($('frail-htn'), $('frail').checked);
      setDomChecked($('preg-htn'), !!(currentPatient.pregnancy || currentPatient.preg || currentPatient.pregHtn));
      setDomValue($('tab-age'), currentPatient.age);
      setDomValue($('tab-sex'), currentPatient.sex);
      setDomValue($('tab-wt'), currentPatient.wt);
      setDomValue($('tab-kdigo-egfr'), currentPatient.egfr);
      setDomValue($('tab-kdigo-uacr'), currentPatient.uacr);
      setDomValue($('pc-thy-wt'), currentPatient.wt);
      setDomChecked($('pc-thy-ascvd'), currentPatient.ascvd);
      setDomChecked($('pc-thy-preg'), !!(currentPatient.pregnancy || currentPatient.preg || currentPatient.pregHtn));

      saveActive();
      updatePatientBar();
      notifyUpdated();

      // Recalculate HTN and mounted helpers if available
      if (typeof window !== 'undefined') {
        if (typeof window.htnRender === 'function') window.htnRender();
        if (typeof window.htnRenderTitrate === 'function') window.htnRenderTitrate();
        if (typeof window.renderPregnancyCards === 'function') window.renderPregnancyCards(currentPatient);
        if (typeof window.recalculateToolsTab === 'function') window.recalculateToolsTab();
        if (typeof window.updatePrimaryCareUi === 'function') window.updatePrimaryCareUi();
      }
    } finally {
      isSyncing = false;
    }
  }

  function syncFromHTN() {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const $ = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
      if (!$('sbp')) return;

      const prevSex = currentPatient.sex;
      currentPatient.sbp = parseNumOr($('sbp').value, 148);
      currentPatient.dbp = parseNumOr($('dbp').value, 94);
      currentPatient.age = parseNumOr($('htn-age').value, currentPatient.age);
      currentPatient.sex = $('htn-sex').value || currentPatient.sex;
      currentPatient.egfr = parseNumOr($('htn-egfr').value, currentPatient.egfr);
      currentPatient.uacr = parseNumOr($('htn-uacr').value, currentPatient.uacr);
      currentPatient.k = parseNumOr($('k').value, 4.6);
      if ($('meds')) currentPatient.medsCount = $('meds').value || '0';
      if ($('oob')) currentPatient.oob = $('oob').checked;
      currentPatient.smoker = !!($('smk') && $('smk').checked);
      currentPatient.statin = !!($('statin') && $('statin').checked);
      currentPatient.ascvd = !!($('cad') && $('cad').checked);
      if ($('stroke')) currentPatient.stroke = $('stroke').checked;
      if ($('af')) currentPatient.af = $('af').checked;
      if ($('gout')) currentPatient.gout = $('gout').checked;
      if ($('asthma')) currentPatient.asthma = $('asthma').checked;
      if ($('bph')) currentPatient.bph = $('bph').checked;
      if ($('ortho')) currentPatient.ortho = $('ortho').checked;
      if ($('dm')) {
        currentPatient.diabetes = !!$('dm').checked;
        currentPatient.dm = !!$('dm').checked;
      }
      if ($('hf-htn')) {
        currentPatient.hf = $('hf-htn').checked ? 'hfref' : (currentPatient.hf === 'hfref' ? 'none' : currentPatient.hf);
        setDomValue($('hf'), currentPatient.hf);
      }
      if ($('frail-htn')) {
        currentPatient.frail = $('frail-htn').checked;
        setDomChecked($('frail'), currentPatient.frail);
      }
      if (prevSex !== 'm' && currentPatient.sex === 'm') {
        currentPatient.pregnancy = false;
        currentPatient.preg = false;
        currentPatient.pregHtn = false;
        setDomChecked($('preg'), false);
        setDomChecked($('preg-htn'), false);
      } else if ($('preg-htn')) {
        const isPreg = !!$('preg-htn').checked;
        currentPatient.pregnancy = isPreg;
        currentPatient.preg = isPreg;
        currentPatient.pregHtn = isPreg;
      }

      // Lipid values from HTN panel synced to state and DLP inputs
      if ($('tc')) {
        currentPatient.tc = parseNumOr($('tc').value, currentPatient.tc);
        currentPatient.totalCholesterol = currentPatient.tc;
        setDomValue($('dlp-tc'), currentPatient.tc);
      }
      if ($('hdl')) {
        currentPatient.hdl = parseNumOr($('hdl').value, currentPatient.hdl);
        currentPatient.hdlC = currentPatient.hdl;
        setDomValue($('dlp-hdl'), currentPatient.hdl);
      }
      if ($('lunit')) {
        currentPatient.lunit = $('lunit').value || 'mg';
        currentPatient.lipidUnit = currentPatient.lunit;
        setDomValue($('dlp-unit'), currentPatient.lunit);
      }

      // Propagate back to Diabetes & mounted Tools/PC inputs
      setDomValue($('age'), currentPatient.age);
      setDomValue($('sex'), currentPatient.sex);
      setDomValue($('egfr'), currentPatient.egfr);
      setDomValue($('uacr'), currentPatient.uacr);
      setDomChecked($('ascvd'), currentPatient.ascvd);
      setDomChecked($('smoker'), currentPatient.smoker);
      setDomChecked($('preg'), !!(currentPatient.pregnancy || currentPatient.preg || currentPatient.pregHtn));
      setDomValue($('tab-age'), currentPatient.age);
      setDomValue($('tab-sex'), currentPatient.sex);
      setDomValue($('tab-kdigo-egfr'), currentPatient.egfr);
      setDomValue($('tab-kdigo-uacr'), currentPatient.uacr);
      setDomChecked($('pc-thy-ascvd'), currentPatient.ascvd);
      setDomChecked($('pc-thy-preg'), !!(currentPatient.pregnancy || currentPatient.preg || currentPatient.pregHtn));
      setDomChecked($('pc-thy-asthma'), currentPatient.asthma);

      saveActive();
      updatePatientBar();
      notifyUpdated();

      // Recalculate Diabetes and mounted helpers if available
      if (typeof window !== 'undefined') {
        if (typeof window.plan === 'function') window.plan();
        if (typeof window.renderPregnancyCards === 'function') window.renderPregnancyCards(currentPatient);
        if (typeof window.recalculateToolsTab === 'function') window.recalculateToolsTab();
        if (typeof window.updatePrimaryCareUi === 'function') window.updatePrimaryCareUi();
      }
    } finally {
      isSyncing = false;
    }
  }

  function updatePatientBar() {
    if (typeof document === 'undefined') return;
    const bar = document.getElementById('patient-summary-bar');
    if (!bar) return;
    const bmi = getBMI(currentPatient.wt, currentPatient.ht);
    const t = (k, def) => (typeof window !== 'undefined' && typeof window.I18n !== 'undefined' ? window.I18n.t(k, def) : def);
    const sexLabel = currentPatient.sex === 'm' ? t('opt_male', 'ذكر') : t('opt_female', 'أنثى');
    const ageUnit = t('bar_years', 'سنة');
    bar.innerHTML = `
      <div class="pt-bar-item"><span class="pt-bar-label">${t('bar_name', 'الاسم:')}</span> <b>${escapeHtml(currentPatient.name) || t('bar_new_patient', 'مريض جديد')}</b></div>
      <div class="pt-bar-item"><span class="pt-bar-label">${t('bar_age', 'العمر:')}</span> <b>${currentPatient.age} ${ageUnit}</b> (${sexLabel})</div>
      <div class="pt-bar-item"><span class="pt-bar-label">BMI:</span> <b>${bmi || '—'}</b> (${currentPatient.wt} kg)</div>
      <div class="pt-bar-item"><span class="pt-bar-label">eGFR:</span> <b>${currentPatient.egfr}</b></div>
      <div class="pt-bar-item"><span class="pt-bar-label">UACR:</span> <b>${currentPatient.uacr} mg/g</b></div>
      <div class="pt-bar-item"><span class="pt-bar-label">${t('bar_bp', 'الضغط:')}</span> <b>${currentPatient.sbp}/${currentPatient.dbp}</b></div>
    `;
  }

  function applyPatient(pt) {
    let clonedDefault = JSON.parse(JSON.stringify(defaultState));
    let clonedPt = pt || {};
    try {
      if (pt) clonedPt = JSON.parse(JSON.stringify(pt));
    } catch(e) {}
    currentPatient = Object.assign(clonedDefault, clonedPt);
    normalizePatientState(clonedPt, true);
    if (typeof window !== 'undefined') {
      if (typeof window.dmResetRxUser === 'function') window.dmResetRxUser();
      if (typeof window.htnResetRiskManual === 'function') window.htnResetRiskManual();
    }
    if (!isSyncing) {
      isSyncing = true;
      try {
        syncDomFromState(true);
      } finally {
        isSyncing = false;
      }
    }

    saveActive();
    updatePatientBar();
    notifyUpdated();
    renderEngines();
  }

  function setEGFR(val) {
    const parsed = parseFloat(val);
    const num = isNaN(parsed) ? 0 : Math.round(parsed);
    currentPatient.egfr = num;
    if (!isSyncing) {
      isSyncing = true;
      try {
        syncDomFromState();
      } finally {
        isSyncing = false;
      }
    }
    saveActive();
    updatePatientBar();
    notifyUpdated();
    renderEngines();
    return num;
  }

  function resetPatient() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(ACTIVE_KEY);
      }
    } catch(e) {}
    currentPatient = JSON.parse(JSON.stringify(defaultState));
    currentPatient.medications = [];
    currentPatient.activeMeds = [];
    currentPatient.currentMeds = [];
    currentPatient.dmTherapy = {
      met: false,
      su: false,
      dpp: false,
      sglt: false,
      glp: false,
      pio: false,
      ins: false
    };
    currentPatient.onEzetimibe = false;
    currentPatient.preg = false;
    currentPatient.pregHtn = false;
    if (typeof window !== 'undefined') {
      if (typeof window.dmResetRxUser === 'function') window.dmResetRxUser();
      if (typeof window.htnResetRiskManual === 'function') window.htnResetRiskManual();
    }
    if (!isSyncing) {
      isSyncing = true;
      try {
        syncDomFromState(true);
      } finally {
        isSyncing = false;
      }
    }
    try {
      updatePatientBar();
      notifyUpdated();
      renderEngines();
    } catch(e) {}
    return currentPatient;
  }

  function updatePatient(patch) {
    if (patch && typeof patch === 'object') {
      Object.assign(currentPatient, patch);
      normalizePatientState(patch, false);
      const touchesPrevent = (
        'tc' in patch || 'totalCholesterol' in patch ||
        'hdl' in patch || 'hdlC' in patch ||
        'lunit' in patch || 'lipidUnit' in patch ||
        'smoker' in patch || 'statin' in patch ||
        'diabetes' in patch || 'dm' in patch
      );
      if (touchesPrevent && !('risk' in patch) && typeof window !== 'undefined' && typeof window.htnResetRiskManual === 'function') {
        window.htnResetRiskManual();
      }
      if (!isSyncing) {
        isSyncing = true;
        try {
          syncDomFromState(false);
        } finally {
          isSyncing = false;
        }
      }
      saveActive();
      updatePatientBar();
      notifyUpdated();
      renderEngines();
    }
    return currentPatient;
  }

  function setField(field, value) {
    if (!field) return currentPatient;
    return updatePatient({ [field]: value });
  }

  return {
    defaultState,
    DRUG_CLASSES,
    calculateCkdEpi2021,
    evaluateSafetyGuardrails,
    notifyUpdated,
    setField,
    resetPatient,
    updatePatient,
    get: () => currentPatient,
    getState: () => currentPatient,
    setEGFR,
    loadActive,
    saveActive,
    getRecentList,
    saveToRecent,
    removeRecent,
    syncFromDiabetes,
    syncFromHTN,
    updatePatientBar,
    applyPatient,
    getBMI
  };
})();

// Export globally under both names for complete compatibility
if (typeof window !== 'undefined') {
  window.PatientSync = PatientSync;
  window.OsrawyPatientSync = PatientSync;
}

if (typeof global !== 'undefined') {
  global.PatientSync = PatientSync;
  global.OsrawyPatientSync = PatientSync;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PatientSync;
}
