import { describe, it, expect } from 'vitest';
import { calculate10YrAscvdRisk } from '../src/engines/ascvd';

describe('ACC/AHA 10-Year ASCVD Risk Calculator (PCE)', () => {
  it('calculates low risk for a young non-smoker with optimal lipids and blood pressure', () => {
    const res = calculate10YrAscvdRisk({
      age: 42,
      sex: 'F',
      race: 'white_other',
      tc: 160,
      hdl: 60,
      sbp: 110,
      treatedBp: false,
      smoker: false,
      diabetes: false,
    });

    expect(res.riskScorePercent).toBeLessThan(5.0);
    expect(res.riskCategory).toBe('low');
    expect(res.statinRecommendation.intensity).toBe('none');
  });

  it('calculates high risk (>= 20%) for an older male smoker with diabetes and treated hypertension', () => {
    const res = calculate10YrAscvdRisk({
      age: 66,
      sex: 'M',
      race: 'white_other',
      tc: 240,
      hdl: 36,
      sbp: 152,
      treatedBp: true,
      smoker: true,
      diabetes: true,
    });

    expect(res.riskScorePercent).toBeGreaterThanOrEqual(20.0);
    expect(res.riskCategory).toBe('high');
    expect(res.statinRecommendation.intensity).toBe('high');
    expect(res.statinRecommendation.headlineEn).toContain('High Risk');
  });

  it('calculates borderline risk (5.0% - 7.4%) for 55yo male non-smoker with borderline labs', () => {
    const res = calculate10YrAscvdRisk({
      age: 55,
      sex: 'M',
      race: 'white_other',
      tc: 210,
      hdl: 45,
      sbp: 135,
      treatedBp: false,
      smoker: false,
      diabetes: false,
    });

    expect(res.riskScorePercent).toBe(7.1);
    expect(res.riskCategory).toBe('borderline');
    expect(res.statinRecommendation.intensity).toBe('moderate');
  });

  it('calculates intermediate risk (7.5% - 19.9%) for 60yo male non-smoker with stage 1 HTN', () => {
    const res = calculate10YrAscvdRisk({
      age: 60,
      sex: 'M',
      race: 'white_other',
      tc: 210,
      hdl: 45,
      sbp: 140,
      treatedBp: true,
      smoker: false,
      diabetes: false,
    });

    expect(res.riskScorePercent).toBeGreaterThanOrEqual(7.5);
    expect(res.riskScorePercent).toBeLessThan(20.0);
    expect(res.riskCategory).toBe('intermediate');
    expect(res.statinRecommendation.intensity).toBe('moderate');
  });

  it('handles race-specific coefficients for African American cohorts', () => {
    const whiteRes = calculate10YrAscvdRisk({
      age: 55,
      sex: 'M',
      race: 'white_other',
      tc: 200,
      hdl: 45,
      sbp: 130,
      treatedBp: false,
      smoker: false,
      diabetes: false,
    });

    const blackRes = calculate10YrAscvdRisk({
      age: 55,
      sex: 'M',
      race: 'african_american',
      tc: 200,
      hdl: 45,
      sbp: 130,
      treatedBp: false,
      smoker: false,
      diabetes: false,
    });

    // The two cohort models produce different results reflecting different baseline survival & beta weights
    expect(whiteRes.riskScorePercent).toBeGreaterThan(0);
    expect(blackRes.riskScorePercent).toBeGreaterThan(0);
    expect(whiteRes.riskScorePercent).not.toBe(blackRes.riskScorePercent);
  });

  it('emits a warning when age is outside the 40-79 validation range', () => {
    const youngRes = calculate10YrAscvdRisk({
      age: 32,
      sex: 'M',
      race: 'white_other',
      tc: 180,
      hdl: 50,
      sbp: 120,
      treatedBp: false,
      smoker: false,
      diabetes: false,
    });

    expect(youngRes.warning).toBeDefined();
    expect(youngRes.warning).toContain('40');
  });
});
