import { create } from 'zustand';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl: string;
  publishedAt: string;
}

const GITHUB_REPO = 'Utkarsh6629/timetable';
const CHECK_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours
const LAST_CHECK_KEY = 'lp_last_update_check';
const DISMISSED_KEY = 'lp_dismissed_update_version';

export function compareSemver(v1: string, v2: string): number {
  const clean = (s: string) => s.replace(/^v/i, '').trim();
  const parts1 = clean(v1).split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean(v2).split('.').map((p) => parseInt(p, 10) || 0);

  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export async function getCurrentAppVersion(): Promise<string> {
  const bundledVer = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.1';

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    if (isNative) {
      const { App } = await import('@capacitor/app');
      const info = await App.getInfo();
      // If native info.version is defined and at least as high as bundledVer, use it
      if (info.version && compareSemver(info.version, bundledVer) >= 0) {
        return info.version;
      }
    }
  } catch (err) {
    console.debug('[update] Could not get native app info:', err);
  }

  return bundledVer;
}

interface UpdateStore {
  updateInfo: UpdateInfo | null;
  showModal: boolean;
  isChecking: boolean;
  checkError: string | null;
  checkForUpdates: (manual?: boolean) => Promise<void>;
  dismissUpdate: () => void;
  openModal: () => void;
  closeModal: () => void;
  startDownload: () => Promise<void>;
}

export const useUpdateStore = create<UpdateStore>((set, get) => ({
  updateInfo: null,
  showModal: false,
  isChecking: false,
  checkError: null,

  openModal: () => set({ showModal: true }),
  closeModal: () => set({ showModal: false }),

  checkForUpdates: async (manual = false) => {
    // Throttle automatic checks
    if (!manual) {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      if (lastCheck && Date.now() - parseInt(lastCheck, 10) < CHECK_INTERVAL_MS) {
        return;
      }
    }

    set({ isChecking: true, checkError: null });

    try {
      const currentVer = await getCurrentAppVersion();
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          if (manual) {
            set({ checkError: 'No public release found on GitHub yet.' });
            get().openModal();
          }
          return;
        }
        if (response.status === 403) {
          if (manual) {
            set({ checkError: 'GitHub rate limit exceeded. Please try again in a few minutes.' });
            get().openModal();
          }
          return;
        }
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const latestVer = data.tag_name ? data.tag_name.replace(/^v/i, '') : '';
      if (!latestVer) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apkAsset = data.assets?.find((a: any) => a.name?.endsWith('.apk'));
      const downloadUrl = apkAsset?.browser_download_url || data.html_url;

      const isNewer = compareSemver(latestVer, currentVer) > 0;
      localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

      const info: UpdateInfo = {
        available: isNewer,
        currentVersion: currentVer,
        latestVersion: latestVer,
        releaseName: data.name || `Version ${latestVer}`,
        releaseNotes: data.body || '',
        downloadUrl,
        publishedAt: data.published_at || '',
      };

      set({ updateInfo: info });

      // Only auto-prompt APK downloads on native devices. On desktop/web, auto-prompting APK install makes no sense.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

      const dismissedVer = localStorage.getItem(DISMISSED_KEY);
      if (isNewer && (manual || (isNative && dismissedVer !== latestVer))) {
        set({ showModal: true });
      } else if (manual) {
        set({ showModal: true });
      }
    } catch (err) {
      console.warn('[update] Failed to check for updates:', err);
      if (manual) {
        set({ checkError: 'Unable to check for updates. Check internet connection.' });
        get().openModal();
      }
    } finally {
      set({ isChecking: false });
    }
  },

  dismissUpdate: () => {
    const { updateInfo } = get();
    if (updateInfo?.latestVersion) {
      localStorage.setItem(DISMISSED_KEY, updateInfo.latestVersion);
    }
    set({ showModal: false });
  },

  startDownload: async () => {
    const { updateInfo } = get();
    if (!updateInfo?.downloadUrl) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
      if (isNative) {
        // Open in external system browser (_system) so Android handles APK download
        // and displays the direct "Open" button in the download bar
        window.open(updateInfo.downloadUrl, '_system');
      } else {
        window.open(updateInfo.downloadUrl, '_blank');
      }
    } catch {
      window.open(updateInfo.downloadUrl, '_system');
    }
  },
}));
