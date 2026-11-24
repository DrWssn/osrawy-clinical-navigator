/**
 * Osrawy Clinical Navigator - Global Clinical Command Palette (Spotlight / Cmd+K)
 * Zero-dependency, offline-ready fuzzy search and clinical navigation registry.
 */

const CommandPalette = (function() {
  'use strict';

  // Clinical Registry
  const CLINICAL_REGISTRY = [
    {
      id: 'kdigo-heatmap',
      titleEn: 'KDIGO 2024 CKD Prognostic Heatmap',
      titleAr: 'مصفوفة التنبؤ الكلوي KDIGO 2024',
      descEn: '5×3 Risk Grid (GFR × UACR) with nephrology referral & surveillance intervals',
      descAr: 'مصفوفة الخطورة 5×3 (الانحدار الكلوي والزلال) مع فترات المتابعة والتحويل',
      category: 'Nephrology',
      badge: '5×3 Grid',
      icon: '🗺️',
      tab: 'tab-tools',
      targetId: 'kdigo-matrix-card',
      keywords: ['kdigo', 'ckd', 'uacr', 'albuminuria', 'proteinuria', 'heat', 'map', 'nephrology', 'gfr', 'crcl', 'stage']
    },
    {
      id: 'egfr-crcl-calc',
      titleEn: 'Kidney Function & CrCl (CKD-EPI 2021 & Cockcroft-Gault)',
      titleAr: 'حاسبة وظائف الكلى وتصفية الكرياتينين (CKD-EPI & CrCl)',
      descEn: 'Race-free eGFR paired with Cockcroft-Gault CrCl for drug dosing',
      descAr: 'حساب eGFR وتصفية الكرياتينين لضبط جرعات الأدوية بدقة',
      category: 'Nephrology',
      badge: 'eGFR + CrCl',
      icon: '🫘',
      tab: 'tab-tools',
      targetId: 'egfr-crcl-card',
      keywords: ['egfr', 'crcl', 'ckd-epi', 'cockcroft', 'creatinine', 'scr', 'kidney', 'clearance', 'renal', 'filtration']
    },
    {
      id: 'renal-drug-matrix',
      titleEn: 'Renal Drug Adjustment Matrix (Metformin, SGLT2i, GLP-1, DPP-4i)',
      titleAr: 'مصفوفة ضبط جرعات أدوية السكري حسب وظائف الكلى',
      descEn: 'Automated dosing caps and contraindications across eGFR thresholds',
      descAr: 'حدود الجرعات وموانع الاستعمال التلقائية حسب معدل الترشيح',
      category: 'Pharmacotherapy',
      badge: 'Renal Caps',
      icon: '💊',
      tab: 'tab-tools',
      targetId: 'egfr-crcl-card',
      keywords: ['renal drug', 'metformin renal', 'sglt2 renal', 'glp1 renal', 'dpp4 renal', 'dosing', 'contraindication']
    },
    {
      id: 'doac-calc',
      titleEn: 'DOAC Renal Dosing & Apixaban Dose-Reduction Criteria',
      titleAr: 'جرعات مضادات التخثر الحديثة (DOAC) ومعايير تخفيض أبيكسابان',
      descEn: 'Apixaban 2-of-3 criteria (Age ≥80, Wt ≤60kg, SCr ≥1.5) & Rivaroxaban meal guidance',
      descAr: 'فحص معايير تخفيض جرعة Eliquis وتوجيهات Xarelto مع الطعام',
      category: 'Cardiology',
      badge: 'DOAC',
      icon: '🩸',
      tab: 'tab-tools',
      targetId: 'doac-card',
      keywords: ['doac', 'apixaban', 'eliquis', 'rivaroxaban', 'xarelto', 'anticoagulation', 'afib', 'stroke', 'bleeding']
    },
    {
      id: 'fib4-calc',
      titleEn: 'FIB-4 Liver Fibrosis Scale Meter',
      titleAr: 'مؤشر تليف الكبد FIB-4 (AASLD / ADA 2025)',
      descEn: 'Continuous scale meter with age-adjusted cutoffs (<1.30, 1.30-2.67, >2.67)',
      descAr: 'مقياس بصري مستمر لخطورة تليف الكبد مع التوصيات السريرية',
      category: 'Hepatology',
      badge: 'FIB-4',
      icon: '🩺',
      tab: 'tab-tools',
      targetId: 'fib4-card',
      keywords: ['fib4', 'fib-4', 'liver', 'fibrosis', 'nafld', 'masld', 'steatotic', 'ast', 'alt', 'platelets', 'cirrhosis']
    },
    {
      id: 'micro-tools',
      titleEn: 'Bedside Micro-Tools (eAG, Corr Calcium, Steroid Equivalence)',
      titleAr: 'الحاسبات السريرية السريعة (متوسط السكر، الكالسيوم المصحح، مكافئات الكورتيزون)',
      descEn: 'HbA1c ⟷ eAG, Calcium correction for hypoalbuminemia, and Steroid dose ratios',
      descAr: 'تحويل التراكمي لسكر متوسط، تصحيح الكالسيوم للألبومين، ومكافئات الكورتيزون',
      category: 'Calculators',
      badge: 'Micro-Tools',
      icon: '🧮',
      tab: 'tab-tools',
      targetId: 'micro-tools-card',
      keywords: ['micro', 'eag', 'a1c', 'hba1c', 'calcium', 'corrected calcium', 'albumin', 'steroid', 'prednisone', 'dexa', 'hydrocortisone']
    },
    {
      id: 'htn-hemodynamics',
      titleEn: 'Hypertension Engine & Hemodynamics Telemetry (MAP & PP)',
      titleAr: 'محرك ضغط الدم والقياسات الحركية (MAP وضغط النبض PP)',
      descEn: 'Real-time Mean Arterial Pressure, Pulse Pressure, and arterial stiffness alert',
      descAr: 'حساب متوسط الضغط الشرياني وضغط النبض ومؤشر تصلب الشرايين',
      category: 'Hypertension',
      badge: 'BP & MAP',
      icon: '❤️',
      tab: 'tab-htn',
      targetId: 'sbp',
      keywords: ['htn', 'hypertension', 'bp', 'sbp', 'dbp', 'map', 'pulse pressure', 'arterial stiffness', 'hemodynamics']
    },
    {
      id: 'prevent-cvd',
      titleEn: 'AHA PREVENT™ Cardiovascular Risk Estimator',
      titleAr: 'حاسبة AHA PREVENT لمخاطر القلب والأوعية (10 سنوات و30 سنة)',
      descEn: '10-year and 30-year total CVD risk with sex-specific baseline risk',
      descAr: 'تقدير احتمالية الإصابة القلبية الوعائية خلال 10 سنوات و30 سنة',
      category: 'Cardiovascular',
      badge: 'PREVENT',
      icon: '📈',
      tab: 'tab-htn',
      targetId: 'riskbox',
      keywords: ['prevent', 'cvd', 'cardiovascular risk', '10-year', 'aha', 'ascvd', 'risk calculator']
    },
    {
      id: 'diabetes-engine',
      titleEn: 'ADA 2025 Diabetes Decision Engine',
      titleAr: 'محرك علاج السكري النوع الثاني (ADA 2025)',
      descEn: 'Comorbidity-first therapy (CKD, HF, ASCVD, Obesity) & personalized HbA1c target',
      descAr: 'الخطة العلاجية الموجهة بالمضاعفات والهدف الشخصي للسكر التراكمي',
      category: 'Endocrinology',
      badge: 'Diabetes',
      icon: '🩸',
      tab: 'tab-diabetes',
      targetId: 'tab-diabetes',
      keywords: ['diabetes', 'dm', 'sugar', 'hba1c', 'sglt2', 'glp1', 'metformin', 'insulin', 'mounjaro', 'ozempic', 'tirzepatide']
    },
    {
      id: 'lipids-engine',
      titleEn: 'Dyslipidemia & Statin Escalation Engine (ADA 2025 / ESC 2023)',
      titleAr: 'محرك إدارة الدهون والكولسترول وخطة السفاتين (ESC / ADA)',
      descEn: 'ASCVD risk stratification, LDL targets (<55, <70), and Ezetimibe/PCSK9i step-up',
      descAr: 'تصنيف خطورة تصلب الشرايين وتصعيد جرعات الستاتين وإزيتيميب',
      category: 'Lipidology',
      badge: 'Lipids',
      icon: '🎯',
      tab: 'tab-dlp',
      targetId: 'tab-dlp',
      keywords: ['ldl', 'lipids', 'cholesterol', 'statin', 'atorvastatin', 'rosuvastatin', 'ezetimibe', 'pcsk9', 'ascvd', 'tg', 'triglycerides']
    },
    {
      id: 'primary-asthma',
      titleEn: 'Asthma GINA 2024 Track 1 MART Protocol',
      titleAr: 'إرشادات الربو الشعبي GINA 2024 (المسار المفضل MART)',
      descEn: 'Symptom control, SABA overuse warning, and ICS-Formoterol step-up protocol',
      descAr: 'تقييم التحكم السريري والتحذير من إفراط الفنتولين وبروتوكول MART',
      category: 'Pulmonology',
      badge: 'Asthma',
      icon: '🫁',
      tab: 'tab-primary-care',
      subtab: 'asthma',
      targetId: 'pc-panel-asthma',
      keywords: ['asthma', 'gina', 'mart', 'symbicort', 'formoterol', 'budesonide', 'saba', 'ventolin', 'inhaler']
    },
    {
      id: 'primary-copd',
      titleEn: 'COPD GOLD 2025 Strategy (Groups A, B, E)',
      titleAr: 'إرشادات السدة الرئوية المزمنة GOLD 2025 (المجموعات A, B, E)',
      descEn: 'Exacerbation classification, Blood Eosinophil cutoffs (<100 vs ≥300), and Triple Therapy',
      descAr: 'تصنيف النوبات، فحص خلايا الإيوزينوفيل، والعلاج الثلاثي LABA+LAMA+ICS',
      category: 'Pulmonology',
      badge: 'COPD',
      icon: '🌬️',
      tab: 'tab-primary-care',
      subtab: 'copd',
      targetId: 'pc-panel-copd',
      keywords: ['copd', 'gold', 'triple therapy', 'eosinophils', 'lama', 'laba', 'exacerbations', 'spiriva', 'trelegy']
    },
    {
      id: 'primary-thyroid',
      titleEn: 'Hypothyroidism & Levothyroxine Replacement',
      titleAr: 'خمول الغدة الدرقية وجرعات ليفوثيروكسين الدقيقة',
      descEn: 'Weight-based replacement (1.6 mcg/kg), elderly/ASCVD conservative start, and pregnancy goals',
      descAr: 'حساب جرعة الثيروكسين حسب الوزن وتعديل الجرعة لمرضى القلب والحوامل',
      category: 'Endocrinology',
      badge: 'Thyroid',
      icon: '🦋',
      tab: 'tab-primary-care',
      subtab: 'thyroid',
      targetId: 'pc-panel-thyroid',
      keywords: ['thyroid', 'tsh', 'ft4', 'hypothyroidism', 'levothyroxine', 'eltroxin', 'euthyrox', 'hashimoto']
    },
    {
      id: 'drug-directory',
      titleEn: 'Drugs Directory & Market Alternatives (Saudi SAR / Egypt EGP)',
      titleAr: 'دليل الأدوية والأسعار والبدائل التجارية (السعودية / مصر)',
      descEn: 'Instant search across brand names, scientific names, doses, and local market prices',
      descAr: 'البحث الفوري في الأسماء التجارية والعلمية والأسعار والبدائل المكافئة',
      category: 'Pharmacy',
      badge: 'Drugs',
      icon: '💊',
      tab: 'tab-drugs',
      targetId: 'tab-drugs',
      keywords: ['drugs', 'directory', 'prices', 'saudi', 'egypt', 'sar', 'egp', 'alternatives', 'generics', 'medication']
    },
    {
      id: 'saved-drafts',
      titleEn: 'Saved Patients & Consultation Drafts',
      titleAr: 'مسودات المرضى والملفات المحفوظة',
      descEn: 'Restore recent clinical states, patient consultation sessions, and SOAP drafts',
      descAr: 'استرجاع ملفات المرضى السابقة وجلسات الكشف ومسودات SOAP',
      category: 'EMR Records',
      badge: 'Drafts',
      icon: '📋',
      tab: 'tab-recent',
      targetId: 'tab-recent',
      keywords: ['recent', 'drafts', 'saved', 'patient list', 'restore', 'history', 'records']
    },
    {
      id: 'patient-leaflets',
      titleEn: 'Bilingual Patient Education Leaflets & QR Generator',
      titleAr: 'المطويات التثقيفية للمريض وتوليد باركود QR للموبايل',
      descEn: 'Instant QR code scan for Arabic/English disease & medication instruction guides',
      descAr: 'توليد باركود فوري يمسحه المريض بكاميرا هاتفه لقراءة إرشادات العلاج',
      category: 'Patient Education',
      badge: 'Leaflets',
      icon: '📲',
      tab: 'tab-leaflets',
      targetId: 'tab-leaflets',
      keywords: ['leaflets', 'qr', 'education', 'patient handoff', 'print', 'qr code', 'instructions']
    },
    {
      id: 'soap-drawer',
      titleEn: 'EMR SOAP Progress Note & Prescription Cart',
      titleAr: 'مذكرة الكشف الطبي SOAP وسلة الوصفة الإلكترونية',
      descEn: 'Auto-aggregated clinical note ready for 1-tap copy to hospital EMR',
      descAr: 'المذكرة الطبية التلقائية الجاهزة للنسخ بنقرة واحدة إلى السجل الصحي',
      category: 'Clinical Notes',
      badge: 'SOAP',
      icon: '📝',
      action: 'open_soap',
      keywords: ['soap', 'note', 'cart', 'rx', 'prescription', 'emr copy', 'progress note', 'plan']
    }
  ];

  let backdropEl = null;
  let modalEl = null;
  let inputEl = null;
  let resultsListEl = null;
  let selectedIndex = 0;
  let currentFiltered = [];

  function isRtl() {
    return document.documentElement.dir === 'rtl' || (typeof I18n !== 'undefined' && I18n.getLang && I18n.getLang() === 'ar');
  }

  // Inline Math & Formula Evaluator
  function evaluateInlineMath(query) {
    const q = query.trim().toLowerCase();
    
    // MAP: "map 130/80" or "map 130 80" or "map 130,80"
    const mapMatch = q.match(/^map\s+(\d{2,3})[\s\/\,\-]+(\d{2,3})$/);
    if (mapMatch) {
      const sbp = parseInt(mapMatch[1], 10);
      const dbp = parseInt(mapMatch[2], 10);
      if (sbp > dbp && sbp <= 300 && dbp >= 30) {
        const pp = sbp - dbp;
        const map = Math.round(dbp + (pp / 3));
        const isAr = isRtl();
        return {
          type: 'calc',
          label: isAr ? `متوسط الضغط الشرياني (MAP) لـ ${sbp}/${dbp}` : `Mean Arterial Pressure (MAP) for ${sbp}/${dbp}`,
          val: `${map} mmHg (PP: ${pp} mmHg${pp >= 60 ? (isAr ? ' · مؤشر تصلب شرياني' : ' · Stiff Arteries') : ''})`,
          tab: 'tab-htn',
          targetId: 'sbp'
        };
      }
    }

    // HbA1c to eAG: "a1c 7.5" or "eag 7.5"
    const a1cMatch = q.match(/^(?:a1c|hba1c|eag)\s+(\d+(?:\.\d+)?)$/);
    if (a1cMatch) {
      const a1c = parseFloat(a1cMatch[1]);
      if (a1c >= 4 && a1c <= 20) {
        const eagMg = Math.round(28.7 * a1c - 46.7);
        const eagMmol = Math.round((eagMg / 18.0182) * 10) / 10;
        const isAr = isRtl();
        return {
          type: 'calc',
          label: isAr ? `السكر المتوسط التقديري (eAG) لـ A1c ${a1c}%` : `Estimated Average Glucose (eAG) for A1c ${a1c}%`,
          val: `${eagMg} mg/dL (${eagMmol} mmol/L)`,
          tab: 'tab-tools',
          targetId: 'micro-tools-card'
        };
      }
    }

    // Corrected Calcium: "ca 8.0 2.5" (Ca + Albumin)
    const caMatch = q.match(/^(?:ca|calcium)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
    if (caMatch) {
      const ca = parseFloat(caMatch[1]);
      const alb = parseFloat(caMatch[2]);
      if (ca > 0 && alb > 0) {
        const corrCa = Math.round((ca + 0.8 * (4.0 - alb)) * 10) / 10;
        const isAr = isRtl();
        return {
          type: 'calc',
          label: isAr ? `الكالسيوم المصحح لـ Ca ${ca} و Alb ${alb}` : `Corrected Calcium for Ca ${ca} and Alb ${alb}`,
          val: `${corrCa} mg/dL (${corrCa < 8.5 ? (isAr ? 'منخفض' : 'Low') : corrCa > 10.5 ? (isAr ? 'مرتفع' : 'High') : (isAr ? 'طبيعي' : 'Normal')})`,
          tab: 'tab-tools',
          targetId: 'micro-tools-card'
        };
      }
    }

    // BMI: "bmi 85 175" (Wt in kg, Ht in cm)
    const bmiMatch = q.match(/^bmi\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
    if (bmiMatch) {
      const wt = parseFloat(bmiMatch[1]);
      const ht = parseFloat(bmiMatch[2]);
      if (wt > 20 && ht > 80) {
        const htM = ht / 100;
        const bmi = Math.round((wt / (htM * htM)) * 10) / 10;
        const isAr = isRtl();
        const status = bmi < 18.5 ? (isAr ? 'نقص وزن' : 'Underweight') : (bmi < 25 ? (isAr ? 'وزن طبيعي' : 'Normal') : (bmi < 30 ? (isAr ? 'وزن زائد' : 'Overweight') : (isAr ? 'سمنة' : 'Obesity')));
        return {
          type: 'calc',
          label: isAr ? `مؤشر كتلة الجسم (BMI) لـ ${wt}كجم / ${ht}سم` : `Body Mass Index (BMI) for ${wt}kg / ${ht}cm`,
          val: `${bmi} kg/m² (${status})`,
          tab: 'tab-diabetes',
          targetId: 'pwt'
        };
      }
    }

    return null;
  }

  function filterRegistry(query) {
    if (!query || !query.trim()) {
      // Default / Pinned high-frequency items
      return CLINICAL_REGISTRY.slice(0, 8);
    }

    const q = query.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);

    return CLINICAL_REGISTRY.filter(item => {
      const searchable = [
        item.titleEn,
        item.titleAr,
        item.descEn,
        item.descAr,
        item.category,
        item.badge,
        ...(item.keywords || [])
      ].join(' ').toLowerCase();

      return tokens.every(token => searchable.includes(token));
    });
  }

  function renderResults(inlineCalc, items) {
    if (!resultsListEl) return;
    resultsListEl.innerHTML = '';
    currentFiltered = [];

    const isAr = isRtl();

    // Inline Calculator Item
    if (inlineCalc) {
      currentFiltered.push({ isInline: true, data: inlineCalc });
      const inlineDiv = document.createElement('div');
      inlineDiv.className = 'cmd-palette-inline-calc';
      inlineDiv.innerHTML = `
        <div class="cmd-palette-inline-label">⚡ ${inlineCalc.label}</div>
        <div class="cmd-palette-inline-val">${inlineCalc.val}</div>
      `;
      inlineDiv.onclick = () => executeItem({ isInline: true, data: inlineCalc });
      resultsListEl.appendChild(inlineDiv);
    }

    if (items.length === 0 && !inlineCalc) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.padding = '24px 16px';
      emptyDiv.style.textAlign = 'center';
      emptyDiv.style.color = 'var(--muted, #64748b)';
      emptyDiv.style.fontSize = '0.9rem';
      emptyDiv.textContent = isAr ? 'لم يتم العثور على نتائج مطابقة.' : 'No matching clinical tools found.';
      resultsListEl.appendChild(emptyDiv);
      return;
    }

    const titleDiv = document.createElement('div');
    titleDiv.className = 'cmd-palette-section-title';
    titleDiv.textContent = inputEl.value.trim() 
      ? (isAr ? 'النتائج المطابقة' : 'Matching Results')
      : (isAr ? 'الحاسبات والإرشادات السريعة' : 'Quick Access Tools');
    resultsListEl.appendChild(titleDiv);

    items.forEach((item, idx) => {
      currentFiltered.push(item);
      const row = document.createElement('div');
      row.className = `cmd-palette-item ${idx === 0 && !inlineCalc ? 'is-selected' : ''}`;
      row.setAttribute('data-index', idx + (inlineCalc ? 1 : 0));

      const title = isAr ? item.titleAr : item.titleEn;
      const desc = isAr ? item.descAr : item.descEn;

      row.innerHTML = `
        <div class="cmd-palette-item-icon">${item.icon}</div>
        <div class="cmd-palette-item-body">
          <div class="cmd-palette-item-title">${title}</div>
          <div class="cmd-palette-item-desc">${desc}</div>
        </div>
        <span class="cmd-palette-badge">${item.badge}</span>
      `;

      row.onclick = () => executeItem(item);
      row.onmouseenter = () => {
        setSelectedIndex(idx + (inlineCalc ? 1 : 0));
      };

      resultsListEl.appendChild(row);
    });

    setSelectedIndex(0);
  }

  function setSelectedIndex(idx) {
    const total = currentFiltered.length;
    if (total === 0) {
      selectedIndex = 0;
      return;
    }
    selectedIndex = Math.max(0, Math.min(idx, total - 1));

    const rows = resultsListEl.querySelectorAll('.cmd-palette-item');
    rows.forEach((r, rIdx) => {
      if (rIdx === selectedIndex) {
        r.classList.add('is-selected');
        r.scrollIntoView({ block: 'nearest' });
      } else {
        r.classList.remove('is-selected');
      }
    });
  }

  function executeItem(item) {
    if (!item) return;
    close();

    // Check if inline calc
    if (item.isInline) {
      if (item.data.tab && typeof window.switchMainTab === 'function') {
        window.switchMainTab(item.data.tab);
      }
      return;
    }

    // Special action (e.g., SOAP drawer)
    if (item.action === 'open_soap') {
      const fab = document.getElementById('osrawy-soap-fab');
      if (fab) fab.click();
      return;
    }

    // Switch main tab
    if (item.tab && typeof window.switchMainTab === 'function') {
      window.switchMainTab(item.tab);
    }

    // Primary Care subtabs (Asthma, COPD, Thyroid)
    if (item.subtab && typeof window.switchPrimaryCareTab === 'function') {
      setTimeout(() => {
        window.switchPrimaryCareTab(item.subtab);
      }, 50);
    }

    // Scroll to target element and highlight
    if (item.targetId) {
      setTimeout(() => {
        const targetEl = document.getElementById(item.targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetEl.classList.remove('tool-highlight-pulse');
          void targetEl.offsetWidth; // force reflow
          targetEl.classList.add('tool-highlight-pulse');
          setTimeout(() => {
            targetEl.classList.remove('tool-highlight-pulse');
          }, 3000);
        }
      }, 120);
    }
  }

  function open() {
    if (!backdropEl) initDom();
    backdropEl.classList.add('open');
    backdropEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (inputEl) {
      inputEl.value = '';
      const isAr = isRtl();
      inputEl.placeholder = isAr 
        ? 'ابحث عن حاسبة، دواء، أو إرشاد سريري... (أو اكتب map 130/80)'
        : 'Search calculators, drugs, guidelines... (or type map 130/80)';
      renderResults(null, filterRegistry(''));
      setTimeout(() => inputEl.focus(), 50);
    }
  }

  function close() {
    if (!backdropEl) return;
    backdropEl.classList.remove('open');
    backdropEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function isOpen() {
    return backdropEl && backdropEl.classList.contains('open');
  }

  function initDom() {
    if (backdropEl) return;

    backdropEl = document.createElement('div');
    backdropEl.id = 'command-palette-backdrop';
    backdropEl.className = 'cmd-palette-backdrop';
    backdropEl.setAttribute('aria-hidden', 'true');

    const isAr = isRtl();

    backdropEl.innerHTML = `
      <div class="cmd-palette-modal" role="dialog" aria-modal="true" aria-label="Clinical Command Palette">
        <div class="cmd-palette-header">
          <span class="cmd-palette-search-icon">🔍</span>
          <input type="text" class="cmd-palette-input" id="cmd-palette-input" autocomplete="off" spellcheck="false" placeholder="${isAr ? 'ابحث عن حاسبة، دواء، أو إرشاد سريري...' : 'Search calculators, drugs, guidelines...'}">
          <span class="cmd-palette-esc-badge">ESC</span>
        </div>
        <div class="cmd-palette-results" id="cmd-palette-results"></div>
        <div class="cmd-palette-footer">
          <div class="cmd-palette-keys">
            <span class="cmd-palette-key-hint"><kbd>↑</kbd><kbd>↓</kbd> ${isAr ? 'للتنقل' : 'Navigate'}</span>
            <span class="cmd-palette-key-hint"><kbd>↵</kbd> ${isAr ? 'للاختيار' : 'Select'}</span>
            <span class="cmd-palette-key-hint"><kbd>ESC</kbd> ${isAr ? 'للإغلاق' : 'Close'}</span>
          </div>
          <div>Osrawy Navigator</div>
        </div>
      </div>
    `;

    document.body.appendChild(backdropEl);

    modalEl = backdropEl.querySelector('.cmd-palette-modal');
    inputEl = backdropEl.querySelector('#cmd-palette-input');
    resultsListEl = backdropEl.querySelector('#cmd-palette-results');

    // Click backdrop to dismiss
    backdropEl.addEventListener('click', (e) => {
      if (e.target === backdropEl) close();
    });

    // Input events
    inputEl.addEventListener('input', () => {
      const q = inputEl.value;
      const inlineCalc = evaluateInlineMath(q);
      const items = filterRegistry(q);
      renderResults(inlineCalc, items);
    });

    // Keydown handling inside input
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(selectedIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(selectedIndex - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentFiltered[selectedIndex]) {
          executeItem(currentFiltered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    });

    // Global Key Listener for Cmd+K / Ctrl+K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isOpen()) close();
        else open();
      } else if (e.key === 'Escape' && isOpen()) {
        close();
      }
    });
  }

  // Auto-init on DOMContentLoaded
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDom);
    } else {
      initDom();
    }
  }

  return {
    open,
    close,
    isOpen,
    toggle: () => isOpen() ? close() : open(),
    getRegistry: () => CLINICAL_REGISTRY
  };
})();

// Export globally
if (typeof window !== 'undefined') {
  window.CommandPalette = CommandPalette;
}
if (typeof global !== 'undefined') {
  global.CommandPalette = CommandPalette;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CommandPalette;
}
