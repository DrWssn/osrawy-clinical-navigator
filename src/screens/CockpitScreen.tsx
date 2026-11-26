import React, { useMemo, useState } from 'react';
import {
  Activity,
  HeartPulse,
  Droplets,
  ShieldAlert,
  CheckCircle2,
  PlusCircle,
  AlertTriangle,
  ArrowRight,
  Stethoscope,
  Calculator,
  ClipboardList,
  Pill,
  Sparkles,
  FileText
} from 'lucide-react';
import { usePatientStore } from '../store/usePatientStore';
import { useAppStore } from '../store/useAppStore';
import { ChipToggle } from '../components/ui/ChipToggle';
import {
  evaluateGeneralDmPlan,
  evaluateScreening,
  classifyBp,
  evaluateLipidPathway,
  evaluateKdigoMatrix,
  evaluatePrimaryCare,
  getDynamicTargets,
  calculate10YrAscvdRisk,
  calculateFib4
} from '../engines';
import { getDrugById, getDrugSafetyStatus, FormularyDrug } from '../data/formulary';

interface NextStepCard {
  id: string;
  domainEn: string;
  domainAr: string;
  status: 'active' | 'start' | 'stop' | 'cap' | 'caution';
  titleEn: string;
  titleAr: string;
  rationaleEn: string;
  rationaleAr: string;
  drug?: FormularyDrug;
  safetyReasonEn?: string;
  safetyReasonAr?: string;
  isContraindicated?: boolean;
  onJump: () => void;
}

const HTN_MED_TOKENS = [
  'perindopril', 'ramipril', 'lisinopril', 'enalapril', 'valsartan', 'losartan',
  'telmisartan', 'sacubitril', 'amlodipine', 'indapamide', 'bisoprolol',
  'spironolactone', 'labetalol', 'nifedipine', 'methyldopa'
];

function isMedInActive(activeMeds: string[], medId: string): boolean {
  const target = medId.toLowerCase();
  return activeMeds.some(m => {
    const clean = m.toLowerCase().trim();
    return clean === target || (target.length > 4 && clean.includes(target));
  });
}

