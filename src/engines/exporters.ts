import { calculateBMI } from './calculators';
import { evaluateSafetyGuardrails } from './safety';
import { evaluateLipidPathway } from './lipids';
import { evaluatePrimaryCare } from './primaryCare';
import { evaluatePregnancyHtnProtocol } from './htn';
import { evaluatePregnancyDmProtocol } from './diabetes';
import { FORMULARY } from '../data/formulary';

export interface DoctorSettings {
  doctorName?: string;
  doctorTitle?: string;
  clinicName?: string;
  clinicPhone?: string;
}

export const DEFAULT_DOCTOR_SETTINGS: DoctorSettings = {
  doctorName: 'د. حسام يوسف / Dr. Hossam Yousuf',
  doctorTitle: 'استشاري طب الأسرة / Consultant Family Medicine',
  clinicName: 'عيادة طب الأسرة والتخصصات الباطنية',
  clinicPhone: '+966 50 000 0000'
};

export function loadSettings(): DoctorSettings {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('osrawy_settings');
      if (saved) return { ...DEFAULT_DOCTOR_SETTINGS, ...JSON.parse(saved) };
    } catch {}
  }
  return DEFAULT_DOCTOR_SETTINGS;
}

export function saveSettings(settings: DoctorSettings): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('osrawy_settings', JSON.stringify(settings));
    } catch {}
  }
}

