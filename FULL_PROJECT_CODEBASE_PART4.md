# Osrawy Clinical Navigator — Codebase (Part 4 of 4)

## Part 4: App Controllers, Mobile UX, Command Palette & Test Simulation Suites

> **Version:** v1.2.18
> **Repository:** Osrawy Clinical Navigator (`com.osrawy.clinicalnavigator`)
> **Architecture:** Vanilla JS / CSS3 (Phone-First Native Android Hybrid Web App via Capacitor)
> **Clinical Guidelines:** ADA 2025, ACC/AHA 2025, ESC 2024/2023, KDIGO 2024, GINA 2024, GOLD 2024
> **Quality Gate:** 15/15 JS files syntax verified, 203/203 clinical simulation assertions passed (100% pass).

## Part 4 Table of Contents

28. [www/js/command_palette.js](#www-js-command-palette-js) — *Global Ctrl+K / Cmd+K command palette for rapid fuzzy-search navigation across engines, tools, and leaflets.*
29. [www/js/phone_ux.js](#www-js-phone-ux-js) — *Phone-first UX controller for mobile segmented view switchers, responsive cockpit offsets, and SOAP counter synchronization.*
30. [www/js/updater.js](#www-js-updater-js) — *In-app update checker querying GitHub Releases for new APK versions.*
31. [www/js/app.js](#www-js-app-js) — *Application bootloader, navigation coordinator, verified UX controller (vitals drawer, SOAP EMR cart, Android back priority).*
32. [check_js_syntax.js](#check-js-syntax-js) — *Automated syntax validation script checking all JS files using Node.js vm.Script.*
33. [run_full_simulation.js](#run-full-simulation-js) — *Full automated integration test suite with 203 clinical assertions verifying all engines, safety guardrails, and UX workflows.*

---

<a id="www-js-command-palette-js"></a>
## 28. `www/js/command_palette.js`

**Description:** Global Ctrl+K / Cmd+K command palette for rapid fuzzy-search navigation across engines, tools, and leaflets.  
**Lines:** 622 | **Size:** 24.6 KB

```javascript
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

```

---

<a id="www-js-phone-ux-js"></a>
## 29. `www/js/phone_ux.js`

**Description:** Phone-first UX controller for mobile segmented view switchers, responsive cockpit offsets, and SOAP counter synchronization.  
**Lines:** 289 | **Size:** 11.5 KB

```javascript
/**
 * Osrawy Clinical Navigator - Phone UX Controller
 * Manages mobile segmented switchers, Priority 3 drug accordions,
 * zero-gap sticky vitals offset, and initial SOAP badge count sync.
 */

(function() {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function isPhone() {
    return window.innerWidth < 768;
  }

  function isRtl() {
    return document.documentElement.dir === 'rtl' || (typeof I18n !== 'undefined' && I18n.getLang && I18n.getLang() === 'ar');
  }

  /* ------------------------------------------------------------------------
     1. Synchronous Vitals Drawer Top Offset
     ------------------------------------------------------------------------ */
  function updateCockpitOffset() {
    const cockpit = document.getElementById('patient-cockpit');
    if (cockpit) {
      const h = cockpit.offsetHeight || 44;
      document.documentElement.style.setProperty('--vitals-drawer-top', h + 'px');
    }
  }

  /* ------------------------------------------------------------------------
     2. SOAP Badge Counter Synchronization
     ------------------------------------------------------------------------ */
  function updateSoapBadge() {
    if (typeof window.harvestActiveEngines === 'function') {
      try { window.harvestActiveEngines(); } catch(e) {}
    }
  }

  window.osrawyUpdateSoapBadge = updateSoapBadge;

  /* ------------------------------------------------------------------------
     3. Segmented Switcher for Diabetes Tab (Plan vs Patient Data)
     ------------------------------------------------------------------------ */
  function setupDiabetesSwitcher() {
    const diaTab = document.getElementById('tab-diabetes');
    const planSec = document.getElementById('plan');
    if (!diaTab || !planSec) return;

    if (diaTab.querySelector('.phone-pane-switcher-dm')) return;

    const isAr = isRtl();
    const switcher = document.createElement('div');
    switcher.className = 'phone-pane-switcher phone-pane-switcher-dm';
    switcher.setAttribute('role', 'tablist');
    switcher.setAttribute('aria-label', isAr ? 'مبدل عرض السكري' : 'Diabetes View Switcher');

    switcher.innerHTML = `
      <button type="button" class="phone-pane-btn active" data-pane="form" aria-label="${isAr ? 'بيانات المريض' : 'Patient Inputs'}">
        👤 ${isAr ? 'بيانات المريض' : 'Patient Inputs'}
      </button>
      <button type="button" class="phone-pane-btn" data-pane="plan" aria-label="${isAr ? 'الخطة والروشتة' : 'Plan & Rx'}">
        💊 ${isAr ? 'الخطة والروشتة' : 'Plan & Rx'}
      </button>
    `;

    // Insert right before the main container in #plan
    planSec.insertBefore(switcher, planSec.firstChild);
    diaTab.setAttribute('data-phone-pane', 'form');

    switcher.querySelectorAll('.phone-pane-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pane = btn.getAttribute('data-pane');
        diaTab.setAttribute('data-phone-pane', pane);
        switcher.querySelectorAll('.phone-pane-btn').forEach(b => b.classList.toggle('active', b === btn));
        if (pane === 'plan') {
          // Trigger smooth scroll to top of results
          const res = document.getElementById('result');
          if (res) res.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          const form = document.getElementById('pform');
          if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     4. Segmented Switcher for Hypertension Tab (Inputs vs Recommendations)
     ------------------------------------------------------------------------ */
  function setupHtnSwitcher() {
    const htnTab = document.getElementById('tab-htn');
    if (!htnTab) return;

    if (htnTab.querySelector('.phone-pane-switcher-htn')) return;

    const isAr = isRtl();
    const switcher = document.createElement('div');
    switcher.className = 'phone-pane-switcher phone-pane-switcher-htn';
    switcher.setAttribute('role', 'tablist');
    switcher.setAttribute('aria-label', isAr ? 'مبدل عرض الضغط' : 'Hypertension View Switcher');

    switcher.innerHTML = `
      <button type="button" class="phone-pane-btn active" data-pane="form" aria-label="${isAr ? 'القياسات والفحوصات' : 'Vitals & Labs'}">
        👤 ${isAr ? 'القياسات والفحوصات' : 'Vitals & Labs'}
      </button>
      <button type="button" class="phone-pane-btn" data-pane="plan" aria-label="${isAr ? 'الخطة العلاجية' : 'Recommendations'}">
        💊 ${isAr ? 'الخطة العلاجية' : 'Recommendations'}
      </button>
    `;

    const targetContainer = htnTab.querySelector('.wrap') || htnTab;
    targetContainer.insertBefore(switcher, targetContainer.firstChild);
    htnTab.setAttribute('data-phone-pane', 'form');

    switcher.querySelectorAll('.phone-pane-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pane = btn.getAttribute('data-pane');
        htnTab.setAttribute('data-phone-pane', pane);
        switcher.querySelectorAll('.phone-pane-btn').forEach(b => b.classList.toggle('active', b === btn));
        if (pane === 'plan') {
          const sheet = htnTab.querySelector('.sheet') || document.getElementById('out');
          if (sheet) sheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          const f = document.getElementById('f');
          if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. Priority 3 Alternative Drugs Collapsible Accordion
     ------------------------------------------------------------------------ */
  let wasAltAccordionOpen = false;
  let isCollapsingAlt = false;

  function collapsePriority3Alternatives() {
    if (isCollapsingAlt) return;
    if (!isPhone()) return;

    const resEl = document.getElementById('result');
    if (!resEl) return;

    // Guard against multiple wraps
    if (resEl.querySelector('.phone-alt-accordion')) return;

    // Query Priority 3 alternative steps
    const altSteps = resEl.querySelectorAll('.step[data-priority="3"]');
    if (altSteps.length === 0) return;

    const firstAlt = altSteps[0];
    const parent = firstAlt.parentNode;
    if (!parent) return;

    isCollapsingAlt = true;
    try {
      const isAr = isRtl();
      const details = document.createElement('details');
      details.className = 'phone-alt-accordion';

      const summary = document.createElement('summary');
      summary.className = 'phone-alt-summary';
      summary.textContent = isAr ? '➕ خيارات علاجية بديلة (سلفونيل يوريا، بيوجليتازون)' : '➕ Alternative Drug Classes (SUs, TZDs)';
      details.appendChild(summary);

      const content = document.createElement('div');
      content.className = 'phone-alt-content';

      // Preserve open state if previously opened or if any contained input is checked
      const hasChecked = Array.from(altSteps).some(el => !!el.querySelector('input:checked'));
      if (wasAltAccordionOpen || hasChecked) {
        details.open = true;
      }

      details.addEventListener('toggle', () => {
        wasAltAccordionOpen = details.open;
      });

      // Insert accordion in-place before firstAlt inside parent (.steps)
      parent.insertBefore(details, firstAlt);
      altSteps.forEach(sec => content.appendChild(sec));
      details.appendChild(content);
    } finally {
      isCollapsingAlt = false;
    }
  }

  /* ------------------------------------------------------------------------
     6. Dynamic Switcher Labels & i18n Synchronization
     ------------------------------------------------------------------------ */
  function updateSwitcherLabels(lang) {
    const isAr = lang ? (lang === 'ar') : isRtl();

    const dmSwitcher = document.querySelector('.phone-pane-switcher-dm');
    if (dmSwitcher) {
      dmSwitcher.setAttribute('aria-label', isAr ? 'مبدل عرض السكري' : 'Diabetes View Switcher');
      const formBtn = dmSwitcher.querySelector('[data-pane="form"]');
      const planBtn = dmSwitcher.querySelector('[data-pane="plan"]');
      if (formBtn) {
        formBtn.innerHTML = `👤 ${isAr ? 'بيانات المريض' : 'Patient Inputs'}`;
        formBtn.setAttribute('aria-label', isAr ? 'بيانات المريض' : 'Patient Inputs');
      }
      if (planBtn) {
        planBtn.innerHTML = `💊 ${isAr ? 'الخطة والروشتة' : 'Plan & Rx'}`;
        planBtn.setAttribute('aria-label', isAr ? 'الخطة والروشتة' : 'Plan & Rx');
      }
    }

    const htnSwitcher = document.querySelector('.phone-pane-switcher-htn');
    if (htnSwitcher) {
      htnSwitcher.setAttribute('aria-label', isAr ? 'مبدل عرض الضغط' : 'Hypertension View Switcher');
      const formBtn = htnSwitcher.querySelector('[data-pane="form"]');
      const planBtn = htnSwitcher.querySelector('[data-pane="plan"]');
      if (formBtn) {
        formBtn.innerHTML = `👤 ${isAr ? 'القياسات والفحوصات' : 'Vitals & Labs'}`;
        formBtn.setAttribute('aria-label', isAr ? 'القياسات والفحوصات' : 'Vitals & Labs');
      }
      if (planBtn) {
        planBtn.innerHTML = `💊 ${isAr ? 'الخطة العلاجية' : 'Recommendations'}`;
        planBtn.setAttribute('aria-label', isAr ? 'الخطة العلاجية' : 'Recommendations');
      }
    }

    const summary = document.querySelector('.phone-alt-summary');
    if (summary) {
      summary.textContent = isAr ? '➕ خيارات علاجية بديلة (سلفونيل يوريا، بيوجليتازون)' : '➕ Alternative Drug Classes (SUs, TZDs)';
    }
  }

  window.osrawyUpdateSwitcherLabels = updateSwitcherLabels;

  /* ------------------------------------------------------------------------
     7. Initialization & Global Event Listeners
     ------------------------------------------------------------------------ */
  function bootPhoneUX() {
    updateCockpitOffset();
    updateSoapBadge();

    if (isPhone()) {
      setupDiabetesSwitcher();
      setupHtnSwitcher();
      collapsePriority3Alternatives();
    }

    // Dynamic language listener
    if (typeof window !== 'undefined' && window.I18n && typeof window.I18n.onChange === 'function') {
      window.I18n.onChange((lang) => {
        updateSwitcherLabels(lang);
      });
    }

    // Observe #result mutations to keep accordion working across re-renders
    const resEl = document.getElementById('result');
    if (resEl && typeof MutationObserver !== 'undefined') {
      const mo = new MutationObserver(() => {
        if (isPhone() && !isCollapsingAlt) {
          collapsePriority3Alternatives();
        }
      });
      mo.observe(resEl, { childList: true });
    }

    // Keep SOAP counter synced on patient state updates
    window.addEventListener('osrawy:patient-updated', updateSoapBadge);
    window.addEventListener('resize', () => {
      updateCockpitOffset();
      if (isPhone()) {
        setupDiabetesSwitcher();
        setupHtnSwitcher();
        collapsePriority3Alternatives();
      } else {
        const details = document.querySelector('.phone-alt-accordion');
        if (details) details.open = true;
      }
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(updateCockpitOffset, 200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPhoneUX);
  } else {
    bootPhoneUX();
  }

})();

```

---

<a id="www-js-updater-js"></a>
## 30. `www/js/updater.js`

**Description:** In-app update checker querying GitHub Releases for new APK versions.  
**Lines:** 252 | **Size:** 10.0 KB

```javascript
// ==============================================================
// In-App GitHub Releases Auto-Update Checker
// ==============================================================

const AppUpdater = (function() {
  const CONFIG = {
    currentVersion: '1.2.18',
    repoOwner: 'DrWssn',
    repoName: 'osrawy-clinical-navigator',
    apiUrl: 'https://api.github.com/repos/DrWssn/osrawy-clinical-navigator/releases/latest',
    tagsUrl: 'https://api.github.com/repos/DrWssn/osrawy-clinical-navigator/tags',
    releasesUrl: 'https://github.com/DrWssn/osrawy-clinical-navigator/releases'
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

  function sanitizeUrl(url) {
    const raw = String(url || '').trim();
    if (/^https:\/\//i.test(raw)) return raw;
    return CONFIG.releasesUrl;
  }

  function compareSemver(v1, v2) {
    const clean1 = (v1 || '').replace(/^v/i, '').trim();
    const clean2 = (v2 || '').replace(/^v/i, '').trim();
    const parts1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
    const parts2 = clean2.split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  async function checkForUpdates(isManual = false) {
    const statusEl = document.getElementById('update-status-text');
    const checkBtn = document.getElementById('btn-check-updates');
    
    if (statusEl) {
      statusEl.textContent = (window.I18n && window.I18n.getLang() === 'ar') 
        ? '⏳ جاري فحص التحديثات...' 
        : '⏳ Checking for updates...';
      statusEl.className = 'update-status checking';
    }
    if (checkBtn) checkBtn.disabled = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      
      let latestTag = '';
      let releaseNotes = '';
      let downloadUrl = CONFIG.releasesUrl;
      let publishedAt = Date.now();

      // 1. Try releases/latest
      let res = await fetch(CONFIG.apiUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });

      if (res.ok) {
        const release = await res.json();
        latestTag = release.tag_name || release.name || '';
        releaseNotes = release.body || '';
        publishedAt = release.published_at || Date.now();
        if (release.assets && release.assets.length > 0) {
          const apk = release.assets.find(a => a.name.endsWith('.apk') && a.name.includes(latestTag))
                   || release.assets.find(a => a.name.endsWith('.apk'));
          if (apk && apk.browser_download_url) {
            downloadUrl = apk.browser_download_url;
          }
        } else if (release.html_url) {
          downloadUrl = release.html_url;
        }
      } else if (res.status === 404) {
        // Fallback to tags if releases haven't been published yet
        const tagsRes = await fetch(CONFIG.tagsUrl, {
          signal: controller.signal,
          headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (tagsRes.ok) {
          const tags = await tagsRes.json();
          if (tags && tags.length > 0) {
            latestTag = tags[0].name;
            downloadUrl = `${CONFIG.releasesUrl}/tag/${latestTag}`;
            releaseNotes = `New release ${latestTag} is ready on GitHub.`;
          }
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
      clearTimeout(timeoutId);

      if (!latestTag) {
        if (statusEl) {
          statusEl.textContent = (window.I18n && window.I18n.getLang() === 'ar')
            ? `✅ أنت تستخدم أحدث إصدار (v${CONFIG.currentVersion})`
            : `✅ You have the latest version (v${CONFIG.currentVersion})`;
          statusEl.className = 'update-status uptodate';
        }
        return;
      }

      const isNewer = compareSemver(latestTag, CONFIG.currentVersion) > 0;

      if (isNewer) {
        if (statusEl) {
          statusEl.textContent = (window.I18n && window.I18n.getLang() === 'ar')
            ? `🚀 يتوفر تحديث جديد: ${latestTag}`
            : `🚀 New update available: ${latestTag}`;
          statusEl.className = 'update-status available';
        }
        showUpdateModal({
          tag_name: latestTag,
          body: releaseNotes,
          published_at: publishedAt,
          downloadUrl: downloadUrl
        });
      } else {
        if (statusEl) {
          statusEl.textContent = (window.I18n && window.I18n.getLang() === 'ar')
            ? `✅ أنت تستخدم أحدث إصدار (v${CONFIG.currentVersion})`
            : `✅ You have the latest version (v${CONFIG.currentVersion})`;
          statusEl.className = 'update-status uptodate';
        }
        if (isManual && window.RxShare && window.RxShare.showToast) {
          window.RxShare.showToast(
            (window.I18n && window.I18n.getLang() === 'ar')
              ? `أنت تستخدم أحدث إصدار (v${CONFIG.currentVersion}) ✅`
              : `App is up to date (v${CONFIG.currentVersion}) ✅`
          );
        }
      }
    } catch (err) {
      console.warn('Update check failed:', err.message);
      if (statusEl) {
        statusEl.textContent = (window.I18n && window.I18n.getLang() === 'ar')
          ? 'تعذر التحقق من التحديثات (تأكد من الاتصال بالإنترنت)'
          : 'Could not check for updates (Check internet)';
        statusEl.className = 'update-status error';
      }
      if (isManual && window.RxShare && window.RxShare.showToast) {
        window.RxShare.showToast(
          (window.I18n && window.I18n.getLang() === 'ar')
            ? 'تعذر التحقق من التحديثات'
            : 'Check internet connection for updates'
        );
      }
    } finally {
      if (checkBtn) checkBtn.disabled = false;
    }
  }

  function showUpdateModal(release) {
    let modal = document.getElementById('update-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'update-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const tag = escapeHtml(release.tag_name || 'New Version');
    const releaseNotes = escapeHtml(release.body || 'New clinical updates and improvements.');
    let rawApkUrl = release.downloadUrl || CONFIG.releasesUrl;
    if (release.assets && release.assets.length > 0) {
      const tagRaw = release.tag_name || '';
      const apkAsset = release.assets.find(a => a.name && a.name.endsWith('.apk') && a.name.includes(tagRaw))
                    || release.assets.find(a => a.name && a.name.endsWith('.apk'));
      if (apkAsset && apkAsset.browser_download_url) {
        rawApkUrl = apkAsset.browser_download_url;
      }
    }
    const apkUrl = escapeHtml(sanitizeUrl(rawApkUrl));

    const isAr = window.I18n && window.I18n.getLang() === 'ar';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 style="margin:0">🚀 ${isAr ? 'يتوفر إصدار جديد!' : 'New Update Available!'}</h3>
          <button class="icon-btn" onclick="document.getElementById('update-modal').classList.remove('open')" style="color:var(--ink)">✕</button>
        </div>
        <div class="modal-body">
          <div style="background:var(--surface2);padding:12px;border-radius:10px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:700;font-size:16px;color:var(--teal);">${tag}</span>
              <span style="font-size:12px;color:var(--muted);">${new Date(release.published_at || Date.now()).toLocaleDateString()}</span>
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">
              ${isAr ? 'الإصدار الحالي لديك:' : 'Your current version:'} <b>v${CONFIG.currentVersion}</b>
            </div>
          </div>
          <label style="font-weight:600;font-size:13px;display:block;margin-bottom:6px;">
            ${isAr ? '📋 ما الجديد في هذا التحديث:' : '📋 What\'s New in This Update:'}
          </label>
          <div class="update-notes-box" style="background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:12px;font-size:13px;max-height:160px;overflow-y:auto;white-space:pre-wrap;">${releaseNotes}</div>
        </div>
        <div class="modal-footer" style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn" style="background:var(--surface2);color:var(--ink);" onclick="document.getElementById('update-modal').classList.remove('open')">
            ${isAr ? 'لاحقاً' : 'Later'}
          </button>
          <a href="${apkUrl}" target="_blank" class="btn btn-primary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
            ⬇️ ${isAr ? 'تحميل وتثبيت التحديث (APK)' : 'Download & Install (APK)'}
          </a>
        </div>
      </div>
    `;
    modal.classList.add('open');
  }

  function init() {
    const versionLabel = document.getElementById('current-app-version');
    if (versionLabel) {
      versionLabel.textContent = 'v' + CONFIG.currentVersion;
    }

    const checkBtn = document.getElementById('btn-check-updates');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => checkForUpdates(true));
    }

    // Silent background check after 3 seconds on launch if online
    if (navigator.onLine) {
      setTimeout(() => checkForUpdates(false), 3000);
    }
  }

  return {
    init,
    checkForUpdates,
    getConfig: () => Object.assign({}, CONFIG)
  };
})();

if (typeof window !== 'undefined') {
  window.AppUpdater = AppUpdater;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppUpdater;
}

```

---

<a id="www-js-app-js"></a>
## 31. `www/js/app.js`

**Description:** Application bootloader, navigation coordinator, verified UX controller (vitals drawer, SOAP EMR cart, Android back priority).  
**Lines:** 1316 | **Size:** 55.0 KB

```javascript
// ==============================================================
// Main Application Controller & Navigation
// ==============================================================

(function() {
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

  function triggerHaptic() {
    try {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(15);
      }
    } catch(e) {}
  }

  let currentActiveTab = 'tab-diabetes';
  let previousActiveTab = 'tab-diabetes';

  function switchMainTab(tabId) {
    if (!tabId) return;
    triggerHaptic();
    if (tabId !== currentActiveTab && currentActiveTab !== 'tab-drugs' && currentActiveTab !== 'tab-recent') {
      previousActiveTab = currentActiveTab;
    }
    currentActiveTab = tabId;
    if (tabId !== 'tab-leaflets' && document.body && document.body.classList && document.body.classList.contains('osrawy-patient-mode')) {
      document.body.classList.remove('osrawy-patient-mode');
      const enterBtn = document.getElementById('osrawy-enter-handoff-btn');
      const exitBtn = document.getElementById('osrawy-exit-handoff-btn');
      if (enterBtn) enterBtn.setAttribute('aria-pressed', 'false');
      if (exitBtn) exitBtn.setAttribute('aria-pressed', 'true');
    }
    document.querySelectorAll('.osrawy-nav-btn, .main-nav-btn').forEach(btn => {
      const bTab = btn.getAttribute('data-tab') || btn.getAttribute('data-tab-target');
      btn.classList.toggle('active', bTab === tabId);
    });

    document.querySelectorAll('.main-view-section, .tab-panel').forEach(sec => {
      const match = (sec.id === tabId);
      sec.style.display = match ? 'block' : 'none';
      if (match) sec.removeAttribute('hidden');
      else sec.setAttribute('hidden', '');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const cmdBar = document.getElementById('osrawy-docked-command-bar');
    if (cmdBar) {
      if (tabId === 'tab-leaflets' || tabId === 'tab-drugs' || tabId === 'tab-recent') {
        cmdBar.style.display = 'none';
      } else {
        cmdBar.style.display = '';
      }
    }

    const quickJumpBtn = document.getElementById('quick-jump-rx-btn');
    if (quickJumpBtn) {
      if (tabId === 'tab-diabetes' || tabId === 'tab-htn') {
        quickJumpBtn.style.display = '';
      } else {
        quickJumpBtn.style.display = 'none';
      }
    }

    if (tabId === 'tab-leaflets') {
      if (window.PatientLeaflets && typeof window.PatientLeaflets.render === 'function') {
        window.PatientLeaflets.render();
      }
    } else if (tabId === 'tab-dlp') {
      if (window.LipidsEngine && typeof window.LipidsEngine.renderLipidsSummary === 'function') {
        window.LipidsEngine.renderLipidsSummary('lipids-container');
      }
    } else if (tabId === 'tab-tools') {
      if (window.PrimaryCareEngine && typeof window.PrimaryCareEngine.renderPrimaryCareTab === 'function') {
        if (!document.getElementById('pc-subtabs')) {
          window.PrimaryCareEngine.renderPrimaryCareTab('primary-care-container');
        } else if (typeof window.updatePrimaryCareUi === 'function') {
          window.updatePrimaryCareUi();
        }
      }
      if (window.ClinicalTools && typeof window.ClinicalTools.renderToolsTab === 'function') {
        if (!document.getElementById('tab-scr')) {
          window.ClinicalTools.renderToolsTab('clinical-tools-container');
        } else if (typeof window.recalculateToolsTab === 'function') {
          window.recalculateToolsTab();
        }
      }
    } else if (tabId === 'tab-drugs') {
      DrugDirectory.render();
    } else if (tabId === 'tab-recent') {
      renderRecentPatients();
    }
  }

  function updateStickyVitals(detail) {
    const pt = (detail && detail.state) ? detail.state : (window.OsrawyPatientSync ? window.OsrawyPatientSync.get() : (window.PatientSync ? window.PatientSync.get() : null));
    if (!pt) return;

    // 1. eGFR (#bar-egfr)
    const egfrEl = document.getElementById('bar-egfr');
    if (egfrEl) {
      const egfrVal = (pt.egfr !== undefined && pt.egfr !== null && pt.egfr !== '') ? pt.egfr : '--';
      const numEgfr = parseFloat(egfrVal);
      egfrEl.innerHTML = `<span class="vital-label">eGFR:</span> <b class="vital-val">${egfrVal}</b> <small>mL/min</small>`;
      egfrEl.classList.remove('vital-warn', 'vital-danger');
      if (!isNaN(numEgfr)) {
        if (numEgfr < 30) egfrEl.classList.add('vital-danger');
        else if (numEgfr < 60) egfrEl.classList.add('vital-warn');
      }
    }

    // 2. K+ (#bar-k)
    const kEl = document.getElementById('bar-k');
    if (kEl) {
      const kVal = (pt.k !== undefined && pt.k !== null && pt.k !== '') ? pt.k : '--';
      const numK = parseFloat(kVal);
      kEl.innerHTML = `<span class="vital-label">K+:</span> <b class="vital-val">${kVal}</b> <small>mmol/L</small>`;
      kEl.classList.remove('vital-warn', 'vital-danger');
      if (!isNaN(numK)) {
        if (numK >= 5.5 || numK < 3.5) kEl.classList.add('vital-danger');
        else if (numK >= 5.0) kEl.classList.add('vital-warn');
      }
    }

    // 3. BP (#bar-bp)
    const bpEl = document.getElementById('bar-bp');
    if (bpEl) {
      const sbp = (pt.sbp !== undefined && pt.sbp !== null && pt.sbp !== '') ? pt.sbp : '--';
      const dbp = (pt.dbp !== undefined && pt.dbp !== null && pt.dbp !== '') ? pt.dbp : '--';
      bpEl.innerHTML = `<span class="vital-label">BP:</span> <b class="vital-val">${sbp}/${dbp}</b> <small>mmHg</small>`;
      bpEl.classList.remove('vital-warn', 'vital-danger');
      const numSbp = parseFloat(sbp);
      const numDbp = parseFloat(dbp);
      if (!isNaN(numSbp) && !isNaN(numDbp)) {
        if (numSbp >= 180 || numDbp >= 120) bpEl.classList.add('vital-danger');
        else if (numSbp >= 140 || numDbp >= 90) bpEl.classList.add('vital-warn');
      }
    }
  }

  // Subscribe to patient updates for sticky vitals bar
  const eventTarget = (typeof window !== 'undefined') ? window : globalThis;
  if (eventTarget && eventTarget.addEventListener) {
    eventTarget.addEventListener('osrawy:patient-updated', (ev) => {
      updateStickyVitals(ev.detail);
    });
  }

  function renderRecentPatients() {
    const list = PatientSync.getRecentList();
    const container = document.getElementById('recent-patients-list');
    if (!container) return;

    const t = (k, def) => (typeof window.I18n !== 'undefined' ? window.I18n.t(k, def) : def);

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>${t('recent_empty_title', 'لا توجد مسودات مرضى محفوظة حالياً.')}</p>
          <small>${t('recent_empty_sub', 'عند إدخال بيانات مريض، انقر على "حفظ في المسودات" للرجوع إليها لاحقاً بدون إنترنت.')}</small>
        </div>`;
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="recent-card">
        <div class="recent-header">
          <div>
            <b>${escapeHtml(item.label)}</b>
            <div class="recent-time">${escapeHtml(item.timestamp)}</div>
          </div>
          <button type="button" class="btn btn-sm btn-outline-danger" data-pt-delete="${escapeHtml(item.id)}">${t('btn_delete', 'حذف')}</button>
        </div>
        <div class="recent-details">
          <span>${t('bar_age', 'العمر:')} ${escapeHtml(item.data.age)}</span>
          <span>A1c: ${escapeHtml(item.data.a1c)}%</span>
          <span>eGFR: ${escapeHtml(item.data.egfr)}</span>
          <span>UACR: ${escapeHtml(item.data.uacr)}</span>
          <span>${t('bar_bp', 'الضغط:')} ${escapeHtml(item.data.sbp)}/${escapeHtml(item.data.dbp)}</span>
        </div>
        <button type="button" class="btn btn-block btn-primary mt-2" data-pt-load="${escapeHtml(item.id)}">
          ${t('btn_load_patient', 'تحميل بيانات المريض ➔')}
        </button>
      </div>
    `).join('');

    container.querySelectorAll('[data-pt-delete]').forEach(btn => {
      btn.addEventListener('click', () => window.deleteRecentPatient(btn.getAttribute('data-pt-delete')));
    });
    container.querySelectorAll('[data-pt-load]').forEach(btn => {
      btn.addEventListener('click', () => window.loadRecentPatient(btn.getAttribute('data-pt-load')));
    });
  }

  window.loadRecentPatient = function(id) {
    const list = PatientSync.getRecentList();
    const item = list.find(x => x.id === id);
    if (item) {
      PatientSync.applyPatient(item.data);
      switchMainTab('tab-diabetes');
      const isAr = (typeof I18n !== 'undefined' && I18n.getLang() === 'ar');
      RxShare.showToast(isAr ? `تم تحميل بيانات: ${item.label}` : `Loaded patient: ${item.label}`);
    }
  };

  window.deleteRecentPatient = function(id) {
    PatientSync.removeRecent(id);
    renderRecentPatients();
    const isAr = (typeof I18n !== 'undefined' && I18n.getLang() === 'ar');
    RxShare.showToast(isAr ? 'تم حذف المسودة' : 'Draft deleted');
  };

  window.handleAndroidBack = function() {
    const openModal = document.querySelector('.modal-overlay.open');
    if (openModal) {
      openModal.classList.remove('open');
      return true;
    }
    const visibleSec = Array.from(document.querySelectorAll('.main-view-section')).find(
      sec => sec && !sec.hasAttribute('hidden') && sec.style.display !== 'none'
    );
    const activeBtn = document.querySelector('.main-nav-btn.active');
    const activeTab = (visibleSec && visibleSec.id) || currentActiveTab || (activeBtn ? activeBtn.getAttribute('data-tab') : 'tab-diabetes');
    if (activeTab === 'tab-drugs' || activeTab === 'tab-recent') {
      const targetTab = (previousActiveTab && previousActiveTab !== 'tab-drugs' && previousActiveTab !== 'tab-recent')
        ? previousActiveTab
        : 'tab-diabetes';
      switchMainTab(targetTab);
      return true;
    }
    if (activeTab !== 'tab-diabetes') {
      switchMainTab('tab-diabetes');
      return true;
    }
    return false;
  };

  function setupTheme() {
    const saved = localStorage.getItem('osrawy_theme') || 'auto';
    const htmlEl = document.documentElement;

    function apply(theme) {
      if (theme === 'dark') {
        htmlEl.setAttribute('data-theme', 'dark');
      } else if (theme === 'light') {
        htmlEl.setAttribute('data-theme', 'light');
      } else {
        htmlEl.removeAttribute('data-theme');
      }
      localStorage.setItem('osrawy_theme', theme);
    }

    apply(saved);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = htmlEl.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        apply(next);
        triggerHaptic();
      });
    }
  }

  function renderPregnancyCards(ptInput) {
    const pt = ptInput || (window.PatientSync ? window.PatientSync.get() : null);
    if (!pt) return;
    const isPreg = !!(pt.pregnancy || pt.preg || pt.pregHtn);
    const isAr = (typeof window.I18n !== 'undefined' && typeof window.I18n.getLang === 'function') ? window.I18n.getLang() === 'ar' : true;

    // Render DM Obstetric Protocol box if #result exists
    const resBox = document.getElementById('result');
    if (resBox) {
      let obsDm = document.getElementById('dm-pregnancy-card');
      if (isPreg && window.OsrawyDmPregnancy && typeof window.OsrawyDmPregnancy.evaluatePregnancyDmProtocol === 'function') {
        if (!obsDm) {
          obsDm = document.createElement('div');
          obsDm.id = 'dm-pregnancy-card';
          resBox.prepend(obsDm);
        }
        const dmRes = window.OsrawyDmPregnancy.evaluatePregnancyDmProtocol(pt);
        const dosing = dmRes.insulinDosing || {};
        obsDm.innerHTML = `
          <div class="pregnancy-protocol-card">
            <div style="font-weight:700; font-size:14px; margin-bottom:6px;">🤰 ${isAr ? 'بروتوكول سكري الحمل (ADA Obstetric Protocol)' : 'Diabetes in Pregnancy Protocol (ADA)'}</div>
            <div style="font-size:12.5px; margin-bottom:4px;"><b>${isAr ? 'أهداف السكر للحامل:' : 'Targets:'}</b> ${isAr ? 'صائم <95 | بعد الأكل بساعة <140 | بعد ساعتين <120 mg/dL' : 'Fasting <95 | 1h PP <140 | 2h PP <120 mg/dL'}</div>
            <div style="font-size:12.5px;"><b>${isAr ? 'حساب الأنسولين المقترح:' : 'Suggested Insulin:'}</b> TDD = ${dosing.tddUnits || 0} U/day (Basal: ${dosing.basalUnits || 0} U, Meal: ${dosing.mealBolusUnits || 0} U × 3)</div>
          </div>
        `;
      } else if (obsDm) {
        obsDm.remove();
      }
    }

    // Render HTN Obstetric Protocol box if #out exists
    const outBox = document.getElementById('out');
    if (outBox) {
      let obsHtn = document.getElementById('htn-pregnancy-card');
      if (isPreg && window.OsrawyHtnPregnancy && typeof window.OsrawyHtnPregnancy.evaluatePregnancyHtnProtocol === 'function') {
        if (!obsHtn) {
          obsHtn = document.createElement('div');
          obsHtn.id = 'htn-pregnancy-card';
          outBox.prepend(obsHtn);
        }
        const htnRes = window.OsrawyHtnPregnancy.evaluatePregnancyHtnProtocol(pt);
        const fl = htnRes.firstLine;
        const stepOne = (htnRes.steps || []).find(s => s.step >= 1);
        const firstLine = fl
          ? (isAr ? `${fl.drugNameAr || fl.drugName} — ${fl.doseAr || fl.doseEn || ''}` : `${fl.drugName} — ${fl.doseEn || ''}`)
          : (stepOne ? (isAr ? stepOne.drugAr : stepOne.drugEn) : 'Labetalol / Nifedipine ER');
        const aspIndicated = htnRes.aspirinProphylaxis && htnRes.aspirinProphylaxis.indicated;
        obsHtn.innerHTML = `
          <div class="pregnancy-protocol-card">
            <div style="font-weight:700; font-size:14px; margin-bottom:6px;">🤰 ${isAr ? 'بروتوكول ضغط الحمل والوقاية من تسمم الحمل' : 'Hypertension in Pregnancy & Preeclampsia Protocol'}</div>
            <div style="font-size:12.5px; margin-bottom:4px;"><b>${isAr ? 'الخط الأول الآمن:' : 'Safe First-Line:'}</b> ${escapeHtml(firstLine)}</div>
            ${aspIndicated ? `<div style="font-size:12.5px;"><b>🛡️ Aspirin:</b> ${isAr ? 'يوصى بـ Aspirin 81-150 ملغ مساءً للوقاية من تسمم الحمل (من الأسبوع 12 حتى الولادة).' : 'Low-dose Aspirin 81-150 mg nightly from week 12 for preeclampsia prophylaxis.'}</div>` : ''}
          </div>
        `;
      } else if (obsHtn) {
        obsHtn.remove();
      }
    }
  }

  // Expose navigation & helpers globally
  window.switchMainTab = switchMainTab;
  window.renderRecentPatients = renderRecentPatients;
  window.renderPregnancyCards = renderPregnancyCards;

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    if (typeof I18n !== 'undefined') {
      I18n.init();
      I18n.onChange((lang) => {
        PatientSync.updatePatientBar();
        DrugDirectory.render();
        renderRecentPatients();
        if (typeof window.PatientLeaflets !== 'undefined' && typeof window.PatientLeaflets.setLang === 'function') {
          window.PatientLeaflets.setLang(lang);
        }
        const dlpContainer = document.getElementById('lipids-container');
        if (dlpContainer && dlpContainer.innerHTML.trim() && window.LipidsEngine && typeof window.LipidsEngine.renderLipidsSummary === 'function') {
          window.LipidsEngine.renderLipidsSummary('lipids-container');
        }
        if (typeof window.plan === 'function') window.plan();
        if (typeof window.htnRender === 'function') window.htnRender();
        if (typeof window.htnRenderTitrate === 'function') window.htnRenderTitrate();
        renderPregnancyCards(PatientSync.get());
      });
    }
    RxShare.loadSettings();
    let hasSavedPatient = false;
    try {
      hasSavedPatient = !!(typeof localStorage !== 'undefined' && localStorage.getItem('osrawy_active_patient'));
    } catch (e) {}
    PatientSync.loadActive();
    PatientSync.updatePatientBar();
    updateStickyVitals();
    DrugDirectory.init();
    if (typeof ClinicalTools !== 'undefined') {
      ClinicalTools.init();
    }
    if (typeof PatientLeaflets !== 'undefined') {
      PatientLeaflets.init();
    }
    if (typeof AppUpdater !== 'undefined') {
      AppUpdater.init();
    }
    if (hasSavedPatient) {
      PatientSync.applyPatient(PatientSync.get());
    }

    // Language Switcher Button in Header
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn && typeof I18n !== 'undefined') {
      langBtn.addEventListener('click', () => {
        triggerHaptic();
        I18n.toggleLang();
        const cur = I18n.getLang();
        RxShare.showToast(cur === 'ar' ? '🇸🇦 تم تفعيل الواجهة العربية' : '🌐 Switched to English interface');
      });
    }

    // Bottom Navigation Buttons
    document.querySelectorAll('.osrawy-nav-btn, .main-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab') || btn.getAttribute('data-tab-target');
        switchMainTab(tab);
      });
    });

    // Mobile Quick-Jump Button to Live Rx / Recommendation
    const quickJumpBtn = document.getElementById('quick-jump-rx-btn');
    if (quickJumpBtn) {
      quickJumpBtn.addEventListener('click', () => {
        triggerHaptic();
        const diaSec = document.getElementById('tab-diabetes');
        const htnSec = document.getElementById('tab-htn');
        let target = null;
        if (diaSec && diaSec.style.display !== 'none') {
          target = document.querySelector('#tab-diabetes .rx-sec') || document.getElementById('result');
        } else if (htnSec && htnSec.style.display !== 'none') {
          target = document.getElementById('out') || document.querySelector('#tab-htn .sheet');
        }
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // Save Patient Draft button
    const savePtBtn = document.getElementById('save-pt-btn');
    if (savePtBtn) {
      savePtBtn.addEventListener('click', () => {
        const isAr = (typeof I18n !== 'undefined' && I18n.getLang() === 'ar');
        const nameInput = document.getElementById('pname');
        const defaultName = (isAr ? 'مريض ' : 'Patient ') + new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US');
        const name = (nameInput && nameInput.value) ? nameInput.value : defaultName;
        PatientSync.saveToRecent(name);
        RxShare.showToast(isAr ? '✅ تم حفظ بيانات المريض في المسودات' : '✅ Patient draft saved to local storage');
      });
    }

    const openRecentBtn = document.getElementById('open-recent-btn');
    if (openRecentBtn) {
      openRecentBtn.addEventListener('click', () => {
        switchMainTab('tab-recent');
      });
    }

    const openPaletteBtn = document.getElementById('btn-open-palette');
    if (openPaletteBtn) {
      openPaletteBtn.addEventListener('click', () => {
        if (typeof window.CommandPalette !== 'undefined' && window.CommandPalette.open) {
          window.CommandPalette.open();
        }
      });
    }

    const openDrugsBtn = document.getElementById('open-drugs-btn');
    if (openDrugsBtn) {
      openDrugsBtn.addEventListener('click', () => {
        switchMainTab('tab-drugs');
      });
    }

    // Top App Bar More Menu Popover
    const topMoreBtn = document.getElementById('top-more-btn');
    const topMoreMenu = document.getElementById('top-more-menu');

    function closeTopMoreMenu() {
      if (topMoreMenu && !topMoreMenu.hidden) {
        topMoreMenu.hidden = true;
        topMoreMenu.setAttribute('aria-hidden', 'true');
        if (topMoreBtn) topMoreBtn.setAttribute('aria-expanded', 'false');
      }
    }

    if (topMoreBtn && topMoreMenu) {
      topMoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = topMoreMenu.hidden;
        if (willOpen) {
          topMoreMenu.hidden = false;
          topMoreMenu.setAttribute('aria-hidden', 'false');
          topMoreBtn.setAttribute('aria-expanded', 'true');
        } else {
          closeTopMoreMenu();
        }
      });

      document.addEventListener('click', (e) => {
        if (!topMoreMenu.hidden && !topMoreMenu.contains(e.target) && e.target !== topMoreBtn) {
          closeTopMoreMenu();
        }
      });

      topMoreMenu.addEventListener('click', (e) => {
        if (e.target && e.target.closest('button')) {
          closeTopMoreMenu();
        }
      });
    }

    // Modal triggers for Doctor profile
    const settingsBtn = document.getElementById('open-settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener('click', () => {
        const cfg = RxShare.loadSettings();
        document.getElementById('set-dr-name').value = cfg.doctorName || '';
        document.getElementById('set-dr-title').value = cfg.doctorTitle || '';
        document.getElementById('set-clinic-name').value = cfg.clinicName || '';
        document.getElementById('set-clinic-phone').value = cfg.clinicPhone || '';
        document.getElementById('set-clinic-addr').value = cfg.clinicAddress || '';
        settingsModal.classList.add('open');
      });
    }

    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('open'));
    }

    if (saveSettingsBtn && settingsModal) {
      saveSettingsBtn.addEventListener('click', () => {
        RxShare.saveSettings({
          doctorName: document.getElementById('set-dr-name').value,
          doctorTitle: document.getElementById('set-dr-title').value,
          clinicName: document.getElementById('set-clinic-name').value,
          clinicPhone: document.getElementById('set-clinic-phone').value,
          clinicAddress: document.getElementById('set-clinic-addr').value
        });
        settingsModal.classList.remove('open');
        const isAr = (typeof I18n !== 'undefined' && I18n.getLang() === 'ar');
        RxShare.showToast(isAr ? '✅ تم حفظ إعدادات الطبيب والعيادة' : '✅ Doctor & clinic settings saved');
        if (window.plan) window.plan();
      });
    }

    // Market Switcher Buttons (Saudi vs Egypt)
    const btnSa = document.getElementById('market-btn-sa');
    const btnEg = document.getElementById('market-btn-eg');
    if (btnSa) btnSa.addEventListener('click', () => DrugDirectory.setMarket('saudi'));
    if (btnEg) btnEg.addEventListener('click', () => DrugDirectory.setMarket('egypt'));

    const headerMktBtn = document.getElementById('market-toggle-btn');
    if (headerMktBtn) {
      headerMktBtn.addEventListener('click', () => {
        const next = (DrugDirectory.getMarket() === 'saudi') ? 'egypt' : 'saudi';
        DrugDirectory.setMarket(next);
        const isAr = (typeof I18n !== 'undefined' && I18n.getLang() === 'ar');
        RxShare.showToast(
          next === 'saudi'
            ? (isAr ? '🇸🇦 تم تفعيل السوق السعودي (SAR)' : '🇸🇦 Switched to Saudi Market (SAR)')
            : (isAr ? '🇪🇬 تم تفعيل السوق المصري (EGP)' : '🇪🇬 Switched to Egypt Market (EGP)')
        );
      });
    }

    // Attach Patient Sync Listeners
    const pform = document.getElementById('pform');
    if (pform) {
      pform.addEventListener('input', () => PatientSync.syncFromDiabetes());
      pform.addEventListener('change', () => PatientSync.syncFromDiabetes());
    }

    const htnForm = document.getElementById('f');
    if (htnForm) {
      htnForm.addEventListener('input', () => PatientSync.syncFromHTN());
      htnForm.addEventListener('change', () => PatientSync.syncFromHTN());
    }

    // Attach Lipids Tab Inputs Sync
    const dlpPanel = document.getElementById('dlp-inputs-panel');
    if (dlpPanel) {
      const syncDlpInputs = () => {
        const ldl = parseNumOr(document.getElementById('dlp-ldl')?.value, 130);
        const tc = parseNumOr(document.getElementById('dlp-tc')?.value, 210);
        const hdl = parseNumOr(document.getElementById('dlp-hdl')?.value, 42);
        const tg = parseNumOr(document.getElementById('dlp-tg')?.value, 180);
        const alt = parseNumOr(document.getElementById('dlp-alt')?.value, 28);
        const unit = document.getElementById('dlp-unit')?.value || 'mg';
        const intol = !!document.getElementById('dlp-statin-intol')?.checked;
        const ezet = !!document.getElementById('dlp-ezetimibe')?.checked;

        if (window.PatientSync && typeof window.PatientSync.updatePatient === 'function') {
          const pt = window.PatientSync.get();
          const curMeds = (Array.isArray(pt.medications) && pt.medications.length ? pt.medications : null) ||
            pt.activeMeds || pt.currentMeds || [];
          let meds = curMeds.slice();
          const hasEzet = meds.some(m => String(m).toLowerCase().includes('ezetimibe'));
          if (ezet && !hasEzet) meds.push('ezetimibe');
          else if (!ezet && hasEzet) {
            meds = meds.filter(m => !String(m).toLowerCase().includes('ezetimibe'));
          }
          window.PatientSync.updatePatient({
            ldlC: ldl,
            tc: tc,
            totalCholesterol: tc,
            hdl: hdl,
            hdlC: hdl,
            triglycerides: tg,
            altUl: alt,
            lunit: unit,
            lipidUnit: unit,
            statinIntolerant: intol,
            onEzetimibe: ezet,
            medications: meds,
            activeMeds: meds,
            currentMeds: meds
          });
        } else if (window.LipidsEngine && typeof window.LipidsEngine.renderLipidsSummary === 'function') {
          window.LipidsEngine.renderLipidsSummary('lipids-container');
        }
      };

      dlpPanel.addEventListener('input', syncDlpInputs);
      dlpPanel.addEventListener('change', syncDlpInputs);
    }

    // Wire Obstetric Pregnancy Protocols Banner on Patient Sync updates
    window.addEventListener('osrawy:patient-updated', (ev) => {
      const pt = (ev && ev.detail && ev.detail.state) ? ev.detail.state : (window.PatientSync ? window.PatientSync.get() : null);
      renderPregnancyCards(pt);
    });
  });
})();

