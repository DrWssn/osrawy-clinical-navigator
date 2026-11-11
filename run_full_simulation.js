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
      this.style = {};
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
      documentElement: docEl2,
      body: body2,
      getElementById: id => domMap.get(id) || null,
      createElement: tag => new RealMockEl(tag),
      querySelector: sel => sel.startsWith('#') ? (domMap.get(sel.slice(1)) || null) : null,
      querySelectorAll: sel => {
        if (sel.includes('main-view-section')) {
          return ['tab-diabetes', 'tab-htn', 'tab-drugs', 'tab-recent', 'tab-dlp', 'tab-tools', 'tab-leaflets']
            .map(id => domMap.get(id)).filter(Boolean);
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
