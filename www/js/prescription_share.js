// ==============================================================
// Prescription Formatter, WhatsApp Sharer & Native PDF/Print
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
    const pt = PatientSync.get();
    const rxCard = document.getElementById('rxcard');
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

    const invEl = document.querySelector('.rx-inv');
    const investigations = invEl ? invEl.innerText.replace('Investigations requested:', '').trim() : '';

    const fuEl = document.querySelector('.rx-fu');
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
    if (rx.patient.sbp) text += `📊 *الضغط:* ${rx.patient.sbp}/${rx.patient.dbp} mmHg | *BMI:* ${PatientSync.getBMI(rx.patient.wt, rx.patient.ht) || '—'}\n`;
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
    const pt = PatientSync.get();
    const cfg = loadSettings();
    let text = `*${cfg.doctorName}*\n`;
    text += `_${cfg.doctorTitle}_\n`;
    if (cfg.clinicName) text += `${cfg.clinicName}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 *المريض:* ${pt.name || 'مريض'} | *العمر:* ${pt.age} سنة | *التاريخ:* ${new Date().toLocaleDateString('ar-SA')}\n`;
    text += `📊 *الضغط:* ${pt.sbp || 148}/${pt.dbp || 94} mmHg | *eGFR:* ${pt.egfr} | *UACR:* ${pt.uacr} mg/g\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💓 *توصيات وخطة علاج ارتفاع ضغط الدم:*\n\n`;

    const outEl = document.getElementById('out');
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

  function shareHtnWhatsApp() {
    const text = buildHtnWhatsAppText();
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encoded}`;
    if (navigator.share) {
      navigator.share({
        title: 'Hypertension Plan / خطة علاج الضغط',
        text: text
      }).catch(() => {
        window.open(url, '_blank');
      });
    } else {
      window.open(url, '_blank');
    }
  }

  function shareToWhatsApp() {
    const text = buildWhatsAppText();
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encoded}`;
    
    // If native share is supported and available, try it
    if (navigator.share) {
      navigator.share({
        title: 'Prescription / وصفة علاجية',
        text: text
      }).catch(() => {
        window.open(url, '_blank');
      });
    } else {
      window.open(url, '_blank');
    }
  }

  function copySummaryToClipboard() {
    const text = buildWhatsAppText();
    navigator.clipboard.writeText(text).then(() => {
      showToast('✅ تم نسخ الوصفة العلاجية بنجاح!');
    }).catch(() => {
      showToast('❌ تعذر النسخ للحافظة');
    });
  }

  function printPrescription() {
    if (window.AndroidPrint && typeof window.AndroidPrint.print === 'function') {
      window.AndroidPrint.print();
    } else {
      window.print();
    }
  }

  function showToast(msg) {
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

  function copyHtnToClipboard() {
    const text = buildHtnWhatsAppText();
    navigator.clipboard.writeText(text).then(() => {
      showToast('✅ تم نسخ خطة علاج الضغط بنجاح!');
    }).catch(() => {
      showToast('❌ تعذر النسخ للحافظة');
    });
  }

  return {
    loadSettings,
    saveSettings,
    getPrescriptionData,
    buildWhatsAppText,
    buildHtnWhatsAppText,
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