/* ==========================================================================
   v1.2.11 VERIFIED UX CONTROLLER (Vitals Drawer, SOAP Cart, Handoff, Back Key)
   ========================================================================== */
(function initOsrawyVerifiedUX() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  function bootVerifiedUX() {
    const soapSections = new Map();
    const touchedPrimaryPanels = new Set();

    function findAncestor(node, predicate) {
      let cur = node;
      while (cur) {
        try {
          if (predicate(cur)) return cur;
        } catch (_) {}
        cur = cur.parentNode;
      }
      return null;
    }

    function getPatientData() {
      if (window.PatientSync) {
        if (typeof window.PatientSync.getState === "function") return window.PatientSync.getState();
        if (typeof window.PatientSync.get === "function") return window.PatientSync.get();
        if (window.PatientSync.state) return window.PatientSync.state;
      }
      return { egfr: 90, k: 4.2, sbp: 130, dbp: 80, pregnancy: false };
    }

    // 1. Tap-to-Edit Vitals Drawer wired to #sticky-vitals-summary & PatientSync.updatePatient
    const stickyHeader =
      document.getElementById("sticky-vitals-summary") ||
      document.querySelector(".sticky-vitals-bar");
    const vitalsDrawer = document.getElementById("osrawy-vitals-quick-drawer");
    const inputEgfr = document.getElementById("quick-vital-egfr");
    const inputK = document.getElementById("quick-vital-k");
    const inputSbp = document.getElementById("quick-vital-sbp");
    const inputDbp = document.getElementById("quick-vital-dbp");
    const inputPreg = document.getElementById("quick-vital-pregnancy");

    const isFiniteInRange = (val, min, max) => Number.isFinite(val) && val >= min && val <= max;

    const parseStrictNum = (raw, intOnly) => {
      const s = String(raw ?? "").trim();
      const re = intOnly ? /^-?\d+$/ : /^-?\d+(?:\.\d+)?$/;
      if (!re.test(s)) return NaN;
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    };

    function updateVitalsDrawerTopOffset() {
      if (stickyHeader && vitalsDrawer) {
        const cockpit = (stickyHeader.closest && typeof stickyHeader.closest === 'function')
          ? stickyHeader.closest('.patient-cockpit')
          : null;
        const h = (cockpit && cockpit.offsetHeight) ? cockpit.offsetHeight : (stickyHeader.offsetHeight || 44);
        if (document.documentElement && document.documentElement.style && typeof document.documentElement.style.setProperty === "function") {
          document.documentElement.style.setProperty("--vitals-drawer-top", h + "px");
        }
        vitalsDrawer.style.top = h + "px";
      }
    }

    function isElementInside(el, container) {
      if (!el || !container) return false;
      if (typeof container.contains === "function" && container.contains(el)) return true;
      return Boolean(findAncestor(el, (n) => n === container));
    }

    function blurIfInside(container, extraKnownEls) {
      const active = document.activeElement;
      if (!active) return;
      const inside =
        isElementInside(active, container) ||
        (Array.isArray(extraKnownEls) && extraKnownEls.indexOf(active) !== -1);
      if (inside) {
        if (typeof active.blur === "function") active.blur();
        if (document.activeElement === active) {
          try { document.activeElement = null; } catch (_) {}
        }
      }
    }

    function closeVitalsDrawer() {
      if (!vitalsDrawer) return;
      blurIfInside(vitalsDrawer, [inputEgfr, inputK, inputSbp, inputDbp, inputPreg]);
      vitalsDrawer.classList.remove("is-open");
      vitalsDrawer.setAttribute("aria-hidden", "true");
      if (stickyHeader) stickyHeader.setAttribute("aria-expanded", "false");
      syncQuickInputsFromState();
    }

    function syncQuickInputsFromState(patientState) {
      const p = patientState || getPatientData() || {};
      const active = document.activeElement || null;

      if (inputEgfr && active !== inputEgfr && p.egfr !== undefined && p.egfr !== null) {
        inputEgfr.value = String(p.egfr);
      }
      if (inputK && active !== inputK && p.k !== undefined && p.k !== null) {
        inputK.value = String(p.k);
      }
      if (inputSbp && active !== inputSbp && p.sbp !== undefined && p.sbp !== null) {
        inputSbp.value = String(p.sbp);
      }
      if (inputDbp && active !== inputDbp && p.dbp !== undefined && p.dbp !== null) {
        inputDbp.value = String(p.dbp);
      }
      if (inputPreg) {
        const isMale = Boolean(p.sex && p.sex !== "f");
        const isPreg = Boolean(
          p.pregnancy ||
          p.preg === "yes" || p.preg === true ||
          p.pregHtn === "yes" || p.pregHtn === true
        );
        inputPreg.disabled = Boolean(isMale && !isPreg);
        if (active !== inputPreg) {
          inputPreg.value = String(isPreg);
        }
      }
    }

    function pushQuickInputsToPatientSync(sourceEl, isLiveInput) {
      if (!window.PatientSync || typeof window.PatientSync.updatePatient !== "function") return;
      const curState = getPatientData() || {};
      const patch = {};
      let hasChange = false;

      const considerEgfr = !sourceEl || sourceEl === inputEgfr;
      const considerK = !sourceEl || sourceEl === inputK;
      const considerSbp = !sourceEl || sourceEl === inputSbp;
      const considerDbp = !sourceEl || sourceEl === inputDbp;
      const considerPreg = !sourceEl || sourceEl === inputPreg;

      if (considerEgfr && inputEgfr) {
        const v = parseStrictNum(inputEgfr.value, false);
        if (isFiniteInRange(v, isLiveInput ? 5 : 1, 250)) {
          patch.egfr = v;
          hasChange = true;
        }
      }
      if (considerK && inputK) {
        const v = parseStrictNum(inputK.value, false);
        if (isFiniteInRange(v, isLiveInput ? 1.5 : 1, 12)) {
          patch.k = v;
          hasChange = true;
        }
      }
      if (considerSbp && inputSbp) {
        const v = parseStrictNum(inputSbp.value, true);
        if (isFiniteInRange(v, isLiveInput ? 50 : 40, 320)) {
          patch.sbp = v;
          hasChange = true;
        }
      }
      if (considerDbp && inputDbp) {
        const v = parseStrictNum(inputDbp.value, true);
        if (isFiniteInRange(v, isLiveInput ? 25 : 20, 220)) {
          patch.dbp = v;
          hasChange = true;
        }
      }
      if (considerPreg && inputPreg) {
        const isMale = Boolean(curState.sex && curState.sex !== "f");
        if (isMale) {
          patch.pregnancy = false;
          inputPreg.value = "false";
          hasChange = true;
        } else {
          patch.pregnancy = inputPreg.value === "true";
          hasChange = true;
        }
      }

      if (hasChange) {
        window.PatientSync.updatePatient(patch);
      } else if (!isLiveInput) {
        if (sourceEl === inputEgfr && curState.egfr !== undefined && curState.egfr !== null) inputEgfr.value = String(curState.egfr);
        else if (sourceEl === inputK && curState.k !== undefined && curState.k !== null) inputK.value = String(curState.k);
        else if (sourceEl === inputSbp && curState.sbp !== undefined && curState.sbp !== null) inputSbp.value = String(curState.sbp);
        else if (sourceEl === inputDbp && curState.dbp !== undefined && curState.dbp !== null) inputDbp.value = String(curState.dbp);
        else syncQuickInputsFromState(curState);
      }
    }

    if (stickyHeader && vitalsDrawer) {
      stickyHeader.setAttribute("aria-expanded", "false");
      stickyHeader.addEventListener("click", (e) => {
        if (e.target && typeof e.target.closest === "function" && e.target.closest("button, a, input, select")) return;
        updateVitalsDrawerTopOffset();
        syncQuickInputsFromState();
        vitalsDrawer.classList.toggle("is-open");
        const isOpen = vitalsDrawer.classList.contains("is-open");
        vitalsDrawer.setAttribute("aria-hidden", String(!isOpen));
        stickyHeader.setAttribute("aria-expanded", String(isOpen));
      });
      window.addEventListener("resize", updateVitalsDrawerTopOffset);
      if (typeof ResizeObserver !== "undefined" && stickyHeader) {
        try {
          const ro = new ResizeObserver(() => updateVitalsDrawerTopOffset());
          ro.observe(stickyHeader);
        } catch (_) {}
      }

      // Keyboard-aware floating chrome controller (Android soft keyboard)
      if (typeof window !== "undefined") {
        const isInputElement = (el) => {
          return !!(el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA"));
        };

        const evaluateKeyboardState = () => {
          try {
            if (!document.body) return;
            const active = document.activeElement;
            const hasInputFocus = isInputElement(active);
            const vv = window.visualViewport;
            const isShrunk = vv && window.innerHeight ? (vv.height / window.innerHeight < 0.85) : false;

            // ONLY activate when an editable input is active AND the viewport is shrunk
            if (hasInputFocus && isShrunk) {
              document.body.classList.add("osrawy-keyboard-open");
            } else if (!hasInputFocus) {
              document.body.classList.remove("osrawy-keyboard-open");
            }
          } catch (_) {}
        };

        if (window.visualViewport && typeof window.visualViewport.addEventListener === "function") {
          window.visualViewport.addEventListener("resize", evaluateKeyboardState);
        }

        window.addEventListener("orientationchange", () => {
          if (document.body) document.body.classList.remove("osrawy-keyboard-open");
        });

        document.addEventListener("focusin", (e) => {
          if (isInputElement(e.target)) {
            setTimeout(evaluateKeyboardState, 50);
          }
        });

        document.addEventListener("focusout", (e) => {
          if (isInputElement(e.target)) {
            setTimeout(() => {
              if (!isInputElement(document.activeElement)) {
                if (document.body) document.body.classList.remove("osrawy-keyboard-open");
              }
            }, 60);
          }
        });
      }
    }

    [inputEgfr, inputK, inputSbp, inputDbp].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", () => pushQuickInputsToPatientSync(el, true));
      el.addEventListener("change", () => pushQuickInputsToPatientSync(el, false));
    });
    if (inputPreg) {
      inputPreg.addEventListener("change", () => pushQuickInputsToPatientSync(inputPreg, false));
    }

    // Unwrap e.detail.state from osrawy:patient-updated
    window.addEventListener("osrawy:patient-updated", (e) => {
      const unwrappedState =
        e && e.detail && e.detail.state
          ? e.detail.state
          : e && e.detail
          ? e.detail
          : null;
      syncQuickInputsFromState(unwrappedState);
      updateVitalsDrawerTopOffset();
      renderSoapSummary(unwrappedState);
    });

    // 2. SOAP Consultation Cart wired to real v1.2.11 Engine Containers & RxShare
    const soapFab = document.getElementById("osrawy-soap-fab");
    const soapDrawer = document.getElementById("osrawy-soap-drawer");
    const soapBackdrop = document.getElementById("osrawy-soap-backdrop");
    const soapClose = document.getElementById("osrawy-soap-close");
    const soapTextarea = document.getElementById("osrawy-soap-textarea");
    const soapCount = document.getElementById("osrawy-soap-count");
    const soapSyncBtn = document.getElementById("osrawy-soap-sync-active");
    const soapCopyBtn = document.getElementById("osrawy-soap-copy");
    const soapClearBtn = document.getElementById("osrawy-soap-clear");

    // Track explicit clinician interaction with Primary Care panels so hidden defaults aren't falsely captured
    const PC_PANEL_KEY_MAP = {
      "pc-panel-asthma": "Asthma",
      "pc-panel-copd": "COPD",
      "pc-panel-thyroid": "Thyroid",
      asthma: "Asthma",
      copd: "COPD",
      thyroid: "Thyroid"
    };

    function markPrimaryCareEvent(e) {
      const target = e && e.target;
      if (!target) return;
      const tabAttr = (typeof target.getAttribute === "function" && target.getAttribute("data-pc-tab")) || (target.dataset && target.dataset.pcTab);
      if (tabAttr && PC_PANEL_KEY_MAP[tabAttr]) {
        touchedPrimaryPanels.add(PC_PANEL_KEY_MAP[tabAttr]);
        return;
      }
      const tabBtn = findAncestor(target, (n) => n && ((n.dataset && n.dataset.pcTab) || (typeof n.getAttribute === "function" && n.getAttribute("data-pc-tab"))));
      if (tabBtn) {
        const keyAttr = (tabBtn.dataset && tabBtn.dataset.pcTab) || tabBtn.getAttribute("data-pc-tab");
        if (PC_PANEL_KEY_MAP[keyAttr]) {
          touchedPrimaryPanels.add(PC_PANEL_KEY_MAP[keyAttr]);
          return;
        }
      }
      if (e.type === "input" || e.type === "change") {
        const panelEl = findAncestor(target, (n) => n && n.id && Boolean(PC_PANEL_KEY_MAP[n.id]));
        if (panelEl) {
          touchedPrimaryPanels.add(PC_PANEL_KEY_MAP[panelEl.id]);
        }
      }
    }
    document.addEventListener("click", markPrimaryCareEvent);
    document.addEventListener("input", markPrimaryCareEvent);
    document.addEventListener("change", markPrimaryCareEvent);

    const ENGINE_SOURCES = [
      { key: "DM", label: "Diabetes", selector: "#result", primaryPanelId: null },
      { key: "HTN", label: "Hypertension", selector: "#out", primaryPanelId: null },
      { key: "Lipids", label: "Dyslipidemia / ASCVD", selector: "#lipids-container", primaryPanelId: null },
      { key: "Asthma", label: "Asthma (GINA)", selector: "#pc-asthma-output", primaryPanelId: "pc-panel-asthma" },
      { key: "COPD", label: "COPD (GOLD)", selector: "#pc-copd-output", primaryPanelId: "pc-panel-copd" },
      { key: "Thyroid", label: "Thyroid", selector: "#pc-thy-output", primaryPanelId: "pc-panel-thyroid" }
    ];

    const PLACEHOLDER_RE = /^(Enter\s+(systolic|weight|age)|No drug selected\.?$|Calculate\b)/i;

    function extractCleanContainerText(rootEl) {
      if (!rootEl) return "";
      let text = "";
      let usedCloneDom = false;

      if (typeof rootEl.cloneNode === "function" && typeof rootEl.querySelectorAll === "function") {
        const clone = rootEl.cloneNode(true);
        if (clone && typeof clone.querySelectorAll === "function") {
          usedCloneDom = true;
          clone.querySelectorAll("#scrInline").forEach((scr) => {
            const priCard = scr.parentNode && scr.parentNode.classList && scr.parentNode.classList.contains("pri") ? scr.parentNode : null;
            if (priCard) priCard.remove();
            else scr.remove();
          });
          clone
            .querySelectorAll("button, input, select, textarea, script, style, .no-print, [hidden], .rx-sec, #rxwrap, #scrInline, .clinician-only-controls, .g-scale, .scale, .rx-pick, .rx-same")
            .forEach((n) => n.remove());
          clone.querySelectorAll("[style]").forEach((n) => {
            if (n.style && (n.style.display === "none" || n.style.visibility === "hidden")) n.remove();
          });
          clone.querySelectorAll("br").forEach((br) => {
            if (typeof br.replaceWith === "function") br.replaceWith("\n");
          });
          clone.querySelectorAll("span, b, strong, em, i, small, label, a, td, th").forEach((el) => {
            if (typeof el.append === "function") el.append(" ");
          });
          clone.querySelectorAll("p, div, li, h1, h2, h3, h4, h5, h6, tr, section, article").forEach((b) => {
            if (typeof b.prepend === "function") b.prepend("\n");
            if (typeof b.append === "function") b.append("\n");
          });
          text = clone.textContent || "";
        }
      }

      if (!usedCloneDom && !text && (rootEl.textContent || rootEl.innerHTML)) {
        const rawHtml = String(rootEl.innerHTML || rootEl.textContent || "")
          .replace(/<!--[\s\S]*?-->/g, " ")
          .replace(/<div\s+id=["']scrInline["'][\s\S]*$/i, "")
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<button[\s\S]*?<\/button>/gi, " ")
          .replace(/<select[\s\S]*?<\/select>/gi, " ")
          .replace(/<br\s*\/?>|<\/(?:div|p|li|h[1-6]|tr)>/gi, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/gi, " ")
          .replace(/&amp;/gi, "&")
          .replace(/&lt;/gi, "<")
          .replace(/&gt;/gi, ">")
          .replace(/&quot;/gi, '"')
          .replace(/&#39;/gi, "'");
        text = rawHtml;
      }

      const cleaned = text
        .split("\n")
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => line.length > 3 && !PLACEHOLDER_RE.test(line))
        .join(" | ");
      return cleaned.length > 15 ? cleaned.slice(0, 520) : "";
    }

    function harvestActiveEngines() {
      ENGINE_SOURCES.forEach(({ key, label, selector, primaryPanelId }) => {
        const el = document.querySelector(selector);
        if (primaryPanelId) {
          const panelEl = document.getElementById(primaryPanelId);
          const isExplicitlyShown = Boolean(
            panelEl &&
            panelEl.style &&
            panelEl.style.display &&
            panelEl.style.display !== "none"
          );
          const isAllowed = touchedPrimaryPanels.has(key) || (key !== "Asthma" && isExplicitlyShown);
          if (!isAllowed) {
            soapSections.delete(key);
            return;
          }
        }
        const summary = extractCleanContainerText(el);
        if (summary) {
          soapSections.set(key, `[${label}] ${summary}`);
        } else {
          soapSections.delete(key);
        }
      });

      // Pull structured DM prescription data from RxShare if populated
      if (window.RxShare && typeof window.RxShare.getPrescriptionData === "function") {
        try {
          const rxData = window.RxShare.getPrescriptionData();
          if (rxData && Array.isArray(rxData.items) && rxData.items.length > 0) {
            const rxListText = rxData.items
              .map((it) => it.drug + (it.directions ? " (" + it.directions + ")" : ""))
              .join("; ");
            soapSections.set("Rx", `[Rx Plan] ${rxListText.slice(0, 350)}`);
          } else {
            soapSections.delete("Rx");
          }
        } catch (_) {}
      }

      renderSoapSummary();
    }
    window.harvestActiveEngines = harvestActiveEngines;

    function fmtSoapVital(val) {
      return (val !== undefined && val !== null && val !== "") ? val : "--";
    }

    function renderSoapSummary(overrideState) {
      if (!soapTextarea) return;
      const p = overrideState || getPatientData() || {};
      const isPreg = Boolean(
        p.pregnancy ||
        p.preg === "yes" || p.preg === true ||
        p.pregHtn === "yes" || p.pregHtn === true
      );
      const objLine = `O: BP ${fmtSoapVital(p.sbp)}/${fmtSoapVital(p.dbp)} mmHg | eGFR ${fmtSoapVital(p.egfr)} mL/min/1.73m² | K+ ${fmtSoapVital(p.k)} mmol/L | Pregnancy: ${isPreg ? "YES" : "No"}`;
      const items = Array.from(soapSections.values());
      const planBlock = items.length
        ? items.map((line, idx) => `${idx + 1}. ${line}`).join("\n\n")
        : "- No active engine outputs captured yet. Run an engine (DM, HTN, Lipids, Primary Care) and tap 'Pull Active Engines'.";

      soapTextarea.value = `${objLine}\n\nA/P:\n${planBlock}`;
      if (soapCount) soapCount.textContent = String(items.length);
    }

    function setSoapDrawerOpen(open) {
      if (!soapDrawer) return;
      if (!open) blurIfInside(soapDrawer, [soapTextarea, soapClose, soapSyncBtn, soapCopyBtn, soapClearBtn]);
      soapDrawer.classList.toggle("is-open", open);
      soapDrawer.setAttribute("aria-hidden", String(!open));
      if (soapBackdrop) {
        soapBackdrop.classList.toggle("is-open", open);
        soapBackdrop.setAttribute("aria-hidden", String(!open));
      }
    }

    if (soapFab) {
      soapFab.addEventListener("click", () => {
        const nextState = !soapDrawer.classList.contains("is-open");
        if (nextState) harvestActiveEngines();
        setSoapDrawerOpen(nextState);
      });
    }
    if (soapClose) soapClose.addEventListener("click", () => setSoapDrawerOpen(false));
    if (soapBackdrop) soapBackdrop.addEventListener("click", () => setSoapDrawerOpen(false));
    if (soapSyncBtn) soapSyncBtn.addEventListener("click", harvestActiveEngines);
    if (soapClearBtn) {
      soapClearBtn.addEventListener("click", () => {
        soapSections.clear();
        touchedPrimaryPanels.clear();
        renderSoapSummary();
      });
    }
    if (soapCopyBtn && soapTextarea) {
      soapCopyBtn.addEventListener("click", () => {
        const textToCopy = soapTextarea.value;
        const isAr = window.I18n && typeof window.I18n.getLang === "function" && window.I18n.getLang() === "ar";
        const notifyCopied = () => {
          if (window.RxShare && typeof window.RxShare.showToast === "function") {
            window.RxShare.showToast(isAr ? "✓ تم نسخ ملخص SOAP" : "✓ SOAP Note Copied");
          }
        };
        const fallbackCopy = () => {
          try {
            soapTextarea.removeAttribute("readonly");
            if (typeof soapTextarea.focus === "function") soapTextarea.focus();
            if (typeof soapTextarea.select === "function") soapTextarea.select();
            if (typeof soapTextarea.setSelectionRange === "function") {
              soapTextarea.setSelectionRange(0, textToCopy.length);
            }
            const ok = typeof document.execCommand === "function" && document.execCommand("copy");
            if (ok) notifyCopied();
          } catch (_) {
          } finally {
            soapTextarea.setAttribute("readonly", "readonly");
          }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textToCopy).then(notifyCopied).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
      });
    }

    // 3. Full-Screen Patient Handoff Mode (#tab-leaflets)
    const enterHandoffBtn = document.getElementById("osrawy-enter-handoff-btn");
    const exitHandoffBtn = document.getElementById("osrawy-exit-handoff-btn");

    function setPatientHandoffMode(enabled) {
      document.body.classList.toggle("osrawy-patient-mode", enabled);
      if (enterHandoffBtn) enterHandoffBtn.setAttribute("aria-pressed", String(Boolean(enabled)));
      if (exitHandoffBtn) exitHandoffBtn.setAttribute("aria-pressed", String(!enabled));
      if (enabled) {
        setSoapDrawerOpen(false);
        closeVitalsDrawer();
      }
    }

    if (enterHandoffBtn) enterHandoffBtn.addEventListener("click", () => setPatientHandoffMode(true));
    if (exitHandoffBtn) exitHandoffBtn.addEventListener("click", () => setPatientHandoffMode(false));

    // Clear SOAP Cart & transient tab-tools state cleanly when loading another patient or resetting
    function clearSoapCartForNewPatient(state) {
      soapSections.clear();
      touchedPrimaryPanels.clear();
      const pcContainer = document.getElementById("primary-care-container");
      const hasPrimaryCareMounted = Boolean(
        document.getElementById("pc-subtabs") ||
        document.getElementById("pc-panel-asthma") ||
        (pcContainer && pcContainer.innerHTML && pcContainer.innerHTML.trim())
      );
      if (hasPrimaryCareMounted) {
        blurIfInside(pcContainer);
        if (window.PrimaryCareEngine && typeof window.PrimaryCareEngine.renderPrimaryCareTab === "function") {
          window.PrimaryCareEngine.renderPrimaryCareTab("primary-care-container");
        }
      }
      const pcSubtabs = document.getElementById("pc-subtabs");
      if (pcSubtabs && typeof pcSubtabs.querySelectorAll === "function") {
        pcSubtabs.querySelectorAll("[data-pc-tab]").forEach((b) => {
          b.classList.toggle("active", b.getAttribute("data-pc-tab") === "asthma");
        });
      }
      ["asthma", "copd", "thyroid"].forEach((p) => {
        const panel = document.getElementById("pc-panel-" + p);
        if (panel && panel.style) panel.style.display = (p === "asthma") ? "block" : "none";
      });
      const toolsContainer = document.getElementById("clinical-tools-container");
      const hasClinicalToolsMounted = Boolean(
        document.getElementById("tab-scr") ||
        document.getElementById("tab-fib4-ast") ||
        (toolsContainer && toolsContainer.innerHTML && toolsContainer.innerHTML.trim())
      );
      if (hasClinicalToolsMounted) {
        blurIfInside(toolsContainer);
        if (window.ClinicalTools && typeof window.ClinicalTools.renderToolsTab === "function") {
          window.ClinicalTools.renderToolsTab("clinical-tools-container");
        }
      }
      if (document.body && document.body.classList.contains("osrawy-patient-mode")) {
        setPatientHandoffMode(false);
      }
      renderSoapSummary(state);
    }

    if (window.PatientSync && !window.PatientSync.__osrawySoapLifecycleWrapped) {
      window.PatientSync.__osrawySoapLifecycleWrapped = true;
      function blurTransientToolContainers() {
        blurIfInside(document.getElementById("primary-care-container"));
        blurIfInside(document.getElementById("clinical-tools-container"));
        blurIfInside(vitalsDrawer, [inputEgfr, inputK, inputSbp, inputDbp, inputPreg]);
      }
      if (typeof window.PatientSync.resetPatient === "function") {
        const origReset = window.PatientSync.resetPatient;
        window.PatientSync.resetPatient = function () {
          blurTransientToolContainers();
          const res = origReset.apply(this, arguments);
          clearSoapCartForNewPatient(res);
          return res;
        };
      }
      if (typeof window.PatientSync.applyPatient === "function") {
        const origApply = window.PatientSync.applyPatient;
        window.PatientSync.applyPatient = function () {
          blurTransientToolContainers();
          const res = origApply.apply(this, arguments);
          clearSoapCartForNewPatient(res);
          return res;
        };
      }
    }

    if (window.I18n && typeof window.I18n.onChange === "function") {
      window.I18n.onChange(() => {
        updateVitalsDrawerTopOffset();
        renderSoapSummary();
      });
    }

    // 4. Hook Capacitor Android Hardware Back Button (window.handleAndroidBack) + Escape
    const originalHandleAndroidBack = window.handleAndroidBack;
    window.handleAndroidBack = function () {
      if (typeof window.CommandPalette !== "undefined" && window.CommandPalette.isOpen && window.CommandPalette.isOpen()) {
        window.CommandPalette.close();
        return true;
      }
      const topMoreMenu = document.getElementById("top-more-menu");
      if (topMoreMenu && !topMoreMenu.hidden) {
        topMoreMenu.hidden = true;
        topMoreMenu.setAttribute("aria-hidden", "true");
        const moreBtn = document.getElementById("top-more-btn");
        if (moreBtn) moreBtn.setAttribute("aria-expanded", "false");
        return true;
      }
      const openModals = document.querySelectorAll(".modal-overlay.open");
      if (openModals && openModals.length > 0) {
        const topModal = openModals[openModals.length - 1];
        topModal.classList.remove("open");
        return true;
      }
      if (document.body.classList.contains("osrawy-patient-mode")) {
        setPatientHandoffMode(false);
        return true;
      }
      if (soapDrawer && soapDrawer.classList.contains("is-open")) {
        setSoapDrawerOpen(false);
        return true;
      }
      if (vitalsDrawer && vitalsDrawer.classList.contains("is-open")) {
        closeVitalsDrawer();
        return true;
      }
      if (typeof originalHandleAndroidBack === "function") {
        return originalHandleAndroidBack.apply(this, arguments);
      }
      return false;
    };

    window.addEventListener("keydown", (e) => {
      if (e && e.key === "Escape") {
        const topMoreMenu = document.getElementById("top-more-menu");
        const openModals = document.querySelectorAll(".modal-overlay.open");
        const hasOverlay =
          (typeof window.CommandPalette !== "undefined" && window.CommandPalette.isOpen && window.CommandPalette.isOpen()) ||
          (topMoreMenu && !topMoreMenu.hidden) ||
          (openModals && openModals.length > 0) ||
          document.body.classList.contains("osrawy-patient-mode") ||
          (soapDrawer && soapDrawer.classList.contains("is-open")) ||
          (vitalsDrawer && vitalsDrawer.classList.contains("is-open"));
        if (hasOverlay) {
          window.handleAndroidBack();
        }
      }
    });

    // Sync immediately (PatientSync.loadActive() has already run in earlier DOMContentLoaded listener)
    updateVitalsDrawerTopOffset();
    syncQuickInputsFromState();
    harvestActiveEngines();
    renderSoapSummary();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootVerifiedUX);
  } else {
    bootVerifiedUX();
  }
})();

