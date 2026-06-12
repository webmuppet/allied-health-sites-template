import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import node from '@astrojs/node';

// Active theme — change this path to switch themes.
// Each theme lives in src/themes/{name}/ and provides layouts/, components/, styles/.
// Use `node scripts/create-theme.mjs --name mytheme` to scaffold a new one.
const ACTIVE_THEME = new URL('./src/themes/default', import.meta.url).pathname;

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'middleware' }),
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@theme': ACTIVE_THEME,
        '@lib': new URL('./src/lib', import.meta.url).pathname,
      },
    },
  },
  integrations: [react()],
});
