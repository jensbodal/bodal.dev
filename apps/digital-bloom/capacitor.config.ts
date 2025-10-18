import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.breakevenllc.digitalbloom',
  appName: 'Digital Bloom',
  webDir: 'dist',
  ios: {
    // Remove contentInset to fix safe-area-inset-top not updating on rotation
    // This was causing the toolbar to stay offset after landscape->portrait rotation
    allowsLinkPreview: false,
    // Enable audio to work in silent mode and background
    webContentsDebuggingEnabled: true
  },
  server: {
    // Allow mixed content for local audio
    allowNavigation: ['*']
  }
};

export default config;
