import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // Update these when your domain is ready
  site: 'https://marketplace.holo.host',
  base: '/',

  // Hybrid = static by default, pages can opt into SSR
  output: 'hybrid',
  adapter: cloudflare(),

  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
