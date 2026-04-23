import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.puretrans.app',
  appName: 'PureTrans',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
