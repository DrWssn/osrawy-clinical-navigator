// ==============================================================
// In-App GitHub Releases Auto-Update Checker
// ==============================================================

const AppUpdater = (function() {
  const CONFIG = {
    currentVersion: '1.2.6',
    repoOwner: 'DrWssn',
    repoName: 'osrawy-clinical-navigator',
    apiUrl: 'https://api.github.com/repos/DrWssn/osrawy-clinical-navigator/releases/latest',
    tagsUrl: 'https://api.github.com/repos/DrWssn/osrawy-clinical-navigator/tags',
    releasesUrl: 'https://github.com/DrWssn/osrawy-clinical-navigator/releases'
  };

  function compareSemver(v1, v2) {
    const clean1 = (v1 || '').replace(/^v/i, '').trim();
    const clean2 = (v2 || '').replace(/^v/i, '').trim();
    const parts1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
    const parts2 = clean2.split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  async function checkForUpdates(isManual = false) {
    const statusEl = document.getElementById('update-status-text');
    const checkBtn = document.getElementById('btn-check-updates');
    
    if (statusEl) {
      statusEl.textContent = (window.I18n && window.I18n.getLang() === 'ar') 
        ? '⏳ جاري فحص التحديثات...' 
        : '⏳ Checking for updates...';
      statusEl.className = 'update-status checking';
    }
    if (checkBtn) checkBtn.disabled = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      
      let latestTag = '';
      let releaseNotes = '';
      let downloadUrl = CONFIG.releasesUrl;
      let publishedAt = Date.now();

      // 1. Try releases/latest
      let res = await fetch(CONFIG.apiUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });

      if (res.ok) {
        const release = await res.json();
        latestTag = release.tag_name || release.name || '';
        releaseNotes = release.body || '';
        publishedAt = release.published_at || Date.now();
        if (release.assets && release.assets.length > 0) {
          const apk = release.assets.find(a => a.name.endsWith('.apk') && a.name.includes(latestTag))
                   || release.assets.find(a => a.name.endsWith('.apk'));
          if (apk && apk.browser_download_url) {
            downloadUrl = apk.browser_download_url;
          }
        } else if (release.html_url) {
          downloadUrl = release.html_url;
        }
      } else if (res.status === 404) {
        // Fallback to tags if releases haven't been published yet
        const tagsRes = await fetch(CONFIG.tagsUrl, {
          signal: controller.signal,
          headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (tagsRes.ok) {
          const tags = await tagsRes.json();
          if (tags && tags.length > 0) {
            latestTag = tags[0].name;
            downloadUrl = `${CONFIG.releasesUrl}/tag/${latestTag}`;
            releaseNotes = `New release ${latestTag} is ready on GitHub.`;
          }
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
      clearTimeout(timeoutId);

      if (!latestTag) {
        if (statusEl) {
          statusEl.textContent = (window.I18n && window.I18n.getLang() === 'ar')
            ? `✅ أنت تستخدم أحدث إصدار (v${CONFIG.currentVersion})`
            : `✅ You have the latest version (v${CONFIG.currentVersion})`;
          statusEl.className = 'update-status uptodate';
        }
        return;
      }

      const isNewer = compareSemver(latestTag, CONFIG.currentVersion) > 0;

      if (isNewer) {
        if (statusEl) {
          statusEl.textContent = (window.I18n && window.I18n.getLang() === 'ar')
            ? `🚀 يتوفر تحديث جديد: ${latestTag}`
            : `🚀 New update available: ${latestTag}`;
          statusEl.className = 'update-status available';
        }
        showUpdateModal({
          tag_name: latestTag,
          body: releaseNotes,
          published_at: publishedAt,
          downloadUrl: downloadUrl
        });
      } else {
        if (statusEl) {
          statusEl.textContent = (window.I18n && window.I18n.getLang() === 'ar')
            ? `✅ أنت تستخدم أحدث إصدار (v${CONFIG.currentVersion})`
            : `✅ You have the latest version (v${CONFIG.currentVersion})`;
          statusEl.className = 'update-status uptodate';
        }
        if (isManual && window.RxShare && window.RxShare.showToast) {
          window.RxShare.showToast(
            (window.I18n && window.I18n.getLang() === 'ar')
              ? `أنت تستخدم أحدث إصدار (v${CONFIG.currentVersion}) ✅`
              : `App is up to date (v${CONFIG.currentVersion}) ✅`
          );
        }
      }
    } catch (err) {
      console.warn('Update check failed:', err.message);
      if (statusEl) {
        statusEl.textContent = (window.I18n && window.I18n.getLang() === 'ar')
          ? 'تعذر التحقق من التحديثات (تأكد من الاتصال بالإنترنت)'
          : 'Could not check for updates (Check internet)';
        statusEl.className = 'update-status error';
      }
      if (isManual && window.RxShare && window.RxShare.showToast) {
        window.RxShare.showToast(
          (window.I18n && window.I18n.getLang() === 'ar')
            ? 'تعذر التحقق من التحديثات'
            : 'Check internet connection for updates'
        );
      }
    } finally {
      if (checkBtn) checkBtn.disabled = false;
    }
  }

  function showUpdateModal(release) {
    let modal = document.getElementById('update-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'update-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const tag = release.tag_name || 'New Version';
    const releaseNotes = release.body || 'New clinical updates and improvements.';
    let apkUrl = release.downloadUrl || CONFIG.releasesUrl;
    if (release.assets && release.assets.length > 0) {
      const apkAsset = release.assets.find(a => a.name.endsWith('.apk') && a.name.includes(tag))
                    || release.assets.find(a => a.name.endsWith('.apk'));
      if (apkAsset && apkAsset.browser_download_url) {
        apkUrl = apkAsset.browser_download_url;
      }
    }

    const isAr = window.I18n && window.I18n.getLang() === 'ar';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 style="margin:0">🚀 ${isAr ? 'يتوفر إصدار جديد!' : 'New Update Available!'}</h3>
          <button class="icon-btn" onclick="document.getElementById('update-modal').classList.remove('open')" style="color:var(--ink)">✕</button>
        </div>
        <div class="modal-body">
          <div style="background:var(--surface2);padding:12px;border-radius:10px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:700;font-size:16px;color:var(--teal);">${tag}</span>
              <span style="font-size:12px;color:var(--muted);">${new Date(release.published_at || Date.now()).toLocaleDateString()}</span>
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">
              ${isAr ? 'الإصدار الحالي لديك:' : 'Your current version:'} <b>v${CONFIG.currentVersion}</b>
            </div>
          </div>
          <label style="font-weight:600;font-size:13px;display:block;margin-bottom:6px;">
            ${isAr ? '📋 ما الجديد في هذا التحديث:' : '📋 What\'s New in This Update:'}
          </label>
          <div class="update-notes-box" style="background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:12px;font-size:13px;max-height:160px;overflow-y:auto;white-space:pre-wrap;">${releaseNotes}</div>
        </div>
        <div class="modal-footer" style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn" style="background:var(--surface2);color:var(--ink);" onclick="document.getElementById('update-modal').classList.remove('open')">
            ${isAr ? 'لاحقاً' : 'Later'}
          </button>
          <a href="${apkUrl}" target="_blank" class="btn btn-primary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
            ⬇️ ${isAr ? 'تحميل وتثبيت التحديث (APK)' : 'Download & Install (APK)'}
          </a>
        </div>
      </div>
    `;
    modal.classList.add('open');
  }

  function init() {
    const versionLabel = document.getElementById('current-app-version');
    if (versionLabel) {
      versionLabel.textContent = 'v' + CONFIG.currentVersion;
    }

    const checkBtn = document.getElementById('btn-check-updates');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => checkForUpdates(true));
    }

    // Silent background check after 3 seconds on launch if online
    if (navigator.onLine) {
      setTimeout(() => checkForUpdates(false), 3000);
    }
  }

  return {
    init,
    checkForUpdates,
    getConfig: () => Object.assign({}, CONFIG)
  };
})();

if (typeof window !== 'undefined') {
  window.AppUpdater = AppUpdater;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppUpdater;
}
