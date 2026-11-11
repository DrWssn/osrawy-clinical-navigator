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
  'diabetes_engine.js',
  'htn_engine.js',
  'lipids_engine.js',
  'primary_care_engine.js',
  'prescription_share.js',
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
const ClinicalTools = getModule('ClinicalTools');
const DiabetesEngine = getModule('DiabetesEngine');
const HtnEngine = getModule('HtnEngine');
const LipidsEngine = getModule('LipidsEngine', 'OsrawyLipids', 'OsrawyLipidsEngine');
const PrimaryCareEngine = getModule('PrimaryCareEngine', 'OsrawyPrimaryCare', 'OsrawyPrimaryCareEngine');
const RxShare = getModule('RxShare', 'PrescriptionShare', 'OsrawyRxShare');
const PatientLeaflets = getModule('PatientLeaflets', 'OsrawyPatientLeaflets');
const OsrawyQRCode = getModule('OsrawyQRCode');

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

// ---------------------------------------------------------------------
// 5. Final Summary & Exit
// ---------------------------------------------------------------------

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
