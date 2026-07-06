/**
 * useCapacitorAuth
 *
 * Handles Google OAuth on Android via a Custom Chrome Tab (Capacitor Browser
 * plugin). Google blocks OAuth in embedded WebViews since 2021, so on native
 * platforms we open the auth URL in a Chrome Custom Tab, which is allowed.
 *
 * Why localStorage instead of cookies?
 * Chrome Custom Tabs and Android WebViews use SEPARATE cookie jars. A cookie
 * set during the OAuth flow in the Chrome Custom Tab is NOT available in the
 * Capacitor WebView. Instead, the server embeds the JWT in the deep-link URL:
 *   com.utkarsh.lifeplanner://auth#token=<JWT>
 * The app extracts it, stores it in localStorage, and sends it as a Bearer
 * header on every API request (see api.ts: NATIVE_TOKEN_KEY).
 *
 * Flow:
 *  1. App opens Chrome Custom Tab → https://server/auth/google?mobile=1
 *  2. User signs in with Google
 *  3. Server redirects → com.utkarsh.lifeplanner://auth#token=<JWT>
 *  4. Android routes the custom scheme to the app (AndroidManifest intent-filter)
 *  5. Capacitor fires appUrlOpen → we extract token → store → close browser → init()
 *
 * On web (desktop / PWA): normal navigation, cookie-based auth — no change.
 */

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { NATIVE_TOKEN_KEY } from '../lib/api';

// Detect Capacitor native platform
const isNative = (): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

// Auth URL — absolute with ?mobile=1 flag for native, relative for web (Vite proxy)
const AUTH_URL = isNative()
  ? 'https://utkarsh-planner.duckdns.org/auth/google?mobile=1'
  : '/auth/google';

export function useCapacitorAuth() {
  const { init } = useAuthStore();

  // Listen for the deep-link redirect back from OAuth (native only)
  useEffect(() => {
    if (!isNative()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { App }     = await import('@capacitor/app');
      const { Browser } = await import('@capacitor/browser');

      const handle = await App.addListener('appUrlOpen', async (event) => {
        console.log('[auth] Deep link received:', event.url);

        // Extract JWT from URL fragment: com.utkarsh.lifeplanner://auth#token=<JWT>
        try {
          const hash = event.url.split('#')[1] ?? '';
          const params = new URLSearchParams(hash);
          const token = params.get('token');

          if (token) {
            // Store token in localStorage — apiFetch will pick it up automatically
            localStorage.setItem(NATIVE_TOKEN_KEY, decodeURIComponent(token));
            console.log('[auth] Native token stored');
          } else {
            console.warn('[auth] Deep link had no token:', event.url);
          }
        } catch (e) {
          console.error('[auth] Failed to parse deep link token:', e);
        }

        await Browser.close();
        // Refresh auth state — apiFetch now has the Bearer token
        await init();
      });

      cleanup = () => { void handle.remove(); };
    })();

    return () => cleanup?.();
  }, [init]);

  const startGoogleLogin = useCallback(async () => {
    if (isNative()) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({
        url: AUTH_URL,
        windowName: '_blank',
        presentationStyle: 'popover',
      });
    } else {
      window.location.href = AUTH_URL;
    }
  }, []);

  return { startGoogleLogin, isNative: isNative() };
}
