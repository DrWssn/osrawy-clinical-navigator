/**
 * In-App GitHub Releases Updater Engine
 * Checks GitHub repository releases API for OTA APK updates.
 */

export interface UpdateInfo {
  isAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  publishedAt: string;
}

export const CURRENT_VERSION = '2.2.2';
export const REPO_OWNER = 'DrWssn';
export const REPO_NAME = 'osrawy-clinical-navigator';

export function compareSemver(v1: string, v2: string): number {
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

export async function checkAppUpdate(): Promise<UpdateInfo> {
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
  const releasesPage = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    clearTimeout(timer);

    if (!res.ok) {
      if (res.status === 404) {
        return {
          isAvailable: false,
          currentVersion: CURRENT_VERSION,
          latestVersion: CURRENT_VERSION,
          downloadUrl: releasesPage,
          releaseNotes: '',
          publishedAt: '',
        };
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const latestTag = (data.tag_name || data.name || '').replace(/^v/i, '').trim();
    let downloadUrl = data.html_url || releasesPage;

    if (data.assets && Array.isArray(data.assets)) {
      const apk = data.assets.find((a: { name?: string; browser_download_url?: string }) => 
        typeof a.name === 'string' && a.name.endsWith('.apk')
      );
      if (apk && apk.browser_download_url) {
        downloadUrl = apk.browser_download_url;
      }
    }

    const isNewer = compareSemver(latestTag, CURRENT_VERSION) > 0;

    return {
      isAvailable: isNewer,
      currentVersion: CURRENT_VERSION,
      latestVersion: latestTag || CURRENT_VERSION,
      downloadUrl,
      releaseNotes: data.body || '',
      publishedAt: data.published_at || '',
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    throw err;
  }
}
