# Osrawy Clinical Navigator — Codebase (Part 2 of 4)

## Part 2: Clinical Engines (Diabetes, HTN, Lipids) & Pharmacotherapy Data

> **Version:** v1.2.18
> **Repository:** Osrawy Clinical Navigator (`com.osrawy.clinicalnavigator`)
> **Architecture:** Vanilla JS / CSS3 (Phone-First Native Android Hybrid Web App via Capacitor)
> **Clinical Guidelines:** ADA 2025, ACC/AHA 2025, ESC 2024/2023, KDIGO 2024, GINA 2024, GOLD 2024
> **Quality Gate:** 15/15 JS files syntax verified, 203/203 clinical simulation assertions passed (100% pass).

## Part 2 Table of Contents

17. [www/js/i18n.js](#www-js-i18n-js) — *Bilingual internationalization engine (Arabic and English) with full clinical terminology parity.*
18. [www/js/drugs_data.js](#www-js-drugs-data-js) — *Clinical pharmacology database, trade names (Saudi SFDA and Egypt markets), dosing rules, and contraindications.*
19. [www/js/patient_sync.js](#www-js-patient-sync-js) — *Cross-engine shared patient state synchronizer, demographic/vital calculations, and persistence.*
20. [www/js/diabetes_engine.js](#www-js-diabetes-engine-js) — *ADA 2025 Type 2 Diabetes treatment engine, renal dosing, personalized screening, insulin titration, and prescription generator.*
21. [www/js/htn_engine.js](#www-js-htn-engine-js) — *ACC/AHA 2025 and ESC 2024 Hypertension engine, dual combination therapy, comorbidity rules, and hemodynamics.*
22. [www/js/lipids_engine.js](#www-js-lipids-engine-js) — *ESC 2023 / ADA 2025 lipid lowering stepper, ASCVD risk stratification, statin intensity, ezetimibe, and PCSK9i rules.*

---

<a id="www-js-i18n-js"></a>
## 17. `www/js/i18n.js`

**Description:** Bilingual internationalization engine (Arabic and English) with full clinical terminology parity.  
**Lines:** 798 | **Size:** 39.5 KB

```javascript
// ==============================================================
// Bilingual Translation Engine & Switcher (English / Arabic)
// Osrawy Clinical Navigator
// ==============================================================

const I18n = (function() {
  const STORAGE_KEY = 'osrawy_lang';
  let currentLang = 'ar'; // Default to Arabic for Saudi/Egyptian family practice clinics
  const changeListeners = [];

  const translations = {
    ar: {
      // General App Branding & Top Bar
      app_title: "دليل أوسراوي السريري",
      app_subtitle: "د. حسام يوسف · طب الأسرة",
      lang_toggle_btn: "🌐 English",
      lang_toggle_title: "Switch interface to English / التبديل إلى الإنجليزية",
      mkt_saudi_pill: "🇸🇦 السوق السعودي (SAR)",
      mkt_egypt_pill: "🇪🇬 السوق المصري (EGP)",
      btn_save_draft: "حفظ في المسودات (أوفلاين)",
      btn_save_draft_label: "حفظ المسودة",
      btn_quick_search: "البحث السريع والتنقل (Ctrl+K)",
      btn_recent_drafts: "المسودات المحفوظة",
      btn_drugs_directory: "دليل الأدوية والأسعار البديلة",
      btn_theme: "تبديل الوضع الليلي",
      btn_theme_label: "الوضع الليلي",
      btn_settings: "إعدادات الطبيب والعيادة",
      btn_settings_label: "الإعدادات",
      btn_more: "المزيد",

      // Patient Summary Bar
      bar_name: "الاسم:",
      bar_age: "العمر:",
      bar_years: "سنة",
      bar_bmi: "BMI:",
      bar_egfr: "eGFR:",
      bar_uacr: "UACR:",
      bar_bp: "الضغط:",
      bar_new_patient: "مريض جديد",

      // Bottom Navigation Bar
      nav_diabetes: "السكري",
      nav_htn: "الضغط",
      nav_dlp: "الدهون",
      nav_tools: "الأدوات",
      nav_leaflets: "النشرات",
      nav_drugs: "الأدوية والأسعار",
      nav_drafts: "المسودات",
      quick_jump_rx: "الروشتة والتوصيات ⬇",
      quick_jump_title: "انتقال سريع للروشتة والتوصيات",

      // Common Options & Labels
      opt_male: "ذكر",
      opt_female: "أنثى",
      opt_none: "لا يوجد",
      btn_delete: "حذف",
      btn_load_patient: "تحميل بيانات المريض ➔",

      // TAB 1: Diabetes Hero & Subtabs
      dia_eyebrow: "السكري النوع الثاني · البالغين · طب الأسرة",
      dia_hero_title: "دليل أوسراوي <em>لعلاج السكري</em><br>Treatment Navigator",
      dia_hero_byline: "إعداد <b>د. حسام يوسف</b>",
      tab_plan: "العلاج والروشتة",
      tab_scr: "الفحوصات والمسح",
      tab_ins: "حاسبة الإنسولين",
      tab_ref: "الأدوية والأسعار",

      // Diabetes Form: Basics
      dia_h2_pt_data: "بيانات المريض",
      dia_sub_pt_data: "تم تعبئة مريض كمثال. استبدلها ببيانات مريضك.",
      dia_cheap_desc: "<b>العلاج الفعّال الأقل تكلفة أولاً</b><br>يرتب الخيارات الاقتصادية والمثائل المحلية أولاً مع الحفاظ على حماية القلب والكلى.",
      dia_h3_basics: "البيانات الأساسية",
      lbl_pname: "اسم المريض",
      ph_pname: "مثال: أحمد محمود",
      lbl_age: "العمر (سنة)",
      lbl_sex: "الجنس",
      lbl_wt: "الوزن (كجم)",
      lbl_ht: "الطول (سم)",
      lbl_dur: "مدة السكري (سنة)",
      lbl_hf: "قصور القلب",
      opt_hf_none: "لا يوجد",
      opt_hf_ref: "HFrEF (انخفاض كسر القذف)",
      opt_hf_pef: "HFpEF / HFmrEF",

      // Diabetes Form: Labs
      dia_h3_labs: "التحاليل المخبرية",
      lbl_a1c: "السكر التراكمي HbA1c (%)",
      lbl_fpg: "سكر الصائم (مجم/ديسيلتر)",
      lbl_egfr: "معدل ترشيح الكلى eGFR (مل/دقيقة)",
      lbl_uacr: "زلال البول التراكمي UACR (مجم/جم)",

      // Diabetes Form: Comorbidities
      dia_h3_comorb: "الأمراض المصاحبة والمخاطر",
      chk_ascvd: "أمراض قلب وشرايين مؤكدة (جلطة، ذبحة، قسطرة)",
      chk_hrisk: "خطورة قلبية وعائية عالية (عمر ≥55 + عاملين خطورة)",
      chk_masld: "الكبد الدهني الأيضي (MASLD)",
      chk_smoker: "مدخن حالي أو سابق",
      chk_hypo: "عرضة لهبوط السكر المتكرر",
      chk_frail: "مريض مسن / وهن صحي عام",
      chk_catab: "أعراض هدم حادة: نقص وزن، كيتون، فرط تبول",
      chk_pancr: "تاريخ التهاب بنكرياس أو أورام الغدة الدرقية",
      chk_geni: "التهابات مسالك أو فطرية تناسلية متكررة",
      chk_preg: "حامل أو تخطط للحمل",

      // Diabetes Form: Current Therapy
      dia_h3_therapy: "العلاج الحالي",
      chk_met: "ميتفورمين (Metformin)",
      chk_su: "سلفونيل يوريا (Sulfonylurea)",
      chk_dpp: "مثبطات DPP-4 (جانوفيا، جالفوس)",
      chk_sglt: "مثبطات SGLT2 (فورسيجا، جارديانس)",
      chk_glp: "مستقبلات GLP-1 / تيرزيباتيد (أوزمبيك، مونجارو)",
      chk_pio: "بيوجليتازون (Actos)",
      chk_ins: "إنسولين قاعدي (Basal insulin)",

      // Screening Tab
      scr_title_needed: "الفحوصات المطلوبة لهذا المريض",
      scr_title_who: "من يجب فحصهم للكشف عن السكري النوع الثاني",
      scr_sub_ada: "معايير الجمعية الأمريكية للسكري (ADA) للبالغين بدون أعراض.",
      scr_item_1: "<b>جميع البالغين بعمر ≥35 سنة</b>؛ ويعاد كل 3 سنوات إذا كانت النتيجة طبيعية.",
      scr_item_2: "<b>أي عمر، كتلة جسم BMI ≥25</b> (≥23 لآسيويين) <b>+ عامل خطورة أو أكثر</b>: قريب درجة أولى، أمراض قلب، ضغط دم، كبد دهني، تكيس مبايض، خمول، شواك أسود.",
      scr_item_3: "<b>مرحلة ما قبل السكري</b>: سنوياً. <b>سكري الحمل السابق</b>: كل 3 سنوات على الأقل مدى الحياة.",
      scr_item_4: "<b>مرضى نقص المناعة</b>، <b>مضادات الذهان</b>، <b>استخدام الكورتيزون المطول</b>.",
      scr_item_5: "<b>صغار السن</b>: زيادة وزن بعد البلوغ أو عمر ≥10 + عامل خطورة.",
      scr_h3_diag: "المعايير التشخيصية للسكري",
      th_test: "الفحص",
      th_normal: "طبيعي",
      th_prediabetes: "ما قبل السكري",
      th_diabetes: "تشخيص سكري",
      td_a1c: "السكر التراكمي HbA1c",
      td_fpg: "سكر بلازما صائم",
      td_ogtt: "تحمل الجلوكوز بعد ساعتين (75 جم)",
      td_rpg: "سكر عشوائي + أعراض",
      scr_note: "في غياب الأعراض الصريحة، يتم التأكيد بفحص ثانٍ غير طبيعي. استخدم سكر البلازما بدلاً من التراكمي في حالات فقر الدم، اعتلالات الهيموجلوبين، الحمل، نقل دم حديث، أو الفشل الكلوي المتقدم.",
      scr_h2_checklist: "قائمة مراجعة الزيارة السريرية",
      scr_sub_checklist: "حدد الإجراءات المنجزة في هذه الزيارة.",

      // Insulin Tab
      ins_h2_calc: "حاسبة جرعات الإنسولين",
      ins_sub_calc: "جرعات البدء. يتم التعديل بناءً على قراءات السكر المنزلية.",
      lbl_ifpg: "متوسط سكر الصائم (مجم/ديسيلتر)",
      lbl_icur: "جرعة الإنسولين القاعدي الحالية (وحدة/يوم)",
      lbl_itdd: "إجمالي الجرعة اليومية الحالية (وحدة)",
      lbl_isens: "حساسية الإنسولين",
      opt_sens_low: "حساس: مسن، نحيف، وظائف كلى <30، خطورة هبوط",
      opt_sens_mid: "معتاد",
      opt_sens_high: "مقاوم: سمنة مفرطة، كورتيزون، تراكمي >10",
      ins_h3_regimen: "البروتوكول العلاجي",
      btn_reg_basal: "بدء قاعدي",
      btn_reg_titrate: "تعديل جرعة القاعدي",
      btn_reg_bb: "قاعدي + سريع (Basal-bolus)",
      btn_reg_premix: "مخلوط (Premixed)",
      btn_reg_switch: "التحويل بين الأنواع",
      lbl_switch_from: "نوع التحويل",
      opt_sw_nph2: "NPH مرتين يومياً ← جلارجين U100 مرة واحدة",
      opt_sw_nph1: "NPH مرة واحدة ← جلارجين U100",
      opt_sw_g100g300: "جلارجين U100 ← جلارجين U300 (توجيو)",
      opt_sw_g300g100: "جلارجين U300 ← جلارجين U100",
      opt_sw_gdeg: "جلارجين U100 ← ديجلوديك (تريسيبا)",
      opt_sw_premixbb: "إنسولين مخلوط مرتين ← نظام قاعدي وسريع",
      ins_sec_title: "أنواع الإنسولين والخصائص الدوائية",
      ins_sec_sub: "الإنسولين البشري هو الخيار الأقل تكلفة. تختلف الأسعار والتوافر محلياً؛ يُرجى التأكد مع الصيدلية.",
      th_type: "النوع",
      th_generic: "الاسم العلمي",
      th_brand: "الاسم التجاري",
      th_cost: "التكلفة",
      th_onset: "بدء المفعول",
      th_peak: "ذروة المفعول",
      th_duration: "مدة الفعالية",
      th_timing: "التوقيت",

      // Reference Tab
      ref_sec_title: "الأدوية الفموية وغير الإنسولين: الجرعات، الكلى، والأسعار",
      ref_sec_sub: "الأسماء التجارية مرتبة حسب الأقل تكلفة أولاً. مسجلة في السعودية (SFDA) ومصر. الأسعار متغيرة محلياً.",
      th_drug: "الدواء",
      th_ref_brand: "الاسم التجاري (الأقل تكلفة أولاً)",
      th_dose_range: "جرعة البدء ← القصوى",
      th_kidney_egfr: "تعديل جرعة الكلى (eGFR)",
      th_cautions: "أبرز المحاذير",

      // Footer
      dia_footer: "مبني على معايير الجمعية الأمريكية للسكري (ADA) وإرشادات KDIGO وقوائم هيئة الغذاء والدواء السعودية (SFDA). أداة دعم قرار للأطباء؛ لا تغني عن التقييم السريري المستقل. · دليل أوسراوي السريري — د. حسام يوسف",

      // TAB 2: Hypertension Hero & Form
      htn_title: "دليل أوسراوي <span>لعلاج ضغط الدم</span>",
      htn_byline: "إعداد د. حسام يوسف",
      htn_sub: "لأطباء الأسرة. أدخل متوسط قياسات الضغط المؤكدة والأمراض المصاحبة؛ سيقوم الدليل بتحديد المرحلة والهدف العلاجي والخطوة الدوائية التالية.",
      htn_legend_bp: "ضغط الدم (المتوسط المؤكد، ملم زئبق)",
      aria_systolic: "انقباضي",
      aria_diastolic: "انبساطي",
      lbl_age_years: "العمر (سنوات)",
      lbl_cur_bp_drugs: "أدوية الضغط الحالية",
      opt_meds_none: "لا يتناول (حالة جديدة)",
      opt_meds_1: "فئة واحدة (1)",
      opt_meds_2: "فئتان (2)",
      opt_meds_3: "3 فئات فأكثر مع مدر",
      lbl_cvd_risk: "احتمالية مخاطر القلب خلال 10 سنوات % (PREVENT)",
      ph_risk: "اتركه فارغاً إن لم يُحسب",
      chk_oob: "مؤكد بقياسات منزلية أو هولتر 24 ساعة",
      htn_legend_comorb: "الأمراض المصاحبة والدواعي العلاجية الخاصة",
      chk_htn_dm: "مرض السكري",
      chk_cad: "قصور شرايين القلب / بعد جلطة قلبية",
      chk_htn_hf: "قصور القلب (HFrEF)",
      chk_stroke: "جلطة دماغية سابقة أو نوبة نقص تروية عابرة",
      chk_af: "الرجفان الأذيني (AFib)",
      chk_gout: "داء النقرس (Gout)",
      chk_asthma: "الربو الشعبي (Asthma)",
      chk_bph: "تضخم البروستاتا الحميد (BPH)",
      chk_ortho: "هبوط ضغط انتصابي (عند الوقوف)",
      chk_preg_htn: "حامل أو تخطط للحمل",
      htn_legend_labs: "التحاليل المخبرية",
      lbl_k: "بوتاسيوم الدم K⁺ (مليمول/لتر)",
      hint_htn_labs: "UACR ≥30 مجم/جم يعتبر بيلة ألبومينية؛ eGFR <60 أو UACR ≥30 يعتبر قصوراً كلوياً مزمناً (CKD).",
      htn_legend_prevent: "حاسبة مخاطر القلب والشرايين خلال 10 سنوات · AHA PREVENT",
      lbl_tc: "الكوليسترول الكلي",
      lbl_hdl: "الكوليسترول النافع HDL",
      lbl_unit: "الوحدة",
      chk_statin: "يتناول ستاتين (مخفض كوليسترول)",
      hint_prevent: "تستخدم العمر، الجنس، الضغط الانقباضي، السكري، وظائف الكلى، وأدوية الضغط من الحقول أعلاه. صالحة للأعمار من 30 إلى 79 بدون مرض قلبي مسبق.",

      // HTN Recommendation & Table
      htn_sec_rec: "التوصية العلاجية",
      btn_whatsapp: "📲 واتساب",
      btn_print: "🖨️ طباعة",
      btn_copy: "📋 نسخ",
      toast_copied: "تم النسخ",
      htn_details_summary: "دليل الأدوية: الجرعات اليومية المعتادة للبالغين",
      htn_th_class: "الفئة",
      htn_th_drug: "الدواء",
      htn_th_dose: "الجرعة/يوم",
      htn_th_watch: "المحاذير والمتابعة",
      htn_td_ace: "سعال جاف، وذمة وعائية، ↑بوتاسيوم، ↑كرياتينين. مشوه للجنين.",
      htn_td_arb: "↑بوتاسيوم، ↑كرياتينين. مشوه للجنين. يُمنع مطلقاً مع مثبطات ACE.",
      htn_td_ccb: "تورم الكاحلين، توهج الوجه.",
      htn_td_thia: "↓صوديوم، ↓بوتاسيوم، ↑حمض اليوريك، ↑سكر الدم.",
      htn_td_mra: "↑بوتاسيوم، تثدي لدى الرجال (مع سبيرونولاكتون).",
      htn_td_bb: "بطء نبض، إرهاق. يفضل الانتقائي قلبياً مع مرضى الربو.",
      htn_td_preg: "الحمل",
      htn_td_preg_c: "متابعة مشتركة مع استشاري النساء والولادة.",

      // HTN Switch & Titration
      htn_tools_h: "تبديل الدواء وتعديل الجرعات",
      htn_tools_desc: "تحويل الجرعات إلى جرعة مكافئة من دواء آخر، وخطة زيادة الجرعة. يُعاد تقييم الضغط دائماً بعد 2 إلى 4 أسابيع من التعديل.",
      htn_switch_h3: "التحويل بين الأدوية",
      lbl_from: "من",
      lbl_cur_dose: "الجرعة الحالية",
      lbl_to: "إلى",
      htn_titrate_h3: "خطة زيادة الجرعة التدريجية",
      lbl_drug: "الدواء",
      htn_foot: "دعم قرار سريري فقط، مبني على إرشادات ضغط الدم لعام 2025 (AHA/ACC) وإرشادات 2024 (ESC). لا يغني عن التقييم السريري ودليل الممارسة الإكلينيكية السعودي.",

      // TAB 3: Drug Directory
      drugs_dir_title: "دليل الأدوية والأسعار البديلة",
      drugs_dir_sub: "ابحث في دليل الأدوية حسب المادة الفعالة أو الاسم التجاري وفئات الأسعار",
      drugs_btn_sa: "السوق السعودي 🇸🇦 (SAR)",
      drugs_btn_eg: "السوق المصري 🇪🇬 (EGP)",
      drugs_ph_search: "🔍 ابحث عن دواء... (مثال: Januvia, Forxiga, Metformin, Concor, Exforge)",
      drugs_lbl_cat: "التصنيف:",
      drugs_filter_all: "الكل",
      drugs_filter_diabetes: "أدوية السكر",
      drugs_filter_htn: "أدوية الضغط",
      drugs_filter_dlp: "الدهون والكوليسترول",
      drugs_filter_resp: "الربو والسدة الرئوية",
      drugs_filter_thyroid: "الغدة الدرقية",
      drugs_lbl_tier: "فئة السعر:",
      drugs_tier_all: "جميع الفئات",
      drugs_tier_1: "● اقتصادي / منخفض",
      drugs_tier_2: "●● متوسط",
      drugs_tier_3: "●●● عالي التكلفة",
      drugs_empty_found: "لم يتم العثور على أدوية مطابقة للبحث",
      drugs_empty_hint: "جرب البحث باسم المادة الفعالة أو الاسم التجاري في السوق السعودي",
      drugs_brands_label: "الأسماء التجارية",
      drugs_usual_dose: "الجرعة المعتادة:",
      drugs_renal_adj: "ضبط وظائف الكلى (eGFR):",
      drugs_cautions: "تنبيهات واحتياطات:",
      mkt_saudi_short: "السوق السعودي 🇸🇦",
      mkt_egypt_short: "السوق المصري 🇪🇬",

      // TAB 4: Recent Patients
      recent_title: "مسودات المرضى المحفوظة (أوفلاين)",
      recent_sub: "يمكنك استرجاع أو استئناف بيانات أي مريض تم حفظه خلال جلسات العيادة",
      recent_empty_title: "لا توجد مسودات مرضى محفوظة حالياً.",
      recent_empty_sub: "عند إدخال بيانات مريض، انقر على 'حفظ في المسودات' للرجوع إليها لاحقاً بدون إنترنت.",

      // Settings Modal
      settings_title: "⚙️ بيانات الطبيب والعيادة (للروشتة والطباعة)",
      settings_lbl_name: "اسم الطبيب:",
      settings_lbl_title: "التخصص والدرجة العلمية:",
      settings_lbl_clinic: "اسم العيادة / المركز الطبي:",
      settings_lbl_phone: "رقم هاتف العيادة / الواتساب:",
      settings_lbl_addr: "العنوان والمدينة:",
      settings_btn_save: "حفظ الإعدادات",
      update_sec_title: "🔄 تحديثات التطبيق (GitHub)",
      update_sec_sub: "فحص وتحميل أحدث الإصدارات من GitHub",
      btn_check_updates: "🔍 التحقق من وجود تحديثات الآن",

      // Clinical Tools: CKD-EPI 2021 & ASCVD LDL-C Goals
      title_ldl_matrix: "أهداف الكوليسترول وخطة الستاتين (ADA 2025 / ESC 2023)",
      btn_ldl_matrix_nav: "🎯 أهداف LDL والستاتين",
      btn_calc: "حاسبة",
      calc_egfr_btn_title: "حاسبة وظائف الكلى CKD-EPI 2021",
      btn_ldl_dia_trigger: "🎯 أهداف LDL وخطة الستاتين (ADA 2025)",
      btn_ldl_htn_trigger: "🎯 أهداف LDL وخطة الستاتين (ESC/ADA)",
      calc_modal_title: "حاسبة وظائف الكلى (CKD-EPI 2021)",
      calc_modal_sub: "معادلة CKD-EPI 2021 الخالية من العرق + Cockcroft-Gault CrCl",
      calc_lbl_scr: "الكرياتينين بالدم (Serum Creatinine):",
      calc_lbl_wt: "الوزن (كجم - لحساب CrCl):",
      calc_hint_unit: "1 mg/dL = 88.4 µmol/L",
      btn_apply_egfr: "✅ تطبيق الناتج على المريض",
      btn_cancel: "إلغاء",
      btn_close: "إغلاق",
      dlp_inputs_title: "بيانات الدهون ومخاطر القلب (Lipids & ASCVD)",
      lbl_ldl: "الكوليسترول الضار (LDL-C):",
      lbl_tg: "الدهون الثلاثية (TG):",
      lbl_alt: "إنزيم الكبد ALT (U/L):",
      chk_statin_intol: "عدم تحمل الستاتين (Statin Intolerant)",
      chk_on_ezetimibe: "يتناول إيزيتيميب (Ezetimibe)",
      ldl_modal_title: "أهداف الكوليسترول وخطة الستاتين (ASCVD LDL-C Goals & Statins)",
      ldl_modal_sub: "إرشادات الجمعية الأمريكية للسكري ADA 2025 والجمعية الأوروبية لأمراض القلب ESC 2023",
      vitals_egfr_label: "الترشيح الكبيبي eGFR",
      vitals_k_label: "البوتاسيوم K+",
      vitals_sbp_label: "الضغط الانقباضي SBP",
      vitals_dbp_label: "الضغط الانبساطي DBP",
      vitals_preg_label: "الحمل / Pregnancy",
      vitals_preg_no: "لا",
      vitals_preg_yes: "نعم (حامل)",
      vitals_quick_edit: "تعديل سريع",
      soap_fab_label: "ملخص SOAP",
      soap_drawer_title: "ملخص الاستشارة الطبية (SOAP)",
      soap_pull_btn: "🔄 مزامنة",
      soap_copy_btn: "📋 نسخ الملاحظة",
      handoff_enter_btn: "📱 وضع شاشة المريض",
      handoff_exit_btn: "✕ إنهاء وضع المريض"
    },

    en: {
      // General App Branding & Top Bar
      app_title: "Osrawy Navigator",
      app_subtitle: "Dr Hossam Yousuf · Family Practice",
      lang_toggle_btn: "🌐 عربي",
      lang_toggle_title: "التبديل إلى الواجهة العربية / Switch interface to Arabic",
      mkt_saudi_pill: "🇸🇦 Saudi Market (SAR)",
      mkt_egypt_pill: "🇪🇬 Egypt Market (EGP)",
      btn_save_draft: "Save to drafts (Offline)",
      btn_save_draft_label: "Save Draft",
      btn_quick_search: "Quick Search & Navigation (Ctrl+K)",
      btn_recent_drafts: "Saved Patient Drafts",
      btn_drugs_directory: "Drug Directory & Generic Alternatives",
      btn_theme: "Toggle Dark Mode",
      btn_theme_label: "Night Mode",
      btn_settings: "Doctor & Clinic Settings",
      btn_settings_label: "Settings",
      btn_more: "More",

      // Patient Summary Bar
      bar_name: "Name:",
      bar_age: "Age:",
      bar_years: "y",
      bar_bmi: "BMI:",
      bar_egfr: "eGFR:",
      bar_uacr: "UACR:",
      bar_bp: "BP:",
      bar_new_patient: "New Patient",

      // Bottom Navigation Bar
      nav_diabetes: "Diabetes",
      nav_htn: "Hypertension",
      nav_dlp: "Lipids",
      nav_tools: "Tools",
      nav_leaflets: "Leaflets",
      nav_drugs: "Drugs & Prices",
      nav_drafts: "Drafts",
      quick_jump_rx: "Live Rx & Plan ⬇",
      quick_jump_title: "Quick jump to prescription & plan",

      // Common Options & Labels
      opt_male: "Male",
      opt_female: "Female",
      opt_none: "None",
      btn_delete: "Delete",
      btn_load_patient: "Load Patient Data ➔",

      // TAB 1: Diabetes Hero & Subtabs
      dia_eyebrow: "Type 2 diabetes · adults · family practice",
      dia_hero_title: "Osrawy <em>Diabetes</em><br>Treatment Navigator",
      dia_hero_byline: "by <b>Dr Hossam Yousuf</b>",
      tab_plan: "Treatment & prescription",
      tab_scr: "Screening",
      tab_ins: "Insulin calculator",
      tab_ref: "Drugs & prices",

      // Diabetes Form: Basics
      dia_h2_pt_data: "Patient data",
      dia_sub_pt_data: "Example patient pre-filled. Replace with your patient's values.",
      dia_cheap_desc: "<b>Cheapest effective treatment first</b><br>Ranks low-cost options and local generics first, keeping heart and kidney protection.",
      dia_h3_basics: "Basics",
      lbl_pname: "Patient name",
      ph_pname: "e.g. Ahmed Mahmoud",
      lbl_age: "Age (y)",
      lbl_sex: "Sex",
      lbl_wt: "Weight (kg)",
      lbl_ht: "Height (cm)",
      lbl_dur: "Diabetes duration (y)",
      lbl_hf: "Heart failure",
      opt_hf_none: "None",
      opt_hf_ref: "HFrEF",
      opt_hf_pef: "HFpEF / HFmrEF",

      // Diabetes Form: Labs
      dia_h3_labs: "Labs",
      lbl_a1c: "HbA1c (%)",
      lbl_fpg: "Fasting glucose (mg/dL)",
      lbl_egfr: "eGFR (mL/min/1.73m²)",
      lbl_uacr: "UACR (mg/g)",

      // Diabetes Form: Comorbidities
      dia_h3_comorb: "Comorbidities & risk",
      chk_ascvd: "Established ASCVD (MI, stroke, PAD)",
      chk_hrisk: "High CV risk (age ≥55 + ≥2 risk factors / LVH)",
      chk_masld: "MASLD / fatty liver",
      chk_smoker: "Current or ex-smoker",
      chk_hypo: "High hypoglycemia risk",
      chk_frail: "Frail / limited life expectancy",
      chk_catab: "Catabolic: weight loss, polyuria, ketosis",
      chk_pancr: "Pancreatitis / MTC / MEN2 history",
      chk_geni: "Recurrent genital infections / UTI",
      chk_preg: "Pregnant or planning pregnancy",

      // Diabetes Form: Current Therapy
      dia_h3_therapy: "Current therapy",
      chk_met: "Metformin",
      chk_su: "Sulfonylurea",
      chk_dpp: "DPP-4 inhibitor",
      chk_sglt: "SGLT2 inhibitor",
      chk_glp: "GLP-1 RA / tirzepatide",
      chk_pio: "Pioglitazone",
      chk_ins: "Basal insulin",

      // Screening Tab
      scr_title_needed: "Screening needed for this patient",
      scr_title_who: "Who to screen for type 2 diabetes",
      scr_sub_ada: "ADA criteria for asymptomatic adults.",
      scr_item_1: "<b>All adults ≥35 years</b>; repeat every 3 years if normal.",
      scr_item_2: "<b>Any age, BMI ≥25 kg/m²</b> (≥23 Asian ancestry) <b>plus ≥1 risk factor</b>: first-degree relative with diabetes, CVD, hypertension, HDL &lt;35 or TG &gt;250 mg/dL, PCOS, inactivity, acanthosis nigricans, MASLD.",
      scr_item_3: "<b>Prediabetes</b>: yearly. <b>Previous GDM</b>: at least every 3 years for life.",
      scr_item_4: "<b>HIV</b>, <b>antipsychotics</b>, long-term <b>glucocorticoids</b>.",
      scr_item_5: "<b>Youth</b>: overweight, after puberty or age ≥10, plus ≥1 risk factor.",
      scr_h3_diag: "Diagnostic thresholds",
      th_test: "Test",
      th_normal: "Normal",
      th_prediabetes: "Prediabetes",
      th_diabetes: "Diabetes",
      td_a1c: "HbA1c",
      td_fpg: "Fasting plasma glucose",
      td_ogtt: "2-h OGTT (75 g)",
      td_rpg: "Random glucose + symptoms",
      scr_note: "Without clear symptoms, confirm with a second abnormal result. Use plasma glucose instead of HbA1c in anemia, hemoglobinopathy, pregnancy, recent transfusion or advanced CKD.",
      scr_h2_checklist: "Visit checklist",
      scr_sub_checklist: "Tick items done this visit.",

      // Insulin Tab
      ins_h2_calc: "Insulin dose calculator",
      ins_sub_calc: "Starting doses. Titrate on home glucose readings.",
      lbl_ifpg: "Mean fasting glucose (mg/dL)",
      lbl_icur: "Current basal dose (U/day)",
      lbl_itdd: "Current total daily dose (U)",
      lbl_isens: "Insulin sensitivity",
      opt_sens_low: "Sensitive: elderly, lean, eGFR <30, hypo risk",
      opt_sens_mid: "Usual",
      opt_sens_high: "Resistant: obese, steroids, HbA1c >10",
      ins_h3_regimen: "Regimen",
      btn_reg_basal: "Start basal",
      btn_reg_titrate: "Titrate basal",
      btn_reg_bb: "Basal-bolus",
      btn_reg_premix: "Premixed",
      btn_reg_switch: "Switch insulin",
      lbl_switch_from: "Switch",
      opt_sw_nph2: "NPH twice daily → glargine U100 once daily",
      opt_sw_nph1: "NPH once daily → glargine U100",
      opt_sw_g100g300: "Glargine U100 → glargine U300 (Toujeo)",
      opt_sw_g300g100: "Glargine U300 → glargine U100",
      opt_sw_gdeg: "Glargine U100 → degludec (Tresiba)",
      opt_sw_premixbb: "Premixed twice daily → basal-bolus",
      ins_sec_title: "Insulin products & pharmacology",
      ins_sec_sub: "Human insulins are the lowest-cost choice. Availability and prices change; confirm with the pharmacy.",
      th_type: "Type",
      th_generic: "Generic",
      th_brand: "Brand(s)",
      th_cost: "Cost",
      th_onset: "Onset",
      th_peak: "Peak",
      th_duration: "Duration",
      th_timing: "Timing",

      // Reference Tab
      ref_sec_title: "Non-insulin drugs: dose, kidney, brands, cost",
      ref_sec_sub: "Brands listed lowest cost first. Available in Saudi Arabia (SFDA) and Egypt. Prices change; confirm locally.",
      th_drug: "Drug",
      th_ref_brand: "Brand(s), lowest cost first",
      th_dose_range: "Start → max dose",
      th_kidney_egfr: "Kidney (eGFR)",
      th_cautions: "Key cautions",

      // Footer
      dia_footer: "Based on ADA Standards of Care in Diabetes, ADA/EASD consensus, KDIGO, and Saudi SFDA formularies. A decision aid for clinicians; it does not replace clinical judgement or the product label. · Osrawy Clinical Navigator — Dr Hossam Yousuf",

      // TAB 2: Hypertension Hero & Form
      htn_title: "Osrawya HTN Treatment <span>Navigator</span>",
      htn_byline: "by Dr Hossam Yousuf",
      htn_sub: "For family physicians. Enter the confirmed average BP and the patient's comorbidities; the sheet updates the stage, target and next drug step. Pre-filled with an example patient.",
      htn_legend_bp: "Blood pressure (confirmed average, mmHg)",
      aria_systolic: "Systolic",
      aria_diastolic: "Diastolic",
      lbl_age_years: "Age (years)",
      lbl_cur_bp_drugs: "Current BP drugs",
      opt_meds_none: "None (new)",
      opt_meds_1: "1 class",
      opt_meds_2: "2 classes",
      opt_meds_3: "3+ incl. diuretic",
      lbl_cvd_risk: "10-year CVD risk % (PREVENT)",
      ph_risk: "leave blank if not calculated",
      chk_oob: "Confirmed by home/ambulatory BP",
      htn_legend_comorb: "Comorbidities & compelling indications",
      chk_htn_dm: "Diabetes",
      chk_cad: "CAD / post-MI",
      chk_htn_hf: "HFrEF",
      chk_stroke: "Prior stroke / TIA",
      chk_af: "Atrial fibrillation",
      chk_gout: "Gout",
      chk_asthma: "Asthma",
      chk_bph: "BPH",
      chk_ortho: "Orthostatic hypotension",
      chk_preg_htn: "Pregnant / planning pregnancy",
      htn_legend_labs: "Labs",
      lbl_k: "K⁺ (mmol/L)",
      hint_htn_labs: "UACR ≥30 mg/g counts as albuminuria; eGFR <60 or UACR ≥30 counts as CKD.",
      htn_legend_prevent: "10-year CVD risk calculator · AHA PREVENT",
      lbl_tc: "Total cholesterol",
      lbl_hdl: "HDL cholesterol",
      lbl_unit: "Units",
      chk_statin: "On statin",
      hint_prevent: "Uses age, sex, SBP, diabetes, eGFR and BP-drug use from above. Base model, total CVD (ASCVD + heart failure). Valid for ages 30–79 without known CVD. The result fills the risk field automatically; type in that field to override it.",

      // HTN Recommendation & Table
      htn_sec_rec: "Recommendation",
      btn_whatsapp: "📲 WhatsApp",
      btn_print: "🖨️ Print",
      btn_copy: "📋 Copy",
      toast_copied: "Copied",
      htn_details_summary: "Drug reference: usual adult daily doses",
      htn_th_class: "Class",
      htn_th_drug: "Drug",
      htn_th_dose: "Dose/day",
      htn_th_watch: "Watch for",
      htn_td_ace: "Cough, angioedema, ↑K⁺, ↑creatinine. Teratogenic.",
      htn_td_arb: "↑K⁺, ↑creatinine. Teratogenic. Never with ACE inhibitor.",
      htn_td_ccb: "Ankle oedema, flushing.",
      htn_td_thia: "↓Na⁺, ↓K⁺, ↑uric acid, ↑glucose.",
      htn_td_mra: "↑K⁺, gynaecomastia (spironolactone).",
      htn_td_bb: "Bradycardia, fatigue. Cardioselective in asthma.",
      htn_td_preg: "Pregnancy",
      htn_td_preg_c: "Co-manage with obstetrics.",

      // HTN Switch & Titration
      htn_tools_h: "Switch & titrate",
      htn_tools_desc: "Convert a dose to an approximately equipotent dose of another drug, and plan dose increases. Equivalences are approximate BP-lowering equivalents from standard conversion tables; always reassess BP 2–4 weeks after a change.",
      htn_switch_h3: "Switch drug",
      lbl_from: "From",
      lbl_cur_dose: "Current dose",
      lbl_to: "To",
      htn_titrate_h3: "Titration plan",
      lbl_drug: "Drug",
      htn_foot: "Decision support only, based on the 2025 AHA/ACC High Blood Pressure Guideline and the 2024 ESC Guidelines on Elevated BP and Hypertension. It does not replace clinical judgement, local formulary or the Saudi national hypertension guideline.",

      // TAB 3: Drug Directory
      drugs_dir_title: "Drug Directory & Generic Alternatives",
      drugs_dir_sub: "Search drugs by active ingredient, brand name, and price tiers",
      drugs_btn_sa: "Saudi Market 🇸🇦 (SAR)",
      drugs_btn_eg: "Egyptian Market 🇪🇬 (EGP)",
      drugs_ph_search: "🔍 Search drug... (e.g. Januvia, Forxiga, Metformin, Concor, Exforge)",
      drugs_lbl_cat: "Category:",
      drugs_filter_all: "All",
      drugs_filter_diabetes: "Diabetes Drugs",
      drugs_filter_htn: "HTN Drugs",
      drugs_filter_dlp: "Lipids",
      drugs_filter_resp: "Asthma / COPD",
      drugs_filter_thyroid: "Thyroid",
      drugs_lbl_tier: "Price Tier:",
      drugs_tier_all: "All Tiers",
      drugs_tier_1: "● Low / Economy",
      drugs_tier_2: "●● Moderate",
      drugs_tier_3: "●●● High Cost",
      drugs_empty_found: "No drugs found matching",
      drugs_empty_hint: "Try searching by generic or brand name in Saudi market",
      drugs_brands_label: "Brand Names",
      drugs_usual_dose: "Usual Dose:",
      drugs_renal_adj: "Renal Adjustment (eGFR):",
      drugs_cautions: "Cautions & Warnings:",
      mkt_saudi_short: "Saudi Market 🇸🇦",
      mkt_egypt_short: "Egypt Market 🇪🇬",

      // TAB 4: Recent Patients
      recent_title: "Saved Patient Drafts (Offline)",
      recent_sub: "Retrieve or resume any patient saved during clinic consultations",
      recent_empty_title: "No saved patient drafts yet.",
      recent_empty_sub: "When entering patient data, click 'Save to drafts' to revisit anytime offline.",

      // Settings Modal
      settings_title: "⚙️ Doctor & Clinic Profile (For Rx & Print)",
      settings_lbl_name: "Doctor Name:",
      settings_lbl_title: "Title & Specialty:",
      settings_lbl_clinic: "Clinic / Medical Center:",
      settings_lbl_phone: "Clinic Phone / WhatsApp:",
      settings_lbl_addr: "Address & City:",
      settings_btn_save: "Save Settings",
      update_sec_title: "🔄 App Updates (GitHub)",
      update_sec_sub: "Check and download latest releases from GitHub",
      btn_check_updates: "🔍 Check for Updates Now",

      // Clinical Tools: CKD-EPI 2021 & ASCVD LDL-C Goals
      title_ldl_matrix: "🎯 ASCVD LDL-C Goals & Statin Intensity (ADA 2025 / ESC 2023)",
      btn_ldl_matrix_nav: "🎯 LDL & Statins",
      btn_calc: "Calc",
      calc_egfr_btn_title: "CKD-EPI 2021 eGFR Calculator",
      btn_ldl_dia_trigger: "🎯 LDL Goals & Statin Strategy (ADA 2025)",
      btn_ldl_htn_trigger: "🎯 LDL Goals & Statin Strategy (ESC/ADA)",
      calc_modal_title: "Kidney Function Calculator (CKD-EPI 2021)",
      calc_modal_sub: "Race-Free CKD-EPI 2021 equation + Cockcroft-Gault CrCl",
      calc_lbl_scr: "Serum Creatinine:",
      calc_lbl_wt: "Weight (kg - for CrCl):",
      calc_hint_unit: "1 mg/dL = 88.4 µmol/L",
      btn_apply_egfr: "✅ Apply eGFR to Patient",
      btn_cancel: "Cancel",
      btn_close: "Close",
      dlp_inputs_title: "Lipids & ASCVD Risk Profile",
      lbl_ldl: "LDL-C:",
      lbl_tg: "Triglycerides (TG):",
      lbl_alt: "Liver ALT (U/L):",
      chk_statin_intol: "Statin Intolerant",
      chk_on_ezetimibe: "On Ezetimibe",
      ldl_modal_title: "ASCVD LDL-C Goals & Statin Intensity Guide",
      ldl_modal_sub: "ADA Standards of Care 2025 & ESC 2023 Guidelines",
      vitals_egfr_label: "eGFR (mL/min)",
      vitals_k_label: "Serum K+ (mmol/L)",
      vitals_sbp_label: "Systolic BP (SBP)",
      vitals_dbp_label: "Diastolic BP (DBP)",
      vitals_preg_label: "Pregnancy Status",
      vitals_preg_no: "No",
      vitals_preg_yes: "Yes (Pregnant)",
      vitals_quick_edit: "Quick Edit",
      soap_fab_label: "SOAP Note",
      soap_drawer_title: "EMR SOAP Consultation Summary",
      soap_pull_btn: "🔄 Sync",
      soap_copy_btn: "📋 Copy SOAP Note",
      handoff_enter_btn: "📱 Patient Handoff Mode",
      handoff_exit_btn: "✕ Exit Patient Mode"
    }
  };

  function getLang() {
    return currentLang;
  }

  function t(key, fallback = '') {
    const dict = translations[currentLang] || translations.ar;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    const altDict = translations[currentLang === 'ar' ? 'en' : 'ar'];
    if (altDict && altDict[key] !== undefined) {
      return altDict[key];
    }
    return fallback || key;
  }

  function applyTranslations() {
    const isAr = (currentLang === 'ar');
    const htmlEl = (typeof document !== 'undefined') ? document.documentElement : null;
    if (htmlEl) {
      htmlEl.setAttribute('lang', currentLang);
      htmlEl.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    }

    if (typeof document === 'undefined') return;

    // Toggle button in header
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.textContent = isAr ? '🌐 English' : '🌐 عربي';
      langBtn.title = isAr ? 'Switch interface to English / التبديل للإنجليزية' : 'التبديل إلى الواجهة العربية / Switch to Arabic';
    }

    // Market toggle button in header
    const mktBtn = document.getElementById('market-toggle-btn');
    if (mktBtn) {
      const activeMkt = (window.DrugDirectory && window.DrugDirectory.getMarket) ? window.DrugDirectory.getMarket() : 'saudi';
      const saFull = isAr ? '🇸🇦 السوق السعودي (SAR)' : '🇸🇦 Saudi Market (SAR)';
      const egFull = isAr ? '🇪🇬 السوق المصري (EGP)' : '🇪🇬 Egypt Market (EGP)';
      const saShort = '🇸🇦 SAR';
      const egShort = '🇪🇬 EGP';
      if (activeMkt === 'saudi') {
        mktBtn.innerHTML = `<span class="market-full">${saFull}</span><span class="market-short">${saShort}</span>`;
      } else {
        mktBtn.innerHTML = `<span class="market-full">${egFull}</span><span class="market-short">${egShort}</span>`;
      }
    }

    // Text & HTML translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val) {
        el.innerHTML = val;
      }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = t(key);
      if (val) {
        el.placeholder = val;
      }
    });

    // Titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const val = t(key);
      if (val) {
        el.title = val;
      }
    });

    // Aria Labels
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      const val = t(key);
      if (val) {
        el.setAttribute('aria-label', val);
      }
    });

    // Notify registered listeners
    changeListeners.forEach(fn => {
      try { fn(currentLang); } catch(e) {}
    });
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'ar') lang = 'ar';
    currentLang = lang;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    } catch(e) {}
    applyTranslations();
  }

  function toggleLang() {
    setLang(currentLang === 'ar' ? 'en' : 'ar');
  }

  function onChange(fn) {
    if (typeof fn === 'function') changeListeners.push(fn);
  }

  function init() {
    let saved = 'ar';
    try {
      if (typeof localStorage !== 'undefined') {
        saved = localStorage.getItem(STORAGE_KEY) || 'ar';
      }
    } catch(e) {}
    setLang(saved);
  }

  return {
    init,
    getLang,
    setLang,
    toggleLang,
    t,
    onChange,
    applyTranslations
  };
})();

if (typeof window !== 'undefined') {
  window.I18n = I18n;
}
if (typeof global !== 'undefined') {
  global.I18n = I18n;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18n;
}

```

---

<a id="www-js-drugs-data-js"></a>
## 18. `www/js/drugs_data.js`

**Description:** Clinical pharmacology database, trade names (Saudi SFDA and Egypt markets), dosing rules, and contraindications.  
**Lines:** 490 | **Size:** 21.0 KB

```javascript
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
      tier: 1,
      classEn: 'Biguanide',
      classAr: 'بيجوانيد',
      genericEn: 'Metformin',
      genericAr: 'ميتفورمين',
      tradeNamesEn: ['Glucophage', 'Glucophage XR', 'Cidophage', 'Formit', 'Diaphage'],
      tradeNamesAr: ['جلوكوفاج', 'سيدوفاج', 'فورميت', 'ديافاج'],
      saudiBrandsEn: ['Glucophage', 'Glucophage XR', 'Formit'],
      saudiBrandsAr: ['جلوكوفاج', 'جلوكوفاج XR', 'فورميت'],
      egyptBrandsEn: ['Cidophage', 'Glucophage', 'Diaphage'],
      egyptBrandsAr: ['سيدوفاج', 'جلوكوفاج', 'ديافاج'],
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
      tier: 2,
      classEn: 'SGLT2 Inhibitor',
      classAr: 'مثبط SGLT2',
      genericEn: 'Empagliflozin',
      genericAr: 'إمباغليفلوزين',
      tradeNamesEn: ['Jardiance', 'Synjardy (with Metformin)', 'Mellitofix', 'Empacrystal'],
      tradeNamesAr: ['جاردينس', 'سينجاردي', 'ميليتوفيكس'],
      saudiBrandsEn: ['Jardiance', 'Synjardy (with Metformin)'],
      saudiBrandsAr: ['جاردينس', 'سينجاردي'],
      egyptBrandsEn: ['Mellitofix', 'Empacrystal', 'Jardiance'],
      egyptBrandsAr: ['ميليتوفيكس', 'إمباكريستال', 'جاردينس'],
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
      tier: 2,
      classEn: 'SGLT2 Inhibitor',
      classAr: 'مثبط SGLT2',
      genericEn: 'Dapagliflozin',
      genericAr: 'داباغليفلوزين',
      tradeNamesEn: ['Forxiga', 'Xigduo XR (with Metformin)', 'Dapagloznal', 'Dapaglif'],
      tradeNamesAr: ['فورسيجا', 'زيجدو', 'داباجلوزنال'],
      saudiBrandsEn: ['Forxiga', 'Xigduo XR (with Metformin)'],
      saudiBrandsAr: ['فورسيجا', 'زيجدو'],
      egyptBrandsEn: ['Dapagloznal', 'Dapaglif', 'Forflozin', 'Forxiga'],
      egyptBrandsAr: ['داباجلوزنال', 'داباجليف', 'فورسيجا'],
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
      tier: 3,
      classEn: 'GLP-1 Receptor Agonist',
      classAr: 'ناهض مستقبلات GLP-1',
      genericEn: 'Semaglutide',
      genericAr: 'سيماغلوتايد',
      tradeNamesEn: ['Ozempic', 'Wegovy'],
      tradeNamesAr: ['أوزمبيك', 'ويغوفي'],
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
      tier: 3,
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
      tier: 2,
      classEn: 'DPP-4 Inhibitor',
      classAr: 'مثبط DPP-4',
      genericEn: 'Sitagliptin',
      genericAr: 'سيتاغليبتين',
      tradeNamesEn: ['Januvia', 'Janumet (with Metformin)', 'Sitavia', 'Janaglip'],
      tradeNamesAr: ['جانوفيا', 'جانوميت', 'جاناجليب'],
      saudiBrandsEn: ['Januvia', 'Janumet (with Metformin)', 'Sitavia'],
      saudiBrandsAr: ['جانوفيا', 'جانوميت'],
      egyptBrandsEn: ['Janaglip', 'Sitagliptin generics', 'Januvia'],
      egyptBrandsAr: ['جاناجليب', 'سيتاجليبتين محلي', 'جانوفيا'],
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
      tier: 1,
      classEn: 'ACE Inhibitor',
      classAr: 'مثبط الإنزيم المحول للأنجيوتنسين (ACEi)',
      genericEn: 'Perindopril',
      genericAr: 'بيريندوبريل',
      tradeNamesEn: ['Coversyl', 'Coveram (with Amlodipine)', 'Preterax', 'Perindopril generics'],
      tradeNamesAr: ['كوفرسيل', 'كوفرام'],
      saudiBrandsEn: ['Coversyl', 'Coveram (with Amlodipine)', 'Preterax'],
      saudiBrandsAr: ['كوفرسيل', 'كوفرام'],
      egyptBrandsEn: ['Coversyl', 'Coveram', 'Preterax'],
      egyptBrandsAr: ['كوفرسيل', 'كوفرام', 'بريتراكس'],
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
      tier: 2,
      classEn: 'Angiotensin Receptor Blocker (ARB)',
      classAr: 'حاصر مستقبلات الأنجيوتنسين (ARB)',
      genericEn: 'Valsartan',
      genericAr: 'فالسارتان',
      tradeNamesEn: ['Diovan', 'Co-Diovan (with HCTZ)', 'Exforge (with Amlodipine)', 'Tareg'],
      tradeNamesAr: ['ديوفان', 'كو-ديوفان', 'إكسفورج', 'تاريج'],
      saudiBrandsEn: ['Diovan', 'Co-Diovan (with HCTZ)', 'Exforge (with Amlodipine)'],
      saudiBrandsAr: ['ديوفان', 'كو-ديوفان', 'إكسفورج'],
      egyptBrandsEn: ['Tareg', 'Diovan', 'Exforge', 'Co-Tareg'],
      egyptBrandsAr: ['تاريج', 'ديوفان', 'إكسفورج'],
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
      tier: 1,
      classEn: 'Dihydropyridine CCB',
      classAr: 'حاصر قنوات الكالسيوم',
      genericEn: 'Amlodipine',
      genericAr: 'أملوديبين',
      tradeNamesEn: ['Norvasc', 'Amlor', 'Vascopin', 'Alkapress'],
      tradeNamesAr: ['نورفاسك', 'أملور', 'ألكابريس'],
      saudiBrandsEn: ['Norvasc', 'Amlor', 'Vascopin'],
      saudiBrandsAr: ['نورفاسك', 'أملور'],
      egyptBrandsEn: ['Alkapress', 'Norvasc', 'Vascopin'],
      egyptBrandsAr: ['ألكابريس', 'نورفاسك'],
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
      tier: 1,
      classEn: 'Thiazide-Like Diuretic',
      classAr: 'مدر بول شبيه الثيازيد',
      genericEn: 'Indapamide',
      genericAr: 'إندابامايد',
      tradeNamesEn: ['Natrilix SR', 'Fludex', 'Indapamide SR'],
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
      tier: 1,
      classEn: 'Cardioselective Beta-Blocker',
      classAr: 'حاصر بيتا انتقائي للقلب',
      genericEn: 'Bisoprolol',
      genericAr: 'بيسوبرولول',
      tradeNamesEn: ['Concor', 'BisoCard', 'Bistol'],
      tradeNamesAr: ['كونكور', 'بيزوكارد'],
      saudiBrandsEn: ['Concor', 'BisoCard'],
      saudiBrandsAr: ['كونكور', 'بيزوكارد'],
      egyptBrandsEn: ['Concor', 'Bistol', 'Concor Plus'],
      egyptBrandsAr: ['كونكور', 'بيستول'],
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
      tier: 1,
      classEn: 'Mineralocorticoid Receptor Antagonist (MRA)',
      classAr: 'مضاد الألدوستيرون',
      genericEn: 'Spironolactone',
      genericAr: 'سبيرونولاكتون',
      tradeNamesEn: ['Aldactone', 'Spirotone', 'Spectone'],
      tradeNamesAr: ['ألداكتون'],
      saudiBrandsEn: ['Aldactone', 'Spirotone'],
      saudiBrandsAr: ['ألداكتون'],
      egyptBrandsEn: ['Spectone', 'Aldactone'],
      egyptBrandsAr: ['سبكتون', 'ألداكتون'],
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
      tier: 1,
      classEn: 'HMG-CoA Reductase Inhibitor (Statin)',
      classAr: 'ستاتين خافض للكوليسترول',
      genericEn: 'Atorvastatin',
      genericAr: 'أتورفاستاتين',
      tradeNamesEn: ['Lipitor', 'Lorvast', 'Ator', 'Tulip'],
      tradeNamesAr: ['ليبيتور', 'لورفاست', 'أتور'],
      saudiBrandsEn: ['Lipitor', 'Lorvast', 'Ator'],
      saudiBrandsAr: ['ليبيتور', 'لورفاست'],
      egyptBrandsEn: ['Ator', 'Lipitor', 'Atoreza'],
      egyptBrandsAr: ['أتور', 'ليبيتور'],
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
      tier: 2,
      classEn: 'HMG-CoA Reductase Inhibitor (Statin)',
      classAr: 'ستاتين خافض للكوليسترول',
      genericEn: 'Rosuvastatin',
      genericAr: 'روسوفاستاتين',
      tradeNamesEn: ['Crestor', 'Rosavi', 'Rovista', 'Crestolip'],
      tradeNamesAr: ['كريستور', 'روزافي', 'روفيستا'],
      saudiBrandsEn: ['Crestor', 'Rosavi'],
      saudiBrandsAr: ['كريستور', 'روزافي'],
      egyptBrandsEn: ['Rovista', 'Crestolip', 'Crestor'],
      egyptBrandsAr: ['روفيستا', 'كريستوليب', 'كريستور'],
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
      tier: 2,
      classEn: 'Cholesterol Absorption Inhibitor',
      classAr: 'مثبط امتصاص الكوليسترول',
      genericEn: 'Ezetimibe',
      genericAr: 'إيزيتيميب',
      tradeNamesEn: ['Ezetrol', 'Inegy (with Simvastatin)', 'Rosuzet (with Rosuvastatin)', 'Cholerose'],
      tradeNamesAr: ['إيزيترول', 'إينيجي', 'روزوزيت'],
      saudiBrandsEn: ['Ezetrol', 'Inegy (with Simvastatin)', 'Rosuzet (with Rosuvastatin)'],
      saudiBrandsAr: ['إيزيترول', 'إينيجي', 'روزوزيت'],
      egyptBrandsEn: ['Ezetrol', 'Cholerose', 'Atoreza'],
      egyptBrandsAr: ['إيزيترول', 'كوليروز', 'أتوريزا'],
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
      tier: 2,
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
      tier: 2,
      classEn: 'ICS + Fast-Onset LABA (MART)',
      classAr: 'كورتيزون مستنشق + موسع شعب سريع وطويل المفعول',
      genericEn: 'Budesonide / Formoterol',
      genericAr: 'بيوديسونيد / فورموتيرول',
      tradeNamesEn: ['Symbicort Turbuhaler', 'Pulmoton', 'Foracort'],
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
      tier: 1,
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
  // Backward-compatible alias for legacy UI scripts
  global.DRUGS_DATA = FORMULARY_DATA;
  global.drugsData = FORMULARY_DATA;

  // Compatibility mapping for legacy DRUG_DATABASE lookups
  const DRUG_DATABASE = {};
  FORMULARY_DATA.forEach(d => {
    const tierVal = d.tier || 1;
    const tierDesc = tierVal === 3 ? '●●● High cost' : (tierVal === 2 ? '●● Moderate' : '● Low cost');
    DRUG_DATABASE[d.id] = {
      id: d.id,
      category: d.category,
      tier: tierVal,
      cls: d.classEn,
      name: d.genericEn,
      ar: [d.genericAr, ...(d.tradeNamesAr || [])],
      saudi: {
        brands: d.saudiBrandsEn || d.tradeNamesEn || [d.genericEn],
        orig: 0,
        tier: tierVal,
        tierDesc: tierDesc,
        priceEst: ''
      },
      egypt: {
        brands: d.egyptBrandsEn || d.tradeNamesEn || [d.genericEn],
        orig: 0,
        tier: tierVal,
        tierDesc: tierDesc,
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

```

---

<a id="www-js-patient-sync-js"></a>
## 19. `www/js/patient_sync.js`

**Description:** Cross-engine shared patient state synchronizer, demographic/vital calculations, and persistence.  
**Lines:** 1062 | **Size:** 47.5 KB

```javascript
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

  function setDomValue(el, val, force) {
    if (!el || val === undefined || val === null) return;
    if (!force && typeof document !== 'undefined' && document.activeElement === el) return;
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
    const force = Boolean(isFullResetOrApply);

    // Diabetes inputs
    setDomValue($('pname'), currentPatient.name || '', force);
    setDomValue($('age'), currentPatient.age, force);
    setDomValue($('sex'), currentPatient.sex || 'm', force);
    setDomValue($('wt'), currentPatient.wt, force);
    setDomValue($('iwt'), currentPatient.wt, force);
    setDomValue($('ht'), currentPatient.ht, force);
    setDomValue($('dur'), currentPatient.dur, force);
    setDomValue($('hf'), currentPatient.hf || 'none', force);
    setDomValue($('a1c'), currentPatient.a1c, force);
    setDomValue($('fpg'), currentPatient.fpg, force);
    setDomValue($('ifpg'), currentPatient.fpg, force);
    setDomValue($('egfr'), currentPatient.egfr, force);
    setDomValue($('uacr'), currentPatient.uacr, force);
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
    setDomValue($('sbp'), currentPatient.sbp, force);
    setDomValue($('dbp'), currentPatient.dbp, force);
    setDomValue($('htn-age'), currentPatient.age, force);
    setDomValue($('htn-sex'), currentPatient.sex || 'm', force);
    setDomValue($('meds'), String(currentPatient.medsCount !== undefined ? currentPatient.medsCount : '0'), force);
    setDomChecked($('oob'), currentPatient.oob);
    setDomValue($('htn-egfr'), currentPatient.egfr, force);
    setDomValue($('htn-uacr'), currentPatient.uacr, force);
    setDomValue($('k'), currentPatient.k, force);
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
    setDomValue($('tc'), tcVal, force);
    setDomValue($('hdl'), hdlVal, force);
    setDomValue($('lunit'), lunitVal, force);

    // DLP inputs
    setDomValue($('dlp-ldl'), currentPatient.ldlC, force);
    setDomValue($('dlp-tc'), tcVal, force);
    setDomValue($('dlp-hdl'), hdlVal, force);
    setDomValue($('dlp-tg'), currentPatient.triglycerides, force);
    setDomValue($('dlp-alt'), currentPatient.altUl, force);
    setDomValue($('dlp-unit'), lunitVal, force);
    setDomChecked($('dlp-statin-intol'), currentPatient.statinIntolerant);
    setDomChecked($('dlp-ezetimibe'), currentPatient.onEzetimibe || allMeds.some(isEzetMed));

    // Tools / Primary Care mounted inputs if currently rendered
    setDomValue($('tab-age'), currentPatient.age, force);
    setDomValue($('tab-sex'), currentPatient.sex || 'm', force);
    setDomValue($('tab-wt'), currentPatient.wt, force);
    if (currentPatient.scr !== undefined && currentPatient.scr !== null && currentPatient.scr !== '' && parseFloat(currentPatient.scr) > 0) {
      setDomValue($('tab-scr'), currentPatient.scr, force);
      setDomValue($('tab-scr-unit'), currentPatient.scrUnit || 'mg', force);
    } else if (isFullResetOrApply) {
      setDomValue($('tab-scr'), 1.1, force);
      setDomValue($('tab-scr-unit'), currentPatient.scrUnit || 'mg', force);
    }
    setDomValue($('tab-kdigo-egfr'), currentPatient.egfr, force);
    setDomValue($('tab-kdigo-uacr'), currentPatient.uacr, force);
    setDomValue($('pc-thy-wt'), currentPatient.wt, force);
    setDomChecked($('pc-thy-ascvd'), currentPatient.ascvd);
    setDomChecked($('pc-thy-preg'), isPreg);
    setDomChecked($('pc-thy-asthma'), currentPatient.asthma);

    if (isFullResetOrApply) {
      setDomValue($('pc-asthma-saba'), 2, true);
      setDomValue($('pc-asthma-step'), 2, true);
      setDomValue($('pc-asthma-track'), 1, true);
      setDomChecked($('pc-asthma-day'), false);
      setDomChecked($('pc-asthma-night'), false);
      setDomChecked($('pc-asthma-limit'), false);
      setDomValue($('pc-copd-exac'), 1, true);
      setDomValue($('pc-copd-hosp'), 0, true);
      setDomValue($('pc-copd-mmrc'), 2, true);
      setDomValue($('pc-copd-cat'), 14, true);
      setDomValue($('pc-copd-eos'), 180, true);
      setDomValue($('pc-thy-tsh'), 6.8, true);
      setDomValue($('pc-thy-ft4'), 1.1, true);
      setDomValue($('tab-fib4-ast'), 38, true);
      setDomValue($('tab-fib4-alt'), 42, true);
      setDomValue($('tab-fib4-plt'), 210, true);
    }
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
    return currentPatient;
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

```

---

<a id="www-js-diabetes-engine-js"></a>
## 20. `www/js/diabetes_engine.js`

**Description:** ADA 2025 Type 2 Diabetes treatment engine, renal dosing, personalized screening, insulin titration, and prescription generator.  
**Lines:** 850 | **Size:** 63.1 KB

```javascript

/* ================= Drug knowledge base ================= */
/* br: brands cheapest-first; orig: index of originator brand; tier 1 low · 2 moderate · 3 high */
const D={
  met:{cls:"Biguanide",name:"Metformin",br:["Cidophage","Glucophage / Glucophage XR"],orig:1,tier:1,
    dose:"500 mg once–twice daily with meals; +500 mg weekly → 2000 mg/day (XR max 2000 mg)",
    renal:e=>e<30?"Contraindicated (eGFR <30)":e<45?"eGFR 30–44: max 1000 mg/day; do not start new":"No adjustment",
    caut:"GI upset (use XR), B12 deficiency; hold for contrast if eGFR <60 or acute illness",
    rx:(p,b)=>p.egfr<45?{b:`${b} 500 mg tab`,s:"1 tab twice daily after meals (max 1000 mg/day)",a:"قرص بعد الفطار وقرص بعد العشا"}
      :{b:`${b} 500 mg tab`,s:"1 tab twice daily after meals; after 2 weeks 1000 mg twice daily",a:"قرص بعد الفطار وقرص بعد العشا، وبعد أسبوعين الجرعة تزيد حسب تعليمات الطبيب"}},
  gliclazide:{cls:"Sulfonylurea",name:"Gliclazide MR",br:["Diamicron MR 30 / 60"],orig:0,tier:1,
    dose:"30 mg with breakfast → max 120 mg/day",renal:e=>e<30?"Avoid (eGFR <30)":"Lowest dose; watch hypoglycemia",
    caut:"Hypoglycemia, weight gain. Lowest hypo risk among SUs. Reduce/stop when adding insulin",
    rx:(p,b)=>({b:"Diamicron MR 30 mg tab",s:"1 tab once daily with breakfast",a:"قرص مع الفطار — ما تفوّتش الوجبة"})},
  glimepiride:{cls:"Sulfonylurea",name:"Glimepiride",br:["Dolcyl","Glimaryl","Amaryl"],orig:2,tier:1,
    dose:"1 mg with breakfast → 4 mg (max 8 mg)",renal:e=>e<30?"Avoid (eGFR <30)":"Start 1 mg",
    caut:"Hypoglycemia (more in elderly), weight gain",
    rx:(p,b)=>({b:`${b} 1 mg tab`,s:"1 tab once daily before breakfast",a:"قرص قبل الفطار — ما تفوّتش الوجبة"})},
  pio:{cls:"Thiazolidinedione",name:"Pioglitazone",br:["Pioglitazone local generics"],orig:0,tier:1,
    dose:"15 mg daily → 30 mg (max 45 mg)",renal:()=>"No adjustment",
    caut:"Contraindicated in heart failure. Edema, weight gain, fractures. Helps MASLD",
    rx:()=>({b:"Pioglitazone 15 mg tab (local generic)",s:"1 tab once daily",a:"قرص مرة يوميًا"})},
  vilda:{cls:"DPP-4 inhibitor",name:"Vildagliptin",br:["Gliptus","Veldaglose","Galvus"],orig:2,tier:2,
    dose:"50 mg twice daily (once daily with SU)",renal:e=>e<50?"50 mg once daily (eGFR <50)":"50 mg twice daily",
    caut:"Check LFTs; avoid in hepatic impairment. Do not combine with GLP-1 RA",
    rx:(p,b)=>p.egfr<50?{b:`${b} 50 mg tab`,s:"1 tab once daily",a:"قرص مرة يوميًا"}:{b:`${b} 50 mg tab`,s:"1 tab twice daily",a:"قرص الصبح وقرص بالليل"}},
  sita:{cls:"DPP-4 inhibitor",name:"Sitagliptin",br:["Sitagliptin local generics","Januvia"],orig:1,tier:2,
    dose:"100 mg once daily",renal:e=>e<30?"25 mg daily (eGFR <30)":e<45?"50 mg daily (eGFR 30–44)":"100 mg",
    caut:"Do not combine with GLP-1 RA. Rare pancreatitis, bullous pemphigoid",
    rx:(p,b)=>({b:`${b==="Januvia"?"Januvia":"Sitagliptin"} ${p.egfr<30?25:p.egfr<45?50:100} mg tab`,s:"1 tab once daily",a:"قرص مرة يوميًا"})},
  lina:{cls:"DPP-4 inhibitor",name:"Linagliptin",br:["Trajenta"],orig:0,tier:2,
    dose:"5 mg once daily",renal:()=>"No adjustment at any eGFR",caut:"Best DPP-4i choice in advanced CKD",
    rx:()=>({b:"Trajenta 5 mg tab",s:"1 tab once daily",a:"قرص مرة يوميًا"})},
  dapa:{cls:"SGLT2 inhibitor",name:"Dapagliflozin",br:["Dapagloznal","Dapaglif","Dapagliflozin-EVA","Forflozin","Forxiga"],orig:4,tier:2,
    dose:"10 mg once daily",renal:e=>e<25?"Do not start (eGFR <25); continue until dialysis":e<45?"Start for heart/kidney protection; weak glucose effect":"No adjustment",
    caut:"Genital infection, volume depletion, euglycemic DKA (hold 3 days before surgery, acute illness or prolonged fasting)",
    rx:(p,b)=>({b:`${b} 10 mg tab`,s:"1 tab once daily in the morning",a:"قرص الصبح — اشرب مية كفاية واهتم بالنظافة الشخصية"})},
  empa:{cls:"SGLT2 inhibitor",name:"Empagliflozin",br:["Jardiance"],orig:0,tier:2,
    dose:"10 mg once daily → 25 mg for glycemia",renal:e=>e<20?"Do not start (eGFR <20)":e<45?"10 mg for heart/kidney protection":"No adjustment",
    caut:"As dapagliflozin",rx:()=>({b:"Jardiance 10 mg tab",s:"1 tab once daily in the morning",a:"قرص الصبح — اشرب مية كفاية واهتم بالنظافة الشخصية"})},
  sema:{cls:"GLP-1 RA",name:"Semaglutide weekly",br:["Ozempic"],orig:0,tier:3,
    dose:"0.25 mg weekly × 4 wk → 0.5 → 1 → 2 mg (step ≥4 wk)",renal:()=>"No adjustment; avoid dehydration",
    caut:"Nausea, gallstones, retinopathy worsening with rapid A1c fall. Avoid in MTC/MEN2, pancreatitis, gastroparesis",
    rx:()=>({b:"Ozempic 0.25 mg pen",s:"0.25 mg SC once weekly × 4 weeks, then 0.5 mg weekly",a:"حقنة تحت الجلد مرة في الأسبوع في نفس اليوم"})},
  osema:{cls:"GLP-1 RA",name:"Semaglutide oral",br:["Rybelsus"],orig:0,tier:3,
    dose:"3 mg daily × 30 d → 7 mg → 14 mg; empty stomach",renal:()=>"No adjustment",caut:"As semaglutide",
    rx:()=>({b:"Rybelsus 3 mg tab",s:"1 tab daily on empty stomach × 30 days, then 7 mg",a:"قرص على الريق بنص كوباية مية، وما تاكلش لمدة نص ساعة"})},
  dula:{cls:"GLP-1 RA",name:"Dulaglutide",br:["Trulicity"],orig:0,tier:3,
    dose:"0.75 mg weekly → 1.5 → 3 → 4.5 mg",renal:()=>"No adjustment",caut:"GLP-1 RA class; CV benefit (REWIND)",
    rx:()=>({b:"Trulicity 0.75 mg pen",s:"0.75 mg SC once weekly",a:"حقنة تحت الجلد مرة في الأسبوع"})},
  lira:{cls:"GLP-1 RA",name:"Liraglutide",br:["Victoza"],orig:0,tier:3,
    dose:"0.6 mg daily × 1 wk → 1.2 → 1.8 mg",renal:()=>"No adjustment",caut:"GLP-1 RA class; CV benefit (LEADER)",
    rx:()=>({b:"Victoza pen",s:"0.6 mg SC daily × 1 week, then 1.2 mg daily",a:"حقنة تحت الجلد مرة يوميًا"})},
  tirz:{cls:"GIP/GLP-1 RA",name:"Tirzepatide",br:["Mounjaro"],orig:0,tier:3,
    dose:"2.5 mg weekly × 4 wk → +2.5 mg every 4 wk → 5–15 mg",renal:()=>"No adjustment",caut:"Largest A1c and weight reduction. GLP-1 RA contraindications",
    rx:()=>({b:"Mounjaro 2.5 mg",s:"2.5 mg SC once weekly × 4 weeks, then 5 mg weekly",a:"حقنة تحت الجلد مرة في الأسبوع في نفس اليوم"})},
  nph:{cls:"Insulin",name:"NPH human insulin",br:["Insulatard","Humulin N"],orig:0,tier:1,
    dose:"10 U or 0.1–0.2 U/kg at bedtime; see Insulin calculator",renal:e=>e<30?"Start 0.1 U/kg":"Standard",
    caut:"Nocturnal hypoglycemia more than analogues; inject at bedtime",
    rx:(p,b)=>p.curIns?{b:"Basal insulin (current product)",s:"Continue current dose; adjust 2 IU every 3 days to fasting 80–130 mg/dL",a:"استمر على نفس الجرعة وعدّلها حسب سكر الصايم"}
      :{b:`${b} 100 IU/mL pen`,s:`${p.basalDose} IU SC at bedtime; +2 IU every 3 days until fasting 80–130 mg/dL; −4 IU if <70`,a:`${p.basalDose} وحدة تحت الجلد قبل النوم، وزوّد وحدتين كل 3 أيام لحد ما الصايم يبقى بين 80 و130`}},
  glarg:{cls:"Insulin",name:"Basal analogue",br:["Lantus","Toujeo","Tresiba"],orig:0,tier:3,
    dose:"10 U or 0.1–0.2 U/kg once daily; see Insulin calculator",renal:e=>e<30?"Start 0.1 U/kg":"Standard",
    caut:"Less nocturnal hypoglycemia than NPH; higher cost",
    rx:(p,b)=>p.curIns?{b:"Basal insulin (current product)",s:"Continue current dose; adjust 2 IU every 3 days to fasting 80–130 mg/dL",a:"استمر على نفس الجرعة وعدّلها حسب سكر الصايم"}
      :{b:`${b} SoloStar 100 IU/mL`,s:`${p.basalDose} IU SC once daily at the same time; +2 IU every 3 days until fasting 80–130 mg/dL; −4 IU if <70`,a:`${p.basalDose} وحدة تحت الجلد مرة يوميًا في نفس الميعاد، وزوّد وحدتين كل 3 أيام لحد ما الصايم يبقى بين 80 و130`}},
  atorva:{cls:"Statin",name:"Atorvastatin",br:["Ator","Lipitor"],orig:1,tier:1,
    dose:"20 mg (moderate) or 40–80 mg (high intensity) at night",renal:()=>"No adjustment",caut:"ALT at baseline; myalgia",
    rx:(p,b)=>({b:`${b} ${p.ascvd?40:20} mg tab`,s:"1 tab once daily at night",a:"قرص بالليل"})}
};
const CC={"Biguanide":"leaf","Sulfonylurea":"sun","Thiazolidinedione":"sun","DPP-4 inhibitor":"sky","SGLT2 inhibitor":"teal","GLP-1 RA":"grape","GIP/GLP-1 RA":"grape","Insulin":"coral","Statin":"sky"};
const cv=c=>`--c:var(--${c});--cs:var(--${c}-soft)`;
const TIER={1:["t1","● Low cost"],2:["t2","●● Moderate"],3:["t3","●●● High cost"]};
const costChip=t=>`<span class="cost ${TIER[t][0]}">${TIER[t][1]}</span>`;
const clsChip=k=>`<span class="chip" style="${cv(CC[D[k].cls])}">${D[k].cls}</span>`;
const grp=k=>D[k].cls.includes("GLP")?"GLP":D[k].cls;

/* ================= Helpers ================= */
const escHtml=s=>s===null||s===undefined?"":String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const $=id=>document.getElementById(id);
const num=id=>parseFloat($(id).value);
const on=id=>$(id).checked;
let SHOWN=new Set(), CM=true;
function brandsHTML(k){const b=D[k].br;return CM?`<span class="first">${b[0]}</span>${b.length>1?" · "+b.slice(1).join(" · "):""}`:b.join(" · ");}
function drugBlock(keys,egfr){
  return keys.map(k=>{const d=D[k];
    const box=SHOWN.has(k)?`<span class="rx-same">listed above</span>`:`<label class="rx-pick"><input type="checkbox" class="rxck" data-k="${k}">Prescribe</label>`;
    SHOWN.add(k);
    return `<div class="drug"><div class="drug-h"><span class="nm"><b>${d.name}</b>${costChip(d.tier)}</span>${box}</div>
    <div class="brands">${brandsHTML(k)}</div>
    <span class="dose">${d.dose}</span><span class="renal">eGFR ${isNaN(egfr)?"?":egfr}: ${d.renal(egfr)}</span></div>`;}).join("");
}
const PC={1:"coral",2:"teal",3:"sun"};
function step(pri,kicker,title,why,keys){return {pri,kicker,title,why,keys:keys||[]};}
function stepHTML(s,egfr){
  return `<div class="step" data-priority="${s.pri}" style="${cv(PC[s.pri])}"><div class="k">${s.kicker}</div><h4>${s.title}</h4><p>${s.why}</p>${s.keys.length?drugBlock(s.keys,egfr):""}</div>`;
}

/* ================= Personalised screening ================= */
function screening(p){
  const G=[];
  const A=(g,c,items)=>{const it=items.filter(Boolean);if(it.length)G.push({g,c,items:it});};
  const I=(t,w,y,now)=>({t,w,y,now});
  let kidF="Yearly";
  if(p.egfr<30) kidF="Every 3 months"; else if(p.egfr<45||p.uacr>300) kidF="Every 3–4 months"; else if(p.egfr<60||p.uacr>=30) kidF="Every 6 months";
  A("Diabetes control","teal",[
    I("HbA1c",p.a1c>p.target?"Every 3 months (above target)":"Every 6 months (at target)","Adjust therapy until at goal",true),
    I("Home glucose log",p.ins?"Daily fasting ± pre-meal":"2–3 times per week","Review at each visit"),
    I("Hypoglycemia review","Every visit",p.hypo||p.ins?"High risk: insulin, SU or age":"Ask about symptoms"),
  ]);
  A("Complications","coral",[
    I("Dilated eye exam / retinal photo",p.dur<1?"Now (at diagnosis), then yearly":"Yearly (every 1–2 y if no retinopathy)","Diabetic retinopathy",p.dur<1),
    I("UACR + creatinine/eGFR",kidF,p.ckd?`CKD: eGFR ${p.egfr}, UACR ${p.uacr}`:"Diabetic kidney disease",true),
    p.egfr<30||p.uacr>300?I("Nephrology referral","Now",p.egfr<30?"eGFR <30":"UACR >300 mg/g",true):null,
    I("Comprehensive foot exam",p.ascvd||p.dur>=10?"Every visit (high risk) + yearly full exam":"Yearly; inspect feet every visit","10-g monofilament, vibration, pulses, deformity"),
    I("Neuropathy symptoms","Yearly","Including autonomic: postural dizziness, gastroparesis, ED"),
    p.age>=65||p.dur>=10||p.ascvd?I("Ankle-brachial index (ABI)","Now, repeat if symptoms",p.age>=65?"Age ≥65":p.dur>=10?"Diabetes ≥10 years":"ASCVD",true):null,
  ]);
  let ldlGoalDesc = p.ascvd ? "LDL goal <55 mg/dL" : "LDL goal <70 mg/dL";
  if (typeof LipidsEngine !== "undefined" && typeof LipidsEngine.stratifyRisk === "function") {
    try {
      const lStrat = LipidsEngine.stratifyRisk(p);
      if (lStrat && lStrat.ldlTargetMg) {
        ldlGoalDesc = `LDL goal <${lStrat.ldlTargetMg} mg/dL`;
      }
    } catch (_) {}
  }
  A("Heart & lipids","sky",[
    I("Blood pressure","Every visit","Target <130/80"),
    I("Lipid profile","Yearly",ldlGoalDesc,true),
    p.age>=40||p.ascvd?I("ECG","Baseline, then if symptoms","Silent ischemia, LVH",true):null,
    I("NT-proBNP","Consider yearly","Detect asymptomatic heart failure"),
    p.hf!=="none"?I("Echocardiography","If not done in 1 year","Heart failure follow-up"):null,
  ]);
  A("Liver & drug safety","sun",[
    I("ALT, AST, platelets → FIB-4",p.masld?"Now; FIB-4 ≥1.3 → FibroScan":"At diagnosis, then every 1–3 y","MASLD fibrosis risk",true),
    p.met?I("Vitamin B12","Yearly on metformin","Especially with neuropathy or anemia",p.dur>=4):null,
    p.sglt&&p.egfr<60?I("Creatinine & potassium","2–4 weeks after starting SGLT2i","Expected small eGFR dip"):null,
    p.ins?I("Injection sites","Every visit","Lipohypertrophy causes erratic glucose"):null,
  ]);
  const cancer=[];
  if(p.age>=45&&p.age<=75) cancer.push(I("Colorectal cancer screening","FIT yearly or colonoscopy every 10 y","Age 45–75; risk higher in diabetes"));
  if(p.sex==="f"&&p.age>=40&&p.age<=74) cancer.push(I("Mammography","Every 2 years","Women 40–74"));
  if(p.sex==="f"&&p.age>=21&&p.age<=65) cancer.push(I("Cervical screening",p.age>=30?"HPV test every 5 y (or Pap every 3 y)":"Pap every 3 y","Women 21–65"));
  if(p.smoker&&p.age>=50&&p.age<=80) cancer.push(I("Low-dose chest CT","Yearly","Smoker 50–80 with ≥20 pack-years"));
  if(p.sex==="m"&&p.age>=55&&p.age<=69) cancer.push(I("PSA","Shared decision","Men 55–69"));
  if(p.sex==="m"&&p.smoker&&p.age>=65&&p.age<=75) cancer.push(I("Abdominal aortic aneurysm US","Once","Men 65–75 who ever smoked"));
  if((p.sex==="f"&&p.age>=65)||(p.sex==="m"&&p.age>=70)||(p.pio&&p.sex==="f"&&p.age>=50)) cancer.push(I("Bone density (DXA)","Every 2 years",p.pio?"On pioglitazone + age":"Osteoporosis risk"));
  A("Age & sex-based","grape",cancer);
  A("Vaccines","leaf",[
    I("Influenza","Every year","All with diabetes"),
    I("Pneumococcal (PCV20 or PCV21)","Once if not given","All adults with diabetes"),
    p.age<60?I("Hepatitis B","3 doses if unvaccinated","Age 19–59"):I("Hepatitis B","Consider","Age ≥60"),
    p.age>=50?I("Herpes zoster (Shingrix)","2 doses, 2–6 months apart","Age ≥50"):null,
    p.age>=50?I("RSV","Single dose","Age ≥50 with diabetes"):null,
    I("COVID-19, Td/Tdap","Per national schedule; Td every 10 y",""),
  ]);
  A("Mental health & lifestyle","teal",[
    I("Depression (PHQ-2 → PHQ-9) & diabetes distress","At diagnosis, then yearly",""),
    p.age>=65?I("Cognitive screening, falls & frailty","Yearly","Age ≥65; simplify regimen if impaired"):null,
    p.bmi>=30?I("Sleep apnea (STOP-BANG)","Once, then if symptoms",`BMI ${p.bmi.toFixed(1)}`):null,
    p.smoker?I("Smoking cessation","Every visit","Offer counselling ± pharmacotherapy"):null,
    p.sex==="f"&&p.age<50?I("Contraception / pre-pregnancy counselling","Every visit","Stop SGLT2i, GLP-1 RA, statin before conception"):null,
    p.sex==="m"?I("Erectile dysfunction","Ask yearly",""):null,
    I("Dental exam","Yearly","Periodontitis worsens glycemia"),
    I("Ramadan risk assessment","6–8 weeks before Ramadan","If the patient plans to fast"),
  ]);
  return G;
}
function screeningHTML(G){
  return `<div class="scr-groups">${G.map(g=>`<div class="sg" style="${cv(g.c)}"><div class="sg-h">${g.g}<span>${g.items.length}</span></div>
    ${g.items.map(i=>`<div class="si"><div class="t">${i.t}${i.now?'<span class="now">NOW</span>':""}</div><div class="w">${i.w}</div>${i.y?`<div class="y">${i.y}</div>`:""}</div>`).join("")}</div>`).join("")}</div>`;
}

/* ================= Recommendation engine ================= */
let RXP={}, RXDEF=new Set(), RXUSER={}, SCRG=[];
function plan(){
  CM=on("cheap");
  const age=num("age"),sex=$("sex").value,wt=num("wt"),ht=num("ht"),dur=num("dur")||0,a1c=num("a1c"),fpg=num("fpg"),egfr=num("egfr"),uacr=num("uacr")||0,hf=$("hf").value;
  const bmi=wt&&ht?wt/((ht/100)**2):NaN;
  const ascvd=on("ascvd"),hrisk=on("hrisk"),masld=on("masld"),smoker=on("smoker"),hypo=on("hypo"),frail=on("frail"),catab=on("catab"),
        pancr=on("pancr"),geni=on("geni"),preg=on("preg");
  const cur={met:on("c-met"),su:on("c-su"),dpp:on("c-dpp"),sglt:on("c-sglt"),glp:on("c-glp"),pio:on("c-pio"),ins:on("c-ins")};
  const ckd=egfr<60||uacr>=30;
  const obese=bmi>=30||(bmi>=27&&(masld||ascvd||hrisk));

  let target=7.0,tnote="Most non-pregnant adults";
  if(frail){target=8.0;tnote="Frail / limited life expectancy";}
  else if(age>=75||hypo){target=7.5;tnote="Older or high hypoglycemia risk";}
  else if(age<50&&!ascvd&&!ckd&&!hypo){tnote="Consider <6.5% if reachable without hypoglycemia";}
  const gap=a1c-target;

  let h=`<div class="ph"><span class="ic">2</span><h2>Treatment plan</h2></div>`;
  const chips=[`<span class="chip">BMI ${isNaN(bmi)?"–":bmi.toFixed(1)}</span>`];
  if(CM) chips.push(`<span class="chip" style="${cv("leaf")}">Cheapest-first mode</span>`);
  if(ckd) chips.push(`<span class="chip" style="${cv("sun")}">CKD${egfr<60?` · eGFR ${egfr}`:""}${uacr>=30?` · UACR ${uacr}`:""}</span>`);
  if(hf!=="none") chips.push(`<span class="chip" style="${cv("coral")}">Heart failure</span>`);
  if(ascvd) chips.push(`<span class="chip" style="${cv("coral")}">ASCVD</span>`);
  if(obese) chips.push(`<span class="chip" style="${cv("grape")}">Weight priority</span>`);
  if(masld) chips.push(`<span class="chip" style="${cv("sun")}">MASLD</span>`);
  if(hypo||frail) chips.push(`<span class="chip" style="${cv("sky")}">Avoid hypoglycemia</span>`);
  h+=`<div class="summary">${chips.join("")}</div>`;
  const pos=v=>Math.min(100,Math.max(0,(v-5)/8*100));
  h+=`<div class="gauge-box"><div class="g-top">
      <div><div class="lbl">Current HbA1c</div><div class="big" style="color:var(--${gap>0?"coral":"leaf"})">${isNaN(a1c)?"–":a1c.toFixed(1)}%</div></div>
      <div><div class="lbl">Target</div><div class="big">&lt;${target.toFixed(1)}%</div></div>
      <div class="txt">${tnote}. Fasting 80–130 mg/dL, post-meal &lt;180.<br>${gap>0?`<b style="color:var(--coral)">${gap.toFixed(1)}% above target</b>`:`<b style="color:var(--leaf)">At target</b>`}</div></div>
      <div class="gauge"><span class="tg" style="left:${pos(target)}%"></span>${isNaN(a1c)?"":`<span class="mk" style="left:${pos(a1c)}%"></span>`}</div>
      <div class="g-scale"><span>5%</span><span>7%</span><span>9%</span><span>11%</span><span>13%</span></div></div>`;

  const P={age,sex,wt,bmi,dur,a1c,target,egfr,uacr,ckd,ascvd,hf,masld,smoker,hypo:hypo||frail,obese,met:cur.met,ins:cur.ins,pio:cur.pio,sglt:cur.sglt};

  if(preg){
    h+=`<div class="callout" style="${cv("coral")}"><b>Pregnancy / planning pregnancy:</b> insulin is the treatment of choice (NPH and regular insulin are low cost). Stop SGLT2i, GLP-1 RA, DPP-4i, SU, pioglitazone and statin; metformin only with specialist advice. Start folic acid and refer to a diabetes-in-pregnancy clinic. Targets: fasting &lt;95, 1-h &lt;140, 2-h &lt;120 mg/dL.</div>`;
    $("result").innerHTML=h; renderScreening(P);
    if (typeof window !== 'undefined' && typeof window.renderPregnancyCards === 'function') {
      window.renderPregnancyCards();
    }
    return;
  }

  const S=[],used=new Set(),avoid=[];
  const glpOK=!pancr, sgltOK=egfr>=20;
  const insKeys=CM?["nph","glarg"]:["glarg","nph"];
  const sev=catab||a1c>10||fpg>=300;

  if(sev){
    S.push(step(1,"Start now","Insulin is indicated",
      catab?"Catabolic features: start basal (or basal-bolus) insulin now. Check ketones; exclude DKA/HHS and type 1 diabetes (GAD antibodies if lean or young)."
           :`HbA1c ${a1c}% / FPG ${fpg} mg/dL: start basal insulin with oral agents. Many patients can step down once glucose toxicity resolves.${CM?" NPH at bedtime is the lowest-cost option.":""}`,insKeys));
    used.add("basal");
  }
  if(hf!=="none"){
    const activeMkt = (window.DrugDirectory && window.DrugDirectory.getMarket) ? window.DrugDirectory.getMarket() : 'saudi';
    if(sgltOK){S.push(step(1,"Heart protection · regardless of HbA1c","SGLT2 inhibitor for heart failure",
      `Reduces HF hospitalization and CV death in HFrEF and HFpEF.${CM?(activeMkt==='saudi'?" Proven cardiorenal benefit in heart failure.":" Local dapagliflozin generics keep the cost moderate."):""}`,["dapa","empa"]));used.add("sglt");}
    avoid.push("Pioglitazone (fluid retention, worsens HF)","Saxagliptin (HF hospitalization signal)");
  }
  if(ckd){
    if(sgltOK&&!used.has("sglt")){S.push(step(1,"Kidney protection · regardless of HbA1c","SGLT2 inhibitor for CKD",
      `${egfr<60?`eGFR ${egfr}`:""}${egfr<60&&uacr>=30?" with ":""}${uacr>=30?`albuminuria ${uacr} mg/g`:""}: slows kidney decline and lowers CV events. Continue until dialysis. Add ACEi/ARB at max tolerated dose if albuminuric.`,["dapa","empa"]));used.add("sglt");}
    if(!sgltOK) S.push(step(3,"Kidney","eGFR <20: SGLT2i not started","Use linagliptin, GLP-1 RA or insulin for glucose control. Refer to nephrology."));
    if(glpOK){
      if(CM) S.push(step(3,"If affordable","GLP-1 RA with kidney benefit","Semaglutide slows CKD progression (FLOW trial). Add when budget allows or targets are not met.",["sema"]));
      else {S.push(step(1,"Kidney + CV protection","GLP-1 RA with kidney benefit","Semaglutide reduces kidney progression and CV events in T2D with CKD.",["sema"]));used.add("glp");}
    }
  }
  if(ascvd||hrisk){
    if(CM){
      if(sgltOK&&!used.has("sglt")){S.push(step(1,"CV protection · lowest-cost proven option","SGLT2 inhibitor",
        "Reduces CV death and HF hospitalization; local generics cost far less than injectables.",["dapa","empa"]));used.add("sglt");}
      if(glpOK&&!used.has("glp")&&!ckd) S.push(step(3,"If affordable","GLP-1 RA with proven CV benefit","Reduces MI, stroke and CV death. Add when budget allows.",["sema","dula","lira"]));
    } else {
      if(glpOK&&!used.has("glp")){S.push(step(1,"CV protection · regardless of HbA1c","GLP-1 RA with proven CV benefit",
        ascvd?"Established ASCVD: reduces MI, stroke and CV death.":"High CV risk: GLP-1 RA or SGLT2i with proven benefit.",["sema","dula","lira"]));used.add("glp");}
      if(sgltOK&&!used.has("sglt")){S.push(step(3,"CV protection","Consider adding SGLT2 inhibitor","Additive cardiorenal benefit with GLP-1 RA.",["empa","dapa"]));used.add("sglt");}
    }
  }
  if((obese||masld)&&glpOK){
    if(!used.has("glp")){
      S.push(step(CM?3:2,CM?"If affordable":"Weight & metabolic",`${CM?"For weight: ":""}tirzepatide or semaglutide`,
        `${obese?`BMI ${bmi.toFixed(1)}: aim for 5–15% weight loss. `:""}${masld?"Improves fatty liver. ":""}Largest weight and HbA1c effect, but high cost.`,["tirz","sema"]));
      if(!CM) used.add("glp");
    } else S.push(step(3,"Weight","Escalate dose or switch to tirzepatide","For more weight loss once at full dose.",["tirz"]));
  }
  if(masld&&hf==="none"&&!CM) S.push(step(3,"Liver","Pioglitazone in MASLD","Improves steatohepatitis. Watch weight and edema.",["pio"]));

  if(egfr>=30) S.push(step(2,cur.met?"Continue":"Foundation · lowest cost",cur.met?"Continue metformin":"Metformin",
    cur.met?"Keep at maximum tolerated dose unless eGFR falls below 30.":"Cheapest drug, weight-neutral, no hypoglycemia. Start low with meals; XR if GI upset.",["met"]));
  else avoid.push("Metformin (eGFR <30)");

  if(gap>0&&!sev){
    if(gap>=1.5) S.push(step(2,"Intensity","HbA1c ≥1.5% above target: start two agents together","Combination from the start reaches target faster. Reassess every 3 months."));
    const C=[];
    const su={k:["gliclazide","glimepiride"],t:"Sulfonylurea",w:"Lowest-cost add-on with strong effect. Take with breakfast and do not skip meals. Gliclazide MR has the lowest hypoglycemia risk."};
    const pio={k:["pio"],t:"Pioglitazone",w:"Low cost, no hypoglycemia, durable effect; helps fatty liver. Watch weight gain and edema."};
    const activeMkt = (window.DrugDirectory && window.DrugDirectory.getMarket) ? window.DrugDirectory.getMarket() : 'saudi';
    const dppCost = activeMkt === 'saudi' ? 'Moderate cost (≈110–130 SAR/month). ' : 'Moderate cost with local generics (≈300 EGP/month). ';
    const sgltCost = activeMkt === 'saudi' ? 'Moderate cost (≈155–185 SAR/month). ' : 'Moderate cost with local generics (≈300 EGP/month). ';
    const dpp={k:egfr<30?["lina","vilda"]:["vilda",egfr<45?"lina":"sita"],t:"DPP-4 inhibitor",w:`${CM?dppCost:""}Weight-neutral, low hypoglycemia, safe in the elderly.`};
    const sg={k:["dapa","empa"],t:"SGLT2 inhibitor",w:`${CM?sgltCost:""}Modest weight loss, heart and kidney protection.`};
    const ins={k:insKeys,t:"Basal insulin",w:"For HbA1c far above target. NPH at bedtime is the lowest-cost insulin."};
    const glp={k:["sema","tirz","dula"],t:"GLP-1 RA or tirzepatide",w:"Most effective non-insulin option with weight loss and no hypoglycemia, but the highest cost."};
    const suOK=!(hypo||frail)&&!cur.su, pioOK=hf==="none"&&!cur.pio, dppOK=!used.has("glp")&&!cur.dpp&&!cur.glp, sgOK=!used.has("sglt")&&egfr>=45&&!geni&&!cur.sglt, glpOK2=glpOK&&!used.has("glp")&&!cur.glp;
    if(CM){ if(suOK)C.push(su); if(pioOK)C.push(pio); if(dppOK)C.push(dpp); if(sgOK)C.push(sg); if(gap>=2&&!cur.ins)C.push(ins); if(glpOK2)C.push(glp); }
    else  { if(glpOK2)C.push(glp); if(sgOK)C.push(sg); if(dppOK)C.push(dpp); if(suOK)C.push(su); if(pioOK)C.push(pio); if(gap>=2&&!cur.ins)C.push(ins); }
    const nAdd=gap>=1.5?2:1; let picked=0, pickedGLP=false;
    C.forEach((c,i)=>{
      const conflict=(c===dpp&&pickedGLP);
      const pri=(picked<nAdd&&!conflict)?2:3;
      if(pri===2){picked++; if(c===glp)pickedGLP=true;}
      S.push(step(pri,pri===2?`Glucose lowering · add-on ${picked}`:"Alternative",c.t,c.w,c.k));
    });
    if(cur.glp&&gap>=1&&!cur.ins) S.push(step(2,"Next step","Add basal insulin","Already on GLP-1 RA: add basal insulin.",insKeys));
  }
  if(cur.ins) S.push(step(3,"Insulin review","Check for overbasalization",
    `If basal dose >0.5 U/kg (${wt?Math.round(wt*0.5):"–"} U here), bedtime-to-morning drop ≥50 mg/dL, or hypoglycemia: stop increasing basal and add prandial cover or GLP-1 RA.`));
  if(age>=40||ascvd||ckd) S.push(step(2,"CV risk · low cost","Statin",
    ascvd?"Established ASCVD: high-intensity statin, LDL <55 mg/dL.":"Diabetes age 40–75: at least moderate intensity, LDL <70 mg/dL.",["atorva"]));

  if(hypo||frail) avoid.push("Glibenclamide; avoid sulfonylureas where possible","De-intensify if HbA1c <6.5% on insulin or SU");
  if(cur.dpp&&(used.has("glp"))) avoid.push("Stop the DPP-4 inhibitor when starting a GLP-1 RA");
  if(pancr) avoid.push("GLP-1 RA, tirzepatide, DPP-4i (pancreatitis, MTC or MEN2 history)");
  if(geni) avoid.push("SGLT2i: use with caution; counsel on genital hygiene");
  if(cur.su&&(sev||cur.ins)) avoid.push("Reduce or stop sulfonylurea when insulin is intensified");

  S.sort((a,b)=>a.pri-b.pri);
  SHOWN=new Set();
  const PL={1:["Start first","urgent, heart or kidney protection"],2:["Core treatment",CM?"lowest cost first":"glucose control & foundation"],3:["Options","alternatives & add-ons"]};
  let lastP=0,body="";
  S.forEach(s=>{if(s.pri!==lastP){body+=`<div class="pri-h" style="${cv(PC[s.pri])}"><span class="n">${s.pri}</span><span>${PL[s.pri][0]} <small>· ${PL[s.pri][1]}</small></span></div>`;lastP=s.pri;}body+=stepHTML(s,egfr);});
  h+=`<div class="steps">${body}</div>`;

  // default prescription
  RXDEF=new Set(); const taken=new Set();
  S.filter(s=>s.pri<=2).forEach(s=>{
    const k=s.keys.find(x=>!taken.has(grp(x))&&!(grp(x)==="DPP-4 inhibitor"&&taken.has("GLP"))&&!(grp(x)==="GLP"&&taken.has("DPP-4 inhibitor")));
    if(k){RXDEF.add(k);taken.add(grp(k));}
  });
  RXP={egfr,ascvd,curIns:cur.ins,basalDose:Math.max(10,Math.round((wt||70)*(a1c>10||catab?0.2:0.15))),age,wt,ckd,hf,obese,masld,a1c,P};

  if(avoid.length) h+=`<div class="callout" style="${cv("coral")}"><b>Avoid / adjust</b><ul>${[...new Set(avoid)].map(a=>`<li>${a}</li>`).join("")}</ul></div>`;
  h+=`<div class="pri-h" style="${cv("sky")};margin-top:22px"><span class="n">S</span><span>Screening for this patient <small>· by condition, age and sex</small></span></div><div id="scrInline" style="margin-top:10px"></div>`;
  h+=`<div id="rxwrap"></div>`;
  $("result").innerHTML=h;
  document.querySelectorAll(".rxck").forEach(c=>{const k=c.dataset.k;c.checked=k in RXUSER?RXUSER[k]:RXDEF.has(k);});
  renderScreening(P);
  renderRx();
  $("iwt").value=$("wt").value; $("ifpg").value=$("fpg").value; icalc();
  if (typeof window !== 'undefined' && typeof window.renderPregnancyCards === 'function') {
    window.renderPregnancyCards();
  }
}
function renderScreening(P){
  const sel=[...document.querySelectorAll(".rxck")].filter(c=>c.checked).map(c=>c.dataset.k);
  P.sglt=P.sglt||sel.some(k=>grp(k)==="SGLT2 inhibitor");
  P.met=P.met||sel.includes("met"); P.ins=P.ins||sel.some(k=>grp(k)==="Insulin"); P.pio=P.pio||sel.includes("pio");
  SCRG=screening(P);
  const html=screeningHTML(SCRG);
  if($("scrInline")) $("scrInline").innerHTML=html;
  $("scrPersonal").innerHTML=html;
  $("scrwho").textContent=`${$("pname").value||"Current patient"} · ${P.sex==="f"?"female":"male"}, ${isNaN(P.age)?"?":P.age} y · diabetes ${P.dur} y. Updates from the Treatment tab.`;
}

/* ================= Prescription ================= */
function renderRx(){
  const w=$("rxwrap"); if(!w) return;
  const sel=[...new Set([...document.querySelectorAll(".rxck")].filter(c=>c.checked).map(c=>c.dataset.k))];
  const p=RXP; const name=($("pname")&&$("pname").value.trim())||((typeof window !== "undefined" && window.PatientSync && window.PatientSync.get) ? window.PatientSync.get().name : "")||"Ahmed Mahmoud";
  const warn=[],by={};
  sel.forEach(k=>{(by[grp(k)]=by[grp(k)]||[]).push(D[k].name);});
  Object.values(by).forEach(a=>{if(a.length>1)warn.push(`Same class twice: ${a.join(" + ")}. Keep one.`);});
  if(by["DPP-4 inhibitor"]&&by["GLP"]) warn.push("DPP-4 inhibitor + GLP-1 RA: no added benefit. Remove the DPP-4 inhibitor.");
  if(sel.includes("pio")&&p.hf!=="none") warn.push("Pioglitazone is contraindicated in heart failure.");
  if(sel.includes("met")&&p.egfr<30) warn.push("Metformin is contraindicated at eGFR <30.");
  const dx=["Type 2 diabetes mellitus"]; if(p.ckd)dx.push("CKD"); if(p.hf!=="none")dx.push("Heart failure"); if(p.obese)dx.push("Obesity"); if(p.masld)dx.push("MASLD");
  const today=new Date(),date=today.toLocaleDateString("en-GB"),fu=new Date(today.getTime()+90*864e5).toLocaleDateString("en-GB");
  const items=sel.map(k=>{const d=D[k];return d.rx(p,CM?d.br[0]:d.br[d.orig]);});
  const totalTier=sel.reduce((m,k)=>Math.max(m,D[k].tier),0);
  const inj=sel.some(k=>["sema","lira","dula","tirz","nph","glarg"].includes(k));
  const inv=SCRG.flatMap(g=>g.items.filter(i=>i.now).map(i=>i.t));
  const fuList=["review home glucose log and HbA1c"];
  if(sel.some(k=>["sema","lira","dula","tirz"].includes(k))) fuList.push("GI tolerance and dose step-up after 4 weeks");
  if(sel.some(k=>grp(k)==="Insulin")) fuList.push("phone review of fasting readings after 1 week");
  if(sel.some(k=>grp(k)==="SGLT2 inhibitor")) fuList.push("hold SGLT2i during acute illness, vomiting, surgery or prolonged fasting");
  const genAr=["نظام غذائي: قلّل السكريات والنشويات والعيش الأبيض، وزوّد الخضار","مشي 30 دقيقة 5 أيام في الأسبوع",
    "قياس السكر صايم"+(inj?" يوميًا":" مرتين في الأسبوع")+" وتسجيله",
    "لو حسيت برعشة أو عرق أو دوخة: قيس السكر، ولو أقل من 70 خد 3 معالق سكر في مية وكرر القياس بعد ربع ساعة"];
  const drSettings = (window.RxShare && window.RxShare.loadSettings) ? window.RxShare.loadSettings() : {
    doctorName: 'Dr Hossam Yousuf',
    doctorTitle: 'Consultant Family Medicine',
    clinicName: '',
    clinicPhone: '',
    clinicAddress: ''
  };
  const _tr = (k, def) => (typeof window !== 'undefined' && window.I18n && typeof window.I18n.t === 'function') ? window.I18n.t(k, def) : def;
  let h=`<div class="rx-sec"><div class="rx-bar"><div class="pri-h" style="${cv("teal")};margin:0"><span class="n">℞</span><span>Prescription <small>· tick “Prescribe” on any drug above</small></span></div>
    <span>${totalTier?costChip(totalTier):""}</span>
    <div class="rx-action-toolbar" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
      <button type="button" class="btn btn-whatsapp" id="btn-share-whatsapp" onclick="RxShare.shareToWhatsApp()" data-i18n="btn_whatsapp">${_tr("btn_whatsapp", "📲 واتساب")}</button>
      <button type="button" class="btn btn-print" id="btn-print-rx" onclick="RxShare.printPrescription()" data-i18n="btn_print">${_tr("btn_print", "🖨️ طباعة")}</button>
      <button type="button" id="rxcopy" class="btn" data-i18n="btn_copy">${_tr("btn_copy", "📋 نسخ")}</button>
    </div>
  </div>`;
  if(warn.length) h+=`<div class="callout" style="${cv("coral")}">${warn.map(x=>`<div><b>Check:</b> ${x}</div>`).join("")}</div>`;
  h+=`<div class="rx" id="rxcard">
    <div class="rx-head">
      <div>
        <div class="rx-dr">${escHtml(drSettings.doctorName) || "Dr Hossam Yousuf"}</div>
        <div class="rx-ti">${escHtml(drSettings.doctorTitle) || "Consultant Family Medicine"}</div>
        ${drSettings.clinicName ? `<div class="rx-clinic" style="font-size:12px;opacity:.9;margin-top:2px">${escHtml(drSettings.clinicName)}</div>` : ""}
        ${drSettings.clinicPhone ? `<div class="rx-phone" style="font-size:11.5px;opacity:.8">${escHtml(drSettings.clinicPhone)}</div>` : ""}
      </div>
      <div class="rx-sym">℞</div>
    </div>
    <div class="rx-body">
    <div class="rx-pt"><span><i>Name</i>${escHtml(name)||"…………………"}</span><span><i>Age</i>${isNaN(p.age)?"—":p.age} y</span><span><i>Wt</i>${isNaN(p.wt)?"—":p.wt} kg</span><span><i>Date</i>${date}</span></div>
    <div class="rx-dx"><i>Dx</i>${dx.join(" · ")}</div>
    ${items.length?`<ol class="rx-list">${items.map(r=>`<li><b>${r.b}</b><div>${r.s}</div><div class="ar" dir="rtl" lang="ar">${r.a}</div></li>`).join("")}</ol>`:`<p class="sub" style="margin-top:10px">No drug selected.</p>`}
    ${inv.length?`<div class="rx-inv"><b>Investigations requested:</b> ${inv.join(" · ")}</div>`:""}
    <div class="rx-gen" dir="rtl" lang="ar"><b>تعليمات عامة</b><ul>${genAr.map(x=>`<li>${x}</li>`).join("")}</ul></div>
    <div class="rx-fu"><i>Follow-up</i>${fu} — ${fuList.join("; ")}.</div>
    <div class="rx-sig">Signature ____________________</div></div></div></div>`;
  w.innerHTML=h;
  const txt=[`${drSettings.doctorName || "Dr Hossam Yousuf"} — ${drSettings.doctorTitle || "Consultant Family Medicine"}`,
    drSettings.clinicName || "",
    `Name: ${name}   Age: ${p.age||""} y   Wt: ${p.wt||""} kg   Date: ${date}`,`Dx: ${dx.join(", ")}`,"",
    ...items.map((r,i)=>`${i+1}. ${r.b}\n   ${r.s}\n   ${r.a}`),"",inv.length?`Investigations: ${inv.join(", ")}`:"","تعليمات عامة:",...genAr.map(x=>"- "+x),"",`Follow-up: ${fu} — ${fuList.join("; ")}.`].filter(Boolean).join("\n");
  $("rxcopy").addEventListener("click",()=>{
    const b=$("rxcopy");
    const isAr = typeof window !== 'undefined' && window.I18n && window.I18n.getLang() === 'ar';
    const copiedTxt = (typeof window !== 'undefined' && window.I18n && window.I18n.t) ? window.I18n.t('toast_copied', isAr ? 'تم النسخ' : 'Copied') : 'Copied';
    const resetTxt = (typeof window !== 'undefined' && window.I18n && window.I18n.t) ? window.I18n.t('btn_copy', '📋 نسخ') : '📋 نسخ';
    const done=()=>{b.textContent=copiedTxt;setTimeout(()=>b.textContent=resetTxt,1500);};
    try{navigator.clipboard.writeText(txt).then(done,selectCard);}catch(e){selectCard();}
  });
}
function selectCard(){const r=document.createRange();r.selectNodeContents($("rxcard"));const s=getSelection();s.removeAllRanges();s.addRange(r);const isAr = typeof window !== 'undefined' && window.I18n && window.I18n.getLang() === 'ar';$("rxcopy").textContent=isAr ? "محدد — انسخ يدوياً" : "Selected — copy manually";}
document.addEventListener("change",e=>{
  if(e.target.classList&&e.target.classList.contains("rxck")){RXUSER[e.target.dataset.k]=e.target.checked;renderScreening(RXP.P);renderRx();}
});

/* ================= Insulin calculator ================= */
let reg="basal";
function icalc(){
  const wt=num("iwt"),fpg=num("ifpg"),curB=num("icur")||0,tdd0=num("itdd")||0,s=$("isens") ? $("isens").value : 'mid';
  if ($("iswitch")) $("iswitch").hidden=reg!=="switch";
  const f=({low:[0.1,0.3],mid:[0.15,0.4],high:[0.2,0.5]}[s]) || [0.15, 0.4];
  const R=(v,u,l)=>`<div class="res"><div class="v">${v}<small> ${u}</small></div><div class="l">${l}</div></div>`;
  if(!wt){$("iresult").innerHTML="<p>Enter weight.</p>";return;}
  let h="";
  if(reg==="basal"){
    const d=Math.max(10,Math.round(wt*f[0]));
    h=`<h2>Start basal insulin</h2><div class="res-box">${R(d,"U","Once daily: bedtime NPH, or glargine/degludec at a fixed time")}${R(Math.round(wt*0.5),"U","Overbasalization limit (0.5 U/kg)")}</div>
    <h3>Titration (patient self-adjusts)</h3><ul><li>Increase <b>2 U every 3 days</b> until fasting glucose is 80–130 mg/dL.</li>
    <li>Degludec or U300: 2–4 U twice weekly.</li><li>Fasting &lt;80 mg/dL or any hypo: <b>reduce 4 U or 10–20%</b>.</li></ul>
    <div class="callout" style="${cv("leaf")}"><b>Lowest cost:</b> Insulatard or Humulin N at bedtime. Analogues (Lantus, Toujeo, Tresiba) cause less nocturnal hypoglycemia at higher cost. Continue metformin; reduce or stop sulfonylurea.</div>`;
  }
  if(reg==="titrate"){
    let adj,msg;
    if(isNaN(fpg)){adj=0;msg="Enter fasting glucose.";}
    else if(fpg<70){adj=-Math.max(4,Math.round(curB*0.2));msg="Hypoglycemia: reduce by 20% (at least 4 U).";}
    else if(fpg<80){adj=-Math.max(2,Math.round(curB*0.1));msg="Below target: reduce by 10%.";}
    else if(fpg<=130){adj=0;msg="At target: keep dose. If HbA1c is still high, add prandial cover.";}
    else if(fpg<=180){adj=2;msg="Above target: +2 U.";}
    else{adj=4;msg="Well above target: +4 U (or +10%).";}
    const nd=Math.max(0,curB+adj);
    h=`<h2>Titrate basal insulin</h2><div class="res-box">${R(curB,"U","Current basal")}${R((adj>0?"+":"")+adj,"U","Change")}${R(nd,"U","New dose")}</div><p>${msg}</p>`;
    if(nd>wt*0.5) h+=`<div class="callout" style="${cv("coral")}"><b>Overbasalization:</b> ${nd} U exceeds 0.5 U/kg (${Math.round(wt*0.5)} U). Stop increasing basal. Add a GLP-1 RA, or prandial insulin at the largest meal (4 U or 10% of basal).</div>`;
    if(!curB) h+=`<p class="note">Enter the current basal dose.</p>`;
  }
  if(reg==="bb"){
    const tdd=Math.round(wt*f[1]),b=Math.round(tdd/2),m=Math.round(tdd/6),icr=Math.round(450/tdd),isf=Math.round(1700/tdd);
    h=`<h2>Basal-bolus regimen</h2><p class="sub">For HbA1c &gt;10%, catabolic patients, or failure of basal + GLP-1 RA. TDD = ${f[1]} U/kg.</p>
    <div class="res-box">${R(tdd,"U","Total daily dose")}${R(b,"U","Basal (50%) once daily")}${R(m,"U","Rapid-acting per meal ×3")}</div>
    <div class="res-box">${R("1:"+icr,"g","Insulin:carb ratio (450 rule)")}${R(isf,"mg/dL","Drop per 1 U (1700 rule)")}</div>
    <h3>Stepwise alternative (basal-plus)</h3><ul><li>Add <b>${Math.max(4,Math.round(b*0.1))} U</b> rapid-acting before the largest meal.</li>
    <li>Titrate 1–2 U every 3 days until 2-h post-meal &lt;180 mg/dL; add 2nd and 3rd meal doses if needed.</li></ul>
    <h3>Correction scale with each meal</h3><div class="tbl"><table style="min-width:300px"><thead><tr><th>Pre-meal glucose</th><th>Extra rapid-acting</th></tr></thead><tbody>
    <tr><td class="mono">150–199</td><td class="mono">+1 U</td></tr><tr><td class="mono">200–249</td><td class="mono">+2 U</td></tr>
    <tr><td class="mono">250–299</td><td class="mono">+3 U</td></tr><tr><td class="mono">300–349</td><td class="mono">+4 U</td></tr>
    <tr><td class="mono">≥350</td><td class="mono">+5 U, check ketones</td></tr></tbody></table></div>
    <p class="note">Lowest cost: Insulatard + Actrapid 30 min before meals. Analogues: NovoRapid, Humalog, Apidra.</p>`;
  }
  if(reg==="premix"){
    const k=f[1]-0.1,tdd=Math.round(wt*k),am=Math.round(tdd*2/3),pm=tdd-am;
    h=`<h2>Premixed insulin twice daily</h2><p class="sub">For fixed meal routines and patients who cannot manage multiple injections. TDD = ${k.toFixed(2)} U/kg.</p>
    <div class="res-box">${R(tdd,"U","Total daily dose")}${R(am,"U","Before breakfast (⅔)")}${R(pm,"U","Before dinner (⅓)")}</div>
    <ul><li>Morning dose: titrate on pre-dinner glucose. Evening dose: titrate on fasting glucose.</li>
    <li>Adjust 2 U (10%) every 3 days to 80–130 mg/dL; reduce 10–20% for hypoglycemia.</li>
    <li>Mixtard 30 / Humulin 70/30 (low cost): 30 min before meals. NovoMix 30 / Humalog Mix: just before meals.</li><li>Stop sulfonylurea; continue metformin.</li></ul>
    <div class="callout"><b>Ramadan or irregular meals:</b> premixed carries higher hypoglycemia risk; consider basal + oral agents.</div>`;
  }
  if(reg==="switch"){
    const fr=$("ifrom").value;let out=0,txt="";
    if(fr==="nph2"){out=Math.round(curB*0.8);txt="Total NPH × 0.8, given once daily.";}
    if(fr==="nph1"){out=curB;txt="Unit-for-unit.";}
    if(fr==="g100g300"){out=curB;txt="1:1. Expect 10–18% higher U300 needs; titrate every 3–4 days.";}
    if(fr==="g300g100"){out=Math.round(curB*0.8);txt="Reduce by about 20%.";}
    if(fr==="gdeg"){out=curB;txt="1:1. Titrate no more than twice weekly.";}
    if(fr==="premixbb"){const t=tdd0||curB;out=Math.round(t*0.8);txt=`TDD ${t} U × 0.8 = ${out} U: basal ${Math.round(out/2)} U once daily + rapid-acting ${Math.round(out/6)} U before each meal.`;}
    h=`<h2>Switch insulin</h2><div class="res-box">${R(fr==="premixbb"?(tdd0||curB):curB,"U","Current dose")}${R(out,"U","New starting dose")}</div><p>${txt}</p>
    ${(!curB&&!(fr==="premixbb"&&tdd0))?'<p class="note">Enter the current basal dose (or TDD for premixed).</p>':""}`;
  }
  h+=`<div class="callout" style="${cv("coral")}"><b>Hypoglycemia (&lt;70 mg/dL):</b> 15 g fast sugar (3 tsp sugar in water or 150 mL juice), recheck in 15 min, repeat, then a snack. Severe: glucagon or IV dextrose. Review the dose after any episode.</div>`;
  $("iresult").innerHTML=h;
}

/* ================= Tables ================= */
function buildRef(){
  const m = (window.DrugDirectory && window.DrugDirectory.getMarket) ? window.DrugDirectory.getMarket() : 'saudi';
  const headerBrand = (m === 'saudi') ? "Saudi SFDA Brand(s)" : "Egypt Brand(s)";
  const thRef = document.getElementById("th-ref-brand");
  if (thRef) thRef.textContent = headerBrand;
  const thIns = document.getElementById("th-ins-brand");
  if (thIns) thIns.textContent = headerBrand;
  const refSub = document.getElementById("ref-sec-sub");
  if (refSub) {
    refSub.textContent = (m === 'saudi') 
      ? "Brands listed lowest cost first (Saudi SFDA market in SAR). Example prices: Metformin (Dialon) ≈ 15 SAR; Forxiga ≈ 165 SAR; Januvia ≈ 125 SAR. Prices change; confirm locally."
      : "Brands listed lowest cost first (Egyptian market in EGP). Example prices: Cidophage ≈ 35 EGP; Dapagloznal ≈ 300 EGP; Gliptus ≈ 220 EGP. Prices change; confirm locally.";
  }

  const order=["met","gliclazide","glimepiride","pio","vilda","sita","lina","dapa","empa","sema","osema","dula","lira","tirz","atorva"];
  let last="",rows="";
  order.forEach(k=>{const d=D[k];
    if(d.cls!==last){rows+=`<tr><td class="cls" colspan="6" style="${cv(CC[d.cls])}">${d.cls}</td></tr>`;last=d.cls;}
    const vals=[90,44,29,15].map(e=>d.renal(e));
    const ren=new Set(vals).size===1?vals[0]:["≥45","30–44","20–29","&lt;20"].map((l,i)=>`<span class="mono">${l}:</span> ${vals[i]}`).join("<br>");
    rows+=`<tr><td><b>${d.name}</b></td><td class="mono"><span style="color:var(--leaf);font-weight:600">${d.br[0]}</span>${d.br.length>1?"<br>"+d.br.slice(1).join("<br>"):""}</td><td>${costChip(d.tier)}</td><td>${d.dose}</td><td style="font-size:12.5px">${ren}</td><td style="font-size:12.5px">${d.caut}</td></tr>`;
  });
  rows+=`<tr><td class="cls" colspan="6" style="${cv("teal")}">Fixed-dose combinations</td></tr>
  <tr><td><b>One-tablet combos</b></td><td class="mono">${m==='saudi'?'Janumet, Synjardy, Xigduo XR, Galvumet, Jentadueto':'Gliptus Plus, Galvus Met, Janumet, Trajenta Duo, Xigduo XR, Synjardy'}</td><td>${costChip(2)}</td><td colspan="3">Fewer tablets improve adherence. Dose by the metformin component and eGFR.</td></tr>`;
  const tbody = document.querySelector("#reftbl tbody");
  if (tbody) tbody.innerHTML=rows;
}
function buildIns(){
  const row=(t,g,b,c,o,p,d,ti)=>`<tr><td>${t}</td><td>${g}</td><td class="mono">${b}</td><td>${costChip(c)}</td><td class="mono">${o}</td><td class="mono">${p}</td><td class="mono">${d}</td><td>${ti}</td></tr>`;
  const sec=(t,c)=>`<tr><td class="cls" colspan="8" style="${cv(c)}">${t}</td></tr>`;
  $("instbl").innerHTML=
    sec("Basal","grape")+
    row("Human","NPH (isophane)","Insulatard, Humulin N",1,"1–2 h","4–10 h","12–16 h","Bedtime or twice daily")+
    row("Analogue","Glargine U100","Lantus SoloStar",3,"1–2 h","none","~24 h","Once daily, same time")+
    row("Analogue","Glargine U300","Toujeo SoloStar",3,"6 h","none","&gt;24 h","Once daily")+
    row("Analogue","Degludec","Tresiba FlexTouch",3,"1 h","none","&gt;42 h","Once daily, flexible")+
    sec("Prandial","coral")+
    row("Human","Regular insulin","Actrapid, Humulin R",1,"30 min","2–4 h","6–8 h","30 min before meal")+
    row("Analogue","Aspart","NovoRapid, Fiasp",3,"10–15 min","1–2 h","3–5 h","0–15 min before meal")+
    row("Analogue","Lispro","Humalog KwikPen",3,"10–15 min","1–2 h","3–5 h","0–15 min before meal")+
    row("Analogue","Glulisine","Apidra SoloStar",3,"10–15 min","1–2 h","3–5 h","0–15 min before meal")+
    sec("Premixed & co-formulations","sun")+
    row("Human","NPH/Regular 70/30","Mixtard 30, Humulin 70/30",1,"30 min","dual","12–16 h","30 min before breakfast &amp; dinner")+
    row("Analogue","Aspart mix 70/30","NovoMix 30",3,"10–20 min","dual","≤24 h","Just before meals")+
    row("Analogue","Lispro mix 25 / 50","Humalog Mix 25, Mix 50",3,"15 min","dual","≤24 h","Just before meals")+
    row("Co-formulation","Degludec/aspart 70/30","Ryzodeg 70/30",3,"10–20 min","prandial","&gt;24 h","With main meal(s)");
}
const CK=[["HbA1c","Every 3–6 months"],["Blood pressure, weight, BMI","Every visit"],["Glucose log / CGM review","Every visit"],["Hypoglycemia assessment","Every visit"],
 ["UACR + eGFR","Yearly or more often in CKD"],["Lipid profile","Yearly"],["Eye exam","Yearly"],["Foot exam","Yearly; inspect every visit"],["FIB-4","Every 1–3 years"],
 ["Vitamin B12 (on metformin)","Yearly"],["Depression screen","Yearly"],["Vaccines up to date","Influenza yearly"],["Dental referral","Yearly"],["Smoking status","Every visit"],["Diabetes education","At diagnosis and yearly"]];
function buildCK(){
  $("cklist").innerHTML=CK.map((c,i)=>`<label class="ck"><input type="checkbox" id="ck${i}"><span>${c[0]}<small>${c[1]}</small></span></label>`).join("");
  const upd=()=>{const n=CK.filter((_,i)=>$("ck"+i).checked).length;$("ckprog").textContent=`${n}/${CK.length} done`;};
  $("cklist").addEventListener("change",upd);upd();
}

/* ================= Market Adaptor ================= */
function applyMarketToD(market) {
  const m = market || (window.DrugDirectory && window.DrugDirectory.getMarket ? window.DrugDirectory.getMarket() : 'saudi');
  for (const k in D) {
    if (window.DRUG_DATABASE && window.DRUG_DATABASE[k]) {
      const entry = window.DRUG_DATABASE[k];
      const mkt = entry[m] || entry.saudi;
      if (mkt) {
        D[k].br = mkt.brands;
        D[k].orig = mkt.orig;
        D[k].tier = mkt.tier;
        if (entry.rx) D[k].rx = entry.rx;
      }
    }
  }
  buildRef();
  plan();
}
window.applyMarketToD = applyMarketToD;
window.plan = plan;
window.dmResetRxUser = () => { RXUSER = {}; };

/* ================= Wiring ================= */
document.querySelectorAll("nav.tabs button").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("nav.tabs button").forEach(x=>x.setAttribute("aria-selected",x===b));
  document.querySelectorAll(".tab").forEach(s=>s.hidden=s.id!==b.dataset.tab);
  window.scrollTo({top:0});
}));
document.querySelectorAll("#iseg button").forEach(b=>b.addEventListener("click",()=>{
  reg=b.dataset.r;document.querySelectorAll("#iseg button").forEach(x=>x.setAttribute("aria-pressed",x===b));icalc();
}));
$("pform").addEventListener("input",plan);
$("pform").addEventListener("change",plan);
["iwt","ifpg","icur","itdd","isens","ifrom"].forEach(id=>$(id).addEventListener("input",icalc));

// Apply Saudi market formulary as default
if (window.DRUG_DATABASE) {
  applyMarketToD('saudi');
} else {
  buildRef();
  buildIns();
  buildCK();
  plan();
}
buildIns();
buildCK();

// Cross-engine clinical safety alerts listener
(function() {
  const target = (typeof window !== 'undefined') ? window : globalThis;
  if (target && target.addEventListener && !target.__osrawyGuardrailListenerAttached) {
    target.__osrawyGuardrailListenerAttached = true;
    target.addEventListener('osrawy:patient-updated', function(ev) {
      const banner = document.getElementById('clinical-guardrail-banner');
      if (!banner) return;
      const guardrails = (ev && ev.detail && ev.detail.guardrails) || [];
      let list = [];
      if (Array.isArray(guardrails)) list = guardrails;
      else if (guardrails && Array.isArray(guardrails.alerts)) list = guardrails.alerts;
      else if (guardrails && typeof guardrails === 'object') list = Object.values(guardrails).filter(Boolean);

      if (list.length === 0) {
        banner.hidden = true;
        banner.style.display = 'none';
        banner.innerHTML = '';
        return;
      }

      banner.hidden = false;
      banner.style.display = 'block';
      banner.innerHTML = list.map(function(item) {
        var text = typeof item === 'string' ? item : (item.text || item.message || item.title || '');
        var rawType = String((typeof item === 'object' && (item.type || item.level)) || 'danger').toLowerCase();
        var cssType = (rawType === 'critical' || rawType === 'danger' || rawType === 'error')
          ? 'danger'
          : (rawType === 'warn' || rawType === 'warning' ? 'warn' : 'info');
        var icon = (typeof item === 'object' && item.icon) ||
          (cssType === 'danger' ? '🚨' : (cssType === 'warn' ? '⚠️' : 'ℹ️'));
        return '<div class="guardrail-item ' + cssType + '"><span class="guardrail-icon">' + escHtml(icon) + '</span><div class="guardrail-msg">' + escHtml(text) + '</div></div>';
      }).join('');
    });
  }
})();

// ==============================================================
// Osrawy Diabetes in Pregnancy & Obstetric Glycemia Protocol
// Guidelines: ADA Standards of Care 2024-2025 / ACOG / NICE
// ==============================================================

const OsrawyDmPregnancy = (function() {
  function evaluatePregnancyDmProtocol(patientInput) {
    const pt = patientInput || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});
    const wt = parseFloat(pt.wt !== undefined ? pt.wt : (pt.weightKg !== undefined ? pt.weightKg : pt.weight)) || 70;
    const isPregnant = !!(pt.pregnancy || pt.preg || pt.isPregnant || pt.pregHtn);
    const isPostpartum = !!(pt.postpartum || (pt.comorbidities && pt.comorbidities.postpartum));
    let trimester = parseInt(pt.trimester, 10);
    const weeks = parseFloat(pt.gestationalWeeks !== undefined ? pt.gestationalWeeks : (pt.weeks !== undefined ? pt.weeks : 16)) || 16;

    // Deduce trimester if not specified or invalid
    if (!trimester || isNaN(trimester) || trimester < 1 || trimester > 3) {
      if (weeks <= 13) trimester = 1;
      else if (weeks <= 26) trimester = 2;
      else trimester = 3;
    }

    const alerts = [];

    // 1. Stop oral/injectable non-insulin DM agents
    const stoppedAgents = [
      { classEn: 'Biguanides', name: 'Metformin', reasonEn: 'Crosses placenta; insulin is preferred first-line', reasonAr: 'يعبر المشيمة والإنسولين هو الخيار الأول' },
      { classEn: 'SGLT2 inhibitors', name: 'Dapagliflozin, Empagliflozin', reasonEn: 'Contraindicated; fetal renal abnormalities in animal studies', reasonAr: 'ممنوع تماماً؛ تشوهات كلوية جنينية' },
      { classEn: 'GLP-1 RA / Dual GIP/GLP-1', name: 'Semaglutide, Tirzepatide, Dulaglutide, Liraglutide', reasonEn: 'Contraindicated; embryonic toxicity in animal studies', reasonAr: 'ممنوع تماماً؛ سمية جنينية في الدراسات' },
      { classEn: 'Sulfonylureas', name: 'Glimepiride, Gliclazide, Glibenclamide', reasonEn: 'Risk of fetal hyperinsulinemia, macrosomia, and severe neonatal hypoglycemia', reasonAr: 'خطر هبوط سكر وليدي حاد وتضخم الجنين' },
      { classEn: 'DPP-4 inhibitors', name: 'Sitagliptin, Vildagliptin, Linagliptin', reasonEn: 'Insufficient pregnancy safety data; discontinue', reasonAr: 'عدم كفاية بيانات الأمان في الحمل' },
      { classEn: 'TZDs', name: 'Pioglitazone', reasonEn: 'Contraindicated; fluid retention, fetal harm', reasonAr: 'ممنوع تماماً في الحمل' }
    ];

    alerts.push({
      id: 'dm-preg-stop-non-insulin',
      code: 'STOP_NON_INSULIN_PREGNANCY_DRUGS',
      level: 'critical',
      type: 'critical',
      titleEn: 'Stop All Non-Insulin DM Agents: Switch to Multi-Dose Insulin',
      titleAr: 'إيقاف جميع خافضات السكر الفموية وغير الإنسولينية: التحويل للإنسولين',
      messageEn: 'All oral and injectable non-insulin antidiabetic agents (Metformin, SGLT2i, GLP-1 RA, Tirzepatide, Sulfonylureas, DPP-4i, TZDs) must be stopped. Insulin is the gold standard and sole recommended pharmacotherapy for diabetes in pregnancy (ADA Standards of Care 2024/2025).',
      messageAr: 'يجب إيقاف جميع حبوب وحقن السكر غير الإنسولينية فوراً (ميتفورمين، مثبطات SGLT2، منشطات GLP-1، مونجارو، سلفونيل يوريا). الإنسولين هو العلاج الذهبي والوحيد المعتمد والآمن في الحمل.',
      actionEn: 'Discontinue oral/GLP-1 agents immediately; initiate intensive basal-bolus insulin therapy.',
      actionAr: 'أوقف الأدوية الفموية فوراً وابدأ نظام الإنسولين المكثف (قاعدي وسريع).'
    });

    // 2. Trimester-specific weight-based insulin dosing
    // TDD: 0.7 for T1, 0.8 for T2, 0.9 for T3 U/kg/day; 50% basal, 50% prandial across 3 meals
    let tddMultiplier = 0.8;
    let trimesterNameEn = '2nd Trimester (Weeks 14–26)';
    let trimesterNameAr = 'الثلث الثاني (الأسابيع 14–26)';
    if (trimester === 1) {
      tddMultiplier = 0.7;
      trimesterNameEn = '1st Trimester (Weeks 1–13)';
      trimesterNameAr = 'الثلث الأول (الأسابيع 1–13)';
    } else if (trimester === 3) {
      tddMultiplier = 0.9;
      trimesterNameEn = '3rd Trimester (Weeks 27–40)';
      trimesterNameAr = 'الثلث الثالث (الأسابيع 27–40)';
    }

    const tdd = Math.round(wt * tddMultiplier * 10) / 10;
    const basalTotal = Math.round(tdd * 0.5 * 10) / 10;
    const prandialTotal = Math.round(tdd * 0.5 * 10) / 10;
    const prandialPerMeal = Math.round((prandialTotal / 3) * 10) / 10;

    const basalUnits = Math.round(tdd * 0.5);
    const prandialTotalUnits = Math.round(tdd * 0.5);
    const mealBolusUnits = Math.round(prandialTotalUnits / 3);

    const insulinDosing = {
      weightKg: wt,
      trimester,
      trimesterNameEn,
      trimesterNameAr,
      multiplier: tddMultiplier,
      tdd,
      tddUnits: Math.round(tdd),
      basalTotal,
      basalUnits,
      prandialTotal,
      prandialTotalUnits,
      prandialPerMeal,
      prandialPerMealUnits: mealBolusUnits,
      mealBolusUnits,
      mealBolus: mealBolusUnits,
      split: '50% Basal / 50% Prandial across 3 meals',
      basalRegimenEn: `Basal Insulin: ${basalUnits} units/day (e.g. NPH insulin divided twice daily [2/3 morning, 1/3 bedtime] OR Insulin Detemir/Glargine once/twice daily)`,
      basalRegimenAr: `الإنسولين القاعدي: ${basalUnits} وحدة/يوم (إنسولين NPH مقسم مرتين يومياً [ثلثين صباحاً وثلث قبل النوم] أو ديتيمير/لانتوس)`,
      prandialRegimenEn: `Prandial Insulin: ${prandialTotalUnits} units/day divided into ~${mealBolusUnits} units before each of 3 main meals (Breakfast: ${mealBolusUnits} U, Lunch: ${mealBolusUnits} U, Dinner: ${mealBolusUnits} U) using rapid analogue (Aspart or Lispro)`,
      prandialRegimenAr: `إنسولين الوجبات السريع: ${prandialTotalUnits} وحدة/يوم مقسمة ~${mealBolusUnits} وحدات قبل كل وجبة من الوجبات الـ 3 الرئيسية (فطور، غداء، عشاء) باستخدام إنسولين سريع المفعول (نوفورابيد أو هيومالوج)`
    };

    // 3. High-dose Folic Acid 5 mg/day (weeks 1-12)
    const isFirstTrimesterFolic = !isPostpartum && (weeks <= 12 || trimester === 1);
    const folicAcid = {
      indicated: isFirstTrimesterFolic,
      dose: '5 mg/day orally',
      timing: 'Preconception up to 12 weeks of gestation',
      titleEn: 'High-Dose Folic Acid (5 mg/day) - Early Pregnancy (Weeks 1–12)',
      titleAr: 'حمض الفوليك بجرعة عالية (5 مجم/يوم) - الحمل المبكر (الأسابيع 1–12)',
      messageEn: 'High-dose Folic Acid 5 mg once daily is strongly indicated from preconception through the first 12 weeks of gestation for women with pre-existing diabetes to prevent neural tube defects and major congenital anomalies.',
      messageAr: 'يُوصى بحمض الفوليك بجرعة عالية (5 مجم يومياً) من قبل الحمل وحتى نهاية الأسبوع الـ 12 من الحمل لمرضى السكري للوقاية من تشوهات الأنبوب العصبي والتشوهات الخلقية الكبرى للجنين.'
    };
    if (isFirstTrimesterFolic) {
      alerts.push({
        id: 'dm-preg-folic-acid-high-dose',
        level: 'info',
        type: 'info',
        titleEn: folicAcid.titleEn,
        titleAr: folicAcid.titleAr,
        messageEn: folicAcid.messageEn,
        messageAr: folicAcid.messageAr,
        actionEn: 'Prescribe Folic Acid 5 mg PO once daily through week 12 of pregnancy.',
        actionAr: 'وصف حمض الفوليك 5 مجم يومياً فموياً حتى الأسبوع الـ 12 من الحمل.'
      });
    }

    // 4. Postpartum insulin reduction (-50%) and GDM screening
    const postpartumInsulinReductionPercent = 50;
    const postpartumTdd = Math.round(tdd * 0.5 * 10) / 10;
    const postpartumManagement = {
      isPostpartum,
      insulinReductionPercent: postpartumInsulinReductionPercent,
      postpartumTdd,
      insulinReductionEn: `Immediately upon delivery of the placenta, insulin resistance drops precipitously. Reduce insulin doses by ~50% (estimated postpartum TDD: ${postpartumTdd} U/day) or revert to pre-pregnancy regimen to prevent severe maternal hypoglycemia.`,
      insulinReductionAr: `فور خروج المشيمة، تهبط مقاومة الإنسولين هبوطاً حاداً ومفاجئاً. يجب تخفيض جرعة الإنسولين بنسبة 50% فوراً (جرعة النفاس المقدرة: ${postpartumTdd} وحدة/يوم) لتجنب هبوط السكر الحاد المميت.`,
      gdmScreeningEn: 'Postpartum GDM Screening: For women with Gestational Diabetes Mellitus (GDM), perform a 75-g 2-hour Oral Glucose Tolerance Test (OGTT) at 4–12 weeks postpartum to screen for persistent diabetes or prediabetes.',
      gdmScreeningAr: 'فحص سكر النفاس: للسيدات المصابات بسكر الحمل (GDM)، يجب إجراء اختبار تحمل الجلوكوز (75g OGTT) بعد 4 إلى 12 أسبوعاً من الولادة للتأكد من زوال سكر الحمل والكشف عن السكري أو مرحلة ما قبل السكري.'
    };

    if (isPostpartum) {
      alerts.push({
        id: 'dm-postpartum-insulin-cut',
        level: 'warning',
        type: 'warning',
        titleEn: 'Postpartum Insulin Dose Reduction (-50%) & Hypoglycemia Warning',
        titleAr: 'تخفيض جرعة الإنسولين بنسبة 50% بعد الولادة فوراً والتحذير من هبوط السكر',
        messageEn: postpartumManagement.insulinReductionEn,
        messageAr: postpartumManagement.insulinReductionAr,
        actionEn: 'Halve the pre-delivery insulin dose immediately postpartum and monitor blood glucose closely.',
        actionAr: 'قلص جرعة الإنسولين للنصف فوراً وراقب السكر باستمرار.'
      });
      alerts.push({
        id: 'dm-postpartum-gdm-ogtt-screen',
        level: 'info',
        type: 'info',
        titleEn: 'Postpartum GDM 75g OGTT Screening (Weeks 4–12)',
        titleAr: 'فحص سكر الحمل بعد الولادة (اختبار OGTT 75g في الأسبوع 4–12)',
        messageEn: postpartumManagement.gdmScreeningEn,
        messageAr: postpartumManagement.gdmScreeningAr,
        actionEn: 'Order 75g 2-hr OGTT at 4–12 weeks postpartum.',
        actionAr: 'طلب فحص 75g OGTT بعد 4-12 أسبوعاً من الولادة.'
      });
    }

    // 5. Obstetric glycemic targets: Fasting <95, 1-hr PP <140, 2-hr PP <120 mg/dL
    const obstetricTargets = {
      fasting: 95,
      pp1hr: 140,
      pp2hr: 120,
      fastingMgDl: '<95 mg/dL (<5.3 mmol/L)',
      pp1hrMgDl: '<140 mg/dL (<7.8 mmol/L)',
      pp2hrMgDl: '<120 mg/dL (<6.7 mmol/L)',
      fastingMmol: 5.3,
      pp1hrMmol: 7.8,
      pp2hrMmol: 6.7,
      a1cPercent: 6.0,
      fastingLabel: '< 95 mg/dL',
      pp1hrLabel: '< 140 mg/dL',
      pp2hrLabel: '< 120 mg/dL',
      fastingLabelEn: 'Fasting: < 95 mg/dL (< 5.3 mmol/L)',
      fastingLabelAr: 'سكر الصائم: أقل من 95 مجم/ديسيلتر (< 5.3 مليمول/لتر)',
      pp1hrLabelEn: '1-Hour Postprandial: < 140 mg/dL (< 7.8 mmol/L)',
      pp1hrLabelAr: 'بعد الأكل بساعة: أقل من 140 مجم/ديسيلتر (< 7.8 مليمول/لتر)',
      pp2hrLabelEn: '2-Hour Postprandial: < 120 mg/dL (< 6.7 mmol/L)',
      pp2hrLabelAr: 'بعد الأكل بساعتين: أقل من 120 مجم/ديسيلتر (< 6.7 مليمول/لتر)',
      a1cLabelEn: 'HbA1c Target in Pregnancy: < 6.0% (without significant hypoglycemia)',
      a1cLabelAr: 'السكر التراكمي المستهدف: أقل من 6.0% (دون حدوث هبوط سكر متكرر)'
    };

    return {
      isPregnant,
      isPostpartum,
      trimester,
      gestationalWeeks: weeks,
      dosing: insulinDosing,
      insulinDosing,
      folicAcid,
      postpartumManagement,
      obstetricTargets,
      targets: obstetricTargets,
      stoppedAgents,
      alerts
    };
  }

  return {
    evaluatePregnancyDmProtocol
  };
})();

if (typeof window !== 'undefined') {
  window.OsrawyDmPregnancy = OsrawyDmPregnancy;
  window.DiabetesEngine = window.DiabetesEngine || {};
  window.DiabetesEngine.OsrawyDmPregnancy = OsrawyDmPregnancy;
  window.DiabetesEngine.evaluatePregnancyDmProtocol = OsrawyDmPregnancy.evaluatePregnancyDmProtocol;
}

if (typeof global !== 'undefined') {
  global.OsrawyDmPregnancy = OsrawyDmPregnancy;
  global.DiabetesEngine = global.DiabetesEngine || {};
  global.DiabetesEngine.OsrawyDmPregnancy = OsrawyDmPregnancy;
  global.DiabetesEngine.evaluatePregnancyDmProtocol = OsrawyDmPregnancy.evaluatePregnancyDmProtocol;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports.OsrawyDmPregnancy = OsrawyDmPregnancy;
  module.exports.evaluatePregnancyDmProtocol = OsrawyDmPregnancy.evaluatePregnancyDmProtocol;
}

```

---

<a id="www-js-htn-engine-js"></a>
## 21. `www/js/htn_engine.js`

**Description:** ACC/AHA 2025 and ESC 2024 Hypertension engine, dual combination therapy, comorbidity rules, and hemodynamics.  
**Lines:** 714 | **Size:** 49.6 KB

```javascript

(function(){
  const $ = id => document.getElementById(id);
  let lens = 'acc';
  try { const s = localStorage.getItem('htn-lens'); if (s === 'esc' || s === 'acc') lens = s; } catch(e){}

  function setLens(l){
    lens = l;
    $('lens-acc').setAttribute('aria-pressed', l==='acc');
    $('lens-esc').setAttribute('aria-pressed', l==='esc');
    $('risk-l').textContent = l==='acc' ? '10-year CVD risk % (PREVENT)' : '10-year CVD risk % (SCORE2, or PREVENT below)';
    try { localStorage.setItem('htn-lens', l); } catch(e){}
    render();
  }
  $('lens-acc').onclick = () => setLens('acc');
  $('lens-esc').onclick = () => setLens('esc');

  function read(){
    const n = id => { const v = parseFloat($(id).value); return isNaN(v) ? null : v; };
    const c = id => $(id).checked;
    return { s:n('sbp'), d:n('dbp'), age:n('htn-age'), sex:$('htn-sex').value || 'm', meds:+$('meds').value, risk:n('risk'),
      oob:c('oob'), dm:c('dm'), cad:c('cad'), hf:c('hf-htn'), stroke:c('stroke'), af:c('af'), gout:c('gout'),
      asthma:c('asthma'), bph:c('bph'), frail:c('frail-htn'), ortho:c('ortho'), preg:c('preg-htn') && $('htn-sex').value==='f',
      egfr:n('htn-egfr'), uacr:n('htn-uacr'), k:n('k') };
  }

  function classify(p){
    const {s,d} = p;
    if (s>=180 || d>=120) return {label:'Severe hypertension', cls:'p-bad', sev:true};
    if (lens==='acc'){
      if (s>=140 || d>=90) return {label:'Stage 2 hypertension', cls:'p-bad', stage:2};
      if (s>=130 || d>=80) return {label:'Stage 1 hypertension', cls:'p-warn', stage:1};
      if (s>=120) return {label:'Elevated BP', cls:'p-warn', stage:0.5};
      return {label:'Normal BP', cls:'p-ok', stage:0};
    } else {
      if (s>=140 || d>=90) return {label:'Hypertension', cls:'p-bad', stage:2};
      if (s>=120 || d>=70) return {label:'Elevated BP', cls:'p-warn', stage:1};
      return {label:'Non-elevated BP', cls:'p-ok', stage:0};
    }
  }

  // AHA PREVENT base model, 10-year total CVD (Khan SS et al., Circulation 2024)
  const PV = {
    f:{a:0.7939329,n:0.0305239,h:-0.1606857,s1:-0.2394003,s2:0.3600781,d:0.8667604,sm:0.5360739,e1:0.6045917,e2:0.0433769,m:0.3151672,st:-0.1477655,ms:-0.0663612,stn:0.1197879,an:-0.0819715,ah:0.0306769,as:-0.0946348,ad:-0.27057,asm:-0.078715,ae:-0.1637806,c:-3.307728},
    m:{a:0.7688528,n:0.0736174,h:-0.0954431,s1:-0.4347345,s2:0.3362658,d:0.7692857,sm:0.4386871,e1:0.5378979,e2:0.0164827,m:0.288879,st:-0.1337349,ms:-0.0475924,stn:0.150273,an:-0.0517874,ah:0.0191169,as:-0.1049477,ad:-0.2251948,asm:-0.0895067,ae:-0.1543702,c:-3.031168}
  };
  function prevent(q){ // tc, hdl in mg/dL
    const k = PV[q.sex] || PV.m;
    const A=(q.age-55)/10, N=(q.tc-q.hdl)*0.02586-3.5, H=(q.hdl*0.02586-1.3)/0.3,
      S1=(Math.min(q.sbp,110)-110)/20, S2=(Math.max(q.sbp,110)-130)/20,
      E1=(Math.min(q.egfr,60)-60)/-15, E2=(Math.max(q.egfr,60)-90)/-15;
    const x = k.a*A + k.n*N + k.h*H + k.s1*S1 + k.s2*S2 + k.d*q.dm + k.sm*q.smk + k.e1*E1 + k.e2*E2
      + k.m*q.tx + k.st*q.statin + k.ms*q.tx*S2 + k.stn*q.statin*N + k.an*A*N + k.ah*A*H
      + k.as*A*S2 + k.ad*A*q.dm + k.asm*A*q.smk + k.ae*A*E1 + k.c;
    return 100*Math.exp(x)/(1+Math.exp(x));
  }
  let riskManual = false;
  $('risk').addEventListener('input', () => { riskManual = $('risk').value !== ''; });
  ['tc','hdl','lunit','smk','statin'].forEach(id => {
    $(id).addEventListener('input', () => { riskManual = false; });
    $(id).addEventListener('change', () => { riskManual = false; });
  });

  function calcRisk(){
    const box = $('riskbox');
    const v = id => { const x = parseFloat($(id).value); return isNaN(x) ? null : x; };
    const mmol = $('lunit').value === 'mmol';
    let tc = v('tc'), hdl = v('hdl');
    if (mmol){ tc = tc!=null ? tc*38.67 : null; hdl = hdl!=null ? hdl*38.67 : null; }
    const q = { sex:$('htn-sex').value, age:v('htn-age'), sbp:v('sbp'), egfr:v('htn-egfr'), tc, hdl,
      dm:+$('dm').checked, smk:+$('smk').checked, statin:+$('statin').checked, tx:+($('meds').value>0) };
    const known = $('cad').checked || $('stroke').checked || $('hf-htn').checked;
    const setRisk = val => { if (!riskManual) $('risk').value = val; };
    if (known){ box.innerHTML = '<p><span class="pill p-bad">High risk</span> Known CVD: the patient is already high risk, so PREVENT does not apply.</p>'; setRisk(''); return; }
    const miss = ['age','sbp','egfr','tc','hdl'].filter(f => q[f]==null);
    if (miss.length){ box.innerHTML = '<p class="hint">Enter age, SBP, eGFR, total and HDL cholesterol to calculate.</p>'; setRisk(''); return; }
    const warn = [];
    if (q.age<30 || q.age>79) warn.push('age outside 30–79');
    if (q.tc<130 || q.tc>320) warn.push('total cholesterol outside 130–320 mg/dL');
    if (q.hdl<20 || q.hdl>100) warn.push('HDL outside 20–100 mg/dL');
    if (q.sbp<90 || q.sbp>200) warn.push('SBP outside 90–200');
    if (q.egfr<15 || q.egfr>140) warn.push('eGFR outside 15–140');
    if (q.hdl>=q.tc){ box.innerHTML = '<p class="hint">HDL must be lower than total cholesterol. Check units.</p>'; setRisk(''); return; }
    const r = prevent(q);
    const cat = r<5 ? ['Low','p-ok'] : r<7.5 ? ['Borderline','p-warn'] : r<20 ? ['Intermediate','p-warn'] : ['High','p-bad'];
    const pos = Math.min(100, r/25*100);
    box.innerHTML = `<span class="num">${r.toFixed(1)}%</span>
      <div class="riskbar"><span><span class="pill ${cat[1]}">${cat[0]}</span> <span class="hint" style="display:inline">${r>=7.5?'≥7.5%: start drug at stage 1 (ACC/AHA)':'&lt;7.5%: lifestyle first at stage 1'}</span></span>
      <div class="gauge" aria-hidden="true"><i style="left:${pos}%"></i></div>
      <div class="scale"><span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25+</span></div></div>
      ${warn.length?`<p class="hint" style="flex-basis:100%">Outside the validated range (${warn.join(', ')}); interpret with caution.</p>`:''}
      ${lens==='esc'?'<p class="hint" style="flex-basis:100%">ESC uses SCORE2, which is calibrated for European regions only; PREVENT is shown as the nearest available estimate. Enter a SCORE2 value manually if you have one.</p>':''}`;
    setRisk(r.toFixed(1));
  }

  function render(){
    calcRisk();
    const p = read();
    $('preg-c').hidden = p.sex !== 'f';
    if (p.s==null || p.d==null){ $('out').innerHTML = '<div class="sec"><p>Enter systolic and diastolic BP.</p></div>'; return; }

    const ckd = (p.egfr!=null && p.egfr<60) || (p.uacr!=null && p.uacr>=30);
    const alb = p.uacr!=null && p.uacr>=30;
    const ascvd = p.cad || p.stroke || p.hf;
    const riskCut = lens==='acc' ? 7.5 : 10;
    const highRisk = p.dm || ckd || ascvd || (p.risk!=null && p.risk>=riskCut);
    const old = (p.age||0) >= 85 || p.frail || p.ortho;
    const cl = classify(p);
    const sections = [];
    const summary = [];

    // gauge & hemodynamics
    const pos = Math.max(0, Math.min(100, (p.s-100)/(200-100)*100));
    const mapVal = Math.round(p.d + (p.s - p.d) / 3);
    const ppVal = Math.round(p.s - p.d);
    const isStiff = ppVal >= 60;
    sections.push(`<div class="sec"><div class="k">Classification · ${lens==='acc'?'ACC/AHA 2025':'ESC 2024'}</div>
      <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:10px"><span class="big" style="font-family:var(--f-mono)">${p.s}/${p.d}</span> <span class="pill ${cl.cls}">${cl.label}</span></div>
      <div class="gauge" aria-hidden="true"><i style="left:${pos}%"></i></div>
      <div class="scale"><span>100</span><span>120</span><span>140</span><span>160</span><span>180</span><span>200</span></div>
      <div class="htn-hemo-bar no-print" dir="ltr" aria-hidden="true">
        <span class="htn-hemo-chip"><b>MAP:</b> <span class="htn-hemo-val">${mapVal}</span> mmHg</span>
        <span class="htn-hemo-chip"><b>Pulse Pressure:</b> <span class="htn-hemo-val ${isStiff ? 'is-stiff' : ''}">${ppVal}</span> mmHg ${isStiff ? '⚠️' : ''}</span>
      </div>
      ${p.oob ? '' : '<p class="hint">Not yet confirmed out of office. Confirm with home BP or ABPM before labelling, unless BP is severe.</p>'}
      ${(p.age!=null && p.age<40 && cl.stage>=1) ? '<p class="hint">Age under 40: screen for secondary hypertension.</p>':''}</div>`);
    summary.push(`BP ${p.s}/${p.d}: ${cl.label} (${lens==='acc'?'ACC/AHA 2025':'ESC 2024'}).`);

    if (cl.sev){
      sections.push(`<div class="sec"><div class="alert"><b>BP ≥180/120.</b> Check for acute target-organ damage (chest pain, dyspnoea, neurological deficit, visual loss, confusion, AKI, pregnancy &gt;20 weeks). If present, this is a hypertensive emergency: refer to the emergency department now. If absent, do not lower BP rapidly; start or intensify oral therapy and review within 1 week.</div></div>`);
      summary.push('Severe range: assess for hypertensive emergency.');
    }

    // Target
    let target, tS, tD;
    if (p.preg){ target='&lt;140/90 mmHg (CHAP approach), with obstetric co-management'; tS=140; tD=90; }
    else if (lens==='acc'){
      if (old){ target='&lt;130/80 if tolerated; individualise in frailty, age ≥85 or orthostatic hypotension'; tS=130; tD=80; }
      else { target='&lt;130/80 mmHg' + (highRisk ? '; SBP &lt;120 is reasonable if tolerated' : ''); tS=130; tD=80; }
    } else {
      if (old){ target='As low as reasonably achievable (ALARA), checking for orthostatic symptoms'; tS=140; tD=90; }
      else { target='SBP 120–129, DBP 70–79 mmHg if tolerated'; tS=130; tD=80; }
    }
    sections.push(`<div class="sec"><div class="k">Target</div><p class="big" style="font-size:20px">${target}</p></div>`);
    summary.push('Target: ' + target.replace(/&lt;/g,'<') + '.');

    // Decision
    let decision, startMode = null, pillCls = 'p-acc';
    const onTx = p.meds > 0;
    const above = p.s>=tS || p.d>=tD;
    if (onTx){
      if (above){ decision = `Above target on ${p.meds===3?'3 or more drugs':p.meds+' drug class'+(p.meds>1?'es':'')}. Check adherence and technique, then step up.`; pillCls='p-warn'; }
      else { decision = 'At target. Continue current regimen, reinforce lifestyle, and review every 3–6 months.'; pillCls='p-ok'; }
    } else if (p.preg){
      if (p.s>=140 || p.d>=90){ decision='Start antihypertensive therapy safe in pregnancy.'; startMode='preg'; pillCls='p-bad'; }
      else { decision='Monitor; treat if BP reaches ≥140/90. Stop ACE inhibitor/ARB if planning pregnancy.'; }
    } else if (lens==='acc'){
      if (cl.stage>=2 || cl.sev){ decision = old ? 'Start drug therapy. In frailty or age ≥85, start with one agent at low dose and titrate slowly.' : 'Start drug therapy now: two first-line classes, preferably as a single-pill combination.'; startMode = old?'mono':'dual'; pillCls='p-bad'; }
      else if (cl.stage===1){
        if (highRisk){ decision='Start one first-line drug plus lifestyle (diabetes, CKD, ASCVD or PREVENT ≥7.5%).'; startMode='mono'; pillCls='p-warn'; }
        else if (p.risk==null){ decision='Calculate the PREVENT 10-year risk. If ≥7.5%, start one drug; if lower, lifestyle for 3–6 months and start a drug if BP stays ≥130/80.'; pillCls='p-warn'; }
        else { decision='Lifestyle for 3–6 months. Start one first-line drug if BP stays ≥130/80.'; pillCls='p-warn'; }
      } else if (cl.stage===0.5){ decision='Lifestyle measures; recheck in 3–6 months.'; }
      else { decision='No treatment. Recheck yearly.'; pillCls='p-ok'; }
    } else {
      if (cl.stage>=2 || cl.sev){ decision = old ? 'Start drug therapy with monotherapy at low dose (age ≥85, frailty or orthostatic hypotension).' : 'Start drug therapy: low-dose two-drug combination, preferably single-pill.'; startMode = old?'mono':'dual'; pillCls='p-bad'; }
      else if (cl.stage===1){
        if ((p.s>=130 || p.d>=80) && highRisk){ decision='Elevated BP with high risk: 3 months of lifestyle, then start drug therapy if BP stays ≥130/80.'; startMode='mono-later'; pillCls='p-warn'; }
        else if (p.risk==null && !highRisk){ decision='Calculate SCORE2. Treat if ≥10% and BP stays ≥130/80 after 3 months of lifestyle.'; pillCls='p-warn'; }
        else { decision='Lifestyle measures; reassess risk and BP yearly.'; pillCls='p-warn'; }
      } else { decision='No treatment. Recheck in 3 years (yearly if risk factors).'; pillCls='p-ok'; }
    }
    sections.push(`<div class="sec"><div class="k">Decision</div><p><span class="pill ${pillCls}" style="margin-right:6px">${onTx?(above?'Step up':'Maintain'):(startMode?'Treat':'Lifestyle')}</span>${decision}</p></div>`);
    summary.push('Decision: ' + decision);

    // Regimen
    const A = (alb||p.dm) ? 'ACE inhibitor or ARB (max tolerated dose)' : 'ACE inhibitor or ARB';
    const D = (p.egfr!=null && p.egfr<30) ? 'Chlorthalidone or loop diuretic' : 'Thiazide-like diuretic';
    const Dex = (p.egfr!=null && p.egfr<30) ? 'Thiazides lose effect at eGFR &lt;30; chlorthalidone still works (CLICK trial), or use furosemide/torsemide.' : 'Indapamide SR 1.5 mg or chlorthalidone 12.5–25 mg preferred over HCTZ.';
    let reg = [];
    const drug = (cls, name, ex) => reg.push({cls,name,ex});
    if (p.preg){
      drug('1st','Labetalol or nifedipine ER','Methyldopa is an alternative. ACE inhibitor, ARB, ARNI, MRA and aliskiren are contraindicated.');
    } else if (p.hf){
      drug('GDMT','ARNI (sacubitril/valsartan), or ACE inhibitor/ARB','Use HFrEF doses.');
      drug('GDMT','Bisoprolol, carvedilol or metoprolol succinate','Evidence-based beta-blocker.');
      drug('GDMT','MRA (spironolactone/eplerenone)','If K⁺ &lt;5.0 and eGFR &gt;30.');
      drug('GDMT','SGLT2 inhibitor','Dapagliflozin or empagliflozin.');
      if (onTx && above && p.meds>=3) drug('add','Amlodipine or hydralazine/nitrate','If BP still above target. Avoid diltiazem/verapamil.');
    } else {
      const step = onTx ? (above ? Math.min(p.meds+1, 4) : p.meds) : (startMode==='dual' ? 2 : (startMode ? 1 : 0));
      const firstC = alb||p.dm||ckd ? 'A' : (p.cad ? 'A' : null);
      if (step>=1){
        if (alb||ckd||p.dm||p.cad||p.stroke||!old) drug('A', A, alb ? 'Albuminuria makes ACE inhibitor/ARB mandatory, not optional.' : 'Perindopril, ramipril, losartan, telmisartan, etc.');
        else drug('C/D','Amlodipine or thiazide-like diuretic','Good single starting agents in older patients.');
      }
      if (step>=2){
        if (p.gout || !p.stroke) drug('C','Amlodipine (DHP CCB)','A + C is the preferred dual combination' + (p.gout?' and avoids diuretic-related gout flares.':'.'));
        else drug('D', D, Dex + ' A + D favoured after stroke.');
        reg.push({cls:'SPC',name:'Combine in one pill where available',ex:'e.g. perindopril/amlodipine, valsartan/amlodipine, telmisartan/amlodipine.'});
      }
      if (step>=3){
        if (p.gout || !p.stroke) drug('D', D, Dex + (p.gout?' Use with caution in gout.':''));
        else drug('C','Amlodipine (DHP CCB)','');
        reg = reg.filter(r=>r.cls!=='SPC');
        reg.push({cls:'SPC',name:'Triple single-pill (A + C + D) if available',ex:'Titrate each to full dose before adding a fourth drug.'});
      }
      if (step>=4){
        reg = reg.filter(r=>r.cls!=='SPC');
        const kOk = p.k==null || p.k<4.5, gOk = p.egfr==null || p.egfr>45;
        drug('MRA','Spironolactone 25–50 mg', kOk&&gOk ? 'Preferred 4th drug (PATHWAY-2). Check K⁺ and creatinine at 1–2 weeks.' : 'Caution: K⁺ ≥4.5 or eGFR ≤45. Consider amiloride, a beta-blocker or doxazosin instead.');
      }
      if (p.cad && step>=1) drug('BB','Beta-blocker (bisoprolol)','Indicated for angina or post-MI.' + (p.asthma?' Cardioselective only (asthma).':''));
      if (p.af && step>=1 && !p.cad) drug('rate','Beta-blocker or diltiazem/verapamil','For rate control in AF.');
    }
    if (reg.length){
      sections.push(`<div class="sec"><div class="k">Regimen</div><div class="regimen">${reg.map(r=>`<div class="drug"><span class="cls">${r.cls}</span><b>${r.name}</b>${r.ex?`<span class="ex">${r.ex}</span>`:''}</div>`).join('')}</div>${(!p.preg && !p.hf)?'<p class="hint">A = ACE inhibitor/ARB · C = dihydropyridine CCB · D = thiazide-like diuretic. Never combine an ACE inhibitor with an ARB.</p>':''}</div>`);
      summary.push('Regimen: ' + reg.map(r=>r.name).join('; ') + '.');
    }

    // Resistant work-up
    if (!p.preg && onTx && p.meds>=3 && above){
      sections.push(`<div class="sec"><div class="k">Resistant hypertension</div><ul class="notes">
        <li><span class="pill p-acc">Check</span><span>Adherence, NSAIDs, decongestants, steroids, alcohol, salt intake. Confirm with ABPM to exclude white-coat effect.</span></li>
        <li><span class="pill p-acc">Screen</span><span>Primary aldosteronism (aldosterone/renin ratio) regardless of K⁺; continue other BP drugs, stop MRA first. Ask about sleep apnoea.</span></li>
        <li><span class="pill p-acc">Refer</span><span>If uncontrolled on 4 drugs, or a secondary cause is suspected.</span></li></ul></div>`);
    }

    // Notes
    const notes = [];
    const n = (t,c,txt)=>notes.push({t,c,txt});
    if ((alb||ckd) && !p.preg){
      if (p.egfr==null || p.egfr>=20) n('Add','p-ok','SGLT2 inhibitor for kidney protection (eGFR ≥20).');
      if (p.dm && alb && (p.k==null||p.k<=5.0)) n('Consider','p-acc','Finerenone in type 2 diabetes with albuminuria if K⁺ ≤5.0.');
    }
    if (p.k!=null && p.k>5.0) n('Caution','p-warn','K⁺ >5.0: correct before ACE inhibitor/ARB or MRA; a diuretic helps lower K⁺.');
    if (p.gout) n('Avoid','p-bad','Thiazides can trigger gout; losartan lowers uric acid modestly.');
    if (p.asthma) n('Avoid','p-bad','Non-selective beta-blockers (propranolol). Use cardioselective if one is needed.');
    if (p.hf) n('Avoid','p-bad','Diltiazem and verapamil in HFrEF.');
    if (p.bph) n('Add-on','p-acc','Alpha-blocker (doxazosin) helps urinary symptoms but is not first-line for BP.');
    if (p.sex==='f' && !p.preg && (p.age==null||p.age<50)) n('Counsel','p-warn','ACE inhibitor/ARB are teratogenic: discuss contraception and pregnancy plans.');
    if (old) n('Caution','p-warn','Check standing BP; titrate slowly and watch for falls.');
    if (notes.length){
      sections.push(`<div class="sec"><div class="k">Patient-specific notes</div><ul class="notes">${notes.map(x=>`<li><span class="pill ${x.c}">${x.t}</span><span>${x.txt}</span></li>`).join('')}</ul></div>`);
      summary.push('Notes: ' + notes.map(x=>x.t+': '+x.txt).join(' '));
    }

    // Follow-up
    sections.push(`<div class="sec"><div class="k">Follow-up</div><ul class="notes">
      <li><span class="pill p-acc">Labs</span><span>Creatinine and K⁺ 2–4 weeks after starting or raising an ACE inhibitor, ARB, diuretic or MRA. A creatinine rise up to 30% is acceptable.</span></li>
      <li><span class="pill p-acc">Visits</span><span>Monthly until at target, then every 3–6 months. Encourage home BP monitoring.</span></li>
      <li><span class="pill p-acc">Lifestyle</span><span>Lower sodium (aim &lt;1500 mg/day or cut 1000 mg/day), DASH-style diet, potassium-enriched salt substitute (not in CKD or with K⁺-raising drugs), ≥5% weight loss if overweight, 150 min/week activity, stop smoking.</span></li></ul></div>`);

    $('out').innerHTML = sections.join('');
    window.__summary = summary.join('\n');
    window.__tgt = [tS, tD];
    if (typeof window !== 'undefined' && typeof window.renderPregnancyCards === 'function') {
      window.renderPregnancyCards();
    }
  }

  $('f').addEventListener('input', render);
  $('f').addEventListener('change', render);
  $('f').addEventListener('submit', e=>e.preventDefault());
  if ($('copy') && !$('copy').getAttribute('onclick')) {
    $('copy').addEventListener('click', ()=>{
      const t = window.__summary || '';
      const done = ()=>{ $('toast').hidden=false; setTimeout(()=>$('toast').hidden=true, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(t).then(done).catch(()=>fallback(t));
      } else fallback(t);
      function fallback(txt){ const ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy'); done();}catch(e){} ta.remove(); }
    });
  }

  // ---------- Switch & titrate ----------
  // Each dose step: [dose, level]; level 0 = low, 1 = standard, 2 = high (fractional/negative allowed).
  const DR = [
    {id:'perindopril',n:'Perindopril (erbumine)',c:'acei',g:'ras',u:'mg once daily',st:[[2,0],[4,1],[8,2]]},
    {id:'perindoprila',n:'Perindopril (arginine)',c:'acei',g:'ras',u:'mg once daily',st:[[2.5,0],[5,1],[10,2]]},
    {id:'ramipril',n:'Ramipril',c:'acei',g:'ras',u:'mg once daily',st:[[1.25,-0.5],[2.5,0],[5,1],[10,2]]},
    {id:'lisinopril',n:'Lisinopril',c:'acei',g:'ras',u:'mg once daily',st:[[2.5,-0.5],[5,0],[10,1],[20,2],[40,2.5]]},
    {id:'enalapril',n:'Enalapril',c:'acei',g:'ras',u:'mg/day (once or split twice)',st:[[2.5,-0.5],[5,0],[10,1],[20,2],[40,2.5]]},
    {id:'fosinopril',n:'Fosinopril',c:'acei',g:'ras',u:'mg once daily',st:[[10,0],[20,1],[40,2]]},
    {id:'trandolapril',n:'Trandolapril',c:'acei',g:'ras',u:'mg once daily',st:[[0.5,-0.5],[1,0],[2,1],[4,2]]},
    {id:'losartan',n:'Losartan',c:'arb',g:'ras',u:'mg once daily',st:[[25,0],[50,1],[100,2]]},
    {id:'valsartan',n:'Valsartan',c:'arb',g:'ras',u:'mg once daily',st:[[40,0],[80,1],[160,2],[320,2.5]]},
    {id:'irbesartan',n:'Irbesartan',c:'arb',g:'ras',u:'mg once daily',st:[[75,0],[150,1],[300,2]]},
    {id:'candesartan',n:'Candesartan',c:'arb',g:'ras',u:'mg once daily',st:[[4,0],[8,1],[16,2],[32,2.5]]},
    {id:'telmisartan',n:'Telmisartan',c:'arb',g:'ras',u:'mg once daily',st:[[20,0],[40,1],[80,2]]},
    {id:'olmesartan',n:'Olmesartan',c:'arb',g:'ras',u:'mg once daily',st:[[10,0],[20,1],[40,2]]},
    {id:'azilsartan',n:'Azilsartan',c:'arb',g:'ras',u:'mg once daily',st:[[20,0],[40,1],[80,2]]},
    {id:'arni',n:'Sacubitril/valsartan (HFrEF)',c:'arni',g:'ras',u:'mg twice daily',st:[['24/26',0],['49/51',1],['97/103',2]]},
    {id:'amlodipine',n:'Amlodipine',c:'ccb',g:'ccb',u:'mg once daily',st:[[2.5,0],[5,1],[10,2]]},
    {id:'nifedipine',n:'Nifedipine ER (GITS/XL)',c:'ccb',g:'ccb',u:'mg once daily',st:[[30,0],[60,1],[90,2]]},
    {id:'felodipine',n:'Felodipine ER',c:'ccb',g:'ccb',u:'mg once daily',st:[[2.5,0],[5,1],[10,2]]},
    {id:'lercanidipine',n:'Lercanidipine',c:'ccb',g:'ccb',u:'mg once daily',st:[[10,0.5],[20,1.5]]},
    {id:'hctz',n:'Hydrochlorothiazide',c:'thz',g:'thz',u:'mg once daily',st:[[12.5,0],[25,1],[50,2]]},
    {id:'chlorthalidone',n:'Chlorthalidone',c:'thz',g:'thz',u:'mg once daily',st:[[6.25,0],[12.5,1],[25,2]]},
    {id:'indapamide',n:'Indapamide (immediate release)',c:'thz',g:'thz',u:'mg once daily',st:[[1.25,0.5],[2.5,1.5]]},
    {id:'indapamidesr',n:'Indapamide SR',c:'thz',g:'thz',u:'mg once daily',st:[[1.5,1.5]]},
    {id:'bisoprolol',n:'Bisoprolol',c:'bb',g:'bb',u:'mg once daily',st:[[1.25,-0.5],[2.5,0],[5,1],[10,2]]},
    {id:'metoprolols',n:'Metoprolol succinate (ER)',c:'bb',g:'bb',u:'mg once daily',st:[[25,-0.5],[50,0],[100,1],[200,2]]},
    {id:'metoprololt',n:'Metoprolol tartrate',c:'bb',g:'bb',u:'mg twice daily',st:[[25,0],[50,1],[100,2]]},
    {id:'atenolol',n:'Atenolol',c:'bb',g:'bb',u:'mg once daily',st:[[25,0],[50,1],[100,2]]},
    {id:'carvedilol',n:'Carvedilol',c:'bb',g:'bb',u:'mg twice daily (with food)',st:[[3.125,-0.5],[6.25,0],[12.5,1],[25,2]]},
    {id:'nebivolol',n:'Nebivolol',c:'bb',g:'bb',u:'mg once daily',st:[[2.5,0],[5,1],[10,2]]},
    {id:'spironolactone',n:'Spironolactone',c:'mra',g:'mra',u:'mg once daily',st:[[12.5,0],[25,1],[50,2]]},
    {id:'eplerenone',n:'Eplerenone',c:'mra',g:'mra',u:'mg/day',st:[[25,0],[50,1],[100,2]]}
  ];
  const CL = {acei:'ACE inhibitor',arb:'ARB',arni:'ARNI',ccb:'DHP CCB',thz:'Thiazide / thiazide-like',bb:'Beta-blocker',mra:'MRA'};
  const LV = l => l<0 ? 'starting dose' : l<0.75 ? 'low dose' : l<1.75 ? 'standard dose' : l<2.25 ? 'high dose' : 'maximum dose';
  const byId = id => DR.find(d=>d.id===id);
  const fmt = (d,dose) => `${dose} ${d.u}`;

  function fillDrugSelect(sel, list, val){
    const groups = {};
    list.forEach(d => (groups[d.c] = groups[d.c]||[]).push(d));
    sel.innerHTML = Object.keys(groups).map(c=>`<optgroup label="${CL[c]}">${groups[c].map(d=>`<option value="${d.id}">${d.n}</option>`).join('')}</optgroup>`).join('');
    if (val && list.some(d=>d.id===val)) sel.value = val;
  }
  function fillDose(sel, d, idx){
    sel.innerHTML = d.st.map((x,i)=>`<option value="${i}">${x[0]} ${d.u.split(' ')[0]} · ${LV(x[1])}</option>`).join('');
    sel.value = String(Math.min(idx ?? d.st.findIndex(x=>x[1]>=1) , d.st.length-1));
    if (sel.value==='' || sel.value==='-1') sel.value='0';
  }

  const TI = {
    acei:{iv:'2–4 weeks',mon:'Creatinine and K⁺ 1–2 weeks after each increase.',hold:'Hold the increase if K⁺ >5.5 mmol/L, creatinine rises >30% from baseline, or symptomatic hypotension. Stop if angioedema.'},
    arb:{iv:'2–4 weeks',mon:'Creatinine and K⁺ 1–2 weeks after each increase.',hold:'Hold the increase if K⁺ >5.5 mmol/L, creatinine rises >30% from baseline, or symptomatic hypotension.'},
    arni:{iv:'2–4 weeks',mon:'Creatinine, K⁺ and BP 1–2 weeks after each increase.',hold:'Hold if SBP <100 mmHg, K⁺ >5.5 mmol/L or creatinine rises >30%.'},
    ccb:{iv:'2–4 weeks (full effect takes 1–2 weeks)',mon:'BP and ankle oedema.',hold:'Oedema is dose-related: if it appears, adding an ACE inhibitor/ARB is better than pushing the CCB dose.'},
    thz:{iv:'4 weeks',mon:'Na⁺, K⁺, creatinine, uric acid and glucose 2–4 weeks after each change.',hold:'Above the standard dose BP gain is small and metabolic effects rise; add another class instead. Hold if Na⁺ <130 or K⁺ <3.5 mmol/L.'},
    bb:{iv:'2–4 weeks',mon:'Resting heart rate and BP at each visit.',hold:'Do not increase if resting HR <55–60 bpm, symptomatic bradycardia, or heart block. Never stop abruptly.'},
    mra:{iv:'4–8 weeks',mon:'K⁺ and creatinine at 1 week, 4 weeks, then every 3–6 months.',hold:'Halve or stop if K⁺ >5.5 mmol/L; stop if K⁺ >6.0 or eGFR falls below 30.'}
  };

  function switchNotes(a, b){
    const n = [];
    if (a.id===b.id) return ['Same drug selected.'];
    if (a.c==='acei' && b.c==='arni') n.push('Stop the ACE inhibitor and wait at least 36 hours before the first dose of sacubitril/valsartan (angioedema risk).');
    else if (a.c==='arni' && b.c==='acei') n.push('Wait at least 36 hours after the last sacubitril/valsartan dose before starting the ACE inhibitor.');
    else if (a.c==='arb' && b.c==='arni') n.push('Stop the ARB and give sacubitril/valsartan at the time of the next scheduled dose. Do not give both.');
    else if (a.c==='acei' && b.c==='arb') n.push('Stop the ACE inhibitor and start the ARB the next day; no washout needed. If the reason is angioedema, an ARB carries a small risk of recurrence: discuss with a specialist or use another class.');
    else if (a.g===b.g) n.push('Stop the old drug and start the new one at the next scheduled dose; no washout needed.');
    else n.push('Different classes are not dose-equivalent. Start the new drug at the dose shown and stop the old one the same day' + (a.c==='bb' ? ', except beta-blockers: taper over 1–2 weeks instead of stopping abruptly.' : '.'));
    if (a.id==='metoprololt' && b.id==='metoprolols') n.push('Tartrate to succinate: give the same total daily dose once daily.');
    if (b.id==='chlorthalidone' && a.c==='thz') n.push('Chlorthalidone is about 1.5–2 times as potent as HCTZ and longer acting; check K⁺ and Na⁺ in 2–4 weeks.');
    if (b.id==='nifedipine') n.push('Use extended-release nifedipine only; immediate-release capsules are not for chronic hypertension.');
    if (b.c==='bb' && b.id!=='bisoprolol' && b.id!=='nebivolol') n.push('In asthma, prefer bisoprolol or nebivolol.');
    if (b.id==='eplerenone') n.push('Eplerenone is the usual switch when spironolactone causes gynaecomastia.');
    if (b.c==='acei' || b.c==='arb' || b.c==='arni' || b.c==='mra') n.push('Check creatinine and K⁺ 1–2 weeks after the switch.');
    n.push('Recheck BP 2–4 weeks after the switch.');
    return n;
  }

  function renderSwitch(){
    const a = byId($('sw-from').value), b = byId($('sw-to').value);
    const i = +$('sw-dose').value, lvl = a.st[i][1];
    let out, label;
    if (a.g === b.g && a.id !== b.id){
      let best = b.st[0];
      if (b.c==='arni') best = lvl<=0 ? b.st[0] : b.st[1];
      else b.st.forEach(x => { if (Math.abs(x[1]-lvl) < Math.abs(best[1]-lvl)) best = x; });
      out = fmt(b, best[0]); label = b.c==='arni' ? 'Starting dose (titrate up)' : `Approximate equivalent · ${LV(best[1])}`;
    } else if (a.id === b.id){
      out = fmt(b, a.st[i][0]); label = 'No change';
    } else {
      const std = b.st.find(x=>x[1]>=1) || b.st[b.st.length-1];
      out = fmt(b, std[0]); label = 'Not equipotent · usual standard starting dose (use a lower dose in frailty or age ≥85)';
    }
    $('sw-out').innerHTML = `<div class="result"><span class="k">${a.n} ${a.st[i][0]} → ${b.n}</span><span class="num">${out}</span><span class="hint">${label}</span></div>
      <ul class="notes" style="margin-top:12px">${switchNotes(a,b).map(t=>`<li><span class="pill p-acc">Note</span><span>${t}</span></li>`).join('')}</ul>`;
  }

  function renderTitrate(){
    const d = byId($('ti-drug').value), i = +$('ti-dose').value, t = TI[d.c];
    const p = read();
    const tg = window.__tgt;
    const atTarget = tg && p.s!=null && p.d!=null && p.s < tg[0] && p.d < tg[1];
    const rows = [];
    let wk = 0;
    const ivWeeks = d.c==='mra' ? 4 : d.c==='thz' ? 4 : 2;
    d.st.forEach((x,j) => {
      if (j < i) return;
      rows.push(`<li class="${j===i?'now':''}"><span class="wk">${j===i?'Now':'Week '+wk+'+'}</span><span><span class="ds">${fmt(d,x[0])}</span> <span class="hint" style="display:inline">· ${LV(x[1])}</span></span></li>`);
      wk += ivWeeks;
    });
    const atMax = i === d.st.length-1;
    const pastStd = d.st[i][1] >= 1;
    const head = atTarget
      ? `<p><span class="pill p-ok">At target</span> BP ${p.s}/${p.d} is below the target from the main sheet. Keep the current dose.</p>`
      : atMax ? `<p><span class="pill p-warn">Maximum dose</span> Do not increase further. Add a drug from another class instead.</p>`
      : `<p><span class="pill p-warn">Above target</span> Increase one step every ${t.iv} until BP is at target or the maximum dose is reached.</p>`;
    $('ti-out').innerHTML = head + `<ol class="steps">${rows.join('')}</ol>
      <ul class="notes">
        <li><span class="pill p-acc">Monitor</span><span>${t.mon}</span></li>
        <li><span class="pill p-warn">Hold</span><span>${t.hold}</span></li>
        ${(pastStd && !atMax && !['arni','bb'].includes(d.c)) ? '<li><span class="pill p-ok">Tip</span><span>Adding a low dose of a second class lowers BP more than doubling this one (about five times the effect), with fewer side effects. Consider a single-pill combination.</span></li>' : ''}
        ${d.c==='bb' ? '<li><span class="pill p-acc">Note</span><span>Beta-blockers are not first-line for BP alone; titrate to the indication (angina, post-MI, HFrEF, rate control).</span></li>' : ''}
      </ul>`;
  }

  fillDrugSelect($('sw-from'), DR, 'ramipril');
  fillDose($('sw-dose'), byId('ramipril'));
  fillDrugSelect($('sw-to'), DR, 'losartan');
  fillDrugSelect($('ti-drug'), DR, 'amlodipine');
  fillDose($('ti-dose'), byId('amlodipine'), 1);
  $('sw-from').addEventListener('change', ()=>{ fillDose($('sw-dose'), byId($('sw-from').value)); renderSwitch(); });
  $('sw-dose').addEventListener('change', renderSwitch);
  $('sw-to').addEventListener('change', renderSwitch);
  $('ti-drug').addEventListener('change', ()=>{ fillDose($('ti-dose'), byId($('ti-drug').value), 0); renderTitrate(); });
  $('ti-dose').addEventListener('change', renderTitrate);
  $('f').addEventListener('input', renderTitrate);
  $('f').addEventListener('change', renderTitrate);
  renderSwitch();
  setLens(lens);
  renderTitrate();

  window.htnRender = render;
  window.htnRenderTitrate = renderTitrate;
  window.htnResetRiskManual = () => {
    riskManual = false;
    const r = $('risk');
    if (r) r.value = '';
  };

  // Cross-engine clinical safety alerts listener
  var target = (typeof window !== 'undefined') ? window : globalThis;
  if (target && target.addEventListener && !target.__osrawyGuardrailListenerAttached) {
    target.__osrawyGuardrailListenerAttached = true;
    var escH = function(s) {
      if (s === null || s === undefined) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };
    target.addEventListener('osrawy:patient-updated', function(ev) {
      var banner = document.getElementById('clinical-guardrail-banner');
      if (!banner) return;
      var guardrails = (ev && ev.detail && ev.detail.guardrails) || [];
      var list = [];
      if (Array.isArray(guardrails)) list = guardrails;
      else if (guardrails && Array.isArray(guardrails.alerts)) list = guardrails.alerts;
      else if (guardrails && typeof guardrails === 'object') list = Object.values(guardrails).filter(Boolean);

      if (list.length === 0) {
        banner.hidden = true;
        banner.style.display = 'none';
        banner.innerHTML = '';
        return;
      }

      banner.hidden = false;
      banner.style.display = 'block';
      banner.innerHTML = list.map(function(item) {
        var text = typeof item === 'string' ? item : (item.text || item.message || item.title || '');
        var rawType = String((typeof item === 'object' && (item.type || item.level)) || 'danger').toLowerCase();
        var cssType = (rawType === 'critical' || rawType === 'danger' || rawType === 'error')
          ? 'danger'
          : (rawType === 'warn' || rawType === 'warning' ? 'warn' : 'info');
        var icon = (typeof item === 'object' && item.icon) ||
          (cssType === 'danger' ? '🚨' : (cssType === 'warn' ? '⚠️' : 'ℹ️'));
        return '<div class="guardrail-item ' + cssType + '"><span class="guardrail-icon">' + escH(icon) + '</span><div class="guardrail-msg">' + escH(text) + '</div></div>';
      }).join('');
    });
  }
})();

// ==============================================================
// Osrawy Hypertension in Pregnancy Protocol & Obstetric Engine
// Guidelines: ACOG / ESC / NICE / SOGC
// ==============================================================

const OsrawyHtnPregnancy = (function() {
  function evaluatePregnancyHtnProtocol(patientInput) {
    const pt = patientInput || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});
    const sbp = parseFloat(pt.sbp !== undefined ? pt.sbp : (pt.s !== undefined ? pt.s : 148)) || 0;
    const dbp = parseFloat(pt.dbp !== undefined ? pt.dbp : (pt.d !== undefined ? pt.d : 94)) || 0;
    const isPregnant = !!(pt.pregnancy || pt.preg || pt.isPregnant || pt.pregHtn || (pt.comorbidities && pt.comorbidities.pregnancy));
    const isPostpartum = !!(pt.postpartum || (pt.comorbidities && pt.comorbidities.postpartum));
    const weeks = parseFloat(pt.gestationalWeeks !== undefined ? pt.gestationalWeeks : (pt.weeks !== undefined ? pt.weeks : 16)) || 16;
    const hasAsthma = !!(pt.asthma || (pt.comorbidities && pt.comorbidities.asthma));
    const medsRaw = pt.medications || pt.activeMeds || pt.meds || pt.currentMeds || [];
    const meds = Array.isArray(medsRaw) ? medsRaw.map(m => String(m).toLowerCase()) : [];

    const alerts = [];
    const stoppedDrugs = [];

    // 1. Stopped teratogenic drugs alert (ACEi, ARB, MRA, thiazides)
    const teratogenicClasses = ['acei', 'arb', 'mra', 'thz', 'thiazide'];
    const teratogenicNames = [
      'perindopril', 'ramipril', 'lisinopril', 'enalapril', 'captopril', 'coveram',
      'valsartan', 'losartan', 'telmisartan', 'candesartan', 'exforge', 'twynsta',
      'spironolactone', 'eplerenone', 'aldactone',
      'indapamide', 'hydrochlorothiazide', 'hctz', 'natrilix'
    ];

    const detectedTeratogens = meds.filter(m => 
      teratogenicNames.some(t => m.includes(t)) || 
      teratogenicClasses.some(c => m.includes(c)) ||
      m.includes('ace') || m.includes('arb')
    );

    stoppedDrugs.push(
      'ACE inhibitors (e.g. Perindopril, Ramipril)',
      'ARBs (e.g. Valsartan, Losartan)',
      'MRAs (e.g. Spironolactone)',
      'Thiazides / Thiazide-like diuretics (e.g. Indapamide, HCTZ)'
    );

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
    let methyldopaDepressionWarning = null;
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
    // Pivot to Nifedipine ER when maternal asthma is true, Labetalol when asthma is false.
    let firstLineDrug = {};
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

    const steps = [];

    // Preeclampsia Aspirin prophylaxis step (weeks 12-36)
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

    // Step 1: Asthma-aware selection
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
      steps,
      targetBpEn: 'Systolic 120–135 mmHg and Diastolic 80–85 mmHg (avoid DBP < 80 to preserve placental perfusion)',
      targetBpAr: 'الضغط الانقباضي 120-135 ملم زئبق والانبساطي 80-85 ملم زئبق (تجنب انخفاض الانبساطي عن 80 للحفاظ على تدفق دم المشيمة)'
    };
  }

  return {
    evaluatePregnancyHtnProtocol
  };
})();

if (typeof window !== 'undefined') {
  window.OsrawyHtnPregnancy = OsrawyHtnPregnancy;
  window.HtnEngine = window.HtnEngine || {};
  window.HtnEngine.OsrawyHtnPregnancy = OsrawyHtnPregnancy;
  window.HtnEngine.evaluatePregnancyHtnProtocol = OsrawyHtnPregnancy.evaluatePregnancyHtnProtocol;
}

if (typeof global !== 'undefined') {
  global.OsrawyHtnPregnancy = OsrawyHtnPregnancy;
  global.HtnEngine = global.HtnEngine || {};
  global.HtnEngine.OsrawyHtnPregnancy = OsrawyHtnPregnancy;
  global.HtnEngine.evaluatePregnancyHtnProtocol = OsrawyHtnPregnancy.evaluatePregnancyHtnProtocol;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports.OsrawyHtnPregnancy = OsrawyHtnPregnancy;
  module.exports.evaluatePregnancyHtnProtocol = OsrawyHtnPregnancy.evaluatePregnancyHtnProtocol;
}

```

---

<a id="www-js-lipids-engine-js"></a>
## 22. `www/js/lipids_engine.js`

**Description:** ESC 2023 / ADA 2025 lipid lowering stepper, ASCVD risk stratification, statin intensity, ezetimibe, and PCSK9i rules.  
**Lines:** 739 | **Size:** 42.4 KB

```javascript
// ==============================================================
// Osrawy Lipids Engine - ASCVD Risk, Stratification & Lipid Pathway
// ADA Standards of Care 2025 / ESC-EAS Dyslipidemia Guidelines 2023
// ==============================================================

const OsrawyLipidsEngine = (function() {

  // --- 1. Unit Conversion Utilities ---
  // Cholesterol factor: 1 mmol/L = 38.67 mg/dL
  // Triglycerides factor: 1 mmol/L = 88.57 mg/dL
  const CHOL_FACTOR = 38.67;
  const TG_FACTOR = 88.57;

  function parseNumOr(val, fallback) {
    if (val === undefined || val === null) return fallback;
    const s = String(val).trim();
    if (s === '') return fallback;
    const n = parseFloat(s);
    return isNaN(n) ? fallback : n;
  }

  function pickDefined(a, b) {
    return (a !== undefined && a !== null && String(a).trim() !== '') ? a : b;
  }

  function toMgDl(val, type = 'cholesterol') {
    const num = parseFloat(val) || 0;
    if (num <= 0) return 0;
    const factor = (type === 'tg' || type === 'triglycerides') ? TG_FACTOR : CHOL_FACTOR;
    return Math.round(num * factor * 10) / 10;
  }

  function toMmolL(val, type = 'cholesterol') {
    const num = parseFloat(val) || 0;
    if (num <= 0) return 0;
    const factor = (type === 'tg' || type === 'triglycerides') ? TG_FACTOR : CHOL_FACTOR;
    return Math.round((num / factor) * 100) / 100;
  }

  // --- 2. 10-Year ASCVD Risk Estimation (ACC/AHA Pooled Cohort Equations) ---
  function estimate10YrAscvdRisk(patient) {
    const p = patient || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});
    const age = parseNumOr(p.age, 52);
    const sex = (p.sex === 'f') ? 'f' : 'm';
    const smoker = (p.smoker || p.smk) ? 1 : 0;
    const dm = (p.diabetes || p.dm) ? 1 : 0;
    const sbp = parseNumOr(p.sbp, 130);
    const tx = (p.medsCount && parseInt(p.medsCount, 10) > 0) ? 1 : 0;

    // Get TC and HDL in mg/dL
    let tc = parseNumOr(pickDefined(p.totalCholesterol, p.tc), 200);
    let hdl = parseNumOr(pickDefined(p.hdlC, p.hdl), 45);
    const unit = p.lipidUnit || p.lunit || 'mg';
    if (unit === 'mmol' || unit === 'mmol/L') {
      tc = toMgDl(tc, 'cholesterol');
      hdl = toMgDl(hdl, 'cholesterol');
    }

    // Established ASCVD overrides calculated risk to >20%
    if (p.ascvd || p.cad || p.stroke || p.pad) {
      return { riskPercent: 35.0, category: 'VERY_HIGH', isEstablishedAscvd: true };
    }

    // Clamp values to valid PCE ranges
    const cAge = Math.min(Math.max(age, 40), 79);
    const cTc = Math.min(Math.max(tc, 130), 320);
    const cHdl = Math.min(Math.max(hdl, 20), 100);
    const cSbp = Math.min(Math.max(sbp, 90), 200);

    const lnAge = Math.log(cAge);
    const lnTc = Math.log(cTc);
    const lnHdl = Math.log(cHdl);
    const lnSbp = Math.log(cSbp);

    let indiv = 0;
    let mean = 0;
    let s10 = 0;

    if (sex === 'f') {
      // Non-Hispanic White/Other Women Coefficients
      indiv = -29.799 * lnAge +
              4.884 * (lnAge * lnAge) +
              13.540 * lnTc -
              3.114 * (lnAge * lnTc) -
              13.578 * lnHdl +
              3.149 * (lnAge * lnHdl) +
              (tx ? 2.019 : 1.957) * lnSbp +
              7.574 * smoker -
              1.665 * (lnAge * smoker) +
              0.661 * dm;
      mean = -29.18;
      s10 = 0.9665;
    } else {
      // Non-Hispanic White/Other Men Coefficients
      indiv = 12.344 * lnAge +
              11.853 * lnTc -
              2.664 * (lnAge * lnTc) -
              7.990 * lnHdl +
              1.769 * (lnAge * lnHdl) +
              (tx ? 1.797 : 1.764) * lnSbp +
              7.837 * smoker -
              1.795 * (lnAge * smoker) +
              0.658 * dm;
      mean = 61.18;
      s10 = 0.9144;
    }

    const exponent = indiv - mean;
    const risk = 1 - Math.pow(s10, Math.exp(exponent));
    const riskPercent = Math.min(Math.max(Math.round(risk * 1000) / 10, 0.5), 85.0);

    let category = 'LOW';
    if (riskPercent >= 20) category = 'VERY_HIGH';
    else if (riskPercent >= 10) category = 'HIGH';
    else if (riskPercent >= 5) category = 'MODERATE';

    return { riskPercent, category, isEstablishedAscvd: false };
  }

  // --- 3. Risk Stratification (ADA 2025 / ESC-EAS 2023) ---
  const RISK_TIERS = {
    VERY_HIGH: {
      key: 'VERY_HIGH',
      nameEn: 'Very High Risk',
      nameAr: 'خطر مرتفع جداً (Very High Risk)',
      badgeClass: 'lipid-badge-very-high',
      ldlTargetMg: 55,
      ldlTargetMmol: 1.4,
      nonHdlTargetMg: 85,
      nonHdlTargetMmol: 2.2,
      reductionPercent: 50,
      statinGoalEn: 'High-intensity statin at maximum tolerated dose. Achieve ≥50% LDL-C reduction AND LDL-C < 55 mg/dL (< 1.4 mmol/L). Add Ezetimibe 10 mg if target not achieved.',
      statinGoalAr: 'ستاتين عالي الكثافة بأقصى جرعة محتملة لخفض LDL بنسبة ≥50% والوصول لأقل من 55 مجم/ديسيلتر. أضف إيزيتيميب 10 مجم عند عدم تحقق الهدف.'
    },
    HIGH: {
      key: 'HIGH',
      nameEn: 'High Risk',
      nameAr: 'خطر مرتفع (High Risk)',
      badgeClass: 'lipid-badge-high',
      ldlTargetMg: 70,
      ldlTargetMmol: 1.8,
      nonHdlTargetMg: 100,
      nonHdlTargetMmol: 2.6,
      reductionPercent: 50,
      statinGoalEn: 'High-intensity statin (or moderate-intensity titrated). Achieve ≥50% LDL-C reduction AND LDL-C < 70 mg/dL (< 1.8 mmol/L). Add Ezetimibe if needed.',
      statinGoalAr: 'ستاتين عالي الكثافة لخفض LDL بنسبة ≥50% والوصول لأقل من 70 مجم/ديسيلتر. أضف إيزيتيميب 10 مجم عند الحاجة.'
    },
    MODERATE: {
      key: 'MODERATE',
      nameEn: 'Moderate Risk',
      nameAr: 'خطر متوسط (Moderate Risk)',
      badgeClass: 'lipid-badge-moderate',
      ldlTargetMg: 100,
      ldlTargetMmol: 2.6,
      nonHdlTargetMg: 130,
      nonHdlTargetMmol: 3.4,
      reductionPercent: 30,
      statinGoalEn: 'Moderate-intensity statin. Achieve LDL-C < 100 mg/dL (< 2.6 mmol/L). Re-evaluate lipid profile in 4–12 weeks.',
      statinGoalAr: 'ستاتين متوسط الكثافة للوصول لمستوى LDL أقل من 100 مجم/ديسيلتر. يعاد تقييم التحليل بعد 4-12 أسبوعاً.'
    },
    LOW: {
      key: 'LOW',
      nameEn: 'Low Risk',
      nameAr: 'خطر منخفض (Low Risk)',
      badgeClass: 'lipid-badge-low',
      ldlTargetMg: 116,
      ldlTargetMmol: 3.0,
      nonHdlTargetMg: 145,
      nonHdlTargetMmol: 3.8,
      reductionPercent: 0,
      statinGoalEn: 'Lifestyle interventions (diet, exercise, smoking cessation). Consider moderate statin if LDL remains elevated after 3 months.',
      statinGoalAr: 'تعديل نمط الحياة (حمية، رياضة، إيقاف التدخين). يُنظر في ستاتين خفيف إلى متوسط إذا استمر الارتفاع بعد 3 أشهر.'
    }
  };

  function stratifyRisk(patient) {
    const p = patient || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});
    const egfr = parseNumOr(p.egfr, 90);
    const uacr = parseNumOr(p.uacr, 10);
    const age = parseNumOr(p.age, 50);
    const dur = parseNumOr(p.dur, 0);
    const dm = !!(p.diabetes || p.dm);
    const ascvd = !!(p.ascvd || p.cad || p.stroke || p.pad);

    let tc = parseNumOr(pickDefined(p.totalCholesterol, p.tc), 200);
    let ldl = parseNumOr(pickDefined(p.ldlC, p.ldl), 0);
    const unit = p.lipidUnit || p.lunit || 'mg';
    if (unit === 'mmol' || unit === 'mmol/L') {
      tc = toMgDl(tc, 'cholesterol');
      if (ldl > 0) ldl = toMgDl(ldl, 'cholesterol');
    }

    const ascvdEst = estimate10YrAscvdRisk(p);

    let tierKey = 'LOW';
    let reasonEn = 'Calculated 10-Yr ASCVD Risk < 5%';
    let reasonAr = 'مخاطر قلبية 10 سنوات أقل من 5%';

    // 1. VERY HIGH RISK
    if (ascvd ||
        egfr < 30 ||
        (dm && (uacr >= 300 || dur >= 20 || (age >= 50 && (p.smoker || p.smk || p.sbp >= 140)))) ||
        ascvdEst.riskPercent >= 20) {
      tierKey = 'VERY_HIGH';
      reasonEn = ascvd ? 'Established ASCVD (Secondary Prevention)' : (egfr < 30 ? 'Severe CKD (eGFR < 30 mL/min)' : (dm && uacr >= 300 ? 'Diabetes with Severe Target Organ Damage' : '10-Yr ASCVD Risk ≥ 20%'));
      reasonAr = ascvd ? 'مرض قلبي وعائي مثبت (وقاية ثانوية)' : (egfr < 30 ? 'اعتلال كلوي شديد (eGFR < 30)' : (dm && uacr >= 300 ? 'سكري مع ضرر بأعضاء حيوية وزلال شديد' : 'مخاطر قلبية 10 سنوات ≥ 20%'));
    }
    // 2. HIGH RISK
    else if ((dm && (dur >= 10 || age >= 40 || p.smoker || p.smk)) ||
        (egfr >= 30 && egfr < 60) ||
        tc > 310 || ldl > 190 ||
        parseFloat(p.sbp) >= 180 ||
        ascvdEst.riskPercent >= 10) {
      tierKey = 'HIGH';
      reasonEn = dm ? 'Diabetes Mellitus (Age ≥40 or Duration ≥10 yrs)' : (egfr < 60 ? 'Moderate CKD (Stage G3)' : (tc > 310 || ldl > 190 ? 'Severe Single Risk Factor (Severe Hypercholesterolemia)' : '10-Yr ASCVD Risk 10–20%'));
      reasonAr = dm ? 'داء السكري (عمر ≥40 أو مدة ≥10 سنوات)' : (egfr < 60 ? 'اعتلال كلوي متوسط (المرحلة 3)' : (tc > 310 || ldl > 190 ? 'ارتفاع كوليسترول شديد منفرد' : 'مخاطر قلبية 10 سنوات 10-20%'));
    }
    // 3. MODERATE RISK
    else if ((dm && age < 40 && dur < 10) || ascvdEst.riskPercent >= 5) {
      tierKey = 'MODERATE';
      reasonEn = dm ? 'Young Patient with Diabetes <10 yrs duration' : '10-Yr ASCVD Risk 5–10%';
      reasonAr = dm ? 'مريض سكري شاب بدون مضاعفات ومدة <10 سنوات' : 'مخاطر قلبية 10 سنوات 5-10%';
    }

    const tierObj = RISK_TIERS[tierKey];

    return {
      tier: tierKey,
      riskKey: tierKey,
      level: tierKey,
      tierDetails: tierObj,
      ldlTargetMg: tierObj.ldlTargetMg,
      ldlTargetMmol: tierObj.ldlTargetMmol,
      nonHdlTargetMg: tierObj.nonHdlTargetMg,
      nonHdlTargetMmol: tierObj.nonHdlTargetMmol,
      target: { ldl: tierObj.ldlTargetMg, nonHdl: tierObj.nonHdlTargetMg },
      targets: { ldl: tierObj.ldlTargetMg, nonHdl: tierObj.nonHdlTargetMg },
      ascvdRisk: ascvdEst.riskPercent,
      reasonEn,
      reasonAr
    };
  }

  // --- 4. Comprehensive Clinical Pathway & Multi-Drug Guardrails ---
  function evaluateLipidPathway(patientInput) {
    const p = patientInput || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});
    const unit = p.lipidUnit || p.lunit || 'mg';
    const isMmol = (unit === 'mmol' || unit === 'mmol/L');

    // Parse laboratory values into standard mg/dL for internal clinical logic
    let tcMg = parseNumOr(pickDefined(p.totalCholesterol, p.tc), 200);
    let hdlMg = parseNumOr(pickDefined(p.hdlC, p.hdl), 45);
    let tgMg = parseNumOr(pickDefined(p.triglycerides, p.tg), 160);
    let ldlMg = parseNumOr(pickDefined(p.ldlC, p.ldl), 0);

    if (isMmol) {
      tcMg = toMgDl(tcMg, 'cholesterol');
      hdlMg = toMgDl(hdlMg, 'cholesterol');
      tgMg = toMgDl(tgMg, 'tg');
      if (ldlMg > 0) ldlMg = toMgDl(ldlMg, 'cholesterol');
    }

    // Friedewald equation if LDL not directly provided and TG < 400
    if (ldlMg <= 0 && tcMg > 0 && hdlMg > 0) {
      if (tgMg < 400) {
        ldlMg = Math.max(Math.round((tcMg - hdlMg - (tgMg / 5)) * 10) / 10, 20);
      } else {
        ldlMg = Math.round(tcMg * 0.6); // approximation when TG is very high
      }
    }

    const nonHdlMg = Math.round((tcMg - hdlMg) * 10) / 10;
    const egfr = parseNumOr(p.egfr, 90);
    const altUl = parseNumOr(pickDefined(p.altUl, p.alt), 25);
    const isPregnant = !!(p.pregnancy || p.preg || p.pregHtn);
    const isStatinIntolerant = !!(p.statinIntolerant);
    const strat = stratifyRisk(p);
    const target = strat.tierDetails;

    const rawDrugs =
      (Array.isArray(p.currentDrugs) && p.currentDrugs.length ? p.currentDrugs : null) ||
      (Array.isArray(p.meds) && p.meds.length ? p.meds : null) ||
      (Array.isArray(p.medications) && p.medications.length ? p.medications : null) ||
      (Array.isArray(p.activeMeds) && p.activeMeds.length ? p.activeMeds : null) ||
      [];
    const activeDrugs = Array.isArray(rawDrugs) ? rawDrugs.map(d => String(d).toLowerCase()) : [];

    const alerts = [];
    const steps = [];

    function addAlert(a) {
      a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
      a.message = `${a.messageEn} | ${a.messageAr}`;
      a.msg = a.messageEn;
      a.title = a.titleEn;
      alerts.push(a);
    }

    // --- Safety Guardrails ---

    // 1. Pregnancy Contraindication Guardrail
    if (isPregnant) {
      addAlert({
        id: 'lipid-guardrail-pregnancy',
        level: 'critical',
        titleEn: 'Contraindication: Pregnancy / Lactation (Statins/Ezetimibe/PCSK9i)',
        titleAr: 'موانع استخدام قطعية: الحمل والرضاعة (أدوية الدهون)',
        messageEn: 'Statins, Ezetimibe, and PCSK9 inhibitors are contraindicated in pregnancy and breastfeeding (teratogenicity, FDA Category X). Cholesterol synthesis is vital for fetal development. Discontinue lipid-lowering pharmacotherapy immediately.',
        messageAr: 'تُحظر أدوية الستاتين والإيزيتيميب ومثبطات PCSK9 نهائياً أثناء الحمل والرضاعة لاحتمال تشوه الأجنة. أوقف جميع أدوية الدهون فوراً واعتمد على الحمية الغذائية فقط.',
        actionEn: 'Discontinue statin/ezetimibe immediately; manage strictly with nutrition/lifestyle.',
        actionAr: 'أوقف أدوية الدهون فوراً واعتمد على التغذية الصحية السليمة.'
      });
    }

    // 2. Hepatic Safety Guardrail: ALT > 3x ULN (> 120 U/L)
    if (altUl > 120) {
      addAlert({
        id: 'lipid-guardrail-hepatic-alt',
        level: 'critical',
        titleEn: `Hepatic Guardrail: Serum ALT > 3x ULN (${altUl} U/L)`,
        titleAr: `تنبيه كبدي: ارتفاع إنزيم الكبد ALT أكثر من 3 أضعاف (${altUl} وحدة/لتر)`,
        messageEn: `Active liver transaminitis (ALT ${altUl} U/L > 120 U/L). Withhold or temporarily suspend statin therapy until transaminases resolve. Evaluate etiology (viral hepatitis, NASH, biliary, or medication-induced). Recheck ALT in 2–4 weeks.`,
        messageAr: `ارتفاع إنزيمات الكبد النشطة ALT (${altUl} وحدة/لتر). أوقف أو أرجئ بدء الستاتين حتى عودة الإنزيمات لطبيعتها مع فحص أسباب الاعتلال الكبدي، ويعاد التحليل بعد 2-4 أسابيع.`,
        actionEn: 'Hold statin therapy; investigate hepatic etiology and retest ALT in 2-4 weeks.',
        actionAr: 'أوقف الستاتين مؤقتاً، وافحص وظائف الكبد بعد 2-4 أسابيع.'
      });
    }

    // 3. Drug Interaction Alert: Amlodipine + Simvastatin <= 20mg Cap
    const hasAmlodipine = p.amlodipine || activeDrugs.some(d => d.includes('amlodipine') || d.includes('exforge') || d.includes('coveram') || d.includes('twynsta'));
    const onSimvastatin = p.simvastatin || (p.statinDrug === 'simvastatin') || activeDrugs.some(d => d.includes('simvastatin'));
    if (hasAmlodipine && onSimvastatin) {
      addAlert({
        id: 'lipid-guardrail-amlodipine-simva',
        level: 'warning',
        titleEn: 'Drug Interaction Guardrail: Amlodipine + Simvastatin (Cap ≤ 20 mg/day)',
        titleAr: 'تداخل دوائي هام: أملوديبين مع سيمفاستاتين (تفاعل - الحد الأقصى 20 مجم/يوم)',
        messageEn: 'Drug interaction: Amlodipine inhibits CYP3A4 metabolism of Simvastatin, increasing simvastatin AUC by ~77% and substantially raising the risk of severe myopathy and rhabdomyolysis. Simvastatin dose MUST NOT exceed 20 mg/day cap. Alternatively, switch to Atorvastatin or Rosuvastatin which do not have this restriction.',
        messageAr: 'تداخل دوائي وتفاعل: الأملوديبين يثبط تكسير السيمفاستاتين مما يضاعف تركيزه بالدم ويزيد خطر انحلال العضلات (Rhabdomyolysis). يجب ألا تتجاوز جرعة سيمفاستاتين 20 مجم/يوم، أو يُفضل التحويل إلى أتورفاستاتين أو روزوفاستاتين.',
        actionEn: 'Limit Simvastatin to 20 mg/day maximum cap, or switch to Atorvastatin 20–40 mg.',
        actionAr: 'اخفض السيمفاستاتين إلى 20 مجم كحد أقصى أو حوّل إلى أتورفاستاتين.'
      });
    }

    // 4. Renal Guardrail: Rosuvastatin Cap 10mg if eGFR < 30
    const onRosuvastatin = p.rosuvastatin || (p.statinDrug === 'rosuvastatin') || activeDrugs.some(d => d.includes('rosuvastatin') || d === 'rosuva' || d.includes('crestor'));
    if (egfr >= 0 && egfr < 30 && (onRosuvastatin || target.key === 'VERY_HIGH' || target.key === 'HIGH')) {
      addAlert({
        id: 'lipid-guardrail-rosuva-renal',
        level: 'warning',
        titleEn: 'Renal Guardrail: Rosuvastatin Dose Cap 10 mg/day (eGFR < 30)',
        titleAr: 'تنبيه كلوي: الحد الأقصى والجرعة القصوى للروزوفاستاتين 10 مجم/يوم (eGFR < 30)',
        messageEn: `Severe renal impairment (eGFR ${egfr} mL/min/1.73m²). Rosuvastatin clearance is markedly reduced. Maximum dose cap is 10 mg once daily (start at 5 mg daily). Atorvastatin does not require renal dose adjustment and is preferred in advanced CKD.`,
        messageAr: `قصور كلوي شديد (eGFR ${egfr}). أقصى جرعة مسموحة وجرعة قصوى من روزوفاستاتين (كريستور) هي 10 مجم يومياً (ويبدأ بجرعة 5 مجم). أتورفاستاتين (ليبيتور) لا يحتاج لتعديل كلوي وهو الخيار الأنسب.`,
        actionEn: 'Cap Rosuvastatin at 10 mg daily (start 5 mg), or use Atorvastatin without renal restriction.',
        actionAr: 'حدد جرعة الروزوفاستاتين بـ 10 مجم كحد أقصى أو استخدم أتورفاستاتين.'
      });
    }

    // 5. Hypertriglyceridemia Guardrails:
    // Severe TG >= 500 mg/dL: Pancreatitis Alert & Urgent Fibrate
    if (tgMg >= 500) {
      addAlert({
        id: 'lipid-guardrail-pancreatitis-tg',
        level: 'critical',
        titleEn: `CRITICAL ALERT: Severe Hypertriglyceridemia (TG = ${Math.round(tgMg)} mg/dL) - Acute Pancreatitis Risk`,
        titleAr: `تنبيه حرج جداً: ارتفاع خطير في الدهون الثلاثية (${Math.round(tgMg)} مجم/ديسيلتر) - التهاب البنكرياس`,
        messageEn: `Triglycerides ≥ 500 mg/dL (${Math.round(tgMg)} mg/dL / ${toMmolL(tgMg, 'tg')} mmol/L) carries an imminent risk of acute pancreatitis! Immediate TG-lowering takes priority over LDL goals. Initiate Fenofibrate (145 mg or 160 mg daily; renal dose adjustment required; avoid/contraindicated if eGFR < 30) or prescription Omega-3 ethyl esters (4 g/day). Eliminate dietary simple sugars and alcohol.`,
        messageAr: `الدهون الثلاثية ≥ 500 مجم/ديسيلتر تهدد بحدوث التهاب البنكرياس الحاد! الأولوية العاجلة هي خفض الدهون الثلاثية. ابدأ فينوفيبرات (Fenofibrate 145/160 مجم يومياً مع تعديل الجرعة لوظائف الكلى) أو أوميغا-3 بجرعة 4 جم يومياً.`,
        actionEn: 'Start Fenofibrate 145mg/160mg (if eGFR ≥30) or Omega-3 4g/day immediately to prevent pancreatitis.',
        actionAr: 'ابدأ فوراً فينوفيبرات (إذا كان eGFR ≥30) أو أوميغا-3 (4 جم يومياً) للوقاية من التهاب البنكرياس.'
      });
    } else if (tgMg >= 135 && tgMg < 500 && (p.ascvd || (p.diabetes && strat.ascvdRisk >= 10) || p.onStatin)) {
      // Moderate persistent TG 135-499: REDUCE-IT trial recommendation
      addAlert({
        id: 'lipid-recommendation-icosapent',
        level: 'info',
        titleEn: `Recommendation: Icosapent Ethyl / Omega-3 for Persistent Hypertriglyceridemia (TG 135–499 mg/dL)`,
        titleAr: `توصية علاجية: إيكوزابنت إيثيل / أوميغا-3 لارتفاع الدهون الثلاثية المستمر`,
        messageEn: `In patients with established ASCVD or high-risk diabetes on maximally tolerated statin with TG 135–499 mg/dL (current TG: ${Math.round(tgMg)} mg/dL), adding Icosapent Ethyl (Vascepa / Omega-3) 2 g twice daily with food significantly reduces ischemic cardiovascular events and cardiovascular death (REDUCE-IT trial).`,
        messageAr: `في مرضى القلب والسكري عالي الخطورة الخاضعين لجرعة ستاتين مع بقاء الدهون الثلاثية بين 135 و 499، يُوصى بإضافة إيكوزابنت إيثيل (Icosapent ethyl / أوميغا-3 2g مرتين يومياً) لخفض الوفيات والجلطات القلبية بنسبة 25%.`,
        actionEn: 'Consider Icosapent ethyl 2 g twice daily with meals to lower residual cardiovascular risk.',
        actionAr: 'أضف إيكوزابنت إيثيل 2 جم مرتين يومياً مع الوجبات.'
      });
    }

    // --- Sequential Step-by-Step Lipid Treatment Pathway ---

    // Step 1: Statin Selection
    if (isStatinIntolerant) {
      steps.push({
        stepNumber: 1,
        titleEn: 'Step 1: Statin-Intolerant Non-Statin Strategy',
        titleAr: 'الخطوة 1: استراتيجية عدم تحمل الستاتين (Statin Intolerance)',
        drugEn: 'Ezetimibe 10 mg once daily + Bempedoic Acid 180 mg once daily (or PCSK9 Inhibitor)',
        drugAr: 'إيزيتيميب 10 مجم يومياً + حمض البيمبيدويك 180 مجم يومياً (أو حقن PCSK9)',
        detailEn: 'For confirmed statin-associated muscle symptoms (SAMS) or intolerance: initiate Ezetimibe 10 mg daily (15–20% LDL reduction) combined with Bempedoic Acid (Nexletol 180 mg; provides additional 15–25% LDL reduction without muscle aching as it requires hepatic activation). For very high risk, proceed directly to PCSK9 inhibitor.',
        detailAr: 'في حالات عدم تحمل الستاتين المثبتة: ابدأ بإيزيتيميب 10 مجم يومياً مع بيمبيدويك أسيد 180 مجم (يخفض الكوليسترول دون التسبب بآلام عضلية لأنه ينشط فقط بالكبد). للحالات عالية الخطورة جداً يتم اللجوء لحقن PCSK9 مباشرة.'
      });
    } else if (target.key === 'VERY_HIGH') {
      const rosuvaDose = (egfr >= 0 && egfr < 30) ? '10 mg once daily (capped for eGFR <30)' : '20 – 40 mg once daily';
      steps.push({
        stepNumber: 1,
        titleEn: 'Step 1: High-Intensity Statin Therapy (Max Tolerated Dose)',
        titleAr: 'الخطوة 1: ستاتين عالي الكثافة بالجرعة القصوى المحتملة',
        drugEn: `Atorvastatin 40–80 mg once daily OR Rosuvastatin ${rosuvaDose}`,
        drugAr: `أتورفاستاتين 40–80 مجم مساءً أو روزوفاستاتين ${egfr < 30 ? '10 مجم (الحد الأقصى لاعتلال الكلى)' : '20-40 مجم يومياً'}`,
        detailEn: `Goal: achieve ≥50% LDL-C reduction AND target LDL-C < 55 mg/dL (< 1.4 mmol/L) and Non-HDL < 85 mg/dL (< 2.2 mmol/L). Reassess fasting lipid panel in 4–12 weeks.`,
        detailAr: `الهدف: خفض LDL بنسبة ≥50% والوصول لأقل من 55 مجم/ديسيلتر (< 1.4 مليمول) و Non-HDL < 85. يُعاد التحليل بعد 4-12 أسبوعاً.`
      });
    } else if (target.key === 'HIGH') {
      steps.push({
        stepNumber: 1,
        titleEn: 'Step 1: High-Intensity Statin (or Moderate-Intensity Titrated)',
        titleAr: 'الخطوة 1: ستاتين عالي الكثافة (أو متوسط الكثافة مع المعايرة)',
        drugEn: 'Atorvastatin 40–80 mg daily OR Rosuvastatin 10–20 mg daily',
        drugAr: 'أتورفاستاتين 40-80 مجم أو روزوفاستاتين 10-20 مجم يومياً',
        detailEn: `Goal: achieve ≥50% LDL-C reduction AND target LDL-C < 70 mg/dL (< 1.8 mmol/L) and Non-HDL < 100 mg/dL (< 2.6 mmol/L).`,
        detailAr: `الهدف: خفض LDL بنسبة ≥50% والوصول لأقل من 70 مجم/ديسيلتر (< 1.8 مليمول) و Non-HDL < 100.`
      });
    } else if (target.key === 'MODERATE') {
      steps.push({
        stepNumber: 1,
        titleEn: 'Step 1: Moderate-Intensity Statin Therapy',
        titleAr: 'الخطوة 1: ستاتين متوسط الكثافة',
        drugEn: 'Atorvastatin 10–20 mg OR Rosuvastatin 5–10 mg daily',
        drugAr: 'أتورفاستاتين 10-20 مجم أو روزوفاستاتين 5-10 مجم يومياً',
        detailEn: `Goal: achieve 30%–49% LDL-C reduction AND target LDL-C < 100 mg/dL (< 2.6 mmol/L).`,
        detailAr: `الهدف: خفض LDL بنسبة 30-49% والوصول لأقل من 100 مجم/ديسيلتر (< 2.6 مليمول).`
      });
    } else {
      steps.push({
        stepNumber: 1,
        titleEn: 'Step 1: Lifestyle Interventions & Dietary Modification',
        titleAr: 'الخطوة 1: تعديل نمط الحياة والنظام الغذائي',
        drugEn: 'Therapeutic Lifestyle Changes (TLC) · Dietary fiber, exercise',
        drugAr: 'تعديل نمط الحياة، تقليل الدهون المشبعة، المشي 150 دقيقة أسبوعياً',
        detailEn: `Target LDL-C < 116 mg/dL (< 3.0 mmol/L). If LDL remains above target after 3 months of lifestyle modification, consider initiating moderate-intensity statin.`,
        detailAr: `الهدف LDL أقل من 116 مجم/ديسيلتر. إذا استمر الارتفاع بعد 3 أشهر من الحمية والرياضة، يُنظر في بدء ستاتين خفيف إلى متوسط.`
      });
    }

    // Step 2: Ezetimibe Escalation
    const onStatin = !!(p.onStatin || p.currentStatin || p.statin || activeDrugs.some(d => d.includes('statin') || d === 'atorva' || d === 'rosuva'));
    const onEzetimibe = !!(p.onEzetimibe || activeDrugs.some(d => d.includes('ezetimibe')));
    const ldlAboveTarget = ldlMg > target.ldlTargetMg;

    steps.push({
      stepNumber: 2,
      titleEn: 'Step 2: Ezetimibe 10 mg Add-on Escalation',
      titleAr: 'الخطوة 2: إضافة إيزيتيميب 10 مجم (Step 2 Ezetimibe Escalation)',
      drugEn: 'Ezetimibe 10 mg once daily (or Single-Pill Combination e.g. Atozet / Rosuzet)',
      drugAr: 'إيزيتيميب 10 مجم يومياً (أو حبة مشتركة مثل أتوزيت / روزوزيت)',
      detailEn: (onStatin || ldlAboveTarget)
        ? `Current LDL-C (${Math.round(ldlMg)} mg/dL) exceeds target (< ${target.ldlTargetMg} mg/dL). Add Ezetimibe 10 mg once daily to statin therapy to achieve an additional 15%–20% LDL reduction (IMPROVE-IT trial).`
        : `Indicated if LDL-C rises above target (< ${target.ldlTargetMg} mg/dL) on statin monotherapy.`,
      detailAr: (onStatin || ldlAboveTarget)
        ? `مستوى LDL الحالي (${Math.round(ldlMg)} مجم) أعلى من الهدف المحدد (< ${target.ldlTargetMg} مجم). أضف إيزيتيميب 10 مجم يومياً مع الستاتين لخفض إضافي بنسبة 15-20%.`
        : `تتم إضافته في حال عدم الوصول للهدف المنشود (< ${target.ldlTargetMg} مجم) باستخدام الستاتين وحده.`
    });

    // Step 3: PCSK9 Inhibitor Escalation
    steps.push({
      stepNumber: 3,
      titleEn: 'Step 3: PCSK9 Inhibitor Escalation (Extreme / Refractory Risk)',
      titleAr: 'الخطوة 3: تصعيد العلاج بحقن مثبطات PCSK9 (Step 3 PCSK9 Escalation)',
      drugEn: 'Evolocumab (Repatha) 140 mg SC q2w OR Alirocumab (Praluent) 75–150 mg SC q2w',
      drugAr: 'إيفولوكوماب (ريباطا) 140 مجم تحت الجلد كل أسبوعين، أو أليروكوماب (برالوانت) 75-150 مجم',
      detailEn: (onEzetimibe || (target.key === 'VERY_HIGH' && ldlAboveTarget))
        ? `If patient remains above LDL target (< ${target.ldlTargetMg} mg/dL) despite maximally tolerated statin + Ezetimibe 10 mg: add PCSK9 inhibitor (Evolocumab 140mg q2w or Alirocumab; provides additional 50%–60% LDL reduction; FOURIER / ODYSSEY Outcomes trials).`
        : `Reserved for refractory hypercholesterolemia or extreme cardiovascular risk patients unable to achieve targets on Statin + Ezetimibe.`,
      detailAr: (onEzetimibe || (target.key === 'VERY_HIGH' && ldlAboveTarget))
        ? `في حال بقاء LDL أعلى من الهدف (< ${target.ldlTargetMg} مجم) رغم تناول أقصى جرعة ستاتين مع إيزيتيميب 10 مجم: يتم إضافة حقن PCSK9 (إيفولوكوماب 140 مجم) لخفض إضافي بنسبة 50-60%.`
        : `يُخصص لمرضى فرط كوليسترول الدم الوراثي أو الحالات المستعصية شديدة الخطورة.`
    });

    // Step 4: Triglyceride Management Step
    if (tgMg >= 500) {
      steps.push({
        stepNumber: 4,
        titleEn: 'Step 4: Severe Hypertriglyceridemia Urgent Pancreatitis Prevention',
        titleAr: 'الخطوة 4: الخطة العاجلة لخفض الدهون الثلاثية والوقاية من التهاب البنكرياس',
        drugEn: (egfr >= 30) ? 'Fenofibrate micronized 145 mg or 160 mg once daily with food' : 'Prescription Omega-3 Acid Ethyl Esters 4 g/day (Fenofibrate avoided in eGFR <30)',
        drugAr: (egfr >= 30) ? 'فينوفيبرات 145 أو 160 مجم يومياً مع الوجبة' : 'أوميغا-3 نقي عالي التركيز 4 جم يومياً (يُتجنب الفينوفيبرات لأن eGFR < 30)',
        detailEn: `Urgent TG reduction is imperative to prevent acute pancreatitis. Recheck lipid panel within 2–4 weeks. Combine with strict restriction of refined carbs, fats, and alcohol.`,
        detailAr: `خفض عاجل للدهون الثلاثية للوقاية من التهاب البنكرياس الحاد، مع إعادة الفحص خلال 2-4 أسابيع والالتزام بحمية خالية من السكريات البسيطة.`
      });
    }

    const gapMg = Math.round(Math.max(ldlMg - target.ldlTargetMg, 0));
    const gapPercent = Math.round(((ldlMg - target.ldlTargetMg) / ldlMg) * 100);

    let recommendation = isPregnant
      ? 'Statins and lipid-lowering drugs are contraindicated in pregnancy / أدوية الدهون ممنوعة تماماً أثناء الحمل'
      : (target.key === 'VERY_HIGH'
          ? (onEzetimibe ? 'Step 3: Add PCSK9 inhibitor (Evolocumab) for refractory LDL > 55 mg/dL' : (onStatin ? 'Step 2: Add Ezetimibe 10 mg to high-intensity statin' : 'Step 1: High-intensity statin (Atorvastatin 40–80 mg)'))
          : (target.key === 'HIGH'
              ? (onStatin ? 'Step 2: Titrate statin or add Ezetimibe 10 mg' : 'Step 1: High-intensity statin (Atorvastatin 40–80 mg or Rosuvastatin 20 mg)')
              : 'Moderate-intensity statin or lifestyle intervention'));

    return {
      patient: p,
      isMmol,
      labs: {
        tcMg: Math.round(tcMg),
        tcMmol: toMmolL(tcMg, 'cholesterol'),
        hdlMg: Math.round(hdlMg),
        hdlMmol: toMmolL(hdlMg, 'cholesterol'),
        tgMg: Math.round(tgMg),
        tgMmol: toMmolL(tgMg, 'tg'),
        ldlMg: Math.round(ldlMg),
        ldlMmol: toMmolL(ldlMg, 'cholesterol'),
        nonHdlMg: Math.round(nonHdlMg),
        nonHdlMmol: toMmolL(nonHdlMg, 'cholesterol'),
        altUl
      },
      stratification: strat,
      target,
      gap: {
        isAtTarget: ldlMg <= target.ldlTargetMg,
        gapMg: gapMg > 0 ? gapMg : 0,
        gapMmol: gapMg > 0 ? toMmolL(gapMg, 'cholesterol') : 0,
        neededReductionPercent: gapPercent > 0 ? gapPercent : 0
      },
      onStatin,
      onEzetimibe,
      recommendation,
      alerts,
      guardrails: alerts,
      steps
    };
  }

  // --- 5. DOM Rendering Summary ---
  function renderLipidsSummary(containerId) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById(containerId);
    if (!container) return;

    const patient = (typeof PatientSync !== 'undefined') ? PatientSync.get() : {};
    const pathway = evaluateLipidPathway(patient);
    const isAr = (typeof window.I18n !== 'undefined' && window.I18n.getLang() === 'ar');

    const t = pathway.target;
    const labs = pathway.labs;
    const strat = pathway.stratification;
    const gap = pathway.gap;

    let alertsHtml = '';
    pathway.alerts.forEach(a => {
      const cls = (a.level === 'critical') ? 'lipid-alert-danger' : (a.level === 'warning' ? 'lipid-alert-warning' : 'lipid-alert-info');
      const icon = (a.level === 'critical') ? '🚨' : (a.level === 'warning' ? '⚠️' : '💡');
      alertsHtml += `
        <div class="lipid-alert ${cls}">
          <div class="lipid-alert-title">${icon} ${isAr ? a.titleAr : a.titleEn}</div>
          <div class="lipid-alert-msg">${isAr ? a.messageAr : a.messageEn}</div>
          <div class="lipid-alert-action"><b>${isAr ? 'الإجراء الموصى به:' : 'Action:'}</b> ${isAr ? a.actionAr : a.actionEn}</div>
        </div>
      `;
    });

    const ldlTargetDisplay = pathway.isMmol ? `${t.ldlTargetMmol} mmol/L` : `${t.ldlTargetMg} mg/dL`;
    const ldlCurrentDisplay = pathway.isMmol ? `${labs.ldlMmol} mmol/L` : `${labs.ldlMg} mg/dL`;
    const nonHdlTargetDisplay = pathway.isMmol ? `${t.nonHdlTargetMmol} mmol/L` : `${t.nonHdlTargetMg} mg/dL`;
    const nonHdlCurrentDisplay = pathway.isMmol ? `${labs.nonHdlMmol} mmol/L` : `${labs.nonHdlMg} mg/dL`;

    const statusBadge = gap.isAtTarget
      ? `<span class="lipid-status-tag lipid-status-ok">✅ ${isAr ? 'الهدف محقق' : 'At Target'}</span>`
      : `<span class="lipid-status-tag lipid-status-elevated">⚠️ ${isAr ? `فوق الهدف بـ ${pathway.isMmol ? gap.gapMmol : gap.gapMg}` : `${pathway.isMmol ? gap.gapMmol : gap.gapMg} above goal`}</span>`;

    // LDL Gap Calculation & Visualizer
    const ldlValMg = labs.ldlMg || (pathway.isMmol ? Math.round(labs.ldlMmol * 38.67) : 0);
    const ldlTargetValMg = t.ldlTargetMg || 70;
    const maxScaleMg = Math.max(ldlValMg * 1.15, ldlTargetValMg * 1.35, 190);
    const targetPos = Math.min(Math.max(Math.round((ldlTargetValMg / maxScaleMg) * 100), 10), 85);
    const currentPos = Math.min(Math.max(Math.round((ldlValMg / maxScaleMg) * 100), 5), 98);
    const gapDiffText = pathway.isMmol ? `${gap.gapMmol} mmol/L` : `${gap.gapMg} mg/dL`;

    const gapVisualizerHtml = `
      <div class="lipid-gap-card">
        <div class="lipid-gap-header">
          <div class="lipid-gap-title">🎯 <b>${isAr ? 'فجوة الكوليسترول الضار (LDL Gap-to-Goal)' : 'LDL-C Gap-to-Goal'}</b></div>
          <span class="lipid-gap-badge ${gap.isAtTarget ? 'is-achieved' : 'is-pending'}">
            ${gap.isAtTarget
              ? (isAr ? 'الهدف محقق' : 'Goal Achieved')
              : `${isAr ? 'مطلوب خفض' : 'Reduction Needed'}: ${gap.neededReductionPercent}% (${gapDiffText})`}
          </span>
        </div>
        <div class="lipid-gap-bar-container" dir="ltr">
          <div class="lipid-gap-track">
            <div class="lipid-gap-fill ${gap.isAtTarget ? 'fill-success' : 'fill-warning'}" style="width: ${currentPos}%;"></div>
            <div class="lipid-gap-target-line" style="left: ${targetPos}%;" title="${isAr ? 'الهدف المنشود' : 'Target Goal'}: < ${ldlTargetDisplay}">
              <span class="lipid-gap-target-pin">&lt; ${ldlTargetDisplay}</span>
            </div>
            <div class="lipid-gap-current-marker" style="left: ${currentPos}%;" title="${isAr ? 'المستوى الحالي' : 'Current'}: ${ldlCurrentDisplay}">
              <span class="lipid-gap-current-pin">${ldlCurrentDisplay}</span>
            </div>
          </div>
          <div class="lipid-gap-scale-legend">
            <span>0</span>
            <span class="lipid-gap-legend-center">${isAr ? 'الهدف المحدد' : 'Goal Target'}: &lt; ${ldlTargetDisplay}</span>
            <span>${Math.round(maxScaleMg)} mg/dL</span>
          </div>
        </div>
      </div>
    `;

    let stepsHtml = '';
    pathway.steps.forEach(s => {
      let stepBadge = '';
      if (s.stepNumber === 1) {
        stepBadge = pathway.onStatin
          ? `<span class="lipid-step-badge is-current">${isAr ? 'قيد الاستخدام' : 'In Current Plan'}</span>`
          : `<span class="lipid-step-badge is-escalation">${isAr ? 'الخطوة الأولى' : 'Step 1 (First-line)'}</span>`;
      } else if (s.stepNumber === 2) {
        stepBadge = pathway.onEzetimibe
          ? `<span class="lipid-step-badge is-current">${isAr ? 'قيد الاستخدام' : 'In Current Plan'}</span>`
          : (pathway.onStatin && !gap.isAtTarget
              ? `<span class="lipid-step-badge is-escalation">${isAr ? 'التصعيد الموصى به' : 'Recommended Escalation'}</span>`
              : `<span class="lipid-step-badge is-reserve">${isAr ? 'الخطوة التالية' : 'Next Step If Above Goal'}</span>`);
      } else if (s.stepNumber === 3) {
        stepBadge = (pathway.onEzetimibe && !gap.isAtTarget)
          ? `<span class="lipid-step-badge is-escalation">${isAr ? 'التصعيد الموصى به' : 'Recommended Escalation'}</span>`
          : `<span class="lipid-step-badge is-reserve">${isAr ? 'احتياطي متقدم' : 'Advanced Reserve'}</span>`;
      }

      stepsHtml += `
        <div class="lipid-step-card">
          <div class="lipid-step-header">
            <span class="lipid-step-num">${s.stepNumber}</span>
            <span class="lipid-step-title">${isAr ? s.titleAr : s.titleEn}</span>
            ${stepBadge}
          </div>
          <div class="lipid-step-drug">💊 <b>${isAr ? s.drugAr : s.drugEn}</b></div>
          <div class="lipid-step-desc">${isAr ? s.detailAr : s.detailEn}</div>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="lipids-wrapper ${isAr ? 'rtl' : 'ltr'}">
        <!-- Hero Risk Stratification Banner -->
        <div class="lipid-hero-card">
          <div class="lipid-hero-main">
            <div class="lipid-tier-row">
              <span class="lipid-badge ${t.badgeClass}">${isAr ? t.nameAr : t.nameEn}</span>
              ${statusBadge}
            </div>
            <div class="lipid-reason">${isAr ? strat.reasonAr : strat.reasonEn}</div>
            <div class="lipid-ascvd-est">
              📊 <b>${isAr ? 'مخاطر القلب والشرايين لـ 10 سنوات (ASCVD Risk):' : '10-Year ASCVD Risk:'}</b> ${strat.ascvdRisk}%
            </div>
          </div>
        </div>

        <!-- Metrics Grid: Current vs Targets -->
        <div class="lipid-metrics-grid">
          <div class="lipid-metric-box">
            <div class="lipid-metric-lbl">${isAr ? 'الكوليسترول الضار (LDL-C)' : 'LDL-C'}</div>
            <div class="lipid-metric-val ${gap.isAtTarget ? 'text-success' : 'text-danger'}">${ldlCurrentDisplay}</div>
            <div class="lipid-metric-target">${isAr ? 'الهدف:' : 'Target:'} <b>&lt; ${ldlTargetDisplay}</b></div>
          </div>

          <div class="lipid-metric-box">
            <div class="lipid-metric-lbl">${isAr ? 'الكوليسترول غير المفيد (Non-HDL)' : 'Non-HDL'}</div>
            <div class="lipid-metric-val">${nonHdlCurrentDisplay}</div>
            <div class="lipid-metric-target">${isAr ? 'الهدف:' : 'Target:'} <b>&lt; ${nonHdlTargetDisplay}</b></div>
          </div>

          <div class="lipid-metric-box">
            <div class="lipid-metric-lbl">${isAr ? 'الدهون الثلاثية (Triglycerides)' : 'Triglycerides'}</div>
            <div class="lipid-metric-val ${labs.tgMg >= 500 ? 'text-critical' : ''}">${pathway.isMmol ? `${labs.tgMmol} mmol/L` : `${labs.tgMg} mg/dL`}</div>
            <div class="lipid-metric-target">${isAr ? 'الهدف:' : 'Target:'} <b>&lt; 150 mg/dL</b></div>
          </div>

          <div class="lipid-metric-box">
            <div class="lipid-metric-lbl">${isAr ? 'الكوليسترول الكلي و HDL' : 'Total & HDL'}</div>
            <div class="lipid-metric-val">${pathway.isMmol ? `${labs.tcMmol} / ${labs.hdlMmol}` : `${labs.tcMg} / ${labs.hdlMg}`}</div>
            <div class="lipid-metric-target">${isAr ? 'إنزيم الكبد ALT:' : 'Liver ALT:'} <b>${labs.altUl} U/L</b></div>
          </div>
        </div>

        <!-- LDL Gap Visualizer Card -->
        ${gapVisualizerHtml}

        <!-- Safety Guardrails Alerts -->
        ${alertsHtml ? `<div class="lipid-alerts-section">${alertsHtml}</div>` : ''}

        <!-- Sequential Treatment Pathway -->
        <div class="lipid-pathway-section">
          <h3 class="lipid-section-title">🎯 ${isAr ? 'خطة العلاج المتسلسلة (ADA 2025 / ESC 2023)' : 'Sequential Treatment Pathway (ADA/ESC)'}</h3>
          <div class="lipid-steps-list">
            ${stepsHtml}
          </div>
        </div>

        <!-- Monitoring Timeline -->
        <div class="lipid-timeline-box">
          <b>📅 ${isAr ? 'جدول المتابعة والتحاليل:' : 'Laboratory Monitoring Schedule:'}</b>
          <ul>
            <li>${isAr ? 'إعادة فحص الدهون الكامل (Lipid Profile) بعد 4 إلى 12 أسبوعاً من بدء أو زيادة جرعة الستاتين.' : 'Reassess fasting lipid profile in 4–12 weeks after statin initiation or dose adjustment.'}</li>
            <li>${isAr ? 'فحص إنزيمات الكبد (ALT/AST) عند البدء أو عند ظهور أعراض، وفحص CK في حال وجود آلام عضلية شديدة.' : 'Check ALT at baseline and repeat if symptomatic; check serum CK if significant muscle pain occurs.'}</li>
            <li>${isAr ? 'فحص زلال البول UACR ووظائف الكلى eGFR سنوياً لمرضى السكري والضغط.' : 'Annual surveillance of eGFR and UACR for all DM/HTN patients.'}</li>
          </ul>
        </div>
      </div>
    `;
  }

  // Reactive subscription to cross-engine updates
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('osrawy:patient-updated', function(e) {
      const el = (typeof document !== 'undefined') ? (document.getElementById('lipids-container') || document.getElementById('lipid-engine-summary') || document.getElementById('ldl-matrix-container')) : null;
      if (el) {
        renderLipidsSummary(el.id);
      }
    });
  }

  return {
    toMgDl,
    toMmolL,
    estimate10YrAscvdRisk,
    stratifyRisk,
    evaluateLipidPathway,
    renderLipidsSummary,
    RISK_TIERS
  };
})();

if (typeof window !== 'undefined') {
  window.OsrawyLipidsEngine = OsrawyLipidsEngine;
  window.LipidsEngine = OsrawyLipidsEngine;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OsrawyLipidsEngine;
}

```

---
