/**
 * Direct Printable A4 Prescription & Clinical Consult Report Generator
 * Generates clinical-grade, high-contrast, print-optimized A4 reports
 * Compatible with Capacitor Android PrintManager (Save as PDF & Wi-Fi Printing)
 */

import { PatientState } from '../store/usePatientStore';
import { DoctorSettings, loadSettings } from './exporters';
import { getDrugById } from '../data/formulary';
import { calculateBMI } from './calculators';
import { getDynamicTargets } from './leaflets';
import { generateSVG, buildOfflinePatientQrPayload } from './qr';

export function generatePrintableHtml(
  patient: PatientState,
  settings?: DoctorSettings,
  lang: 'ar' | 'en' = 'ar'
): string {
  const doc = settings || loadSettings();
  const isAr = lang === 'ar';
  const targets = getDynamicTargets(patient);
  const bmi = calculateBMI(patient.wt, patient.ht);

  const dateStr = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Resolve Active Medications from Formulary
  const resolvedMeds = (patient.activeMeds || []).map((medId) => {
    const found = getDrugById(medId);
    if (found) {
      return {
        id: found.id,
        name: isAr ? `${found.genericAr} (${found.tradeNamesAr[0] || found.genericEn})` : `${found.genericEn} (${found.tradeNamesEn[0] || found.genericEn})`,
        dosage: isAr ? found.doseAr : found.doseEn,
        instructions: isAr ? found.renal?.ruleAr || 'تناول الجرعة بانتظام مع كوب ماء' : found.renal?.ruleEn || 'Take regularly with water',
        duration: isAr ? 'شهر واحد (٣٠ يوماً)' : '1 Month (30 Days)',
      };
    }
    return {
      id: medId,
      name: medId,
      dosage: isAr ? 'حسب توجيه الطبيب' : 'As directed',
      instructions: isAr ? 'راجع تعليمات الصيدلي' : 'Follow pharmacist instructions',
      duration: isAr ? 'شهر واحد' : '1 Month',
    };
  });

  // Diagnoses Summary
  const diagnoses: string[] = [];
  if (patient.diabetes || patient.dm) diagnoses.push(isAr ? 'داء السكري من النوع الثاني (T2DM)' : 'Type 2 Diabetes Mellitus');
  if (patient.sbp >= 130 || patient.dbp >= 80 || (patient.activeMeds && patient.activeMeds.some(m => ['ramipril','amlodipine','valsartan'].includes(m)))) {
    diagnoses.push(isAr ? 'ارتفاع ضغط الدم الشرياني (Hypertension)' : 'Essential Hypertension');
  }
  if (patient.ascvd) diagnoses.push(isAr ? 'مرض قلبي وعائي تصلبي مثبت (ASCVD)' : 'Established ASCVD');
  if (patient.uacr >= 30 || patient.egfr < 60) diagnoses.push(isAr ? `اعتلال كلوي مزمن (CKD eGFR: ${patient.egfr})` : `Chronic Kidney Disease (eGFR: ${patient.egfr})`);
  if (patient.hf && patient.hf !== 'none') diagnoses.push(isAr ? 'قصور القلب المزمن (Heart Failure)' : 'Heart Failure');
  if (patient.asthma) diagnoses.push(isAr ? 'الربو الشعبي (Asthma)' : 'Bronchial Asthma');
  if (diagnoses.length === 0) diagnoses.push(isAr ? 'استشارة طبية وفحص دوري' : 'Routine Clinical Consultation');

  // QR code content for offline leaflets
  const qrSummary = buildOfflinePatientQrPayload(patient, targets);
  const qrSvg = generateSVG(qrSummary, { size: 90, margin: 2, darkColor: '#0f172a', lightColor: '#ffffff' });

  return `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>Osrawy Clinical Prescription - ${patient.name || 'Patient'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
      font-size: 12px;
      padding: 8px;
    }
    .header {
      border-bottom: 2px solid #0f766e;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .clinic-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f766e;
    }
    .doctor-meta {
      font-size: 11px;
      color: #334155;
      margin-top: 2px;
    }
    .header-right {
      text-align: ${isAr ? 'left' : 'right'};
      font-size: 11px;
      color: #64748b;
    }
    .patient-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      font-size: 11px;
    }
    .patient-banner strong {
      display: block;
      color: #475569;
      font-size: 10px;
      text-transform: uppercase;
    }
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }
    .vital-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px;
      text-align: center;
      background: #ffffff;
    }
    .vital-label {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .vital-val {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      font-family: monospace;
      margin-top: 2px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f766e;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin: 10px 0 6px 0;
      display: flex;
      justify-content: space-between;
    }
    .diagnosis-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 10px;
    }
    .badge {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: 600;
      color: #1e293b;
    }
    table.rx-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 11px;
    }
    table.rx-table th {
      background: #0f766e;
      color: #ffffff;
      padding: 6px 8px;
      font-weight: 700;
      text-align: ${isAr ? 'right' : 'left'};
      border: 1px solid #0f766e;
      font-size: 10px;
      text-transform: uppercase;
    }
    table.rx-table td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      vertical-align: top;
    }
    table.rx-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .targets-box {
      border: 1px dashed #0f766e;
      background: #f0fdfa;
      border-radius: 6px;
      padding: 6px 10px;
      margin-bottom: 12px;
      font-size: 11px;
      display: flex;
      justify-content: space-between;
    }
    .footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .qr-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .qr-text {
      font-size: 9px;
      color: #64748b;
      max-width: 140px;
      line-height: 1.2;
    }
    .sign-box {
      text-align: center;
      width: 180px;
    }
    .sign-line {
      border-top: 1px solid #334155;
      margin-top: 36px;
      font-size: 10px;
      color: #475569;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="clinic-title">${doc.clinicName || (isAr ? 'عيادة الاستشارات والأمراض المزمنة' : 'Chronic Care Consultation Clinic')}</div>
      <div class="doctor-meta">${doc.doctorName ? `${doc.doctorName} · ` : ''}${doc.doctorTitle || (isAr ? 'طبيب استشاري' : 'Consultant Physician')}</div>
      ${doc.clinicPhone ? `<div class="doctor-meta">📞 ${doc.clinicPhone}</div>` : ''}
    </div>
    <div class="header-right">
      <div><strong>${isAr ? 'التاريخ:' : 'Date:'}</strong> ${dateStr}</div>
      <div><strong>Osrawy Clinical Navigator</strong> · v2.1.0</div>
    </div>
  </div>

  <div class="patient-banner">
    <div>
      <strong>${isAr ? 'اسم المريض' : 'Patient Name'}</strong>
      <span>${patient.name || (isAr ? 'مريض تجريبي' : 'Patient')}</span>
    </div>
    <div>
      <strong>${isAr ? 'العمر / الجنس' : 'Age / Sex'}</strong>
      <span>${patient.age}y · ${patient.sex === 'm' ? (isAr ? 'ذكر' : 'Male') : (isAr ? 'أنثى' : 'Female')}</span>
    </div>
    <div>
      <strong>${isAr ? 'الوزن / الطول' : 'Weight / Height'}</strong>
      <span>${patient.wt} kg · ${patient.ht} cm</span>
    </div>
    <div>
      <strong>BMI</strong>
      <span>${bmi} kg/m²</span>
    </div>
  </div>

  <div class="vitals-grid">
    <div class="vital-box">
      <div class="vital-label">${isAr ? 'ضغط الدم (BP)' : 'Blood Pressure'}</div>
      <div class="vital-val">${patient.sbp}/${patient.dbp}</div>
    </div>
    <div class="vital-box">
      <div class="vital-label">${isAr ? 'التراكمي (A1c)' : 'HbA1c'}</div>
      <div class="vital-val">${patient.a1c}%</div>
    </div>
    <div class="vital-box">
      <div class="vital-label">eGFR (CKD-EPI)</div>
      <div class="vital-val">${patient.egfr}</div>
    </div>
    <div class="vital-box">
      <div class="vital-label">${isAr ? 'K+ (البوتاسيوم)' : 'Serum K+'}</div>
      <div class="vital-val">${patient.k}</div>
    </div>
    <div class="vital-box">
      <div class="vital-label">LDL-C</div>
      <div class="vital-val">${patient.ldlC || '--'}</div>
    </div>
  </div>

  <div class="section-title">
    <span>${isAr ? 'التشخيص السريري وعوامل الخطورة' : 'Clinical Diagnoses & Risk Profile'}</span>
  </div>
  <div class="diagnosis-badges">
    ${diagnoses.map((d) => `<span class="badge">${d}</span>`).join('')}
  </div>

  <div class="section-title">
    <span>${isAr ? 'الوصفة الدوائية المعتمدة (Rx)' : 'Prescription & Active Pharmacotherapy (Rx)'}</span>
    <span style="font-size: 10px; font-weight: normal; color: #475569;">${resolvedMeds.length} ${isAr ? 'أدوية نشطة' : 'Active Drugs'}</span>
  </div>

  <table class="rx-table">
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 35%;">${isAr ? 'اسم الدواء (العلمي والتجاري)' : 'Medication (Generic / Brand)'}</th>
        <th style="width: 25%;">${isAr ? 'الجرعة وطريقة الاستخدام' : 'Dosage & Frequency'}</th>
        <th style="width: 25%;">${isAr ? 'تعليمات وإرشادات سريرية' : 'Clinical Instructions'}</th>
        <th style="width: 10%;">${isAr ? 'المدة' : 'Qty / Dur'}</th>
      </tr>
    </thead>
    <tbody>
      ${
        resolvedMeds.length > 0
          ? resolvedMeds
              .map(
                (m, i) => `
        <tr>
          <td style="font-weight: 700; text-align: center;">${i + 1}</td>
          <td><strong>${m.name}</strong></td>
          <td>${m.dosage}</td>
          <td style="font-size: 10px; color: #334155;">${m.instructions}</td>
          <td style="text-align: center;">${m.duration}</td>
        </tr>`
              )
              .join('')
          : `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 12px;">${isAr ? 'لا توجد أدوية مضافة حالياً في الوصفة' : 'No active medications currently selected'}</td></tr>`
      }
    </tbody>
  </table>

  <div class="targets-box">
    <div><strong>${isAr ? 'الهدف العلاجي للضغط:' : 'Target BP:'}</strong> ${targets.htn.targetBp}</div>
    <div><strong>${isAr ? 'الهدف العلاجي للتراكمي:' : 'Target A1c:'}</strong> ${targets.dm.targetA1c}</div>
    <div><strong>${isAr ? 'الهدف العلاجي للكوليسترول:' : 'Target LDL:'}</strong> ${targets.dlp.targetLdl}</div>
  </div>

  <div class="footer">
    <div class="qr-container">
      <div>${qrSvg}</div>
      <div class="qr-text">
        <strong>${isAr ? 'رمز المريض التفاعلي' : 'Interactive Patient QR'}</strong><br>
        ${isAr ? 'امسح الرمز بكاميرا الجوال لعرض التعليمات ونشرات الطوارئ أوفلاين.' : 'Scan with mobile camera to view offline instructions & sick-day rules.'}
      </div>
    </div>

    <div class="sign-box">
      <div class="sign-line">
        ${isAr ? 'توقيع وختم الطبيب المعالج' : 'Physician Signature & Stamp'}
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function printClinicalReport(
  patient: PatientState,
  settings?: DoctorSettings,
  lang: 'ar' | 'en' = 'ar'
): void {
  const html = generatePrintableHtml(patient, settings, lang);

  // Hidden print iframe approach (works on both Desktop Chrome and Android Capacitor Webview)
  let iframe = document.getElementById('osrawy-print-iframe') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'osrawy-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) {
    const androidPrint = (window as unknown as { AndroidPrint?: { print?: () => void } }).AndroidPrint;
    if (androidPrint && typeof androidPrint.print === 'function') {
      androidPrint.print();
      return;
    }
    window.print();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Allow styles and SVG to layout before calling print
  setTimeout(() => {
    const androidPrint = (window as unknown as { AndroidPrint?: { print?: () => void } }).AndroidPrint;
    if (androidPrint && typeof androidPrint.print === 'function') {
      androidPrint.print();
      return;
    }
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  }, 350);
}
