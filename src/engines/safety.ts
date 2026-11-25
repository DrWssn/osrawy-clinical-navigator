export interface GuardrailAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  engine: string;
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  actionEn: string;
  actionAr: string;
  msgEn?: string;
  msgAr?: string;
  severity?: 'critical' | 'warning' | 'info';
  sourceEngine?: string;
  removeMedId?: string;
  text?: string;
  message?: string;
  msg?: string;
  title?: string;
}

export interface DrugClassDefinition {
  id: string;
  nameEn: string;
  nameAr: string;
  drugs: string[];
}

export const DRUG_CLASSES: Record<string, DrugClassDefinition> = {
  biguanide: { id: 'biguanide', nameEn: 'Biguanide (Metformin)', nameAr: 'بيجوانيد (ميتفورمين)', drugs: ['met', 'metformin'] },
  su: { id: 'su', nameEn: 'Sulfonylurea', nameAr: 'سلفونيل يوريا', drugs: ['gliclazide', 'glimepiride'] },
  tzd: { id: 'tzd', nameEn: 'Thiazolidinedione', nameAr: 'ثيازوليدينديون', drugs: ['pio'] },
  sglt2i: { id: 'sglt2i', nameEn: 'SGLT2 inhibitor', nameAr: 'مثبطات SGLT2', drugs: ['dapa', 'empa', 'dapagliflozin', 'empagliflozin'] },
  dpp4i: { id: 'dpp4i', nameEn: 'DPP-4 inhibitor', nameAr: 'مثبطات DPP-4', drugs: ['sita', 'vilda', 'lina', 'sitagliptin'] },
  glp1ra: { id: 'glp1ra', nameEn: 'GLP-1 receptor agonist', nameAr: 'محفزات مستقبلات GLP-1', drugs: ['sema', 'osema', 'tirz', 'dula', 'lira'] },
  insulin: { id: 'insulin', nameEn: 'Insulin', nameAr: 'إنسولين', drugs: ['nph', 'glarg'] },
  acei: { id: 'acei', nameEn: 'ACE inhibitor', nameAr: 'مثبطات الإنزيم المحول للأنجيوتنسين', drugs: ['perindopril', 'ramipril', 'coveram', 'lisinopril', 'enalapril', 'captopril'] },
  arb: { id: 'arb', nameEn: 'Angiotensin Receptor Blocker (ARB)', nameAr: 'حاصرات مستقبلات الأنجيوتنسين', drugs: ['valsartan', 'losartan', 'telmisartan', 'candesartan', 'irbesartan', 'exforge', 'twynsta'] },
  ccb: { id: 'ccb', nameEn: 'Calcium Channel Blocker (CCB)', nameAr: 'حاصرات قنوات الكالسيوم', drugs: ['amlodipine'] },
  thiazide: { id: 'thiazide', nameEn: 'Thiazide / Thiazide-like diuretic', nameAr: 'مدرات البول الثيازيدية', drugs: ['indapamide', 'hydrochlorothiazide'] },
  bb: { id: 'bb', nameEn: 'Beta-blocker', nameAr: 'حاصرات بيتا', drugs: ['bisoprolol', 'labetalol', 'metoprolol', 'atenolol', 'propranolol'] },
  mra: { id: 'mra', nameEn: 'Mineralocorticoid Receptor Antagonist (MRA)', nameAr: 'مضادات مستقبلات القشرانيات المعدنية', drugs: ['spironolactone', 'eplerenone'] },
  statin: { id: 'statin', nameEn: 'Statin (HMG-CoA Reductase Inhibitor)', nameAr: 'مركبات الستاتين المخفضة للكوليسترول', drugs: ['atorva', 'rosuva', 'atorvastatin', 'rosuvastatin', 'simvastatin'] },
  fibrate: { id: 'fibrate', nameEn: 'Fibrate (PPAR-alpha agonist)', nameAr: 'مجموعة الفايبريت لخفض الدهون الثلاثية', drugs: ['fenofibrate', 'gemfibrozil'] },
  ezetimibe: { id: 'ezetimibe', nameEn: 'Cholesterol Absorption Inhibitor', nameAr: 'إيزيتيميب (مانع امتصاص الكوليسترول)', drugs: ['ezetimibe'] },
  pcsk9i: { id: 'pcsk9i', nameEn: 'PCSK9 Inhibitor', nameAr: 'مثبطات بروتين PCSK9', drugs: ['evolocumab', 'alirocumab'] }
};

