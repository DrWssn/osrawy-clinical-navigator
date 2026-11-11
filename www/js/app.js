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
        window.PrimaryCareEngine.renderPrimaryCareTab('primary-care-container');
      }
      if (window.ClinicalTools && typeof window.ClinicalTools.renderToolsTab === 'function') {
        window.ClinicalTools.renderToolsTab('clinical-tools-container');
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
