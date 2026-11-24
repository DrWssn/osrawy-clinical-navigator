# Osrawy Clinical Navigator — Codebase (Part 1 of 4)

## Part 1: System Config, Native Android, HTML & Styling

> **Version:** v1.2.18
> **Repository:** Osrawy Clinical Navigator (`com.osrawy.clinicalnavigator`)
> **Architecture:** Vanilla JS / CSS3 (Phone-First Native Android Hybrid Web App via Capacitor)
> **Clinical Guidelines:** ADA 2025, ACC/AHA 2025, ESC 2024/2023, KDIGO 2024, GINA 2024, GOLD 2024
> **Quality Gate:** 15/15 JS files syntax verified, 203/203 clinical simulation assertions passed (100% pass).

## Part 1 Table of Contents

1. [GEMINI.md](#gemini-md) — *Project architectural guidelines, DOM invariants, layout constraints, offline asset requirements, and verification gates.*
2. [package.json](#package-json) — *NPM package manifest and build metadata.*
3. [capacitor.config.json](#capacitor-config-json) — *Capacitor mobile application configuration for Android container.*
4. [android/app/build.gradle](#android-app-build-gradle) — *Android application Gradle build script with SDK versions, signing configs, and version metadata.*
5. [android/app/src/main/AndroidManifest.xml](#android-app-src-main-androidmanifest-xml) — *Native Android application manifest defining permissions, hardware acceleration, activity flags, and intent filters.*
6. [android/app/src/main/java/com/osrawy/clinicalnavigator/MainActivity.java](#android-app-src-main-java-com-osrawy-clinicalnavigator-mainactivity-java) — *Native Android Capacitor BridgeActivity entry point for hardware bridge and OS lifecycle.*
7. [www/index.html](#www-index-html) — *Main single-page application entry point, DOM structure, modals, cockpit, navigation drawers, and script load order.*
8. [www/css/tokens.css](#www-css-tokens-css) — *Design system design tokens, CSS custom properties, color palettes, and spacing variables.*
9. [www/css/fonts.css](#www-css-fonts-css) — *Local font-face definitions (IBM Plex Sans Arabic and IBM Plex Mono) for 100% offline hospital compliance.*
10. [www/css/palette.css](#www-css-palette-css) — *Global command palette overlay styles and shortcut modal.*
11. [www/css/tools.css](#www-css-tools-css) — *Clinical tools layout, KDIGO heatmaps, FIB-4 scale, and bedside calculators.*
12. [www/css/lipids.css](#www-css-lipids-css) — *Lipids stepped-intensification wizard, ASCVD risk categories, and statin stepper styles.*
13. [www/css/diabetes.css](#www-css-diabetes-css) — *Diabetes clinical engine specific styles, insulin calculator, and screening table styling.*
14. [www/css/htn.css](#www-css-htn-css) — *Hypertension clinical engine specific styles, hemodynamic telemetry, and BP targets.*
15. [www/css/app.css](#www-css-app-css) — *Core global application styling, responsive layout, theme tokens (light/dark), docked command bar, and EMR drawers.*
16. [www/css/phone-first.css](#www-css-phone-first-css) — *Phone-first mobile styling (< 768px), 2-zone cockpit micro-stack, modal flex fixes, and segmented switcher styles.*

---

<a id="gemini-md"></a>
## 1. `GEMINI.md`

**Description:** Project architectural guidelines, DOM invariants, layout constraints, offline asset requirements, and verification gates.  
**Lines:** 38 | **Size:** 3.7 KB

```markdown
# Osrawy Clinical Navigator - Project Guidelines & Invariants

## 1. Architectural & DOM ID Invariants
- **Never rename or remove established DOM IDs**: The full integration simulation (`run_full_simulation.js`) and cross-tab synchronizers bind directly to element IDs.
  - Critical IDs that must remain intact: `#sticky-vitals-summary`, `#patient-summary-bar`, `#bar-egfr`, `#bar-k`, `#bar-bp`, `#osrawy-soap-fab`, `#osrawy-soap-count`, `#quick-jump-rx-btn`, `#top-more-btn`, `#top-more-menu`, `#market-toggle-btn`, `#btn-open-ldl-modal`, `#save-pt-btn`, `#theme-toggle-btn`, `#open-settings-btn`, `#clinical-guardrail-banner`, `#osrawy-vitals-quick-drawer`.
- When introducing modern layout wrappers (e.g., `.patient-cockpit`, `.osrawy-docked-command-bar`), place the original IDs inside the wrapper rather than inventing new IDs.

## 2. Smartphone Layout & Chrome Math (< 680px)
- **Single-Row Top Navigation Bar**:
  - Keep only 3–4 primary controls on the top row: `.app-brand`, `#lang-toggle-btn` (`🌐 English`/`🌐 عربي`), `#open-drugs-btn` (💊), `#open-recent-btn` (📋), and `#top-more-btn` (`⋮`).
  - Tuck secondary controls (`Market`, `LDL Matrix`, `Save Draft`, `Theme`, `Settings`) into the `#top-more-menu` popover.
  - The top bar must never wrap into a second row on phones (`360px–412px`).
- **Unified Patient Cockpit (`<= 44px`)**:
  - Merge patient identity and vitals into a 2-zone sticky cockpit.
  - Zone 1 (`#patient-summary-bar`): Patient identity must have `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` to accommodate long names without pushing vitals off-screen.
  - Zone 2 (`#sticky-vitals-summary`): Vital chips (`eGFR`, `K+`, `BP`) must not wrap. Tapping must open the Vitals Quick Drawer directly beneath the cockpit.
- **Docked Command Bar (`<= 40px`)**:
  - Wrap bottom floating pills (`#osrawy-soap-fab`, `#quick-jump-rx-btn`) inside `#osrawy-docked-command-bar` pinned directly above the bottom nav.
  - Container must use `pointer-events: none` with `pointer-events: auto` on child buttons to allow click-through on empty central space.
  - Must auto-hide on non-engine tabs (`tab-drugs`, `tab-recent`, `tab-leaflets`), soft-keyboard open (`body.osrawy-keyboard-open`), and patient handoff mode (`body.osrawy-patient-mode`).

## 3. 100% Offline Asset Invariant
- **Zero External CDNs**: The application must run completely offline in hospital/clinic environments.
- All fonts must be bundled locally in `www/fonts/` (`IBM Plex Sans Arabic` and `IBM Plex Mono` in `.woff2` format) and declared via `www/css/fonts.css`.
- Never reintroduce Google Fonts `<link>` tags or external script/font CDN URLs.

## 4. Dark Mode & Contrast Safety
- **QR Code Shield**: Any patient-facing QR code container (`.qr-svg-box`) must be forced to background `#FFFFFF !important` with black SVG fill in all themes (including Dark Mode) so smartphone cameras can scan them.
- **Semantic Variables**: Avoid hardcoded light-mode hex colors (`#FEF2F2`, `#FFFBEB`, `#FDF2F8`). Use semantic theme tokens (`var(--danger-bg)`, `var(--warn-bg)`, `var(--surface2)`, `var(--line)`).

## 5. Verification & Quality Gates
- **Translation Parity**: Every `data-i18n*` attribute in `www/index.html` must have exact matching entries in both Arabic (`ar`) and English (`en`) dictionaries in `www/js/i18n.js`.
- **Pre-Commit Checks**: Always execute and verify:
  1. `node check_js_syntax.js` (13/13 JS files must pass syntax check).
  2. `node run_full_simulation.js` (all 203 clinical simulation assertions must pass).
  3. `npx cap sync android` (Capacitor assets must be kept in sync with `www/`).
- **Version Alignment**: When releasing, ensure version strings in `package.json`, `www/js/updater.js` (`currentVersion`), and `android/app/build.gradle` (`versionName`) match exactly.

```

---

<a id="package-json"></a>
## 2. `package.json`

**Description:** NPM package manifest and build metadata.  
**Lines:** 18 | **Size:** 0.4 KB

```json
{
  "name": "osrawy-clinical-navigator",
  "version": "1.2.18",
  "description": "Osrawy Diabetes and Hypertension Clinical Treatment Navigator",
  "main": "www/index.html",
  "scripts": {
    "build": "cap sync",
    "cap:android": "cap open android"
  },
  "author": "Dr Hossam Yousuf",
  "license": "ISC",
  "dependencies": {
    "@capacitor/android": "^6.2.0",
    "@capacitor/cli": "^6.2.0",
    "@capacitor/core": "^6.2.0"
  }
}

```

---

<a id="capacitor-config-json"></a>
## 3. `capacitor.config.json`

**Description:** Capacitor mobile application configuration for Android container.  
**Lines:** 13 | **Size:** 0.2 KB

```json
{
  "appId": "com.osrawy.clinicalnavigator",
  "appName": "Osrawy Navigator",
  "webDir": "www",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  },
  "android": {
    "backgroundColor": "#0F2B2A"
  }
}

```

---

<a id="android-app-build-gradle"></a>
## 4. `android/app/build.gradle`

**Description:** Android application Gradle build script with SDK versions, signing configs, and version metadata.  
**Lines:** 69 | **Size:** 2.6 KB

```groovy
apply plugin: 'com.android.application'

android {
    namespace "com.osrawy.clinicalnavigator"
    compileSdk rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.osrawy.clinicalnavigator"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 19
        versionName "1.2.18"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
             // Files and dirs to omit from the packaged assets dir, modified to accommodate modern web apps.
             // Default: https://android.googlesource.com/platform/frameworks/base/+/282e181b58cf72b6ca770dc7ca5f91f135444502/tools/aapt/AaptAssets.cpp#61
            ignoreAssetsPattern '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~'
        }
    }
    signingConfigs {
        release {
            def ksFile = file('release.keystore')
            if (ksFile.exists()) {
                storeFile ksFile
                storePassword System.getenv('KEYSTORE_PASSWORD') ?: 'osrawy_clinical_pass'
                keyAlias System.getenv('KEY_ALIAS') ?: 'osrawy'
                keyPassword System.getenv('KEY_PASSWORD') ?: 'osrawy_clinical_pass'
            }
        }
    }
    buildTypes {
        release {
            minifyEnabled false
            if (file('release.keystore').exists()) {
                signingConfig signingConfigs.release
            }
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

repositories {
    flatDir{
        dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
    }
}

dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-cordova-android-plugins')
}

apply from: 'capacitor.build.gradle'

try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}

```

---

<a id="android-app-src-main-androidmanifest-xml"></a>
## 5. `android/app/src/main/AndroidManifest.xml`

**Description:** Native Android application manifest defining permissions, hardware acceleration, activity flags, and intent filters.  
**Lines:** 44 | **Size:** 1.6 KB

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

    <!-- Permissions -->

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
</manifest>

```

---

<a id="android-app-src-main-java-com-osrawy-clinicalnavigator-mainactivity-java"></a>
## 6. `android/app/src/main/java/com/osrawy/clinicalnavigator/MainActivity.java`

**Description:** Native Android Capacitor BridgeActivity entry point for hardware bridge and OS lifecycle.  
**Lines:** 139 | **Size:** 5.4 KB

```java
package com.osrawy.clinicalnavigator;

import android.content.Context;
import android.graphics.Color;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "OsrawyMainActivity";
    private boolean webViewConfigured = false;
    private OnBackPressedCallback backCallback;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupSystemBars();
        setupBackNavigation();
        configureWebViewOnce();
    }

    @Override
    public void onStart() {
        super.onStart();
        setupSystemBars();
        configureWebViewOnce();
    }

    private void setupSystemBars() {
        try {
            Window window = getWindow();
            if (window == null) return;

            // Keep WebView cleanly framed between system bars so adjustResize works
            // without notch clipping or double safe-area padding (targetSdk 34).
            WindowCompat.setDecorFitsSystemWindows(window, true);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

            int brandTeal = Color.parseColor("#0A4F4B");
            window.setStatusBarColor(brandTeal);
            window.setNavigationBarColor(brandTeal);

            // Force crisp white status & navigation icons over dark #0A4F4B bars
            WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(window, window.getDecorView());
            if (controller != null) {
                controller.setAppearanceLightStatusBars(false);
                controller.setAppearanceLightNavigationBars(false);
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to configure system bars", e);
        }
    }

    private void configureWebViewOnce() {
        if (webViewConfigured) return;
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
                webView.setVerticalScrollBarEnabled(false);
                webView.setHorizontalScrollBarEnabled(false);

                // Cap extreme Android system font zoom so sticky clinical headers don't break
                WebSettings settings = webView.getSettings();
                if (settings.getTextZoom() > 115) {
                    settings.setTextZoom(115);
                }

                webView.addJavascriptInterface(new PrintInterface(), "AndroidPrint");
                webViewConfigured = true;
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to configure WebView", e);
        }
    }

    private void setupBackNavigation() {
        backCallback = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(
                        "(function(){ return (window.handleAndroidBack && window.handleAndroidBack()) ? 'true' : 'false'; })();",
                        value -> {
                            if (!"\"true\"".equals(value) && !"true".equals(value)) {
                                runOnUiThread(() -> {
                                    backCallback.setEnabled(false);
                                    getOnBackPressedDispatcher().onBackPressed();
                                    backCallback.setEnabled(true);
                                });
                            }
                        }
                    );
                } else {
                    backCallback.setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    backCallback.setEnabled(true);
                }
            }
        };
        getOnBackPressedDispatcher().addCallback(this, backCallback);
    }

    public class PrintInterface {
        @JavascriptInterface
        public void print() {
            runOnUiThread(() -> {
                try {
                    PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (printManager != null && getBridge() != null && getBridge().getWebView() != null) {
                        PrintDocumentAdapter printAdapter =
                            getBridge().getWebView().createPrintDocumentAdapter("Osrawy_Clinical_Prescription");
                        printManager.print(
                            "Osrawy Clinical Prescription",
                            printAdapter,
                            new PrintAttributes.Builder().build()
                        );
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Failed to launch Android print dialog", e);
                }
            });
        }
    }
}

```

---

<a id="www-index-html"></a>
## 7. `www/index.html`

**Description:** Main single-page application entry point, DOM structure, modals, cockpit, navigation drawers, and script load order.  
**Lines:** 750 | **Size:** 48.8 KB

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <title>Osrawy Clinical Navigator</title>
  
  <link rel="stylesheet" href="css/fonts.css">

  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/diabetes.css">
  <link rel="stylesheet" href="css/htn.css">
  <link rel="stylesheet" href="css/lipids.css">
  <link rel="stylesheet" href="css/tools.css">
  <link rel="stylesheet" href="css/palette.css">
  <link rel="stylesheet" href="css/app.css">
  <link rel="stylesheet" href="css/phone-first.css">
</head>
<body>

  <!-- Top App Bar -->
  <header class="top-nav-bar">
    <div class="top-nav-content">
      <div class="app-brand">
        <div class="app-logo-badge">Rx</div>
        <div class="app-title-group">
          <h1 data-i18n="app_title">Osrawy Navigator</h1>
          <span data-i18n="app_subtitle">Dr Hossam Yousuf · Family Practice</span>
        </div>
      </div>
      <div class="top-actions">
        <button id="lang-toggle-btn" class="lang-pill-btn" title="Switch interface to English / التبديل للإنجليزية">🌐 English</button>
        <button id="btn-open-palette" class="icon-btn" title="البحث السريع والتنقل (Ctrl+K)" aria-label="البحث السريع" data-i18n-title="btn_quick_search" data-i18n-aria-label="btn_quick_search">🔍</button>
        <button id="open-drugs-btn" class="icon-btn" title="دليل الأدوية" aria-label="دليل الأدوية" data-i18n-title="btn_drugs_directory">💊</button>
        <button id="open-recent-btn" class="icon-btn" title="المسودات المحفوظة" aria-label="المسودات" data-i18n-title="btn_recent_drafts">📋</button>
        <button id="top-more-btn" class="icon-btn top-more-btn" aria-label="المزيد" aria-expanded="false" title="المزيد" type="button">⋮</button>

        <!-- More Menu Popover -->
        <div id="top-more-menu" class="top-more-menu" hidden aria-hidden="true" role="menu">
          <button id="market-toggle-btn" class="market-pill-btn menu-item-btn" role="menuitem" type="button" title="تبديل السوق (سعودي / مصري)">
            <span class="market-full">🇸🇦 السوق السعودي (SAR)</span><span class="market-short">🇸🇦 SAR</span>
          </button>
          <button id="btn-open-ldl-modal" class="ldl-pill-btn menu-item-btn" role="menuitem" type="button" title="أهداف الكوليسترول وخطة الستاتين (ADA 2025 / ESC 2023)" data-i18n-title="title_ldl_matrix">
            <span data-i18n="btn_ldl_matrix_nav">🎯 أهداف LDL والستاتين</span>
          </button>
          <button id="save-pt-btn" class="icon-btn menu-item-btn" role="menuitem" type="button" title="حفظ في المسودات" aria-label="حفظ المسودة" data-i18n-title="btn_save_draft" data-i18n-aria-label="btn_save_draft">
            💾 <span data-i18n="btn_save_draft_label">حفظ المسودة</span>
          </button>
          <button id="theme-toggle-btn" class="icon-btn menu-item-btn" role="menuitem" type="button" title="تبديل الوضع الليلي" aria-label="الوضع الليلي" data-i18n-title="btn_theme" data-i18n-aria-label="btn_theme">
            🌓 <span data-i18n="btn_theme_label">الوضع الليلي</span>
          </button>
          <button id="open-settings-btn" class="icon-btn menu-item-btn" role="menuitem" type="button" title="إعدادات الطبيب والعيادة" aria-label="الإعدادات" data-i18n-title="btn_settings" data-i18n-aria-label="btn_settings">
            ⚙️ <span data-i18n="btn_settings_label">الإعدادات</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Clinical Safety Guardrails Banner -->
  <div id="clinical-guardrail-banner" class="clinical-guardrail-banner" hidden></div>

  <!-- Unified Patient Cockpit (Zone 1: Identity Slot, Zone 2: Sticky Vitals Trigger) -->
  <div class="patient-cockpit" id="patient-cockpit">
    <div class="patient-summary-bar" id="patient-summary-bar">
      <!-- Populated dynamically by PatientSync -->
    </div>
    <header id="sticky-vitals-summary" class="sticky-vitals-bar" role="button" tabindex="0" aria-label="Quick Vitals Editor" aria-expanded="false">
      <div class="vitals-group">
        <span class="vital-chip" id="bar-egfr"><span class="vital-label">eGFR:</span> <b class="vital-val">68</b> <small>mL/min</small></span>
        <span class="vital-chip" id="bar-k"><span class="vital-label">K+:</span> <b class="vital-val">4.6</b> <small>mmol/L</small></span>
        <span class="vital-chip" id="bar-bp"><span class="vital-label">BP:</span> <b class="vital-val">148/94</b> <small>mmHg</small></span>
      </div>
      <div class="vitals-toggle-indicator" aria-hidden="true">
        <span class="vitals-toggle-text" data-i18n="vitals_quick_edit">تعديل سريع</span>
        <span class="vitals-toggle-arrow">▾</span>
      </div>
    </header>
  </div>

  <!-- Tap-to-Edit Vitals Quick Drawer (Expands down on tapping #sticky-vitals-summary) -->
  <section id="osrawy-vitals-quick-drawer" class="osrawy-vitals-quick-drawer" aria-hidden="true">
    <div class="osrawy-vitals-quick-grid">
      <div class="osrawy-vitals-field">
        <label for="quick-vital-egfr" data-i18n="vitals_egfr_label">الترشيح الكبيبي eGFR</label>
        <input type="number" id="quick-vital-egfr" min="1" max="250" step="1" inputmode="numeric" />
      </div>
      <div class="osrawy-vitals-field">
        <label for="quick-vital-k" data-i18n="vitals_k_label">البوتاسيوم K+</label>
        <input type="number" id="quick-vital-k" min="1.0" max="12.0" step="0.1" inputmode="decimal" />
      </div>
      <div class="osrawy-vitals-field">
        <label for="quick-vital-sbp" data-i18n="vitals_sbp_label">الضغط الانقباضي SBP</label>
        <input type="number" id="quick-vital-sbp" min="40" max="320" step="1" inputmode="numeric" />
      </div>
      <div class="osrawy-vitals-field">
        <label for="quick-vital-dbp" data-i18n="vitals_dbp_label">الضغط الانبساطي DBP</label>
        <input type="number" id="quick-vital-dbp" min="20" max="220" step="1" inputmode="numeric" />
      </div>
      <div class="osrawy-vitals-field">
        <label for="quick-vital-pregnancy" data-i18n="vitals_preg_label">الحمل / Pregnancy</label>
        <select id="quick-vital-pregnancy">
          <option value="false" data-i18n="vitals_preg_no">لا</option>
          <option value="true" data-i18n="vitals_preg_yes">نعم (حامل)</option>
        </select>
      </div>
    </div>
  </section>

  <!-- MAIN TAB 1: DIABETES NAVIGATOR -->
  <section id="tab-diabetes" class="main-view-section">
    <div class="tabbar"><div class="wrap">
  <nav class="tabs" role="tablist">
    <button role="tab" id="t-plan" aria-selected="true" data-tab="plan" style="--c:var(--teal)" data-i18n="tab_plan">Treatment &amp; prescription</button>
    <button role="tab" id="t-scr" aria-selected="false" data-tab="scr" style="--c:var(--sky)" data-i18n="tab_scr">Screening</button>
    <button role="tab" id="t-ins" aria-selected="false" data-tab="ins" style="--c:var(--grape)" data-i18n="tab_ins">Insulin calculator</button>
    <button role="tab" id="t-ref" aria-selected="false" data-tab="ref" style="--c:var(--sun)" data-i18n="tab_ref">Drugs &amp; prices</button>
  </nav>
</div></div>

<main class="wrap">

<!-- ============ PLAN ============ -->
<section id="plan" class="tab">
  <div class="grid">
    <form class="panel" id="pform" autocomplete="off">
      <div class="ph"><span class="ic">1</span><h2 data-i18n="dia_h2_pt_data">Patient data</h2></div>
      <p class="sub" data-i18n="dia_sub_pt_data">Example patient pre-filled. Replace with your patient's values.</p>
      <label class="costmode" for="cheap"><input type="checkbox" id="cheap" checked><span data-i18n="dia_cheap_desc"><b>Cheapest effective treatment first</b><br>Ranks low-cost options and local generics first, keeping heart and kidney protection.</span></label>
      <h3 data-i18n="dia_h3_basics">Basics</h3>
      <div class="fields">
        <div class="field full"><label for="pname" data-i18n="lbl_pname">Patient name</label><input id="pname" type="text" value="Ahmed Mahmoud" placeholder="e.g. Ahmed Mahmoud" data-i18n-placeholder="ph_pname"></div>
        <div class="field"><label for="age" data-i18n="lbl_age">Age (y)</label><input id="age" type="number" inputmode="numeric" value="52"></div>
        <div class="field"><label for="sex" data-i18n="lbl_sex">Sex</label><select id="sex"><option value="m" data-i18n="opt_male">Male</option><option value="f" data-i18n="opt_female">Female</option></select></div>
        <div class="field"><label for="wt" data-i18n="lbl_wt">Weight (kg)</label><input id="wt" type="number" step="0.1" inputmode="decimal" value="96"></div>
        <div class="field"><label for="ht" data-i18n="lbl_ht">Height (cm)</label><input id="ht" type="number" inputmode="numeric" value="170"></div>
        <div class="field"><label for="dur" data-i18n="lbl_dur">Diabetes duration (y)</label><input id="dur" type="number" inputmode="numeric" value="4"></div>
        <div class="field"><label for="hf" data-i18n="lbl_hf">Heart failure</label>
          <select id="hf"><option value="none" data-i18n="opt_hf_none">None</option><option value="hfref" data-i18n="opt_hf_ref">HFrEF</option><option value="hfpef" data-i18n="opt_hf_pef">HFpEF / HFmrEF</option></select></div>
      </div>
      <h3 data-i18n="dia_h3_labs">Labs</h3>
      <div class="fields">
        <div class="field"><label for="a1c" data-i18n="lbl_a1c">HbA1c (%)</label><input id="a1c" type="number" step="0.1" inputmode="decimal" value="8.9"></div>
        <div class="field"><label for="fpg" data-i18n="lbl_fpg">Fasting glucose (mg/dL)</label><input id="fpg" type="number" inputmode="numeric" value="190"></div>
        <div class="field">
          <div class="field-label-row">
            <label for="egfr" data-i18n="lbl_egfr">eGFR (mL/min/1.73m²)</label>
            <button type="button" class="btn-calc-pill btn-open-egfr-calc" title="حاسبة وظائف الكلى CKD-EPI 2021" data-i18n-title="calc_egfr_btn_title">🧮 <span data-i18n="btn_calc">حاسبة</span></button>
          </div>
          <input id="egfr" type="number" inputmode="numeric" value="68">
        </div>
        <div class="field"><label for="uacr" data-i18n="lbl_uacr">UACR (mg/g)</label><input id="uacr" type="number" inputmode="numeric" value="45"></div>
      </div>
      <h3 data-i18n="dia_h3_comorb">Comorbidities &amp; risk</h3>
      <div class="checks">
        <label><input type="checkbox" id="ascvd"><span data-i18n="chk_ascvd">Established ASCVD (MI, stroke, PAD)</span></label>
        <label><input type="checkbox" id="hrisk"><span data-i18n="chk_hrisk">High CV risk (age ≥55 + ≥2 risk factors / LVH)</span></label>
        <label><input type="checkbox" id="masld"><span data-i18n="chk_masld">MASLD / fatty liver</span></label>
        <label><input type="checkbox" id="smoker"><span data-i18n="chk_smoker">Current or ex-smoker</span></label>
        <label><input type="checkbox" id="hypo"><span data-i18n="chk_hypo">High hypoglycemia risk</span></label>
        <label><input type="checkbox" id="frail"><span data-i18n="chk_frail">Frail / limited life expectancy</span></label>
        <label><input type="checkbox" id="catab"><span data-i18n="chk_catab">Catabolic: weight loss, polyuria, ketosis</span></label>
        <label><input type="checkbox" id="pancr"><span data-i18n="chk_pancr">Pancreatitis / MTC / MEN2 history</span></label>
        <label><input type="checkbox" id="geni"><span data-i18n="chk_geni">Recurrent genital infections / UTI</span></label>
        <label><input type="checkbox" id="preg"><span data-i18n="chk_preg">Pregnant or planning pregnancy</span></label>
      </div>
      <button type="button" class="btn btn-sm btn-outline-primary btn-open-ldl-calc" style="margin-top:10px;width:100%;display:flex;align-items:center;justify-content:center;gap:6px;" data-i18n="btn_ldl_dia_trigger">🎯 أهداف LDL وخطة الستاتين (ADA 2025)</button>
      <h3 data-i18n="dia_h3_therapy">Current therapy</h3>
      <div class="checks">
        <label><input type="checkbox" id="c-met" checked><span data-i18n="chk_met">Metformin</span></label>
        <label><input type="checkbox" id="c-su"><span data-i18n="chk_su">Sulfonylurea</span></label>
        <label><input type="checkbox" id="c-dpp"><span data-i18n="chk_dpp">DPP-4 inhibitor</span></label>
        <label><input type="checkbox" id="c-sglt"><span data-i18n="chk_sglt">SGLT2 inhibitor</span></label>
        <label><input type="checkbox" id="c-glp"><span data-i18n="chk_glp">GLP-1 RA / tirzepatide</span></label>
        <label><input type="checkbox" id="c-pio"><span data-i18n="chk_pio">Pioglitazone</span></label>
        <label><input type="checkbox" id="c-ins"><span data-i18n="chk_ins">Basal insulin</span></label>
      </div>
    </form>
    <div class="panel" id="result" aria-live="polite"></div>
  </div>
</section>

<!-- ============ SCREENING ============ -->
<section id="scr" class="tab" hidden>
  <div class="panel" style="margin-bottom:20px">
    <div class="ph" style="--c:var(--sky);--cs:var(--sky-soft)"><span class="ic">S</span><h2 data-i18n="scr_title_needed">Screening needed for this patient</h2></div>
    <p class="sub" id="scrwho"></p>
    <div id="scrPersonal"></div>
  </div>
  <div class="two">
    <div class="panel">
      <div class="ph" style="--c:var(--sky);--cs:var(--sky-soft)"><span class="ic">?</span><h2 data-i18n="scr_title_who">Who to screen for type 2 diabetes</h2></div>
      <p class="sub" data-i18n="scr_sub_ada">ADA criteria for asymptomatic adults.</p>
      <ul>
        <li data-i18n="scr_item_1"><b>All adults ≥35 years</b>; repeat every 3 years if normal.</li>
        <li data-i18n="scr_item_2"><b>Any age, BMI ≥25 kg/m²</b> (≥23 Asian ancestry) <b>plus ≥1 risk factor</b>: first-degree relative with diabetes, CVD, hypertension, HDL &lt;35 or TG &gt;250 mg/dL, PCOS, inactivity, acanthosis nigricans, MASLD.</li>
        <li data-i18n="scr_item_3"><b>Prediabetes</b>: yearly. <b>Previous GDM</b>: at least every 3 years for life.</li>
        <li data-i18n="scr_item_4"><b>HIV</b>, <b>antipsychotics</b>, long-term <b>glucocorticoids</b>.</li>
        <li data-i18n="scr_item_5"><b>Youth</b>: overweight, after puberty or age ≥10, plus ≥1 risk factor.</li>
      </ul>
      <h3 data-i18n="scr_h3_diag">Diagnostic thresholds</h3>
      <div class="tbl"><table style="min-width:420px">
        <thead><tr><th data-i18n="th_test">Test</th><th data-i18n="th_normal">Normal</th><th data-i18n="th_prediabetes">Prediabetes</th><th data-i18n="th_diabetes">Diabetes</th></tr></thead>
        <tbody>
          <tr><td data-i18n="td_a1c">HbA1c</td><td class="mono">&lt;5.7%</td><td class="mono">5.7–6.4%</td><td class="mono">≥6.5%</td></tr>
          <tr><td data-i18n="td_fpg">Fasting plasma glucose</td><td class="mono">&lt;100</td><td class="mono">100–125</td><td class="mono">≥126 mg/dL</td></tr>
          <tr><td data-i18n="td_ogtt">2-h OGTT (75 g)</td><td class="mono">&lt;140</td><td class="mono">140–199</td><td class="mono">≥200 mg/dL</td></tr>
          <tr><td data-i18n="td_rpg">Random glucose + symptoms</td><td colspan="2" class="mono">—</td><td class="mono">≥200 mg/dL</td></tr>
        </tbody>
      </table></div>
      <p class="note" data-i18n="scr_note">Without clear symptoms, confirm with a second abnormal result. Use plasma glucose instead of HbA1c in anemia, hemoglobinopathy, pregnancy, recent transfusion or advanced CKD.</p>
    </div>
    <div class="panel">
      <div class="ph" style="--c:var(--leaf);--cs:var(--leaf-soft)"><span class="ic">✓</span><h2 data-i18n="scr_h2_checklist">Visit checklist</h2></div>
      <p class="sub"><span data-i18n="scr_sub_checklist">Tick items done this visit.</span> <span class="progress" id="ckprog"></span></p>
      <div id="cklist"></div>
    </div>
  </div>
</section>

<!-- ============ INSULIN ============ -->
<section id="ins" class="tab" hidden>
  <div class="grid">
    <div class="panel">
      <div class="ph" style="--c:var(--grape);--cs:var(--grape-soft)"><span class="ic">U</span><h2 data-i18n="ins_h2_calc">Insulin dose calculator</h2></div>
      <p class="sub" data-i18n="ins_sub_calc">Starting doses. Titrate on home glucose readings.</p>
      <div class="fields">
        <div class="field"><label for="iwt" data-i18n="lbl_wt">Weight (kg)</label><input id="iwt" type="number" step="0.1" inputmode="decimal" value="96"></div>
        <div class="field"><label for="ifpg" data-i18n="lbl_ifpg">Mean fasting glucose (mg/dL)</label><input id="ifpg" type="number" inputmode="numeric" value="190"></div>
        <div class="field"><label for="icur" data-i18n="lbl_icur">Current basal dose (U/day)</label><input id="icur" type="number" inputmode="numeric" value="0"></div>
        <div class="field"><label for="itdd" data-i18n="lbl_itdd">Current total daily dose (U)</label><input id="itdd" type="number" inputmode="numeric" value="0"></div>
        <div class="field full"><label for="isens" data-i18n="lbl_isens">Insulin sensitivity</label>
          <select id="isens">
            <option value="low" data-i18n="opt_sens_low">Sensitive: elderly, lean, eGFR &lt;30, hypo risk</option>
            <option value="mid" selected data-i18n="opt_sens_mid">Usual</option>
            <option value="high" data-i18n="opt_sens_high">Resistant: obese, steroids, HbA1c &gt;10</option>
          </select></div>
      </div>
      <h3 data-i18n="ins_h3_regimen">Regimen</h3>
      <div class="seg" id="iseg">
        <button type="button" data-r="basal" aria-pressed="true" data-i18n="btn_reg_basal">Start basal</button>
        <button type="button" data-r="titrate" aria-pressed="false" data-i18n="btn_reg_titrate">Titrate basal</button>
        <button type="button" data-r="bb" aria-pressed="false" data-i18n="btn_reg_bb">Basal-bolus</button>
        <button type="button" data-r="premix" aria-pressed="false" data-i18n="btn_reg_premix">Premixed</button>
        <button type="button" data-r="switch" aria-pressed="false" data-i18n="btn_reg_switch">Switch insulin</button>
      </div>
      <div id="iswitch" hidden>
        <div class="field full"><label for="ifrom" data-i18n="lbl_switch_from">Switch</label>
          <select id="ifrom">
            <option value="nph2" data-i18n="opt_sw_nph2">NPH twice daily → glargine U100 once daily</option>
            <option value="nph1" data-i18n="opt_sw_nph1">NPH once daily → glargine U100</option>
            <option value="g100g300" data-i18n="opt_sw_g100g300">Glargine U100 → glargine U300 (Toujeo)</option>
            <option value="g300g100" data-i18n="opt_sw_g300g100">Glargine U300 → glargine U100</option>
            <option value="gdeg" data-i18n="opt_sw_gdeg">Glargine U100 → degludec (Tresiba)</option>
            <option value="premixbb" data-i18n="opt_sw_premixbb">Premixed twice daily → basal-bolus</option>
          </select></div>
      </div>
    </div>
    <div class="panel" id="iresult" aria-live="polite"></div>
  </div>
  <div class="panel" style="margin-top:20px">
    <div class="ph" style="--c:var(--grape);--cs:var(--grape-soft)"><span class="ic">i</span><h2 id="ins-sec-title" data-i18n="ins_sec_title">Insulin products &amp; pharmacology</h2></div>
    <p class="sub" id="ins-sec-sub" data-i18n="ins_sec_sub">Human insulins are the lowest-cost choice. Availability and prices change; confirm with the pharmacy.</p>
    <div class="tbl"><table>
      <thead><tr><th data-i18n="th_type">Type</th><th data-i18n="th_generic">Generic</th><th id="th-ins-brand" data-i18n="th_brand">Brand(s)</th><th data-i18n="th_cost">Cost</th><th data-i18n="th_onset">Onset</th><th data-i18n="th_peak">Peak</th><th data-i18n="th_duration">Duration</th><th data-i18n="th_timing">Timing</th></tr></thead>
      <tbody id="instbl"></tbody>
    </table></div>
  </div>
</section>

<!-- ============ REFERENCE ============ -->
<section id="ref" class="tab" hidden>
  <div class="panel">
    <div class="ph" style="--c:var(--sun);--cs:var(--sun-soft)"><span class="ic">℞</span><h2 id="ref-sec-title" data-i18n="ref_sec_title">Non-insulin drugs: dose, kidney, brands, cost</h2></div>
    <p class="sub" id="ref-sec-sub" data-i18n="ref_sec_sub">Brands listed lowest cost first. Available in Saudi Arabia (SFDA) and Egypt. Prices change; confirm locally.</p>
    <div class="tbl"><table id="reftbl" style="min-width:900px">
      <thead><tr><th data-i18n="th_drug">Drug</th><th id="th-ref-brand" data-i18n="th_ref_brand">Brand(s), lowest cost first</th><th data-i18n="th_cost">Cost</th><th data-i18n="th_dose_range">Start → max dose</th><th data-i18n="th_kidney_egfr">Kidney (eGFR)</th><th data-i18n="th_cautions">Key cautions</th></tr></thead>
      <tbody></tbody>
    </table></div>
  </div>
</section>

<footer>
  <p data-i18n="dia_footer">Based on ADA Standards of Care in Diabetes, ADA/EASD consensus, KDIGO, and Saudi SFDA formularies. A decision aid for clinicians; it does not replace clinical judgement or the product label. · Osrawy Clinical Navigator — Dr Hossam Yousuf</p>
</footer>
</main>


  </section>

  <!-- MAIN TAB 2: HYPERTENSION NAVIGATOR -->
  <section id="tab-htn" class="main-view-section" style="display: none;">
    <div class="wrap">
<div class="htn-top-toolbar">
  <div class="lens" role="group" aria-label="Guideline">
    <button id="lens-acc" type="button" aria-pressed="true">ACC/AHA 2025</button>
    <button id="lens-esc" type="button" aria-pressed="false">ESC 2024</button>
  </div>
</div>

<div class="grid">
<form class="panel" id="f" autocomplete="off">
  <fieldset>
    <legend data-i18n="htn_legend_bp">Blood pressure (confirmed average, mmHg)</legend>
    <div class="bp">
      <input type="number" id="sbp" value="148" min="70" max="260" inputmode="numeric" aria-label="Systolic" data-i18n-aria-label="aria_systolic">
      <b>/</b>
      <input type="number" id="dbp" value="94" min="40" max="160" inputmode="numeric" aria-label="Diastolic" data-i18n-aria-label="aria_diastolic">
    </div>
    <div class="row">
      <label class="f"><span data-i18n="lbl_age_years">Age (years)</span><input type="number" id="htn-age" value="52" min="18" max="110" inputmode="numeric"></label>
      <label class="f"><span data-i18n="lbl_sex">Sex</span><select id="htn-sex"><option value="m" data-i18n="opt_male">Male</option><option value="f" data-i18n="opt_female">Female</option></select></label>
      <label class="f"><span data-i18n="lbl_cur_bp_drugs">Current BP drugs</span><select id="meds">
        <option value="0" selected data-i18n="opt_meds_none">None (new)</option><option value="1" data-i18n="opt_meds_1">1 class</option><option value="2" data-i18n="opt_meds_2">2 classes</option><option value="3" data-i18n="opt_meds_3">3+ incl. diuretic</option></select></label>
    </div>
    <label class="f"><span id="risk-l" data-i18n="lbl_cvd_risk">10-year CVD risk % (PREVENT)</span><input type="number" id="risk" placeholder="leave blank if not calculated" data-i18n-placeholder="ph_risk" min="0" max="100" step="0.1" inputmode="decimal"></label>
    <div class="chips">
      <label class="chip"><input type="checkbox" id="oob" checked><span data-i18n="chk_oob">Confirmed by home/ambulatory BP</span></label>
    </div>
  </fieldset>

  <fieldset>
    <legend data-i18n="htn_legend_comorb">Comorbidities &amp; compelling indications</legend>
    <div class="chips">
      <label class="chip"><input type="checkbox" id="dm" checked><span data-i18n="chk_htn_dm">Diabetes</span></label>
      <label class="chip"><input type="checkbox" id="cad"><span data-i18n="chk_cad">CAD / post-MI</span></label>
      <label class="chip"><input type="checkbox" id="hf-htn"><span data-i18n="chk_htn_hf">HFrEF</span></label>
      <label class="chip"><input type="checkbox" id="stroke"><span data-i18n="chk_stroke">Prior stroke / TIA</span></label>
      <label class="chip"><input type="checkbox" id="af"><span data-i18n="chk_af">Atrial fibrillation</span></label>
      <label class="chip"><input type="checkbox" id="gout"><span data-i18n="chk_gout">Gout</span></label>
      <label class="chip"><input type="checkbox" id="asthma"><span data-i18n="chk_asthma">Asthma</span></label>
      <label class="chip"><input type="checkbox" id="bph"><span data-i18n="chk_bph">BPH</span></label>
      <label class="chip"><input type="checkbox" id="frail-htn"><span data-i18n="chk_frail">Frail / limited life expectancy</span></label>
      <label class="chip"><input type="checkbox" id="ortho"><span data-i18n="chk_ortho">Orthostatic hypotension</span></label>
      <label class="chip" id="preg-c"><input type="checkbox" id="preg-htn"><span data-i18n="chk_preg_htn">Pregnant / planning pregnancy</span></label>
    </div>
  </fieldset>

  <fieldset>
    <legend data-i18n="htn_legend_labs">Labs</legend>
    <div class="row">
      <label class="f">
        <div class="field-label-row">
          <span data-i18n="lbl_egfr">eGFR (mL/min/1.73m²)</span>
          <button type="button" class="btn-calc-pill btn-open-egfr-calc" title="حاسبة وظائف الكلى CKD-EPI 2021" data-i18n-title="calc_egfr_btn_title">🧮 <span data-i18n="btn_calc">حاسبة</span></button>
        </div>
        <input type="number" id="htn-egfr" value="68" min="3" max="150" inputmode="numeric">
      </label>
      <label class="f"><span data-i18n="lbl_uacr">UACR (mg/g)</span><input type="number" id="htn-uacr" value="45" min="0" max="10000" inputmode="numeric"></label>
      <label class="f"><span data-i18n="lbl_k">K⁺ (mmol/L)</span><input type="number" id="k" value="4.6" min="2" max="8" step="0.1" inputmode="decimal"></label>
    </div>
    <p class="hint" data-i18n="hint_htn_labs">UACR ≥30 mg/g counts as albuminuria; eGFR &lt;60 or UACR ≥30 counts as CKD.</p>
  </fieldset>

  <fieldset>
    <legend data-i18n="htn_legend_prevent">10-year CVD risk calculator · AHA PREVENT</legend>
    <div class="row">
      <label class="f"><span data-i18n="lbl_tc">Total cholesterol</span><input type="number" id="tc" value="210" step="0.1" inputmode="decimal"></label>
      <label class="f"><span data-i18n="lbl_hdl">HDL cholesterol</span><input type="number" id="hdl" value="42" step="0.1" inputmode="decimal"></label>
      <label class="f"><span data-i18n="lbl_unit">Units</span><select id="lunit"><option value="mg">mg/dL</option><option value="mmol">mmol/L</option></select></label>
    </div>
    <div class="chips">
      <label class="chip"><input type="checkbox" id="smk"><span data-i18n="chk_smoker">Current smoker</span></label>
      <label class="chip"><input type="checkbox" id="statin"><span data-i18n="chk_statin">On statin</span></label>
    </div>
    <button type="button" class="btn btn-sm btn-outline-primary btn-open-ldl-calc" style="margin-top:8px;width:100%;display:flex;align-items:center;justify-content:center;gap:6px;" data-i18n="btn_ldl_htn_trigger">🎯 أهداف LDL وخطة الستاتين (ESC/ADA)</button>
    <div class="riskbox" id="riskbox"></div>
    <p class="hint" data-i18n="hint_prevent">Uses age, sex, SBP, diabetes, eGFR and BP-drug use from above. Base model, total CVD (ASCVD + heart failure). Valid for ages 30–79 without known CVD. The result fills the risk field automatically; type in that field to override it.</p>
  </fieldset>
</form>

<section class="panel sheet" aria-live="polite">
  <div class="sheet-h"><h2 data-i18n="htn_sec_rec">Recommendation</h2><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><button class="btn btn-whatsapp" id="btn-share-htn-whatsapp" type="button" onclick="RxShare.shareHtnWhatsApp()" data-i18n="btn_whatsapp">📲 واتساب</button><button class="btn btn-print" id="btn-print-htn" type="button" onclick="RxShare.printPrescription()" data-i18n="btn_print">🖨️ طباعة</button><button class="btn" id="copy" type="button" onclick="RxShare.copyHtnToClipboard()" data-i18n="btn_copy">📋 نسخ</button><span class="toast" id="toast" hidden data-i18n="toast_copied">Copied</span></div></div>
  <div id="out"></div>
  <details>
    <summary data-i18n="htn_details_summary">Drug reference: usual adult daily doses</summary>
    <div class="tbl"><table>
      <thead><tr><th data-i18n="htn_th_class">Class</th><th data-i18n="htn_th_drug">Drug</th><th data-i18n="htn_th_dose">Dose/day</th><th data-i18n="htn_th_watch">Watch for</th></tr></thead>
      <tbody>
        <tr><td>ACE inhibitor</td><td>Perindopril<br>Ramipril<br>Lisinopril</td><td class="n">4–8 mg<br>2.5–10 mg<br>10–40 mg</td><td data-i18n="htn_td_ace">Cough, angioedema, ↑K⁺, ↑creatinine. Teratogenic.</td></tr>
        <tr><td>ARB</td><td>Losartan<br>Valsartan<br>Telmisartan<br>Olmesartan<br>Candesartan</td><td class="n">50–100 mg<br>80–320 mg<br>40–80 mg<br>20–40 mg<br>8–32 mg</td><td data-i18n="htn_td_arb">↑K⁺, ↑creatinine. Teratogenic. Never with ACE inhibitor.</td></tr>
        <tr><td>DHP CCB</td><td>Amlodipine<br>Nifedipine ER</td><td class="n">2.5–10 mg<br>30–90 mg</td><td data-i18n="htn_td_ccb">Ankle oedema, flushing.</td></tr>
        <tr><td>Thiazide-like</td><td>Indapamide SR<br>Chlorthalidone<br>HCTZ</td><td class="n">1.5 mg<br>12.5–25 mg<br>25–50 mg</td><td data-i18n="htn_td_thia">↓Na⁺, ↓K⁺, ↑uric acid, ↑glucose.</td></tr>
        <tr><td>MRA</td><td>Spironolactone<br>Eplerenone</td><td class="n">25–50 mg<br>50–100 mg</td><td data-i18n="htn_td_mra">↑K⁺, gynaecomastia (spironolactone).</td></tr>
        <tr><td>Beta-blocker</td><td>Bisoprolol<br>Metoprolol succinate<br>Carvedilol</td><td class="n">2.5–10 mg<br>50–200 mg<br>12.5–50 mg (bd)</td><td data-i18n="htn_td_bb">Bradycardia, fatigue. Cardioselective in asthma.</td></tr>
        <tr><td data-i18n="htn_td_preg">Pregnancy</td><td>Labetalol<br>Nifedipine ER<br>Methyldopa</td><td class="n">200–2400 mg (bd–tds)<br>30–120 mg<br>500–3000 mg (bd–qid)</td><td data-i18n="htn_td_preg_c">Co-manage with obstetrics.</td></tr>
      </tbody>
    </table></div>
  </details>
</section>
</div>

<section class="tools" aria-labelledby="tools-h">
  <h2 id="tools-h" data-i18n="htn_tools_h">Switch &amp; titrate</h2>
  <p data-i18n="htn_tools_desc">Convert a dose to an approximately equipotent dose of another drug, and plan dose increases. Equivalences are approximate BP-lowering equivalents from standard conversion tables; always reassess BP 2–4 weeks after a change.</p>
  <div class="tgrid">
    <div class="panel">
      <h3 data-i18n="htn_switch_h3">Switch drug</h3>
      <div class="conv">
        <div class="row">
          <label class="f"><span data-i18n="lbl_from">From</span><select id="sw-from"></select></label>
          <label class="f"><span data-i18n="lbl_cur_dose">Current dose</span><select id="sw-dose"></select></label>
        </div>
        <div class="arrow" aria-hidden="true">↓</div>
        <label class="f"><span data-i18n="lbl_to">To</span><select id="sw-to"></select></label>
      </div>
      <div id="sw-out"></div>
    </div>
    <div class="panel">
      <h3 data-i18n="htn_titrate_h3">Titration plan</h3>
      <div class="row">
        <label class="f"><span data-i18n="lbl_drug">Drug</span><select id="ti-drug"></select></label>
        <label class="f"><span data-i18n="lbl_cur_dose">Current dose</span><select id="ti-dose"></select></label>
      </div>
      <div id="ti-out"></div>
    </div>
  </div>
</section>

<p class="foot" data-i18n="htn_foot">Decision support only, based on the 2025 AHA/ACC High Blood Pressure Guideline and the 2024 ESC Guidelines on Elevated BP and Hypertension. It does not replace clinical judgement, local formulary or the Saudi national hypertension guideline. Rule out secondary hypertension in patients under 40, with resistant hypertension, or with suggestive features.</p>
</div>


  </section>

  <!-- MAIN TAB 3: DRUG DIRECTORY & SAUDI MARKET FORMULARY -->
  <section id="tab-drugs" class="main-view-section wrap" style="display: none; padding-top: 20px;">
    <div class="panel">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
        <div>
          <h2 data-i18n="drugs_dir_title">دليل الأدوية والأسعار البديلة</h2>
          <p class="sub" data-i18n="drugs_dir_sub">ابحث في دليل الأدوية حسب المادة الفعالة أو الاسم التجاري وفئات الأسعار</p>
        </div>
        <div class="market-selector-box">
          <button id="market-btn-sa" class="active" data-i18n="drugs_btn_sa">السوق السعودي 🇸🇦 (SAR)</button>
          <button id="market-btn-eg" data-i18n="drugs_btn_eg">السوق المصري 🇪🇬 (EGP)</button>
        </div>
      </div>

      <div class="drug-search-bar">
        <input type="text" id="drug-search-input" placeholder="🔍 ابحث عن دواء... (مثال: Januvia, Forxiga, Metformin, Concor, Exforge)" data-i18n-placeholder="drugs_ph_search">
      </div>

      <div class="drug-filters-row">
        <span style="font-size: 12px; color: var(--muted); align-self: center;" data-i18n="drugs_lbl_cat">التصنيف:</span>
        <button class="filter-chip active" data-drug-filter="all" data-i18n="drugs_filter_all">الكل</button>
        <button class="filter-chip" data-drug-filter="diabetes" data-i18n="drugs_filter_diabetes">أدوية السكر</button>
        <button class="filter-chip" data-drug-filter="htn" data-i18n="drugs_filter_htn">أدوية الضغط</button>
        <button class="filter-chip" data-drug-filter="dlp" data-i18n="drugs_filter_dlp">الدهون</button>
        <button class="filter-chip" data-drug-filter="resp" data-i18n="drugs_filter_resp">الجهاز التنفسي</button>
        <button class="filter-chip" data-drug-filter="thyroid" data-i18n="drugs_filter_thyroid">الغدة الدرقية</button>
      </div>

      <div class="drug-filters-row">
        <span style="font-size: 12px; color: var(--muted); align-self: center;" data-i18n="drugs_lbl_tier">فئة السعر:</span>
        <button class="filter-chip active" data-drug-tier="all" data-i18n="drugs_tier_all">جميع الفئات</button>
        <button class="filter-chip" data-drug-tier="1" data-i18n="drugs_tier_1">● اقتصادي / منخفض</button>
        <button class="filter-chip" data-drug-tier="2" data-i18n="drugs_tier_2">●● متوسط</button>
        <button class="filter-chip" data-drug-tier="3" data-i18n="drugs_tier_3">●●● عالي التكلفة</button>
      </div>

      <div id="drugs-directory-container">
        <div id="drug-directory-list">
          <!-- Injected by DrugDirectory.render() -->
        </div>
      </div>
    </div>
  </section>

  <!-- MAIN TAB 4: RECENT PATIENTS DRAFTS -->
  <section id="tab-recent" class="main-view-section wrap" style="display: none; padding-top: 20px;">
    <div class="panel">
      <h2 data-i18n="recent_title">مسودات المرضى المحفوظة (أوفلاين)</h2>
      <p class="sub" data-i18n="recent_sub">يمكنك استرجاع أو استئناف بيانات أي مريض تم حفظه خلال جلسات العيادة</p>
      <div id="recent-patients-list">
        <!-- Injected by renderRecentPatients() -->
      </div>
    </div>
  </section>

  <!-- MAIN TAB: LIPIDS & DYSLIPIDEMIA (DLP) -->
  <section id="tab-dlp" class="tab-panel main-view-section wrap" hidden style="display: none; padding-top: 14px;">
    <div class="panel" style="margin-bottom:14px;" id="dlp-inputs-panel">
      <div class="ph" style="--c:var(--teal);--cs:var(--teal-soft)"><span class="ic">🩸</span><h2 data-i18n="dlp_inputs_title">بيانات الدهون ومخاطر القلب (Lipids &amp; ASCVD)</h2></div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-top:10px;">
        <div>
          <label style="font-size:12px; color:var(--muted);" data-i18n="lbl_ldl">LDL-C:</label>
          <input type="number" id="dlp-ldl" class="clinical-input" value="130" step="1" inputmode="numeric">
        </div>
        <div>
          <label style="font-size:12px; color:var(--muted);" data-i18n="lbl_tc">Total Chol (TC):</label>
          <input type="number" id="dlp-tc" class="clinical-input" value="210" step="1" inputmode="numeric">
        </div>
        <div>
          <label style="font-size:12px; color:var(--muted);" data-i18n="lbl_hdl">HDL-C:</label>
          <input type="number" id="dlp-hdl" class="clinical-input" value="42" step="1" inputmode="numeric">
        </div>
        <div>
          <label style="font-size:12px; color:var(--muted);" data-i18n="lbl_tg">Triglycerides (TG):</label>
          <input type="number" id="dlp-tg" class="clinical-input" value="180" step="1" inputmode="numeric">
        </div>
        <div>
          <label style="font-size:12px; color:var(--muted);" data-i18n="lbl_alt">ALT (U/L):</label>
          <input type="number" id="dlp-alt" class="clinical-input" value="28" step="1" inputmode="numeric">
        </div>
        <div>
          <label style="font-size:12px; color:var(--muted);" data-i18n="lbl_unit">الوحدة:</label>
          <select id="dlp-unit" class="clinical-select">
            <option value="mg">mg/dL</option>
            <option value="mmol">mmol/L</option>
          </select>
        </div>
      </div>
      <div style="display:flex; gap:14px; flex-wrap:wrap; margin-top:10px; font-size:13px;">
        <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="dlp-statin-intol"> <span data-i18n="chk_statin_intol">عدم تحمل الستاتين (Statin Intolerant)</span></label>
        <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="dlp-ezetimibe"> <span data-i18n="chk_on_ezetimibe">يتناول Ezetimibe</span></label>
      </div>
    </div>
    <div id="lipids-container"></div>
  </section>

  <!-- MAIN TAB: CLINICAL TOOLS & PRIMARY CARE -->
  <section id="tab-tools" class="tab-panel main-view-section wrap" hidden style="display: none; padding-top: 14px;">
    <div id="primary-care-container"></div>
    <div id="clinical-tools-container"></div>
  </section>

  <!-- MAIN TAB: PATIENT LEAFLETS -->
  <section id="tab-leaflets" class="tab-panel main-view-section" hidden style="display: none;">
    <div class="osrawy-handoff-exit-bar">
      <button type="button" id="osrawy-exit-handoff-btn" class="osrawy-ux-btn">
        <span data-i18n="handoff_exit_btn">✕ إنهاء وضع المريض</span>
      </button>
    </div>
    <div class="clinician-only-controls">
      <button type="button" id="osrawy-enter-handoff-btn" class="osrawy-ux-btn">
        <span data-i18n="handoff_enter_btn">📱 وضع شاشة المريض</span>
      </button>
    </div>
    <div id="patient-leaflet-container"></div>
  </section>

  <!-- Docked Command Bar (<= 40px) wrapping Quick-Jump and SOAP Consultation Cart -->
  <div id="osrawy-docked-command-bar" class="osrawy-docked-command-bar">
    <button type="button" id="osrawy-soap-fab" class="osrawy-soap-fab" aria-label="EMR SOAP Summary">
      <span>📋 <span data-i18n="soap_fab_label">ملخص SOAP</span></span>
      <span id="osrawy-soap-count" class="osrawy-soap-badge">0</span>
    </button>
    <button id="quick-jump-rx-btn" class="quick-jump-pill" type="button" title="انتقال سريع للروشتة والتوصيات" data-i18n-title="quick_jump_title">
      <span class="jump-icon">⚡</span>
      <span class="jump-text" data-i18n="quick_jump_rx">الروشتة والتوصيات ⬇</span>
    </button>
  </div>

  <div id="osrawy-soap-backdrop" class="osrawy-soap-backdrop" aria-hidden="true"></div>

  <aside id="osrawy-soap-drawer" class="osrawy-soap-drawer" aria-hidden="true">
    <div class="osrawy-soap-handle" aria-hidden="true"></div>
    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <strong id="osrawy-soap-title" data-i18n="soap_drawer_title" style="font-size:0.98rem;">
        ملخص الاستشارة الطبية (SOAP)
      </strong>
      <button type="button" id="osrawy-soap-close" class="osrawy-ux-btn" style="min-height:38px; padding:4px 12px;">✕</button>
    </div>
    <textarea id="osrawy-soap-textarea" class="osrawy-soap-textarea" readonly></textarea>
    <div class="osrawy-soap-actions" style="display:flex; gap:8px; flex-wrap:wrap;">
      <button type="button" id="osrawy-soap-sync-active" class="osrawy-ux-btn" style="flex:1; min-height:44px;" data-i18n="soap_pull_btn">
        🔄 تحديث من المحركات
      </button>
      <button type="button" id="osrawy-soap-copy" class="osrawy-ux-btn is-primary" style="flex:2; min-height:44px;" data-i18n="soap_copy_btn">
        📋 نسخ الملاحظة
      </button>
      <button type="button" id="osrawy-soap-clear" class="osrawy-ux-btn" style="min-height:44px; padding:0 14px;" aria-label="Clear SOAP">
        🗑️
      </button>
    </div>
  </aside>

  <!-- Osrawy Bottom Navigation Bar -->
  <nav class="osrawy-bottom-nav bottom-nav-bar">
    <button class="osrawy-nav-btn main-nav-btn active" data-tab="tab-diabetes">
      <span class="nav-icon">🩺</span>
      <span class="nav-text" data-i18n="nav_diabetes">السكر</span>
    </button>
    <button class="osrawy-nav-btn main-nav-btn" data-tab="tab-htn">
      <span class="nav-icon">💓</span>
      <span class="nav-text" data-i18n="nav_htn">الضغط</span>
    </button>
    <button class="osrawy-nav-btn main-nav-btn" data-tab="tab-dlp">
      <span class="nav-icon">🩸</span>
      <span class="nav-text" data-i18n="nav_dlp">الدهون</span>
    </button>
    <button class="osrawy-nav-btn main-nav-btn" data-tab="tab-tools">
      <span class="nav-icon">🧮</span>
      <span class="nav-text" data-i18n="nav_tools">الأدوات</span>
    </button>
    <button class="osrawy-nav-btn main-nav-btn" data-tab="tab-leaflets">
      <span class="nav-icon">📑</span>
      <span class="nav-text" data-i18n="nav_leaflets">النشرات</span>
    </button>
  </nav>

  <!-- Settings Modal -->
  <div class="modal-overlay" id="settings-modal">
    <div class="modal-card">
      <div class="modal-header">
        <h3 style="margin:0" data-i18n="settings_title">⚙️ بيانات الطبيب والعيادة (للروشتة والطباعة)</h3>
        <button class="icon-btn" id="close-settings-btn" style="color:var(--ink)">✕</button>
      </div>
      <div class="modal-body">
        <div class="field" style="margin-bottom:10px">
          <label data-i18n="settings_lbl_name">اسم الطبيب:</label>
          <input type="text" id="set-dr-name">
        </div>
        <div class="field" style="margin-bottom:10px">
          <label data-i18n="settings_lbl_title">التخصص والدرجة العلمية:</label>
          <input type="text" id="set-dr-title">
        </div>
        <div class="field" style="margin-bottom:10px">
          <label data-i18n="settings_lbl_clinic">اسم العيادة / المركز الطبي:</label>
          <input type="text" id="set-clinic-name">
        </div>
        <div class="field" style="margin-bottom:10px">
          <label data-i18n="settings_lbl_phone">رقم هاتف العيادة / الواتساب:</label>
          <input type="text" id="set-clinic-phone">
        </div>
        <div class="field" style="margin-bottom:10px">
          <label data-i18n="settings_lbl_addr">العنوان والمدينة:</label>
          <input type="text" id="set-clinic-addr">
        </div>

        <!-- In-App GitHub Updates -->
        <div class="update-section">
          <div class="update-header">
            <div>
              <b data-i18n="update_sec_title">🔄 تحديثات التطبيق (GitHub)</b>
              <div style="font-size:11.5px;color:var(--muted);" data-i18n="update_sec_sub">فحص وتحميل أحدث الإصدارات من GitHub</div>
            </div>
            <span class="update-version-tag" id="current-app-version">v1.2.12</span>
          </div>
          <button type="button" class="btn btn-sm btn-primary" id="btn-check-updates" style="margin-top:6px;width:100%;" data-i18n="btn_check_updates">
            🔍 التحقق من وجود تحديثات الآن
          </button>
          <span class="update-status" id="update-status-text"></span>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" id="save-settings-btn" data-i18n="settings_btn_save">حفظ الإعدادات</button>
      </div>
    </div>
  </div>

  <!-- CKD-EPI 2021 eGFR & CrCl Calculator Modal -->
  <div class="modal-overlay" id="egfr-modal">
    <div class="modal-card modal-medium">
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:22px;">🧮</span>
          <div>
            <h3 style="margin:0;font-size:16px;" data-i18n="calc_modal_title">حاسبة وظائف الكلى (CKD-EPI 2021)</h3>
            <span style="font-size:11px;color:var(--muted);" data-i18n="calc_modal_sub">معادلة CKD-EPI 2021 الخالية من العرق + Cockcroft-Gault CrCl</span>
          </div>
        </div>
        <button type="button" class="icon-btn" id="close-egfr-modal-btn" style="color:var(--ink)" aria-label="إغلاق">✕</button>
      </div>
      <div class="modal-body">
        <div class="calc-inputs-grid">
          <div class="field">
            <label data-i18n="calc_lbl_scr">الكرياتينين بالدم (Serum Creatinine):</label>
            <div class="calc-input-with-unit">
              <input type="number" id="calc-scr" step="0.01" min="0.1" max="25" placeholder="1.0" value="1.0" inputmode="decimal">
              <select id="calc-scr-unit">
                <option value="mg" selected>mg/dL</option>
                <option value="umol">µmol/L</option>
              </select>
            </div>
            <small style="color:var(--muted);font-size:11px;" data-i18n="calc_hint_unit">1 mg/dL = 88.4 µmol/L</small>
          </div>
          <div class="field">
            <label data-i18n="lbl_age">العمر (سنة):</label>
            <input type="number" id="calc-age" min="18" max="115" value="52" inputmode="numeric">
          </div>
          <div class="field">
            <label data-i18n="lbl_sex">الجنس البيولوجي:</label>
            <select id="calc-sex">
              <option value="m" data-i18n="opt_male">ذكر (Male)</option>
              <option value="f" data-i18n="opt_female">أنثى (Female)</option>
            </select>
          </div>
          <div class="field">
            <label data-i18n="calc_lbl_wt">الوزن (كجم - لحساب CrCl):</label>
            <input type="number" id="calc-wt" min="20" max="300" step="0.1" value="96" inputmode="decimal">
          </div>
        </div>

        <!-- Live calculation output -->
        <div id="calc-egfr-output" style="margin-top:14px;">
          <!-- Populated by ClinicalTools.renderEgfrCalculation() -->
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="ClinicalTools.closeEgfrModal()" data-i18n="btn_cancel">إلغاء</button>
        <button type="button" class="btn btn-primary" id="btn-apply-calculated-egfr" data-i18n="btn_apply_egfr">
          ✅ تطبيق الناتج على المريض
        </button>
      </div>
    </div>
  </div>

  <!-- ASCVD LDL-C Goals & Statin Intensity Guide Modal -->
  <div class="modal-overlay" id="ldl-modal">
    <div class="modal-card modal-wide">
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:22px;">🎯</span>
          <div>
            <h3 style="margin:0;font-size:16px;" data-i18n="ldl_modal_title">أهداف الكوليسترول وخطة الستاتين (ASCVD LDL-C Goals & Statins)</h3>
            <span style="font-size:11px;color:var(--muted);" data-i18n="ldl_modal_sub">إرشادات الجمعية الأمريكية للسكري ADA 2025 والجمعية الأوروبية لأمراض القلب ESC 2023</span>
          </div>
        </div>
        <button type="button" class="icon-btn" id="close-ldl-modal-btn" style="color:var(--ink)" aria-label="إغلاق">✕</button>
      </div>
      <div class="modal-body" id="ldl-matrix-container">
        <!-- Populated dynamically by ClinicalTools.renderLdlMatrix() -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="ClinicalTools.closeLdlModal()" data-i18n="btn_close">إغلاق</button>
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script src="js/i18n.js"></script>
  <script src="js/drugs_data.js"></script>
  <script src="js/patient_sync.js"></script>
  <script src="js/clinical_tools.js"></script>
  <script src="js/lipids_engine.js"></script>
  <script src="js/primary_care_engine.js"></script>
  <script src="js/prescription_share.js"></script>
  <script src="js/drugs_directory.js"></script>
  <script src="js/diabetes_engine.js"></script>
  <script src="js/htn_engine.js"></script>
  <script src="js/patient_leaflets.js"></script>
  <script src="js/command_palette.js"></script>
  <script src="js/phone_ux.js"></script>
  <script src="js/updater.js"></script>
  <script src="js/app.js"></script>
</body>
</html>

```

---

<a id="www-css-tokens-css"></a>
## 8. `www/css/tokens.css`

**Description:** Design system design tokens, CSS custom properties, color palettes, and spacing variables.  
**Lines:** 345 | **Size:** 7.8 KB

```css
/* ==============================================================
   Osrawy Clinical Navigator - Unified Design Tokens & Shared Components
   ============================================================== */

:root {
  /* Surfaces */
  --bg: #F2F7F6;
  --surface: #FFFFFF;
  --surface2: #E9F2F0;
  --surface-secondary: #F1F5F9;
  --card-bg: #FFFFFF;
  --highlight-bg: #F8FAFC;

  /* Typography & Ink */
  --ink: #0F2B2A;
  --muted: #55716E;
  --text-color: #0F2B2A;
  --text-muted: #55716E;

  /* Borders & Lines */
  --line: #D3E3DF;
  --border: #CBD5E1;
  --border-color: #CBD5E1;

  /* Brand & Navigation */
  --teal: #0E7C74;
  --teal-soft: #DCF1EE;
  --app-primary: #0A4F4B;
  --hero1: #0A4F4B;
  --hero2: #0E7C74;
  --on-hero: #FFFFFF;

  /* Clinical Semantics */
  --coral: #DD4552;
  --coral-soft: #FCE5E7;
  --sun: #D98A07;
  --sun-soft: #FDF0D6;
  --sky: #2C6FDB;
  --sky-soft: #E2ECFC;
  --grape: #7550CF;
  --grape-soft: #EDE7FB;
  --leaf: #1F8B53;
  --leaf-soft: #DFF3E7;

  /* Semantic Alerts */
  --danger-bg: #FEF2F2;
  --danger-border: #FCA5A5;
  --danger-text: #991B1B;
  --danger-accent: #DC2626;

  --warn-bg: #FFFBEB;
  --warn-border: #FCD34D;
  --warn-text: #92400E;
  --warn-accent: #D97706;

  --safe-bg: #ECFDF5;
  --safe-border: #A7F3D0;
  --safe-text: #065F46;
  --safe-accent: #10B981;

  --info-bg: #F0FDFA;
  --info-border: #99F6E4;
  --info-text: #134E4A;
  --info-accent: #0D9488;

  /* Dimensions & Ergonomics */
  --nav-h: 60px;
  --vitals-drawer-top: 44px;
  --osrawy-touch-min: 48px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-pill: 9999px;
  --shadow: 0 1px 2px rgba(15, 43, 42, 0.06), 0 6px 18px rgba(15, 43, 42, 0.06);

  /* Fonts (100% Offline Local WOFF2) */
  --f-display: "IBM Plex Sans Arabic", system-ui, sans-serif;
  --f-body: "IBM Plex Sans Arabic", system-ui, sans-serif;
  --f-mono: "IBM Plex Mono", ui-monospace, monospace;
  --f-ar: "IBM Plex Sans Arabic", system-ui, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0B1716;
    --surface: #122220;
    --surface2: #182D2B;
    --surface-secondary: #1F2E2C;
    --card-bg: #122220;
    --highlight-bg: #182D2B;

    --ink: #E2F0ED;
    --muted: #8EAFAA;
    --text-color: #E2F0ED;
    --text-muted: #8EAFAA;

    --line: #24403C;
    --border: #2D4A45;
    --border-color: #2D4A45;

    --teal: #3CC7B8;
    --teal-soft: #113431;
    --app-primary: #3CC7B8;
    --hero1: #08332F;
    --hero2: #0D5650;
    --on-hero: #F2FBF9;

    --coral: #FF7C87;
    --coral-soft: #3A1B1F;
    --sun: #FFC24F;
    --sun-soft: #3A2C0F;
    --sky: #82B1FF;
    --sky-soft: #15264A;
    --grape: #B49CFF;
    --grape-soft: #29204A;
    --leaf: #5AD68E;
    --leaf-soft: #11321E;

    --danger-bg: rgba(220, 38, 38, 0.14);
    --danger-border: rgba(239, 68, 68, 0.35);
    --danger-text: #FCA5A5;
    --danger-accent: #EF4444;

    --warn-bg: rgba(217, 119, 6, 0.14);
    --warn-border: rgba(252, 211, 77, 0.3);
    --warn-text: #FDE68A;
    --warn-accent: #F59E0B;

    --safe-bg: rgba(16, 185, 129, 0.14);
    --safe-border: rgba(52, 211, 153, 0.3);
    --safe-text: #6EE7B7;
    --safe-accent: #10B981;

    --info-bg: rgba(13, 148, 136, 0.14);
    --info-border: rgba(153, 246, 228, 0.3);
    --info-text: #99F6E4;
    --info-accent: #14B8A6;

    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    color-scheme: dark;
  }
}

:root[data-theme="dark"],
[data-theme="dark"] {
  --bg: #0B1716;
  --surface: #122220;
  --surface2: #182D2B;
  --surface-secondary: #1F2E2C;
  --card-bg: #122220;
  --highlight-bg: #182D2B;

  --ink: #E2F0ED;
  --muted: #8EAFAA;
  --text-color: #E2F0ED;
  --text-muted: #8EAFAA;

  --line: #24403C;
  --border: #2D4A45;
  --border-color: #2D4A45;

  --teal: #3CC7B8;
  --teal-soft: #113431;
  --app-primary: #3CC7B8;
  --hero1: #08332F;
  --hero2: #0D5650;
  --on-hero: #F2FBF9;

  --coral: #FF7C87;
  --coral-soft: #3A1B1F;
  --sun: #FFC24F;
  --sun-soft: #3A2C0F;
  --sky: #82B1FF;
  --sky-soft: #15264A;
  --grape: #B49CFF;
  --grape-soft: #29204A;
  --leaf: #5AD68E;
  --leaf-soft: #11321E;

  --danger-bg: rgba(220, 38, 38, 0.14);
  --danger-border: rgba(239, 68, 68, 0.35);
  --danger-text: #FCA5A5;
  --danger-accent: #EF4444;

  --warn-bg: rgba(217, 119, 6, 0.14);
  --warn-border: rgba(252, 211, 77, 0.3);
  --warn-text: #FDE68A;
  --warn-accent: #F59E0B;

  --safe-bg: rgba(16, 185, 129, 0.14);
  --safe-border: rgba(52, 211, 153, 0.3);
  --safe-text: #6EE7B7;
  --safe-accent: #10B981;

  --info-bg: rgba(13, 148, 136, 0.14);
  --info-border: rgba(153, 246, 228, 0.3);
  --info-text: #99F6E4;
  --info-accent: #14B8A6;

  --shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  color-scheme: dark;
}

/* ==============================================================
   Shared Component Styling (Defect #7 Fixes)
   ============================================================== */

/* Action Chips (Drug Directory & Leaflets) */
.action-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--ink);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  min-height: 36px;
  transition: all 0.15s ease;
  user-select: none;
}
.action-chip:hover {
  background: var(--surface);
  border-color: var(--teal);
}
.action-chip.primary-chip {
  background: var(--app-primary, var(--teal));
  border-color: var(--app-primary, var(--teal));
  color: #FFFFFF;
}

/* Renal Safety Card Accents */
.drug-card-safe {
  border-inline-start: 4px solid var(--leaf) !important;
}
.drug-card-caution {
  border-inline-start: 4px solid var(--sun) !important;
}
.drug-card-contraindicated {
  border-inline-start: 4px solid var(--coral) !important;
}

/* Pill Buttons & Topic Badges */
.pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.leaflet-topic-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--ink);
  margin-bottom: 8px;
}
.leaflet-topic-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

/* Utility Buttons */
.btn-outline-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--app-primary, var(--teal));
  background: transparent;
  color: var(--app-primary, var(--teal));
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
}
.btn-outline-primary:hover {
  background: var(--app-primary, var(--teal));
  color: #FFFFFF;
}
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--ink);
  font-weight: 600;
  font-size: 13.5px;
  cursor: pointer;
}
.mt-3 {
  margin-top: 12px !important;
}
.text-center {
  text-align: center !important;
}

/* Clinical Inputs / Selects */
.clinical-input,
.clinical-select {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--ink);
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
}

/* Pregnancy & Obstetric Protocol Cards */
.pregnancy-protocol-card {
  background: #FDF2F8;
  border: 1px solid #F9A8D4;
  border-inline-start: 4px solid #DB2777;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 14px;
  color: #831843;
}

[data-theme="dark"] .pregnancy-protocol-card,
:root[data-theme="dark"] .pregnancy-protocol-card {
  background: rgba(219, 39, 119, 0.15);
  border: 1px solid rgba(219, 39, 119, 0.4);
  border-inline-start: 4px solid #EC4899;
  color: #F472B6;
}

```

---

<a id="www-css-fonts-css"></a>
## 9. `www/css/fonts.css`

**Description:** Local font-face definitions (IBM Plex Sans Arabic and IBM Plex Mono) for 100% offline hospital compliance.  
**Lines:** 84 | **Size:** 4.9 KB

```css
/* ==============================================================
   Osrawy Clinical Navigator - 100% Offline Local Fonts
   ============================================================== */

/* IBM Plex Sans Arabic - Regular 400 (Arabic) */
@font-face {
  font-family: 'IBM Plex Sans Arabic';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../fonts/IBMPlexSansArabic-400.woff2') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC7, U+10EC9-10EEE, U+10EF0-10EFF, U+1EE00-1EE03, U+1EE05-1EE1F, U+1EE21-1EE22, U+1EE24, U+1EE27, U+1EE29-1EE32, U+1EE34-1EE37, U+1EE39, U+1EE3B, U+1EE42, U+1EE47, U+1EE49, U+1EE4B, U+1EE4D-1EE4F, U+1EE51-1EE52, U+1EE54, U+1EE57, U+1EE59, U+1EE5B, U+1EE5D, U+1EE5F, U+1EE61-1EE62, U+1EE64, U+1EE67-1EE6A, U+1EE6C-1EE72, U+1EE74-1EE77, U+1EE79-1EE7C, U+1EE7E, U+1EE80-1EE89, U+1EE8B-1EE9B, U+1EEA1-1EEA3, U+1EEA5-1EEA9, U+1EEAB-1EEBB, U+1EEF0-1EEF1;
}

/* IBM Plex Sans Arabic - Regular 400 (Latin & Numbers) */
@font-face {
  font-family: 'IBM Plex Sans Arabic';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../fonts/IBMPlexSansArabic-400-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* IBM Plex Sans Arabic - SemiBold 600 (Arabic) */
@font-face {
  font-family: 'IBM Plex Sans Arabic';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('../fonts/IBMPlexSansArabic-600.woff2') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC7, U+10EC9-10EEE, U+10EF0-10EFF, U+1EE00-1EE03, U+1EE05-1EE1F, U+1EE21-1EE22, U+1EE24, U+1EE27, U+1EE29-1EE32, U+1EE34-1EE37, U+1EE39, U+1EE3B, U+1EE42, U+1EE47, U+1EE49, U+1EE4B, U+1EE4D-1EE4F, U+1EE51-1EE52, U+1EE54, U+1EE57, U+1EE59, U+1EE5B, U+1EE5D, U+1EE5F, U+1EE61-1EE62, U+1EE64, U+1EE67-1EE6A, U+1EE6C-1EE72, U+1EE74-1EE77, U+1EE79-1EE7C, U+1EE7E, U+1EE80-1EE89, U+1EE8B-1EE9B, U+1EEA1-1EEA3, U+1EEA5-1EEA9, U+1EEAB-1EEBB, U+1EEF0-1EEF1;
}

/* IBM Plex Sans Arabic - SemiBold 600 (Latin & Numbers) */
@font-face {
  font-family: 'IBM Plex Sans Arabic';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('../fonts/IBMPlexSansArabic-600-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* IBM Plex Sans Arabic - Bold 700 (Arabic) */
@font-face {
  font-family: 'IBM Plex Sans Arabic';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('../fonts/IBMPlexSansArabic-700.woff2') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC7, U+10EC9-10EEE, U+10EF0-10EFF, U+1EE00-1EE03, U+1EE05-1EE1F, U+1EE21-1EE22, U+1EE24, U+1EE27, U+1EE29-1EE32, U+1EE34-1EE37, U+1EE39, U+1EE3B, U+1EE42, U+1EE47, U+1EE49, U+1EE4B, U+1EE4D-1EE4F, U+1EE51-1EE52, U+1EE54, U+1EE57, U+1EE59, U+1EE5B, U+1EE5D, U+1EE5F, U+1EE61-1EE62, U+1EE64, U+1EE67-1EE6A, U+1EE6C-1EE72, U+1EE74-1EE77, U+1EE79-1EE7C, U+1EE7E, U+1EE80-1EE89, U+1EE8B-1EE9B, U+1EEA1-1EEA3, U+1EEA5-1EEA9, U+1EEAB-1EEBB, U+1EEF0-1EEF1;
}

/* IBM Plex Sans Arabic - Bold 700 (Latin & Numbers) */
@font-face {
  font-family: 'IBM Plex Sans Arabic';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('../fonts/IBMPlexSansArabic-700-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* IBM Plex Mono - Regular 400 */
@font-face {
  font-family: 'IBM Plex Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../fonts/IBMPlexMono-400.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* IBM Plex Mono - Bold 700 */
@font-face {
  font-family: 'IBM Plex Mono';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('../fonts/IBMPlexMono-700.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

```

---

<a id="www-css-palette-css"></a>
## 10. `www/css/palette.css`

**Description:** Global command palette overlay styles and shortcut modal.  
**Lines:** 306 | **Size:** 6.4 KB

```css
/* Osrawy Clinical Navigator - Global Command Palette (Spotlight / Cmd+K) */

.cmd-palette-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 16px 16px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.2s;
}

.cmd-palette-backdrop.open {
  opacity: 1;
  visibility: visible;
}

.cmd-palette-modal {
  width: 100%;
  max-width: 580px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--line, rgba(226, 232, 240, 0.9));
  border-radius: 16px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  transform: translateY(-16px) scale(0.98);
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.cmd-palette-backdrop.open .cmd-palette-modal {
  transform: translateY(0) scale(1);
}

/* Header & Search Input */
.cmd-palette-header {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--line, #e2e8f0);
  background: var(--surface2, #f8fafc);
  gap: 12px;
}

.cmd-palette-search-icon {
  font-size: 1.15rem;
  color: var(--teal, #0d9488);
  flex-shrink: 0;
}

.cmd-palette-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 500;
  color: var(--ink, #0f172a);
  padding: 0;
}

.cmd-palette-input::placeholder {
  color: var(--muted, #64748b);
  font-size: 0.9rem;
}

.cmd-palette-esc-badge {
  font-size: 0.72rem;
  font-family: var(--f-mono, monospace);
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--line, #cbd5e1);
  color: var(--muted, #64748b);
  flex-shrink: 0;
}

/* Results Section */
.cmd-palette-results {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cmd-palette-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted, #64748b);
  padding: 8px 12px 4px;
}

/* Result Item */
.cmd-palette-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
  user-select: none;
}

.cmd-palette-item:hover,
.cmd-palette-item.is-selected {
  background: var(--teal-soft, rgba(13, 148, 136, 0.08));
  border-color: rgba(13, 148, 136, 0.3);
}

.cmd-palette-item:active {
  transform: scale(0.99);
}

.cmd-palette-item-icon {
  font-size: 1.25rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--surface, #ffffff);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.cmd-palette-item-body {
  flex: 1;
  min-width: 0;
}

.cmd-palette-item-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--ink, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cmd-palette-item-desc {
  font-size: 0.78rem;
  color: var(--muted, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.cmd-palette-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--surface2, #f1f5f9);
  color: var(--muted, #475569);
  flex-shrink: 0;
}

/* Inline Calculator Result */
.cmd-palette-inline-calc {
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.12), rgba(20, 184, 166, 0.06));
  border: 1px solid var(--teal, #0d9488);
  border-radius: 12px;
  padding: 12px 16px;
  margin: 6px 4px;
}

.cmd-palette-inline-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--teal, #0d9488);
}

.cmd-palette-inline-val {
  font-size: 1.25rem;
  font-weight: 800;
  font-family: var(--f-mono, monospace);
  color: var(--ink, #0f172a);
  margin-top: 4px;
}

/* Footer Shortcuts */
.cmd-palette-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-top: 1px solid var(--line, #e2e8f0);
  background: var(--surface2, #f8fafc);
  font-size: 0.75rem;
  color: var(--muted, #64748b);
}

.cmd-palette-keys {
  display: flex;
  gap: 12px;
}

.cmd-palette-key-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.cmd-palette-key-hint kbd {
  font-family: var(--f-mono, monospace);
  background: var(--surface, #ffffff);
  border: 1px solid var(--line, #cbd5e1);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.7rem;
}

/* Target Card Highlight Pulse */
@keyframes toolCardPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.6);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(13, 148, 136, 0.2);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(13, 148, 136, 0);
  }
}

.tool-highlight-pulse {
  animation: toolCardPulse 1.5s ease 2;
  border-color: var(--teal, #0d9488) !important;
}

/* Mobile Responsiveness */
@media (max-width: 680px) {
  .cmd-palette-backdrop {
    padding: 0;
    align-items: flex-end;
  }

  .cmd-palette-modal {
    max-width: 100%;
    max-height: 85vh;
    border-radius: 20px 20px 0 0;
    border-bottom: none;
    transform: translateY(100%);
  }

  .cmd-palette-backdrop.open .cmd-palette-modal {
    transform: translateY(0);
  }

  .cmd-palette-footer {
    display: none; /* Hide keyboard hints on touch screens to save vertical space */
  }
}

/* Dark Mode */
:root[data-theme="dark"] .cmd-palette-modal {
  background: var(--surface, #0f172a);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
}

:root[data-theme="dark"] .cmd-palette-header,
:root[data-theme="dark"] .cmd-palette-footer {
  background: rgba(15, 23, 42, 0.75);
  border-color: rgba(255, 255, 255, 0.08);
}

:root[data-theme="dark"] .cmd-palette-item-icon {
  background: #1e293b;
}

:root[data-theme="dark"] .cmd-palette-item.is-selected {
  background: rgba(13, 148, 136, 0.18);
  border-color: rgba(13, 148, 136, 0.5);
}

:root[data-theme="dark"] .cmd-palette-badge {
  background: #1e293b;
  color: #94a3b8;
}

:root[data-theme="dark"] .cmd-palette-esc-badge,
:root[data-theme="dark"] .cmd-palette-key-hint kbd {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
}

```

---

<a id="www-css-tools-css"></a>
## 11. `www/css/tools.css`

**Description:** Clinical tools layout, KDIGO heatmaps, FIB-4 scale, and bedside calculators.  
**Lines:** 597 | **Size:** 12.5 KB

```css
/* ==============================================================
   Osrawy Clinical Tools Stylesheet (www/css/tools.css)
   Scoped styling for Nephrology, Hepatology, DOAC & Bedside Calculators
   ============================================================== */

.clinical-tools-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
  text-align: start;
}

/* Tool Card Architecture */
.tool-card {
  background: var(--surface, #ffffff);
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.tool-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tool-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  font-size: 1.3rem;
  background: var(--surface2, #f8fafc);
  border: 1px solid var(--line, #e2e8f0);
  flex-shrink: 0;
}

.tool-header-text {
  flex: 1;
  min-width: 0;
}

.tool-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ink, #0f172a);
  margin: 0 0 3px 0;
}

.tool-sub {
  font-size: 0.82rem;
  color: var(--muted, #64748b);
  margin: 0;
  line-height: 1.45;
}

.btn-emr-copy {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  background: var(--surface2, #f1f5f9);
  border: 1px solid var(--line, #cbd5e1);
  color: var(--ink, #0f172a);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  margin-inline-start: auto;
  user-select: none;
}

.btn-emr-copy:hover {
  background: var(--teal-soft, rgba(13, 148, 136, 0.1));
  border-color: var(--teal, #0d9488);
  color: var(--teal, #0d9488);
}

.btn-emr-copy:active {
  transform: scale(0.96);
}

.btn-emr-copy.copied {
  background: #16a34a !important;
  border-color: #16a34a !important;
  color: #ffffff !important;
}

/* Inputs Grid */
.tool-inputs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.tool-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tool-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted, #64748b);
}

.clinical-input,
.clinical-select {
  font-family: var(--f-mono, 'IBM Plex Mono', ui-monospace, monospace);
  font-size: 0.95rem;
  color: var(--ink, #0f172a);
  background: var(--surface2, #f8fafc);
  border: 1px solid var(--line, #cbd5e1);
  border-radius: 8px;
  padding: 8px 10px;
  box-sizing: border-box;
  width: 100%;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.clinical-input:focus,
.clinical-select:focus {
  outline: none;
  border-color: var(--teal, #0d9488);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}

/* Results Box */
.tool-results-box {
  background: var(--surface2, #f8fafc);
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Dual Telemetry Badges (eGFR & CrCl) */
.telemetry-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.telemetry-stat {
  display: flex;
  flex-direction: column;
}

.telemetry-val {
  font-family: var(--f-mono, 'IBM Plex Mono', monospace);
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.1;
}

.telemetry-val.stat-egfr {
  color: var(--teal, #0d9488);
}

.telemetry-val.stat-crcl {
  color: var(--sky, #0284c7);
}

.telemetry-sub {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted, #64748b);
  margin-top: 2px;
}

/* Renal Drug Adjustment Matrix Card */
.renal-drug-matrix {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--line, #cbd5e1);
}

.renal-drug-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--line, #e2e8f0);
  font-size: 0.8rem;
}

.renal-drug-tag {
  font-family: var(--f-mono, monospace);
  font-weight: 700;
  font-size: 0.74rem;
  padding: 2px 6px;
  border-radius: 4px;
}

.tag-safe {
  background: #dcfce7;
  color: #15803d;
}

.tag-adjust {
  background: #fef3c7;
  color: #b45309;
}

.tag-caution {
  background: #fee2e2;
  color: #b91c1c;
}

/* --- Interactive KDIGO 2024 Heatmap Matrix --- */
.kdigo-matrix-container {
  overflow-x: auto;
  margin: 8px 0;
  border-radius: 10px;
  border: 1px solid var(--line, #e2e8f0);
}

.kdigo-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  text-align: center;
  min-width: 440px;
}

.kdigo-table th,
.kdigo-table td {
  padding: 8px 6px;
  border: 1px solid var(--line, #e2e8f0);
}

.kdigo-table th {
  background: var(--surface2, #f8fafc);
  font-weight: 700;
  color: var(--ink, #0f172a);
}

.kdigo-stage-hdr {
  font-family: var(--f-mono, monospace);
  font-weight: 700;
  font-size: 0.82rem;
  white-space: nowrap;
}

.kdigo-cell {
  position: relative;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.kdigo-cell:hover {
  filter: brightness(0.95);
  transform: scale(1.02);
  z-index: 2;
}

.kdigo-cell.is-active {
  box-shadow: inset 0 0 0 3px var(--teal, #0d9488), 0 0 10px rgba(13, 148, 136, 0.4);
  font-weight: 900;
  z-index: 3;
}

.kdigo-cell-green {
  background-color: #d1fae5;
  color: #065f46;
}

.kdigo-cell-yellow {
  background-color: #fef08a;
  color: #854d0e;
}

.kdigo-cell-orange {
  background-color: #fed7aa;
  color: #9a3412;
}

.kdigo-cell-red {
  background-color: #fecaca;
  color: #991b1b;
}

.kdigo-action-card {
  padding: 12px 14px;
  border-radius: 10px;
  margin-top: 10px;
  font-size: 0.84rem;
  line-height: 1.5;
  border-inline-start-width: 5px;
  border-inline-start-style: solid;
}

.kdigo-action-green {
  background-color: #ecfdf5;
  border-inline-start-color: #10b981;
  color: #065f46;
}

.kdigo-action-yellow {
  background-color: #fefce8;
  border-inline-start-color: #eab308;
  color: #854d0e;
}

.kdigo-action-orange {
  background-color: #fff7ed;
  border-inline-start-color: #f97316;
  color: #9a3412;
}

.kdigo-action-red {
  background-color: #fef2f2;
  border-inline-start-color: #ef4444;
  color: #991b1b;
}

/* --- FIB-4 Liver Fibrosis Gauge --- */
.fib4-gauge-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 6px 8px;
}

.fib4-track {
  position: relative;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, #10b981 0%, #10b981 26%, #f59e0b 26%, #f59e0b 53%, #ef4444 53%, #ef4444 100%);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.12);
  direction: ltr !important;
}

.fib4-pin {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 18px;
  height: 18px;
  background: #ffffff;
  border: 3px solid #0f172a;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  z-index: 2;
  transition: left 0.3s ease;
}

.fib4-scale-legend {
  display: flex;
  justify-content: space-between;
  font-family: var(--f-mono, monospace);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted, #64748b);
  direction: ltr !important;
}

/* --- DOAC Interactive Criteria --- */
.doac-criteria-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px;
  margin: 8px 0;
}

.doac-crit-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--line, #e2e8f0);
  background: var(--surface, #ffffff);
  font-size: 0.82rem;
  transition: all 0.15s ease;
}

.doac-crit-chip.is-met {
  border-color: #f59e0b;
  background-color: #fffbeb;
  color: #92400e;
  font-weight: 700;
}

.doac-dose-result {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--line, #e2e8f0);
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

/* --- Bedside Point-of-Care Micro-Tools --- */
.micro-tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.micro-tool-card {
  background: var(--surface2, #f8fafc);
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.micro-tool-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--ink, #0f172a);
  display: flex;
  align-items: center;
  gap: 6px;
}

.micro-result-pill {
  font-family: var(--f-mono, monospace);
  font-weight: 800;
  font-size: 1.15rem;
  color: var(--teal, #0d9488);
}

/* ==============================================================
   Dark Mode Styles for Clinical Tools
   ============================================================== */
:root[data-theme="dark"] .tool-card,
[data-theme="dark"] .tool-card {
  background: var(--surface, #122220);
  border-color: var(--line, #24403C);
}

:root[data-theme="dark"] .tool-icon,
[data-theme="dark"] .tool-icon {
  background: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
}

:root[data-theme="dark"] .clinical-input,
:root[data-theme="dark"] .clinical-select,
[data-theme="dark"] .clinical-input,
[data-theme="dark"] .clinical-select {
  background: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
  color: var(--ink, #E2F0ED);
}

:root[data-theme="dark"] .tool-results-box,
[data-theme="dark"] .tool-results-box {
  background: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
}

:root[data-theme="dark"] .renal-drug-pill,
[data-theme="dark"] .renal-drug-pill {
  background: var(--surface, #122220);
  border-color: var(--line, #24403C);
  color: var(--ink, #E2F0ED);
}

:root[data-theme="dark"] .kdigo-matrix-container,
:root[data-theme="dark"] .kdigo-table th,
:root[data-theme="dark"] .kdigo-table td,
[data-theme="dark"] .kdigo-matrix-container,
[data-theme="dark"] .kdigo-table th,
[data-theme="dark"] .kdigo-table td {
  border-color: var(--line, #24403C);
}

:root[data-theme="dark"] .kdigo-table th,
[data-theme="dark"] .kdigo-table th {
  background: var(--surface2, #182D2B);
  color: var(--ink, #E2F0ED);
}

:root[data-theme="dark"] .kdigo-cell-green,
[data-theme="dark"] .kdigo-cell-green {
  background-color: rgba(16, 185, 129, 0.22);
  color: #6ee7b7;
}

:root[data-theme="dark"] .kdigo-cell-yellow,
[data-theme="dark"] .kdigo-cell-yellow {
  background-color: rgba(234, 179, 8, 0.22);
  color: #fde047;
}

:root[data-theme="dark"] .kdigo-cell-orange,
[data-theme="dark"] .kdigo-cell-orange {
  background-color: rgba(249, 115, 22, 0.22);
  color: #fdba74;
}

:root[data-theme="dark"] .kdigo-cell-red,
[data-theme="dark"] .kdigo-cell-red {
  background-color: rgba(239, 68, 68, 0.25);
  color: #fca5a5;
}

:root[data-theme="dark"] .kdigo-action-green,
[data-theme="dark"] .kdigo-action-green {
  background-color: rgba(16, 185, 129, 0.15);
  color: #a7f3d0;
}

:root[data-theme="dark"] .kdigo-action-yellow,
[data-theme="dark"] .kdigo-action-yellow {
  background-color: rgba(234, 179, 8, 0.15);
  color: #fef08a;
}

:root[data-theme="dark"] .kdigo-action-orange,
[data-theme="dark"] .kdigo-action-orange {
  background-color: rgba(249, 115, 22, 0.15);
  color: #fed7aa;
}

:root[data-theme="dark"] .kdigo-action-red,
[data-theme="dark"] .kdigo-action-red {
  background-color: rgba(239, 68, 68, 0.18);
  color: #fecaca;
}

:root[data-theme="dark"] .fib4-pin,
[data-theme="dark"] .fib4-pin {
  background: #E2F0ED;
  border-color: #122220;
}

:root[data-theme="dark"] .doac-crit-chip,
[data-theme="dark"] .doac-crit-chip {
  background: var(--surface, #122220);
  border-color: var(--line, #24403C);
  color: var(--ink, #E2F0ED);
}

:root[data-theme="dark"] .doac-crit-chip.is-met,
[data-theme="dark"] .doac-crit-chip.is-met {
  background-color: rgba(245, 158, 11, 0.2);
  border-color: rgba(251, 191, 36, 0.4);
  color: #fde68a;
}

:root[data-theme="dark"] .doac-dose-result,
[data-theme="dark"] .doac-dose-result {
  background: var(--surface, #122220);
  border-color: var(--line, #24403C);
  color: var(--ink, #E2F0ED);
}

:root[data-theme="dark"] .micro-tool-card,
[data-theme="dark"] .micro-tool-card {
  background: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
}

:root[data-theme="dark"] .btn-emr-copy,
[data-theme="dark"] .btn-emr-copy {
  background: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
  color: var(--ink, #E2F0ED);
}

:root[data-theme="dark"] .btn-emr-copy:hover,
[data-theme="dark"] .btn-emr-copy:hover {
  background: var(--teal-soft, #113431);
  border-color: var(--teal, #3CC7B8);
  color: var(--teal, #3CC7B8);
}

```

---

<a id="www-css-lipids-css"></a>
## 12. `www/css/lipids.css`

**Description:** Lipids stepped-intensification wizard, ASCVD risk categories, and statin stepper styles.  
**Lines:** 645 | **Size:** 13.4 KB

```css
/* ==============================================================
   Osrawy Lipids Engine Stylesheet - Logical RTL/LTR CSS
   Adaptive Clinical Presentation for Mobile & WebView
   ============================================================== */

.lipids-wrapper {
  --card-bg: var(--surface, #ffffff);
  --border-color: var(--line, #e2e8f0);
  --text-color: var(--ink, #1e293b);
  --text-muted: var(--muted, #475569);
  --highlight-bg: var(--surface2, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: inherit;
  color: var(--text-color);
  box-sizing: border-box;
  text-align: start;
}

/* Logical spacing for RTL / LTR */
[dir="rtl"] .lipids-wrapper,
.lipids-wrapper.rtl {
  direction: rtl;
}

[dir="ltr"] .lipids-wrapper,
.lipids-wrapper.ltr {
  direction: ltr;
}

/* --- Hero Risk Card --- */
.lipid-hero-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.lipid-hero-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lipid-tier-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.lipid-badge {
  display: inline-block;
  padding: 6px 14px;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 9999px;
  letter-spacing: 0.02em;
}

.lipid-badge-very-high {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #f87171;
}

.lipid-badge-high {
  background-color: #ffedd5;
  color: #9a3412;
  border: 1px solid #fb923c;
}

.lipid-badge-moderate {
  background-color: #dbeafe;
  color: #1e40af;
  border: 1px solid #60a5fa;
}

.lipid-badge-low {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #34d399;
}

.lipid-status-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
}

.lipid-status-ok {
  background-color: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.lipid-status-elevated {
  background-color: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.lipid-reason {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-muted, #475569);
  margin-top: 2px;
}

.lipid-ascvd-est {
  font-size: 0.9rem;
  color: var(--text-color, #1e293b);
  background-color: var(--highlight-bg, #f8fafc);
  border-radius: 8px;
  padding: 8px 12px;
  border-inline-start: 4px solid #3b82f6;
}

/* --- Metrics Grid --- */
.lipid-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.lipid-metric-box {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.lipid-metric-lbl {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  margin-bottom: 4px;
}

.lipid-metric-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-color, #0f172a);
  margin: 4px 0;
}

.lipid-metric-val.text-success {
  color: #10b981;
}

.lipid-metric-val.text-danger {
  color: #ef4444;
}

.lipid-metric-val.text-critical {
  color: #dc2626;
  animation: pulse-alert 2s infinite ease-in-out;
}

.lipid-metric-target {
  font-size: 0.78rem;
  color: var(--text-muted, #64748b);
  margin-top: 4px;
}

/* --- Alerts Section --- */
.lipid-alerts-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lipid-alert {
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 0.88rem;
  line-height: 1.45;
  border-inline-start-width: 5px;
  border-inline-start-style: solid;
}

.lipid-alert-danger {
  background-color: #fff1f2;
  border-color: #f43f5e;
  border-inline-start-color: #e11d48;
  color: #881337;
}

.lipid-alert-warning {
  background-color: #fffbeb;
  border-color: #fcd34d;
  border-inline-start-color: #d97706;
  color: #78350f;
}

.lipid-alert-info {
  background-color: #f0fdfa;
  border-color: #99f6e4;
  border-inline-start-color: #0d9488;
  color: #134e4a;
}

.lipid-alert-title {
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.lipid-alert-msg {
  margin-bottom: 6px;
}

.lipid-alert-action {
  font-size: 0.85rem;
  padding-top: 4px;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
}

/* --- LDL Gap Visualizer Card --- */
.lipid-gap-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lipid-gap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.lipid-gap-title {
  font-size: 0.94rem;
  font-weight: 700;
  color: var(--text-color, #0f172a);
}

.lipid-gap-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.lipid-gap-badge.is-achieved {
  background-color: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.lipid-gap-badge.is-pending {
  background-color: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}

.lipid-gap-bar-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 6px 8px;
}

.lipid-gap-track {
  position: relative;
  height: 14px;
  background: var(--highlight-bg, #f1f5f9);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 999px;
  overflow: visible;
}

.lipid-gap-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.35s ease;
}

.lipid-gap-fill.fill-success {
  background: linear-gradient(90deg, #10b981, #059669);
}

.lipid-gap-fill.fill-warning {
  background: linear-gradient(90deg, #f59e0b, #ef4444);
}

.lipid-gap-target-line {
  position: absolute;
  top: -6px;
  bottom: -6px;
  width: 3px;
  background: #2563eb;
  border-radius: 2px;
  z-index: 2;
  transform: translateX(-50%);
}

.lipid-gap-target-pin {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: #1e40af;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.lipid-gap-current-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: #ef4444;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
  z-index: 3;
}

.lipid-gap-current-pin {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: #991b1b;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.lipid-gap-scale-legend {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  font-family: var(--f-mono, monospace);
  color: var(--text-muted, #64748b);
  margin-top: 18px;
}

.lipid-gap-legend-center {
  font-weight: 600;
  color: #2563eb;
}

/* --- Pathway Steps Section --- */
.lipid-pathway-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lipid-section-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 4px 0;
  color: var(--text-color, #0f172a);
}

.lipid-steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.lipid-step-card {
  position: relative;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.lipid-step-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.lipid-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  border-radius: 50%;
  font-size: 0.84rem;
  font-weight: 800;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
}

.lipid-step-title {
  font-size: 0.94rem;
  font-weight: 700;
  color: var(--text-color, #1e293b);
  flex: 1;
}

.lipid-step-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.lipid-step-badge.is-current {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.lipid-step-badge.is-escalation {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fcd34d;
}

.lipid-step-badge.is-reserve {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.lipid-step-drug {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e40af;
  background-color: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 8px 12px;
}

.lipid-step-desc {
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--text-muted, #475569);
}

/* --- Timeline Box --- */
.lipid-timeline-box {
  background: var(--highlight-bg, #f8fafc);
  border: 1px dashed var(--border-color, #cbd5e1);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 0.84rem;
  color: var(--text-color, #334155);
}

.lipid-timeline-box ul {
  margin: 6px 0 0 0;
  padding-inline-start: 20px;
}

.lipid-timeline-box li {
  margin-bottom: 4px;
}

@keyframes pulse-alert {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* --- Dark Mode Styles for Lipids Engine --- */
:root[data-theme="dark"] .lipids-wrapper,
[data-theme="dark"] .lipids-wrapper {
  --card-bg: var(--surface, #122220);
  --border-color: var(--line, #24403C);
  --text-color: var(--ink, #E2F0ED);
  --text-muted: var(--muted, #8EAFAA);
  --highlight-bg: var(--surface2, #182D2B);
}

:root[data-theme="dark"] .lipid-badge-very-high,
[data-theme="dark"] .lipid-badge-very-high {
  background-color: rgba(220, 38, 38, 0.2);
  color: #FCA5A5;
  border-color: rgba(239, 68, 68, 0.4);
}

:root[data-theme="dark"] .lipid-badge-high,
[data-theme="dark"] .lipid-badge-high {
  background-color: rgba(234, 88, 12, 0.2);
  color: #FDBA74;
  border-color: rgba(249, 115, 22, 0.4);
}

:root[data-theme="dark"] .lipid-badge-moderate,
[data-theme="dark"] .lipid-badge-moderate {
  background-color: rgba(59, 130, 246, 0.2);
  color: #93C5FD;
  border-color: rgba(96, 165, 250, 0.4);
}

:root[data-theme="dark"] .lipid-badge-low,
[data-theme="dark"] .lipid-badge-low {
  background-color: rgba(16, 185, 129, 0.2);
  color: #6EE7B7;
  border-color: rgba(52, 211, 153, 0.4);
}

:root[data-theme="dark"] .lipid-status-ok,
[data-theme="dark"] .lipid-status-ok {
  background-color: rgba(16, 185, 129, 0.16);
  color: #6EE7B7;
  border-color: rgba(52, 211, 153, 0.3);
}

:root[data-theme="dark"] .lipid-status-elevated,
[data-theme="dark"] .lipid-status-elevated {
  background-color: rgba(239, 68, 68, 0.16);
  color: #FCA5A5;
  border-color: rgba(239, 68, 68, 0.3);
}

:root[data-theme="dark"] .lipid-alert-danger,
[data-theme="dark"] .lipid-alert-danger {
  background-color: rgba(225, 29, 72, 0.16);
  border-color: rgba(244, 63, 94, 0.4);
  border-inline-start-color: #F43F5E;
  color: #FDA4AF;
}

:root[data-theme="dark"] .lipid-alert-warning,
[data-theme="dark"] .lipid-alert-warning {
  background-color: rgba(217, 119, 6, 0.16);
  border-color: rgba(252, 211, 77, 0.4);
  border-inline-start-color: #F59E0B;
  color: #FDE68A;
}

:root[data-theme="dark"] .lipid-alert-info,
[data-theme="dark"] .lipid-alert-info {
  background-color: rgba(13, 148, 136, 0.16);
  border-color: rgba(153, 246, 228, 0.4);
  border-inline-start-color: #14B8A6;
  color: #99F6E4;
}

:root[data-theme="dark"] .lipid-step-drug,
[data-theme="dark"] .lipid-step-drug {
  background-color: rgba(59, 130, 246, 0.18);
  border-color: rgba(59, 130, 246, 0.35);
  color: #93C5FD;
}

:root[data-theme="dark"] .lipid-gap-card,
[data-theme="dark"] .lipid-gap-card {
  background: var(--surface, #122220);
  border-color: var(--line, #24403C);
}

:root[data-theme="dark"] .lipid-gap-track,
[data-theme="dark"] .lipid-gap-track {
  background: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
}

:root[data-theme="dark"] .lipid-gap-badge.is-achieved,
[data-theme="dark"] .lipid-gap-badge.is-achieved {
  background-color: rgba(16, 185, 129, 0.16);
  color: #6EE7B7;
  border-color: rgba(52, 211, 153, 0.3);
}

:root[data-theme="dark"] .lipid-gap-badge.is-pending,
[data-theme="dark"] .lipid-gap-badge.is-pending {
  background-color: rgba(234, 88, 12, 0.18);
  color: #FDBA74;
  border-color: rgba(249, 115, 22, 0.35);
}

:root[data-theme="dark"] .lipid-step-card,
[data-theme="dark"] .lipid-step-card {
  background: var(--surface, #122220);
  border-color: var(--line, #24403C);
}

:root[data-theme="dark"] .lipid-step-badge.is-current,
[data-theme="dark"] .lipid-step-badge.is-current {
  background: rgba(16, 185, 129, 0.18);
  color: #6EE7B7;
  border-color: rgba(52, 211, 153, 0.4);
}

:root[data-theme="dark"] .lipid-step-badge.is-escalation,
[data-theme="dark"] .lipid-step-badge.is-escalation {
  background: rgba(245, 158, 11, 0.18);
  color: #FCD34D;
  border-color: rgba(251, 191, 36, 0.4);
}

:root[data-theme="dark"] .lipid-step-badge.is-reserve,
[data-theme="dark"] .lipid-step-badge.is-reserve {
  background: rgba(148, 163, 184, 0.15);
  color: #CBD5E1;
  border-color: rgba(148, 163, 184, 0.3);
}

:root[data-theme="dark"] .lipid-timeline-box,
[data-theme="dark"] .lipid-timeline-box {
  background-color: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
  color: var(--ink, #E2F0ED);
}

```

---

<a id="www-css-diabetes-css"></a>
## 13. `www/css/diabetes.css`

**Description:** Diabetes clinical engine specific styles, insulin calculator, and screening table styling.  
**Lines:** 479 | **Size:** 17.2 KB

```css

/* Layout: colored teal hero band, sticky pill tab bar, two-column worksheet (form | plan) that stacks on phones */
:root{
  --bg:#F2F7F6; --surface:#FFFFFF; --surface2:#E9F2F0; --ink:#0F2B2A; --muted:#55716E; --line:#D3E3DF;
  --teal:#0E7C74; --teal-soft:#DCF1EE; --coral:#DD4552; --coral-soft:#FCE5E7; --sun:#D98A07; --sun-soft:#FDF0D6;
  --sky:#2C6FDB; --sky-soft:#E2ECFC; --grape:#7550CF; --grape-soft:#EDE7FB; --leaf:#1F8B53; --leaf-soft:#DFF3E7;
  --hero1:#0A4F4B; --hero2:#0E7C74; --on-hero:#FFFFFF; --shadow:0 1px 2px rgba(15,43,42,.06),0 6px 18px rgba(15,43,42,.06);
  --f-display:"IBM Plex Sans Arabic",ui-sans-serif,system-ui,sans-serif;
  --f-body:"IBM Plex Sans Arabic",ui-sans-serif,system-ui,sans-serif;
  --f-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
  --f-ar:"IBM Plex Sans Arabic","IBM Plex Sans",system-ui,sans-serif;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --bg:#0B1716; --surface:#122220; --surface2:#182D2B; --ink:#E2F0ED; --muted:#8EAFAA; --line:#24403C;
  --teal:#3CC7B8; --teal-soft:#113431; --coral:#FF7C87; --coral-soft:#3A1B1F; --sun:#FFC24F; --sun-soft:#3A2C0F;
  --sky:#82B1FF; --sky-soft:#15264A; --grape:#B49CFF; --grape-soft:#29204A; --leaf:#5AD68E; --leaf-soft:#11321E;
  --hero1:#08332F; --hero2:#0D5650; --on-hero:#F2FBF9; --shadow:0 1px 2px rgba(0,0,0,.3); color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#0B1716; --surface:#122220; --surface2:#182D2B; --ink:#E2F0ED; --muted:#8EAFAA; --line:#24403C;
  --teal:#3CC7B8; --teal-soft:#113431; --coral:#FF7C87; --coral-soft:#3A1B1F; --sun:#FFC24F; --sun-soft:#3A2C0F;
  --sky:#82B1FF; --sky-soft:#15264A; --grape:#B49CFF; --grape-soft:#29204A; --leaf:#5AD68E; --leaf-soft:#11321E;
  --hero1:#08332F; --hero2:#0D5650; --on-hero:#F2FBF9; --shadow:0 1px 2px rgba(0,0,0,.3); color-scheme:dark}
*{box-sizing:border-box}

/* Eliminate all web browser artifacts */
html, body {
  overscroll-behavior: none;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

body{background:var(--bg);color:var(--ink);font-family:var(--f-body);font-size:15px;line-height:1.5;margin:0}

input, select, textarea {
  user-select: text;
}

.rx, .rx-body, table, td, th {
  user-select: text;
}

/* Sleek custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(14, 124, 116, 0.28);
  border-radius: 999px;
  transition: background 0.2s;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(14, 124, 116, 0.55);
}
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(14, 124, 116, 0.28) transparent;
}

.wrap{max-width:1200px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}

/* tabs */
.tabbar{position:relative;z-index:5;background:var(--surface);border-bottom:1px solid var(--line);box-shadow:var(--shadow)}
nav.tabs{display:flex;gap:8px;overflow-x:auto;padding-block:10px}
nav.tabs button{--c:var(--teal);font:600 14px var(--f-body);color:var(--ink);background:var(--surface2);border:1px solid transparent;border-radius:999px;padding:7px 14px;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:8px}
nav.tabs button::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--c)}
nav.tabs button[aria-selected="true"]{background:var(--c);color:var(--surface)}
nav.tabs button[aria-selected="true"]::before{background:var(--surface)}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--teal);outline-offset:2px}

main{padding-block:14px 40px}

/* Grid & Tablet Workstation Two-Pane Split-Screen */
.grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start}

@media (min-width:768px){
  .grid{grid-template-columns:minmax(340px,460px) minmax(0,1fr);gap:20px;align-items:start}

  /* Left pane (Patient Inputs) */
  .grid > :first-child,
  #pform,
  #ins .grid > .panel:first-child {
    max-height: calc(100vh - 130px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  /* Right pane (Live Rx & Recommendations) */
  .grid > :nth-child(2),
  #result,
  #iresult {
    max-height: calc(100vh - 130px);
    overflow-y: auto;
    position: sticky;
    top: 110px;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:var(--shadow);min-width:0}
.ph{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.ph .ic{width:30px;height:30px;border-radius:9px;background:var(--cs,var(--teal-soft));color:var(--c,var(--teal));display:grid;place-items:center;font:800 15px var(--f-display);flex:none}
.panel h2{font:700 19px/1.2 var(--f-display);margin:0}
.panel h3{font-size:11.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:18px 0 8px;font-weight:600}
.sub{color:var(--muted);font-size:13px;margin:0 0 10px}
.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.field{display:flex;flex-direction:column;gap:3px;min-width:0}
.field label{font-size:12.5px;color:var(--muted);font-weight:500}
.field input,.field select{font:500 15px var(--f-mono);color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:9px;padding:8px 10px;width:100%}
.field input[type=text]{font-family:var(--f-body)}
.field.full{grid-column:1/-1}
.checks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 10px;
}
@media (max-width: 480px) {
  .checks {
    grid-template-columns: minmax(0, 1fr);
  }
}
.checks label {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.checks label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
  margin: 0;
}
.checks label span {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface2);
  color: var(--ink);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}
.checks label span::before {
  content: "";
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid var(--muted);
  background: var(--surface);
  flex-shrink: 0;
  transition: all 0.15s ease-in-out;
}
.checks label input[type="checkbox"]:checked + span {
  background: var(--teal-soft);
  border-color: var(--teal);
  color: var(--teal);
  font-weight: 700;
  box-shadow: 0 1px 4px rgba(14, 124, 116, 0.15);
}
.checks label input[type="checkbox"]:checked + span::before {
  background: var(--teal);
  border-color: var(--teal);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E");
  background-size: contain;
}
.checks label:active span {
  transform: scale(0.98);
}
.costmode{display:flex;gap:12px;align-items:center;background:var(--leaf-soft);border:1px solid color-mix(in srgb,var(--leaf) 30%,transparent);border-radius:12px;padding:10px 12px;margin-top:6px;cursor:pointer}
.costmode input{width:20px;height:20px;accent-color:var(--leaf);flex:none}
.costmode b{color:var(--leaf)}
.costmode span{font-size:13px}

/* result head */
.summary{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 14px}
.chip{display:inline-flex;align-items:center;gap:6px;font:600 12px var(--f-mono);padding:4px 10px;border-radius:999px;background:var(--cs,var(--surface2));color:var(--c,var(--ink))}
.gauge-box {
  background: var(--surface2);
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 16px;
  border: 1px solid var(--line);
}
.g-top {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 28px;
  align-items: flex-end;
  margin-bottom: 12px;
}
.g-top .lbl {
  font: 600 11px var(--f-mono);
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
}
.g-top .big {
  font: 800 38px/1 var(--f-display);
  font-variant-numeric: tabular-nums;
}
.g-top .txt {
  flex: 1;
  min-width: 180px;
  font-size: 13.5px;
  color: var(--muted);
}
.gauge {
  position: relative;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--leaf) 0%, var(--leaf) 22%, var(--sun) 40%, var(--coral) 70%, var(--coral) 100%);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.14);
  direction: ltr !important;
}
.gauge .mk {
  position: absolute;
  top: -6px;
  width: 6px;
  height: 28px;
  border-radius: 999px;
  background: var(--ink);
  box-shadow: 0 0 0 2px var(--surface), 0 3px 8px rgba(0,0,0,0.28);
  transform: translateX(-50%);
  z-index: 2;
}
.gauge .tg {
  position: absolute;
  top: -5px;
  height: 26px;
  border-left: 2px dashed #FFFFFF;
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
  z-index: 1;
}
.g-scale {
  display: flex;
  justify-content: space-between;
  font: 600 11.5px var(--f-mono);
  color: var(--muted);
  margin-top: 8px;
  direction: ltr !important;
  letter-spacing: 0.04em;
}

/* steps */
.steps{display:flex;flex-direction:column;gap:12px}
[dir="rtl"] #result .steps {
  direction: ltr;
  text-align: start;
  unicode-bidi: isolate;
}
[dir="rtl"] #result .steps .ar,
[dir="rtl"] #result .steps .rx-gen,
[dir="rtl"] #result .steps [dir="rtl"] {
  direction: rtl;
  text-align: start;
}
.pri-h{display:flex;align-items:center;gap:10px;margin-top:10px;font:700 15px var(--f-display);color:var(--c)}
.pri-h .n{width:28px;height:28px;border-radius:50%;background:var(--c);color:var(--surface);display:grid;place-items:center;font:800 14px var(--f-display)}
.pri-h small{font:500 12.5px var(--f-body);color:var(--muted)}
.step {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 15px 18px;
  background: var(--surface);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.step::before {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 5px;
  background: var(--c, var(--teal));
}
.step .k {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c, var(--teal)) 14%, transparent);
  color: var(--c, var(--teal));
  font: 700 11px var(--f-mono);
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: 6px;
}
.step h4 {
  margin: 4px 0 6px;
  font: 700 17px/1.3 var(--f-display);
  color: var(--ink);
}
.step p {
  margin: 6px 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink);
}
.drug {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--surface2);
  border: 1px solid var(--line);
  box-sizing: border-box;
}
.drug-h {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 12px;
  align-items: center;
}
.drug-h .nm {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
}
.drug-h b {
  font-size: 15px;
  color: var(--ink);
}
.brands {
  font: 500 12.5px var(--f-mono);
  color: var(--muted);
  margin-top: 5px;
}
.brands .first {
  color: var(--leaf);
  font-weight: 700;
}
.drug .dose {
  margin-top: 5px;
  font-size: 13.5px;
  direction: ltr;
  display: inline-block;
  color: var(--ink);
}
.drug .renal {
  display: block;
  color: var(--sun);
  font-size: 13px;
  font-weight: 600;
  margin-top: 4px;
}
.cost {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font: 700 11px var(--f-mono);
  padding: 3px 9px;
  border-radius: 999px;
}
.cost.t1 { background: var(--leaf-soft); color: var(--leaf); }
.cost.t2 { background: var(--sun-soft); color: var(--sun); }
.cost.t3 { background: var(--coral-soft); color: var(--coral); }
.rx-pick {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  font: 700 12.5px var(--f-body);
  color: var(--teal);
  cursor: pointer;
  white-space: nowrap;
  background: var(--surface);
  border: 1.5px solid var(--teal);
  border-radius: 999px;
  padding: 5px 12px 5px 8px;
  box-shadow: 0 1px 4px rgba(14, 124, 116, 0.12);
  transition: all 0.15s ease;
}
.rx-pick:active {
  transform: scale(0.96);
}
.rx-pick input {
  accent-color: var(--teal);
  width: 17px;
  height: 17px;
  margin: 0;
  cursor: pointer;
}
.rx-same {
  font-size: 12px;
  color: var(--muted);
}
.callout{border-radius:12px;padding:11px 13px;font-size:13.5px;margin:12px 0;background:var(--cs,var(--sun-soft));border:1px solid color-mix(in srgb,var(--c,var(--sun)) 25%,transparent)}
.callout b{color:var(--c,var(--sun))}
.callout ul{margin:6px 0 0}
ul{padding-left:20px;margin:6px 0}
.note{font-size:13px;color:var(--muted);margin-top:14px}

/* screening */
.scr-groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px}
.sg{border-radius:14px;background:var(--surface);border:1px solid var(--line);overflow:hidden}
.sg-h{background:var(--cs);color:var(--c);font:700 14px var(--f-display);padding:9px 13px;display:flex;justify-content:space-between;align-items:center}
.sg-h span{font:600 11.5px var(--f-mono)}
.si{padding:9px 13px;border-top:1px solid var(--line);font-size:13.5px}
.si:first-of-type{border-top:0}
.si .t{font-weight:600}
.si .w{font:500 12px var(--f-mono);color:var(--c)}
.si .y{color:var(--muted);font-size:12.5px}
.now{display:inline-block;font:700 10px var(--f-mono);letter-spacing:.06em;background:var(--coral);color:var(--surface);border-radius:4px;padding:1px 5px;margin-inline-start:6px;vertical-align:1px}

/* tables */
.tbl{overflow-x:auto;border:1px solid var(--line);border-radius:12px}
table{border-collapse:collapse;width:100%;font-size:13.5px;min-width:700px}
th,td{text-align:start;padding:9px 11px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);background:var(--surface2);font-weight:600}
td.mono{font-family:var(--f-mono);font-size:12.5px}
tr:last-child td{border-bottom:0}
td.cls{font:700 13px var(--f-display);background:var(--cs);color:var(--c)}

/* insulin */
.res-box{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:10px 0 14px}
.res{background:var(--grape-soft);border-radius:12px;padding:11px 13px}
.res .v{font:800 28px/1.1 var(--f-display);font-variant-numeric:tabular-nums;color:var(--grape)}
.res .v small{font:500 13px var(--f-mono);color:var(--muted)}
.res .l{font-size:12px;color:var(--muted)}
.seg{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 12px}
.seg button{font:600 13px var(--f-body);padding:7px 12px;border-radius:999px;border:1px solid var(--line);background:var(--surface2);color:var(--ink);cursor:pointer}
.seg button[aria-pressed="true"]{background:var(--grape);color:var(--surface);border-color:var(--grape)}

/* checklist */
.ck{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:start;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px;cursor:pointer}
.ck:last-child{border-bottom:0}
.ck input{margin-top:4px;accent-color:var(--leaf);width:16px;height:16px}
.ck small{display:block;color:var(--muted);font-size:12.5px}
.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
@media (max-width:767px){.two{grid-template-columns:minmax(0,1fr)}}
.progress{font:600 13px var(--f-mono);color:var(--leaf)}

/* prescription */
.rx-sec{margin-top:24px}
.rx-bar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}
.btn{font:600 14px var(--f-body);background:var(--teal);color:var(--surface);border:0;border-radius:999px;padding:9px 16px;cursor:pointer}
.rx{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;font-size:14px;box-shadow:var(--shadow)}
.rx-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;background:linear-gradient(125deg,var(--hero1),var(--hero2));color:var(--on-hero)}
.rx-dr{font:800 20px var(--f-display)} .rx-ti{font-size:13px;opacity:.85}
.rx-sym{font:800 38px/1 var(--f-display);color:#FFC24F}
.rx-body{padding:14px 18px 18px}
.rx-pt{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13.5px;padding-bottom:8px;border-bottom:1px dashed var(--line)}
.rx i{font-style:normal;font:600 10.5px var(--f-mono);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-right:4px}
.rx-dx{margin:8px 0 4px;font-size:13.5px}
.rx-list{margin:12px 0;padding-left:24px;display:flex;flex-direction:column;gap:11px}
.rx-list li::marker{font:700 15px var(--f-display);color:var(--teal)}
.rx-list b{font-size:15px}
.rx-list .ar{font-family:var(--f-ar);color:var(--teal)}
.rx-inv{background:var(--sky-soft);border-radius:10px;padding:9px 12px;font-size:13.5px;margin:10px 0}
.rx-inv b{color:var(--sky)}
.rx-gen{font-family:var(--f-ar);border-top:1px dashed var(--line);padding-top:8px;font-size:13.5px}
.rx-gen ul{padding-right:20px;padding-left:0}
.rx-fu{font-size:13px;margin-top:8px}
.rx-sig{text-align:end;margin-top:22px;color:var(--muted);font-size:13px}
footer{color:var(--muted);font-size:12.5px;padding-block:6px 32px}
@media (prefers-reduced-motion:no-preference){.step,.drug{transition:transform .15s}.step:hover{transform:translateY(-1px)}}

```

---

<a id="www-css-htn-css"></a>
## 14. `www/css/htn.css`

**Description:** Hypertension clinical engine specific styles, hemodynamic telemetry, and BP targets.  
**Lines:** 400 | **Size:** 14.1 KB

```css
/* ==============================================================
   Osrawya HTN Navigator Styles (Scoped strictly to #tab-htn)
   ============================================================== */

#tab-htn {
  --accent:#0e5a6b; --accent-soft:#e1eef1; --mercury:#b3261e;
  --ok:#1f7a4a; --ok-soft:#e3f3ea; --warn:#9a6200; --warn-soft:#fbf0d9; --bad:#b3261e; --bad-soft:#fbe4e2;
  --f-display:"IBM Plex Sans Arabic", "Segoe UI", system-ui, sans-serif;
  --f-body:"IBM Plex Sans Arabic", "Segoe UI", system-ui, sans-serif;
  --f-mono:"IBM Plex Mono", ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]) #tab-htn {
    --accent:#6cc3d5; --accent-soft:#163039; --mercury:#ff8a80;
    --ok:#6fd39c; --ok-soft:#123326; --warn:#f0bd5c; --warn-soft:#352812; --bad:#ff8a80; --bad-soft:#3a1b19;
  }
}
:root[data-theme="dark"] #tab-htn {
  --accent:#6cc3d5; --accent-soft:#163039; --mercury:#ff8a80;
  --ok:#6fd39c; --ok-soft:#123326; --warn:#f0bd5c; --warn-soft:#352812; --bad:#ff8a80; --bad-soft:#3a1b19;
}

:root[data-theme="dark"] #tab-htn .chip span {
  background: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
  color: var(--ink, #E2F0ED);
}
:root[data-theme="dark"] #tab-htn .chip span::before {
  background: var(--surface, #122220);
  border-color: var(--muted, #8EAFAA);
}
:root[data-theme="dark"] #tab-htn .chip input:checked + span {
  background: rgba(108, 195, 213, 0.2);
  border-color: #6cc3d5;
  color: #6cc3d5;
}
:root[data-theme="dark"] #tab-htn .chip input:checked + span::before {
  background-color: #6cc3d5;
  border-color: #6cc3d5;
}
:root[data-theme="dark"] #tab-htn .bp {
  background: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
}
:root[data-theme="dark"] #tab-htn .bp input {
  background: var(--surface, #122220);
  border-color: var(--line, #24403C);
  color: var(--ink, #E2F0ED);
}
:root[data-theme="dark"] #tab-htn .sec {
  background: var(--surface, #122220);
  border-color: var(--line, #24403C);
}
:root[data-theme="dark"] #tab-htn .drug {
  background: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
}
:root[data-theme="dark"] #tab-htn .riskbox {
  background: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
}
:root[data-theme="dark"] .htn-hemo-bar {
  background: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
}

/* Eliminate all web browser artifacts */
html, body {
  overscroll-behavior: none;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
input, select, textarea {
  user-select: text;
}
#tab-htn .sheet, #tab-htn #out, #tab-htn table, #tab-htn td, #tab-htn th {
  user-select: text;
}

/* Sleek custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(14, 90, 107, 0.28);
  border-radius: 999px;
  transition: background 0.2s;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(14, 90, 107, 0.55);
}
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(14, 90, 107, 0.28) transparent;
}

#tab-htn .htn-top-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 6px 0 14px;
}
#tab-htn .lens { display:flex; border:1px solid var(--line); border-radius:999px; background:var(--surface); padding:3px; }
#tab-htn .lens button { font:inherit; font-size:13px; border:0; background:none; color:var(--muted); padding:6px 12px; border-radius:999px; cursor:pointer; }
#tab-htn .lens button[aria-pressed="true"] { background:var(--accent); color:var(--bg); font-weight:700; }

#tab-htn .grid { display:grid; grid-template-columns:1fr; gap:16px; }

/* Tablet Two-Pane Split-Screen Workstation (screens >= 768px) */
@media (min-width: 768px) {
  #tab-htn .grid {
    grid-template-columns: minmax(340px, 460px) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  /* Left pane (Patient Inputs) */
  #tab-htn .grid > :first-child,
  #tab-htn #f {
    max-height: calc(100vh - 130px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  /* Right pane (Live Rx & Recommendations) */
  #tab-htn .grid > :nth-child(2),
  #tab-htn .sheet {
    max-height: calc(100vh - 130px);
    overflow-y: auto;
    position: sticky;
    top: 110px;
    align-self: start;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
}
#tab-htn .panel { background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:16px; display:flex; flex-direction:column; gap:16px; min-width:0; }
#tab-htn fieldset { border:0; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; }
#tab-htn legend { font-family:var(--f-mono); font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); margin-bottom:6px; padding:0; }
#tab-htn .row { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:10px; }
#tab-htn label.f { display:flex; flex-direction:column; gap:4px; font-size:13px; color:var(--muted); }
#tab-htn input[type=number], #tab-htn select { font:inherit; font-family:var(--f-mono); font-size:16px; color:var(--ink); background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:8px 10px; width:100%; box-sizing:border-box; }
#tab-htn .bp {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface2, #f8fafc);
  border: 1px solid var(--line);
  border-radius: 12px;
}
#tab-htn .bp input {
  font-size: 24px;
  font-weight: 800;
  text-align: center;
  background: var(--surface, #ffffff);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 12px;
  max-width: 110px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
#tab-htn .bp b { font-family:var(--f-mono); font-size:24px; color:var(--muted); }

/* Tactile 40px Comorbidity Chips with Touch Feedback */
#tab-htn .chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
#tab-htn .chip {
  position: relative;
  display: inline-flex;
}
#tab-htn .chip input {
  position: absolute;
  opacity: 0;
  inset: 0;
  cursor: pointer;
  z-index: 2;
}
#tab-htn .chip span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface2, #f8fafc);
  color: var(--ink);
  font-size: 0.86rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.16s ease;
  user-select: none;
  box-sizing: border-box;
}
#tab-htn .chip span::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid var(--muted);
  background: var(--surface);
  flex-shrink: 0;
  transition: all 0.16s ease;
}
#tab-htn .chip input:checked + span {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 700;
  box-shadow: 0 1px 4px rgba(14, 90, 107, 0.14);
}
#tab-htn .chip input:checked + span::before {
  background-color: var(--accent);
  border-color: var(--accent);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E");
  background-size: 11px 11px;
  background-position: center;
  background-repeat: no-repeat;
}
#tab-htn .chip:active span {
  transform: scale(0.97);
}

/* Hemodynamics Bar */
.htn-hemo-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  background: var(--surface2, #f8fafc);
  border: 1px dashed var(--line);
  border-radius: 8px;
  margin-top: 10px;
  font-size: 0.8rem;
  font-family: var(--f-mono);
  color: var(--muted);
}
.htn-hemo-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.htn-hemo-val {
  font-weight: 800;
  color: var(--accent);
}
.htn-hemo-val.is-stiff {
  color: var(--bad);
}

#tab-htn .hint { font-size:12.5px; color:var(--muted); margin:0; }
#tab-htn .sheet { gap:0; padding:0; overflow:hidden; }
#tab-htn .sheet-h { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid var(--line); flex-wrap:wrap; }
#tab-htn .sheet-h h2 { font-family:var(--f-display); font-size:18px; margin:0; }

/* Elevated Recommendation Cards */
#tab-htn .sec {
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
#tab-htn .sec:last-child { margin-bottom:0; }
[dir="rtl"] #tab-htn #out .sec {
  direction: ltr;
  text-align: start;
  unicode-bidi: isolate;
}
[dir="rtl"] #tab-htn #out .sec .ar,
[dir="rtl"] #tab-htn #out .sec .rx-gen,
[dir="rtl"] #tab-htn #out .sec [dir="rtl"] {
  direction: rtl;
  text-align: start;
}
#tab-htn .k { font-family:var(--f-mono); font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
#tab-htn .gauge {
  position: relative;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--ok) 0 20%, #c9a227 20% 35%, var(--warn) 35% 55%, var(--bad) 55% 100%);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.14);
  opacity: .95;
  direction: ltr !important;
}
#tab-htn .gauge i {
  position: absolute;
  top: -6px;
  width: 6px;
  height: 26px;
  background: var(--ink);
  border-radius: 999px;
  box-shadow: 0 0 0 2px var(--surface), 0 3px 8px rgba(0,0,0,0.28);
  transform: translateX(-50%);
  transition: left .3s ease-out;
  z-index: 2;
}
#tab-htn .scale {
  display: flex;
  justify-content: space-between;
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  margin-top: 6px;
  direction: ltr !important;
  letter-spacing: 0.04em;
}
#tab-htn .big { font-family:var(--f-display); font-size:26px; font-weight:700; line-height:1.1; }
#tab-htn .pill { display:inline-block; font-size:12px; font-weight:700; border-radius:999px; padding:3px 10px; }
#tab-htn .p-ok { background:var(--ok-soft); color:var(--ok); }
#tab-htn .p-warn { background:var(--warn-soft); color:var(--warn); }
#tab-htn .p-bad { background:var(--bad-soft); color:var(--bad); }
#tab-htn .p-acc { background:var(--accent-soft); color:var(--accent); }
#tab-htn .alert { border-inline-start:4px solid var(--bad); background:var(--bad-soft); padding:10px 12px; border-radius:7px; }
#tab-htn .regimen { display:flex; flex-direction:column; gap:8px; }
#tab-htn .drug {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 12px;
  align-items: baseline;
  padding: 12px 14px;
  background: var(--surface2, #f8fafc);
  border: 1px solid var(--line);
  border-radius: 10px;
}
#tab-htn .drug .cls {
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 3px 8px;
  border-radius: 6px;
}
#tab-htn .drug .ex { grid-column:2; font-size:13px; color:var(--muted); line-height:1.4; }
#tab-htn ul.notes { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:7px; }
#tab-htn ul.notes li { display:grid; grid-template-columns:62px 1fr; gap:8px; align-items:start; font-size:14px; }
#tab-htn ul.notes li .pill { text-align:center; font-size:11px; padding:2px 6px; }
#tab-htn details { border-top:1px solid var(--line); }
#tab-htn summary { cursor:pointer; padding:12px 16px; font-weight:700; }
#tab-htn .tbl { overflow-x:auto; padding:0 16px 16px; }
#tab-htn table { border-collapse:collapse; width:100%; min-width:520px; font-size:13px; }
#tab-htn th, #tab-htn td { text-align:start; padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
#tab-htn th { font-family:var(--f-mono); font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
#tab-htn td.n { font-family:var(--f-mono); font-variant-numeric:tabular-nums; white-space:nowrap; }
#tab-htn .foot { font-size:12px; color:var(--muted); margin-top:18px; max-width:80ch; }
#tab-htn .toast { font-size:12.5px; color:var(--ok); }
#tab-htn .riskbox {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface2, #f8fafc);
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}
#tab-htn .riskbox .num { font-family:var(--f-mono); font-size:28px; font-weight:800; font-variant-numeric:tabular-nums; color:var(--ink); }
#tab-htn .riskbar { flex:1 1 160px; min-width:0; display:flex; flex-direction:column; gap:5px; }
#tab-htn .riskbar .gauge { background:linear-gradient(90deg,var(--ok) 0 20%,#c9a227 20% 30%,var(--warn) 30% 80%,var(--bad) 80% 100%); }
#tab-htn .tools { margin-top:22px; display:flex; flex-direction:column; gap:12px; }
#tab-htn .tools > h2 { font-family:var(--f-display); font-size:22px; margin:0; }
#tab-htn .tools > p { color:var(--muted); max-width:70ch; }
#tab-htn .tgrid { display:grid; grid-template-columns:1fr; gap:18px; }
@media (min-width:768px){ #tab-htn .tgrid { grid-template-columns:1fr 1fr; } }
#tab-htn .panel h3 { font-family:var(--f-display); font-size:18px; margin:0; }
#tab-htn .conv { display:grid; grid-template-columns:1fr; gap:10px; }
#tab-htn .arrow { font-family:var(--f-mono); color:var(--muted); text-align:center; font-size:18px; }
#tab-htn .result { padding:12px; border:1px solid var(--accent); border-radius:8px; background:var(--accent-soft); display:flex; flex-direction:column; gap:6px; }
#tab-htn .result .num { font-family:var(--f-mono); font-size:24px; font-weight:700; color:var(--accent); }
#tab-htn ol.steps { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:0; }
#tab-htn ol.steps li { display:grid; grid-template-columns:72px 1fr; gap:10px; padding:9px 0; border-bottom:1px dashed var(--line); }
#tab-htn ol.steps li:last-child { border-bottom:0; }
#tab-htn ol.steps .wk { font-family:var(--f-mono); font-size:12px; color:var(--muted); padding-top:2px; }
#tab-htn ol.steps .ds { font-family:var(--f-mono); font-weight:700; }
#tab-htn ol.steps li.now .ds { color:var(--accent); }
@media (prefers-reduced-motion:reduce){ #tab-htn .gauge i{transition:none} }

```

---

<a id="www-css-app-css"></a>
## 15. `www/css/app.css`

**Description:** Core global application styling, responsive layout, theme tokens (light/dark), docked command bar, and EMR drawers.  
**Lines:** 3008 | **Size:** 63.5 KB

```css
/* ==============================================================
   Unified Mobile Stylesheet & Android UX (Osrawy Navigator)
   ============================================================== */

:root {
  --app-primary: #0A4F4B;
  --app-primary-light: #0E7C74;
  --app-accent: #25D366;
  --app-gold: #FFC24F;
  --nav-h: 64px;
}

/* Eliminate all web browser artifacts */
html {
  scroll-padding-top: 52px;
}

html, body {
  overscroll-behavior: none;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Safe area padding for Android notch & bottom gesture pill */
body {
  margin: 0;
  padding-top: 0;
  padding-bottom: calc(var(--nav-h, 60px) + 76px + env(safe-area-inset-bottom, 16px));
}

input, select, textarea, [contenteditable="true"] {
  user-select: text;
  -webkit-user-select: text;
}

.rx, .sheet, .rx-body, .rx-text, #out, table, td, th, .tbl {
  user-select: text;
  -webkit-user-select: text;
}

/* Sleek custom scrollbars for Android & WebKit */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(14, 124, 116, 0.28);
  border-radius: 999px;
  transition: background 0.2s;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(14, 124, 116, 0.55);
}
:root[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: rgba(60, 199, 184, 0.28);
}
:root[data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
  background: rgba(60, 199, 184, 0.55);
}
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(14, 124, 116, 0.28) transparent;
}
:root[data-theme="dark"] * {
  scrollbar-color: rgba(60, 199, 184, 0.28) transparent;
}

/* Top App Bar */
.top-nav-bar {
  position: relative;
  z-index: 100;
  scroll-margin-top: 52px;
  background: linear-gradient(135deg, var(--hero1), var(--hero2));
  color: #FFFFFF;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  padding-top: 0;
}

.top-nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-logo-badge {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--app-gold);
  color: var(--app-primary);
  font-weight: 800;
  font-size: 16px;
  display: grid;
  place-items: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.app-title-group h1 {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  line-height: 1.1;
}

.app-title-group span {
  font-size: 11px;
  opacity: 0.85;
  display: block;
}

.top-actions {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.top-more-btn {
  font-size: 18px;
  line-height: 1;
}

/* More Menu Popover */
.top-more-menu {
  position: absolute;
  top: calc(100% + 8px);
  inset-inline-end: 0;
  z-index: 1060;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  padding: 6px;
  gap: 3px;
  min-width: 220px;
  box-sizing: border-box;
}

.top-more-menu[hidden] {
  display: none !important;
}

.top-more-menu .menu-item-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--ink);
  font-size: 13px;
  font-weight: 500;
  text-align: start;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
  box-sizing: border-box;
  text-decoration: none;
}

.top-more-menu .menu-item-btn:hover,
.top-more-menu .menu-item-btn:focus-visible {
  background: var(--surface2);
}

.top-more-menu .menu-item-btn:active {
  transform: none;
  background: var(--surface2);
}

.top-more-menu .market-full {
  display: inline !important;
}

.top-more-menu .market-short {
  display: none !important;
}

.icon-btn {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  color: #FFFFFF;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:active {
  transform: scale(0.92);
  background: rgba(255,255,255,0.3);
}

.market-pill-btn,
.lang-pill-btn {
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #FFFFFF;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.market-pill-btn:active,
.lang-pill-btn:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.3);
}

.market-short {
  display: none;
}

/* RTL Support */
html[dir="rtl"] {
  --f-body: "IBM Plex Sans Arabic", system-ui, sans-serif;
  text-align: right;
}

html[dir="rtl"] ul {
  padding-left: 0;
  padding-right: 20px;
}

html[dir="rtl"] .rx-list {
  padding-left: 0;
  padding-right: 24px;
}

html[dir="rtl"] .rx i {
  margin-right: 0;
  margin-left: 4px;
}

html[dir="rtl"] .now {
  margin-left: 0;
  margin-right: 6px;
}

/* Patient Cockpit (Unified 2-Zone Header Strip) */
.patient-cockpit {
  position: sticky;
  top: 0;
  z-index: 990;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--surface2);
  border-bottom: 1px solid var(--line);
  padding: 4px 14px;
  min-height: 42px;
  box-sizing: border-box;
}

:root[data-theme="dark"] .patient-cockpit {
  background: var(--surface2);
  border-bottom-color: var(--line);
}

.patient-cockpit .patient-summary-bar {
  flex: 1 1 auto;
  min-width: 0;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.patient-cockpit .patient-summary-bar .pt-bar-item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12.5px;
  color: var(--ink);
  margin: 0;
  padding: 0;
}

.patient-cockpit .sticky-vitals-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  box-shadow: none !important;
  position: static !important;
  cursor: pointer;
}

.patient-cockpit .sticky-vitals-bar:hover {
  opacity: 0.92;
}

.patient-cockpit .vitals-group {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;
}

.patient-cockpit .vital-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--radius-pill, 999px);
  background: var(--teal-soft, rgba(60, 199, 184, 0.15));
  color: var(--teal, #0d9488);
  font-family: var(--f-mono, 'IBM Plex Mono', monospace);
  font-size: 11.5px;
  font-weight: 600;
  flex-shrink: 0;
}

:root[data-theme="dark"] .patient-cockpit .vital-chip {
  background: rgba(60, 199, 184, 0.16);
  color: #3CC7B8;
}

.patient-cockpit .vital-chip.vital-warn {
  background: rgba(234, 88, 12, 0.12);
  color: #EA580C;
}

.patient-cockpit .vital-chip.vital-danger {
  background: rgba(220, 38, 38, 0.12);
  color: #DC2626;
}

.patient-cockpit .vitals-toggle-indicator {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--muted);
  cursor: pointer;
  padding: 2px 4px;
}

/* Patient Summary Bar (Sync Bar Fallback) */
.patient-summary-bar {
  background: var(--surface2);
  border-bottom: 1px solid var(--line);
  padding: 8px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 12.5px;
  align-items: center;
  justify-content: space-between;
}

.pt-bar-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pt-bar-label {
  color: var(--muted);
}

.sync-badge {
  background: var(--leaf-soft);
  color: var(--leaf);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Bottom Navigation Bar */
.bottom-nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--surface);
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: space-around;
  height: var(--nav-h);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
}

.main-nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 6px 0;
  transition: all 0.15s;
}

.main-nav-btn .nav-icon {
  font-size: 20px;
  line-height: 1;
}

.main-nav-btn .nav-text {
  font-size: 11.5px;
  font-weight: 600;
}

.main-nav-btn.active {
  color: var(--teal);
}

.main-nav-btn.active .nav-icon {
  transform: translateY(-2px);
}

/* WhatsApp & Print Prescription Toolbar */
.rx-action-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
  align-items: center;
}

.btn-whatsapp {
  background: #25D366 !important;
  color: #FFFFFF !important;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(37,211,102,0.3);
}

.btn-whatsapp:active {
  background: #1EBE5D !important;
}

.btn-print {
  background: var(--sky) !important;
  color: #FFFFFF !important;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

/* Market Selector (Saudi Arabia vs Egypt) */
.market-selector-box {
  display: flex;
  gap: 6px;
  background: var(--surface2);
  padding: 4px;
  border-radius: 999px;
  border: 1px solid var(--line);
}

.market-selector-box button {
  border: none;
  background: transparent;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  cursor: pointer;
  color: var(--muted);
}

.market-selector-box button.active {
  background: var(--teal);
  color: #FFFFFF;
}

/* Drug Directory Search & Cards */
.drug-search-bar {
  margin: 14px 0;
  position: relative;
}

.drug-search-bar input {
  width: 100%;
  font-size: 15px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow);
}

.drug-filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.filter-chip {
  background: var(--surface2);
  border: 1px solid var(--line);
  color: var(--muted);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.filter-chip.active {
  background: var(--teal);
  color: #FFFFFF;
  border-color: var(--teal);
}

#drug-directory-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 768px) {
  #drug-directory-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1200px) {
  #drug-directory-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.drug-dir-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
  transition: transform 0.15s;
}

.drug-dir-card:active {
  transform: scale(0.99);
}

.drug-dir-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.drug-dir-cls {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--teal);
  letter-spacing: 0.05em;
}

.drug-dir-name {
  font-size: 17px;
  font-weight: 700;
  margin: 2px 0 0;
}

.drug-dir-price-box {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.drug-dir-price {
  font-size: 12px;
  font-weight: 700;
  color: var(--leaf);
}

.brands-row {
  margin-top: 4px;
  font-size: 13px;
}

.brand-orig {
  font-weight: 700;
  color: var(--leaf);
}

.drug-dir-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin: 10px 0;
  padding: 10px;
  background: var(--surface2);
  border-radius: 10px;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  display: block;
}

.info-val {
  font-size: 13.5px;
}

.drug-dir-caut {
  font-size: 12.5px;
  color: var(--coral);
  background: var(--coral-soft);
  padding: 8px 10px;
  border-radius: 8px;
  margin-top: 6px;
}

/* Modal Dialog */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: none;
  place-items: center;
  padding: 16px;
}

.modal-overlay.open {
  display: grid;
}

.modal-card {
  background: var(--surface);
  border-radius: 18px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  border: 1px solid var(--line);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header .icon-btn {
  color: var(--ink, #0f172a);
  background: var(--surface2, #f1f5f9);
  border-color: var(--line, #cbd5e1);
}

.modal-body {
  padding: 16px 20px;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Toast Notification */
.app-toast {
  position: fixed;
  bottom: calc(var(--nav-h) + 24px);
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: rgba(18, 35, 43, 0.95);
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 600;
  z-index: 3000;
  opacity: 0;
  pointer-events: none;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(0,0,0,0.25);
}

.app-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* Recent Patients List & Drafts */
#recent-patients-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-top: 14px;
}

@media (min-width: 768px) {
  #recent-patients-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1200px) {
  #recent-patients-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.recent-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.recent-time {
  font-size: 11.5px;
  color: var(--muted);
  margin-top: 2px;
}

.recent-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  background: var(--surface2);
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--ink);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
  background: var(--surface2);
  border-radius: 14px;
  border: 1px dashed var(--line);
  margin-top: 16px;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
}

.btn-outline-danger {
  background: transparent !important;
  color: var(--coral) !important;
  border: 1px solid var(--coral) !important;
}

.btn-outline-danger:active {
  background: var(--coral-soft) !important;
}

.btn-block {
  width: 100%;
  display: block;
}

.btn-primary {
  background: var(--teal) !important;
  color: #FFFFFF !important;
}

.mt-2 {
  margin-top: 8px;
}

/* Print Stylesheet */
@media print {
  .top-nav-bar, .patient-cockpit, .patient-summary-bar, .sticky-vitals-bar, .osrawy-docked-command-bar, .bottom-nav-bar, .tabbar, .rx-action-toolbar, 
  header.hero, #tab-htn header, .lens, #pform, #f, .tools, .foot, footer, 
  .sheet-h div, #copy, #toast, .modal-overlay, #app-toast {
    display: none !important;
  }

  body {
    background: #FFFFFF !important;
    color: #000000 !important;
    padding: 0 !important;
  }

  .main-view-section {
    display: block !important;
  }

  .rx {
    border: 1px solid #CCCCCC !important;
    box-shadow: none !important;
  }

  .rx-head {
    background: #FFFFFF !important;
    color: #000000 !important;
    border-bottom: 2px solid #000000 !important;
  }

  .rx-sym {
    color: #000000 !important;
  }

  .sheet {
    box-shadow: none !important;
    border: 1px solid #CCCCCC !important;
  }
}

/* Update Section in Settings */
.update-section {
  background: var(--surface2);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px;
  margin-top: 16px;
}

.update-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.update-version-tag {
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: 13px;
  background: var(--teal-soft);
  color: var(--teal);
  padding: 3px 8px;
  border-radius: 6px;
}

.update-status {
  font-size: 12.5px;
  margin-top: 6px;
  display: block;
}

.update-status.checking { color: var(--sun); }
.update-status.uptodate { color: var(--leaf); font-weight: 600; }
.update-status.available { color: var(--teal); font-weight: 700; }
.update-status.error { color: var(--muted); }

/* ==============================================================
   Clinical Tools: CKD-EPI 2021 Calculator & ASCVD LDL-C Goals Matrix
   ============================================================== */

/* Modal Width Variants */
.modal-card.modal-medium {
  max-width: 580px;
}

.modal-card.modal-wide {
  max-width: 820px;
}

/* Header Trigger Pill for LDL Goals */
.ldl-pill-btn {
  background: rgba(255, 194, 79, 0.22);
  border: 1px solid rgba(255, 194, 79, 0.65);
  color: #FFFFFF;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.ldl-pill-btn:active {
  transform: scale(0.95);
  background: rgba(255, 194, 79, 0.45);
}

/* Field Label Row with Calculator Pill Trigger */
.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.field-label-row label,
.field-label-row span {
  margin-bottom: 0 !important;
}

.btn-calc-pill {
  background: var(--teal-soft);
  color: var(--teal);
  border: 1px solid var(--teal);
  border-radius: 999px;
  padding: 2px 9px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  transition: all 0.15s ease-in-out;
}

.btn-calc-pill:hover,
.btn-calc-pill:active {
  background: var(--teal);
  color: #FFFFFF;
  transform: scale(0.96);
}

/* CKD-EPI Calculator Modal Inputs */
.calc-inputs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.calc-input-with-unit {
  display: flex;
  gap: 6px;
  align-items: center;
}

.calc-input-with-unit input {
  flex: 1;
}

.calc-input-with-unit select {
  width: auto;
  font-weight: 600;
  padding: 6px 10px;
}

/* Calculator Result Card */
.calc-result-card {
  border-radius: 14px;
  padding: 16px;
  border: 1px solid var(--line);
  background: var(--surface2);
  margin-top: 10px;
  transition: all 0.2s;
}

.calc-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.calc-stage-pill {
  font-family: var(--f-mono);
  font-weight: 800;
  font-size: 14px;
  padding: 3px 10px;
  border-radius: 6px;
  display: inline-block;
  margin-right: 6px;
}

html[dir="rtl"] .calc-stage-pill {
  margin-right: 0;
  margin-left: 6px;
}

.calc-stage-title {
  font-size: 14.5px;
  font-weight: 700;
}

.calc-egfr-big {
  font-family: var(--f-mono);
  font-size: 26px;
  font-weight: 800;
  color: var(--teal);
  line-height: 1;
}

.calc-egfr-big small {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--muted);
}

.calc-result-sub {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 4px;
}

.calc-sub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
}

.calc-sub-item {
  font-size: 12px;
}

.calc-sub-lbl {
  color: var(--muted);
  display: block;
  font-size: 11px;
}

.calc-clinical-pearls {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pearl-row {
  font-size: 12.5px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.pearl-tag {
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--surface);
  border: 1px solid var(--line);
  white-space: nowrap;
}

.pearl-text {
  flex: 1;
}

/* Staging Badge Color Tints */
.badge-stage-g1 { border-left: 5px solid #2ECC71; }
.badge-stage-g1 .calc-stage-pill { background: rgba(46, 204, 113, 0.2); color: #1B7A43; }

.badge-stage-g2 { border-left: 5px solid #3498DB; }
.badge-stage-g2 .calc-stage-pill { background: rgba(52, 152, 219, 0.2); color: #1B5882; }

.badge-stage-g3a { border-left: 5px solid #F39C12; }
.badge-stage-g3a .calc-stage-pill { background: rgba(243, 156, 18, 0.2); color: #9E6004; }

.badge-stage-g3b { border-left: 5px solid #E67E22; }
.badge-stage-g3b .calc-stage-pill { background: rgba(230, 126, 34, 0.25); color: #A04A05; }

.badge-stage-g4 { border-left: 5px solid #E74C3C; }
.badge-stage-g4 .calc-stage-pill { background: rgba(231, 76, 60, 0.25); color: #961E12; }

.badge-stage-g5 { border-left: 5px solid #8E44AD; }
.badge-stage-g5 .calc-stage-pill { background: rgba(142, 68, 173, 0.25); color: #5B1E75; }

html[dir="rtl"] .calc-result-card {
  border-left: 1px solid var(--line);
}
html[dir="rtl"] .badge-stage-g1 { border-right: 5px solid #2ECC71; }
html[dir="rtl"] .badge-stage-g2 { border-right: 5px solid #3498DB; }
html[dir="rtl"] .badge-stage-g3a { border-right: 5px solid #F39C12; }
html[dir="rtl"] .badge-stage-g3b { border-right: 5px solid #E67E22; }
html[dir="rtl"] .badge-stage-g4 { border-right: 5px solid #E74C3C; }
html[dir="rtl"] .badge-stage-g5 { border-right: 5px solid #8E44AD; }

/* ASCVD LDL-C Goals Matrix Styling */
.ldl-patient-eval-banner {
  background: linear-gradient(135deg, rgba(10, 79, 75, 0.12), rgba(255, 194, 79, 0.15));
  border: 1.5px solid var(--teal);
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 16px;
}

.ldl-eval-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.ldl-badge-glow {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 700;
  margin-bottom: 4px;
}

.ldl-badge-glow.very_high { background: #FFD2D2; color: #9C0006; border: 1px solid #FF8989; }
.ldl-badge-glow.high { background: #FFE8CC; color: #944000; border: 1px solid #FFB866; }
.ldl-badge-glow.moderate { background: #FFF3CD; color: #856404; border: 1px solid #FFEBAA; }
.ldl-badge-glow.low { background: #D4EDDA; color: #155724; border: 1px solid #C3E6CB; }

.ldl-eval-name {
  font-size: 12px;
  color: var(--muted);
}

.ldl-target-highlight {
  text-align: right;
}

html[dir="rtl"] .ldl-target-highlight {
  text-align: left;
}

.ldl-target-highlight small {
  font-size: 11px;
  color: var(--muted);
  display: block;
}

.ldl-target-highlight .target-val {
  font-size: 18px;
  font-weight: 800;
  color: var(--teal);
  font-family: var(--f-mono);
}

.ldl-eval-reason,
.ldl-eval-action {
  font-size: 12.5px;
  margin-top: 8px;
  line-height: 1.4;
}

/* Market Switcher Chips inside LDL Modal */
.ldl-market-toggle-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  background: var(--surface2);
  border: 1px solid var(--line);
  padding: 8px 12px;
  border-radius: 10px;
  margin-bottom: 14px;
}

.ldl-mkt-lbl {
  font-size: 12px;
  color: var(--muted);
}

.ldl-mkt-btn-group {
  display: flex;
  gap: 6px;
}

.btn-mkt-chip {
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-mkt-chip.active {
  background: var(--teal);
  color: #FFFFFF;
  border-color: var(--teal);
  box-shadow: 0 2px 6px rgba(10, 79, 75, 0.25);
}

.ldl-section-title h3 {
  margin: 0 0 4px 0;
  font-size: 15px;
}

.ldl-section-title .sub {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: var(--muted);
}

/* Matrix Table Styling */
.ldl-matrix-table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid var(--line);
  margin-bottom: 14px;
}

.ldl-matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.ldl-matrix-table th {
  background: var(--surface2);
  padding: 10px 12px;
  text-align: left;
  font-weight: 700;
  border-bottom: 2px solid var(--line);
  white-space: nowrap;
}

html[dir="rtl"] .ldl-matrix-table th {
  text-align: right;
}

.ldl-matrix-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
}

.ldl-matrix-table tr:hover {
  background: var(--surface2);
}

.ldl-matrix-table tr.selected-patient-tier {
  background: rgba(10, 79, 75, 0.08);
  font-weight: 500;
  outline: 2px solid var(--teal);
}

.ldl-risk-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}

.ldl-risk-tag.very_high { background: rgba(231, 76, 60, 0.15); color: #C0392B; }
.ldl-risk-tag.high { background: rgba(230, 126, 34, 0.15); color: #D35400; }
.ldl-risk-tag.moderate { background: rgba(243, 156, 18, 0.15); color: #B77700; }
.ldl-risk-tag.low { background: rgba(46, 204, 113, 0.15); color: #27AE60; }

.patient-match-pill {
  display: block;
  font-size: 10.5px;
  font-weight: 800;
  color: var(--teal);
  margin-top: 3px;
}

.target-cell {
  font-family: var(--f-mono);
  color: var(--teal);
  font-size: 13px;
  white-space: nowrap;
}

/* Statin Intensity Cards */
.statin-intensity-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.statin-regimen-card {
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface2);
  overflow: hidden;
}

.regimen-header {
  padding: 10px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.regimen-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.badge-intensity-high .regimen-header { border-left: 4px solid #C0392B; }
.badge-intensity-moderate .regimen-header { border-left: 4px solid #F39C12; }
.badge-intensity-low .regimen-header { border-left: 4px solid #3498DB; }

html[dir="rtl"] .badge-intensity-high .regimen-header { border-left: none; border-right: 4px solid #C0392B; }
html[dir="rtl"] .badge-intensity-moderate .regimen-header { border-left: none; border-right: 4px solid #F39C12; }
html[dir="rtl"] .badge-intensity-low .regimen-header { border-left: none; border-right: 4px solid #3498DB; }

.regimen-body {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.statin-drug-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--line);
}

.statin-drug-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.drug-main-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drug-name {
  font-size: 13.5px;
}

.drug-dose-badge {
  font-family: var(--f-mono);
  font-size: 11.5px;
  font-weight: 600;
  background: var(--surface);
  border: 1px solid var(--line);
  padding: 2px 6px;
  border-radius: 4px;
}

.drug-brand-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.brand-pill {
  background: var(--surface);
  border: 1px solid var(--line);
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 999px;
  color: var(--ink);
}

.drug-price-tier {
  font-size: 11px;
  color: var(--muted);
}

/* Addon Therapies Grid */
.addon-therapies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
}

.addon-card {
  background: var(--surface2);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
}

.addon-header {
  font-size: 13.5px;
  color: var(--teal);
  margin-bottom: 4px;
}

.addon-effect {
  font-size: 12px;
  margin: 0 0 8px 0;
  color: var(--ink);
  line-height: 1.35;
}

.addon-brands {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.addon-brand-lbl {
  font-size: 11px;
  color: var(--muted);
}

/* Clinical Notes Box */
.ldl-clinical-notes {
  background: rgba(255, 194, 79, 0.12);
  border: 1px solid rgba(255, 194, 79, 0.5);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 12px;
  margin-top: 18px;
}

.ldl-clinical-notes ul {
  margin: 6px 0 0 0;
  padding-left: 20px;
}

html[dir="rtl"] .ldl-clinical-notes ul {
  padding-left: 0;
  padding-right: 20px;
}

.ldl-clinical-notes li {
  margin-bottom: 4px;
}

/* ==============================================================
   Native Tablet Two-Pane Split-Screen Workstation (screens >= 768px)
   ============================================================== */

@media (min-width: 768px) {
  /* Diabetes Tablet Split-Screen */
  #tab-diabetes .grid {
    display: grid;
    grid-template-columns: minmax(340px, 460px) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  /* Left pane (Patient Inputs) */
  #tab-diabetes .grid > :first-child,
  #tab-diabetes #pform,
  #tab-diabetes #ins .grid > .panel:first-child {
    max-height: calc(100vh - 130px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  /* Right pane (Live Rx & Recommendations) */
  #tab-diabetes .grid > :nth-child(2),
  #tab-diabetes #result,
  #tab-diabetes #iresult {
    max-height: calc(100vh - 130px);
    overflow-y: auto;
    position: sticky;
    top: 110px;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  /* HTN Tablet Split-Screen */
  #tab-htn .grid {
    display: grid;
    grid-template-columns: minmax(340px, 460px) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  /* Left pane (Patient Inputs) */
  #tab-htn .grid > :first-child,
  #tab-htn #f {
    max-height: calc(100vh - 130px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  /* Right pane (Live Rx & Recommendations) */
  #tab-htn .grid > :nth-child(2),
  #tab-htn .sheet {
    max-height: calc(100vh - 130px);
    overflow-y: auto;
    position: sticky;
    top: 110px;
    align-self: start;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
}

/* Mobile Quick-Jump Pill Button for Phones */
.quick-jump-pill {
  display: none;
}

@media (max-width: 767px) {
  .quick-jump-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    position: fixed;
    bottom: calc(var(--nav-h) + 14px + env(safe-area-inset-bottom, 0px));
    inset-inline-end: 16px;
    z-index: 950;
    background: linear-gradient(135deg, var(--hero1, #0A4F4B), var(--hero2, #0E7C74));
    color: #FFFFFF;
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 4px 14px rgba(10, 79, 75, 0.45);
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.2s ease;
  }

  .quick-jump-pill:active {
    transform: scale(0.94);
  }

  .quick-jump-pill .jump-icon {
    font-size: 14px;
  }

  .quick-jump-pill .jump-text {
    font-size: 12.5px;
  }
}

/* ==============================================================
   Smartphone-Specific Mobile Optimization (< 680px)
   ============================================================== */

@media (max-width: 680px) {
  /* 1. Top App Bar: Compact native header with dedicated slim action strip */
  .top-nav-bar {
    position: relative;
    z-index: 100;
    scroll-margin-top: 52px;
  }

  .top-nav-content {
    padding: 4px 10px !important;
    gap: 6px !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    min-height: 44px !important;
  }

  .app-brand {
    gap: 6px !important;
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }

  .app-logo-badge {
    width: 28px !important;
    height: 28px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    flex: none !important;
  }

  .app-title-group {
    min-width: 0 !important;
  }

  .app-title-group h1 {
    font-size: 13.5px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    margin: 0 !important;
    line-height: 1.2 !important;
  }

  .app-title-group span {
    display: none !important; /* Hide subtitle on phone to maintain 1 line */
  }

  .top-actions {
    width: auto !important;
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    flex: 0 0 auto !important;
    flex-wrap: nowrap !important;
    overflow-x: visible !important;
    padding-bottom: 0 !important;
    justify-content: flex-end !important;
  }

  .lang-pill-btn {
    padding: 3px 8px !important;
    font-size: 11px !important;
    border-radius: 999px !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }

  .top-more-btn {
    font-size: 18px !important;
  }

  .icon-btn {
    width: 32px !important;
    height: 32px !important;
    font-size: 14px !important;
    flex: none !important;
    flex-shrink: 0 !important;
  }

  /* 2. Unified Patient Cockpit on Smartphone */
  .patient-cockpit {
    padding: 3px 8px !important;
    min-height: 38px !important;
    gap: 6px !important;
  }

  .patient-cockpit .patient-summary-bar .pt-bar-item:nth-child(n+3) {
    display: none !important; /* On small phone screens, keep Name & Age/Sex in identity zone */
  }

  .patient-cockpit .vitals-toggle-indicator {
    display: none !important; /* Hide 'تعديل سريع ▾' on phones to save space */
  }

  .patient-cockpit .vital-chip {
    padding: 2px 6px !important;
    font-size: 11px !important;
    gap: 3px !important;
  }

  /* Fallback Patient Summary Bar */
  .patient-summary-bar {
    padding: 5px 10px !important;
    gap: 8px !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    justify-content: flex-start !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;
    background: var(--surface2) !important;
  }

  .patient-summary-bar::-webkit-scrollbar {
    display: none !important;
  }

  .patient-summary-bar .pt-bar-item:nth-child(n+4) {
    display: none !important; /* Hide duplicate eGFR, UACR, and BP on mobile phones */
  }

  .pt-bar-item {
    flex: none !important;
    font-size: 11.5px !important;
    padding: 3px 8px !important;
    background: var(--surface) !important;
    border: 1px solid var(--line) !important;
    border-radius: 999px !important;
    white-space: nowrap !important;
  }

  /* 3. Sub-tabs (Treatment & prescription, Screening, etc.) */
  .tabbar {
    position: sticky !important;
    top: 44px !important;
    z-index: 90 !important;
  }

  nav.tabs {
    padding: 6px 10px !important;
    gap: 6px !important;
    scrollbar-width: none !important;
  }

  nav.tabs::-webkit-scrollbar {
    display: none !important;
  }

  nav.tabs button {
    padding: 6px 11px !important;
    font-size: 12px !important;
    border-radius: 8px !important;
    gap: 5px !important;
  }

  /* 4. Panels & Page margins on phone */
  main.wrap, 
  #tab-htn .wrap, 
  #tab-drugs, 
  #tab-recent {
    padding-left: 10px !important;
    padding-right: 10px !important;
    padding-top: 10px !important;
  }

  .panel {
    padding: 14px 12px !important;
    border-radius: 14px !important;
  }

  .panel h2 {
    font-size: 16px !important;
  }

  .panel h3 {
    font-size: 11.5px !important;
    margin: 14px 0 6px !important;
  }

  /* 5. Inputs & Fields: comfortable touch size */
  .fields {
    gap: 8px !important;
  }

  .field label {
    font-size: 11.5px !important;
  }

  .field input, 
  .field select {
    font-size: 15px !important;
    padding: 8px 10px !important;
    border-radius: 8px !important;
    min-height: 42px !important;
  }

  /* 6. Comorbidity check items: 1-column touch cards */
  .checks {
    grid-template-columns: 1fr !important;
    gap: 6px !important;
  }

  .checks label {
    padding: 8px 10px !important;
    background: var(--surface2) !important;
    border: 1px solid var(--line) !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    display: flex !important;
    align-items: center !important;
  }

  .checks input {
    width: 18px !important;
    height: 18px !important;
    margin: 0 6px 0 0 !important;
    flex: none !important;
  }

  html[dir="rtl"] .checks input {
    margin: 0 0 0 6px !important;
  }

  /* 7. HTN Blood Pressure inputs */
  #tab-htn .bp input {
    font-size: 22px !important;
    padding: 6px !important;
    min-height: 46px !important;
  }

  #tab-htn .chips {
    gap: 6px !important;
  }

  #tab-htn .chip span {
    padding: 6px 10px !important;
    font-size: 12.5px !important;
  }

  /* 8. Table horizontal containment */
  .tbl {
    max-width: 100% !important;
    overflow-x: auto !important;
    display: block !important;
    -webkit-overflow-scrolling: touch !important;
  }

  /* 9. Modals: native Android Bottom-Sheet style */
  .modal-overlay {
    align-items: flex-end !important;
    padding: 0 !important;
    background: rgba(0, 0, 0, 0.55) !important;
  }

  .modal-card, 
  .modal-card.modal-medium, 
  .modal-card.modal-wide {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 85vh !important;
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
    border-top-left-radius: 20px !important;
    border-top-right-radius: 20px !important;
    padding: 0 !important;
    animation: slideUpBottomSheet 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  .modal-header {
    padding: 14px 16px !important;
  }

  .modal-body {
    padding: 14px 16px !important;
  }

  .modal-footer {
    padding: 12px 16px calc(14px + env(safe-area-inset-bottom, 0px)) !important;
  }

  @keyframes slideUpBottomSheet {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  /* 10. Bottom Navigation Bar */
  .bottom-nav-bar,
  .osrawy-bottom-nav {
    min-height: var(--nav-h, 60px) !important;
    height: auto !important;
    padding: 6px 4px calc(env(safe-area-inset-bottom, 0px) + 6px) !important;
  }

  .main-nav-btn {
    padding: 4px 0 !important;
    font-size: 11px !important;
  }

  .main-nav-btn .nav-icon {
    font-size: 18px !important;
  }

  /* 11. Prescription card toolbar buttons */
  .rx-action-toolbar {
    width: 100% !important;
    display: flex !important;
    gap: 6px !important;
  }

  .rx-action-toolbar .btn {
    flex: 1 !important;
    text-align: center !important;
    padding: 8px 6px !important;
    font-size: 12px !important;
  }
}





/* ==============================================================
   Mobile & WebView Touch Ergonomics & Navigation
   ============================================================== */
*, *::before, *::after {
  -webkit-tap-highlight-color: transparent;
}
button, a, input, select, textarea, [role="button"], [role="tab"] {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Sticky Vitals Summary Bar */
.sticky-vitals-bar {
  position: sticky;
  top: 0;
  z-index: 999;
  background: var(--surface, #FFFFFF);
  border-bottom: 1px solid var(--border, #E2E8F0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top, 0px) + 6px) 14px 6px;
  gap: 8px;
  font-size: 12.5px;
}
:root[data-theme="dark"] .sticky-vitals-bar {
  background: rgba(26, 32, 44, 0.98);
  border-bottom-color: rgba(255, 255, 255, 0.08);
}
.sticky-vitals-bar .vitals-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
@media (max-width: 680px) {
  .sticky-vitals-bar .vitals-group {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    max-width: 100%;
  }
  .sticky-vitals-bar .vitals-group::-webkit-scrollbar {
    display: none;
  }
}
.sticky-vitals-bar .vital-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(10, 79, 75, 0.08);
  color: var(--app-primary, #0A4F4B);
  font-weight: 600;
  font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace;
  font-size: 11.5px;
  flex-shrink: 0;
}
:root[data-theme="dark"] .sticky-vitals-bar .vital-chip {
  background: rgba(60, 199, 184, 0.12);
  color: #3CC7B8;
}
.sticky-vitals-bar .vital-chip.vital-warn {
  background: rgba(234, 88, 12, 0.1);
  color: #EA580C;
}
.sticky-vitals-bar .vital-chip.vital-danger {
  background: rgba(220, 38, 38, 0.1);
  color: #DC2626;
}

/* Osrawy Sticky Bottom Navigation Bar */
.osrawy-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  min-height: var(--nav-h, 60px);
  height: auto;
  background: var(--surface, #FFFFFF);
  border-top: 1px solid var(--border, #E2E8F0);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 1000;
  padding: 6px 4px calc(env(safe-area-inset-bottom, 0px) + 6px);
  box-shadow: 0 -3px 12px rgba(0, 0, 0, 0.06);
}
:root[data-theme="dark"] .osrawy-bottom-nav {
  background: rgba(18, 24, 38, 0.98);
  border-top-color: rgba(255, 255, 255, 0.08);
}
.osrawy-nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 4px 2px;
  color: var(--muted, #64748B);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 8px;
  margin: 0 2px;
  user-select: none;
  -webkit-user-select: none;
}
.osrawy-nav-btn .nav-icon {
  font-size: 18px;
  line-height: 1.2;
  margin-bottom: 2px;
  transition: transform 0.2s ease;
}
.osrawy-nav-btn.active {
  color: var(--app-primary, #0A4F4B);
  font-weight: 700;
  background: rgba(10, 79, 75, 0.06);
}
:root[data-theme="dark"] .osrawy-nav-btn.active {
  color: #3CC7B8;
  background: rgba(60, 199, 184, 0.1);
}
.osrawy-nav-btn:active .nav-icon {
  transform: scale(0.9);
}

/* Patient Leaflet Styles & Ergonomics */
.leaflet-wrapper {
  font-size: calc(14px * var(--leaflet-font-scale, 1));
  line-height: 1.6;
  color: var(--ink, #1E293B);
  max-width: 900px;
  margin: 0 auto;
  padding: 12px 14px 60px;
}
.leaflet-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
:root[data-theme="dark"] .leaflet-toolbar {
  background: #1A202C;
  border-color: #2D3748;
}
.leaflet-tab-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.leaflet-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--surface-secondary, #F1F5F9);
  border: 1px solid transparent;
  color: var(--muted, #475569);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
:root[data-theme="dark"] .leaflet-tab-btn {
  background: #2D3748;
  color: #CBD5E1;
}
.leaflet-tab-btn.active {
  background: var(--app-primary, #0A4F4B);
  color: #FFFFFF;
  border-color: var(--app-primary, #0A4F4B);
}
:root[data-theme="dark"] .leaflet-tab-btn.active {
  background: #3CC7B8;
  color: #0A2E2B;
}
.leaflet-actions-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.icon-tool-btn {
  background: var(--surface-secondary, #F1F5F9);
  border: 1px solid var(--border, #CBD5E1);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
  color: var(--ink, #1E293B);
}
:root[data-theme="dark"] .icon-tool-btn {
  background: #2D3748;
  border-color: #4A5568;
  color: #F8FAFC;
}
.lang-tool-btn, .pill-tool-btn {
  background: var(--surface-secondary, #F1F5F9);
  border: 1px solid var(--border, #CBD5E1);
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ink, #1E293B);
}
:root[data-theme="dark"] .lang-tool-btn,
:root[data-theme="dark"] .pill-tool-btn {
  background: #2D3748;
  border-color: #4A5568;
  color: #F8FAFC;
}
.pill-tool-btn.qr-pill {
  background: #EEF2FF;
  border-color: #C7D2FE;
  color: #4338CA;
}
:root[data-theme="dark"] .pill-tool-btn.qr-pill {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.4);
  color: #A5B4FC;
}
.pill-tool-btn.share-pill {
  background: #ECFDF5;
  border-color: #A7F3D0;
  color: #065F46;
}
:root[data-theme="dark"] .pill-tool-btn.share-pill {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.4);
  color: #6EE7B7;
}

/* Leaflet Cards */
.leaflet-section-card {
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}
:root[data-theme="dark"] .leaflet-section-card {
  background: #1A202C;
  border-color: #2D3748;
}
.leaflet-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--border, #F1F5F9);
  padding-bottom: 10px;
}
:root[data-theme="dark"] .leaflet-card-header {
  border-bottom-color: #2D3748;
}
.leaflet-header-icon {
  font-size: 26px;
  line-height: 1;
}
.leaflet-card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--app-primary, #0A4F4B);
}
:root[data-theme="dark"] .leaflet-card-header h3 {
  color: #3CC7B8;
}
.leaflet-subtitle {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: var(--muted, #64748B);
}

/* Individual Targets Card */
.leaflet-targets-card {
  background: linear-gradient(135deg, rgba(10, 79, 75, 0.07) 0%, rgba(14, 124, 116, 0.04) 100%);
  border: 1px solid rgba(10, 79, 75, 0.2);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}
:root[data-theme="dark"] .leaflet-targets-card {
  background: linear-gradient(135deg, rgba(60, 199, 184, 0.08) 0%, rgba(14, 124, 116, 0.04) 100%);
  border-color: rgba(60, 199, 184, 0.25);
}
.targets-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.targets-badge {
  display: inline-block;
  background: var(--app-primary, #0A4F4B);
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}
:root[data-theme="dark"] .targets-badge {
  background: #3CC7B8;
  color: #0A2E2B;
}
.targets-sync-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: #059669;
  font-weight: 500;
}
.sync-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10B981;
  animation: pulseSync 2s infinite;
}
@keyframes pulseSync {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
.targets-metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}
.target-metric-box {
  background: var(--surface, #FFFFFF);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: 10px;
  padding: 10px 12px;
}
:root[data-theme="dark"] .target-metric-box {
  background: #1A202C;
  border-color: #2D3748;
}
.metric-lbl {
  font-size: 11.5px;
  color: var(--muted, #64748B);
  display: block;
}
.metric-val {
  font-size: 18px;
  font-weight: 800;
  margin: 3px 0;
  font-family: 'JetBrains Mono', monospace;
}
.metric-val.text-teal { color: #0E7C74; }
.metric-val.text-grape { color: #7C3AED; }
.metric-val.text-amber { color: #D97706; }
:root[data-theme="dark"] .metric-val.text-teal { color: #3CC7B8; }
:root[data-theme="dark"] .metric-val.text-grape { color: #A78BFA; }
:root[data-theme="dark"] .metric-val.text-amber { color: #FBBF24; }
.metric-sub {
  font-size: 11px;
  color: var(--muted, #64748B);
  display: block;
  margin-bottom: 4px;
}
.metric-curr {
  font-size: 11.5px;
  border-top: 1px dashed var(--border, #E2E8F0);
  padding-top: 4px;
  margin-top: 4px;
}
:root[data-theme="dark"] .metric-curr {
  border-top-color: #2D3748;
}

/* Rule of 15 Grid */
.rule15-steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.leaflet-step-box {
  display: flex;
  gap: 10px;
  background: var(--surface-secondary, #F8FAFC);
  border-radius: 10px;
  padding: 10px;
  border: 1px solid var(--border, #E2E8F0);
}
:root[data-theme="dark"] .leaflet-step-box {
  background: #202736;
  border-color: #2D3748;
}
.step-number {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #0E7C74;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}
.step-body b {
  display: block;
  font-size: 13px;
  margin-bottom: 3px;
}
.step-body p {
  margin: 0;
  font-size: 12px;
  color: var(--muted, #475569);
  line-height: 1.45;
}
:root[data-theme="dark"] .step-body p {
  color: #94A3B8;
}
.leaflet-danger-callout {
  display: flex;
  gap: 10px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 10px;
  padding: 10px 12px;
  color: #991B1B;
  font-size: 12.5px;
  margin-top: 8px;
}
:root[data-theme="dark"] .leaflet-danger-callout {
  background: rgba(220, 38, 38, 0.12);
  border-color: rgba(220, 38, 38, 0.3);
  color: #FCA5A5;
}
.callout-icon {
  font-size: 20px;
  line-height: 1;
}

/* SADMANS Rules Styles */
.sadmans-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sadmans-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--surface-secondary, #F8FAFC);
  border: 1px solid var(--border, #E2E8F0);
}
:root[data-theme="dark"] .sadmans-item {
  background: #202736;
  border-color: #2D3748;
}
.sadmans-badge {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #DC2626;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  flex-shrink: 0;
  font-family: 'JetBrains Mono', monospace;
}
.sadmans-drug {
  font-weight: 700;
  font-size: 13.5px;
  color: var(--ink, #1E293B);
}
:root[data-theme="dark"] .sadmans-drug {
  color: #F1F5F9;
}
.sadmans-why {
  font-size: 12px;
  color: var(--muted, #475569);
  margin-top: 2px;
}
:root[data-theme="dark"] .sadmans-why {
  color: #94A3B8;
}
.leaflet-tip-box {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12.5px;
  color: #166534;
}
:root[data-theme="dark"] .leaflet-tip-box {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.25);
  color: #86EFAC;
}

/* BP Protocol Grid */
.bp-protocol-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}
.bp-card {
  background: var(--surface-secondary, #F8FAFC);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: 10px;
  padding: 10px 12px;
}
:root[data-theme="dark"] .bp-card {
  background: #202736;
  border-color: #2D3748;
}
.bp-card h4 {
  margin: 0 0 6px;
  font-size: 13.5px;
  color: var(--app-primary, #0A4F4B);
}
:root[data-theme="dark"] .bp-card h4 {
  color: #3CC7B8;
}
.bp-card ul {
  margin: 0;
  padding-left: 18px;
  padding-right: 18px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--muted, #475569);
}
:root[data-theme="dark"] .bp-card ul {
  color: #94A3B8;
}
.bp-card li {
  margin-bottom: 4px;
}

/* Statin Points */
.statin-points-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 10px;
}
.statin-point {
  background: var(--surface-secondary, #F8FAFC);
  border: 1px solid var(--border, #E2E8F0);
  border-radius: 10px;
  padding: 10px 12px;
}
:root[data-theme="dark"] .statin-point {
  background: #202736;
  border-color: #2D3748;
}
.statin-point b {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
  color: var(--ink, #1E293B);
}
:root[data-theme="dark"] .statin-point b {
  color: #F1F5F9;
}
.statin-point p {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--muted, #475569);
}
:root[data-theme="dark"] .statin-point p {
  color: #94A3B8;
}

/* Red Flags Box */
.leaflet-redflag-box {
  background: #FFF5F5;
  border: 1.5px solid #FCA5A5;
  border-radius: 14px;
  padding: 16px;
  margin-top: 16px;
}
:root[data-theme="dark"] .leaflet-redflag-box {
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(239, 68, 68, 0.35);
}
.redflag-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid #FED7D7;
  padding-bottom: 8px;
}
:root[data-theme="dark"] .redflag-header {
  border-bottom-color: rgba(239, 68, 68, 0.2);
}
.redflag-siren {
  font-size: 24px;
}
.redflag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.redflag-col b {
  display: block;
  font-size: 13px;
  color: #991B1B;
  margin-bottom: 5px;
}
:root[data-theme="dark"] .redflag-col b {
  color: #F87171;
}
.redflag-col ul {
  margin: 0;
  padding-left: 16px;
  padding-right: 16px;
  font-size: 12px;
  line-height: 1.45;
  color: #7F1D1D;
}
:root[data-theme="dark"] .redflag-col ul {
  color: #FCA5A5;
}
.redflag-col li {
  margin-bottom: 4px;
}

/* QR Code Modal Content */
.modal-qr-card {
  max-width: 380px !important;
  text-align: center;
}
.qr-svg-box {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.06);
  margin: 0 auto;
  width: max-content;
}
.qr-svg-box svg {
  display: block;
  border-radius: 6px;
}

[data-theme="dark"] .qr-svg-box,
:root[data-theme="dark"] .qr-svg-box {
  background: #FFFFFF !important;
  color: #000000 !important;
  box-shadow: 0 4px 14px rgba(0,0,0,0.3) !important;
}
[data-theme="dark"] .qr-svg-box svg rect,
:root[data-theme="dark"] .qr-svg-box svg rect,
[data-theme="dark"] .qr-svg-box svg path,
:root[data-theme="dark"] .qr-svg-box svg path {
  fill: #000000 !important;
}

/* Guardrails Banner (Cross-Engine - Logical RTL-safe) */
.clinical-guardrail-banner {
  background: var(--danger-bg, #FEF2F2);
  border: 1px solid var(--danger-border, #FCA5A5);
  border-inline-start: 4px solid var(--danger-accent, #DC2626);
  border-radius: 8px;
  padding: 10px 14px;
  margin: 10px 14px;
  font-size: 13px;
}
:root[data-theme="dark"] .clinical-guardrail-banner {
  background: rgba(220, 38, 38, 0.14);
  border-color: rgba(239, 68, 68, 0.35);
  border-inline-start-color: #EF4444;
}
.guardrail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
  color: #991B1B;
}
:root[data-theme="dark"] .guardrail-item {
  color: #FCA5A5;
}
.guardrail-item:last-child {
  margin-bottom: 0;
}
.guardrail-item.warn {
  color: #B45309;
}
:root[data-theme="dark"] .guardrail-item.warn {
  color: #FCD34D;
}
.guardrail-item.info {
  color: #1D4ED8;
}
:root[data-theme="dark"] .guardrail-item.info {
  color: #93C5FD;
}

/* ==========================================================================
   v1.2.11 VERIFIED UX PATCH: Vitals Drawer, SOAP Cart, Handoff & 48px Touch
   ========================================================================== */
:root {
  --osrawy-touch-min: 48px;
  --vitals-drawer-top: 44px;
}

/* 1. 48px Ergonomic Touch Targets */
.osrawy-seg-btn,
.osrawy-ux-btn,
#tab-leaflets button:not(.icon-tool-btn):not(.icon-btn),
.osrawy-vitals-field input,
.osrawy-vitals-field select {
  min-height: var(--osrawy-touch-min);
}

.osrawy-ux-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--line, #cbd5e1);
  background: var(--surface2, #f1f5f9);
  color: var(--ink, #0f172a);
  font-weight: 700;
  font-size: 0.86rem;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.osrawy-ux-btn.is-primary {
  background: var(--app-primary, var(--teal, #0d9488));
  border-color: var(--app-primary, var(--teal, #0d9488));
  color: #ffffff;
}

/* 2. Sticky Tap-to-Edit Vitals Quick Drawer */
#sticky-vitals-summary.sticky-vitals-bar {
  cursor: pointer;
}

.osrawy-vitals-quick-drawer {
  display: none;
  position: sticky;
  top: var(--vitals-drawer-top, 44px);
  z-index: 998;
  background: var(--surface, #ffffff);
  color: var(--ink, #0f172a);
  border-bottom: 2px solid var(--app-primary, var(--teal, #0d9488));
  padding: 12px 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
}

.osrawy-vitals-quick-drawer.is-open {
  display: block;
}

.osrawy-vitals-quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
  gap: 10px;
  align-items: end;
  max-width: 960px;
  margin: 0 auto;
}

.osrawy-vitals-field label {
  display: block;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--muted, #64748b);
  margin-bottom: 4px;
}

.osrawy-vitals-field input,
.osrawy-vitals-field select {
  width: 100%;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--line, #cbd5e1);
  background: var(--surface2, #f8fafc);
  color: var(--ink, #0f172a);
  font-weight: 700;
  font-size: 0.92rem;
}

/* 3. Floating SOAP Cart Pill (Opposite #quick-jump-rx-btn at inset-inline-start) */
.osrawy-soap-fab {
  position: fixed;
  bottom: calc(var(--nav-h, 64px) + 14px + env(safe-area-inset-bottom, 0px));
  inset-inline-start: 16px;
  z-index: 950;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 9999px;
  border: 1px solid var(--line, rgba(255, 255, 255, 0.15));
  background: var(--surface, #ffffff);
  color: var(--ink, #0f172a);
  font-weight: 700;
  font-size: 0.84rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.25);
  cursor: pointer;
}

.osrawy-soap-badge {
  background: var(--app-primary, var(--teal, #0d9488));
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
}

/* SOAP Backdrop & Drawer (z-index: 1050 above .osrawy-bottom-nav at 1000) */
.osrawy-soap-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 1040;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}

.osrawy-soap-backdrop.is-open {
  display: block;
}

.osrawy-soap-drawer {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 1050;
  max-width: 760px;
  margin: 0 auto;
  background: var(--surface, #ffffff);
  color: var(--ink, #0f172a);
  border-top: 2px solid var(--app-primary, var(--teal, #0d9488));
  border-radius: 18px 18px 0 0;
  padding: 12px 16px 16px;
  padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 16px);
  box-shadow: 0 -12px 32px rgba(15, 23, 42, 0.28);
  visibility: hidden;
  pointer-events: none;
  transform: translateY(105%);
  transition: transform 0.22s ease-out, visibility 0s linear 0.22s;
}

.osrawy-soap-drawer.is-open {
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  transition: transform 0.22s ease-out, visibility 0s linear 0s;
}

.osrawy-soap-handle {
  width: 38px;
  height: 4px;
  border-radius: 999px;
  background: var(--line, #cbd5e1);
  margin: 2px auto 14px;
  opacity: 0.85;
  transition: opacity 0.2s ease;
}

.osrawy-soap-drawer:hover .osrawy-soap-handle {
  opacity: 1;
}

.osrawy-soap-textarea {
  width: 100%;
  min-height: 175px;
  margin: 10px 0;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--line, #cbd5e1);
  background: var(--surface2, #f8fafc);
  color: var(--ink, #0f172a);
  font-family: var(--f-mono, 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 0.86rem;
  line-height: 1.55;
  direction: ltr;
  text-align: left;
  resize: vertical;
  box-sizing: border-box;
}

.osrawy-soap-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

#osrawy-soap-copy {
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(13, 148, 136, 0.25);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

#osrawy-soap-copy:active {
  transform: scale(0.97);
}

/* 4. Full-Screen Patient Handoff Mode (#tab-leaflets) */
body.osrawy-patient-mode #sticky-vitals-summary,
body.osrawy-patient-mode .sticky-vitals-bar,
body.osrawy-patient-mode .osrawy-vitals-quick-drawer,
body.osrawy-patient-mode .top-nav-bar,
body.osrawy-patient-mode #clinical-guardrail-banner,
body.osrawy-patient-mode #patient-summary-bar,
body.osrawy-patient-mode .patient-cockpit,
body.osrawy-patient-mode #quick-jump-rx-btn,
body.osrawy-patient-mode .quick-jump-pill,
body.osrawy-patient-mode .osrawy-bottom-nav,
body.osrawy-patient-mode .osrawy-soap-fab,
body.osrawy-patient-mode .osrawy-docked-command-bar,
body.osrawy-patient-mode .osrawy-soap-drawer,
body.osrawy-patient-mode .osrawy-soap-backdrop,
body.osrawy-patient-mode .clinician-only-controls {
  display: none !important;
}

body.osrawy-patient-mode {
  padding-top: env(safe-area-inset-top, 12px) !important;
  padding-bottom: env(safe-area-inset-bottom, 16px) !important;
}

.osrawy-handoff-exit-bar {
  display: none;
  margin: 10px 14px 4px;
  justify-content: flex-end;
}

body.osrawy-patient-mode .osrawy-handoff-exit-bar {
  display: flex;
}

.clinician-only-controls {
  display: flex;
  justify-content: flex-end;
  margin: 10px 14px 4px;
}

.osrawy-vitals-field select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 420px) {
  .osrawy-soap-fab {
    inset-inline-start: 10px;
    min-height: 40px;
    padding: 0 10px;
    font-size: 0.76rem;
    gap: 5px;
    max-width: calc(50vw - 14px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .quick-jump-pill {
    inset-inline-end: 10px !important;
    padding: 7px 10px !important;
    max-width: calc(50vw - 14px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .quick-jump-pill .jump-text {
    font-size: 11.5px !important;
  }
}

/* Docked Command Bar (<= 40px) */
.osrawy-docked-command-bar {
  position: fixed;
  bottom: calc(var(--nav-h, 60px) + 8px + env(safe-area-inset-bottom, 0px));
  inset-inline: 0;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 14px;
  z-index: 950;
  pointer-events: none;
  box-sizing: border-box;
}

.osrawy-docked-command-bar .osrawy-soap-fab,
.osrawy-docked-command-bar .quick-jump-pill {
  position: relative !important;
  bottom: auto !important;
  inset-inline-start: auto !important;
  inset-inline-end: auto !important;
  pointer-events: auto !important;
  margin: 0 !important;
}

@media (max-width: 480px) {
  .osrawy-docked-command-bar {
    padding: 0 10px;
    height: 38px;
    bottom: calc(var(--nav-h, 60px) + 6px + env(safe-area-inset-bottom, 0px));
  }
}

/* ==========================================================================
   Keyboard Awareness & Pregnancy Protocol Dark Mode
   ========================================================================== */
body.osrawy-keyboard-open .osrawy-bottom-nav,
body.osrawy-keyboard-open .bottom-nav-bar,
body.osrawy-keyboard-open .quick-jump-pill,
body.osrawy-keyboard-open .osrawy-soap-fab,
body.osrawy-keyboard-open .osrawy-docked-command-bar {
  display: none !important;
}

:root[data-theme="dark"] .pregnancy-protocol-card,
[data-theme="dark"] .pregnancy-protocol-card {
  background: rgba(219, 39, 119, 0.14) !important;
  border-color: rgba(244, 114, 182, 0.35) !important;
  border-inline-start-color: #F472B6 !important;
  color: #FBCFE8 !important;
}

:root[data-theme="dark"] .osrawy-soap-drawer,
[data-theme="dark"] .osrawy-soap-drawer {
  background: var(--surface, #122220);
  border-top-color: var(--app-primary, var(--teal, #0d9488));
  color: var(--ink, #E2F0ED);
  box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.5);
}

:root[data-theme="dark"] .osrawy-soap-handle,
[data-theme="dark"] .osrawy-soap-handle {
  background: var(--line, #24403C);
}

:root[data-theme="dark"] .osrawy-soap-textarea,
[data-theme="dark"] .osrawy-soap-textarea {
  background: var(--surface2, #182D2B);
  border-color: var(--line, #24403C);
  color: var(--ink, #E2F0ED);
}

```

---

<a id="www-css-phone-first-css"></a>
## 16. `www/css/phone-first.css`

**Description:** Phone-first mobile styling (< 768px), 2-zone cockpit micro-stack, modal flex fixes, and segmented switcher styles.  
**Lines:** 498 | **Size:** 14.6 KB

```css
/* ==========================================================================
   OSRAWY CLINICAL NAVIGATOR - PHONE-FIRST NATIVE ANDROID OVERHAUL
   Scoped strictly to mobile viewports (< 768px) for 360px-412px phones.
   Fixes: Clipped identity, Colliding Calc pills, Zero-gap sticky vitals,
   Sticky modal headers, Market switcher visibility, and Segmented switchers.
   ========================================================================== */

.phone-pane-switcher {
  display: none !important;
}

@media (min-width: 768px) {
  .phone-alt-accordion {
    display: contents !important;
    border: none !important;
    background: transparent !important;
  }
  .phone-alt-accordion > .phone-alt-summary {
    display: none !important;
  }
  .phone-alt-accordion > .phone-alt-content,
  .phone-alt-accordion:not([open]) > .phone-alt-content {
    display: contents !important;
  }
}

@media (max-width: 767px) {

  /* ------------------------------------------------------------------------
     1. Top App Bar & Brand Title
     ------------------------------------------------------------------------ */
  .top-nav-bar {
    height: 44px !important;
    min-height: 44px !important;
    padding: 0 8px !important;
  }

  .app-title-group h1 {
    font-size: 14.5px !important;
    letter-spacing: -0.01em !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  /* Shorten language toggle pill */
  .lang-pill-btn {
    padding: 3px 8px !important;
    font-size: 11px !important;
  }

  /* ------------------------------------------------------------------------
     2. Bug 1 Fix: Unified 2-Zone Patient Cockpit (No "Nam" Clipping)
     ------------------------------------------------------------------------ */
  .patient-cockpit {
    display: flex !important;
    flex-direction: column !important;
    padding: 4px 8px !important;
    min-height: 44px !important;
    gap: 3px !important;
    background: var(--surface2) !important;
    border-bottom: 1px solid var(--line) !important;
  }

  /* Row 1: Patient Identity Strip (Smooth horizontal scroll on long names) */
  .patient-cockpit #patient-summary-bar {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
    border: none !important;
    font-size: 11.5px !important;
    white-space: nowrap !important;
    overflow-x: auto !important;
    scrollbar-width: none !important;
    -webkit-overflow-scrolling: touch !important;
    width: 100% !important;
  }

  .patient-cockpit #patient-summary-bar::-webkit-scrollbar {
    display: none !important;
  }

  .patient-cockpit #patient-summary-bar .pt-bar-item {
    display: inline-flex !important;
    align-items: center !important;
    gap: 3px !important;
    flex-shrink: 0 !important;
    color: var(--ink) !important;
  }

  /* Hide duplicate eGFR, UACR, and BP chips from Row 1 since Row 2 has them */
  .patient-cockpit #patient-summary-bar .pt-bar-item:nth-child(n+4) {
    display: none !important;
  }

  /* Row 2: Sticky Vitals Summary Chips */
  .patient-cockpit #sticky-vitals-summary {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
    border: none !important;
  }

  .patient-cockpit .vitals-group {
    display: flex !important;
    align-items: center !important;
    gap: 5px !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    scrollbar-width: none !important;
    -webkit-overflow-scrolling: touch !important;
  }

  .patient-cockpit .vitals-group::-webkit-scrollbar {
    display: none !important;
  }

  .patient-cockpit .vital-chip {
    padding: 2px 7px !important;
    font-size: 11px !important;
    gap: 3px !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }

  .patient-cockpit .vitals-toggle-indicator {
    font-size: 10px !important;
    flex-shrink: 0 !important;
    padding-inline-start: 4px !important;
  }

  /* ------------------------------------------------------------------------
     3. Bug 3 Fix: Zero-Gap Flush Sticky Subtabs (.tabbar)
     ------------------------------------------------------------------------ */
  .tabbar {
    position: sticky !important;
    top: var(--vitals-drawer-top, 44px) !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    z-index: 980 !important;
    background: var(--surface) !important;
    border-bottom: 1px solid var(--line) !important;
  }

  /* ------------------------------------------------------------------------
     4. Bug 2 Fix: Calculator Button & Input Bottom Alignment
     ------------------------------------------------------------------------ */
  .calc-chip-btn {
    padding: 2px 6px !important;
    font-size: 11px !important;
    gap: 2px !important;
    border-radius: 6px !important;
    white-space: nowrap !important;
  }

  .fields,
  #tab-htn .row {
    align-items: flex-end !important;
  }

  /* ------------------------------------------------------------------------
     5. Bug 6 Fix: Segmented Patient/Plan View Switcher (No Floating Pills)
     ------------------------------------------------------------------------ */
  .phone-pane-switcher {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: var(--surface2, #f1f5f9) !important;
    border: 1px solid var(--line, #e2e8f0) !important;
    border-radius: 999px !important;
    padding: 3px !important;
    margin: 8px auto 12px auto !important;
    max-width: 320px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .phone-pane-btn {
    flex: 1 1 50% !important;
    padding: 6px 12px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    border: none !important;
    border-radius: 999px !important;
    background: transparent !important;
    color: var(--muted, #64748b) !important;
    cursor: pointer !important;
    transition: all 0.18s ease !important;
    text-align: center !important;
    white-space: nowrap !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 4px !important;
  }

  .phone-pane-btn.active {
    background: var(--surface, #ffffff) !important;
    color: var(--teal, #0d9488) !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1) !important;
  }

  /* Hide floating quick-jump button on phones when segmented switcher is active */
  #quick-jump-rx-btn {
    display: none !important;
  }

  /* Pane visibility switching for Diabetes */
  #tab-diabetes[data-phone-pane="plan"] #pform {
    display: none !important;
  }
  #tab-diabetes[data-phone-pane="form"] #result {
    display: none !important;
  }

  /* Pane visibility switching for HTN */
  #tab-htn[data-phone-pane="plan"] #f,
  #tab-htn[data-phone-pane="plan"] .tools {
    display: none !important;
  }
  #tab-htn[data-phone-pane="form"] .sheet {
    display: none !important;
  }

  /* ------------------------------------------------------------------------
     6. Bug 4 Fix: Settings Modal Header Sticky & Flex-Column
     ------------------------------------------------------------------------ */
  .modal-card {
    display: flex !important;
    flex-direction: column !important;
    max-height: 85vh !important;
    overflow: hidden !important;
  }

  .modal-header {
    flex: 0 0 auto !important;
    position: sticky !important;
    top: 0 !important;
    background: var(--surface) !important;
    border-bottom: 1px solid var(--line) !important;
    z-index: 10 !important;
    padding: 12px 16px !important;
  }

  .modal-body {
    flex: 1 1 auto !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    padding: 14px 16px !important;
  }

  .modal-footer {
    flex: 0 0 auto !important;
    padding: 10px 16px !important;
    background: var(--surface2) !important;
    border-top: 1px solid var(--line) !important;
  }

  /* ------------------------------------------------------------------------
     7. Bug 5 Fix: Top More Menu Market Switcher Visibility
     ------------------------------------------------------------------------ */
  .top-more-menu .market-pill-btn {
    background: transparent !important;
    color: var(--ink) !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 9px 12px !important;
    font-weight: 500 !important;
    text-align: start !important;
    width: 100% !important;
    display: flex !important;
    align-items: center !important;
  }

  .top-more-menu .market-pill-btn:hover {
    background: var(--surface2) !important;
  }

  /* ------------------------------------------------------------------------
     8. Bug 7 Fix: Lipids Step Headers Flex-Wrap
     ------------------------------------------------------------------------ */
  .lipid-step-header {
    flex-wrap: wrap !important;
    gap: 6px !important;
    align-items: flex-start !important;
  }

  .lipid-step-badge {
    margin-top: 2px !important;
    font-size: 11px !important;
  }

  /* ------------------------------------------------------------------------
     9. Bug 8 Fix: Sticky First Table Column on Mobile
     ------------------------------------------------------------------------ */
  #reftbl th:first-child,
  #reftbl td:first-child,
  #ins .tbl table th:first-child,
  #ins .tbl table td:first-child,
  #tab-htn .tbl table th:first-child,
  #tab-htn .tbl table td:first-child {
    position: sticky !important;
    inset-inline-start: 0 !important;
    background: var(--surface) !important;
    z-index: 2 !important;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.08) !important;
  }

  #reftbl th:first-child,
  #ins .tbl table th:first-child,
  #tab-htn .tbl table th:first-child {
    background: var(--surface2) !important;
  }

  [dir="rtl"] #reftbl th:first-child,
  [dir="rtl"] #reftbl td:first-child,
  [dir="rtl"] #ins .tbl table th:first-child,
  [dir="rtl"] #ins .tbl table td:first-child,
  [dir="rtl"] #tab-htn .tbl table th:first-child,
  [dir="rtl"] #tab-htn .tbl table td:first-child {
    box-shadow: -2px 0 4px rgba(0, 0, 0, 0.08) !important;
  }

  .kdigo-table th,
  .kdigo-table td {
    padding: 4px 5px !important;
    font-size: 11px !important;
  }

  /* ------------------------------------------------------------------------
     10. Bug 9 Fixes: Component Polish
     ------------------------------------------------------------------------ */
  /* Steroid Equivalence Select */
  .micro-tools-grid select {
    padding: 5px 6px !important;
    font-size: 11.5px !important;
  }

  /* Patient Leaflets Navigation & Actions */
  .patient-leaflet-container .leaflet-nav {
    display: flex !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    scrollbar-width: none !important;
    -webkit-overflow-scrolling: touch !important;
    padding-bottom: 4px !important;
    gap: 6px !important;
  }

  .patient-leaflet-container .leaflet-nav::-webkit-scrollbar {
    display: none !important;
  }

  .leaflet-actions {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
    align-items: center !important;
    justify-content: space-between !important;
  }

  /* ------------------------------------------------------------------------
     11. Priority 3 Alternative Drugs Collapsible Accordion
     ------------------------------------------------------------------------ */
  .phone-alt-accordion {
    border: 1px dashed var(--line, #cbd5e1);
    border-radius: 12px;
    margin-top: 10px;
    background: var(--surface2, #f8fafc);
    overflow: hidden;
  }

  .phone-alt-summary {
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 700;
    color: var(--muted, #64748b);
    cursor: pointer;
    user-select: none;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .phone-alt-summary::-webkit-details-marker {
    display: none;
  }

  .phone-alt-summary::after {
    content: "▼";
    font-size: 10px;
    transition: transform 0.2s ease;
  }

  .phone-alt-accordion[open] .phone-alt-summary::after {
    transform: rotate(180deg);
  }

  .phone-alt-content {
    padding: 8px 10px 12px 10px;
  }

  /* ------------------------------------------------------------------------
     11. Bug 9 Fix: Leaflets Mobile Toolbar (2 Neat Rows)
     ------------------------------------------------------------------------ */
  .leaflet-toolbar {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
    padding: 8px !important;
  }

  .leaflet-tab-group {
    display: flex !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    scrollbar-width: none !important;
    -webkit-overflow-scrolling: touch !important;
    gap: 6px !important;
    width: 100% !important;
    padding-bottom: 2px !important;
  }

  .leaflet-tab-group::-webkit-scrollbar {
    display: none !important;
  }

  .leaflet-tab-btn {
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    padding: 5px 10px !important;
    font-size: 11.5px !important;
  }

  .leaflet-actions-group {
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 4px !important;
    width: 100% !important;
  }

  .leaflet-actions-group .zoom-controls {
    display: flex !important;
    gap: 4px !important;
  }

  .leaflet-actions-group .icon-tool-btn {
    width: 30px !important;
    height: 30px !important;
    font-size: 11.5px !important;
    flex-shrink: 0 !important;
  }

  .leaflet-actions-group .lang-tool-btn,
  .leaflet-actions-group .pill-tool-btn {
    padding: 4px 8px !important;
    font-size: 11px !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }

  /* Calc Button Pill Compact */
  .btn-calc-pill {
    padding: 2px 6px !important;
    font-size: 10.5px !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }

} /* End @media (max-width: 767px) */

/* Dark Mode Overrides for Phone Styles */
:root[data-theme="dark"] .phone-pane-switcher {
  background: var(--surface2, #182D2B) !important;
  border-color: var(--line, #24403C) !important;
}

:root[data-theme="dark"] .phone-pane-btn.active {
  background: var(--surface, #122220) !important;
  color: var(--teal, #3CC7B8) !important;
}

:root[data-theme="dark"] .phone-alt-accordion {
  border-color: var(--line, #24403C);
  background: var(--surface2, #182D2B);
}

```

---
