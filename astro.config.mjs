import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // 1. Replace with your GitHub username
  site: 'https://Holo-Host.github.io', 
  
  // 2. Replace with your exact repository name (must include the leading slash)
  base: '/marketplace/', 

  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});