export function buildPrescriptionReport(lang: 'ar' | 'en' = 'ar', patientOverride?: any, settingsOverride?: DoctorSettings): string {
  const isAr = (lang === 'ar');
  const cfg = settingsOverride || loadSettings();
  const pt = patientOverride || {};
  const bmiCalc = calculateBMI(pt.wt || 70, pt.ht || 170);
  const bmi = bmiCalc ? bmiCalc.bmi : '—';
  const dateStr = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const syncGuardrails = evaluateSafetyGuardrails(pt);
  let lipidReport: any = null;
  try {
    lipidReport = evaluateLipidPathway(pt);
  } catch {}

  let pcReport: any = null;
  try {
    pcReport = evaluatePrimaryCare(pt);
  } catch {}

  const allAlerts = [
    ...syncGuardrails,
    ...(lipidReport?.alerts || []),
    ...(pcReport?.allAlerts || [])
  ];

  let text = '';

  if (isAr) {
    text += `🏥 *${cfg.clinicName || 'عيادة طب الأسرة والتخصصات الباطنية'}*\n`;
    text += `👨‍⚕️ *${cfg.doctorName}*\n`;
    text += `_${cfg.doctorTitle}_\n`;
    if (cfg.clinicPhone) text += `📞 هاتف العيادة: ${cfg.clinicPhone}\n`;
    text += `📅 التاريخ: ${dateStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `👤 *بيانات المريض والعلامات الحيوية:*\n`;
    text += `• الاسم: ${pt.name || 'مريض جديد'} | الجنس: ${pt.sex === 'f' ? 'أنثى' : 'ذكر'} | العمر: ${pt.age || '-'} سنة\n`;
    text += `• الوزن: ${pt.wt || '-'} كجم | الطول: ${pt.ht || '-'} سم | كتلة الجسم (BMI): ${bmi}\n`;
    text += `• ضغط الدم: ${pt.sbp || 148}/${pt.dbp || 94} mmHg | البوتاسيوم: ${pt.k || 4.6} mEq/L\n`;
    text += `• وظائف الكلى (eGFR): ${pt.egfr || '-'} مل/د | زلال البول (UACR): ${pt.uacr || '-'} مجم/جم\n`;
    if (pt.a1c) text += `• السكر التراكمي (HbA1c): ${pt.a1c}% | سكر الصائم: ${pt.fpg || '—'} مجم/dL\n`;
    if (lipidReport) {
      text += `• الدهون: الكلي ${lipidReport.labs.tcMg} | LDL: ${lipidReport.labs.ldlMg} | HDL: ${lipidReport.labs.hdlMg} | TG: ${lipidReport.labs.tgMg} مجم/dL\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `🎯 *الأهداف العلاجية المستهدفة (Targets):*\n`;
    text += `• ضغط الدم المستهدف: أقل من 130/80 mmHg\n`;
    text += `• السكر التراكمي المستهدف: أقل من 7.0% (أو حسب الحالة)\n`;
    if (lipidReport) {
      text += `• الكوليسترول الضار المستهدف: < ${lipidReport.target.ldlTargetMg} مجم/dL (${lipidReport.target.nameAr})\n`;
      text += `• الكوليسترول غير المفيد (Non-HDL): < ${lipidReport.target.nonHdlTargetMg} مجم/dL\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `💊 *الخطة الدوائية المعتمدة (Rx):*\n\n`;

    const activeMedsList: string[] = (pt.activeMeds && pt.activeMeds.length > 0)
      ? pt.activeMeds
      : (pt.meds || pt.currentMeds || pt.medications || []);

    if (activeMedsList.length > 0) {
      text += `🔹 *الأدوية الحالية للمريض (Active Medications):*\n`;
      activeMedsList.forEach((medId, idx) => {
        const drug = FORMULARY.find((f: any) => f.id.toLowerCase() === medId.toLowerCase() || (f.genericEn && f.genericEn.toLowerCase().includes(medId.toLowerCase())));
        if (drug) {
          const brand = drug.tradeNamesAr?.[0] || drug.tradeNamesEn?.[0] || drug.genericAr || drug.genericEn;
          text += `  ${idx + 1}. *${drug.genericAr || drug.genericEn}* (${brand}) - ${drug.doseAr || drug.doseEn}\n`;
        } else {
          text += `  ${idx + 1}. *${medId}*\n`;
        }
      });
      text += `\n`;
    }

    if (pt.pregnancy || pt.preg || pt.pregHtn || pt.postpartum) {
      let htnPreg: any = null;
      let dmPreg: any = null;
      try { htnPreg = evaluatePregnancyHtnProtocol(pt); } catch {}
      try { dmPreg = evaluatePregnancyDmProtocol(pt); } catch {}

      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `🌸 *بروتوكول صحة المرأة والحمل (Women's Health Protocol):*\n`;
      if (pt.postpartum) {
        text += `• الحالة السريرية: رعاية ما بعد الولادة (فترة النفاس - Postpartum)\n`;
      } else {
        text += `• الحالة السريرية: حمل نشط (عمر الحمل: ${pt.gestationalWeeks || 16} أسبوعاً - الثلث ${pt.trimester || 2})\n`;
      }

      if (htnPreg) {
        text += `\n🩺 *خطة علاج الضغط أثناء الحمل والبدائل الآمنة:*\n`;
        if (htnPreg.firstLine) {
          text += `• العلاج المعتمد: ${htnPreg.firstLine.drugNameAr} - ${htnPreg.firstLine.doseAr}\n`;
          text += `• المبرر السريري: ${htnPreg.firstLine.reasonAr}\n`;
        }
        if (htnPreg.aspirinProphylaxis?.indicated) {
          text += `• الوقاية من تسمم الحمل: أسبرين أطفال (81-150 مجم يومياً قبل النوم حتى الأسبوع 36)\n`;
        }
        if (htnPreg.stoppedDrugs?.length) {
          text += `• أدوية محظورة وموقوفة فوراً: ${htnPreg.stoppedDrugs.join('، ')}\n`;
        }
      }

      if (dmPreg) {
        text += `\n🩸 *خطة علاج السكر أثناء الحمل وحساب الإنسولين:*\n`;
        text += `• الأهداف السكرية أثناء الحمل: ${dmPreg.obstetricTargets.fastingLabelAr} | ${dmPreg.obstetricTargets.pp1hrLabelAr} | ${dmPreg.obstetricTargets.pp2hrLabelAr}\n`;
        text += `• جرعة الإنسولين المحسوبة بالوزن: ${dmPreg.insulinDosing.tddUnits} وحدة/يوم (${dmPreg.insulinDosing.multiplier} وحدة/كجم)\n`;
        text += `  - ${dmPreg.insulinDosing.basalRegimenAr}\n`;
        text += `  - ${dmPreg.insulinDosing.prandialRegimenAr}\n`;
        if (dmPreg.folicAcid?.indicated) {
          text += `• حمض الفوليك: جرعة عالية 5 مجم يومياً حتى نهاية الأسبوع 12 من الحمل.\n`;
        }
      }
      text += `\n`;
    }

    if (allAlerts.length > 0) {
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `⚠️ *تنبيهات السلامة الدوائية والموانع (Safety Guardrails):*\n`;
      allAlerts.forEach(a => {
        const icon = a.level === 'critical' ? '🚨' : (a.level === 'warning' ? '⚠️' : '💡');
        text += `${icon} *${a.titleAr || a.titleEn}*\n`;
        text += `   ${a.messageAr || a.messageEn}\n`;
      });
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💡 *إرشادات المريض وسلامة العلاج:*\n`;
    text += `• قاعدة 15 لعلاج هبوط السكر: تناول 15 جرام سكر سريع، استرح 15 دقيقة، وأعد الفحص.\n`;
    text += `• قواعد أيام المرض (SADMANS): أوقف مؤقتاً مدرات البول وأدوية الضغط والسكري عند القيء الشديد أو الجفاف وتواصل مع العيادة.\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_تم إصدار التقرير عبر المنصة السريرية الذكية - Osrawy Clinical Navigator_\n`;
  } else {
    text += `🏥 *${cfg.clinicName || 'Family Medicine & Internal Specialties Clinic'}*\n`;
    text += `👨‍⚕️ *${cfg.doctorName}*\n`;
    text += `_${cfg.doctorTitle}_\n`;
    if (cfg.clinicPhone) text += `📞 Clinic Phone: ${cfg.clinicPhone}\n`;
    text += `📅 Date: ${dateStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `👤 *Patient Profile & Clinical Vitals:*\n`;
    text += `• Name: ${pt.name || 'New Patient'} | Sex: ${pt.sex === 'f' ? 'Female' : 'Male'} | Age: ${pt.age || '-'} years\n`;
    text += `• Weight: ${pt.wt || '-'} kg | Height: ${pt.ht || '-'} cm | BMI: ${bmi}\n`;
    text += `• Blood Pressure: ${pt.sbp || 148}/${pt.dbp || 94} mmHg | Serum K+: ${pt.k || 4.6} mEq/L\n`;
    text += `• Renal Function (eGFR): ${pt.egfr || '-'} mL/min/1.73m² | UACR: ${pt.uacr || '-'} mg/g\n`;
    if (pt.a1c) text += `• Glycated Hemoglobin (HbA1c): ${pt.a1c}% | FPG: ${pt.fpg || '—'} mg/dL\n`;
    if (lipidReport) {
      text += `• Lipid Panel: TC ${lipidReport.labs.tcMg} | LDL-C: ${lipidReport.labs.ldlMg} | HDL-C: ${lipidReport.labs.hdlMg} | TG: ${lipidReport.labs.tgMg} mg/dL\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `🎯 *Clinical Targets & Quality Measures:*\n`;
    text += `• Target Blood Pressure: < 130/80 mmHg\n`;
    text += `• Target HbA1c: < 7.0% (individualized)\n`;
    if (lipidReport) {
      text += `• Target LDL-C: < ${lipidReport.target.ldlTargetMg} mg/dL (${lipidReport.target.nameEn})\n`;
      text += `• Target Non-HDL: < ${lipidReport.target.nonHdlTargetMg} mg/dL\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    text += `💊 *Prescribed Medications & Management Plan (Rx):*\n\n`;

    const activeMedsList: string[] = (pt.activeMeds && pt.activeMeds.length > 0)
      ? pt.activeMeds
      : (pt.meds || pt.currentMeds || pt.medications || []);

    if (activeMedsList.length > 0) {
      text += `🔹 *Active Patient Medications:*\n`;
      activeMedsList.forEach((medId, idx) => {
        const drug = FORMULARY.find((f: any) => f.id.toLowerCase() === medId.toLowerCase() || (f.genericEn && f.genericEn.toLowerCase().includes(medId.toLowerCase())));
        if (drug) {
          const brand = drug.tradeNamesAr?.[0] || drug.tradeNamesEn?.[0] || drug.genericAr || drug.genericEn;
          text += `  ${idx + 1}. *${drug.genericAr || drug.genericEn}* (${brand}) - ${drug.doseAr || drug.doseEn}\n`;
        } else {
          text += `  ${idx + 1}. *${medId}*\n`;
        }
      });
      text += `\n`;
    }

    if (pt.pregnancy || pt.preg || pt.pregHtn || pt.postpartum) {
      let htnPreg: any = null;
      let dmPreg: any = null;
      try { htnPreg = evaluatePregnancyHtnProtocol(pt); } catch {}
      try { dmPreg = evaluatePregnancyDmProtocol(pt); } catch {}

      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `🌸 *Women's Health & Pregnancy Switching Protocol:*\n`;
      if (pt.postpartum) {
        text += `• Clinical Status: Postpartum Care\n`;
      } else {
        text += `• Clinical Status: Active Pregnancy (Gestational Age: ${pt.gestationalWeeks || 16} weeks - Trimester ${pt.trimester || 2})\n`;
      }

      if (htnPreg) {
        text += `\n🩺 *Hypertension in Pregnancy & Switching Strategy:*\n`;
        if (htnPreg.firstLine) {
          text += `• Recommended First-Line: ${htnPreg.firstLine.drugName} - ${htnPreg.firstLine.doseEn}\n`;
          text += `• Clinical Rationale: ${htnPreg.firstLine.reasonEn}\n`;
        }
        if (htnPreg.aspirinProphylaxis?.indicated) {
          text += `• Preeclampsia Prophylaxis: Low-dose Aspirin (81–150 mg/day at bedtime through 36 weeks)\n`;
        }
        if (htnPreg.stoppedDrugs?.length) {
          text += `• Teratogens Stopped: ${htnPreg.stoppedDrugs.join(', ')}\n`;
        }
      }

      if (dmPreg) {
        text += `\n🩸 *Diabetes in Pregnancy & Switching Strategy:*\n`;
        text += `• Obstetric Glycemic Targets: ${dmPreg.obstetricTargets.fastingLabelEn} | ${dmPreg.obstetricTargets.pp1hrLabelEn} | ${dmPreg.obstetricTargets.pp2hrLabelEn}\n`;
        text += `• Calculated Weight-Based Insulin: TDD ${dmPreg.insulinDosing.tddUnits} U/day (${dmPreg.insulinDosing.multiplier} U/kg/day)\n`;
        text += `  - ${dmPreg.insulinDosing.basalRegimenEn}\n`;
        text += `  - ${dmPreg.insulinDosing.prandialRegimenEn}\n`;
        if (dmPreg.folicAcid?.indicated) {
          text += `• Folic Acid: High-dose 5 mg/day orally through week 12 of pregnancy.\n`;
        }
      }
      text += `\n`;
    }

    if (allAlerts.length > 0) {
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `⚠️ *Clinical Safety Guardrails & Drug Precautions:*\n`;
      allAlerts.forEach(a => {
        const icon = a.level === 'critical' ? '🚨' : (a.level === 'warning' ? '⚠️' : '💡');
        text += `${icon} *${a.titleEn}*\n`;
        text += `   ${a.messageEn}\n`;
      });
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💡 *Patient Instructions & Safety Rules:*\n`;
    text += `• Rule of 15 for Hypoglycemia: If feeling shaky or dizzy, take 15g fast carbohydrate (1/2 cup juice) and recheck in 15 minutes.\n`;
    text += `• Sick-Day Rules (SADMANS): Hold SGLT2i, ACEi/ARBs, and diuretics during vomiting or dehydration.\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Issued via Osrawy Clinical Navigator Interactive Multi-Engine Platform_\n`;
  }

  return text;
}

export function buildStructuredSoapNote(patient: any, engines?: { diabetes?: any; htn?: any; lipids?: any; primaryCare?: any }): string {
  const p = patient || {};
  const dateStr = new Date().toISOString().split('T')[0];

  let note = `═══════════════════════════════════════════════════════════════\n`;
  note += `OSRAWY CLINICAL SOAP NOTE · ${dateStr}\n`;
  note += `Patient: ${p.name || 'Anonymous'} · Age: ${p.age || '-'} · Sex: ${p.sex === 'f' ? 'F' : 'M'}\n`;
  note += `═══════════════════════════════════════════════════════════════\n\n`;

  note += `[S] SUBJECTIVE:\n`;
  note += `• Primary complaints & chronic disease follow-up.\n`;
  if (p.smoker) note += `• Active smoker.\n`;
  if (p.ascvd) note += `• Established ASCVD history.\n`;
  if (p.pregnancy) note += `• Active pregnancy (Gestational age: ${p.gestationalWeeks || '-'} weeks).\n`;
  note += `\n`;

  note += `[O] OBJECTIVE:\n`;
  note += `• BP: ${p.sbp || '-'}/${p.dbp || '-'} mmHg | K+: ${p.k || '-'} mEq/L\n`;
  note += `• Weight: ${p.wt || '-'} kg | Height: ${p.ht || '-'} cm\n`;
  note += `• Renal: eGFR ${p.egfr || '-'} mL/min/1.73m² | UACR ${p.uacr || '-'} mg/g\n`;
  if (p.a1c) note += `• Glycemic: HbA1c ${p.a1c}% | FPG ${p.fpg || '-'} mg/dL\n`;
  if (p.tc || p.totalCholesterol) note += `• Lipids: TC ${p.tc || p.totalCholesterol} | LDL ${p.ldlC || p.ldl || '-'} | HDL ${p.hdlC || p.hdl || '-'} | TG ${p.triglycerides || p.tg || '-'}\n`;
  note += `\n`;

  note += `[A] ASSESSMENT:\n`;
  const guardrails = evaluateSafetyGuardrails(p);
  if (guardrails.length > 0) {
    note += `• Safety Alerts:\n`;
    guardrails.forEach(g => {
      note += `  - [${g.level.toUpperCase()}] ${g.titleEn}: ${g.actionEn}\n`;
    });
  }
  if (engines?.lipids?.stratification) {
    note += `• Dyslipidemia: ${engines.lipids.stratification.tier} Risk (LDL Target < ${engines.lipids.target.ldlTargetMg} mg/dL)\n`;
  }
  note += `\n`;

  note += `[P] PLAN:\n`;
  const activeMeds = p.medications || p.activeMeds || [];
  if (activeMeds.length > 0) {
    note += `• Active Medications: ${activeMeds.join(', ')}\n`;
  }
  note += `• Targets: BP < 130/80 mmHg, HbA1c < 7.0%\n`;
  note += `• Follow-up: Repeat labs in 4–12 weeks. Reinforce SADMANS sick-day rules.\n`;

  return note;
}

export function buildWhatsAppShareUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
