// ==============================================================
// Clinical Knowledge Base & Bilingual Formulary (Saudi & Egypt)
// Osrawy Clinical Navigator v2.0
// ==============================================================

import { calculateCrCl } from '../engines/calculators';

export interface DrugRenalRule {
  stopBelowEgfr: number;
  cautionBelowEgfr?: number;
  ruleEn: string;
  ruleAr: string;
}

export interface FormularyDrug {
  id: string;
  category: 'dm' | 'htn' | 'dlp' | 'pc' | 'tools' | 'resp' | 'thyroid';
  tier: 1 | 2 | 3;
  classEn: string;
  classAr: string;
  genericEn: string;
  genericAr: string;
  tradeNamesEn: string[];
  tradeNamesAr: string[];
  saudiBrandsEn?: string[];
  saudiBrandsAr?: string[];
  egyptBrandsEn?: string[];
  egyptBrandsAr?: string[];
  strengths: string[];
  doseEn: string;
  doseAr: string;
  renal: DrugRenalRule;
}

export type DrugEntry = FormularyDrug;

export interface DrugSafetyResult {
  status: 'safe' | 'caution' | 'contraindicated';
  reasonEn?: string;
  reasonAr?: string;
}

export const FORMULARY_CATALOG: FormularyDrug[] = [
  {
    "id": "metformin",
    "category": "dm",
    "tier": 1,
    "classEn": "Biguanide",
    "classAr": "بيجوانيد",
    "genericEn": "Metformin",
    "genericAr": "ميتفورمين",
    "tradeNamesEn": [
      "Glucophage",
      "Glucophage XR",
      "Cidophage",
      "Formit",
      "Diaphage"
    ],
    "tradeNamesAr": [
      "جلوكوفاج",
      "سيدوفاج",
      "فورميت",
      "ديافاج"
    ],
    "saudiBrandsEn": [
      "Glucophage",
      "Glucophage XR",
      "Formit"
    ],
    "saudiBrandsAr": [
      "جلوكوفاج",
      "جلوكوفاج XR",
      "فورميت"
    ],
    "egyptBrandsEn": [
      "Cidophage",
      "Glucophage",
      "Diaphage"
    ],
    "egyptBrandsAr": [
      "سيدوفاج",
      "جلوكوفاج",
      "ديافاج"
    ],
    "strengths": [
      "500 mg",
      "850 mg",
      "1000 mg"
    ],
    "doseEn": "500–1000 mg PO BID with meals (or XR 500–2000 mg once daily)",
    "doseAr": "٥٠٠-١٠٠٠ ملغ مرتين يومياً مع الوجبات (أو الممتد المفعول مرة يومياً)",
    "renal": {
      "stopBelowEgfr": 30,
      "cautionBelowEgfr": 45,
      "ruleEn": "eGFR <30: Contraindicated. eGFR 30–44: Max 1000 mg/day; do not initiate.",
      "ruleAr": "يُمنع عند eGFR <30. وعند 30–44 الحد الأقصى ١٠٠٠ ملغ يومياً."
    }
  },
  {
    "id": "empagliflozin",
    "category": "dm",
    "tier": 2,
    "classEn": "SGLT2 Inhibitor",
    "classAr": "مثبط SGLT2",
    "genericEn": "Empagliflozin",
    "genericAr": "إمباغليفلوزين",
    "tradeNamesEn": [
      "Jardiance",
      "Synjardy (with Metformin)",
      "Mellitofix",
      "Empacrystal"
    ],
    "tradeNamesAr": [
      "جاردينس",
      "سينجاردي",
      "ميليتوفيكس"
    ],
    "saudiBrandsEn": [
      "Jardiance",
      "Synjardy (with Metformin)"
    ],
    "saudiBrandsAr": [
      "جاردينس",
      "سينجاردي"
    ],
    "egyptBrandsEn": [
      "Mellitofix",
      "Empacrystal",
      "Jardiance"
    ],
    "egyptBrandsAr": [
      "ميليتوفيكس",
      "إمباكريستال",
      "جاردينس"
    ],
    "strengths": [
      "10 mg",
      "25 mg"
    ],
    "doseEn": "10–25 mg PO once daily in the morning",
    "doseAr": "١٠-٢٥ ملغ فموياً مرة واحدة صباحاً",
    "renal": {
      "stopBelowEgfr": 20,
      "cautionBelowEgfr": 45,
      "ruleEn": "Safe down to eGFR ≥20 for CKD/HF protection; less glucose lowering if eGFR <45.",
      "ruleAr": "آمن حتى eGFR ≥20 لحماية القلب والكلى؛ يقل مفعول خفض السكر تحت 45."
    }
  },
  {
    "id": "dapagliflozin",
    "category": "dm",
    "tier": 2,
    "classEn": "SGLT2 Inhibitor",
    "classAr": "مثبط SGLT2",
    "genericEn": "Dapagliflozin",
    "genericAr": "داباغليفلوزين",
    "tradeNamesEn": [
      "Forxiga",
      "Xigduo XR (with Metformin)",
      "Dapagloznal",
      "Dapaglif"
    ],
    "tradeNamesAr": [
      "فورسيجا",
      "زيجدو",
      "داباجلوزنال"
    ],
    "saudiBrandsEn": [
      "Forxiga",
      "Xigduo XR (with Metformin)"
    ],
    "saudiBrandsAr": [
      "فورسيجا",
      "زيجدو"
    ],
    "egyptBrandsEn": [
      "Dapagloznal",
      "Dapaglif",
      "Forflozin",
      "Forxiga"
    ],
    "egyptBrandsAr": [
      "داباجلوزنال",
      "داباجليف",
      "فورسيجا"
    ],
    "strengths": [
      "5 mg",
      "10 mg"
    ],
    "doseEn": "10 mg PO once daily",
    "doseAr": "١٠ ملغ فموياً مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 25,
      "cautionBelowEgfr": 45,
      "ruleEn": "Initiate down to eGFR ≥25 for CKD/HF protection.",
      "ruleAr": "يُستخدم حتى eGFR ≥25 لحماية الكلى والقلب."
    }
  },
  {
    "id": "semaglutide",
    "category": "dm",
    "tier": 3,
    "classEn": "GLP-1 Receptor Agonist",
    "classAr": "ناهض مستقبلات GLP-1",
    "genericEn": "Semaglutide",
    "genericAr": "سيماغلوتايد",
    "tradeNamesEn": [
      "Ozempic",
      "Wegovy"
    ],
    "tradeNamesAr": [
      "أوزمبيك",
      "ويغوفي"
    ],
    "strengths": [
      "0.25 mg",
      "0.5 mg",
      "1 mg",
      "2 mg"
    ],
    "doseEn": "0.25 mg SC weekly x4 wks, then 0.5–1 mg weekly",
    "doseAr": "٠.٢٥ ملغ تحت الجلد أسبوعياً لمدة ٤ أسابيع ثم ترفع إلى ٠.٥-١ ملغ",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 15,
      "ruleEn": "No renal dose adjustment required; monitor hydration if GI side effects occur.",
      "ruleAr": "لا يحتاج لتعديل الجرعة كلوياً؛ راقب الجفاف في حال حدوث قيء."
    }
  },
  {
    "id": "tirzepatide",
    "category": "dm",
    "tier": 3,
    "classEn": "Dual GIP/GLP-1 Agonist",
    "classAr": "ناهض مزدوج GIP/GLP-1",
    "genericEn": "Tirzepatide",
    "genericAr": "تيرزيباتايد",
    "tradeNamesEn": [
      "Mounjaro",
      "Zepbound"
    ],
    "tradeNamesAr": [
      "مونجارو"
    ],
    "strengths": [
      "2.5 mg",
      "5 mg",
      "7.5 mg",
      "10 mg",
      "12.5 mg",
      "15 mg"
    ],
    "doseEn": "Start 2.5 mg SC weekly x4 wks; increase by 2.5 mg every 4 wks",
    "doseAr": "٢.٥ ملغ تحت الجلد أسبوعياً لمدة ٤ أسابيع ثم ترفع تدريجياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 15,
      "ruleEn": "No renal dose adjustment required across CKD stages.",
      "ruleAr": "لا يتطلب تعديل الجرعة في القصور الكلوي."
    }
  },
  {
    "id": "sitagliptin",
    "category": "dm",
    "tier": 2,
    "classEn": "DPP-4 Inhibitor",
    "classAr": "مثبط DPP-4",
    "genericEn": "Sitagliptin",
    "genericAr": "سيتاغليبتين",
    "tradeNamesEn": [
      "Januvia",
      "Janumet (with Metformin)",
      "Sitavia",
      "Janaglip"
    ],
    "tradeNamesAr": [
      "جانوفيا",
      "جانوميت",
      "جاناجليب"
    ],
    "saudiBrandsEn": [
      "Januvia",
      "Janumet (with Metformin)",
      "Sitavia"
    ],
    "saudiBrandsAr": [
      "جانوفيا",
      "جانوميت"
    ],
    "egyptBrandsEn": [
      "Janaglip",
      "Sitagliptin generics",
      "Januvia"
    ],
    "egyptBrandsAr": [
      "جاناجليب",
      "سيتاجليبتين محلي",
      "جانوفيا"
    ],
    "strengths": [
      "25 mg",
      "50 mg",
      "100 mg"
    ],
    "doseEn": "100 mg PO once daily (adjust for eGFR)",
    "doseAr": "١٠٠ ملغ مرة يومياً (تعدل حسب وظائف الكلى)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 45,
      "ruleEn": "eGFR 30–44: 50 mg once daily. eGFR <30: 25 mg once daily.",
      "ruleAr": "عند eGFR 30–44: ٥٠ ملغ يومياً. وعند eGFR <30: ٢٥ ملغ يومياً."
    }
  },
  {
    "id": "perindopril",
    "category": "htn",
    "tier": 1,
    "classEn": "ACE Inhibitor",
    "classAr": "مثبط الإنزيم المحول للأنجيوتنسين (ACEi)",
    "genericEn": "Perindopril",
    "genericAr": "بيريندوبريل",
    "tradeNamesEn": [
      "Coversyl",
      "Coveram (with Amlodipine)",
      "Preterax",
      "Perindopril generics"
    ],
    "tradeNamesAr": [
      "كوفرسيل",
      "كوفرام"
    ],
    "saudiBrandsEn": [
      "Coversyl",
      "Coveram (with Amlodipine)",
      "Preterax"
    ],
    "saudiBrandsAr": [
      "كوفرسيل",
      "كوفرام"
    ],
    "egyptBrandsEn": [
      "Coversyl",
      "Coveram",
      "Preterax"
    ],
    "egyptBrandsAr": [
      "كوفرسيل",
      "كوفرام",
      "بريتراكس"
    ],
    "strengths": [
      "5 mg",
      "10 mg"
    ],
    "doseEn": "5–10 mg PO once daily",
    "doseAr": "٥-١٠ ملغ مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "eGFR <30: Start 2.5 mg daily; monitor Cr & K+ within 1–2 weeks.",
      "ruleAr": "عند eGFR <30: ابدأ بجرعة ٢.٥ ملغ وراقب الكرياتينين والبوتاسيوم."
    }
  },
  {
    "id": "valsartan",
    "category": "htn",
    "tier": 2,
    "classEn": "Angiotensin Receptor Blocker (ARB)",
    "classAr": "حاصر مستقبلات الأنجيوتنسين (ARB)",
    "genericEn": "Valsartan",
    "genericAr": "فالسارتان",
    "tradeNamesEn": [
      "Diovan",
      "Co-Diovan (with HCTZ)",
      "Exforge (with Amlodipine)",
      "Tareg"
    ],
    "tradeNamesAr": [
      "ديوفان",
      "كو-ديوفان",
      "إكسفورج",
      "تاريج"
    ],
    "saudiBrandsEn": [
      "Diovan",
      "Co-Diovan (with HCTZ)",
      "Exforge (with Amlodipine)"
    ],
    "saudiBrandsAr": [
      "ديوفان",
      "كو-ديوفان",
      "إكسفورج"
    ],
    "egyptBrandsEn": [
      "Tareg",
      "Diovan",
      "Exforge",
      "Co-Tareg"
    ],
    "egyptBrandsAr": [
      "تاريج",
      "ديوفان",
      "إكسفورج"
    ],
    "strengths": [
      "80 mg",
      "160 mg",
      "320 mg"
    ],
    "doseEn": "80–320 mg PO once daily",
    "doseAr": "٨٠-٣٢٠ ملغ مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "Use caution in severe CKD; hold if K+ ≥5.5 mmol/L or pregnancy.",
      "ruleAr": "حذر في القصور الكلوي الشديد؛ أوقفه إذا كان البوتاسيوم ≥5.5 أو في الحمل."
    }
  },
  {
    "id": "amlodipine",
    "category": "htn",
    "tier": 1,
    "classEn": "Dihydropyridine CCB",
    "classAr": "حاصر قنوات الكالسيوم",
    "genericEn": "Amlodipine",
    "genericAr": "أملوديبين",
    "tradeNamesEn": [
      "Norvasc",
      "Amlor",
      "Vascopin",
      "Alkapress"
    ],
    "tradeNamesAr": [
      "نورفاسك",
      "أملور",
      "ألكابريس"
    ],
    "saudiBrandsEn": [
      "Norvasc",
      "Amlor",
      "Vascopin"
    ],
    "saudiBrandsAr": [
      "نورفاسك",
      "أملور"
    ],
    "egyptBrandsEn": [
      "Alkapress",
      "Norvasc",
      "Vascopin"
    ],
    "egyptBrandsAr": [
      "ألكابريس",
      "نورفاسك"
    ],
    "strengths": [
      "5 mg",
      "10 mg"
    ],
    "doseEn": "5–10 mg PO once daily",
    "doseAr": "٥-١٠ ملغ مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal dose adjustment required; watch for ankle edema at 10 mg.",
      "ruleAr": "لا يتطلب تعديلاً كلوياً؛ قد يسبب تورم الكاحلين بجرعة ١٠ ملغ."
    }
  },
  {
    "id": "indapamide",
    "category": "htn",
    "tier": 1,
    "classEn": "Thiazide-Like Diuretic",
    "classAr": "مدر بول شبيه الثيازيد",
    "genericEn": "Indapamide",
    "genericAr": "إندابامايد",
    "tradeNamesEn": [
      "Natrilix SR",
      "Fludex",
      "Indapamide SR"
    ],
    "tradeNamesAr": [
      "ناتريليكس"
    ],
    "strengths": [
      "1.5 mg SR",
      "2.5 mg"
    ],
    "doseEn": "1.5 mg SR or 2.5 mg PO once daily in the morning",
    "doseAr": "١.٥ ملغ ممتد المفعول مرة واحدة صباحاً",
    "renal": {
      "stopBelowEgfr": 30,
      "cautionBelowEgfr": 45,
      "ruleEn": "Less effective when eGFR <30; switch to a loop diuretic if volume overloaded.",
      "ruleAr": "يفقد فعاليته عند eGFR <30؛ استبدله بمدر عروي (لازكس) عند الاحتقان."
    }
  },
  {
    "id": "bisoprolol",
    "category": "htn",
    "tier": 1,
    "classEn": "Cardioselective Beta-Blocker",
    "classAr": "حاصر بيتا انتقائي للقلب",
    "genericEn": "Bisoprolol",
    "genericAr": "بيسوبرولول",
    "tradeNamesEn": [
      "Concor",
      "BisoCard",
      "Bistol"
    ],
    "tradeNamesAr": [
      "كونكور",
      "بيزوكارد"
    ],
    "saudiBrandsEn": [
      "Concor",
      "BisoCard"
    ],
    "saudiBrandsAr": [
      "كونكور",
      "بيزوكارد"
    ],
    "egyptBrandsEn": [
      "Concor",
      "Bistol",
      "Concor Plus"
    ],
    "egyptBrandsAr": [
      "كونكور",
      "بيستول"
    ],
    "strengths": [
      "2.5 mg",
      "5 mg",
      "10 mg"
    ],
    "doseEn": "2.5–10 mg PO once daily",
    "doseAr": "٢.٥-١٠ ملغ مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 20,
      "ruleEn": "eGFR <20: Do not exceed 10 mg once daily.",
      "ruleAr": "عند eGFR <20: لا تتجاوز ١٠ ملغ يومياً."
    }
  },
  {
    "id": "spironolactone",
    "category": "htn",
    "tier": 1,
    "classEn": "Mineralocorticoid Receptor Antagonist (MRA)",
    "classAr": "مضاد الألدوستيرون",
    "genericEn": "Spironolactone",
    "genericAr": "سبيرونولاكتون",
    "tradeNamesEn": [
      "Aldactone",
      "Spirotone",
      "Spectone"
    ],
    "tradeNamesAr": [
      "ألداكتون"
    ],
    "saudiBrandsEn": [
      "Aldactone",
      "Spirotone"
    ],
    "saudiBrandsAr": [
      "ألداكتون"
    ],
    "egyptBrandsEn": [
      "Spectone",
      "Aldactone"
    ],
    "egyptBrandsAr": [
      "سبكتون",
      "ألداكتون"
    ],
    "strengths": [
      "25 mg",
      "50 mg",
      "100 mg"
    ],
    "doseEn": "25–50 mg PO once daily for resistant HTN or HFrEF",
    "doseAr": "٢٥-٥٠ ملغ مرة يومياً للضغط المقاوم أو قصور القلب",
    "renal": {
      "stopBelowEgfr": 30,
      "cautionBelowEgfr": 45,
      "ruleEn": "Avoid if eGFR <30 or baseline K+ >5.0 mmol/L.",
      "ruleAr": "يُمنع عند eGFR <30 أو إذا كان البوتاسيوم >5.0."
    }
  },
  {
    "id": "atorvastatin",
    "category": "dlp",
    "tier": 1,
    "classEn": "HMG-CoA Reductase Inhibitor (Statin)",
    "classAr": "ستاتين خافض للكوليسترول",
    "genericEn": "Atorvastatin",
    "genericAr": "أتورفاستاتين",
    "tradeNamesEn": [
      "Lipitor",
      "Lorvast",
      "Ator",
      "Tulip"
    ],
    "tradeNamesAr": [
      "ليبيتور",
      "لورفاست",
      "أتور"
    ],
    "saudiBrandsEn": [
      "Lipitor",
      "Lorvast",
      "Ator"
    ],
    "saudiBrandsAr": [
      "ليبيتور",
      "لورفاست"
    ],
    "egyptBrandsEn": [
      "Ator",
      "Lipitor",
      "Atoreza"
    ],
    "egyptBrandsAr": [
      "أتور",
      "ليبيتور"
    ],
    "strengths": [
      "10 mg",
      "20 mg",
      "40 mg",
      "80 mg"
    ],
    "doseEn": "High-intensity: 40–80 mg daily | Moderate: 10–20 mg daily",
    "doseAr": "عالي الشدة: ٤٠-٨٠ ملغ يومياً | متوسط الشدة: ١٠-٢٠ ملغ يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "Preferred statin in severe CKD: no renal dose adjustment needed at any eGFR.",
      "ruleAr": "الستاتين المفضل في القصور الكلوي: لا يحتاج لتعديل الجرعة مهما بلغ eGFR."
    }
  },
  {
    "id": "rosuvastatin",
    "category": "dlp",
    "tier": 2,
    "classEn": "HMG-CoA Reductase Inhibitor (Statin)",
    "classAr": "ستاتين خافض للكوليسترول",
    "genericEn": "Rosuvastatin",
    "genericAr": "روسوفاستاتين",
    "tradeNamesEn": [
      "Crestor",
      "Rosavi",
      "Rovista",
      "Crestolip"
    ],
    "tradeNamesAr": [
      "كريستور",
      "روزافي",
      "روفيستا"
    ],
    "saudiBrandsEn": [
      "Crestor",
      "Rosavi"
    ],
    "saudiBrandsAr": [
      "كريستور",
      "روزافي"
    ],
    "egyptBrandsEn": [
      "Rovista",
      "Crestolip",
      "Crestor"
    ],
    "egyptBrandsAr": [
      "روفيستا",
      "كريستوليب",
      "كريستور"
    ],
    "strengths": [
      "5 mg",
      "10 mg",
      "20 mg",
      "40 mg"
    ],
    "doseEn": "High-intensity: 20–40 mg daily | Moderate: 5–10 mg daily",
    "doseAr": "عالي الشدة: ٢٠-٤٠ ملغ يومياً | متوسط الشدة: ٥-١٠ ملغ يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "eGFR <30: Start at 5 mg and do not exceed 10 mg once daily.",
      "ruleAr": "عند eGFR <30: ابدأ بجرعة ٥ ملغ ولا تتجاوز ١٠ ملغ يومياً."
    }
  },
  {
    "id": "ezetimibe",
    "category": "dlp",
    "tier": 2,
    "classEn": "Cholesterol Absorption Inhibitor",
    "classAr": "مثبط امتصاص الكوليسترول",
    "genericEn": "Ezetimibe",
    "genericAr": "إيزيتيميب",
    "tradeNamesEn": [
      "Ezetrol",
      "Inegy (with Simvastatin)",
      "Rosuzet (with Rosuvastatin)",
      "Cholerose"
    ],
    "tradeNamesAr": [
      "إيزيترول",
      "إينيجي",
      "روزوزيت"
    ],
    "saudiBrandsEn": [
      "Ezetrol",
      "Inegy (with Simvastatin)",
      "Rosuzet (with Rosuvastatin)"
    ],
    "saudiBrandsAr": [
      "إيزيترول",
      "إينيجي",
      "روزوزيت"
    ],
    "egyptBrandsEn": [
      "Ezetrol",
      "Cholerose",
      "Atoreza"
    ],
    "egyptBrandsAr": [
      "إيزيترول",
      "كوليروز",
      "أتوريزا"
    ],
    "strengths": [
      "10 mg"
    ],
    "doseEn": "10 mg PO once daily",
    "doseAr": "١٠ ملغ مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal dose adjustment required.",
      "ruleAr": "لا يتطلب تعديلاً للجرعة الكلوية."
    }
  },
  {
    "id": "fenofibrate",
    "category": "dlp",
    "tier": 2,
    "classEn": "Fibrate (PPAR-α Agonist)",
    "classAr": "فايبرات خافض للدهون الثلاثية",
    "genericEn": "Fenofibrate",
    "genericAr": "فينوفايبرات",
    "tradeNamesEn": [
      "Lipanthyl",
      "Lipanthyl Supra"
    ],
    "tradeNamesAr": [
      "ليبانثيل"
    ],
    "strengths": [
      "145 mg",
      "160 mg",
      "48 mg"
    ],
    "doseEn": "145–160 mg PO once daily (adjust in CKD)",
    "doseAr": "١٤٥-١٦٠ ملغ مرة يومياً",
    "renal": {
      "stopBelowEgfr": 30,
      "cautionBelowEgfr": 60,
      "ruleEn": "eGFR <30: Contraindicated. eGFR 30–59: Max 48–54 mg daily.",
      "ruleAr": "يُمنع عند eGFR <30. وعند 30–59 تخفض الجرعة إلى ٤٨-٥٤ ملغ."
    }
  },
  {
    "id": "budesonide_formoterol",
    "category": "resp",
    "tier": 2,
    "classEn": "ICS + Fast-Onset LABA (MART)",
    "classAr": "كورتيزون مستنشق + موسع شعب سريع وطويل المفعول",
    "genericEn": "Budesonide / Formoterol",
    "genericAr": "بيوديسونيد / فورموتيرول",
    "tradeNamesEn": [
      "Symbicort Turbuhaler",
      "Pulmoton",
      "Foracort"
    ],
    "tradeNamesAr": [
      "سيمبيكورت",
      "بلموتون"
    ],
    "strengths": [
      "160/4.5 mcg",
      "320/9 mcg"
    ],
    "doseEn": "GINA Track 1: 160/4.5 mcg 1–2 puffs BD + 1 puff PRN reliever",
    "doseAr": "مسار GINA ١: بخة إلى بختين مرتين يومياً + بخة عند اللزوم",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal adjustment; rinse mouth after maintenance puffs.",
      "ruleAr": "لا يحتاج لتعديل كلوي؛ يجب المضمضة بالماء بعد الاستخدام."
    }
  },
  {
    "id": "levothyroxine",
    "category": "thyroid",
    "tier": 1,
    "classEn": "Thyroid Hormone Replacement",
    "classAr": "هرمون الغدة الدرقية التعويضي",
    "genericEn": "Levothyroxine",
    "genericAr": "ليفوثيروكسين",
    "tradeNamesEn": [
      "Euthyrox",
      "Eltroxin",
      "Thyroxin"
    ],
    "tradeNamesAr": [
      "إيوثيروكس",
      "إلتروكسين"
    ],
    "strengths": [
      "25 mcg",
      "50 mcg",
      "75 mcg",
      "100 mcg",
      "125 mcg",
      "150 mcg"
    ],
    "doseEn": "1.6 mcg/kg/day PO 30–60 min before breakfast (start 25–50 mcg in ASCVD/elderly)",
    "doseAr": "١.٦ مكغ/كغ صباحاً على الريق (ابدأ بـ ٢٥-٥٠ مكغ لمرضى القلب وكبار السن)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal adjustment; separate by 4 hours from calcium and iron.",
      "ruleAr": "افصل الجرعة ٤ ساعات عن حبوب الكالسيوم والحديد."
    }
  },
  {
    "id": "gliclazide",
    "category": "dm",
    "tier": 1,
    "classEn": "Sulfonylurea (2nd Gen)",
    "classAr": "سلفونيل يوريا",
    "genericEn": "Gliclazide MR",
    "genericAr": "غليكلازايد ممتد المفعول",
    "tradeNamesEn": ["Diamicron MR", "Diamicron", "Glucazide"],
    "tradeNamesAr": ["دياميكرون MR", "دياميكرون", "جلوكازيد"],
    "saudiBrandsEn": ["Diamicron MR", "Diamicron"],
    "saudiBrandsAr": ["دياميكرون MR", "دياميكرون"],
    "egyptBrandsEn": ["Diamicron MR", "Diamicron", "Glucazide"],
    "egyptBrandsAr": ["دياميكرون MR", "دياميكرون"],
    "strengths": ["30 mg", "60 mg", "80 mg"],
    "doseEn": "30–120 mg MR PO once daily with breakfast",
    "doseAr": "٣٠-١٢٠ ملغ ممتد المفعول مرة واحدة صباحاً مع الإفطار",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "Preferred SU in mild-to-moderate CKD; monitor closely for hypoglycemia if eGFR <30 or frail.",
      "ruleAr": "الخيار المفضل من السلفونيل يوريا في القصور الكلوي البسيط؛ راقب الهبوط عند eGFR <30 أو كبار السن."
    }
  },
  {
    "id": "glimepiride",
    "category": "dm",
    "tier": 1,
    "classEn": "Sulfonylurea (2nd Gen)",
    "classAr": "سلفونيل يوريا",
    "genericEn": "Glimepiride",
    "genericAr": "غليميبرايد",
    "tradeNamesEn": ["Amaryl", "Glimaryl", "Dolcyl"],
    "tradeNamesAr": ["أماريل", "جليماريل", "دولسيل"],
    "saudiBrandsEn": ["Amaryl", "Glimaryl"],
    "saudiBrandsAr": ["أماريل", "جليماريل"],
    "egyptBrandsEn": ["Amaryl", "Dolcyl", "Glimaryl"],
    "egyptBrandsAr": ["أماريل", "دولسيل"],
    "strengths": ["1 mg", "2 mg", "3 mg", "4 mg"],
    "doseEn": "1–4 mg PO once daily with first main meal (max 8 mg/day)",
    "doseAr": "١-٤ ملغ مرة واحدة يومياً مع أول وجبة رئيسية (بحد أقصى ٨ ملغ)",
    "renal": {
      "stopBelowEgfr": 30,
      "cautionBelowEgfr": 60,
      "ruleEn": "Active renal metabolites: avoid if eGFR <30; start 1 mg if eGFR 30–59 or frail.",
      "ruleAr": "تتراكم نواتجه كلوياً: يُمنع عند eGFR <30؛ ابدأ بجرعة ١ ملغ عند 30-59 أو الهشاشة."
    }
  },
  {
    "id": "insulin_glargine",
    "category": "dm",
    "tier": 2,
    "classEn": "Long-Acting Basal Insulin",
    "classAr": "إنسولين قاعدي طويل المفعول",
    "genericEn": "Insulin Glargine",
    "genericAr": "إنسولين غلارجين",
    "tradeNamesEn": ["Lantus", "Toujeo", "Basaglar", "Glaritus"],
    "tradeNamesAr": ["لانتوس", "توجيو", "بازاغلار"],
    "saudiBrandsEn": ["Lantus", "Toujeo", "Basaglar"],
    "saudiBrandsAr": ["لانتوس", "توجيو", "بازاغلار"],
    "egyptBrandsEn": ["Lantus", "Toujeo", "Glaritus"],
    "egyptBrandsAr": ["لانتوس", "توجيو", "جلاريتوس"],
    "strengths": ["100 U/mL", "300 U/mL"],
    "doseEn": "Start 10 U (or 0.1–0.2 U/kg) SC once daily; titrate by 2 U q3 days to fasting goal",
    "doseAr": "ابدأ ١٠ وحدات (أو ٠.١-٠.٢ وحدة/كغ) تحت الجلد مرة يومياً؛ تُعاير بوحدتين كل ٣ أيام",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "Safe in all CKD stages; reduce dose by 25–50% if eGFR <30 due to reduced renal insulin clearance.",
      "ruleAr": "آمن في القصور الكلوي؛ خفّض الجرعة ٢٥-٥٠٪ عند eGFR <30 لتجنب الهبوط."
    }
  },
  {
    "id": "ramipril",
    "category": "htn",
    "tier": 1,
    "classEn": "ACE Inhibitor",
    "classAr": "مثبط ACE",
    "genericEn": "Ramipril",
    "genericAr": "راميبريل",
    "tradeNamesEn": ["Tritace", "Ramipril", "Altace"],
    "tradeNamesAr": ["تريتاس", "راميبريل"],
    "saudiBrandsEn": ["Tritace", "Ramipril"],
    "saudiBrandsAr": ["تريتاس", "راميبريل"],
    "egyptBrandsEn": ["Tritace", "Ramipril"],
    "egyptBrandsAr": ["تريتاس", "راميبريل"],
    "strengths": ["2.5 mg", "5 mg", "10 mg"],
    "doseEn": "2.5–10 mg PO once daily (or divided BID in HF)",
    "doseAr": "٢.٥-١٠ ملغ فموياً مرة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "Monitor Cr and K+ within 1–2 weeks; hold if K+ ≥5.5 or Cr rises >30%.",
      "ruleAr": "راقب الكرياتينين والبوتاسيوم خلال أسبوعين؛ أوقف عند K+ ≥5.5."
    }
  },
  {
    "id": "losartan",
    "category": "htn",
    "tier": 1,
    "classEn": "ARB",
    "classAr": "حاصر مستقبلات الأنجيوتنسين",
    "genericEn": "Losartan",
    "genericAr": "لوسارتان",
    "tradeNamesEn": ["Cozaar", "Losar", "Kanzar"],
    "tradeNamesAr": ["كوزار", "لوسار", "كانزار"],
    "saudiBrandsEn": ["Cozaar", "Losar"],
    "saudiBrandsAr": ["كوزار", "لوسار"],
    "egyptBrandsEn": ["Cozaar", "Kanzar", "Losartan"],
    "egyptBrandsAr": ["كوزار", "كانزار"],
    "strengths": ["25 mg", "50 mg", "100 mg"],
    "doseEn": "50–100 mg PO once daily (or divided BID)",
    "doseAr": "٥٠-١٠٠ ملغ فموياً مرة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "Monitor Cr and K+ within 1–2 weeks; renoprotective in diabetic proteinuria.",
      "ruleAr": "راقب الكرياتينين والبوتاسيوم؛ يحمي الكلى في زلال البول السكري."
    }
  },
  {
    "id": "telmisartan",
    "category": "htn",
    "tier": 2,
    "classEn": "ARB",
    "classAr": "حاصر مستقبلات الأنجيوتنسين",
    "genericEn": "Telmisartan",
    "genericAr": "تيلميسارتان",
    "tradeNamesEn": ["Micardis", "Twynsta (with Amlodipine)", "Telsar"],
    "tradeNamesAr": ["ميكارديس", "توينستا", "تيلسار"],
    "saudiBrandsEn": ["Micardis", "Twynsta"],
    "saudiBrandsAr": ["ميكارديس", "توينستا"],
    "egyptBrandsEn": ["Micardis", "Twynsta", "Telsar"],
    "egyptBrandsAr": ["ميكارديس", "توينستا"],
    "strengths": ["40 mg", "80 mg"],
    "doseEn": "40–80 mg PO once daily",
    "doseAr": "٤٠-٨٠ ملغ فموياً مرة واحدة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "Minimal renal elimination; monitor Cr/K+ within 1–2 weeks.",
      "ruleAr": "إطراح كلوي منخفض؛ راقب الكرياتينين والبوتاسيوم خلال أسبوعين."
    }
  },
  {
    "id": "sacubitril_valsartan",
    "category": "htn",
    "tier": 3,
    "classEn": "ARNI",
    "classAr": "مثبط النبريلايسين ومستقبلات الأنجيوتنسين",
    "genericEn": "Sacubitril / Valsartan",
    "genericAr": "ساكوبيتريل / فالسارتان",
    "tradeNamesEn": ["Entresto"],
    "tradeNamesAr": ["إنتريستو"],
    "saudiBrandsEn": ["Entresto"],
    "saudiBrandsAr": ["إنتريستو"],
    "egyptBrandsEn": ["Entresto"],
    "egyptBrandsAr": ["إنتريستو"],
    "strengths": ["24/26 mg", "49/51 mg", "97/103 mg"],
    "doseEn": "24/26–97/103 mg PO BID (requires mandatory 36h washout after ACEi)",
    "doseAr": "٢٤/٢٦ إلى ٩٧/١٠٣ ملغ مرتين يومياً (يلزم فاصل ٣٦ ساعة بعد مثبط ACE)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "Start 24/26 mg BID if eGFR <30 or SBP 100–110; mandatory 36h ACEi washout.",
      "ruleAr": "ابدأ بجرعة ٢٤/٢٦ مرتين عند eGFR <30؛ التزم بفترة غسل ٣٦ ساعة بعد ACEi."
    }
  },
  {
    "id": "labetalol",
    "category": "htn",
    "tier": 2,
    "classEn": "Combined Alpha/Beta Blocker",
    "classAr": "حاصر ألفا وبيتا",
    "genericEn": "Labetalol",
    "genericAr": "لابيتالول",
    "tradeNamesEn": ["Trandate", "Normodyne"],
    "tradeNamesAr": ["تراندات", "لابيتالول"],
    "saudiBrandsEn": ["Trandate"],
    "saudiBrandsAr": ["تراندات"],
    "egyptBrandsEn": ["Trandate", "Labetalol"],
    "egyptBrandsAr": ["تراندات", "لابيتالول"],
    "strengths": ["100 mg", "200 mg"],
    "doseEn": "100–400 mg PO BID (pregnancy first-line if no asthma; max 2400 mg/day)",
    "doseAr": "١٠٠-٤٠٠ ملغ مرتين يومياً (الخيار الأول للحامل غير المصابة بالربو)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal dose adjustment; contraindicated in bronchial asthma.",
      "ruleAr": "لا يحتاج تعديلاً كلوياً؛ يُمنع في مرضى الربو الشعبي."
    }
  },
  {
    "id": "nifedipine_er",
    "category": "htn",
    "tier": 1,
    "classEn": "Dihydropyridine CCB",
    "classAr": "حاصر قنوات الكالسيوم",
    "genericEn": "Nifedipine ER",
    "genericAr": "نيفيديبين ممتد المفعول",
    "tradeNamesEn": ["Adalat LA", "Epilat Retard", "Procardia XL"],
    "tradeNamesAr": ["أدالات LA", "إبيلات ريتارد"],
    "saudiBrandsEn": ["Adalat LA"],
    "saudiBrandsAr": ["أدالات LA"],
    "egyptBrandsEn": ["Epilat Retard", "Adalat LA"],
    "egyptBrandsAr": ["إبيلات ريتارد", "أدالات LA"],
    "strengths": ["20 mg", "30 mg", "60 mg"],
    "doseEn": "30–60 mg PO once daily (pregnancy first-line in asthma; max 120 mg/day)",
    "doseAr": "٣٠-٦٠ ملغ مرة يومياً (الخيار الأول للحامل المصابة بالربو)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal adjustment required; safe in asthma and pregnancy.",
      "ruleAr": "لا يتطلب تعديلاً كلوياً؛ آمن في الحمل والربو."
    }
  },
  {
    "id": "methyldopa",
    "category": "htn",
    "tier": 1,
    "classEn": "Centrally Acting Alpha-2 Agonist",
    "classAr": "ناهض ألفا-2 المركزي",
    "genericEn": "Methyldopa",
    "genericAr": "ميثيل دوبا",
    "tradeNamesEn": ["Aldomet", "Kahamydopa"],
    "tradeNamesAr": ["ألدوميت", "كاهأميدوبا"],
    "saudiBrandsEn": ["Aldomet"],
    "saudiBrandsAr": ["ألدوميت"],
    "egyptBrandsEn": ["Aldomet", "Kahamydopa"],
    "egyptBrandsAr": ["ألدوميت"],
    "strengths": ["250 mg", "500 mg"],
    "doseEn": "250–500 mg PO BID–TID in pregnancy (avoid postpartum — depression risk)",
    "doseAr": "٢٥٠-٥٠٠ ملغ مرتين إلى ثلاث مرات للحمل (يُتجنب بعد الولادة لخطر الاكتئاب)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "Extend dosing interval in severe CKD; avoid postpartum due to depression risk.",
      "ruleAr": "باعد بين الجرعات في القصور الكلوي الشديد؛ يُتجنب في النفاس."
    }
  },
  {
    "id": "simvastatin",
    "category": "dlp",
    "tier": 1,
    "classEn": "Statin (Moderate Intensity)",
    "classAr": "ستاتين متوسط الكثافة",
    "genericEn": "Simvastatin",
    "genericAr": "سيمفاستاتين",
    "tradeNamesEn": ["Zocor", "Simvagen"],
    "tradeNamesAr": ["زوكور", "سيمفاجين"],
    "saudiBrandsEn": ["Zocor"],
    "saudiBrandsAr": ["زوكور"],
    "egyptBrandsEn": ["Zocor", "Simvagen"],
    "egyptBrandsAr": ["زوكور"],
    "strengths": ["10 mg", "20 mg", "40 mg"],
    "doseEn": "20–40 mg PO once daily at bedtime (CAP ≤20 mg with Amlodipine)",
    "doseAr": "٢٠-٤٠ ملغ مساءً (الحد الأقصى ٢٠ ملغ مع الأملوديبين)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 30,
      "ruleEn": "Start 5 mg if eGFR <30; max 20 mg/day with Amlodipine (CYP3A4 myopathy risk).",
      "ruleAr": "ابدأ بـ ٥ ملغ عند eGFR <30؛ الحد الأقصى ٢٠ ملغ مع الأملوديبين."
    }
  },
  {
    "id": "evolocumab",
    "category": "dlp",
    "tier": 3,
    "classEn": "PCSK9 Inhibitor",
    "classAr": "مثبط PCSK9",
    "genericEn": "Evolocumab",
    "genericAr": "إيفولوكوماب",
    "tradeNamesEn": ["Repatha"],
    "tradeNamesAr": ["ريباثا"],
    "saudiBrandsEn": ["Repatha"],
    "saudiBrandsAr": ["ريباثا"],
    "egyptBrandsEn": ["Repatha"],
    "egyptBrandsAr": ["ريباثا"],
    "strengths": ["140 mg/mL"],
    "doseEn": "140 mg SC every 2 weeks (or 420 mg monthly) for Step 3 LDL lowering",
    "doseAr": "١٤٠ ملغ تحت الجلد كل أسبوعين (أو ٤٢٠ ملغ شهرياً)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal dose adjustment required across CKD stages.",
      "ruleAr": "لا يتطلب تعديلاً للجرعة في القصور الكلوي."
    }
  },
  {
    "id": "salbutamol",
    "category": "resp",
    "tier": 1,
    "classEn": "SABA Reliever",
    "classAr": "موسع قصبات سريع المفعول (SABA)",
    "genericEn": "Salbutamol (Albuterol)",
    "genericAr": "سالبوتامول",
    "tradeNamesEn": ["Ventolin Evohaler", "Asmatol", "Butalin"],
    "tradeNamesAr": ["فنتولين", "بيوتالين"],
    "saudiBrandsEn": ["Ventolin Evohaler"],
    "saudiBrandsAr": ["فنتولين"],
    "egyptBrandsEn": ["Ventolin Evohaler", "Asmatol"],
    "egyptBrandsAr": ["فنتولين", "أسماتول"],
    "strengths": ["100 mcg/puff"],
    "doseEn": "1–2 puffs PRN bronchospasm (overuse ≥3x/wk or ≥3 canisters/yr mandates ICS switch)",
    "doseAr": "١-٢ بخة عند اللزوم (الاستخدام ≥٣ مرات أسبوعياً يستلزم التحول لبخاخ كورتيزون)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal adjustment; monitor heart rate and K+ if high-dose nebulized.",
      "ruleAr": "لا يحتاج تعديلاً كلوياً؛ راقب النبض والبوتاسيوم في الجرعات العالية."
    }
  },
  {
    "id": "tiotropium",
    "category": "resp",
    "tier": 2,
    "classEn": "Long-Acting Muscarinic Antagonist (LAMA)",
    "classAr": "مضاد مسكاريني طويل المفعول (LAMA)",
    "genericEn": "Tiotropium",
    "genericAr": "تيوتروبيوم",
    "tradeNamesEn": ["Spiriva Respimat", "Spiriva HandiHaler", "Tiova"],
    "tradeNamesAr": ["سبيريفا ريسبمات", "سبيريفا", "تيوفا"],
    "saudiBrandsEn": ["Spiriva Respimat", "Spiriva HandiHaler"],
    "saudiBrandsAr": ["سبيريفا ريسبمات", "سبيريفا"],
    "egyptBrandsEn": ["Spiriva", "Tiova"],
    "egyptBrandsAr": ["سبيريفا", "تيوفا"],
    "strengths": ["2.5 mcg/puff", "18 mcg cap"],
    "doseEn": "5 mcg (2 puffs Respimat) or 18 mcg inhaled once daily",
    "doseAr": "٥ مكغ (بختان ريسبمات) أو كبسولة استنشاق ١٨ مكغ مرة يومياً",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 50,
      "ruleEn": "Renally excreted: monitor anticholinergic side effects if CrCl/eGFR <50 mL/min.",
      "ruleAr": "يُطرح كلوياً: راقب الأعراض الجانبية إذا كان eGFR <50."
    }
  },
  {
    "id": "carbimazole",
    "category": "thyroid",
    "tier": 1,
    "classEn": "Antithyroid Thionamide",
    "classAr": "مضاد للغدة الدرقية (ثيوأمايد)",
    "genericEn": "Carbimazole",
    "genericAr": "كاربيمازول",
    "tradeNamesEn": ["Neo-Mercazole", "Carbimazole"],
    "tradeNamesAr": ["نيوميركازول", "كاربيمازول"],
    "saudiBrandsEn": ["Neo-Mercazole"],
    "saudiBrandsAr": ["نيوميركازول"],
    "egyptBrandsEn": ["Neo-Mercazole", "Carbimazole"],
    "egyptBrandsAr": ["نيوميركازول", "كاربيمازول"],
    "strengths": ["5 mg", "20 mg"],
    "doseEn": "15–40 mg/day initially, then 5–15 mg/day maintenance (avoid T1 pregnancy; use PTU)",
    "doseAr": "١٥-٤٠ ملغ يومياً كبداية ثم ٥-١٥ ملغ للمداومة (يُفضل PTU في الثلث الأول من الحمل)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "No renal adjustment; urgent CBC if fever/sore throat (agranulocytosis warning).",
      "ruleAr": "لا يحتاج تعديلاً كلوياً؛ افحص صورة الدم فوراً عند الحمى أو التهاب الحلق."
    }
  },
  {
    "id": "propranolol",
    "category": "thyroid",
    "tier": 1,
    "classEn": "Non-Selective Beta-Blocker",
    "classAr": "حاصر بيتا غير انتقائي",
    "genericEn": "Propranolol",
    "genericAr": "بروبرانولول",
    "tradeNamesEn": ["Inderal"],
    "tradeNamesAr": ["إندرال"],
    "saudiBrandsEn": ["Inderal"],
    "saudiBrandsAr": ["إندرال"],
    "egyptBrandsEn": ["Inderal"],
    "egyptBrandsAr": ["إندرال"],
    "strengths": ["10 mg", "40 mg"],
    "doseEn": "10–40 mg PO TID–QID for thyrotoxicosis tremor/tachycardia (CONTRAINDICATED in Asthma/COPD)",
    "doseAr": "١٠-٤٠ ملغ ٣-٤ مرات يومياً لخفقان ورعشة فرط الغدة (ممنوع في الربو والسدة)",
    "renal": {
      "stopBelowEgfr": 0,
      "cautionBelowEgfr": 0,
      "ruleEn": "Hepatically cleared; strictly contraindicated in Asthma/COPD (severe bronchospasm).",
      "ruleAr": "يُستقلب كبدياً؛ ممنوع قطعياً في الربو والسدة الرئوية لخطر التشنج القصبي."
    }
  },
  {
    "id": "apixaban",
    "category": "tools",
    "tier": 2,
    "classEn": "Direct Oral Anticoagulant (Factor Xa)",
    "classAr": "مضاد تخثر فموي مباشر (DOAC)",
    "genericEn": "Apixaban",
    "genericAr": "أبيكسابان",
    "tradeNamesEn": ["Eliquis", "Apixatrac"],
    "tradeNamesAr": ["إليكويس", "أبيكساتراك"],
    "saudiBrandsEn": ["Eliquis"],
    "saudiBrandsAr": ["إليكويس"],
    "egyptBrandsEn": ["Eliquis", "Apixatrac"],
    "egyptBrandsAr": ["إليكويس", "أبيكساتراك"],
    "strengths": ["2.5 mg", "5 mg"],
    "doseEn": "5 mg PO BID (reduce to 2.5 mg BID if ≥2 of: Age ≥80, Wt ≤60 kg, SCr ≥1.5 mg/dL)",
    "doseAr": "٥ ملغ مرتين يومياً (تُخفض إلى ٢.٥ ملغ مرتين عند تحقق معيارين من: عمر ≥٨٠، وزن ≤٦٠، كرياتينين ≥١.٥)",
    "renal": {
      "stopBelowEgfr": 15,
      "cautionBelowEgfr": 30,
      "ruleEn": "Contraindicated if CrCl <15 mL/min; use 2.5 mg BID if CrCl 15–29 mL/min.",
      "ruleAr": "يُمنع عند CrCl <15؛ تُخفض الجرعة إلى ٢.٥ ملغ مرتين عند 15-29."
    }
  },
  {
    "id": "rivaroxaban",
    "category": "tools",
    "tier": 2,
    "classEn": "Direct Oral Anticoagulant (Factor Xa)",
    "classAr": "مضاد تخثر فموي مباشر (DOAC)",
    "genericEn": "Rivaroxaban",
    "genericAr": "ريفاروكسابان",
    "tradeNamesEn": ["Xarelto", "Rivarospire"],
    "tradeNamesAr": ["زاريلتو", "ريفاروسبير"],
    "saudiBrandsEn": ["Xarelto"],
    "saudiBrandsAr": ["زاريلتو"],
    "egyptBrandsEn": ["Xarelto", "Rivarospire"],
    "egyptBrandsAr": ["زاريلتو", "ريفاروسبير"],
    "strengths": ["10 mg", "15 mg", "20 mg"],
    "doseEn": "20 mg PO once daily WITH evening meal (15 mg daily if CrCl 15–49 mL/min)",
    "doseAr": "٢٠ ملغ مرة واحدة يومياً مع وجبة العشاء (١٥ ملغ يومياً عند CrCl 15-49)",
    "renal": {
      "stopBelowEgfr": 15,
      "cautionBelowEgfr": 50,
      "ruleEn": "Contraindicated if CrCl <15 mL/min; reduce to 15 mg daily with food if CrCl 15–49.",
      "ruleAr": "يُمنع عند CrCl <15؛ تُخفض الجرعة إلى ١٥ ملغ مع الطعام عند 15-49."
    }
  }
];

