import React, { useState, useMemo } from 'react';
import { Wind, Activity, Sparkles, PlusCircle, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { usePatientStore } from '../store/usePatientStore';
import { useAppStore, PcSubTab } from '../store/useAppStore';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { NumericField } from '../components/ui/NumericField';
import { ChipToggle } from '../components/ui/ChipToggle';
import { AlertBanner } from '../components/ui/AlertBanner';
import { evaluateAsthmaGina, evaluateCopdGold, evaluateThyroid } from '../engines/primaryCare';
import { getDrugById, getDrugSafetyStatus, FormularyDrug } from '../data/formulary';

function isMedActive(activeMeds: string[], id: string): boolean {
  const target = id.toLowerCase();
  return activeMeds.some(m => {
    const clean = m.toLowerCase().trim();
    return clean === target || (target.length > 4 && clean.includes(target));
  });
}

export const PrimaryCareScreen: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const setField = usePatientStore(s => s.setField);
  const toggleMedication = usePatientStore(s => s.toggleMedication);

  const pcSubTab = useAppStore(s => s.pcSubTab);
  const setPcSubTab = useAppStore(s => s.setPcSubTab);
  const lang = useAppStore(s => s.lang);
  const market = useAppStore(s => s.market);
  const isAr = lang === 'ar';

  const [asthmaStep, setAsthmaStep] = useState<number>(2);
  const [asthmaTrack, setAsthmaTrack] = useState<1 | 2>(1);

  const asthmaRes = useMemo(
    () => evaluateAsthmaGina({ ...patient, currentStep: asthmaStep, preferredTrack: asthmaTrack }),
    [patient, asthmaStep, asthmaTrack]
  );
  const copdRes = useMemo(() => evaluateCopdGold(patient), [patient]);
  const thyroidRes = useMemo(() => evaluateThyroid(patient), [patient]);

  const renderRxCard = (
    drugId: string,
    opts?: { blockReasonEn?: string; blockReasonAr?: string; cautionNoteEn?: string; cautionNoteAr?: string }
  ) => {
    const drug: FormularyDrug | undefined = getDrugById(drugId);
    if (!drug) return null;

    const safety = getDrugSafetyStatus(drug, patient);
    const active = isMedActive(patient.activeMeds, drug.id);
    const isBlocked = Boolean(opts?.blockReasonEn || safety.status === 'contraindicated');
    const blockMsg = isAr
      ? (opts?.blockReasonAr || safety.reasonAr)
      : (opts?.blockReasonEn || safety.reasonEn);
    const cautionMsg = isAr
      ? (opts?.cautionNoteAr || (safety.status === 'caution' ? safety.reasonAr : undefined))
      : (opts?.cautionNoteEn || (safety.status === 'caution' ? safety.reasonEn : undefined));

    const marketBrands = market === 'sa'
      ? (isAr ? drug.saudiBrandsAr : drug.saudiBrandsEn)
      : (isAr ? drug.egyptBrandsAr : drug.egyptBrandsEn);
    const brand = marketBrands?.[0] || (isAr
      ? (drug.tradeNamesAr[0] || drug.tradeNamesEn[0] || drug.genericAr)
      : (drug.tradeNamesEn[0] || drug.tradeNamesAr[0] || drug.genericEn));

    return (
      <div
        key={drug.id}
        className="p-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex flex-col gap-2"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-[var(--text)]">
              {isAr ? drug.genericAr : drug.genericEn}{' '}
              <span className="text-[11px] font-normal text-[var(--muted)]">({brand})</span>
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-0.5">
              {isAr ? drug.doseAr : drug.doseEn} · {isAr ? `الفئة ${drug.tier}` : `Tier ${drug.tier}`}
            </div>
          </div>

          {isBlocked && !active ? (
            <span className="px-2.5 py-1 rounded-lg bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)] text-[10px] font-bold shrink-0">
              {isAr ? 'محظور سريرياً' : 'Blocked'}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => toggleMedication(drug.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all shrink-0 ${
                active
                  ? isBlocked
                    ? 'bg-[#DC2626] text-white'
                    : 'bg-[var(--safe-bg)] text-[var(--safe-text)] border border-[var(--safe-border)]'
                  : 'bg-[var(--primary)] text-[var(--on-primary)] shadow-sm'
              }`}
            >
              {active ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isBlocked ? (isAr ? 'إيقاف فوراً' : 'Remove Now') : (isAr ? 'في الوصفة ✓' : 'In Rx ✓')}</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة للوصفة' : 'Add to Rx'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {blockMsg && (
          <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)] flex items-start gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{blockMsg}</span>
          </div>
        )}

        {!blockMsg && cautionMsg && (
          <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[var(--warn-bg)] text-[var(--warn-text)] border border-[var(--warn-border)] flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{cautionMsg}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 p-3 max-w-3xl mx-auto pb-28 animate-in fade-in duration-150">
      {/* Sub-Tab Switcher */}
      <div className="w-full py-1">
        <SegmentedControl<PcSubTab>
          variant="chips"
          value={pcSubTab}
          onChange={setPcSubTab}
          options={[
            { id: 'asthma', label: isAr ? 'الربو (GINA)' : 'Asthma (GINA)', icon: <Wind className="w-4 h-4" /> },
            { id: 'copd', label: isAr ? 'السدة (GOLD)' : 'COPD (GOLD)', icon: <Activity className="w-4 h-4" /> },
            { id: 'thyroid', label: isAr ? 'الغدة الدرقية' : 'Thyroid', icon: <Sparkles className="w-4 h-4" /> }
          ]}
        />
      </div>

      {/* 1. ASTHMA (GINA TRACK 1 MART) */}
      {pcSubTab === 'asthma' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-[var(--text)]">
                  {isAr ? 'تقييم الربو ومسار GINA Track 1 (MART)' : 'Asthma Control & GINA Track 1 MART'}
                </h2>
                <p className="text-[11px] text-[var(--muted)]">
                  {isAr ? 'أعراض آخر 4 أسابيع وحساب خطوة العلاج' : 'Past 4-week symptom control & step therapy'}
                </p>
              </div>
              <ChipToggle
                label={isAr ? 'تشخيص ربو نشط' : 'Active Asthma'}
                checked={patient.asthma}
                onChange={(c) => setField('asthma', c)}
                variant="primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <NumericField
                label={isAr ? 'أيام الأعراض / أسبوع' : 'Day Symptoms / wk'}
                value={patient.asthmaDaySymptoms}
                onChange={(v) => setField('asthmaDaySymptoms', v)}
                unit={isAr ? 'أيام' : 'd/wk'}
                min={0}
                max={7}
              />
              <NumericField
                label={isAr ? 'بخاخ الفنتولين / أسبوع' : 'SABA Puffs / wk'}
                value={patient.asthmaRelieverPerWk}
                onChange={(v) => setField('asthmaRelieverPerWk', v)}
                unit={isAr ? 'مرات' : 'x/wk'}
                min={0}
                max={30}
              />
              <NumericField
                label={isAr ? 'عبوات SABA / سنة' : 'SABA Canisters / yr'}
                value={patient.asthmaSabaCanistersYr}
                onChange={(v) => setField('asthmaSabaCanistersYr', v)}
                unit={isAr ? 'عبوة' : 'can/yr'}
                min={0}
                max={24}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <ChipToggle
                label={isAr ? 'استيقاظ ليلي بسبب الربو' : 'Night Waking'}
                checked={patient.asthmaNightWaking}
                onChange={(c) => setField('asthmaNightWaking', c)}
                variant="warning"
              />
              <ChipToggle
                label={isAr ? 'تقييد النشاط البدني' : 'Activity Limitation'}
                checked={patient.asthmaActivityLimit}
                onChange={(c) => setField('asthmaActivityLimit', c)}
                variant="warning"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                  {isAr ? 'الخطوة العلاجية الحالية (GINA Step)' : 'Current GINA Step'}
                </label>
                <SegmentedControl<'1' | '2' | '3' | '4' | '5'>
                  value={String(asthmaStep) as '1' | '2' | '3' | '4' | '5'}
                  onChange={(v) => setAsthmaStep(Number(v))}
                  options={[
                    { id: '1', label: 'S1' },
                    { id: '2', label: 'S2' },
                    { id: '3', label: 'S3' },
                    { id: '4', label: 'S4' },
                    { id: '5', label: 'S5' }
                  ]}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                  {isAr ? 'المسار العلاجي' : 'GINA Track'}
                </label>
                <SegmentedControl<'1' | '2'>
                  value={String(asthmaTrack) as '1' | '2'}
                  onChange={(v) => setAsthmaTrack(Number(v) as 1 | 2)}
                  options={[
                    { id: '1', label: isAr ? 'المسار 1 (MART)' : 'Track 1 (MART)' },
                    { id: '2', label: isAr ? 'المسار 2 (بديل)' : 'Track 2 (Alt)' }
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Alerts (e.g. SABA Overuse) */}
          {asthmaRes.alerts.map((a: any) => (
            <AlertBanner
              key={a.id}
              level={a.level}
              titleEn={a.titleEn}
              titleAr={a.titleAr}
              messageEn={a.messageEn}
              messageAr={a.messageAr}
            />
          ))}

          {/* Asthma Decision Card */}
          <div className="p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-full border text-xs font-bold ${
                  asthmaRes.controlBadgeClass === 'badge-danger'
                    ? 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]'
                    : asthmaRes.controlBadgeClass === 'badge-warning'
                      ? 'bg-[var(--warn-bg)] text-[var(--warn-text)] border-[var(--warn-border)]'
                      : 'bg-[var(--safe-bg)] text-[var(--safe-text)] border-[var(--safe-border)]'
                }`}
              >
                {isAr ? asthmaRes.controlNameAr : asthmaRes.controlNameEn} ({asthmaRes.score}/4)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[var(--info-bg)] text-[var(--info-text)] border border-[var(--info-border)] text-xs font-bold">
                {isAr ? `الخطوة الموصى بها: ${asthmaRes.recommendedStep}` : `Recommended: Step ${asthmaRes.recommendedStep}`}
              </span>
            </div>

            <h3 className="text-sm font-bold text-[var(--text)]">
              {asthmaRes.stepDetails.title}
            </h3>
            <p className="text-xs text-[var(--text)] leading-relaxed">
              {isAr ? asthmaRes.recommendationAr : asthmaRes.recommendationEn}
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              {isAr ? asthmaRes.stepDetails.descAr : asthmaRes.stepDetails.descEn}
            </p>
          </div>

          {/* 1-Tap Formulary Rx */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider px-1">
              {isAr ? 'أدوية الربو المعتمدة (إضافة بضغطة واحدة)' : 'Asthma Formulary (1-Tap Rx)'}
            </h3>
            {renderRxCard('budesonide_formoterol')}
            {renderRxCard('salbutamol', {
              cautionNoteEn:
                asthmaRes.sabaPerWk >= 3 || asthmaRes.canistersPerYr >= 3
                  ? 'SABA overuse detected: do not prescribe Salbutamol monotherapy without ICS-formoterol MART.'
                  : undefined,
              cautionNoteAr:
                asthmaRes.sabaPerWk >= 3 || asthmaRes.canistersPerYr >= 3
                  ? 'تنبيه إفراط SABA: لا تصف فنتولين منفرداً دون بخاخ كورتيزون MART.'
                  : undefined
            })}
            {asthmaRes.recommendedStep >= 5 && renderRxCard('tiotropium')}
          </div>
        </div>
      )}

      {/* 2. COPD (GOLD ABE) */}
      {pcSubTab === 'copd' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-[var(--text)]">
                  {isAr ? 'تصنيف السدة الرئوية GOLD ABE والخلايا الحمضية' : 'COPD GOLD ABE & Eosinophil Stewardship'}
                </h2>
                <p className="text-[11px] text-[var(--muted)]">
                  {isAr ? 'تحديد المجموعة العلاجية وقرار الكورتيزون الاستنشاقي' : 'Symptom burden, exacerbations & ICS guidance'}
                </p>
              </div>
              <ChipToggle
                label={isAr ? 'تشخيص COPD نشط' : 'Active COPD'}
                checked={patient.copd}
                onChange={(c) => setField('copd', c)}
                variant="primary"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <NumericField
                label="mMRC (0–4)"
                value={patient.copdMmrc}
                onChange={(v) => setField('copdMmrc', v)}
                min={0}
                max={4}
              />
              <NumericField
                label="CAT (0–40)"
                value={patient.copdCat}
                onChange={(v) => setField('copdCat', v)}
                min={0}
                max={40}
              />
              <NumericField
                label={isAr ? 'نوبات معتدلة / سنة' : 'Mod. Exac / yr'}
                value={patient.copdExacerbations}
                onChange={(v) => setField('copdExacerbations', v)}
                min={0}
                max={20}
              />
              <NumericField
                label={isAr ? 'دخول مستشفى / سنة' : 'Hospitalizations / yr'}
                value={patient.copdHospitalizations}
                onChange={(v) => setField('copdHospitalizations', v)}
                min={0}
                max={10}
              />
              <NumericField
                label={isAr ? 'الحمضيات Eos' : 'Blood Eosinophils'}
                value={patient.copdEosinophils}
                onChange={(v) => setField('copdEosinophils', v)}
                unit="cells/µL"
                min={0}
                max={2000}
                step={10}
                className="col-span-2 sm:col-span-2"
              />
            </div>
          </div>

          {copdRes.alerts.map((a: any) => (
            <AlertBanner
              key={a.id}
              level={a.level}
              titleEn={a.titleEn}
              titleAr={a.titleAr}
              messageEn={a.messageEn}
              messageAr={a.messageAr}
            />
          ))}

          {/* COPD Decision Card */}
          <div className="p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full border text-xs font-bold ${
                  copdRes.group === 'E'
                    ? 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]'
                    : copdRes.group === 'B'
                      ? 'bg-[var(--warn-bg)] text-[var(--warn-text)] border-[var(--warn-border)]'
                      : 'bg-[var(--safe-bg)] text-[var(--safe-text)] border-[var(--safe-border)]'
                }`}
              >
                {isAr ? copdRes.groupNameAr : copdRes.groupNameEn}
              </span>

              <span
                className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${
                  copdRes.eos >= 300
                    ? 'bg-[var(--safe-bg)] text-[var(--safe-text)] border-[var(--safe-border)]'
                    : copdRes.eos < 100
                      ? 'bg-[var(--warn-bg)] text-[var(--warn-text)] border-[var(--warn-border)]'
                      : 'bg-[var(--info-bg)] text-[var(--info-text)] border-[var(--info-border)]'
                }`}
              >
                {copdRes.eos >= 300
                  ? (isAr ? `Eos ${copdRes.eos} ≥ 300 (ICS مفضّل)` : `Eos ${copdRes.eos} ≥ 300 (ICS Favored)`)
                  : copdRes.eos < 100
                    ? (isAr ? `Eos ${copdRes.eos} < 100 (تجنب ICS)` : `Eos ${copdRes.eos} < 100 (Avoid ICS)`)
                    : (isAr ? `Eos ${copdRes.eos} (100–299)` : `Eos ${copdRes.eos} (100–299)`)}
              </span>
            </div>

            <p className="text-xs text-[var(--text)] leading-relaxed">
              {isAr ? copdRes.primaryRxAr : copdRes.primaryRxEn}
            </p>
          </div>

          {/* 1-Tap Formulary Rx */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider px-1">
              {isAr ? 'أدوية السدة الرئوية (إضافة بضغطة واحدة)' : 'COPD Formulary (1-Tap Rx)'}
            </h3>
            {renderRxCard('tiotropium')}
            {renderRxCard('budesonide_formoterol', {
              blockReasonEn:
                copdRes.eos < 100
                  ? `Blood eosinophils ${copdRes.eos} < 100 cells/µL: avoid ICS due to elevated bacterial pneumonia risk; prefer LABA + LAMA.`
                  : undefined,
              blockReasonAr:
                copdRes.eos < 100
                  ? `الخلايا الحمضية ${copdRes.eos} أقل من 100: يُتجنب الكورتيزون الاستنشاقي لارتفاع خطر ذات الرئة؛ اعتمد على LABA + LAMA.`
                  : undefined
            })}
          </div>
        </div>
      )}

      {/* 3. THYROID */}
      {pcSubTab === 'thyroid' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] shadow-sm flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">
                {isAr ? 'تقييم الغدة الدرقية وجرعات الليفوثيروكسين' : 'Thyroid Panel & Levothyroxine Calculator'}
              </h2>
              <p className="text-[11px] text-[var(--muted)]">
                {isAr ? 'تحليل TSH و FT4 مع مراعاة العمر والقلب والحمل' : 'TSH/FT4 interpretation with cardiac, age & pregnancy dosing'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumericField
                label="TSH"
                value={patient.tsh}
                onChange={(v) => setField('tsh', v)}
                unit="mIU/L"
                min={0.01}
                max={100}
                step={0.05}
              />
              <NumericField
                label="Free T4"
                value={patient.ft4}
                onChange={(v) => setField('ft4', v)}
                unit="ng/dL"
                min={0.1}
                max={10}
                step={0.05}
              />
            </div>

            {patient.pregnancy && (
              <div className="p-2.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[var(--muted)]">
                    {isAr ? 'ثلث الحمل وهدف TSH' : 'Pregnancy Trimester & TSH Goal'}
                  </span>
                  <span className="text-[var(--primary)] font-mono">
                    {isAr ? `هدف TSH < ${thyroidRes.pregTshTarget}` : `Target TSH < ${thyroidRes.pregTshTarget} mIU/L`}
                  </span>
                </div>
                <SegmentedControl<'1' | '2' | '3'>
                  value={String(patient.thyroidTrimester || 1) as '1' | '2' | '3'}
                  onChange={(v) => {
                    const tri = Number(v) as 1 | 2 | 3;
                    setField('thyroidTrimester', tri);
                    setField('trimester', tri);
                  }}
                  options={[
                    { id: '1', label: isAr ? 'الثلث 1 (<2.5)' : 'T1 (<2.5)' },
                    { id: '2', label: isAr ? 'الثلث 2 (<3.0)' : 'T2 (<3.0)' },
                    { id: '3', label: isAr ? 'الثلث 3 (<3.0)' : 'T3 (<3.0)' }
                  ]}
                />
              </div>
            )}
          </div>

          {thyroidRes.alerts.map((a: any) => (
            <AlertBanner
              key={a.id}
              level={a.level}
              titleEn={a.titleEn}
              titleAr={a.titleAr}
              messageEn={a.messageEn}
              messageAr={a.messageAr}
            />
          ))}

          {/* Thyroid Decision Card */}
          <div className="p-3.5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full border text-xs font-bold ${
                  thyroidRes.badgeClass === 'badge-danger'
                    ? 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]'
                    : thyroidRes.badgeClass === 'badge-warning'
                      ? 'bg-[var(--warn-bg)] text-[var(--warn-text)] border-[var(--warn-border)]'
                      : 'bg-[var(--safe-bg)] text-[var(--safe-text)] border-[var(--safe-border)]'
                }`}
              >
                {isAr ? thyroidRes.statusNameAr : thyroidRes.statusNameEn}
              </span>

              {thyroidRes.recommendedDose > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-[var(--info-bg)] text-[var(--info-text)] border border-[var(--info-border)] text-xs font-bold font-mono">
                  LT4 ~{thyroidRes.recommendedDose} mcg/day
                </span>
              )}
            </div>

            <div className="text-[11px] font-semibold text-[var(--muted)]">{thyroidRes.diagnosis}</div>
            <p className="text-xs text-[var(--text)] leading-relaxed">
              {isAr ? thyroidRes.rxAr : thyroidRes.rxEn}
            </p>
          </div>

          {/* 1-Tap Formulary Rx */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider px-1">
              {isAr ? 'أدوية الغدة الدرقية (إضافة بضغطة واحدة)' : 'Thyroid Formulary (1-Tap Rx)'}
            </h3>
            {renderRxCard('levothyroxine', {
              blockReasonEn:
                thyroidRes.status === 'central_hypo'
                  ? 'Suspected Central Hypothyroidism: rule out adrenal insufficiency (8 AM cortisol) BEFORE initiating Levothyroxine.'
                  : undefined,
              blockReasonAr:
                thyroidRes.status === 'central_hypo'
                  ? 'اشتباه قصور مركزي: يُمنع بدء الليفوثيروكسين قبل استبعاد قصور الكظر (فحص كورتيزول الصباح).'
                  : undefined
            })}
            {renderRxCard('carbimazole')}
            {renderRxCard('propranolol')}
          </div>
        </div>
      )}
    </div>
  );
};
