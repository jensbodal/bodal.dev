import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.breakevenllc.digitalbloom',
  appName: 'Digital Bloom',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
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
