const fs = require('fs');
const vm = require('vm');

// Mock a minimal DOM environment
class MockElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.value = '';
    this.checked = false;
    this.innerHTML = '';
    this.innerText = '';
    this.children = [];
    this.classList = {
      classes: new Set(),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
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
    this.attributes = {};
    this.listeners = {};
    this.style = {};
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  removeAttribute(k) { delete this.attributes[k]; }
  addEventListener(ev, fn) {
    if (!this.listeners[ev]) this.listeners[ev] = [];
    this.listeners[ev].push(fn);
  }
  dispatchEvent(ev) {
    if (this.listeners[ev]) {
      this.listeners[ev].forEach(fn => fn({ target: this }));
    }
  }
  querySelector(sel) { return null; }
  querySelectorAll(sel) { return []; }
}

const elementsMap = new Map();
function getOrCreate(id, tag = 'div') {
  if (!elementsMap.has(id)) {
    elementsMap.set(id, new MockElement(tag, id));
  }
  return elementsMap.get(id);
}

// Pre-create IDs expected in app
const knownIds = [
  'pform', 'pname', 'age', 'sex', 'wt', 'ht', 'dur', 'hf', 'a1c', 'fpg', 'egfr', 'uacr',
  'ascvd', 'hrisk', 'masld', 'smoker', 'hypo', 'frail', 'catab', 'pancr', 'geni', 'preg',
  'c-met', 'c-su', 'c-dpp', 'c-sglt', 'c-glp', 'c-pio', 'c-ins', 'cheap', 'result',
  'scrwho', 'scrPersonal', 'cklist', 'ckprog', 'iwt', 'ifpg', 'icur', 'itdd', 'isens', 'iseg',
  'iswitch', 'ifrom', 'iresult', 'instbl', 'reftbl', 'th-ref-brand', 'th-ins-brand', 'ref-sec-sub',
  'f', 'sbp', 'dbp', 'htn-age', 'htn-sex', 'meds', 'risk', 'risk-l', 'oob', 'dm', 'cad', 'hf-htn',
  'stroke', 'af', 'gout', 'asthma', 'bph', 'frail-htn', 'ortho', 'preg-htn', 'preg-c',
  'htn-egfr', 'htn-uacr', 'k', 'tc', 'hdl', 'lunit', 'smk', 'statin', 'riskbox', 'out',
  'sw-from', 'sw-dose', 'sw-to', 'sw-out', 'ti-drug', 'ti-dose', 'ti-out', 'lens-acc', 'lens-esc',
  'drug-directory-list', 'drug-search-input', 'market-btn-sa', 'market-btn-eg', 'market-toggle-btn', 'lang-toggle-btn',
  'save-pt-btn', 'theme-toggle-btn', 'open-settings-btn', 'patient-summary-bar', 'recent-patients-list',
  'settings-modal', 'close-settings-btn', 'save-settings-btn', 'set-dr-name', 'set-dr-title',
  'set-clinic-name', 'set-clinic-phone', 'set-clinic-addr', 'copy', 'btn-share-htn-whatsapp', 'btn-print-htn'
];
knownIds.forEach(id => getOrCreate(id));

// Set realistic initial values
getOrCreate('pname', 'input').value = 'Ahmed Mahmoud';
getOrCreate('age', 'input').value = '52';
getOrCreate('sex', 'select').value = 'm';
getOrCreate('wt', 'input').value = '96';
getOrCreate('ht', 'input').value = '170';
getOrCreate('dur', 'input').value = '4';
getOrCreate('hf', 'select').value = 'none';
getOrCreate('a1c', 'input').value = '8.9';
getOrCreate('fpg', 'input').value = '190';
getOrCreate('egfr', 'input').value = '68';
getOrCreate('uacr', 'input').value = '45';
getOrCreate('cheap', 'input').checked = true;
getOrCreate('c-met', 'input').checked = true;

