/**
 * useCapacitorAuth
 *
 * Handles Google OAuth on Android via a Custom Chrome Tab (Capacitor Browser
 * plugin). Google blocks OAuth in embedded WebViews since 2021, so on native
 * platforms we open the auth URL in a Chrome Custom Tab, which is allowed.
 *
 * Flow:
 *  1. App opens Chrome Custom Tab → https://server/auth/google?mobile=1
 *  2. Server encodes "mobile" flag in the state cookie
 *  3. After Google auth, server redirects to com.utkarsh.lifeplanner://
 *  4. Android routes that custom scheme to the app (via AndroidManifest intent-filter)
 *  5. Capacitor fires appUrlOpen → we close the browser tab + refresh auth state
 *
 * On web (desktop / PWA) we fall back to the normal navigation — no change.
 */

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

// Detect if we are running inside a Capacitor-wrapped native app
const isNative = (): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

// Auth URL — absolute for native (calls live server), relative for web (uses Vite proxy)
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

      // When the OS routes com.utkarsh.lifeplanner:// back to our app,
      // close the Chrome Custom Tab and refresh the auth state.
      const handle = await App.addListener('appUrlOpen', async (event) => {
        console.log('[auth] Deep link received:', event.url);
        await Browser.close();
        // Re-check auth — the server set lp_session cookie before redirecting
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
