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
          <div style="background:#FDF2F8; border:1px solid #F9A8D4; border-right:4px solid #DB2777; border-radius:8px; padding:12px; margin-bottom:14px; color:#831843;">
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
          <div style="background:#FDF2F8; border:1px solid #F9A8D4; border-right:4px solid #DB2777; border-radius:8px; padding:12px; margin-bottom:14px; color:#831843;">
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
        const h = stickyHeader.offsetHeight || 44;
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
        const openModals = document.querySelectorAll(".modal-overlay.open");
        const hasOverlay =
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
    renderSoapSummary();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootVerifiedUX);
  } else {
    bootVerifiedUX();
  }
})();
