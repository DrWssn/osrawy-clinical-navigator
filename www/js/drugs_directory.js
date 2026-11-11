// ==============================================================
// Interactive Drug Directory & Formulary Search (Saudi & Egypt)
// ==============================================================

const DrugDirectory = (function() {
  let activeMarket = 'saudi'; // default to saudi as requested
  let activeFilter = 'all';
  let activeTier = 'all';
  let searchQuery = '';

  function setMarket(market) {
    activeMarket = market;
    const btnSa = document.getElementById('market-btn-sa');
    const btnEg = document.getElementById('market-btn-eg');
    if (btnSa && btnEg) {
      btnSa.classList.toggle('active', market === 'saudi');
      btnEg.classList.toggle('active', market === 'egypt');
    }
    const headerMktBtn = document.getElementById('market-toggle-btn');
    if (headerMktBtn) {
      const isAr = (typeof window.I18n !== 'undefined' && window.I18n.getLang() === 'ar');
      headerMktBtn.textContent = market === 'saudi' 
        ? (isAr ? '🇸🇦 السوق السعودي (SAR)' : '🇸🇦 Saudi Market (SAR)')
        : (isAr ? '🇪🇬 السوق المصري (EGP)' : '🇪🇬 Egypt Market (EGP)');
    }
    render();
    if (typeof window.applyMarketToD === 'function') {
      window.applyMarketToD(market);
    }
  }

  function getMarket() {
    return activeMarket;
  }

  function normalizeArabic(str) {
    if (!str) return '';
    return str.toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '') // remove tashkeel/diacritics
      .trim();
  }

  function render() {
    const container = document.getElementById('drug-directory-list');
    if (!container) return;

    const rawQuery = searchQuery.trim();
    const query = rawQuery.toLowerCase();
    const qNorm = normalizeArabic(rawQuery);

    const items = Object.values(DRUG_DATABASE).filter(d => {
      // Category filter
      if (activeFilter !== 'all' && d.category !== activeFilter) return false;
      
      const mkt = d[activeMarket] || d.saudi;
      // Tier filter
      if (activeTier !== 'all' && String(mkt.tier) !== activeTier) return false;

      // Text query match
      if (!query) return true;
      const matchName = d.name.toLowerCase().includes(query);
      const matchCls = d.cls.toLowerCase().includes(query);
      const matchBrands = mkt.brands.some(b => b.toLowerCase().includes(query) || normalizeArabic(b).includes(qNorm));
      const matchAr = d.ar && Array.isArray(d.ar) && d.ar.some(a => normalizeArabic(a).includes(qNorm));
      return matchName || matchCls || matchBrands || matchAr;
    });

    const t = (k, def) => (typeof window.I18n !== 'undefined' ? window.I18n.t(k, def) : def);
    const isAr = (typeof window.I18n !== 'undefined' && window.I18n.getLang() === 'ar');

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>${t('drugs_empty_found', 'لم يتم العثور على أدوية مطابقة للبحث')} "<b>${searchQuery}</b>"</p>
          <small>${t('drugs_empty_hint', 'جرب البحث باسم المادة الفعالة أو الاسم التجاري في السوق السعودي')}</small>
        </div>`;
      return;
    }

    container.innerHTML = items.map(d => {
      const mkt = d[activeMarket] || d.saudi;
      const tierDescText = isAr 
        ? (mkt.tier === 1 ? '● اقتصادي / منخفض' : mkt.tier === 2 ? '●● متوسط' : '●●● عالي التكلفة')
        : mkt.tierDesc;

      const tierBadge = mkt.tier === 1 
        ? `<span class="cost t1">${tierDescText}</span>`
        : mkt.tier === 2 
        ? `<span class="cost t2">${tierDescText}</span>`
        : `<span class="cost t3">${tierDescText}</span>`;

      const brandsHtml = mkt.brands.map((b, i) => 
        i === mkt.orig 
          ? `<span class="brand-orig">★ ${b}</span>` 
          : `<span class="brand-gen">${b}</span>`
      ).join(' · ');

      const marketLabel = activeMarket === 'saudi' 
        ? t('mkt_saudi_short', 'السوق السعودي 🇸🇦') 
        : t('mkt_egypt_short', 'السوق المصري 🇪🇬');

      return `
        <div class="drug-dir-card">
          <div class="drug-dir-header">
            <div>
              <span class="drug-dir-cls">${d.cls}</span>
              <h3 class="drug-dir-name">${d.name}</h3>
            </div>
            <div class="drug-dir-price-box">
              ${tierBadge}
              <span class="drug-dir-price">${mkt.priceEst}</span>
            </div>
          </div>

          <div class="drug-dir-brands">
            <small class="muted-label">${t('drugs_brands_label', 'الأسماء التجارية')} (${marketLabel}):</small>
            <div class="brands-row">${brandsHtml}</div>
          </div>

          <div class="drug-dir-info-grid">
            <div class="drug-dir-info-item">
              <span class="info-label">💊 ${t('drugs_usual_dose', 'الجرعة المعتادة:')}</span>
              <span class="info-val">${d.dose}</span>
            </div>
            <div class="drug-dir-info-item">
              <span class="info-label">🫘 ${t('drugs_renal_adj', 'ضبط وظائف الكلى (eGFR):')}</span>
              <span class="info-val renal">${d.renal(60)}</span>
            </div>
          </div>

          <div class="drug-dir-caut">
            <span class="info-label">⚠️ ${t('drugs_cautions', 'تنبيهات واحتياطات:')}</span>
            <span>${d.caut}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function init() {
    const searchInput = document.getElementById('drug-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        searchQuery = e.target.value;
        render();
      });
    }

    const filterBtns = document.querySelectorAll('[data-drug-filter]');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-drug-filter');
        render();
      });
    });

    const tierBtns = document.querySelectorAll('[data-drug-tier]');
    tierBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tierBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTier = btn.getAttribute('data-drug-tier');
        render();
      });
    });

    render();
  }

  return {
    init,
    setMarket,
    getMarket,
    render
  };
})();

if (typeof window !== 'undefined') {
  window.DrugDirectory = DrugDirectory;
}