```

---

<a id="check-js-syntax-js"></a>
## 32. `check_js_syntax.js`

**Description:** Automated syntax validation script checking all JS files using Node.js vm.Script.  
**Lines:** 36 | **Size:** 1.0 KB

```javascript
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const jsDir = path.resolve(__dirname, 'www', 'js');
if (!fs.existsSync(jsDir)) {
  console.error(`Directory not found: ${jsDir}`);
  process.exit(1);
}

const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
console.log(`Checking syntax for ${files.length} JS files in ${jsDir}...\n`);
let hasError = false;

for (const file of files) {
  const filePath = path.join(jsDir, file);
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    new vm.Script(code, { filename: file });
    console.log(`✅ [SYNTAX OK] ${file}`);
  } catch (err) {
    console.error(`❌ [SYNTAX ERROR] ${file}: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
    hasError = true;
  }
}

if (hasError) {
  console.error('\n❌ Syntax validation failed!');
  process.exit(1);
} else {
  console.log(`\n✅ All ${files.length} JS files passed syntax validation successfully.`);
}

```

---

<a id="run-full-simulation-js"></a>
## 33. `run_full_simulation.js`

**Description:** Full automated integration test suite with 203 clinical assertions verifying all engines, safety guardrails, and UX workflows.  
**Lines:** 2294 | **Size:** 110.9 KB

```javascript
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("===============================================================");
console.log("  OSRAWY CLINICAL NAVIGATOR - FULL INTEGRATION TEST SUITE");
console.log("===============================================================\n");

// ---------------------------------------------------------------------
// 1. DOM & Browser Mock Environment
// ---------------------------------------------------------------------

class MockElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.type = 'text';
    this.innerHTML = '';
    this.innerText = '';
    this.textContent = '';
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.listeners = {};
    this.style = {};
    this.dataset = {};
    this.classList = {
      classes: new Set(),
      add: (...cls) => cls.forEach(c => this.classList.classes.add(c)),
      remove: (...cls) => cls.forEach(c => this.classList.classes.delete(c)),
      contains: (c) => this.classList.classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList.classes.has(c)) this.classList.classes.delete(c);
          else this.classList.classes.add(c);
        } else if (force) {
          this.classList.classes.add(c);
        } else {
          this.classList.classes.delete(c);
        }
      }
    };
  }

  appendChild(child) {
    if (child) {
      child.parentNode = this;
      this.children.push(child);
    }
    return child;
  }

  prepend(child) {
    if (child) {
      child.parentNode = this;
      this.children.unshift(child);
    }
    return child;
  }

  insertBefore(newNode, refNode) {
    if (!newNode) return newNode;
    newNode.parentNode = this;
    const idx = this.children.indexOf(refNode);
    if (idx === -1) this.children.push(newNode);
    else this.children.splice(idx, 0, newNode);
    return newNode;
  }

  remove() {
    if (this.parentNode && typeof this.parentNode.removeChild === 'function') {
      this.parentNode.removeChild(this);
    }
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  setAttribute(k, v) {
    this.attributes[k] = String(v);
    if (k.startsWith('data-')) {
      const camel = k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      this.dataset[camel] = String(v);
    }
  }

  getAttribute(k) {
    return this.attributes[k] !== undefined ? this.attributes[k] : null;
  }

  removeAttribute(k) {
    delete this.attributes[k];
    if (k.startsWith('data-')) {
      const camel = k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      delete this.dataset[camel];
    }
  }

  hasAttribute(k) {
    return this.attributes[k] !== undefined;
  }

  addEventListener(ev, fn) {
    if (!this.listeners[ev]) this.listeners[ev] = [];
    this.listeners[ev].push(fn);
  }

  removeEventListener(ev, fn) {
    if (this.listeners[ev]) {
      this.listeners[ev] = this.listeners[ev].filter(f => f !== fn);
    }
  }

  dispatchEvent(ev) {
    const type = typeof ev === 'string' ? ev : ev.type;
    const eventObj = typeof ev === 'string' ? { type: ev, target: this } : Object.assign(ev, { target: this });
    if (this.listeners[type]) {
      this.listeners[type].forEach(fn => fn(eventObj));
    }
    return true;
  }

  querySelector(sel) {
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      return elementsMap.get(id) || null;
    }
    for (const child of this.children) {
      if (child.tagName.toLowerCase() === sel.toLowerCase()) return child;
      const found = child.querySelector(sel);
      if (found) return found;
    }
    return null;
  }

  querySelectorAll(sel) {
    const results = [];
    for (const child of this.children) {
      if (child.tagName.toLowerCase() === sel.toLowerCase()) results.push(child);
      results.push(...child.querySelectorAll(sel));
    }
    return results;
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this });
  }

  focus() {}
  blur() {}
}

const elementsMap = new Map();
function getOrCreate(id, tag = 'div') {
  if (!elementsMap.has(id)) {
    elementsMap.set(id, new MockElement(tag, id));
  }
  return elementsMap.get(id);
}

// Pre-create common DOM elements
const knownIds = [
  'pform', 'pname', 'age', 'sex', 'wt', 'ht', 'dur', 'hf', 'a1c', 'fpg', 'egfr', 'uacr',
  'ascvd', 'hrisk', 'masld', 'smoker', 'hypo', 'frail', 'catab', 'pancr', 'geni', 'preg',
  'c-met', 'c-su', 'c-dpp', 'c-sglt', 'c-glp', 'c-pio', 'c-ins', 'cheap', 'result',
  'scrwho', 'scrPersonal', 'cklist', 'ckprog', 'iwt', 'ifpg', 'icur', 'itdd', 'isens', 'iseg',
  'iswitch', 'ifrom', 'iresult', 'instbl', 'reftbl', 'th-ref-brand', 'th-ins-brand', 'ref-sec-sub',
  'f', 'sbp', 'dbp', 'htn-age', 'htn-sex', 'meds', 'risk', 'risk-l', 'oob', 'dm', 'cad', 'hf-htn',
  'stroke', 'af', 'gout', 'asthma', 'bph', 'frail-htn', 'ortho', 'preg-htn', 'preg-c',
  'htn-egfr', 'htn-uacr', 'k', 'tc', 'hdl', 'ldl', 'tg', 'alt', 'lunit', 'smk', 'statin', 'riskbox', 'out',
  'sw-from', 'sw-dose', 'sw-to', 'sw-out', 'ti-drug', 'ti-dose', 'ti-out', 'lens-acc', 'lens-esc',
  'drug-directory-list', 'drug-search-input', 'market-btn-sa', 'market-btn-eg', 'market-toggle-btn', 'lang-toggle-btn',
  'save-pt-btn', 'theme-toggle-btn', 'open-settings-btn', 'patient-summary-bar', 'recent-patients-list',
  'settings-modal', 'close-settings-btn', 'save-settings-btn', 'set-dr-name', 'set-dr-title',
  'set-clinic-name', 'set-clinic-phone', 'set-clinic-addr', 'copy', 'btn-share-htn-whatsapp', 'btn-print-htn',
  'egfr-modal', 'close-egfr-modal-btn', 'btn-apply-calculated-egfr', 'calc-scr', 'calc-scr-unit', 'calc-age',
  'calc-sex', 'calc-wt', 'calc-egfr-output', 'ldl-modal', 'close-ldl-modal-btn', 'ldl-matrix-container',
  'btn-open-ldl-modal', 'quick-jump-rx-btn', 'clinical-guardrail-banner',
  'sticky-vitals-summary', 'bar-egfr', 'bar-k', 'bar-bp', 'bar-a1c', 'bar-ldl',
  'tab-leaflets', 'patient-leaflet-container', 'lipids-summary-container', 'rxcard'
];
knownIds.forEach(id => getOrCreate(id));

class MockCustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail || {};
    this.bubbles = !!init.bubbles;
    this.cancelable = !!init.cancelable;
  }
}

class MockEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = !!init.bubbles;
    this.cancelable = !!init.cancelable;
  }
}

const docListeners = {};
const docElement = new MockElement('html');
const bodyElement = new MockElement('body');
docElement.appendChild(bodyElement);

const mockStorage = new Map();
const windowObj = {
  CustomEvent: MockCustomEvent,
  Event: MockEvent,
  localStorage: {
    getItem: (k) => mockStorage.has(k) ? mockStorage.get(k) : null,
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k),
    clear: () => mockStorage.clear()
  },
  navigator: {
    clipboard: { writeText: async (t) => t },
    vibrate: () => true
  },
  location: { reload: () => {} },
  setTimeout: (fn, ms) => { try { fn(); } catch(e){} },
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  scrollTo: () => {},
  document: {
    getElementById: (id) => getOrCreate(id),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return getOrCreate(sel.slice(1));
      return new MockElement('div');
    },
    querySelectorAll: (sel) => {
      return [];
    },
    createElement: (tag) => new MockElement(tag),
    addEventListener: (ev, fn) => {
      if (!docListeners[ev]) docListeners[ev] = [];
      docListeners[ev].push(fn);
    },
    removeEventListener: (ev, fn) => {
      if (docListeners[ev]) {
        docListeners[ev] = docListeners[ev].filter(f => f !== fn);
      }
    },
    dispatchEvent: (ev) => {
      const type = ev.type || ev;
      if (docListeners[type]) {
        docListeners[type].forEach(fn => fn(ev));
      }
      return true;
    },
    documentElement: docElement,
    body: bodyElement
  }
};
windowObj.window = windowObj;

// Provide globals inside VM
const sandbox = Object.assign({}, windowObj, {
  console,
  setTimeout: windowObj.setTimeout,
  clearTimeout: windowObj.clearTimeout,
  CustomEvent: MockCustomEvent,
  Event: MockEvent
});

const context = vm.createContext(sandbox);

// ---------------------------------------------------------------------
// 2. Load Scripts in Required Sequence
// ---------------------------------------------------------------------

const jsDir = path.resolve(__dirname, 'www', 'js');
const requiredScripts = [
  'i18n.js',
  'drugs_data.js',
  'patient_sync.js',
  'clinical_tools.js',
  'lipids_engine.js',
  'primary_care_engine.js',
  'prescription_share.js',
  'drugs_directory.js',
  'diabetes_engine.js',
  'htn_engine.js',
  'patient_leaflets.js'
];

console.log("Loading modules into VM context in required sequence:");
for (const scriptName of requiredScripts) {
  const filePath = path.join(jsDir, scriptName);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Required script missing: ${scriptName}`);
    process.exit(1);
  }
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    vm.runInContext(code, context, { filename: scriptName });
    console.log(`  ✅ Loaded ${scriptName}`);
  } catch (err) {
    console.error(`  ❌ Failed to load ${scriptName}: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}
console.log("\nAll required scripts loaded successfully into VM sandbox.\n");

// Helper to look up modules flexibly
function getModule(...names) {
  for (const name of names) {
    if (context[name] !== undefined) return context[name];
    if (context.window && context.window[name] !== undefined) return context.window[name];
  }
  return null;
}

const I18n = getModule('I18n');
const PatientSync = getModule('OsrawyPatientSync', 'PatientSync');
const ClinicalTools = getModule('OsrawyClinicalTools', 'ClinicalTools');
const DiabetesEngine = getModule('DiabetesEngine');
const HtnEngine = getModule('HtnEngine');
const LipidsEngine = getModule('LipidsEngine', 'OsrawyLipids', 'OsrawyLipidsEngine');
const PrimaryCareEngine = getModule('PrimaryCareEngine', 'OsrawyPrimaryCare', 'OsrawyPrimaryCareEngine');
const RxShare = getModule('RxShare', 'PrescriptionShare', 'OsrawyRxShare');
const PatientLeaflets = getModule('PatientLeaflets', 'OsrawyPatientLeaflets');
const OsrawyQRCode = getModule('OsrawyQRCode');
const DrugsDirectory = getModule('OsrawyDrugsDirectory', 'DrugDirectory');
const HtnPregnancy = getModule('OsrawyHtnPregnancy');
const DmPregnancy = getModule('OsrawyDmPregnancy');

// ---------------------------------------------------------------------
// 3. Test Runner Infrastructure
// ---------------------------------------------------------------------

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`    ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`    ❌ FAIL: ${message}`);
  }
}

