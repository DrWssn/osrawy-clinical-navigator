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

    const switcher = document.createElement('div');
    switcher.className = 'phone-pane-switcher phone-pane-switcher-dm';
    switcher.setAttribute('role', 'tablist');
    switcher.setAttribute('aria-label', 'Diabetes View Switcher');

    const isAr = isRtl();
    switcher.innerHTML = `
      <button type="button" class="phone-pane-btn active" data-pane="form">
        👤 ${isAr ? 'بيانات المريض' : 'Patient Inputs'}
      </button>
      <button type="button" class="phone-pane-btn" data-pane="plan">
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

    const switcher = document.createElement('div');
    switcher.className = 'phone-pane-switcher phone-pane-switcher-htn';
    switcher.setAttribute('role', 'tablist');
    switcher.setAttribute('aria-label', 'Hypertension View Switcher');

    const isAr = isRtl();
    switcher.innerHTML = `
      <button type="button" class="phone-pane-btn active" data-pane="form">
        👤 ${isAr ? 'القياسات والفحوصات' : 'Vitals & Labs'}
      </button>
      <button type="button" class="phone-pane-btn" data-pane="plan">
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
          const out = document.getElementById('out');
          if (out) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. Priority 3 Alternative Drugs Collapsible Accordion
     ------------------------------------------------------------------------ */
  let isCollapsingAlt = false;

  function collapsePriority3Alternatives() {
    if (isCollapsingAlt) return;
    if (!isPhone()) return;

    const resEl = document.getElementById('result');
    if (!resEl) return;

    // Find tertiary or alternative sections (e.g., sulfonylureas, pioglitazone alternatives)
    const altSections = resEl.querySelectorAll('.rx-sec.rx-alt, .rx-sec[data-priority="3"]');
    if (altSections.length === 0) return;

    // Guard against multiple wraps
    if (resEl.querySelector('.phone-alt-accordion')) return;

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

      altSections.forEach(sec => content.appendChild(sec));
      details.appendChild(content);

      resEl.appendChild(details);
    } finally {
      isCollapsingAlt = false;
    }
  }

  /* ------------------------------------------------------------------------
     6. Initialization & Global Event Listeners
     ------------------------------------------------------------------------ */
  function bootPhoneUX() {
    updateCockpitOffset();
    updateSoapBadge();

    if (isPhone()) {
      setupDiabetesSwitcher();
      setupHtnSwitcher();
      collapsePriority3Alternatives();
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