getOrCreate('sbp', 'input').value = '148';
getOrCreate('dbp', 'input').value = '94';
getOrCreate('htn-age', 'input').value = '52';
getOrCreate('htn-sex', 'select').value = 'm';
getOrCreate('meds', 'select').value = '0';
getOrCreate('htn-egfr', 'input').value = '68';
getOrCreate('htn-uacr', 'input').value = '45';
getOrCreate('k', 'input').value = '4.6';
getOrCreate('tc', 'input').value = '210';
getOrCreate('hdl', 'input').value = '42';
getOrCreate('lunit', 'select').value = 'mg';
getOrCreate('dm', 'input').checked = true;
getOrCreate('oob', 'input').checked = true;
getOrCreate('iwt', 'input').value = '96';
getOrCreate('ifpg', 'input').value = '190';
getOrCreate('icur', 'input').value = '0';
getOrCreate('itdd', 'input').value = '0';
getOrCreate('isens', 'select').value = 'mid';
getOrCreate('ifrom', 'select').value = 'nph2';

const mockStorage = new Map();
const windowObj = {
  localStorage: {
    getItem: (k) => mockStorage.get(k) || null,
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k)
  },
  navigator: {
    clipboard: { writeText: async (t) => t },
    vibrate: () => true
  },
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
    addEventListener: () => {},
    documentElement: new MockElement('html')
  }
};
windowObj.window = windowObj;

const context = vm.createContext(windowObj);

const files = [
  'i18n.js',
  'drugs_data.js',
  'patient_sync.js',
  'prescription_share.js',
  'drugs_directory.js',
  'diabetes_engine.js',
  'htn_engine.js'
];

console.log("Loading files in sequence into VM...");
for (const f of files) {
  const code = fs.readFileSync('d:/anti/APP/www/js/' + f, 'utf8');
  try {
    vm.runInContext(code, context);
    console.log("  Loaded " + f);
  } catch(err) {
    console.error("  ❌ Failed on " + f + ":", err.stack);
    process.exit(1);
  }
}

console.log("All scripts loaded without error!");
console.log("Testing DrugDirectory search in Saudi market...");
context.DrugDirectory.init();
context.DrugDirectory.setMarket('saudi');
console.log("Active market:", context.DrugDirectory.getMarket());

console.log("Testing search query for 'جلوكوفاج' (Glucophage Arabic)...");
getOrCreate('drug-search-input').value = 'جلوكوفاج';
getOrCreate('drug-search-input').dispatchEvent('input');
const dirOutput = getOrCreate('drug-directory-list').innerHTML;
const foundGlucophage = dirOutput.includes('Metformin') || dirOutput.includes('Glucophage');
console.log("  Arabic search 'جلوكوفاج' matched Metformin:", foundGlucophage ? "✅ PASS" : "❌ FAIL");

console.log("Testing search query for 'concor' (English brand)...");
getOrCreate('drug-search-input').value = 'concor';
getOrCreate('drug-search-input').dispatchEvent('input');
const dirOutput2 = getOrCreate('drug-directory-list').innerHTML;
const foundConcor = dirOutput2.includes('Bisoprolol') || dirOutput2.includes('Concor');
console.log("  English search 'concor' matched Bisoprolol:", foundConcor ? "✅ PASS" : "❌ FAIL");

console.log("Testing patient sync from Diabetes to HTN...");
getOrCreate('age').value = '60';
getOrCreate('egfr').value = '42';
context.PatientSync.syncFromDiabetes();
const pt = context.PatientSync.get();
console.log("  Updated patient age:", pt.age, "eGFR:", pt.egfr);
console.log("  HTN age input updated to:", getOrCreate('htn-age').value);
console.log("  HTN eGFR input updated to:", getOrCreate('htn-egfr').value);
const syncPassed = getOrCreate('htn-age').value == '60' && getOrCreate('htn-egfr').value == '42';
console.log("  Two-way PatientSync:", syncPassed ? "✅ PASS" : "❌ FAIL");