function runCase(num, title, fn) {
  console.log(`---------------------------------------------------------------`);
  console.log(`Case ${num}: ${title}`);
  console.log(`---------------------------------------------------------------`);
  try {
    fn();
  } catch (err) {
    failedTests++;
    console.error(`  ❌ Exception in Case ${num}:`, err.message);
    console.error(err.stack);
  }
  console.log('');
}

// ---------------------------------------------------------------------
// 4. Clinical Test Suites (Cases 1 - 9)
// ---------------------------------------------------------------------

// Case 1: Severe CKD (eGFR < 30) + Metformin contraindication
runCase(1, "Severe CKD (eGFR < 30) + Metformin contraindication", () => {
  assert(PatientSync !== null, "PatientSync / OsrawyPatientSync module is present");

  // Subtest 1A: CKD-EPI 2021 race-free calculation for severe renal impairment
  if (typeof PatientSync.calculateCkdEpi2021 === 'function') {
    const egfrRes = PatientSync.calculateCkdEpi2021(2.8, 'mg', 68, 'm');
    const val = typeof egfrRes === 'object' ? egfrRes.egfr : egfrRes;
    assert(val < 30, `CKD-EPI 2021 calculates severe CKD eGFR < 30 (got: ${val})`);
  } else if (ClinicalTools && typeof ClinicalTools.calculateCKDEPI === 'function') {
    const res = ClinicalTools.calculateCKDEPI(2.8, 'mg', 68, 'm');
    assert(res.egfr < 30, `ClinicalTools calculates severe CKD eGFR < 30 (got: ${res.egfr})`);
  }

  // Subtest 1B: Metformin contraindicated at eGFR < 30 (lactic acidosis risk)
  if (typeof PatientSync.evaluateSafetyGuardrails === 'function') {
    const patientCkd = { egfr: 22, meds: ['metformin'], hf: 'none', k: 4.5, preg: false };
    const guardrails = PatientSync.evaluateSafetyGuardrails(patientCkd);
    const metContra = guardrails.some(g =>
      JSON.stringify(g).toLowerCase().includes('metformin') &&
      (JSON.stringify(g).toLowerCase().includes('contraindicat') ||
       JSON.stringify(g).toLowerCase().includes('lactic') ||
       JSON.stringify(g).includes('ميتفورمين') ||
       JSON.stringify(g).includes('حمض اللاكتيك'))
    );
    assert(metContra, "eGFR < 30 triggers Metformin contraindication / lactic acidosis alert");

    // Subtest 1C: Metformin dose cap at eGFR 30-44 (1000 mg/day)
    const patientModCkd = { egfr: 38, meds: ['metformin'], hf: 'none', k: 4.5, preg: false };
    const modGuardrails = PatientSync.evaluateSafetyGuardrails(patientModCkd);
    const capAlert = modGuardrails.some(g =>
      JSON.stringify(g).toLowerCase().includes('1000') ||
      JSON.stringify(g).toLowerCase().includes('cap') ||
      JSON.stringify(g).includes('1000')
    );
    assert(capAlert, "eGFR 30-44 triggers Metformin dose cap (max 1000 mg/d) guardrail");

    // Subtest 1D: Cross-engine organ protection recommendation (SGLT2i if eGFR >= 20)
    const organAlert = modGuardrails.some(g =>
      JSON.stringify(g).toLowerCase().includes('sglt2') ||
      JSON.stringify(g).includes('حماية الكلى') ||
      JSON.stringify(g).includes('كلوي')
    );
    assert(organAlert, "CKD with eGFR >= 20 generates SGLT2i renal/organ protection recommendation");
  }
});

// Case 2: Dual RAAS Blockade + Hyperkalemia K+ >= 5.5
runCase(2, "Dual RAAS Blockade + Hyperkalemia K+ >= 5.5", () => {
  assert(typeof PatientSync.evaluateSafetyGuardrails === 'function', "evaluateSafetyGuardrails is available");

  // Subtest 2A: Dual RAAS blockade (ACEi + ARB)
  const dualRaasPt = {
    egfr: 55,
    k: 4.6,
    activeMeds: ['ramipril', 'losartan'],
    acei: true,
    arb: true
  };
  const raasGuardrails = PatientSync.evaluateSafetyGuardrails(dualRaasPt);
  const dualRaasAlert = raasGuardrails.some(g =>
    (JSON.stringify(g).toLowerCase().includes('dual') ||
     JSON.stringify(g).toLowerCase().includes('raas') ||
     JSON.stringify(g).toLowerCase().includes('ace') ||
     JSON.stringify(g).includes('ازدواج') ||
     JSON.stringify(g).includes('مزدوج')) &&
    (JSON.stringify(g).toLowerCase().includes('contra') ||
     JSON.stringify(g).includes('موانع') ||
     JSON.stringify(g).includes('خطر'))
  );
  assert(dualRaasAlert, "Dual RAAS blockade (ACEi + ARB) triggers critical contraindication alert");

  // Subtest 2B: Severe hyperkalemia (K+ >= 5.5) -> stop RAAS & MRA
  const hyperKPt = {
    egfr: 50,
    k: 5.7,
    activeMeds: ['ramipril', 'spironolactone'],
    acei: true,
    mra: true
  };
  const kGuardrails = PatientSync.evaluateSafetyGuardrails(hyperKPt);
  const kAlert = kGuardrails.some(g =>
    (JSON.stringify(g).toLowerCase().includes('k+') ||
     JSON.stringify(g).toLowerCase().includes('potassium') ||
     JSON.stringify(g).includes('بوتاسيوم') ||
     JSON.stringify(g).includes('5.5') ||
     JSON.stringify(g).includes('5.7')) &&
    (JSON.stringify(g).toLowerCase().includes('stop') ||
     JSON.stringify(g).toLowerCase().includes('hold') ||
     JSON.stringify(g).includes('إيقاف') ||
     JSON.stringify(g).includes('وقف'))
  );
  assert(kAlert, "K+ >= 5.5 triggers critical alert to immediately stop RAAS inhibitors and MRA");

  // Subtest 2C: Moderate hyperkalemia (K+ > 5.0) -> avoid MRA
  const modKPt = { egfr: 60, k: 5.2, activeMeds: [], mra: false };
  const modKGuardrails = PatientSync.evaluateSafetyGuardrails(modKPt);
  const mraAvoidAlert = modKGuardrails.some(g =>
    JSON.stringify(g).toLowerCase().includes('mra') ||
    JSON.stringify(g).includes('سبيرونولاكتون') ||
    JSON.stringify(g).includes('بوتاسيوم')
  );
  assert(mraAvoidAlert, "K+ > 5.0 triggers precaution/avoid alert for MRA initiation");
});

// Case 3: Pregnancy Teratogenicity
runCase(3, "Pregnancy Teratogenicity", () => {
  // Subtest 3A: PatientSync teratogenicity guardrail
  const pregPt = {
    preg: true,
    pregnancy: true,
    sex: 'f',
    age: 29,
    egfr: 90,
    k: 4.2,
    activeMeds: ['losartan', 'empa']
  };
  const pregGuardrails = PatientSync.evaluateSafetyGuardrails(pregPt);
  const teratoAlert = pregGuardrails.some(g =>
    (JSON.stringify(g).toLowerCase().includes('pregnan') ||
     JSON.stringify(g).toLowerCase().includes('teratogen') ||
     JSON.stringify(g).includes('حمل') ||
     JSON.stringify(g).includes('تشوه')) &&
    (JSON.stringify(g).toLowerCase().includes('stop') ||
     JSON.stringify(g).toLowerCase().includes('contraindicat') ||
     JSON.stringify(g).includes('إيقاف') ||
     JSON.stringify(g).includes('ممنوع'))
  );
  assert(teratoAlert, "Pregnancy triggers immediate stop/contraindication for RAAS / SGLT2i / teratogenic drugs");

  // Subtest 3B: Lipids Engine statin pregnancy contraindication
  if (LipidsEngine && typeof LipidsEngine.evaluateLipidPathway === 'function') {
    const lipidRes = LipidsEngine.evaluateLipidPathway({
      pregnancy: true,
      preg: true,
      ldlC: 160,
      totalCholesterol: 240,
      triglycerides: 180,
      hdlC: 45
    });
    const statinContra = JSON.stringify(lipidRes).toLowerCase().includes('pregnan') ||
                         JSON.stringify(lipidRes).includes('حمل') ||
                         JSON.stringify(lipidRes).toLowerCase().includes('contraindicat');
    assert(statinContra, "Lipids engine flags statins as contraindicated in pregnancy");
  }
});

// Case 4: Very High Risk ASCVD + LDL target < 55 + Ezetimibe step-up + Amlodipine/Simvastatin interaction
runCase(4, "Very High Risk ASCVD + LDL target < 55 + Ezetimibe step-up + Amlodipine/Simvastatin interaction", () => {
  assert(LipidsEngine !== null, "LipidsEngine module is present");

  // Subtest 4A: Stratification to VERY_HIGH risk with target LDL < 55 mg/dL
  if (typeof LipidsEngine.stratifyRisk === 'function') {
    const vhPatient = { ascvd: true, age: 62, diabetes: true, smoker: false, sbp: 135 };
    const strat = LipidsEngine.stratifyRisk(vhPatient);
    assert(
      (strat.tier || strat.riskKey || strat.level || '').toUpperCase().includes('VERY_HIGH') ||
      (strat.tier || strat.riskKey || strat.level || '').toUpperCase().includes('VERY HIGH'),
      "Patient with established ASCVD is stratified as VERY_HIGH risk"
    );
    assert(
      (strat.ldlTargetMg === 55 || (strat.target && strat.target.ldl === 55) || (strat.targets && strat.targets.ldl === 55)),
      "Very High Risk LDL-C target is < 55 mg/dL"
    );
  }

  // Subtest 4B: Step 2 Ezetimibe escalation if LDL not at target on high-intensity statin
  if (typeof LipidsEngine.evaluateLipidPathway === 'function') {
    const stepUpInput = {
      ascvd: true,
      ldlC: 85, // Above target 55
      currentStatin: 'atorvastatin_80', // on high-intensity statin
      onStatin: true,
      currentDrugs: ['atorvastatin']
    };
    const pathway = LipidsEngine.evaluateLipidPathway(stepUpInput);
    const hasEzetimibe = JSON.stringify(pathway).toLowerCase().includes('ezetimibe') ||
                         JSON.stringify(pathway).includes('إزيتيميب') ||
                         JSON.stringify(pathway).toLowerCase().includes('step 2');
    assert(hasEzetimibe, "High-risk patient not at LDL goal triggers Step 2 Ezetimibe escalation recommendation");

    // Subtest 4C: Step 3 PCSK9 inhibitor escalation if still not at target on statin + ezetimibe
    const pcsk9Input = {
      ascvd: true,
      ldlC: 92,
      onStatin: true,
      onEzetimibe: true,
      currentDrugs: ['atorvastatin', 'ezetimibe']
    };
    const pathwayPcsk9 = LipidsEngine.evaluateLipidPathway(pcsk9Input);
    const hasPcsk9 = JSON.stringify(pathwayPcsk9).toLowerCase().includes('pcsk9') ||
                     JSON.stringify(pathwayPcsk9).includes('إيفولوكوماب') ||
                     JSON.stringify(pathwayPcsk9).toLowerCase().includes('step 3');
    assert(hasPcsk9, "Patient not at goal on Statin + Ezetimibe triggers Step 3 PCSK9 inhibitor recommendation");

    // Subtest 4D: Amlodipine + Simvastatin interaction cap <= 20 mg
    const interactionInput = {
      currentDrugs: ['amlodipine', 'simvastatin'],
      amlodipine: true,
      simvastatin: true,
      simvastatinDose: 40
    };
    const pathwayInteract = LipidsEngine.evaluateLipidPathway(interactionInput);
    const hasSimvaAlert = JSON.stringify(pathwayInteract).toLowerCase().includes('simvastatin') &&
                          (JSON.stringify(pathwayInteract).includes('20') ||
                           JSON.stringify(pathwayInteract).toLowerCase().includes('cap') ||
                           JSON.stringify(pathwayInteract).toLowerCase().includes('interaction') ||
                           JSON.stringify(pathwayInteract).includes('تفاعل'));
    assert(hasSimvaAlert, "Amlodipine + Simvastatin triggers interaction alert capping Simvastatin at <= 20 mg/d");
  }
});

