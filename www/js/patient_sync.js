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
    statinIntolerant: false,
    pregnancy: false,
    asthma: false,
    copd: false,
    medsCount: '0',
    activeMeds: ['met'],
    currentMeds: []
  };

  let currentPatient = Object.assign({}, defaultState);

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
    const egfr = parseFloat(p.egfr) || 0;
    const k = parseFloat(p.k) || 0;
    const medsRaw = p.meds || p.activeMeds || p.currentMeds || [];
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

  function notifyUpdated() {
    const guardrails = evaluateSafetyGuardrails(currentPatient);
    if (typeof window !== 'undefined') {
      try {
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
      } catch(e) {}
    }
    return guardrails;
  }

  function loadActive() {
    try {
      const s = localStorage.getItem(ACTIVE_KEY);
      if (s) {
        currentPatient = Object.assign(currentPatient, JSON.parse(s));
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
        data: Object.assign({}, currentPatient)
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

      currentPatient.name = $('pname').value || '';
      currentPatient.age = parseFloat($('age').value) || 52;
      currentPatient.sex = $('sex').value || 'm';
      currentPatient.wt = parseFloat($('wt').value) || 96;
      currentPatient.ht = parseFloat($('ht').value) || 170;
      currentPatient.dur = parseFloat($('dur').value) || 4;
      currentPatient.hf = $('hf').value || 'none';
      currentPatient.a1c = parseFloat($('a1c').value) || 8.9;
      currentPatient.fpg = parseFloat($('fpg').value) || 190;
      currentPatient.egfr = parseFloat($('egfr').value) || 68;
      currentPatient.uacr = parseFloat($('uacr').value) || 45;
      currentPatient.ascvd = !!($('ascvd') && $('ascvd').checked);
      currentPatient.smoker = !!($('smoker') && $('smoker').checked);
      currentPatient.diabetes = true;
      currentPatient.dm = true;

      if ($('preg')) currentPatient.pregnancy = $('preg').checked;

      // Propagate to HTN inputs if present
      if ($('htn-age')) $('htn-age').value = currentPatient.age;
      if ($('htn-sex')) $('htn-sex').value = currentPatient.sex;
      if ($('htn-egfr')) $('htn-egfr').value = currentPatient.egfr;
      if ($('htn-uacr')) $('htn-uacr').value = currentPatient.uacr;
      if ($('cad')) $('cad').checked = currentPatient.ascvd;
      if ($('hf-htn')) $('hf-htn').checked = (currentPatient.hf === 'hfref');
      if ($('smk')) $('smk').checked = currentPatient.smoker;
      if ($('dm')) $('dm').checked = true;
      if ($('preg-htn') && $('preg')) $('preg-htn').checked = $('preg').checked;

      saveActive();
      updatePatientBar();
      notifyUpdated();

      // Recalculate HTN if available
      if (typeof window !== 'undefined' && typeof window.htnRender === 'function') window.htnRender();
      if (typeof window !== 'undefined' && typeof window.htnRenderTitrate === 'function') window.htnRenderTitrate();
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

      currentPatient.sbp = parseFloat($('sbp').value) || 148;
      currentPatient.dbp = parseFloat($('dbp').value) || 94;
      currentPatient.age = parseFloat($('htn-age').value) || currentPatient.age;
      currentPatient.sex = $('htn-sex').value || currentPatient.sex;
      currentPatient.egfr = parseFloat($('htn-egfr').value) || currentPatient.egfr;
      currentPatient.uacr = parseFloat($('htn-uacr').value) || currentPatient.uacr;
      currentPatient.k = parseFloat($('k').value) || 4.6;
      currentPatient.smoker = !!($('smk') && $('smk').checked);
      currentPatient.statin = !!($('statin') && $('statin').checked);
      currentPatient.ascvd = !!($('cad') && $('cad').checked);
      if ($('dm')) currentPatient.diabetes = $('dm').checked;
      if ($('preg-htn')) currentPatient.pregnancy = $('preg-htn').checked;

      // Lipid values from HTN panel if available
      if ($('tc')) {
        currentPatient.tc = parseFloat($('tc').value) || currentPatient.tc;
        currentPatient.totalCholesterol = currentPatient.tc;
      }
      if ($('hdl')) {
        currentPatient.hdl = parseFloat($('hdl').value) || currentPatient.hdl;
        currentPatient.hdlC = currentPatient.hdl;
      }
      if ($('lunit')) {
        currentPatient.lunit = $('lunit').value || 'mg';
        currentPatient.lipidUnit = currentPatient.lunit;
      }

      // Propagate back to Diabetes inputs
      if ($('age')) $('age').value = currentPatient.age;
      if ($('sex')) $('sex').value = currentPatient.sex;
      if ($('egfr')) $('egfr').value = currentPatient.egfr;
      if ($('uacr')) $('uacr').value = currentPatient.uacr;
      if ($('ascvd')) $('ascvd').checked = currentPatient.ascvd;
      if ($('smoker')) $('smoker').checked = currentPatient.smoker;
      if ($('preg') && $('preg-htn')) $('preg').checked = $('preg-htn').checked;

      saveActive();
      updatePatientBar();
      notifyUpdated();

      // Recalculate Diabetes if available
      if (typeof window !== 'undefined' && typeof window.plan === 'function') window.plan();
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
      <div class="pt-bar-item"><span class="pt-bar-label">${t('bar_name', 'الاسم:')}</span> <b>${currentPatient.name || t('bar_new_patient', 'مريض جديد')}</b></div>
      <div class="pt-bar-item"><span class="pt-bar-label">${t('bar_age', 'العمر:')}</span> <b>${currentPatient.age} ${ageUnit}</b> (${sexLabel})</div>
      <div class="pt-bar-item"><span class="pt-bar-label">BMI:</span> <b>${bmi || '—'}</b> (${currentPatient.wt} kg)</div>
      <div class="pt-bar-item"><span class="pt-bar-label">eGFR:</span> <b>${currentPatient.egfr}</b></div>
      <div class="pt-bar-item"><span class="pt-bar-label">UACR:</span> <b>${currentPatient.uacr} mg/g</b></div>
      <div class="pt-bar-item"><span class="pt-bar-label">${t('bar_bp', 'الضغط:')}</span> <b>${currentPatient.sbp}/${currentPatient.dbp}</b></div>
    `;
  }

  function applyPatient(pt) {
    currentPatient = Object.assign({}, defaultState, pt);
    if (typeof document !== 'undefined') {
      const $ = id => document.getElementById(id);
      if ($('pname')) $('pname').value = pt.name || '';
      if ($('age')) $('age').value = pt.age;
      if ($('sex')) $('sex').value = pt.sex;
      if ($('wt')) $('wt').value = pt.wt;
      if ($('ht')) $('ht').value = pt.ht;
      if ($('dur')) $('dur').value = pt.dur;
      if ($('hf')) $('hf').value = pt.hf;
      if ($('a1c')) $('a1c').value = pt.a1c;
      if ($('fpg')) $('fpg').value = pt.fpg;
      if ($('egfr')) $('egfr').value = pt.egfr;
      if ($('uacr')) $('uacr').value = pt.uacr;
      if ($('ascvd')) $('ascvd').checked = !!pt.ascvd;
      if ($('smoker')) $('smoker').checked = !!pt.smoker;

      if ($('sbp')) $('sbp').value = pt.sbp || 148;
      if ($('dbp')) $('dbp').value = pt.dbp || 94;
      if ($('htn-age')) $('htn-age').value = pt.age;
      if ($('htn-sex')) $('htn-sex').value = pt.sex;
      if ($('htn-egfr')) $('htn-egfr').value = pt.egfr;
      if ($('htn-uacr')) $('htn-uacr').value = pt.uacr;
      if ($('k')) $('k').value = pt.k || 4.6;
      if ($('cad')) $('cad').checked = !!pt.ascvd;
      if ($('smk')) $('smk').checked = !!pt.smoker;
      if ($('statin')) $('statin').checked = !!pt.statin;
      if ($('tc') && pt.tc) $('tc').value = pt.tc;
      if ($('hdl') && pt.hdl) $('hdl').value = pt.hdl;
      if ($('lunit') && pt.lunit) $('lunit').value = pt.lunit;
    }

    saveActive();
    updatePatientBar();
    notifyUpdated();

    if (typeof window !== 'undefined') {
      if (typeof window.plan === 'function') window.plan();
      if (typeof window.htnRender === 'function') window.htnRender();
      if (typeof window.htnRenderTitrate === 'function') window.htnRenderTitrate();
    }
  }

  function setEGFR(val) {
    const num = Math.round(parseFloat(val) || 0);
    currentPatient.egfr = num;
    if (typeof document !== 'undefined') {
      const $ = id => document.getElementById(id);
      if ($('egfr')) $('egfr').value = num;
      if ($('htn-egfr')) $('htn-egfr').value = num;
    }
    saveActive();
    updatePatientBar();
    notifyUpdated();

    if (typeof window !== 'undefined') {
      if (typeof window.plan === 'function') window.plan();
      if (typeof window.htnRender === 'function') window.htnRender();
      if (typeof window.htnRenderTitrate === 'function') window.htnRenderTitrate();
    }
    return num;
  }

  function setField(field, value) {
    currentPatient[field] = value;
    saveActive();
    updatePatientBar();
    notifyUpdated();
  }

  return {
    defaultState,
    DRUG_CLASSES,
    calculateCkdEpi2021,
    evaluateSafetyGuardrails,
    notifyUpdated,
    setField,
    get: () => currentPatient,
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PatientSync;
}
