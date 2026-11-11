// ==============================================================
// Patient State Synchronization & Local Draft Management
// ==============================================================

const PatientSync = (function() {
  const STORAGE_KEY = 'osrawy_patient_drafts';
  const ACTIVE_KEY = 'osrawy_active_patient';
  
  let currentPatient = {
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
    smoker: false,
    statin: false,
    ascvd: false,
    medsCount: '0'
  };

  function getBMI(wt, ht) {
    if (!wt || !ht) return null;
    return (wt / ((ht / 100) ** 2)).toFixed(1);
  }

  function loadActive() {
    try {
      const s = localStorage.getItem(ACTIVE_KEY);
      if (s) {
        currentPatient = Object.assign(currentPatient, JSON.parse(s));
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
        data: Object.assign({}, currentPatient)
      };
      // Keep up to 20 recent patients
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
      const $ = id => document.getElementById(id);
      if (!$('pname')) return;
      
      currentPatient.name = $('pname').value || '';
      currentPatient.age = parseFloat($('age').value) || 52;
      currentPatient.sex = $('sex').value || 'm';
      currentPatient.wt = parseFloat($('wt').value) || 96;
      currentPatient.ht = parseFloat($('ht').value) || 170;
      currentPatient.dur = parseFloat($('dur').value) || 4;
      currentPatient.hf = $('hf').value || 'none';
      currentPatient.a1c = parseFloat($('a1c').value) || 8.9;
      currentPatient.fpg = parseFloat($('fpg').value) || 190;
      currentPatient.egfr = parseFloat($('egfr').value) || 68;
      currentPatient.uacr = parseFloat($('uacr').value) || 45;
      currentPatient.ascvd = $('ascvd').checked;
      currentPatient.smoker = $('smoker').checked;

      // Propagate to HTN inputs if present
      if ($('htn-age')) $('htn-age').value = currentPatient.age;
      if ($('htn-sex')) $('htn-sex').value = currentPatient.sex;
      if ($('htn-egfr')) $('htn-egfr').value = currentPatient.egfr;
      if ($('htn-uacr')) $('htn-uacr').value = currentPatient.uacr;
      if ($('cad')) $('cad').checked = currentPatient.ascvd;
      if ($('hf-htn')) $('hf-htn').checked = (currentPatient.hf === 'hfref');
      if ($('smk')) $('smk').checked = currentPatient.smoker;

      saveActive();
      updatePatientBar();

      // Recalculate HTN if available
      if (typeof window.htnRender === 'function') window.htnRender();
      if (typeof window.htnRenderTitrate === 'function') window.htnRenderTitrate();
    } finally {
      isSyncing = false;
    }
  }

  function syncFromHTN() {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const $ = id => document.getElementById(id);
      if (!$('sbp')) return;

      currentPatient.sbp = parseFloat($('sbp').value) || 148;
      currentPatient.dbp = parseFloat($('dbp').value) || 94;
      currentPatient.age = parseFloat($('htn-age').value) || currentPatient.age;
      currentPatient.sex = $('htn-sex').value || currentPatient.sex;
      currentPatient.egfr = parseFloat($('htn-egfr').value) || currentPatient.egfr;
      currentPatient.uacr = parseFloat($('htn-uacr').value) || currentPatient.uacr;
      currentPatient.k = parseFloat($('k').value) || 4.6;
      currentPatient.smoker = $('smk').checked;
      currentPatient.statin = $('statin').checked;
      currentPatient.ascvd = $('cad').checked;

      // Propagate back to Diabetes inputs
      if ($('age')) $('age').value = currentPatient.age;
      if ($('sex')) $('sex').value = currentPatient.sex;
      if ($('egfr')) $('egfr').value = currentPatient.egfr;
      if ($('uacr')) $('uacr').value = currentPatient.uacr;
      if ($('ascvd')) $('ascvd').checked = currentPatient.ascvd;
      if ($('smoker')) $('smoker').checked = currentPatient.smoker;

      saveActive();
      updatePatientBar();

      // Recalculate Diabetes if available
      if (typeof window.plan === 'function') window.plan();
    } finally {
      isSyncing = false;
    }
  }

  function updatePatientBar() {
    const bar = document.getElementById('patient-summary-bar');
    if (!bar) return;
    const bmi = getBMI(currentPatient.wt, currentPatient.ht);
    const t = (k, def) => (typeof window.I18n !== 'undefined' ? window.I18n.t(k, def) : def);
    const sexLabel = currentPatient.sex === 'm' ? t('opt_male', 'ذكر') : t('opt_female', 'أنثى');
    const ageUnit = t('bar_years', 'سنة');
    bar.innerHTML = `
      <div class="pt-bar-item"><span class="pt-bar-label">${t('bar_name', 'الاسم:')}</span> <b>${currentPatient.name || t('bar_new_patient', 'مريض جديد')}</b></div>
      <div class="pt-bar-item"><span class="pt-bar-label">${t('bar_age', 'العمر:')}</span> <b>${currentPatient.age} ${ageUnit}</b> (${sexLabel})</div>
      <div class="pt-bar-item"><span class="pt-bar-label">BMI:</span> <b>${bmi || '—'}</b> (${currentPatient.wt} kg)</div>
      <div class="pt-bar-item"><span class="pt-bar-label">eGFR:</span> <b>${currentPatient.egfr}</b></div>
      <div class="pt-bar-item"><span class="pt-bar-label">UACR:</span> <b>${currentPatient.uacr} mg/g</b></div>
      <div class="pt-bar-item"><span class="pt-bar-label">${t('bar_bp', 'الضغط:')}</span> <b>${currentPatient.sbp}/${currentPatient.dbp}</b></div>
    `;
  }

  function applyPatient(pt) {
    currentPatient = Object.assign({}, pt);
    const $ = id => document.getElementById(id);
    if ($('pname')) $('pname').value = pt.name || '';
    if ($('age')) $('age').value = pt.age;
    if ($('sex')) $('sex').value = pt.sex;
    if ($('wt')) $('wt').value = pt.wt;
    if ($('ht')) $('ht').value = pt.ht;
    if ($('dur')) $('dur').value = pt.dur;
    if ($('hf')) $('hf').value = pt.hf;
    if ($('a1c')) $('a1c').value = pt.a1c;
    if ($('fpg')) $('fpg').value = pt.fpg;
    if ($('egfr')) $('egfr').value = pt.egfr;
    if ($('uacr')) $('uacr').value = pt.uacr;
    if ($('ascvd')) $('ascvd').checked = !!pt.ascvd;
    if ($('smoker')) $('smoker').checked = !!pt.smoker;

    if ($('sbp')) $('sbp').value = pt.sbp || 148;
    if ($('dbp')) $('dbp').value = pt.dbp || 94;
    if ($('htn-age')) $('htn-age').value = pt.age;
    if ($('htn-sex')) $('htn-sex').value = pt.sex;
    if ($('htn-egfr')) $('htn-egfr').value = pt.egfr;
    if ($('htn-uacr')) $('htn-uacr').value = pt.uacr;
    if ($('k')) $('k').value = pt.k || 4.6;
    if ($('cad')) $('cad').checked = !!pt.ascvd;
    if ($('smk')) $('smk').checked = !!pt.smoker;
    if ($('statin')) $('statin').checked = !!pt.statin;

    saveActive();
    updatePatientBar();
    if (typeof window.plan === 'function') window.plan();
    if (typeof window.htnRender === 'function') window.htnRender();
    if (typeof window.htnRenderTitrate === 'function') window.htnRenderTitrate();
  }

  function setEGFR(val) {
    const num = Math.round(parseFloat(val) || 0);
    currentPatient.egfr = num;
    const $ = id => document.getElementById(id);
    if ($('egfr')) $('egfr').value = num;
    if ($('htn-egfr')) $('htn-egfr').value = num;
    saveActive();
    updatePatientBar();
    if (typeof window.plan === 'function') window.plan();
    if (typeof window.htnRender === 'function') window.htnRender();
    if (typeof window.htnRenderTitrate === 'function') window.htnRenderTitrate();
    return num;
  }

  return {
    get: () => currentPatient,
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

if (typeof window !== 'undefined') {
  window.PatientSync = PatientSync;
}

