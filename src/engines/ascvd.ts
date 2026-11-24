/**
 * ACC/AHA 10-Year ASCVD Risk Estimator
 * Based on the 2013/2018/2019 ACC/AHA Prevention Guidelines
 * Pooled Cohort Equations (Goff DC Jr, et al. Circulation. 2014)
 */

export type AscvdRace = 'white_other' | 'african_american';
export type AscvdSex = 'M' | 'F';
export type AscvdRiskCategory = 'low' | 'borderline' | 'intermediate' | 'high';

export interface AscvdInput {
  age: number; // 40 - 79
  sex: AscvdSex;
  race: AscvdRace;
  tc: number; // Total Cholesterol in mg/dL (130 - 320)
  hdl: number; // HDL Cholesterol in mg/dL (20 - 100)
  sbp: number; // Systolic BP in mmHg (90 - 200)
  treatedBp: boolean;
  smoker: boolean;
  diabetes: boolean;
}

export interface AscvdResult {
  riskScorePercent: number; // e.g. 14.8
  riskCategory: AscvdRiskCategory;
  statinRecommendation: {
    intensity: 'none' | 'moderate' | 'high';
    headlineAr: string;
    headlineEn: string;
    detailsAr: string;
    detailsEn: string;
  };
  warning?: string;
}