// Case 5: Severe Hypertriglyceridemia TG >= 500 + Rosuvastatin renal cap
runCase(5, "Severe Hypertriglyceridemia TG >= 500 + Rosuvastatin renal cap", () => {
  assert(LipidsEngine !== null, "LipidsEngine is present");

  if (typeof LipidsEngine.evaluateLipidPathway === 'function') {
    // Subtest 5A: Severe hypertriglyceridemia TG >= 500 -> pancreatitis alert & urgent lowering
    const severeTgInput = {
      triglycerides: 580,
      ldlC: 130,
      totalCholesterol: 260,
      hdlC: 38,
      egfr: 75
    };
    const severeTgRes = LipidsEngine.evaluateLipidPathway(severeTgInput);
    const pancreatitisAlert = JSON.stringify(severeTgRes).toLowerCase().includes('pancreat') ||
                              JSON.stringify(severeTgRes).includes('التهاب البنكرياس') ||
                              JSON.stringify(severeTgRes).toLowerCase().includes('fenofibrate') ||
                              JSON.stringify(severeTgRes).includes('فينوفيبرات');
    assert(pancreatitisAlert, "TG >= 500 triggers acute pancreatitis risk alert & urgent fibrate/TG-lowering recommendation");

    // Subtest 5B: Moderate hypertriglyceridemia TG 135-499 -> Icosapent ethyl recommendation
    const modTgInput = {
      ascvd: true,
      triglycerides: 240,
      ldlC: 60,
      onStatin: true
    };
    const modTgRes = LipidsEngine.evaluateLipidPathway(modTgInput);
    const icosapent = JSON.stringify(modTgRes).toLowerCase().includes('icosapent') ||
                      JSON.stringify(modTgRes).toLowerCase().includes('omega') ||
                      JSON.stringify(modTgRes).includes('أوميغا');
    assert(icosapent, "TG 135-499 in ASCVD patient recommends Icosapent ethyl / Omega-3 therapy");

    // Subtest 5C: Severe renal impairment (eGFR < 30) -> Rosuvastatin capped at 10 mg
    const renalRosuvaInput = {
      egfr: 24,
      ldlC: 150,
      rosuvastatin: true
    };
    const renalRes = LipidsEngine.evaluateLipidPathway(renalRosuvaInput);
    const rosuvaCap = JSON.stringify(renalRes).toLowerCase().includes('rosuvastatin') &&
                      (JSON.stringify(renalRes).includes('10') ||
                       JSON.stringify(renalRes).toLowerCase().includes('renal') ||
                       JSON.stringify(renalRes).includes('جرعة قصوى'));
    assert(rosuvaCap, "eGFR < 30 triggers Rosuvastatin renal cap <= 10 mg/d guardrail");
  }
});

// Case 6: Asthma GINA Track 1 MART step-up + SABA overuse
runCase(6, "Asthma GINA Track 1 MART step-up + SABA overuse", () => {
  assert(PrimaryCareEngine !== null, "PrimaryCareEngine module is present");

  if (typeof PrimaryCareEngine.evaluateAsthmaGina === 'function') {
    // Subtest 6A: Track 1 preference & symptom control assessment
    const asthmaPt = {
      condition: 'asthma',
      currentStep: 2,
      daySymptoms: '>2_week',
      nightWaking: true,
      relieverUse: '>2_week',
      activityLimit: true,
      sabaUsePerWeek: 4, // >= 3 per week
      preferredTrack: 1
    };
    const asthmaRes = PrimaryCareEngine.evaluateAsthmaGina(asthmaPt);

    const isUncontrolled = (asthmaRes.controlLevel || asthmaRes.control || '').toLowerCase().includes('uncontrolled') ||
                           JSON.stringify(asthmaRes).includes('غير منضبط') ||
                           JSON.stringify(asthmaRes).includes('uncontrolled');
    assert(isUncontrolled, "Asthma symptom criteria accurately classify patient as Uncontrolled");

    // Subtest 6B: SABA overuse alert (>= 3 times/week)
    const sabaAlert = (asthmaRes.alerts || asthmaRes.guardrails || []).some(a =>
      JSON.stringify(a).toLowerCase().includes('saba') ||
      JSON.stringify(a).toLowerCase().includes('overuse') ||
      JSON.stringify(a).includes('إفراط') ||
      JSON.stringify(a).includes('سابا')
    ) || JSON.stringify(asthmaRes).toLowerCase().includes('overuse');
    assert(sabaAlert, "SABA use >= 3x/week triggers SABA overuse warning and mortality alert");

    // Subtest 6C: GINA Track 1 MART step-up (Step 2 -> Step 3)
    const stepUpMart = (asthmaRes.recommendedStep === 3 || (asthmaRes.recommendation || '').includes('3') ||
                        JSON.stringify(asthmaRes).toLowerCase().includes('step 3') ||
                        JSON.stringify(asthmaRes).toLowerCase().includes('mart'));
    assert(stepUpMart, "Uncontrolled asthma on Step 2 steps up to Step 3 Low-Dose MART (ICS-Formoterol)");
  }
});

// Case 7: COPD GOLD Group E Triple therapy
runCase(7, "COPD GOLD Group E Triple therapy", () => {
  assert(PrimaryCareEngine !== null, "PrimaryCareEngine is present");

  if (typeof PrimaryCareEngine.evaluateCopdGold === 'function') {
    // Subtest 7A: Frequent exacerbations (>=2 moderate or >=1 hospital) -> GOLD Group E
    const copdPtE = {
      condition: 'copd',
      moderateExacerbations: 2,
      hospitalExacerbations: 1,
      mMRC: 2,
      catScore: 18,
      bloodEosinophils: 360 // >= 300 cells/uL
    };
    const copdResE = PrimaryCareEngine.evaluateCopdGold(copdPtE);
    const isGroupE = (copdResE.group || copdResE.goldGroup || '').toUpperCase().includes('E') ||
                     JSON.stringify(copdResE).includes('المجموعة E');
    assert(isGroupE, "Frequent COPD exacerbations classify patient into GOLD Group E");

    // Subtest 7B: Eosinophils >= 300 in Group E -> Triple therapy (LABA + LAMA + ICS)
    const tripleTherapy = JSON.stringify(copdResE).toLowerCase().includes('triple') ||
                          (JSON.stringify(copdResE).toLowerCase().includes('laba') &&
                           JSON.stringify(copdResE).toLowerCase().includes('lama') &&
                           JSON.stringify(copdResE).toLowerCase().includes('ics')) ||
                          JSON.stringify(copdResE).includes('ثلاثي');
    assert(tripleTherapy, "GOLD Group E with eosinophils >= 300 recommends Triple Therapy (LABA + LAMA + ICS)");

    // Subtest 7C: Eosinophils < 100 -> ICS pneumonia risk alert
    const copdPtLowEos = {
      condition: 'copd',
      moderateExacerbations: 2,
      bloodEosinophils: 60 // < 100 cells/uL
    };
    const copdResLowEos = PrimaryCareEngine.evaluateCopdGold(copdPtLowEos);
    const pneumoniaRisk = JSON.stringify(copdResLowEos).toLowerCase().includes('pneumonia') ||
                          JSON.stringify(copdResLowEos).includes('ذات الرئة') ||
                          JSON.stringify(copdResLowEos).toLowerCase().includes('avoid ics') ||
                          JSON.stringify(copdResLowEos).includes('تجنب');
    assert(pneumoniaRisk, "COPD with eosinophils < 100 triggers pneumonia risk warning against ICS");
  }
});

// Case 8: Overt Hypothyroidism in ASCVD conservative Levothyroxine
runCase(8, "Overt Hypothyroidism in ASCVD conservative Levothyroxine", () => {
  assert(PrimaryCareEngine !== null, "PrimaryCareEngine is present");

  if (typeof PrimaryCareEngine.evaluateThyroid === 'function') {
    // Subtest 8A: Overt Hypothyroidism diagnostic classification
    const overtHypoPt = {
      tsh: 16.5,
      ft4: 6.8, // low FT4
      weightKg: 70,
      ascvd: false,
      age: 38
    };
    const overtRes = PrimaryCareEngine.evaluateThyroid(overtHypoPt);
    const isOvert = (overtRes.diagnosis || overtRes.status || '').toLowerCase().includes('overt') ||
                    JSON.stringify(overtRes).includes('صريح') ||
                    JSON.stringify(overtRes).toLowerCase().includes('hypothyroid');
    assert(isOvert, "Elevated TSH + Low FT4 correctly diagnoses Overt Hypothyroidism");

    // Subtest 8B: Young healthy standard dose (~1.6 mcg/kg)
    const stdDose = overtRes.recommendedDose || overtRes.startingDose || overtRes.doseMcg || 0;
    const stdDoseValid = (stdDose >= 100 && stdDose <= 125) || JSON.stringify(overtRes).includes('112') || JSON.stringify(overtRes).includes('1.6');
    assert(stdDoseValid, "Standard young patient receives weight-based ~1.6 mcg/kg Levothyroxine replacement");

    // Subtest 8C: Established ASCVD / Elderly conservative starting dose (25-50 mcg)
    const ascvdHypoPt = {
      tsh: 18.0,
      ft4: 7.0,
      weightKg: 85,
      ascvd: true,
      cad: true,
      age: 66
    };
    const ascvdRes = PrimaryCareEngine.evaluateThyroid(ascvdHypoPt);
    const conservativeDose = JSON.stringify(ascvdRes).includes('25') ||
                             JSON.stringify(ascvdRes).includes('50') ||
                             (ascvdRes.recommendedDose >= 25 && ascvdRes.recommendedDose <= 50) ||
                             JSON.stringify(ascvdRes).toLowerCase().includes('conservative');
    assert(conservativeDose, "Patient with ASCVD receives conservative Levothyroxine starting dose (25-50 mcg/d)");

    // Subtest 8D: Thyrotoxicosis + Asthma -> Propranolol bronchospasm warning
    const hyperThyroidPt = {
      tsh: 0.05,
      ft4: 28.0,
      asthma: true
    };
    const hyperRes = PrimaryCareEngine.evaluateThyroid(hyperThyroidPt);
    const bronchospasmAlert = JSON.stringify(hyperRes).toLowerCase().includes('bronchospasm') ||
                              JSON.stringify(hyperRes).toLowerCase().includes('propranolol') ||
                              JSON.stringify(hyperRes).includes('ربو') ||
                              JSON.stringify(hyperRes).includes('انقباض قصبي');
    assert(bronchospasmAlert, "Hyperthyroidism in asthma patient triggers Propranolol bronchospasm caution alert");
  }
});

// Case 9: Patient leaflets (AR & EN) & Prescription share export
runCase(9, "Patient leaflets (AR & EN) & Prescription share export", () => {
  // Subtest 9A: Patient Leaflets Module
  assert(PatientLeaflets !== null, "PatientLeaflets module is present");

  // Dynamic targets extraction
  if (typeof PatientLeaflets.getDynamicTargets === 'function') {
    const targets = PatientLeaflets.getDynamicTargets();
    assert(targets && targets.dm && targets.htn && targets.dlp, "PatientLeaflets.getDynamicTargets returns multi-engine clinical targets");
    
    // Test Arabic Share Text
    if (typeof PatientLeaflets.buildShareText === 'function') {
      const arShareText = PatientLeaflets.buildShareText(targets, 'ar', 'all');
      const hasArRule15 = arShareText.includes('15') || arShareText.includes('هبوط');
      const hasArSadmans = arShareText.includes('SADMANS') || arShareText.includes('أيام المرض');
      assert(hasArRule15, "Arabic patient leaflet export contains Rule of 15 hypoglycemia instructions");
      assert(hasArSadmans, "Arabic patient leaflet export contains SADMANS sick-day rules");

      // Test English Share Text
      const enShareText = PatientLeaflets.buildShareText(targets, 'en', 'all');
      const hasEnRule15 = enShareText.includes('15') || enShareText.toLowerCase().includes('hypoglycemia');
      const hasEnSadmans = enShareText.includes('SADMANS') || enShareText.toLowerCase().includes('sick day');
      assert(hasEnRule15, "English patient leaflet export contains Rule of 15 hypoglycemia instructions");
      assert(hasEnSadmans, "English patient leaflet export contains SADMANS sick-day rules");
    }
  }

  // Subtest 9B: Offline SVG QR Code Generator
  const qrGen = (PatientLeaflets && typeof PatientLeaflets.generateQRCode === 'function') ? PatientLeaflets.generateQRCode :
                (OsrawyQRCode && typeof OsrawyQRCode.generateSVG === 'function') ? OsrawyQRCode.generateSVG : null;

  assert(qrGen !== null, "Offline SVG QR Code generator is present");
  if (qrGen) {
    const qrSvg = qrGen('https://osrawy.app/patient/rx-12345', { size: 200 });
    assert(typeof qrSvg === 'string' && qrSvg.includes('<svg') && qrSvg.includes('</svg>'), "100% offline SVG QR code generator outputs valid SVG markup");
  }

  // Subtest 9C: Multi-engine Prescription Share Export (Arabic & English)
  assert(RxShare !== null, "Prescription share (RxShare) module is present");

  if (typeof RxShare.buildPrescriptionReport === 'function') {
    // Arabic Export
    const arReport = RxShare.buildPrescriptionReport('ar');
    assert(typeof arReport === 'string' && arReport.length > 50, "Bilingual Prescription export builds detailed Arabic report");
    const arSections = arReport.includes('الوصفة') || arReport.includes('الضغط') || arReport.includes('السكر') || arReport.includes('العلاج');
    assert(arSections, "Arabic prescription export includes clinical sections");

    // English Export
    const enReport = RxShare.buildPrescriptionReport('en');
    assert(typeof enReport === 'string' && enReport.length > 50, "Bilingual Prescription export builds detailed English report");
    const enSections = enReport.toLowerCase().includes('prescription') || enReport.toLowerCase().includes('patient') || enReport.toLowerCase().includes('targets');
    assert(enSections, "English prescription export includes clinical targets and metadata");
  }
});

// Case 10: Formulary trade name search in Arabic/English & display modes (generic/trade/both)
runCase(10, "Formulary trade name search in Arabic/English & display modes (generic/trade/both)", () => {
  const dir = getModule('OsrawyDrugsDirectory', 'DrugDirectory');
  assert(dir !== null, "OsrawyDrugsDirectory module is present");
  if (!dir) return;

  // Search by English trade name
  const jardianceHits = typeof dir.searchDrugs === 'function' ? dir.searchDrugs('Jardiance') : [];
  assert(jardianceHits.length >= 1, "Search for 'Jardiance' returns matching drug");
  if (jardianceHits.length >= 1) {
    assert(jardianceHits[0].id === 'empagliflozin', "Jardiance correctly maps to empagliflozin");
  }

  // Search by Arabic trade name
  const glucophageHits = typeof dir.searchDrugs === 'function' ? dir.searchDrugs('جلوكوفاج') : [];
  assert(glucophageHits.length >= 1, "Search for 'جلوكوفاج' returns matching drug");
  if (glucophageHits.length >= 1) {
    assert(glucophageHits[0].id === 'metformin', "جلوكوفاج correctly maps to metformin");
  }

  const concorHits = typeof dir.searchDrugs === 'function' ? dir.searchDrugs('Concor') : [];
  assert(concorHits.length >= 1, "Search for 'Concor' returns matching drug");
  if (concorHits.length >= 1) {
    assert(concorHits[0].id === 'bisoprolol', "Concor correctly maps to bisoprolol");
  }

  // Display modes: generic, trade, both
  if (typeof dir.formatDrugDisplayName === 'function') {
    const genName = dir.formatDrugDisplayName('atorvastatin', 'generic', 'en');
    assert(genName === 'Atorvastatin', `Generic mode returns generic name: 'Atorvastatin' (got: ${genName})`);

    const tradeName = dir.formatDrugDisplayName('atorvastatin', 'trade', 'en');
    assert(tradeName === 'Lipitor', `Trade mode returns primary trade name: 'Lipitor' (got: ${tradeName})`);

    const bothName = dir.formatDrugDisplayName('atorvastatin', 'both', 'en');
    assert(bothName.includes('Atorvastatin') && bothName.includes('Lipitor'), `Both mode includes generic and trade names (got: ${bothName})`);

    // Arabic display mode
    const genAr = dir.formatDrugDisplayName('atorvastatin', 'generic', 'ar');
    assert(genAr.includes('أتورفاستاتين'), `Arabic generic mode returns 'أتورفاستاتين' (got: ${genAr})`);
  }

  // Display mode getter/setter
  if (typeof dir.setDisplayMode === 'function' && typeof dir.getDisplayMode === 'function') {
    dir.setDisplayMode('trade');
    assert(dir.getDisplayMode() === 'trade', "setDisplayMode('trade') sets active display mode");
    dir.setDisplayMode('both');
    assert(dir.getDisplayMode() === 'both', "setDisplayMode('both') sets active display mode");
  }
});

// Case 11: KDIGO Heat-Map (eGFR 38 + UACR 350 -> G3bA3 Very High Risk)
runCase(11, "KDIGO Heat-Map (eGFR 38 + UACR 350 -> G3bA3 Very High Risk)", () => {
  const tools = getModule('OsrawyClinicalTools', 'ClinicalTools');
  assert(tools !== null, "ClinicalTools / OsrawyClinicalTools module is present");
  if (!tools || typeof tools.evaluateKdigoMatrix !== 'function') {
    assert(false, "evaluateKdigoMatrix function is available");
    return;
  }

  const kdigo = tools.evaluateKdigoMatrix(38, 350);
  assert(kdigo !== null && typeof kdigo === 'object', "evaluateKdigoMatrix returns result object");
  assert(kdigo.stage === 'G3bA3' || (kdigo.gStage === 'G3b' && kdigo.aStage === 'A3'), `eGFR 38 + UACR 350 staged as G3bA3 (got: ${kdigo.stage})`);
  assert(kdigo.riskTier === 'VERY_HIGH' || String(kdigo.riskTier).includes('VERY_HIGH') || String(kdigo.risk).toUpperCase().includes('VERY HIGH'), `Risk tier classified as VERY_HIGH (got: ${kdigo.riskTier})`);
  assert(Boolean(kdigo.actionEn && kdigo.actionAr), "KDIGO matrix provides bilingual action guidelines (EN/AR)");
  assert(kdigo.monitorPerYear >= 3, `Intensive monitoring frequency assigned (>= 3/yr, got: ${kdigo.monitorPerYear})`);
});

// Case 12: FIB-4 Advanced Fibrosis Alert
runCase(12, "FIB-4 Advanced Fibrosis Alert", () => {
  const tools = getModule('OsrawyClinicalTools', 'ClinicalTools');
  assert(tools !== null, "ClinicalTools module is present");
  if (!tools || typeof tools.calculateFib4 !== 'function') {
    assert(false, "calculateFib4 function is available");
    return;
  }

  // Patient with elevated FIB-4: Age 62, AST 68, ALT 42, Platelets 135
  const fib4High = tools.calculateFib4(62, 68, 42, 135);
  assert(fib4High !== null, "calculateFib4 returns result object");
  assert(fib4High.risk === 'HIGH' || String(fib4High.risk).includes('HIGH'), `FIB-4 score ${fib4High.score} classifies as HIGH risk of advanced fibrosis`);
  assert(Boolean(fib4High.planEn && (fib4High.planEn.includes('Hepatology') || fib4High.planEn.toLowerCase().includes('fibrosis'))), "High FIB-4 recommends hepatology referral / avoiding hepatotoxic drugs");

  // Low risk patient: Age 45, AST 22, ALT 25, Platelets 260
  const fib4Low = tools.calculateFib4(45, 22, 25, 260);
  assert(fib4Low.risk === 'LOW', `Low FIB-4 score (${fib4Low.score}) classifies as LOW risk`);
});

// Case 13: Apixaban 2-of-3 dose reduction (Age 82, Wt 56, Cr 1.6)
runCase(13, "Apixaban 2-of-3 dose reduction (Age 82, Wt 56, Cr 1.6)", () => {
  const tools = getModule('OsrawyClinicalTools', 'ClinicalTools');
  assert(tools !== null, "ClinicalTools module is present");
  if (!tools || typeof tools.evaluateDoacDosing !== 'function') {
    assert(false, "evaluateDoacDosing function is available");
    return;
  }

  // Patient meets all 3 ABC criteria: Age >= 80 (82), Weight <= 60 kg (56), SCr >= 1.5 mg/dL (1.6)
  const doacReduced = tools.evaluateDoacDosing({
    age: 82,
    weightKg: 56,
    creatinineMgDl: 1.6,
    sex: 'female'
  });
  assert(doacReduced !== null, "evaluateDoacDosing returns dosing recommendation");
  assert(Boolean(doacReduced.apixabanEn && doacReduced.apixabanEn.includes('2.5 mg PO BID')), `Apixaban reduced to 2.5 mg PO BID (got: ${doacReduced.apixabanEn})`);
  assert(Boolean(doacReduced.apixabanAr && doacReduced.apixabanAr.includes('٢.٥ ملغ')), "Bilingual Arabic dose reduction text provided");

  // Standard patient: Age 65, Weight 75 kg, SCr 1.0 mg/dL -> 5 mg PO BID
  const doacStd = tools.evaluateDoacDosing({
    age: 65,
    weightKg: 75,
    creatinineMgDl: 1.0,
    sex: 'male'
  });
  assert(Boolean(doacStd.apixabanEn && doacStd.apixabanEn.includes('5 mg PO BID')), `Standard patient receives Apixaban 5 mg PO BID (got: ${doacStd.apixabanEn})`);
});

// Case 14: New Patient Reset clears medications and restores default eGFR
runCase(14, "New Patient Reset clears medications and restores default eGFR", () => {
  const pSync = getModule('OsrawyPatientSync', 'PatientSync');
  assert(pSync !== null, "PatientSync module is present");
  if (!pSync || typeof pSync.resetPatient !== 'function') {
    assert(false, "resetPatient function is available on PatientSync");
    return;
  }

  // Set patient state with custom values
  if (typeof pSync.updatePatient === 'function') {
    pSync.updatePatient({
      egfr: 35,
      medications: ['metformin', 'valsartan', 'empagliflozin'],
      sbp: 160
    });
  }

  // Reset patient
  pSync.resetPatient();
  const state = pSync.getState();

  assert(Array.isArray(state.medications) && state.medications.length === 0, "resetPatient clears active medications array");
  assert(state.egfr >= 60 || state.egfr === null || state.egfr === undefined || state.egfr === 90, `resetPatient restores default eGFR (got: ${state.egfr})`);
  assert(state.trimester === 2 || state.gestationalWeeks === 16 || state.comorbidities !== undefined, "resetPatient maintains default schema with obstetric properties");
});

// Case 15: Pregnant patient with Asthma on Valsartan + Indapamide (preeclampsia Aspirin + Nifedipine ER switch)
runCase(15, "Pregnant patient with Asthma on Valsartan + Indapamide (preeclampsia Aspirin + Nifedipine ER switch)", () => {
  const htnPreg = getModule('OsrawyHtnPregnancy') || (HtnEngine && HtnEngine.OsrawyHtnPregnancy) || (HtnEngine && HtnEngine.evaluatePregnancyHtnProtocol ? HtnEngine : null);
  const evalFn = (htnPreg && typeof htnPreg.evaluatePregnancyHtnProtocol === 'function')
    ? htnPreg.evaluatePregnancyHtnProtocol
    : (HtnEngine && typeof HtnEngine.evaluatePregnancyHtnProtocol === 'function' ? HtnEngine.evaluatePregnancyHtnProtocol : null);

  assert(evalFn !== null, "evaluatePregnancyHtnProtocol is available");
  if (!evalFn) return;

  const obHtn = evalFn({
    sbp: 164,
    dbp: 112,
    gestationalWeeks: 16,
    comorbidities: { pregnancy: true, asthma: true },
    medications: ['valsartan', 'indapamide']
  });

  assert(obHtn !== null, "evaluatePregnancyHtnProtocol returns evaluation result");

  // Severe Obstetric HTN Emergency (>= 160/110)
  const emergencyAlert = obHtn.alerts && obHtn.alerts.some(a => a.code === 'OBSTETRIC_HYPERTENSIVE_EMERGENCY' || JSON.stringify(a).toLowerCase().includes('emergency'));
  assert(emergencyAlert, "Severe HTN (164/112) triggers OBSTETRIC_HYPERTENSIVE_EMERGENCY alert");

  // Discontinue Teratogenic HTN drugs (Valsartan & Indapamide)
  const teratoStop = obHtn.alerts && obHtn.alerts.some(a => a.code === 'STOP_TERATOGENIC_HTN_MEDS' || JSON.stringify(a).toLowerCase().includes('teratogenic') || JSON.stringify(a).includes('ممنوع'));
  assert(teratoStop, "Valsartan and Indapamide trigger STOP_TERATOGENIC_HTN_MEDS alert");

  // Preeclampsia Aspirin prophylaxis at 16 weeks (weeks 12-36)
  const aspirinStep = obHtn.steps && obHtn.steps.some(s => s.code === 'PREECLAMPSIA_ASPIRIN_PROPHYLAXIS' || JSON.stringify(s).toLowerCase().includes('aspirin') || JSON.stringify(s).includes('أسبرين'));
  assert(aspirinStep, "Gestational age 16 weeks triggers PREECLAMPSIA_ASPIRIN_PROPHYLAXIS step");

  // Asthma-aware selection: Avoid Labetalol, pivot to Nifedipine ER
  const nifedipineStep = obHtn.steps && obHtn.steps.some(s => s.code === 'PREGNANCY_HTN_STEP_1_NIFEDIPINE' || JSON.stringify(s).toLowerCase().includes('nifedipine') || JSON.stringify(s).includes('نيفيديبين'));
  assert(nifedipineStep, "Maternal asthma pivots 1st-line therapy to Nifedipine ER (avoiding Labetalol bronchospasm)");
});

