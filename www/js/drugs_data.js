// ==============================================================
// Clinical Knowledge Base & Formulary (Saudi Arabia SFDA & Egypt)
// ==============================================================

const DRUG_DATABASE = {
  // --- DIABETES ---
  met: {
    id: "met", category: "diabetes", cls: "Biguanide", name: "Metformin",
    ar: ["ميتفورمين", "جلوكوفاج", "ديلون", "فورميت", "ميتفور", "سيدوفاج"],
    saudi: {
      brands: ["Dialon (SPIMACO)", "Glucophage / XR", "Formit", "Metfor"],
      orig: 1, tier: 1, tierDesc: "● Low cost (< 30 SAR)",
      priceEst: "14 – 28 SAR / mo"
    },
    egypt: {
      brands: ["Cidophage", "Glucophage / XR", "Metfor"],
      orig: 1, tier: 1, tierDesc: "● Low cost (< 50 EGP)",
      priceEst: "20 – 60 EGP / mo"
    },
    dose: "500 mg once–twice daily with meals; +500 mg weekly → 2000 mg/day (XR max 2000 mg)",
    renal: e => e < 30 ? "Contraindicated (eGFR <30)" : e < 45 ? "eGFR 30–44: max 1000 mg/day; do not start new" : "No adjustment",
    caut: "GI upset (use XR), B12 deficiency; hold for contrast if eGFR <60 or acute illness / dehydration",
    rx: (p, b) => p.egfr < 45 ? {
      b: `${b} 500 mg tab`, s: "1 tab twice daily after meals (max 1000 mg/day)",
      a: "قرص بعد الفطار وقرص بعد العشاء مع الأكل (الحد الأقصى قرصين يومياً)"
    } : {
      b: `${b} 500 mg tab`, s: "1 tab twice daily after meals; after 2 weeks 1000 mg twice daily",
      a: "قرص بعد الفطار وقرص بعد العشاء، وبعد أسبوعين تزاد الجرعة حسب تعليمات الطبيب"
    }
  },

  gliclazide: {
    id: "gliclazide", category: "diabetes", cls: "Sulfonylurea", name: "Gliclazide MR",
    ar: ["جليكلازيد", "دايامكرون", "ديامكرون", "جليزيد"],
    saudi: {
      brands: ["Diamicron MR 30 / 60", "Glizid MR", "Gliclazide SPIMACO"],
      orig: 0, tier: 1, tierDesc: "● Low cost (30 – 50 SAR)",
      priceEst: "32 – 48 SAR / mo"
    },
    egypt: {
      brands: ["Diamicron MR 30 / 60", "Gliclazide local generics"],
      orig: 0, tier: 1, tierDesc: "● Low cost (< 70 EGP)",
      priceEst: "40 – 80 EGP / mo"
    },
    dose: "30 mg with breakfast → max 120 mg/day",
    renal: e => e < 30 ? "Avoid (eGFR <30)" : "Lowest dose; watch hypoglycemia",
    caut: "Hypoglycemia, weight gain. Lowest hypo risk among SUs. Reduce/stop when adding insulin",
    rx: (p, b) => ({
      b: `${b} 30 mg tab`, s: "1 tab once daily with breakfast",
      a: "قرص واحد مع وجبة الإفطار — تجنب تفويت الوجبات"
    })
  },

  glimepiride: {
    id: "glimepiride", category: "diabetes", cls: "Sulfonylurea", name: "Glimepiride",
    ar: ["جليمبيريد", "اماريل", "أماريل", "جليماكس", "دولسيل", "جليمريل"],
    saudi: {
      brands: ["Amaryl", "Glemax", "Glipid", "Glimepiride Tab"],
      orig: 0, tier: 1, tierDesc: "● Low cost (25 – 45 SAR)",
      priceEst: "24 – 42 SAR / mo"
    },
    egypt: {
      brands: ["Dolcyl", "Glimaryl", "Amaryl"],
      orig: 2, tier: 1, tierDesc: "● Low cost (< 60 EGP)",
      priceEst: "25 – 65 EGP / mo"
    },
    dose: "1 mg with breakfast → 4 mg (max 8 mg)",
    renal: e => e < 30 ? "Avoid (eGFR <30)" : "Start 1 mg",
    caut: "Hypoglycemia (especially in elderly / renal impairment), weight gain",
    rx: (p, b) => ({
      b: `${b} 1 mg tab`, s: "1 tab once daily before breakfast",
      a: "قرص قبل الفطار — لا تفوت الوجبة"
    })
  },

  pio: {
    id: "pio", category: "diabetes", cls: "Thiazolidinedione", name: "Pioglitazone",
    ar: ["بيوجليتازون", "اكتوس", "أكتوس", "جليتيسول"],
    saudi: {
      brands: ["Actos", "Pioglit", "Glitisol"],
      orig: 0, tier: 1, tierDesc: "● Low-to-Moderate (40 – 65 SAR)",
      priceEst: "45 – 65 SAR / mo"
    },
    egypt: {
      brands: ["Pioglitazone local generics", "Actos"],
      orig: 1, tier: 1, tierDesc: "● Low cost (< 80 EGP)",
      priceEst: "45 – 90 EGP / mo"
    },
    dose: "15 mg daily → 30 mg (max 45 mg)",
    renal: () => "No adjustment needed",
    caut: "Contraindicated in Heart Failure (NYHA I-IV). Watch edema, weight gain, fracture risk. Proven benefit in MASLD/fatty liver.",
    rx: (p, b) => ({
      b: `${b} 15 mg tab`, s: "1 tab once daily",
      a: "قرص مرة واحدة يومياً مع أو بدون أكل"
    })
  },

  dapa: {
    id: "dapa", category: "diabetes", cls: "SGLT2 inhibitor", name: "Dapagliflozin",
    ar: ["داباجليفلوزين", "فورسيجا", "فوركسيجا", "زيجدو", "داباجلوزنال"],
    saudi: {
      brands: ["Forxiga (AstraZeneca)", "Dapagliflozin generics", "Xigduo XR (combo)"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (150 – 190 SAR)",
      priceEst: "155 – 185 SAR / mo"
    },
    egypt: {
      brands: ["Dapagloznal", "Dapaglif", "Dapagliflozin-EVA", "Forflozin", "Forxiga"],
      orig: 4, tier: 2, tierDesc: "●● Moderate (300 – 450 EGP)",
      priceEst: "320 – 450 EGP / mo"
    },
    dose: "10 mg once daily in the morning",
    renal: e => e < 25 ? "Do not initiate (eGFR <25); continue for organ protection until dialysis" : e < 45 ? "Start for CV & CKD protection (glycemic effect reduced)" : "No adjustment",
    caut: "Genital mycotic infections, dehydration/hypotension, euglycemic DKA. Hold 3 days before major surgery, severe illness, or prolonged fasting (Ramadan).",
    rx: (p, b) => ({
      b: `${b} 10 mg tab`, s: "1 tab once daily in the morning with a full glass of water",
      a: "قرص صباحاً مع شرب كميات كافية من الماء يومياً والاهتمام بالنظافة الشخصية"
    })
  },

  empa: {
    id: "empa", category: "diabetes", cls: "SGLT2 inhibitor", name: "Empagliflozin",
    ar: ["امباجليفلوزين", "إمباجليفلوزين", "جارديانس", "سينجاردي"],
    saudi: {
      brands: ["Jardiance (Boehringer)", "Synjardy (combo with Metformin)"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (150 – 195 SAR)",
      priceEst: "160 – 195 SAR / mo"
    },
    egypt: {
      brands: ["Jardiance", "Empagliflozin local generics"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (350 – 550 EGP)",
      priceEst: "380 – 580 EGP / mo"
    },
    dose: "10 mg once daily → 25 mg for additional glycemia",
    renal: e => e < 20 ? "Do not initiate (eGFR <20); continue until dialysis" : e < 45 ? "10 mg for CV/kidney protection" : "No adjustment",
    caut: "Genital infections, dehydration, DKA risk. Hold during acute illness/fasting.",
    rx: (p, b) => ({
      b: `${b} 10 mg tab`, s: "1 tab once daily in the morning",
      a: "قرص صباحاً — حافظ على شرب الماء بانتظام"
    })
  },

  sita: {
    id: "sita", category: "diabetes", cls: "DPP-4 inhibitor", name: "Sitagliptin",
    ar: ["سيتاجليبتين", "جانوفيا", "جانوميت"],
    saudi: {
      brands: ["Januvia (MSD)", "Janumet (combo)", "Sitagliptin generic"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (110 – 145 SAR)",
      priceEst: "115 – 145 SAR / mo"
    },
    egypt: {
      brands: ["Januvia", "Sitagliptin local generics"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (250 – 400 EGP)",
      priceEst: "280 – 420 EGP / mo"
    },
    dose: "100 mg once daily",
    renal: e => e < 30 ? "25 mg once daily (eGFR <30)" : e < 45 ? "50 mg once daily (eGFR 30–44)" : "100 mg once daily",
    caut: "Weight-neutral, minimal hypo risk. Rare pancreatitis. Do not combine with GLP-1 RA.",
    rx: (p, b) => {
      const doseMg = p.egfr < 30 ? 25 : p.egfr < 45 ? 50 : 100;
      return {
        b: `${b} ${doseMg} mg tab`, s: "1 tab once daily",
        a: "قرص مرة واحدة يومياً مع أو بدون طعام"
      };
    }
  },

  vilda: {
    id: "vilda", category: "diabetes", cls: "DPP-4 inhibitor", name: "Vildagliptin",
    ar: ["فيلداجليبتين", "جالفوس", "جالفوميت", "جليبتوس"],
    saudi: {
      brands: ["Galvus (Novartis)", "Galvumet (combo)"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (95 – 130 SAR)",
      priceEst: "95 – 130 SAR / mo"
    },
    egypt: {
      brands: ["Gliptus", "Veldaglose", "Galvus"],
      orig: 2, tier: 2, tierDesc: "●● Moderate (200 – 320 EGP)",
      priceEst: "220 – 350 EGP / mo"
    },
    dose: "50 mg twice daily (once daily if combined with SU)",
    renal: e => e < 50 ? "50 mg once daily (eGFR <50)" : "50 mg twice daily",
    caut: "Monitor ALT/AST; avoid in severe liver impairment. Weight neutral.",
    rx: (p, b) => p.egfr < 50 ? {
      b: `${b} 50 mg tab`, s: "1 tab once daily", a: "قرص مرة واحدة يومياً"
    } : {
      b: `${b} 50 mg tab`, s: "1 tab twice daily", a: "قرص صباحاً وقرص مساءً"
    }
  },

  lina: {
    id: "lina", category: "diabetes", cls: "DPP-4 inhibitor", name: "Linagliptin",
    ar: ["ليناجليبتين", "تراجينتا", "جينتادويتو"],
    saudi: {
      brands: ["Trajenta (Boehringer)", "Jentadueto (combo)"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (125 – 155 SAR)",
      priceEst: "128 – 155 SAR / mo"
    },
    egypt: {
      brands: ["Trajenta"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (350 – 480 EGP)",
      priceEst: "360 – 480 EGP / mo"
    },
    dose: "5 mg once daily",
    renal: () => "No renal adjustment at ANY eGFR (safest DPP-4i in CKD/dialysis)",
    caut: "Well tolerated. Do not combine with GLP-1 RA.",
    rx: (p, b) => ({
      b: `${b} 5 mg tab`, s: "1 tab once daily", a: "قرص مرة واحدة يومياً (آمن للكلى)"
    })
  },

  sema: {
    id: "sema", category: "diabetes", cls: "GLP-1 RA", name: "Semaglutide (SC Weekly)",
    ar: ["سيماجلوتيد", "اوزمبيك", "أوزمبيك"],
    saudi: {
      brands: ["Ozempic 0.25 / 0.5 / 1 mg Pen (Novo Nordisk)"],
      orig: 0, tier: 3, tierDesc: "●●● High cost (380 – 450 SAR)",
      priceEst: "380 – 440 SAR / mo"
    },
    egypt: {
      brands: ["Ozempic"],
      orig: 0, tier: 3, tierDesc: "●●● High cost (3,500 – 4,800 EGP)",
      priceEst: "3,800 – 4,800 EGP / mo"
    },
    dose: "0.25 mg weekly × 4 wk → 0.5 mg weekly → 1 mg (step up ≥4 wk)",
    renal: () => "No renal dose adjustment needed (proven CKD benefit - FLOW trial)",
    caut: "Nausea, vomiting, gallstones. Retinopathy progression with very rapid A1c drop. Contraindicated in MTC, MEN2, acute pancreatitis.",
    rx: () => ({
      b: "Ozempic 0.25 mg prefilled pen",
      s: "0.25 mg subcutaneous once weekly for 4 weeks, then increase to 0.5 mg weekly",
      a: "حقنة تحت الجلد مرة واحدة أسبوعياً في نفس اليوم من كل أسبوع"
    })
  },

  osema: {
    id: "osema", category: "diabetes", cls: "GLP-1 RA", name: "Semaglutide (Oral Daily)",
    ar: ["سيماجلوتيد", "ريبيلسوس", "ريبلسوس"],
    saudi: {
      brands: ["Rybelsus 3 / 7 / 14 mg (Novo Nordisk)"],
      orig: 0, tier: 3, tierDesc: "●●● High cost (380 – 460 SAR)",
      priceEst: "390 – 450 SAR / mo"
    },
    egypt: {
      brands: ["Rybelsus 3 / 7 / 14 mg"],
      orig: 0, tier: 3, tierDesc: "●●● High cost (3,500 – 4,500 EGP)",
      priceEst: "3,700 – 4,600 EGP / mo"
    },
    dose: "3 mg daily × 30 days → 7 mg daily → 14 mg daily; take on empty stomach",
    renal: () => "No renal adjustment needed",
    caut: "Must take upon waking with max 120 mL plain water; wait at least 30 min before food/drinks/other meds.",
    rx: () => ({
      b: "Rybelsus 3 mg tab",
      s: "1 tab daily in morning on empty stomach with plain water × 30 days, then 7 mg daily",
      a: "قرص صباحاً على الريق بنصف كوب ماء فقط، والانتظار 30 دقيقة على الأقل قبل الأكل أو الشرب"
    })
  },

  tirz: {
    id: "tirz", category: "diabetes", cls: "Dual GIP/GLP-1 RA", name: "Tirzepatide",
    ar: ["تيرزيباتيد", "مونجارو", "مانجارو"],
    saudi: {
      brands: ["Mounjaro 2.5 / 5 / 7.5 / 10 / 12.5 / 15 mg (Eli Lilly)"],
      orig: 0, tier: 3, tierDesc: "●●● High cost (580 – 850 SAR)",
      priceEst: "590 – 850 SAR / mo"
    },
    egypt: {
      brands: ["Mounjaro (imported / private formulary)"],
      orig: 0, tier: 3, tierDesc: "●●● High cost (6,000 – 9,000 EGP)",
      priceEst: "6,500 – 9,000 EGP / mo"
    },
    dose: "2.5 mg weekly × 4 wk → +2.5 mg every 4 wk → maintenance 5–15 mg weekly",
    renal: () => "No renal adjustment needed",
    caut: "Potent A1c and weight reduction (SURPASS/SURMOUNT). Same GI precautions and MTC/MEN2 contraindications as GLP-1 RAs.",
    rx: () => ({
      b: "Mounjaro 2.5 mg KwikPen / Auto-injector",
      s: "2.5 mg SC once weekly × 4 weeks, then step up to 5 mg weekly",
      a: "حقنة تحت الجلد مرة أسبوعياً في نفس اليوم المحدد"
    })
  },

  dula: {
    id: "dula", category: "diabetes", cls: "GLP-1 RA", name: "Dulaglutide",
    ar: ["دولاجلوتيد", "تروليسيتي"],
    saudi: {
      brands: ["Trulicity 0.75 / 1.5 / 3 / 4.5 mg (Eli Lilly)"],
      orig: 0, tier: 3, tierDesc: "●●● High cost (380 – 440 SAR)",
      priceEst: "385 – 430 SAR / mo"
    },
    egypt: {
      brands: ["Trulicity"],
      orig: 0, tier: 3, tierDesc: "●●● High cost (3,200 – 4,200 EGP)",
      priceEst: "3,300 – 4,200 EGP / mo"
    },
    dose: "0.75 mg weekly → 1.5 mg weekly → 3 → 4.5 mg",
    renal: () => "No adjustment needed",
    caut: "Proven CV reduction (REWIND). Pre-attached single-dose auto-injector pen.",
    rx: () => ({
      b: "Trulicity 0.75 mg pen",
      s: "0.75 mg SC once weekly",
      a: "حقنة تحت الجلد مرة واحدة أسبوعياً"
    })
  },

  lira: {
    id: "lira", category: "diabetes", cls: "GLP-1 RA", name: "Liraglutide",
    ar: ["ليراجلوتيد", "فيكتوزا", "ساكسندا"],
    saudi: {
      brands: ["Victoza (Novo Nordisk)", "Saxenda (weight)"],
      orig: 0, tier: 3, tierDesc: "●●● High cost (360 – 420 SAR)",
      priceEst: "360 – 420 SAR / mo"
    },
    egypt: {
      brands: ["Victoza"],
      orig: 0, tier: 3, tierDesc: "●●● High cost (3,200 – 4,000 EGP)",
      priceEst: "3,200 – 4,000 EGP / mo"
    },
    dose: "0.6 mg daily × 1 wk → 1.2 mg → 1.8 mg",
    renal: () => "No renal dose adjustment needed",
    caut: "GLP-1 RA class; CV benefit (LEADER). Daily subcutaneous injection.",
    rx: () => ({
      b: "Victoza 6 mg/mL pen",
      s: "0.6 mg SC daily × 1 week, then 1.2 mg daily",
      a: "حقنة تحت الجلد مرة واحدة يومياً"
    })
  },

  nph: {
    id: "nph", category: "diabetes", cls: "Insulin", name: "NPH human insulin",
    ar: ["انسولين", "إنسولين", "انسولاتارد", "هيومولين"],
    saudi: {
      brands: ["Insulatard (Novo Nordisk)", "Humulin N (Lilly)"],
      orig: 0, tier: 1, tierDesc: "● Low cost (40 – 65 SAR)",
      priceEst: "42 – 65 SAR / mo"
    },
    egypt: {
      brands: ["Insulatard", "Humulin N"],
      orig: 0, tier: 1, tierDesc: "● Low cost (< 150 EGP)",
      priceEst: "90 – 160 EGP / mo"
    },
    dose: "10 U or 0.1–0.2 U/kg at bedtime; see Insulin calculator",
    renal: e => e < 30 ? "Start conservatively (0.1 U/kg)" : "Standard",
    caut: "Nocturnal hypoglycemia more than analogues; inject at bedtime",
    rx: (p, b) => p.curIns ? {
      b: "Basal insulin (current product)",
      s: "Continue current dose; adjust 2 IU every 3 days to fasting 80–130 mg/dL",
      a: "استمر على نفس الجرعة وعدّلها حسب سكر الصائم"
    } : {
      b: `${b} 100 IU/mL pen`,
      s: `${p.basalDose || 10} IU SC at bedtime; +2 IU every 3 days until fasting 80–130 mg/dL; −4 IU if <70`,
      a: `${p.basalDose || 10} وحدة تحت الجلد قبل النوم، وزوّد وحدتين كل 3 أيام حتى يصبح الصائم بين 80 و130`
    }
  },

  glarg: {
    id: "glarg", category: "diabetes", cls: "Insulin", name: "Basal Insulin Analogue",
    ar: ["لانتوس", "توجيو", "تريسيبا", "ديجلوديك", "جلارجين"],
    saudi: {
      brands: ["Lantus SoloStar (Sanofi)", "Toujeo (Glargine 300 U/mL)", "Tresiba (Degludec)"],
      orig: 0, tier: 3, tierDesc: "●●● High cost (180 – 260 SAR)",
      priceEst: "180 – 260 SAR / mo"
    },
    egypt: {
      brands: ["Lantus", "Toujeo", "Tresiba"],
      orig: 0, tier: 3, tierDesc: "●●● High cost (800 – 1,400 EGP)",
      priceEst: "850 – 1,400 EGP / mo"
    },
    dose: "10 U or 0.1–0.2 U/kg once daily at the same time",
    renal: e => e < 30 ? "Start conservatively (0.1 U/kg) - reduced insulin clearance" : "Standard titration",
    caut: "Hypoglycemia risk lower than NPH. Titrate every 3 days by fasting glucose.",
    rx: (p, b) => ({
      b: `${b} 100 IU/mL SoloStar pen`,
      s: `${p.basalDose || 10} IU SC once daily at the same time each day; +2 IU every 3 days until fasting 80–130 mg/dL`,
      a: `${p.basalDose || 10} وحدة تحت الجلد يومياً في نفس الموعد؛ وتزاد وحدتين كل 3 أيام حتى يصبح سكر الصائم بين 80 و130`
    })
  },

  atorva: {
    id: "atorva", category: "diabetes", cls: "Statin", name: "Atorvastatin",
    ar: ["اتورفاستاتين", "أتورفاستاتين", "ليبيتور", "اتورفا", "ستورفاس"],
    saudi: {
      brands: ["Atorva (SPIMACO)", "Lipitor (Viatris/Pfizer)", "Storvas", "Lorvast"],
      orig: 1, tier: 1, tierDesc: "● Low cost (30 – 75 SAR)",
      priceEst: "32 – 75 SAR / mo"
    },
    egypt: {
      brands: ["Ator", "Lipitor", "Lipona"],
      orig: 1, tier: 1, tierDesc: "● Low cost (< 120 EGP)",
      priceEst: "40 – 110 EGP / mo"
    },
    dose: "20 mg (moderate) or 40–80 mg (high intensity) at bedtime",
    renal: () => "No renal adjustment needed",
    caut: "Baseline liver function, muscle symptoms/myopathy. Goal LDL <70 mg/dL in DM, <55 mg/dL if established ASCVD.",
    rx: (p, b) => ({
      b: `${b} ${p.ascvd ? 40 : 20} mg tab`,
      s: "1 tab once daily at bedtime",
      a: "قرص واحد مساءً قبل النوم"
    })
  },

  // --- HYPERTENSION MEDICATIONS & SPCs (Saudi & Egyptian Formularies) ---
  amlodipine: {
    id: "amlodipine", category: "htn", cls: "DHP CCB", name: "Amlodipine",
    ar: ["املوديبين", "أملوديبين", "نورفاسك", "املور", "لوراك"],
    saudi: {
      brands: ["Norvasc (Pfizer)", "Amlor", "Lowrac (SPIMACO)"],
      orig: 0, tier: 1, tierDesc: "● Low cost (25 – 45 SAR)",
      priceEst: "28 – 45 SAR / mo"
    },
    egypt: {
      brands: ["Norvasc", "Amlodipine generics", "Vasonorm"],
      orig: 0, tier: 1, tierDesc: "● Low cost (< 60 EGP)",
      priceEst: "30 – 60 EGP / mo"
    },
    dose: "2.5 – 10 mg once daily",
    renal: () => "No adjustment needed",
    caut: "Peripheral ankle edema (dose-dependent, not fluid overload), flushing. Adding ACEi/ARB reduces edema.",
    rx: (p, b) => ({ b: `${b} 5 mg tab`, s: "1 tab once daily", a: "قرص مرة واحدة يومياً صباحاً" })
  },

  valsartan: {
    id: "valsartan", category: "htn", cls: "ARB", name: "Valsartan",
    ar: ["فالسارتان", "ديوفان", "تاريج"],
    saudi: {
      brands: ["Diovan (Novartis)", "Tareg (SPIMACO)", "Valsartan generics"],
      orig: 0, tier: 1, tierDesc: "● Low cost (40 – 75 SAR)",
      priceEst: "42 – 75 SAR / mo"
    },
    egypt: {
      brands: ["Diovan", "Tareg", "Valsartan local"],
      orig: 0, tier: 1, tierDesc: "● Low cost (< 120 EGP)",
      priceEst: "60 – 120 EGP / mo"
    },
    dose: "80 – 320 mg once daily",
    renal: () => "Monitor serum Cr and K+ 2–4 wk after start/titration; acceptable Cr rise up to 30%",
    caut: "Teratogenic (contraindicated in pregnancy). Hyperkalemia. Never combine with ACE inhibitor.",
    rx: (p, b) => ({ b: `${b} 80 mg tab`, s: "1 tab once daily", a: "قرص مرة واحدة يومياً" })
  },

  perindopril: {
    id: "perindopril", category: "htn", cls: "ACE inhibitor", name: "Perindopril",
    ar: ["بيريندوبريل", "كوفرسيل", "كوفيرسيل"],
    saudi: {
      brands: ["Coversyl (Servier)", "Perindopril generic"],
      orig: 0, tier: 1, tierDesc: "● Low cost (38 – 65 SAR)",
      priceEst: "40 – 65 SAR / mo"
    },
    egypt: {
      brands: ["Coversyl"],
      orig: 0, tier: 1, tierDesc: "● Low cost (< 130 EGP)",
      priceEst: "70 – 130 EGP / mo"
    },
    dose: "4 – 8 mg once daily (erbumine) or 5 – 10 mg (arginine)",
    renal: e => e < 30 ? "Start 2 mg erbumine / 2.5 mg arginine" : "Standard dose",
    caut: "Dry cough, angioedema risk, hyperkalemia. Teratogenic.",
    rx: (p, b) => ({ b: `${b} 5 mg tab`, s: "1 tab once daily in the morning before food", a: "قرص صباحاً قبل الإفطار" })
  },

  exforge: {
    id: "exforge", category: "htn", cls: "SPC (ARB + CCB)", name: "Amlodipine / Valsartan",
    ar: ["اكسفورج", "إكسفورج", "املوفال"],
    saudi: {
      brands: ["Exforge 5/80, 5/160, 10/160 mg (Novartis)", "Amloval (Generic)"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (85 – 135 SAR)",
      priceEst: "88 – 135 SAR / mo"
    },
    egypt: {
      brands: ["Exforge", "Amlodipine/Valsartan generics"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (250 – 400 EGP)",
      priceEst: "260 – 400 EGP / mo"
    },
    dose: "5/80 mg → 5/160 mg → 10/160 mg once daily",
    renal: () => "First-line preferred single-pill combination for stage 2 HTN",
    caut: "Watch edema at 10 mg CCB dose; check Cr/K+",
    rx: (p, b) => ({ b: `${b} 5/160 mg tab`, s: "1 tab once daily in morning", a: "قرص حبة واحدة يومياً في الصباح" })
  },

  twynsta: {
    id: "twynsta", category: "htn", cls: "SPC (ARB + CCB)", name: "Telmisartan / Amlodipine",
    ar: ["توينستا"],
    saudi: {
      brands: ["Twynsta 40/5, 80/5, 80/10 mg (Boehringer)"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (90 – 140 SAR)",
      priceEst: "92 – 140 SAR / mo"
    },
    egypt: {
      brands: ["Twynsta"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (280 – 420 EGP)",
      priceEst: "290 – 420 EGP / mo"
    },
    dose: "40/5 mg → 80/5 mg → 80/10 mg once daily",
    renal: () => "Telmisartan has long half-life (24h) and PPAR-gamma activity",
    caut: "Cr and K+ monitoring",
    rx: (p, b) => ({ b: `${b} 80/5 mg tab`, s: "1 tab once daily", a: "قرص حبة واحدة يومياً صباحاً" })
  },

  coveram: {
    id: "coveram", category: "htn", cls: "SPC (ACEi + CCB)", name: "Perindopril / Amlodipine",
    ar: ["كوفرام"],
    saudi: {
      brands: ["Coveram 5/5, 10/5, 10/10 mg (Servier)"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (80 – 125 SAR)",
      priceEst: "82 – 125 SAR / mo"
    },
    egypt: {
      brands: ["Coveram 5/5, 10/5 mg"],
      orig: 0, tier: 2, tierDesc: "●● Moderate (240 – 380 EGP)",
      priceEst: "250 – 380 EGP / mo"
    },
    dose: "5/5 mg → 10/5 mg → 10/10 mg once daily",
    renal: () => "First-line SPC supported by ASCOT trial",
    caut: "Cough from ACEi, ankle edema from CCB",
    rx: (p, b) => ({ b: `${b} 5/5 mg tab`, s: "1 tab once daily in morning", a: "قرص حبة واحدة صباحاً" })
  },

  indapamide: {
    id: "indapamide", category: "htn", cls: "Thiazide-like Diuretic", name: "Indapamide SR",
    ar: ["انداباميد", "إنداباميد", "ناتريليكس"],
    saudi: {
      brands: ["Natrilix SR 1.5 mg (Servier)", "Indapamide generics"],
      orig: 0, tier: 1, tierDesc: "● Low cost (18 – 30 SAR)",
      priceEst: "20 – 30 SAR / mo"
    },
    egypt: {
      brands: ["Natrilix SR 1.5 mg"],
      orig: 0, tier: 1, tierDesc: "● Low cost (< 50 EGP)",
      priceEst: "25 – 45 EGP / mo"
    },
    dose: "1.5 mg sustained release once daily in morning",
    renal: e => e < 30 ? "Thiazides lose efficacy when eGFR <30; switch to loop diuretic" : "Standard dose",
    caut: "Hypokalemia, hyponatremia, hyperuricemia (gout). Check electrolytes 2-4 wk after starting.",
    rx: (p, b) => ({ b: `${b} 1.5 mg SR tab`, s: "1 tab once daily in morning", a: "قرص واحد صباحاً" })
  },

  bisoprolol: {
    id: "bisoprolol", category: "htn", cls: "Beta-blocker (B1-selective)", name: "Bisoprolol",
    ar: ["بيسوبرولول", "كونكور", "بيسوكور"],
    saudi: {
      brands: ["Concor (Merck)", "Bisocor", "Bisoprolol SPIMACO"],
      orig: 0, tier: 1, tierDesc: "● Low cost (25 – 50 SAR)",
      priceEst: "25 – 48 SAR / mo"
    },
    egypt: {
      brands: ["Concor 2.5 / 5 / 10 mg", "Bisocard"],
      orig: 0, tier: 1, tierDesc: "● Low cost (< 80 EGP)",
      priceEst: "35 – 75 EGP / mo"
    },
    dose: "2.5 – 10 mg once daily",
    renal: () => "Compelling indication in CAD, post-MI, HFrEF, or heart rate control in AF",
    caut: "Bradycardia (target resting HR 55-65 in angina), fatigue, avoid in severe asthma/AV block",
    rx: (p, b) => ({ b: `${b} 5 mg tab`, s: "1 tab once daily in morning", a: "قرص حبة واحدة صباحاً" })
  },

  losartan: {
    id: "losartan", category: "htn", cls: "ARB", name: "Losartan",
    ar: ["لوسارتان", "كوزار", "سورتيفا"],
    saudi: {
      brands: ["Cozaar (Organon)", "Losartan SPIMACO", "Sortiva"],
      orig: 0, tier: 1, tierDesc: "● Low cost (25 – 45 SAR)",
      priceEst: "28 – 45 SAR / mo"
    },
    egypt: {
      brands: ["Cozaar", "Amoclan", "Losartan generics"],
      orig: 0, tier: 1, tierDesc: "● Low cost (< 90 EGP)",
      priceEst: "40 – 90 EGP / mo"
    },
    dose: "50 – 100 mg once daily (start 25 mg in elderly/frail or volume depleted)",
    renal: e => e < 30 ? "No dose adjustment needed; monitor K+ and creatinine" : "No adjustment",
    caut: "Teratogenic (contraindicated in pregnancy). Hyperkalemia risk. Modestly lowers uric acid (favored in gout).",
    rx: (p, b) => ({ b: `${b} 50 mg tab`, s: "1 tab once daily in morning", a: "قرص واحد يومياً صباحاً" })
  },

  telmisartan: {
    id: "telmisartan", category: "htn", cls: "ARB", name: "Telmisartan",
    ar: ["تيلميسارتان", "ميكارديس"],
    saudi: {
      brands: ["Micardis (Boehringer)", "Telmisartan generic"],
      orig: 0, tier: 1, tierDesc: "● Low-to-Moderate (45 – 75 SAR)",
      priceEst: "48 – 75 SAR / mo"
    },
    egypt: {
      brands: ["Micardis", "Telma", "Telmisartan local"],
      orig: 0, tier: 1, tierDesc: "● Moderate (< 160 EGP)",
      priceEst: "70 – 160 EGP / mo"
    },
    dose: "40 – 80 mg once daily",
    renal: () => "Long half-life (>24 h); safe in renal impairment with K+ monitoring",
    caut: "Contraindicated in pregnancy. Partial PPAR-gamma activity (metabolic benefit).",
    rx: (p, b) => ({ b: `${b} 40 mg tab`, s: "1 tab once daily in morning", a: "قرص واحد يومياً صباحاً" })
  },

  ramipril: {
    id: "ramipril", category: "htn", cls: "ACE inhibitor", name: "Ramipril",
    ar: ["راميبريل", "تريتيس"],
    saudi: {
      brands: ["Tritace (Sanofi)", "Ramipril generic"],
      orig: 0, tier: 1, tierDesc: "● Low cost (25 – 42 SAR)",
      priceEst: "26 – 42 SAR / mo"
    },
    egypt: {
      brands: ["Tritace", "Ramipril local generics"],
      orig: 0, tier: 1, tierDesc: "● Low cost (< 90 EGP)",
      priceEst: "40 – 90 EGP / mo"
    },
    dose: "2.5 – 10 mg once daily (start 1.25–2.5 mg in elderly or eGFR <30)",
    renal: e => e < 30 ? "Start 1.25 mg daily; max 5 mg/day" : "Standard starting dose",
    caut: "Dry cough, angioedema risk, hyperkalemia. Teratogenic.",
    rx: (p, b) => ({ b: `${b} 5 mg tab`, s: "1 tab once daily in morning", a: "قرص واحد يومياً صباحاً" })
  },

  spironolactone: {
    id: "spironolactone", category: "htn", cls: "MRA", name: "Spironolactone",
    ar: ["سبيرونولاكتون", "الداكتون", "ألداكتون"],
    saudi: {
      brands: ["Aldactone (Pfizer)", "Spironolactone generic"],
      orig: 0, tier: 1, tierDesc: "● Low cost (20 – 35 SAR)",
      priceEst: "22 – 35 SAR / mo"
    },
    egypt: {
      brands: ["Aldactone", "Spironolactone local generics"],
      orig: 0, tier: 1, tierDesc: "● Low cost (< 60 EGP)",
      priceEst: "25 – 60 EGP / mo"
    },
    dose: "25 – 50 mg once daily (preferred 4th-line drug in resistant hypertension · PATHWAY-2)",
    renal: e => e < 30 ? "Contraindicated (eGFR <30 or K+ >5.0)" : e < 45 ? "Caution: check K+ at 1, 4 weeks" : "Check K+ and Cr at 1 and 4 weeks",
    caut: "Hyperkalemia (do not start if K+ >5.0), gynecomastia. Switch to eplerenone if breast tenderness occurs.",
    rx: (p, b) => ({ b: `${b} 25 mg tab`, s: "1 tab once daily in morning with food", a: "قرص واحد يومياً صباحاً مع الطعام" })
  },

  labetalol: {
    id: "labetalol", category: "htn", cls: "Alpha/Beta-blocker", name: "Labetalol",
    ar: ["لابيتالول", "تراندات"],
    saudi: {
      brands: ["Trandate (Aspen/GSK)", "Labetalol generic"],
      orig: 0, tier: 1, tierDesc: "● Low cost (30 – 55 SAR)",
      priceEst: "32 – 55 SAR / mo"
    },
    egypt: {
      brands: ["Trandate"],
      orig: 0, tier: 1, tierDesc: "● Low cost (< 120 EGP)",
      priceEst: "60 – 120 EGP / mo"
    },
    dose: "100 – 400 mg twice daily (first-line in pregnancy hypertension · CHAP trial)",
    renal: () => "No renal dose adjustment needed",
    caut: "First-line safe in pregnancy & breastfeeding. Caution with asthma, severe bradycardia.",
    rx: (p, b) => ({ b: `${b} 100 mg tab`, s: "1 tab twice daily with meals", a: "قرص مرتين يومياً مع وجبات الطعام" })
  }
};

if (typeof window !== 'undefined') {
  window.DRUG_DATABASE = DRUG_DATABASE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DRUG_DATABASE;
}

