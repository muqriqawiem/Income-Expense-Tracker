import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trackyourmoney.financetracker',
  appName: 'Finance Tracker',
  webDir: 'public',
  server: {
    url: 'https://trackyourmoney-32.vercel.app',
    cleartext: false,
  },
};

export default config;