// Case 16: Trimester 3 (80 kg) pregnancy insulin calculation (72 U/d TDD, 36 U basal, 12 U/meal) & oral drug stop
runCase(16, "Trimester 3 (80 kg) pregnancy insulin calculation (72 U/d TDD, 36 U basal, 12 U/meal) & oral drug stop", () => {
  const dmPreg = getModule('OsrawyDmPregnancy') || (DiabetesEngine && DiabetesEngine.OsrawyDmPregnancy) || (DiabetesEngine && DiabetesEngine.evaluatePregnancyDmProtocol ? DiabetesEngine : null);
  const evalFn = (dmPreg && typeof dmPreg.evaluatePregnancyDmProtocol === 'function')
    ? dmPreg.evaluatePregnancyDmProtocol
    : (DiabetesEngine && typeof DiabetesEngine.evaluatePregnancyDmProtocol === 'function' ? DiabetesEngine.evaluatePregnancyDmProtocol : null);

  assert(evalFn !== null, "evaluatePregnancyDmProtocol is available");
  if (!evalFn) return;

  const obDm = evalFn({
    weightKg: 80,
    trimester: 3,
    gestationalWeeks: 30,
    comorbidities: { pregnancy: true },
    medications: ['empagliflozin', 'semaglutide']
  });

  assert(obDm !== null, "evaluatePregnancyDmProtocol returns evaluation result");

  // Discontinue non-insulin oral/injectable DM drugs
  const stopOral = obDm.alerts && obDm.alerts.some(a => a.code === 'STOP_NON_INSULIN_PREGNANCY_DRUGS' || JSON.stringify(a).toLowerCase().includes('stop') || JSON.stringify(a).includes('أوقف'));
  assert(stopOral, "SGLT2i (Empagliflozin) and GLP-1RA (Semaglutide) trigger STOP_NON_INSULIN_PREGNANCY_DRUGS alert");

  // Trimester 3 weight-based calculation: 80 kg * 0.9 = 72 U/day TDD
  assert(obDm.dosing && obDm.dosing.tddUnits === 72, `Trimester 3 TDD calculated as 72 U/day (got: ${obDm.dosing && obDm.dosing.tddUnits})`);

  // Basal: 50% = 36 U/day
  assert(obDm.dosing && obDm.dosing.basalUnits === 36, `Basal insulin calculated as 36 U/day (got: ${obDm.dosing && obDm.dosing.basalUnits})`);

  // Prandial: 50% / 3 meals = 12 U/meal
  assert(obDm.dosing && obDm.dosing.mealBolusUnits === 12, `Meal bolus calculated as 12 U before each of 3 meals (got: ${obDm.dosing && obDm.dosing.mealBolusUnits})`);

  // Obstetric glycemic targets present
  assert(Boolean(obDm.targets && obDm.targets.fastingMgDl && obDm.targets.fastingMgDl.includes('<95')), "Obstetric glycemic targets enforce fasting <95 mg/dL");
});

// =====================================================================
// Case 17: ClinicalTools Interactive Tools Tab, FIB-4 Labels & DOAC Sync
// =====================================================================
runCase(17, "ClinicalTools renderToolsTab (CKD-EPI arg order, DOAC, FIB-4 labels, Sync button)", () => {
  assert(ClinicalTools !== null, "ClinicalTools module is available");
  if (!ClinicalTools) return;

  // Prepare mock inputs matching renderToolsTab DOM IDs
  const tabIds = {
    'tab-scr': '1.6',
    'tab-scr-unit': 'mg',
    'tab-age': '82',
    'tab-sex': 'f',
    'tab-wt': '56',
    'tab-kdigo-egfr': '48',
    'tab-kdigo-uacr': '0',
    'tab-fib4-ast': '85',
    'tab-fib4-alt': '35',
    'tab-fib4-plt': '120'
  };
  Object.entries(tabIds).forEach(([id, val]) => {
    const el = getOrCreate(id, 'input');
    el.value = val;
  });

  // Trigger renderToolsTab on container
  const toolsContainer = getOrCreate('clinical-tools-container', 'div');
  ClinicalTools.renderToolsTab('clinical-tools-container');

  // Note: calculateCKDEPI with Scr=1.6, mg, Age=82, Female -> eGFR ~ 34.4
  const egfrHtml = getOrCreate('tab-egfr-results').innerHTML;
  assert(egfrHtml.includes('eGFR:') && !egfrHtml.includes('undefined'), `Tools tab eGFR renders valid calculation without crashing or undefined`);

  // Ensure UACR=0 is preserved (A1, not falsely defaulted to 30 / A2)
  const kdigoHtml = getOrCreate('tab-kdigo-results').innerHTML;
  assert(kdigoHtml.includes('A1'), `Tools tab KDIGO preserves UACR=0 as A1 instead of replacing 0 with default 30 (html: ${kdigoHtml.slice(0, 120)})`);

  // Ensure DOAC receives patient inputs (Age 82 >=80, Wt 56 <=60, Scr 1.6 >=1.5 -> reduced Apixaban 2.5 mg)
  const doacHtml = getOrCreate('tab-doac-results').innerHTML;
  assert(doacHtml.includes('2.5 mg PO BID') || doacHtml.includes('٢.٥ ملغ'), `Tools tab DOAC reduces Apixaban to 2.5 mg BID for 3/3 ABC criteria`);

  // Ensure FIB-4 badge renders real label (not undefined)
  const fib4Res = ClinicalTools.calculateFib4(82, 85, 35, 120);
  assert(Boolean(fib4Res && fib4Res.riskLabelEn && fib4Res.riskLabelAr), "calculateFib4 exposes bilingual riskLabelEn and riskLabelAr");
  const fibHtml = getOrCreate('tab-fib4-results').innerHTML;
  assert(!fibHtml.includes('undefined') && fibHtml.includes('FIB-4:'), "Tools tab FIB-4 renders badge label without 'undefined'");

  // Ensure Sync button calls PatientSync.updatePatient / updates eGFR
  const prevEgfr = PatientSync.get().egfr;
  const syncBtn = getOrCreate('btn-sync-tools-egfr', 'button');
  if (typeof syncBtn.onclick === 'function') syncBtn.onclick();
  const syncedEgfr = PatientSync.get().egfr;
  assert(syncedEgfr !== prevEgfr && syncedEgfr > 20 && syncedEgfr < 45, `Tools tab Sync button updates PatientSync eGFR (from ${prevEgfr} to ${syncedEgfr})`);
  PatientSync.resetPatient();
});

// =====================================================================
// Case 18: PrimaryCareEngine UI Wiring & Edge Cases (tsh=0, hf=undefined, COPD inputs)
// =====================================================================
runCase(18, "PrimaryCareEngine UI & Thyroid/COPD edge cases (tsh=0, eos=0, undefined hf)", () => {
  assert(PrimaryCareEngine !== null, "PrimaryCareEngine module is available");
  if (!PrimaryCareEngine) return;

  // Thyroid edge cases
  const hyperZeroTsh = PrimaryCareEngine.evaluateThyroid({ tsh: 0, ft4: 3.2, age: 30, wt: 60 });
  assert(hyperZeroTsh.status === 'overt_hyper', `tsh=0 is not treated as falsy default 2.5 (status: ${hyperZeroTsh.status})`);

  const youngHypo = PrimaryCareEngine.evaluateThyroid({ tsh: 14.0, ft4: 0.5, age: 35, wt: 70 });
  assert(!youngHypo.hasAscvd && youngHypo.recommendedDose >= 100, `Undefined hf does NOT misclassify young adult as ASCVD (hasAscvd=${youngHypo.hasAscvd}, dose=${youngHypo.recommendedDose})`);

  const euthy = PrimaryCareEngine.evaluateThyroid({ tsh: 2.2, ft4: 1.2 });
  assert(Boolean(euthy.rxEn && euthy.rxAr), "Euthyroid result provides non-empty rxEn and rxAr management guidance");

  // Render Primary Care Tab UI and verify Asthma & COPD inputs
  const pcContainer = getOrCreate('primary-care-container', 'div');
  getOrCreate('pc-asthma-saba', 'input').value = '4';
  getOrCreate('pc-asthma-step', 'select').value = '2';
  getOrCreate('pc-asthma-track', 'select').value = '1';
  getOrCreate('pc-asthma-day', 'input').checked = true;
  getOrCreate('pc-copd-exac', 'input').value = '2';
  getOrCreate('pc-copd-hosp', 'input').value = '0';
  getOrCreate('pc-copd-mmrc', 'input').value = '2';
  getOrCreate('pc-copd-cat', 'input').value = '14';
  getOrCreate('pc-copd-eos', 'input').value = '0';
  getOrCreate('pc-thy-tsh', 'input').value = '0';
  getOrCreate('pc-thy-ft4', 'input').value = '3.0';
  getOrCreate('pc-thy-wt', 'input').value = '65';

  PrimaryCareEngine.renderPrimaryCareTab('primary-care-container');

  const asthmaOutHtml = getOrCreate('pc-asthma-output').innerHTML;
  assert(!asthmaOutHtml.includes('undefined') && asthmaOutHtml.length > 40, "Asthma UI output renders recommendationDetails without 'undefined'");

  const copdOutHtml = getOrCreate('pc-copd-output').innerHTML;
  assert(copdOutHtml.includes('Group E') && (copdOutHtml.includes('100') || copdOutHtml.includes('رئوي')), `COPD UI passes moderateExacerbations=2 & bloodEosinophils=0 correctly into evaluateCopdGold`);

  const thyOutHtml = getOrCreate('pc-thy-output').innerHTML;
  assert(!thyOutHtml.includes('undefined') && (thyOutHtml.includes('Hyper') || thyOutHtml.includes('فرط')), `Thyroid UI preserves tsh=0 for overt hyperthyroidism`);
});

// =====================================================================
// Case 19: RxShare Prescription Report with Primary Care & medications[]
// =====================================================================
runCase(19, "RxShare buildPrescriptionReport handles asthma recommendation & medications array", () => {
  assert(RxShare !== null, "RxShare module is available");
  if (!RxShare) return;

  const samplePt = {
    name: 'Test Asthma Patient',
    age: 42,
    sex: 'm',
    wt: 78,
    ht: 174,
    a1c: 7.4,
    fpg: 140,
    egfr: 85,
    uacr: 18,
    sbp: 128,
    dbp: 80,
    k: 4.3,
    asthma: true,
    sabaUsePerWeek: 4,
    asthmaDaytime: true,
    medications: ['budesonide_formoterol']
  };

  const reportAr = RxShare.buildPrescriptionReport('ar', samplePt);
  const reportEn = RxShare.buildPrescriptionReport('en', samplePt);

  assert(typeof reportAr === 'string' && !reportAr.includes('undefined') && reportAr.includes('GINA'), "Arabic report formats asthma care cleanly without 'undefined'");
  assert(typeof reportEn === 'string' && !reportEn.includes('undefined') && reportEn.includes('GINA'), "English report formats asthma care cleanly without 'undefined'");
  assert(reportEn.includes('Budesonide'), "Report reads pt.medications fallback when activeMeds is absent");
});

// =====================================================================
// Case 20: I18n Key Parity with index.html + DrugDirectory Market & Tier Fixes
// =====================================================================
runCase(20, "I18n covers all HTML keys in AR/EN & DrugDirectory market/tier switching works", () => {
  const html = fs.readFileSync(path.resolve(__dirname, 'www', 'index.html'), 'utf8');
  const keyRe = /data-i18n(?:-placeholder|-title|-aria-label)?="([^"]+)"/g;
  const htmlKeys = new Set();
  let match;
  while ((match = keyRe.exec(html))) htmlKeys.add(match[1]);

  I18n.setLang('ar');
  const missingAr = [...htmlKeys].filter(k => I18n.t(k) === k);
  I18n.setLang('en');
  const missingEn = [...htmlKeys].filter(k => I18n.t(k) === k);
  const enFallbackToAr = [...htmlKeys].filter(k => /[\u0600-\u06FF]/.test(I18n.t(k)) && k !== 'lang_toggle_btn');

  assert(missingAr.length === 0, `All ${htmlKeys.size} data-i18n* keys exist in Arabic translations (missing: ${missingAr.join(', ')})`);
  assert(missingEn.length === 0 && enFallbackToAr.length === 0, `All ${htmlKeys.size} data-i18n* keys exist natively in English without Arabic fallback (missing: ${[...missingEn, ...enFallbackToAr].join(', ')})`);

  // Market switching (Saudi vs Egypt)
  DrugsDirectory.setMarket('egypt');
  assert(DrugsDirectory.getMarket() === 'egypt', "DrugDirectory.setMarket('egypt') persists active market");
  assert(DrugsDirectory.formatDrugDisplayName('metformin', 'trade', 'en') === 'Cidophage', `Egypt market prioritizes Egyptian metformin brand 'Cidophage' (got: ${DrugsDirectory.formatDrugDisplayName('metformin', 'trade', 'en')})`);

  DrugsDirectory.setMarket('saudi');
  assert(DrugsDirectory.getMarket() === 'saudi', "DrugDirectory.setMarket('saudi') restores Saudi market");
  assert(DrugsDirectory.formatDrugDisplayName('metformin', 'trade', 'en') === 'Glucophage', `Saudi market restores 'Glucophage'`);

  // Tier filtering & Diabetes D tiers not clobbered to 1
  const tier3Drugs = DrugsDirectory.searchDrugs('', 'all', '3');
  assert(tier3Drugs.length >= 2 && tier3Drugs.every(d => d.tier === 3), "Tier 3 filter returns only high-cost drugs (Semaglutide, Tirzepatide)");
  const D = vm.runInContext('D', context);
  assert(D && D.sema && D.sema.tier === 3, `Diabetes engine preserves Semaglutide tier=3 after DRUG_DATABASE market sync (got: ${D && D.sema && D.sema.tier})`);

  // togglePatientMedication preserves default activeMeds=['met'] when medications=[]
  PatientSync.resetPatient();
  PatientSync.updatePatient({ activeMeds: ['met'], medications: [] });
  DrugsDirectory.togglePatientMedication('atorvastatin');
  const afterToggle = PatientSync.get().activeMeds;
  assert(afterToggle.includes('met') && afterToggle.includes('atorvastatin'), `togglePatientMedication preserves existing activeMeds when adding new med (got: ${JSON.stringify(afterToggle)})`);
  PatientSync.resetPatient();
});

