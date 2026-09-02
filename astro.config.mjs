import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://itsdangerous.github.io',
  base: '/',
  integrations: [sitemap()],
});