export const DRUG_BY_ID: Record<string, FormularyDrug> = {};
FORMULARY_CATALOG.forEach(d => {
  DRUG_BY_ID[d.id] = d;
});

export const FORMULARY = FORMULARY_CATALOG;

const DRUG_ID_ALIASES: Record<string, string> = {
  insulin: 'insulin_glargine',
  glargine: 'insulin_glargine',
  entresto: 'sacubitril_valsartan',
  arni: 'sacubitril_valsartan',
  met: 'metformin',
  empa: 'empagliflozin',
  dapa: 'dapagliflozin',
  sema: 'semaglutide',
  tirz: 'tirzepatide',
  sita: 'sitagliptin',
  atorva: 'atorvastatin',
  rosuva: 'rosuvastatin',
  simva: 'simvastatin',
  nifedipine: 'nifedipine_er',
  inderal: 'propranolol',
  ventolin: 'salbutamol',
  spiriva: 'tiotropium'
};

export function getDrugById(id: string): FormularyDrug | undefined {
  const clean = String(id || '').trim().toLowerCase();
  if (!clean) return undefined;
  if (DRUG_BY_ID[clean]) return DRUG_BY_ID[clean];
  const aliasId = DRUG_ID_ALIASES[clean];
  if (aliasId && DRUG_BY_ID[aliasId]) return DRUG_BY_ID[aliasId];
  return FORMULARY_CATALOG.find(
    d => d.id.toLowerCase() === clean || d.genericEn.toLowerCase().includes(clean)
  );
}

