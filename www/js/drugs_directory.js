// ==============================================================
// Interactive Drug Directory & Saudi Regional Formulary
// Osrawy Clinical Navigator - Trade-Name Search & Live eGFR Dosing
// ==============================================================

(function (global) {
  const MODE_STORAGE_KEY = 'osrawy_rx_display_mode';
  let searchQuery = '';
  let activeCategory = 'all';
  let displayMode = (function () {
    try {
      return (global.localStorage && global.localStorage.getItem(MODE_STORAGE_KEY)) || 'both';
    } catch (_) {
      return 'both';
    }
  })();

  const ID_ALIASES = {
    'met': 'metformin',
    'empa': 'empagliflozin',
    'dapa': 'dapagliflozin',
    'sema': 'semaglutide',
    'tirz': 'tirzepatide',
    'sita': 'sitagliptin',
    'atorva': 'atorvastatin',
    'rosuva': 'rosuvastatin'
  };

  function getFormulary() {
    return global.OsrawyFormularyData || global.FORMULARY_DATA || [];
  }

  function findDrugById(drugId) {
    let cleanId = String(drugId || '').toLowerCase().trim();
    if (ID_ALIASES[cleanId]) {
      cleanId = ID_ALIASES[cleanId];
    }
    return getFormulary().find(d => d.id === cleanId) || null;
  }

  function normalizeArabic(str) {
    if (!str) return '';
    return String(str)
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '')
      .toLowerCase()
      .trim();
  }

  function searchDrugs(query = '', category = 'all') {
    const rawQ = String(query || '').trim();
    const q = rawQ.toLowerCase();
    const qNorm = normalizeArabic(rawQ);
    let cat = String(category || 'all').toLowerCase();
    if (cat === 'diabetes') cat = 'dm';

    return getFormulary().filter(drug => {
      if (cat !== 'all' && drug.category !== cat) return false;
      if (!rawQ) return true;

      const haystack = [
        drug.id,
        drug.genericEn,
        drug.genericAr,
        drug.classEn,
        drug.classAr,
        ...(drug.tradeNamesEn || []),
        ...(drug.tradeNamesAr || [])
      ]
        .join(' ')
        .toLowerCase();

      if (haystack.includes(q)) return true;
      if (qNorm) {
        const normHaystack = normalizeArabic(haystack);
        if (normHaystack.includes(qNorm)) return true;
      }
      return false;
    });
  }

  // Formats a drug name as 'generic', 'trade', or 'both' for UI and Prescription Share
  function formatDrugDisplayName(drugOrId, mode = displayMode, lang = 'en') {
    const drug = typeof drugOrId === 'string' ? findDrugById(drugOrId) : drugOrId;
    if (!drug) return String(drugOrId || '');

    const isAr = lang === 'ar';
    const generic = isAr ? drug.genericAr : drug.genericEn;
    const trades = isAr ? drug.tradeNamesAr : drug.tradeNamesEn;
    const primaryTrade = trades && trades.length > 0 ? trades[0] : generic;
    const tradeList = trades && trades.length > 0 ? trades.slice(0, 2).join(' / ') : '';

    if (mode === 'generic') return generic;
    if (mode === 'trade') return primaryTrade;
    return tradeList ? `${generic} (${tradeList})` : generic;
  }

  function evaluateRenalStatusForDrug(drugOrId, egfr = 90) {
    const drug = typeof drugOrId === 'string' ? findDrugById(drugOrId) : drugOrId;
    const val = Number(egfr != null ? egfr : 90);
    const r = (drug && drug.renal) || {};
    if (r.stopBelowEgfr && val < r.stopBelowEgfr) {
      return {
        status: 'contraindicated',
        badgeEn: `Contraindicated at eGFR ${val} (<${r.stopBelowEgfr})`,
        badgeAr: `ممنوع عند eGFR ${val} (<${r.stopBelowEgfr})`
      };
    }
    if (r.cautionBelowEgfr && val < r.cautionBelowEgfr) {
      return {
        status: 'caution',
        badgeEn: `Dose Adjust at eGFR ${val} (<${r.cautionBelowEgfr})`,
        badgeAr: `تعديل جرعة عند eGFR ${val} (<${r.cautionBelowEgfr})`
      };
    }
    return {
      status: 'safe',
      badgeEn: `Renal Safe (eGFR ${val})`,
      badgeAr: `آمن كلوياً (eGFR ${val})`
    };
  }

  function getPatientSync() {
    return global.OsrawyPatientSync || global.PatientSync;
  }

  function getPatientState() {
    const sync = getPatientSync();
    if (!sync) return { egfr: 90, medications: [] };
    if (typeof sync.getState === 'function') return sync.getState();
    if (typeof sync.get === 'function') return sync.get();
    return { egfr: 90, medications: [] };
  }

  function formatMedicationLine(drugId, lang = 'ar', mode = displayMode) {
    const state = getPatientState();
    const drug = findDrugById(drugId);
    if (!drug) return `• ${drugId}`;

    const isAr = lang === 'ar';
    const title = formatDrugDisplayName(drug, mode, lang);
    const dose = isAr ? drug.doseAr : drug.doseEn;
    const renalStatus = evaluateRenalStatusForDrug(drug, state ? state.egfr : 90);
    const renalRule = drug.renal ? (isAr ? drug.renal.ruleAr : drug.renal.ruleEn) : '';
    const renalNote =
      (renalStatus.status !== 'safe' && renalRule)
        ? ` ⚠️ [${renalRule}]`
        : '';

    return `• ${title} — ${dose}${renalNote}`;
  }

  function setDisplayMode(mode) {
    if (['generic', 'trade', 'both'].includes(mode)) {
      displayMode = mode;
      try {
        if (global.localStorage) {
          global.localStorage.setItem(MODE_STORAGE_KEY, mode);
        }
      } catch (_) {}
      renderDirectory('drugs-directory-container');
    }
  }

  function togglePatientMedication(drugId) {
    const sync = getPatientSync();
    if (!sync) return false;
    const state = getPatientState();
    const medsRaw = state.medications || state.activeMeds || state.currentMeds || [];
    const meds = new Set(medsRaw.map(m => String(m).toLowerCase()));
    const cleanId = String(drugId).toLowerCase();
    let isAdded = false;
    if (meds.has(cleanId)) {
      meds.delete(cleanId);
      isAdded = false;
    } else {
      meds.add(cleanId);
      isAdded = true;
    }
    const arr = Array.from(meds);
    if (typeof sync.updatePatient === 'function') {
      sync.updatePatient({ medications: arr, activeMeds: arr, currentMeds: arr });
    } else if (typeof sync.setField === 'function') {
      sync.setField('medications', arr);
      sync.setField('activeMeds', arr);
      sync.setField('currentMeds', arr);
    } else if (typeof sync.applyPatient === 'function') {
      sync.applyPatient({ medications: arr, activeMeds: arr, currentMeds: arr });
    } else {
      state.medications = arr;
      state.activeMeds = arr;
      state.currentMeds = arr;
    }
    if (typeof sync.notifyUpdated === 'function') {
      sync.notifyUpdated();
    }
    renderDirectory('drugs-directory-container');
    return isAdded;
  }

  function renderDirectory(containerId = 'drugs-directory-container') {
    const container = global.document && (
      global.document.getElementById(containerId) ||
      global.document.getElementById('drugs-directory-container') ||
      global.document.getElementById('drug-directory-list')
    );
    if (!container) return;

    const isAr = (typeof global.I18n !== 'undefined' && typeof global.I18n.getLang === 'function')
      ? global.I18n.getLang() === 'ar'
      : (global.document.documentElement ? (global.document.documentElement.lang === 'ar' || global.document.documentElement.dir === 'rtl') : false);

    const state = getPatientState();
    const medsRaw = state.medications || state.activeMeds || state.currentMeds || [];
    const activeMeds = new Set(medsRaw.map(m => String(m).toLowerCase()));
    const results = searchDrugs(searchQuery, activeCategory);

    const cardsHtml = results
      .map(drug => {
        const isSelected = activeMeds.has(drug.id);
        const renal = evaluateRenalStatusForDrug(drug, state.egfr);
        const title = formatDrugDisplayName(drug, displayMode, isAr ? 'ar' : 'en');
        const allBrands = (isAr ? drug.tradeNamesAr : drug.tradeNamesEn).join(' ، ');

        return `
          <div class="leaflet-section-card drug-card-${renal.status}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
              <div>
                <div class="leaflet-topic-title">${title}</div>
                <div style="font-size:0.82rem; color:#475569;">
                  ${isAr ? drug.classAr : drug.classEn} | ${isAr ? 'الأسماء التجارية:' : 'Brands:'} <strong>${allBrands}</strong>
                </div>
              </div>
              <button type="button" class="action-chip ${isSelected ? 'primary-chip' : ''}" data-med-toggle="${drug.id}">
                ${isSelected ? (isAr ? '✓ مضاف للخطة' : '✓ In Plan') : (isAr ? '+ أضف للخطة' : '+ Add')}
              </button>
            </div>
            <div style="margin-block-start:0.5rem; font-size:0.9rem;">
              <strong>${isAr ? 'الجرعة:' : 'Dosing:'}</strong> ${isAr ? drug.doseAr : drug.doseEn}
              <span style="color:#64748b;">(${drug.strengths.join(', ')})</span>
            </div>
            <div style="margin-block-start:0.4rem; font-size:0.82rem; font-weight:700;">
              🩺 ${isAr ? renal.badgeAr : renal.badgeEn} — ${isAr ? drug.renal.ruleAr : drug.renal.ruleEn}
            </div>
          </div>
        `;
      })
      .join('');

    container.innerHTML = `
      <div class="leaflet-toolbar">
        <input
          type="search"
          id="formulary-search-input"
          value="${searchQuery}"
          placeholder="${isAr ? 'ابحث بالاسم العلمي أو التجاري (مثل: جلوكوفاج، جاردينس، ليبيتور، كونكور)...' : 'Search generic or Saudi brand (e.g., Jardiance, Lipitor, Concor, Exforge)...'}"
          style="flex:1; min-width:240px; min-height:2.6rem; padding:0.5rem 0.85rem; border:1px solid #cbd5e1; border-radius:0.5rem;"
        />
        <div class="leaflet-actions">
          <button type="button" class="action-chip ${displayMode === 'both' ? 'primary-chip' : ''}" data-rx-mode="both">
            ${isAr ? 'علمي + تجاري' : 'Generic + Brand'}
          </button>
          <button type="button" class="action-chip ${displayMode === 'generic' ? 'primary-chip' : ''}" data-rx-mode="generic">
            ${isAr ? 'علمي فقط' : 'Generic Only'}
          </button>
          <button type="button" class="action-chip ${displayMode === 'trade' ? 'primary-chip' : ''}" data-rx-mode="trade">
            ${isAr ? 'تجاري فقط' : 'Brand Only'}
          </button>
        </div>
      </div>
      <div class="leaflet-topic-pills" style="margin-block-end:1rem;">
        ${['all', 'dm', 'htn', 'dlp', 'resp', 'thyroid']
          .map(
            cat => `
          <button type="button" class="pill-btn ${activeCategory === cat ? 'active' : ''}" data-cat="${cat}">
            ${cat.toUpperCase()}
          </button>`
          )
          .join('')}
      </div>
      <div>${cardsHtml || `<p>${isAr ? 'لا توجد نتائج مطابقة.' : 'No matching medications found.'}</p>`}</div>
    `;

    const inputEl = container.querySelector('#formulary-search-input');
    if (inputEl) {
      inputEl.addEventListener('input', e => {
        searchQuery = e.target.value;
        renderDirectory(containerId);
      });
    }

    // Also connect to header search input if present
    const headerInput = global.document && global.document.getElementById('drug-search-input');
    if (headerInput && !headerInput._dirBound) {
      headerInput._dirBound = true;
      headerInput.addEventListener('input', e => {
        searchQuery = e.target.value;
        renderDirectory(containerId);
      });
    }

    container.querySelectorAll('[data-rx-mode]').forEach(btn => {
      btn.addEventListener('click', () => setDisplayMode(btn.getAttribute('data-rx-mode')));
    });

    container.querySelectorAll('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-cat');
        renderDirectory(containerId);
      });
    });

    container.querySelectorAll('[data-med-toggle]').forEach(btn => {
      btn.addEventListener('click', () => togglePatientMedication(btn.getAttribute('data-med-toggle')));
    });
  }

  if (typeof global.addEventListener === 'function') {
    global.addEventListener('osrawy:patient-updated', () => {
      renderDirectory('drugs-directory-container');
    });
  }

  const OsrawyDrugsDirectory = {
    searchDrugs,
    findDrugById,
    formatDrugDisplayName,
    formatMedicationLine,
    evaluateRenalStatusForDrug,
    setDisplayMode,
    getDisplayMode: () => displayMode,
    togglePatientMedication,
    renderDirectory,
    // Backwards compatibility for legacy DrugDirectory calls
    init: function() {
      const searchInput = global.document && (global.document.getElementById('drug-search-input') || global.document.getElementById('formulary-search-input'));
      if (searchInput && !searchInput._initBound) {
        searchInput._initBound = true;
        searchInput.addEventListener('input', e => {
          searchQuery = e.target.value;
          renderDirectory();
        });
      }
      renderDirectory();
    },
    render: function() {
      renderDirectory();
    },
    setMarket: function(market) {
      // Compatibility stub
    },
    getMarket: function() {
      return 'saudi';
    }
  };

  global.OsrawyDrugsDirectory = OsrawyDrugsDirectory;
  global.DrugDirectory = OsrawyDrugsDirectory;

  // Auto-detect container ID if legacy HTML uses #drugs-list or #drugs-container
  function initLegacyDrugsMount() {
    if (!global.document) return;
    const fallbackIds = ['drugs-directory-container', 'drug-directory-list', 'drugs-container', 'drugs-list', 'tab-drugs'];
    for (const id of fallbackIds) {
      if (global.document.getElementById(id)) {
        renderDirectory(id);
        break;
      }
    }
  }

  if (global.document && global.document.readyState !== 'loading') {
    initLegacyDrugsMount();
  } else if (global.document && typeof global.document.addEventListener === 'function') {
    global.document.addEventListener('DOMContentLoaded', initLegacyDrugsMount);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OsrawyDrugsDirectory;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