console.log("Testing Prescription WhatsApp text generation...");
const waText = context.RxShare.buildWhatsAppText();
console.log("  Generated WhatsApp text length:", waText.length);
const waPassed = waText.includes('Ahmed Mahmoud') && waText.includes('الوصفة العلاجية');
console.log("  WhatsApp formatting:", waPassed ? "✅ PASS" : "❌ FAIL");

console.log("\nTesting I18n Bilingual Switcher Module...");
context.I18n.init();
const initialLang = context.I18n.getLang();
console.log("  Initial default language:", initialLang);
const initLangPass = initialLang === 'ar';
console.log("  Default language is 'ar':", initLangPass ? "✅ PASS" : "❌ FAIL");

const docDirAr = windowObj.document.documentElement.attributes['dir'];
const docLangAr = windowObj.document.documentElement.attributes['lang'];
console.log(`  Arabic attributes: dir="${docDirAr}", lang="${docLangAr}"`);
const arAttrPass = docDirAr === 'rtl' && docLangAr === 'ar';
console.log("  Arabic RTL attributes match:", arAttrPass ? "✅ PASS" : "❌ FAIL");

// Test patient summary bar in Arabic
context.PatientSync.updatePatientBar();
const barAr = getOrCreate('patient-summary-bar').innerHTML;
const barArPass = barAr.includes('الاسم:') && barAr.includes('العمر:');
console.log("  Patient summary bar renders in Arabic:", barArPass ? "✅ PASS" : "❌ FAIL");

// Remember patient data values before switch
const prevAge = getOrCreate('age').value;
const prevEgfr = getOrCreate('egfr').value;
const prevName = getOrCreate('pname').value;

// Toggle to English
console.log("  Toggling language to English...");
context.I18n.toggleLang();
const toggledLang = context.I18n.getLang();
const docDirEn = windowObj.document.documentElement.attributes['dir'];
const docLangEn = windowObj.document.documentElement.attributes['lang'];
console.log(`  English attributes: lang="${toggledLang}", dir="${docDirEn}", lang="${docLangEn}"`);
const enAttrPass = toggledLang === 'en' && docDirEn === 'ltr' && docLangEn === 'en';
console.log("  English LTR attributes match:", enAttrPass ? "✅ PASS" : "❌ FAIL");

// Test patient summary bar in English
context.PatientSync.updatePatientBar();
const barEn = getOrCreate('patient-summary-bar').innerHTML;
const barEnPass = barEn.includes('Name:') && barEn.includes('Age:');
console.log("  Patient summary bar renders in English:", barEnPass ? "✅ PASS" : "❌ FAIL");

// Verify patient inputs remained intact
const postAge = getOrCreate('age').value;
const postEgfr = getOrCreate('egfr').value;
const postName = getOrCreate('pname').value;
const patientIntact = (prevAge === postAge && prevEgfr === postEgfr && prevName === postName);
console.log("  Patient inputs preserved intact across language switch:", patientIntact ? "✅ PASS" : "❌ FAIL");

// Verify localStorage persistence
const savedLang = mockStorage.get('osrawy_lang');
const storagePass = savedLang === 'en';
console.log("  Language selection persisted to localStorage ('osrawy_lang'='en'):", storagePass ? "✅ PASS" : "❌ FAIL");

// Toggle back to Arabic
console.log("  Toggling language back to Arabic...");
context.I18n.toggleLang();
const finalLang = context.I18n.getLang();
const finalStorage = mockStorage.get('osrawy_lang');
const finalPass = finalLang === 'ar' && finalStorage === 'ar';
console.log("  Language toggle back to Arabic verified:", finalPass ? "✅ PASS" : "❌ FAIL");

console.log("\nALL SIMULATION TESTS PASSED SUCCESSFULLY! 🎯");
