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
  function buildPrescriptionReport(lang) {
    const activeLang = lang || ((typeof window !== 'undefined' && typeof window.I18n !== 'undefined') ? window.I18n.getLang() : 'ar');
    const isAr = (activeLang === 'ar');
    const cfg = loadSettings();
    const pt = (typeof PatientSync !== 'undefined') ? PatientSync.get() : {};
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
      const activeMedsList = pt.activeMeds || pt.meds || pt.currentMeds || [];
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
          text += `🔹 *علاج الربو الشعبي (GINA 2024):*\n`;
          text += `  • ${pcReport.asthma.trackNameAr} - ${pcReport.asthma.recommendation.nameAr}\n\n`;
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
          text += `• الخيار الأول المعتمد: ${htnPreg.firstLine.drugNameAr} - ${htnPreg.firstLine.doseAr}\n`;
          text += `• مبرر الاختيار: ${htnPreg.firstLine.reasonAr}\n`;
          if (htnPreg.aspirinProphylaxis && htnPreg.aspirinProphylaxis.indicated) {
            text += `• وقاية تسمم الحمل: أسبرين أطفال (81–150 مجم/يوم عند النوم حتى الأسبوع 36)\n`;
          }
          if (htnPreg.methyldopaDepressionWarning) {
            text += `• تحذير ميثيل دوبا: ${htnPreg.methyldopaDepressionWarning.titleAr} - ${htnPreg.methyldopaDepressionWarning.actionAr}\n`;
          }
          if (htnPreg.isSevereEmergency) {
            text += `• 🚨 طوارئ ارتفاع الضغط الشديد (≥160/110): يتطلب خفضاً إسعافياً خلال 30-60 دقيقة وكبريتات المغنيسيوم.\n`;
          }
          text += `• أدوية محظورة تم إيقافها فوراً: ${htnPreg.stoppedDrugs.join('، ')}\n`;
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
      const activeMedsListEn = pt.activeMeds || pt.meds || pt.currentMeds || [];
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
          text += `🔹 *Asthma Care (GINA 2024):*\n`;
          text += `  • ${pcReport.asthma.trackNameEn} - ${pcReport.asthma.recommendation.nameEn}\n\n`;
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
          text += `• Recommended First-Line: ${htnPreg.firstLine.drugName} - ${htnPreg.firstLine.doseEn}\n`;
          text += `• Clinical Rationale: ${htnPreg.firstLine.reasonEn}\n`;
          if (htnPreg.aspirinProphylaxis && htnPreg.aspirinProphylaxis.indicated) {
            text += `• Preeclampsia Prophylaxis: Low-dose Aspirin (81–150 mg/day at bedtime through 36 weeks)\n`;
          }
          if (htnPreg.methyldopaDepressionWarning) {
            text += `• Methyldopa Warning: ${htnPreg.methyldopaDepressionWarning.titleEn} - ${htnPreg.methyldopaDepressionWarning.actionEn}\n`;
          }
          if (htnPreg.isSevereEmergency) {
            text += `• 🚨 Severe Obstetric HTN Emergency (≥160/110): Immediate IV lowering and Magnesium Sulfate required.\n`;
          }
          text += `• Teratogens Stopped: ${htnPreg.stoppedDrugs.join(', ')}\n`;
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
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('✅ تم نسخ الوصفة العلاجية بنجاح!');
      }).catch(() => {
        showToast('❌ تعذر النسخ للحافظة');
      });
    }
  }

  function copyHtnToClipboard() {
    const text = buildHtnWhatsAppText();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('✅ تم نسخ خطة علاج الضغط بنجاح!');
      }).catch(() => {
        showToast('❌ تعذر النسخ للحافظة');
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