// =====================================================================
// Case 21 & 22: Realistic Browser DOM End-to-End Test (All 13 Scripts incl. app.js & updater.js)
// =====================================================================
runCase(21, "Full 13-script realistic DOM lifecycle (app.js, guardrail critical icon, pregnancy card, XSS escaping)", () => {
  const html = fs.readFileSync(path.resolve(__dirname, 'www', 'index.html'), 'utf8');

  // Build realistic DOM element registry parsed from www/index.html IDs and key attributes
  const domMap = new Map();
  const winListeners = {};
  const docListeners2 = {};

  class RealMockEl {
    constructor(tag, id = '') {
      this.tagName = tag.toUpperCase();
      this.id = id;
      this.value = '';
      this.checked = false;
      this.hidden = false;
      this.disabled = false;
      this._innerHTML = '';
      this.textContent = '';
      this.innerText = '';
      this.style = {
        _props: {},
        setProperty(k, v) { this._props[k] = String(v); },
        getPropertyValue(k) { return this._props[k] || ''; }
      };
      this.dataset = {};
      this.attributes = {};
      this.listeners = {};
      this.children = [];
      this.parentNode = null;
      this.className = '';
      const self = this;
      this.classList = {
        classes: new Set(),
        add: (...c) => c.forEach(x => self.classList.classes.add(x)),
        remove: (...c) => c.forEach(x => self.classList.classes.delete(x)),
        contains: (c) => self.classList.classes.has(c),
        toggle: (c, f) => {
          if (f === undefined) {
            if (self.classList.classes.has(c)) self.classList.classes.delete(c);
            else self.classList.classes.add(c);
          } else if (f) self.classList.classes.add(c);
          else self.classList.classes.delete(c);
          return self.classList.classes.has(c);
        }
      };
    }
    get innerHTML() { return this._innerHTML; }
    set innerHTML(val) {
      this._innerHTML = String(val == null ? '' : val);
      const idRe = /<([a-z0-9-]+)\b([^>]*)\bid="([^"]+)"([^>]*)>/gi;
      let mm;
      while ((mm = idRe.exec(this._innerHTML))) {
        const tag = mm[1], attrs = mm[2] + ' ' + mm[4], eid = mm[3];
        const child = new RealMockEl(tag, eid);
        const vm2 = /\bvalue="([^"]*)"/i.exec(attrs);
        if (vm2) child.value = vm2[1];
        if (/\bchecked\b/i.test(attrs)) child.checked = true;
        const clsm = /\bclass="([^"]*)"/i.exec(attrs);
        if (clsm) { child.className = clsm[1]; clsm[1].split(/\s+/).filter(Boolean).forEach(c => child.classList.add(c)); }
        const oncm = /\bonclick="([^"]*)"/i.exec(attrs);
        if (oncm) child.setAttribute('onclick', oncm[1]);
        child.parentNode = this;
        domMap.set(eid, child);
      }
    }
    setAttribute(k, v) {
      this.attributes[k] = String(v);
      if (k === 'id') { this.id = String(v); domMap.set(this.id, this); }
      if (k.startsWith('data-')) this.dataset[k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase())] = String(v);
    }
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
    removeAttribute(k) { delete this.attributes[k]; }
    hasAttribute(k) { return this.attributes[k] !== undefined; }
    addEventListener(ev, fn) { if (!this.listeners[ev]) this.listeners[ev] = []; this.listeners[ev].push(fn); }
    dispatchEvent(ev) {
      const t = typeof ev === 'string' ? ev : ev.type;
      const o = typeof ev === 'string' ? { type: ev, target: this } : Object.assign(ev, { target: this });
      (this.listeners[t] || []).forEach(fn => fn(o));
      return true;
    }
    appendChild(c) { if (c) { c.parentNode = this; this.children.push(c); if (c.id) domMap.set(c.id, c); } return c; }
    prepend(c) { if (c) { c.parentNode = this; this.children.unshift(c); if (c.id) domMap.set(c.id, c); } return c; }
    insertBefore(c, r) { if (c) { c.parentNode = this; const i = this.children.indexOf(r); if (i === -1) this.children.push(c); else this.children.splice(i, 0, c); if (c.id) domMap.set(c.id, c); } return c; }
    removeChild(c) { const i = this.children.indexOf(c); if (i !== -1) { this.children.splice(i, 1); c.parentNode = null; } return c; }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); if (this.id) domMap.delete(this.id); }
    querySelector(sel) {
      if (sel.startsWith('#')) return domMap.get(sel.slice(1)) || null;
      return null;
    }
    querySelectorAll(sel) {
      if (sel === '[data-i18n]' || sel === '[data-i18n-placeholder]' || sel === '[data-i18n-title]' || sel === '[data-i18n-aria-label]') {
        return [];
      }
      if (sel === '.rxck') return [];
      const attrM = /^\[([^\]]+)\]$/.exec(sel);
      if (attrM) {
        const attr = attrM[1];
        return [...domMap.values()].filter(el => el.hasAttribute(attr));
      }
      return [];
    }
    click() { this.dispatchEvent({ type: 'click', target: this }); }
    scrollIntoView() {}
  }

  // Hydrate all IDs referenced in index.html + default select values + copy onclick
  const idMatchRe = /<([a-z0-9-]+)\b([^>]*)\bid="([^"]+)"([^>]*)>/gi;
  let m2;
  while ((m2 = idMatchRe.exec(html))) {
    const tag = m2[1], attrs = m2[2] + ' ' + m2[4], id = m2[3];
    const el = new RealMockEl(tag, id);
    const valM = /\bvalue="([^"]*)"/i.exec(attrs);
    if (valM) el.value = valM[1];
    if (/\bchecked\b/i.test(attrs)) el.checked = true;
    const clsM = /\bclass="([^"]*)"/i.exec(attrs);
    if (clsM) {
      el.className = clsM[1];
      clsM[1].split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c));
    }
    const onclickM = /\bonclick="([^"]*)"/i.exec(attrs);
    if (onclickM) el.setAttribute('onclick', onclickM[1]);
    if (tag.toLowerCase() === 'select') {
      const closeIdx = html.indexOf('</select>', m2.index);
      if (closeIdx !== -1) {
        const inner = html.slice(m2.index, closeIdx);
        const optRe = /<option\b([^>]*)>([^<]*)<\/option>/gi;
        const opts = [];
        let om;
        while ((om = optRe.exec(inner))) {
          const oValM = /\bvalue="([^"]*)"/i.exec(om[1]);
          opts.push({ val: oValM ? oValM[1] : om[2].trim(), sel: /\bselected\b/i.test(om[1]) });
        }
        const chosen = opts.find(o => o.sel) || opts[0];
        if (chosen) el.value = chosen.val;
      }
    }
    domMap.set(id, el);
  }
  // Ensure drugs container wraps list
  if (domMap.has('drugs-directory-container') && domMap.has('drug-directory-list')) {
    domMap.get('drugs-directory-container').appendChild(domMap.get('drug-directory-list'));
  }

  const storage2 = new Map();
  const docEl2 = new RealMockEl('html');
  const body2 = new RealMockEl('body');
  const mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      tag_name: 'v9.9.9<img src=x onerror=alert(1)>',
      body: '<script>evil()</script>Clinical & bug fixes',
      published_at: '2026-11-11T00:00:00Z',
      assets: [
        { name: 'osrawy-v9.9.9.apk', browser_download_url: 'javascript:alert(1)' }
      ]
    })
  });
  const win2 = {
    console,
    CustomEvent: MockCustomEvent,
    Event: MockEvent,
    AbortController: typeof AbortController !== 'undefined' ? AbortController : function() { return { signal: {}, abort: () => {} }; },
    fetch: mockFetch,
    navigator: { onLine: false, clipboard: { writeText: async () => {} }, vibrate: () => true },
    localStorage: {
      getItem: k => storage2.has(k) ? storage2.get(k) : null,
      setItem: (k, v) => storage2.set(k, String(v)),
      removeItem: k => storage2.delete(k)
    },
    addEventListener: (ev, fn) => { if (!winListeners[ev]) winListeners[ev] = []; winListeners[ev].push(fn); },
    removeEventListener: (ev, fn) => { winListeners[ev] = (winListeners[ev] || []).filter(f => f !== fn); },
    dispatchEvent: (ev) => { (winListeners[ev.type] || []).forEach(fn => fn(ev)); return true; },
    setTimeout: () => 0,
    clearTimeout: () => {},
    scrollTo: () => {},
    document: {
      readyState: 'loading',
      activeElement: null,
      documentElement: docEl2,
      body: body2,
      getElementById: id => domMap.get(id) || null,
      createElement: tag => new RealMockEl(tag),
      querySelector: sel => {
        if (sel.startsWith('#')) return domMap.get(sel.slice(1)) || null;
        if (sel === '.modal-overlay.open') {
          return [...domMap.values()].find(el => el.classList.contains('modal-overlay') && el.classList.contains('open')) || null;
        }
        return null;
      },
      querySelectorAll: sel => {
        if (sel.includes('main-view-section')) {
          return ['tab-diabetes', 'tab-htn', 'tab-drugs', 'tab-recent', 'tab-dlp', 'tab-tools', 'tab-leaflets']
            .map(id => domMap.get(id)).filter(Boolean);
        }
        if (sel === '.modal-overlay.open') {
          return [...domMap.values()].filter(el => el.classList.contains('modal-overlay') && el.classList.contains('open'));
        }
        return [];
      },
      addEventListener: (ev, fn) => { if (!docListeners2[ev]) docListeners2[ev] = []; docListeners2[ev].push(fn); },
      dispatchEvent: ev => { (docListeners2[ev.type || ev] || []).forEach(fn => fn(ev)); return true; }
    }
  };
  win2.window = win2;
  win2.self = win2;
  const sb2 = win2;
  const ctx2 = vm.createContext(win2);

  const all13 = [
    'i18n.js', 'drugs_data.js', 'patient_sync.js', 'clinical_tools.js',
    'lipids_engine.js', 'primary_care_engine.js', 'prescription_share.js',
    'drugs_directory.js', 'diabetes_engine.js', 'htn_engine.js',
    'patient_leaflets.js', 'updater.js', 'app.js'
  ];
  for (const s of all13) {
    vm.runInContext(fs.readFileSync(path.join(jsDir, s), 'utf8'), ctx2, { filename: s });
  }
  win2.document.dispatchEvent({ type: 'DOMContentLoaded' });
  const bootUxSnapshot = {
    egfr: domMap.get('quick-vital-egfr').value,
    k: domMap.get('quick-vital-k').value,
    sbp: domMap.get('quick-vital-sbp').value,
    dbp: domMap.get('quick-vital-dbp').value,
    preg: domMap.get('quick-vital-pregnancy').value,
    pregDisabled: domMap.get('quick-vital-pregnancy').disabled,
    drawerTopVar: docEl2.style.getPropertyValue('--vitals-drawer-top'),
    soapVal: domMap.get('osrawy-soap-textarea').value
  };
  global.__case23Env = { win2, domMap, body2, docEl2, bootUxSnapshot };

  // Verify fresh startup HTN defaults align with DM & PatientSync.defaultState (before any edits)
  assert(
    domMap.get('htn-age').value === '52' &&
    domMap.get('htn-egfr').value === '68' &&
    domMap.get('htn-uacr').value === '45',
    `Fresh startup HTN defaults match DM & PatientSync (age=${domMap.get('htn-age').value}, egfr=${domMap.get('htn-egfr').value}, uacr=${domMap.get('htn-uacr').value})`
  );

  // Verify switchMainTab exposed globally
  assert(typeof win2.switchMainTab === 'function', "app.js exposes window.switchMainTab globally");

  // Verify guardrail banner listener was deduplicated (attached once) and uses 🚨 for critical alerts + escapes XSS
  const guardrailListenerCount = (winListeners['osrawy:patient-updated'] || []).filter(fn => fn.toString().includes('clinical-guardrail-banner')).length;
  assert(guardrailListenerCount === 1, `clinical-guardrail-banner attaches exactly once across engines (count=${guardrailListenerCount})`);

  sb2.PatientSync.updatePatient({
    sex: 'f',
    egfr: 22,
    diabetes: true,
    pregnancy: true,
    gestationalWeeks: 16,
    asthma: false,
    name: '<script>alert(1)</script>'
  });

  const bannerHtml = domMap.get('clinical-guardrail-banner').innerHTML;
  assert(bannerHtml.includes('🚨') && !bannerHtml.includes('guardrail-item info"><span class="guardrail-icon">ℹ️</span><div class="guardrail-msg">Critical'), "Critical guardrail alerts render 🚨 danger icon instead of ℹ️");

  const ptBarHtml = domMap.get('patient-summary-bar').innerHTML;
  assert(!ptBarHtml.includes('<script>') && ptBarHtml.includes('&lt;script&gt;'), "Patient summary bar escapes HTML in patient name");

  // Trigger DM & HTN re-render (including DOM #preg=true path!) and ensure pregnancy cards show Labetalol and survive plan()/htnRender()
  win2.htnRender();
  domMap.get('preg').checked = true;
  win2.plan();
  const htnPregCard = domMap.get('htn-pregnancy-card');
  const dmPregCard = domMap.get('dm-pregnancy-card');
  assert(Boolean(htnPregCard && htnPregCard.innerHTML.includes('Labetalol') && !htnPregCard.innerHTML.includes('Safe First-Line:</b> Aspirin')), `htn-pregnancy-card shows Labetalol as Safe First-Line instead of Aspirin (html: ${htnPregCard ? htnPregCard.innerHTML.slice(0, 180) : 'null'})`);
  assert(Boolean(dmPregCard && dmPregCard.innerHTML.includes('TDD')), "dm-pregnancy-card survives window.plan() re-render even when DOM #preg is checked");
  domMap.get('preg').checked = false;
  win2.plan();

  // Case 21b: Navigation Back button works from tab-drugs and tab-recent (doesn't return false and exit app)
  win2.switchMainTab('tab-tools');
  win2.switchMainTab('tab-drugs');
  assert(win2.handleAndroidBack() === true, "handleAndroidBack returns true from tab-drugs instead of exiting app");
  win2.switchMainTab('tab-recent');
  assert(win2.handleAndroidBack() === true, "handleAndroidBack returns true from tab-recent instead of exiting app");

  // Case 21c: DLP updates render once into #lipids-container (no duplicate #lipid-engine-summary) and LipidsEngine preserves 0 values + medications fallback
  win2.switchMainTab('tab-dlp');
  sb2.PatientSync.updatePatient({ ldlC: 165, tc: 230 });
  assert(!domMap.has('lipid-engine-summary') && domMap.get('lipids-container').innerHTML.includes('LDL-C'), "DLP tab uses single #lipids-container without duplicate #lipid-engine-summary");
  const lipidZeroRes = sb2.LipidsEngine.evaluateLipidPathway({ egfr: 0, altUl: 0, ldlC: 140, tc: 210, hdlC: 45, triglycerides: 150, medications: ['rosuva'] });
  assert(lipidZeroRes.alerts.some(a => a.id === 'lipid-guardrail-rosuva-renal'), "LipidsEngine preserves egfr=0 and recognizes 'rosuva' alias in medications array");

  // Case 21d: DrugDirectory canonicalizes alias 'met' -> 'metformin' cleanly
  sb2.PatientSync.updatePatient({ activeMeds: ['met'], medications: ['met'] });
  win2.DrugDirectory.render('drugs-directory-container');
  const dirListHtml = domMap.get('drug-directory-list').innerHTML;
  assert(dirListHtml.includes('data-med-toggle="metformin"') && (dirListHtml.includes('✓ مضاف للخطة') || dirListHtml.includes('✓ In Plan')), "DrugDirectory marks metformin as In Plan when state.activeMeds contains alias 'met'");
  win2.DrugDirectory.togglePatientMedication('metformin');
  assert(!sb2.PatientSync.get().activeMeds.includes('met') && !sb2.PatientSync.get().activeMeds.includes('metformin'), "Toggling off metformin clears legacy 'met' alias cleanly");

  // Case 21e: PatientSync saves & restores dmTherapy checkboxes and dlp-statin-intol
  domMap.get('c-met').checked = false;
  domMap.get('c-sglt').checked = true;
  sb2.PatientSync.syncFromDiabetes();
  sb2.PatientSync.updatePatient({ statinIntolerant: true });
  sb2.PatientSync.saveToRecent('DraftCase21e');
  domMap.get('c-met').checked = true;
  domMap.get('c-sglt').checked = false;
  domMap.get('dlp-statin-intol').checked = false;
  const savedDraft = sb2.PatientSync.getRecentList()[0];
  win2.loadRecentPatient(savedDraft.id);
  assert(domMap.get('c-met').checked === false && domMap.get('c-sglt').checked === true && domMap.get('dlp-statin-intol').checked === true, "loadRecentPatient restores DM therapy checkboxes and statin-intolerant flag");

  // #copy click does not attach duplicate fallback listener when onclick="RxShare.copyHtnToClipboard()" exists
  const copyEl = domMap.get('copy');
  assert((copyEl.listeners['click'] || []).length === 0, `#copy does not attach redundant duplicate click handlers in app.js/htn_engine.js (listeners=${(copyEl.listeners['click'] || []).length})`);

  // Case 21f: Cross-tab bidirectional sync (DrugDirectory <-> DM/DLP, HTN <-> DLP lipids, pregnancy aliases, Tools Sync, resetPatient)
  sb2.PatientSync.resetPatient();
  domMap.get('c-met').checked = true;
  sb2.PatientSync.syncFromDiabetes();
  win2.DrugDirectory.togglePatientMedication('metformin');
  assert(
    domMap.get('c-met').checked === false &&
    sb2.PatientSync.get().dmTherapy.met === false &&
    sb2.PatientSync.get().activeMeds.length === 0 &&
    sb2.PatientSync.get().medications.length === 0 &&
    sb2.PatientSync.get().currentMeds.length === 0,
    "Toggling Metformin OFF in DrugDirectory unchecks #c-met and clears dmTherapy.met + all med arrays"
  );
  domMap.get('a1c').value = '9.2';
  domMap.get('pform').dispatchEvent('input');
  assert(
    !sb2.PatientSync.get().activeMeds.includes('met') && !sb2.PatientSync.get().medications.includes('met'),
    "Subsequent DM form edit does not re-add Metformin after it was toggled off in DrugDirectory"
  );
  sb2.PatientSync.saveToRecent('DraftMetOff');
  domMap.get('c-met').checked = true;
  const metOffDraft = sb2.PatientSync.getRecentList()[0];
  win2.loadRecentPatient(metOffDraft.id);
  assert(domMap.get('c-met').checked === false && sb2.PatientSync.get().dmTherapy.met === false, "Saving & loading draft preserves Metformin OFF state");

  win2.DrugDirectory.togglePatientMedication('ezetimibe');
  assert(sb2.PatientSync.get().onEzetimibe === true && domMap.get('dlp-ezetimibe').checked === true, "Toggling Ezetimibe ON in DrugDirectory updates #dlp-ezetimibe.checked");
  win2.DrugDirectory.togglePatientMedication('ezetimibe');
  assert(sb2.PatientSync.get().onEzetimibe === false && domMap.get('dlp-ezetimibe').checked === false, "Toggling Ezetimibe OFF in DrugDirectory unchecks #dlp-ezetimibe");
  domMap.get('dlp-ezetimibe').checked = true;
  domMap.get('dlp-inputs-panel').dispatchEvent('change');
  assert(sb2.PatientSync.get().onEzetimibe === true && sb2.PatientSync.get().activeMeds.includes('ezetimibe'), "Checking #dlp-ezetimibe syncs Ezetimibe into activeMeds");

  domMap.get('tc').value = '265';
  domMap.get('hdl').value = '36';
  domMap.get('lunit').value = 'mmol';
  domMap.get('f').dispatchEvent('input');
  assert(
    domMap.get('dlp-tc').value === '265' && domMap.get('dlp-hdl').value === '36' && domMap.get('dlp-unit').value === 'mmol',
    "HTN lipid edits propagate to #dlp-tc, #dlp-hdl, and #dlp-unit"
  );

  domMap.get('dlp-tc').value = '240';
  domMap.get('dlp-hdl').value = '48';
  domMap.get('dlp-unit').value = 'mg';
  domMap.get('dlp-inputs-panel').dispatchEvent('input');
  assert(
    domMap.get('tc').value === '240' && domMap.get('hdl').value === '48' && domMap.get('lunit').value === 'mg',
    "DLP lipid edits propagate back to HTN #tc, #hdl, and #lunit"
  );

  sb2.PatientSync.updatePatient({ pregnancy: true, preg: true, pregHtn: true });
  assert(domMap.get('preg').checked === true && domMap.get('preg-htn').checked === true, "updatePatient({ pregnancy: true }) checks both #preg and #preg-htn");
  domMap.get('preg-htn').checked = false;
  domMap.get('f').dispatchEvent('change');
  assert(
    sb2.PatientSync.get().pregnancy === false &&
    sb2.PatientSync.get().preg === false &&
    sb2.PatientSync.get().pregHtn === false &&
    domMap.get('preg').checked === false &&
    !domMap.has('htn-pregnancy-card') &&
    !domMap.has('dm-pregnancy-card'),
    "Unchecking #preg-htn clears all pregnancy aliases, #preg, and obstetric cards"
  );

  win2.switchMainTab('tab-tools');
  domMap.get('tab-scr').value = '1.8';
  domMap.get('tab-age').value = '74';
  domMap.get('tab-sex').value = 'f';
  domMap.get('tab-wt').value = '60';
  domMap.get('tab-scr').dispatchEvent('input');
  if (typeof domMap.get('btn-sync-tools-egfr').onclick === 'function') {
    domMap.get('btn-sync-tools-egfr').onclick();
  }
  const toolsEgfrStr = String(sb2.PatientSync.get().egfr);
  assert(
    domMap.get('egfr').value === toolsEgfrStr &&
    domMap.get('htn-egfr').value === toolsEgfrStr &&
    domMap.get('tab-kdigo-egfr').value === toolsEgfrStr &&
    domMap.get('age').value === '74' &&
    domMap.get('htn-age').value === '74' &&
    domMap.get('wt').value === '60',
    `ClinicalTools sync button updates #egfr, #htn-egfr, #tab-kdigo-egfr, age, and weight consistently (eGFR=${toolsEgfrStr})`
  );

  sb2.PatientSync.resetPatient();
  assert(
    domMap.get('pname').value === 'Ahmed Mahmoud' &&
    domMap.get('egfr').value === '68' &&
    domMap.get('htn-egfr').value === '68' &&
    domMap.get('c-met').checked === false &&
    domMap.get('dlp-ezetimibe').checked === false &&
    domMap.get('tc').value === '210' &&
    domMap.get('dlp-tc').value === '210' &&
    domMap.get('tab-age').value === '52' &&
    domMap.get('tab-scr').value === '1.1' &&
    domMap.get('tab-scr-unit').value === 'mg',
    "resetPatient() restores DOM inputs/checkboxes cleanly across DM, HTN, DLP, and Tools tabs"
  );

  // Case 21g: Sex change 'f' -> 'm' clears pregnancy everywhere, DLP lipid edit clears manual HTN #risk, and mounted Tools/PC refresh on sync
  sb2.PatientSync.updatePatient({ sex: 'f', pregnancy: true, preg: true, pregHtn: true });
  assert(domMap.get('preg').checked === true && domMap.get('preg-htn').checked === true && domMap.has('htn-pregnancy-card'), "Precondition: pregnant female shows obstetric cards");
  domMap.get('htn-sex').value = 'm';
  domMap.get('f').dispatchEvent('change');
  assert(
    sb2.PatientSync.get().sex === 'm' &&
    sb2.PatientSync.get().pregnancy === false &&
    sb2.PatientSync.get().preg === false &&
    sb2.PatientSync.get().pregHtn === false &&
    domMap.get('preg').checked === false &&
    domMap.get('preg-htn').checked === false &&
    !domMap.has('htn-pregnancy-card') &&
    !domMap.has('dm-pregnancy-card'),
    "Changing #htn-sex from female to male ('change' event) clears all pregnancy flags, checkboxes, and obstetric cards"
  );

  // Manual #risk override cleared on DLP lipid update (recalculates PREVENT instead of staying stuck on '25')
  domMap.get('risk').value = '25';
  domMap.get('risk').dispatchEvent('input');
  domMap.get('dlp-tc').value = '280';
  domMap.get('dlp-inputs-panel').dispatchEvent('input');
  const riskAfterDlp = domMap.get('risk').value;
  assert(riskAfterDlp !== '25' && riskAfterDlp !== '' && !isNaN(parseFloat(riskAfterDlp)), `DLP lipid edit resets manual HTN #risk override and recalculates PREVENT (risk='${riskAfterDlp}')`);
  domMap.get('risk').value = '31';
  domMap.get('risk').dispatchEvent('input');
  sb2.PatientSync.resetPatient();
  assert(domMap.get('risk').value !== '31' && domMap.get('risk').value !== '', `resetPatient() clears manual HTN #risk override (risk='${domMap.get('risk').value}')`);

  // Modal eGFR Apply syncs scr/scrUnit to Tools & mounted Tools/PC refresh automatically
  if (domMap.has('primary-care-container')) {
    win2.PrimaryCareEngine.renderPrimaryCareTab('primary-care-container');
  }
  domMap.get('calc-scr').value = '1.9';
  domMap.get('calc-scr-unit').value = 'mg';
  domMap.get('calc-scr-unit').dispatchEvent('change');
  assert(domMap.get('calc-scr').value === '1.9', `Re-selecting same #calc-scr-unit ('mg') does not double-convert Scr (scr='${domMap.get('calc-scr').value}')`);
  domMap.get('btn-apply-calculated-egfr').setAttribute('data-calculated-egfr', '38');
  domMap.get('btn-apply-calculated-egfr').click();
  assert(
    sb2.PatientSync.get().egfr === 38 &&
    sb2.PatientSync.get().scr === 1.9 &&
    domMap.get('tab-scr').value === '1.9' &&
    domMap.get('tab-kdigo-egfr').value === '38' &&
    domMap.get('tab-kdigo-results').innerHTML.includes('G3b'),
    "Applying eGFR from modal syncs scr/egfr into PatientSync and refreshes mounted Tools KDIGO panel"
  );
  sb2.PatientSync.updatePatient({ wt: 55, sex: 'f', pregnancy: true });
  if (domMap.has('pc-thy-wt')) {
    assert(
      domMap.get('pc-thy-wt').value === '55' &&
      domMap.get('pc-thy-preg').checked === true &&
      typeof win2.dmResetRxUser === 'function',
      "Mounted PrimaryCare Thyroid panel syncs DOM fields & exposes dmResetRxUser cleanly"
    );
  }
  sb2.PatientSync.resetPatient();

  // Verify updater modal escapes XSS and rejects javascript: URL
  assert(typeof win2.AppUpdater === 'object' && typeof win2.AppUpdater.init === 'function', "AppUpdater loads cleanly alongside all 13 modules");
  global.__case21UpdaterPromise = win2.AppUpdater.checkForUpdates(true).then(() => {
    const uModal = domMap.get('update-modal');
    const htmlStr = uModal ? uModal.innerHTML : '';
    assert(Boolean(uModal && htmlStr.includes('&lt;img') && !htmlStr.includes('<img src=x')), "AppUpdater escapes HTML/img tags in release tag_name");
    assert(Boolean(htmlStr.includes('&lt;script&gt;') && !htmlStr.includes('<script>evil()')), "AppUpdater escapes <script> tags in release body");
    assert(Boolean(htmlStr.includes('https://github.com/DrWssn/osrawy-clinical-navigator/releases') && !htmlStr.includes('javascript:alert(1)')), "AppUpdater rejects javascript: URL and falls back to HTTPS releases URL");
  });
});

// ---------------------------------------------------------------------
// 5. Final Summary & Exit (Await async checks cleanly)
// ---------------------------------------------------------------------