export const CockpitScreen: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const bmi = usePatientStore(s => s.bmi);
  const setField = usePatientStore(s => s.setField);
  const toggleMedication = usePatientStore(s => s.toggleMedication);

  const navigateTo = useAppStore(s => s.navigateTo);
  const pushOverlay = useAppStore(s => s.pushOverlay);
  const lang = useAppStore(s => s.lang);
  const isAr = lang === 'ar';

  const [fibAst, setFibAst] = useState<string>('');
  const [fibPlt, setFibPlt] = useState<string>('');
  const [showQuickFib, setShowQuickFib] = useState(false);

  const targets = useMemo(() => getDynamicTargets(patient), [patient]);
  const bpClass = useMemo(() => classifyBp(patient.sbp, patient.dbp), [patient.sbp, patient.dbp]);
  const lipidPathway = useMemo(() => evaluateLipidPathway(patient), [patient]);
  const kdigo = useMemo(() => evaluateKdigoMatrix(patient.egfr, patient.uacr), [patient.egfr, patient.uacr]);
  const dmPlan = useMemo(() => evaluateGeneralDmPlan(patient), [patient]);
  const dmScreening = useMemo(() => evaluateScreening(patient), [patient]);
  const pcReport = useMemo(() => evaluatePrimaryCare(patient), [patient]);

  const hasTreatedBp = useMemo(
    () => patient.activeMeds.some(m => HTN_MED_TOKENS.some(t => m.toLowerCase().includes(t))),
    [patient.activeMeds]
  );

  const ascvd10Yr = useMemo(() => {
    if (patient.age < 40 || patient.age > 79) return null;
    try {
      return calculate10YrAscvdRisk({
        age: patient.age,
        sex: patient.sex === 'f' ? 'F' : 'M',
        race: 'white_other',
        tc: patient.tc || patient.totalCholesterol,
        hdl: patient.hdl || patient.hdlC,
        lipidUnit: patient.lipidUnit,
        sbp: patient.sbp,
        treatedBp: hasTreatedBp,
        smoker: patient.smoker,
        diabetes: Boolean(patient.diabetes || patient.dm)
      });
    } catch {
      return null;
    }
  }, [patient, hasTreatedBp]);

  const quickFibResult = useMemo(() => {
    const astNum = parseFloat(fibAst);
    const pltNum = parseFloat(fibPlt);
    if (!astNum || !pltNum || astNum <= 0 || pltNum <= 0) return null;
    return calculateFib4(patient.age, astNum, patient.altUl || 28, pltNum);
  }, [fibAst, fibPlt, patient.age, patient.altUl]);

  // Synthesize prioritized Next Best Step recommendations
  const nextSteps = useMemo<NextStepCard[]>(() => {
    const list: NextStepCard[] = [];

    // 1. Diabetes plan actions (uses exact item.drugId)
    if (patient.dm || patient.diabetes) {
      for (const item of dmPlan) {
        const drug = item.drugId ? getDrugById(item.drugId) : undefined;
        const safety = drug ? getDrugSafetyStatus(drug, patient) : undefined;
        const alreadyActive = drug ? isMedInActive(patient.activeMeds, drug.id) : false;

        list.push({
          id: `step-${item.id}`,
          domainEn: 'Diabetes',
          domainAr: 'السكري',
          status:
            item.action === 'stop'
              ? 'stop'
              : item.action === 'cap'
                ? 'cap'
                : alreadyActive || item.action === 'active'
                  ? 'active'
                  : 'start',
          titleEn: item.titleEn,
          titleAr: item.titleAr,
          rationaleEn: item.rationaleEn,
          rationaleAr: item.rationaleAr,
          drug,
          safetyReasonEn: safety?.reasonEn,
          safetyReasonAr: safety?.reasonAr,
          isContraindicated: safety?.status === 'contraindicated',
          onJump: () => navigateTo('crm', 'dm')
        });
      }
    }

    // 2. Lipid / ASCVD pathway action
    if (!patient.pregnancy && !lipidPathway.gap.isAtTarget) {
      const targetDrugId = !lipidPathway.onStatin
        ? 'atorvastatin'
        : !lipidPathway.onEzetimibe
          ? 'ezetimibe'
          : undefined;
      const drug = targetDrugId ? getDrugById(targetDrugId) : undefined;
      const safety = drug ? getDrugSafetyStatus(drug, patient) : undefined;
      const alreadyActive = drug ? isMedInActive(patient.activeMeds, drug.id) : false;

      if (drug) {
        list.push({
          id: `step-lipid-${drug.id}`,
          domainEn: 'Lipids',
          domainAr: 'الدهون',
          status: alreadyActive ? 'active' : 'start',
          titleEn: !lipidPathway.onStatin
            ? 'Start Statin Therapy (Atorvastatin 40 mg)'
            : 'Add Ezetimibe 10 mg to Close LDL Gap',
          titleAr: !lipidPathway.onStatin
            ? 'بدء علاج الستاتين (أتورفاستاتين 40 مجم)'
            : 'إضافة إيزيتيميب 10 مجم للوصول لهدف الكوليسترول',
          rationaleEn: `Current LDL ${lipidPathway.isMmol ? `${lipidPathway.labs.ldlMmol} mmol/L` : `${lipidPathway.labs.ldlMg} mg/dL`} exceeds ${lipidPathway.stratification.tierDetails.nameEn} target.`,
          rationaleAr: `الكوليسترول الضار الحالي (${lipidPathway.isMmol ? `${lipidPathway.labs.ldlMmol} mmol/L` : `${lipidPathway.labs.ldlMg} mg/dL`}) يتجاوز الهدف العلاجي المطلوب.`,
          drug,
          safetyReasonEn: safety?.reasonEn,
          safetyReasonAr: safety?.reasonAr,
          isContraindicated: safety?.status === 'contraindicated',
          onJump: () => navigateTo('crm', 'dlp')
        });
      }
    }

    // 3. Primary Care (Asthma, COPD, Thyroid)
    if (patient.asthma) {
      const asthma = pcReport.asthma;
      const drug = getDrugById('budesonide_formoterol');
      const safety = drug ? getDrugSafetyStatus(drug, patient) : undefined;
      const activeMart = drug ? isMedInActive(patient.activeMeds, drug.id) : false;

      if (asthma.controlLevel !== 'well_controlled' || asthma.sabaPerWk >= 3 || asthma.canistersPerYr >= 3) {
        list.push({
          id: 'step-pc-asthma-mart',
          domainEn: 'Asthma',
          domainAr: 'الربو',
          status: activeMart ? 'active' : 'start',
          titleEn: `GINA Track 1 MART (Step ${asthma.recommendedStep})`,
          titleAr: `مسار الربو GINA MART (الخطوة ${asthma.recommendedStep})`,
          rationaleEn: asthma.recommendationEn,
          rationaleAr: asthma.recommendationAr,
          drug,
          safetyReasonEn: safety?.reasonEn,
          safetyReasonAr: safety?.reasonAr,
          isContraindicated: safety?.status === 'contraindicated',
          onJump: () => navigateTo('pc', 'asthma')
        });
      }
    }

    if (patient.copd && pcReport.copd.group !== 'A') {
      const drug = getDrugById('tiotropium');
      const safety = drug ? getDrugSafetyStatus(drug, patient) : undefined;
      const activeLama = drug ? isMedInActive(patient.activeMeds, drug.id) : false;

      list.push({
        id: 'step-pc-copd-lama',
        domainEn: 'COPD',
        domainAr: 'السدة الرئوية',
        status: activeLama ? 'active' : 'start',
        titleEn: `COPD GOLD Group ${pcReport.copd.group} — Bronchodilator Foundation`,
        titleAr: `السدة الرئوية المجموعة ${pcReport.copd.group} — موسع قصبات أساسي`,
        rationaleEn: pcReport.copd.primaryRxEn,
        rationaleAr: pcReport.copd.primaryRxAr,
        drug,
        safetyReasonEn: safety?.reasonEn,
        safetyReasonAr: safety?.reasonAr,
        isContraindicated: safety?.status === 'contraindicated',
        onJump: () => navigateTo('pc', 'copd')
      });
    }

    const thyroid = pcReport.thyroid;
    if (thyroid.status === 'central_hypo') {
      list.push({
        id: 'step-pc-thyroid-central',
        domainEn: 'Thyroid',
        domainAr: 'الغدة الدرقية',
        status: 'caution',
        titleEn: 'Suspected Central Hypothyroidism — Check 8 AM Cortisol First',
        titleAr: 'اشتباه قصور درقي مركزي — افحص كورتيزول الصباح أولاً',
        rationaleEn: thyroid.rxEn,
        rationaleAr: thyroid.rxAr,
        onJump: () => navigateTo('pc', 'thyroid')
      });
    } else if (thyroid.status === 'overt_hypo' || (thyroid.status === 'subclinical_hypo' && patient.tsh >= 10)) {
      const drug = getDrugById('levothyroxine');
      const safety = drug ? getDrugSafetyStatus(drug, patient) : undefined;
      const activeLt4 = drug ? isMedInActive(patient.activeMeds, drug.id) : false;

      list.push({
        id: 'step-pc-thyroid-lt4',
        domainEn: 'Thyroid',
        domainAr: 'الغدة الدرقية',
        status: activeLt4 ? 'active' : 'start',
        titleEn: `Levothyroxine ~${thyroid.recommendedDose} mcg/day`,
        titleAr: `بدء ليفوثيروكسين ~${thyroid.recommendedDose} ميكروجرام/يوم`,
        rationaleEn: thyroid.rxEn,
        rationaleAr: thyroid.rxAr,
        drug,
        safetyReasonEn: safety?.reasonEn,
        safetyReasonAr: safety?.reasonAr,
        isContraindicated: safety?.status === 'contraindicated',
        onJump: () => navigateTo('pc', 'thyroid')
      });
    }

    // Prioritize urgent stops/cautions & unstarted interventions before already-active maintenance
    const priorityRank = { stop: 0, caution: 1, cap: 2, start: 3, active: 4 };
    return list.sort((a, b) => priorityRank[a.status] - priorityRank[b.status]);
  }, [patient, dmPlan, lipidPathway, pcReport, navigateTo]);

  // Gap-in-Care & Screening Nudges
  const careGaps = useMemo(() => {
    const gaps: Array<{
      id: string;
      badgeEn: string;
      badgeAr: string;
      titleEn: string;
      titleAr: string;
      detailEn: string;
      detailAr: string;
      onOpen: () => void;
    }> = [];

    if (patient.dm || patient.diabetes) {
      const flatItems = dmScreening.flatMap(g => g.items);
      const keyIds = ['screen-ckd', 'screen-eye', 'screen-foot'];
      for (const id of keyIds) {
        const found = flatItems.find(i => i.id === id);
        if (found) {
          gaps.push({
            id: `gap-${found.id}`,
            badgeEn: found.freqEn,
            badgeAr: found.freqAr,
            titleEn: found.nameEn,
            titleAr: found.nameAr,
            detailEn: found.dueReasonEn,
            detailAr: found.dueReasonAr,
            onOpen: () => navigateTo('crm', 'dm')
          });
        }
      }
    }

    if (ascvd10Yr && !patient.ascvd) {
      gaps.push({
        id: 'gap-ascvd-10yr',
        badgeEn: `${ascvd10Yr.riskScorePercent}% (${ascvd10Yr.riskCategory.toUpperCase()})`,
        badgeAr: `${ascvd10Yr.riskScorePercent}% (${ascvd10Yr.riskCategory === 'high' ? 'عالي' : ascvd10Yr.riskCategory === 'intermediate' ? 'متوسط' : ascvd10Yr.riskCategory === 'borderline' ? 'حدي' : 'منخفض'})`,
        titleEn: '10-Year ASCVD Pooled Cohort Risk',
        titleAr: 'تقييم خطورة أمراض الشرايين خلال 10 سنوات',
        detailEn: ascvd10Yr.statinRecommendation.headlineEn,
        detailAr: ascvd10Yr.statinRecommendation.headlineAr,
        onOpen: () => navigateTo('crm', 'dlp')
      });
    }

    const bmiNum = parseFloat(String(bmi)) || 0;
    if (patient.dm || patient.diabetes || bmiNum >= 25 || patient.altUl > 35) {
      gaps.push({
        id: 'gap-masld-fib4',
        badgeEn: 'AASLD / ADA',
        badgeAr: 'فحص الكبد الدهني',
        titleEn: 'MASLD Liver Fibrosis Screening (FIB-4)',
        titleAr: 'فحص تليف الكبد الدهني (مؤشر FIB-4)',
        detailEn: `Recommended for T2DM or BMI ≥ 25 (BMI ${bmi}, ALT ${patient.altUl} U/L). Enter AST & Platelets to stratify fibrosis risk.`,
        detailAr: `مُوصى به لمرضى السكري أو زيادة الوزن (BMI ${bmi}، ALT ${patient.altUl}). أدخل AST والصفائح لحساب المؤشر.`,
        onOpen: () => navigateTo('tools', 'fib4')
      });
    }

    for (const alert of pcReport.allAlerts) {
      gaps.push({
        id: `gap-pc-${alert.id}`,
        badgeEn: alert.sourceEngine?.toUpperCase() || 'PRIMARY CARE',
        badgeAr: 'الرعاية الأولية',
        titleEn: alert.titleEn,
        titleAr: alert.titleAr,
        detailEn: alert.actionEn || alert.messageEn,
        detailAr: alert.actionAr || alert.messageAr,
        onOpen: () =>
          navigateTo(
            'pc',
            alert.sourceEngine === 'copd' ? 'copd' : alert.sourceEngine === 'thyroid' ? 'thyroid' : 'asthma'
          )
      });
    }

    return gaps;
  }, [patient, dmScreening, ascvd10Yr, bmi, pcReport, navigateTo]);

  const rawName = (patient.name || '').trim();
  const displayName = !rawName || rawName === 'New Patient' ? (isAr ? 'مريض جديد' : 'New Patient') : rawName;

  const ldlDisplay = lipidPathway.isMmol
    ? `${lipidPathway.labs.ldlMmol} mmol/L`
    : `${lipidPathway.labs.ldlMg} mg/dL`;
  const ldlTargetDisplay = lipidPathway.isMmol
    ? `< ${lipidPathway.target.ldlTargetMmol} mmol/L`
    : `< ${lipidPathway.target.ldlTargetMg} mg/dL`;

  const bpDanger = bpClass.colorClass === 'badge-danger';
  const bpWarn = bpClass.colorClass === 'badge-warning';

  const quickJumps = [
    { id: 'qj-dm', labelEn: 'Diabetes', labelAr: 'السكري', icon: <Activity className="w-4 h-4" />, onClick: () => navigateTo('crm', 'dm') },
    { id: 'qj-htn', labelEn: 'Hypertension', labelAr: 'ضغط الدم', icon: <HeartPulse className="w-4 h-4" />, onClick: () => navigateTo('crm', 'htn') },
    { id: 'qj-dlp', labelEn: 'Lipids', labelAr: 'الدهون', icon: <Droplets className="w-4 h-4" />, onClick: () => navigateTo('crm', 'dlp') },
    { id: 'qj-asthma', labelEn: 'Asthma', labelAr: 'الربو', icon: <Stethoscope className="w-4 h-4" />, onClick: () => navigateTo('pc', 'asthma') },
    { id: 'qj-copd', labelEn: 'COPD', labelAr: 'السدة الرئوية', icon: <Stethoscope className="w-4 h-4" />, onClick: () => navigateTo('pc', 'copd') },
    { id: 'qj-thyroid', labelEn: 'Thyroid', labelAr: 'الغدة الدرقية', icon: <Sparkles className="w-4 h-4" />, onClick: () => navigateTo('pc', 'thyroid') },
    { id: 'qj-tools', labelEn: 'Clinical Tools', labelAr: 'الأدوات السريرية', icon: <Calculator className="w-4 h-4" />, onClick: () => navigateTo('tools', 'kdigo') },
    { id: 'qj-patient', labelEn: 'Patient Hub', labelAr: 'بوابة المريض', icon: <FileText className="w-4 h-4" />, onClick: () => navigateTo('patient') },
    { id: 'qj-drugs', labelEn: 'Formulary', labelAr: 'دليل الأدوية', icon: <Pill className="w-4 h-4" />, onClick: () => navigateTo('drugs') },
    { id: 'qj-soap', labelEn: 'SOAP / Rx', labelAr: 'ملاحظة SOAP', icon: <ClipboardList className="w-4 h-4" />, onClick: () => pushOverlay('soap-sheet') },
  ];

  return (
    <div className="flex flex-col gap-3 p-3 max-w-5xl mx-auto pb-24 animate-in fade-in duration-150">
      {/* 1. Visit Context Header + Frailty Quick Toggle */}
      <section className="p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] shadow-sm flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">
              {isAr ? 'لوحة قيادة الزيارة السريرية' : 'Visit Clinical Cockpit'}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-[var(--text)] truncate">
              {displayName}{' '}
              <span className="text-xs font-normal text-[var(--muted)]">
                · <bdi dir="ltr">{patient.age}{patient.sex.toUpperCase()}</bdi> · BMI <bdi dir="ltr">{bmi}</bdi>
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ChipToggle
              label={isAr ? 'وهن صحي / أهداف مرنة' : 'Frail / Relaxed Targets'}
              checked={patient.frail}
              onChange={(c) => setField('frail', c)}
              variant="warning"
            />
            {patient.pregnancy && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)]">
                {isAr ? `حمل (T${patient.thyroidTrimester || patient.trimester || 1})` : `Pregnancy (T${patient.thyroidTrimester || patient.trimester || 1})`}
              </span>
            )}
            <button
              type="button"
              onClick={() => pushOverlay('vitals-drawer')}
              className="px-3 py-1.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] hover:bg-line/40 active:scale-95 transition-all"
            >
              {isAr ? 'تعديل المؤشرات' : 'Edit Vitals'}
            </button>
          </div>
        </div>
      </section>

      {/* 2. 4-Domain Target Snapshot */}
      <section aria-label={isAr ? 'ملخص الأهداف السريرية' : '4-Domain Target Snapshot'}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* HbA1c */}
          <button
            type="button"
            onClick={() => navigateTo('crm', 'dm')}
            className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--primary)] text-start transition-all active:scale-[0.98] flex flex-col gap-1"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-[var(--muted)] uppercase">HbA1c</span>
              {targets.isElderlyOrFrail && (
                <span className="px-1.5 py-0.5 rounded bg-[var(--warn-bg)] text-[var(--warn-text)] text-[9px] font-bold">
                  {isAr ? 'هدف مرن' : 'Frail Goal'}
                </span>
              )}
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-[var(--text)]" dir="ltr">
              {targets.dm.currentA1c}
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              {isAr ? 'الهدف:' : 'Goal:'}{' '}
              <bdi dir="ltr" className="font-semibold text-[var(--primary)]">{targets.dm.targetA1c}</bdi>
            </div>
          </button>

          {/* Blood Pressure */}
          <button
            type="button"
            onClick={() => navigateTo('crm', 'htn')}
            className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--primary)] text-start transition-all active:scale-[0.98] flex flex-col gap-1"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-[var(--muted)] uppercase">
                {isAr ? 'ضغط الدم' : 'BP'}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  bpDanger
                    ? 'bg-[var(--danger-bg)] text-[var(--danger-text)]'
                    : bpWarn
                      ? 'bg-[var(--warn-bg)] text-[var(--warn-text)]'
                      : 'bg-[var(--safe-bg)] text-[var(--safe-text)]'
                }`}
              >
                {isAr ? bpClass.labelAr : bpClass.labelEn}
              </span>
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-[var(--text)]" dir="ltr">
              {patient.sbp}/{patient.dbp}
            </div>
            <div className="text-[11px] text-[var(--muted)] truncate">
              {isAr ? 'الهدف:' : 'Goal:'}{' '}
              <bdi dir="ltr" className="font-semibold text-[var(--primary)]">
                {isAr ? (targets.htn.targetBpAr || targets.htn.targetBp) : targets.htn.targetBp}
              </bdi>
            </div>
          </button>

          {/* LDL-C */}
          <button
            type="button"
            onClick={() => navigateTo('crm', 'dlp')}
            className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--primary)] text-start transition-all active:scale-[0.98] flex flex-col gap-1"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-[var(--muted)] uppercase">LDL-C</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold truncate max-w-[95px] ${
                  lipidPathway.gap.isAtTarget
                    ? 'bg-[var(--safe-bg)] text-[var(--safe-text)]'
                    : 'bg-[var(--warn-bg)] text-[var(--warn-text)]'
                }`}
              >
                {isAr ? lipidPathway.stratification.tierDetails.nameAr : lipidPathway.stratification.tierDetails.nameEn}
              </span>
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-[var(--text)]" dir="ltr">
              {ldlDisplay}
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              {isAr ? 'الهدف:' : 'Goal:'}{' '}
              <bdi dir="ltr" className="font-semibold text-[var(--primary)]">{ldlTargetDisplay}</bdi>
            </div>
          </button>

          {/* eGFR / KDIGO */}
          <button
            type="button"
            onClick={() => navigateTo('tools', 'kdigo')}
            className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--primary)] text-start transition-all active:scale-[0.98] flex flex-col gap-1"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-[var(--muted)] uppercase">eGFR / KDIGO</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  kdigo.color === 'red'
                    ? 'bg-[var(--danger-bg)] text-[var(--danger-text)]'
                    : kdigo.color === 'orange' || kdigo.color === 'yellow'
                      ? 'bg-[var(--warn-bg)] text-[var(--warn-text)]'
                      : 'bg-[var(--safe-bg)] text-[var(--safe-text)]'
                }`}
              >
                {kdigo.stage} · {isAr ? kdigo.riskLabelAr : kdigo.riskLabelEn}
              </span>
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-[var(--text)]" dir="ltr">
              {patient.egfr} <span className="text-xs font-normal text-[var(--muted)]">mL/min</span>
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              UACR <bdi dir="ltr" className="font-semibold text-[var(--text)]">{patient.uacr} mg/g</bdi>
            </div>
          </button>
        </div>
      </section>

      {/* Main Responsive 2-Column Area on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* 3. Next Best Step Recommendations */}
        <section className="lg:col-span-7 p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[var(--primary)]" />
              <h2 className="text-sm font-bold text-[var(--text)]">
                {isAr ? 'الخطوة العلاجية التالية ذات الأولوية' : 'Next Best Step Recommendations'}
              </h2>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--surface2)] text-[var(--muted)]">
              {nextSteps.length}
            </span>
          </div>

          {nextSteps.length === 0 ? (
            <div className="p-5 text-center text-xs text-[var(--muted)] bg-[var(--surface2)] rounded-xl border border-dashed border-[var(--line)]">
              {isAr ? 'لا توجد تدخلات عاجلة معلّقة لهذا الملف.' : 'No pending priority interventions for this profile.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {nextSteps.map((step) => {
                const isActive = step.drug ? isMedInActive(patient.activeMeds, step.drug.id) : step.status === 'active';
                const statusBadge =
                  step.status === 'stop'
                    ? { bg: 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]', label: isAr ? 'إيقاف ⚠️' : 'Stop ⚠️' }
                    : step.status === 'caution' || step.status === 'cap'
                      ? { bg: 'bg-[var(--warn-bg)] text-[var(--warn-text)] border-[var(--warn-border)]', label: isAr ? 'تعديل / حذر ⚠️' : 'Cap / Caution ⚠️' }
                      : isActive
                        ? { bg: 'bg-[var(--safe-bg)] text-[var(--safe-text)] border-[var(--safe-border)]', label: isAr ? 'نشط ✓' : 'Already Active ✓' }
                        : { bg: 'bg-[var(--info-bg)] text-[var(--info-text)] border-[var(--info-border)]', label: isAr ? 'بدء / إضافة ➕' : 'Start / Add ➕' };

                return (
                  <div
                    key={step.id}
                    className="p-3 rounded-xl border border-[var(--line)] bg-surface2/60 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--line)] text-[10px] font-bold text-[var(--muted)]">
                          {isAr ? step.domainAr : step.domainEn}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={step.onJump}
                        className="text-[11px] font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-0.5 shrink-0"
                      >
                        <span>{isAr ? 'التفاصيل' : 'Open'}</span>
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    </div>

                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[var(--text)]">
                        {isAr ? step.titleAr : step.titleEn}
                      </h3>
                      <p className="text-[11px] text-[var(--muted)] leading-relaxed mt-0.5">
                        {isAr ? step.rationaleAr : step.rationaleEn}
                      </p>
                    </div>

                    {step.safetyReasonEn && (
                      <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[var(--warn-bg)] text-[var(--warn-text)] border border-[var(--warn-border)]">
                        {isAr ? step.safetyReasonAr : step.safetyReasonEn}
                      </div>
                    )}

                    {step.drug && (
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="text-[11px] text-[var(--muted)] truncate">
                          {isAr ? step.drug.genericAr : step.drug.genericEn} · {isAr ? step.drug.doseAr : step.drug.doseEn}
                        </span>

                        {step.isContraindicated && !isActive ? (
                          <span className="px-2.5 py-1 rounded-lg bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)] text-[11px] font-bold shrink-0">
                            {isAr ? 'ممنوع سريرياً' : 'Contraindicated'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleMedication(step.drug!.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all shrink-0 ${
                              isActive
                                ? step.status === 'stop'
                                  ? 'bg-[#DC2626] text-white'
                                  : 'bg-[var(--safe-bg)] text-[var(--safe-text)] border border-[var(--safe-border)]'
                                : 'bg-[var(--primary)] text-[var(--on-primary)] shadow-sm'
                            }`}
                          >
                            {isActive ? (
                              step.status === 'stop' ? (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'إيقاف من الوصفة' : 'Remove from Rx'}</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'مضاف للوصفة ✓' : 'In Active Rx ✓'}</span>
                                </>
                              )
                            ) : (
                              <>
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>{isAr ? 'اعتماد وإضافة للوصفة' : 'Accept & Add to Rx'}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. Gap-in-Care & Screening Nudges */}
        <section className="lg:col-span-5 p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text)]">
              {isAr ? 'فجوات الرعاية والفحوصات الوقائية' : 'Care Gaps & Screening Nudges'}
            </h2>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--surface2)] text-[var(--muted)]">
              {careGaps.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {careGaps.map((gap) => (
              <div
                key={gap.id}
                className="p-2.5 rounded-xl border border-[var(--line)] bg-surface2/60 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--text)]">
                    {isAr ? gap.titleAr : gap.titleEn}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--info-bg)] text-[var(--info-text)] border border-[var(--info-border)] text-[10px] font-bold shrink-0">
                    {isAr ? gap.badgeAr : gap.badgeEn}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  {isAr ? gap.detailAr : gap.detailEn}
                </p>
                <div className="flex items-center justify-between pt-0.5">
                  {gap.id === 'gap-masld-fib4' ? (
                    <button
                      type="button"
                      onClick={() => setShowQuickFib(v => !v)}
                      className="text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--text)]"
                    >
                      {showQuickFib
                        ? (isAr ? 'إخفاء الحاسبة السريعة' : 'Hide Quick FIB-4')
                        : (isAr ? 'حساب FIB-4 سريع' : 'Quick FIB-4 Check')}
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={gap.onOpen}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline"
                  >
                    <span>{isAr ? 'فتح القسم' : 'Open Domain'}</span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </button>
                </div>

                {gap.id === 'gap-masld-fib4' && showQuickFib && (
                  <div className="mt-1 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        dir="ltr"
                        value={fibAst}
                        onChange={(e) => setFibAst(e.target.value)}
                        placeholder="AST (U/L)"
                        className="h-8 px-2 text-xs font-mono rounded-lg border border-[var(--line)] bg-[var(--input-bg)] text-[var(--text)]"
                      />
                      <input
                        type="number"
                        dir="ltr"
                        value={fibPlt}
                        onChange={(e) => setFibPlt(e.target.value)}
                        placeholder="Platelets (10⁹/L)"
                        className="h-8 px-2 text-xs font-mono rounded-lg border border-[var(--line)] bg-[var(--input-bg)] text-[var(--text)]"
                      />
                    </div>
                    {quickFibResult && (
                      <div className="text-[11px] font-semibold text-[var(--text)]">
                        FIB-4: <bdi dir="ltr" className="font-mono">{quickFibResult.score}</bdi> ·{' '}
                        {isAr ? quickFibResult.riskLabelAr : quickFibResult.riskLabelEn}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 5. Quick-Jump Cards */}
      <section className="p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] shadow-sm">
        <h2 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2.5">
          {isAr ? 'الوصول السريع للأقسام والأدوات' : 'Quick-Jump Clinical Modules'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {quickJumps.map((qj) => (
            <button
              key={qj.id}
              type="button"
              onClick={qj.onClick}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--line)] bg-surface2/70 hover:bg-[var(--surface2)] hover:border-[var(--primary)] text-start transition-all active:scale-95"
            >
              <span className="text-[var(--primary)] shrink-0">{qj.icon}</span>
              <span className="text-xs font-semibold text-[var(--text)] truncate">
                {isAr ? qj.labelAr : qj.labelEn}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
