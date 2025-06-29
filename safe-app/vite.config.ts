// MIT License
// © Zak Cole — https://numbergroup.xyz (@zscole)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { sourcemap: false },
  server: {
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "frame-ancestors 'self' https://app.safe.global https://*.safe.global"
    }
  },
  preview: {
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "frame-ancestors 'self' https://app.safe.global https://*.safe.global"
    }
  }
});