export function calculate10YrAscvdRisk(input: AscvdInput): AscvdResult {
  // Clamp variables within physiological Pooled Cohort Equations limits for numerical stability
  const rawAge = Number(input.age) || 50;
  const age = Math.min(79, Math.max(40, rawAge));
  const tc = Math.min(320, Math.max(130, Number(input.tc) || 200));
  const hdl = Math.min(100, Math.max(20, Number(input.hdl) || 50));
  const sbp = Math.min(200, Math.max(90, Number(input.sbp) || 120));

  const lnAge = Math.log(age);
  const lnTc = Math.log(tc);
  const lnHdl = Math.log(hdl);
  const lnSbp = Math.log(sbp);

  const isTreated = Boolean(input.treatedBp);
  const isSmoker = Boolean(input.smoker);
  const hasDm = Boolean(input.diabetes);
  const isMale = input.sex === 'M';
  const isBlack = input.race === 'african_american';

  let linearPredictor = 0;
  let meanXb = 0;
  let baselineSurvival = 0.9;

  if (isMale) {
    if (isBlack) {
      // African American Men
      baselineSurvival = 0.8954;
      meanXb = 19.54;
      linearPredictor =
        2.469 * lnAge +
        0.302 * lnTc -
        0.307 * lnHdl +
        (isTreated ? 1.916 * lnSbp : 1.809 * lnSbp) +
        (isSmoker ? 0.549 : 0) +
        (hasDm ? 0.645 : 0);
    } else {
      // White / Other Men
      baselineSurvival = 0.9144;
      meanXb = 61.18;
      linearPredictor =
        12.344 * lnAge +
        11.853 * lnTc -
        2.664 * lnAge * lnTc -
        7.990 * lnHdl +
        1.769 * lnAge * lnHdl +
        (isTreated ? 1.797 * lnSbp : 1.764 * lnSbp) +
        (isSmoker ? 7.837 - 1.795 * lnAge : 0) +
        (hasDm ? 0.658 : 0);
    }
  } else {
    // Females
    if (isBlack) {
      // African American Women
      baselineSurvival = 0.9533;
      meanXb = 86.61;
      linearPredictor =
        17.114 * lnAge +
        0.940 * lnTc -
        18.920 * lnHdl +
        4.475 * lnAge * lnHdl +
        (isTreated
          ? 29.291 * lnSbp - 6.432 * lnAge * lnSbp
          : 27.820 * lnSbp - 6.087 * lnAge * lnSbp) +
        (isSmoker ? 0.691 : 0) +
        (hasDm ? 0.874 : 0);
    } else {
      // White / Other Women
      baselineSurvival = 0.9665;
      meanXb = -29.18;
      linearPredictor =
        -29.799 * lnAge +
        4.884 * (lnAge * lnAge) +
        13.540 * lnTc -
        3.114 * lnAge * lnTc -
        13.578 * lnHdl +
        3.149 * lnAge * lnHdl +
        (isTreated ? 2.019 * lnSbp : 1.857 * lnSbp) +
        (isSmoker ? 7.574 - 1.665 * lnAge : 0) +
        (hasDm ? 0.661 : 0);
    }
  }

  const individualDiff = linearPredictor - meanXb;
  const rawRisk = 1 - Math.pow(baselineSurvival, Math.exp(individualDiff));
  const riskScorePercent = Math.round(Math.min(100, Math.max(0, rawRisk * 100)) * 10) / 10;

  let riskCategory: AscvdRiskCategory = 'low';
  let intensity: 'none' | 'moderate' | 'high' = 'none';
  let headlineAr = '';
  let headlineEn = '';
  let detailsAr = '';
  let detailsEn = '';

  if (riskScorePercent < 5.0) {
    riskCategory = 'low';
    intensity = 'none';
    headlineAr = 'خطورة منخفضة (< 5.0%)';
    headlineEn = 'Low Risk (< 5.0%)';
    detailsAr = 'التركيز على تعديل نمط الحياة والنظام الغذائي وممارسة الرياضة؛ الستاتين غير موصى به روتينياً إلا عند ارتفاع LDL ≥190 مجم.';
    detailsEn = 'Emphasize lifestyle modifications (diet, exercise). Statin therapy is generally not recommended unless LDL-C ≥ 190 mg/dL.';
  } else if (riskScorePercent < 7.5) {
    riskCategory = 'borderline';
    intensity = 'moderate';
    headlineAr = 'خطورة حدية (5.0% - 7.4%)';
    headlineEn = 'Borderline Risk (5.0% - 7.4%)';
    detailsAr = 'ناقش بدء ستاتين متوسط الشدة إذا توفرت عوامل معززة للخطورة (تاريخ عائلي مبكر، متلازمة أيض، زلال بولي، أو تكلس تاجي CAC >0).';
    detailsEn = 'Discuss moderate-intensity statin if risk-enhancing factors are present (family history, metabolic syndrome, CKD, or CAC score > 0).';
  } else if (riskScorePercent < 20.0) {
    riskCategory = 'intermediate';
    intensity = 'moderate';
    headlineAr = 'خطورة متوسطة (7.5% - 19.9%)';
    headlineEn = 'Intermediate Risk (7.5% - 19.9%)';
    detailsAr = 'يُوصى ببدء ستاتين متوسط الشدة لخفض الكوليسترول الضار بنسبة 30% إلى 49% (أتورفاستاتين 10-20 مجم أو روسوفاستاتين 5-10 مجم).';
    detailsEn = 'Moderate-intensity statin recommended to reduce LDL-C by 30% to 49% (Atorvastatin 10–20 mg or Rosuvastatin 5–10 mg daily).';
  } else {
    riskCategory = 'high';
    intensity = 'high';
    headlineAr = 'خطورة عالية (≥ 20.0%)';
    headlineEn = 'High Risk (≥ 20.0%)';
    detailsAr = 'يُوصى ببدء ستاتين عالي الشدة فوراً لخفض الكوليسترول الضار بنسبة ≥ 50% (أتورفاستاتين 40-80 مجم أو روسوفاستاتين 20-40 مجم).';
    detailsEn = 'High-intensity statin recommended immediately to achieve ≥ 50% LDL-C reduction (Atorvastatin 40–80 mg or Rosuvastatin 20–40 mg daily).';
  }

  let warning: string | undefined;
  if (rawAge < 40 || rawAge > 79) {
    warning = rawAge < 40 
      ? 'العمر أقل من 40 سنة (خارج النطاق المعتمد لمعادلة PCE 40-79). الحساب تقريبي استرشادي.'
      : 'العمر أكبر من 79 سنة (خارج النطاق المعتمد لمعادلة PCE 40-79). الحساب تقريبي استرشادي.';
  }

  return {
    riskScorePercent,
    riskCategory,
    statinRecommendation: {
      intensity,
      headlineAr,
      headlineEn,
      detailsAr,
      detailsEn,
    },
    warning,
  };
}
