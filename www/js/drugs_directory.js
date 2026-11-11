// ==============================================================
// Interactive Drug Directory & Saudi Regional Formulary
// Osrawy Clinical Navigator - Trade-Name Search & Live eGFR Dosing
// ==============================================================

(function (global) {
  const MODE_STORAGE_KEY = 'osrawy_rx_display_mode';
  const MARKET_STORAGE_KEY = 'osrawy_market';
  let searchQuery = '';
  let activeCategory = 'all';
  let activeTier = 'all';
  let activeMarket = (function () {
    try {
      const m = global.localStorage && global.localStorage.getItem(MARKET_STORAGE_KEY);
      return m === 'egypt' ? 'egypt' : 'saudi';
    } catch (_) {
      return 'saudi';
    }
  })();
  let displayMode = (function () {
    try {
      return (global.localStorage && global.localStorage.getItem(MODE_STORAGE_KEY)) || 'both';
    } catch (_) {
      return 'both';
    }
  })();

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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

  function canonicalDrugId(drugId) {
    const cleanId = String(drugId || '').toLowerCase().trim();
    return ID_ALIASES[cleanId] || cleanId;
  }

  function findDrugById(drugId) {
    const cleanId = canonicalDrugId(drugId);
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

  function getMarketBrands(drug, lang = 'en') {
    if (!drug) return [];
    const isAr = lang === 'ar';
    if (activeMarket === 'egypt') {
      const egypt = isAr ? drug.egyptBrandsAr : drug.egyptBrandsEn;
      if (egypt && egypt.length > 0) return egypt;
    } else {
      const saudi = isAr ? drug.saudiBrandsAr : drug.saudiBrandsEn;
      if (saudi && saudi.length > 0) return saudi;
    }
    return (isAr ? drug.tradeNamesAr : drug.tradeNamesEn) || [];
  }

  function normalizeCategory(category = 'all') {
    let cat = String(category || 'all').toLowerCase();
    if (cat === 'diabetes') cat = 'dm';
    else if (cat === 'lipids') cat = 'dlp';
    else if (cat === 'respiratory') cat = 'resp';
    return cat;
  }

  function searchDrugs(query = '', category = 'all', tier = 'all') {
    const rawQ = String(query || '').trim();
    const q = rawQ.toLowerCase();
    const qNorm = normalizeArabic(rawQ);
    const cat = normalizeCategory(category);
    const tierFilter = String(tier || 'all').toLowerCase();

    return getFormulary().filter(drug => {
      if (cat !== 'all' && drug.category !== cat) return false;
      if (tierFilter !== 'all' && String(drug.tier || 1) !== tierFilter) return false;
      if (!rawQ) return true;

      const haystack = [
        drug.id,
        drug.genericEn,
        drug.genericAr,
        drug.classEn,
        drug.classAr,
        ...(drug.tradeNamesEn || []),
        ...(drug.tradeNamesAr || []),
        ...(drug.saudiBrandsEn || []),
        ...(drug.saudiBrandsAr || []),
        ...(drug.egyptBrandsEn || []),
        ...(drug.egyptBrandsAr || [])
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
    const trades = getMarketBrands(drug, lang);
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
    const medsRaw =
      (Array.isArray(state.medications) && state.medications.length ? state.medications : null) ||
      (Array.isArray(state.activeMeds) && state.activeMeds.length ? state.activeMeds : null) ||
      (Array.isArray(state.currentMeds) && state.currentMeds.length ? state.currentMeds : null) ||
      [];
    const medsList = medsRaw.map(m => String(m).toLowerCase()).filter(Boolean);
    const cleanId = canonicalDrugId(drugId);
    const hasMatch = medsList.some(m => canonicalDrugId(m) === cleanId);
    let arr;
    let isAdded = false;
    if (hasMatch) {
      arr = medsList.filter(m => canonicalDrugId(m) !== cleanId);
      isAdded = false;
    } else {
      arr = Array.from(new Set([...medsList, cleanId]));
      isAdded = true;
    }
    let alreadyNotified = false;
    if (typeof sync.updatePatient === 'function') {
      sync.updatePatient({ medications: arr, activeMeds: arr, currentMeds: arr });
      alreadyNotified = true;
    } else if (typeof sync.setField === 'function') {
      sync.setField('medications', arr);
      sync.setField('activeMeds', arr);
      sync.setField('currentMeds', arr);
      alreadyNotified = true;
    } else if (typeof sync.applyPatient === 'function') {
      sync.applyPatient({ medications: arr, activeMeds: arr, currentMeds: arr });
      alreadyNotified = true;
    } else {
      state.medications = arr;
      state.activeMeds = arr;
      state.currentMeds = arr;
    }
    if (!alreadyNotified && typeof sync.notifyUpdated === 'function') {
      sync.notifyUpdated();
    }
    renderDirectory('drugs-directory-container');
    return isAdded;
  }

  function buildCardsHtml(results, activeMeds, state, isAr) {
    if (!results || results.length === 0) {
      return `<p style="grid-column:1 / -1; color:var(--muted);">${isAr ? 'لا توجد نتائج مطابقة.' : 'No matching medications found.'}</p>`;
    }
    return results
      .map(drug => {
        const isSelected = activeMeds.has(drug.id);
        const renal = evaluateRenalStatusForDrug(drug, state.egfr);
        const title = formatDrugDisplayName(drug, displayMode, isAr ? 'ar' : 'en');
        const allBrands = getMarketBrands(drug, isAr ? 'ar' : 'en').join(' ، ');
        const tierNum = drug.tier || 1;
        const tierBadge = tierNum === 3 ? '●●●' : (tierNum === 2 ? '●●' : '●');

        return `
          <div class="leaflet-section-card drug-dir-card drug-card-${renal.status}" style="margin-bottom:0;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
              <div>
                <div class="leaflet-topic-title">${escapeHtml(title)} <span style="font-size:0.75rem; color:var(--muted); font-weight:600;">${tierBadge}</span></div>
                <div style="font-size:0.82rem; color:#475569;">
                  ${escapeHtml(isAr ? drug.classAr : drug.classEn)} | ${isAr ? 'الأسماء التجارية:' : 'Brands:'} <strong>${escapeHtml(allBrands)}</strong>
                </div>
              </div>
              <button type="button" class="action-chip ${isSelected ? 'primary-chip' : ''}" data-med-toggle="${escapeHtml(drug.id)}">
                ${isSelected ? (isAr ? '✓ مضاف للخطة' : '✓ In Plan') : (isAr ? '+ أضف للخطة' : '+ Add')}
              </button>
            </div>
            <div style="margin-block-start:0.5rem; font-size:0.9rem;">
              <strong>${isAr ? 'الجرعة:' : 'Dosing:'}</strong> ${escapeHtml(isAr ? drug.doseAr : drug.doseEn)}
              <span style="color:#64748b;">(${escapeHtml((drug.strengths || []).join(', '))})</span>
            </div>
            <div style="margin-block-start:0.4rem; font-size:0.82rem; font-weight:700;">
              🩺 ${escapeHtml(isAr ? renal.badgeAr : renal.badgeEn)} — ${escapeHtml(isAr ? drug.renal.ruleAr : drug.renal.ruleEn)}
            </div>
          </div>
        `;
      })
      .join('');
  }

  function syncMarketAndFilterButtons(doc) {
    if (!doc) return;
    const btnSa = doc.getElementById('market-btn-sa');
    const btnEg = doc.getElementById('market-btn-eg');
    if (btnSa) btnSa.classList.toggle('active', activeMarket === 'saudi');
    if (btnEg) btnEg.classList.toggle('active', activeMarket === 'egypt');

    doc.querySelectorAll('[data-drug-filter]').forEach(btn => {
      const f = normalizeCategory(btn.getAttribute('data-drug-filter'));
      btn.classList.toggle('active', f === activeCategory);
    });
    doc.querySelectorAll('[data-drug-tier]').forEach(btn => {
      const tr = String(btn.getAttribute('data-drug-tier') || 'all').toLowerCase();
      btn.classList.toggle('active', tr === activeTier);
    });
  }

  function bindGlobalPageControls(doc, containerId) {
    if (!doc) return;
    const headerInput = doc.getElementById('drug-search-input');
    if (headerInput && !headerInput._dirBound) {
      headerInput._dirBound = true;
      headerInput.addEventListener('input', e => {
        searchQuery = e.target.value;
        renderDirectory(containerId);
      });
    }

    doc.querySelectorAll('[data-drug-filter]').forEach(btn => {
      if (btn._dirBound) return;
      btn._dirBound = true;
      btn.addEventListener('click', () => {
        activeCategory = normalizeCategory(btn.getAttribute('data-drug-filter'));
        renderDirectory(containerId);
      });
    });

    doc.querySelectorAll('[data-drug-tier]').forEach(btn => {
      if (btn._dirBound) return;
      btn._dirBound = true;
      btn.addEventListener('click', () => {
        activeTier = String(btn.getAttribute('data-drug-tier') || 'all').toLowerCase();
        renderDirectory(containerId);
      });
    });
  }

  function renderDirectory(containerId = 'drugs-directory-container') {
    const doc = global.document;
    const container = doc && (
      doc.getElementById(containerId) ||
      doc.getElementById('drugs-directory-container') ||
      doc.getElementById('drug-directory-list')
    );
    if (!container) return;

    const isAr = (typeof global.I18n !== 'undefined' && typeof global.I18n.getLang === 'function')
      ? global.I18n.getLang() === 'ar'
      : (doc.documentElement ? (doc.documentElement.lang === 'ar' || doc.documentElement.dir === 'rtl') : false);

    const state = getPatientState();
    const medsRaw =
      (Array.isArray(state.medications) && state.medications.length ? state.medications : null) ||
      (Array.isArray(state.activeMeds) && state.activeMeds.length ? state.activeMeds : null) ||
      (Array.isArray(state.currentMeds) && state.currentMeds.length ? state.currentMeds : null) ||
      [];
    const activeMeds = new Set(medsRaw.map(m => canonicalDrugId(m)).filter(Boolean));
    const results = searchDrugs(searchQuery, activeCategory, activeTier);
    const cardsHtml = buildCardsHtml(results, activeMeds, state, isAr);

    const headerSearch = doc.getElementById('drug-search-input');
    const listEl = doc.getElementById('drug-directory-list');
    const usesPageLayout = !!(headerSearch && listEl && (container.id === 'drugs-directory-container' || container.id === 'drug-directory-list'));

    bindGlobalPageControls(doc, containerId);
    syncMarketAndFilterButtons(doc);

    const modeToolbarHtml = `
      <div class="leaflet-actions" style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px;">
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
    `;

    if (usesPageLayout) {
      let modeWrap = doc.getElementById('drug-rx-mode-toolbar');
      if (!modeWrap && container.id === 'drugs-directory-container') {
        modeWrap = doc.createElement('div');
        modeWrap.id = 'drug-rx-mode-toolbar';
        container.insertBefore(modeWrap, listEl);
      }
      if (modeWrap) {
        modeWrap.innerHTML = modeToolbarHtml;
        modeWrap.querySelectorAll('[data-rx-mode]').forEach(btn => {
          btn.addEventListener('click', () => setDisplayMode(btn.getAttribute('data-rx-mode')));
        });
      }
      listEl.innerHTML = cardsHtml;
      listEl.querySelectorAll('[data-med-toggle]').forEach(btn => {
        btn.addEventListener('click', () => togglePatientMedication(btn.getAttribute('data-med-toggle')));
      });
      return;
    }

    // Standalone container fallback (preserve search input focus if already rendered)
    const existingInput = container.querySelector('#formulary-search-input');
    const existingBody = container.querySelector('#formulary-results-body');
    const pillsHtml = ['all', 'dm', 'htn', 'dlp', 'resp', 'thyroid']
      .map(
        cat => `
      <button type="button" class="pill-btn ${activeCategory === cat ? 'active' : ''}" data-cat="${cat}">
        ${cat.toUpperCase()}
      </button>`
      )
      .join('');

    if (existingInput && existingBody) {
      const modeBox = container.querySelector('.leaflet-actions');
      if (modeBox) {
        modeBox.innerHTML = `
          <button type="button" class="action-chip ${displayMode === 'both' ? 'primary-chip' : ''}" data-rx-mode="both">${isAr ? 'علمي + تجاري' : 'Generic + Brand'}</button>
          <button type="button" class="action-chip ${displayMode === 'generic' ? 'primary-chip' : ''}" data-rx-mode="generic">${isAr ? 'علمي فقط' : 'Generic Only'}</button>
          <button type="button" class="action-chip ${displayMode === 'trade' ? 'primary-chip' : ''}" data-rx-mode="trade">${isAr ? 'تجاري فقط' : 'Brand Only'}</button>
        `;
      }
      const pillsWrap = container.querySelector('.leaflet-topic-pills');
      if (pillsWrap) pillsWrap.innerHTML = pillsHtml;
      existingBody.innerHTML = cardsHtml;
    } else {
      container.innerHTML = `
        <div class="leaflet-toolbar">
          <input
            type="search"
            id="formulary-search-input"
            value="${escapeHtml(searchQuery)}"
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
          ${pillsHtml}
        </div>
        <div id="formulary-results-body">${cardsHtml}</div>
      `;

      const inputEl = container.querySelector('#formulary-search-input');
      if (inputEl) {
        inputEl.addEventListener('input', e => {
          searchQuery = e.target.value;
          renderDirectory(containerId);
        });
      }
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

  function setMarket(market) {
    const next = (String(market || '').toLowerCase() === 'egypt') ? 'egypt' : 'saudi';
    activeMarket = next;
    try {
      if (global.localStorage) {
        global.localStorage.setItem(MARKET_STORAGE_KEY, next);
      }
    } catch (_) {}

    if (global.document) {
      syncMarketAndFilterButtons(global.document);
      const mktBtn = global.document.getElementById('market-toggle-btn');
      if (mktBtn && !(global.I18n && typeof global.I18n.applyTranslations === 'function')) {
        const isAr = global.document.documentElement && global.document.documentElement.lang === 'ar';
        if (next === 'saudi') {
          mktBtn.textContent = isAr ? '🇸🇦 السوق السعودي (SAR)' : '🇸🇦 Saudi Market (SAR)';
        } else {
          mktBtn.textContent = isAr ? '🇪🇬 السوق المصري (EGP)' : '🇪🇬 Egypt Market (EGP)';
        }
      }
    }

    if (global.I18n && typeof global.I18n.applyTranslations === 'function') {
      try { global.I18n.applyTranslations(); } catch (_) {}
    }

    if (typeof global.applyMarketToD === 'function') {
      try { global.applyMarketToD(next); } catch (_) {}
    }

    if (global.ClinicalTools && typeof global.ClinicalTools.renderLdlMatrix === 'function') {
      const ldlContainer = global.document && global.document.getElementById('ldl-matrix-container');
      if (ldlContainer && ldlContainer.innerHTML.trim()) {
        try { global.ClinicalTools.renderLdlMatrix(); } catch (_) {}
      }
    }

    renderDirectory('drugs-directory-container');
    return activeMarket;
  }

  function getMarket() {
    return activeMarket;
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
    setMarket: setMarket,
    getMarket: getMarket
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
