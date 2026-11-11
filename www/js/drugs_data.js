// ==============================================================
// Clinical Knowledge Base & Bilingual Formulary (Saudi & Regional)
// Osrawy Clinical Navigator - Comprehensive Primary Care Formulary
// ==============================================================

(function (global) {
  const FORMULARY_DATA = [
    // Diabetes Mellitus (DM)
    {
      id: 'metformin',
      category: 'dm',
      classEn: 'Biguanide',
      classAr: 'بيجوانيد',
      genericEn: 'Metformin',
      genericAr: 'ميتفورمين',
      tradeNamesEn: ['Glucophage', 'Glucophage XR', 'Formit', 'Diaphage'],
      tradeNamesAr: ['جلوكوفاج', 'فورميت', 'ديافاج'],
      strengths: ['500 mg', '850 mg', '1000 mg'],
      doseEn: '500–1000 mg PO BID with meals (or XR 500–2000 mg once daily)',
      doseAr: '٥٠٠-١٠٠٠ ملغ مرتين يومياً مع الوجبات (أو الممتد المفعول مرة يومياً)',
      renal: {
        stopBelowEgfr: 30,
        cautionBelowEgfr: 45,
        ruleEn: 'eGFR <30: Contraindicated. eGFR 30–44: Max 1000 mg/day; do not initiate.',
        ruleAr: 'يُمنع عند eGFR <30. وعند 30–44 الحد الأقصى ١٠٠٠ ملغ يومياً.'
      }
    },
    {
      id: 'empagliflozin',
      category: 'dm',
      classEn: 'SGLT2 Inhibitor',
      classAr: 'مثبط SGLT2',
      genericEn: 'Empagliflozin',
      genericAr: 'إمباغليفلوزين',
      tradeNamesEn: ['Jardiance', 'Synjardy (with Metformin)'],
      tradeNamesAr: ['جاردينس', 'سينجاردي'],
      strengths: ['10 mg', '25 mg'],
      doseEn: '10–25 mg PO once daily in the morning',
      doseAr: '١٠-٢٥ ملغ فموياً مرة واحدة صباحاً',
      renal: {
        stopBelowEgfr: 20,
        cautionBelowEgfr: 45,
        ruleEn: 'Safe down to eGFR ≥20 for CKD/HF protection; less glucose lowering if eGFR <45.',
        ruleAr: 'آمن حتى eGFR ≥20 لحماية القلب والكلى؛ يقل مفعول خفض السكر تحت 45.'
      }
    },
    {
      id: 'dapagliflozin',
      category: 'dm',
      classEn: 'SGLT2 Inhibitor',
      classAr: 'مثبط SGLT2',
      genericEn: 'Dapagliflozin',
      genericAr: 'داباغليفلوزين',
      tradeNamesEn: ['Forxiga', 'Xigduo XR (with Metformin)'],
      tradeNamesAr: ['فورسيجا', 'زيجدو'],
      strengths: ['5 mg', '10 mg'],
      doseEn: '10 mg PO once daily',
      doseAr: '١٠ ملغ فموياً مرة واحدة يومياً',
      renal: {
        stopBelowEgfr: 25,
        cautionBelowEgfr: 45,
        ruleEn: 'Initiate down to eGFR ≥25 for CKD/HF protection.',
        ruleAr: 'يُستخدم حتى eGFR ≥25 لحماية الكلى والقلب.'
      }
    },
    {
      id: 'semaglutide',
      category: 'dm',
      classEn: 'GLP-1 Receptor Agonist',
      classAr: 'ناهض مستقبلات GLP-1',
      genericEn: 'Semaglutide',
      genericAr: 'سيماغلوتايد',
      tradeNamesEn: ['Ozempic', 'Rybelsus (Oral)', 'Wegovy'],
      tradeNamesAr: ['أوزمبيك', 'ريبلسس', 'ويغوفي'],
      strengths: ['0.25 mg', '0.5 mg', '1 mg', '2 mg'],
      doseEn: '0.25 mg SC weekly x4 wks, then 0.5–1 mg weekly',
      doseAr: '٠.٢٥ ملغ تحت الجلد أسبوعياً لمدة ٤ أسابيع ثم ترفع إلى ٠.٥-١ ملغ',
      renal: {
        stopBelowEgfr: 0,
        cautionBelowEgfr: 15,
        ruleEn: 'No renal dose adjustment required; monitor hydration if GI side effects occur.',
        ruleAr: 'لا يحتاج لتعديل الجرعة كلوياً؛ راقب الجفاف في حال حدوث قيء.'
      }
    },
    {
      id: 'tirzepatide',
      category: 'dm',
      classEn: 'Dual GIP/GLP-1 Agonist',
      classAr: 'ناهض مزدوج GIP/GLP-1',
      genericEn: 'Tirzepatide',
      genericAr: 'تيرزيباتايد',
      tradeNamesEn: ['Mounjaro', 'Zepbound'],
      tradeNamesAr: ['مونجارو'],
      strengths: ['2.5 mg', '5 mg', '7.5 mg', '10 mg', '12.5 mg', '15 mg'],
      doseEn: 'Start 2.5 mg SC weekly x4 wks; increase by 2.5 mg every 4 wks',
      doseAr: '٢.٥ ملغ تحت الجلد أسبوعياً لمدة ٤ أسابيع ثم ترفع تدريجياً',
      renal: {
        stopBelowEgfr: 0,
        cautionBelowEgfr: 15,
        ruleEn: 'No renal dose adjustment required across CKD stages.',
        ruleAr: 'لا يتطلب تعديل الجرعة في القصور الكلوي.'
      }
    },
    {
      id: 'sitagliptin',
      category: 'dm',
      classEn: 'DPP-4 Inhibitor',
      classAr: 'مثبط DPP-4',
      genericEn: 'Sitagliptin',
      genericAr: 'سيتاغليبتين',
      tradeNamesEn: ['Januvia', 'Janumet (with Metformin)', 'Sitavia'],
      tradeNamesAr: ['جانوفيا', 'جانوميت'],
      strengths: ['25 mg', '50 mg', '100 mg'],
      doseEn: '100 mg PO once daily (adjust for eGFR)',
      doseAr: '١٠٠ ملغ مرة يومياً (تعدل حسب وظائف الكلى)',
      renal: {
        stopBelowEgfr: 0,
        cautionBelowEgfr: 45,
        ruleEn: 'eGFR 30–44: 50 mg once daily. eGFR <30: 25 mg once daily.',
        ruleAr: 'عند eGFR 30–44: ٥٠ ملغ يومياً. وعند eGFR <30: ٢٥ ملغ يومياً.'
      }
    },

    // Hypertension (HTN)
    {
      id: 'perindopril',
      category: 'htn',
      classEn: 'ACE Inhibitor',
      classAr: 'مثبط الإنزيم المحول للأنجيوتنسين (ACEi)',
      genericEn: 'Perindopril',
      genericAr: 'بيريندوبريل',
      tradeNamesEn: ['Coversyl', 'Coveram (with Amlodipine)', 'Preterax'],
      tradeNamesAr: ['كوفرسيل', 'كوفرام'],
      strengths: ['5 mg', '10 mg'],
      doseEn: '5–10 mg PO once daily',
      doseAr: '٥-١٠ ملغ مرة واحدة يومياً',
      renal: {
        stopBelowEgfr: 0,
        cautionBelowEgfr: 30,
        ruleEn: 'eGFR <30: Start 2.5 mg daily; monitor Cr & K+ within 1–2 weeks.',
        ruleAr: 'عند eGFR <30: ابدأ بجرعة ٢.٥ ملغ وراقب الكرياتينين والبوتاسيوم.'
      }
    },
    {
      id: 'valsartan',
      category: 'htn',
      classEn: 'Angiotensin Receptor Blocker (ARB)',
      classAr: 'حاصر مستقبلات الأنجيوتنسين (ARB)',
      genericEn: 'Valsartan',
      genericAr: 'فالسارتان',
      tradeNamesEn: ['Diovan', 'Co-Diovan (with HCTZ)', 'Exforge (with Amlodipine)'],
      tradeNamesAr: ['ديوفان', 'كو-ديوفان', 'إكسفورج'],
      strengths: ['80 mg', '160 mg', '320 mg'],
      doseEn: '80–320 mg PO once daily',
      doseAr: '٨٠-٣٢٠ ملغ مرة واحدة يومياً',
      renal: {
        stopBelowEgfr: 0,
        cautionBelowEgfr: 30,
        ruleEn: 'Use caution in severe CKD; hold if K+ ≥5.5 mmol/L or pregnancy.',
        ruleAr: 'حذر في القصور الكلوي الشديد؛ أوقفه إذا كان البوتاسيوم ≥5.5 أو في الحمل.'
      }
    },
    {
      id: 'amlodipine',
      category: 'htn',
      classEn: 'Dihydropyridine CCB',
      classAr: 'حاصر قنوات الكالسيوم',
      genericEn: 'Amlodipine',
      genericAr: 'أملوديبين',
      tradeNamesEn: ['Norvasc', 'Amlor', 'Vascopin'],
      tradeNamesAr: ['نورفاسك', 'أملور'],
      strengths: ['5 mg', '10 mg'],
      doseEn: '5–10 mg PO once daily',
      doseAr: '٥-١٠ ملغ مرة واحدة يومياً',
      renal: {
        stopBelowEgfr: 0,
        cautionBelowEgfr: 0,
        ruleEn: 'No renal dose adjustment required; watch for ankle edema at 10 mg.',
        ruleAr: 'لا يتطلب تعديلاً كلوياً؛ قد يسبب تورم الكاحلين بجرعة ١٠ ملغ.'
      }
    },
    {
      id: 'indapamide',
      category: 'htn',
      classEn: 'Thiazide-Like Diuretic',
      classAr: 'مدر بول شبيه الثيازيد',
      genericEn: 'Indapamide',
      genericAr: 'إندابامايد',
      tradeNamesEn: ['Natrilix SR', 'Fludex'],
      tradeNamesAr: ['ناتريليكس'],
      strengths: ['1.5 mg SR', '2.5 mg'],
      doseEn: '1.5 mg SR or 2.5 mg PO once daily in the morning',
      doseAr: '١.٥ ملغ ممتد المفعول مرة واحدة صباحاً',
      renal: {
        stopBelowEgfr: 30,
        cautionBelowEgfr: 45,
        ruleEn: 'Less effective when eGFR <30; switch to a loop diuretic if volume overloaded.',
        ruleAr: 'يفقد فعاليته عند eGFR <30؛ استبدله بمدر عروي (لازكس) عند الاحتقان.'
      }
    },
    {
      id: 'bisoprolol',
      category: 'htn',
      classEn: 'Cardioselective Beta-Blocker',
      classAr: 'حاصر بيتا انتقائي للقلب',
      genericEn: 'Bisoprolol',
      genericAr: 'بيسوبرولول',
      tradeNamesEn: ['Concor', 'BisoCard'],
      tradeNamesAr: ['كونكور', 'بيزوكارد'],
      strengths: ['2.5 mg', '5 mg', '10 mg'],
      doseEn: '2.5–10 mg PO once daily',
      doseAr: '٢.٥-١٠ ملغ مرة واحدة يومياً',
      renal: {
        stopBelowEgfr: 0,
        cautionBelowEgfr: 20,
        ruleEn: 'eGFR <20: Do not exceed 10 mg once daily.',
        ruleAr: 'عند eGFR <20: لا تتجاوز ١٠ ملغ يومياً.'
      }
    },
    {
      id: 'spironolactone',
      category: 'htn',
      classEn: 'Mineralocorticoid Receptor Antagonist (MRA)',
      classAr: 'مضاد الألدوستيرون',
      genericEn: 'Spironolactone',
      genericAr: 'سبيرونولاكتون',
      tradeNamesEn: ['Aldactone', 'Spirotone'],
      tradeNamesAr: ['ألداكتون'],
      strengths: ['25 mg', '50 mg', '100 mg'],
      doseEn: '25–50 mg PO once daily for resistant HTN or HFrEF',
      doseAr: '٢٥-٥٠ ملغ مرة يومياً للضغط المقاوم أو قصور القلب',
      renal: {
        stopBelowEgfr: 30,
        cautionBelowEgfr: 45,
        ruleEn: 'Avoid if eGFR <30 or baseline K+ >5.0 mmol/L.',
        ruleAr: 'يُمنع عند eGFR <30 أو إذا كان البوتاسيوم >5.0.'
      }
    },

    // Dyslipidemia (DLP)
    {
      id: 'atorvastatin',
      category: 'dlp',
      classEn: 'HMG-CoA Reductase Inhibitor (Statin)',
      classAr: 'ستاتين خافض للكوليسترول',
      genericEn: 'Atorvastatin',
      genericAr: 'أتورفاستاتين',
      tradeNamesEn: ['Lipitor', 'Lorvast', 'Ator', 'Tulip'],
      tradeNamesAr: ['ليبيتور', 'لورفاست', 'أتور'],
      strengths: ['10 mg', '20 mg', '40 mg', '80 mg'],
      doseEn: 'High-intensity: 40–80 mg daily | Moderate: 10–20 mg daily',
      doseAr: 'عالي الشدة: ٤٠-٨٠ ملغ يومياً | متوسط الشدة: ١٠-٢٠ ملغ يومياً',
      renal: {
        stopBelowEgfr: 0,
        cautionBelowEgfr: 0,
        ruleEn: 'Preferred statin in severe CKD: no renal dose adjustment needed at any eGFR.',
        ruleAr: 'الستاتين المفضل في القصور الكلوي: لا يحتاج لتعديل الجرعة مهما بلغ eGFR.'
      }
    },
    {
      id: 'rosuvastatin',
      category: 'dlp',
      classEn: 'HMG-CoA Reductase Inhibitor (Statin)',
      classAr: 'ستاتين خافض للكوليسترول',
      genericEn: 'Rosuvastatin',
      genericAr: 'روسوفاستاتين',
      tradeNamesEn: ['Crestor', 'Rosavi', 'Rovista'],
      tradeNamesAr: ['كريستور', 'روزافي'],
      strengths: ['5 mg', '10 mg', '20 mg', '40 mg'],
      doseEn: 'High-intensity: 20–40 mg daily | Moderate: 5–10 mg daily',
      doseAr: 'عالي الشدة: ٢٠-٤٠ ملغ يومياً | متوسط الشدة: ٥-١٠ ملغ يومياً',
      renal: {
        stopBelowEgfr: 0,
        cautionBelowEgfr: 30,
        ruleEn: 'eGFR <30: Start at 5 mg and do not exceed 10 mg once daily.',
        ruleAr: 'عند eGFR <30: ابدأ بجرعة ٥ ملغ ولا تتجاوز ١٠ ملغ يومياً.'
      }
    },
    {
      id: 'ezetimibe',
      category: 'dlp',
      classEn: 'Cholesterol Absorption Inhibitor',
      classAr: 'مثبط امتصاص الكوليسترول',
      genericEn: 'Ezetimibe',
      genericAr: 'إيزيتيميب',
      tradeNamesEn: ['Ezetrol', 'Inegy (with Simvastatin)', 'Rosuzet (with Rosuvastatin)'],
      tradeNamesAr: ['إيزيترول', 'إينيجي', 'روزوزيت'],
      strengths: ['10 mg'],
      doseEn: '10 mg PO once daily',
      doseAr: '١٠ ملغ مرة واحدة يومياً',
      renal: {
        stopBelowEgfr: 0,
        cautionBelowEgfr: 0,
        ruleEn: 'No renal dose adjustment required.',
        ruleAr: 'لا يتطلب تعديلاً للجرعة الكلوية.'
      }
    },
    {
      id: 'fenofibrate',
      category: 'dlp',
      classEn: 'Fibrate (PPAR-α Agonist)',
      classAr: 'فايبرات خافض للدهون الثلاثية',
      genericEn: 'Fenofibrate',
      genericAr: 'فينوفايبرات',
      tradeNamesEn: ['Lipanthyl', 'Lipanthyl Supra'],
      tradeNamesAr: ['ليبانثيل'],
      strengths: ['145 mg', '160 mg', '48 mg'],
      doseEn: '145–160 mg PO once daily (adjust in CKD)',
      doseAr: '١٤٥-١٦٠ ملغ مرة يومياً',
      renal: {
        stopBelowEgfr: 30,
        cautionBelowEgfr: 60,
        ruleEn: 'eGFR <30: Contraindicated. eGFR 30–59: Max 48–54 mg daily.',
        ruleAr: 'يُمنع عند eGFR <30. وعند 30–59 تخفض الجرعة إلى ٤٨-٥٤ ملغ.'
      }
    },

    // Primary Care Expansion: Asthma/COPD & Thyroid
    {
      id: 'budesonide_formoterol',
      category: 'resp',
      classEn: 'ICS + Fast-Onset LABA (MART)',
      classAr: 'كورتيزون مستنشق + موسع شعب سريع وطويل المفعول',
      genericEn: 'Budesonide / Formoterol',
      genericAr: 'بيوديسونيد / فورموتيرول',
      tradeNamesEn: ['Symbicort Turbuhaler', 'Pulmoton'],
      tradeNamesAr: ['سيمبيكورت', 'بلموتون'],
      strengths: ['160/4.5 mcg', '320/9 mcg'],
      doseEn: 'GINA Track 1: 160/4.5 mcg 1–2 puffs BD + 1 puff PRN reliever',
      doseAr: 'مسار GINA ١: بخة إلى بختين مرتين يومياً + بخة عند اللزوم',
      renal: {
        stopBelowEgfr: 0,
        cautionBelowEgfr: 0,
        ruleEn: 'No renal adjustment; rinse mouth after maintenance puffs.',
        ruleAr: 'لا يحتاج لتعديل كلوي؛ يجب المضمضة بالماء بعد الاستخدام.'
      }
    },
    {
      id: 'levothyroxine',
      category: 'thyroid',
      classEn: 'Thyroid Hormone Replacement',
      classAr: 'هرمون الغدة الدرقية التعويضي',
      genericEn: 'Levothyroxine',
      genericAr: 'ليفوثيروكسين',
      tradeNamesEn: ['Euthyrox', 'Eltroxin', 'Thyroxin'],
      tradeNamesAr: ['إيوثيروكس', 'إلتروكسين'],
      strengths: ['25 mcg', '50 mcg', '75 mcg', '100 mcg', '125 mcg', '150 mcg'],
      doseEn: '1.6 mcg/kg/day PO 30–60 min before breakfast (start 25–50 mcg in ASCVD/elderly)',
      doseAr: '١.٦ مكغ/كغ صباحاً على الريق (ابدأ بـ ٢٥-٥٠ مكغ لمرضى القلب وكبار السن)',
      renal: {
        stopBelowEgfr: 0,
        cautionBelowEgfr: 0,
        ruleEn: 'No renal adjustment; separate by 4 hours from calcium and iron.',
        ruleAr: 'افصل الجرعة ٤ ساعات عن حبوب الكالسيوم والحديد.'
      }
    }
  ];

  // Expose on global
  global.OsrawyFormularyData = FORMULARY_DATA;
  global.FORMULARY_DATA = FORMULARY_DATA;

  // Compatibility mapping for legacy DRUG_DATABASE lookups
  const DRUG_DATABASE = {};
  FORMULARY_DATA.forEach(d => {
    DRUG_DATABASE[d.id] = {
      id: d.id,
      category: d.category,
      cls: d.classEn,
      name: d.genericEn,
      ar: [d.genericAr, ...(d.tradeNamesAr || [])],
      saudi: {
        brands: d.tradeNamesEn || [d.genericEn],
        orig: 0,
        tier: 1,
        tierDesc: '● Formulary',
        priceEst: ''
      },
      egypt: {
        brands: d.tradeNamesEn || [d.genericEn],
        orig: 0,
        tier: 1,
        tierDesc: '● Formulary',
        priceEst: ''
      },
      dose: d.doseEn,
      renal: (egfr) => {
        if (d.renal && d.renal.stopBelowEgfr && egfr < d.renal.stopBelowEgfr) {
          return d.renal.ruleEn;
        }
        if (d.renal && d.renal.cautionBelowEgfr && egfr < d.renal.cautionBelowEgfr) {
          return d.renal.ruleEn;
        }
        return d.renal ? d.renal.ruleEn : 'No adjustment';
      },
      caut: d.renal ? d.renal.ruleEn : ''
    };
  });
  DRUG_DATABASE['met'] = DRUG_DATABASE['metformin'];
  DRUG_DATABASE['empa'] = DRUG_DATABASE['empagliflozin'];
  DRUG_DATABASE['dapa'] = DRUG_DATABASE['dapagliflozin'];
  DRUG_DATABASE['sema'] = DRUG_DATABASE['semaglutide'];
  DRUG_DATABASE['tirz'] = DRUG_DATABASE['tirzepatide'];
  DRUG_DATABASE['sita'] = DRUG_DATABASE['sitagliptin'];
  DRUG_DATABASE['atorva'] = DRUG_DATABASE['atorvastatin'];
  DRUG_DATABASE['rosuva'] = DRUG_DATABASE['rosuvastatin'];

  global.DRUG_DATABASE = DRUG_DATABASE;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      FORMULARY_DATA,
      OsrawyFormularyData: FORMULARY_DATA,
      DRUG_DATABASE
    };
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
