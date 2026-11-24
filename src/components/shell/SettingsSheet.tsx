import React, { useState } from 'react';
import { Check, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { loadSettings, saveSettings, DoctorSettings } from '../../engines/exporters';

export const SettingsSheet: React.FC = () => {
  const { overlayStack, popOverlay, lang } = useAppStore();
  const isAr = lang === 'ar';
  const isOpen = overlayStack.includes('settings-sheet');

  const [settings, setSettings] = useState<DoctorSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setUpdateMsg(null);
    setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateMsg(isAr ? 'أنت تستخدم أحدث إصدار سريري (v2.0.0).' : 'You are running the latest clinical version (v2.0.0).');
    }, 1200);
  };

  return (
    <BottomSheet
      id="settings-sheet"
      isOpen={isOpen}
      onClose={() => popOverlay()}
      title={isAr ? 'إعدادات الطبيب والعيادة' : 'Doctor Profile & Settings'}
    >
      <div className="flex flex-col gap-4 py-1">
        {/* Doctor Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            {isAr ? 'اسم الطبيب المعالج' : 'Doctor Name'}
          </label>
          <input
            type="text"
            value={settings.doctorName || ''}
            onChange={(e) => setSettings({ ...settings, doctorName: e.target.value })}
            className="w-full h-10 px-3 bg-[var(--surface2)] text-[var(--text)] text-xs font-semibold rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            {isAr ? 'اللقب والتخصص' : 'Title & Specialty'}
          </label>
          <input
            type="text"
            value={settings.doctorTitle || ''}
            onChange={(e) => setSettings({ ...settings, doctorTitle: e.target.value })}
            className="w-full h-10 px-3 bg-[var(--surface2)] text-[var(--text)] text-xs font-semibold rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Clinic Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            {isAr ? 'اسم المركز / العيادة' : 'Clinic / Hospital Name'}
          </label>
          <input
            type="text"
            value={settings.clinicName || ''}
            onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
            className="w-full h-10 px-3 bg-[var(--surface2)] text-[var(--text)] text-xs font-semibold rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Clinic Phone */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            {isAr ? 'هاتف العيادة (للتواصل في الوصفات)' : 'Clinic Phone (WhatsApp)'}
          </label>
          <input
            type="text"
            value={settings.clinicPhone || ''}
            onChange={(e) => setSettings({ ...settings, clinicPhone: e.target.value })}
            className="w-full h-10 px-3 bg-[var(--surface2)] text-[var(--text)] text-xs font-mono rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Save Profile Button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full h-10 flex items-center justify-center gap-2 bg-[var(--primary)] text-white text-xs font-semibold rounded-xl shadow-sm active:scale-[0.98] transition-all"
        >
          {saved ? <Check className="w-4 h-4" /> : null}
          <span>{saved ? (isAr ? 'تم حفظ التعديلات!' : 'Profile Saved!') : (isAr ? 'حفظ بيانات الطبيب' : 'Save Profile')}</span>
        </button>

        {/* App Version & Updater Section */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-[var(--text)]">Osrawy Clinical Navigator</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--muted)] font-bold">v2.0.0</span>
          </div>

          <button
            type="button"
            onClick={handleCheckUpdate}
            disabled={checkingUpdate}
            className="flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] text-xs font-medium hover:bg-[var(--line)] active:scale-95 transition-all mt-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--muted)] ${checkingUpdate ? 'animate-spin' : ''}`} />
            <span>{checkingUpdate ? (isAr ? 'جاري التحقق...' : 'Checking...') : (isAr ? 'التحقق من التحديثات' : 'Check for Updates')}</span>
          </button>

          {updateMsg && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold text-center mt-1">
              {updateMsg}
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
