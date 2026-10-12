/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Keep the CRA-era REACT_APP_* variable names working.
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: { port: 3001 },
  build: {
    // nginx and deploy.sh serve web-app/expiry-alert/build
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
});