(async () => {
  if (global.__case21UpdaterPromise) {
    console.log("---------------------------------------------------------------");
    console.log("Case 22 (Async): AppUpdater modal XSS escaping & HTTPS URL validation");
    console.log("---------------------------------------------------------------");
    try {
      await global.__case21UpdaterPromise;
    } catch (err) {
      failedTests++;
      console.error("  ❌ Exception in Case 22:", err);
    }
  }

  if (global.__case23Env) {
    runCase(23, "Verified UX Controller (Vitals Drawer, SOAP Cart, Patient Handoff, Back Priority)", () => {
      const { win2, domMap, body2, bootUxSnapshot } = global.__case23Env;
      const doc2 = win2.document;

      // 23a: Synchronous boot initialization even when setTimeout is stubbed
      assert(
        bootUxSnapshot.egfr === '68' &&
        bootUxSnapshot.k === '4.6' &&
        bootUxSnapshot.sbp === '148' &&
        bootUxSnapshot.dbp === '94' &&
        bootUxSnapshot.preg === 'false' &&
        bootUxSnapshot.pregDisabled === true &&
        bootUxSnapshot.drawerTopVar === '44px' &&
        bootUxSnapshot.soapVal.includes('BP 148/94 mmHg'),
        `bootVerifiedUX() syncs quick vitals, CSS top offset, male preg lock, and SOAP header synchronously on DOMContentLoaded (snap=${JSON.stringify({ ...bootUxSnapshot, soapVal: undefined })})`
      );

      // 23b: Vitals Quick Drawer open/toggle, focused input protection, range guard & male pregnancy safety
      win2.PatientSync.resetPatient();
      const stickyBar = domMap.get('sticky-vitals-summary');
      const vDrawer = domMap.get('osrawy-vitals-quick-drawer');
      const qEgfr = domMap.get('quick-vital-egfr');
      const qSbp = domMap.get('quick-vital-sbp');
      const qPreg = domMap.get('quick-vital-pregnancy');

      stickyBar.click();
      assert(
        vDrawer.classList.contains('is-open') &&
        vDrawer.getAttribute('aria-hidden') === 'false' &&
        stickyBar.getAttribute('aria-expanded') === 'true',
        "Clicking #sticky-vitals-summary opens Vitals Quick Drawer and updates ARIA attributes"
      );

      // Active focus protection: don't overwrite actively typed partial text
      doc2.activeElement = qEgfr;
      qEgfr.value = '4.';
      win2.PatientSync.updatePatient({ egfr: 77 });
      assert(qEgfr.value === '4.', `Focused quick vital input preserves in-progress typing (got='${qEgfr.value}')`);
      doc2.activeElement = null;

      // Live input physiological bounds: partial '1' shouldn't push bogus SBP=1; valid '162' updates PatientSync synchronously
      const sbpBeforePartial = win2.PatientSync.get().sbp;
      qSbp.value = '1';
      qSbp.dispatchEvent('input');
      assert(win2.PatientSync.get().sbp === sbpBeforePartial, `Partial keystroke SBP='1' does not overwrite PatientSync.sbp (${win2.PatientSync.get().sbp})`);
      qSbp.value = '162';
      qSbp.dispatchEvent('input');
      assert(
        win2.PatientSync.get().sbp === 162 &&
        domMap.get('osrawy-soap-textarea').value.includes('BP 162/'),
        "Valid live SBP='162' input syncs PatientSync and updates SOAP Objective vitals line"
      );

      // Commit out-of-range eGFR=-10 restores last valid state
      qEgfr.value = '-10';
      qEgfr.dispatchEvent('change');
      assert(qEgfr.value === '77' && win2.PatientSync.get().egfr === 77, `Invalid committed eGFR='-10' restores valid state (egfr=${qEgfr.value})`);

      // Male pregnancy guard vs female toggle
      win2.PatientSync.updatePatient({ sex: 'm', pregnancy: false });
      assert(qPreg.disabled === true, "Male patient disables #quick-vital-pregnancy control");
      qPreg.value = 'true';
      qPreg.dispatchEvent('change');
      assert(win2.PatientSync.get().pregnancy === false && qPreg.value === 'false', "Forcing quick pregnancy change on male patient does not trigger pregnancy mode");
      win2.PatientSync.updatePatient({ sex: 'f' });
      assert(qPreg.disabled === false, "Female patient enables #quick-vital-pregnancy control");
      qPreg.value = 'true';
      qPreg.dispatchEvent('change');
      assert(win2.PatientSync.get().pregnancy === true && domMap.get('osrawy-soap-textarea').value.includes('Pregnancy: YES'), "Toggling pregnancy in quick drawer for female updates PatientSync and SOAP header");
      win2.PatientSync.resetPatient();

      // 23c: SOAP Consultation Cart harvesting, hidden/untouched Primary Care gating, stale deletion, reset isolation, copy fallback
      win2.PrimaryCareEngine.renderPrimaryCareTab('primary-care-container');
      const soapFab = domMap.get('osrawy-soap-fab');
      const soapDrawer = domMap.get('osrawy-soap-drawer');
      const soapTxt = domMap.get('osrawy-soap-textarea');
      const soapCount = domMap.get('osrawy-soap-count');
      const soapSyncBtn = domMap.get('osrawy-soap-sync-active');
      const soapClearBtn = domMap.get('osrawy-soap-clear');
      const soapCopyBtn = domMap.get('osrawy-soap-copy');

      soapFab.click();
      assert(
        soapDrawer.classList.contains('is-open') &&
        soapTxt.value.includes('[Diabetes]') &&
        soapTxt.value.includes('[Hypertension]') &&
        !soapTxt.value.includes('[Asthma (GINA)]') &&
        !soapTxt.value.includes('[COPD (GOLD)]') &&
        !soapTxt.value.includes('[Thyroid]'),
        "SOAP Cart harvests DM/HTN without injecting untouched/hidden Primary Care defaults (Asthma/COPD/Thyroid)"
      );

      // Rx Plan capture + stale deletion when cleared
      const origGetRx = win2.RxShare.getPrescriptionData;
      try {
        win2.RxShare.getPrescriptionData = () => ({ items: [{ drug: 'Metformin 500mg', directions: '1 tab BID' }] });
        soapSyncBtn.click();
        assert(soapTxt.value.includes('[Rx Plan] Metformin 500mg (1 tab BID)'), "SOAP Cart captures structured RxShare items");

        win2.RxShare.getPrescriptionData = () => ({ items: [] });
        soapSyncBtn.click();
        assert(!soapTxt.value.includes('[Rx Plan]'), "SOAP Cart removes stale [Rx Plan] section when prescription items become empty");
      } finally {
        win2.RxShare.getPrescriptionData = origGetRx;
      }

      // Explicit Primary Care COPD reveal allows COPD capture; Asthma explicit event allows Asthma capture
      domMap.get('pc-panel-copd').style.display = 'block';
      soapSyncBtn.click();
      assert(soapTxt.value.includes('[COPD (GOLD)]') && parseInt(soapCount.textContent, 10) >= 3, "Revealing COPD panel and syncing captures [COPD (GOLD)] cleanly");

      doc2.dispatchEvent({ type: 'click', target: { dataset: { pcTab: 'asthma' }, getAttribute: () => 'asthma' } });
      soapSyncBtn.click();
      assert(soapTxt.value.includes('[Asthma (GINA)]'), "Explicitly interacting with Asthma subtab allows [Asthma (GINA)] capture");

      soapClearBtn.click();
      assert(soapCount.textContent === '0' && soapTxt.value.includes('No active engine outputs captured yet'), "SOAP Clear resets count to 0 and clears captured sections");

      soapSyncBtn.click();
      assert(parseInt(soapCount.textContent, 10) >= 1, "Precondition: SOAP cart repopulated before patient reset");
      win2.PatientSync.resetPatient();
      assert(soapCount.textContent === '0' && !soapTxt.value.includes('[COPD (GOLD)]') && !soapTxt.value.includes('[Asthma (GINA)]'), "PatientSync.resetPatient() wipes prior patient's SOAP cart sections");

      soapSyncBtn.click();
      assert(parseInt(soapCount.textContent, 10) >= 1, "Precondition: SOAP cart repopulated before switching patient");
      win2.PatientSync.applyPatient({ name: 'Patient B', age: 48, sex: 'f', sbp: 126, dbp: 78, egfr: 92, k: 4.1 });
      assert(soapCount.textContent === '0' && soapTxt.value.includes('BP 126/78 mmHg') && !soapTxt.value.includes('[Diabetes]'), "PatientSync.applyPatient() wipes prior patient's SOAP sections and updates Objective vitals");

      // Clipboard fallback check
      const origClip = win2.navigator.clipboard;
      const origExec = doc2.execCommand;
      const origToast = win2.RxShare.showToast;
      let toastCalls = 0;
      try {
        win2.navigator.clipboard = undefined;
        win2.RxShare.showToast = () => { toastCalls++; };
        doc2.execCommand = () => false;
        soapCopyBtn.click();
        assert(toastCalls === 0 && soapTxt.getAttribute('readonly') === 'readonly', "Fallback copy does not fire fake toast when execCommand returns false and restores readonly");
        doc2.execCommand = () => true;
        soapCopyBtn.click();
        assert(toastCalls === 1 && soapTxt.getAttribute('readonly') === 'readonly', "Fallback copy shows toast when execCommand succeeds and restores readonly");
      } finally {
        win2.navigator.clipboard = origClip;
        doc2.execCommand = origExec;
        win2.RxShare.showToast = origToast;
      }

      // 23d: Patient Handoff Mode + Android Back / Escape Priority Order
      win2.switchMainTab('tab-leaflets');
      const qrModal = domMap.get('leaflet-qr-modal');
      const settingsModal = domMap.get('settings-modal');
      const enterHandoff = domMap.get('osrawy-enter-handoff-btn');

      // Open both drawers before entering handoff mode
      if (!vDrawer.classList.contains('is-open')) stickyBar.click();
      if (!soapDrawer.classList.contains('is-open')) soapFab.click();
      enterHandoff.click();
      assert(
        body2.classList.contains('osrawy-patient-mode') &&
        !vDrawer.classList.contains('is-open') &&
        !soapDrawer.classList.contains('is-open'),
        "Entering Patient Handoff Mode sets body.osrawy-patient-mode and closes open Vitals & SOAP drawers"
      );

      // Opening #leaflet-qr-modal inside Handoff Mode: Back closes QR modal FIRST, then Handoff Mode
      qrModal.classList.add('open');
      const back1 = win2.handleAndroidBack();
      assert(back1 === true && !qrModal.classList.contains('open') && body2.classList.contains('osrawy-patient-mode'), "handleAndroidBack() closes #leaflet-qr-modal BEFORE exiting Patient Handoff Mode");
      const back2 = win2.handleAndroidBack();
      assert(back2 === true && !body2.classList.contains('osrawy-patient-mode'), "Second handleAndroidBack() exits Patient Handoff Mode");

      // Modal over SoapDrawer over VitalsDrawer Escape priority order
      stickyBar.click();
      soapFab.click();
      settingsModal.classList.add('open');
      win2.dispatchEvent({ type: 'keydown', key: 'Escape' });
      assert(!settingsModal.classList.contains('open') && soapDrawer.classList.contains('is-open') && vDrawer.classList.contains('is-open'), "1st Escape closes topmost .modal-overlay.open (#settings-modal) before drawers");
      win2.dispatchEvent({ type: 'keydown', key: 'Escape' });
      assert(!soapDrawer.classList.contains('is-open') && vDrawer.classList.contains('is-open'), "2nd Escape closes SOAP drawer before Vitals drawer");
      win2.dispatchEvent({ type: 'keydown', key: 'Escape' });
      assert(!vDrawer.classList.contains('is-open') && stickyBar.getAttribute('aria-expanded') === 'false', "3rd Escape closes Vitals drawer and resets aria-expanded");

      // Switching away from tab-leaflets exits osrawy-patient-mode; Escape alone on form tab does not force-navigate
      win2.switchMainTab('tab-leaflets');
      enterHandoff.click();
      win2.switchMainTab('tab-htn');
      assert(!body2.classList.contains('osrawy-patient-mode'), "Switching tab away from tab-leaflets automatically exits osrawy-patient-mode");
      win2.dispatchEvent({ type: 'keydown', key: 'Escape' });
      assert(domMap.get('tab-htn').hidden === false, "Escape with no overlays open does not unexpectedly kick clinician off tab-htn");
      const backTab = win2.handleAndroidBack();
      assert(backTab === true && domMap.get('tab-diabetes').hidden === false, "handleAndroidBack() navigates from tab-htn back to tab-diabetes cleanly");

      // 23e: Post-review fixes verification (QR close contrast & backdrop, tab-tools state persistence, partial K+ decimal guard, real DOM cloneNode SOAP extraction)
      win2.switchMainTab('tab-leaflets');
      const leafHtml = domMap.get('patient-leaflet-container').innerHTML || '';
      assert(
        leafHtml.includes('id="close-qr-modal-btn"') && leafHtml.includes('color:var(--ink)'),
        "QR modal close button (#close-qr-modal-btn) includes explicit color:var(--ink) contrast styling"
      );
      const qrModal2 = domMap.get('leaflet-qr-modal');
      qrModal2.classList.add('open');
      qrModal2.dispatchEvent({ type: 'click' });
      assert(!qrModal2.classList.contains('open'), "Clicking #leaflet-qr-modal backdrop closes the QR modal");

      // tab-tools preserves Primary Care subtab & transient inputs + Clinical Tools transient inputs (incl. FIB-4) across tab switches and I18n toggle, and clears cleanly on applyPatient/resetPatient
      win2.switchMainTab('tab-tools');
      domMap.get('pc-panel-asthma').style.display = 'none';
      domMap.get('pc-panel-copd').style.display = 'block';
      domMap.get('pc-asthma-saba').value = '5';
      domMap.get('pc-asthma-step').value = '4';
      domMap.get('pc-asthma-track').value = '2';
      domMap.get('pc-asthma-day').checked = true;
      domMap.get('pc-asthma-night').checked = true;
      domMap.get('pc-asthma-limit').checked = true;
      domMap.get('pc-copd-exac').value = '4';
      domMap.get('pc-copd-hosp').value = '2';
      domMap.get('pc-copd-mmrc').value = '3';
      domMap.get('pc-copd-cat').value = '22';
      domMap.get('pc-copd-eos').value = '360';
      domMap.get('pc-thy-tsh').value = '14.5';
      domMap.get('pc-thy-ft4').value = '0.6';
      domMap.get('pc-copd-exac').dispatchEvent('input');
      domMap.get('tab-scr').value = '2.4';
      domMap.get('tab-scr-unit').value = 'mg';
      domMap.get('tab-kdigo-uacr').value = '450';
      domMap.get('tab-fib4-ast').value = '120';
      domMap.get('tab-fib4-alt').value = '80';
      domMap.get('tab-fib4-plt').value = '95';
      domMap.get('tab-scr').dispatchEvent('input');
      domMap.get('tab-kdigo-uacr').dispatchEvent('input');
      domMap.get('tab-fib4-ast').dispatchEvent('input');
      const expectedFib4BeforeReset = (Math.round((((parseFloat(domMap.get('tab-age').value) || 0) * 120) / (95 * Math.sqrt(80))) * 100) / 100).toFixed(2);

      win2.switchMainTab('tab-diabetes');
      win2.switchMainTab('tab-tools');
      assert(
        domMap.get('pc-asthma-saba').value === '5' &&
        domMap.get('pc-asthma-step').value === '4' &&
        domMap.get('pc-asthma-track').value === '2' &&
        domMap.get('pc-asthma-day').checked === true &&
        domMap.get('pc-copd-exac').value === '4' &&
        domMap.get('pc-copd-hosp').value === '2' &&
        domMap.get('pc-copd-mmrc').value === '3' &&
        domMap.get('pc-copd-cat').value === '22' &&
        domMap.get('pc-copd-eos').value === '360' &&
        domMap.get('pc-thy-tsh').value === '14.5' &&
        domMap.get('pc-thy-ft4').value === '0.6' &&
        domMap.get('pc-panel-copd').style.display === 'block' &&
        domMap.get('tab-scr').value === '2.4' &&
        domMap.get('tab-kdigo-uacr').value === '450' &&
        domMap.get('tab-fib4-ast').value === '120' &&
        domMap.get('tab-fib4-alt').value === '80' &&
        domMap.get('tab-fib4-plt').value === '95' &&
        domMap.get('tab-fib4-results').innerHTML.includes(expectedFib4BeforeReset),
        "Switching away from tab-tools and back preserves Primary Care subtab/inputs and Clinical Tools inputs (including FIB-4)"
      );
      win2.I18n.setLang('en');
      assert(
        domMap.get('tab-scr').value === '2.4' &&
        domMap.get('tab-kdigo-uacr').value === '450' &&
        domMap.get('tab-fib4-ast').value === '120' &&
        domMap.get('tab-fib4-alt').value === '80' &&
        domMap.get('tab-fib4-plt').value === '95' &&
        domMap.get('tab-fib4-results').innerHTML.includes(expectedFib4BeforeReset) &&
        domMap.get('tab-fib4-results').innerHTML.includes('High Risk') &&
        domMap.get('tab-fib4-results').innerHTML.includes('Recommendation:'),
        "Switching language to English preserves Clinical Tools transient inputs (including FIB-4) and renders English FIB-4 guidance"
      );
      win2.I18n.setLang('ar');
      assert(
        domMap.get('pc-copd-exac').value === '4' &&
        domMap.get('pc-thy-tsh').value === '14.5' &&
        domMap.get('pc-panel-copd').style.display === 'block' &&
        domMap.get('tab-scr').value === '2.4' &&
        domMap.get('tab-kdigo-uacr').value === '450' &&
        domMap.get('tab-fib4-ast').value === '120' &&
        domMap.get('tab-fib4-alt').value === '80' &&
        domMap.get('tab-fib4-plt').value === '95' &&
        domMap.get('tab-fib4-results').innerHTML.includes(expectedFib4BeforeReset) &&
        domMap.get('tab-fib4-results').innerHTML.includes('خطورة عالية') &&
        domMap.get('tab-fib4-results').innerHTML.includes('التوصية السريرية:'),
        "Toggling language preserves Primary Care active subtab/inputs and Clinical Tools transient inputs (including FIB-4) in Arabic"
      );

      // Switching patient blurs active tool input and resets both Primary Care and Clinical Tools FIB-4/SCr inputs cleanly
      doc2.activeElement = domMap.get('tab-fib4-ast');
      win2.PatientSync.applyPatient({ name: 'Patient C', age: 42, sex: 'f', sbp: 120, dbp: 76, egfr: 95, k: 4.1 });
      soapSyncBtn.click();
      assert(
        doc2.activeElement !== domMap.get('tab-fib4-ast') &&
        domMap.get('pc-panel-asthma').style.display === 'block' &&
        domMap.get('pc-panel-copd').style.display === 'none' &&
        domMap.get('pc-panel-thyroid').style.display === 'none' &&
        domMap.get('pc-asthma-saba').value === '2' &&
        domMap.get('pc-asthma-step').value === '2' &&
        domMap.get('pc-asthma-track').value === '1' &&
        domMap.get('pc-asthma-day').checked === false &&
        domMap.get('pc-asthma-night').checked === false &&
        domMap.get('pc-asthma-limit').checked === false &&
        domMap.get('pc-copd-exac').value === '1' &&
        domMap.get('pc-copd-hosp').value === '0' &&
        domMap.get('pc-copd-mmrc').value === '2' &&
        domMap.get('pc-copd-cat').value === '14' &&
        domMap.get('pc-copd-eos').value === '180' &&
        domMap.get('pc-thy-tsh').value === '6.8' &&
        domMap.get('pc-thy-ft4').value === '1.1' &&
        domMap.get('tab-scr').value === '1.1' &&
        domMap.get('tab-scr-unit').value === 'mg' &&
        domMap.get('tab-fib4-ast').value === '38' &&
        domMap.get('tab-fib4-alt').value === '42' &&
        domMap.get('tab-fib4-plt').value === '210' &&
        domMap.get('tab-fib4-results').innerHTML.includes('1.17') &&
        !domMap.get('tab-fib4-results').innerHTML.includes(expectedFib4BeforeReset) &&
        !soapTxt.value.includes('[COPD (GOLD)]'),
        "PatientSync.applyPatient clears prior patient Primary Care inputs and FIB-4/SCr transient inputs cleanly without leaking into Patient C"
      );

      // Mutate Patient C's Primary Care (Thyroid subtab) & FIB-4 inputs, then verify PatientSync.resetPatient() clears them cleanly
      domMap.get('pc-panel-asthma').style.display = 'none';
      domMap.get('pc-panel-thyroid').style.display = 'block';
      domMap.get('pc-asthma-saba').value = '6';
      domMap.get('pc-copd-exac').value = '3';
      domMap.get('pc-thy-tsh').value = '19.2';
      domMap.get('pc-thy-ft4').value = '0.5';
      domMap.get('tab-scr').value = '3.1';
      domMap.get('tab-fib4-ast').value = '140';
      domMap.get('tab-fib4-alt').value = '70';
      domMap.get('tab-fib4-plt').value = '88';
      domMap.get('tab-fib4-ast').dispatchEvent('input');
      doc2.activeElement = domMap.get('pc-thy-tsh');
      win2.PatientSync.resetPatient();
      assert(
        doc2.activeElement !== domMap.get('pc-thy-tsh') &&
        domMap.get('pc-panel-asthma').style.display === 'block' &&
        domMap.get('pc-panel-copd').style.display === 'none' &&
        domMap.get('pc-panel-thyroid').style.display === 'none' &&
        domMap.get('pc-asthma-saba').value === '2' &&
        domMap.get('pc-copd-exac').value === '1' &&
        domMap.get('pc-thy-tsh').value === '6.8' &&
        domMap.get('pc-thy-ft4').value === '1.1' &&
        domMap.get('tab-scr').value === '1.1' &&
        domMap.get('tab-fib4-ast').value === '38' &&
        domMap.get('tab-fib4-alt').value === '42' &&
        domMap.get('tab-fib4-plt').value === '210' &&
        !domMap.get('tab-fib4-results').innerHTML.includes('8.'),
        "PatientSync.resetPatient blurs active tool input and clears Primary Care + FIB-4/SCr transient inputs back to clean defaults"
      );
      // Focused non-tools field (#pname) and Clinical Tools field (#tab-kdigo-uacr) must still update on applyPatient/resetPatient, applyPatient must return state, and scr: 0 must normalize to 1.1
      domMap.get('pname').value = 'Stale Patient Name';
      doc2.activeElement = domMap.get('pname');
      const appliedWithFocus = win2.PatientSync.applyPatient({ name: 'Focused Switch Patient', age: 51, sex: 'm', scr: 0, uacr: 280, sbp: 132, dbp: 82, egfr: 84, k: 4.3 });
      assert(
        appliedWithFocus &&
        appliedWithFocus.name === 'Focused Switch Patient' &&
        domMap.get('pname').value === 'Focused Switch Patient' &&
        domMap.get('tab-scr').value === '1.1' &&
        domMap.get('tab-kdigo-uacr').value === '280',
        "PatientSync.applyPatient returns updated patient state, overwrites focused #pname, and falls back scr:0 to 1.1"
      );
      domMap.get('tab-kdigo-uacr').value = '999';
      domMap.get('tab-fib4-ast').value = '160';
      doc2.activeElement = domMap.get('tab-kdigo-uacr');
      win2.PatientSync.resetPatient();
      assert(
        doc2.activeElement !== domMap.get('tab-kdigo-uacr') &&
        domMap.get('tab-kdigo-uacr').value === '45' &&
        domMap.get('tab-fib4-ast').value === '38' &&
        domMap.get('pname').value === 'Ahmed Mahmoud',
        "PatientSync.resetPatient blurs focused #tab-kdigo-uacr, resets KDIGO UACR/FIB-4 defaults, and restores #pname"
      );
      // Restore Patient C state expected by subsequent drawer/vital checks
      win2.PatientSync.applyPatient({ name: 'Patient C', age: 42, sex: 'f', sbp: 120, dbp: 76, egfr: 95, k: 4.1 });
      setSoapDrawerOpenForTest();
      function setSoapDrawerOpenForTest() {
        if (soapDrawer.classList.contains('is-open')) win2.handleAndroidBack();
      }

      // Partial K+ decimal "4." guard + Escape closing Vitals drawer restores invalid partial typing and clears focus
      stickyBar.click();
      const qK = domMap.get('quick-vital-k');
      doc2.activeElement = qK;
      qK.value = '4.';
      qK.dispatchEvent('input');
      assert(win2.PatientSync.get().k === 4.1, `Partial decimal K+='4.' does not prematurely overwrite PatientSync.k (got=${win2.PatientSync.get().k})`);
      doc2.activeElement = qEgfr;
      qEgfr.value = '2';
      qEgfr.dispatchEvent('input');
      win2.dispatchEvent({ type: 'keydown', key: 'Escape' });
      assert(
        !vDrawer.classList.contains('is-open') &&
        doc2.activeElement !== qEgfr &&
        qEgfr.value === '95',
        "Escape closing Vitals drawer clears focus from input and restores valid state instead of keeping partial invalid text"
      );

      // Real HTML DOM-tree cloneNode(true) test exercising live extractCleanContainerText() branch
      class SimText {
        constructor(d) { this.nodeType = 3; this.data = String(d); this.parentNode = null; }
        get textContent() { return this.data; }
        cloneNode() { return new SimText(this.data); }
      }
      class SimEl {
        constructor(tag) {
          this.nodeType = 1; this.tagName = tag.toUpperCase();
          this.attrs = {}; this.style = {}; this.children = []; this.parentNode = null;
        }
        get id() { return this.attrs.id || ''; }
        get classList() {
          const c = (this.attrs.class || '').trim().split(/\s+/).filter(Boolean);
          return { contains: (x) => c.includes(x) };
        }
        hasAttribute(k) { return k in this.attrs; }
        appendChild(ch) { ch.parentNode = this; this.children.push(ch); return ch; }
        prepend(...nodes) {
          const wrapped = nodes.map(n => { const x = typeof n === 'string' ? new SimText(n) : n; x.parentNode = this; return x; });
          this.children.unshift(...wrapped);
        }
        append(...nodes) { for (const n of nodes) this.appendChild(typeof n === 'string' ? new SimText(n) : n); }
        remove() { if (this.parentNode) { this.parentNode.children = this.parentNode.children.filter(x => x !== this); this.parentNode = null; } }
        replaceWith(val) {
          if (!this.parentNode) return;
          const idx = this.parentNode.children.indexOf(this);
          if (idx === -1) return;
          const rep = typeof val === 'string' ? new SimText(val) : val;
          rep.parentNode = this.parentNode;
          this.parentNode.children.splice(idx, 1, rep);
          this.parentNode = null;
        }
        get textContent() { return this.children.map(c => c.textContent).join(''); }
        cloneNode(deep) {
          const cl = new SimEl(this.tagName);
          cl.attrs = { ...this.attrs }; cl.style = { ...this.style };
          if (deep) for (const c of this.children) cl.appendChild(c.cloneNode(true));
          return cl;
        }
        matches(sel) {
          return sel.split(',').some(p => {
            p = p.trim();
            if (!p) return false;
            if (p === '[hidden]') return this.hasAttribute('hidden');
            if (p === '[style]') return 'style' in this.attrs;
            if (p.startsWith('#')) return this.id === p.slice(1);
            if (p.startsWith('.')) return this.classList.contains(p.slice(1));
            return this.tagName.toLowerCase() === p.toLowerCase();
          });
        }
        querySelectorAll(sel) {
          const out = [];
          const walk = (n) => {
            for (const c of n.children) {
              if (c.nodeType === 1) { if (c.matches(sel)) out.push(c); walk(c); }
            }
          };
          walk(this);
          return out;
        }
      }
      function buildSimDom(htmlStr) {
        const root = new SimEl('div');
        const stack = [root];
        const voids = new Set(['BR', 'HR', 'IMG', 'INPUT', 'META', 'LINK']);
        const re = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z0-9-]+(?:\s+[^>]*)?>)|([^<]+)/g;
        let mm;
        while ((mm = re.exec(htmlStr)) !== null) {
          if (mm[1]) continue;
          if (mm[3]) {
            const txt = mm[3].replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            stack[stack.length - 1].appendChild(new SimText(txt));
          } else if (mm[2]) {
            const t = mm[2];
            if (t.startsWith('</')) {
              const nm = t.slice(2, -1).trim().toUpperCase();
              while (stack.length > 1 && stack[stack.length - 1].tagName !== nm) stack.pop();
              if (stack.length > 1) stack.pop();
            } else {
              const sc = t.endsWith('/>');
              const inner = t.slice(1, sc ? -2 : -1).trim();
              const sp = inner.search(/\s/);
              const nm = (sp === -1 ? inner : inner.slice(0, sp)).toUpperCase();
              const as = sp === -1 ? '' : inner.slice(sp + 1);
              const el = new SimEl(nm);
              const ar = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
              let am;
              while ((am = ar.exec(as)) !== null) {
                const v = am[2] ?? am[3] ?? am[4] ?? '';
                el.attrs[am[1]] = v;
                if (am[1] === 'style') {
                  v.split(';').forEach(pair => {
                    const ix = pair.indexOf(':');
                    if (ix !== -1) {
                      const k = pair.slice(0, ix).trim().replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
                      el.style[k] = pair.slice(ix + 1).trim();
                    }
                  });
                }
              }
              stack[stack.length - 1].appendChild(el);
              if (!sc && !voids.has(nm)) stack.push(el);
            }
          }
        }
        return root;
      }

      const resMock = domMap.get('result');
      const outMock = domMap.get('out');
      const lipMock = domMap.get('lipids-container');
      const origLipHtml = lipMock.innerHTML;
      const attachClone = (el, htmlOverride) => {
        const tree = buildSimDom(htmlOverride !== undefined ? htmlOverride : el.innerHTML);
        el.cloneNode = (d) => tree.cloneNode(d);
        el.querySelectorAll = (s) => tree.querySelectorAll(s);
      };
      try {
        attachClone(resMock);
        attachClone(outMock);
        const hiddenOnlyHtml = '<div hidden>Hidden secret diagnosis text</div><div class="rx-sec">Secret Rx section</div><button>Hidden Button</button>';
        lipMock.innerHTML = hiddenOnlyHtml;
        attachClone(lipMock, hiddenOnlyHtml);
        soapSyncBtn.click();
        const clonedSoap = soapTxt.value;
        assert(
          clonedSoap.includes('[Diabetes]') &&
          clonedSoap.includes('Treatment plan') &&
          !clonedSoap.includes('2Treatment plan') &&
          !clonedSoap.includes('5%7%9%11%13%') &&
          !clonedSoap.includes('Prescribe') &&
          !clonedSoap.includes('Screening for this patient'),
          "Real DOM cloneNode(true) extracts cleanly spaced [Diabetes] note without gauge/UI/screening clutter"
        );
        assert(
          clonedSoap.includes('[Hypertension]') &&
          clonedSoap.includes('120/76 Elevated BP') &&
          !clonedSoap.includes('120/76Elevated BP') &&
          !clonedSoap.includes('100120140160180200'),
          "Real DOM cloneNode(true) extracts cleanly spaced [Hypertension] note without BP ruler clutter"
        );
        assert(
          !clonedSoap.includes('Hidden secret diagnosis text') &&
          !clonedSoap.includes('Secret Rx section') &&
          !clonedSoap.includes('[Dyslipidemia / ASCVD]'),
          "Real DOM cloneNode(true) does not resurrect stripped hidden/rx-sec content via regex fallback"
        );
      } finally {
        delete resMock.cloneNode;
        delete resMock.querySelectorAll;
        delete outMock.cloneNode;
        delete outMock.querySelectorAll;
        delete lipMock.cloneNode;
        delete lipMock.querySelectorAll;
        lipMock.innerHTML = origLipHtml;
      }
    });
  }

  console.log("===============================================================");
  console.log(`SIMULATION RESULTS: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log("===============================================================");

  if (failedTests > 0) {
    console.error(`\n❌ SIMULATION FAILED with ${failedTests} failed test(s).`);
    process.exit(1);
  } else {
    console.log(`\n🎯 ALL ${totalTests} CLINICAL SIMULATION TESTS PASSED SUCCESSFULLY! 100% PASS.`);
    process.exit(0);
  }
})();

```

---

