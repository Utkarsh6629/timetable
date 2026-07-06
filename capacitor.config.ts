import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.utkarsh.lifeplanner',
  appName: 'Life Planner',
  webDir: 'dist',

  // ── Server ──────────────────────────────────────────────────────────────────
  // When running inside the Android APK the WebView needs to know the real
  // backend URL (it cannot use the Vite dev-proxy).
  // Change this to 'http://localhost:3001' if you run the server on the same LAN.
  server: {
    // url: 'https://utkarsh-planner.duckdns.org',  // ← uncomment for live server
    // cleartext: false,                             // ← true only for plain HTTP
  },

  android: {
    // Useful for debugging on device
    allowMixedContent: false,
    backgroundColor: '#0f0f13', // matches --bg-primary-surface
  },

  plugins: {
    // Capacitor Browser plugin (used for OAuth Custom Chrome Tab)
    Browser: {
      androidCustomTabColor: '#7c3aed',  // violet brand colour
    },
  },
};

export default config;
