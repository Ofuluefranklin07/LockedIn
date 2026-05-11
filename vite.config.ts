import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const geminiApiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
  const geminiModel = env.GEMINI_MODEL || env.VITE_GEMINI_MODEL;
  const appUrl = env.APP_URL || env.VITE_APP_URL;

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'process.env.GEMINI_MODEL': JSON.stringify(geminiModel),
      'process.env.VITE_GEMINI_MODEL': JSON.stringify(geminiModel),
      'process.env.APP_URL': JSON.stringify(appUrl),
      'process.env.VITE_APP_URL': JSON.stringify(appUrl),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
