import React, { useState } from 'react';
import { Check, ShieldCheck, RefreshCw, Download, ExternalLink, Palette, Sun, Moon } from 'lucide-react';
import { useAppStore, AppPalette } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { loadSettings, saveSettings, DoctorSettings } from '../../engines/exporters';
import { checkAppUpdate, UpdateInfo, CURRENT_VERSION } from '../../engines/updater';

const PALETTE_OPTIONS: { id: AppPalette; labelEn: string; labelAr: string; swatch: string; darkSwatch: string }[] = [
  { id: 'sapphire', labelEn: 'Sapphire Blue', labelAr: 'أزرق ياقوتي', swatch: '#1D4ED8', darkSwatch: '#3B82F6' },
  { id: 'teal',     labelEn: 'Medical Teal',  labelAr: 'أخضر طبي',    swatch: '#0D7A72', darkSwatch: '#2DD4BF' },
  { id: 'navy',     labelEn: 'Slate Navy',    labelAr: 'كحلي سريري',  swatch: '#0F172A', darkSwatch: '#38BDF8' },
];

export const SettingsSheet: React.FC = () => {
  const { overlayStack, popOverlay, lang, theme, setTheme, palette, setPalette } = useAppStore();
  const isAr = lang === 'ar';
  const isOpen = overlayStack.includes('settings-sheet');

  const [settings, setSettings] = useState<DoctorSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateStatus(null);
    setUpdateError(null);
    try {
      const info = await checkAppUpdate();
      setUpdateInfo(info);
      if (info.isAvailable) {
        setUpdateStatus(
          isAr
            ? `🚀 يتوفر تحديث جديد: v${info.latestVersion}`
            : `🚀 New update available: v${info.latestVersion}`
        );
      } else {
        setUpdateStatus(
          isAr
            ? `✅ أنت تستخدم أحدث إصدار سريري (v${CURRENT_VERSION})`
            : `✅ You are running the latest clinical version (v${CURRENT_VERSION})`
        );
      }
    } catch {
      setUpdateError(
        isAr
          ? 'تعذر التحقق من التحديثات (تأكد من الاتصال بالإنترنت)'
          : 'Could not check for updates (check internet connection)'
      );
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <BottomSheet
      id="settings-sheet"
      isOpen={isOpen}
      onClose={() => popOverlay()}
      title={isAr ? 'إعدادات الطبيب والعيادة' : 'Doctor Profile & Settings'}
    >
      <div className="flex flex-col gap-4 py-1">
        {/* Appearance & Color Palette Switcher */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-xs font-bold text-[var(--text)]">
                {isAr ? 'مظهر وألوان الواجهة' : 'UI Theme & Color Palette'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[11px] font-semibold text-[var(--text)] active:scale-95 transition-all"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[var(--warn-text)]" />
                  <span>{isAr ? 'الوضع النهاري' : 'Light'}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>{isAr ? 'الوضع الليلي' : 'Dark'}</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PALETTE_OPTIONS.map((opt) => {
              const active = palette === opt.id;
              const dotColor = theme === 'dark' ? opt.darkSwatch : opt.swatch;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPalette(opt.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-[11px] font-semibold transition-all active:scale-95 ${
                    active
                      ? 'bg-primary/15 border-primary text-[var(--primary)] shadow-sm'
                      : 'bg-[var(--surface)] border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-white/40 shadow-sm flex items-center justify-center"
                    style={{ backgroundColor: dotColor }}
                  >
                    {active && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </span>
                  <span className="truncate w-full text-center">
                    {isAr ? opt.labelAr : opt.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Doctor Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            {isAr ? 'اسم الطبيب المعالج' : 'Doctor Name'}
          </label>
          <input
            type="text"
            value={settings.doctorName || ''}
            onChange={(e) => setSettings({ ...settings, doctorName: e.target.value })}
            className="w-full h-10 px-3 bg-[var(--input-bg)] text-[var(--text)] text-xs font-semibold rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
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
            className="w-full h-10 px-3 bg-[var(--input-bg)] text-[var(--text)] text-xs font-semibold rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
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
            className="w-full h-10 px-3 bg-[var(--input-bg)] text-[var(--text)] text-xs font-semibold rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Clinic Phone */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            {isAr ? 'هاتف العيادة (للتواصل في الوصفات)' : 'Clinic Phone (WhatsApp)'}
          </label>
          <input
            type="text"
            dir="ltr"
            value={settings.clinicPhone || ''}
            onChange={(e) => setSettings({ ...settings, clinicPhone: e.target.value })}
            className="w-full h-10 px-3 bg-[var(--input-bg)] text-[var(--text)] text-xs font-mono rounded-lg border border-[var(--line)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Save Profile Button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full h-10 flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold rounded-xl shadow-sm active:scale-[0.98] transition-all"
        >
          {saved ? <Check className="w-4 h-4" /> : null}
          <span>{saved ? (isAr ? 'تم حفظ التعديلات!' : 'Profile Saved!') : (isAr ? 'حفظ بيانات الطبيب' : 'Save Profile')}</span>
        </button>

        {/* App Version & Updater Section */}
        <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--line)] flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--safe-text)]" />
              <span className="text-xs font-bold text-[var(--text)]">Osrawy Clinical Navigator</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--muted)] font-bold">v{CURRENT_VERSION}</span>
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

          {updateStatus && (
            <p className={`text-[11px] font-semibold text-center mt-1 ${updateInfo?.isAvailable ? 'text-[var(--warn-text)]' : 'text-[var(--safe-text)]'}`}>
              {updateStatus}
            </p>
          )}

          {updateError && (
            <p className="text-[11px] text-[var(--danger-text)] font-semibold text-center mt-1">
              {updateError}
            </p>
          )}

          {updateInfo?.isAvailable && (
            <a
              href={updateInfo.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[var(--safe-bg)] text-[var(--safe-text)] border border-[var(--safe-border)] text-xs font-bold shadow-sm active:scale-95 transition-all mt-1"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? `تحميل وتثبيت التحديث (v${updateInfo.latestVersion})` : `Download & Install Update (v${updateInfo.latestVersion})`}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