export function getDrugSafetyStatus(drug: FormularyDrug, pt?: any): DrugSafetyResult {
  const p = pt || {};
  const id = drug.id.toLowerCase();
  const isPregnant = !!(p.pregnancy || p.preg || p.isPregnant || p.pregHtn);
  const hasAsthma = !!p.asthma;
  const hasCopd = !!p.copd;
  const k = parseFloat(String(p.k ?? 4.5)) || 0;
  const egfrRaw = p.egfr;
  const egfr = (egfrRaw === undefined || egfrRaw === null)
    ? 90
    : (egfrRaw === '' ? 0 : (Number.isFinite(Number(egfrRaw)) ? Number(egfrRaw) : 0));
  const age = parseFloat(String(p.age ?? 52)) || 0;
  const isFrail = !!p.frail;
  const hasAscvd = !!(p.ascvd || p.cad || (p.hf && p.hf !== 'none' && p.hf !== false));

  const medsRaw = Array.isArray(p.activeMeds)
    ? p.activeMeds
    : Array.isArray(p.meds)
      ? p.meds
      : Array.isArray(p.medications)
        ? p.medications
        : [];
  const activeMeds: string[] = medsRaw.map((m: unknown) => String(m).toLowerCase().trim());
  const hasActive = (...tokens: string[]) => activeMeds.some((m: string) => tokens.some(t => m.includes(t)));
  const isTokenMatch = (m: string, t: string) =>
    t.length <= 4
      ? m === t || m.startsWith(`${t}_`) || m.startsWith(`${t}-`) || m.endsWith(`_${t}`) || m.endsWith(`-${t}`)
      : m.includes(t);

  let firstCaution: DrugSafetyResult | null = null;
  const noteCaution = (res: DrugSafetyResult) => {
    if (!firstCaution) firstCaution = res;
  };

  // 1. Pregnancy checks (highest priority)
  if (isPregnant) {
    const PREG_CONTRA_IDS = [
      'perindopril', 'ramipril', 'valsartan', 'losartan', 'telmisartan', 'sacubitril_valsartan',
      'spironolactone', 'indapamide',
      'metformin', 'empagliflozin', 'dapagliflozin', 'semaglutide', 'tirzepatide', 'sitagliptin', 'gliclazide', 'glimepiride',
      'apixaban', 'rivaroxaban'
    ];
    if (drug.category === 'dlp' || PREG_CONTRA_IDS.includes(id)) {
      return {
        status: 'contraindicated',
        reasonEn: 'Contraindicated in pregnancy (fetal/teratogenic risk).',
        reasonAr: 'ممنوع أثناء الحمل (خطر تشوه أو ضرر جنيني).'
      };
    }
    if (id === 'carbimazole') {
      noteCaution({
        status: 'caution',
        reasonEn: 'Avoid Carbimazole in 1st trimester pregnancy (use PTU); monitor thyroid q4w.',
        reasonAr: 'تجنب كاربيمازول في الثلث الأول من الحمل (يفضل PTU).'
      });
    }
  }

  // 2. Asthma / COPD bronchospasm checks
  if (hasAsthma || hasCopd) {
    if (id === 'propranolol') {
      return {
        status: 'contraindicated',
        reasonEn: 'Non-selective beta-blocker contraindicated in Asthma/COPD (severe bronchospasm risk).',
        reasonAr: 'حاصر بيتا غير انتقائي ممنوع في الربو والسدة لخطر التشنج القصبي الحاد.'
      };
    }
    if (id === 'labetalol' && hasAsthma) {
      return {
        status: 'contraindicated',
        reasonEn: 'Avoid Labetalol in maternal asthma (bronchospasm risk; prefer Nifedipine ER).',
        reasonAr: 'تجنب لابيتالول لمرضى الربو (يفضل نيفيديبين ممتد المفعول).'
      };
    }
    if (id === 'bisoprolol' && hasAsthma) {
      noteCaution({
        status: 'caution',
        reasonEn: 'Cardioselective B1-blocker: use cautiously in asthma at lowest effective dose.',
        reasonAr: 'حاصر بيتا انتقائي: يُستخدم بحذر في الربو بأقل جرعة فعالة.'
      });
    }
  }

  // 3. Hyperkalemia checks
  const RAAS_IDS = ['perindopril', 'ramipril', 'valsartan', 'losartan', 'telmisartan', 'sacubitril_valsartan'];
  if (k >= 5.5 && (RAAS_IDS.includes(id) || id === 'spironolactone')) {
    return {
      status: 'contraindicated',
      reasonEn: `Severe hyperkalemia (K+ = ${k} mEq/L ≥ 5.5): hold RAAS/MRA immediately.`,
      reasonAr: `ارتفاع حاد بالبوتاسيوم (${k} ≥ 5.5): أوقف مثبطات الرينين وMRA فوراً.`
    };
  }
  if (k > 5.0 && id === 'spironolactone') {
    return {
      status: 'contraindicated',
      reasonEn: `Elevated K+ (${k} mEq/L > 5.0): avoid MRA initiation/continuation.`,
      reasonAr: `ارتفاع البوتاسيوم (${k} > 5.0): تجنب السبيرونولاكتون.`
    };
  }
  if (k > 5.0 && RAAS_IDS.includes(id)) {
    noteCaution({
      status: 'caution',
      reasonEn: `Elevated K+ (${k} mEq/L > 5.0): monitor electrolytes within 1–2 weeks.`,
      reasonAr: `ارتفاع البوتاسيوم (${k} > 5.0): راقب الأملاح خلال 1–2 أسبوع.`
    });
  }

  // 4. Drug-drug interaction checks with active meds
  if (id === 'simvastatin' && hasActive('amlodipine', 'exforge', 'coveram', 'twynsta')) {
    noteCaution({
      status: 'caution',
      reasonEn: 'Cap Simvastatin at ≤20 mg/day with Amlodipine (CYP3A4 myopathy risk).',
      reasonAr: 'الحد الأقصى للسيمفاستاتين ≤20 ملغ مع الأملوديبين لتجنب تسمم العضلات.'
    });
  }
  const ACE_TOKENS = ['perindopril', 'ramipril', 'lisinopril', 'enalapril', 'captopril', 'coveram'];
  const ARB_TOKENS = ['valsartan', 'losartan', 'telmisartan', 'candesartan', 'irbesartan', 'exforge', 'twynsta'];
  const isArniMed = (m: string) => m.includes('sacubitril') || m.includes('entresto') || isTokenMatch(m, 'arni');
  const hasAceActive = activeMeds.some(
    (m: string) => ACE_TOKENS.some(t => m.includes(t)) || isTokenMatch(m, 'ace') || isTokenMatch(m, 'acei')
  );
  const hasArniActive = activeMeds.some(isArniMed);
  const hasPureArbActive = activeMeds.some(
    (m: string) =>
      !isArniMed(m) &&
      (ARB_TOKENS.some(t => m.includes(t)) || isTokenMatch(m, 'arb') || isTokenMatch(m, 'arbs'))
  );

  if (id === 'sacubitril_valsartan' && hasAceActive) {
    return {
      status: 'contraindicated',
      reasonEn: 'Mandatory 36-hour washout from ACEi before starting Sacubitril/Valsartan.',
      reasonAr: 'ممنوع مع مثبطات ACEi: يلزم فاصل 36 ساعة قبل بدء إنتريستو.'
    };
  }
  if (id === 'sacubitril_valsartan' && hasPureArbActive) {
    noteCaution({
      status: 'caution',
      reasonEn: 'Stop active ARB before starting Sacubitril/Valsartan (no 36h washout needed; do not co-administer).',
      reasonAr: 'يجب إيقاف حاصر ARB الحالي قبل بدء ساكوبتريل/فالسارتان (لا حاجة لفترة توقف ٣٦ ساعة؛ يُمنع الجمع بينهما).'
    });
  }
  if (ACE_TOKENS.includes(id) && (hasArniActive || hasPureArbActive)) {
    return {
      status: 'contraindicated',
      reasonEn: 'Contraindicated with active ARB/ARNI (dual RAAS / angioedema risk).',
      reasonAr: 'ممنوع الجمع مع ARB أو ARNI (خطر الفشل الكلوي والوذمة الوعائية).'
    };
  }
  if (ARB_TOKENS.includes(id) && (hasAceActive || hasArniActive)) {
    return {
      status: 'contraindicated',
      reasonEn: hasArniActive
        ? 'Contraindicated duplicate ARB/ARNI therapy (Sacubitril/Valsartan already contains an ARB).'
        : 'Contraindicated dual RAAS blockade with active ACEi.',
      reasonAr: hasArniActive
        ? 'ممنوع الجمع مع دواء ARNI لاحتوائه بالفعل على حاصر ARB (فالسارتان).'
        : 'ممنوع الجمع المزدوج مع مثبط ACEi نشط.'
    };
  }

  // 5. Renal checks (CrCl for DOACs when scr available; eGFR for all)
  if (id === 'apixaban' || id === 'rivaroxaban') {
    const scrRaw = parseFloat(String(p.scr ?? p.creatinineMgDl ?? 0)) || 0;
    const wt = parseFloat(String(p.wt ?? p.weightKg ?? 0)) || 0;
    let renalVal = egfr;
    if (scrRaw > 0 && age > 0 && wt > 0) {
      const crclRes = calculateCrCl(
        scrRaw,
        p.scrUnit === 'umol' ? 'umol' : 'mg',
        age,
        p.sex === 'f' ? 'f' : 'm',
        wt
      );
      if (crclRes) {
        renalVal = crclRes.crcl;
      }
    }
    if (renalVal < 15) {
      return {
        status: 'contraindicated',
        reasonEn: drug.renal.ruleEn,
        reasonAr: drug.renal.ruleAr
      };
    }
    if ((id === 'apixaban' && renalVal < 30) || (id === 'rivaroxaban' && renalVal < 50)) {
      noteCaution({
        status: 'caution',
        reasonEn: drug.renal.ruleEn,
        reasonAr: drug.renal.ruleAr
      });
    }
  }

  if (drug.renal.stopBelowEgfr > 0 && egfr < drug.renal.stopBelowEgfr) {
    return {
      status: 'contraindicated',
      reasonEn: drug.renal.ruleEn,
      reasonAr: drug.renal.ruleAr
    };
  }
  if (drug.renal.cautionBelowEgfr && drug.renal.cautionBelowEgfr > 0 && egfr < drug.renal.cautionBelowEgfr) {
    noteCaution({
      status: 'caution',
      reasonEn: drug.renal.ruleEn,
      reasonAr: drug.renal.ruleAr
    });
  }

  // 6. Frailty / Age / Cardiac cautions
  if ((isFrail || age >= 75) && ['glimepiride', 'gliclazide', 'insulin_glargine', 'spironolactone', 'indapamide'].includes(id)) {
    noteCaution({
      status: 'caution',
      reasonEn: 'Frail/elderly caution: start low and monitor for hypoglycemia, falls, or orthostasis.',
      reasonAr: 'حذر لكبار السن والهشاشة: ابدأ بجرعة منخفضة وراقب هبوط السكر أو الدوار.'
    });
  }
  if (id === 'levothyroxine' && (age >= 65 || hasAscvd)) {
    noteCaution({
      status: 'caution',
      reasonEn: 'Older adult or ASCVD/HF: start conservative 25–50 mcg/day and titrate slowly.',
      reasonAr: 'كبار السن أو مرضى القلب: ابدأ بجرعة تحفظية 25-50 مكغ يومياً.'
    });
  }

  if (firstCaution) return firstCaution;
  return { status: 'safe' };
}

export function searchFormulary(query: string, market: 'sa' | 'eg' = 'sa'): FormularyDrug[] {
  const q = query.trim().toLowerCase();
  if (!q) return FORMULARY_CATALOG;

  return FORMULARY_CATALOG.filter(d => {
    const brands = market === 'sa' 
      ? [...(d.saudiBrandsEn || []), ...(d.saudiBrandsAr || [])]
      : [...(d.egyptBrandsEn || []), ...(d.egyptBrandsAr || [])];
    
    const allNames = [
      d.genericEn.toLowerCase(),
      d.genericAr.toLowerCase(),
      ...d.tradeNamesEn.map(t => t.toLowerCase()),
      ...d.tradeNamesAr.map(t => t.toLowerCase()),
      ...brands.map(b => b.toLowerCase())
    ];

    return allNames.some(name => name.includes(q));
  });
}
