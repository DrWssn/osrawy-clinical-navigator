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
      btn_theme: "تبديل الوضع الليلي",
      btn_settings: "إعدادات الطبيب والعيادة",

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
      btn_ldl_matrix_nav: "أهداف LDL والستاتين",
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
      soap_fab_label: "ملخص SOAP",
      soap_drawer_title: "ملخص الاستشارة الطبية (SOAP)",
      soap_pull_btn: "🔄 تحديث من المحركات",
      soap_copy_btn: "📋 نسخ الملاحظة",
      handoff_enter_btn: "📱 وضع شاشة المريض",
      handoff_exit_btn: "✕ إنهاء وضع المريض"
    },

    en: {
      // General App Branding & Top Bar
      app_title: "Osrawy Clinical Navigator",
      app_subtitle: "Dr Hossam Yousuf · Family Practice",
      lang_toggle_btn: "🌐 عربي",
      lang_toggle_title: "التبديل إلى الواجهة العربية / Switch interface to Arabic",
      mkt_saudi_pill: "🇸🇦 Saudi Market (SAR)",
      mkt_egypt_pill: "🇪🇬 Egypt Market (EGP)",
      btn_save_draft: "Save to drafts (Offline)",
      btn_theme: "Toggle Dark Mode",
      btn_settings: "Doctor & Clinic Settings",

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
      btn_calc: "Calculator",
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
      soap_fab_label: "SOAP Note",
      soap_drawer_title: "EMR SOAP Consultation Summary",
      soap_pull_btn: "🔄 Pull Active Engines",
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
      if (activeMkt === 'saudi') {
        mktBtn.textContent = isAr ? '🇸🇦 السوق السعودي (SAR)' : '🇸🇦 Saudi Market (SAR)';
      } else {
        mktBtn.textContent = isAr ? '🇪🇬 السوق المصري (EGP)' : '🇪🇬 Egypt Market (EGP)';
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
