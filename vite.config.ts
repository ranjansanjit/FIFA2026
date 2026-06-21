import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Prevent Vite from reloading when the local `db.json` file is written by the dev server.
      // This avoids full page reloads when the express mock API persists state.
      watch: {
        ...(process.env.DISABLE_HMR === 'true' ? { ignored: ['**/*'] } : {}),
        ignored: ['**/db.json', '**/winners.json']
      },
    },
  };
});