function parseNumOr(val: unknown, fallback: number): number {
  if (val === undefined || val === null || val === '') return fallback;
  const n = parseFloat(String(val));
  return isNaN(n) ? fallback : n;
}

export function evaluateSafetyGuardrails(state: any): GuardrailAlert[] {
  const p = state || {};
  const alerts: GuardrailAlert[] = [];
  const egfrRaw = p.egfr;
  const egfr = (egfrRaw === undefined || egfrRaw === null)
    ? 90
    : (egfrRaw === '' ? 0 : (Number.isFinite(Number(egfrRaw)) ? Number(egfrRaw) : 0));
  const k = parseNumOr(p.k, 0);

  const medsRaw =
    Array.isArray(p.meds) ? p.meds :
    Array.isArray(p.activeMeds) ? p.activeMeds :
    Array.isArray(p.currentMeds) ? p.currentMeds :
    Array.isArray(p.medications) ? p.medications :
    [];
  const meds: string[] = medsRaw.map((m: unknown) => String(m).toLowerCase().trim());

  const tokenMatches = (med: string, token: string): boolean => {
    const t = token.toLowerCase();
    if (t.length <= 3) {
      return med === t || med.startsWith(`${t}_`) || med.startsWith(`${t}-`) || med.endsWith(`_${t}`) || med.endsWith(`-${t}`);
    }
    return med.includes(t);
  };

  const hasDrug = (name: string) => meds.some(m => tokenMatches(m, name));
  const hasClass = (clsKey: string) => {
    if (!DRUG_CLASSES[clsKey]) return false;
    return DRUG_CLASSES[clsKey].drugs.some(d => meds.some(m => tokenMatches(m, d)));
  };

  function addAlert(a: GuardrailAlert) {
    a.msgEn = a.msgEn || a.messageEn;
    a.msgAr = a.msgAr || a.messageAr;
    a.severity = a.severity || a.level;
    a.sourceEngine = a.sourceEngine || a.engine;
    a.text = `${a.titleEn}: ${a.messageEn} | ${a.titleAr}: ${a.messageAr}`;
    a.message = `${a.messageEn} | ${a.messageAr}`;
    a.msg = a.messageEn;
    a.title = a.titleEn;
    alerts.push(a);
  }

  // 1. Metformin Renal Guardrails
  const onMetformin =
    meds.some(m => m === 'met' || m.includes('metformin') || m.includes('glucophage') || m.includes('cidophage')) ||
    hasClass('biguanide');
  const isDiabetic = !!(p.diabetes || p.dm);

  if (egfr < 30) {
    if (onMetformin) {
      addAlert({
        id: 'guardrail-metformin-crit',
        level: 'critical',
        engine: 'diabetes',
        removeMedId: 'metformin',
        titleEn: 'Critical Alert: Metformin Contraindicated (eGFR < 30)',
        titleAr: 'تنبيه حرج: الميتفورمين ممنوع تماماً (eGFR < 30)',
        messageEn: `eGFR is ${egfr} mL/min/1.73m². Metformin carries a life-threatening risk of fatal lactic acidosis when eGFR < 30. Discontinue metformin immediately. Contraindicated in severe CKD.`,
        messageAr: `معدل الترشيح الكبيبي eGFR هو ${egfr} مل/دقيقة. يُحظر استخدام الميتفورمين تماماً لخطر الحماض اللبني (حمض اللاكتيك lactic acidosis) المميت. أوقف الميتفورمين فوراً.`,
        actionEn: 'Discontinue Metformin immediately and consider alternative agents.',
        actionAr: 'أوقف الميتفورمين فوراً واستبدله ببدائل آمنة كلوياً.'
      });
    } else if (isDiabetic) {
      addAlert({
        id: 'guardrail-metformin-avoid-info',
        level: 'info',
        engine: 'diabetes',
        titleEn: 'Renal Note: Avoid Initiating Metformin (eGFR < 30)',
        titleAr: 'ملاحظة كلوية: يُتجنب بدء الميتفورمين (eGFR < 30)',
        messageEn: `eGFR is ${egfr} mL/min/1.73m². Metformin is contraindicated if initiated at eGFR < 30 due to lactic acidosis risk. Prefer SGLT2i (if eGFR ≥ 20), GLP-1 RA, or renal-adjusted DPP-4i.`,
        messageAr: `معدل الترشيح الكبيبي eGFR هو ${egfr} مل/دقيقة. يُمنع بدء الميتفورمين عند انخفاض التصفية تحت 30 لتفادي خطر الحماض اللبني.`,
        actionEn: 'Do not initiate Metformin; select renally safe glycemic therapy.',
        actionAr: 'لا تبدأ الميتفورمين واختر بدائل آمنة للكلى.'
      });
    }
  } else if (egfr >= 30 && egfr < 45) {
    if (onMetformin) {
      addAlert({
        id: 'guardrail-metformin-warn',
        level: 'warning',
        engine: 'diabetes',
        titleEn: 'Renal Dose Guardrail: Metformin 1000 mg/day Cap (eGFR 30–44)',
        titleAr: 'تنبيه كلوي: الحد الأقصى للميتفورمين 1000 مجم/يوم (eGFR 30–44)',
        messageEn: `eGFR is ${egfr} mL/min/1.73m² (Stage G3b). Dose cap: Metformin dose must not exceed 1000 mg/day (500 mg twice daily). Do not initiate new therapy at this stage.`,
        messageAr: `معدل الترشيح الكبيبي eGFR هو ${egfr} مل/دقيقة. الجرعة القصوى (cap) للميتفورمين هي 1000 مجم/يوم (500 مجم مرتين مع الوجبات). لا تبدأ علاجاً جديداً.`,
        actionEn: 'Cap Metformin dose at 1000 mg/day and monitor renal function every 3 months.',
        actionAr: 'قلص جرعة الميتفورمين إلى 1000 مجم/يوم وراقب وظائف الكلى كل 3 أشهر.'
      });
    } else if (isDiabetic) {
      addAlert({
        id: 'guardrail-metformin-cap-info',
        level: 'info',
        engine: 'diabetes',
        titleEn: 'Renal Note: Do Not Initiate Metformin (eGFR 30–44)',
        titleAr: 'ملاحظة كلوية: لا يُنصح ببدء الميتفورمين (eGFR 30–44)',
        messageEn: `eGFR is ${egfr} mL/min/1.73m² (Stage G3b). Guidelines advise against initiating Metformin when eGFR < 45; if already established, cap at 1000 mg/day.`,
        messageAr: `معدل الترشيح الكبيبي ${egfr} مل/دقيقة. لا يُنصح ببدء الميتفورمين إذا كان eGFR أقل من 45، والحد الأقصى عند الاستمرار 1000 مجم/يوم.`,
        actionEn: 'Prefer SGLT2i or GLP-1 RA over starting Metformin at Stage G3b.',
        actionAr: 'يفضل استخدام SGLT2i أو GLP-1 RA بدلاً من بدء الميتفورمين.'
      });
    }
  }

  // 2. Dual RAAS Blockade (ACEi + ARB/ARNI) & Duplicate ARB + ARNI
  const isArniMed = (m: string) =>
    m.includes('sacubitril') || m.includes('entresto') || tokenMatches(m, 'arni');
  const pureArbMeds = meds.filter(m => !isArniMed(m));
  const ARB_PURE_TOKENS = ['valsartan', 'losartan', 'telmisartan', 'candesartan', 'irbesartan', 'exforge', 'twynsta'];
  const hasAcei = !!p.acei || hasClass('acei') || meds.some(m => m === 'ace' || m === 'acei' || m.includes('ace_i')) || hasDrug('perindopril') || hasDrug('ramipril') || hasDrug('lisinopril') || hasDrug('enalapril') || hasDrug('coveram');
  const hasArni = !!p.arni || meds.some(isArniMed);
  const hasPureArb =
    !!p.arb ||
    pureArbMeds.some(
      m => tokenMatches(m, 'arb') || tokenMatches(m, 'arbs') || ARB_PURE_TOKENS.some(t => tokenMatches(m, t))
    );
  if (hasAcei && (hasPureArb || hasArni)) {
    addAlert({
      id: 'guardrail-dual-raas',
      level: 'critical',
      engine: 'htn',
      titleEn: 'Contraindication: Dual RAAS Blockade (ACEi + ARB/ARNI)',
      titleAr: 'موانع استخدام حرجة: الجمع بين مثبطات ACE وحاصرات ARB/ARNI (ازدواج)',
      messageEn: 'Dual RAAS blockade (ACE inhibitor + ARB or ARNI) is contraindicated: provides no cardiovascular benefit and substantially increases risk of severe hyperkalemia, acute kidney injury (AKI), angioedema, and syncope. Discontinue one immediately.',
      messageAr: 'يُمنع منعاً باتاً الجمع المزدوج بين (ACEi و ARB أو ARNI) لعدم وجود فائدة قلبية مع خطر شديد من الفشل الكلوي الحاد والوذمة الوعائية وارتفاع البوتاسيوم القاتل.',
      actionEn: 'Discontinue either ACEi or ARB/ARNI immediately; maintain single RAAS blockade.',
      actionAr: 'أوقف أحدهما فوراً واكتفِ بنوع واحد فقط من حاصرات الرينين أنجيوتنسين.'
    });
  }
  if (hasPureArb && hasArni) {
    addAlert({
      id: 'guardrail-arb-arni-dup-crit',
      level: 'critical',
      engine: 'htn',
      titleEn: 'Contraindication: Duplicate ARB + ARNI Therapy',
      titleAr: 'موانع استخدام حرجة: تكرار علاج ARB مع ARNI',
      messageEn: 'Simultaneous ARB and ARNI (Sacubitril/Valsartan already contains Valsartan) is contraindicated: duplicates angiotensin receptor blockade and increases risks of severe hypotension, hyperkalemia, and acute kidney injury. Stop the separate ARB immediately.',
      messageAr: 'يُمنع الجمع المتزامن بين حاصر ARB ودواء ARNI (ساكوبتريل/فالسارتان يحتوي بالفعل على فالسارتان) لتكراره الحصار الدوائي ورفعه خطر هبوط الضغط الحاد وفرط البوتاسيوم والقصور الكلوي. أوقف حاصر ARB المنفصل فوراً.',
      actionEn: 'Discontinue the separate ARB immediately; do not co-administer with Sacubitril/Valsartan.',
      actionAr: 'أوقف حاصر ARB المنفصل فوراً ولا تجمع بينه وبين ساكوبتريل/فالسارتان.'
    });
  }

  // 3. Hyperkalemia (K+ Guardrails)
  if (k >= 5.5) {
    addAlert({
      id: 'guardrail-hyperkalemia-crit',
      level: 'critical',
      engine: 'htn',
      titleEn: `Critical Alert: Severe Hyperkalemia (K+ = ${k} mEq/L)`,
      titleAr: `تنبيه حرج: ارتفاع حاد في البوتاسيوم (K+ = ${k} mEq/L)`,
      messageEn: `Serum potassium is ${k} mEq/L (≥ 5.5). Life-threatening arrhythmia risk! Immediately discontinue/hold ACEi, ARB, and MRA (Spironolactone). Recheck urgent ECG and serum electrolytes.`,
      messageAr: `نسبة البوتاسيوم في الدم ${k} mEq/L (≥ 5.5). خطر اضطراب نظم القلب القاتل! أوقف فوراً مثبطات ACEi و ARB والسبيرونولاكتون (MRA) واطلب تخطيط قلب فوري.`,
      actionEn: 'Stop RAAS inhibitors and MRA immediately; order urgent stat ECG and repeat K+.',
      actionAr: 'أوقف فوراً أدوية الضغط المسببة لارتفاع البوتاسيوم واطلب تخطيط قلب فوري.'
    });
  } else if (k > 5.0) {
    addAlert({
      id: 'guardrail-hyperkalemia-warn',
      level: 'warning',
      engine: 'htn',
      titleEn: `Warning: Elevated Potassium (K+ = ${k} mEq/L) - Avoid MRA`,
      titleAr: `تحذير: ارتفاع البوتاسيوم (K+ = ${k}) - تجنب السبيرونولاكتون (MRA)`,
      messageEn: `Serum potassium is ${k} mEq/L (> 5.0). Precaution: Avoid initiating or up-titrating MRA (Spironolactone/Eplerenone). Exercise caution with ACEi/ARB and monitor electrolytes within 1–2 weeks.`,
      messageAr: `نسبة البوتاسيوم ${k} mEq/L. تجنب بدء أو زيادة جرعة السبيرونولاكتون (MRA). توخّ الحذر مع أدوية الضغط وراقب البوتاسيوم بعد أسبوع إلى أسبوعين.`,
      actionEn: 'Avoid MRA initiation/titration; recheck K+ and renal profile in 1-2 weeks.',
      actionAr: 'تجنب أدوية MRA وأعد فحص وظائف الكلى والبوتاسيوم بعد 1-2 أسبوع.'
    });
  }

  // 4. Pregnancy Teratogenicity
  if (p.pregnancy || p.preg || p.pregHtn) {
    addAlert({
      id: 'guardrail-pregnancy-teratogen',
      level: 'critical',
      engine: 'multidisciplinary',
      titleEn: 'Teratogenic Alert: Pregnancy / Planning Pregnancy - Stop RAAS / SGLT2i / Statins',
      titleAr: 'تنبيه تشوه الأجنة: الحمل أو التخطيط للحمل - إيقاف أدوية الضغط والستاتين',
      messageEn: 'Pregnancy detected: Stop ACEi, ARB, MRA, SGLT2i, and Statins immediately! Contraindicated due to fetal renal dysgenesis, skull hypoplasia, and perinatal death (FDA Category D/X teratogenicity). Switch HTN to Labetalol, Methyldopa, or Nifedipine; switch DM to Insulin.',
      messageAr: 'تنبيه الحمل: أوقف فوراً أدوية (ACEi, ARB, MRA, SGLT2i, Statins)! ممنوع تماماً ومحظر لتسببه بتشوهات مميتة للكلى الجنينية وتكلس العظام. أدوية الضغط الآمنة للحمل: ميثيل دوبا، لابيتاول، أو نيفيديبين. علاج السكر الآمن: الإنسولين.',
      actionEn: 'Switch HTN to Labetalol/Methyldopa; switch DM to Insulin; discontinue Statins/SGLT2i immediately.',
      actionAr: 'حوّل علاج الضغط إلى لابيتاول أو ميثيل دوبا، وعلاج السكر للإنسولين، وأوقف الستاتين فوراً.'
    });
  }

  // 5. Cross-Engine Organ Protection Recommendation
  const hasCkd = egfr < 60 || (parseFloat(p.uacr) >= 30);
  const hasHf = p.hf && p.hf !== 'none' && p.hf !== false;
  if ((hasCkd || hasHf) && egfr >= 20 && !p.pregnancy && !p.preg && !p.pregHtn) {
    addAlert({
      id: 'guardrail-sglt2-organ-protect',
      level: 'info',
      engine: 'cardiorenal',
      titleEn: 'Cardio-Renal Organ Protection: SGLT2 Inhibitor Indicated',
      titleAr: 'حماية الأعضاء الحيوية: توصية بمثبطات SGLT2 لحماية الكلى والقلب',
      messageEn: `Patient has CKD (eGFR ${egfr}, UACR ${p.uacr ?? 30} mg/g) and/or Heart Failure with eGFR ≥ 20. SGLT2 inhibitor (Dapagliflozin 10mg or Empagliflozin 10mg) is strongly recommended for renal protection, organ protection, slowing CKD progression, and reducing cardiovascular events.`,
      messageAr: `المريض لديه اعتلال كلوي أو قصور قلب مع وظائف كلى eGFR ≥ 20. يُوصى بشدة ببدء مثبطات SGLT2 (داباجليفلوزين 10 مجم أو إمباجليفلوزين 10 مجم) لحماية الكلى والأعضاء وخفض الوفيات.`,
      actionEn: 'Add SGLT2i (Dapagliflozin 10mg or Empagliflozin 10mg daily) for cardiorenal protection.',
      actionAr: 'أضف مثبط SGLT2 (داباجليفلوزين 10 مجم أو إمباجليفلوزين 10 مجم يومياً).'
    });
  }

  return alerts;
}
