import React, { useState } from 'react';
import { usePatientStore } from '../store/usePatientStore';
import { useAppStore } from '../store/useAppStore';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { getDynamicTargets, buildShareText } from '../engines/leaflets';
import { generateSVG, buildOfflinePatientQrPayload } from '../engines/qr';
import { Copy, Check, Printer } from 'lucide-react';
import { printClinicalReport } from '../engines/printReport';

export const PatientHubScreen: React.FC = () => {
  const patient = usePatientStore(s => s.patient);
  const { lang } = useAppStore();
  const isAr = lang === 'ar';

  const [subTab, setSubTab] = useState<'leaflets' | 'qr' | 'targets'>('leaflets');
  const [selectedLeaflet, setSelectedLeaflet] = useState<'rule15' | 'sadmans' | 'homebp' | 'redflags'>('rule15');
  const [copied, setCopied] = useState(false);

  const targets = getDynamicTargets(patient);
  const qrPayload = buildOfflinePatientQrPayload(patient, targets);
  const qrSvg = generateSVG(qrPayload, { size: 220, darkColor: '#0F172A', lightColor: '#FFFFFF' });

  const handleCopyLeaflet = async () => {
    try {
      const text = buildShareText(targets, lang, 'all');
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto pb-28">
      <SegmentedControl
        value={subTab}
        onChange={(val) => setSubTab(val as any)}
        options={[
          { id: 'leaflets', label: isAr ? 'النشرات التثقيفية' : 'Leaflets' },
          { id: 'qr', label: isAr ? 'رمز QR للمريض' : 'QR Code' },
          { id: 'targets', label: isAr ? 'الأهداف العلاجية' : 'Care Targets' }
        ]}
      />

      {/* 1. LEAFLETS TAB */}
      {subTab === 'leaflets' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          {/* Quick copy row */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {isAr ? 'نشرات التوعية السريرية' : 'Patient Clinical Guides'}
            </span>
            <button
              type="button"
              onClick={handleCopyLeaflet}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--surface2)] border border-[var(--line)] text-[var(--text)] active:scale-95 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />}
              <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'مشاركة النشرة' : 'Share All')}</span>
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedLeaflet('rule15')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
                selectedLeaflet === 'rule15'
                  ? 'bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)]'
                  : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)]'
              }`}
            >
              {isAr ? 'قاعدة 15 (الهبوط)' : 'Rule of 15'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedLeaflet('sadmans')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
                selectedLeaflet === 'sadmans'
                  ? 'bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)]'
                  : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)]'
              }`}
            >
              {isAr ? 'أيام المرض (SADMANS)' : 'SADMANS Rules'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedLeaflet('homebp')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
                selectedLeaflet === 'homebp'
                  ? 'bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)]'
                  : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)]'
              }`}
            >
              {isAr ? 'قياس الضغط المنزلي' : 'Home BP Protocol'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedLeaflet('redflags')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
                selectedLeaflet === 'redflags'
                  ? 'bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)]'
                  : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)]'
              }`}
            >
              {isAr ? 'علامات الطوارئ' : 'Emergency Red Flags'}
            </button>
          </div>

          {/* Leaflet Content Cards */}
          {selectedLeaflet === 'rule15' && (
            <div className="p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-2.5 leading-relaxed text-xs">
              <h4 className="text-sm font-bold text-[var(--primary)]">
                {isAr ? '🍬 قاعدة 15 لعلاج هبوط السكر في الدم (< 70 مجم/dL)' : '🍬 Rule of 15 for Hypoglycemia Treatment (< 70 mg/dL)'}
              </h4>
              <p className="text-[var(--text)]">
                {isAr
                  ? 'عند الشعور بالرعشة، التعرق البارد، خفقان القلب، أو الدوخة:'
                  : 'When experiencing shakiness, sweating, dizziness, or lightheadedness:'}
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-[var(--text)] ps-1">
                <li>{isAr ? 'تناول 15 جرام كربوهيدرات سريعة الامتصاص (نصف كوب عصير محلى / 3 أقراص جلوكوز / ملعقة طعام سكر مذابة في ماء).' : 'Consume 15 grams of fast-acting sugar (1/2 cup juice or soda / 3 glucose tabs / 1 tbsp sugar in water).'}</li>
                <li>{isAr ? 'استرح واجلس بهدوء لمدة 15 دقيقة دون مجهود.' : 'Rest quietly for 15 minutes.'}</li>
                <li>{isAr ? 'أعد فحص السكر بعد 15 دقيقة: إذا ما زال أقل من 70 مجم، كرر تناول 15 جرام سكر.' : 'Recheck blood glucose: if still < 70 mg/dL, repeat 15g sugar.'}</li>
                <li>{isAr ? 'بمجرد استقرار السكر فوق 70 مجم، تناول وجبة خفيفة مستقرة (مثل شريحة خبز مع جبن).' : 'Once glucose is >= 70 mg/dL, eat a meal or complex carb snack to maintain stability.'}</li>
              </ol>
            </div>
          )}

          {selectedLeaflet === 'sadmans' && (
            <div className="p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-2.5 leading-relaxed text-xs">
              <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {isAr ? '⚠️ قواعد أيام المرض والتجفاف (SADMANS Rules)' : '⚠️ SADMANS Sick-Day Dehydration Rules'}
              </h4>
              <p className="text-[var(--text)]">
                {isAr
                  ? 'عند الإصابة بالحمى الشديدة، القيء المتكرر، الإسهال الحاد، أو عدم القدرة على شرب السوائل، يجب إيقاف الأدوية التالية مؤقتاً لتجنب الفشل الكلوي الحاد أو الحماض اللبني:'
                  : 'During acute dehydrating illnesses (fever, vomiting, severe diarrhea, low oral intake), temporarily WITHHOLD these medications to prevent Acute Kidney Injury (AKI) and ketoacidosis:'}
              </p>
              <ul className="space-y-1.5 text-[var(--text)]">
                <li><strong>S - SGLT2i:</strong> {isAr ? 'جارديانس، فورسيجا (خطر الحماض الكيتوني السكري الطبيعي eDKA)' : 'Empagliflozin, Dapagliflozin (euglycemic DKA risk)'}</li>
                <li><strong>A - ACE inhibitors:</strong> {isAr ? 'تريتاس، كوفرسيل (خطر هبوط وظائف الكلى)' : 'Ramipril, Perindopril (AKI risk)'}</li>
                <li><strong>D - Diuretics:</strong> {isAr ? 'إنداباميد، لازكس، هيدروكلوروثيازيد (خطر الجفاف الشديد)' : 'Indapamide, Furosemide, Thiazides (volume depletion)'}</li>
                <li><strong>M - Metformin:</strong> {isAr ? 'جلوكوفاج، ميتفورمين (خطر الحماض اللبني القاتل)' : 'Glucophage (lactic acidosis risk)'}</li>
                <li><strong>A - ARBs:</strong> {isAr ? 'فالسارتان، لوسارتان، إكسفورج (خطر قصور الكلى الحاد)' : 'Valsartan, Losartan (renal hemodynamics)'}</li>
                <li><strong>N - NSAIDs:</strong> {isAr ? 'بروفين، كتافلام، فولتارين (سمية كلوية حادة)' : 'Ibuprofen, Diclofenac, Naproxen (tubular toxicity)'}</li>
                <li><strong>S - Sulfonylureas:</strong> {isAr ? 'أماريل، دياميكرون (خطر هبوط السكر الشديد)' : 'Glimepiride, Gliclazide (severe hypoglycemia)'}</li>
              </ul>
            </div>
          )}

          {selectedLeaflet === 'homebp' && (
            <div className="p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-2.5 leading-relaxed text-xs">
              <h4 className="text-sm font-bold text-[var(--primary)]">
                {isAr ? '💓 بروتوكول القياس المنزلي الصحيح لضغط الدم (HBPM)' : '💓 Standardized Home Blood Pressure Protocol (HBPM)'}
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-[var(--text)] ps-1">
                <li>{isAr ? 'الراحة التامة لمدة 5 دقائق قبل بدء القياس في غرفة هادئة.' : 'Rest comfortably for 5 minutes before measurement in a quiet room.'}</li>
                <li>{isAr ? 'الجلوس على كرسي مع إسناد الظهر ووضع القدمين مستويتين على الأرض (تجنب وضع ساق على ساق).' : 'Sit with back supported and feet flat on the floor (do not cross legs).'}</li>
                <li>{isAr ? 'إسناد الذراع على طاولة بحيث يكون السوار بمستوى القلب تماماً.' : 'Support arm on a table with the cuff at exact heart level.'}</li>
                <li>{isAr ? 'أخذ قراءتين متتاليتين يفصل بينهما دقيقة صباحاً ومساءً لمدة 7 أيام متتالية.' : 'Take 2 readings 1 minute apart morning and evening for 7 days.'}</li>
                <li>{isAr ? 'الهدف المنزلي المتوسط: أقل من 130/80 ملم زئبق.' : 'Average home BP target: < 130/80 mmHg.'}</li>
              </ul>
            </div>
          )}

          {selectedLeaflet === 'redflags' && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col gap-2.5 leading-relaxed text-xs text-red-900 dark:text-red-200">
              <h4 className="text-sm font-bold text-red-600 dark:text-red-400">
                {isAr ? '🚨 علامات الطوارئ الحرجة (التوجه الفوري للإسعاف)' : '🚨 Red Flag Symptoms (Call Emergency Stat)'}
              </h4>
              <ul className="list-disc list-inside space-y-1.5 ps-1">
                <li>{isAr ? 'ألم ضاغط أو حارق في الصدر ينتشر للكتف أو الفك الأيسر (اشتباه جلطة قلبية).' : 'Crushing substernal chest pain radiating to left arm/jaw.'}</li>
                <li>{isAr ? 'صداع مفاجئ شديد جداً كالصاعقة مع غثيان أو تشوش رؤية.' : 'Sudden thunderclap severe headache with visual changes.'}</li>
                <li>{isAr ? 'ثقل أو تنميل مفاجئ في جانب واحد من الوجه أو الذراع أو صعوبة في النطق.' : 'Facial droop, arm weakness, or slurred speech (FAST stroke signs).'}</li>
                <li>{isAr ? 'ضيق حاد في التنفس أثناء الاستلقاء أو خفقان سريع متسارع مصحوب بدوخة.' : 'Severe acute dyspnea, orthopnea, or syncope.'}</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 2. QR CODE TAB */}
      {subTab === 'qr' && (
        <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in duration-150">
          <div className="text-center">
            <h4 className="text-sm font-bold text-[var(--text)]">
              {isAr ? 'رمز QR للنشرة والوصفة الطبية' : 'Patient Digital Care QR Code'}
            </h4>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {isAr ? 'امسح الرمز بكاميرا الجوال لعرض الخطة والنشرات أوفلاين' : 'Scan with mobile camera to view offline care plan'}
            </p>
          </div>

          {/* QR Code Shield: Forced #FFFFFF background for dark-mode scan invariant */}
          <div
            className="p-4 rounded-2xl shadow-md border border-neutral-300 bg-white select-none"
            style={{ backgroundColor: '#FFFFFF' }}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          <span className="text-[11px] font-mono text-[var(--muted)]">
            100% Offline Vector SVG · No internet required
          </span>

          <button
            type="button"
            onClick={() => printClinicalReport(patient, undefined, lang)}
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all mt-1"
          >
            <Printer className="w-4 h-4" />
            <span>{isAr ? 'طباعة التقرير الطبي والوصفة (A4 / PDF)' : 'Print A4 Clinical Report & Rx'}</span>
          </button>
        </div>
      )}

      {/* 3. TARGETS TAB */}
      {subTab === 'targets' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="p-4 bg-[var(--surface)] shadow-sm rounded-xl border border-[var(--line)] flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
              {isAr ? 'الأهداف العلاجية المخصصة للمريض' : 'Individualized Quality Clinical Targets'}
            </h4>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--line)] flex justify-between items-center">
                <div>
                  <strong className="text-[var(--text)] block">{isAr ? 'السكر التراكمي المستهدف (HbA1c):' : 'Target HbA1c:'}</strong>
                  <span className="text-[11px] text-[var(--muted)]">{isAr ? targets.dm.targetDescAr : targets.dm.targetDescEn}</span>
                </div>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">{targets.dm.targetA1c}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--line)] flex justify-between items-center">
                <div>
                  <strong className="text-[var(--text)] block">{isAr ? 'ضغط الدم المستهدف (BP):' : 'Target Blood Pressure:'}</strong>
                  <span className="text-[11px] text-[var(--muted)]">{targets.htn.targetHomeBpEn}</span>
                </div>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">{targets.htn.targetBp}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--line)] flex justify-between items-center">
                <div>
                  <strong className="text-[var(--text)] block">{isAr ? 'الكوليسترول الضار المستهدف (LDL):' : 'Target LDL-C:'}</strong>
                  <span className="text-[11px] text-[var(--muted)]">{isAr ? targets.dlp.riskTierAr : targets.dlp.riskTier}</span>
                </div>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">{targets.dlp.targetLdl}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
